<?php
declare(strict_types=1);
/** Account-scoped snapshots. Only an explicit, confirmed History action can delete them. */
final class LifeTaskHistory {
    public function __construct(private LifeStore $store) {
        $store->db->exec('CREATE TABLE IF NOT EXISTS life_task_history (id VARCHAR(32) PRIMARY KEY, tenant_id INT NOT NULL, event_key VARCHAR(100) NOT NULL, status VARCHAR(20) NOT NULL, recorded_at VARCHAR(30) NOT NULL, snapshot LONGTEXT NOT NULL, UNIQUE (tenant_id,event_key))');
        $store->db->exec('CREATE TABLE IF NOT EXISTS life_history_seed (tenant_kind VARCHAR(60) PRIMARY KEY)');
    }
    private static function statuses(array $record,array $state,string $kind='task'):array {
        if($kind==='goal')return array_values(array_filter([!empty($record['completed'])?'done':null,!empty($record['archived'])?'archived':null]));
        $list=null;foreach($state['lists']??[] as $row)if($row['id']===$record['listId'])$list=$row;
        $out=[];if(($list['isDone']??false)||!empty($record['completedAt']))$out[]='done';
        if(mb_strtolower(trim($list['name']??''))==='blocked'||trim($record['blocker']??'')!=='')$out[]='blocked';
        if($record['archived']??false)$out[]='archived';return $out;
    }
    private function append(array $record,array $state,string $status,string $key,string $action,string $kind='task'):void {
        $list=[];$board=[];foreach($state['lists']??[] as $row)if($row['id']===($record['listId']??''))$list=$row;
        foreach($state['boards']??[$state['board']] as $row)if($row['id']===($list['boardId']??$state['board']['id']))$board=$row;
        $snapshot=['kind'=>$kind,'task'=>$record,'boardName'=>$kind==='goal'?'Goals':($board['name']??$state['board']['name']),'listName'=>$kind==='goal'?($record['category']??'Personal'):($list['name']??''),'action'=>$action];
        $sql=$this->store->db->getAttribute(PDO::ATTR_DRIVER_NAME)==='sqlite'?'INSERT OR IGNORE':'INSERT IGNORE';
        $this->store->db->prepare($sql.' INTO life_task_history (id,tenant_id,event_key,status,recorded_at,snapshot) VALUES (?,?,?,?,?,?)')->execute([LifeStore::id(),$this->store->tenantId,$key,$status,LifeStore::now(),json_encode($snapshot,JSON_THROW_ON_ERROR)]);
    }
    public function seed(array $state):void {
        foreach(['task'=>'tasks','goal'=>'goals'] as $kind=>$collection){
            $key=$this->store->tenantId.'-'.$kind;$q=$this->store->db->prepare('SELECT tenant_kind FROM life_history_seed WHERE tenant_kind=?');$q->execute([$key]);if($q->fetchColumn())continue;
            $q=$this->store->db->prepare('SELECT snapshot FROM life_task_history WHERE tenant_id=?');$q->execute([$this->store->tenantId]);$hasExisting=false;
            foreach($q->fetchAll(PDO::FETCH_COLUMN) as $json)if((json_decode($json,true)['kind']??'task')===$kind){$hasExisting=true;break;}
            if(!$hasExisting)foreach($state[$collection]??[] as $record)foreach(self::statuses($record,$state,$kind) as $status)$this->append($record,$state,$status,'existing-'.$kind.'-'.$record['id'].'-'.$status,'existing',$kind);
            $sql=$this->store->db->getAttribute(PDO::ATTR_DRIVER_NAME)==='sqlite'?'INSERT OR IGNORE':'INSERT IGNORE';$this->store->db->prepare($sql.' INTO life_history_seed (tenant_kind) VALUES (?)')->execute([$key]);
        }
    }
    public function capture(array $before,array $after,string $action,int $version):void {
        $this->seed($before);foreach(['task'=>'tasks','goal'=>'goals'] as $kind=>$collection){$old=[];foreach($before[$collection]??[] as $record)$old[$record['id']]=$record;
            foreach($after[$collection]??[] as $record){$prior=isset($old[$record['id']])?self::statuses($old[$record['id']],$before,$kind):[];
                foreach(array_diff(self::statuses($record,$after,$kind),$prior) as $status)$this->append($record,$after,$status,$version.'-'.$kind.'-'.$record['id'].'-'.$status,$action,$kind);
            }
        }
    }
    public function get(string $id):array {
        $q=$this->store->db->prepare('SELECT snapshot FROM life_task_history WHERE tenant_id=? AND id=?');$q->execute([$this->store->tenantId,$id]);$json=$q->fetchColumn();if(!$json)throw new LifeError('History record not found.',404);
        $item=json_decode($json,true,512,JSON_THROW_ON_ERROR);$item['kind']??='task';return $item;
    }
    public function delete(string $id,bool $confirmed):void {
        if(!$confirmed)throw new LifeError('Confirm permanent deletion of this history record.');$this->get($id);
        $this->store->db->prepare('DELETE FROM life_task_history WHERE tenant_id=? AND id=?')->execute([$this->store->tenantId,$id]);
    }
    public function export():array {$this->seed($this->store->read()['state']);$q=$this->store->db->prepare('SELECT id,status,recorded_at,snapshot FROM life_task_history WHERE tenant_id=? ORDER BY recorded_at,id');$q->execute([$this->store->tenantId]);return $q->fetchAll(PDO::FETCH_ASSOC);}
    public function page(array $args=[]):array {
        $this->seed($this->store->read()['state']);$status=LifeStore::text($args['status']??'',20);if(!in_array($status,['','done','blocked','archived'],true))throw new LifeError('Choose a valid history status.');
        $search=mb_strtolower(LifeStore::text($args['search']??'',200));$offset=max(0,min(1000000,(int)($args['offset']??0)));$where='tenant_id=?';$params=[$this->store->tenantId];
        if($status!==''){$where.=' AND status=?';$params[]=$status;}
        $sql='SELECT id,status,recorded_at,snapshot FROM life_task_history WHERE '.$where.' ORDER BY recorded_at DESC,id DESC';
        if($search==='')$sql.=' LIMIT 101 OFFSET '.$offset;
        $q=$this->store->db->prepare($sql);$q->execute($params);$entries=[];$skipped=0;
        while($row=$q->fetch(PDO::FETCH_ASSOC)){
            $item=json_decode($row['snapshot'],true,512,JSON_THROW_ON_ERROR);$item['kind']??='task';
            if($search!==''){$text=implode(' ',[$item['task']['title']??'',$item['task']['notes']??'',$item['task']['blocker']??'',$item['boardName']??'',$item['listName']??'']);if(mb_stripos($text,$search)===false)continue;if($skipped++<$offset)continue;}
            $entries[]=['id'=>$row['id'],'status'=>$row['status'],'recordedAt'=>$row['recorded_at']]+$item;if(count($entries)===101)break;
        }
        $q->closeCursor();return ['entries'=>array_slice($entries,0,100),'nextOffset'=>count($entries)>100?$offset+100:null];
    }
}

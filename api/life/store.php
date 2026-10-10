<?php
declare(strict_types=1);

final class LifeError extends RuntimeException {
    public int $status;
    public function __construct(string $message, int $status = 422) { parent::__construct($message); $this->status = $status; }
}

final class LifeStore {
    public function __construct(public PDO $db) {}
    public static function id(): string { return bin2hex(random_bytes(16)); }
    public static function now(): string { return gmdate('Y-m-d\TH:i:s\Z'); }
    public static function week(): string {
        $d = new DateTimeImmutable('now', new DateTimeZone('Africa/Lagos'));
        return $d->modify('-'.((int)$d->format('N') - 1).' days')->format('Y-m-d');
    }
    public static function text(mixed $value, int $max, bool $required = false): string {
        if (!is_string($value) || strlen($value) > $max || ($required && trim($value) === '')) throw new LifeError('Please check the text length and required fields.');
        return trim($value);
    }
    public function owner(): ?array {
        $row = $this->db->query('SELECT * FROM life_owner WHERE id = 1')->fetch(PDO::FETCH_ASSOC);
        return $row ?: null;
    }
    public function initialize(string $password): void {
        if (strlen($password) < 14 || strlen($password) > 200) throw new LifeError('Use a password or passphrase between 14 and 200 characters.');
        $this->db->beginTransaction();
        try {
            if ($this->owner()) throw new LifeError('Owner setup is already complete.', 409);
            $this->db->prepare('INSERT INTO life_owner (id,password_hash,created_at) VALUES (1,?,?)')->execute([password_hash($password, PASSWORD_DEFAULT), self::now()]);
            $lists = [];
            foreach (['Inbox','Backlog','In Progress','Review','Blocked','Done'] as $position => $name) {
                $lists[] = ['id'=>self::id(),'name'=>$name,'position'=>$position,'archived'=>false,'isDone'=>$name==='Done','createdAt'=>self::now(),'updatedAt'=>self::now()];
            }
            $state = ['schema'=>1,'board'=>['id'=>self::id(),'name'=>'My Life'],'lists'=>$lists,'tasks'=>[],'sprints'=>[]];
            $this->db->prepare('INSERT INTO life_board (id,version,state,updated_at) VALUES (1,1,?,?)')->execute([json_encode($state, JSON_THROW_ON_ERROR),self::now()]);
            $this->db->commit();
        } catch (Throwable $e) { if ($this->db->inTransaction()) $this->db->rollBack(); throw $e; }
    }
    public function read(): array {
        $row = $this->db->query('SELECT version,state FROM life_board WHERE id=1')->fetch(PDO::FETCH_ASSOC);
        if (!$row) throw new LifeError('The board has not been initialized.', 503);
        return ['version'=>(int)$row['version'],'state'=>json_decode($row['state'],true,512,JSON_THROW_ON_ERROR),'week'=>self::week()];
    }
    private static function index(array $items, string $id): int {
        foreach ($items as $i=>$item) if ($item['id']===$id) return $i;
        throw new LifeError('This item no longer exists.',404);
    }
    private static function listIndex(array $state, string $id, bool $allowArchived = false): int {
        $i=self::index($state['lists'],$id);
        if (!$allowArchived && $state['lists'][$i]['archived']) throw new LifeError('Choose an active list.');
        return $i;
    }
    private static function reorder(array &$items, string $id, int $position, ?string $listId = null): void {
        $indices=[];
        foreach ($items as $i=>$item) if (!$item['archived'] && ($listId===null || $item['listId']===$listId)) $indices[]=$i;
        usort($indices,fn($a,$b)=>$items[$a]['position']<=>$items[$b]['position']);
        $moving=null;
        foreach ($indices as $k=>$i) if ($items[$i]['id']===$id) { $moving=$i; array_splice($indices,$k,1); break; }
        if ($moving===null) throw new LifeError('Cannot reorder an archived item.');
        array_splice($indices,max(0,min($position,count($indices))),0,[$moving]);
        foreach ($indices as $p=>$i) { $items[$i]['position']=$p; $items[$i]['updatedAt']=self::now(); }
    }
    public function mutate(int $version, string $action, array $args): array {
        $this->db->beginTransaction();
        try {
            $current=$this->read();
            if ($current['version']!==$version) throw new LifeError('This board changed in another tab. Your draft is preserved. Reload the latest board before saving again.',409);
            $s=$current['state']; $id=$args['id']??'';
            switch ($action) {
                case 'task.save':
                    $listId=self::text($args['listId']??'',32,true); self::listIndex($s,$listId);
                    $priority=$args['priority']??'normal';
                    if (!in_array($priority,['low','normal','high'],true)) throw new LifeError('Choose a valid priority.');
                    $due=$args['dueDate']??'';
                    if (!is_string($due) || ($due!=='' && (!preg_match('/^\d{4}-\d{2}-\d{2}$/',$due) || !checkdate((int)substr($due,5,2),(int)substr($due,8,2),(int)substr($due,0,4))))) throw new LifeError('Choose a valid due date.');
                    $labels=$args['labels']??[]; $checklist=$args['checklist']??[];
                    if (!is_array($labels) || count($labels)>10 || !is_array($checklist) || count($checklist)>100) throw new LifeError('Too many labels or checklist items.');
                    $labels=array_values(array_unique(array_map(fn($v)=>self::text($v,40,true),$labels)));
                    $checklist=array_map(fn($v)=>['id'=>is_string($v['id']??null) && preg_match('/^[a-f0-9]{32}$/',$v['id']) ? $v['id'] : self::id(),'text'=>self::text($v['text']??'',300,true),'done'=>($v['done']??false)===true],$checklist);
                    if (count(array_unique(array_column($checklist,'id')))!==count($checklist)) throw new LifeError('Checklist item IDs must be unique.');
                    $item=['title'=>self::text($args['title']??'',200,true),'notes'=>self::text($args['notes']??'',20000),'blocker'=>self::text($args['blocker']??'',2000),'priority'=>$priority,'labels'=>$labels,'checklist'=>$checklist,'dueDate'=>$due,'listId'=>$listId,'updatedAt'=>self::now()];
                    if ($id==='') {
                        if (count($s['tasks'])>=5000) throw new LifeError('The board has reached its task limit.');
                        $item+=['id'=>self::id(),'archived'=>false,'position'=>count($s['tasks']),'createdAt'=>self::now()]; $s['tasks'][]=$item; $id=$item['id'];
                    } else {
                        $i=self::index($s['tasks'],$id); if ($s['tasks'][$i]['archived']) throw new LifeError('Restore this task before editing.');
                        $oldList=$s['tasks'][$i]['listId']; $s['tasks'][$i]=array_merge($s['tasks'][$i],$item);
                        if ($oldList!==$listId) self::reorder($s['tasks'],$id,count($s['tasks']),$listId);
                    }
                    if (isset($args['position'])) self::reorder($s['tasks'],$id,(int)$args['position'],$listId);
                    if (isset($args['sprintWeek'])) {
                        $week=self::validWeek($args['sprintWeek']);
                        $sprint=$s['sprints'][$week]??['id'=>self::id(),'week'=>$week,'goal'=>'','taskIds'=>[]];
                        $sprint['taskIds']=array_values(array_filter($sprint['taskIds'],fn($v)=>$v!==$id));
                        if (($args['inSprint']??false)===true) $sprint['taskIds'][]=$id;
                        $sprint['updatedAt']=self::now(); $s['sprints'][$week]=$sprint;
                    }
                    break;
                case 'task.move':
                    $i=self::index($s['tasks'],$id); $listId=self::text($args['listId']??'',32,true); self::listIndex($s,$listId);
                    if ($s['tasks'][$i]['archived']) throw new LifeError('Restore this task before moving it.');
                    $s['tasks'][$i]['listId']=$listId; self::reorder($s['tasks'],$id,(int)($args['position']??9999),$listId); break;
                case 'task.archive': case 'task.restore':
                    $i=self::index($s['tasks'],$id);
                    if ($action==='task.restore') {
                        $listId=$args['listId']??$s['tasks'][$i]['listId']; self::listIndex($s,$listId); $s['tasks'][$i]['listId']=$listId;
                    }
                    $s['tasks'][$i]['archived']=$action==='task.archive'; $s['tasks'][$i]['updatedAt']=self::now(); break;
                case 'list.save':
                    $name=self::text($args['name']??'',80,true);
                    if ($id==='') {
                        if (count($s['lists'])>=50) throw new LifeError('The board has reached its list limit.');
                        $s['lists'][]=['id'=>self::id(),'name'=>$name,'position'=>count($s['lists']),'archived'=>false,'isDone'=>false,'createdAt'=>self::now(),'updatedAt'=>self::now()];
                    } else { $i=self::listIndex($s,$id); $s['lists'][$i]['name']=$name; $s['lists'][$i]['updatedAt']=self::now(); }
                    break;
                case 'list.move': self::listIndex($s,$id); self::reorder($s['lists'],$id,(int)($args['position']??0)); break;
                case 'list.archive': case 'list.restore':
                    $i=self::listIndex($s,$id,true);
                    if ($action==='list.archive') {
                        if ($s['lists'][$i]['isDone']) throw new LifeError('Keep the completion list active. You can rename it.');
                        foreach ($s['tasks'] as $t) if ($t['listId']===$id && !$t['archived']) throw new LifeError('Move or archive the tasks in this list first.');
                    }
                    $s['lists'][$i]['archived']=$action==='list.archive'; $s['lists'][$i]['updatedAt']=self::now(); break;
                case 'sprint.save':
                    $week=self::validWeek($args['week']??'');
                    $ids=$args['taskIds']??[];
                    if (!is_array($ids) || count($ids)>500) throw new LifeError('Choose valid sprint tasks.');
                    foreach ($ids as $taskId) self::index($s['tasks'],$taskId);
                    $s['sprints'][$week]=['id'=>$s['sprints'][$week]['id']??self::id(),'week'=>$week,'goal'=>self::text($args['goal']??'',2000),'taskIds'=>array_values(array_unique($ids)),'updatedAt'=>self::now()]; break;
                default: throw new LifeError('Unknown board action.',400);
            }
            $q=$this->db->prepare('UPDATE life_board SET state=?,version=version+1,updated_at=? WHERE id=1 AND version=?');
            $q->execute([json_encode($s,JSON_THROW_ON_ERROR),self::now(),$version]);
            if ($q->rowCount()!==1) throw new LifeError('The board changed while saving. Reload the latest board.',409);
            $this->db->commit(); return $this->read();
        } catch (Throwable $e) { if ($this->db->inTransaction()) $this->db->rollBack(); throw $e; }
    }
    private static function validWeek(mixed $week): string {
        if (!is_string($week) || !preg_match('/^\d{4}-\d{2}-\d{2}$/',$week)) throw new LifeError('Choose a valid sprint week.');
        $d=DateTimeImmutable::createFromFormat('!Y-m-d',$week,new DateTimeZone('Africa/Lagos'));
        if (!$d || $d->format('Y-m-d')!==$week || $d->format('N')!=='1') throw new LifeError('Sprints start on Monday.');
        return $week;
    }
    public function throttle(string $ip): void {
        $key=hash('sha256',$ip); $since=time()-900;
        $q=$this->db->prepare('SELECT COUNT(*) FROM life_login_attempt WHERE attempted_at>?');
        $q->execute([$since]); $global=(int)$q->fetchColumn();
        $q=$this->db->prepare('SELECT COUNT(*) FROM life_login_attempt WHERE attempted_at>? AND ip_hash=?'); $q->execute([$since,$key]);
        if ($global>=30 || (int)$q->fetchColumn()>=5) throw new LifeError('Too many sign-in attempts. Try again in 15 minutes.',429);
        $this->db->prepare('INSERT INTO life_login_attempt (id,ip_hash,attempted_at) VALUES (?,?,?)')->execute([self::id(),$key,time()]);
        $this->db->prepare('DELETE FROM life_login_attempt WHERE attempted_at<?')->execute([time()-86400]);
    }
}

<?php
declare(strict_types=1);
require_once __DIR__.'/google-auth.php';
final class LifeGoogleRemoteError extends RuntimeException {public function __construct(public int $httpStatus){parent::__construct('Google synchronization could not complete.');}}
final class LifeGoogleSync {
    private mixed $transport;
    public function __construct(private LifeStore $store,mixed $transport=null) {
        $this->transport=$transport;$db=$store->db;if($db->inTransaction())return;
        $db->exec('CREATE TABLE IF NOT EXISTS life_google_connection (id INT PRIMARY KEY, token LONGTEXT NOT NULL, settings LONGTEXT NOT NULL)');
        $db->exec('CREATE TABLE IF NOT EXISTS life_google_map (id VARCHAR(100) PRIMARY KEY, owner_id INT NOT NULL, task_id VARCHAR(32) NOT NULL, kind VARCHAR(20) NOT NULL, remote_id VARCHAR(1024) NOT NULL, baseline LONGTEXT NOT NULL, conflict LONGTEXT NULL)');
        $db->exec('CREATE TABLE IF NOT EXISTS life_google_channel (id VARCHAR(64) PRIMARY KEY, owner_id INT NOT NULL, token_hash VARCHAR(64) NOT NULL, resource_id VARCHAR(1024) NOT NULL, expires_at BIGINT NOT NULL)');
        $db->exec('CREATE TABLE IF NOT EXISTS life_google_queue (id INT PRIMARY KEY, version INT NOT NULL)');
    }
    private function connection(): ?array {$q=$this->store->db->prepare('SELECT * FROM life_google_connection WHERE id=?');$q->execute([$this->store->tenantId]);$r=$q->fetch(PDO::FETCH_ASSOC);if($r)$r['settings']=json_decode($r['settings'],true,32,JSON_THROW_ON_ERROR);return $r?:null;}
    private function saveConnection(array $row): void {$this->store->db->prepare('UPDATE life_google_connection SET token=?,settings=? WHERE id=?')->execute([$row['token'],json_encode($row['settings'],JSON_THROW_ON_ERROR),$this->store->tenantId]);}
    public function connect(array $token,string $service='both'): void {
        if(!in_array($service,['calendar','tasks','both'],true))throw new LifeError('Choose Calendar or Tasks.');
        $scopes=explode(' ',$token['scope']??'');$granted=['tasks'=>in_array('https://www.googleapis.com/auth/tasks',$scopes,true),'calendar'=>in_array('https://www.googleapis.com/auth/calendar.app.created',$scopes,true)];
        if($service==='both'&&!array_filter($granted))throw new LifeError('Calendar or Tasks access was not granted.',403);
        if($service!=='both'&&!$granted[$service])throw new LifeError(ucfirst($service).' access was not granted.',403);
        $old=$this->connection();$settings=$old['settings']??['calendarId'=>'','taskListId'=>'','lastSync'=>null];
        if(empty($token['refresh_token'])&&$old&&!empty($old['token'])){$prior=LifeGoogleAuth::decrypt($old['token'],$this->store->tenantId);$token['refresh_token']=$prior['refresh_token']??null;}
        if(empty($token['refresh_token']))throw new LifeError('Allow offline access so your planner can synchronize when closed.',403);
        if($service==='both')$settings=array_merge($settings,$granted);else $settings[$service]=true;
        $settings=array_merge($settings,['connected'=>(bool)($settings['calendar']??false)||(bool)($settings['tasks']??false),'error'=>null]);$encrypted=LifeGoogleAuth::encrypt($token,$this->store->tenantId);
        if($old)$this->saveConnection(['token'=>$encrypted,'settings'=>$settings]);else $this->store->db->prepare('INSERT INTO life_google_connection VALUES (?,?,?)')->execute([$this->store->tenantId,$encrypted,json_encode($settings,JSON_THROW_ON_ERROR)]);
        self::enqueue($this->store);
    }
    public static function enqueue(LifeStore $store): void {
        $q=$store->db->prepare('SELECT id FROM life_google_connection WHERE id=?');$q->execute([$store->tenantId]);if(!$q->fetchColumn())return;
        $version=$store->read()['version'];$update=$store->db->prepare('UPDATE life_google_queue SET version=? WHERE id=?');$update->execute([$version,$store->tenantId]);
        if($update->rowCount()===0){try{$store->db->prepare('INSERT INTO life_google_queue VALUES (?,?)')->execute([$store->tenantId,$version]);}catch(PDOException $e){$update->execute([$version,$store->tenantId]);if($update->rowCount()===0){/* MySQL reports changed rows, so an existing identical queue entry is already success. */$check=$store->db->prepare('SELECT version FROM life_google_queue WHERE id=?');$check->execute([$store->tenantId]);$queued=$check->fetchColumn();if($queued===false||(int)$queued!==$version)throw $e;}}}
    }
    public function status(): array {$r=$this->connection();$q=$this->store->db->prepare('SELECT task_id,kind,conflict FROM life_google_map WHERE owner_id=? AND conflict IS NOT NULL');$q->execute([$this->store->tenantId]);$conflicts=array_map(fn($r)=>['taskId'=>$r['task_id'],'kind'=>$r['kind'],'versions'=>json_decode($r['conflict'],true)],$q->fetchAll(PDO::FETCH_ASSOC));$q=$this->store->db->prepare('SELECT id FROM life_google_queue WHERE id=?');$q->execute([$this->store->tenantId]);$settings=$r['settings']??[];return ['available'=>LifeGoogleAuth::ready()&&(LifeGoogleAuth::config()['syncEnabled']??false),'connected'=>(bool)($settings['connected']??false),'calendarConnected'=>(bool)($settings['calendar']??false),'tasksConnected'=>(bool)($settings['tasks']??false),'syncing'=>(bool)$q->fetchColumn(),'lastSync'=>$settings['lastSync']??null,'error'=>$settings['error']??null,'conflicts'=>$conflicts];}
    public function disconnect(): void {$r=$this->connection();if(!$r)return;$r['token']='';$r['settings']['connected']=false;$r['settings']['calendar']=false;$r['settings']['tasks']=false;$r['settings']['error']=null;$this->saveConnection($r);$this->store->db->prepare('DELETE FROM life_google_queue WHERE id=?')->execute([$this->store->tenantId]);}
    private function request(string $method,string $path,?array $body,array &$connection): array {
        if($this->transport)return ($this->transport)($method,$path,$body);
        $client=LifeGoogleAuth::client();$token=LifeGoogleAuth::decrypt($connection['token'],$this->store->tenantId);$client->setAccessToken($token);
        if($client->isAccessTokenExpired()){$refreshToken=$token['refresh_token']??'';$renewed=$client->fetchAccessTokenWithRefreshToken($refreshToken);if(isset($renewed['error']))throw new LifeGoogleRemoteError(401);$renewed['refresh_token']=$renewed['refresh_token']??$refreshToken;$token=$renewed;$client->setAccessToken($token);$connection['token']=LifeGoogleAuth::encrypt($token,$this->store->tenantId);$this->saveConnection($connection);}
        $response=$client->authorize()->request($method,'https://www.googleapis.com/'.$path,['http_errors'=>false,'timeout'=>20,'connect_timeout'=>10]+($body===null?[]:['json'=>$body]));$code=$response->getStatusCode();if($code<200||$code>=300)throw new LifeGoogleRemoteError($code);$text=(string)$response->getBody();return $text===''?[]:json_decode($text,true,128,JSON_THROW_ON_ERROR);
    }
    public static function projection(array $task,string $kind,array $state): array {
        $done=false;foreach($state['lists'] as $l)if($l['id']===$task['listId'])$done=$l['isDone'];
        return $kind==='tasks'?['title'=>$task['title'],'notes'=>$task['notes']??'','dueDate'=>$task['dueDate']??'','done'=>$done,'archived'=>(bool)$task['archived']]:['title'=>$task['title'],'notes'=>$task['notes']??'','schedule'=>$task['schedule']??null,'archived'=>(bool)$task['archived']||empty($task['schedule'])];
    }
    public static function remoteProjection(array $remote,string $kind): array {
        if($kind==='tasks')return ['title'=>$remote['title']??'','notes'=>preg_replace('/\n\[Life reference: [a-f0-9]{32}\]$/','',$remote['notes']??''),'dueDate'=>substr($remote['due']??'',0,10),'done'=>($remote['status']??'')==='completed','archived'=>(bool)($remote['deleted']??false)];
        $start=$remote['start']['dateTime']??null;$end=$remote['end']['dateTime']??null;$schedule=null;
        if($start&&$end){$zone=new DateTimeZone(LifeStore::$timezone);$a=(new DateTimeImmutable($start))->setTimezone($zone);$b=new DateTimeImmutable($end);$minutes=(int)(($b->getTimestamp()-$a->getTimestamp())/60);if($minutes<1||$minutes>1440)throw new LifeError('This Google event duration is not supported. The event is unchanged.');$schedule=['date'=>$a->format('Y-m-d'),'time'=>$a->format('H:i'),'minutes'=>$minutes];}
        elseif(!empty($remote['start']['date']))throw new LifeError('All-day Google events cannot be imported as timed work blocks yet. The event is unchanged.');
        return ['title'=>$remote['summary']??'Untitled event','notes'=>$remote['description']??'','schedule'=>($remote['status']??'')==='cancelled'?null:$schedule,'archived'=>($remote['status']??'')==='cancelled'];
    }
    public static function conflict(array $base,array $local,array $remote): bool {return $local!==$base&&$remote!==$base&&$local!==$remote;}
    private function maps(string $kind): array {$q=$this->store->db->prepare('SELECT * FROM life_google_map WHERE owner_id=? AND kind=?');$q->execute([$this->store->tenantId,$kind]);return $q->fetchAll(PDO::FETCH_ASSOC);}
    private function saveMap(string $task,string $kind,string $remote,array $baseline): void {$id=$this->store->tenantId.':'.$kind.':'.$task;$db=$this->store->db;$db->prepare('DELETE FROM life_google_map WHERE id=?')->execute([$id]);$db->prepare('INSERT INTO life_google_map VALUES (?,?,?,?,?,?,NULL)')->execute([$id,$this->store->tenantId,$task,$kind,$remote,json_encode($baseline,JSON_THROW_ON_ERROR)]);}
    private function applyRemote(string $id,string $kind,array $remote): string {
        $snapshot=$this->store->read();$s=$snapshot['state'];$task=null;foreach($s['tasks'] as $t)if($t['id']===$id)$task=$t;
        if($kind==='calendar'&&$remote['archived']){if($task&&!$task['archived'])$this->store->mutate($snapshot['version'],'task.schedule',['id'=>$id,'date'=>'','time'=>'','minutes'=>60]);return $id;}
        if($remote['archived']){if($task&&!$task['archived'])$this->store->mutate($snapshot['version'],'task.archive',['id'=>$id]);return $id;}
        if(strlen($remote['title'])>200||strlen($remote['notes'])>20000)throw new LifeError('Google content exceeds the planner limit. Both versions are preserved.');
        if(!$task){$list=null;foreach($s['lists'] as $l)if(!$l['archived']&&!$l['isDone']){$list=$l['id'];break;}if(!$list)throw new LifeError('Create an unfinished list before importing Google tasks.');$snapshot=$this->store->mutate($snapshot['version'],'task.save',['title'=>$remote['title'],'notes'=>$remote['notes'],'listId'=>$list,'dueDate'=>$remote['dueDate']??'']);$task=end($snapshot['state']['tasks']);$id=$task['id'];}
        else {
            if($task['archived'])$snapshot=$this->store->mutate($snapshot['version'],'task.restore',['id'=>$id,'listId'=>$task['listId']]);
            $task=array_merge($task,['title'=>$remote['title'],'notes'=>$remote['notes']]);if($kind==='tasks')$task['dueDate']=$remote['dueDate'];unset($task['descriptionDelta']);
            $snapshot=$this->store->mutate($snapshot['version'],'task.save',$task);
        }
        if($kind==='tasks')$this->store->mutate($snapshot['version'],'task.complete',['id'=>$id,'done'=>$remote['done']]);
        elseif($remote['schedule'])$this->store->mutate($snapshot['version'],'task.schedule',['id'=>$id]+$remote['schedule']);
        return $id;
    }
    private function export(string $id,string $kind,array $local,?string $remoteId,array &$c): ?string {
        $collection=$kind==='tasks'?'tasks/v1/lists/'.rawurlencode($c['settings']['taskListId']).'/tasks':'calendar/v3/calendars/'.rawurlencode($c['settings']['calendarId']).'/events';
        $remove=$local['archived']||($kind==='calendar'&&!$local['schedule']);
        if($remove){if($remoteId){try{$this->request('DELETE',$collection.'/'.rawurlencode($remoteId),null,$c);}catch(LifeGoogleRemoteError $e){if(!in_array($e->httpStatus,[404,410],true))throw $e;}}return $remoteId;}
        if($kind==='tasks') {if(strlen($local['notes'])+52>8192)throw new LifeError('These notes are too long for Google Tasks. The Life task is saved.');$body=['title'=>$local['title'],'notes'=>$local['notes'].'\n[Life reference: '.$id.']','status'=>$local['done']?'completed':'needsAction','due'=>$local['dueDate']?$local['dueDate'].'T00:00:00.000Z':null];$body['notes']=str_replace('\\n',"\n",$body['notes']);}
        else {$a=new DateTimeImmutable($local['schedule']['date'].' '.$local['schedule']['time'],new DateTimeZone(LifeStore::$timezone));$body=['summary'=>$local['title'],'description'=>$local['notes'],'start'=>['dateTime'=>$a->format(DateTimeInterface::RFC3339),'timeZone'=>LifeStore::$timezone],'end'=>['dateTime'=>$a->modify('+'.$local['schedule']['minutes'].' minutes')->format(DateTimeInterface::RFC3339),'timeZone'=>LifeStore::$timezone],'reminders'=>['useDefault'=>false],'extendedProperties'=>['private'=>['lifeTaskId'=>$id]]];if(!$remoteId)$body['id']=$id;}
        try{$result=$this->request($remoteId?'PATCH':'POST',$collection.($remoteId?'/'.rawurlencode($remoteId):''),$body,$c);}catch(LifeGoogleRemoteError $e){if($kind!=='calendar'||$e->httpStatus!==409)throw $e;$result=$this->request('PATCH',$collection.'/'.$id,$body,$c);}return $result['id']??$remoteId;
    }
    public static function webhook(PDO $db,array $headers): bool {
        $id=$headers['channel']??'';$token=$headers['token']??'';$resource=$headers['resource']??'';
        if(!is_string($id)||!is_string($token)||strlen($id)>64||strlen($token)>64)return false;
        $q=$db->prepare('SELECT * FROM life_google_channel WHERE id=?');$q->execute([$id]);$r=$q->fetch(PDO::FETCH_ASSOC);
        if(!$r||$r['expires_at']<time()||!hash_equals($r['token_hash'],hash('sha256',$token))||!hash_equals($r['resource_id'],$resource))return false;
        $store=new LifeStore($db,(int)$r['owner_id']);self::enqueue($store);return true;
    }
    private function watch(array &$c): void {
        $url=LifeGoogleAuth::config()['webhookUri']??'';if(!$url)return;
        if(($c['settings']['watchExpires']??0)>time()+3600)return;
        $id=LifeStore::id();$token=bin2hex(random_bytes(32));$expires=time()+86400;
        $r=$this->request('POST','calendar/v3/calendars/'.rawurlencode($c['settings']['calendarId']).'/events/watch',['id'=>$id,'type'=>'web_hook','address'=>$url,'token'=>$token,'expiration'=>(string)($expires*1000)],$c);
        $this->store->db->prepare('INSERT INTO life_google_channel VALUES (?,?,?,?,?)')->execute([$id,$this->store->tenantId,hash('sha256',$token),$r['resourceId'],$expires]);$c['settings']['watchExpires']=$expires;$this->saveConnection($c);
    }
    public function run(): void {
        $c=$this->connection();if(!$c||!($c['settings']['connected']??false)||($c['settings']['retryAt']??0)>time())return;
        $queue=$this->store->db->prepare('SELECT version FROM life_google_queue WHERE id=?');$queue->execute([$this->store->tenantId]);$queuedVersion=$queue->fetchColumn();
        $lockPath=LifeGoogleAuth::privateDir().'/sync-'.$this->store->tenantId.'.lock';$lock=fopen($lockPath,'c');if(!$lock||!flock($lock,LOCK_EX|LOCK_NB))return;
        try {
            foreach(['tasks','calendar'] as $kind) {
                if(!($c['settings'][$kind]??false))continue;
                if($kind==='calendar'){$q=$this->store->db->prepare('SELECT id FROM life_google_queue WHERE id=?');$q->execute([$this->store->tenantId]);$hasQueue=(bool)$q->fetchColumn();$calendarDue=$hasQueue||empty($c['settings']['calendarSyncToken'])||($c['settings']['watchExpires']??0)<=time()+3600;if(!$calendarDue)continue;}
                $key=$kind==='tasks'?'taskListId':'calendarId';
                if(empty($c['settings'][$key])){$r=$this->request('POST',$kind==='tasks'?'tasks/v1/users/@me/lists':'calendar/v3/calendars',$kind==='tasks'?['title'=>'Life']:['summary'=>'Life','timeZone'=>LifeStore::$timezone],$c);$c['settings'][$key]=$r['id'];$this->saveConnection($c);}
                $collection=$kind==='tasks'?'tasks/v1/lists/'.rawurlencode($c['settings'][$key]).'/tasks':'calendar/v3/calendars/'.rawurlencode($c['settings'][$key]).'/events';$remote=[];$page='';$incremental=$kind==='calendar'&&!empty($c['settings']['calendarSyncToken']);
                do {$r=$this->request('GET',$collection.'?'.http_build_query(($kind==='tasks'?['showCompleted'=>'true','showHidden'=>'true','showDeleted'=>'true','maxResults'=>100]:['showDeleted'=>'true','maxResults'=>250]+($incremental?['syncToken'=>$c['settings']['calendarSyncToken']]:[]))+($page?['pageToken'=>$page]:[])),null,$c);foreach($r['items']??[] as $item)$remote[$item['id']]=$item;$page=$r['nextPageToken']??'';}while($page);$nextSyncToken=$r['nextSyncToken']??null;
                $maps=$this->maps($kind);$known=[];
                foreach($maps as $m){$known[$m['remote_id']]=true;if($m['conflict']!==null)continue;$s=$this->store->read()['state'];$task=null;foreach($s['tasks'] as $t)if($t['id']===$m['task_id'])$task=$t;if(!$task)continue;$local=self::projection($task,$kind,$s);$base=json_decode($m['baseline'],true);$rp=isset($remote[$m['remote_id']])?self::remoteProjection($remote[$m['remote_id']],$kind):($incremental?$base:array_merge($base,['archived'=>true]));
                    if(self::conflict($base,$local,$rp)){$this->store->db->prepare('UPDATE life_google_map SET conflict=? WHERE id=? AND owner_id=?')->execute([json_encode(['life'=>$local,'google'=>$rp]),$m['id'],$this->store->tenantId]);continue;}
                    if($rp!==$base&&$local!==$rp){$this->applyRemote($task['id'],$kind,$rp);$s=$this->store->read()['state'];foreach($s['tasks'] as $t)if($t['id']===$task['id'])$local=self::projection($t,$kind,$s);}
                    else if($local!==$base)$this->export($task['id'],$kind,$local,$m['remote_id'],$c);
                    $this->saveMap($task['id'],$kind,$m['remote_id'],$local);
                }
                foreach($remote as $remoteId=>$item){if(isset($known[$remoteId])||($item['deleted']??false)||($item['status']??'')==='cancelled')continue;$recover=$kind==='tasks'&&preg_match('/\[Life reference: ([a-f0-9]{32})\]$/',$item['notes']??'',$match)?$match[1]:($item['extendedProperties']['private']['lifeTaskId']??'');$s=$this->store->read()['state'];$exists=false;foreach($s['tasks'] as $t)if($t['id']===$recover)$exists=true;$rp=self::remoteProjection($item,$kind);$id=$this->applyRemote($exists?$recover:'',$kind,$rp);$this->saveMap($id,$kind,$remoteId,$rp);}
                $mapped=array_column($this->maps($kind),'task_id');$s=$this->store->read()['state'];foreach($s['tasks'] as $t){if($t['archived']||in_array($t['id'],$mapped,true)||($kind==='calendar'&&empty($t['schedule'])))continue;$local=self::projection($t,$kind,$s);$remoteId=$this->export($t['id'],$kind,$local,null,$c);if($remoteId)$this->saveMap($t['id'],$kind,$remoteId,$local);}
                if($kind==='calendar'){if($nextSyncToken)$c['settings']['calendarSyncToken']=$nextSyncToken;$this->watch($c);}
            }
            $c['settings']['attempts']=0;$c['settings']['retryAt']=0;
            $c['settings']['lastSync']=LifeStore::now();$c['settings']['error']=null;$this->saveConnection($c);$this->store->db->prepare('DELETE FROM life_google_queue WHERE id=? AND version=?')->execute([$this->store->tenantId,$queuedVersion??-1]);
        }catch(Throwable $e){if($e instanceof LifeGoogleRemoteError&&$e->httpStatus===410)unset($c['settings']['calendarSyncToken']);$c['settings']['attempts']=min(8,($c['settings']['attempts']??0)+1);$c['settings']['retryAt']=time()+min(3600,60*2**($c['settings']['attempts']-1));$c['settings']['error']=$e instanceof LifeError?$e->getMessage():($e instanceof LifeGoogleRemoteError&&$e->httpStatus===401?'Reconnect Google to continue syncing.':($e instanceof LifeGoogleRemoteError&&$e->httpStatus===403?'Google Calendar/Tasks access is not enabled or approved yet. Check the Google connection and API setup.':'Google sync will retry. Your planner changes are saved.'));$this->saveConnection($c);throw $e;}
        finally{flock($lock,LOCK_UN);fclose($lock);}
    }
    public function resolve(array $input): void {
        $id=LifeStore::text($input['taskId']??'',32,true);$kind=$input['kind']??'';$choice=$input['choice']??'';if(!in_array($kind,['tasks','calendar'],true)||!in_array($choice,['life','google'],true))throw new LifeError('Choose a conflict version.');
        $q=$this->store->db->prepare('SELECT * FROM life_google_map WHERE id=? AND owner_id=?');$q->execute([$this->store->tenantId.':'.$kind.':'.$id,$this->store->tenantId]);$m=$q->fetch(PDO::FETCH_ASSOC);if(!$m||!$m['conflict'])throw new LifeError('Conflict no longer exists.',409);$versions=json_decode($m['conflict'],true);
        if($choice==='google')$this->applyRemote($id,$kind,$versions['google']);
        $this->store->db->prepare('UPDATE life_google_map SET baseline=?,conflict=NULL WHERE id=? AND owner_id=?')->execute([json_encode($versions['google']),$m['id'],$this->store->tenantId]);self::enqueue($this->store);
    }
}

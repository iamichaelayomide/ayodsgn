<?php
declare(strict_types=1);

final class LifeError extends RuntimeException {
    public int $status;
    public function __construct(string $message, int $status = 422) { parent::__construct($message); $this->status = $status; }
}

require_once __DIR__.'/task-fields.php';

final class LifeStore {
    public static string $timezone='Africa/Lagos';
    public function __construct(public PDO $db, public readonly int $tenantId=1) {
        if($tenantId<1)throw new LifeError('Invalid account.',403);
        self::$timezone='Africa/Lagos';
        try{$q=$db->prepare('SELECT timezone FROM life_account WHERE id=?');$q->execute([$tenantId]);$zone=$q->fetchColumn();if(is_string($zone)&&in_array($zone,DateTimeZone::listIdentifiers(),true))self::$timezone=$zone;}catch(PDOException $e){}
        require_once __DIR__.'/google-sync.php';new LifeGoogleSync($this);
    }
    public static function id(): string { return bin2hex(random_bytes(16)); }
    public static function now(): string { return gmdate('Y-m-d\TH:i:s\Z'); }
    public static function week(): string {
        $d = new DateTimeImmutable('now', new DateTimeZone(self::$timezone));
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
        if($this->tenantId!==1)throw new LifeError('Owner setup is unavailable for this account.',403);
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
            $this->db->prepare('INSERT INTO life_board (id,version,state,updated_at) VALUES (?,1,?,?)')->execute([$this->tenantId,json_encode($state, JSON_THROW_ON_ERROR),self::now()]);
            $this->db->commit();
        } catch (Throwable $e) { if ($this->db->inTransaction()) $this->db->rollBack(); throw $e; }
    }
    public function read(): array {
        $q=$this->db->prepare('SELECT version,state FROM life_board WHERE id=?');$q->execute([$this->tenantId]);$row=$q->fetch(PDO::FETCH_ASSOC);
        if (!$row) throw new LifeError('The board has not been initialized.', 503);
        $state=json_decode($row['state'],true,512,JSON_THROW_ON_ERROR);$state['boards']??=[$state['board']+['archived'=>false]];return ['version'=>(int)$row['version'],'state'=>$state,'week'=>self::week()];
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
    public function mutate(int $version, string $action, array $args, string $role = 'owner', string $actor = 'owner'): array {
        $ownsTransaction=!$this->db->inTransaction();if($ownsTransaction)$this->db->beginTransaction();
        try {
            $current=$this->read();
            if ($current['version']!==$version) throw new LifeError('This board changed in another tab. Your draft is preserved. Reload the latest board before saving again.',409);
            $s=$current['state']; $id=$args['id']??'';
            if($role==='partner'&&!in_array($action,['goal.approve','task.approve','task.complete'],true))throw new LifeError('Partners can review goals and approve reviewed tasks. Editing belongs to the owner.',403);
            if($role==='owner'&&in_array($action,['goal.approve','task.approve'],true))throw new LifeError('A partner must approve this item.',403);
            if(($s['accountabilityEnabled']??false)&&$role==='owner') {
                if($action==='goal.save'&&($args['completed']??false))throw new LifeError('Your partner must approve goal completion.',403);
            }

            switch ($action) {
                case 'attachment.add':
                    self::index($s['tasks'],self::text($args['taskId']??'',32,true));$s['attachments']??=[];if(count($s['attachments'])>=500)throw new LifeError('Attachment limit reached.');$s['attachments'][]=['id'=>self::text($id,32,true),'taskId'=>$args['taskId'],'name'=>self::text($args['name']??'',200,true),'mime'=>self::text($args['mime']??'',100,true),'size'=>(int)($args['size']??0),'archived'=>false,'createdAt'=>self::now()];break;
                case 'attachment.archive':
                    $i=self::index($s['attachments']??[],$id);$s['attachments'][$i]['archived']=true;break;
                case 'note.save':
                    $s['notes']??=[];$record=['title'=>self::text($args['title']??'',200,true),'body'=>self::text($args['body']??'',20000),'kind'=>in_array($args['kind']??'',['idea','note'],true)?$args['kind']:'note','group'=>self::text($args['group']??'',80),'updatedAt'=>self::now()];
                    if($id===''){if(count($s['notes'])>=2000)throw new LifeError('Note limit reached.');$s['notes'][]=$record+['id'=>self::id(),'archived'=>false,'createdAt'=>self::now()];}else{$i=self::index($s['notes'],$id);$s['notes'][$i]=array_merge($s['notes'][$i],$record);}break;
                case 'note.archive': case 'note.restore':
                    $i=self::index($s['notes']??[],$id);$s['notes'][$i]['archived']=$action==='note.archive';break;
                case 'note.convert':
                    $i=self::index($s['notes']??[],$id);$note=$s['notes'][$i];if(!empty($note['linkedId']))throw new LifeError('This idea already has a linked item.');$newId=self::id();
                    if(($args['target']??'')==='task'){$li=self::listIndex($s,self::text($args['listId']??'',32,true));if($s['lists'][$li]['isDone'])throw new LifeError('Choose an unfinished list.');$s['tasks'][]=['id'=>$newId,'title'=>$note['title'],'notes'=>$note['body'],'listId'=>$s['lists'][$li]['id'],'position'=>count($s['tasks']),'priority'=>'normal','labels'=>[],'dueDate'=>'','blocker'=>'','checklist'=>[],'archived'=>false,'createdAt'=>self::now(),'updatedAt'=>self::now(),'sourceNoteId'=>$id];}
                    elseif(($args['target']??'')==='goal'){$s['goals']??=[];$s['goals'][]=['id'=>$newId,'title'=>$note['title'],'notes'=>$note['body'],'type'=>'adhoc','period'=>'','category'=>$note['group']?:'Personal','parentId'=>'','completed'=>false,'archived'=>false,'createdAt'=>self::now(),'updatedAt'=>self::now(),'sourceNoteId'=>$id];}else throw new LifeError('Choose task or goal.');$s['notes'][$i]['linkedId']=$newId;$s['notes'][$i]['linkedType']=$args['target'];break;
                case 'map.save':
                    $s['mapNodes']??=[];$kind=$args['kind']??'idea';if(!in_array($kind,['goal','milestone','task','idea','question'],true))throw new LifeError('Choose a node type.');$ref=self::text($args['recordId']??'',32);if($ref!=='')self::index(in_array($kind,['goal','milestone'],true)?($s['goals']??[]):($kind==='task'?$s['tasks']:($s['notes']??[])),$ref);
                    $r=['title'=>self::text($args['title']??'',200,true),'kind'=>$kind,'recordId'=>$ref,'group'=>self::text($args['group']??'',80),'x'=>max(0,min(1800,(int)($args['x']??40))),'y'=>max(0,min(1800,(int)($args['y']??40))),'updatedAt'=>self::now()];if($id===''){if(count($s['mapNodes'])>=500)throw new LifeError('Map limit reached.');$s['mapNodes'][]=$r+['id'=>self::id(),'archived'=>false];}else{$i=self::index($s['mapNodes'],$id);$s['mapNodes'][$i]=array_merge($s['mapNodes'][$i],$r);}break;
                case 'map.archive':
                    $i=self::index($s['mapNodes']??[],$id);$s['mapNodes'][$i]['archived']=true;$s['mapEdges']=array_values(array_filter($s['mapEdges']??[],fn($e)=>$e['from']!==$id&&$e['to']!==$id));break;
                case 'map.connect':
                    $from=self::text($args['from']??'',32,true);$to=self::text($args['to']??'',32,true);if($from===$to)throw new LifeError('Connect two different nodes.');foreach([$from,$to] as $node){$ni=self::index($s['mapNodes']??[],$node);if($s['mapNodes'][$ni]['archived'])throw new LifeError('Choose active nodes.');}$s['mapEdges']??=[];foreach($s['mapEdges'] as $edge)if($edge['from']===$from&&$edge['to']===$to)throw new LifeError('These nodes are already connected.');$s['mapEdges'][]=['id'=>self::id(),'from'=>$from,'to'=>$to];break;
                case 'map.disconnect':
                    $i=self::index($s['mapEdges']??[],$id);array_splice($s['mapEdges'],$i,1);break;
                case 'task.dependencies':
                    $i=self::index($s['tasks'],$id);$deps=$args['ids']??[];if(!is_array($deps)||count($deps)>50)throw new LifeError('Choose up to 50 dependencies.');foreach($deps as $dep){self::index($s['tasks'],$dep);$seen=[];$queue=[$dep];while($queue){$next=array_pop($queue);if($next===$id)throw new LifeError('Dependencies cannot form a cycle.');if(isset($seen[$next]))continue;$seen[$next]=true;$ti=self::index($s['tasks'],$next);foreach($s['tasks'][$ti]['dependencies']??[] as $other)$queue[]=$other;}}$s['tasks'][$i]['dependencies']=array_values(array_unique($deps));break;
                case 'template.save':
                    if(isset($args['lists'])&&!is_array($args['lists']))throw new LifeError('Choose valid board lists.');
                    $s['templates']??=[];if(count($s['templates'])>=100)throw new LifeError('Template limit reached.');$kind=$args['kind']??'';if(!in_array($kind,['board','week','review'],true))throw new LifeError('Choose a template type.');$template=['id'=>self::id(),'name'=>self::text($args['name']??'',100,true),'kind'=>$kind,'text'=>self::text($args['text']??'',2000),'lists'=>[]];if($kind==='board'){foreach($args['lists']??[] as $name)$template['lists'][]=self::text($name,80,true);if(count($template['lists'])<1||count($template['lists'])>20)throw new LifeError('Choose 1–20 lists.');}$s['templates'][]=$template;break;
                case 'template.apply':
                    $i=self::index($s['templates']??[],$id);$tpl=$s['templates'][$i];if($tpl['kind']==='board'){if(count($s['boards'])>=20)throw new LifeError('Board limit reached.');$bid=self::id();$s['boards'][]=['id'=>$bid,'name'=>$tpl['name'],'archived'=>false];foreach($tpl['lists'] as $pos=>$name)$s['lists'][]=['id'=>self::id(),'boardId'=>$bid,'name'=>$name,'position'=>$pos,'archived'=>false,'isDone'=>$name==='Done','createdAt'=>self::now(),'updatedAt'=>self::now()];}elseif($tpl['kind']==='week'){$week=self::validWeek($args['week']??'');$s['sprints'][$week]=array_merge(['id'=>self::id(),'week'=>$week,'taskIds'=>[],'capacityMinutes'=>0],$s['sprints'][$week]??[],['goal'=>$tpl['text'],'updatedAt'=>self::now()]);}else{$week=self::validWeek($args['week']??'');$s['reviews'][$week]=array_merge($s['reviews'][$week]??[],['week'=>$week,'wins'=>$tpl['text'],'updatedAt'=>self::now()]);}break;
                case 'board.archive':
                    $bi=self::index($s['boards'],$id);if($s['boards'][$bi]['archived'])break;
                    if(count(array_filter($s['boards'],fn($b)=>!$b['archived']))<2)throw new LifeError('Create another board before archiving your last active board.');
                    $s['boards'][$bi]['archived']=true;$owned=[];
                    foreach($s['lists'] as &$l){if(($l['boardId']??$s['board']['id'])===$id){$owned[]=$l['id'];if(!$l['archived']){$l['archived']=true;$l['boardArchive']=$id;}}}unset($l);
                    foreach($s['tasks'] as &$t){if(in_array($t['listId'],$owned,true)&&!$t['archived']){$t['archived']=true;$t['boardArchive']=$id;}}unset($t);break;
                case 'board.restore':
                    $bi=self::index($s['boards'],$id);$s['boards'][$bi]['archived']=false;
                    foreach(['lists','tasks'] as $kind)foreach($s[$kind] as &$r){if(($r['boardArchive']??'')===$id){$r['archived']=false;unset($r['boardArchive']);}}unset($r);break;
                case 'board.save':
                    $name=self::text($args['name']??'',80,true);
                    if($id===''){if(count($s['boards'])>=20)throw new LifeError('Board limit reached.');$bid=self::id();$s['boards'][]=['id'=>$bid,'name'=>$name,'archived'=>false];foreach(['Idea Box','In Progress','Review','Blocked','Done'] as $position=>$name)$s['lists'][]=['id'=>self::id(),'boardId'=>$bid,'name'=>$name,'position'=>$position,'archived'=>false,'isDone'=>$name==='Done','createdAt'=>self::now(),'updatedAt'=>self::now()];}
                    else{$i=self::index($s['boards'],$id);$s['boards'][$i]['name']=$name;}break;
                case 'routine.save':
                    $list=self::text($args['listId']??'',32,true);$li=self::listIndex($s,$list);if($s['lists'][$li]['isDone'])throw new LifeError('Choose an unfinished list.');
                    $frequency=$args['frequency']??'';if(!in_array($frequency,['daily','weekly','monthly'],true))throw new LifeError('Choose a recurrence.');$date=self::validDate($args['startDate']??'');
                    $s['routines']??=[];if(count($s['routines'])>=100)throw new LifeError('Routine limit reached.');$s['routines'][]=['id'=>self::id(),'title'=>self::text($args['title']??'',200,true),'listId'=>$list,'frequency'=>$frequency,'startDate'=>$date,'nextDate'=>$date,'archived'=>false,'createdAt'=>self::now()];break;
                case 'routine.toggle':
                    $i=self::index($s['routines']??[],$id);$s['routines'][$i]['archived']=!$s['routines'][$i]['archived'];if(!$s['routines'][$i]['archived']){$today=(new DateTimeImmutable('now',new DateTimeZone(self::$timezone)))->format('Y-m-d');while($s['routines'][$i]['nextDate']<$today)$s['routines'][$i]['nextDate']=self::nextOccurrence($s['routines'][$i]);}break;
                case 'routine.generate':
                    $today=(new DateTimeImmutable('now',new DateTimeZone(self::$timezone)))->format('Y-m-d');$generated=0;
                    foreach($s['routines']??[] as $ri=>$rule){if($rule['archived'])continue;$li=self::listIndex($s,$rule['listId'],true);if($s['lists'][$li]['archived'])continue;
                        while($rule['nextDate']<=$today&&$generated<100){$date=$rule['nextDate'];$key=$rule['id'].':'.$date;$exists=false;foreach($s['tasks'] as $t)if(($t['recurrenceKey']??'')===$key)$exists=true;
                            if(!$exists){if(count($s['tasks'])>=5000)throw new LifeError('Task limit reached. Archive old routines before adding more.');$s['tasks'][]=['id'=>self::id(),'title'=>$rule['title'],'listId'=>$rule['listId'],'position'=>count($s['tasks']),'notes'=>'','priority'=>'normal','labels'=>['Routine'],'dueDate'=>$date,'blocker'=>'','checklist'=>[],'archived'=>false,'recurrenceKey'=>$key,'createdAt'=>self::now(),'updatedAt'=>self::now()];}$generated++;
                            $rule['nextDate']=self::nextOccurrence($rule);
                        }$s['routines'][$ri]=$rule;
                    }break;
                case 'quarter.review':
                    $quarter=self::text($args['quarter']??'',7,true);if(!preg_match('/^\d{4}-Q[1-4]$/',$quarter))throw new LifeError('Choose a quarter.');$s['quarterReviews'][$quarter]=['quarter'=>$quarter,'wins'=>self::text($args['wins']??'',10000),'lessons'=>self::text($args['lessons']??'',10000),'next'=>self::text($args['next']??'',10000),'updatedAt'=>self::now()];break;
                case 'goal.approve':
                    $i=self::index($s['goals']??[],$id);if($s['goals'][$i]['archived'])throw new LifeError('This goal is archived.');
                    $s['goals'][$i]['completed']=true;$s['goals'][$i]['approval']=['by'=>$actor,'at'=>self::now()];break;
                case 'task.approve':
                    $i=self::index($s['tasks'],$id);$li=self::listIndex($s,$s['tasks'][$i]['listId']);
                    if($s['tasks'][$i]['archived']||$s['lists'][$li]['name']!=='Review')throw new LifeError('Only tasks in Review can be approved.');
                    $done=null;foreach($s['lists'] as $l)if(!$l['archived']&&$l['isDone']&&($l['boardId']??$s['board']['id'])===($s['lists'][$li]['boardId']??$s['board']['id']))$done=$l['id'];if(!$done)throw new LifeError('The Done list is missing.');
                    $s['tasks'][$i]['listId']=$done;$s['tasks'][$i]['approval']=['by'=>$actor,'at'=>self::now()];self::reorder($s['tasks'],$id,count($s['tasks']),$done);break;
                case 'task.complete':
                    $i=self::index($s['tasks'],$id);if($s['tasks'][$i]['archived'])throw new LifeError('Restore this task before editing.');
                    if (!is_bool($args['done']??null)) throw new LifeError('Choose a completion state.');
                    $destination=null;foreach($s['lists'] as $list)if(!$list['archived']&&$list['isDone']===$args['done']&&($list['boardId']??$s['board']['id'])===($s['lists'][self::listIndex($s,$s['tasks'][$i]['listId'])]['boardId']??$s['board']['id'])){$destination=$list['id'];break;}
                    if($destination===null)throw new LifeError('No destination list is available.');
                    $s['tasks'][$i]['listId']=$destination;$s['tasks'][$i]['completedAt']=$args['done']?self::now():null;if($role==='partner'&&$args['done'])$s['tasks'][$i]['approval']=['by'=>$actor,'at'=>self::now()];else unset($s['tasks'][$i]['approval']);self::reorder($s['tasks'],$id,count($s['tasks']),$destination);break;
                case 'goal.archive': case 'goal.restore':
                    $i=self::index($s['goals']??[],$id);if($action==='goal.archive'){foreach($s['goals'] as $child)if(!$child['archived']&&$child['parentId']===$id)throw new LifeError('Archive linked goals first.');}$s['goals'][$i]['archived']=$action==='goal.archive';$s['goals'][$i]['updatedAt']=self::now();break;
                case 'goal.save':
                    $goals=$s['goals']??[];$type=$args['type']??'quarter';
                    if (!in_array($type,['quarter','month','week','adhoc'],true)) throw new LifeError('Choose a goal period.');
                    $parent=self::text($args['parentId']??'',32);
                    if ($parent!=='') {$pi=self::index($goals,$parent);$required=['month'=>'quarter','week'=>'month'];if (!isset($required[$type]) || $goals[$pi]['type']!==$required[$type] || $goals[$pi]['archived']) throw new LifeError('Link a monthly goal to a quarter, or a weekly goal to a month.');}
                    $period=self::text($args['period']??'',10);
                    if ($type==='quarter' && !preg_match('/^\d{4}-Q[1-4]$/',$period)) throw new LifeError('Choose a quarter, for example 2026-Q4.');
                    if ($type==='month' && !preg_match('/^\d{4}-(0[1-9]|1[0-2])$/',$period)) throw new LifeError('Choose a month, for example 2026-10.');
                    if ($type==='week') $period=self::validWeek($period);
                    if ($parent!=='') { $pp=$goals[$pi]['period'];if ($type==='month' && (substr($period,0,4)!==substr($pp,0,4) || (int)ceil((int)substr($period,5,2)/3)!==(int)substr($pp,-1))) throw new LifeError('This month must be within the parent quarter.');if($type==='week' && substr($period,0,7)!==$pp)throw new LifeError('Choose the month containing this sprint Monday.');}
                    $item=['title'=>self::text($args['title']??'',200,true),'notes'=>self::text($args['notes']??'',10000),'type'=>$type,'period'=>$period,'parentId'=>$parent,'category'=>self::text($args['category']??'Personal',60,true),'completed'=>($args['completed']??false)===true,'updatedAt'=>self::now()];
                    if ($id==='') {if(count($goals)>=1000)throw new LifeError('Goal limit reached.');$item+=['id'=>self::id(),'createdAt'=>self::now(),'archived'=>false];$goals[]=$item;}
                    else {$i=self::index($goals,$id);if($goals[$i]['archived'])throw new LifeError('This goal is archived.');if($parent===$id)throw new LifeError('A goal cannot be its own parent.');foreach($goals as $child)if(!$child['archived']&&$child['parentId']===$id&&($type!==$goals[$i]['type']||$period!==$goals[$i]['period']))throw new LifeError('Keep the period type while this goal has linked goals.');$goals[$i]=array_merge($goals[$i],$item);}
                    $s['goals']=$goals;break;
                case 'review.save':
                    $week=self::validWeek($args['week']??'');$s['reviews'][$week]=['week'=>$week,'wins'=>self::text($args['wins']??'',10000),'obstacles'=>self::text($args['obstacles']??'',10000),'next'=>self::text($args['next']??'',10000),'updatedAt'=>self::now()];break;
                case 'board.refine':
                    $idea=null;
                    foreach ($s['lists'] as &$list) if (!$list['archived'] && $list['name']==='Inbox') {$list['name']='Idea Box';$idea=$list['id'];$list['updatedAt']=self::now();} unset($list);
                    if ($idea!==null) foreach ($s['lists'] as &$list) if (!$list['archived'] && $list['name']==='Backlog') {
                        foreach ($s['tasks'] as &$task) if ($task['listId']===$list['id']) {$task['listId']=$idea;$task['position']=count($s['tasks'])+$task['position'];$task['updatedAt']=self::now();} unset($task);
                        $list['archived']=true;$list['updatedAt']=self::now();
                    } unset($list);break;
                case 'task.rename':
                    $i=self::index($s['tasks'],$id);
                    if ($s['tasks'][$i]['archived']) throw new LifeError('Restore this task before editing.');
                    $s['tasks'][$i]['title']=self::text($args['title']??'',200,true);$s['tasks'][$i]['updatedAt']=self::now();break;
                case 'checklist.toggle':
                    $i=self::index($s['tasks'],$id);
                    if ($s['tasks'][$i]['archived']) throw new LifeError('Restore this task before editing.');
                    $j=self::index($s['tasks'][$i]['checklist'],$args['itemId']??'');
                    if (!is_bool($args['done']??null)) throw new LifeError('Choose a checklist state.');
                    $s['tasks'][$i]['checklist'][$j]['done']=$args['done'];$s['tasks'][$i]['updatedAt']=self::now();break;
                case 'task.save':
                    $listId=self::text($args['listId']??'',32,true); self::listIndex($s,$listId);
                    $effort=$args['effortMinutes']??null;if($effort!==null&&(!is_int($effort)||$effort<0||$effort>10080))throw new LifeError('Estimate between 0 and 10080 minutes.');
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
                    if(array_key_exists('notesDelta',$args))$item['notesDelta']=life_task_delta($args['notesDelta'],$item['notes']);
                    elseif(array_key_exists('notes',$args)&&$id!==''){$old=$s['tasks'][self::index($s['tasks'],$id)];if(($old['notes']??'')!==$item['notes'])$item['notesDelta']=null;}
                    $prior=$id!==''?$s['tasks'][self::index($s['tasks'],$id)]:[];
                    $time=$args['dueTime']??($prior['dueTime']??'');$reminder=array_key_exists('reminderMinutes',$args)?$args['reminderMinutes']:($prior['reminderMinutes']??null);
                    if(!is_string($time)||($time!==''&&!preg_match('/^([01]\d|2[0-3]):[0-5]\d$/',$time)))throw new LifeError('Choose a valid due time.');
                    if($reminder!==null&&(!is_int($reminder)||!in_array($reminder,[0,5,15,30,60,1440],true)))throw new LifeError('Choose a valid reminder.');
                    if($due===''){$time='';$reminder=null;}
                    if($reminder!==null&&$time==='')throw new LifeError('Choose a due date and time for the reminder.');
                    $color=$args['color']??($prior['color']??'pink');if(!in_array($color,['pink','blue','mint','peach','lavender','neutral'],true))throw new LifeError('Choose a card color.');$item['color']=$color;
                    $item['dueTime']=$time;$item['reminderMinutes']=$reminder;
                    if($effort!==null)$item['effortMinutes']=$effort;
                    if (isset($args['goalId'])) {$goalId=self::text($args['goalId'],32);if($goalId!==''){ $gi=self::index($s['goals']??[],$goalId);if($s['goals'][$gi]['archived'])throw new LifeError('Choose an active goal.');}$item['goalId']=$goalId;}
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
                case 'task.schedule':
                    $i=self::index($s['tasks'],$id);
                    if ($s['tasks'][$i]['archived']) throw new LifeError('Restore this task before scheduling it.');
                    $date=$args['date']??''; $time=$args['time']??''; $minutes=$args['minutes']??60;
                    if (!is_string($date) || ($date!=='' && (!preg_match('/^\d{4}-\d{2}-\d{2}$/',$date) || !checkdate((int)substr($date,5,2),(int)substr($date,8,2),(int)substr($date,0,4))))) throw new LifeError('Choose a valid work date.');
                    if ($date!=='' && (!is_string($time) || !preg_match('/^([01]\d|2[0-3]):[0-5]\d$/',$time))) throw new LifeError('Choose a valid start time.');
                    if (!is_int($minutes) || $minutes<5 || $minutes>1440) throw new LifeError('Work blocks must be between 5 and 1440 minutes.');
                    if ($date!=='' && (int)substr($time,0,2)*60+(int)substr($time,3,2)+$minutes>1440) throw new LifeError('Keep this work block within one day.');
                    $s['tasks'][$i]['schedule']=$date===''?null:['date'=>$date,'time'=>$time,'minutes'=>$minutes];
                    $s['tasks'][$i]['updatedAt']=self::now(); break;
                case 'task.move':
                    $i=self::index($s['tasks'],$id); $listId=self::text($args['listId']??'',32,true); self::listIndex($s,$listId);
                    if ($s['tasks'][$i]['archived']) throw new LifeError('Restore this task before moving it.');
                    $s['tasks'][$i]['listId']=$listId;unset($s['tasks'][$i]['boardArchive']); self::reorder($s['tasks'],$id,(int)($args['position']??9999),$listId); break;
                case 'task.archive': case 'task.restore':
                    $i=self::index($s['tasks'],$id);
                    if ($action==='task.restore') {
                        $listId=$args['listId']??$s['tasks'][$i]['listId']; self::listIndex($s,$listId); $s['tasks'][$i]['listId']=$listId;unset($s['tasks'][$i]['boardArchive']);
                    }
                    $s['tasks'][$i]['archived']=$action==='task.archive'; $s['tasks'][$i]['updatedAt']=self::now(); break;
                case 'list.save':
                    $name=self::text($args['name']??'',80,true);
                    if ($id==='') {
                        if (count($s['lists'])>=50) throw new LifeError('The board has reached its list limit.');
                        $boardId=$args['boardId']??$s['board']['id'];$bi=self::index($s['boards'],$boardId);if($s['boards'][$bi]['archived'])throw new LifeError('Choose an active board.');$s['lists'][]=['id'=>self::id(),'boardId'=>$boardId,'name'=>$name,'position'=>count($s['lists']),'archived'=>false,'isDone'=>false,'createdAt'=>self::now(),'updatedAt'=>self::now()];
                    } else { $i=self::listIndex($s,$id); if(($s['accountabilityEnabled']??false)&&$s['lists'][$i]['name']==='Review'&&$name!=='Review')throw new LifeError('Keep the Review list for partner approval.');$s['lists'][$i]['name']=$name; $s['lists'][$i]['updatedAt']=self::now(); }
                    break;
                case 'list.move': self::listIndex($s,$id); self::reorder($s['lists'],$id,(int)($args['position']??0)); break;
                case 'list.archive': case 'list.restore':
                    $i=self::listIndex($s,$id,true);if($action==='list.restore'){foreach($s['boards'] as $b)if($b['id']===($s['lists'][$i]['boardId']??$s['board']['id'])&&$b['archived'])throw new LifeError('Restore this board before restoring its lists.');}
                    if ($action==='list.archive') {
                        if(($s['accountabilityEnabled']??false)&&$s['lists'][$i]['name']==='Review')throw new LifeError('Keep Review active for your partner.');
                        if ($s['lists'][$i]['isDone']) throw new LifeError('Keep the completion list active. You can rename it.');
                        foreach ($s['tasks'] as $t) if ($t['listId']===$id && !$t['archived']) throw new LifeError('Move or archive the tasks in this list first.');
                    }
                    $s['lists'][$i]['archived']=$action==='list.archive'; $s['lists'][$i]['updatedAt']=self::now(); break;
                case 'sprint.save':
                    $week=self::validWeek($args['week']??'');
                    $ids=$args['taskIds']??[];
                    if (!is_array($ids) || count($ids)>500) throw new LifeError('Choose valid sprint tasks.');
                    foreach ($ids as $taskId) self::index($s['tasks'],$taskId);
                    $capacity=$args['capacityMinutes']??($s['sprints'][$week]['capacityMinutes']??0);if(!is_int($capacity)||$capacity<0||$capacity>10080)throw new LifeError('Choose a weekly capacity between 0 and 168 hours.');
                    $s['sprints'][$week]=['capacityMinutes'=>$capacity,'id'=>$s['sprints'][$week]['id']??self::id(),'week'=>$week,'goal'=>self::text($args['goal']??'',2000),'taskIds'=>array_values(array_unique($ids)),'updatedAt'=>self::now()]; break;
                default: throw new LifeError('Unknown board action.',400);
            }
            $s['activity']??=[];$s['activity'][]=['id'=>self::id(),'action'=>$action,'recordId'=>$id,'actor'=>$actor,'at'=>self::now()];$s['activity']=array_slice($s['activity'],-2000);
            $q=$this->db->prepare('UPDATE life_board SET state=?,version=version+1,updated_at=? WHERE id=? AND version=?');
            $q->execute([json_encode($s,JSON_THROW_ON_ERROR),self::now(),$this->tenantId,$version]);
            if ($q->rowCount()!==1) throw new LifeError('The board changed while saving. Reload the latest board.',409);
            $ownsTransaction&&$this->db->commit();
            if($ownsTransaction)LifeGoogleSync::enqueue($this);
            return $this->read();
        } catch (Throwable $e) { if ($ownsTransaction&&$this->db->inTransaction()) $this->db->rollBack(); throw $e; }
    }
    private static function nextOccurrence(array $rule): string {$d=new DateTimeImmutable($rule['nextDate']);if($rule['frequency']!=='monthly')return $d->modify($rule['frequency']==='daily'?'+1 day':'+7 days')->format('Y-m-d');$next=$d->modify('first day of next month');$day=min((int)substr($rule['startDate'],8,2),(int)$next->format('t'));return $next->setDate((int)$next->format('Y'),(int)$next->format('m'),$day)->format('Y-m-d');}
    private static function validDate(mixed $date): string {if(!is_string($date)||!preg_match('/^\d{4}-\d{2}-\d{2}$/',$date)||!checkdate((int)substr($date,5,2),(int)substr($date,8,2),(int)substr($date,0,4)))throw new LifeError('Choose a valid date.');return $date;}
    private static function validWeek(mixed $week): string {
        if (!is_string($week) || !preg_match('/^\d{4}-\d{2}-\d{2}$/',$week)) throw new LifeError('Choose a valid sprint week.');
        $d=DateTimeImmutable::createFromFormat('!Y-m-d',$week,new DateTimeZone(self::$timezone));
        if (!$d || $d->format('Y-m-d')!==$week || $d->format('N')!=='1') throw new LifeError('Sprints start on Monday.');
        return $week;
    }
    public function clearThrottle(string $ip): void {$this->db->prepare('DELETE FROM life_login_attempt WHERE ip_hash=?')->execute([hash('sha256',$ip)]);}
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

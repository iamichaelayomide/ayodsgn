<?php
declare(strict_types=1);
require_once __DIR__.'/../life/store.php';
require_once __DIR__.'/../life/accounts.php';
/** Tab records never use personal LifeStore rows. Every write is versioned and audited. */
final class TabTeam {
    const ICONS=['flag','research','people','design','build','launch','growth','check'];
    const STAGES=['backlog','ready','progress','review','done'];
    const ADMINS=['femo.arek@gmail.com','iamichaelayomide@gmail.com'];
    const SEED=['femo.arek@gmail.com','iamichaelayomide@gmail.com','arekeayomide@gmail.com','obayemibankole@gmail.com','akinloluwabanks2@gmail.com','adeoyegideon1@gmail.com'];
    public function __construct(public PDO $db, public string $workspace='tab') {
        $db->exec('CREATE TABLE IF NOT EXISTS tab_workspace (id VARCHAR(32) PRIMARY KEY, version INT NOT NULL, state LONGTEXT NOT NULL)');
        $db->exec('CREATE TABLE IF NOT EXISTS tab_member (workspace VARCHAR(32) NOT NULL, email VARCHAR(254) NOT NULL, account_id INT NULL, name VARCHAR(200) NOT NULL, role VARCHAR(12) NOT NULL, status VARCHAR(12) NOT NULL, invite_hash VARCHAR(64) NOT NULL, expires BIGINT NOT NULL, PRIMARY KEY(workspace,email))');
        $db->exec('CREATE TABLE IF NOT EXISTS tab_event (workspace VARCHAR(32) NOT NULL, event_no INT NOT NULL, actor VARCHAR(254) NOT NULL, actor_name VARCHAR(200) NOT NULL, kind VARCHAR(30) NOT NULL, item_id VARCHAR(254) NOT NULL, title VARCHAR(200) NOT NULL, changes LONGTEXT NOT NULL, created_at VARCHAR(30) NOT NULL, PRIMARY KEY(workspace,event_no))');
        $db->exec('CREATE TABLE IF NOT EXISTS tab_bridge (token_hash VARCHAR(64) PRIMARY KEY, state_hash VARCHAR(64) NOT NULL, account_id INT NOT NULL, verified INT NOT NULL, expires BIGINT NOT NULL)');
    }
    public function identityStamp(int $account):string {$accounts=new LifeAccounts($this->db);$a=$accounts->find($account);if(!$a)return '';return hash('sha256',json_encode([$a['id'],$a['email'],$a['google_sub'],$a['created_at'],$accounts->credentialFingerprint($account)],JSON_THROW_ON_ERROR));}
    public function seed():void {
        if($this->workspace!=='tab')throw new LifeError('Workspace unavailable.',404);
        $q=$this->db->prepare('SELECT id FROM tab_workspace WHERE id=?');$q->execute([$this->workspace]);if($q->fetchColumn())return;
        $this->db->beginTransaction();try {
            $state=['name'=>'Tab','timezone'=>'Africa/Lagos','tasks'=>[],'goals'=>[],'milestones'=>[],'comments'=>[]];
            for($i=0;$i<5;$i++)$state['milestones'][]=['id'=>LifeStore::id(),'title'=>'','description'=>'','icon'=>self::ICONS[$i],'owner'=>'','targetDate'=>'','position'=>$i,'archived'=>false];
            $this->db->prepare('INSERT INTO tab_workspace VALUES (?,1,?)')->execute([$this->workspace,json_encode($state,JSON_THROW_ON_ERROR)]);
            foreach(self::SEED as $email)$this->db->prepare('INSERT INTO tab_member VALUES (?,?,NULL,?,?,?, ?,0)')->execute([$this->workspace,$email,'',in_array($email,self::ADMINS,true)?'admin':'member','pending','']);
            $this->db->commit();
        }catch(Throwable $e){if($this->db->inTransaction())$this->db->rollBack();$q->execute([$this->workspace]);if(!$q->fetchColumn())throw $e;}
    }
    private function row():array {$q=$this->db->prepare('SELECT * FROM tab_workspace WHERE id=?');$q->execute([$this->workspace]);$r=$q->fetch(PDO::FETCH_ASSOC);if(!$r)throw new LifeError('Team unavailable.',404);return ['version'=>(int)$r['version'],'state'=>json_decode($r['state'],true,64,JSON_THROW_ON_ERROR)];}
    public function member(int $account):array {$q=$this->db->prepare("SELECT * FROM tab_member WHERE workspace=? AND account_id=? AND status='active'");$q->execute([$this->workspace,$account]);$m=$q->fetch(PDO::FETCH_ASSOC);if(!$m)throw new LifeError('You do not have access to Tab. Ask an admin for an invitation.',403);return $m;}
    private function members():array {$q=$this->db->prepare('SELECT email,name,role,status,account_id AS accountId,expires FROM tab_member WHERE workspace=? ORDER BY role,email');$q->execute([$this->workspace]);return $q->fetchAll(PDO::FETCH_ASSOC);}
    public function read(int $account):array {$me=$this->member($account);return $this->row()+['me'=>array_intersect_key($me,array_flip(['email','name','role'])),'members'=>$this->members()];}
    public function events(int $account,int $before=0,string $item=''):array {$this->member($account);$sql='SELECT * FROM tab_event WHERE workspace=?';$args=[$this->workspace];if($before>0){$sql.=' AND event_no<?';$args[]=$before;}if($item!==''){$sql.=' AND item_id=?';$args[]=$item;}$q=$this->db->prepare($sql.' ORDER BY event_no DESC LIMIT 51');$q->execute($args);$rows=$q->fetchAll(PDO::FETCH_ASSOC);$more=count($rows)>50;$rows=array_slice($rows,0,50);foreach($rows as &$r){$r['sequence']=(int)$r['event_no'];unset($r['event_no']);$r['changes']=json_decode($r['changes'],true);}return ['events'=>$rows,'next'=>$more?(int)end($rows)['sequence']:null];}
    private function commit(array $snapshot,array $s,array $actor,string $kind,string $id,string $title,array $changes):void {
        $q=$this->db->prepare('UPDATE tab_workspace SET version=version+1,state=? WHERE id=? AND version=?');$q->execute([json_encode($s,JSON_THROW_ON_ERROR),$this->workspace,$snapshot['version']]);if($q->rowCount()!==1)throw new LifeError('Someone updated Tab. Your draft is kept; refresh before saving again.',409);
        $this->db->prepare('INSERT INTO tab_event VALUES (?,?,?,?,?,?,?,?,?)')->execute([$this->workspace,$snapshot['version']+1,$actor['email'],$actor['name']?:$actor['email'],$kind,$id,mb_substr($title,0,200),json_encode($changes,JSON_THROW_ON_ERROR),LifeStore::now()]);
    }
    public function join(int $account,string $token,bool $verified):array {
        $a=(new LifeAccounts($this->db))->find($account);if(!$a)throw new LifeError('Sign in first.',401);$email=strtolower($a['email']);
        $this->db->beginTransaction();try {
            $q=$this->db->prepare('SELECT * FROM tab_member WHERE workspace=? AND email=?');$q->execute([$this->workspace,$email]);$m=$q->fetch(PDO::FETCH_ASSOC);if(!$m||$m['status']==='removed')throw new LifeError('This account has no Tab invitation.',403);
            if($m['status']==='active'){if((int)$m['account_id']!==$account)throw new LifeError('Use the account that accepted this invitation.',403);$this->db->commit();return $this->read($account);}
            $bootstrap=$m['role']==='admin'&&in_array($email,self::ADMINS,true)&&$verified;
            if(!$bootstrap&&($token===''||(int)$m['expires']<time()||!hash_equals($m['invite_hash'],hash('sha256',$token))))throw new LifeError('An unexpired invitation for this email is required.',403);
            $snapshot=$this->row();$this->db->prepare("UPDATE tab_member SET account_id=?,name=?,status='active',invite_hash='',expires=0 WHERE workspace=? AND email=?")->execute([$account,$a['name'],$this->workspace,$email]);
            $this->commit($snapshot,$snapshot['state'],['email'=>$email,'name'=>$a['name']],'member.join',$email,'Joined Tab',['status'=>['pending','active']]);$this->db->commit();return $this->read($account);
        }catch(Throwable $e){$this->db->rollBack();throw $e;}
    }
    private function index(array $rows,string $id):int {foreach($rows as $i=>$r)if($r['id']===$id)return $i;throw new LifeError('Item not found in this team.',404);}
    private function owner(string $email):string {if($email==='')return '';foreach($this->members() as $m)if($m['email']===$email&&$m['status']!=='removed')return $email;throw new LifeError('Choose a team member.');}
    private function link(array $s,string $kind,string $id):string {if($id==='')return ''; $i=$this->index($s[$kind],$id);if($s[$kind][$i]['archived']??false)throw new LifeError('Choose an active linked item.');return $id;}
    private function date(mixed $v):string {$v=LifeStore::text($v??'',10);if($v==='')return ''; $d=DateTimeImmutable::createFromFormat('!Y-m-d',$v);if(!$d||$d->format('Y-m-d')!==$v)throw new LifeError('Choose a valid date.');return $v;}
    public function mutate(int $account,int $version,string $action,array $a):array {
        $this->db->beginTransaction();try {
            $me=$this->member($account);$snapshot=$this->row();if($snapshot['version']!==$version)throw new LifeError('Someone updated Tab. Your draft is kept; refresh before saving again.',409);$s=$snapshot['state'];$id=LifeStore::text($a['id']??'',254);$title='';$changes=[];$extra=[];
            if(str_starts_with($action,'member.')){
                if($me['role']!=='admin')throw new LifeError('Only admins manage membership.',403);$email=LifeAccounts::email($a['email']??'');$title=$email;$id=$email;
                $q=$this->db->prepare('SELECT * FROM tab_member WHERE workspace=? AND email=?');$q->execute([$this->workspace,$email]);$m=$q->fetch(PDO::FETCH_ASSOC);
                if($action==='member.invite'){
                    if($m&&$m['status']==='active')throw new LifeError('This member already has access.',409);
                    $role=$a['role']??($m['role']??'member');if(!in_array($role,['admin','member'],true))throw new LifeError('Choose a member role.');
                    $token=bin2hex(random_bytes(32));$expires=time()+7*86400;
                    if($m)$this->db->prepare("UPDATE tab_member SET role=?,status='pending',invite_hash=?,expires=?,account_id=NULL WHERE workspace=? AND email=?")->execute([$role,hash('sha256',$token),$expires,$this->workspace,$email]);else $this->db->prepare('INSERT INTO tab_member VALUES (?,?,NULL,?,?,?, ?,?)')->execute([$this->workspace,$email,'',$role,'pending',hash('sha256',$token),$expires]);
                    $extra=['invitation'=>['email'=>$email,'role'=>$role,'url'=>'https://tab.ayodsgn.com/#invite='.$token,'expires'=>gmdate('c',$expires),'subject'=>'Join Tab — our shared team workspace','text'=>"You’re invited to Tab. Plan our work, track goals and collaborate on our roadmap. Sign in with $email using this invitation link. The link expires in seven days."]];$changes=['invitation'=>'Prepared; not emailed','role'=>$role];
                }elseif(in_array($action,['member.role','member.remove'],true)){
                    if(!$m)throw new LifeError('Member not found.',404);$role=$action==='member.role'?($a['role']??''):$m['role'];if(!in_array($role,['admin','member'],true))throw new LifeError('Choose a member role.');
                    if($m['status']==='active'&&$m['role']==='admin'&&($action==='member.remove'||$role!=='admin')){$q=$this->db->prepare("SELECT COUNT(*) FROM tab_member WHERE workspace=? AND role='admin' AND status='active'");$q->execute([$this->workspace]);if((int)$q->fetchColumn()<=1)throw new LifeError('Keep at least one active admin.',409);}
                    $status=$action==='member.remove'?'removed':$m['status'];$this->db->prepare("UPDATE tab_member SET role=?,status=?,invite_hash='',expires=0 WHERE workspace=? AND email=?")->execute([$role,$status,$this->workspace,$email]);$changes=['role'=>[$m['role'],$role],'status'=>[$m['status'],$status]];
                }else throw new LifeError('Unknown membership action.',404);
            }elseif($action==='comment.add'){
                $kind=$a['kind']??'';if(!in_array($kind,['tasks','goals','milestones'],true))throw new LifeError('Choose an item to discuss.');$i=$this->index($s[$kind],$id);$title=$s[$kind][$i]['title']?:'Untitled milestone';if(count($s['comments'])>=10000)throw new LifeError('Comment limit reached.');$text=LifeStore::text($a['text']??'',6000,true);$s['comments'][]=['id'=>LifeStore::id(),'kind'=>$kind,'itemId'=>$id,'text'=>$text,'actor'=>$me['email'],'name'=>$me['name'],'createdAt'=>LifeStore::now()];$changes=['comment'=>$text];
            }elseif($action==='milestone.reorder'){
                $ids=$a['ids']??[];$active=array_values(array_filter($s['milestones'],fn($r)=>!$r['archived']));$expected=array_column($active,'id');$sorted=$ids;sort($sorted);sort($expected);if($sorted!==$expected)throw new LifeError('Refresh the roadmap before reordering.',409);foreach($s['milestones'] as &$r)if(!$r['archived'])$r['position']=array_search($r['id'],$ids,true);unset($r);$title='Roadmap order';$id='roadmap';$changes=['order'=>$ids];
            }else {
                $parts=explode('.',$action);$kind=['task'=>'tasks','goal'=>'goals','milestone'=>'milestones'][$parts[0]]??null;if(!$kind||!in_array($parts[1]??'',['save','archive','restore'],true))throw new LifeError('Unknown action.',404);
                $existing=$id!=='';$i=$existing?$this->index($s[$kind],$id):count($s[$kind]);$old=$existing?$s[$kind][$i]:[];
                if($parts[1]!=='save'){if(!$existing)throw new LifeError('Item not found.',404);$new=$old;$new['archived']=$parts[1]==='archive';}
                else{
                    if(!$existing&&count($s[$kind])>=2000)throw new LifeError('Team item limit reached.');
                    $new=['id'=>$existing?$id:LifeStore::id(),'title'=>LifeStore::text($a['title']??'',200,$kind!=='milestones'),'description'=>LifeStore::text($a['description']??'',12000),'archived'=>$old['archived']??false,'createdAt'=>$old['createdAt']??LifeStore::now(),'updatedAt'=>LifeStore::now()];
                    if($new['archived'])throw new LifeError('Restore this item before editing.');
                    if($kind==='tasks'){
                        $stage=$a['stage']??($old['stage']??'backlog');if(!in_array($stage,self::STAGES,true))throw new LifeError('Choose a valid task status.');
                        $new+=['assignee'=>$this->owner(LifeStore::text($a['assignee']??'',254)),'dueDate'=>$this->date($a['dueDate']??''),'blocked'=>($a['blocked']??false)===true,'stage'=>$stage,'goalId'=>$this->link($s,'goals',LifeStore::text($a['goalId']??'',32)),'milestoneId'=>$this->link($s,'milestones',LifeStore::text($a['milestoneId']??'',32))];
                        if($stage==='done'&&($old['stage']??'')!=='done'&&($me['role']!=='admin'||($old['stage']??'')!=='review'))throw new LifeError('Only admins can approve a task from Review to Done.',403);
                        if(($old['stage']??'')==='done'){foreach(['title','description','assignee','dueDate','blocked','goalId','milestoneId'] as $field)if($old[$field]!==$new[$field])$new['stage']='review';}
                        $new['approvedBy']=$new['stage']==='done'?(($old['approvedBy']??'')?:$me['email']):'';
                    }elseif($kind==='goals'){
                        $type=$a['type']??'month';if(!in_array($type,['quarter','month','week'],true))throw new LifeError('Choose a goal period.');$period=LifeStore::text($a['period']??'',10,true);
                        if($type==='quarter'&&!preg_match('/^\d{4}-Q[1-4]$/D',$period))throw new LifeError('Use a quarter such as 2026-Q4.');if($type==='month'&&(!preg_match('/^\d{4}-(0[1-9]|1[0-2])$/D',$period)))throw new LifeError('Choose a valid month.');if($type==='week'){if($this->date($period)!==$period||(new DateTimeImmutable($period))->format('N')!=='1')throw new LifeError('Choose the Monday of the goal week.');}
                        $parentId=LifeStore::text($a['parentId']??'',32);if($parentId!==''){$pi=$this->index($s['goals'],$parentId);$p=$s['goals'][$pi];if($p['archived']||$parentId===$id||$p['type']!==($type==='week'?'month':($type==='month'?'quarter':'')))throw new LifeError('Link a monthly goal to a quarter, or a weekly goal to a month.');$start=$type==='week'?$period:$period.'-01';$year=substr($start,0,4);$month=(int)substr($start,5,2);$expected=$type==='week'?substr($start,0,7):$year.'-Q'.ceil($month/3);if($p['period']!==$expected)throw new LifeError('Parent goal must cover this period.');}
                        // Changing a parent’s period would orphan its linked children.
                        foreach($s['goals'] as $child)if(!$child['archived']&&($child['parentId']??'')===$id&&$existing&&(($old['type']??'')!==$type||($old['period']??'')!==$period))throw new LifeError('Move linked goals before changing this period.');
                        $status=$a['status']??'todo';if(!in_array($status,['todo','progress','done'],true))throw new LifeError('Choose a goal status.');$new+=['type'=>$type,'period'=>$period,'parentId'=>$parentId,'status'=>$status];
                    }else{
                        $icon=$a['icon']??'flag';if(!in_array($icon,self::ICONS,true))throw new LifeError('Choose an available icon.');$new+=['goalId'=>$this->link($s,'goals',LifeStore::text($a['goalId']??'',32)),'icon'=>$icon,'owner'=>$this->owner(LifeStore::text($a['owner']??'',254)),'targetDate'=>$this->date($a['targetDate']??''),'position'=>$old['position']??count($s['milestones'])];
                    }
                }
                $s[$kind][$i]=$new;$id=$new['id'];$title=$new['title']?:'Untitled milestone';foreach($new as $field=>$value)if(!in_array($field,['updatedAt','createdAt'],true)&&($old[$field]??null)!==$value)$changes[$field]=[$old[$field]??null,$value];
            }
            $this->commit($snapshot,$s,$me,$action,$id,$title,$changes);$this->db->commit();return $this->read($account)+$extra;
        }catch(Throwable $e){if($this->db->inTransaction())$this->db->rollBack();throw $e;}
    }
    public function issueBridge(int $account,string $state,bool $verified):string {if(!preg_match('/^[a-f0-9]{64}$/D',$state))throw new LifeError('Start sign-in from Tab.',403);$token=bin2hex(random_bytes(32));$this->db->prepare('DELETE FROM tab_bridge WHERE expires<?')->execute([time()]);$this->db->prepare('INSERT INTO tab_bridge VALUES (?,?,?,?,?)')->execute([hash('sha256',$token),hash('sha256',$state),$account,$verified?1:0,time()+120]);return $token;}
    public function consumeBridge(string $token,string $state,string $invite=''):array {
        if(!preg_match('/^[a-f0-9]{64}$/D',$token)||!preg_match('/^[a-f0-9]{64}$/D',$state))throw new LifeError('Sign-in expired. Start again.',403);
        $hash=hash('sha256',$token);$q=$this->db->prepare('SELECT * FROM tab_bridge WHERE token_hash=? AND state_hash=? AND expires>=?');$q->execute([$hash,hash('sha256',$state),time()]);$r=$q->fetch(PDO::FETCH_ASSOC);if(!$r)throw new LifeError('Sign-in expired. Start again.',403);$q=$this->db->prepare('DELETE FROM tab_bridge WHERE token_hash=?');$q->execute([$hash]);if($q->rowCount()!==1)throw new LifeError('This sign-in was already used.',403);return $this->join((int)$r['account_id'],$invite,(bool)$r['verified']);
    }
}

<?php
declare(strict_types=1);
require_once __DIR__.'/applications.php';
/** Private outreach workspace. This model never performs external actions. */
final class LifeAyoOS {
 public const PIPELINES=['nysc','freelance','career','ai-testing'];
 public const STAGES=['researched','ready','drafted','replied','conversation','offer','won','closed','sent','submitted','scheduled','bounced','pending','accepted','not-accepted','paused','incomplete'];
 public function __construct(public LifeStore $store){$store->db->exec(file_get_contents(__DIR__.'/migrations/ayo-os.sql'));new LifeApplications($store);}
 public static function requireWorkspace(array $input,int $tenantId):void{if(($input['workspaceId']??null)!==$tenantId)throw new LifeError('Your account changed. Reload Ayo OS before saving.',409);}
 public function read():array{
  $q=$this->store->db->prepare('SELECT version,state FROM life_ayo_os WHERE id=?');$q->execute([$this->store->tenantId]);$r=$q->fetch(PDO::FETCH_ASSOC);
  if(!$r){$s=['schema'=>1,'companies'=>[],'contacts'=>[],'opportunities'=>[],'research'=>[],'drafts'=>[],'approvals'=>[],'communications'=>[],'pipelines'=>[],'statuses'=>[]];try{$this->store->db->prepare('INSERT INTO life_ayo_os VALUES (?,1,?,?)')->execute([$this->store->tenantId,json_encode($s,JSON_THROW_ON_ERROR),LifeStore::now()]);}catch(PDOException $e){$q->execute([$this->store->tenantId]);if(!$q->fetch())throw $e;}return $this->read();}
  $state=json_decode($r['state'],true,128,JSON_THROW_ON_ERROR);foreach(['communications','pipelines','statuses'] as $collection)$state[$collection]=$state[$collection]??[];
  return ['workspaceId'=>$this->store->tenantId,'version'=>(int)$r['version'],'state'=>$state]+$this->documentBank();
 }
 private function documentBank():array{
  $bank=(new LifeApplications($this->store))->read();$s=$bank['state'];$documents=[];$trackers=[];
  foreach($s['trackers'] as $t)if(!($t['archived']??false))$trackers[]=['id'=>$t['id'],'name'=>$t['name']];
  foreach($s['documents'] as $d){try{$this->activeDocument($s,$d['id']);}catch(LifeError){continue;}$documents[]=array_intersect_key($d,array_flip(['id','name','mime','kind','size','trackerId','categoryId','opportunityId','parentId','version','preferred','createdAt','updatedAt']));}
  return ['documents'=>$documents,'documentTrackers'=>$trackers,'documentVersion'=>$bank['version']];
 }
 private function activeDocument(array $s,mixed $id):array{
  $d=LifeApplications::find($s,'documents',$id,true);LifeApplications::find($s,'trackers',$d['trackerId'],true);
  if(($d['categoryId']??'')!=='')LifeApplications::find($s,'categories',$d['categoryId'],true);
  if(($d['opportunityId']??'')!=='')LifeApplications::find($s,'opportunities',$d['opportunityId'],true);return $d;
 }
 private static function item(array $s,string $type,mixed $id):array{return LifeApplications::find($s,$type,$id);}
 private static function choice(mixed $v,array $choices):string{if(!is_string($v)||!in_array($v,$choices,true))throw new LifeError('Choose a valid option.');return $v;}
 public static function snapshot(array $s,string $id):array{
  $d=self::item($s,'drafts',$id);$o=self::item($s,'opportunities',$d['opportunityId']);$c=self::item($s,'contacts',$d['contactId']);$company=self::item($s,'companies',$o['companyId']);$notes=array_map(fn($id)=>self::item($s,'research',$id),$d['researchIds']);
  return ['draft'=>$d,'opportunity'=>$o,'contact'=>$c,'company'=>$company,'research'=>$notes];
 }
 public static function approval(array $s,string $id):?array{
  $last=null;foreach($s['approvals'] as $r)if($r['draftId']===$id)$last=$r;
  if(!$last||$last['decision']!=='approved')return null;
  return hash_equals($last['fingerprint'],hash('sha256',json_encode(self::snapshot($s,$id),JSON_THROW_ON_ERROR)))?$last:null;
 }
 public function mutate(int $version,string $operation,array $args,string $actor):array{
  $this->read();$db=$this->store->db;$owns=!$db->inTransaction();if($owns)$db->beginTransaction();
  try{$current=$this->read();if($current['version']!==$version)throw new LifeError('Ayo OS changed in another tab. Your form is preserved. Reload before saving again.',409);$s=$current['state'];$at=LifeStore::now();$id=$args['id']??'';
   $types=['company.save'=>'companies','contact.save'=>'contacts','opportunity.save'=>'opportunities','research.save'=>'research','draft.save'=>'drafts','communication.save'=>'communications','pipeline.save'=>'pipelines','status.save'=>'statuses'];
   if($operation==='review.decide'){
    $id=LifeApplications::id($id);$snapshot=self::snapshot($s,$id);$decision=self::choice($args['decision']??'',['approved','rejected']);$reason=LifeStore::text($args['reason']??'',2000,$decision==='rejected');
    if($decision==='approved'){
     if(($args['reviewed']??false)!==true)throw new LifeError('Explicitly review the recipient, content, materials and schedule first.',403);
     $d=$snapshot['draft'];$c=$snapshot['contact'];$o=$snapshot['opportunity'];
     if(!$c['email']||!$c['sourceUrl']||!$d['subject']||!$d['body']||!$d['schedule']||(!$o['materials']&&empty($o['documentIds'])))throw new LifeError('Add a sourced recipient, message, materials reference and schedule before approval.');
     $cited=array_filter($snapshot['research'],fn($r)=>$r['kind']==='observation'&&($r['category']??'company')!=='note'&&$r['sourceUrl']!=='');if(!$cited)throw new LifeError('Link at least one sourced observation before approval.');
    }
    if(count($s['approvals'])>=10000)throw new LifeError('Approval history limit reached.');
    $s['approvals'][]=['id'=>LifeStore::id(),'draftId'=>$id,'decision'=>$decision,'reason'=>$reason,'actor'=>$actor,'at'=>$at,'fingerprint'=>hash('sha256',json_encode($snapshot,JSON_THROW_ON_ERROR)),'snapshot'=>$snapshot];
   }else{
    if(!isset($types[$operation]))throw new LifeError('This action is unavailable. Ayo OS does not send or schedule messages.',400);
    $type=$types[$operation];$old=$id!==''?self::item($s,$type,$id):null;$id=$old['id']??LifeStore::id();$r=$old??['id'=>$id,'createdAt'=>$at];$r['updatedAt']=$at;
    $fields=match($type){'companies'=>['name'=>200,'industry'=>100,'about'=>2000,'recentNews'=>2000,'problem'=>2000,'fit'=>2000],'contacts'=>['name'=>200,'role'=>200,'notes'=>2000],'opportunities'=>['title'=>200,'description'=>10000,'notes'=>10000,'materials'=>2000],'research'=>['body'=>10000],'drafts'=>['subject'=>200,'body'=>15000],'communications'=>['subject'=>200,'body'=>15000,'messageId'=>200,'attachments'=>2000,'from'=>500,'to'=>500],'pipelines'=>['name'=>60],'statuses'=>['name'=>60],default=>[]};
    foreach($fields as $field=>$limit)$r[$field]=LifeStore::text($args[$field]??$r[$field]??'',$limit,in_array($field,['name','title','body'],true)&&$type!=='communications');
    if(in_array($type,['pipelines','statuses'],true)){
     $builtins=$type==='pipelines'?['NYSC','Freelance','Career','AI testing']:['Researched','Ready','Drafted','Replied','In discussion','Offer','Accepted','Closed','Sent','Submitted','Scheduled','Delivery failed','Pending','Not accepted','Paused','Incomplete'];
     foreach($builtins as $name)if(mb_strtolower($name)===mb_strtolower($r['name']))throw new LifeError('That label already exists.',409);
     foreach($s[$type] as $row)if($row['id']!==$id&&mb_strtolower($row['name'])===mb_strtolower($r['name']))throw new LifeError('That label already exists.',409);
     if(!$old&&count($s[$type])>=100)throw new LifeError('Use up to 100 custom labels.');
    }
    if($type==='companies')foreach(['website','linkedin','socialUrl'] as $field)$r[$field]=LifeApplications::url($args[$field]??$r[$field]??'');
    if(in_array($type,['contacts','opportunities'],true)){$r['companyId']=$args['companyId']??$r['companyId']??'';self::item($s,'companies',$r['companyId']);}
    if($type==='contacts'){
     if(!$old&&count(array_filter($s['contacts'],fn($c)=>$c['companyId']===$r['companyId']))>=10)throw new LifeError('Use up to ten contacts per company.');
     // Prevent moving contacts referenced by drafts to a different company.
     if($old&&$r['companyId']!==$old['companyId'])throw new LifeError('Create a contact at the other company instead.');
     $r['email']=LifeStore::text($args['email']??$r['email']??'',254);if($r['email']!==''&&!filter_var($r['email'],FILTER_VALIDATE_EMAIL))throw new LifeError('Use a valid professional email address.');
     $r['sourceUrl']=LifeApplications::url($args['sourceUrl']??$r['sourceUrl']??'');$r['linkedin']=LifeApplications::url($args['linkedin']??$r['linkedin']??'');
    }
    if($type==='opportunities'){
     if($old&&$r['companyId']!==$old['companyId'])throw new LifeError('Create an opportunity at the other company instead.');
     $r['pipeline']=self::choice($args['pipeline']??$r['pipeline']??'',array_merge(self::PIPELINES,array_column($s['pipelines'],'id')));$r['stage']=self::choice($args['stage']??$r['stage']??'researched',array_merge(self::STAGES,array_column($s['statuses'],'id')));$r['followUpDate']=LifeApplications::date($args['followUpDate']??$r['followUpDate']??'');
     if(array_key_exists('documentIds',$args)){
      $ids=$args['documentIds'];if(!is_array($ids)||!array_is_list($ids)||count($ids)>20)throw new LifeError('Choose up to 20 documents.');$bank=(new LifeApplications($this->store))->read()['state'];foreach($ids as $docId)$this->activeDocument($bank,$docId);$r['documentIds']=array_values(array_unique($ids));
     }else $r['documentIds']=$r['documentIds']??[];

    }
    if(in_array($type,['research','drafts','communications'],true)){
     $r['opportunityId']=$args['opportunityId']??$r['opportunityId']??'';$o=self::item($s,'opportunities',$r['opportunityId']);if($old&&$r['opportunityId']!==$old['opportunityId'])throw new LifeError('Keep records with their original opportunity.');
    }
    if($type==='communications'){
     // Evidence only: this records observed mail and never performs an external action.
     $r['direction']=self::choice($args['direction']??$r['direction']??'',['sent','received','scheduled']);
     $r['sourceUrl']=LifeApplications::url($args['sourceUrl']??$r['sourceUrl']??'');if($r['sourceUrl']==='')throw new LifeError('Email history needs a source URL.');
     $r['occurredAt']=LifeStore::text($args['occurredAt']??$r['occurredAt']??'',40,true);
     if(!preg_match('/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:Z|[+-]\d{2}:\d{2})$/D',$r['occurredAt']))throw new LifeError('Use a timestamp with seconds and timezone.');
     $date=DateTimeImmutable::createFromFormat('!Y-m-d\TH:i:sP',$r['occurredAt']);$errors=DateTimeImmutable::getLastErrors();
     if(!$date||($errors&&($errors['warning_count']||$errors['error_count']))||($r['occurredAt']!==$date->format('Y-m-d\TH:i:sP')&&$r['occurredAt']!==$date->format('Y-m-d\TH:i:s\Z')))throw new LifeError('Use a valid email timestamp.');
     foreach($s['communications'] as $entry){
      if($entry['id']===$id||$entry['opportunityId']!==$r['opportunityId'])continue;
      $sameMessage=$r['messageId']!==''&&$r['messageId']===($entry['messageId']??'');
      $sameSource=$r['messageId']===''&&($entry['messageId']??'')===''&&$entry['sourceUrl']===$r['sourceUrl']&&$entry['direction']===$r['direction']&&$entry['occurredAt']===$r['occurredAt'];
      if($sameMessage||$sameSource)throw new LifeError('This email is already recorded for this opportunity.',409);
     }
    }
    if($type==='research'){
     $r['category']=self::choice($args['category']??$r['category']??'company',['company','activity','note']);
     $r['kind']=self::choice($args['kind']??$r['kind']??($r['category']==='note'?'hypothesis':'observation'),['observation','hypothesis']);if($r['category']==='note')$r['kind']='hypothesis';$r['sourceUrl']=LifeApplications::url($args['sourceUrl']??$r['sourceUrl']??'');if($r['kind']==='observation'&&$r['sourceUrl']==='')throw new LifeError('Observations need a source URL. Label unsourced ideas as hypotheses.');
    }
    if($type==='drafts'){
     $r['contactId']=$args['contactId']??$r['contactId']??'';$c=self::item($s,'contacts',$r['contactId']);if($c['companyId']!==$o['companyId'])throw new LifeError('Choose a contact at this company.');
     $ids=$args['researchIds']??$r['researchIds']??[];if(!is_array($ids)||!array_is_list($ids)||count($ids)>20)throw new LifeError('Link up to 20 research notes.');foreach($ids as $note){$research=self::item($s,'research',$note);if($research['opportunityId']!==$o['id'])throw new LifeError('Use research from this opportunity.');}$r['researchIds']=array_values(array_unique($ids));
     $r['schedule']=LifeStore::text($args['schedule']??$r['schedule']??'',16);if($r['schedule']!==''){if(!preg_match('/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/D',$r['schedule']))throw new LifeError('Choose a valid schedule.');LifeApplications::date(substr($r['schedule'],0,10));if(substr($r['schedule'],11,2)>'23'||substr($r['schedule'],14,2)>'59')throw new LifeError('Choose a valid time.');}
     $r['timezone']=LifeStore::text($args['timezone']??$r['timezone']??'Africa/Lagos',100,true);if(!in_array($r['timezone'],DateTimeZone::listIdentifiers(),true))throw new LifeError('Use a valid timezone.');
    }
    if(!$old&&count($s[$type])>=2000)throw new LifeError('Workspace record limit reached.');$found=false;foreach($s[$type] as $i=>$row)if($row['id']===$id){$s[$type][$i]=$r;$found=true;break;}if(!$found)$s[$type][]=$r;
   }
   $json=json_encode($s,JSON_THROW_ON_ERROR);if(strlen($json)>20*1024*1024)throw new LifeError('Workspace storage limit reached.');$q=$db->prepare('UPDATE life_ayo_os SET version=version+1,state=?,updated_at=? WHERE id=? AND version=?');$q->execute([$json,$at,$this->store->tenantId,$version]);if($q->rowCount()!==1)throw new LifeError('Ayo OS changed while saving. Reload before retrying.',409);if($owns)$db->commit();return $this->read()+['recordId'=>$id];
  }catch(Throwable $e){if($owns&&$db->inTransaction())$db->rollBack();throw $e;}
 }
}

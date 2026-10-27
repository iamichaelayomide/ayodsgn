<?php
declare(strict_types=1);
require_once __DIR__.'/ayo-os.php';
function life_ayo_os_route(LifeStore $store,string $method,string $action,array $input,string $actor):never{
 $os=new LifeAyoOS($store);
 if($method==='GET'&&$action==='ayo-os')life_json(life_ayo_os_public($os->read()));
 if($method==='POST'&&$action==='ayo-os.mutate'){
  LifeAyoOS::requireWorkspace($input,$store->tenantId);
  if(!is_int($input['version']??null)||!is_array($input['args']??null))throw new LifeError('Reload Ayo OS before saving.',409);
  life_json(life_ayo_os_public($os->mutate($input['version'],LifeStore::text($input['operation']??'',60,true),$input['args'],$actor)));
 }
 if($method==='POST'&&in_array($action,['ayo-os.ai.research','ayo-os.ai.rewrite','ayo-os.ai.tailor','ayo-os.automation.status'],true)){
  LifeAyoOS::requireWorkspace($input,$store->tenantId);require_once __DIR__.'/opportunity-ai.php';$ai=new LifeOpportunityAI($os);
  life_json(match($action){'ayo-os.ai.research'=>$ai->research($input),'ayo-os.ai.rewrite'=>$ai->rewrite($input),'ayo-os.ai.tailor'=>$ai->tailor($input),'ayo-os.automation.status'=>$ai->automation($input)});
 }
 if($method==='POST'&&in_array($action,['ayo-os.agents.runtime.status','ayo-os.agents.runtime.enable','ayo-os.agents.runtime.disable'],true)){LifeAyoOS::requireWorkspace($input,$store->tenantId);require_once __DIR__.'/opportunity-runtime.php';life_json((new LifeOpportunityRuntime($os))->handleOwner($action,$input));}
 if($method==='POST'&&in_array($action,['ayo-os.agents.private.preview','ayo-os.agents.private.status','ayo-os.agents.private.token','ayo-os.agents.private.revoke'],true)){LifeAyoOS::requireWorkspace($input,$store->tenantId);require_once __DIR__.'/opportunity-private-context.php';life_json((new LifeOpportunityPrivateContext($os))->handleOwner($action,$input));}
 if($method==='POST'&&in_array($action,['ayo-os.agents.status','ayo-os.agents.queue','ayo-os.agents.token','ayo-os.agents.revoke','ayo-os.agents.review','ayo-os.agents.permissions','ayo-os.agents.audit'],true)){
  LifeAyoOS::requireWorkspace($input,$store->tenantId);require_once __DIR__.'/opportunity-agents.php';life_json((new LifeOpportunityAgents($os))->handleOwner($action,$input));
 }
 if($method==='POST'&&in_array($action,['ayo-os.mail.status','ayo-os.mail.prepare','ayo-os.mail.send','ayo-os.mail.draft-ai','ayo-os.mail.disconnect'],true)){
  LifeAyoOS::requireWorkspace($input,$store->tenantId);require_once __DIR__.'/opportunity-mail.php';life_json((new LifeOpportunityMail($os))->handleOwner($action,$input));
 }
 throw new LifeError('Unknown Ayo OS request.',404);
}
function life_ayo_os_public(array $result):array{
 $s=$result['state'];$result['approvalIds']=[];foreach($s['drafts'] as $d){$a=LifeAyoOS::approval($s,$d['id']);if($a)$result['approvalIds'][$d['id']]=$a['id'];}return $result;
}

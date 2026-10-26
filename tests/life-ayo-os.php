<?php
require __DIR__.'/../api/life/store.php';
if(!file_exists(__DIR__.'/../api/life/ayo-os.php'))throw new RuntimeException('Ayo OS model is not implemented');
require __DIR__.'/../api/life/ayo-os.php';
$db=new PDO('sqlite::memory:');$db->setAttribute(PDO::ATTR_ERRMODE,PDO::ERRMODE_EXCEPTION);$db->exec(file_get_contents(__DIR__.'/../api/life/schema.sql'));$store=new LifeStore($db);$store->initialize('isolated-owner-password');$os=new LifeAyoOS($store);$other=new LifeAyoOS(new LifeStore($db,2));$n=0;
function check($ok,$why){global $n;if(!$ok)throw new RuntimeException($why);$n++;}
function denied($f,$status=422){try{$f();}catch(LifeError $e){check($e->status===$status,'Expected denial '.$status.', got '.$e->status);return;}throw new RuntimeException('Unsafe action accepted');}
function save($op,$args){global $os;return $os->mutate($os->read()['version'],$op,$args,'owner:1');}
denied(fn()=>LifeAyoOS::requireWorkspace(['workspaceId'=>2],1),409);
LifeAyoOS::requireWorkspace(['workspaceId'=>1],1);
$before=$store->read();check($os->read()['state']['opportunities']===[],'Starts empty');
$c=save('company.save',['name'=>'Example','industry'=>'Healthtech','website'=>'https://example.com'])['recordId'];
$contact=save('contact.save',['companyId'=>$c,'name'=>'Founder','email'=>'founder@example.com','sourceUrl'=>'https://example.com/team'])['recordId'];
$o=save('opportunity.save',['companyId'=>$c,'pipeline'=>'nysc','title'=>'Implementation team','materials'=>'Technology consulting CV v1 — reviewed local reference'])['recordId'];
$r=save('research.save',['opportunityId'=>$o,'kind'=>'observation','body'=>'The company offers clinical workflow software.','sourceUrl'=>'https://example.com/product'])['recordId'];
$d=save('draft.save',['opportunityId'=>$o,'contactId'=>$contact,'subject'=>'NYSC implementation support','body'=>'I worked on operational workflows. Does your team consider corps members?','researchIds'=>[$r],'schedule'=>'2026-11-04T09:00','timezone'=>'Africa/Lagos'])['recordId'];
check(count($other->read()['state']['companies'])===0,'Tenant isolation');denied(fn()=>$other->mutate(1,'opportunity.save',['companyId'=>$c,'pipeline'=>'career','title'=>'Steal'],'owner:2'),404);
denied(fn()=>$os->mutate(1,'company.save',['name'=>'Stale'],'owner:1'),409);
denied(fn()=>save('company.save',['name'=>'Unsafe','website'=>'javascript:alert(1)']));
denied(fn()=>save('opportunity.save',['companyId'=>$c,'pipeline'=>'mixed','title'=>'Invalid']));
denied(fn()=>save('review.decide',['id'=>$d,'decision'=>'approved']),403);
$approved=save('review.decide',['id'=>$d,'decision'=>'approved','reviewed'=>true]);$approval=$approved['state']['approvals'][0];check($approval['actor']==='owner:1'&&$approval['snapshot']['contact']['email']==='founder@example.com','Exact reviewed recipient and actor');check(LifeAyoOS::approval($approved['state'],$d)!==null,'Approval current');check($approved['state']['opportunities'][0]['stage']==='researched','Approval is not sent');
$roundtrip=new LifeAyoOS($store);check($roundtrip->read()===$os->read(),'Read back persisted state');
save('contact.save',['id'=>$contact,'email'=>'new@example.com']);check(LifeAyoOS::approval($os->read()['state'],$d)===null,'Recipient edit invalidates approval');check($os->read()['state']['approvals'][0]===$approval,'Approval immutable');
save('review.decide',['id'=>$d,'decision'=>'approved','reviewed'=>true]);save('research.save',['id'=>$r,'body'=>'Changed research']);check(LifeAyoOS::approval($os->read()['state'],$d)===null,'Research edit invalidates approval');
save('review.decide',['id'=>$d,'decision'=>'approved','reviewed'=>true]);save('opportunity.save',['id'=>$o,'materials'=>'CV v2']);check(LifeAyoOS::approval($os->read()['state'],$d)===null,'Materials edit invalidates approval');
save('review.decide',['id'=>$d,'decision'=>'approved','reviewed'=>true]);save('draft.save',['id'=>$d,'body'=>'Revised message']);check(LifeAyoOS::approval($os->read()['state'],$d)===null,'Message edit invalidates approval');
save('review.decide',['id'=>$d,'decision'=>'rejected','reason'=>'Needs revision']);check(end($os->read()['state']['approvals'])['decision']==='rejected','Rejection recorded');
denied(fn()=>save('draft.save',['id'=>$d,'researchIds'=>[str_repeat('f',32)]]),404);
denied(fn()=>save('opportunity.save',['id'=>$o,'stage'=>'invented']));
denied(fn()=>save('research.save',['opportunityId'=>$o,'kind'=>'observation','body'=>'Unsupported claim']));
$h=save('research.save',['opportunityId'=>$o,'kind'=>'hypothesis','body'=>'Possible onboarding opportunity'])['recordId'];
save('draft.save',['id'=>$d,'researchIds'=>[$h]]);denied(fn()=>save('review.decide',['id'=>$d,'decision'=>'approved','reviewed'=>true]));
denied(fn()=>save('contact.save',['companyId'=>$c,'name'=>'Other','email'=>'bad']));
save('contact.save',['companyId'=>$c,'name'=>'Second']);denied(fn()=>save('contact.save',['companyId'=>$c,'name'=>'Third']));
denied(fn()=>save('draft.save',['id'=>$d,'timezone'=>'Nowhere/Invalid']));
check($store->read()===$before,'Planner preserved');
// Company-first details are optional, persistent and safe.
save('company.save',['id'=>$c,'about'=>'Clinical workflow tools.','linkedin'=>'https://www.linkedin.com/company/example','socialUrl'=>'https://www.instagram.com/example']);
$company=$os->read()['state']['companies'][0];check($company['about']==='Clinical workflow tools.'&&$company['linkedin']==='https://www.linkedin.com/company/example'&&$company['socialUrl']==='https://www.instagram.com/example','Company context persists');
save('company.save',['id'=>$c,'industry'=>'Healthcare']);check($os->read()['state']['companies'][0]['about']==='Clinical workflow tools.','Partial edit preserves context');
denied(fn()=>save('company.save',['id'=>$c,'linkedin'=>'http://example.com']));denied(fn()=>save('company.save',['id'=>$c,'socialUrl'=>'javascript:alert(1)']));
save('contact.save',['id'=>$contact,'linkedin'=>'https://www.linkedin.com/in/founder','notes'=>'Product lead; published profile.']);check($os->read()['state']['contacts'][0]['notes']==='Product lead; published profile.','Contact notes persist');denied(fn()=>save('contact.save',['id'=>$contact,'linkedin'=>'http://example.com']));
foreach(['sent','submitted','scheduled','bounced','pending','accepted','not-accepted','paused','incomplete'] as $stage){save('opportunity.save',['id'=>$o,'stage'=>$stage]);check($os->read()['state']['opportunities'][0]['stage']===$stage,'Status persists: '.$stage);}
$ai=save('opportunity.save',['companyId'=>$c,'pipeline'=>'ai-testing','title'=>'AI evaluator','stage'=>'pending'])['recordId'];check($os->read()['state']['opportunities'][1]['pipeline']==='ai-testing','AI testing pipeline');
check($os->read()['state']['communications']===[],'Communication history starts empty');
$history=['opportunityId'=>$o,'subject'=>'Placement enquiry','body'=>'Historical sent text','direction'=>'sent','occurredAt'=>'2026-10-25T16:40:00+01:00','sourceUrl'=>'https://mail.google.com/mail/u/0/#all/thread','messageId'=>'gmail-message-1','attachments'=>'Employer-specific CV.pdf'];
$approvalCount=count($os->read()['state']['approvals']);$event=save('communication.save',$history)['recordId'];$state=$os->read()['state'];check($state['communications'][0]['messageId']==='gmail-message-1'&&$state['communications'][0]['attachments']==='Employer-specific CV.pdf','Communication evidence persisted');check(count($state['approvals'])===$approvalCount,'Historical email creates no approval');
denied(fn()=>save('communication.save',$history),409);denied(fn()=>save('communication.save',array_replace($history,['sourceUrl'=>'https://mail.google.com/mail/u/0/#all/other-thread'])),409);
save('communication.save',['id'=>$event,'body'=>'Corrected historical excerpt']);check(count($os->read()['state']['communications'])===1,'Editing history does not duplicate');
save('communication.save',array_replace($history,['opportunityId'=>$ai]));check(count($os->read()['state']['communications'])===2,'Dedupe is per opportunity');
denied(fn()=>save('communication.save',array_replace($history,['opportunityId'=>str_repeat('f',32)])),404);denied(fn()=>save('communication.save',['id'=>$event,'opportunityId'=>$ai]));
foreach([['sourceUrl'=>'javascript:alert(1)'],['sourceUrl'=>''],['direction'=>'delivered'],['occurredAt'=>'2026-02-30T09:00:00+01:00'],['occurredAt'=>'2026-10-25T25:00:00+01:00'],['occurredAt'=>'tomorrow'],['occurredAt'=>'2026-10-25T09:00']] as $invalid)denied(fn()=>save('communication.save',array_replace($history,['messageId'=>'bad'],$invalid)));
denied(fn()=>$other->mutate($other->read()['version'],'communication.save',$history,'owner:2'),404);
// Gmail thread links can contain several distinct messages.
save('communication.save',array_replace($history,['messageId'=>'gmail-message-2','direction'=>'received']));check(count($os->read()['state']['communications'])===3,'Distinct messages in the same Gmail thread remain separate');
$withoutId=array_replace($history,['messageId'=>'','occurredAt'=>'2026-10-26T08:00:00Z']);$fallback=save('communication.save',$withoutId);denied(fn()=>save('communication.save',$withoutId),409);check($fallback['state']['communications'][3]['occurredAt']==='2026-10-26T08:00:00Z','UTC timestamps round trip');
check($os->read()['state']['opportunities'][1]['stage']==='pending','Email history never infers AI acceptance');
$legacy=$os->read()['state'];unset($legacy['communications']);$db->prepare('UPDATE life_ayo_os SET state=? WHERE id=1')->execute([json_encode($legacy)]);check($os->read()['state']['communications']===[],'Legacy history defaults safely');check($store->read()===$before,'Planner preserved after enrichment');
echo "$n Ayo OS persistence and approval checks passed\n";

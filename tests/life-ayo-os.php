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
denied(fn()=>save('opportunity.save',['id'=>$o,'stage'=>'sent']));
denied(fn()=>save('research.save',['opportunityId'=>$o,'kind'=>'observation','body'=>'Unsupported claim']));
$h=save('research.save',['opportunityId'=>$o,'kind'=>'hypothesis','body'=>'Possible onboarding opportunity'])['recordId'];
save('draft.save',['id'=>$d,'researchIds'=>[$h]]);denied(fn()=>save('review.decide',['id'=>$d,'decision'=>'approved','reviewed'=>true]));
denied(fn()=>save('contact.save',['companyId'=>$c,'name'=>'Other','email'=>'bad']));
save('contact.save',['companyId'=>$c,'name'=>'Second']);denied(fn()=>save('contact.save',['companyId'=>$c,'name'=>'Third']));
denied(fn()=>save('draft.save',['id'=>$d,'timezone'=>'Nowhere/Invalid']));
check($store->read()===$before,'Planner preserved');
echo "$n Ayo OS persistence and approval checks passed\n";

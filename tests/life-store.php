<?php
declare(strict_types=1);
require __DIR__.'/../api/life/store.php';
$db=new PDO('sqlite::memory:');$db->setAttribute(PDO::ATTR_ERRMODE,PDO::ERRMODE_EXCEPTION);
$db->exec(file_get_contents(__DIR__.'/../api/life/schema.sql'));
$store=new LifeStore($db);$checks=0;
function check(bool $ok,string $message): void { global $checks; if(!$ok)throw new RuntimeException($message);$checks++; }
function rejects(callable $fn,int $status): void { try{$fn();}catch(LifeError $e){check($e->status===$status,'Unexpected rejection');return;}throw new RuntimeException('Expected rejection'); }
rejects(fn()=>$store->initialize('short'),422);
$store->initialize('test-only-long-passphrase');check(password_verify('test-only-long-passphrase',$store->owner()['password_hash']),'Password hash');
rejects(fn()=>$store->initialize('another-long-passphrase'),409);
$d=$store->read();check(count($d['state']['lists'])===6,'Default lists');check((new DateTimeImmutable($d['week']))->format('N')==='1','Monday sprint');
$inbox=$d['state']['lists'][0]['id'];$done=$d['state']['lists'][5]['id'];
$args=['title'=>'A real next step','listId'=>$inbox,'notes'=>'Notes survive','priority'=>'high','labels'=>['Personal'],'dueDate'=>'2026-10-12','checklist'=>[['text'=>'First step','done'=>false]],'sprintWeek'=>$d['week'],'inSprint'=>true];
$d=$store->mutate($d['version'],'task.save',$args);$task=$d['state']['tasks'][0];$id=$task['id'];
check($d['state']['sprints'][$d['week']]['taskIds']===[$id],'Atomic sprint inclusion');check($task['notes']==='Notes survive','Task persistence');
rejects(fn()=>$store->mutate(1,'task.save',$args),409);check(count($store->read()['state']['tasks'])===1,'Conflict did not duplicate');
$bad=$args;$bad['dueDate']='2026-02-30';rejects(fn()=>$store->mutate($d['version'],'task.save',$bad),422);
check($store->read()['version']===$d['version'],'Failed update did not advance version');
$args['id']=$id;$args['checklist']=$task['checklist'];$args['checklist'][0]['done']=true;
$d=$store->mutate($d['version'],'task.save',$args);check($d['state']['tasks'][0]['checklist'][0]['id']===$task['checklist'][0]['id'],'Stable checklist IDs');
$d=$store->mutate($d['version'],'task.save',array_merge($args,['id'=>'','title'=>'Second task']));$second=$d['state']['tasks'][1]['id'];
$d=$store->mutate($d['version'],'task.move',['id'=>$second,'listId'=>$inbox,'position'=>0]);check($d['state']['tasks'][1]['position']===0,'Reordered task');
$d=$store->mutate($d['version'],'task.move',['id'=>$id,'listId'=>$done,'position'=>0]);check($d['state']['tasks'][0]['listId']===$done,'Moved to Done');
$d=$store->mutate($d['version'],'task.archive',['id'=>$id]);check($d['state']['tasks'][0]['archived'],'Task archived');
check(in_array($id,$d['state']['sprints'][$d['week']]['taskIds'],true),'Sprint history preserved');
$d=$store->mutate($d['version'],'task.restore',['id'=>$id,'listId'=>$inbox]);check(!$d['state']['tasks'][0]['archived'],'Task restored');
rejects(fn()=>$store->mutate($d['version'],'list.archive',['id'=>$inbox]),422);
rejects(fn()=>$store->mutate($d['version'],'list.archive',['id'=>$done]),422);
$d=$store->mutate($d['version'],'list.save',['name'=>'Learning']);$new=end($d['state']['lists'])['id'];
$d=$store->mutate($d['version'],'list.move',['id'=>$new,'position'=>0]);check(end($d['state']['lists'])['position']===0,'List reorder');
$d=$store->mutate($d['version'],'list.archive',['id'=>$new]);$d=$store->mutate($d['version'],'list.restore',['id'=>$new]);check(!end($d['state']['lists'])['archived'],'List restored');
rejects(fn()=>$store->mutate($d['version'],'sprint.save',['week'=>'2026-10-11','goal'=>'Wrong weekday','taskIds'=>[]]),422);
$copy=json_decode(json_encode($store->read(),JSON_THROW_ON_ERROR),true,512,JSON_THROW_ON_ERROR);check($copy['state']['tasks'][0]['notes']==='Notes survive','Export round trip');
for($i=0;$i<5;$i++)$store->throttle('test-address');rejects(fn()=>$store->throttle('test-address'),429);
echo "$checks backend checks passed\n";

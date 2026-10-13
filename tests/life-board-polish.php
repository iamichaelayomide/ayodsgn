<?php
require __DIR__.'/../api/life/store.php';require __DIR__.'/../api/life/ai.php';require __DIR__.'/../api/life/voice.php';
$db=new PDO('sqlite::memory:');$db->setAttribute(PDO::ATTR_ERRMODE,PDO::ERRMODE_EXCEPTION);$db->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE,PDO::FETCH_ASSOC);$db->exec(file_get_contents(__DIR__.'/../api/life/schema.sql'));$store=new LifeStore($db);$store->initialize('disposable-board-test-passphrase');$n=0;
function ok($v){global $n;if(!$v)throw new Exception('Board polish check '.$n.' failed');$n++;}
function bad($fn,$status=422){try{$fn();}catch(LifeError $e){ok($e->status===$status);return;}throw new Exception('Expected rejection');}
$d=$store->read();$first=$d['state']['boards'][0]['id'];bad(fn()=>$store->mutate($d['version'],'board.archive',['id'=>$first]));
$d=$store->mutate($d['version'],'board.save',['name'=>'Projects']);$second=$d['state']['boards'][1]['id'];$list=array_values(array_filter($d['state']['lists'],fn($l)=>($l['boardId']??$store->read()['state']['board']['id'])===$second))[0]['id'];
$d=$store->mutate($d['version'],'task.save',['title'=>'Blue card','listId'=>$list,'color'=>'blue']);$task=$d['state']['tasks'][0];ok($task['color']==='blue');
$d=$store->mutate($d['version'],'task.save',array_merge($task,['notes'=>'Updated']));ok($d['state']['tasks'][0]['color']==='blue');bad(fn()=>$store->mutate($d['version'],'task.save',array_merge($task,['color'=>'javascript:bad'])));
$d=$store->mutate($d['version'],'task.save',['title'=>'Already archived','listId'=>$list]);$old=$d['state']['tasks'][1]['id'];$d=$store->mutate($d['version'],'task.archive',['id'=>$old]);
bad(fn()=>$store->mutate($d['version'],'board.archive',['id'=>$second],'partner'),403);
$d=$store->mutate($d['version'],'board.archive',['id'=>$second]);ok($d['state']['boards'][1]['archived']);ok($d['state']['tasks'][0]['archived']);ok($d['state']['tasks'][1]['archived']);bad(fn()=>$store->mutate($d['version'],'task.move',['id'=>$task['id'],'listId'=>$list]));bad(fn()=>$store->mutate($d['version'],'list.restore',['id'=>$list]));
$d=$store->mutate($d['version'],'board.restore',['id'=>$second]);ok(!$d['state']['boards'][1]['archived']);ok(!$d['state']['tasks'][0]['archived']);ok($d['state']['tasks'][1]['archived']);ok($d['state']['tasks'][0]['notes']==='Updated');
bad(fn()=>$store->mutate($d['version']-1,'board.archive',['id'=>$second]),409);
// An independent personal account can start native voice with its own allowance and transcript.
$db->prepare('INSERT INTO life_board(id,version,state,updated_at) VALUES(2,1,?,?)')->execute([json_encode($d['state']),LifeStore::now()]);$other=new LifeStore($db,2);$ai=new LifeAI($other,['key'=>'test-only','freeOnly'=>true]);$a=$ai->read();$a=$ai->mutate($a['version'],'conversation.new',['title'=>'Personal voice']);$calls=0;$voice=new LifeVoice($other,$ai,['key'=>'test-only'],function($p)use(&$calls){$calls++;return ['name'=>'ephemeral-test-only'];});$v=$voice->start(['version'=>$a['version'],'conversationId'=>$a['state']['conversations'][0]['id']]);ok($calls===1);ok($v['seconds']===600);ok($ai->read()['state']['voiceUsage'][$a['day']]===600);ok(empty((new LifeAI($store,[]))->read()['state']['voiceUsage']));
echo "$n board/color/public voice checks passed\n";

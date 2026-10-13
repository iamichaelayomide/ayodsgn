<?php
require __DIR__.'/../api/life/store.php';require __DIR__.'/../api/life/ai.php';
$n=0;function readbackCheck($value){global $n;if(!$value)throw new Exception('Readback check '.$n);$n++;}
$before=['tasks'=>[]];$state=['tasks'=>[['id'=>'task','title'=>'Groceries','listId'=>'progress','dueDate'=>'','dueTime'=>'','reminderMinutes'=>null,'archived'=>false,'checklist'=>[],'labels'=>[]]],'lists'=>[['id'=>'progress','isDone'=>false],['id'=>'done','isDone'=>true]]];
LifeCommands::verifyTaskMutation('task.save',['title'=>'Groceries','listId'=>'progress'],$before,$state);readbackCheck(true);
LifeCommands::verifyTaskMutation('task.move',['id'=>'task','listId'=>'progress'],$state,$state);readbackCheck(true);
foreach([['task.move',['id'=>'task','listId'=>'done']],['task.save',['id'=>'task','title'=>'Incorrect']],['task.complete',['id'=>'task','done'=>true]],['task.archive',['id'=>'task']],['task.schedule',['id'=>'task','date'=>'2026-10-14','time'=>'09:00','minutes'=>30]]] as [$op,$args]){try{LifeCommands::verifyTaskMutation($op,$args,$state,$state);readbackCheck(false);}catch(LifeError $e){readbackCheck($e->status===409);}}
$done=$state;$done['tasks'][0]['listId']='done';$done['tasks'][0]['completedAt']='2026-10-13';LifeCommands::verifyTaskMutation('task.complete',['id'=>'task','done'=>true],$state,$done);readbackCheck(true);
$restored=$state;$restored['tasks'][0]['archived']=false;LifeCommands::verifyTaskMutation('task.restore',['id'=>'task'],$state,$restored);readbackCheck(true);
LifeCommands::verifyTaskMutation('task.save',['id'=>'task','dueDate'=>'','dueTime'=>'09:00','reminderMinutes'=>0],$state,$state);readbackCheck(true);
echo "$n persisted task effect checks passed\n";

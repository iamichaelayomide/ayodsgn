<?php
declare(strict_types=1);
// Rich descriptions never accept HTML or embedded objects.
function life_task_delta(mixed $delta,string $notes): ?array {
 if($delta===null)return null;
 if(!is_array($delta)||!is_array($delta['ops']??null)||count($delta['ops'])>5000)throw new LifeError('Check the description formatting.');
 $ops=[];$plain='';
 foreach($delta['ops'] as $op){if(!is_array($op)||!is_string($op['insert']??null))throw new LifeError('Descriptions support text only.');$plain.=$op['insert'];$out=['insert'=>$op['insert']];$attrs=[];
 foreach($op['attributes']??[] as $k=>$v){if(in_array($k,['bold','italic','underline'],true)&&$v===true)$attrs[$k]=true;elseif($k==='list'&&in_array($v,['bullet','ordered'],true))$attrs[$k]=$v;elseif($k==='header'&&in_array($v,[1,2,3],true))$attrs[$k]=$v;elseif($k==='link'&&is_string($v)&&strlen($v)<=2000&&preg_match('~^https?://~i',$v)&&filter_var($v,FILTER_VALIDATE_URL))$attrs[$k]=$v;else throw new LifeError('Unsupported description formatting.');}
 if($attrs)$out['attributes']=$attrs;$ops[]=$out;}
 if(strlen($plain)>20001||trim($plain)!==trim($notes))throw new LifeError('Description text and formatting must match.');return ['ops'=>$ops];
}
function life_task_reminder(array $task): ?int {
 if(($task['reminderMinutes']??null)===null||empty($task['dueDate'])||empty($task['dueTime']))return null;
 $date=DateTimeImmutable::createFromFormat('!Y-m-d H:i',$task['dueDate'].' '.$task['dueTime'],new DateTimeZone('Africa/Lagos'));
 return $date?$date->getTimestamp()-(int)$task['reminderMinutes']*60:null;
}

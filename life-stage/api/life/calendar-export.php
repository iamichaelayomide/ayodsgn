<?php
declare(strict_types=1);
function life_ical(array $state): string {
    $escape=static fn(string $s):string=>str_replace(["\\","\r","\n",';',','],["\\\\",'',"\\n","\\;","\\,"],$s);
    $lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//ayodsgn//Life Planner//EN','CALSCALE:GREGORIAN','METHOD:PUBLISH'];
    foreach($state['tasks'] as $task){if($task['archived']||empty($task['dueDate']))continue;$date=str_replace('-','',$task['dueDate']);$end=(new DateTimeImmutable($task['dueDate']))->modify('+1 day')->format('Ymd');$lines=array_merge($lines,['BEGIN:VEVENT','UID:'.$task['id'].'@life.ayodsgn.com','DTSTAMP:'.gmdate('Ymd\THis\Z'),'DTSTART;VALUE=DATE:'.$date,'DTEND;VALUE=DATE:'.$end,'SUMMARY:'.$escape($task['title']),'DESCRIPTION:'.$escape($task['notes']),'END:VEVENT']);}
    $lines[]='END:VCALENDAR';$out='';foreach($lines as $line){while(strlen($line)>73){$part=substr($line,0,73);while(preg_match('//u',$part)!==1)$part=substr($part,0,-1);$out.=$part."\r\n ";$line=substr($line,strlen($part));}$out.=$line."\r\n";}return $out;
}

<?php
declare(strict_types=1);
/** One account-scoped booking: infer a supplied activity, never an invented meeting. */
final class LifeCalendarBooking {
    public static function clock(?DateTimeImmutable $now=null):array {
        $now=($now??new DateTimeImmutable('now'))->setTimezone(new DateTimeZone(LifeStore::$timezone));
        return ['date'=>$now->format('Y-m-d'),'time'=>$now->format('H:i'),'timezone'=>LifeStore::$timezone,'tomorrow'=>$now->modify('+1 day')->format('Y-m-d')];
    }
    public static function normalize(array $args,string $request,array $state,array $screen=[],?DateTimeImmutable $now=null):array {
        $clock=self::clock($now);
        $title=trim($args['title']??'');
        if($title===''){
            if(preg_match('/\b(?:book|schedule|plan|arrange)\s+(?:me\s+)?(?:an?\s+|the\s+)?(.+?)(?=\s+(?:for|at|today|tomorrow|on)\b|[.!?]?$)/iu',$request,$m))$title=trim($m[1]," \t\n.!?");
            if($title!=='')$title=mb_strtoupper(mb_substr($title,0,1)).mb_substr($title,1);
        }
        $title=LifeStore::text($title,200,true);
        // Explicit relative dates and omitted dates use the current account clock, not model memory.
        if(preg_match('/\btomorrow\b/iu',$request))$date=$clock['tomorrow'];
        elseif(preg_match('/\btoday\b/iu',$request)||!preg_match('/\b(?:next|this|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday|January|February|March|April|May|June|July|August|September|October|November|December)\b|\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}/iu',$request))$date=$clock['date'];
        else $date=$args['date']??'';
        if(!is_string($date)||!preg_match('/^\d{4}-\d{2}-\d{2}$/',$date)||!checkdate((int)substr($date,5,2),(int)substr($date,8,2),(int)substr($date,0,4)))throw new LifeError('Please say the date for that booking.');
        $time=$args['time']??'';
        if(preg_match('/\b(\d{1,2})(?::([0-5]\d))?\s*([ap])\s*\.?\s*m\.?/iu',$request,$m)){
            $hour=(int)$m[1];if($hour<1||$hour>12)throw new LifeError('Please say a valid time.');
            $time=sprintf('%02d:%02d',($hour%12)+(mb_strtolower($m[3])==='p'?12:0),(int)($m[2]??0));
        }
        if(!is_string($time)||!preg_match('/^([01]\d|2[0-3]):[0-5]\d$/',$time))throw new LifeError('What time should I book it for?');
        $minutes=$args['minutes']??30;
        if(preg_match('/\b(?:for|lasting)\s+(\d+)\s*(minutes?|mins?|hours?)\b/iu',$request,$m))$minutes=(int)$m[1]*(preg_match('/^hour/iu',$m[2])?60:1);
        if(!is_int($minutes)||$minutes<5||$minutes>1440)throw new LifeError('Choose a duration between five minutes and one day.');
        $listId=$args['listId']??'';
        if($listId===''){
            $boardId=$screen['boardId']??$state['board']['id'];
            $lists=array_values(array_filter($state['lists'],fn($l)=>!$l['archived']&&!$l['isDone']&&($l['boardId']??$state['board']['id'])===$boardId));
            $preferred=array_values(array_filter($lists,fn($l)=>in_array(mb_strtolower($l['name']),['idea box','inbox'],true)));
            $listId=($preferred[0]??$lists[0]??[])['id']??'';
        }
        $listId=LifeStore::text($listId,32,true);
        return ['title'=>$title,'listId'=>$listId,'date'=>$date,'time'=>$time,'minutes'=>$minutes];
    }
}

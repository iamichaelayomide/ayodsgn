<?php
declare(strict_types=1);
/** Context is evidence, never permission. Only the current directive authorizes changes. */
final class LifeChatContext {
 public static function instruction(string $text):bool {
  $lead=trim(preg_split('/\R/u',$text,2)[0]);$lead=preg_replace('/^(?:all\s+)?(?:these|those|the)\s+(?:steps|ideas|items|tasks|goals)[,\s:]+(?=(?:please\s+)?(?:turn|convert|add|make|put)\b)/iu','',$lead);$directive=preg_split('/\R\s*(?:job description|opportunity details|source|quoted text|document)\s*:/iu',$text,2)[0];$directive=preg_replace('/\bwithout (?:a |any )?(?:deadline|due date|date|time|reminder|goal link)\b/iu','',$directive);
  if(preg_match('/\b(do not|don[’\x{0027}]?t|never|not yet|not now|maybe|might|thinking|consider|suggest|propose|imagine|hypothetical|what if|could I|would I|should I|if|unless|without|instead of)\b/iu',$directive))return false;
  $lead=preg_replace('/^(?:(?:hi|hello|hey|okay|ok|yes|now|then|and|also|just|please)[,\s.!:]*)*/iu','',$lead);
  $lead=preg_replace('/^(?:could|would|can|will) you\s+(?:please\s+)?(?:help me\s+)?/iu','',$lead);
  $lead=preg_replace('/^I (?:want|need)(?: you)? to\s+|^I[’\x{0027}]d like(?: you)? to\s+/iu','',$lead);
  if(preg_match('/^(?:research|read|look up|search|browse)\b.*\b(?:and|then)\s+(?:please\s+)?(?:add|save|update|create)\b/iu',$lead))return true;
  return (bool)preg_match('/^(?:please\s+)?(?:add|create|make|put|book|plan|arrange|move|rename|change|update|edit|set|schedule|reschedule|remind|link|archive|remove|restore|save|remember|forget|mark|complete|organize|turn|convert|connect|disconnect|undo|reopen|check|uncheck)\b/iu',$lead);
 }
 public static function effective(string $message,?array $pending):string {
  if(preg_match('/^(?:h+i+|he+y+|hello+|good (?:morning|afternoon|evening)|thanks?|thank you|cool|great|awesome|nice)\b/iu',trim($message)))return $message;
  if(!$pending||($pending['expiresAt']??0)<time()||self::instruction($message)||preg_match('/^(?:no|nope|not now|not yet|cancel|stop|never mind|nevermind|forget it|instead|actually)\b/iu',trim($message))||preg_match('/^(?:how|what|why|when|where|who|tell|explain|research|find|search|help|discuss|thanks?|hello|hi)\b/iu',trim($message))||preg_match('/\b(cancel|stop|not now|not yet|maybe|do not|don[’\x{0027}]?t|thinking)\b|\?/iu',$message))return $message;
  return $pending['text']."\nDetails supplied now: ".$message;
 }
 public static function screen(array $screen,array $focus):array {
  foreach($focus as $type=>$id)if(is_string($id)&&preg_match('/^[a-f0-9]{32}$/D',$id)&&empty($screen[$type.'Id']))$screen[$type.'Id']=$id;
  return $screen;
 }
 public static function planner(array $state,string $query,array $screen,array $focus):array {
  $screen=self::screen($screen,$focus);$context=LifeCommands::relevant($state,$query,$screen);$linked=[];
  $words=array_values(array_filter(preg_split('/[^\pL\pN]+/u',mb_strtolower($query)),fn($w)=>mb_strlen($w)>2));
  foreach($state['goals']??[] as $goal){if($goal['archived']??false)continue;$title=mb_strtolower($goal['title']);$matches=array_filter($words,fn($w)=>str_contains($title,$w));if(($screen['goalId']??'')!==$goal['id']&&!$matches)continue;
   $ids=[$goal['id']=>true];$changed=true;while($changed){$changed=false;foreach($state['goals']??[] as $child)if(!($child['archived']??false)&&isset($ids[$child['parentId']??''])&&!isset($ids[$child['id']])){$ids[$child['id']]=true;$changed=true;}}$tasks=array_values(array_filter($state['tasks']??[],fn($t)=>!$t['archived']&&isset($ids[$t['goalId']??''])));$done=count(array_filter($tasks,fn($t)=>array_filter($state['lists'],fn($l)=>$l['id']===$t['listId']&&$l['isDone'])));
   $linked[]=['id'=>$goal['id'],'title'=>$goal['title'],'notes'=>mb_substr($goal['notes']??'',0,1500),'type'=>$goal['type']??'adhoc','period'=>$goal['period']??'','parentId'=>$goal['parentId']??'','keyResultId'=>$goal['keyResultId']??'','keyResults'=>$goal['keyResults']??[],'status'=>$goal['status']??'todo','progressMode'=>$goal['progressMode']??'manual','completed'=>$goal['completed']??false,'progress'=>count($tasks)?(int)round($done/count($tasks)*100):0,'totalTasks'=>count($tasks),'completedTasks'=>$done,'tasks'=>array_map(fn($t)=>array_intersect_key($t,array_flip(['id','title','listId','dueDate','schedule','notes','checklist'])),array_slice($tasks,0,100))];
  }
  $context['linkedGoals']=array_slice($linked,0,8);$context['selection']=$screen;return $context;
 }
 public static function claimsSave(string $text):bool {return (bool)preg_match('/\b(?:your|the)\s+(?:task|goal|opportunity|planner|board|call)\s+(?:has been|was|is)\s+(?:saved|changed|added|created|updated|moved|booked|scheduled|archived|completed)\b|\bI(?:[’\x{0027}]ve| have| just)?\s+(?:successfully\s+)?(?:added|created|saved|moved|updated|deleted|archived|scheduled|booked|completed|sent|submitted|changed)\b|^(?:Done[.!]|Saved[.!]|Added\s|Created\s|Updated\s|Moved\s)/iu',trim($text));}
 public static function validateActions(array $board,array $apps,array $actions,string $message,array $screen,array $focus,bool $hasAttachments=false):void {
  require_once __DIR__.'/voice-protocol.php';$normalized=[];
  $lead=trim(preg_split('/\R/u',$message,2)[0]);$scope=$lead;if(preg_match('/\RDetails supplied now: (.*)/su',$message,$detail))$scope.=' '.$detail[1];$message=$scope;$said=' '.LifeVoiceProtocol::normalized($message).' ';
  foreach($actions as $action){$op=$action['operation']??'';$args=$action['arguments']??[];if(is_string($args))$args=json_decode($args,true,32,JSON_THROW_ON_ERROR);if(!is_array($args))throw new LifeError('I could not understand those action details.');
   $family=explode('.',$op)[0];$trackerIntent=(bool)preg_match('/\b(opportunit(?:y|ies)|applications?|jobs?|education|fellowships?|grants?|volunteering)\b/iu',$lead);foreach($apps['trackers']??[] as $tracker)if(!($tracker['archived']??false)&&str_contains(' '.LifeVoiceProtocol::normalized($lead).' ',' '.LifeVoiceProtocol::normalized($tracker['name']).' '))$trackerIntent=true;
   if($family==='opportunity'&&!$trackerIntent&&!$hasAttachments&&empty($screen['opportunityId']))throw new LifeError('Which opportunity would you like me to save?');
   if($family==='task'&&preg_match('/\bgoals?\b/iu',$lead)&&!preg_match('/\b(tasks?|to-do|todo|call|meeting|reminder)\b/iu',$lead))throw new LifeError('That request is about a goal, not a new task.');
   if($family==='task'&&$trackerIntent&&!preg_match('/\b(task|to-do|todo|call|meeting|reminder)\b/iu',$lead))throw new LifeError('That request is about an opportunity, not a planner task. Which tracker should I use?');
   $suffix=explode('.',$op)[1]??'';
   $needed=match($suffix){'archive','remove','disconnect'=>'archive|remove|forget|disconnect','restore'=>'restore|reopen','complete'=>'complete|mark|finish|reopen','move'=>'move|put|organize','schedule','book'=>'schedule|reschedule|book|plan|arrange','rename'=>'rename|change|update','save'=>'add|create|make|put|save|update|edit|change|set|remember|plan|rename|remind|complete|finish|mark|link|turn|convert|move','applied'=>'mark|applied|apply','toggle'=>'check|uncheck|toggle','connect'=>'connect|link',default=>$family==='map'?'map|connect|create|make':$family};
   if(!preg_match('/\b(?:'.$needed.')\b/iu',$lead))throw new LifeError('That proposed change does not match your request. No changes were saved.');
   if(in_array($family,['tracker','category','goal','board','list','note','routine','memory','map','sprint','review','quarter'],true)){
    $word=match($family){'memory'=>'remember|forget|memory','map'=>'map|mindmap','note'=>'note|notes|idea','goal'=>'goal|goals','quarter'=>'quarter',default=>$family.'s?'};
    if(!preg_match('/\b(?:'.$word.')\b/iu',$lead)&&!(!empty($args['id'])&&($focus[$family]??$screen[$family.'Id']??'')===$args['id']&&preg_match('/\b(it|that|this|one)\b/iu',$lead)))throw new LifeError('Which '.$family.' would you like me to change?');
   }
   if($family==='task'&&preg_match('/\b(opportunit|application)/iu',$lead))throw new LifeError('I could not resolve the application destination. Which tracker should I use?');
   if($suffix==='save'&&!empty($args['id'])&&preg_match('/\b(add|create|make)\b/iu',$lead)&&!preg_match('/\b(checklist|notes?|details?|deadline|reminder|link)\b/iu',$lead))throw new LifeError('A create request cannot overwrite an existing record.');
   if($suffix==='save'&&empty($args['id'])&&in_array($family,['tracker','category','goal','board','list','note','routine','map'],true)){
    $noun=match($family){'note'=>'notes?|ideas?','map'=>'maps?|mindmaps?',default=>$family.'s?'};
    if(!preg_match('/\b(?:add|create|make|save|set)\s+(?:(?!(?:to|for|in|on)\b)[\pL\pN_-]+\s+){0,6}(?:'.$noun.')\b/iu',$lead))throw new LifeError('Creating a new '.$family.' was not requested.');
   }
   if(!empty($args['listId'])&&in_array($family,['task','routine'],true)){
    $lists=array_values(array_filter($board['lists'],fn($l)=>!$l['archived']));$boardId=$screen['boardId']??$board['board']['id'];
    $namedBoards=array_values(array_filter($board['boards']??[$board['board']],fn($b)=>!$b['archived']&&str_contains($said,' '.LifeVoiceProtocol::normalized($b['name']).' board ')));if(count($namedBoards)===1)$boardId=$namedBoards[0]['id'];
    $lists=array_values(array_filter($lists,fn($l)=>($l['boardId']??$board['board']['id'])===$boardId));
    $destination=$message;if(preg_match('/\b(?:to|into)\s+(.+)$/iu',$lead,$m))$destination=$m[1];
    $matches=array_values(array_filter($lists,fn($l)=>str_contains(' '.LifeVoiceProtocol::normalized($destination).' ',' '.LifeVoiceProtocol::normalized($l['name']).' ')));
    $old=null;foreach($board['tasks']??[] as $task)if($task['id']===($args['id']??''))$old=$task;
    if(!$matches&&$old&&$old['listId']===$args['listId'])$matches=array_values(array_filter($lists,fn($l)=>$l['id']===$old['listId']));
    if(!$matches&&empty($args['id'])&&in_array($suffix,['save','book'],true)){$matches=array_values(array_filter($lists,fn($l)=>!$l['isDone']&&in_array($l['name'],['Idea Box','Inbox'],true)));if(!$matches)$matches=array_slice(array_values(array_filter($lists,fn($l)=>!$l['isDone'])),0,1);}
    if(count($matches)!==1||$matches[0]['id']!==$args['listId'])throw new LifeError('Which board list should I use? No changes were saved.');
   }
   if(!empty($args['goalId'])){ $matches=array_values(array_filter($board['goals']??[],fn($g)=>!$g['archived']&&(str_contains($said,' '.LifeVoiceProtocol::normalized($g['title']).' ')||(($screen['goalId']??$focus['goal']??'')===$g['id']&&preg_match('/\b(goal|it|that|this)\b/iu',$lead)))));$same=false;foreach($board['tasks']??[] as $task)if($task['id']===($args['id']??'')&&($task['goalId']??'')===$args['goalId'])$same=true;if(!$same&&(count($matches)!==1||$matches[0]['id']!==$args['goalId']))throw new LifeError('Which goal should this link to?');}
   if(!empty($args['boardId'])&&$family==='list'){ $id=$screen['boardId']??$board['board']['id'];$matches=array_values(array_filter($board['boards']??[$board['board']],fn($b)=>!$b['archived']&&str_contains($said,' '.LifeVoiceProtocol::normalized($b['name']).' ')));if(count($matches)===1)$id=$matches[0]['id'];if($args['boardId']!==$id)throw new LifeError('Which board should contain this list?');}
   if(!empty($args['categoryId'])&&$family==='opportunity'){ $categories=array_values(array_filter($apps['categories']??[],fn($c)=>!$c['archived']&&$c['trackerId']===($args['trackerId']??'')));$matches=array_values(array_filter($categories,fn($c)=>str_contains($said,' '.LifeVoiceProtocol::normalized($c['name']).' ')||($screen['categoryId']??'')===$c['id']));if(!$matches&&count($categories)===1)$matches=$categories;if(count($matches)!==1||$matches[0]['id']!==$args['categoryId'])throw new LifeError('Which application category should I use?');}
   if($family==='goal'&&(($args['completed']??false)===true||($args['status']??'')==='done')&&!preg_match('/\b(complete|finish|mark)\b|\bmove\b.*\b(?:done|complete)\b/iu',$lead))throw new LifeError('Goal completion was not requested.');
   if($family==='opportunity'&&$suffix==='save'){
    $active=array_values(array_filter($apps['trackers']??[],fn($t)=>!$t['archived']));$named=array_values(array_filter($active,fn($t)=>str_contains($said,' '.LifeVoiceProtocol::normalized($t['name']).' ')));
    $matches=$named?:array_values(array_filter($active,fn($t)=>preg_match('/\b'.preg_quote($t['kind']??'jobs','/').'\b/iu',$message)));
    if(!$matches&&($screen['trackerId']??'')!=='')$matches=array_values(array_filter($active,fn($t)=>$t['id']===$screen['trackerId']));if(!$matches&&count($active)===1)$matches=$active;
    if(count($matches)!==1||$matches[0]['id']!==($args['trackerId']??''))throw new LifeError('Which tracker should I save this opportunity to?');
   }
   $normalized[]=['operation'=>$op,'arguments'=>$args];
  }
  LifeVoiceProtocol::targets(array_merge($board,$apps),$normalized,$message,$focus,$screen);
 }

}

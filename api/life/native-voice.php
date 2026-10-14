<?php
declare(strict_types=1);
trait LifeNativeVoice {
    public function turn(array $args):array {
        $v=$this->session($args);if(($v['protocolVersion']??1)!==2)throw new LifeError('Reload Life to use native voice.',409);
        $id=LifeStore::text($args['turnId']??'',64,true);$kind=$args['kind']??'conversation';if(!in_array($kind,['conversation','command','clarification'],true))throw new LifeError('Invalid voice turn.');
        $text=LifeStore::text($args['request']??'',6000);$source=$args['source']??'audio';if(!in_array($source,['audio','typed','greeting'],true))throw new LifeError('Invalid voice input.');
        if($kind==='command'&&($source==='greeting'||($args['hasSpeech']??false)!==true))throw new LifeError('Please say what you want to change.');
        $r=$this->ai->read();$s=$r['state'];$entry=null;foreach($s['voiceSessions'] as &$session)if($session['id']===$v['id']){
            if(isset($session['nativeTurns'][$id])){$entry=$session['nativeTurns'][$id];if($entry['kind']!==$kind){if(($entry['committed']??false)||$kind==='command')throw new LifeError('This spoken turn already has a different purpose.',409);$entry['kind']=$kind;$session['nativeTurns'][$id]=$entry;$question=LifeStore::text($args['pendingRequest']??'',6000);if($kind==='clarification'&&LifeVoiceProtocol::instruction($question))$session['nativePending']=['text'=>$question,'expiresAt'=>time()+600];}break;}
            $pending=$session['nativePending']??null;
            if($kind==='command'&&$pending&&$pending['expiresAt']>time()&&!LifeVoiceProtocol::instruction($text)&&!preg_match('/\b(no|cancel|stop|maybe|instead|do not|don[’\x{0027}]?t)\b/iu',$text))$text=$pending['text'].'; '.$text;
            if($kind==='command'&&!LifeVoiceProtocol::instruction($text))throw new LifeError('Please tell me clearly what you want changed.');
            if($kind==='conversation')unset($session['nativePending']);
            $question=LifeStore::text($args['pendingRequest']??'',6000);if($kind==='clarification'&&LifeVoiceProtocol::instruction($question))$session['nativePending']=['text'=>$question,'expiresAt'=>time()+600];
            $entry=['id'=>$id,'kind'=>$kind,'request'=>$text,'source'=>$source,'screen'=>$args['screen']??$session['screen']??[],'cancelled'=>false,'at'=>time()];$session['nativeTurns'][$id]=$entry;$session['nativeTurns']=array_slice($session['nativeTurns'],-100,null,true);break;
        }unset($session);$this->ai->write($r['version'],$s);return ['accepted'=>true,'kind'=>$entry['kind'],'request'=>$entry['request']];
    }
    public function cancel(array $args):array {
        $v=$this->session($args);$turn=LifeStore::text($args['turnId']??'',64,true);$r=$this->ai->read();$s=$r['state'];foreach($s['voiceSessions'] as &$session)if($session['id']===$v['id']){$session['nativeTurns'][$turn]??=['id'=>$turn,'kind'=>'command','request'=>'','source'=>'audio','at'=>time()];$session['nativeTurns'][$turn]['cancelled']=true;}unset($session);$this->ai->write($r['version'],$s);return $this->commandStatus($args+['requestId'=>'']);
    }
    public function commandStatus(array $args):array {
        $v=$this->session($args);$key=LifeStore::text($args['requestId']??'',100);$turn=LifeStore::text($args['turnId']??'',64);$entries=$v['nativeCommands']??[];if($key!==''&&!str_starts_with($key,'nv2-'))$key='nv2-'.substr(hash('sha256',$v['id'].'/'.$key),0,48);$saved=[];
        foreach($entries as $id=>$row)if(($key!==''&&$id===$key)||($key===''&&$turn!==''&&$row['turnId']===$turn))$saved[]=$row['receipt'];
        return ['status'=>$saved?'saved':'not_saved','receipts'=>$saved,'board'=>$this->store->read(),'data'=>$this->ai->read()];
    }
    private function nativeCommand(array $args,array $v):array {
        if($v['temporary'])throw new LifeError('Temporary rambles cannot change your planner.',403);
        $turnId=LifeStore::text($args['turnId']??'',64,true);$toolId=LifeStore::text($args['toolCallId']??'',100,true);$requestId=LifeStore::text($args['requestId']??'',64,true);
        $stable='nv2-'.substr(hash('sha256',$v['id'].'/'.$requestId),0,48);$turn=$v['nativeTurns'][$turnId]??null;
        if(isset($v['nativeCommands'][$stable])){$saved=$v['nativeCommands'][$stable];if($saved['turnId']!==$turnId)throw new LifeError('Command belongs to another spoken turn.',409);return $this->ai->read()+['receipt'=>$saved['receipt'],'board'=>$this->store->read(),'planner'=>LifeCommands::context($this->store->read()['state'])];}
        if(!$turn){$this->turn(['sessionId'=>$v['id'],'turnId'=>$turnId,'kind'=>'command','request'=>$args['plan']['request']??'','source'=>$args['source']??'greeting','hasSpeech'=>$args['hasSpeech']??false,'screen'=>$args['screen']??[]]);$v=$this->session($args);$turn=$v['nativeTurns'][$turnId]??null;}
        if(!$turn||$turn['kind']!=='command'||$turn['cancelled']||time()-$turn['at']>120)throw new LifeError('That spoken instruction is no longer active. No changes were made.',409);
        $plan=$args['plan']??[];if(!is_array($plan)||($plan['intent']??'')!=='instruction'||($plan['targetConfidence']??'')!=='clear')throw new LifeError('Please clarify the task or destination first.');
        $actions=$plan['actions']??[];if(!is_array($actions)||count($actions)<1||count($actions)>20)throw new LifeError('Ask for one to twenty changes.');
        foreach($actions as $action)if(!is_array($action)||!is_string($action['operation']??null)||!is_array($action['arguments']??null)||($action['arguments']!==[]&&array_is_list($action['arguments'])))throw new LifeError('Native action arguments must be a typed object.');
        foreach($actions as &$action){if(($action['operation']??'')==='goal.save'&&!isset($action['arguments']['type'])){$a=&$action['arguments'];if(isset($a['kind'])&&in_array($a['kind'],['adhoc','quarter','month','week'],true)){$a['type']=$a['kind'];unset($a['kind']);}elseif(empty($a['id'])&&empty($a['period'])){$a['type']='adhoc';$a['period']='';}unset($a);}}unset($action);$plan['actions']=$actions;
        $fields=LifeVoiceProtocol::FIELDS;
        foreach($actions as &$action){$op=$action['operation']??'';$a=&$action['arguments'];
            if(in_array($op,['task.save','goal.save','note.save','routine.save','map.save'],true)&&isset($a['name'])&&!isset($a['title'])){$a['title']=$a['name'];unset($a['name']);}
            if(in_array($op,['board.save','list.save'],true)&&isset($a['title'])&&!isset($a['name'])){$a['name']=$a['title'];unset($a['title']);}
            if(str_ends_with($op,'.save')&&!empty($a['id'])&&count($a)===1)throw new LifeError('Please specify what to change.');if(!isset($fields[$op])||array_diff(array_keys($a),$fields[$op]))throw new LifeError('That operation received unsupported fields. Use the documented fields for '.$op.'.');unset($a);
        }unset($action);$plan['actions']=$actions;
        $schema=LifeVoiceProtocol::schema()['properties']['actions']['items']['properties']['arguments']['properties'];
        foreach($actions as $action){$arguments=$action['arguments']??null;if(!is_array($arguments)||($arguments!==[]&&array_is_list($arguments)))throw new LifeError('Native action arguments must be an object.');
            foreach($arguments as $key=>$value){if(!isset($schema[$key]))throw new LifeError('Unsupported action field: '.$key);$type=$schema[$key]['type'];if($value===null&&($schema[$key]['nullable']??false))continue;if(($type==='STRING'&&!is_string($value))||($type==='BOOLEAN'&&!is_bool($value))||($type==='INTEGER'&&!is_int($value))||($type==='ARRAY'&&!is_array($value)))throw new LifeError('Invalid action field: '.$key);}
            $required=match($action['operation']??''){'task.move'=>['id','listId'],'task.complete','checklist.toggle'=>['id','done'],'task.schedule'=>['id','date'],'task.dependencies'=>['id','ids'],default=>[]};if(($action['operation']??'')==='checklist.toggle')$required[]='itemId';foreach($required as $key)if(!array_key_exists($key,$arguments))throw new LifeError('Missing action field: '.$key);
            if(($action['operation']??'')==='task.complete'&&array_diff(array_keys($arguments),['id','done']))throw new LifeError('Completion uses id and done only.');
        }
        foreach($actions as &$action)if($action['operation']==='task.book')$action['arguments']=LifeCalendarBooking::normalize($action['arguments'],$turn['request'],$this->store->read()['state'],$turn['screen']??[]);unset($action);$plan['actions']=$actions;$plan['_screen']=$turn['screen']??[];
        $fingerprint=hash('sha256',json_encode(LifeVoiceProtocol::ordered($actions),JSON_THROW_ON_ERROR));
        foreach($v['nativeCommands']??[] as $row)if($row['turnId']===$turnId&&($row['fingerprint']??'')===$fingerprint){$r=$this->ai->read();$s=$r['state'];foreach($s['voiceSessions'] as &$session)if($session['id']===$v['id'])$session['nativeCommands'][$stable]=$row;unset($session);$updated=$this->ai->write($r['version'],$s);return $updated+['receipt'=>$row['receipt'],'board'=>$this->store->read(),'planner'=>LifeCommands::context($this->store->read()['state'])];}
        $plan['_fingerprint']=$fingerprint;if(array_filter($actions,fn($a)=>preg_match('/^(tracker|category|opportunity)\./',$a['operation']))){if(!is_int($args['applicationsVersion']??null))throw new LifeError('Refresh the application context before saving.',409);$plan['_applicationsVersion']=$args['applicationsVersion'];}
        $text=$turn['request'];if(preg_match('/\bremind me\b|\b(?:set|add|remove|clear|change) (?:a |the |my )?reminder\b/iu',$text)&&!array_filter($actions,fn($a)=>$a['operation']==='task.save'&&array_key_exists('reminderMinutes',$a['arguments'])))throw new LifeError('A reminder needs task.save with dueDate, dueTime and reminderMinutes. Scheduling a work block does not set a reminder.');$caption=LifeStore::text($args['text']??'',6000);if($caption!==''&&preg_match('/\b(do not|don[’\x{0027}]?t|never|not yet|cancel|stop)\b/iu',$caption))throw new LifeError('I heard a cancellation. No changes were made.');
        require_once __DIR__.'/applications.php';$applicationState=(new LifeApplications($this->store))->read()['state'];LifeApplications::voiceTargets($applicationState,$actions,$text,$turn['screen']??[]);LifeVoiceProtocol::targets(array_merge($this->store->read()['state'],array_intersect_key($applicationState,array_flip(['trackers','categories','opportunities']))),$actions,$text,$v['focus']??[],$turn['screen']??[]);$plan['authorization']=$text;$plan['_turnId']=$turnId;$r=$this->ai->read();
        $result=LifeCommands::execute($this->store,$this->ai,$r['version'],(int)($args['boardVersion']??0),$text,$plan,$stable,$v['id'],true);
        return $result+['applicationsVersion'=>(new LifeApplications($this->store))->read()['version'],'planner'=>LifeCommands::context($result['board']['state'])];
    }
    public function navigate(array $args):array {
        $v=$this->session($args);$view=$args['view']??'';if(!in_array($view,['board','goals','today','companion','task-history','analytics','week','calendar','routines','notes','mindmap','applications'],true))throw new LifeError('That view is unavailable.');
        $bid=LifeStore::text($args['boardId']??'',32);if($bid!==''&&!array_filter($this->store->read()['state']['boards'],fn($b)=>$b['id']===$bid&&!$b['archived']))throw new LifeError('That board is unavailable.');return ['navigation'=>['view'=>$view,'boardId'=>$bid],'confirmation'=>'Opened '.($view==='board'?'your board':str_replace('-',' ',$view)).'.'];
    }
    public function undoNative(array $args):array {
        $v=$this->session($args);if(!isset($v['nativeTurns'][$args['turnId']??''])){$this->turn(['sessionId'=>$v['id'],'turnId'=>$args['turnId']??'','kind'=>'command','request'=>$args['plan']['request']??'','source'=>$args['source']??'greeting','hasSpeech'=>$args['hasSpeech']??false,'screen'=>$args['screen']??[]]);$v=$this->session($args);}$turn=$v['nativeTurns'][$args['turnId']??'']??null;if(!$turn||$turn['kind']!=='command'||$turn['cancelled']||!preg_match('/\bundo\b/iu',$turn['request'])||$v['temporary'])throw new LifeError('Ask explicitly to undo the last change.');
        $key=LifeStore::text($args['requestId']??'',64,true);$stable='nv2-'.substr(hash('sha256',$v['id'].'/'.$key),0,48);
        if(isset($v['nativeCommands'][$stable]))return $this->ai->read()+['receipt'=>$v['nativeCommands'][$stable]['receipt'],'board'=>$this->store->read()];
        $r=$this->ai->read();$commands=array_values(array_filter($r['state']['commands']??[],fn($c)=>!$c['undone']));$last=end($commands);if(!$last)throw new LifeError('There is no saved change to undo.');
        return LifeCommands::undo($this->store,$this->ai,$r['version'],$last['id'],['sessionId'=>$v['id'],'turnId'=>$args['turnId'],'requestId'=>$stable]);
    }
    private function nativeResolve(array $args,array $v):array {
        $turnId=LifeStore::text($args['turnId']??'',64,true);$turn=$v['nativeTurns'][$turnId]??null;$reply=self::cleanVoice(LifeStore::text($args['reply']??'',20000));$error=LifeStore::text($args['toolError']??'',1000);$receipts=[];
        foreach($v['nativeCommands']??[] as $row)if($row['turnId']===$turnId){$receipt=$row['receipt'];$live=array_values(array_filter($this->ai->read()['state']['commands']??[],fn($c)=>$c['id']===$receipt['id']));if($live&&$live[0]['undone'])continue;$receipts[$receipt['id']]=$receipt;}
        $confirmation=implode(' ',array_column($receipts,'summary'));$claim=self::changeClaim($reply);
        if($error!=='')$confirmation=($confirmation!==''?$confirmation.' Some requested changes were not saved. ':'I haven’t changed your planner. ').$error;
        if(!$receipts&&$error===''&&($claim||($turn['kind']??'')==='command'))$confirmation='I haven’t changed your planner. Please tell me the task name and what you want me to do.';
        $safe=$confirmation===''?!$claim:LifeVoiceProtocol::agrees($reply,$confirmation);
        $answer=['turnId'=>$turnId,'reply'=>$confirmation!==''?$confirmation:$reply,'playback'=>$safe?'play':'repair','confirmation'=>$confirmation,'commandId'=>$receipts?end($receipts)['id']:'','persisted'=>false,'data'=>$this->ai->read(),'board'=>$this->store->read()];
        return $answer;
    }
}

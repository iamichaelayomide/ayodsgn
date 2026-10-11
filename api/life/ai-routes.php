<?php
declare(strict_types=1);
function life_ai_route(LifeStore $store,string $method,string $action,array $input):never {
    require_once __DIR__.'/ai.php';$config=LifeAI::configuration();$ai=new LifeAI($store,$config);
    if($method==='GET'&&$action==='ai')life_ai_json($ai->read());
    if($method!=='POST')throw new LifeError('Method not allowed.',405);
    if($action==='ai.configure'){
        if(($input['freeOnly']??false)!==true)throw new LifeError('Confirm that the Google project has billing disabled.',403);$key=LifeStore::text($input['key']??'',200,true);if(!preg_match('/^[A-Za-z0-9_.-]{20,200}$/',$key))throw new LifeError('Check your Gemini API key.');$model=$input['model']??'gemini-3.8-flash';if(!in_array($model,['gemini-3.8-flash','gemini-3.5-flash-lite','gemini-2.5-flash'],true))throw new LifeError('Choose a supported model.');$path=LifeAI::privatePath();$tmp=tempnam(dirname($path),'life-ai-');try{chmod($tmp,0600);if(file_put_contents($tmp,'<?php return '.var_export(['key'=>$key,'model'=>$model,'freeOnly'=>true],true).';')===false||!rename($tmp,$path))throw new LifeError('Private AI configuration could not be saved.',503);}finally{if(is_file($tmp))unlink($tmp);}life_ai_json((new LifeAI($store,LifeAI::configuration()))->read());
    }
    if($action==='ai.models'){if(empty($config['key']))throw new LifeError('Connect Gemini first.',503);$ch=curl_init('https://generativelanguage.googleapis.com/v1beta/models?pageSize=1000');curl_setopt_array($ch,[CURLOPT_RETURNTRANSFER=>true,CURLOPT_TIMEOUT=>20,CURLOPT_HTTPHEADER=>['x-goog-api-key: '.$config['key']]]);$body=curl_exec($ch);$status=curl_getinfo($ch,CURLINFO_RESPONSE_CODE);curl_close($ch);if($status!==200||!is_string($body))throw new LifeError('Gemini could not verify available models. Check the key.',503);$available=json_decode($body,true,128,JSON_THROW_ON_ERROR);life_ai_json(['models'=>array_values(array_map(fn($m)=>['name'=>str_replace('models/','',$m['name']),'displayName'=>$m['displayName']],array_filter($available['models']??[],fn($m)=>in_array('generateContent',$m['supportedGenerationMethods']??[],true)&&str_contains($m['name'],'flash'))))]);}
    if($action==='ai.disconnect'){$path=LifeAI::privatePath();if(is_file($path))unlink($path);life_ai_json((new LifeAI($store,[]))->read());}
    if($action==='ai.voice.start'){require_once __DIR__.'/voice.php';life_ai_json((new LifeVoice($store,$ai,$config))->start($input));}
    if($action==='ai.voice.context'){require_once __DIR__.'/voice.php';life_ai_json((new LifeVoice($store,$ai,$config))->context($input));}
    if($action==='ai.voice.command'){require_once __DIR__.'/voice.php';life_ai_json((new LifeVoice($store,$ai,$config))->command($input));}
    if($action==='ai.voice.save'){require_once __DIR__.'/voice.php';life_ai_json((new LifeVoice($store,$ai,$config))->save($input));}
    if(!is_int($input['version']??null))throw new LifeError('Reload the AI workspace.',409);
    if($action==='ai.command.undo')life_ai_json(LifeCommands::undo($store,$ai,$input['version'],LifeStore::text($input['id']??'',32,true)));
    if($action==='ai.voice.command'){require_once __DIR__.'/voice.php';life_ai_json((new LifeVoice($store,$ai,$config))->command($input));}
    if($action==='ai.preview')life_ai_json(['context'=>LifeAI::context($store->read()['state'],LifeStore::text($input['text']??'',6000),$ai->read()['state']['memories'])]);
    if($action==='ai.send.stream'){define('LIFE_AI_STREAM',true);header('Content-Type: application/x-ndjson; charset=utf-8');header('X-Accel-Buffering: no');while(ob_get_level()>0)ob_end_flush();try{$value=$ai->send($input['version'],$input);foreach($value['state']['commands']??[] as $i=>$c)unset($value['state']['commands'][$i]['before'],$value['state']['commands'][$i]['beforeMemories'],$value['state']['commands'][$i]['afterMemories']);echo json_encode(['result'=>$value],JSON_THROW_ON_ERROR)."\n";}catch(Throwable $e){echo json_encode(['error'=>$e instanceof LifeError?$e->getMessage():'Ramble could not respond. Your draft is preserved.'])."\n";}flush();exit;}
    if($action==='ai.send')life_ai_json($ai->send($input['version'],$input));
    if($action==='ai.apply'||$action==='ai.undo')life_ai_json($ai->apply($input['version'],$input,$action==='ai.undo'));
    if($action==='ai.mutate')life_ai_json($ai->mutate($input['version'],LifeStore::text($input['action']??'',60,true),$input['args']??[]));
    throw new LifeError('Unknown AI request.',404);
}

function life_ai_json(array $value):never {foreach($value['state']['commands']??[] as $i=>$c)unset($value['state']['commands'][$i]['before'],$value['state']['commands'][$i]['beforeMemories'],$value['state']['commands'][$i]['afterMemories']);life_json($value);}

<?php
declare(strict_types=1);
require_once __DIR__.'/oauth.php';
life_headers();
try{
 if(($_SERVER['HTTP_HOST']??'')!=='life.ayodsgn.com')throw new LifeError('Use the canonical Life planner origin.',403);
 $config=life_config();$db=new PDO($config['dsn'],$config['user']??null,$config['password']??null,[PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION,PDO::ATTR_DEFAULT_FETCH_MODE=>PDO::FETCH_ASSOC,PDO::ATTR_EMULATE_PREPARES=>false]);$oauth=new LifeConnections($db);$action=$_GET['action']??'';$method=$_SERVER['REQUEST_METHOD']??'GET';
 $oauth->limit('public:'.($_SERVER['REMOTE_ADDR']??''),600);
 if($action==='authorize'&&$method==='GET'){$id=$oauth->pending($_GET);header('Location: /life/connections/?request='.$id, true,302);exit;}
 if($method!=='POST')throw new LifeError('Method not allowed.',405);
 if((int)($_SERVER['CONTENT_LENGTH']??0)>20000)throw new LifeError('Request too large.',413);
 if(str_starts_with($_SERVER['CONTENT_TYPE']??'','application/json')){$in=json_decode(file_get_contents('php://input',false,null,0,20001),true,32,JSON_THROW_ON_ERROR);if(!is_array($in))throw new LifeError('Send an object.',400);}else $in=$_POST;
 if($action==='register'){$oauth->limit('register:'.($_SERVER['REMOTE_ADDR']??''),30);life_json($oauth->register($in),201);}
 if($action==='token')life_json($oauth->exchange($in));
 if($action==='revoke'){$oauth->revokeToken($in);life_json(['ok'=>true]);}
 throw new LifeError('Unknown endpoint.',404);
}catch(LifeError $e){life_json(['error'=>match($e->status){401=>'invalid_token',429=>'temporarily_unavailable',default=>'invalid_request'},'error_description'=>$e->getMessage()],$e->status);}catch(JsonException){life_json(['error'=>'invalid_request','error_description'=>'Send a valid JSON object.'],400);}catch(Throwable){life_json(['error'=>'server_error','error_description'=>'The planner connection is temporarily unavailable.'],503);}

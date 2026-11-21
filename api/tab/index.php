<?php
declare(strict_types=1);
require_once __DIR__.'/../life/bootstrap.php';
require_once __DIR__.'/team.php';
life_headers();
try {
    $config=life_config();$db=new PDO($config['dsn'],$config['user']??null,$config['password']??null,[PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION,PDO::ATTR_DEFAULT_FETCH_MODE=>PDO::FETCH_ASSOC,PDO::ATTR_EMULATE_PREPARES=>false]);
    ini_set('session.use_strict_mode','1');ini_set('session.use_only_cookies','1');session_name('tabteam');session_set_cookie_params(['lifetime'=>0,'path'=>'/','secure'=>($_SERVER['HTTPS']??'')==='on','httponly'=>true,'samesite'=>'Lax']);session_start();
    if(($_SESSION['seen']??time())<time()-86400)$_SESSION=[];$_SESSION['csrf']??=bin2hex(random_bytes(32));$team=new TabTeam($db);$action=$_GET['action']??'session';$method=$_SERVER['REQUEST_METHOD']??'GET';$account=(int)($_SESSION['account']??0);if($account){$identity=$team->identityStamp($account);if($identity===''||!hash_equals($identity,(string)($_SESSION['identity']??''))||($_SESSION['issued']??0)<time()-7*86400){unset($_SESSION['account']);$account=0;}}
    if($method==='GET'){
        if($action==='session'){if(!$account)life_json(['authenticated'=>false,'csrf'=>$_SESSION['csrf']]);try{$data=$team->read($account);}catch(LifeError $e){if($e->status!==403)throw $e;unset($_SESSION['account']);life_json(['authenticated'=>false,'csrf'=>$_SESSION['csrf'],'notice'=>$e->getMessage()]);}$_SESSION['seen']=time();life_json(['authenticated'=>true,'csrf'=>$_SESSION['csrf']]+$data);}
        if(!$account)throw new LifeError('Sign in to Tab.',401);$_SESSION['seen']=time();
        if($action==='board')life_json($team->read($account));
        if($action==='activity')life_json($team->events($account,max(0,(int)($_GET['before']??0)),LifeStore::text($_GET['item']??'',254)));
        throw new LifeError('Unknown request.',404);
    }
    if($method!=='POST')throw new LifeError('Method not allowed.',405);
    if(!hash_equals($_SESSION['csrf'],$_SERVER['HTTP_X_CSRF_TOKEN']??''))throw new LifeError('Your session changed. Reload Tab.',403);
    if(stripos($_SERVER['CONTENT_TYPE']??'','application/json')!==0)throw new LifeError('Send JSON.',415);
    $raw=file_get_contents('php://input',false,null,0,100001);if($raw===false||strlen($raw)>100000)throw new LifeError('Request too large.',413);$input=json_decode($raw,true,32,JSON_THROW_ON_ERROR);if(!is_array($input))throw new LifeError('Invalid request.',400);
    if($action==='login'){
        $invite=LifeStore::text($input['invite']??'',64);if($invite!==''&&!preg_match('/^[a-f0-9]{64}$/D',$invite))throw new LifeError('Invalid invitation.',403);
        $_SESSION['flow']=bin2hex(random_bytes(32));$_SESSION['flowExpires']=time()+600;$_SESSION['invite']=$invite;
        life_json(['url'=>'https://life.ayodsgn.com/tab/connect.php?state='.$_SESSION['flow']]);
    }
    if($action==='accept'){
        $state=LifeStore::text($input['state']??'',64,true);if(!isset($_SESSION['flow'])||($_SESSION['flowExpires']??0)<time()||!hash_equals($_SESSION['flow'],$state))throw new LifeError('Sign-in expired. Start again.',403);
        $team->seed();$data=$team->consumeBridge(LifeStore::text($input['token']??'',64,true),$state,$_SESSION['invite']??'');
        $q=$db->prepare("SELECT account_id FROM tab_member WHERE workspace='tab' AND email=? AND status='active'");$q->execute([$data['me']['email']]);$account=(int)$q->fetchColumn();
        session_regenerate_id(true);$_SESSION=['account'=>$account,'identity'=>$team->identityStamp($account),'issued'=>time(),'csrf'=>bin2hex(random_bytes(32)),'seen'=>time()];life_json(['authenticated'=>true,'csrf'=>$_SESSION['csrf']]+$data);
    }
    if($action==='logout'){$_SESSION=[];session_regenerate_id(true);life_json(['ok'=>true]);}
    if(!$account)throw new LifeError('Sign in to Tab.',401);$_SESSION['seen']=time();
    if($action==='mutate'){if(!is_int($input['version']??null)||!is_array($input['args']??null))throw new LifeError('Refresh before saving.',422);life_json($team->mutate($account,$input['version'],LifeStore::text($input['action']??'',40,true),$input['args']));}
    throw new LifeError('Unknown request.',404);
}catch(LifeError $e){life_json(['error'=>$e->getMessage()],$e->status);}catch(JsonException $e){life_json(['error'=>'Invalid request data.'],400);}catch(Throwable $e){error_log('Tab request failed: '.get_class($e));life_json(['error'=>'Tab is temporarily unavailable. Please try again.'],503);}

<?php
declare(strict_types=1);
require __DIR__.'/bootstrap.php';
require __DIR__.'/partners.php';
life_headers();
try {
    $config=life_config(); $store=life_store($config); life_session();
    if (isset($_SESSION['owner'])) {
        $owner=$store->owner();
        if (!$owner || !hash_equals(hash('sha256',$owner['password_hash']),$_SESSION['credential']??'')) { $_SESSION=[];session_regenerate_id(true);$_SESSION['csrf']=bin2hex(random_bytes(32)); }
    }
    if(isset($_SESSION['partner'])) { $p=(new LifePartners($store))->find($_SESSION['partner']); if(!$p||$p['revoked']||!hash_equals(hash('sha256',$p['password_hash']??''),$_SESSION['credential']??'')){$_SESSION=[];session_regenerate_id(true);$_SESSION['csrf']=bin2hex(random_bytes(32));}}
    $signed=isset($_SESSION['owner'])||isset($_SESSION['partner']);$role=isset($_SESSION['partner'])?'partner':'owner';
    $method=$_SERVER['REQUEST_METHOD']??'GET'; $action=$_GET['action']??'session';
    if ($method==='GET') {
        if ($action==='session') life_json(['authenticated'=>$signed,'role'=>$role,'setupRequired'=>$store->owner()===null,'csrf'=>$_SESSION['csrf']]);
        if (!$signed) throw new LifeError('Sign in to access your planner.',401);
        if ($action==='attachment') {require __DIR__.'/attachments.php';$id=LifeStore::text($_GET['id']??'',32,true);$record=null;foreach($store->read()['state']['attachments']??[] as $a)if($a['id']===$id&&!$a['archived'])$record=$a;if(!$record||!preg_match('/^[a-f0-9]{32}$/',$id))throw new LifeError('File not found.',404);$path=life_attachment_dir($config).'/'.$id;if(!is_file($path))throw new LifeError('File not found.',404);header('Content-Type: '.$record['mime']);header("Content-Disposition: attachment; filename*=UTF-8''".rawurlencode($record['name']));readfile($path);exit;}
        if ($action==='board') life_json($store->read()+['role'=>$role]);
        if ($action==='partners'&&$role==='owner')life_json(['partners'=>(new LifePartners($store))->list()]);
        if ($action==='backup') {if($role!=='owner')throw new LifeError('Only the owner can back up the planner.',403);require __DIR__.'/attachments.php';if(!class_exists('ZipArchive'))throw new LifeError('Archive support is unavailable. Download JSON and attachments separately.',503);$tmp=tempnam(life_attachment_dir($config),'backup-');try{$zip=new ZipArchive();if($zip->open($tmp,ZipArchive::OVERWRITE)!==true)throw new LifeError('Backup could not be created.',503);$snapshot=$store->read();$zip->addFromString('planner.json',json_encode(['format'=>'ayodsgn-life','schema'=>1,'exportedAt'=>LifeStore::now()]+$snapshot,JSON_THROW_ON_ERROR));foreach($snapshot['state']['attachments']??[] as $a){if(!preg_match('/^[a-f0-9]{32}$/',$a['id']))continue;$path=life_attachment_dir($config).'/'.$a['id'];if(is_file($path))$zip->addFile($path,'files/'.$a['id']);}$zip->close();header('Content-Type: application/zip');header('Content-Disposition: attachment; filename="ayodsgn-life-backup.zip"');readfile($tmp);}finally{unlink($tmp);}exit;}
        if ($action==='calendar-export') {require __DIR__.'/calendar-export.php';header('Content-Type: text/calendar; charset=utf-8');header('Content-Disposition: attachment; filename="ayodsgn-life.ics"');echo life_ical($store->read()['state']);exit;}
        if ($action==='export') {
            if($role!=='owner')throw new LifeError('Only the owner can export the planner.',403);
            header('Content-Disposition: attachment; filename="ayodsgn-life-'.gmdate('Y-m-d').'.json"');
            life_json(['format'=>'ayodsgn-life','schema'=>1,'exportedAt'=>LifeStore::now()]+$store->read());
        }
        throw new LifeError('Unknown request.',404);
    }
    if ($method!=='POST') throw new LifeError('Method not allowed.',405);
    if($action==='upload') {if(!$signed||$role!=='owner')throw new LifeError('Only the owner can upload files.',403);if(!hash_equals($_SESSION['csrf'],$_SERVER['HTTP_X_CSRF_TOKEN']??''))throw new LifeError('Your session changed.',403);require __DIR__.'/attachments.php';life_json(life_upload($store,$config,$_POST));}
    if (stripos($_SERVER['CONTENT_TYPE']??'','application/json')!==0) throw new LifeError('Send JSON data.',415);
    if ((int)($_SERVER['CONTENT_LENGTH']??0)>150000) throw new LifeError('Request is too large.',413);
    $input=json_decode(file_get_contents('php://input'),true,64,JSON_THROW_ON_ERROR);
    if (!is_array($input)) throw new LifeError('Invalid request.',400);
    if (!hash_equals($_SESSION['csrf'],$_SERVER['HTTP_X_CSRF_TOKEN']??'')) throw new LifeError('Your session changed. Reload and try again.',403);
    if ($action==='partner.accept') {
        $store->throttle($_SERVER['REMOTE_ADDR']??'unknown');$p=(new LifePartners($store))->accept(LifeStore::text($input['id']??'',32,true),LifeStore::text($input['token']??'',64,true),LifeStore::text($input['password']??'',200,true));session_regenerate_id(true);$_SESSION=['partner'=>$p['id'],'csrf'=>bin2hex(random_bytes(32)),'last_activity'=>time(),'credential'=>hash('sha256',$p['password_hash'])];life_json(['authenticated'=>true,'role'=>'partner','csrf'=>$_SESSION['csrf']]);
    }
    if ($action==='login' || $action==='setup') {
        $store->throttle($_SERVER['REMOTE_ADDR']??'unknown');
        $password=$input['password']??'';
        if (!is_string($password) || strlen($password)>200) throw new LifeError('Check your password.',422);
        if ($action==='setup') {
            $token=$input['token']??'';
            if (!is_string($token) || !hash_equals($config['setup_token_hash'],hash('sha256',$token))) throw new LifeError('The setup key is invalid.',403);
            $store->initialize($password);
        } elseif(!empty($input['partnerId'])) {
            $p=(new LifePartners($store))->find(LifeStore::text($input['partnerId'],32,true));if(!$p||$p['revoked']||!password_verify($password,$p['password_hash']??''))throw new LifeError('Check your partner ID and password.',401);session_regenerate_id(true);$_SESSION=['partner'=>$p['id'],'csrf'=>bin2hex(random_bytes(32)),'last_activity'=>time(),'credential'=>hash('sha256',$p['password_hash'])];life_json(['authenticated'=>true,'role'=>'partner','csrf'=>$_SESSION['csrf']]);
        } else {
            $owner=$store->owner();
            $hash=$owner['password_hash']??'$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.';
            if (!password_verify($password,$hash) || !$owner) throw new LifeError('The password is incorrect.',401);
        }
        session_regenerate_id(true); $_SESSION=['owner'=>1,'csrf'=>bin2hex(random_bytes(32)),'last_activity'=>time(),'credential'=>hash('sha256',$store->owner()['password_hash'])];
        life_json(['authenticated'=>true,'csrf'=>$_SESSION['csrf']]);
    }
    if (!$signed) throw new LifeError('Sign in to access your planner.',401);
    if ($action==='logout') {
        $_SESSION=[]; session_destroy(); setcookie('ayolife','',['expires'=>time()-3600,'path'=>'/','secure'=>($_SERVER['HTTPS']??'')==='on','httponly'=>true,'samesite'=>'Strict']); life_json(['authenticated'=>false]);
    }
    if($action==='partner.invite'||$action==='partner.revoke'){if($role!=='owner')throw new LifeError('Only the owner manages partners.',403);$partners=new LifePartners($store);if($action==='partner.invite')life_json($partners->invite(LifeStore::text($input['name']??'',100,true)));$partners->revoke(LifeStore::text($input['id']??'',32,true));life_json(['ok'=>true]);}
    if ($action==='mutate') {
        if (!is_int($input['version']??null) || !is_string($input['action']??null) || !is_array($input['args']??null)) throw new LifeError('Invalid board update.',400);
        if($input['action']==='attachment.add')throw new LifeError('Use the authenticated file upload.',403);
        life_json($store->mutate($input['version'],$input['action'],$input['args'],$role,$_SESSION['partner']??'owner'));
    }
    throw new LifeError('Unknown request.',404);
} catch (LifeError $e) { life_json(['error'=>$e->getMessage()],$e->status); }
catch (JsonException $e) { life_json(['error'=>'Invalid JSON data.'],400); }
catch (Throwable $e) { error_log('Life planner error: '.get_class($e)); life_json(['error'=>'The planner could not complete this request. Your draft is preserved; please retry.'],503); }

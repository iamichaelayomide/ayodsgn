<?php
declare(strict_types=1);
require __DIR__.'/bootstrap.php';
life_headers();
try {
    $config=life_config(); $store=life_store($config); life_session();
    if (isset($_SESSION['owner'])) {
        $owner=$store->owner();
        if (!$owner || !hash_equals(hash('sha256',$owner['password_hash']),$_SESSION['credential']??'')) { $_SESSION=[];session_regenerate_id(true);$_SESSION['csrf']=bin2hex(random_bytes(32)); }
    }
    $method=$_SERVER['REQUEST_METHOD']??'GET'; $action=$_GET['action']??'session';
    if ($method==='GET') {
        if ($action==='session') life_json(['authenticated'=>isset($_SESSION['owner']),'setupRequired'=>$store->owner()===null,'csrf'=>$_SESSION['csrf']]);
        if (!isset($_SESSION['owner'])) throw new LifeError('Sign in to access your planner.',401);
        if ($action==='board') life_json($store->read());
        if ($action==='export') {
            header('Content-Disposition: attachment; filename="ayodsgn-life-'.gmdate('Y-m-d').'.json"');
            life_json(['format'=>'ayodsgn-life','schema'=>1,'exportedAt'=>LifeStore::now()]+$store->read());
        }
        throw new LifeError('Unknown request.',404);
    }
    if ($method!=='POST') throw new LifeError('Method not allowed.',405);
    if (stripos($_SERVER['CONTENT_TYPE']??'','application/json')!==0) throw new LifeError('Send JSON data.',415);
    if ((int)($_SERVER['CONTENT_LENGTH']??0)>150000) throw new LifeError('Request is too large.',413);
    $input=json_decode(file_get_contents('php://input'),true,64,JSON_THROW_ON_ERROR);
    if (!is_array($input)) throw new LifeError('Invalid request.',400);
    if (!hash_equals($_SESSION['csrf'],$_SERVER['HTTP_X_CSRF_TOKEN']??'')) throw new LifeError('Your session changed. Reload and try again.',403);
    if ($action==='login' || $action==='setup') {
        $store->throttle($_SERVER['REMOTE_ADDR']??'unknown');
        $password=$input['password']??'';
        if (!is_string($password) || strlen($password)>200) throw new LifeError('Check your password.',422);
        if ($action==='setup') {
            $token=$input['token']??'';
            if (!is_string($token) || !hash_equals($config['setup_token_hash'],hash('sha256',$token))) throw new LifeError('The setup key is invalid.',403);
            $store->initialize($password);
        } else {
            $owner=$store->owner();
            $hash=$owner['password_hash']??'$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.';
            if (!password_verify($password,$hash) || !$owner) throw new LifeError('The password is incorrect.',401);
        }
        session_regenerate_id(true); $_SESSION=['owner'=>1,'csrf'=>bin2hex(random_bytes(32)),'last_activity'=>time(),'credential'=>hash('sha256',$store->owner()['password_hash'])];
        life_json(['authenticated'=>true,'csrf'=>$_SESSION['csrf']]);
    }
    if (!isset($_SESSION['owner'])) throw new LifeError('Sign in to access your planner.',401);
    if ($action==='logout') {
        $_SESSION=[]; session_destroy(); setcookie('ayolife','',['expires'=>time()-3600,'path'=>'/','secure'=>($_SERVER['HTTPS']??'')==='on','httponly'=>true,'samesite'=>'Strict']); life_json(['authenticated'=>false]);
    }
    if ($action==='mutate') {
        if (!is_int($input['version']??null) || !is_string($input['action']??null) || !is_array($input['args']??null)) throw new LifeError('Invalid board update.',400);
        life_json($store->mutate($input['version'],$input['action'],$input['args']));
    }
    throw new LifeError('Unknown request.',404);
} catch (LifeError $e) { life_json(['error'=>$e->getMessage()],$e->status); }
catch (JsonException $e) { life_json(['error'=>'Invalid JSON data.'],400); }
catch (Throwable $e) { error_log('Life planner error: '.get_class($e)); life_json(['error'=>'The planner could not complete this request. Your draft is preserved; please retry.'],503); }

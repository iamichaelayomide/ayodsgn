<?php
declare(strict_types=1);
require __DIR__.'/bootstrap.php';
require __DIR__.'/partners.php';
life_headers();
try {
    $config=life_config();
    // Scoped research workers use a bearer token, never a browser session or owner cookie.
    $externalAction=$_GET['action']??'';
    if(is_string($externalAction)&&str_starts_with($externalAction,'opportunity-agents.')){
        if(($_SERVER['REQUEST_METHOD']??'')!=='POST')throw new LifeError('Method not allowed.',405);
        if(!in_array($externalAction,['opportunity-agents.poll','opportunity-agents.result'],true))throw new LifeError('Research action unavailable.',404);
        $authorization=$_SERVER['HTTP_AUTHORIZATION']??$_SERVER['REDIRECT_HTTP_AUTHORIZATION']??'';
        if(!is_string($authorization)||!preg_match('/^Bearer [a-f0-9]{64}$/D',$authorization))throw new LifeError('Research connection authentication required.',401);
        if(!preg_match('~^application/json(?:\s*;|\s*$)~i',trim($_SERVER['CONTENT_TYPE']??'')))throw new LifeError('Send JSON data.',415);
        if((int)($_SERVER['CONTENT_LENGTH']??0)>150000)throw new LifeError('Request is too large.',413);
        $raw=file_get_contents('php://input',false,null,0,150001);if($raw===false||strlen($raw)>150000)throw new LifeError('Request is too large.',413);
        $object=json_decode($raw,false,64,JSON_THROW_ON_ERROR);if(!($object instanceof stdClass))throw new LifeError('Send a JSON object.',400);
        $input=json_decode($raw,true,64,JSON_THROW_ON_ERROR);
        $db=new PDO($config['dsn'],$config['user']??null,$config['password']??null,[PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION,PDO::ATTR_DEFAULT_FETCH_MODE=>PDO::FETCH_ASSOC,PDO::ATTR_EMULATE_PREPARES=>false]);
        require_once __DIR__.'/opportunity-agents.php';life_json(life_opportunity_agents_external($externalAction,$db,$input,$authorization));
    }
    if(($_GET['action']??'')==='google.webhook'){if(($_SERVER['REQUEST_METHOD']??'')!=='POST')throw new LifeError('Method not allowed.',405);$webhookStore=life_store($config);require_once __DIR__.'/google-sync.php';if(!LifeGoogleSync::webhook($webhookStore->db,['channel'=>$_SERVER['HTTP_X_GOOG_CHANNEL_ID']??'','token'=>$_SERVER['HTTP_X_GOOG_CHANNEL_TOKEN']??'','resource'=>$_SERVER['HTTP_X_GOOG_RESOURCE_ID']??'']))throw new LifeError('Unknown notification channel.',403);http_response_code(204);exit;} life_session();$store=life_store($config);require_once __DIR__.'/accounts.php';require_once __DIR__.'/google-auth.php';$accounts=new LifeAccounts($store->db);require_once __DIR__.'/remember.php';$device=new LifeRemember($store->db);if(LifeRemember::identity($_SESSION)===null&&!empty($_COOKIE[LifeRemember::COOKIE])){$resumed=$device->resume((string)$_COOKIE[LifeRemember::COOKIE],time());if($resumed){session_regenerate_id(true);$_SESSION=$resumed;}else life_device_cookie('',time()-3600);}
    if(isset($_SESSION['userId'])){if(!$accounts->find((int)$_SESSION['userId'])||(isset($_SESSION['emailCredential'])&&(!hash_equals($accounts->credentialFingerprint((int)$_SESSION['userId']),(string)$_SESSION['emailCredential'])||$accounts->credentialFingerprint((int)$_SESSION['userId'])===''))){$_SESSION=[];$_SESSION['csrf']=bin2hex(random_bytes(32));}else $store=new LifeStore($store->db,(int)$_SESSION['userId']);}
    if(isset($_SESSION['partner'])&&isset($_SESSION['tenantId']))$store=new LifeStore($store->db,(int)$_SESSION['tenantId']);
    $googleMembership=null;if(isset($_SESSION['userId'])&&isset($_SESSION['workspaceId'])&&(int)$_SESSION['workspaceId']!==(int)$_SESSION['userId']){new LifePartners($store);$q=$store->db->prepare('SELECT * FROM life_partner WHERE owner_id=? AND user_id=? AND revoked=0');$q->execute([(int)$_SESSION['workspaceId'],(int)$_SESSION['userId']]);$googleMembership=$q->fetch(PDO::FETCH_ASSOC);if($googleMembership)$store=new LifeStore($store->db,(int)$_SESSION['workspaceId']);else unset($_SESSION['workspaceId']);}
    if (isset($_SESSION['owner'])) {
        $owner=$store->owner();
        if (!$owner || !hash_equals(hash('sha256',$owner['password_hash']),$_SESSION['credential']??'')) { $_SESSION=[];session_regenerate_id(true);$_SESSION['csrf']=bin2hex(random_bytes(32)); }
    }
    if(isset($_SESSION['partner'])) { $p=(new LifePartners($store))->find($_SESSION['partner']); if(!$p||$p['revoked']||!hash_equals(hash('sha256',$p['password_hash']??''),$_SESSION['credential']??'')){$_SESSION=[];session_regenerate_id(true);$_SESSION['csrf']=bin2hex(random_bytes(32));}}
    if(!$device->validSession($_SESSION,time())){$_SESSION=[];session_regenerate_id(true);$_SESSION['csrf']=bin2hex(random_bytes(32));life_device_cookie('',time()-3600);$store=life_store($config);$googleMembership=null;}
    life_keep_device($store->db);
    $signed=isset($_SESSION['owner'])||isset($_SESSION['partner'])||isset($_SESSION['userId']);$role=isset($_SESSION['partner'])||$googleMembership?'partner':'owner';
    $method=$_SERVER['REQUEST_METHOD']??'GET'; $action=$_GET['action']??'session';
    if ($method==='GET') {
        if($action==='workspace.list'){if(!isset($_SESSION['userId']))life_json(['workspaces'=>[]]);new LifePartners($store);$q=$store->db->prepare("SELECT p.owner_id,COALESCE(a.name,'Shared Life') AS name FROM life_partner p LEFT JOIN life_account a ON a.id=p.owner_id WHERE p.user_id=? AND p.revoked=0");$q->execute([(int)$_SESSION['userId']]);life_json(['workspaces'=>array_merge([['owner_id'=>(int)$_SESSION['userId'],'name'=>'My Life']],$q->fetchAll(PDO::FETCH_ASSOC))]);}
        if($action==='google.callback'){$documentFlow=($_SESSION['googleFlow']['purpose']??'')==='connect-documents';LifeGoogleAuth::callback($store->db,$_GET);header('Location: '.($documentFlow?'/#applications':'/life/'));exit;}
        if ($action==='session') life_json(['authenticated'=>$signed,'role'=>$role,'setupRequired'=>$store->tenantId===1&&$store->owner()===null,'googleReady'=>LifeGoogleAuth::ready(),'account'=>isset($_SESSION['userId'])?$accounts->find((int)$_SESSION['userId']):(isset($_SESSION['owner'])?$accounts->find(1):null),'workspaceId'=>$store->tenantId,'pendingInvite'=>isset($_SESSION['pendingPartnerInvite']),'csrf'=>$_SESSION['csrf']]);
        if (!$signed) throw new LifeError('Sign in to access your planner.',401);
        if($action==='ayo-os'){if($role!=='owner')throw new LifeError('Ayo OS belongs to the account owner.',403);require_once __DIR__.'/ayo-os-routes.php';life_ayo_os_route($store,$method,$action,[],'owner:'.$store->tenantId);}
        if($action==='applications'||$action==='applications.document'||$action==='applications.search-suggestions'){if($role!=='owner')throw new LifeError('Applications belong to the account owner.',403);require_once __DIR__.'/application-routes.php';life_application_route($store,$method,$action,[],$config);}
        if($action==='ai.attachment'){if($role!=='owner')throw new LifeError('AI conversations belong to the owner.',403);require_once __DIR__.'/chat-attachments.php';(new LifeChatAttachments($store,$config))->download(LifeStore::text($_GET['id']??'',32,true));}
        if($action==='ai'){if($role!=='owner')throw new LifeError('AI conversations belong to the owner.',403);require __DIR__.'/ai-routes.php';life_ai_route($store,$method,$action,[]);}
        if ($action==='attachment') {require __DIR__.'/attachments.php';$id=LifeStore::text($_GET['id']??'',32,true);$record=null;foreach($store->read()['state']['attachments']??[] as $a)if($a['id']===$id&&!$a['archived'])$record=$a;if(!$record||!preg_match('/^[a-f0-9]{32}$/',$id))throw new LifeError('File not found.',404);$path=life_attachment_dir($config,$store->tenantId).'/'.$id;if(!is_file($path))throw new LifeError('File not found.',404);header('Content-Type: '.$record['mime']);header("Content-Disposition: attachment; filename*=UTF-8''".rawurlencode($record['name']));readfile($path);exit;}
        if($action==='push.status'||$action==='reminders'){if($role!=='owner')throw new LifeError('Only the owner manages reminders.',403);require_once __DIR__.'/reminders.php';$r=new LifeReminders($store);life_json($action==='push.status'?['ready'=>LifeReminders::ready(),'publicKey'=>LifeReminders::config()['publicKey']??'']:['reminders'=>$r->pending()]);}
        if($action==='google.status'){if($role!=='owner')throw new LifeError('Only the account owner connects Google.',403);require_once __DIR__.'/google-sync.php';life_json((new LifeGoogleSync($store))->status());}
        if($action==='task.history'){if($role!=='owner')throw new LifeError('Task history belongs to the account owner.',403);life_json($store->history->page($_GET));}
        if ($action==='board') life_json($store->read()+['role'=>$role]);
        if ($action==='partners'&&$role==='owner')life_json(['partners'=>(new LifePartners($store))->list()]);
        if ($action==='backup') {if($role!=='owner')throw new LifeError('Only the owner can back up the planner.',403);require __DIR__.'/attachments.php';if(!class_exists('ZipArchive'))throw new LifeError('Archive support is unavailable. Download JSON and attachments separately.',503);$tmp=tempnam(life_attachment_dir($config,$store->tenantId),'backup-');try{$zip=new ZipArchive();if($zip->open($tmp,ZipArchive::OVERWRITE)!==true)throw new LifeError('Backup could not be created.',503);$snapshot=$store->read();require_once __DIR__.'/ai.php';$zip->addFromString('task-history.json',json_encode($store->history->export(),JSON_THROW_ON_ERROR));$zip->addFromString('ai.json',json_encode((new LifeAI($store))->read()['state'],JSON_THROW_ON_ERROR));require_once __DIR__.'/ayo-os.php';$zip->addFromString('ayo-os.json',json_encode((new LifeAyoOS($store))->read(),JSON_THROW_ON_ERROR));$zip->addFromString('planner.json',json_encode(['format'=>'ayodsgn-life','schema'=>1,'exportedAt'=>LifeStore::now()]+$snapshot,JSON_THROW_ON_ERROR));foreach($snapshot['state']['attachments']??[] as $a){if(!preg_match('/^[a-f0-9]{32}$/',$a['id']))continue;$path=life_attachment_dir($config,$store->tenantId).'/'.$a['id'];if(is_file($path))$zip->addFile($path,'files/'.$a['id']);}$zip->close();header('Content-Type: application/zip');header('Content-Disposition: attachment; filename="ayodsgn-life-backup.zip"');readfile($tmp);}finally{unlink($tmp);}exit;}
        if ($action==='calendar-export') {require __DIR__.'/calendar-export.php';header('Content-Type: text/calendar; charset=utf-8');header('Content-Disposition: attachment; filename="ayodsgn-life.ics"');echo life_ical($store->read()['state']);exit;}
        if ($action==='export') {
            if($role!=='owner')throw new LifeError('Only the owner can export the planner.',403);
            header('Content-Disposition: attachment; filename="ayodsgn-life-'.gmdate('Y-m-d').'.json"');
            require_once __DIR__.'/ai.php';require_once __DIR__.'/ayo-os.php';life_json(['ayoOS'=>(new LifeAyoOS($store))->read(),'ai'=>(new LifeAI($store))->read()['state'],'format'=>'ayodsgn-life','schema'=>1,'exportedAt'=>LifeStore::now()]+$store->read());
        }
        throw new LifeError('Unknown request.',404);
    }
    if ($method!=='POST') throw new LifeError('Method not allowed.',405);
    if($action==='ai.audio'){if(!$signed||$role!=='owner'||$store->tenantId!==1)throw new LifeError('Only the owner can transcribe audio.',403);if(!hash_equals($_SESSION['csrf'],$_SERVER['HTTP_X_CSRF_TOKEN']??''))throw new LifeError('Your session changed.',403);require __DIR__.'/audio.php';life_json(life_audio_transcribe($store));}
    if($action==='ai.attachment.upload'){if(!$signed||$role!=='owner')throw new LifeError('AI conversations belong to the owner.',403);if(!hash_equals($_SESSION['csrf'],$_SERVER['HTTP_X_CSRF_TOKEN']??''))throw new LifeError('Your session changed.',403);require_once __DIR__.'/chat-attachments.php';life_json((new LifeChatAttachments($store,$config))->upload($_POST));}
    if($action==='applications.upload'){if(!$signed||$role!=='owner')throw new LifeError('Applications belong to the account owner.',403);if(!hash_equals($_SESSION['csrf'],$_SERVER['HTTP_X_CSRF_TOKEN']??''))throw new LifeError('Your session changed.',403);require_once __DIR__.'/application-routes.php';life_application_route($store,$method,$action,$_POST,$config);}
    if($action==='upload') {if(!$signed||$role!=='owner')throw new LifeError('Only the owner can upload files.',403);if(!hash_equals($_SESSION['csrf'],$_SERVER['HTTP_X_CSRF_TOKEN']??''))throw new LifeError('Your session changed.',403);require __DIR__.'/attachments.php';life_json(life_upload($store,$config,$_POST));}
    if (stripos($_SERVER['CONTENT_TYPE']??'','application/json')!==0) throw new LifeError('Send JSON data.',415);
    if ((int)($_SERVER['CONTENT_LENGTH']??0)>150000) throw new LifeError('Request is too large.',413);
    $raw=file_get_contents('php://input',false,null,0,150001);if($raw===false||strlen($raw)>150000)throw new LifeError('Request is too large.',413);
    $input=json_decode($raw,true,64,JSON_THROW_ON_ERROR);
    if (!is_array($input)) throw new LifeError('Invalid request.',400);
    if (!hash_equals($_SESSION['csrf'],$_SERVER['HTTP_X_CSRF_TOKEN']??'')) throw new LifeError('Your session changed. Reload and try again.',403);
    // Pause new accountability access while keeping existing records and sessions intact.
    if(in_array($action,['partner.accept','partner.join','partner.invite'],true)||($action==='login'&&!empty($input['partnerId']))||($action==='google.start'&&(!empty($input['inviteId'])||!empty($input['inviteToken']))))throw new LifeError('Accountability invitations and partner sign-in are paused.',403);
    if($action==='email.signup'||$action==='email.login'){
        if($signed)throw new LifeError('Sign out before accessing another account.',409);
        $privacy=(string)($input['privacyVersion']??'');$terms=(string)($input['termsVersion']??'');LifeAccounts::requirePolicyAcceptance($input['policyAccepted']??false,$privacy,$terms);
        $email=LifeAccounts::email($input['email']??'');$accounts->emailThrottle($_SERVER['REMOTE_ADDR']??'unknown',$email,$action==='email.signup');
        $account=$action==='email.signup'?$accounts->signUpEmail($email,$input['password']??null,(string)($input['timezone']??'Africa/Lagos')):$accounts->signInEmail($email,$input['password']??null);
        $accounts->acceptPolicies((int)$account['id'],'email:'.hash('sha256',$email),$privacy,$terms);
        session_regenerate_id(true);$_SESSION=['userId'=>(int)$account['id'],'emailCredential'=>$accounts->credentialFingerprint((int)$account['id']),'csrf'=>bin2hex(random_bytes(32)),'last_activity'=>time()];
        life_keep_device($store->db);life_json(['authenticated'=>true,'role'=>'owner','csrf'=>$_SESSION['csrf']]);
    }
    if($action==='google.start'){$store->throttle($_SERVER['REMOTE_ADDR']??'unknown');$purpose=$input['purpose']??'login';if($purpose==='login')LifeAccounts::requirePolicyAcceptance($input['policyAccepted']??false,(string)($input['privacyVersion']??''),(string)($input['termsVersion']??''));if($purpose!=='login'&&(!$signed||$role!=='owner'))throw new LifeError('Sign in to connect Google.',401);$invite=null;if($purpose==='login'&&isset($input['inviteId'],$input['inviteToken'])){new LifePartners($store);$pid=LifeStore::text($input['inviteId'],32,true);$token=LifeStore::text($input['inviteToken'],64,true);if(!preg_match('/^[a-f0-9]{64}$/',$token))throw new LifeError('This invitation is invalid.',403);$q=$store->db->prepare('SELECT owner_id FROM life_partner WHERE id=? AND token_hash=? AND expires_at>=? AND revoked=0');$q->execute([$pid,hash('sha256',$token),time()]);$ownerId=$q->fetchColumn();if(!$ownerId)throw new LifeError('This accountability invitation is invalid or expired.',403);$invite=['id'=>$pid,'token'=>$token,'ownerId'=>(int)$ownerId];}life_json(['url'=>LifeGoogleAuth::begin($purpose,$input['timezone']??'Africa/Lagos',$signed&&$role==='owner'?$store->tenantId:0,$invite,(string)($input['privacyVersion']??''),(string)($input['termsVersion']??''))]);}
    if($action==='partner.accept'||($action==='login'&&!empty($input['partnerId']))){new LifePartners($store);$pid=LifeStore::text($input['id']??$input['partnerId']??'',32,true);$q=$store->db->prepare('SELECT owner_id FROM life_partner WHERE id=?');$q->execute([$pid]);$tenant=$q->fetchColumn();if(!$tenant)throw new LifeError('Invitation or partner login is invalid.',403);$store=new LifeStore($store->db,(int)$tenant);}
    if ($action==='partner.accept') {
        $privacy=(string)($input['privacyVersion']??'');$terms=(string)($input['termsVersion']??'');LifeAccounts::requirePolicyAcceptance($input['policyAccepted']??false,$privacy,$terms);
        $store->throttle($_SERVER['REMOTE_ADDR']??'unknown');$p=(new LifePartners($store))->accept(LifeStore::text($input['id']??'',32,true),LifeStore::text($input['token']??'',64,true),LifeStore::text($input['password']??'',200,true));$accounts->acceptPolicies($store->tenantId,'partner:'.$p['id'],$privacy,$terms);$store->clearThrottle($_SERVER['REMOTE_ADDR']??'unknown');session_regenerate_id(true);$_SESSION=['partner'=>$p['id'],'tenantId'=>$store->tenantId,'csrf'=>bin2hex(random_bytes(32)),'last_activity'=>time(),'credential'=>hash('sha256',$p['password_hash'])];life_json(['authenticated'=>true,'role'=>'partner','csrf'=>$_SESSION['csrf']]);
    }
    if ($action==='login' || $action==='setup') {
        $privacy=(string)($input['privacyVersion']??'');$terms=(string)($input['termsVersion']??'');LifeAccounts::requirePolicyAcceptance($input['policyAccepted']??false,$privacy,$terms);
        $store->throttle($_SERVER['REMOTE_ADDR']??'unknown');
        $password=$input['password']??'';
        if (!is_string($password) || strlen($password)>200) throw new LifeError('Check your password.',422);
        if ($action==='setup') {
            $token=$input['token']??'';
            if (!is_string($token) || !hash_equals($config['setup_token_hash'],hash('sha256',$token))) throw new LifeError('The setup key is invalid.',403);
            $store->initialize($password);
        } elseif(!empty($input['partnerId'])) {
            $p=(new LifePartners($store))->find(LifeStore::text($input['partnerId'],32,true));if(!$p||$p['revoked']||!password_verify($password,$p['password_hash']??''))throw new LifeError('Check your partner ID and password.',401);$accounts->acceptPolicies($store->tenantId,'partner:'.$p['id'],$privacy,$terms);$store->clearThrottle($_SERVER['REMOTE_ADDR']??'unknown');session_regenerate_id(true);$_SESSION=['partner'=>$p['id'],'tenantId'=>$store->tenantId,'csrf'=>bin2hex(random_bytes(32)),'last_activity'=>time(),'credential'=>hash('sha256',$p['password_hash'])];life_json(['authenticated'=>true,'role'=>'partner','csrf'=>$_SESSION['csrf']]);
        } else {
            $owner=$store->owner();
            $hash=$owner['password_hash']??'$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.';
            if (!password_verify($password,$hash) || !$owner) throw new LifeError('The password is incorrect.',401);
        }
        $accounts->acceptPolicies($store->tenantId,'owner',$privacy,$terms);$store->clearThrottle($_SERVER['REMOTE_ADDR']??'unknown');session_regenerate_id(true); $_SESSION=['owner'=>1,'csrf'=>bin2hex(random_bytes(32)),'last_activity'=>time(),'credential'=>hash('sha256',$store->owner()['password_hash'])];
        life_keep_device($store->db);life_json(['authenticated'=>true,'csrf'=>$_SESSION['csrf']]);
    }
    if (!$signed) throw new LifeError('Sign in to access your planner.',401);
    if($action==='workspace.select'){if(!isset($_SESSION['userId']))throw new LifeError('Sign in with Google first.',403);$wid=(int)($input['id']??0);if($wid!==(int)$_SESSION['userId']){new LifePartners($store);$q=$store->db->prepare('SELECT id FROM life_partner WHERE owner_id=? AND user_id=? AND revoked=0');$q->execute([$wid,(int)$_SESSION['userId']]);if(!$q->fetchColumn())throw new LifeError('Shared planner is unavailable.',403);}$_SESSION['workspaceId']=$wid;life_json(['ok'=>true]);}
    if($action==='partner.join'){if(!isset($_SESSION['userId']))throw new LifeError('Sign in with Google to accept this invitation.',403);$pending=$_SESSION['pendingPartnerInvite']??null;$pid=LifeStore::text($input['id']??(is_array($pending)?$pending['id']??'':''),32,true);$token=LifeStore::text($input['token']??(is_array($pending)?$pending['token']??'':''),64,true);if(!preg_match('/^[a-f0-9]{64}$/',$token))throw new LifeError('This accountability invitation is invalid.',403);$q=$store->db->prepare('SELECT owner_id FROM life_partner WHERE id=? AND token_hash=? AND expires_at>=? AND revoked=0');$q->execute([$pid,hash('sha256',$token),time()]);$wid=$q->fetchColumn();if(!$wid)throw new LifeError('Invitation is unavailable.',403);$partnerStore=new LifeStore($store->db,(int)$wid);(new LifePartners($partnerStore))->joinGoogle($pid,$token,(int)$_SESSION['userId']);$_SESSION['workspaceId']=(int)$wid;unset($_SESSION['pendingPartnerInvite']);life_json(['ok'=>true]);}
    if($action==='account.timezone'){if($role!=='owner')throw new LifeError('Only the account owner changes settings.',403);$accounts->setTimezone($store->tenantId,LifeStore::text($input['timezone']??'',100,true));life_json(['ok'=>true]);}
    if(in_array($action,['google.disconnect','google.resolve'],true)){if($role!=='owner')throw new LifeError('Only the account owner connects Google.',403);require_once __DIR__.'/google-sync.php';$sync=new LifeGoogleSync($store);if($action==='google.disconnect')$sync->disconnect();else $sync->resolve($input);life_json(['ok'=>true]);}
    if(str_starts_with($action,'ayo-os.')){if($role!=='owner')throw new LifeError('Ayo OS belongs to the account owner.',403);require_once __DIR__.'/ayo-os-routes.php';life_ayo_os_route($store,$method,$action,$input,'owner:'.$store->tenantId);}
    if(str_starts_with($action,'applications.')){if($role!=='owner')throw new LifeError('Applications belong to the account owner.',403);require_once __DIR__.'/application-routes.php';life_application_route($store,$method,$action,$input,$config);}
    if(str_starts_with($action,'ai.')){if($role!=='owner')throw new LifeError('AI conversations belong to the owner.',403);require __DIR__.'/ai-routes.php';life_ai_route($store,$method,$action,$input);}
    if(in_array($action,['push.subscribe','push.unsubscribe'],true)){if($role!=='owner')throw new LifeError('Only the owner manages reminders.',403);require_once __DIR__.'/reminders.php';$r=new LifeReminders($store);if($action==='push.subscribe'){if(!LifeReminders::ready())throw new LifeError('Push delivery is awaiting server setup.',503);$r->subscribe($input);}else $r->unsubscribe($input['endpoint']??'');life_json(['ok'=>true]);}
    if ($action==='logout') {
        $device->revoke((string)($_COOKIE[LifeRemember::COOKIE]??''),$_SESSION['rememberId']??null);life_device_cookie('',time()-3600);$_SESSION=[]; session_destroy(); setcookie('ayolife','',['expires'=>time()-3600,'path'=>'/','secure'=>($_SERVER['HTTPS']??'')==='on','httponly'=>true,'samesite'=>'Lax']); life_json(['authenticated'=>false]);
    }
    if($action==='partner.invite'||$action==='partner.revoke'){if($role!=='owner')throw new LifeError('Only the owner manages partners.',403);$partners=new LifePartners($store);if($action==='partner.invite')life_json($partners->invite(LifeStore::text($input['name']??'',100,true)));$partners->revoke(LifeStore::text($input['id']??'',32,true));life_json(['ok'=>true]);}
    if ($action==='mutate') {
        if (!is_int($input['version']??null) || !is_string($input['action']??null) || !is_array($input['args']??null)) throw new LifeError('Invalid board update.',400);
        if($input['action']==='attachment.add')throw new LifeError('Use the authenticated file upload.',403);
        life_json($store->mutate($input['version'],$input['action'],$input['args'],$role,$googleMembership['id']??$_SESSION['partner']??'owner'));
    }
    throw new LifeError('Unknown request.',404);
} catch (LifeError $e) { life_json(['error'=>$e->getMessage()],$e->status); }
catch (JsonException $e) { life_json(['error'=>'Invalid JSON data.'],400); }
catch (Throwable $e) { error_log('Life planner error: '.get_class($e)); life_json(['error'=>'The planner could not complete this request. Your draft is preserved; please retry.'],503); }

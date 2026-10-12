<?php
declare(strict_types=1);
require_once __DIR__.'/accounts.php';
final class LifeGoogleAuth {
    public static function privateDir(): string {$base=getenv('LIFE_CONFIG_PATH')?:(str_contains(__DIR__,'/life-stage/')?dirname(__DIR__,3).'/../private/life-stage-config.php':dirname(__DIR__,2).'/../private/life-config.php');return dirname($base).'/'.(str_contains(basename($base),'stage')?'life-stage-google':'life-google');}
    public static function config(): array {$path=self::privateDir().'/config.php';return is_file($path)?require $path:[];}
    public static function ready(): bool {$c=self::config();return ($c['enabled']??false)===true&&!empty($c['clientId'])&&!empty($c['clientSecret'])&&!empty($c['redirectUri'])&&is_file(self::privateDir().'/vendor/autoload.php');}
    public static function client(): \Google\Client {
        if(!self::ready())throw new LifeError('Google sign-in is awaiting server configuration.',503);
        require_once self::privateDir().'/vendor/autoload.php';$c=self::config();
        return new \Google\Client(['client_id'=>$c['clientId'],'client_secret'=>$c['clientSecret'],'redirect_uri'=>$c['redirectUri']]);
    }
    public static function begin(string $purpose,string $timezone,int $accountId=0,?array $invite=null,string $privacyVersion='',string $termsVersion=''): string {
        if(!in_array($purpose,['login','link','connect-calendar','connect-tasks'],true))throw new LifeError('Invalid Google connection request.');
        if($purpose==='login'&&!LifeAccounts::validPolicyVersions($privacyVersion,$termsVersion))throw new LifeError('Please review and accept the current Privacy Policy and Terms.',422);
        if($purpose!=='login'&&$accountId<1)throw new LifeError('Sign in first.',401);
        $client=self::client();$scopes=['openid','email','profile'];
        if(str_starts_with($purpose,'connect-')) {if(!(self::config()['syncEnabled']??false))throw new LifeError('Google synchronization is awaiting verification.',503);$scope=$purpose==='connect-calendar'?'https://www.googleapis.com/auth/calendar.app.created':'https://www.googleapis.com/auth/tasks';$scopes[]=$scope;$client->setAccessType('offline');$client->setPrompt('consent');}
        $state=bin2hex(random_bytes(32));$nonce=bin2hex(random_bytes(32));$verifier=bin2hex(random_bytes(32));
        $_SESSION['googleFlow']=['state'=>$state,'nonce'=>$nonce,'verifier'=>$verifier,'purpose'=>$purpose,'accountId'=>$accountId,'timezone'=>LifeAccounts::timezone($timezone),'invite'=>$purpose==='login'?$invite:null,'privacyVersion'=>$privacyVersion,'termsVersion'=>$termsVersion,'expires'=>time()+600];
        $client->setScopes($scopes);if(str_starts_with($purpose,'connect-'))$client->setIncludeGrantedScopes(true);$client->setState($state);return $client->createAuthUrl(null,['nonce'=>$nonce,'code_challenge'=>rtrim(strtr(base64_encode(hash('sha256',$verifier,true)),'+/','-_'),'='),'code_challenge_method'=>'S256']);
    }
    public static function consumeState(string $state): array {
        $flow=$_SESSION['googleFlow']??null;unset($_SESSION['googleFlow']);
        if(!$flow||($flow['expires']??0)<time()||!hash_equals($flow['state'],$state))throw new LifeError('Google sign-in expired. Please start again.',403);
        if($flow['purpose']!=='login'&&((int)($_SESSION['userId']??$_SESSION['owner']??0)!==$flow['accountId']||isset($_SESSION['partner'])))throw new LifeError('Your session changed. Start again.',403);
        return $flow;
    }
    public static function callback(PDO $db,array $query): array {
        $flow=self::consumeState(LifeStore::text($query['state']??'',64,true));
        if(isset($query['error']))throw new LifeError('Google access was not granted. Your planner is unchanged.',403);
        $client=self::client();$token=$client->fetchAccessTokenWithAuthCode(LifeStore::text($query['code']??'',4096,true),$flow['verifier']);
        if(isset($token['error'])||empty($token['id_token']))throw new LifeError('Google could not complete sign-in. Please retry.',403);
        $identity=$client->verifyIdToken($token['id_token']);
        if(!$identity||!hash_equals($flow['nonce'],$identity['nonce']??'')||!in_array($identity['iss']??'',['accounts.google.com','https://accounts.google.com'],true)||(int)($identity['exp']??0)<=time())throw new LifeError('Google identity could not be verified.',403);
        $accounts=new LifeAccounts($db);
        if(str_starts_with($flow['purpose'],'connect-')) {
            $account=$accounts->find($flow['accountId']);if(!$account||!hash_equals($account['google_sub']??'',$identity['sub']??''))throw new LifeError('Connect the same Google account you use to sign in.',403);
            require_once __DIR__.'/google-sync.php';$service=substr($flow['purpose'],8);(new LifeGoogleSync(new LifeStore($db,(int)$account['id'])))->connect($token,$service);
        }else {$account=$accounts->signIn($identity,$flow['timezone'],$flow['purpose']==='link'&&$flow['accountId']===1);if($flow['purpose']==='login')$accounts->acceptPolicies((int)$account['id'],'google:'.hash('sha256',(string)$identity['sub']),$flow['privacyVersion']??'',$flow['termsVersion']??'');}
        $pending=$flow['purpose']==='login'&&is_array($flow['invite']??null)?$flow['invite']:null;session_regenerate_id(true);$_SESSION=['userId'=>(int)$account['id'],'csrf'=>bin2hex(random_bytes(32)),'last_activity'=>time()];if($pending)$_SESSION['pendingPartnerInvite']=$pending;return $account;
    }
    public static function encrypt(array $token,int $accountId): string {
        $key=base64_decode(self::config()['encryptionKey']??'',true);if($key===false||strlen($key)!==32)throw new LifeError('Private Google token storage is not configured.',503);
        $iv=random_bytes(12);$cipher=openssl_encrypt(json_encode($token,JSON_THROW_ON_ERROR),'aes-256-gcm',$key,OPENSSL_RAW_DATA,$iv,$tag,(string)$accountId);
        if($cipher===false)throw new LifeError('Google token storage failed.',503);return base64_encode($iv.$tag.$cipher);
    }
    public static function decrypt(string $value,int $accountId): array {
        $key=base64_decode(self::config()['encryptionKey']??'',true);$raw=base64_decode($value,true);if($key===false||strlen($key)!==32||$raw===false||strlen($raw)<29)throw new LifeError('Google connection must be renewed.',503);
        $plain=openssl_decrypt(substr($raw,28),'aes-256-gcm',$key,OPENSSL_RAW_DATA,substr($raw,0,12),substr($raw,12,16),(string)$accountId);if($plain===false)throw new LifeError('Google connection must be renewed.',503);return json_decode($plain,true,32,JSON_THROW_ON_ERROR);
    }
}

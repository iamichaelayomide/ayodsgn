<?php
declare(strict_types=1);
if(PHP_SAPI!=='cli'){http_response_code(404);exit;}
require __DIR__.'/../api/life/bootstrap.php';require_once __DIR__.'/../api/life/google-auth.php';

$dir=LifeGoogleAuth::privateDir();if(!is_dir($dir)&&!mkdir($dir,0700,true))throw new RuntimeException('Private Google setup directory unavailable.');chmod($dir,0700);
$jsonPath=$dir.'/config.json';if(!is_file($jsonPath))throw new RuntimeException('Place the Google OAuth client JSON in the private life-google directory first.');
$source=json_decode((string)file_get_contents($jsonPath),true,32,JSON_THROW_ON_ERROR);$prior=is_file($dir.'/config.php')?require $dir.'/config.php':[];if(!is_array($prior))$prior=[];
if(isset($source['web'])&&is_array($source['web'])){$web=$source['web'];$redirect='https://life.ayodsgn.com/api/life/?action=google.callback';if(!in_array($redirect,$web['redirect_uris']??[],true))throw new RuntimeException('Add the production callback to the OAuth Web client before setup.');$source=['clientId'=>$web['client_id']??'','clientSecret'=>$web['client_secret']??'','redirectUri'=>$redirect,'webhookUri'=>'https://life.ayodsgn.com/api/life/?action=google.webhook'];}
$config=array_merge($source,$prior);$redirect='https://life.ayodsgn.com/api/life/?action=google.callback';
if(empty($config['clientId'])||empty($config['clientSecret'])||($config['redirectUri']??'')!==$redirect)throw new RuntimeException('The private OAuth client is missing or has the wrong production callback.');
$key=base64_decode((string)($config['encryptionKey']??''),true);if($key===false||strlen($key)!==32)$config['encryptionKey']=base64_encode(random_bytes(32));
$config['enabled']=($prior['enabled']??false)===true;$config['syncEnabled']=($prior['syncEnabled']??false)===true;
$tmp=tempnam($dir,'config-');if($tmp===false)throw new RuntimeException('Private Google configuration could not be created.');try{chmod($tmp,0600);if(file_put_contents($tmp,"<?php\ndeclare(strict_types=1);\nreturn ".var_export($config,true).";\n")===false||!rename($tmp,$dir.'/config.php'))throw new RuntimeException('Private Google configuration could not be saved.');}finally{if(is_file($tmp))unlink($tmp);}chmod($dir.'/config.php',0600);

$manifest=json_decode((string)file_get_contents(__DIR__.'/life-google-composer.json'),true,32,JSON_THROW_ON_ERROR);$manifestPath=$dir.'/composer.json';file_put_contents($manifestPath,json_encode($manifest,JSON_PRETTY_PRINT|JSON_THROW_ON_ERROR));chmod($manifestPath,0600);
if(!is_file($dir.'/vendor/autoload.php')){
    if(!function_exists('proc_open'))throw new RuntimeException('Composer requires CLI process support.');
    $url='https://getcomposer.org/download/2.8.12/composer.phar';$hash=trim((string)file_get_contents($url.'.sha256sum'));$phar=file_get_contents($url);if(!$phar||!preg_match('/^[a-f0-9]{64}/i',$hash)||!hash_equals(strtolower(substr($hash,0,64)),hash('sha256',$phar)))throw new RuntimeException('The official Composer checksum did not match.');
    file_put_contents($dir.'/composer.phar',$phar);chmod($dir.'/composer.phar',0600);$log=fopen($dir.'/install.log','a');if(!$log)throw new RuntimeException('Private Composer log unavailable.');
    $process=proc_open([PHP_BINARY,$dir.'/composer.phar','install','--no-dev','--no-interaction','--no-plugins','--no-scripts','--prefer-dist','--optimize-autoloader'],[0=>['file','/dev/null','r'],1=>$log,2=>$log],$pipes,$dir);$status=is_resource($process)?proc_close($process):1;fclose($log);if($status!==0||!is_file($dir.'/vendor/autoload.php'))throw new RuntimeException('The private Google PHP client could not be installed. See the private install log.');
}
echo "Private Google configuration prepared. Sign-in and synchronization remain disabled until review and staging checks are complete.\n";

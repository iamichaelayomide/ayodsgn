<?php
declare(strict_types=1);
// Hostinger cron entry point; never callable over HTTP.
if(PHP_SAPI!=='cli'){http_response_code(404);exit;}
require __DIR__.'/../api/life/bootstrap.php';require __DIR__.'/../api/life/reminders.php';require_once __DIR__.'/../api/life/accounts.php';
$dir=LifeReminders::privateDir();if(!is_dir($dir)&&!mkdir($dir,0700,true))throw new RuntimeException('Private push directory unavailable.');chmod($dir,0700);
$lock=fopen($dir.'/setup.lock','c');if(!$lock||!flock($lock,LOCK_EX|LOCK_NB))exit;
try{
 if(!is_file($dir.'/vendor/autoload.php')){
  if(!function_exists('proc_open'))throw new RuntimeException('Composer requires CLI process support.');
  $url='https://getcomposer.org/download/2.8.12/composer.phar';$hash=trim((string)file_get_contents($url.'.sha256sum'));$phar=file_get_contents($url);if(!$phar||!hash_equals(substr($hash,0,64),hash('sha256',$phar)))throw new RuntimeException('Composer checksum failed.');file_put_contents($dir.'/composer.phar',$phar);
  file_put_contents($dir.'/composer.json',json_encode(['require'=>['minishlink/web-push'=>'9.0.4'],'config'=>['allow-plugins'=>false]],JSON_THROW_ON_ERROR));
  $log=fopen($dir.'/install.log','a');$process=proc_open([PHP_BINARY,$dir.'/composer.phar','install','--no-dev','--no-interaction','--no-plugins','--no-scripts','--prefer-dist','--optimize-autoloader'],[0=>['file','/dev/null','r'],1=>$log,2=>$log],$pipes,$dir);if(!is_resource($process)||proc_close($process)!==0)throw new RuntimeException('Push dependencies could not be installed.');fclose($log);chmod($dir.'/composer.lock',0600);
 }
 require $dir.'/vendor/autoload.php';
 if(!is_file($dir.'/vapid.json')){$keys=\Minishlink\WebPush\VAPID::createVapidKeys();file_put_contents($dir.'/vapid.json',json_encode($keys,JSON_THROW_ON_ERROR));chmod($dir.'/vapid.json',0600);}
 file_put_contents($dir.'/scheduler-ready',(string)time());
 $store=life_store(life_config());$accounts=new LifeAccounts($store->db);$ids=$store->db->query('SELECT id FROM life_account ORDER BY id')->fetchAll(PDO::FETCH_COLUMN);$sent=0;
 foreach($ids as $id){try{$sent+=(new LifeReminders(new LifeStore($store->db,(int)$id)))->send()['sent']??0;}catch(Throwable $e){fwrite(STDERR,'Life reminders for one account need attention. '.get_class($e)."\n");}}
 echo json_encode(['sent'=>$sent])."\n";
}catch(Throwable $e){fwrite(STDERR,'Life reminders: '.$e->getMessage()."\n");exit(1);}finally{flock($lock,LOCK_UN);fclose($lock);}

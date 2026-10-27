<?php
declare(strict_types=1);
if(PHP_SAPI!=='cli'){http_response_code(404);exit;}
require __DIR__.'/../api/life/bootstrap.php';require_once __DIR__.'/../api/life/opportunity-runtime.php';
$dir=dirname(__DIR__,2).'/private/life-research';if(!is_dir($dir)&&!mkdir($dir,0700,true))throw new RuntimeException('Private scheduler directory unavailable.');chmod($dir,0700);$lock=fopen($dir.'/research.lock','c');if(!$lock||!flock($lock,LOCK_EX|LOCK_NB))exit;
try{$store=life_store(life_config());$db=$store->db;$db->exec(file_get_contents(__DIR__.'/../api/life/migrations/opportunity-runtime.sql'));$ids=$db->query('SELECT tenant_id FROM life_opportunity_runtime WHERE enabled=1 ORDER BY tenant_id')->fetchAll(PDO::FETCH_COLUMN);$processed=0;foreach($ids as$id){$result=(new LifeOpportunityRuntime(new LifeAyoOS(new LifeStore($db,(int)$id))))->run();if(!in_array($result['status'],['idle','disabled'],true)){$processed++;break;}}echo json_encode(['processed'=>$processed])."\n";}catch(Throwable){fwrite(STDERR,"Life background research needs attention.\n");exit(1);}finally{flock($lock,LOCK_UN);fclose($lock);}

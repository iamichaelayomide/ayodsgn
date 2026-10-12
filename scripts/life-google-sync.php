<?php
declare(strict_types=1);
if(PHP_SAPI!=='cli'){http_response_code(404);exit;}
require __DIR__.'/../api/life/bootstrap.php';require_once __DIR__.'/../api/life/google-sync.php';
$store=life_store(life_config());$q=$store->db->query('SELECT id FROM life_google_connection');$accounts=$q->fetchAll(PDO::FETCH_COLUMN);
foreach($accounts as $id){try{(new LifeGoogleSync(new LifeStore($store->db,(int)$id)))->run();}catch(Throwable $e){fwrite(STDERR,'Google sync for account '.(int)$id.' needs attention.'."\n");}}

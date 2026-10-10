<?php
declare(strict_types=1);
if(PHP_SAPI!=='cli'){http_response_code(404);exit;}
require __DIR__.'/../api/life/bootstrap.php';
$store=life_store(life_config());$db=$store->db;
$db->exec('CREATE TABLE IF NOT EXISTS life_migration (version INT PRIMARY KEY, applied_at VARCHAR(30) NOT NULL)');
if((int)$db->query('SELECT COUNT(*) FROM life_migration WHERE version=1')->fetchColumn()===0){
    foreach(explode(';',file_get_contents(__DIR__.'/../api/life/schema.sql')) as $sql)if(trim($sql)!=='')$db->exec($sql);
    $db->prepare('INSERT INTO life_migration (version,applied_at) VALUES (1,?)')->execute([LifeStore::now()]);
}
echo "Life schema version 1 ready.\n";

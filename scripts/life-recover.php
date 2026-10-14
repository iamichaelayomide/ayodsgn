<?php
declare(strict_types=1);
if(PHP_SAPI!=='cli'){http_response_code(404);exit;}
require __DIR__.'/../api/life/bootstrap.php';
$store=life_store(life_config());
if(!$store->owner())throw new RuntimeException('Initialize the owner first.');
// The owner enters the new passphrase interactively; it never appears in command arguments.
fwrite(STDOUT,"New passphrase (14–72 bytes): ");
if(PHP_OS_FAMILY!=='Windows')system('stty -echo');
try{$password=rtrim((string)fgets(STDIN),"\r\n");}finally{if(PHP_OS_FAMILY!=='Windows')system('stty echo');fwrite(STDOUT,"\n");}
if(strlen($password)<14||strlen($password)>72||str_contains($password,"\0"))throw new RuntimeException('Invalid passphrase length.');
$store->db->prepare('UPDATE life_owner SET password_hash=? WHERE id=1')->execute([password_hash($password,PASSWORD_DEFAULT)]);
echo "Passphrase updated. Existing owner sessions will be rejected on their next request.\n";

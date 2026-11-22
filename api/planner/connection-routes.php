<?php
declare(strict_types=1);
require_once __DIR__.'/oauth.php';
function life_connection_route(LifeStore $store,string $action,array $in):never{
 $oauth=new LifeConnections($store->db);$method=$_SERVER['REQUEST_METHOD']??'GET';
 if($action==='connections.list'&&$method==='GET')life_json(['connections'=>$oauth->list($store->tenantId),'events'=>$oauth->events($store->tenantId),'endpoint'=>LifeConnections::RESOURCE]);
 if($action==='connections.request'&&$method==='GET'){$p=$oauth->pendingInfo(LifeStore::text($in['id']??'',32,true));life_json(['name'=>$p['client_name'],'callbackHost'=>parse_url($p['redirect_uri'],PHP_URL_HOST),'scopes'=>explode(' ',$p['scope'])]);}
 if($action==='connections.authorize'&&$method==='POST'){if(!is_bool($in['allow']??null)||!is_bool($in['write']??null))throw new LifeError('Choose whether to allow the connection.',400);life_json($oauth->decide($store->tenantId,LifeStore::text($in['id']??'',32,true),$in['allow'],$in['write']));}
 if($action==='connections.revoke'&&$method==='POST'){$id=LifeStore::text($in['id']??'',32,true);$owned=array_filter($oauth->list($store->tenantId),fn($g)=>$g['id']===$id);if(!$owned)throw new LifeError('Connection not found.',404);$oauth->revoke($store->tenantId,$id);$oauth->event($store->tenantId,$id,'connection.revoked','');life_json(['ok'=>true]);}
 throw new LifeError('Unknown connection action.',404);
}

<?php
declare(strict_types=1);
require_once __DIR__.'/ayo-os.php';
function life_ayo_os_route(LifeStore $store,string $method,string $action,array $input,string $actor):never{
 $os=new LifeAyoOS($store);
 if($method==='GET'&&$action==='ayo-os')life_json(life_ayo_os_public($os->read()));
 if($method==='POST'&&$action==='ayo-os.mutate'){
  LifeAyoOS::requireWorkspace($input,$store->tenantId);
  if(!is_int($input['version']??null)||!is_array($input['args']??null))throw new LifeError('Reload Ayo OS before saving.',409);
  life_json(life_ayo_os_public($os->mutate($input['version'],LifeStore::text($input['operation']??'',60,true),$input['args'],$actor)));
 }
 throw new LifeError('Unknown Ayo OS request.',404);
}
function life_ayo_os_public(array $result):array{
 $s=$result['state'];$result['approvalIds']=[];foreach($s['drafts'] as $d){$a=LifeAyoOS::approval($s,$d['id']);if($a)$result['approvalIds'][$d['id']]=$a['id'];}return $result;
}

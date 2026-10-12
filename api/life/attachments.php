<?php
declare(strict_types=1);
function life_attachment_dir(array $config, int $tenantId=1): string {
    $path=(getenv('LIFE_CONFIG_PATH')?:(str_contains(__DIR__,'/life-stage/')?dirname(__DIR__,3).'/../private/life-stage-config.php':dirname(__DIR__,2).'/../private/life-config.php'));
    $dir=dirname($path).'/'.(str_contains(basename($path),'stage')?'life-stage-files':'life-files');
    if($tenantId!==1)$dir.='/accounts/'.$tenantId;
    if(!is_dir($dir)&&!mkdir($dir,0700,true))throw new LifeError('Private storage is unavailable.',503);return $dir;
}
function life_upload(LifeStore $store,array $config,array $input): array {
    $file=$_FILES['file']??null;if(!$file||$file['error']!==UPLOAD_ERR_OK)throw new LifeError('Choose a file within the 5 MB limit.');if($file['size']>5*1024*1024)throw new LifeError('Files can be up to 5 MB.');
    $mime=(new finfo(FILEINFO_MIME_TYPE))->file($file['tmp_name']);if(!in_array($mime,['image/jpeg','image/png','image/webp','application/pdf','text/plain'],true))throw new LifeError('Use a JPEG, PNG, WebP, PDF or text file.');
    $id=LifeStore::id();$path=life_attachment_dir($config,$store->tenantId).'/'.$id;if(!move_uploaded_file($file['tmp_name'],$path))throw new LifeError('The file could not be saved.',503);chmod($path,0600);
    try{return $store->mutate((int)($input['version']??0),'attachment.add',['id'=>$id,'taskId'=>$input['taskId']??'','name'=>preg_replace('/[\x00-\x1f\x7f]/','',basename($file['name'])),'mime'=>$mime,'size'=>$file['size']]);}catch(Throwable $e){unlink($path);throw $e;}
}

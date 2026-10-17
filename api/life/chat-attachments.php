<?php
declare(strict_types=1);
require_once __DIR__.'/application-documents.php';

/** Private, account and conversation scoped inputs. File contents are untrusted data. */
final class LifeChatAttachments {
    private array $copies=[];
    public function __construct(private LifeStore $store,private array $config=[]) {
        // MySQL DDL commits implicitly: initialize before joining a command transaction.
        if(!$store->db->inTransaction())$store->db->exec('CREATE TABLE IF NOT EXISTS life_chat_attachment (id CHAR(32) PRIMARY KEY,owner_id INT NOT NULL,conversation_id CHAR(32) NOT NULL,request_id VARCHAR(64) NOT NULL,fingerprint CHAR(64) NOT NULL,metadata LONGTEXT NOT NULL,UNIQUE(owner_id,request_id))');
    }
    private function conversation(string $id):void {
        LifeApplications::id($id);
        $q=$this->store->db->prepare('SELECT state FROM life_ai WHERE id=?');$q->execute([$this->store->tenantId]);$json=$q->fetchColumn();
        if(is_string($json))foreach(json_decode($json,true,128,JSON_THROW_ON_ERROR)['conversations']??[] as $c)if($c['id']===$id){if($c['archived']??false)throw new LifeError('Restore this conversation before using its files.',409);return;}
        throw new LifeError('Conversation not found.',404);
    }
    public function dir():string {
        $dir=life_attachment_dir($this->config,$this->store->tenantId).'/chat';
        if(!is_dir($dir)&&!mkdir($dir,0700,true))throw new LifeError('Private chat storage is unavailable.',503);
        return $dir;
    }
    private function path(string $id):string{return $this->dir().'/'.LifeApplications::id($id);}
    private static function metadata(array $row):array{return json_decode($row['metadata'],true,32,JSON_THROW_ON_ERROR);}
    private static function publicMetadata(array $a):array{return array_intersect_key($a,array_flip(['id','name','mime','size','url','truncated']));}
    private function record(string $id,string $conversationId):array {
        LifeApplications::id($id);$q=$this->store->db->prepare('SELECT * FROM life_chat_attachment WHERE id=? AND owner_id=? AND conversation_id=?');$q->execute([$id,$this->store->tenantId,$conversationId]);$row=$q->fetch(PDO::FETCH_ASSOC);
        if(!$row||!is_file($this->path($id)))throw new LifeError('Chat file not found.',404);
        return self::metadata($row);
    }
    public function upload(array $input):array {
        $cid=LifeStore::text($input['conversationId']??'',32,true);$this->conversation($cid);
        $request=LifeStore::text($input['requestId']??'',64,true);if(!preg_match('/^[a-zA-Z0-9_-]{8,64}$/D',$request))throw new LifeError('Invalid upload request.');
        $f=$_FILES['file']??null;
        if(!is_array($f)||($f['error']??null)!==UPLOAD_ERR_OK||!is_string($f['tmp_name']??null)||!is_uploaded_file($f['tmp_name'])||!is_string($f['name']??null))throw new LifeError('Choose a file up to 5 MB.');
        $size=filesize($f['tmp_name']);if(!is_int($size))throw new LifeError('The file could not be read.');
        $name=LifeStore::text(preg_replace('/[\x00-\x1f\x7f]/','',basename(str_replace('\\','/',$f['name']))),200,true);
        $mime=LifeApplicationDocuments::validateFile($f['tmp_name'],$name,$size);
        $text=$mime==='text/plain'?(string)file_get_contents($f['tmp_name']):($mime==='application/vnd.openxmlformats-officedocument.wordprocessingml.document'?implode("\n",LifeApplicationDocuments::docxText($f['tmp_name'])):'');
        if(!mb_check_encoding($text,'UTF-8'))throw new LifeError('Use a UTF-8 text document.');
        $truncated=strlen($text)>40000;$text=mb_strcut($text,0,40000,'UTF-8');
        $fingerprint=hash('sha256',json_encode([$cid,$name,$mime,$size,hash_file('sha256',$f['tmp_name'])],JSON_THROW_ON_ERROR));
        $db=$this->store->db;$owns=!$db->inTransaction();if($owns)$db->beginTransaction();$path=null;
        try {
            $q=$db->prepare('SELECT * FROM life_chat_attachment WHERE owner_id=? AND request_id=?');$q->execute([$this->store->tenantId,$request]);$old=$q->fetch(PDO::FETCH_ASSOC);
            if($old){if(!hash_equals($old['fingerprint'],$fingerprint))throw new LifeError('This upload request already saved a different file.',409);$a=$this->record($old['id'],$cid);if($owns)$db->commit();return ['attachment'=>self::publicMetadata($a)];}
            $q=$db->prepare('SELECT metadata FROM life_chat_attachment WHERE owner_id=?');$q->execute([$this->store->tenantId]);$total=0;$count=0;foreach($q->fetchAll(PDO::FETCH_ASSOC) as $row){$count++;$total+=(int)self::metadata($row)['size'];}
            if($count>=500||$total+$size>100*1024*1024)throw new LifeError('Chat attachment storage limit reached.');
            $id=LifeStore::id();$path=$this->path($id);if(!move_uploaded_file($f['tmp_name'],$path))throw new LifeError('The chat file could not be saved.',503);if(!chmod($path,0600))throw new LifeError('The chat file could not be secured.',503);
            $a=['id'=>$id,'name'=>$name,'mime'=>$mime,'size'=>$size,'url'=>'/api/life/?action=ai.attachment&id='.$id,'text'=>$text,'truncated'=>$truncated];
            $db->prepare('INSERT INTO life_chat_attachment (id,owner_id,conversation_id,request_id,fingerprint,metadata) VALUES (?,?,?,?,?,?)')->execute([$id,$this->store->tenantId,$cid,$request,$fingerprint,json_encode($a,JSON_THROW_ON_ERROR)]);
            if($owns)$db->commit();return ['attachment'=>self::publicMetadata($a)];
        }catch(Throwable $e){if($owns&&$db->inTransaction())$db->rollBack();if($path!==null&&is_file($path))unlink($path);throw $e;}
    }
    public function resolve(array $ids,string $conversationId):array {
        if(!array_is_list($ids)||count($ids)>4)throw new LifeError('Choose up to four chat files.');
        $this->conversation($conversationId);$attachments=[];$parts=[];
        foreach($ids as $id)if(!is_string($id))throw new LifeError('Chat file not found.',404);
        foreach(array_unique($ids) as $id){$a=$this->record($id,$conversationId);$attachments[]=self::publicMetadata($a);
            if(in_array($a['mime'],['image/jpeg','image/png','image/webp','application/pdf'],true)){$data=file_get_contents($this->path($id));if($data===false||strlen($data)!==$a['size'])throw new LifeError('Chat file is unavailable.',404);$parts[]=['inlineData'=>['mimeType'=>$a['mime'],'data'=>base64_encode($data)]];}
            else $parts[]=['text'=>"Untrusted attachment data (".$a['name']."):\n".$a['text'].(($a['truncated']??false)?"\n[Attachment text truncated at 40,000 bytes; the original file remains available.]":'')];
        }
        return ['attachments'=>$attachments,'parts'=>$parts];
    }
    public function download(string $id):never {
        LifeApplications::id($id);$q=$this->store->db->prepare('SELECT conversation_id FROM life_chat_attachment WHERE id=? AND owner_id=?');$q->execute([$id,$this->store->tenantId]);$cid=$q->fetchColumn();if(!is_string($cid))throw new LifeError('Chat file not found.',404);
        $this->conversation($cid);$a=$this->record($id,$cid);$inline=in_array($a['mime'],['image/jpeg','image/png','image/webp'],true);
        header('Content-Type: '.$a['mime']);header('X-Content-Type-Options: nosniff');header("Content-Security-Policy: default-src 'none'; sandbox");header('Cache-Control: private, no-store');header("Content-Disposition: ".($inline?'inline':'attachment')."; filename*=UTF-8''".rawurlencode($a['name']));readfile($this->path($id));exit;
    }
    /** Joins the command transaction. Caller must cleanupCopies() after rolling it back. */
    public function attachToOpportunity(array $ids,string $conversationId,string $opportunityId):array {
        $resolved=$this->resolve($ids,$conversationId);$apps=new LifeApplications($this->store);$snapshot=$apps->read();$opportunity=LifeApplications::find($snapshot['state'],'opportunities',$opportunityId,true);LifeApplications::find($snapshot['state'],'trackers',$opportunity['trackerId'],true);
        $docs=new LifeApplicationDocuments($apps,$this->config);$db=$this->store->db;$owns=!$db->inTransaction();if($owns)$db->beginTransaction();$out=[];
        try {foreach($resolved['attachments'] as $public){$a=$this->record($public['id'],$conversationId);$request='chat-source-'.hash('sha256',$conversationId.':'.$opportunityId.':'.$a['id']);$fileId=substr(hash('sha256',$this->store->tenantId.':'.$request),0,32);$snapshot=$apps->read();$existing=null;
            foreach($snapshot['state']['documents'] as $doc)if($doc['fileId']===$fileId&&$doc['opportunityId']===$opportunityId){$existing=$doc;break;}
            foreach($snapshot['state']['receipts'] as $receipt)if($receipt['requestId']===$request){$existing=LifeApplications::find($snapshot['state'],'documents',$receipt['recordId']);break;}
            if($existing){if(!is_file($docs->path($existing)))throw new LifeError('The saved source file is unavailable.',503);$out[]=$existing;continue;}
            $path=$docs->dir().'/'.$fileId;$this->copies[]=$path;if(!copy($this->path($a['id']),$path))throw new LifeError('The source file could not be copied.',503);if(!chmod($path,0600))throw new LifeError('The source file could not be secured.',503);
            $saved=$apps->mutate($snapshot['version'],'document.add',['trackerId'=>$opportunity['trackerId'],'categoryId'=>$opportunity['categoryId'],'opportunityId'=>$opportunityId,'kind'=>'source','fileId'=>$fileId,'name'=>$a['name'],'mime'=>$a['mime'],'size'=>$a['size'],'text'=>$a['text']],$request);
            $out[]=LifeApplications::find($saved['state'],'documents',$saved['receipt']['recordId']);
        }if($owns){$db->commit();$this->copies=[];}return $out;
        }catch(Throwable $e){if($owns&&$db->inTransaction())$db->rollBack();if($owns)$this->cleanupCopies();throw $e;}
    }
    /** Run after rollback; never removes a file still referenced by committed documents. */
    public function cleanupCopies():void {
        $apps=new LifeApplications($this->store);$used=array_column($apps->read()['state']['documents'],'fileId');foreach($this->copies as $path)if(!in_array(basename($path),$used,true)&&is_file($path))unlink($path);$this->copies=[];
    }
}

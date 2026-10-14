<?php
declare(strict_types=1);
require_once __DIR__.'/accounts.php';
/** Revocable device login. Only a hash of the opaque cookie secret reaches storage. */
final class LifeRemember {
    public const COOKIE='ayolife_device';
    public const TTL=31536000;
    public function __construct(private PDO $db) {
        $db->exec('CREATE TABLE IF NOT EXISTS life_device_login (id VARCHAR(32) PRIMARY KEY, secret_hash VARCHAR(64) NOT NULL, identity_json TEXT NOT NULL, credential_hash VARCHAR(64) NOT NULL, expires_at BIGINT NOT NULL)');
    }
    public static function identity(array $session): ?array {
        if(isset($session['userId']))return ['kind'=>'user','id'=>(int)$session['userId']];
        if(isset($session['owner']))return ['kind'=>'owner','id'=>1];
        if(isset($session['partner'],$session['tenantId']))return ['kind'=>'partner','id'=>(string)$session['partner'],'tenantId'=>(int)$session['tenantId']];
        return null;
    }
    private function credential(array $identity): ?string {
        if(($identity['kind']??'')==='user'){
            $accounts=new LifeAccounts($this->db);$account=$accounts->find((int)$identity['id']);if(!$account)return null;
            $email=$accounts->credentialFingerprint((int)$identity['id']);if($email===''&&empty($account['google_sub']))return null;
            return hash('sha256',json_encode([$account['google_sub']??'',$email],JSON_THROW_ON_ERROR));
        }
        if(($identity['kind']??'')==='owner'){$q=$this->db->query('SELECT password_hash FROM life_owner WHERE id=1');$hash=$q->fetchColumn();return is_string($hash)?hash('sha256',$hash):null;}
        if(($identity['kind']??'')==='partner'){$q=$this->db->prepare('SELECT password_hash,revoked FROM life_partner WHERE id=? AND owner_id=?');$q->execute([$identity['id'],$identity['tenantId']]);$p=$q->fetch(PDO::FETCH_ASSOC);return $p&&!$p['revoked']&&!empty($p['password_hash'])?hash('sha256',$p['password_hash']):null;}
        return null;
    }
    private function record(string $cookie,int $now): ?array {
        if(!preg_match('/^([a-f0-9]{32})\.([a-f0-9]{64})$/D',$cookie,$parts))return null;
        $q=$this->db->prepare('SELECT * FROM life_device_login WHERE id=?');$q->execute([$parts[1]]);$row=$q->fetch(PDO::FETCH_ASSOC);
        if(!$row||!hash_equals($row['secret_hash'],hash('sha256',$parts[2])))return null;
        $identity=json_decode($row['identity_json'],true,8,JSON_THROW_ON_ERROR);$credential=$this->credential($identity);
        if((int)$row['expires_at']<=$now||$credential===null||!hash_equals($row['credential_hash'],$credential)){$this->delete($row['id']);return null;}
        return $row+['identity'=>$identity];
    }
    /** A resumed PHP session must not outlive the device login that authorized it. */
    public function validSession(array $session,int $now): bool {
        if(!isset($session['rememberId']))return true; // Older sessions acquire a device token below.
        $id=$session['rememberId'];$identity=self::identity($session);
        if(!is_string($id)||!preg_match('/^[a-f0-9]{32}$/D',$id)||$identity===null)return false;
        $q=$this->db->prepare('SELECT identity_json,credential_hash,expires_at FROM life_device_login WHERE id=?');$q->execute([$id]);$row=$q->fetch(PDO::FETCH_ASSOC);
        if(!$row||(int)$row['expires_at']<=$now)return false;
        $stored=json_decode($row['identity_json'],true,8,JSON_THROW_ON_ERROR);$credential=$this->credential($identity);
        return $stored===$identity&&$credential!==null&&hash_equals($row['credential_hash'],$credential);
    }
    public function issue(array $identity,int $now): string {
        $credential=$this->credential($identity);if($credential===null)throw new LifeError('Sign in again to keep this device signed in.',401);
        $id=bin2hex(random_bytes(16));$secret=bin2hex(random_bytes(32));
        $this->db->prepare('DELETE FROM life_device_login WHERE expires_at<=?')->execute([$now]);
        $this->db->prepare('INSERT INTO life_device_login VALUES (?,?,?,?,?)')->execute([$id,hash('sha256',$secret),json_encode($identity,JSON_THROW_ON_ERROR),$credential,$now+self::TTL]);
        return $id.'.'.$secret;
    }
    public function resume(string $cookie,int $now): ?array {
        $row=$this->record($cookie,$now);if(!$row)return null;$i=$row['identity'];
        $session=['csrf'=>bin2hex(random_bytes(32)),'last_activity'=>$now,'rememberId'=>$row['id']];
        if($i['kind']==='user'){$session['userId']=$i['id'];$fp=(new LifeAccounts($this->db))->credentialFingerprint($i['id']);if($fp!=='')$session['emailCredential']=$fp;}
        elseif($i['kind']==='owner'){$session['owner']=1;$session['credential']=$row['credential_hash'];}
        else{$session['partner']=$i['id'];$session['tenantId']=$i['tenantId'];$session['credential']=$row['credential_hash'];}
        return $session;
    }
    public function keep(array $identity,string $cookie,int $now): array {
        $row=$this->record($cookie,$now);
        if(!$row||$row['identity']!==$identity){if($row)$this->delete($row['id']);$cookie=$this->issue($identity,$now);return ['cookie'=>$cookie,'renew'=>true,'id'=>explode('.',$cookie,2)[0]];}
        $renew=(int)$row['expires_at']<$now+self::TTL-86400;
        if($renew)$this->db->prepare('UPDATE life_device_login SET expires_at=? WHERE id=?')->execute([$now+self::TTL,$row['id']]);
        return ['cookie'=>$cookie,'renew'=>$renew,'id'=>$row['id']];
    }
    private function delete(string $id): void {$this->db->prepare('DELETE FROM life_device_login WHERE id=?')->execute([$id]);}
    public function revoke(string $cookie,?string $sessionId=null): void {
        if(preg_match('/^([a-f0-9]{32})\.([a-f0-9]{64})$/D',$cookie,$parts)){$q=$this->db->prepare('DELETE FROM life_device_login WHERE id=? AND secret_hash=?');$q->execute([$parts[1],hash('sha256',$parts[2])]);}
        if($sessionId!==null)$this->delete($sessionId);
    }
}
function life_device_cookie(string $value,int $expires): void {
    setcookie(LifeRemember::COOKIE,$value,['expires'=>$expires,'path'=>'/','secure'=>($_SERVER['HTTPS']??'')==='on','httponly'=>true,'samesite'=>'Lax']);
}
function life_keep_device(PDO $db): void {
    $identity=LifeRemember::identity($_SESSION);if(!$identity)return;
    $kept=(new LifeRemember($db))->keep($identity,(string)($_COOKIE[LifeRemember::COOKIE]??''),time());$_SESSION['rememberId']=$kept['id'];
    if($kept['renew'])life_device_cookie($kept['cookie'],time()+LifeRemember::TTL);
}

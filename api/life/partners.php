<?php
declare(strict_types=1);
final class LifePartners {
    public function __construct(private LifeStore $store) {
        $store->db->exec('CREATE TABLE IF NOT EXISTS life_partner (id VARCHAR(32) PRIMARY KEY, name VARCHAR(100) NOT NULL, password_hash VARCHAR(255) NULL, token_hash VARCHAR(64) NULL, expires_at BIGINT NOT NULL, revoked INT NOT NULL DEFAULT 0, created_at VARCHAR(30) NOT NULL)');
    }
    public function find(string $id): ?array {$q=$this->store->db->prepare('SELECT * FROM life_partner WHERE id=?');$q->execute([$id]);return $q->fetch(PDO::FETCH_ASSOC)?:null;}
    public function list(): array {return $this->store->db->query('SELECT id,name,expires_at,revoked,created_at,CASE WHEN password_hash IS NULL THEN 0 ELSE 1 END AS active FROM life_partner ORDER BY created_at')->fetchAll(PDO::FETCH_ASSOC);}
    public function invite(string $name): array {
        $name=LifeStore::text($name,100,true);if(count($this->list())>=30)throw new LifeError('Partner limit reached.');
        $id=LifeStore::id();$token=bin2hex(random_bytes(32));$expires=time()+7*86400;
        $this->store->db->prepare('INSERT INTO life_partner (id,name,token_hash,expires_at,created_at) VALUES (?,?,?,?,?)')->execute([$id,$name,hash('sha256',$token),$expires,LifeStore::now()]);
        return ['id'=>$id,'token'=>$token,'expiresAt'=>$expires];
    }
    public function accept(string $id,string $token,string $password): array {
        if(strlen($password)<14||strlen($password)>200)throw new LifeError('Use a passphrase between 14 and 200 characters.');
        $p=$this->find($id);if(!$p||$p['revoked']||$p['password_hash']||$p['expires_at']<time()||!hash_equals($p['token_hash']??'',hash('sha256',$token)))throw new LifeError('This invitation is invalid, expired, or already used.',403);
        $this->store->db->beginTransaction();try {
            $q=$this->store->db->prepare('UPDATE life_partner SET password_hash=?,token_hash=NULL WHERE id=? AND token_hash=? AND revoked=0');$q->execute([password_hash($password,PASSWORD_DEFAULT),$id,$p['token_hash']]);if($q->rowCount()!==1)throw new LifeError('Invitation already used.',409);
            $board=$this->store->read();$state=$board['state'];$state['accountabilityEnabled']=true;
            $q=$this->store->db->prepare('UPDATE life_board SET state=?,version=version+1,updated_at=? WHERE id=1 AND version=?');$q->execute([json_encode($state,JSON_THROW_ON_ERROR),LifeStore::now(),$board['version']]);if($q->rowCount()!==1)throw new LifeError('Planner changed. Please retry.',409);
            $this->store->db->commit();return $this->find($id);
        }catch(Throwable $e){if($this->store->db->inTransaction())$this->store->db->rollBack();throw $e;}
    }
    public function revoke(string $id): void {$q=$this->store->db->prepare('UPDATE life_partner SET revoked=1,token_hash=NULL WHERE id=?');$q->execute([$id]);}
}

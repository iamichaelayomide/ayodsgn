<?php
declare(strict_types=1);
/** Account IDs are also the existing board/AI row IDs. Legacy owner remains ID 1. */
final class LifeAccounts {
    public const PRIVACY_VERSION='2026-10-12-v1';
    public const TERMS_VERSION='2026-10-12-v1';
    public function __construct(private PDO $db) {
        $db->exec('CREATE TABLE IF NOT EXISTS life_account (id INT PRIMARY KEY, google_sub VARCHAR(255) UNIQUE NULL, email VARCHAR(320) NOT NULL, name VARCHAR(200) NOT NULL, timezone VARCHAR(100) NOT NULL, created_at VARCHAR(30) NOT NULL)');
        $db->exec('CREATE TABLE IF NOT EXISTS life_policy_acceptance (account_id INT NOT NULL, subject VARCHAR(255) NOT NULL, privacy_version VARCHAR(40) NOT NULL, terms_version VARCHAR(40) NOT NULL, accepted_at VARCHAR(30) NOT NULL, PRIMARY KEY (account_id, subject, privacy_version, terms_version))');
        $q=$db->prepare('SELECT id FROM life_account WHERE id=1');$q->execute();
        if(!$q->fetchColumn()) {
            try {$db->prepare('INSERT INTO life_account VALUES (1,NULL,?,?,?,?)')->execute(['','Owner','Africa/Lagos',LifeStore::now()]);}
            catch(PDOException $e) {$q->execute();if(!$q->fetchColumn())throw $e;}
        }
    }
    public function find(int $id): ?array {$q=$this->db->prepare('SELECT * FROM life_account WHERE id=?');$q->execute([$id]);return $q->fetch(PDO::FETCH_ASSOC)?:null;}
    public function bySubject(string $sub): ?array {$q=$this->db->prepare('SELECT * FROM life_account WHERE google_sub=?');$q->execute([$sub]);return $q->fetch(PDO::FETCH_ASSOC)?:null;}
    public static function timezone(string $value): string {if(!in_array($value,DateTimeZone::listIdentifiers(),true))throw new LifeError('Choose a valid timezone.');return $value;}
    public static function validPolicyVersions(string $privacy,string $terms): bool {return hash_equals(self::PRIVACY_VERSION,$privacy)&&hash_equals(self::TERMS_VERSION,$terms);}
    public static function requirePolicyAcceptance(mixed $accepted,string $privacy,string $terms): void {if($accepted!==true||!self::validPolicyVersions($privacy,$terms))throw new LifeError('Please review and accept the current Privacy Policy and Terms.',422);}
    public function acceptPolicies(int $accountId,string $subject,string $privacy,string $terms): void {
        if($accountId<1||!self::validPolicyVersions($privacy,$terms))throw new LifeError('Please review and accept the current Privacy Policy and Terms.',422);
        $subject=LifeStore::text($subject,255,true);
        $sql=$this->db->getAttribute(PDO::ATTR_DRIVER_NAME)==='sqlite'
            ? 'INSERT INTO life_policy_acceptance (account_id,subject,privacy_version,terms_version,accepted_at) VALUES (?,?,?,?,?) ON CONFLICT(account_id,subject,privacy_version,terms_version) DO UPDATE SET accepted_at=excluded.accepted_at'
            : 'INSERT INTO life_policy_acceptance (account_id,subject,privacy_version,terms_version,accepted_at) VALUES (?,?,?,?,?) ON DUPLICATE KEY UPDATE accepted_at=VALUES(accepted_at)';
        $q=$this->db->prepare($sql);
        $q->execute([$accountId,$subject,$privacy,$terms,LifeStore::now()]);
    }
    public function signIn(array $identity,string $timezone='Africa/Lagos',bool $linkOwner=false): array {
        $sub=LifeStore::text($identity['sub']??'',255,true);$email=LifeStore::text($identity['email']??'',320,true);$name=LifeStore::text($identity['name']??'My Life',200,true);
        if(($identity['email_verified']??false)!==true)throw new LifeError('Google has not verified this account.',403);
        $existing=$this->bySubject($sub);
        if($linkOwner) {
            if($existing&&(int)$existing['id']!==1)throw new LifeError('This Google account already has a planner. It cannot replace your owner account.',409);
            $q=$this->db->prepare('UPDATE life_account SET google_sub=?,email=?,name=? WHERE id=1 AND (google_sub IS NULL OR google_sub=?)');$q->execute([$sub,$email,$name,$sub]);
            if(($this->find(1)['google_sub']??null)!==$sub)throw new LifeError('The owner is already linked to another Google account.',409);
            return $this->find(1);
        }
        if($existing)return $existing;
        $timezone=self::timezone($timezone);$this->db->beginTransaction();
        try {
            $id=random_int(2,2147483647);
            $this->db->prepare('INSERT INTO life_account VALUES (?,?,?,?,?,?)')->execute([$id,$sub,$email,$name,$timezone,LifeStore::now()]);
            $board=['id'=>LifeStore::id(),'name'=>'My Life'];$lists=[];
            foreach(['Idea Box','In Progress','Review','Blocked','Done'] as $position=>$label)$lists[]=['id'=>LifeStore::id(),'boardId'=>$board['id'],'name'=>$label,'position'=>$position,'isDone'=>$label==='Done','archived'=>false,'createdAt'=>LifeStore::now(),'updatedAt'=>LifeStore::now()];
            $state=['schema'=>1,'board'=>$board,'boards'=>[$board+['archived'=>false]],'lists'=>$lists,'tasks'=>[],'goals'=>[],'sprints'=>[],'timezone'=>$timezone];
            $this->db->prepare('INSERT INTO life_board VALUES (?,1,?,?)')->execute([$id,json_encode($state,JSON_THROW_ON_ERROR),LifeStore::now()]);$this->db->commit();return $this->find($id);
        }catch(Throwable $e) {if($this->db->inTransaction())$this->db->rollBack();$existing=$this->bySubject($sub);if($existing)return $existing;throw $e;}
    }
    public function setTimezone(int $id,string $timezone): void {$timezone=self::timezone($timezone);$this->db->prepare('UPDATE life_account SET timezone=? WHERE id=?')->execute([$timezone,$id]);}
}

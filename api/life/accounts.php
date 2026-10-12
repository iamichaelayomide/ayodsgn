<?php
declare(strict_types=1);
/** Account IDs are also the existing board/AI row IDs. Legacy owner remains ID 1. */
final class LifeAccounts {
    public const PRIVACY_VERSION='2026-10-12-v2';
    public const TERMS_VERSION='2026-10-12-v2';
    public function __construct(private PDO $db) {
        $db->exec('CREATE TABLE IF NOT EXISTS life_account (id INT PRIMARY KEY, google_sub VARCHAR(255) UNIQUE NULL, email VARCHAR(320) NOT NULL, name VARCHAR(200) NOT NULL, timezone VARCHAR(100) NOT NULL, created_at VARCHAR(30) NOT NULL)');
        $db->exec('CREATE TABLE IF NOT EXISTS life_policy_acceptance (account_id INT NOT NULL, subject VARCHAR(255) NOT NULL, privacy_version VARCHAR(40) NOT NULL, terms_version VARCHAR(40) NOT NULL, accepted_at VARCHAR(30) NOT NULL, PRIMARY KEY (account_id, subject, privacy_version, terms_version))');
        $db->exec('CREATE TABLE IF NOT EXISTS life_email_auth (email VARCHAR(254) PRIMARY KEY, account_id INT NOT NULL UNIQUE, password_hash VARCHAR(255) NOT NULL, created_at VARCHAR(30) NOT NULL)');
        $db->exec('CREATE TABLE IF NOT EXISTS life_email_attempt (id VARCHAR(32) PRIMARY KEY, bucket VARCHAR(64) NOT NULL, attempted_at BIGINT NOT NULL)');
        $q=$db->prepare('SELECT id FROM life_account WHERE id=1');$q->execute();
        if(!$q->fetchColumn()) {
            try {$db->prepare('INSERT INTO life_account VALUES (1,NULL,?,?,?,?)')->execute(['','Owner','Africa/Lagos',LifeStore::now()]);}
            catch(PDOException $e) {$q->execute();if(!$q->fetchColumn())throw $e;}
        }
    }
    public function find(int $id): ?array {$q=$this->db->prepare('SELECT * FROM life_account WHERE id=?');$q->execute([$id]);return $q->fetch(PDO::FETCH_ASSOC)?:null;}
    public function bySubject(string $sub): ?array {$q=$this->db->prepare('SELECT * FROM life_account WHERE google_sub=?');$q->execute([$sub]);return $q->fetch(PDO::FETCH_ASSOC)?:null;}
    public function byEmail(string $email): ?array {$q=$this->db->prepare('SELECT * FROM life_account WHERE LOWER(email)=?');$q->execute([$email]);return $q->fetch(PDO::FETCH_ASSOC)?:null;}
    public static function email(mixed $value): string {
        if(!is_string($value))throw new LifeError('Enter a valid email address.',422);
        $email=strtolower(trim($value));if(strlen($email)>254||!filter_var($email,FILTER_VALIDATE_EMAIL))throw new LifeError('Enter a valid email address.',422);return $email;
    }
    public static function password(mixed $value): string {
        if(!is_string($value)||mb_strlen($value,'UTF-8')<12||strlen($value)>72||str_contains($value,"\0"))throw new LifeError('Use a password between 12 and 72 characters.',422);return $value;
    }
    public function emailThrottle(string $ip,string $email,bool $signup): void {
        $since=time()-900;$keys=[hash('sha256',($signup?'signup-ip:':'login-ip:').$ip)=>($signup?5:20),hash('sha256',($signup?'signup-email:':'login-email:').$email)=>($signup?3:8)];
        foreach($keys as $key=>$limit){$q=$this->db->prepare('SELECT COUNT(*) FROM life_email_attempt WHERE bucket=? AND attempted_at>?');$q->execute([$key,$since]);if((int)$q->fetchColumn()>=$limit)throw new LifeError('Too many attempts. Wait 15 minutes and try again.',429);}
        foreach($keys as $key=>$limit)$this->db->prepare('INSERT INTO life_email_attempt VALUES (?,?,?)')->execute([LifeStore::id(),$key,time()]);
        $this->db->prepare('DELETE FROM life_email_attempt WHERE attempted_at<?')->execute([time()-86400]);
    }
    public function signUpEmail(mixed $email,mixed $password,string $timezone='Africa/Lagos'): array {
        $email=self::email($email);$password=self::password($password);$timezone=self::timezone($timezone);
        if($this->byEmail($email))throw new LifeError('An account already uses this email. Log in with your original sign-in method.',409);
        $hash=password_hash($password,PASSWORD_DEFAULT);if(!is_string($hash))throw new LifeError('Account creation is temporarily unavailable.',503);
        return $this->createAccount($email,explode('@',$email)[0],$timezone,null,$hash);
    }
    public function signInEmail(mixed $email,mixed $password): array {
        $email=self::email($email);$q=$this->db->prepare('SELECT account_id,password_hash FROM life_email_auth WHERE email=?');$q->execute([$email]);$auth=$q->fetch(PDO::FETCH_ASSOC);
        $dummy='$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.';
        $valid=is_string($password)&&strlen($password)<=72&&!str_contains($password,"\0");$verified=password_verify($valid?$password:'invalid-password',$auth['password_hash']??$dummy);
        if(!$valid||!$auth||!$verified)throw new LifeError('Email or password is incorrect.',401);
        if(password_needs_rehash($auth['password_hash'],PASSWORD_DEFAULT))$this->db->prepare('UPDATE life_email_auth SET password_hash=? WHERE account_id=?')->execute([password_hash($password,PASSWORD_DEFAULT),$auth['account_id']]);
        $account=$this->find((int)$auth['account_id']);if(!$account)throw new LifeError('Email or password is incorrect.',401);return $account;
    }
    public function credentialFingerprint(int $id): string {$q=$this->db->prepare('SELECT password_hash FROM life_email_auth WHERE account_id=?');$q->execute([$id]);$hash=$q->fetchColumn();return is_string($hash)?hash('sha256',$hash):'';}
    public function linkGoogle(int $id,array $identity): array {
        if(($identity['email_verified']??false)!==true)throw new LifeError('Google has not verified this account.',403);
        $account=$this->find($id);if(!$account)throw new LifeError('Sign in first.',401);
        $sub=LifeStore::text($identity['sub']??'',255,true);$email=self::email($identity['email']??'');$existing=$this->bySubject($sub);
        if($existing&&(int)$existing['id']!==$id)throw new LifeError('This Google account already has a planner. It cannot replace your account.',409);
        if($id!==1&&self::email($account['email'])!==$email)throw new LifeError('Link the Google account with the same email as your Life account.',403);
        $q=$this->db->prepare('UPDATE life_account SET google_sub=?,email=?,name=? WHERE id=? AND (google_sub IS NULL OR google_sub=?)');$q->execute([$sub,$email,LifeStore::text($identity['name']??$account['name'],200,true),$id,$sub]);
        if(($this->find($id)['google_sub']??null)!==$sub)throw new LifeError('This account is already linked to another Google account.',409);return $this->find($id);
    }
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
            return $this->linkGoogle(1,$identity);
        }
        if($existing)return $existing;
        $email=self::email($email);if($this->byEmail($email))throw new LifeError('Log in with your email and password first, then link Google in Account & connections.',409);
        return $this->createAccount($email,$name,self::timezone($timezone),$sub,null);
    }
    private function createAccount(string $email,string $name,string $timezone,?string $sub,?string $passwordHash): array {
        $this->db->beginTransaction();
        try {
            $id=random_int(2,2147483647);
            $this->db->prepare('INSERT INTO life_account VALUES (?,?,?,?,?,?)')->execute([$id,$sub,$email,$name,$timezone,LifeStore::now()]);
            if($passwordHash!==null)$this->db->prepare('INSERT INTO life_email_auth VALUES (?,?,?,?)')->execute([$email,$id,$passwordHash,LifeStore::now()]);
            $board=['id'=>LifeStore::id(),'name'=>'My Life'];$lists=[];
            foreach(['Idea Box','In Progress','Review','Blocked','Done'] as $position=>$label)$lists[]=['id'=>LifeStore::id(),'boardId'=>$board['id'],'name'=>$label,'position'=>$position,'isDone'=>$label==='Done','archived'=>false,'createdAt'=>LifeStore::now(),'updatedAt'=>LifeStore::now()];
            $state=['schema'=>1,'board'=>$board,'boards'=>[$board+['archived'=>false]],'lists'=>$lists,'tasks'=>[],'goals'=>[],'sprints'=>[],'timezone'=>$timezone];
            $this->db->prepare('INSERT INTO life_board VALUES (?,1,?,?)')->execute([$id,json_encode($state,JSON_THROW_ON_ERROR),LifeStore::now()]);$this->db->commit();return $this->find($id);
        }catch(Throwable $e) {if($this->db->inTransaction())$this->db->rollBack();if($sub!==null){$existing=$this->bySubject($sub);if($existing)return $existing;}if($this->byEmail($email))throw new LifeError('An account already uses this email. Log in with your original sign-in method.',409);throw $e;}
    }
    public function setTimezone(int $id,string $timezone): void {$timezone=self::timezone($timezone);$this->db->prepare('UPDATE life_account SET timezone=? WHERE id=?')->execute([$timezone,$id]);}
}

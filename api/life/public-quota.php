<?php
declare(strict_types=1);
final class LifePublicQuota {
    public function __construct(private PDO $db) {$db->exec('CREATE TABLE IF NOT EXISTS life_public_quota (id VARCHAR(100) PRIMARY KEY, used INT NOT NULL)');}
    /** Reserve atomically before a provider call. Failed calls still count, preventing retry abuse. */
    public function reserve(int $accountId): void {
        if($accountId===1)return;
        $day=(new DateTimeImmutable('now',new DateTimeZone('Africa/Lagos')))->format('Y-m-d');
        foreach(['global:'.$day,$accountId.':'.$day] as $key){$q=$this->db->prepare('SELECT used FROM life_public_quota WHERE id=?');$q->execute([$key]);if($q->fetchColumn()===false){try{$this->db->prepare('INSERT INTO life_public_quota VALUES (?,0)')->execute([$key]);}catch(PDOException $e){$q->execute([$key]);if($q->fetchColumn()===false)throw $e;}}}
        $this->db->beginTransaction();
        try {foreach(['global:'.$day=>500,$accountId.':'.$day=>50] as $key=>$limit){$q=$this->db->prepare('UPDATE life_public_quota SET used=used+1 WHERE id=? AND used<?');$q->execute([$key,$limit]);if($q->rowCount()!==1)throw new LifeError('Today’s shared AI allowance is used up. Your planner and draft remain available. Try again tomorrow.',429);}$this->db->commit();}
        catch(Throwable $e){if($this->db->inTransaction())$this->db->rollBack();throw $e;}
    }
}

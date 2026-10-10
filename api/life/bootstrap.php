<?php
declare(strict_types=1);
require_once __DIR__.'/store.php';

function life_headers(): void {
    header('Cache-Control: private, no-store, max-age=0');
    header('CDN-Cache-Control: no-store');
    header('Cloudflare-CDN-Cache-Control: no-store');
    header('Pragma: no-cache');
    header('X-Content-Type-Options: nosniff');
    header('Referrer-Policy: no-referrer');
    header('X-Frame-Options: DENY');
}
function life_config(): array {
    $path=getenv('LIFE_CONFIG_PATH') ?: dirname(__DIR__,2).'/../private/life-config.php';
    if (!is_file($path)) throw new LifeError('The private planner is awaiting hosting setup.',503);
    $c=require $path;
    if (!is_array($c) || empty($c['dsn']) || empty($c['setup_token_hash'])) throw new LifeError('The private planner configuration is incomplete.',503);
    return $c;
}
function life_store(array $config): LifeStore {
    return new LifeStore(new PDO($config['dsn'],$config['user']??null,$config['password']??null,[PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION,PDO::ATTR_DEFAULT_FETCH_MODE=>PDO::FETCH_ASSOC,PDO::ATTR_EMULATE_PREPARES=>false]));
}
function life_session(): void {
    ini_set('session.use_strict_mode','1'); ini_set('session.use_only_cookies','1');
    session_name('ayolife');
    session_set_cookie_params(['lifetime'=>0,'path'=>'/','secure'=>($_SERVER['HTTPS']??'')==='on','httponly'=>true,'samesite'=>'Strict']);
    session_start();
    if ((isset($_SESSION['owner'])||isset($_SESSION['partner'])) && time()-($_SESSION['last_activity']??0)>3600) { $_SESSION=[]; session_regenerate_id(true); }
    $_SESSION['csrf']??=bin2hex(random_bytes(32));
    if ((isset($_SESSION['owner'])||isset($_SESSION['partner']))) $_SESSION['last_activity']=time();
}
function life_json(array $value, int $status=200): never {
    http_response_code($status); header('Content-Type: application/json; charset=utf-8'); echo json_encode($value,JSON_THROW_ON_ERROR); exit;
}

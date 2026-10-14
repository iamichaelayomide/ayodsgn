<?php
declare(strict_types=1);
// Public worker source only: no session, account data or credentials.
header('Content-Type: application/javascript; charset=UTF-8');
header('Service-Worker-Allowed: /');
header('Cache-Control: no-cache, no-store, max-age=0, must-revalidate');
header('CDN-Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');
readfile(__DIR__.'/reminder-sw.js');

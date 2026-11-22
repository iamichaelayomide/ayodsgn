<?php
declare(strict_types=1);
require_once __DIR__.'/oauth.php';
life_headers();header('Content-Type: application/json');
if(($_GET['type']??'')==='resource')life_json(['resource'=>LifeConnections::RESOURCE,'resource_name'=>'Life planner','authorization_servers'=>[LifeConnections::ORIGIN],'scopes_supported'=>LifeConnections::SCOPES,'bearer_methods_supported'=>['header'],'resource_documentation'=>LifeConnections::ORIGIN.'/life/connections/']);
life_json(['issuer'=>LifeConnections::ORIGIN,'authorization_endpoint'=>LifeConnections::ORIGIN.'/api/planner/server.php?action=authorize','token_endpoint'=>LifeConnections::ORIGIN.'/api/planner/server.php?action=token','registration_endpoint'=>LifeConnections::ORIGIN.'/api/planner/server.php?action=register','revocation_endpoint'=>LifeConnections::ORIGIN.'/api/planner/server.php?action=revoke','response_types_supported'=>['code'],'grant_types_supported'=>['authorization_code','refresh_token'],'code_challenge_methods_supported'=>['S256'],'token_endpoint_auth_methods_supported'=>['none'],'scopes_supported'=>LifeConnections::SCOPES,'authorization_response_iss_parameter_supported'=>true]);

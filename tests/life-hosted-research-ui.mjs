import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../life/hosted-research-ui.js',import.meta.url),'utf8');const {createHostedResearch}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
let owner=1;const calls=[],listeners={};const panel={isConnected:true,innerHTML:'',addEventListener:(n,f)=>listeners[n]=f,removeEventListener(){},querySelector(){return null;}};
const ui=createHostedResearch({request:async(action,args)=>{calls.push({action,args});return {enabled:action.endsWith('enable'),dailyLimit:25,privateContextEnabled:false};},getData:()=>({workspaceId:owner}),escape:s=>String(s??'')});
ui.render(panel);await new Promise(r=>setTimeout(r,0));assert(!calls.some(c=>c.action.endsWith('enable')),'Opening settings never grants access');
const click=()=>listeners.click({target:{closest:()=>({dataset:{runtimeAction:'enable'}})}});await click();assert.equal(calls.length,1,'Approval is required');listeners.change({target:{name:'runtimeConsent',checked:true}});await click();assert.equal(calls[1].action,'ayo-os.agents.runtime.enable');assert.deepEqual(calls[1].args,{workspaceId:1,confirm:true,confirmProvider:true,confirmWrites:true});assert.match(panel.innerHTML,/Enabled/);
ui.reset();owner=2;ui.render(panel);await new Promise(r=>setTimeout(r,0));await click();assert.equal(calls.filter(c=>c.action.endsWith('enable')).length,1,'Account reset clears consent');
ui.reset();console.log('Hosted research UI: explicit approval, runtime status and account reset checks passed');

import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import vm from 'node:vm';
const read=n=>JSON.parse(readFileSync(new URL(n+'.json',import.meta.url)));
const coordinator=read('coordinator');
assert.equal(coordinator.active,false);
assert.equal(coordinator.settings.timezone,'Africa/Lagos');
assert.equal(coordinator.nodes.filter(n=>n.type.endsWith('.executeWorkflow')&&n.parameters.options.waitForSubWorkflow===false).length,4);
const gate=coordinator.nodes.find(n=>n.name==='Connection gate').parameters.jsCode;
assert.throws(()=>new Function(gate)(),/Setup required/);
const source={url:'https://example.com/jobs',claim:'Published role, contact owner@example.com'};
const proposal={company:'Example',role:'Product researcher',summary:'Official role listing',contacts:[{name:'Professional Name',role:'Hiring contact',email:'owner@example.com',sourceUrl:source.url}],sources:[source]};
for(const agent of ['nysc','freelance','career','ai_testing']){
 const workflow=read(agent);assert.equal(workflow.active,false);
 assert(!workflow.nodes.some(n=>n.credentials));
 const http=workflow.nodes.find(n=>n.type.endsWith('.httpRequest'));assert.equal(http.parameters.url,'https://api.openai.com/v1/responses');
 const js=workflow.nodes.find(n=>n.name==='Review proposals only').parameters.jsCode;
 const run=proposals=>vm.runInNewContext('(function(){'+js+'})()',{$input:{first:()=>({json:{status:'completed',output:[{content:[{type:'output_text',text:JSON.stringify({proposals})}]}]}})},$execution:{id:'test'},$:()=>({first:()=>({json:{agent}})}),URL,Date,Set,JSON,Error});
 const result=run([{...proposal,acceptance:'accepted',reviewStatus:'approved'}])[0].json;
 assert.equal(result.proposals[0].acceptance,'unknown');assert.equal(result.proposals[0].reviewStatus,'needs_review');assert.equal(result.proposals[0].externalActionsAllowed,false);
 assert.equal(run([])[0].json.proposals.length,0);
 assert.throws(()=>run([{...proposal,sources:[]}]),/Missing evidence/);
 assert.throws(()=>run([{...proposal,sources:[{...source,url:'javascript:alert(1)'}]}]),/Invalid evidence/);
 assert.throws(()=>run([{...proposal,contacts:[{name:'A',role:'Hiring',email:'guessed@example.com',sourceUrl:source.url}]}]),/Email lacks explicit/);
 assert.throws(()=>run([proposal,proposal]),/Duplicate proposal/);
}
console.log('PASS: workflow safety gates, four independent launches, source checks, unknown acceptance, empty results and duplicate rejection');

import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const source=readFileSync(new URL('../life/opportunity-composer.js',import.meta.url),'utf8');
const {createOpportunityComposer}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
// Minimal event-capable DOM: close events are queued, as in a browser. Network is mocked.
class Element {
 constructor(){this.listeners={};this.isConnected=false;this.disabled=false;this.textContent='';this.value='';this.hidden=false;this.children=[];}
 addEventListener(type,fn){this.listeners[type]=fn;}
 setAttribute(){}
 append(el){el.isConnected=true;this.children.push(el);}
 replaceChildren(){this.children=[];}
 remove(){this.isConnected=false;}
 close(){this.open=false;queueMicrotask(()=>this.listeners.close?.());}
 showModal(){this.open=true;}
 async emit(type,event){return this.listeners[type]?.(event);}
}
class Dialog extends Element {
 constructor(){super();this.nodes=new Map();this.form=new Element();this.form.reportValidity=()=>true;this.form.elements={contactId:{value:'person'},subject:{value:'Hello'},body:{value:'A relevant message'},prompt:{value:''}};this.nodes.set('form',this.form);}
 querySelector(selector){if(selector.startsWith('[name='))return this.form.elements[selector.slice(6,-1)];if(!this.nodes.has(selector))this.nodes.set(selector,new Element());return this.nodes.get(selector);}
 querySelectorAll(selector){return selector==='button'?[this.querySelector('[data-mail-action=send]')]:[];}
}
const oldDocument=globalThis.document;
const body=new Element();const created=[];
globalThis.document={body,createElement:tag=>{const el=tag==='dialog'?new Dialog():new Element();if(tag==='dialog')created.push(el);return el;}};
const data={workspaceId:1,version:4,state:{companies:[{id:'company',name:'Example'}],contacts:[{id:'person',companyId:'company',name:'Person',email:'person@example.com'}],opportunities:[{id:'opp',companyId:'company',documentIds:['file']}],drafts:[{id:'draft',opportunityId:'opp',contactId:'person',researchIds:['source'],documentIds:['file'],schedule:'2026-11-04T09:00',timezone:'Europe/London'}]},documents:[{id:'file',kind:'cv',name:'CV.pdf'}]};
let calls=[],saves=[],prepareHook=null,sendMode='uncertain',pendingSave=null;
const request=async(action,args)=>{calls.push({action,args});if(action==='ayo-os.mail.status')return {connected:true,sender:'owner@example.com'};if(action==='ayo-os.mail.prepare'){await prepareHook?.();return {preparationId:'prep',fingerprint:'hash',preview:{to:'person@example.com',subject:'Hello',body:'A relevant message',attachments:[{id:'file',name:'CV.pdf'}]}};}if(action==='ayo-os.mail.send'){if(sendMode==='uncertain')throw Error('Lost response');return {status:'sent'};}if(action==='ayo-os.mail.draft-ai')return {subject:'Suggested',body:'Suggested body'};throw Error(`Unexpected ${action}`);};
const composer=createOpportunityComposer({request,getData:()=>data,saveOperation:async(operation,args)=>{saves.push({operation,args});if(pendingSave)return pendingSave;return {recordId:'draft'};},escape:s=>String(s??'')});
const click=(dialog,action)=>dialog.emit('click',{target:{closest:()=>({dataset:{mailAction:action}})},preventDefault(){}});
const submit=dialog=>dialog.form.emit('submit',{submitter:{dataset:{mailAction:'send'}},preventDefault(){}});
try {
 await composer.open('opp','draft');let dialog=created.at(-1);assert.equal(calls.filter(c=>c.action==='ayo-os.mail.send').length,0,'Opening never sends');
 await click(dialog,'save');assert.deepEqual(saves.at(-1).args.documentIds,['file'],'Saving retains selected attachments');assert.deepEqual(saves.at(-1).args.researchIds,['source']);assert.equal(saves.at(-1).args.schedule,'2026-11-04T09:00');assert.equal(saves.at(-1).args.timezone,'Europe/London');assert(!calls.some(c=>c.action==='ayo-os.mail.send'),'Saving never sends');
 await click(dialog,'ai');assert(!calls.some(c=>c.action==='ayo-os.mail.send'),'AI drafting never sends');
 await composer.open('opp','draft');dialog=created.at(-1);assert(dialog.isConnected&&dialog.open,'An old queued close event cannot remove the next composer');
 calls=[];let prevented=false;await dialog.emit('keydown',{key:'Enter',target:{tagName:'INPUT',name:'prompt'},preventDefault(){prevented=true;}});assert(prevented,'Enter in the AI prompt cannot implicitly send');await dialog.form.emit('submit',{preventDefault(){}});assert(!calls.some(c=>c.action==='ayo-os.mail.send'),'A submit without explicit Send cannot transmit');await submit(dialog);assert.equal(calls.filter(c=>c.action==='ayo-os.mail.send').length,1);assert.equal(calls.find(c=>c.action==='ayo-os.mail.send').args.sendConfirmed,true);assert(dialog.querySelector('[data-mail-action=send]').disabled,'Uncertain send disables Send');await submit(dialog);assert.equal(calls.filter(c=>c.action==='ayo-os.mail.send').length,1,'An uncertain receipt blocks a duplicate submit');
 await composer.open('opp','draft');dialog=created.at(-1);calls=[];prepareHook=()=>dialog.emit('input',{target:{name:'body'}});await submit(dialog);assert(!calls.some(c=>c.action==='ayo-os.mail.send'),'Edits during preparation abort the send');prepareHook=null;
 await composer.open('opp','draft');dialog=created.at(-1);calls=[];data.state.contacts[0].email='changed@example.com';await submit(dialog);assert(!calls.some(c=>c.action==='ayo-os.mail.send'),'Prepared recipient mismatch aborts send');data.state.contacts[0].email='person@example.com';
 await composer.open('opp','draft');dialog=created.at(-1);let finishSave;pendingSave=new Promise(resolve=>{finishSave=resolve;});const oldSave=click(dialog,'save');await composer.open('opp');const newDialog=created.at(-1);finishSave({recordId:'draft'});await oldSave;pendingSave=null;await click(newDialog,'save');assert.equal(saves.at(-1).args.id,'','A stale save cannot attach the next composer to the previous draft');
 composer.reset();console.log('Composer UI: manual sending, uncertain receipt, lifecycle, saved attachments/metadata and preparation race checks passed');
} finally {composer.reset();if(oldDocument===undefined)delete globalThis.document;else globalThis.document=oldDocument;}

import assert from 'node:assert/strict';
import {createCompanion} from '../life/companion.js';
const classes=new Set();
const listeners={};let content='',sent,uploadResolve,uploadReject,failSend=true;
const sendButton={disabled:true,setAttribute(){}};
const history={scrollHeight:100,clientHeight:100,scrollTop:0},error={textContent:''},input={style:{setProperty(){}},scrollHeight:44,focus(){},setSelectionRange(){}};
const root={get innerHTML(){return content},set innerHTML(v){content=v},addEventListener:(n,fn)=>(listeners[n]??=[]).push(fn),querySelector:s=>s==='.chat-history'?history:s==='#ai-message'?input:s==='.ramble-send'?sendButton:s==='.error'||s==='#ai-error'?error:null,classList:{toggle(name){if(classes.has(name)){classes.delete(name);return false}classes.add(name);return true},contains:name=>classes.has(name),add:name=>classes.add(name),remove:name=>classes.delete(name)},replaceChildren(){content=''}};
globalThis.document={getElementById:id=>id==='companion'?root:null,activeElement:null,addEventListener(){},dispatchEvent(){},documentElement:{dataset:{timezone:'Africa/Lagos'},clientHeight:900,style:{setProperty(){}}}};
globalThis.window={addEventListener(){}};globalThis.matchMedia=()=>({matches:false});globalThis.location={origin:'https://ramble.test'};
const escape=value=>String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
let response={version:1,configured:true,state:{conversations:[],commands:[]}};let created=0,createWait=null,failCreate=false;
const companion=createCompanion({request:async(action,args)=>{if(action==='ai.mutate'){created++;if(failCreate)throw Error('Could not start chat');if(createWait)await createWait;response={...response,version:2,state:{...response.state,conversations:[{id:'conversation-1',title:args.args.title,messages:[]}]}};}return response},escape,refreshSelects(){},role:()=> 'owner',getBoard:()=>({version:1,state:{settings:{}}}),getApplications:()=>null,getScreen:()=>({}),uploadChatFile:async(file,args)=>{assert.equal(args.conversationId,'conversation-1');await new Promise((resolve,reject)=>{uploadResolve=resolve;uploadReject=reject});return {attachment:{id:'file-1',name:file.name,mime:file.type,url:'/api/life/?action=ai.attachment&id=file-1'}}},sendStream:async args=>{sent=args;if(failSend)throw Error('Offline');response={...response,state:{...response.state,conversations:[{id:'conversation-1',title:'Saved conversation',messages:[{role:'user',text:args.text,attachments:[{id:'file-1',name:'context.txt',mime:'text/plain',url:'/api/life/?action=ai.attachment&id=file-1'}]}]}]}};return response}});
const change=async target=>{await Promise.all((listeners.change||[]).map(fn=>fn({target})))};
const click=async dataset=>{await listeners.click[0]({target:{closest:()=>({dataset})}})};
const submit=()=>listeners.submit[0]({preventDefault(){},target:{id:'ai-composer',querySelector:()=>error}});
await companion.render();assert.match(content,/Add files/);
assert.match(content, /ramble-send[^>]*disabled/, 'Empty composer must disable Send');
assert.doesNotMatch(content,/id="ramble-file-picker"/, 'Attachment choices stay out of the default composer');
await click({ai:'add-files'});assert.match(content,/Add photos/);assert.match(content,/Add files/);assert.match(content,/id="ramble-file-picker"[^>]*popover="auto"/, 'Attachment choices open in a dismissible popover');
await click({ai:'add-files'});assert.doesNotMatch(content,/id="ramble-file-picker"/, 'Plus toggles the menu closed');
await click({ai:'add-files'});

listeners.input[0]({target:{id:'ai-message',value:'Use this file',hasAttribute:()=>false}});
assert.equal(sendButton.disabled,false,'Typing immediately enables Send without losing input focus');

input.selectionStart=2;input.selectionEnd=8;input.selectionDirection='forward';input.focus=()=>{document.activeElement=input};input.setSelectionRange=(a,b)=>{assert.equal(a,2);assert.equal(b,8,'Upload rerender must preserve selected text')};document.activeElement=input;
const upload=change({id:'ai-files',files:[new File(['context'],'context.txt',{type:'text/plain'})]});
await new Promise(resolve=>setTimeout(resolve,0));assert.match(content,/Uploading/);await submit();assert.equal(sent,undefined,'Send must remain blocked while uploading');
uploadResolve();await upload;document.activeElement=null;assert.equal(created,1);assert.match(content,/context.txt/);
await submit();assert.deepEqual(sent.attachmentIds,['file-1']);assert.equal(sent.text,'Use this file');assert.match(content,/Use this file/);assert.match(content,/context.txt/);assert.match(content,/Offline/);
failSend=false;await submit();assert.match(content,/ramble-attachment/);assert.doesNotMatch(content,/ramble-file-chip/);
// Removal is handled by the real delegated click handler.
const extra=change({id:'ai-files',files:[new File(['extra'],'extra.txt',{type:'text/plain'})]});await new Promise(resolve=>setTimeout(resolve,0));
await click({ai:'remove-file',id:'2'});assert.doesNotMatch(content,/extra.txt/);uploadResolve();await extra;assert.doesNotMatch(content,/extra.txt/);
// A failed upload exposes Retry, which uploads again and becomes sendable.
const failing=change({id:'ai-files',files:[new File(['retry'],'retry.txt',{type:'text/plain'})]});await new Promise(resolve=>setTimeout(resolve,0));uploadReject(Error('Upload offline'));await failing;
assert.match(content,/Retry/);assert.match(content,/Upload offline/);
const retrying=click({ai:'retry-file',id:'3'});await new Promise(resolve=>setTimeout(resolve,0));assert.match(content,/Uploading/);uploadResolve();await retrying;assert.match(content,/Ready/);await click({ai:'remove-file',id:'3'});
// Temporary chat explains why saved files cannot be attached.
await change({id:'ai-temporary',checked:true});assert.match(content,/Files are available in saved chats/);await change({id:'ai-temporary',checked:false});
// List navigation is explicit and idempotent, and returns to the current thread.
companion.showHistory();companion.showHistory();assert.equal(companion.navigationState().view,'list');assert.equal(companion.back(),true);assert.equal(companion.back(),false);
listeners.input[0]({target:{id:'ai-message',value:'Keep this draft',hasAttribute:()=>false}});
await click({ai:'new'});assert.match(content, /placeholder="Message Ramble…"><\/textarea>/);
listeners.input[0]({target:{id:'ai-message',value:'New draft',hasAttribute:()=>false}});
await click({ai:'select-chat',id:'conversation-1'});assert.match(content,/Keep this draft/);
await click({ai:'new'});assert.match(content,/New draft/);
// A send owns the new-chat creation await: navigation cannot redirect its payload.
let finishCreate;createWait=new Promise(resolve=>{finishCreate=resolve});const beforeCreated=created;const sendingNew=submit();
await new Promise(resolve=>setTimeout(resolve,0));assert.equal(companion.navigationState().busy,true);await click({ai:'select-chat',id:'different-chat'});assert.equal(created,beforeCreated+1);
finishCreate();await sendingNew;createWait=null;assert.equal(sent.text,'New draft');assert.equal(sent.conversationId,'conversation-1');
// A failed new-chat save keeps the new draft and route instead of selecting another chat.
await click({ai:'new'});listeners.input[0]({target:{id:'ai-message',value:'Save me later',hasAttribute:()=>false}});failCreate=true;await submit();assert.equal(companion.navigationState().title,'New chat');assert.match(content,/Save me later/);assert.match(content,/Could not start chat/);failCreate=false;
// Late upload responses must not restore a signed-out session.
const next=change({id:'ai-files',files:[new File(['later'],'later.txt',{type:'text/plain'})]});await new Promise(resolve=>setTimeout(resolve,0));companion.reset();uploadResolve();await next;assert.equal(content,'');
console.log('Actual companion creates scoped chat, blocks upload sends, preserves failed drafts/files, renders saved attachments and ignores stale upload responses');

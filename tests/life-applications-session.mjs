import assert from 'node:assert/strict';
import {createApplications} from '../life/applications.js';

// Exercise the actual client with deferred network responses around sign-out.
const deferred=()=>{let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;});return {promise,resolve,reject};};
const listeners={};
const root={hidden:true,innerHTML:'',textContent:'',addEventListener:(name,fn)=>listeners[name]=fn,setAttribute(){},removeAttribute(){},replaceChildren(){this.innerHTML='';},querySelector(){return null;}};
globalThis.document={querySelectorAll:()=>[],addEventListener(){}};
const state=account=>({version:1,state:{trackers:[],opportunities:[],categories:[],documents:[],account}});
let next=Promise.resolve(state('A'));
const notices=[];
let navigated=0;
const app=createApplications({root,request:()=>next,escape:String,role:()=> 'owner',announce:message=>notices.push(message),getData:()=>({state:{goals:[],tasks:[]}}),onNavigation:()=>navigated++});
await app.render();
assert.equal(app.snapshot().account,'A');
const oldSave=deferred();next=oldSave.promise;
const click=()=>listeners.click({target:{closest:()=>({dataset:{appAction:'applied',id:'task'},disabled:false})}});
const saving=click();
app.reset();
oldSave.resolve({...state('A'),receipt:{summary:'Old save',recordId:'task'}});
await saving;
assert.equal(app.snapshot(),null,'A completed save must not restore signed-out account data');
assert.equal(notices.includes('Old save'),false,'A stale save must not announce success');

// A stale read error must not overwrite the new account screen.
const oldRead=deferred();next=oldRead.promise;const rendering=app.render();
app.reset();next=Promise.resolve(state('B'));await app.render();
root.textContent='Account B';oldRead.reject(Error('Account A failed'));await rendering;
assert.equal(root.textContent,'Account B','A stale read failure must not replace the new screen');
assert.equal(app.snapshot().account,'B');

// Reset immediately releases the old account save lock; its finally cannot
// release a newer account save lock while that request is still pending.
const first=deferred();next=first.promise;const pendingFirst=click();app.reset();
next=Promise.resolve(state('C'));await app.render();
const second=deferred();next=second.promise;const pendingSecond=click();
first.reject(Error('Old network error'));await pendingFirst;
const before=notices.length;await click();
assert.equal(notices[before],'Another application change is saving. Please wait.');
app.reset();second.resolve({...state('C'),receipt:{summary:'Stale',recordId:'task'}});await pendingSecond;
assert.equal(app.snapshot(),null);

// A read begun before a committed save cannot roll its version backwards.
next=Promise.resolve(state('D'));await app.render();
const refresh=deferred();next=refresh.promise;const refreshing=app.render();
next=Promise.resolve({...state('D saved'),version:2,receipt:{summary:'Saved',recordId:'task'}});
await click();refresh.resolve(state('D old'));await refreshing;
assert.equal(app.snapshot().account,'D saved','A pre-save refresh must not overwrite the committed state');
const failedRefresh=deferred();next=failedRefresh.promise;const failingRender=app.render();
next=Promise.resolve({...state('D saved again'),version:3,receipt:{summary:'Saved again',recordId:'task'}});
await click();root.textContent='Saved screen';failedRefresh.reject(Error('Old refresh failed'));await failingRender;
assert.equal(root.textContent,'Saved screen','An obsolete refresh error must not wipe out a newer save');

// Opening a detail is navigation even though it does not redraw the list.
app.reset();const details=state('E');
details.state.trackers=[{id:'jobs',name:'Jobs',stages:[{id:'saved',name:'Saved'}]}];
details.state.opportunities=[{id:'op',trackerId:'jobs',title:'Sales role',stage:'saved',availability:'unknown',checklist:[],taskIds:[],customFields:[]}];
details.state.events=[];
next=Promise.resolve(details);await app.render();
const panel={setAttribute(){},addEventListener(){},showModal(){},querySelector(){return null;}};
document.createElement=()=>panel;root.append=()=>{};
const beforeOpen=navigated;
await listeners.click({target:{closest:()=>({dataset:{appAction:'open',id:'op'}})}});
assert.equal(navigated,beforeOpen+1,'Opening an opportunity must refresh breadcrumb and Back controls');
assert.equal(app.breadcrumbs().at(-1).label,'Sales role');
assert.equal(app.canBack(),true);
console.log('13 Applications session isolation, refresh ordering and navigation checks passed');

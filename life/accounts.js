import {ensureLifeRegistration,lifePushSubscriptions,removeLifeSubscriptions} from './pwa.js?v=5';
export const plannerTimezone=()=>document.documentElement.dataset.timezone||'Africa/Lagos';
export function createAccountSettings({request}) {
 let session,googleBusy=false;
 const syncGoogle=()=>{googleButton.disabled=loginButton.disabled=googleBusy||!session?.googleReady||!policyAccepted();};
 const googleActions=document.querySelector('#google-auth-actions'),googleButton=document.querySelector('#google-signup'),loginButton=document.querySelector('#google-login'),authForm=document.querySelector('#auth-form');
 const ownerRecovery=new URLSearchParams(location.search).get('owner-access')==='1';authForm.hidden=!ownerRecovery;document.querySelector('#partner-login').hidden=true;
 const settingsButton=document.createElement('button');settingsButton.type='button';settingsButton.className='account-settings-trigger';settingsButton.setAttribute('aria-label','Connections');settingsButton.title='Connections';settingsButton.innerHTML='<img class="nav-icon" src="./icons/link.svg?v=ios1" alt=""><span class="nav-label">Connections</span>';settingsButton.hidden=true;document.querySelector('#logout').before(settingsButton);
 const dialog=document.createElement('dialog');
 dialog.className='account-settings';
 dialog.setAttribute('aria-labelledby','account-settings-title');
 const services=[['calendar','Google Calendar'],['tasks','Google Tasks'],['documents','Google Docs']];
 dialog.innerHTML=`
  <header class="connection-header dialog-heading">
   <div><h2 id="account-settings-title">Connections</h2><p data-identity></p></div>
   <button type="button" data-close aria-label="Close connections">×</button>
  </header>
  <div class="connection-body">
   <label data-workspaces hidden>Active planner<select aria-label="Active planner"></select></label>
   <section class="connection-section" data-google-settings>
    <h3>Google</h3>
    <button type="button" data-link hidden>Link my Google account</button>
    <ul class="connection-services">${services.map(([key,name])=>`
     <li><span>${name}</span><span class="connection-state" data-service="${key}">Checking…</span>
     <button type="button" data-${key} aria-label="Connect ${name}" hidden>Connect</button></li>`).join('')}</ul>
    <p class="connection-note" data-google-status role="status" hidden></p>
    <button type="button" data-disconnect hidden>Disconnect Calendar and Tasks</button>
    <div data-conflicts></div>
   </section>
   <section class="connection-section"><h3>AI assistants</h3><p class="connection-note">Use your planner from ChatGPT or another compatible assistant.</p><a href="/life/connections/">Manage AI connections</a></section>
   <section class="connection-section" data-zone-settings>
    <h3>Timezone</h3>
    <form data-zone><label><span class="sr-only">Your timezone</span><select name="timezone" required></select></label><button type="submit">Save timezone</button></form>
    <p class="connection-note" data-zone-status role="status" hidden></p>
   </section>
   <section class="connection-section" data-notifications>
    <h3>Notifications</h3>
    <label class="notification-switch"><span>Task reminders on this device</span><input type="checkbox" role="switch" aria-label="Task reminders on this device" data-push></label>
   </section>
   <p class="error" data-error role="alert"></p>
  </div>`;
 document.body.append(dialog);
 const error=message=>dialog.querySelector('[data-error]').textContent=message;
 const detected=()=>Intl.DateTimeFormat().resolvedOptions().timeZone||'Africa/Lagos';
 const policyAccepted=()=>document.querySelector('#policy-accept').checked;
 const policyVersions={privacyVersion:document.querySelector('#policy-privacy-version').value,termsVersion:document.querySelector('#policy-terms-version').value};
 document.querySelector('#policy-accept').addEventListener('change',()=>{document.querySelector('#auth-error').textContent='';syncGoogle();});
 async function begin(purpose){if(purpose==='login'&&!policyAccepted())throw Error('Please agree to the Privacy Policy and Terms to continue.');const result=await request('google.start',{purpose,timezone:session?.account?.timezone||detected(),...(purpose==='login'?{policyAccepted:true,...policyVersions}:{})});location.assign(result.url);}
 async function authenticate(button){if(googleBusy||!policyAccepted())return;googleBusy=true;const other=button===googleButton?loginButton:googleButton;try{button.disabled=true;other.disabled=true;document.querySelector('#auth-error').textContent='';await begin('login');}catch(e){document.querySelector('#auth-error').textContent=e.message;if(!policyAccepted())document.querySelector('#policy-accept').focus();googleBusy=false;syncGoogle();}}
 googleButton.onclick=()=>authenticate(googleButton);loginButton.onclick=()=>authenticate(loginButton);
 dialog.querySelector('[data-link]').onclick=()=>begin('link').catch(e=>error(e.message));dialog.querySelector('[data-close]').onclick=()=>dialog.close();
 function setService(key,{connected,available}){
  const state=dialog.querySelector(`[data-service="${key}"]`);
  const action=dialog.querySelector(`[data-${key}]`);
  state.hidden=!connected&&available;
  state.textContent=connected?'Connected':'Unavailable';
  state.dataset.connected=String(Boolean(connected));
  action.hidden=connected||!available;
  action.disabled=false;
 }
 async function status(){
  const [sync,docs]=await Promise.all([request('google.status'),request('applications.google.status',{})]);
  const linked=Boolean(session.account?.google_sub);
  setService('calendar',{connected:sync.calendarConnected,available:sync.available&&linked});
  setService('tasks',{connected:sync.tasksConnected,available:sync.available&&linked});
  setService('documents',{connected:docs.connected,available:docs.available&&linked});
  const note=dialog.querySelector('[data-google-status]');
  note.textContent=sync.error?`Calendar and Tasks sync: ${sync.error}`:sync.syncing?'Syncing Calendar and Tasks…':sync.lastSync?
   `Last synced ${new Date(sync.lastSync).toLocaleString(undefined,{timeZone:plannerTimezone()})}`:'';
  note.hidden=!note.textContent;
  dialog.querySelector('[data-disconnect]').hidden=!sync.connected;
  const root=dialog.querySelector('[data-conflicts]');
  root.replaceChildren();
  for(const conflict of sync.conflicts||[]){
   const section=document.createElement('section'),message=document.createElement('p');
   message.textContent='This task changed in Life and Google. Choose which version to keep.';
   const actions=document.createElement('div');
   actions.className='connection-conflict-actions';
   for(const choice of ['life','google']){
    const button=document.createElement('button');
    button.type='button';button.textContent=choice==='life'?'Keep Life version':'Keep Google version';
    button.onclick=async()=>{try{await request('google.resolve',{taskId:conflict.taskId,kind:conflict.kind,choice});await status();}catch(e){error(e.message);}};
    actions.append(button);
   }
   section.append(message,actions);root.append(section);
  }
 }
 async function loadWorkspaces(){
  const result=await request('workspace.list');
  const picker=dialog.querySelector('[data-workspaces]'),choices=picker.querySelector('select');
  const workspaces=result.workspaces||[];
  choices.replaceChildren();
  for(const workspace of workspaces){
   const option=document.createElement('option');
   option.value=workspace.owner_id;
   option.textContent=Number(workspace.owner_id)===Number(session.account?.id)?'My Life':`Shared planner · ${workspace.name}`;
   choices.append(option);
  }
  choices.value=String(session.workspaceId||session.account?.id||'');
  choices.onchange=async()=>{try{await request('workspace.select',{id:Number(choices.value)});location.reload();}catch(e){error(e.message);}};
  picker.hidden=workspaces.length<2;
 }
 settingsButton.onclick=async()=>{
  error('');
  const owner=session.role!=='partner';
  dialog.querySelector('[data-identity]').textContent=session.account?.email||'Original owner account';
  dialog.querySelector('[data-link]').hidden=!owner||Boolean(session.account?.google_sub);
  dialog.querySelector('[data-google-settings]').hidden=!owner;
  dialog.querySelector('[data-zone-settings]').hidden=!owner;
  dialog.querySelector('[data-notifications]').hidden=!owner;
  dialog.querySelector('[data-disconnect]').hidden=true;
  dialog.querySelector('[data-google-status]').hidden=true;
  dialog.querySelector('[data-zone-status]').hidden=true;
  dialog.querySelector('[data-conflicts]').replaceChildren();
  for(const [key] of services){
   const state=dialog.querySelector(`[data-service="${key}"]`);
   state.textContent='Checking…';state.hidden=false;state.dataset.connected='false';
   dialog.querySelector(`[data-${key}]`).hidden=true;
  }
  const select=dialog.querySelector('[name=timezone]');
  select.replaceChildren();
  const timezone=plannerTimezone();
  for(const name of new Set([...(Intl.supportedValuesOf?.('timeZone')||['Africa/Lagos','UTC']),timezone])){
   const option=document.createElement('option');option.value=name;option.textContent=name.replaceAll('_',' ');select.append(option);
  }
  select.value=timezone;
  dialog.showModal();
  const tasks=[loadWorkspaces()];
  if(owner){
   tasks.push(status());
   const toggle=dialog.querySelector('[data-push]');
   toggle.disabled=true;toggle.checked=false;
   if('serviceWorker' in navigator)tasks.push(lifePushSubscriptions().then(subscriptions=>{toggle.checked=subscriptions.length>0;}).finally(()=>{toggle.disabled=false;}));
   else toggle.disabled=false;
  }
  const results=await Promise.allSettled(tasks);
  const failure=results.find(result=>result.status==='rejected');
  if(failure)error(failure.reason.message);
 };
 dialog.querySelector('[data-documents]').onclick=()=>begin('connect-documents').catch(e=>error(e.message));dialog.querySelector('[data-calendar]').onclick=()=>begin('connect-calendar').catch(e=>error(e.message));dialog.querySelector('[data-tasks]').onclick=()=>begin('connect-tasks').catch(e=>error(e.message));dialog.querySelector('[data-disconnect]').onclick=async()=>{try{await request('google.disconnect',{});await status();}catch(e){error(e.message);}};
 dialog.querySelector('[data-zone]').onsubmit=async event=>{
  event.preventDefault();
  const form=event.currentTarget,save=form.querySelector('[type=submit]'),notice=dialog.querySelector('[data-zone-status]');
  save.disabled=true;error('');notice.hidden=true;
  try{
   const timezone=form.elements.timezone.value;
   await request('account.timezone',{timezone});
   document.documentElement.dataset.timezone=timezone;session.account.timezone=timezone;
   notice.textContent='Timezone saved.';notice.hidden=false;
  }catch(e){error(e.message);}finally{save.disabled=false;}
 };
 dialog.querySelector('[data-push]').onchange=async()=>{const toggle=dialog.querySelector('[data-push]');const enabling=toggle.checked;toggle.disabled=true;try{if(!enabling){if(!await removeLifeSubscriptions(request))throw Error('Please turn off remaining device reminders in browser settings.');error('');toggle.disabled=false;return;}}catch(e){toggle.checked=true;error(e.message);toggle.disabled=false;return;}
try{if(!('serviceWorker' in navigator)||!('PushManager' in window)||!('Notification' in window))throw Error('Push isn’t available here. On iPhone, add Life to your Home Screen and open it there.');const config=await request('push.status');if(!config.ready)throw Error('Push delivery is awaiting server setup. In-app reminders remain available.');if(await Notification.requestPermission()!=='granted')throw Error('Notifications were not enabled. You can change this in browser settings.');const existing=(await lifePushSubscriptions())[0];const registration=existing?.registration||await ensureLifeRegistration();if(!registration)throw Error('Life installation is unavailable in this browser.');const key=Uint8Array.from(atob(config.publicKey.replaceAll('-','+').replaceAll('_','/')),c=>c.charCodeAt(0));const subscription=existing?.subscription||await registration.pushManager.getSubscription()||await registration.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:key});await request('push.subscribe',subscription.toJSON());toggle.checked=true;error('');}catch(e){toggle.checked=false;error(e.message);}finally{toggle.disabled=false;}};
 return {refresh(value){session=value;syncGoogle();googleActions.hidden=!value.googleReady;authForm.hidden=!ownerRecovery;settingsButton.hidden=!value.authenticated||!value.account;document.documentElement.dataset.timezone=value.account?.timezone||'Africa/Lagos';}};
}

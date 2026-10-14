/** Installation is optional. Only public offline assets are stored by the worker. */
const workerURL='/life/pwa-worker.php?v=1';
let registrationPromise;
export function ensureLifeRegistration(){
 if(!('serviceWorker' in navigator)||!window.isSecureContext)return Promise.resolve(null);
 return registrationPromise??=(navigator.serviceWorker.register(workerURL,{scope:'/',updateViaCache:'none'}).then(async registration=>{if(registration.active)return registration;const worker=registration.installing||registration.waiting;if(!worker)throw Error('Ramble worker is not active');await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('Ramble worker activation timed out')),15000);const changed=()=>{if(worker.state==='activated'){clearTimeout(timer);resolve();}else if(worker.state==='redundant'){clearTimeout(timer);reject(Error('Ramble worker installation failed'));}};worker.addEventListener('statechange',changed);changed();});return registration;}).catch(error=>{registrationPromise=null;throw error;}));
}
export async function lifePushSubscriptions(){
 if(!('serviceWorker' in navigator))return [];
 const registrations=await navigator.serviceWorker.getRegistrations(),out=[];
 for(const registration of registrations){const script=(registration.active||registration.waiting||registration.installing)?.scriptURL;if(!script)continue;const source=new URL(script);if(source.origin!==location.origin||!['/life/reminder-sw.js','/life/pwa-worker.php'].includes(source.pathname))continue;const subscription=await registration.pushManager?.getSubscription();if(subscription)out.push({registration,subscription});}
 return out.sort((a,b)=>a.registration.scope===location.origin+'/'?-1:b.registration.scope===location.origin+'/'?1:0);
}
export async function removeLifeSubscriptions(request){
 let removed=true;
 for(const {subscription} of await lifePushSubscriptions()){
  // Always revoke browser delivery, even if the account API is temporarily unreachable.
  let timer;try{await Promise.race([request('push.unsubscribe',{endpoint:subscription.endpoint}),new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('Unsubscribe timeout')),3000);})]);}catch{}finally{clearTimeout(timer);}
  try{if(!await subscription.unsubscribe())removed=false;}catch{removed=false;}
 }
 return removed;
}
export function installationInstructions(userAgent=navigator.userAgent){
 const ios=/iPad|iPhone|iPod/.test(userAgent)||(/Macintosh/.test(userAgent)&&navigator.maxTouchPoints>1);
 return ios?['Open Ramble in Safari.','Tap Share, then Add to Home Screen.','Keep Open as Web App enabled if shown, then tap Add.']:['Open the browser menu.','Choose Install Ramble or Install app.','If that option is unavailable, try Chrome on Android or Safari on iPhone.'];
}
export function installPWA({isBusy=()=>false}={}){
 let installEvent,waiting,updating=false,reloadRequested=false;
 const installed=()=>window.matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
 const icon='<img class="nav-icon" src="/life/icons/install.svg" alt="">';
 const buttons=[];
 const sidebar=document.createElement('button');sidebar.type='button';sidebar.className='pwa-install-trigger';sidebar.innerHTML=icon+'<span class="nav-label">Install Ramble</span>';document.querySelector('#logout')?.before(sidebar);buttons.push(sidebar);
 const auth=document.createElement('button');auth.type='button';auth.className='pwa-install-link';auth.textContent='Install Ramble';document.querySelector('#auth-mode-switch')?.after(auth);buttons.push(auth);
 const dialog=document.createElement('dialog');dialog.id='life-install-dialog';dialog.setAttribute('aria-labelledby','life-install-title');dialog.innerHTML='<div class="dialog-heading"><h2 id="life-install-title">Ramble on your phone</h2><button type="button" aria-label="Close install instructions">×</button></div><p>Open Ramble from your Home Screen, in its own app window.</p><ol></ol><p class="fine-print">An internet connection is needed for your planner and AI.</p>';document.body.append(dialog);dialog.querySelector('[aria-label]').onclick=()=>dialog.close();
 const showInstructions=()=>{const list=dialog.querySelector('ol');list.replaceChildren();for(const instruction of installationInstructions()){const item=document.createElement('li');item.textContent=instruction;list.append(item);}dialog.showModal();};
 const refresh=()=>{for(const button of buttons)button.hidden=installed();};refresh();
 for(const button of buttons)button.onclick=async()=>{if(installed())return;if(!installEvent){showInstructions();return;}const event=installEvent;installEvent=null;try{await event.prompt();await event.userChoice;}catch{showInstructions();}refresh();};
 window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();installEvent=event;refresh();});
 window.addEventListener('appinstalled',()=>{installEvent=null;for(const button of buttons)button.hidden=true;if(dialog.open)dialog.close();});
 window.matchMedia('(display-mode: standalone)').addEventListener?.('change',refresh);
 const banner=document.createElement('aside');banner.id='life-update';banner.hidden=true;banner.setAttribute('role','status');banner.innerHTML='<div><strong>Update ready</strong><p>Use the latest version of Ramble.</p></div><button type="button">Update Ramble</button>';document.body.append(banner);
 // These snapshots are transient memory only; passwords are reduced to presence, never copied.
 const snapshots=new Map(),dirty=new Set();
 const values=form=>JSON.stringify([...form.querySelectorAll('input,textarea,select,[contenteditable=true]')].map(field=>field.type==='password'?Boolean(field.value):field.isContentEditable?field.textContent:field.type==='checkbox'||field.type==='radio'?field.checked:field.value));
 document.addEventListener('focusin',event=>{const form=event.target.closest?.('form');if(form&&!snapshots.has(form))snapshots.set(form,values(form));});
 document.addEventListener('input',event=>{const form=event.target.closest?.('form');if(form)dirty.add(form);});
 const busy=()=>{if(isBusy()||document.querySelector('dialog[open]:not(#life-install-dialog),[aria-busy=true],[data-dirty=true]'))return true;for(const form of dirty){if(!form.isConnected){dirty.delete(form);snapshots.delete(form);continue;}if(form.getClientRects().length&&(!snapshots.has(form)||values(form)!==snapshots.get(form)))return true;}return false;};
 const showUpdate=registration=>{if(!registration.waiting||!navigator.serviceWorker.controller)return;waiting=registration.waiting;banner.hidden=false;};
 banner.querySelector('button').onclick=()=>{if(!waiting||updating)return;if(busy()){banner.querySelector('p').textContent='Finish your call, or save and close your form, then update.';return;}updating=true;reloadRequested=true;banner.querySelector('button').disabled=true;banner.querySelector('p').textContent='Updating Ramble…';waiting.postMessage({type:'LIFE_ACTIVATE_UPDATE'});};
 navigator.serviceWorker?.addEventListener('controllerchange',()=>{if(!reloadRequested)return;if(busy()){reloadRequested=false;updating=false;banner.querySelector('button').disabled=false;banner.querySelector('button').textContent='Reload Ramble';banner.querySelector('button').onclick=()=>{if(!busy())location.reload();else banner.querySelector('p').textContent='Finish your call, or save and close your form, then reload.';};return;}location.reload();});
 const observed=new WeakSet();const observe=registration=>{if(!registration||observed.has(registration))return;observed.add(registration);showUpdate(registration);registration.addEventListener('updatefound',()=>{const next=registration.installing;next?.addEventListener('statechange',()=>{if(next.state==='installed')showUpdate(registration);});});};
 ensureLifeRegistration().then(observe).catch(()=>{console.warn('Ramble installation worker could not register.');});
 window.addEventListener('online',()=>ensureLifeRegistration().then(reg=>{observe(reg);return reg?.update();}).catch(()=>{}));
 return {showInstructions,busy};
}

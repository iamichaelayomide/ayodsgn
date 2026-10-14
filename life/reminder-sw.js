// This cache contains PUBLIC assets only. Never cache pages, API responses or planner content.
const PUBLIC_CACHE='life-public-pwa-v3';
const OFFLINE='/life/offline.html';
const ASSETS=new Map([['/life/offline.html','text/html'],['/life/offline.css','text/css'],['/life/pwa-icons/life-192.png','image/png'],['/life/pwa-icons/life-512.png','image/png'],['/life/pwa-icons/life-maskable-512.png','image/png'],['/life/pwa-icons/apple-touch-icon.png','image/png']]);
const ROOT=new URL(self.registration.scope).pathname==='/';
self.addEventListener('install',event=>{if(!ROOT)return;event.waitUntil((async()=>{const cache=await caches.open(PUBLIC_CACHE);for(const [path,mime] of ASSETS){const response=await fetch(path,{cache:'reload',credentials:'omit'});if(!response.ok||response.redirected||new URL(response.url).pathname!==path||!response.headers.get('content-type')?.includes(mime)||/private|no-store/i.test(response.headers.get('cache-control')||''))throw Error('Public offline asset unavailable');await cache.put(path,response);}if(!self.registration.active)await self.skipWaiting();})());});
self.addEventListener('activate',event=>{if(!ROOT)return;event.waitUntil((async()=>{for(const key of await caches.keys())if(key.startsWith('life-public-pwa-')&&key!==PUBLIC_CACHE)await caches.delete(key);await self.clients.claim();})());});
self.addEventListener('message',event=>{if(ROOT&&event.data?.type==='LIFE_ACTIVATE_UPDATE')event.waitUntil(self.skipWaiting());});
self.addEventListener('fetch',event=>{
 const request=event.request,url=new URL(request.url);
 if(!ROOT||request.method!=='GET'||url.origin!==self.location.origin||url.pathname.startsWith('/api/')||request.headers.has('range'))return;
 if(request.mode==='navigate'){event.respondWith(fetch(request,{cache:'no-store'}).catch(async()=>{const cache=await caches.open(PUBLIC_CACHE);return await cache.match(OFFLINE)||new Response('Ramble needs an internet connection.',{status:503,headers:{'Content-Type':'text/plain','Cache-Control':'no-store'}});}));return;}
 if(!ASSETS.has(url.pathname)||url.search)return;
 event.respondWith((async()=>{const cache=await caches.open(PUBLIC_CACHE);return await cache.match(url.pathname)||fetch(request);})());
});
self.addEventListener('push',event=>{let payload;try{payload=event.data.json();}catch{return;}event.waitUntil(self.registration.showNotification(payload.title||'Life reminder',{body:payload.body||'A task is due.',tag:payload.tag,icon:new URL('/life/pwa-icons/life-192.png',self.location).href,data:{taskId:payload.taskId},requireInteraction:false}));});
self.addEventListener('notificationclick',event=>{event.notification.close();const url=new URL('/',self.location);const id=event.notification.data?.taskId;if(typeof id==='string'&&/^[a-f0-9]{32}$/.test(id))url.hash='task='+id;event.waitUntil(self.clients.matchAll({type:'window',includeUncontrolled:true}).then(async windows=>{const app=windows.find(window=>{const current=new URL(window.url);return current.origin===url.origin&&['/','/life/','/life/index.php'].includes(current.pathname);});if(app){await app.navigate(url.href);return app.focus();}return self.clients.openWindow(url.href);}));});

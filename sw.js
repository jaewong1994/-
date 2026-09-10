const CACHE_NAME='epsilon-app-v70';
const APP_SHELL=['./','./index.html','./mobile-ui.css','./counseling.css','./counseling-engine.js','./counseling.js','./manifest.webmanifest','./offline.html','./icons/app-icon-192.png','./icons/app-icon-512.png','./icons/app-icon-maskable-512.png'];

self.addEventListener('install',event=>{
  APP_SHELL.push('./app-session.js');
  event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(APP_SHELL)).then(()=>self.skipWaiting()));
});

self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE_NAME).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));
});

self.addEventListener('fetch',event=>{
  const request=event.request;
  if(request.method!=='GET')return;
  const url=new URL(request.url);
  if(url.origin!==self.location.origin)return;

  event.respondWith(fetch(request).then(response=>{
    if(response&&response.ok){
      const copy=response.clone();
      caches.open(CACHE_NAME).then(cache=>{
        cache.put(request,copy);
        if(request.mode==='navigate') cache.put('./index.html',response.clone());
      });
    }
    return response;
  }).catch(()=>caches.match(request).then(cached=>cached||caches.match('./index.html').then(page=>page||caches.match('./offline.html')))));
});

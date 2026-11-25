self.addEventListener('install',event=>event.waitUntil(self.skipWaiting()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{
  for(const key of await caches.keys())if(key.startsWith('student-mvp-shell-'))await caches.delete(key);
  await self.clients.claim();
})()));

const CACHE='canvasnote-public-0.1.0';
const ROOT=new URL('./',self.location).href;
const SHELL=['./','./manifest.webmanifest','./icon-192.png','./icon-512.png'].map(path=>new URL(path,self.location).href);
self.addEventListener('install',event=>{event.waitUntil((async()=>{const cache=await caches.open(CACHE);await cache.addAll(SHELL.filter(url=>url!==ROOT));const response=await fetch(ROOT,{cache:'reload'}),text=await response.clone().text();if(!response.ok||response.redirected||!text.includes('CanvasNote')||!text.includes('id="root"'))throw Error('应用尚未缓存');await cache.put(ROOT,response);})());});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('canvasnote-')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',event=>{
  const request=event.request,url=new URL(request.url);
  if(request.method!=='GET'||url.origin!==self.location.origin)return;
  if(request.mode==='navigate'){
    event.respondWith(fetch(request).then(response=>{
      // Cache only the application, never a redirected sign-in page.
      if(response.ok&&!response.redirected&&response.headers.get('content-type')?.includes('text/html'))event.waitUntil(response.clone().text().then(text=>{if(text.includes('CanvasNote')&&text.includes('id="root"'))return caches.open(CACHE).then(cache=>cache.put(ROOT,new Response(text,{headers:response.headers})));}));
      return response;
    }).catch(async()=>{const cached=await caches.match(ROOT);return cached||new Response('请联网后首次打开 CanvasNote。',{status:503,headers:{'Content-Type':'text/plain;charset=UTF-8'}});}));
  }else if(SHELL.includes(url.href)){
    event.respondWith(caches.match(request).then(cached=>cached||fetch(request)));
  }
});

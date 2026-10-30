/* Build substitutes the version and public asset allowlist. */
const VERSION="c1723763a489d300";
const ASSETS=["app-session.js","counseling-engine.js","counseling.css","counseling.js","icons/app-icon-192.png","icons/app-icon-512.png","icons/app-icon-maskable-512.png","icons/app-icon.svg","index.html","learning/assets/AccessGate-iZ7F1I7U.js","learning/assets/AuthorHomeworkPage-Di0EwSKb.js","learning/assets/CommunityPage-vGumNyLr.js","learning/assets/Feedback-BNFHNix2.js","learning/assets/InkLabPage-BiO87CLK.css","learning/assets/InkLabPage-DjxULSId.js","learning/assets/KaTeX_AMS-Regular-BQhdFMY1.woff2","learning/assets/KaTeX_AMS-Regular-DMm9YOAa.woff","learning/assets/KaTeX_AMS-Regular-DRggAlZN.ttf","learning/assets/KaTeX_Caligraphic-Bold-ATXxdsX0.ttf","learning/assets/KaTeX_Caligraphic-Bold-BEiXGLvX.woff","learning/assets/KaTeX_Caligraphic-Bold-Dq_IR9rO.woff2","learning/assets/KaTeX_Caligraphic-Regular-CTRA-rTL.woff","learning/assets/KaTeX_Caligraphic-Regular-Di6jR-x-.woff2","learning/assets/KaTeX_Caligraphic-Regular-wX97UBjC.ttf","learning/assets/KaTeX_Fraktur-Bold-BdnERNNW.ttf","learning/assets/KaTeX_Fraktur-Bold-BsDP51OF.woff","learning/assets/KaTeX_Fraktur-Bold-CL6g_b3V.woff2","learning/assets/KaTeX_Fraktur-Regular-CB_wures.ttf","learning/assets/KaTeX_Fraktur-Regular-CTYiF6lA.woff2","learning/assets/KaTeX_Fraktur-Regular-Dxdc4cR9.woff","learning/assets/KaTeX_Main-Bold-Cx986IdX.woff2","learning/assets/KaTeX_Main-Bold-Jm3AIy58.woff","learning/assets/KaTeX_Main-Bold-waoOVXN0.ttf","learning/assets/KaTeX_Main-BoldItalic-DxDJ3AOS.woff2","learning/assets/KaTeX_Main-BoldItalic-DzxPMmG6.ttf","learning/assets/KaTeX_Main-BoldItalic-SpSLRI95.woff","learning/assets/KaTeX_Main-Italic-3WenGoN9.ttf","learning/assets/KaTeX_Main-Italic-BMLOBm91.woff","learning/assets/KaTeX_Main-Italic-NWA7e6Wa.woff2","learning/assets/KaTeX_Main-Regular-B22Nviop.woff2","learning/assets/KaTeX_Main-Regular-Dr94JaBh.woff","learning/assets/KaTeX_Main-Regular-ypZvNtVU.ttf","learning/assets/KaTeX_Math-BoldItalic-B3XSjfu4.ttf","learning/assets/KaTeX_Math-BoldItalic-CZnvNsCZ.woff2","learning/assets/KaTeX_Math-BoldItalic-iY-2wyZ7.woff","learning/assets/KaTeX_Math-Italic-DA0__PXp.woff","learning/assets/KaTeX_Math-Italic-flOr_0UB.ttf","learning/assets/KaTeX_Math-Italic-t53AETM-.woff2","learning/assets/KaTeX_SansSerif-Bold-CFMepnvq.ttf","learning/assets/KaTeX_SansSerif-Bold-D1sUS0GD.woff2","learning/assets/KaTeX_SansSerif-Bold-DbIhKOiC.woff","learning/assets/KaTeX_SansSerif-Italic-C3H0VqGB.woff2","learning/assets/KaTeX_SansSerif-Italic-DN2j7dab.woff","learning/assets/KaTeX_SansSerif-Italic-YYjJ1zSn.ttf","learning/assets/KaTeX_SansSerif-Regular-BNo7hRIc.ttf","learning/assets/KaTeX_SansSerif-Regular-CS6fqUqJ.woff","learning/assets/KaTeX_SansSerif-Regular-DDBCnlJ7.woff2","learning/assets/KaTeX_Script-Regular-C5JkGWo-.ttf","learning/assets/KaTeX_Script-Regular-D3wIWfF6.woff2","learning/assets/KaTeX_Script-Regular-D5yQViql.woff","learning/assets/KaTeX_Size1-Regular-C195tn64.woff","learning/assets/KaTeX_Size1-Regular-Dbsnue_I.ttf","learning/assets/KaTeX_Size1-Regular-mCD8mA8B.woff2","learning/assets/KaTeX_Size2-Regular-B7gKUWhC.ttf","learning/assets/KaTeX_Size2-Regular-Dy4dx90m.woff2","learning/assets/KaTeX_Size2-Regular-oD1tc_U0.woff","learning/assets/KaTeX_Size3-Regular-CTq5MqoE.woff","learning/assets/KaTeX_Size3-Regular-DgpXs0kz.ttf","learning/assets/KaTeX_Size4-Regular-BF-4gkZK.woff","learning/assets/KaTeX_Size4-Regular-DWFBv043.ttf","learning/assets/KaTeX_Size4-Regular-Dl5lxZxV.woff2","learning/assets/KaTeX_Typewriter-Regular-C0xS9mPB.woff","learning/assets/KaTeX_Typewriter-Regular-CO6r4hn1.woff2","learning/assets/KaTeX_Typewriter-Regular-D3Ib7_Hf.ttf","learning/assets/LecturesPage-dk8k5JVy.js","learning/assets/LoginPage-BV4dFQPt.js","learning/assets/SolvePage-9Ok-4z58.js","learning/assets/SolvePage-R-h_wNmv.css","learning/assets/StudentHomePage-DUMglHmG.js","learning/assets/TeacherHomePage-CSHM4XIY.js","learning/assets/WatchPage-DCMnQkUS.js","learning/assets/authoring-CoUNDwSh.js","learning/assets/body-I5ihPDjW.js","learning/assets/deviceStore-DnbChrKN.js","learning/assets/index-Cmam9vln.js","learning/assets/index-DnEngvWa.css","learning/assets/math-BvXWHf-j.js","learning/assets/pendingRpc-D7NXRqew.js","learning/assets/react-CcH0kkjW.js","learning/assets/service-CWz5B_qq.js","learning/assets/service-CqcczoOD.js","learning/assets/service-DzLulHHH.js","learning/assets/supabase-l0sNRNKZ.js","learning/index.html","manifest.webmanifest","mobile-ui.css","offline.html","src/core/access.js","src/core/auth.js","src/core/backend.js","src/core/compatibility-client.js","src/core/config.js","src/core/learning-bridge.js","src/core/operational-gate.js","src/core/operational-views.js","src/core/pwa.js","src/core/runtime-bootstrap.js","src/core/runtime-config.js","src/core/server-auth.js","src/core/session-provider.js","src/core/student-test-results.js","src/legacy/accounts.js","src/legacy/admissions-data.js","src/legacy/collection.js","src/legacy/dashboard.js","src/legacy/early-admissions-data.js","src/legacy/early-admissions.js","src/legacy/exams-editor.js","src/legacy/exams-session.js","src/legacy/exams-staff.js","src/legacy/exams-submit.js","src/legacy/materials.js","src/legacy/mobile-shell.js","src/legacy/mock-analysis.js","src/legacy/navigation.js","src/legacy/omr.js","src/legacy/photocards.js","src/legacy/scores.js","src/legacy/strategy.js","src/legacy/student-report.js","src/styles/accounts.css","src/styles/legacy-0.css","src/styles/review.css","src/styles/student-test-results.css","vendor/chart.umd.js","vendor/supabase.js"];
const PREFIX='student-mvp-shell-',CACHE=PREFIX+VERSION,ROOT=new URL('./',self.location.href);
const allowed=new Set(ASSETS.filter(p=>!/(?:^|\/)(?:auth-runtime\.json|.*\.env)$/.test(p)).map(p=>new URL(p,ROOT).href));
function cacheKey(request){
 if(request.method!=='GET'||request.headers.has('authorization'))return null;
 const url=new URL(request.url);if(url.origin!==ROOT.origin||url.pathname.endsWith('/auth-runtime.json'))return null;
 if(request.mode==='navigate'){
  if(!url.pathname.startsWith(ROOT.pathname))return null;
  const relative=url.pathname.slice(ROOT.pathname.length);
  if(relative===''||relative==='index.html')return new URL('index.html',ROOT).href;
  if(relative==='learning/'||relative==='learning/index.html')return new URL('learning/index.html',ROOT).href;
 }
 if(url.search){
  const canonical=new URL(url.href);canonical.search='';
  return [...url.searchParams.keys()].length===1&&/^[0-9a-f]{16}$/.test(url.searchParams.get('release-build')||'')&&/\.(js|css)$/.test(url.pathname)&&allowed.has(canonical.href)?url.href:null;
 }
 return allowed.has(url.href)?url.href:null;
}
self.addEventListener('install',event=>{
 // Wait for user opt-in rather than interrupting an active lesson.
 event.waitUntil((async()=>{
  const cache=await caches.open(CACHE);await cache.addAll([...allowed]);
  const index=await cache.match(new URL('index.html',ROOT).href);if(!index)return;
  const html=await index.text(),aliases=new Set();
  for(const match of html.matchAll(/\b(?:src|href)="(\.\/[^"\s]+\?release-build=[0-9a-f]{16})"/g)){
   const url=new URL(match[1],ROOT),key=cacheKey({url:url.href,method:'GET',headers:{has:()=>false}});if(key)aliases.add(key);
  }
  if(aliases.size)await cache.addAll([...aliases]);
 })());
});
self.addEventListener('message',event=>{
 if(event.data?.type==='APPLY_UPDATE')event.waitUntil(self.skipWaiting());
});
self.addEventListener('activate',event=>{
 event.waitUntil((async()=>{
  const old=(await caches.keys()).filter(k=>k.startsWith(PREFIX)&&k!==CACHE);
  await Promise.all(old.slice(0,Math.max(0,old.length-2)).map(k=>caches.delete(k)));
  await self.clients.claim();
 })());
});
self.addEventListener('fetch',event=>{
 let key=cacheKey(event.request);
 // A still-open tab may request its previous hashed Vite chunk after an update.
 // These responses can only come from our earlier build caches; they are never written at runtime.
 if(!key){
  const url=new URL(event.request.url),prefix=new URL('learning/assets/',ROOT).href;
  if(event.request.method!=='GET'||event.request.headers.has('authorization')||url.search||!url.href.startsWith(prefix)||!/[.](?:js|css|woff2?|ttf|png|svg)$/.test(url.pathname))return;
  key=url.href;
 }
 event.respondWith((async()=>{
  const cached=await (await caches.open(CACHE)).match(key);if(cached)return cached;
  for(const name of (await caches.keys()).filter(k=>k.startsWith(PREFIX)&&k!==CACHE)){
   const prior=await (await caches.open(name)).match(key);if(prior)return prior;
  }
  return fetch(event.request);
 })());
});

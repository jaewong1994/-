const {chromium}=require('playwright');
const path=require('path'),assert=require('assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'msedge'});
 for(const role of ['student','teacher','director']){
  const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.setContent(`<body class="auth-pending"><section id="auth-gate"><p id="auth-status"></p><form id="auth-form"><input id="auth-email"><input id="auth-password"><button>로그인</button></form><button id="auth-retry"></button></section><div class="cat" data-cat="counsel"></div><div class="cat" data-cat="admin"></div><div id="uni-content"></div>`);
  await page.evaluate(role=>{
   window._wuser=null;window._wprofile=null;window.scores=[];window.testSession=null;window.currentPage=null;
   window.sbReady=()=>({auth:{getSession:async()=>({data:{session:window.testSession}}),onAuthStateChange:f=>{window.authEvent=f;},signInWithPassword:async()=>({data:{session:{user:{id:'a'}}}}),signOut:async()=>({})},from:()=>({select(){return this},eq(){return this},maybeSingle:async()=>({data:{id:'a',name:'테스트',role}})})});
   window.loadMyMockScores=async()=>{};window.showCat=p=>{window.currentPage=p;};
  },role);
  await page.addScriptTag({path:path.join(__dirname,'../app-session.js')});
  await page.waitForFunction(()=>!document.getElementById('auth-form').hidden);
  assert.equal(await page.evaluate(()=>AppSession.canOpen('ipsi')),false);
  await page.locator('#auth-form button').click();
  await page.waitForFunction(()=>document.getElementById('auth-gate').hidden);
  assert.equal(await page.evaluate(()=>AppSession.canOpen('counsel')),role!=='student');
  assert.equal(await page.evaluate(()=>AppSession.canOpen('admin')),role==='director');
  assert.equal(await page.evaluate(()=>currentPage),role==='student'?'ipsi':'counsel');
  await page.evaluate(()=>wLogout());
  assert.equal(await page.evaluate(()=>AppSession.canOpen('ipsi')),false);
  assert.equal(await page.evaluate(()=>_wuser),null);
  assert.deepEqual(errors,[]);await page.close();
 }
 await browser.close();console.log('Session UI OK: student/teacher/director, initial gate, menu permissions, logout');
})().catch(e=>{console.error(e);process.exit(1);});

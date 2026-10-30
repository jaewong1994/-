window.MvpAppReady=window.MvpProviderReady.then(()=>{
(function(){
'use strict';
let ready=false, paused=false, activeId=null;
const provider=window.MvpSessionProvider;
const compatible=provider.operations==='legacy-compatible-v1';
const gate=document.getElementById('auth-gate'), status=document.getElementById('auth-status');
function serverPage(page){return ['learning','wtest'].includes(page)||_wprofile?.role!=='student'&&['counsel','exam-counsel'].includes(page);}
function menus(){
 document.querySelectorAll('[data-cat],[data-mobile-cat],[data-session-menu]').forEach(el=>{
  const page=el.dataset.cat||el.dataset.mobileCat||el.dataset.sessionMenu;
  const allowed=ready&&(provider.mode==='demo'||compatible?(page==='more'||MvpAccess.canOpen(_wprofile?.role,page)):provider.mode==='server'&&(page==='more'||serverPage(page)));
  el.hidden=!allowed;el.style.display=allowed?'':'none';
 });
}
function clear(){
 document.querySelectorAll('input[type="password"]').forEach(input=>{input.value='';});
 ready=false;paused=false;activeId=null;_wuser=null;_wprofile=null;scores=[];menus();
 document.getElementById('review-account-name')?.replaceChildren();
 document.body.classList.add('auth-pending');gate.hidden=false;document.getElementById('review-signin')&&(document.getElementById('review-signin').hidden=provider.mode==='blocked');
 document.querySelectorAll('.page.on').forEach(x=>x.classList.remove('on'));
 document.querySelectorAll('.page [id$="-content"],#wtest-content-admin').forEach(x=>x.replaceChildren());
 document.querySelectorAll('#pg-input input').forEach(x=>{x.value='';});
 document.querySelectorAll('#pg-learning iframe').forEach(x=>x.remove());
 if(typeof vwCacheClear==='function')vwCacheClear();
 clearTimeout(window._pcDecoT);clearTimeout(window._st);clearTimeout(_susiGradeTimer);
 // Helpers such as _ekPad share these legacy prefixes with account data.
 // Keep executable helpers; clear only the prior account's values and drafts.
 for(const key of Object.keys(window).filter(k=>/^_(?:rep|pc|ek|wrongMatrix|assignSet|myCol|mockWrongItems)/.test(k)&&typeof window[k]!=='function'))window[key]=null;
 for(const key of ['_wAnswers','_wTypes','_wTestId','_wTotal','_ntAnswers','_ntTypes','_ntLevels','_editAns'])window[key]=null;
 _vwPaths={};_vw={groups:[],mats:[],classes:[],gc:[]};_vwAdmin=false;_vwEdit=null;_vwAddTo=null;_vwBusy=false;
 document.querySelectorAll('#pc-viewer,#pc-reveal,#vw-overlay,#pc-pos-overlay').forEach(x=>x.remove());
 if(typeof applyPhotoBg==='function')applyPhotoBg();
 for(const chart of [tChart,pChart,reportChart])chart?.destroy();tChart=pChart=reportChart=null;
 window.dispatchEvent(new Event('mvp-session-reset'));
}
window.AppSession={canOpen:page=>ready&&!paused&&(provider.mode==='demo'||compatible?MvpAccess.canOpen(_wprofile?.role,page):provider.mode==='server'&&serverPage(page)),can:action=>ready&&!paused&&(provider.mode==='demo'||compatible?MvpAccess.can(_wprofile?.role,action):provider.mode==='server'&&_wprofile?.role!=='student'&&['read-tests','read-counsel'].includes(action)),context:()=>ready&&!paused?Object.freeze({id:activeId,role:_wprofile.role,classId:_wprofile.class_id,displayName:typeof _wprofile.name==='string'?_wprofile.name.trim().slice(0,120):null,mode:provider.mode,operations:provider.operations||null,epoch:SessionGuard.capture()}):null};
async function restore(session,epoch){
 clear();status.textContent=session?'계정 권한을 확인하고 있습니다.':provider.mode==='server'?'기존 학생관리 계정으로 로그인해 주세요.':'로컬 체험용 로그인입니다. 실제 계정이나 비밀번호를 입력하지 마세요.';
 if(!session)return;
 try{
  const {data:profile,error}=provider.mode==='server'?{data:provider.profile(),error:null}:await SessionGuard.wait(sbReady().from('profiles').select('id,name,role,class_id,teacher_id,student_no').eq('id',session.user.id).maybeSingle(),epoch);
  if(error||!profile||!MvpAccess.pages[profile.role])throw Error('권한 없음');
  _wuser=session.user;_wprofile=profile;activeId=profile.id;
  if(provider.mode==='demo'&&profile.role==='student')await SessionGuard.wait(loadMyMockScores(),epoch);
  SessionGuard.assert(epoch);ready=true;menus();gate.hidden=true;document.body.classList.remove('auth-pending');
  if(compatible){
   const own=await SessionGuard.wait(sbReady().from('profiles').select('id,name,nickname,student_no,role,class_id,teacher_id,pw_changed').eq('id',activeId).maybeSingle(),epoch);
   if(!own.error&&own.data&&own.data.id===activeId&&own.data.role===profile.role)_wprofile={...profile,...own.data};
   if(profile.role==='student')await SessionGuard.wait(loadMyMockScores(),epoch);
  }
  document.getElementById('review-account-name').textContent=profile.name+' · '+({student:'학생',teacher:'강사',director:'원장'}[profile.role]);
  const resumed=await window.MvpViewMemory?.restore();SessionGuard.assert(epoch);
  if(provider.mode==='server'){document.getElementById('review-signin').hidden=true;status.textContent='계정과 권한을 확인했습니다. 학습 자료는 이 계정의 기기 공간에 저장됩니다.';if(!resumed)showCat('learning');}else if(!resumed)showCat(profile.role==='student'?'wtest':'counsel');
 }catch(e){if(e.name==='StaleSession')return;clear();status.textContent='계정 정보를 확인하지 못했습니다. 다시 로그인해 주세요.';}
}
const scope=profile=>JSON.stringify([profile?.id,profile?.role,profile?.class_id??null,profile?.teacher_id??null]);
function handle(event,session){
 if(provider.mode==='blocked'){clear();return;}
 if(event==='SESSION_CHECKING'){
  if(ready&&activeId){if(!paused)window.MvpViewMemory?.pause();paused=true;document.body.classList.add('auth-pending');gate.hidden=false;document.getElementById('review-signin').hidden=true;status.textContent='계정 연결을 다시 확인하고 있습니다. 잠시 후 보던 화면으로 돌아갑니다.';}
  return;
 }
 const profile=provider.mode==='server'?provider.profile():null;
 if(event==='SIGNED_IN'&&session?.user?.id===activeId&&ready&&profile&&scope(profile)===scope(_wprofile)&&document.querySelector('.page.on')){
  _wprofile={..._wprofile,...profile};paused=false;gate.hidden=true;document.body.classList.remove('auth-pending');window.MvpViewMemory?.resume();
  document.getElementById('review-account-name').textContent=profile.name+' · '+({student:'학생',teacher:'강사',director:'원장'}[profile.role]);return;
 }
 if(event==='SIGNED_OUT'||activeId&&session?.user?.id!==activeId||profile&&activeId&&scope(profile)!==scope(_wprofile))window.MvpViewMemory?.forget();
 const epoch=SessionGuard.bump();clear();void restore(session,epoch);
}
window.wLogout=async()=>{window.MvpViewMemory?.forget();SessionGuard.bump();clear();const result=await sbReady().auth.signOut();if(result.error)status.textContent='로그아웃 확인에 실패했습니다. 화면은 잠겼으며 자동 로그인 복원을 차단했습니다.';};
document.getElementById('auth-form').remove();document.getElementById('auth-retry').remove();
const form=document.createElement('form');form.id='review-signin';form.innerHTML='<label for="review-account">체험 계정 ID</label><input id="review-account" name="username" autocomplete="username" autocapitalize="none" spellcheck="false" required maxlength="80"><button type="submit">로그인</button><p>체험 ID: demo-student (학생), demo-teacher (강사), demo-director (원장)</p><p>기존 운영 계정 로그인은 연결 준비 중입니다. 현재는 위 체험 ID만 사용할 수 있습니다.</p><p>이 기기에서 30일간 로그인을 유지합니다. 공용 기기에서는 사용 후 로그아웃하세요.</p>';if(provider.mode==='server')form.innerHTML='<label for="server-email">이메일</label><input id="server-email" name="username" type="email" autocomplete="username" required><label for="server-password">비밀번호</label><input id="server-password" name="password" type="password" autocomplete="current-password" required><button type="submit">로그인</button>';
gate.querySelector('.auth-card').append(form);
const bar=document.createElement('div');bar.className='review-bar';bar.innerHTML='<strong>학생관리 MVP · 로컬 검토</strong><span id="review-account-name"></span><button id="review-switch" type="button">계정 전환</button><button id="review-logout" type="button">로그아웃</button>';document.body.prepend(bar);
if(compatible)bar.querySelector('strong').textContent='입실론 학생관리 · 기존 데이터 연결';
form.addEventListener('submit',async event=>{event.preventDefault();const button=form.querySelector('button');if(button.disabled)return;button.disabled=true;status.textContent='계정 권한을 확인하고 있습니다.';try{const input=provider.mode==='server'?{email:document.getElementById('server-email').value,password:document.getElementById('server-password').value}:{accountId:document.getElementById('review-account').value};const result=await provider.signIn(input);if(result.error)status.textContent=result.error.message;else if(result.persisted===false)showToast('이 브라우저에서는 로그인 유지가 불가능합니다. 현재 화면에서만 로그인됩니다.');}catch{status.textContent='로그인 연결을 확인해 주세요.';}finally{form.querySelector('input[type=password]')&&(form.querySelector('input[type=password]').value='');button.disabled=false;}});
document.getElementById('review-logout').onclick=document.getElementById('review-switch').onclick=async()=>{await wLogout();form.reset();form.querySelector('input').focus();};
const sheet=document.querySelector('#mobile-more-sheet .app-sheet-grid');
for(const [page,label]of [['learning','학습'],['counsel','입시상담'],['exam-counsel','테스트 상담'],['admin','계정 관리']]){const b=document.createElement('button');b.type='button';b.dataset.sessionMenu=page;b.textContent=label;b.onclick=()=>{closeMobileMore();showCat(page);};sheet.append(b);}
document.querySelectorAll('[onclick*="mobileNavigate"]').forEach(el=>{const match=el.getAttribute('onclick').match(/mobileNavigate\('([^']+)'\)/);if(match)el.dataset.sessionMenu=match[1];});
document.querySelectorAll('.cat').forEach(el=>{el.role='button';el.tabIndex=0;el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();el.click();}});});
window.addEventListener('unhandledrejection',e=>{
 e.preventDefault();if(e.reason?.name==='StaleSession')return;
 // Report only a bounded error category and our source filename/line. Never
 // expose an exception message, URL/query, account data or the full stack.
 const kind=['TypeError','ReferenceError','RangeError','SyntaxError'].includes(e.reason?.name)?e.reason.name:'Error';
 const source=typeof e.reason?.stack==='string'?e.reason.stack.match(/(app-session\.js|exams-staff\.js|navigation\.js|backend\.js|session-provider\.js|student-test-results\.js)(?:\?[^:\s]*)?:(\d+):\d+/):null;
 const code='APP-R3-'+kind+(source?'-'+source[1]+':'+source[2]:'');
 showToast('처리하지 못했습니다. '+code+' · 이 오류 코드를 알려 주세요.');
});
if(provider.mode!=='blocked')sbReady().auth.onAuthStateChange(handle);handle('BOOT',provider.session());if(provider.mode==='blocked'){status.textContent='연결 설정을 확인할 수 없습니다. 연결 상태와 설정을 확인한 뒤 새로고침해 주세요.';form.hidden=true;}else void provider.boot();
})();

});

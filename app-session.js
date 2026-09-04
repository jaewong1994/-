(function(){
'use strict';
let revision=0,ready=false,activeId=null;
const gate=document.getElementById('auth-gate'),form=document.getElementById('auth-form'),status=document.getElementById('auth-status'),retry=document.getElementById('auth-retry');
function lock(message,login=false){ready=false;document.body.classList.add('auth-pending');gate.hidden=false;status.textContent=message;form.hidden=!login;retry.hidden=login;}
function menus(){
  const role=_wprofile?.role;
  document.querySelectorAll('[data-cat="counsel"],[data-session-menu="counsel"]').forEach(el=>el.style.display=['teacher','director'].includes(role)?'':'none');
  document.querySelectorAll('[data-cat="admin"],[data-session-menu="admin"]').forEach(el=>el.style.display=role==='director'?'':'none');
}
window.AppSession={canOpen(page){return ready&&(page!=='admin'||_wprofile?.role==='director')&&(page!=='counsel'||['teacher','director'].includes(_wprofile?.role));}};
async function restore(session){
  if(ready&&session?.user.id===activeId)return;
  const token=++revision;ready=false;activeId=null;_wuser=null;_wprofile=null;scores=[];menus();
  if(!session){lock('로그인 후 성적과 입시 전략을 이용할 수 있습니다.',true);return;}
  lock('계정과 권한을 확인하고 있습니다.');retry.hidden=true;
  try{
    const {data:profile,error}=await sbReady().from('profiles').select('*').eq('id',session.user.id).maybeSingle();
    if(token!==revision)return;
    if(error||!profile||!['student','teacher','director'].includes(profile.role))throw new Error('계정 권한을 확인할 수 없습니다. 관리자에게 문의하세요.');
    _wuser=session.user;_wprofile=profile;activeId=session.user.id;menus();
    await window.loadMyMockScores();if(token!==revision)return;
    ready=true;gate.hidden=true;document.body.classList.remove('auth-pending');form.reset();
    showCat(profile.role==='student'?'ipsi':'counsel');
    if(!profile.name)showCat('wtest');
    if(typeof pcBoot==='function')pcBoot();
  }catch(error){if(token===revision)lock(error.message||'연결에 실패했습니다. 다시 확인해주세요.');}
}
async function boot(){try{const sb=sbReady();if(!sb)throw new Error('서버 연결을 확인해주세요.');const {data,error}=await sb.auth.getSession();if(error)throw error;await restore(data.session);}catch(e){lock('로그인 상태 확인 실패. 네트워크 연결 후 다시 확인해주세요.');}}
form.addEventListener('submit',async event=>{
  event.preventDefault();const button=form.querySelector('button');button.disabled=true;status.textContent='로그인 중입니다.';
  try{const {data,error}=await sbReady().auth.signInWithPassword({email:document.getElementById('auth-email').value.trim(),password:document.getElementById('auth-password').value});if(error){status.textContent='로그인 실패. 이메일과 비밀번호를 확인해주세요.';return;}await restore(data.session);}catch(e){status.textContent='서버에 연결할 수 없습니다. 다시 시도해주세요.';}finally{button.disabled=false;}
});
retry.addEventListener('click',boot);
window.wLogout=async function(){
  const {error}=await sbReady().auth.signOut();if(error){showToast('로그아웃에 실패했습니다. 다시 시도해주세요.');return;}
  await restore(null);document.querySelectorAll('#counsel-content,#uni-content,#strategy-content').forEach(x=>x.replaceChildren());
  if(typeof vwCacheClear==='function')vwCacheClear();
};
const sheet=document.querySelector('#mobile-more-sheet .app-sheet');
if(sheet){const actions=document.createElement('div');actions.className='session-actions';actions.innerHTML='<button type="button" data-session-menu="counsel" onclick="closeMobileMore();showCat(\'counsel\')">상담</button><button type="button" data-session-menu="admin" onclick="closeMobileMore();showCat(\'admin\')">계정 관리</button><button type="button" onclick="closeMobileMore();wLogout()">로그아웃</button>';sheet.append(actions);}
document.querySelectorAll('.cat').forEach(el=>{el.setAttribute('role','button');el.tabIndex=0;el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();el.click();}});});
const sb=sbReady();if(sb)sb.auth.onAuthStateChange((event,session)=>{if(event==='SIGNED_OUT'||event==='SIGNED_IN'||event==='USER_UPDATED')setTimeout(()=>restore(session),0);});
boot();
})();

function syncMobileNav(cat){
  const primary=['dday','ipsi','wtest','report'];
  const active=primary.includes(cat)?cat:'more';
  document.querySelectorAll('.mobile-nav-item').forEach(btn=>{
    const on=btn.dataset.mobileCat===active;
    btn.classList.toggle('on',on);
    if(on) btn.setAttribute('aria-current','page'); else btn.removeAttribute('aria-current');
  });
}

function mobileNavigate(cat){
  closeMobileMore();
  showCat(cat);
}

function openSheet(id){
  const sheet=document.getElementById(id); if(!sheet)return;
  _sheetReturnFocus=document.activeElement;
  sheet.hidden=false;
  document.body.classList.add('sheet-open');
  const focusTarget=sheet.querySelector('button');
  if(focusTarget) requestAnimationFrame(()=>focusTarget.focus());
}

function closeSheet(id,event){
  const sheet=document.getElementById(id); if(!sheet)return;
  if(event&&event.target!==sheet)return;
  sheet.hidden=true;
  if(!document.querySelector('.app-sheet-scrim:not([hidden])')) document.body.classList.remove('sheet-open');
  if(_sheetReturnFocus&&typeof _sheetReturnFocus.focus==='function') _sheetReturnFocus.focus({preventScroll:true});
}

function openMobileMore(){ openSheet('mobile-more-sheet'); }
function closeMobileMore(event){ closeSheet('mobile-more-sheet',event); }
function closeInstallGuide(event){ closeSheet('install-guide',event); }

function showInstallGuide(){
 closeMobileMore();
 const body=document.getElementById('install-guide-body');
 body.innerHTML='<h3>iPhone · iPad</h3><ol><li>Safari에서 앱을 엽니다.</li><li>공유 메뉴에서 “홈 화면에 추가”를 선택합니다.</li><li>“웹 앱으로 열기” 선택이 보이면 켜고 추가합니다.</li></ol><p>홈 화면 아이콘으로 다시 열 수 있습니다. YouTube 재생과 서버 기능에는 인터넷 연결이 필요합니다.</p><h3>Android</h3><p>Chrome 메뉴에서 “앱 설치” 또는 “홈 화면에 추가”를 선택합니다.</p><p>공용 기기에서는 사용 후 로그아웃하세요. 이 체험본의 합성 학습 기록은 기기에 남습니다.</p>';
 openSheet('install-guide');
}

async function installPWA(){
const __mvpEpoch=SessionGuard.capture();

  if(window.matchMedia('(display-mode:standalone)').matches||navigator.standalone){
    showToast('이미 앱으로 실행 중입니다'); closeMobileMore(); return;
  }
  if(!_pwaInstallPrompt){ showInstallGuide(); return; }
  closeMobileMore();
  _pwaInstallPrompt.prompt();
  const choice=await SessionGuard.wait((_pwaInstallPrompt.userChoice),__mvpEpoch);
  if(choice&&choice.outcome==='accepted') showToast('앱 설치를 시작합니다');
  _pwaInstallPrompt=null;
}

window.addEventListener('beforeinstallprompt',event=>{
  event.preventDefault();
  _pwaInstallPrompt=event;
});
window.addEventListener('appinstalled',()=>{ _pwaInstallPrompt=null; showToast('입실론 앱이 설치되었습니다'); });
window.addEventListener('keydown',event=>{
  if(event.key==='Escape'){ closeMobileMore(); closeInstallGuide(); }
});

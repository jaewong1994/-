Promise.resolve(window.MvpAppReady).then(()=>{
(function(){
 'use strict';
 const bar=document.createElement('aside');bar.className='pwa-status';bar.setAttribute('aria-label','앱 상태');
 const status=document.createElement('span');status.role='status';status.textContent='오프라인 준비 상태를 확인하고 있습니다.';
 const check=document.createElement('button');check.type='button';check.textContent='연결·새 버전 확인';
 const update=document.createElement('button');update.type='button';update.textContent='새 버전 적용';update.hidden=true;
 const confirmation=document.createElement('div');confirmation.hidden=true;confirmation.setAttribute('role','group');confirmation.setAttribute('aria-label','새 버전 적용 확인');
 const confirmText=document.createElement('span');confirmText.textContent='작성 중인 글과 필기가 저장됐는지 확인하세요. 적용하면 화면을 다시 엽니다.';
 const apply=document.createElement('button');apply.type='button';apply.textContent='저장 확인 후 적용';
 const cancel=document.createElement('button');cancel.type='button';cancel.textContent='계속 사용';cancel.onclick=()=>{confirmation.hidden=true;update.focus();};
 confirmation.append(confirmText,apply,cancel);bar.append(status,check,update,confirmation);
 // Installation and update details live in the dismissible guide, not a permanent header row.
 const guide=document.querySelector('#install-guide .install-sheet');
 if(!guide)return;
 guide.append(bar);
 const compatible=window.MvpSessionProvider?.operations==='legacy-compatible-v1';
 const installSupported=compatible||!window.MvpSessionProvider||window.MvpSessionProvider.mode==='demo';
 const installed=window.matchMedia?.('(display-mode: standalone)').matches||navigator.standalone;
 function guideSeen(){try{if(localStorage.getItem('student-mvp-install-guide-seen-v1')==='1')return true;}catch{}try{return sessionStorage.getItem('student-mvp-install-guide-seen-v1')==='1';}catch{return false;}}
 if(installSupported&&!installed&&!guideSeen()){
  const observer=new MutationObserver(()=>offerGuide());
  function offerGuide(){
   if(guideSeen()){observer.disconnect();return;}
   if(!window.AppSession?.context()||document.body.classList.contains('auth-pending'))return;
   if(document.querySelector('.app-sheet-scrim:not([hidden])'))return;
   observer.disconnect();showInstallGuide();
  }
  observer.observe(document.body,{attributes:true,attributeFilter:['class','hidden'],subtree:true});offerGuide();
 }
 if(compatible&&!window.MvpSessionProvider.appShell){status.textContent='기존 학생관리 서버 연결 · 새 학습 자료는 이 기기에 저장됩니다. 홈 화면에 추가해 사용할 수 있습니다.';check.hidden=true;return;}
 if(window.MvpSessionProvider?.mode!=='demo'&&window.MvpSessionProvider&&!compatible){status.textContent='계정 학습 모드 · 자료는 이 기기에 저장됩니다. 오프라인 앱 설치는 지원하지 않습니다.';check.hidden=true;return;}
 let registration=null,prepared=false,online=navigator.onLine,applying=false,probe=0;
 function render(){status.textContent=online?(compatible?(prepared?'앱 화면 준비 완료 · 학생관리 기록은 서버, 새 학습 자료는 기기에 저장됩니다.':'기존 학생관리 서버 연결 · 앱 화면을 준비하고 있습니다.'):(prepared?'오프라인 화면 준비 완료 · 학습 기록은 이 기기에 저장됩니다.':'온라인 · 오프라인 화면을 준비하고 있습니다.')):(compatible?'오프라인 · 로그인 확인과 서버 기록 사용에는 연결이 필요합니다. 기기 자료는 보존됩니다.':'오프라인 · 저장된 화면과 기기 필기만 이용할 수 있습니다. YouTube와 서버 기능은 연결이 필요합니다.');bar.dataset.offline=String(!online);}
 async function connectivity(){
  const generation=++probe;if(!navigator.onLine){online=false;render();return;}
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),2500);
  try{const response=await fetch('./manifest.webmanifest?connectivity=1',{cache:'no-store',signal:controller.signal});if(generation===probe)online=response.ok;}catch{if(generation===probe)online=false;}finally{clearTimeout(timer);if(generation===probe)render();}
 }
 function waiting(){update.hidden=!registration?.waiting;}
 check.onclick=async()=>{check.disabled=true;try{await connectivity();if(online&&registration)await registration.update();waiting();}catch{status.textContent='새 버전을 확인하지 못했습니다. 기존 화면을 계속 이용할 수 있습니다.';}finally{check.disabled=false;}};
 function saveReady(){
  const frame=document.getElementById('learning-frame');
  if(frame&&frame.contentDocument?.querySelector('[data-save-state="pending"],[data-save-state="error"]')){status.textContent='필기가 저장 중이거나 저장에 실패했습니다. 저장 완료를 확인한 뒤 새 버전을 적용해 주세요.';return false;}
  return true;
 }
 update.onclick=()=>{if(registration?.waiting&&saveReady()){confirmation.hidden=false;apply.focus();}};
 apply.onclick=()=>{
  if(!registration?.waiting||!saveReady())return;
  apply.disabled=true;applying=true;registration.waiting.postMessage({type:'APPLY_UPDATE'});
 };
 window.addEventListener('online',()=>void connectivity());window.addEventListener('offline',()=>{++probe;online=false;render();});
 if(!('serviceWorker' in navigator)||!window.isSecureContext){status.textContent='이 환경에서는 설치·오프라인 기능을 확인할 수 없습니다. 일반 웹 화면은 이용할 수 있습니다.';return;}
 navigator.serviceWorker.addEventListener('controllerchange',()=>{prepared=true;waiting();render();if(applying)location.reload();});
 navigator.serviceWorker.register('./sw.js',{scope:'./',updateViaCache:'none'}).then(reg=>{
  registration=reg;waiting();
  reg.addEventListener('updatefound',()=>{const worker=reg.installing;worker?.addEventListener('statechange',()=>{if(worker.state==='installed'||worker.state==='activated')waiting();if(worker.state==='redundant'&&!reg.active&&!prepared)status.textContent='오프라인 화면 준비에 실패했습니다. 연결 후 다시 확인해 주세요.';});});
  navigator.serviceWorker.ready.then(()=>{prepared=true;render();});
 }).catch(()=>{status.textContent='오프라인 화면을 준비하지 못했습니다. 연결 후 다시 확인해 주세요.';});
 void connectivity();
})();

});

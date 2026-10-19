function showStaffSection(section){window._mvpStaffSection=section;showCat('wtest');}
// Stable management navigation lives outside pages so its position and horizontal scroll survive tab changes.
function setStaffActive(active){
 const nav=document.getElementById('mvp-staff-navigation');if(!nav)return;
 nav.querySelectorAll('[data-staff-id]').forEach(button=>{const on=button.dataset.staffId===active;button.classList.toggle('on',on);if(on)button.setAttribute('aria-current','page');else button.removeAttribute('aria-current');});
}
function syncStaffNavigation(page){
 const inner=document.querySelector('.inner');if(!inner)return;
 let nav=document.getElementById('mvp-staff-navigation');
 if(!nav){nav=document.createElement('div');nav.id='mvp-staff-navigation';nav.innerHTML=staffToolbar('tests',true);inner.prepend(nav);}
 nav.hidden=!['wtest','exam-counsel','counsel'].includes(page)||!(AppSession.can('manage-tests')||AppSession.can('read-tests'));
 nav.querySelectorAll('[data-staff-id=classes]').forEach(b=>b.hidden=!AppSession.can('manage-tests'));
 nav.querySelectorAll('[data-staff-id=poka]').forEach(b=>b.hidden=!AppSession.can('cards'));
 if(!nav.hidden)setStaffActive(page==='counsel'?'counsel':page==='exam-counsel'?'exam':'tests');
}
function focusPageTop(target){
 if(!target)return;target.setAttribute('tabindex','-1');target.focus({preventScroll:true});
 const main=document.querySelector('.main');if(main)main.scrollTop=0;
 window.scrollTo?.({top:0,behavior:'instant'});
}
const detailReturnFocus=new Map(),detailRequests=new Map();
function currentTopDetail(id,request){const detail=document.getElementById(id);return detail&&detail===request?.node&&detailRequests.get(id)===request?.version&&!document.getElementById(id+'-view')?.hidden&&detail.closest('.page')?.classList.contains('on');}
function openTopDetail(id){
 const detail=document.getElementById(id),view=document.getElementById(id+'-view'),list=document.getElementById(id+'-list');
 if(!detail||!view||!list)return;
 if(view.hidden)detailReturnFocus.set(id,document.activeElement);
 list.hidden=true;view.hidden=false;focusPageTop(view);
 const version=(detailRequests.get(id)||0)+1;detailRequests.set(id,version);return {node:detail,version};
}
function closeTopDetail(id){
 const detail=document.getElementById(id),view=document.getElementById(id+'-view'),list=document.getElementById(id+'-list');
 if(!detail||!view||!list)return;
 detailRequests.set(id,(detailRequests.get(id)||0)+1);detail.replaceChildren();view.hidden=true;list.hidden=false;focusPageTop(list);
 const previous=detailReturnFocus.get(id);if(previous?.isConnected)previous.focus({preventScroll:true});detailReturnFocus.delete(id);
}
window.addEventListener('mvp-session-reset',()=>{detailReturnFocus.clear();detailRequests.clear();const nav=document.getElementById('mvp-staff-navigation');if(nav)nav.hidden=true;});

function runPageRender(render){try{Promise.resolve(render()).catch(error=>{if(error?.name!=='StaleSession')showToast('화면을 불러오지 못했습니다. 다시 열어 주세요.');});}catch{showToast('화면을 불러오지 못했습니다. 다시 열어 주세요.');}}
function showCat(cat){
  if(!window.AppSession||!AppSession.canOpen(cat))return;
  document.querySelectorAll('.cat').forEach(c=>c.classList.toggle('on', c.dataset.cat===cat));
  syncMobileNav(cat);
  const subtabs=document.getElementById('subtabs');
  if(cat==='ipsi'){
    subtabs.style.display='flex';
    showPage('uni');
  } else {
    subtabs.style.display='none';
    showPage(cat); // wtest / collection / dday
  }
}

const IPSI_TABS={susi:0,score:1,trend:2,cut:3,uni:4,input:5,strategy:6};
function showPage(n){
  if(!window.AppSession||!AppSession.canOpen(n))return;
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('on'));
  const pg=document.getElementById('pg-'+n);
  if(pg) pg.classList.add('on');
  const inner=document.querySelector('.inner');
  if(inner) inner.classList.remove('counsel-wide');
  syncStaffNavigation(n);
  focusPageTop(pg);
  // 하위 탭 하이라이트 (입시 카테고리일 때만)
  document.querySelectorAll('.tab').forEach(t=>t.classList.remove('on'));
  if(n in IPSI_TABS){
    const tabs=document.querySelectorAll('.tab');
    if(tabs[IPSI_TABS[n]]) tabs[IPSI_TABS[n]].classList.add('on');
  }
  if(n==='learning')runPageRender(renderLearning);
  if(n==='susi')runPageRender(renderSusi);
  if(n==='trend')runPageRender(renderTrend);
  if(n==='uni')runPageRender(renderUni);
  if(n==='score')runPageRender(renderScore);
  if(n==='cut')runPageRender(renderGradeCuts);
  if(n==='strategy')runPageRender(renderStrategy);
  if(n==='wtest'){const section=window._mvpStaffSection;window._mvpStaffSection=null;runPageRender(section==='classes'?wManageClasses:section==='poka'?wPhotoAdmin:renderWTest);}
  if(n==='collection')runPageRender(renderCollection);
  if(n==='dday')runPageRender(renderDday);
  if(n==='report')runPageRender(renderReport);
  if(n==='viewer')runPageRender(renderViewer);
  if(n==='admin')runPageRender(renderWAdmin);
  if(n==='counsel')runPageRender(renderCounsel);
  if(n==='exam-counsel')runPageRender(renderExamCounsel);
}

function showToast(m){const t=document.getElementById('toast');t.textContent=m;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2500);}

// ===== D-day =====
const DDAY_EVENTS=[
  {name:'9월 모의평가', date:'2026-09-02', icon:'📝', desc:'평가원 9월 모평 (수능 직전 최종 점검)', color:'#2563eb'},
  {name:'수시 원서접수', date:'2026-09-07', endDate:'2026-09-11', icon:'📄', desc:'2027학년도 수시 원서접수 (9/7~9/11)', color:'#7c3aed'},
  {name:'수능', date:'2026-11-19', icon:'🎯', desc:'2027학년도 대학수학능력시험', color:'#dc2626'},
  {name:'정시 원서접수', date:'2027-01-04', endDate:'2027-01-07', icon:'📋', desc:'2027학년도 정시 원서접수 (1/4~1/7)', color:'#059669'},
];


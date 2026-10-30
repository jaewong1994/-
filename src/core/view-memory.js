(function(root){
 'use strict';
 const PREFIX='student-mvp-view-v1:',TTL=12*60*60*1000,MAX=180000;
 let replaying=false,scrollMemory=[],timer;
 const identity=()=>{const c=root.AppSession?.context();if(!c)return null;const p=typeof _wprofile==='undefined'?{}:_wprofile||{};return {id:c.id,role:c.role,scope:JSON.stringify([c.id,c.role,p.class_id??null,p.teacher_id??null])};};
 const key=i=>PREFIX+encodeURIComponent(i.id)+':'+i.role;
 const integer=n=>Number.isSafeInteger(n)&&n>=0;
 function rememberScroll(){
  scrollMemory=[document.scrollingElement,...document.querySelectorAll('.main,.page *')].filter(Boolean).filter(e=>e.scrollTop||e.scrollLeft).map(node=>({node,top:node.scrollTop,left:node.scrollLeft}));
 }
 function restoreScroll(){for(const r of scrollMemory)if(r.node.isConnected){r.node.scrollTop=r.top;r.node.scrollLeft=r.left;}}
 function capture(){
  const actor=identity(),page=document.querySelector('.page.on');if(replaying||!actor||!page)return;
  const name=page.id.replace(/^pg-/,'');if(!root.AppSession.canOpen(name))return;
  const main=document.querySelector('.main'),marker=page.querySelector('[data-resume-kind]');
  const snapshot={v:1,actor,at:Date.now(),page:name,mainTop:main?.scrollTop||0,mainLeft:main?.scrollLeft||0,windowTop:document.scrollingElement?.scrollTop||0};
  const section=document.querySelector('#mvp-staff-navigation .staff-tool.on')?.dataset.staffId;if(name==='wtest'&&['classes','poka'].includes(section))snapshot.staffSection=section;
  if(marker){const testId=Number(marker.dataset.resumeTest),kind=marker.dataset.resumeKind;
   if(Number.isSafeInteger(testId)&&testId>0&&['key','take','result','rank'].includes(kind))snapshot.detail={kind,testId};
  }
  if(snapshot.detail?.kind==='key'&&root._ekEditor&&!root._ekEditor.saving){snapshot.draft={origin:root._ekBase,answers:root._ekAnswers,types:root._ekTypes,levels:root._ekLevels,points:[...page.querySelectorAll('.ek-pt')].map(e=>e.value)};}
  if(snapshot.detail?.kind==='take'&&Number(root._wTestId)===snapshot.detail.testId&&page.querySelector('#w-submit-btn:not(:disabled)'))snapshot.draft={answers:Array.isArray(root._wAnswers)?root._wAnswers.map(v=>v==null?'':String(v)):null};
  if(snapshot.detail?.kind==='result'){snapshot.filter=page.querySelector('[data-filter][aria-pressed=true]')?.dataset.filter;snapshot.expanded=[...page.querySelectorAll('[data-action=peers][aria-expanded=true]')].map(e=>e.getAttribute('aria-controls'));}
  const frame=document.getElementById('learning-frame');if(name==='learning'&&frame)try{const hash=frame.contentWindow.location.hash;if(/^#\/[\w/%.-]*$/.test(hash)&&hash.length<=300)snapshot.frameHash=hash;}catch{}
  try{const json=JSON.stringify(snapshot);if(json.length<=MAX)root.sessionStorage.setItem(key(actor),json);}catch{}
 }
 function forget(){clearTimeout(timer);scrollMemory=[];try{for(let i=root.sessionStorage.length-1;i>=0;i--){const k=root.sessionStorage.key(i);if(k?.startsWith(PREFIX))root.sessionStorage.removeItem(k);}}catch{}}
 const validAnswers=value=>Array.isArray(value)&&value.length>=1&&value.length<=100&&value.every(v=>typeof v==='string'&&v.length<=200);
 async function restore(){
  const actor=identity();if(!actor)return false;let snapshot;
  try{const text=root.sessionStorage.getItem(key(actor));if(!text||text.length>MAX)return false;snapshot=JSON.parse(text);}catch{return false;}
  if(snapshot?.v!==1||snapshot.actor?.id!==actor.id||snapshot.actor?.role!==actor.role||snapshot.actor?.scope!==actor.scope||!Number.isFinite(snapshot.at)||Date.now()-snapshot.at>TTL||snapshot.at>Date.now()+60000||typeof snapshot.page!=='string'||!root.AppSession.canOpen(snapshot.page)||!document.getElementById('pg-'+snapshot.page))return false;
  const epoch=root.SessionGuard.capture(),current=()=>{const now=identity();return now?.scope===actor.scope&&root.SessionGuard.capture()===epoch;};
  replaying=true;
  try{
   if(['uni','score','trend','cut','input','susi','strategy'].includes(snapshot.page)){await root.showCat('ipsi');if(!current())return false;await root.showPage(snapshot.page);}
   else{if(snapshot.page==='wtest'&&['teacher','director'].includes(actor.role)&&(['classes'].includes(snapshot.staffSection)||snapshot.staffSection==='poka'&&root.AppSession.can('cards')))root._mvpStaffSection=snapshot.staffSection;await root.showCat(snapshot.page);}if(!current())return false;
   const detail=snapshot.detail;
   if(snapshot.page==='wtest'&&Number.isSafeInteger(detail?.testId)&&detail.testId>0){
    const staff=['teacher','director'].includes(actor.role),id=detail.testId;
    if(detail.kind==='key'&&staff){
     await root.wEditKey(id,'');if(!current())return false;
     const draft=snapshot.draft;
     if(draft&&draft.origin===root._ekBase&&validAnswers(draft.answers)&&draft.answers.length===root._ekTotal&&Array.isArray(draft.types)&&draft.types.length===root._ekTotal&&draft.types.every(t=>['mc','sa'].includes(t))&&Array.isArray(draft.levels)&&draft.levels.length===root._ekTotal&&draft.levels.every(l=>['','jun','kill','god'].includes(l))&&Array.isArray(draft.points)&&draft.points.length===root._ekTotal){
      root._ekAnswers=draft.answers.slice();root._ekTypes=draft.types.slice();root._ekLevels=draft.levels.slice();
      for(let i=0;i<root._ekTotal;i++){root.wEkSetType(i,draft.types[i]);root.wEkSetLevel(i,draft.levels[i]);const field=document.querySelector('.ek-pt[data-pt="'+i+'"]');if(field)field.value=String(draft.points[i]).slice(0,8);root.wEkMark(i);}
     }else if(draft&&draft.origin!==root._ekBase)root.showToast('서버의 정답이 변경되어 임시 입력 대신 최신 정답을 불러왔습니다.');
    }else if(detail.kind==='result'&&actor.role==='student'){
     await root.StudentTestResults.open(id,'');if(!current())return false;
     if(['all','wrong','correct'].includes(snapshot.filter))document.querySelector('[data-filter="'+snapshot.filter+'"]')?.click();
     if(Array.isArray(snapshot.expanded))for(const target of snapshot.expanded.slice(0,100))if(/^str-peers-\d{1,2}$/.test(target))document.querySelector('[data-action=peers][aria-controls="'+target+'"][aria-expanded=false]')?.click();
    }else if((detail.kind==='take'&&actor.role==='student')||(detail.kind==='rank'&&staff)){
     const response=await root.sbReady().from('tests').select('id,title,total,closed').eq('id',id).single();if(!current()||response.error||!response.data)return false;
     if(detail.kind==='rank')await root.wViewRank(id,response.data.title);
     else{
      await root.wOpenTest(id,response.data.title,response.data.total);if(!current())return false;
      if(root._wTestId===id&&document.querySelector('#w-submit-btn')&&validAnswers(snapshot.draft?.answers)&&snapshot.draft.answers.length===root._wTotal){root._wAnswers=snapshot.draft.answers.slice();for(let i=0;i<root._wTotal;i++){if(root._wTypes[i]==='mc')root.wPick(i,root._wAnswers[i]);else{const field=document.querySelector('.w-sa-inp[data-saq="'+i+'"]');if(field)field.value=root._wAnswers[i];}}}
     }
    }
   }
   if(!current())return false;
   const frame=document.getElementById('learning-frame');if(snapshot.page==='learning'&&frame&&typeof snapshot.frameHash==='string'&&snapshot.frameHash.length<=300&&/^#\/[\w/%.-]*$/.test(snapshot.frameHash)){const url=new URL(frame.src,root.location.href);if(url.origin===root.location.origin){url.hash=snapshot.frameHash;frame.src=url.href;}}
   const scroll=()=>{if(!current())return;const main=document.querySelector('.main');if(main){if(integer(snapshot.mainTop))main.scrollTop=snapshot.mainTop;if(integer(snapshot.mainLeft))main.scrollLeft=snapshot.mainLeft;}if(document.scrollingElement&&integer(snapshot.windowTop))document.scrollingElement.scrollTop=snapshot.windowTop;};
   scroll();root.requestAnimationFrame?.(scroll);return true;
  }catch{return false;}finally{replaying=false;}
 }
 document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')capture();});root.addEventListener('pagehide',capture);
 document.addEventListener('input',()=>{clearTimeout(timer);timer=setTimeout(capture,250);});document.addEventListener('click',()=>{clearTimeout(timer);timer=setTimeout(capture,250);});
 root.MvpViewMemory=Object.freeze({capture,restore,forget,pause(){capture();rememberScroll();},resume(){restoreScroll();root.requestAnimationFrame?.(restoreScroll);}});
})(window);

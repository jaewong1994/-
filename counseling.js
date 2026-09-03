(function(){
'use strict';

const esc=v=>String(v==null?'':v).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const order={'6월 모평':1,'7월 학평':2,'9월 모평':3,'수능':4};
const artRx=/체육|스포츠|운동|레저|골프|태권|미술|디자인|회화|조소|공예|애니|웹툰|음악|성악|피아노|관현악|무용|연극|영화/;
const state={students:[],classes:{},studentId:'',studentName:'',records:[],plan:null,mode:'regular',arts:false,scenario:null};

// 2027학년도 평가원 정답표 배점. 국어 공통 1~34 + 선택 35~45.
const KOR_COMMON={
  '6월 모평':[2,2,3,2,2,2,2,3,2,2,2,2,3,2,2,3,2,2,2,2,3,2,2,3,2,2,2,2,2,2,3,2,2,3],
  '9월 모평':[2,2,3,2,2,2,2,3,2,2,2,2,3,2,2,3,2,2,2,2,3,2,2,3,2,2,2,2,2,2,3,2,2,3]
};
const KOR_OPTION={
  '6월 모평':{'화법과작문':[2,2,2,2,2,3,2,2,2,2,3],'언어와매체':[2,2,3,2,2,2,2,2,2,2,3]},
  '9월 모평':{'화법과작문':[2,2,2,2,2,3,2,2,2,2,3],'언어와매체':[2,2,2,2,3,2,2,2,2,3,2]}
};
const MATH_POINTS=[2,2,3,3,3,3,3,3,4,4,4,4,4,4,4,3,3,3,3,4,4,4,2,3,3,3,3,4,4,4];

function parseWrong(v,max){
  const nums=String(v||'').split(/[\s,./]+/).map(Number).filter(n=>Number.isInteger(n)&&n>=1&&n<=max);
  return [...new Set(nums)].sort((a,b)=>a-b);
}
function pointsFor(subject,exam,sub){
  if(subject==='math') return MATH_POINTS;
  const common=KOR_COMMON[exam]; const opt=KOR_OPTION[exam]&&KOR_OPTION[exam][sub];
  return common&&opt ? common.concat(opt) : null;
}
function calcRawFromWrong(subject){
  const id=subject==='kor'?'csl-wrong-kor':'csl-wrong-math';
  const target=subject==='kor'?'kor_raw':'math_raw';
  const max=subject==='kor'?45:30;
  const wrong=parseWrong(document.getElementById(id)?.value,max);
  const pts=pointsFor(subject,selExam,subject==='kor'?selKorSub:selMathSub);
  const live=document.getElementById('csl-live-'+subject);
  if(!pts){ if(live)live.textContent='6월 또는 9월 모평에서만 문항 배점 계산을 지원합니다.'; return; }
  const lost=wrong.reduce((sum,n)=>sum+(pts[n-1]||0),0), raw=100-lost;
  const input=document.getElementById(target); if(input){input.value=raw;autoCalc(subject);}
  window._mockWrongItems=window._mockWrongItems||{};
  window._mockWrongItems[subject]={items:wrong,lost,raw,pointSource:'2027 평가원 정답표'};
  if(live) live.textContent=`${wrong.length}문항 · ${lost}점 감점 → 원점수 ${raw}점`;
}
window.calcRawFromWrong=calcRawFromWrong;

function injectWrongInput(){
  const page=document.getElementById('pg-input'); if(!page||document.getElementById('csl-wrong-entry'))return;
  const box=document.createElement('section'); box.id='csl-wrong-entry'; box.className='csl-wrong-card';
  box.innerHTML=`<div class="csl-wrong-title"><i class="ti ti-list-numbers" aria-hidden="true"></i> 틀린 문항으로 원점수 계산</div>
    <div class="csl-wrong-desc">2027학년도 6·9월 평가원 정답표의 실제 문항 배점으로 원점수를 계산합니다. 이후 표준점수는 공개 추정컷 기반이며, 성적표·타 사이트 값이 있으면 아래의 ‘공식 점수 직접 입력’을 사용하세요.</div>
    <div class="csl-wrong-grid">
      <div><label class="csl-label" for="csl-wrong-kor">국어 틀린 번호</label><div class="csl-inline"><input id="csl-wrong-kor" class="csl-input" inputmode="numeric" placeholder="예: 8, 21, 34"><button class="csl-calc" onclick="calcRawFromWrong('kor')">계산</button></div><div id="csl-live-kor" class="csl-live" aria-live="polite"></div></div>
      <div><label class="csl-label" for="csl-wrong-math">수학 틀린 번호</label><div class="csl-inline"><input id="csl-wrong-math" class="csl-input" inputmode="numeric" placeholder="예: 15, 22, 30"><button class="csl-calc" onclick="calcRawFromWrong('math')">계산</button></div><div id="csl-live-math" class="csl-live" aria-live="polite"></div></div>
    </div>`;
  page.insertBefore(box,page.firstChild);
}

window.syncMockScoreRecord=async function(rec){
  try{
    const sb=sbReady(); if(!sb)return;
    const {data:{session}}=await sb.auth.getSession(); if(!session)return;
    const payload={student_id:session.user.id,exam_year:Number(rec.year)||2027,exam_type:rec.examType,score_data:rec,wrong_items:rec.wrongItems||{},source_mode:rec.sourceMode||(rec.official?'external':'estimated')};
    const {error}=await sb.from('mock_scores').upsert(payload,{onConflict:'student_id,exam_year,exam_type'});
    if(error){showToast('기기에는 저장됨 · 서버 동기화 재시도 필요');console.warn(error);return;}
    showToast('성적 저장 및 상담자료 전송 완료');
  }catch(e){console.warn(e);}
};

window.loadMyMockScores=async function(){
  try{
    const sb=sbReady(); if(!sb||!_wuser)return;
    const {data,error}=await sb.from('mock_scores').select('id,score_data,updated_at').eq('student_id',_wuser.id).order('updated_at');
    if(error)return;
    const cloud=(data||[]).map(x=>Object.assign({},x.score_data,{cloudId:x.id}));
    if(cloud.length){
      const map=new Map(scores.map(x=>[`${x.year}|${x.examType}`,x])); cloud.forEach(x=>map.set(`${x.year}|${x.examType}`,x));
      scores=[...map.values()].sort((a,b)=>(order[a.examType]||9)-(order[b.examType]||9));
      localStorage.setItem('epsilon_scores',JSON.stringify(scores)); renderScore();renderTrend();renderUni();renderStrategy();
    }
    for(const local of scores.filter(x=>!cloud.some(c=>c.examType===x.examType&&c.year===x.year))) window.syncMockScoreRecord(local);
  }catch(e){console.warn(e);}
};

window.deleteCloudMockScore=async function(rec){
  try{const sb=sbReady();if(!sb||!_wuser)return;await sb.from('mock_scores').delete().eq('student_id',_wuser.id).eq('exam_year',Number(rec.year)||2027).eq('exam_type',rec.examType);}catch(e){console.warn(e);}
};
window.deleteAllMockScores=async function(){
  if(!confirm('모든 성적을 기기와 상담 서버에서 삭제할까요?'))return;
  const sb=sbReady();if(sb&&_wuser)await sb.from('mock_scores').delete().eq('student_id',_wuser.id);
  scores=[];localStorage.setItem('epsilon_scores','[]');renderScore();renderTrend();renderUni();renderStrategy();showToast('전체 성적을 삭제했습니다');
};

function gradeOptions(v){return Array.from({length:9},(_,i)=>`<option value="${i+1}" ${Number(v)===i+1?'selected':''}>${i+1}등급</option>`).join('');}
function scoreCard(r){
  if(!r)return `<div class="csl-exam"><div class="csl-empty">아직 입력된 성적이 없습니다.</div></div>`;
  const tag=r.official||r.sourceMode==='external'?'확인 점수':'추정 점수';
  return `<article class="csl-exam"><div class="csl-exam-top"><div class="csl-exam-name">${esc(r.examType)}</div><span class="csl-badge ${tag==='확인 점수'?'official':'estimate'}">${tag}</span></div><div class="csl-subjects">${[['국어',r.kor],['수학',r.math],['영어',r.eng],['탐구1',r.sci1],['탐구2',r.sci2]].map(([n,s])=>`<div class="csl-subject"><span>${n}</span><strong>${s&&s.gr||'-'}</strong></div>`).join('')}</div></article>`;
}
function latest(){return state.records.slice().sort((a,b)=>(order[b.examType]||0)-(order[a.examType]||0))[0]||null;}
function scenarioFrom(r){return {kor:r?.kor?.gr||5,math:r?.math?.gr||5,eng:r?.eng?.gr||5,sci1:r?.sci1?.gr||5,sci2:r?.sci2?.gr||5};}
function scenarioStd(r,s){
  if(!r)return 0;
  const improve=(key,per)=>Math.max(0,(Number(r[key]?.gr)||9)-Number(s[key]||9))*per;
  return (r.kor?.std||0)+(r.math?.std||0)+(r.sci1?.std||0)+(r.sci2?.std||0)+improve('kor',6)+improve('math',7)+improve('sci1',4)+improve('sci2',4);
}
function scenarioPct(r,s){
  if(!r)return 0;
  const gp=g=>clamp(104-(Number(g)||9)*9,5,99);
  return gp(s.kor)+gp(s.math)+Math.round((gp(s.sci1)+gp(s.sci2))/2);
}
function fit(diff){if(diff>=8)return ['safe','안정'];if(diff>=-5)return ['fit','적정'];if(diff>=-18)return ['reach','소신'];return ['hard','상향'];}
function renderRegular(){
  const r=latest(); if(!r)return `<div class="csl-empty">학생이 6월 또는 9월 성적을 입력하면 대학 라인이 표시됩니다.</div>`;
  const std=scenarioStd(r,state.scenario),pct=scenarioPct(r,state.scenario);
  const rows=UNI.filter(u=>state.arts?artRx.test(`${u.n} ${u.d}`):!artRx.test(`${u.n} ${u.d}`)).map(u=>{
    const useStd=u.ind==='표준'||u.ind==='표+백', mine=useStd?std:pct, cut=useStd?u.std:u.pct;
    return {u,diff:mine-(cut||0),mine,cut,useStd};
  }).filter(x=>x.cut&&x.diff>=-28).sort((a,b)=>(b.cut-a.cut)||(b.diff-a.diff)).slice(0,30);
  return `<div class="csl-note">${state.arts?'예체능':'일반'} 정시 라인 · 시나리오 환산 ${Math.round(std)}점. 등급 조정은 평균적인 등급 간 표준점수 차이를 적용한 상담용 시뮬레이션이며 확정 성적이 아닙니다.</div><div class="csl-result-list">${rows.map(x=>{const f=fit(x.diff);return `<article class="csl-result"><div><div class="csl-result-name">${esc(x.u.n)}</div><div class="csl-result-dept">${esc(x.u.d)} · ${esc(x.u.g)}군 · ${esc(x.u.s)}</div><div class="csl-rule">${esc(x.u.sk||'대학별 환산 규칙 확인 필요')} · 반영 국 ${x.u.kw||0}% / 수 ${x.u.mw||0}% / 영 ${x.u.ew||0}% / 탐 ${x.u.sw||0}%${state.arts?' · 실기 반영비율·종목은 최종 모집요강 재확인':''}</div></div><div class="csl-result-side"><div class="csl-fit ${f[0]}">${f[1]}</div><div class="csl-number">${x.diff>=0?'+':''}${Math.round(x.diff)}</div><div class="csl-meta">${x.useStd?'표준':'백분위'} 기준</div></div></article>`}).join('')||'<div class="csl-empty">조건에 맞는 대학이 없습니다.</div>'}</div>`;
}
function parseMinimum(text){
  const t=String(text||'').replace(/\s/g,''); if(!t||t==='없음'||/미적용/.test(t))return {kind:'none'};
  let m=t.match(/(\d)개(?:영역)?(?:등급)?합(\d+)/)||t.match(/(\d)합(\d+)/);
  if(m)return {kind:'sum',count:Number(m[1]),limit:Number(m[2])};
  m=t.match(/(\d)개.*?(\d)등급/); if(m)return {kind:'each',count:Number(m[1]),limit:Number(m[2])};
  return {kind:'review'};
}
function minimumFit(rule,s){
  if(rule.kind==='none')return ['safe','최저 없음']; if(rule.kind==='review')return ['hard','요강 확인'];
  const arr=[s.kor,s.math,s.eng,Math.min(s.sci1,s.sci2)].map(Number).sort((a,b)=>a-b);
  const ok=rule.kind==='sum'?arr.slice(0,rule.count).reduce((a,b)=>a+b,0)<=rule.limit:arr.filter(x=>x<=rule.limit).length>=rule.count;
  return ok?['safe','최저 충족']:['reach','최저 미충족'];
}
function renderEarly(){
  const rank=typeof _susiSchoolRankMap==='function'?_susiSchoolRankMap():{};
  const rows=(typeof SUSI==='undefined'?[]:SUSI).map(e=>{const text=`${e.min||''} ${e.note||''}`;return {e,res:minimumFit(parseMinimum(text),state.scenario),rank:rank[e.u]||99};}).sort((a,b)=>a.rank-b.rank||(a.e.adm||'').localeCompare(b.e.adm||'ko')).slice(0,35);
  return `<div class="csl-note">현재 시나리오에서 수능최저 충족 가능성을 먼저 계산하고, 대학 수준과 전형명 순으로 정렬합니다. 문장형·단계별 최저는 ‘요강 확인’으로 표시해 자동 오판을 막았습니다.</div><div class="csl-result-list">${rows.map(x=>`<article class="csl-result"><div><div class="csl-result-name">${esc(x.e.u)}</div><div class="csl-result-dept">${esc(x.e.adm)} · ${esc(x.e.cat)}</div><div class="csl-rule">수능최저/전형: ${esc(x.e.min||x.e.note||'없음')}</div></div><div class="csl-result-side"><div class="csl-fit ${x.res[0]}">${x.res[1]}</div><div class="csl-meta">대표 입결 ${x.e.lo||'-'}등급</div></div></article>`).join('')}</div>`;
}
function scenarioHtml(){const s=state.scenario||scenarioFrom(latest());state.scenario=s;return `<div class="csl-scenario">${[['kor','국어'],['math','수학'],['eng','영어'],['sci1','탐구 1'],['sci2','탐구 2']].map(([k,n])=>`<div class="csl-grade"><label for="csl-g-${k}">${n} 목표</label><select id="csl-g-${k}" class="csl-select" onchange="cslScenario('${k}',this.value)">${gradeOptions(s[k])}</select></div>`).join('')}</div>`;}
function resultsHtml(){return state.mode==='early'?renderEarly():renderRegular();}
function refreshResults(){const el=document.getElementById('csl-results');if(el)el.innerHTML=resultsHtml();}
window.cslScenario=(k,v)=>{state.scenario[k]=Number(v);refreshResults();};
window.cslMode=(m)=>{state.mode=m;document.querySelectorAll('.csl-tab[data-mode]').forEach(x=>x.classList.toggle('on',x.dataset.mode===m));refreshResults();};
window.cslArts=(v)=>{state.arts=v==='1';refreshResults();};

async function openStudent(id,name){
  state.studentId=id;state.studentName=name||(state.students.find(s=>s.id===id)?.name||'이름 미설정');document.querySelectorAll('.csl-student').forEach(x=>x.classList.toggle('on',x.dataset.id===id));
  const sb=sbReady(); const [sr,pr]=await Promise.all([sb.from('mock_scores').select('*').eq('student_id',id).order('updated_at'),sb.from('consultation_plans').select('*').eq('student_id',id).maybeSingle()]);
  state.records=(sr.data||[]).map(x=>Object.assign({},x.score_data,{cloudId:x.id,sourceMode:x.source_mode}));state.plan=pr.data||null;state.scenario=state.plan?.plan_data?.scenario||scenarioFrom(latest());
  renderWorkspace();
}
window.cslOpenStudent=openStudent;
function renderWorkspace(){
  const box=document.getElementById('csl-workspace');if(!box)return;
  const june=state.records.find(x=>x.examType==='6월 모평'),sept=state.records.find(x=>x.examType==='9월 모평');
  box.innerHTML=`<section class="csl-panel csl-card"><div class="csl-card-head"><div><div class="csl-eyebrow">상담 학생</div><div class="csl-card-title">${esc(state.studentName)} 입시 전략</div></div><span class="csl-badge">${state.records.length}개 성적</span></div><div class="csl-score-grid">${scoreCard(june)}${scoreCard(sept)}</div></section>
  <section class="csl-panel csl-card"><div class="csl-card-head"><div class="csl-card-title">수능 목표 시나리오</div><div class="csl-meta">등급을 바꾸면 대학선이 즉시 갱신됩니다</div></div>${scenarioHtml()}</section>
  <section class="csl-panel csl-card"><div class="csl-card-head"><div class="csl-tabs"><button class="csl-tab ${state.mode==='regular'?'on':''}" data-mode="regular" onclick="cslMode('regular')">정시 우선</button><button class="csl-tab ${state.mode==='early'?'on':''}" data-mode="early" onclick="cslMode('early')">수시 최저</button></div><label class="csl-label" style="margin:0">계열 <select class="csl-select" style="width:auto;min-height:42px" onchange="cslArts(this.value)"><option value="0" ${!state.arts?'selected':''}>일반계열</option><option value="1" ${state.arts?'selected':''}>예체능·실기</option></select></label></div><div id="csl-results">${resultsHtml()}</div></section>
  <section class="csl-panel csl-card"><div class="csl-card-title">학생에게 공개할 상담 요약</div><div class="csl-note">저장만 하면 원장·강사만 볼 수 있고, ‘학생 전략 탭에 공개’를 선택해야 학생에게 표시됩니다.</div><label class="csl-label" for="csl-note" style="margin-top:12px">상담 메모</label><textarea id="csl-note" class="csl-textarea" placeholder="정시 우선 지원선, 수시 6장 구성, 수능까지 올릴 과목을 정리하세요.">${esc(state.plan?.counselor_note||'')}</textarea><div class="csl-actions"><button class="csl-btn" onclick="cslSave(false)">비공개 저장</button><button class="csl-btn primary" onclick="cslSave(true)">학생 전략 탭에 공개</button></div></section>`;
}
window.cslSave=async function(published){
  const sb=sbReady();if(!sb||!state.studentId)return;
  const buttons=document.querySelectorAll('.csl-actions button');buttons.forEach(b=>b.disabled=true);
  const payload={student_id:state.studentId,counselor_id:_wuser.id,counselor_note:document.getElementById('csl-note').value.trim(),published,plan_data:{scenario:state.scenario,mode:state.mode,arts:state.arts,updatedFrom:latest()?.examType||null}};
  const {data,error}=await sb.from('consultation_plans').upsert(payload,{onConflict:'student_id'}).select().single();buttons.forEach(b=>b.disabled=false);
  if(error){alert('상담 저장 실패: '+error.message);return;}state.plan=data;showToast(published?'학생 전략 탭에 공개했습니다':'비공개로 저장했습니다');
};
function studentListHtml(list){return list.map(s=>`<button class="csl-student ${state.studentId===s.id?'on':''}" data-id="${s.id}" onclick="cslOpenStudent('${s.id}')"><span class="csl-avatar">${esc((s.name||'?').slice(0,1))}</span><span><strong>${esc(s.name||'이름 미설정')}</strong><small>${esc(state.classes[s.class_id]||'반 미배정')} ${esc(s.student_no||'')}</small></span></button>`).join('');}
window.cslFilter=function(q){const v=String(q||'').toLowerCase();const list=state.students.filter(s=>`${s.name||''} ${s.student_no||''} ${state.classes[s.class_id]||''}`.toLowerCase().includes(v));const box=document.getElementById('csl-students');if(box)box.innerHTML=studentListHtml(list);};

window.renderCounsel=async function(){
  const cont=document.getElementById('counsel-content');if(!cont)return;const sb=sbReady();
  if(!sb){cont.innerHTML='<div class="csl-empty">Supabase 연결이 필요합니다.</div>';return;}
  const {data:{session}}=await sb.auth.getSession();if(!session){cont.innerHTML='<div class="csl-empty">테스트 탭에서 로그인한 뒤 상담을 이용하세요.</div>';return;}
  if(!_wprofile){const {data:p}=await sb.from('profiles').select('*').eq('id',session.user.id).maybeSingle();_wprofile=p;_wuser=session.user;}
  if(!['teacher','director'].includes(_wprofile?.role)){cont.innerHTML='<div class="csl-empty">원장·강사 전용 상담 화면입니다.</div>';return;}
  cont.innerHTML='<div class="csl-empty">상담 자료를 불러오는 중입니다.</div>';
  const [ps,cs]=await Promise.all([sb.from('profiles').select('id,name,student_no,class_id').eq('role','student').order('name'),sb.from('classes').select('id,name').order('id')]);
  state.students=ps.data||[];state.classes={};(cs.data||[]).forEach(c=>state.classes[c.id]=c.name);
  cont.innerHTML=`<div class="csl-shell"><header class="csl-top"><div><div class="csl-eyebrow">Admissions counseling</div><h1 class="csl-title">6·9월 모평 기반 대면상담</h1></div><p class="csl-help">정시 가능 대학선을 먼저 보고, 수시 수능최저 조합과 예체능 실기전형을 따로 검토합니다. 모든 결과는 상담용 추정치이며 최종 모집요강 확인이 필요합니다.</p></header><div class="csl-layout"><aside class="csl-panel csl-sidebar"><label class="csl-label" for="csl-search">학생 찾기</label><input id="csl-search" class="csl-input" placeholder="이름·반·학생번호" oninput="cslFilter(this.value)"><div id="csl-students" class="csl-student-list">${studentListHtml(state.students)}</div></aside><main id="csl-workspace" class="csl-main"><div class="csl-panel csl-empty">왼쪽에서 상담할 학생을 선택하세요.</div></main></div></div>`;
  if(state.students.length)openStudent(state.students[0].id,state.students[0].name||'이름 미설정');
};

async function injectPublishedPlan(){
  if(!_wuser||_wprofile?.role!=='student')return;const cont=document.getElementById('strategy-content');if(!cont||document.getElementById('csl-published'))return;
  const sb=sbReady();const {data}=await sb.from('consultation_plans').select('counselor_note,plan_data,updated_at').eq('student_id',_wuser.id).eq('published',true).maybeSingle();if(!data)return;
  const sec=document.createElement('section');sec.id='csl-published';sec.className='csl-published';sec.innerHTML=`<h3><i class="ti ti-message-2-check" aria-hidden="true"></i> 선생님 상담 전략</h3><p>${esc(data.counselor_note||'공개된 상담 메모가 없습니다.')}</p><div class="csl-meta">최근 상담 ${new Date(data.updated_at).toLocaleDateString('ko-KR')}</div>`;cont.insertBefore(sec,cont.firstChild);
}
const originalStrategy=window.renderStrategy;
window.renderStrategy=function(){originalStrategy();injectPublishedPlan();};

window.addEventListener('DOMContentLoaded',()=>{injectWrongInput();setTimeout(injectPublishedPlan,600);});
})();

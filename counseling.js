(function(){
'use strict';

const engine=window.CounselingEngine;
const esc=v=>String(v==null?'':v).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const order={'6월 모평':1,'7월 학평':2,'9월 모평':3,'수능':4};
const artRx=/체육|스포츠|운동|레저|골프|태권|미술|디자인|회화|조소|공예|애니|웹툰|음악|성악|피아노|관현악|무용|연극|영화/;
const state={students:[],classes:{},studentId:'',studentName:'',records:[],plan:null,mode:'regular',arts:false,scenario:null,baseExam:'',markedEarly:[],earlyLimit:8,markSaving:false,openToken:0};

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
  window._mockWrongItems[subject]={items:wrong,lost,raw,examType:selExam,sub:subject==='kor'?selKorSub:selMathSub,pointSource:'2027 평가원 정답표'};
  if(live) live.textContent=`${wrong.length}문항 · ${lost}점 감점 → 원점수 ${raw}점`;
}
window.calcRawFromWrong=calcRawFromWrong;
window.getCurrentWrongItems=function(){
  const src=window._mockWrongItems||{},out={};
  ['kor','math'].forEach(k=>{const x=src[k];if(x&&x.examType===selExam&&(k!=='kor'||x.sub===selKorSub))out[k]=x;});
  return out;
};

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
    const accountLocal=typeof readScoresLocal==='function'?readScoresLocal(_wuser.id):[];
    scores=accountLocal.slice();
    const {data,error}=await sb.from('mock_scores').select('id,score_data,updated_at').eq('student_id',_wuser.id).order('updated_at');
    if(error){renderScore();renderTrend();renderUni();renderStrategy();return;}
    const cloud=(data||[]).map(x=>Object.assign({},x.score_data,{cloudId:x.id}));
    const map=new Map(accountLocal.map(x=>[`${x.year}|${x.examType}`,x])); cloud.forEach(x=>map.set(`${x.year}|${x.examType}`,x));
    scores=[...map.values()].sort((a,b)=>(order[a.examType]||9)-(order[b.examType]||9));
    if(typeof saveScoresLocal==='function')saveScoresLocal();renderScore();renderTrend();renderUni();renderStrategy();
    for(const local of accountLocal.filter(x=>!cloud.some(c=>c.examType===x.examType&&c.year===x.year))) window.syncMockScoreRecord(local);
  }catch(e){console.warn(e);}
};

window.deleteCloudMockScore=async function(rec){
  try{const sb=sbReady();if(!sb||!_wuser)return;await sb.from('mock_scores').delete().eq('student_id',_wuser.id).eq('exam_year',Number(rec.year)||2027).eq('exam_type',rec.examType);}catch(e){console.warn(e);}
};
window.deleteAllMockScores=async function(){
  if(!confirm('모든 성적을 기기와 상담 서버에서 삭제할까요?'))return;
  const sb=sbReady();if(sb&&_wuser)await sb.from('mock_scores').delete().eq('student_id',_wuser.id);
  scores=[];if(typeof saveScoresLocal==='function')saveScoresLocal();renderScore();renderTrend();renderUni();renderStrategy();showToast('전체 성적을 삭제했습니다');
};

function gradeOptions(v){return Array.from({length:9},(_,i)=>`<option value="${i+1}" ${Number(v)===i+1?'selected':''}>${i+1}등급</option>`).join('');}
function scoreCard(r){
  if(!r)return `<div class="csl-exam"><div class="csl-empty">아직 입력된 성적이 없습니다.</div></div>`;
  const tag=r.official||r.sourceMode==='external'?'확인 점수':'추정 점수',active=state.baseExam===r.examType,encoded=encodeURIComponent(r.examType).replace(/'/g,'%27');
  return `<article class="csl-exam ${active?'selected':''}"><div class="csl-exam-top"><div class="csl-exam-name">${esc(r.examType)}</div><div class="csl-exam-badges"><span class="csl-badge ${tag==='확인 점수'?'official':'estimate'}">${tag}</span>${active?'<span class="csl-badge base">추천 기준</span>':''}</div></div><div class="csl-exam-options"><strong>응시 선택과목</strong><span>국어 ${esc(r.korSub||'미입력')} · 수학 ${esc(r.mathSub||'미입력')}</span><span>탐구 ${esc(r.sci1?.name||'미입력')} / ${esc(r.sci2?.name||'미입력')}</span></div><div class="csl-subjects">${[['국어',r.kor],['수학',r.math],['영어',r.eng],['탐구1',r.sci1],['탐구2',r.sci2]].map(([n,s])=>`<div class="csl-subject"><span>${n}</span><strong>${s&&s.gr||'-'}</strong></div>`).join('')}</div><button type="button" class="csl-exam-select ${active?'on':''}" aria-pressed="${active}" onclick="cslBaseExam(decodeURIComponent('${encoded}'))"><i class="ti ti-${active?'check':'circle'}" aria-hidden="true"></i>${active?'현재 추천 기준':'이 시험을 추천 기준으로'}</button></article>`;
}
function latest(){const counselingRecords=state.records.filter(x=>x.examType==='6월 모평'||x.examType==='9월 모평');return counselingRecords.find(x=>x.examType===state.baseExam)||counselingRecords.slice().sort((a,b)=>(order[b.examType]||0)-(order[a.examType]||0))[0]||null;}
function scenarioFrom(r){return {kor:r?.kor?.gr||5,math:r?.math?.gr||5,eng:r?.eng?.gr||5,sci1:r?.sci1?.gr||5,sci2:r?.sci2?.gr||5};}
function scenarioStd(r,s){return r?engine.scenarioSummaryStd(r,s):0;}
function scenarioPct(r,s){return r?engine.scenarioSummaryPct(r,s):0;}
function fit(diff){return engine.fit(diff);}
function renderRegular(){
  const r=latest(); if(!r)return `<div class="csl-empty">학생이 6월 또는 9월 성적을 입력하면 대학 라인이 표시됩니다.</div>`;
  const std=scenarioStd(r,state.scenario),pct=scenarioPct(r,state.scenario);
  const target=engine.scenarioRecord(r,state.scenario);
  const candidates=UNI.filter(u=>state.arts?artRx.test(`${u.n} ${u.d}`):!artRx.test(`${u.n} ${u.d}`));
  const evaluated=candidates.map(u=>({u,score:engine.scoreUniversity(u,target)}));
  const rows=evaluated.map(({u,score})=>score.compatible&&score.valid?Object.assign({u,cut:score.ref,mine:score.score},score):null).filter(Boolean).sort((a,b)=>(b.cut-a.cut)||(b.diff-a.diff));
  const blocked=evaluated.filter(x=>x.score.ineligible).length,review=rows.filter(x=>x.eligibility?.status==='review').length;
  const bonusApplied=rows.filter(x=>x.bonus?.status==='applied').length,bonusReview=rows.filter(x=>x.bonus?.status==='review').length;
  const verified=!!(r.official||r.sourceMode==='external')&&!engine.scenarioChanged(r,state.scenario);
  const groups=engine.balancedRows(rows);
  const cards=groups.map(group=>{
    const label={hard:'상향',reach:'소신',fit:'적정',safe:'안정'}[group.key];
    const list=group.rows.length?`<div class="csl-result-list">${group.rows.map(x=>{
      const f=fit(x.diff),profile=engine.selectionProfile(x.u),chance=engine.admissionChance(x.diff,{verified,useStd:x.useStd,quality:x.quality,finalAvailable:profile.finalAvailable,nonScoreShare:profile.nonScoreShare});
      const requirements=profile.requirements.length?`<div class="csl-requirements"><strong>추가 전형요소</strong>${profile.requirements.map(r=>`<div class="csl-req ${r.kind}">${esc(r.text)}</div>`).join('')}${profile.sourceUrl?`<a href="${profile.sourceUrl}" target="_blank" rel="noopener">${esc(profile.sourceLabel)} 확인</a>`:''}</div>`:'';
      const matchTone=x.match.score>1?'good':x.match.score<-1?'bad':'neutral';
      const matchSignal=`<div class="csl-match ${matchTone}"><strong>성적 궁합</strong> ${esc(x.match.label)}${x.match.score?` ${x.match.score>0?'+':''}${x.match.score}`:''}</div>`;
      const bonusSignal=x.bonus?.status==='applied'?`<div class="csl-bonus applied"><strong>선택과목 가산 반영</strong><span>${esc(x.bonus.applied.join(' · '))} · 비교점수 ${x.bonusPoints>=0?'+':''}${Math.round(x.bonusPoints*10)/10}</span></div>`:x.bonus?.status==='review'?`<div class="csl-bonus review"><strong>가산식 확인 필요</strong><span>${esc(x.bonus.text)}</span></div>`:'';
      const eligibilitySignal=x.eligibility?.status==='review'?`<div class="csl-eligibility review"><strong>지원자격 확인 필요</strong><span>${esc(x.eligibility.review.join(' · '))}</span></div>`:`<div class="csl-eligibility eligible"><strong>선택과목 조건 충족</strong><span>${esc((x.eligibility?.requirements||[]).join(' · ')||'별도 필수 선택과목 없음')}</span></div>`;
      const held=x.eligibility?.status==='review'||!profile.finalAvailable;
      const chanceTitle=held?`${esc(profile.finalAvailable?'수능 성적 부분':profile.stageLabel)} 가능성 약 ${chance.point}%`:`추정 합격률 약 ${chance.point}%`;
      const finalHold=held?`<span class="csl-final-hold">최종 합격률은 ${x.eligibility?.status==='review'?'응시조건':'추가요소'} 확인 전 산출 보류</span>`:'';
      return `<article class="csl-result"><div><div class="csl-result-name">${esc(x.u.n)}</div><div class="csl-result-dept">${esc(x.u.d)} · ${esc(x.u.g)}군 · ${esc(x.u.s)}</div><div class="csl-rule">${esc(x.u.sk||'대학별 환산 규칙 확인 필요')} · ${x.mode} · 반영 국 ${x.u.kw||0}% / 수 ${x.u.mw||0}% / 영 ${x.u.ew||0}% / 탐 ${x.u.sw||0}%${state.arts?' · 실기 반영비율·종목은 최종 모집요강 재확인':''}</div>${eligibilitySignal}${bonusSignal}${matchSignal}${requirements}</div><div class="csl-result-side"><div class="csl-fit ${f[0]}">${f[1]} <small>수능 기준</small></div><div class="csl-number">${x.diff>=0?'+':''}${Math.round(x.diff)}</div><div class="csl-meta">대학별 ${x.useStd?'표준':'백분위'} 비교차</div><div class="csl-chance"><strong>${chanceTitle}</strong><span>${chance.low}–${chance.high}% · 신뢰도 ${chance.confidence}</span>${finalHold}<i><b style="width:${chance.point}%"></b></i></div></div></article>`;
    }).join('')}</div>`:`<div class="csl-empty csl-fit-empty">현재 점수에서 ${label} 구간에 해당하는 대학 후보가 없습니다.</div>`;
    return `<section class="csl-fit-group"><div class="csl-fit-group-head"><span class="csl-fit ${group.key}">${label}</span><strong>${group.rows.length}개 추천</strong><span>전체 후보 ${group.total}개 중 상위 대학</span></div>${list}</section>`;
  }).join('');
  const selection=`수학 ${target.mathSub||'미입력'} · 탐구 ${target.sci1?.name||'미입력'} / ${target.sci2?.name||'미입력'}`;
  return `<div class="csl-selection-summary"><div><strong>입력 선택과목</strong><span>${esc(selection)}</span></div><div class="csl-selection-stats"><span class="applied">가산 반영 ${bonusApplied}</span><span class="review">가산식 확인 ${bonusReview}</span><span class="blocked">필수과목 불일치 제외 ${blocked}</span>${review?`<span class="review">응시조건 확인 ${review}</span>`:''}</div></div><div class="csl-note">${state.arts?'예체능':'일반'} 정시 라인 · 시나리오 표준합 ${Math.round(std)}점 / 백분위합 ${Math.round(pct)}점. 저장된 수학·탐구 선택과목으로 필수응시 여부를 먼저 판정한 뒤, 자동 해석 가능한 대학별 가산점을 비교점수에 반영합니다. 대학 고유 환산표나 복합 조건이 필요한 가산식은 점수를 임의 계산하지 않고 확인 대상으로 표시합니다. 상향·소신·적정·안정 안에서는 대학선을 최우선으로 두고 점수 여유와 영역별 반영비율 궁합으로 비슷한 대학을 정렬합니다. 판정은 2025 입결 70% 컷보다 양의 여유점수가 있어야 ‘적정’이 되도록 보수화했습니다. ${verified?'확인 점수 기준':'추정 점수·목표 시나리오 기준'}이며 경쟁률·충원·당해 지원 이동은 미반영입니다. <a href="https://www.adiga.kr/ucp/uvt/uni/univDetailSelection.do?menuId=PCUVTINF2000&searchSyr=2022&unvCd=0000020" target="_blank" rel="noopener">어디가 70% cut 정의</a></div>${cards||'<div class="csl-empty">조건에 맞는 대학이 없습니다.</div>'}`;
}
function isMarked(key){return state.markedEarly.some(x=>x.key===key);}
function earlyCard(x){
  const a=x.assessment,marked=isMarked(x.key),encoded=encodeURIComponent(x.key).replace(/'/g,'%27'),rule=x.e.min||x.e.note||'없음';
  const metric=a.status==='met'?`지원효율 ${a.efficiency} · ${a.rule.kind==='sum'?`현재 ${a.achieved}합 / 기준 ${a.rule.limit}합`:`충족 ${a.achieved}개 / 기준 ${a.rule.count}개`}`:'';
  return `<article class="csl-result csl-early-result ${marked?'marked':''}"><div><div class="csl-result-name">${esc(x.e.u)}</div><div class="csl-result-dept">${esc(x.e.adm)} · ${esc(x.e.cat)}</div><div class="csl-rule">수능최저/전형: ${esc(rule)}</div>${metric?`<div class="csl-efficiency">${esc(metric)} <span>난도 55% · 대학 35% · 충족여유 10%</span></div>`:''}</div><div class="csl-result-side"><div class="csl-fit ${a.fit}">${a.label}</div><div class="csl-meta">대표 입결 ${x.e.lo||'-'}등급</div><button type="button" class="csl-mark-btn ${marked?'on':''}" aria-pressed="${marked}" aria-label="${esc(x.e.u)} ${esc(x.e.adm)} 추천 ${marked?'해제':'선택'}" onclick="cslToggleEarlyMark('${encoded}')"><i class="ti ti-bookmark${marked?'-filled':''}" aria-hidden="true"></i><span>${marked?'추천됨':'추천'}</span></button></div></article>`;
}
function earlyGroup(title,desc,rows,tone){
  const shown=rows.slice(0,state.earlyLimit);
  return `<section class="csl-early-group"><div class="csl-early-head"><div><h3>${title}</h3><p>${desc}</p></div><span class="csl-count ${tone}">${rows.length}개</span></div>${shown.length?`<div class="csl-result-list">${shown.map(earlyCard).join('')}</div>`:'<div class="csl-empty csl-fit-empty">해당 조건의 추천 전형이 없습니다.</div>'}</section>`;
}
function renderEarly(){
  const rank=typeof _susiSchoolRankMap==='function'?_susiSchoolRankMap():{},all=typeof SUSI==='undefined'?[]:SUSI;
  const entries=state.arts?all.filter(e=>artRx.test(`${e.cat||''} ${e.adm||''} ${(e.majors||[]).map(m=>m.m).join(' ')}`)):all.filter(e=>!artRx.test(`${e.cat||''} ${e.adm||''}`));
  const groups=engine.rankEarlyAdmissions(entries,state.scenario,rank);
  const hasMore=[groups.met,groups.none,groups.other].some(x=>x.length>state.earlyLimit);
  return `<div class="csl-early-summary"><div><strong>학생별 추천대학</strong><span>상담 전략에 남길 전형을 최대 3개 선택하세요.</span></div><b>${state.markedEarly.length}/3</b></div><div class="csl-note">충족 추천은 최저 난도 55%·대학 수준 35%·충족 여유 10%로 계산합니다. 같은 성적에서 더 까다로운 최저를 통과하면서 대학선이 높은 전형이 먼저 보입니다. 학과별 예외·복수 조합은 자동 판정하지 않고 ‘요강 확인’으로 분리합니다.</div>${earlyGroup('최저 충족 추천','현재 목표등급으로 충족 가능한 전형을 지원 효율순으로 정렬했습니다.',groups.met,'met')}${earlyGroup('수능최저 없는 전형','수능최저 대신 서류·면접·학생부·실기 등 전형요소를 별도로 확인하세요.',groups.none,'none')}${earlyGroup('미충족·요강 확인','문장형·학과별 조건 또는 현재 목표등급으로 미충족인 전형입니다.',groups.other,'review')}${hasMore?`<button type="button" class="csl-load-more" onclick="cslLoadMoreEarly()"><i class="ti ti-plus" aria-hidden="true"></i> 추천대학 더 불러오기</button>`:''}`;
}
function scenarioHtml(){const s=state.scenario||scenarioFrom(latest());state.scenario=s;return `<div class="csl-scenario">${[['kor','국어'],['math','수학'],['eng','영어'],['sci1','탐구 1'],['sci2','탐구 2']].map(([k,n])=>`<div class="csl-grade"><label for="csl-g-${k}">${n} 목표</label><select id="csl-g-${k}" class="csl-select" onchange="cslScenario('${k}',this.value)">${gradeOptions(s[k])}</select></div>`).join('')}</div>`;}
function resultsHtml(){return state.mode==='early'?renderEarly():renderRegular();}
function refreshResults(){const el=document.getElementById('csl-results');if(el)el.innerHTML=resultsHtml();}
window.cslScenario=(k,v)=>{state.scenario[k]=Number(v);refreshResults();};
window.cslMode=(m)=>{state.mode=m;document.querySelectorAll('.csl-tab[data-mode]').forEach(x=>x.classList.toggle('on',x.dataset.mode===m));refreshResults();};
window.cslArts=(v)=>{state.arts=v==='1';refreshResults();};
window.cslLoadMoreEarly=()=>{state.earlyLimit+=8;refreshResults();};
window.cslBaseExam=async function(examType){
  if(state.baseExam===examType||!state.records.some(x=>x.examType===examType))return;
  state.baseExam=examType;state.scenario=scenarioFrom(latest());state.earlyLimit=8;renderWorkspace();
  const ok=await persistPlan(!!state.plan?.published,true);showToast(ok?`${examType} 성적을 추천 기준으로 저장했습니다`:'추천 기준 저장에 실패했습니다');
};

function planData(){return Object.assign({},state.plan?.plan_data||{},{scenario:state.scenario,mode:state.mode,arts:state.arts,baseExam:state.baseExam,updatedFrom:latest()?.examType||null,markedEarly:state.markedEarly.slice(0,3)});}
async function persistPlan(published,quiet=false){
  const sb=sbReady(),targetId=state.studentId;if(!sb||!targetId)return false;
  const note=document.getElementById('csl-note')?.value.trim()??state.plan?.counselor_note??'';
  const payload={student_id:targetId,counselor_id:_wuser.id,counselor_note:note,published,plan_data:planData()};
  const {data,error}=await sb.from('consultation_plans').upsert(payload,{onConflict:'student_id'}).select().single();
  if(error){if(!quiet)alert('상담 저장 실패: '+error.message);return false;}if(state.studentId===targetId)state.plan=data;return true;
}
window.cslToggleEarlyMark=async function(encoded){
  if(state.markSaving)return;const targetId=state.studentId,key=decodeURIComponent(encoded),before=state.markedEarly.slice(),at=before.findIndex(x=>x.key===key);
  if(at>=0)state.markedEarly=before.filter(x=>x.key!==key);
  else{
    if(before.length>=3){showToast('추천대학은 학생별 최대 3개까지 선택할 수 있습니다');return;}
    const e=(typeof SUSI==='undefined'?[]:SUSI).find(x=>engine.earlyKey(x)===key);if(!e)return;
    state.markedEarly=before.concat({key,u:e.u,adm:e.adm,cat:e.cat,min:e.min||e.note||'없음',lo:e.lo||null});
  }
  state.markSaving=true;refreshResults();
  const ok=await persistPlan(!!state.plan?.published,true);state.markSaving=false;
  if(!ok){if(state.studentId===targetId){state.markedEarly=before;refreshResults();showToast('추천대학 저장에 실패했습니다. 다시 시도해주세요.');}return;}
  showToast(at>=0?'추천대학에서 해제했습니다':'추천대학에 저장했습니다');
};

async function openStudent(id,name){
  const token=++state.openToken;state.studentId=id;state.studentName=name||(state.students.find(s=>s.id===id)?.name||'이름 미설정');document.querySelectorAll('.csl-student').forEach(x=>x.classList.toggle('on',x.dataset.id===id));
  const sb=sbReady(); const [sr,pr]=await Promise.all([sb.from('mock_scores').select('*').eq('student_id',id).order('updated_at'),sb.from('consultation_plans').select('*').eq('student_id',id).maybeSingle()]);
  if(token!==state.openToken)return;
  state.records=(sr.data||[]).map(x=>Object.assign({},x.score_data,{cloudId:x.id,sourceMode:x.source_mode}));state.plan=pr.data||null;
  const savedExam=state.plan?.plan_data?.baseExam,counselingRecords=state.records.filter(x=>x.examType==='6월 모평'||x.examType==='9월 모평'),defaultExam=counselingRecords.slice().sort((a,b)=>(order[b.examType]||0)-(order[a.examType]||0))[0]?.examType||'';
  state.baseExam=counselingRecords.some(x=>x.examType===savedExam)?savedExam:defaultExam;state.scenario=state.plan?.plan_data?.scenario||scenarioFrom(latest());state.mode=state.plan?.plan_data?.mode==='early'?'early':'regular';state.arts=!!state.plan?.plan_data?.arts;state.markedEarly=Array.isArray(state.plan?.plan_data?.markedEarly)?state.plan.plan_data.markedEarly.slice(0,3):[];state.earlyLimit=8;
  renderWorkspace();
}
window.cslOpenStudent=openStudent;
function renderWorkspace(){
  const box=document.getElementById('csl-workspace');if(!box)return;
  const june=state.records.find(x=>x.examType==='6월 모평'),sept=state.records.find(x=>x.examType==='9월 모평');
  box.innerHTML=`<section class="csl-panel csl-card"><div class="csl-card-head"><div><div class="csl-eyebrow">상담 학생</div><div class="csl-card-title">${esc(state.studentName)} 입시 전략</div><div class="csl-meta csl-card-help">응시과목을 확인하고 대학 추천에 사용할 시험을 선택하세요.</div></div><span class="csl-badge">${state.records.length}개 성적</span></div><div class="csl-score-grid">${scoreCard(june)}${scoreCard(sept)}</div></section>
  <section class="csl-panel csl-card"><div class="csl-card-head"><div class="csl-card-title">수능 목표 시나리오</div><div class="csl-meta">등급을 바꾸면 대학선이 즉시 갱신됩니다</div></div>${scenarioHtml()}</section>
  <section class="csl-panel csl-card"><div class="csl-card-head"><div class="csl-tabs"><button class="csl-tab ${state.mode==='regular'?'on':''}" data-mode="regular" onclick="cslMode('regular')">정시 우선</button><button class="csl-tab ${state.mode==='early'?'on':''}" data-mode="early" onclick="cslMode('early')">수시 최저</button></div><label class="csl-label" style="margin:0">계열 <select class="csl-select" style="width:auto;min-height:42px" onchange="cslArts(this.value)"><option value="0" ${!state.arts?'selected':''}>일반계열</option><option value="1" ${state.arts?'selected':''}>예체능·실기</option></select></label></div><div id="csl-results">${resultsHtml()}</div></section>
  <section class="csl-panel csl-card"><div class="csl-card-title">학생에게 공개할 상담 요약</div><div class="csl-note">저장만 하면 원장·강사만 볼 수 있고, ‘학생 전략 탭에 공개’를 선택해야 학생에게 표시됩니다.</div><label class="csl-label" for="csl-note" style="margin-top:12px">상담 메모</label><textarea id="csl-note" class="csl-textarea" placeholder="정시 우선 지원선, 수시 6장 구성, 수능까지 올릴 과목을 정리하세요.">${esc(state.plan?.counselor_note||'')}</textarea><div class="csl-actions"><button class="csl-btn" onclick="cslSave(false)">비공개 저장</button><button class="csl-btn primary" onclick="cslSave(true)">학생 전략 탭에 공개</button></div></section>`;
}
window.cslSave=async function(published){
  const sb=sbReady();if(!sb||!state.studentId)return;
  const buttons=document.querySelectorAll('.csl-actions button');buttons.forEach(b=>b.disabled=true);
  const ok=await persistPlan(published);buttons.forEach(b=>b.disabled=false);
  if(ok)showToast(published?'학생 전략 탭에 공개했습니다':'비공개로 저장했습니다');
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
  const marked=Array.isArray(data.plan_data?.markedEarly)?data.plan_data.markedEarly.slice(0,3):[];
  const basis=data.plan_data?.baseExam?`<div class="csl-published-basis"><i class="ti ti-target-arrow" aria-hidden="true"></i> 추천 기준 ${esc(data.plan_data.baseExam)}</div>`:'';
  const choices=marked.length?`<div class="csl-published-schools"><div class="csl-published-label">선생님 추천대학</div>${marked.map((x,i)=>`<article class="csl-published-school"><span class="csl-uni-mark" aria-hidden="true">${esc(String(x.u||'대').slice(0,1))}</span><div><strong>${i+1}순위 · ${esc(x.u)}</strong><span>${esc(x.adm)} · ${esc(x.cat)}</span></div></article>`).join('')}</div>`:'';
  const sec=document.createElement('section');sec.id='csl-published';sec.className='csl-published';sec.innerHTML=`<h3><i class="ti ti-message-2-check" aria-hidden="true"></i> 선생님 상담 전략</h3>${basis}${choices}<p>${esc(data.counselor_note||'공개된 상담 메모가 없습니다.')}</p><div class="csl-meta">최근 상담 ${new Date(data.updated_at).toLocaleDateString('ko-KR')}</div>`;cont.insertBefore(sec,cont.firstChild);
}
const originalStrategy=window.renderStrategy;
window.renderStrategy=function(){originalStrategy();injectPublishedPlan();};

window.addEventListener('DOMContentLoaded',()=>{injectWrongInput();setTimeout(injectPublishedPlan,600);});
window.addEventListener('load',async()=>{
  try{
    const sb=sbReady();if(!sb)return;const {data:{session}}=await sb.auth.getSession();if(!session)return;
    _wuser=session.user;await window.loadMyMockScores();
  }catch(e){console.warn(e);}
});
})();

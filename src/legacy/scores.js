function cutSet(){
  if(selExam==='7월 학평') return Object.assign({}, CUT2606, CUT2607);
  if(selExam==='9월 모평' && CUT2609 && Object.keys(CUT2609).length) return CUT2609;
  return CUT2606;
}
function cutIsProvisional(){ return selExam==='9월 모평'; }

// 시험별 등급컷 키 매핑
const EXAM_CUT_KEY = {'6월 모평':'26_6','7월 학평':'26_7','9월 모평':'26_9','수능':'25_수능'};

const ENG_CUTS  = [[90,1],[80,2],[70,3],[60,4],[50,5],[40,6],[30,7],[20,8],[0,9]];
const HIST_CUTS = [[40,1],[35,2],[30,3],[25,4],[20,5],[15,6],[10,7],[5,8],[0,9]];

function scoreLocalKey(userId){ return userId ? `epsilon_scores:${userId}` : 'epsilon_scores:guest'; }
function readScoresLocal(userId){ try{const parsed=JSON.parse(localStorage.getItem(scoreLocalKey(userId))||'[]');return Array.isArray(parsed)?parsed:[];}catch(e){return [];} }
function saveScoresLocal(){ const userId=(typeof _wuser!=='undefined'&&_wuser&&_wuser.id)||'';localStorage.setItem(scoreLocalKey(userId),JSON.stringify(scores)); }
let scores = readScoresLocal('');
let uniFS='전체', uniFG='전체', uniFR='전체', uniQ='', uniFC=true, uniFE='제외';
let tChart=null, pChart=null;
let selExam='9월 모평', selKorSub='화법과작문', selMathSub='확률과통계';
let selCutExam='26_9';
let officialScoreMode=false;
let cache = {kor:{s:0,p:0,g:0},math:{s:0,p:0,g:0},eng:{g:0},sci1:{s:0,p:0,g:0},sci2:{s:0,p:0,g:0},hist:{g:0}};

// ===== 자동계산 (2027학년도 6월 확정컷 · 7월/9월 추정컷 기준) =====
function getExamKey() { return EXAM_CUT_KEY[selExam] || '26_9'; }

// 이투스 원점수 등급컷으로 등급 계산
function calcGradeByRaw(cutData, raw) {
  if (!cutData || isNaN(raw) || raw < 0) return 0;
  const grades = cutData.grades;
  for (let g = 1; g <= 8; g++) {
    const cut = grades[g];
    if (cut === undefined) continue;
    // 범위형 "90~92" 처리 → 하한값 사용
    const cutMin = typeof cut === 'object' && cut.raw !== undefined
      ? (typeof cut.raw === 'string' ? parseInt(cut.raw.split('~')[0]) : cut.raw)
      : (typeof cut === 'string' ? parseInt(cut.split('~')[0]) : cut);
    if (raw >= cutMin) return g;
  }
  return 9;
}

// 이투스 원점수→등급 + CONV 표준점수/백분위
function autoCalc(subj) {
  if (subj==='kor') {
    const raw = parseInt(document.getElementById('kor_raw').value);
    const convRes = lookup(selKorSub, raw);
    const korCuts = ETOOS.국어 && ETOOS.국어[selKorSub];
    // 2026 6월 등급컷 기반 등급(convRes.gr) 우선, 없으면 작년 기준
    const useCut = (cutSet()[selKorSub]);
    const gr = (useCut && convRes) ? convRes.gr : (korCuts ? calcGradeByRaw(korCuts, raw) : (convRes ? convRes.gr : 0));
    setCalcFull('kor', convRes, gr);
    const cut1raw = (useCut && cutSet()[selKorSub][1]) ? cutSet()[selKorSub][1][0] : (korCuts && korCuts.grades[1] ? korCuts.grades[1].raw : null);
    document.getElementById('kor_cut1').textContent = cut1raw ? cut1raw+'점' : '-';
  }
  if (subj==='math') {
    const raw = parseInt(document.getElementById('math_raw').value);
    const convRes = lookup(selMathSub, raw);
    const mathCuts = ETOOS.수학 && ETOOS.수학[selMathSub];
    const useCut = (cutSet()[selMathSub]);
    const gr = (useCut && convRes) ? convRes.gr : (mathCuts ? calcGradeByRaw(mathCuts, raw) : (convRes ? convRes.gr : 0));
    setCalcFull('math', convRes, gr);
    const cut1raw = (useCut && cutSet()[selMathSub][1]) ? cutSet()[selMathSub][1][0] : (mathCuts && mathCuts.grades[1] ? mathCuts.grades[1].raw : null);
    document.getElementById('math_cut1').textContent = cut1raw ? cut1raw+'점' : '-';
  }
  if (subj==='eng') {
    const raw = parseInt(document.getElementById('eng_raw').value);
    const engCuts = ETOOS.영어 && ETOOS.영어.grades;
    let gr = 9;
    if (engCuts && !isNaN(raw)) {
      for (let g = 1; g <= 8; g++) { if (raw >= engCuts[g]) { gr = g; break; } }
    }
    const el = document.getElementById('eng_gv');
    if (!isNaN(raw) && raw >= 0) { el.textContent = gr+'등급'; el.className='ai-res-val '+gcCls(gr); cache.eng.g = gr; }
    else { el.textContent = '-'; el.className = 'ai-res-val empty'; cache.eng.g = 0; }
  }
  if (subj==='sci1') {
    const raw = parseInt(document.getElementById('sci1_raw').value);
    const name = document.getElementById('sci1_name').value;
    const convRes = name ? lookup(name, raw) : null;
    const sciCuts = name ? (ETOOS.사탐&&ETOOS.사탐[name] || ETOOS.과탐&&ETOOS.과탐[name]) : null;
    const useCut = (name && cutSet()[name]);
    const gr = (useCut && convRes) ? convRes.gr : (sciCuts ? calcGradeByRaw(sciCuts, raw) : (convRes ? convRes.gr : 0));
    setCalcFull('sci1', convRes, gr);
    const cut1raw = (useCut && cutSet()[name][1]) ? cutSet()[name][1][0] : (sciCuts && sciCuts.grades[1] ? sciCuts.grades[1].raw : null);
    document.getElementById('sci1_cut1').textContent = cut1raw ? cut1raw+'점' : '-';
  }
  if (subj==='sci2') {
    const raw = parseInt(document.getElementById('sci2_raw').value);
    const name = document.getElementById('sci2_name').value;
    const convRes = name ? lookup(name, raw) : null;
    const sciCuts = name ? (ETOOS.사탐&&ETOOS.사탐[name] || ETOOS.과탐&&ETOOS.과탐[name]) : null;
    const useCut = (name && cutSet()[name]);
    const gr = (useCut && convRes) ? convRes.gr : (sciCuts ? calcGradeByRaw(sciCuts, raw) : (convRes ? convRes.gr : 0));
    setCalcFull('sci2', convRes, gr);
    const cut1raw = (useCut && cutSet()[name][1]) ? cutSet()[name][1][0] : (sciCuts && sciCuts.grades[1] ? sciCuts.grades[1].raw : null);
    document.getElementById('sci2_cut1').textContent = cut1raw ? cut1raw+'점' : '-';
  }
  if (subj==='hist') {
    const raw = parseInt(document.getElementById('hist_raw').value);
    const histCuts = ETOOS.한국사 && ETOOS.한국사.grades;
    let gr = 9;
    if (histCuts && !isNaN(raw)) {
      for (let g = 1; g <= 8; g++) { if (raw >= histCuts[g]) { gr = g; break; } }
    }
    const el = document.getElementById('hist_gv');
    if (!isNaN(raw) && raw >= 0) { el.textContent = gr+'등급'; el.className='ai-res-val '+gcCls(gr); cache.hist.g = gr; }
    else { el.textContent = '-'; el.className = 'ai-res-val empty'; cache.hist.g = 0; }
  }
}

// 2026 6월 모평 등급컷 앵커로 표준점수·백분위 선형보간 역산
function interpCut(anchors, raw){
  // anchors: [[원점수,표준,백분위],...] 원점수 내림차순
  if(raw>=anchors[0][0]) return {std:anchors[0][1], pct:anchors[0][2]};
  const last=anchors[anchors.length-1];
  if(raw<=last[0]){
    // 8등급컷 아래: 7→8컷 구간 기울기로 외삽 (하한·범위 클램프)
    const prev=anchors[anchors.length-2]||last;
    const span=prev[0]-last[0];
    if(span>0 && raw<last[0]){
      const t=(last[0]-raw)/span;
      const std=Math.max(Math.round(last[1]-t*(prev[1]-last[1])), 20);
      const pct=Math.min(100, Math.max(0, Math.round(last[2]-t*(prev[2]-last[2]))));
      return {std:std, pct:pct};
    }
    return {std:last[1], pct:last[2]};
  }
  for(let i=0;i<anchors.length-1;i++){
    const hi=anchors[i], lo=anchors[i+1];
    if(raw<=hi[0] && raw>=lo[0]){
      if(hi[0]===lo[0]) return {std:hi[1], pct:hi[2]};
      const t=(raw-lo[0])/(hi[0]-lo[0]);
      return {std:Math.round(lo[1]+t*(hi[1]-lo[1])), pct:Math.min(100,Math.max(0,Math.round(lo[2]+t*(hi[2]-lo[2]))))};
    }
  }
  return {std:last[1], pct:last[2]};
}
// 등급컷 앵커로 등급 산정 (1~8등급컷 원점수 기준)
function gradeFromCut(anchors, raw){
  // anchors[1..8] = 1~8등급컷. anchors[0]은 최고점
  for(let g=1;g<=8;g++){
    if(anchors[g] && raw>=anchors[g][0]) return g;
  }
  return 9;
}
function lookup(name, raw) {
  if(isNaN(raw)||raw<0) return null;
  // 9월 모평: 공개된 가채점 등급컷 앵커 사이를 선형 보간한 예상 변환값.
  // 공식 성적표 입력 시 이 값은 사용하지 않고 사용자가 입력한 확정값을 보존한다.
  if(selExam==='9월 모평' && CUT2609[name]){
    const ip=interpCut(CUT2609[name],raw);
    return {std:ip.std,pct:ip.pct,gr:gradeFromCut(CUT2609[name],raw),estimated:true};
  }
  // 2026 6월 등급컷이 있으면 보간 역산 우선
  if(cutSet()[name]){
    const a=cutSet()[name];
    const ip=interpCut(a, raw);
    const gr=gradeFromCut(a, raw);
    return {std:ip.std, pct:ip.pct, gr:gr};
  }
  // 폴백: 기존 변환표
  const t=CONV[name]; if(!t) return null;
  const e=t[String(raw)]; if(!e) return null;
  return {std:e[0],pct:e[1],gr:e[2]};
}

function setCalc(subj, res) { setCalcFull(subj, res, res ? res.gr : 0); }
function setCalcFull(subj, res, gr) {
  const stdEl=document.getElementById(subj+'_std');
  const pctEl=document.getElementById(subj+'_pct');
  const grEl=document.getElementById(subj+'_gv');
  const srcEl=document.getElementById(subj+'_src');
  if(officialScoreMode && res){
    cache[subj].g=gr;
    if(gr && gr>0) { grEl.textContent=gr+'등급'; grEl.className='ai-res-val '+gcCls(gr); }
    else { grEl.textContent='-'; grEl.className='ai-res-val empty'; }
    return;
  }
  if(res && res.std) {
    stdEl.value=res.std; pctEl.value=res.pct;
    if(srcEl){ srcEl.style.display='inline-flex'; srcEl.textContent=res.estimated?'≈ 추정변환':'⚡ 자동계산'; }
    cache[subj]={s:res.std,p:res.pct,g:gr};
  } else {
    stdEl.value=''; pctEl.value='';
    if(srcEl) srcEl.style.display='none';
    cache[subj]={s:0,p:0,g:gr};
  }
  if(gr && gr>0) { grEl.textContent=gr+'등급'; grEl.className='ai-res-val '+gcCls(gr); }
  else { grEl.textContent='-'; grEl.className='ai-res-val empty'; }
}

function toggleOfficialScoreMode(enabled){
  officialScoreMode=!!enabled;
  ['kor','math','sci1','sci2'].forEach(subj=>{
    ['std','pct'].forEach(kind=>{
      const el=document.getElementById(subj+'_'+kind); if(!el)return;
      el.readOnly=!officialScoreMode;
      el.style.background=officialScoreMode?'#fff':'transparent';
      el.placeholder=officialScoreMode?'직접 입력':'원점수 입력';
    });
    if(!officialScoreMode){
      const raw=document.getElementById(subj+'_raw');
      if(raw&&raw.value) autoCalc(subj);
    }
  });
  showToast(officialScoreMode?'확인한 표준점수를 입력하세요':'가채점 추정 모드로 전환했습니다');
}

function manualScoreInput(subj){
  if(!officialScoreMode)return;
  const s=parseInt(document.getElementById(subj+'_std').value)||0;
  const p=parseInt(document.getElementById(subj+'_pct').value)||0;
  cache[subj].s=s; cache[subj].p=p;
}

function gcCls(g){if(g===1)return 'gc1';if(g===2)return 'gc2';if(g<=4)return 'gc3';if(g<=6)return 'gc4';return 'gc5';}
function grColor(g){if(g===1)return '#1d4ed8';if(g===2)return '#065f46';if(g<=4)return '#92400e';if(g<=6)return '#5b21b6';return '#991b1b';}

// ===== TOGGLES =====
function initToggles() {
  document.querySelectorAll('.tgl').forEach(grp=>{
    grp.querySelectorAll('.tb').forEach(btn=>{
      btn.onclick=function(){
        if(this.classList.contains('disabled')) return;
        grp.querySelectorAll('.tb').forEach(b=>b.classList.remove('on'));
        this.classList.add('on');
        const v=this.dataset.v;
        if(grp.id==='examTypeG'){selExam=v; updateCutInfo(); if(cutIsProvisional()) showToast('9월 모평 가채점 추정컷을 적용합니다'); if(v==='7월 학평') showToast('7월 학평은 추정 등급컷 기준입니다 (확정 발표 전)');}
        if(grp.id==='korSubG'){selKorSub=v; if(document.getElementById('kor_raw').value) autoCalc('kor');}
        if(grp.id==='mathSubG'){selMathSub=v; if(document.getElementById('math_raw').value) autoCalc('math');}
      };
    });
  });
}

function updateCutInfo() {
  const cs = cutSet();
  const kd = ETOOS.국어 && ETOOS.국어[selKorSub];
  const md = ETOOS.수학 && ETOOS.수학[selMathSub];
  const kc1 = (cs[selKorSub] && cs[selKorSub][1]) ? cs[selKorSub][1][0] : (kd && kd.grades && kd.grades[1] ? kd.grades[1].raw : null);
  const mc1 = (cs[selMathSub] && cs[selMathSub][1]) ? cs[selMathSub][1][0] : (md && md.grades && md.grades[1] ? md.grades[1].raw : null);
  const e1=document.getElementById('kor-cut-info');
  const e2=document.getElementById('math-cut-info');
  if(e1) e1.textContent = kc1 ? `1등급 ${kc1}점↑` : '';
  if(e2) e2.textContent = mc1 ? `1등급 ${mc1}점↑` : '';
  const k1el=document.getElementById('kor_cut1'); if(k1el) k1el.textContent=kc1?kc1+'점':'-';
  const m1el=document.getElementById('math_cut1'); if(m1el) m1el.textContent=mc1?mc1+'점':'-';
}

// ===== SAVE =====
function saveScore(nextPage) {
  const korRaw=parseInt(document.getElementById('kor_raw').value)||0;
  const mathRaw=parseInt(document.getElementById('math_raw').value)||0;
  if(!korRaw&&!mathRaw){showToast('국어 또는 수학 원점수를 입력해주세요');return false;}
  if(officialScoreMode&&(!cache.kor.s||!cache.math.s)){
    showToast('국어·수학 표준점수를 입력해주세요');
    return false;
  }
  const sci1Name=document.getElementById('sci1_name').value;
  const sci2Name=document.getElementById('sci2_name').value;
  if(officialScoreMode&&((sci1Name&&!cache.sci1.s)||(sci2Name&&!cache.sci2.s))){
    showToast('선택한 탐구 과목의 표준점수를 입력해주세요');
    return false;
  }
  const rec={
    id:Date.now(), examType:selExam, year:'2027', official:officialScoreMode,
    korSub:selKorSub, mathSub:selMathSub,
    kor:{raw:korRaw,std:cache.kor.s,pct:cache.kor.p,gr:cache.kor.g},
    math:{raw:parseInt(document.getElementById('math_raw').value)||0,std:cache.math.s,pct:cache.math.p,gr:cache.math.g},
    eng:{raw:parseInt(document.getElementById('eng_raw').value)||0,gr:cache.eng.g},
    sci1:{name:document.getElementById('sci1_name').value,raw:parseInt(document.getElementById('sci1_raw').value)||0,std:cache.sci1.s,pct:cache.sci1.p,gr:cache.sci1.g},
    sci2:{name:document.getElementById('sci2_name').value,raw:parseInt(document.getElementById('sci2_raw').value)||0,std:cache.sci2.s,pct:cache.sci2.p,gr:cache.sci2.g},
    hist:{raw:parseInt(document.getElementById('hist_raw').value)||0,gr:cache.hist.g},
    wrongItems: window.getCurrentWrongItems ? window.getCurrentWrongItems() : {},
    sourceMode: officialScoreMode ? 'external' : ((window.getCurrentWrongItems&&Object.keys(window.getCurrentWrongItems()).length)?'wrong_items':'estimated')
  };
  scores.push(rec);
  scores.sort((a,b)=>{const o=['6월 모평','7월 학평','9월 모평','수능'];return o.indexOf(a.examType)-o.indexOf(b.examType);});
  saveScoresLocal();
  if(window.syncMockScoreRecord) window.syncMockScoreRecord(rec);
  showToast('✅ 성적이 저장되었습니다');
  renderScore(); renderTrend(); renderUni();
  renderStrategy();
  showPage(nextPage==='uni'?'uni':'score');
  return true;
}

function calcTotal(r){return (r.kor.std||0)+(r.math.std||0)+(r.sci1.std||0)+(r.sci2.std||0);}

// ===== RENDER SCORE =====
function renderScore() {
  const cont=document.getElementById('score-content');
  if(!scores.length){cont.innerHTML='<div class="empty"><div class="empty-icon">📋</div><div class="empty-text"><strong>원점수만 입력하면</strong><br>표준점수·백분위·등급을<br>자동으로 계산해드려요</div></div>';return;}
  const r=scores[scores.length-1];
  const tot=calcTotal(r);

  let html=`
  <div class="score-banner">
    <div class="exam-lbl">2027학년도 ${r.examType} · ${r.korSub} / ${r.mathSub}</div>
    <div class="total-num">${tot}</div>
    <div class="total-sub">국수탐 표준점수 합산 (영어제외) · ${r.official?'공식 정밀':'가채점 추정'}</div>
    <div class="stat-row">
      ${si(r.kor.gr,'국어')}${si(r.math.gr,'수학')}${si(r.eng.gr,'영어')}
      ${Ui.escape(r.sci1.name?si(r.sci1.gr,r.sci1.name.slice(0,4)):'')}
      ${Ui.escape(r.sci2.name?si(r.sci2.gr,r.sci2.name.slice(0,4)):'')}
    </div>
  </div>

  <div class="card">
    <div class="card-title">과목별 상세</div>
    <div class="subj-grid">
      ${sc('sc-kor','국어',r.kor.std,r.kor.raw,r.kor.pct,r.kor.gr)}
      ${sc('sc-math','수학',r.math.std,r.math.raw,r.math.pct,r.math.gr)}
      ${sc('sc-eng','영어',null,r.eng.raw,null,r.eng.gr,'절대평가')}
      ${Ui.escape(r.sci1.name?sc('sc-sci',r.sci1.name,r.sci1.std,r.sci1.raw,r.sci1.pct,r.sci1.gr):'')}
      ${Ui.escape(r.sci2.name?sc('sc-sci',r.sci2.name,r.sci2.std,r.sci2.raw,r.sci2.pct,r.sci2.gr):'')}
      ${sc('sc-hist','한국사',null,r.hist.raw,null,r.hist.gr,'절대평가')}
    </div>
    <div class="src">📊 ${r.official?'공식 성적통지표 직접 입력값':(r.examType==='9월 모평'?'EBSi 가채점 추정컷 앵커를 선형 보간한 예상값(2026.09.02 20시 기준)':'시험별 원점수→표준점수 변환 참고표')}</div>
  </div>

  <div class="card">
    <div class="sec-title">표준점수</div>
    ${bar('국어',r.kor.std,145,'#2563eb')}
    ${bar('수학',r.math.std,145,'#d97706')}
    ${Ui.escape(r.sci1.name?bar(r.sci1.name,r.sci1.std,80,'#7c3aed'):'')}
    ${Ui.escape(r.sci2.name?bar(r.sci2.name,r.sci2.std,80,'#be185d'):'')}
  </div>

  <div class="card">
    <div class="sec-title">백분위</div>
    ${pbar('국어',r.kor.pct,'#2563eb')}
    ${pbar('수학',r.math.pct,'#d97706')}
    ${Ui.escape(r.sci1.name?pbar(r.sci1.name,r.sci1.pct,'#7c3aed'):'')}
    ${Ui.escape(r.sci2.name?pbar(r.sci2.name,r.sci2.pct,'#be185d'):'')}
  </div>`;

  if(scores.length>1){
    const prev=scores[scores.length-2];
    const diff=tot-calcTotal(prev);
    html+=`<div class="card"><div class="sec-title">직전 시험 대비</div>
    <div style="display:flex;gap:10px;align-items:center;">
      <div class="diff-box" style="flex:1;"><div style="font-size:9px;color:var(--t3);margin-bottom:3px;">${prev.examType}</div>
        <div class="diff-num" style="color:var(--t2);">${calcTotal(prev)}</div></div>
      <div style="font-size:18px;color:${diff>=0?'var(--a3)':'var(--red)'};">${diff>=0?'▲':'▼'}</div>
      <div class="diff-box" style="flex:1;border-color:var(--accent-mid);background:var(--accent-light);">
        <div style="font-size:9px;color:var(--accent);margin-bottom:3px;">${r.examType}</div>
        <div class="diff-num" style="color:var(--accent);">${tot}</div></div>
    </div>
    <div style="text-align:center;margin-top:10px;font-family:'Space Mono',monospace;font-size:14px;font-weight:700;color:${diff>=0?'var(--a3)':'var(--red)'};">${diff>=0?'+':''}${diff}점</div>
    </div>`;
  }
  cont.innerHTML=html;
}

function si(g,l){return `<div class="stat-item"><div class="sval">${g||'-'}<small style="font-size:9px;">등급</small></div><div class="slbl">${l}</div></div>`;}
function sc(cls,name,std,raw,pct,gr,note=''){
  const c=gcCls(gr);
  return `<div class="sc ${cls}"><div class="sc-name">${Ui.escape(name)}</div><div class="sc-std">${std||'-'}</div><div class="sc-detail">원점: ${raw||'-'} · 백분위: ${pct&&pct>0?pct+'%':'-'}</div><span class="gc ${c}">${gr?gr+'등급':note||'-'}</span></div>`;
}
function bar(l,v,max,color){const p=Math.min(100,((v||0)/max)*100);return `<div class="bar-wrap"><div class="bar-top"><span class="bar-lbl">${l}</span><span class="bar-val" style="color:${color};">${v||'-'}</span></div><div class="bar-track"><div class="bar-fill" style="width:${p}%;background:${color};"></div></div></div>`;}
function pbar(l,v,color){return `<div class="bar-wrap"><div class="bar-top"><span class="bar-lbl">${l}</span><span class="bar-val" style="color:${color};">${v&&v>0?v+'%':'-'}</span></div><div class="bar-track"><div class="bar-fill" style="width:${Math.min(100,v||0)}%;background:${color};"></div></div></div>`;}

// ===== RENDER TREND =====
function renderTrend(){
  const cont=document.getElementById('trend-content');
  if(!scores.length){cont.innerHTML='<div class="empty"><div class="empty-icon">📈</div><div class="empty-text">데이터 없음</div></div>';return;}
  const labels=scores.map(s=>s.examType);
  cont.innerHTML=`
  <div class="card"><div class="sec-title">표준점수 추이</div><div class="chart-wrap"><canvas id="tc"></canvas></div></div>
  <div class="card"><div class="sec-title">백분위 추이</div><div class="chart-wrap"><canvas id="pc"></canvas></div></div>
  <div class="card"><div class="sec-title">응시 기록</div>
    ${scores.map(r=>`<div class="hi"><div class="hi-top">
      <div><div class="hi-name">2027학년도 ${r.examType}</div><div class="hi-date">${r.korSub}·${r.mathSub}</div></div>
      <div style="text-align:right;"><div class="hi-score">${calcTotal(r)}</div>
        <button class="btn-sm" onclick="delScore(${r.id})" style="margin-top:4px;">삭제</button></div>
    </div>
    <div class="chips">
      <span class="chip" style="color:#1d4ed8;">국${r.kor.std||'-'}(${r.kor.gr||'-'}등)</span>
      <span class="chip" style="color:#d97706;">수${r.math.std||'-'}(${r.math.gr||'-'}등)</span>
      <span class="chip" style="color:#059669;">영${r.eng.gr||'-'}등급</span>
      ${r.sci1.name?`<span class="chip" style="color:#7c3aed;">${Ui.escape(r.sci1.name.slice(0,3))} ${r.sci1.std||'-'}</span>`:''}
      ${r.sci2.name?`<span class="chip" style="color:#be185d;">${Ui.escape(r.sci2.name.slice(0,3))} ${r.sci2.std||'-'}</span>`:''}
    </div></div>`).join('')}
  </div>`;

  setTimeout(()=>{
    const opt={responsive:true,maintainAspectRatio:false,
      plugins:{legend:{labels:{color:'#475569',font:{size:10},boxWidth:10}}},
      scales:{x:{ticks:{color:'#94a3b8',font:{size:9}},grid:{color:'#f1f5f9'}},y:{ticks:{color:'#94a3b8'},grid:{color:'#f1f5f9'}}}};
    if(tChart)tChart.destroy();
    const c1=document.getElementById('tc');
    if(c1)tChart=new Chart(c1,{type:'line',data:{labels,datasets:[
      {label:'국어',data:scores.map(s=>s.kor.std||0),borderColor:'#2563eb',backgroundColor:'rgba(37,99,235,.08)',tension:.4,pointRadius:5,pointBackgroundColor:'#2563eb',fill:true},
      {label:'수학',data:scores.map(s=>s.math.std||0),borderColor:'#d97706',backgroundColor:'rgba(217,119,6,.08)',tension:.4,pointRadius:5,pointBackgroundColor:'#d97706',fill:true},
      {label:'탐구1',data:scores.map(s=>s.sci1.std||0),borderColor:'#7c3aed',backgroundColor:'rgba(124,58,237,.08)',tension:.4,pointRadius:5,pointBackgroundColor:'#7c3aed',fill:true},
    ]},options:{...opt,scales:{...opt.scales,y:{...opt.scales.y,min:40,max:155}}}});
    if(pChart)pChart.destroy();
    const c2=document.getElementById('pc');
    if(c2)pChart=new Chart(c2,{type:'line',data:{labels,datasets:[
      {label:'국어',data:scores.map(s=>s.kor.pct||0),borderColor:'#2563eb',tension:.4,pointRadius:5,pointBackgroundColor:'#2563eb'},
      {label:'수학',data:scores.map(s=>s.math.pct||0),borderColor:'#d97706',tension:.4,pointRadius:5,pointBackgroundColor:'#d97706'},
      {label:'탐구1',data:scores.map(s=>s.sci1.pct||0),borderColor:'#7c3aed',tension:.4,pointRadius:5,pointBackgroundColor:'#7c3aed'},
    ]},options:{...opt,scales:{...opt.scales,y:{...opt.scales.y,min:0,max:100}}}});
  },80);
}
async function delScore(id){if(!confirm('이 성적을 삭제할까요?'))return;const epoch=SessionGuard.capture(),removed=scores.find(s=>s.id===id||s.cloudId===id);if(!removed)return;if(AppSession.context()?.operations==='legacy-compatible-v1'){if(!window.deleteCloudMockScore||!await window.deleteCloudMockScore(removed))return;SessionGuard.assert(epoch);}else if(window.deleteCloudMockScore)void window.deleteCloudMockScore(removed);scores=scores.filter(s=>s.id!==id&&s.cloudId!==id);saveScoresLocal();renderScore();renderTrend();renderUni();if(document.getElementById('pg-strategy').classList.contains('on'))renderStrategy();showToast('삭제되었습니다');}

// ===== RENDER GRADE CUTS =====
function setCutExam(ek){ selCutExam=ek; renderGradeCuts(); }

function renderGradeCuts() {
  const cont = document.getElementById('cut-content');

  const GC = ['#1d4ed8','#065f46','#92400e','#5b21b6','#991b1b','#6b7280','#374151','#374151'];

  // 원점수 중심 카드: 등급 | 원점수컷 | 표준 | 백분위
  function subjCard(title, data, isAbsolute=false) {
    if (!data) return '';
    const avgLine = data.avg_raw
      ? `<div style="font-size:9px;color:var(--t3);margin:0 0 7px;padding:5px 7px;background:var(--bg);border-radius:6px;border:1px solid var(--border);">응시자 평균 원점수 <strong>${data.avg_raw}</strong>점 · 평균 표준점수 <strong>${data.avg_std}</strong>점</div>`
      : '';

    const grades = [1,2,3,4,5,6,7,8];
    const rows = grades.map(g => {
      const d = data.grades[g];
      if (!d) return '';
      const raw = typeof d === 'object' ? d.raw : d;
      const std = typeof d === 'object' ? (d.std ?? '-') : '-';
      const pct = typeof d === 'object' ? (d.pct != null ? d.pct+'%' : '-') : '-';
      const rawDisp = typeof raw === 'string' ? raw+'점' : raw+'점↑';
      return `<tr>
        <td style="font-weight:700;font-size:11px;color:${GC[g-1]};padding:6px 8px;border-bottom:1px solid var(--border);">${g}등급</td>
        <td style="font-family:'Space Mono',monospace;font-size:12px;font-weight:700;padding:6px 8px;border-bottom:1px solid var(--border);color:var(--text);">${rawDisp}</td>
        ${!isAbsolute ? `<td style="font-family:'Space Mono',monospace;font-size:11px;padding:6px 8px;border-bottom:1px solid var(--border);color:var(--accent);">${std}</td>
        <td style="font-family:'Space Mono',monospace;font-size:11px;padding:6px 8px;border-bottom:1px solid var(--border);color:var(--t2);">${pct}</td>` : ''}
      </tr>`;
    }).join('');

    const headerExtra = !isAbsolute
      ? '<th style="padding:6px 8px;font-size:9px;color:var(--accent);font-weight:700;text-align:center;">표준점수</th><th style="padding:6px 8px;font-size:9px;color:var(--t3);font-weight:700;text-align:center;">백분위</th>'
      : '';

    return `<div style="margin-bottom:16px;">
      <div style="font-size:12px;font-weight:700;color:var(--text);margin-bottom:8px;">${Ui.escape(title)}${isAbsolute?'<span style="font-size:9px;font-weight:400;color:var(--t3);margin-left:4px;">절대평가</span>':''}</div>
      ${avgLine}
      <table style="width:100%;border-collapse:collapse;">
        <thead><tr style="background:var(--bg);">
          <th style="padding:6px 8px;font-size:9px;color:var(--t3);font-weight:700;text-align:left;border-bottom:2px solid var(--border);">등급</th>
          <th style="padding:6px 8px;font-size:9px;color:var(--text);font-weight:700;text-align:center;border-bottom:2px solid var(--border);">원점수 기준</th>
          ${headerExtra}
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
  }

  const isSep = selCutExam==='26_9';
  const activeCuts = isSep ? CUT2609 : CUT2606;
  const toDisplay = name => {
    const a=activeCuts[name]; if(!a) return null;
    const grades={};
    for(let g=1;g<=8;g++) if(a[g]) grades[g]={raw:a[g][0],std:a[g][1],pct:a[g][2]};
    return {grades};
  };
  const kor = {'화법과작문':toDisplay('화법과작문'),'언어와매체':toDisplay('언어와매체')};
  const math = {'확률과통계':toDisplay('확률과통계'),'미적분':toDisplay('미적분'),'기하':toDisplay('기하')};
  const satNames=['생활과윤리','윤리와사상','한국지리','세계지리','동아시아사','세계사','경제','정치와법','사회문화'];
  const sciNames=['물리학Ⅰ','화학Ⅰ','생명과학Ⅰ','지구과학Ⅰ','물리학Ⅱ','화학Ⅱ','생명과학Ⅱ','지구과학Ⅱ'];
  const sat=Object.fromEntries(satNames.map(n=>[n,toDisplay(n)]));
  const sci=Object.fromEntries(sciNames.map(n=>[n,toDisplay(n)]));

  cont.innerHTML = `
  <div class="tgl" style="margin-bottom:10px;">
    <div class="tb ${!isSep?'on':''}" onclick="setCutExam('26_6')">6월 확정컷</div>
    <div class="tb ${isSep?'on':''}" onclick="setCutExam('26_9')">9월 추정컷</div>
  </div>
  <div style="background:var(--accent);border-radius:12px;padding:14px 16px;margin-bottom:14px;color:white;display:flex;align-items:center;justify-content:space-between;">
    <div>
      <div style="font-size:10px;opacity:.75;margin-bottom:3px;">${isSep?'출처 · EBSi 2026.09.02 20시 가채점':'출처 · 평가원 확정 표점 + 입시기관 종합'}</div>
      <div style="font-size:15px;font-weight:800;">2027학년도 ${isSep?'9월 모평 등급컷 (추정)':'6월 모평 등급컷 (확정)'}</div>
      <div style="font-size:10px;opacity:.7;margin-top:3px;">원점수 기준 · 표준점수 · 백분위 포함</div>
    </div>
    <div style="font-size:28px;">📊</div>
  </div>

  <div class="card">
    <div class="card-title">🔵 국어</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">
      ${subjCard('화법과작문', kor&&kor['화법과작문'])}
      ${subjCard('언어와매체', kor&&kor['언어와매체'])}
    </div>
  </div>

  <div class="card">
    <div class="card-title">🟡 수학</div>
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;">
      ${subjCard('확률과통계', math&&math['확률과통계'])}
      ${subjCard('미적분', math&&math['미적분'])}
      ${subjCard('기하', math&&math['기하'])}
    </div>
  </div>

  <div class="card">
    <div class="card-title" style="margin-bottom:14px;">🟢 영어 &nbsp;·&nbsp; 🟠 한국사</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">
      ${subjCard('영어', ETOOS.영어, true)}
      ${subjCard('한국사', ETOOS.한국사, true)}
    </div>
  </div>

  <div class="card">
    <div class="card-title">🟣 사회탐구</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">
      ${satNames.map(s => subjCard(s, sat&&sat[s])).join('')}
    </div>
  </div>

  <div class="card">
    <div class="card-title">🔬 과학탐구</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">
      ${sciNames.map(s => subjCard(s, sci&&sci[s])).join('')}
    </div>
  </div>

  <div style="background:var(--accent-light);border:1px solid var(--accent-mid);border-radius:9px;padding:12px 13px;font-size:10px;color:#1e40af;line-height:1.9;margin-bottom:16px;">
    <strong>📌 등급컷 안내</strong><br>
    ${isSep?'• 국어·수학 원점수·표준점수·백분위는 EBSi 가채점 추정치<br>• 탐구 원점수는 실시간 추정치, 표준점수·백분위는 6월 동일 등급 앵커를 사용한 참고값<br>• 9월 29일 성적 통지 후 확정값으로 교체 예정':'• 국어·수학: 평가원 확정 표준점수 기준 · 원점수 컷은 입시기관 종합 역산치<br>• 국어·수학·탐구: 표준점수·백분위 참고값 포함'}<br>
    • 영어·한국사: 절대평가, 원점수로만 등급 결정
  </div>`;
}

// ===== RENDER UNI =====
// ===== 대학별 점수 계산 =====
// 영어 등급 → 백분위/표준 근사 환산 (대학마다 다르지만 일반적 근사치)
function engApprox(gr, useStd){
  // 영어 절대평가 등급별 근사 백분위 (1등급≈99, 2등급≈90 ...)
  const pctMap={1:99,2:90,3:80,4:67,5:50,6:35,7:20,8:10,9:3};
  const stdMap={1:133,2:124,3:115,4:106,5:97,6:88,7:79,8:70,9:61};
  const g=gr||9;
  return useStd?(stdMap[g]||61):(pctMap[g]||3);
}
// 학생 과목별 점수 (탐구 2과목: 표준 합산, 백분위 평균 / 1과목: 단일)
function subjScore(u,r,useStd){
  const s1=useStd?(r.sci1.std||0):(r.sci1.pct||0);
  const s2=useStd?(r.sci2.std||0):(r.sci2.pct||0);
  let tam;
  if(u.sc>=2){ tam = useStd ? (s1+s2) : Math.round((s1+s2)/2); } // 백분위는 평균
  else { tam = s1; }
  return {
    국:useStd?(r.kor.std||0):(r.kor.pct||0),
    수:useStd?(r.math.std||0):(r.math.pct||0),
    영:engApprox(r.eng&&r.eng.gr,useStd),
    탐:tam
  };
}
// 반영영역(고정+택)에 따라 학생 점수 합 계산
// engMode: 'exc'(영어 선택지에서 제외) / 'inc'(영어 선택지 포함)
function calcAreaScore(u,r,useStd,engMode){
  const sc=subjScore(u,r,useStd);
  const val=c=> c==='국'?sc.국 : c==='수'?sc.수 : c==='탐'?sc.탐 : c==='영'?sc.영 : 0;
  let total=0;
  const fx=u.fx||'';
  for(const c of fx){ if(c==='국'||c==='수'||c==='탐') total+=val(c); else if(c==='영'&&engMode==='inc') total+=val('영'); }
  if(u.ch){
    for(const grp of u.ch){
      const cand=grp[0], pick=grp[1];
      const pool=[];
      for(const c of cand){
        if(c==='국'||c==='수'||c==='탐') pool.push(val(c));
        else if(c==='영'&&engMode==='inc') pool.push(val('영'));
        // engMode==='exc'이면 영어 후보 제외
      }
      pool.sort((a,b)=>b-a);
      for(let i=0;i<pick&&i<pool.length;i++) total+=pool[i];
    }
  }
  return total;
}
// 반영영역 개수 (평균백분위 산출용 — 실입결 비교)
function calcAreaCount(u,engMode){
  let cnt=0; const fx=u.fx||'';
  for(const c of fx){ if(c==='국'||c==='수'||c==='탐') cnt++; else if(c==='영'&&engMode==='inc') cnt++; }
  if(u.ch){ for(const grp of u.ch){ let pool=0; for(const c of grp[0]){ if(c==='국'||c==='수'||c==='탐') pool++; else if(c==='영'&&engMode==='inc') pool++; } cnt+=Math.min(grp[1],pool); } }
  return cnt;
}
function calcUniScore(u,r){
  const useStd=u.ind==='표준'||u.ind==='표+백';
  // 영어선택(et='o')은 현재 필터 모드에 따라, 그 외엔 영어제외 기준(영어 합산 안함)
  const mode=(u.et==='o'&&typeof uniFE!=='undefined'&&uniFE==='포함')?'inc':'exc';
  return calcAreaScore(u,r,useStd,mode);
}
function calcUniRef(u){
  const useStd=u.ind==='표준'||u.ind==='표+백';
  return useStd?u.std:u.pct;
}
function checkCompat(u,r){
  if(u.mr&&r.mathSub==='확률과통계') return false;
  const saTam=['생활과윤리','윤리와사상','한국지리','세계지리','동아시아사','세계사','경제','정치와법','사회문화'];
  const kwaTam=['물리','화학','생명과학','지구과학'];
  const isSa=n=>n&&saTam.some(s=>n.includes(s));
  const isKwa=n=>n&&kwaTam.some(s=>n.includes(s));
  const s1=r.sci1.name||'', s2=r.sci2.name||'';
  if(u.sr===1&&(isSa(s1)||isSa(s2))) return false; // 과탐 필수인데 사탐 응시
  if(u.sr===2&&(isKwa(s1)||isKwa(s2))) return false; // 사탐 필수인데 과탐 응시
  return true;
}

function renderUni(){
  const cont=document.getElementById('uni-content');
  if(!scores.length){cont.innerHTML='<div class="empty"><div class="empty-icon">🏫</div><div class="empty-text">성적을 먼저 입력해주세요</div></div>';return;}
  const r=scores[scores.length-1];
  const tot=calcTotal(r);
  // 백분위: 탐구 2과목이면 평균
  const tamPctAvg = (r.sci2.pct||r.sci2.name) ? Math.round(((r.sci1.pct||0)+(r.sci2.pct||0))/2) : (r.sci1.pct||0);
  const pctTot=(r.kor.pct||0)+(r.math.pct||0)+tamPctAvg;
  const isMirk=r.mathSub==='미적분'||r.mathSub==='기하';

  let filtered=UNI.filter(u=>u.std>0);
  if(uniFS!=='전체') filtered=filtered.filter(u=>u.s===uniFS.slice(0,2));
  if(uniFG!=='전체') filtered=filtered.filter(u=>u.g===uniFG);
  if(uniFR!=='전체'){
    if(uniFR==='서울') filtered=filtered.filter(u=>u.r==='서울');
    else if(uniFR==='수도권') filtered=filtered.filter(u=>['경기','인천'].includes(u.r));
    else filtered=filtered.filter(u=>!['서울','경기','인천'].includes(u.r));
  }
  if(uniQ.trim()){const q=uniQ.trim();filtered=filtered.filter(u=>u.n.includes(q)||u.d.includes(q));}
  if(uniFC) filtered=filtered.filter(u=>checkCompat(u,r));

  // 각 대학에 점수차(diff) 부여 후 분류 — 영어 포함/제외 모드에 따라 기준점 선택
  const useStdG=u=>u.ind==='표준'||u.ind==='표+백';
  const refFor=u=>{
    if(u.et==='o'&&u.stdE){
      if(uniFE==='제외') return useStdG(u)?u.stdE:u.pctE;
      return useStdG(u)?u.stdI:u.pctI;
    }
    return calcUniRef(u);
  };
  // 학생 점수: 영어선택 학과 + 영어포함 모드면 영포 스케일로 환산 (영포컷/영제컷 비율 적용)
  const scoreFor=u=>{
    const base=calcUniScore(u,r); // 영어제외 기준 국수탐(+택) 합
    if(u.et==='o'&&u.stdE&&uniFE==='포함'){
      const us=useStdG(u);
      const cutI=us?u.stdI:u.pctI, cutE=us?u.stdE:u.pctE;
      if(cutE>0){ return Math.round(base*(cutI/cutE)); } // 영포 스케일로 환산
    }
    return base;
  };
  const scored=filtered.map(u=>{const s=scoreFor(u);const ref=refFor(u);return {u,s,ref,diff:s-ref};});
  let safe=scored.filter(x=>x.diff>=3&&x.diff<=30).sort((a,b)=>a.diff-b.diff).map(x=>x.u).slice(0,50);
  let fit=scored.filter(x=>x.diff>=-7&&x.diff<3).sort((a,b)=>b.diff-a.diff).map(x=>x.u).slice(0,50);
  let reach=scored.filter(x=>x.diff>=-25&&x.diff<-7).sort((a,b)=>b.diff-a.diff).map(x=>x.u).slice(0,50);
  // fallback: 셋 다 비었으면 점수차가 가장 작은 순으로 적정권에 채움
  if(!safe.length&&!fit.length&&!reach.length&&scored.length){
    fit=scored.slice().sort((a,b)=>Math.abs(a.diff)-Math.abs(b.diff)).map(x=>x.u).slice(0,30);
  }
  // uniGrp에서도 동일 기준 사용하도록 전역 보관
  window._refFor=refFor;
  window._scoreFor=scoreFor;

  const mathTag = isMirk ? `<div style="margin-top:8px;padding:5px 8px;background:#fef3c7;border-radius:6px;font-size:10px;color:#78350f;">✅ 미적분/기하 응시 → 미적분·기하 필수 학과 지원 가능</div>` : '';
  const sFilters = ['전체','인문','자연'].map(v=>`<div class="uf ${uniFS===v?'on':''}" onclick="setF('s','${v}')">${v}</div>`).join('');
  const gFilters = [['전체','전체군'],['가','가군'],['나','나군'],['다','다군']].map(gg=>`<div class="uf ${uniFG===gg[0]?'on':''}" onclick="setF('g','${gg[0]}')">${gg[1]}</div>`).join('');
  const rFilters = ['전체','서울','수도권','지방'].map(v=>`<div class="uf ${uniFR===v?'on':''}" onclick="setF('r','${v}')">${v}</div>`).join('');
  const cFilter = `<div class="uf ${uniFC?'on':''}" onclick="setF('c','')" title="필수과목 미충족 학과 제외">${uniFC?'✅ 필수과목':'⬜ 필수과목'}</div>`;
  const eFilters = [['제외','📕 영어제외'],['포함','📗 영어포함']].map(ee=>`<div class="uf ${uniFE===ee[0]?'on':''}" onclick="setF('e','${ee[0]}')">${ee[1]}</div>`).join('');
  const sep = `<div style="width:1px;height:20px;background:var(--border);margin:auto 2px;"></div>`;
  const noResult = (!safe.length&&!fit.length&&!reach.length) ? `<div class="empty"><div class="empty-icon">🔍</div><div class="empty-text">해당 조건의 대학이 없습니다<br>필터를 조정해보세요</div></div>` : '';

  cont.innerHTML=`
  <div class="card" style="padding:14px;">
    <div style="display:flex;justify-content:space-between;align-items:center;">
      <div>
        <div style="font-size:11px;color:var(--accent);font-weight:800;margin-bottom:5px;">2027학년도 정시 배치표</div>
        <div style="font-size:10px;color:var(--t3);margin-bottom:2px;">국수탐 표준점수 합산 · ${r.official?'공식 정밀 모드':'가채점 예상 모드'}</div>
        <div style="font-family:'Space Mono',monospace;font-size:32px;font-weight:700;color:var(--accent);">${tot}</div>
        <div style="font-size:9px;color:var(--t3);margin-top:2px;">백분위 합산: ${pctTot}점 (탐구 평균)</div>
      </div>
      <div style="text-align:right;font-size:10px;color:var(--t2);">
        <div>국${r.kor.gr||'-'}등 · 수${r.math.gr||'-'}등 · 영${r.eng.gr||'-'}등</div>
        <div>${r.mathSub}${Ui.escape(r.sci1.name?' · '+r.sci1.name.slice(0,4):'')}${Ui.escape(r.sci2.name?' / '+r.sci2.name.slice(0,4):'')}</div>
        <div style="font-size:9px;color:var(--t3);margin-top:3px;">2027학년도 ${r.examType} 기준</div>
      </div>
    </div>
    ${mathTag}
    <div class="src" style="margin-top:8px;">📊 배치자료 ${UNI.length.toLocaleString()}개 학과 · 실입결=2025 정시 대학어디가(대교협) 발표 · 내 평균백분위는 반영영역 단순평균(가중치 미적용) 참고치</div>
  </div>

  <div class="notice">${r.official?'✅ 공식 성적표의 표준점수·백분위를 사용한 정밀 모드입니다. 다만 대학별 환산식과 최종 합격선 변동은 별도로 확인해야 합니다.':'⚠️ 예상 모드: 공개 가채점 등급컷 사이를 보간한 추정 표준점수·백분위로 계산했습니다. 합격 예측이 아닌 지원 탐색용이며, 공식 성적 발표 후 정밀 모드로 다시 확인하세요.'}</div>

  <div class="uni-filters" style="margin-bottom:6px;">${eFilters}${sep}${cFilter}</div>
  <div style="font-size:10px;color:var(--t3);margin-bottom:8px;padding:0 2px;line-height:1.5;">📕 영어제외: 국·수·탐만 반영하는 기준 / 📗 영어포함: 영어까지 반영하는 기준. <strong>영어 선택반영(택) 대학</strong>에만 적용되며, 두 기준의 합격선이 다릅니다.</div>
  <div class="uni-filters">${sFilters}${sep}${gFilters}${sep}${rFilters}</div>

  <div class="search-wrap"><span class="s-icon">🔍</span>
    <input class="search-inp" placeholder="대학명·학과명 검색" value="${uniQ}" oninput="onSearch(this.value)">
  </div>

  ${uniGrp('✅ 안정권',safe,'safe','gbs',r)}
  ${uniGrp('🎯 적정권',fit,'fit','gbb',r)}
  ${uniGrp('⚡ 도전권',reach,'reach','gba',r)}
  ${noResult}
  <div style="height:20px;"></div>`;
}
function uniGrp(title,unis,type,bc,r){
  if(!unis.length) return '';
  const cc=type==='safe'?'cs':type==='fit'?'cf':'cr';
  const ct=type==='safe'?'안정':type==='fit'?'적정':'도전';
  const items = unis.map((u,i)=>{
    const myScore=(window._scoreFor?window._scoreFor(u):calcUniScore(u,r));
    const useStd=u.ind==='표준'||u.ind==='표+백';
    const indLbl=useStd?'표준':'백분위';
    // 영어 모드에 따른 기준점
    const ref=(window._refFor?window._refFor(u):calcUniRef(u));
    const diff=myScore-ref;
    const refDisp=Math.round(ref);
    const tags=[u.r,u.s,u.g+'군'];
    if(u.mr) tags.push('미적/기하');
    if(u.sr===1) tags.push('과탐필수');
    if(u.sr===2) tags.push('사탐필수');
    if(u.et==='o') tags.push(uniFE==='제외'?'영어선택(제외)':'영어선택(포함)');
    else if(u.et==='n') tags.push('영어미반영');
    if(u.hk==='가산') tags.push('한국사가산');
    else if(u.hk==='합산') tags.push('한국사반영'+(u.hr?u.hr+'%':''));
    const rInfo=(u.kw||u.mw)? '국'+u.kw+':수'+u.mw+(u.ew?':영'+u.ew:'')+(u.sw?':탐'+u.sw:'')+' ('+indLbl+')' : '';
    const tagHtml = tags.map(t=>{
      const isReq = t==='과탐필수'||t==='사탐필수'||t==='미적/기하';
      const isHist = t.indexOf('한국사')===0;
      const isEng = t.indexOf('영어선택')===0;
      const cls = isReq?'utag utag-req':(isHist?'utag utag-hist':(isEng?'utag utag-eng':'utag'));
      return `<span class="${cls}">${t}</span>`;
    }).join('');
    const rInfoHtml = rInfo ? `<div style="font-size:9px;color:var(--t3);margin-top:2px;">${rInfo}</div>` : '';
    const gmHtml = u.gm ? `<div style="font-size:9px;color:#b45309;margin-top:3px;line-height:1.5;">💡 ${u.gm}</div>` : '';
    const tkHtml = u.tk ? `<div style="font-size:9px;color:#6d28d9;margin-top:3px;line-height:1.5;">📌 ${u.tk}</div>` : '';
    // 2025 실입결 (대학어디가·대교협) + 내 평균백분위 비교
    let r25Html='';
    if(u.r25){
      const rr=u.r25; const bits=[];
      if(rr[0]!=null) bits.push('70%컷 평균백분위 <b>'+rr[0]+'</b>'+(rr[1]!=null?' <span style="color:var(--t3);">(50% '+rr[1]+')</span>':''));
      if(rr[2]!=null) bits.push('경쟁률 '+rr[2]+':1');
      if(rr[3]!=null) bits.push('예비 '+rr[3]+'번');
      let cmp='';
      if(rr[0]!=null && r && (r.kor||r.math)){
        const em=(u.et==='o'&&uniFE==='포함')?'inc':'exc';
        const cnt=calcAreaCount(u,em);
        if(cnt>0){
          const myAvg=calcAreaScore(u,r,false,em)/cnt;
          const d=myAvg-rr[0];
          const col=d>=1.5?'#047857':(d>=-1.5?'#1d4ed8':'#b45309');
          cmp=' · <span style="color:'+col+';font-weight:700;">내 평균 '+myAvg.toFixed(1)+' ('+(d>=0?'+':'')+d.toFixed(1)+')</span>';
        }
      }
      if(bits.length) r25Html=`<div style="font-size:9px;color:var(--t2);margin-top:3px;line-height:1.6;">📊 <b>2025 실입결</b> · ${bits.join(' · ')}${cmp}</div>`;
    }
    const _lnk=IPSI_LINK[u.n];
    const lnkHtml=_lnk?`<a href="${_lnk}" target="_blank" rel="noopener" onclick="event.stopPropagation()" style="display:inline-block;margin-top:5px;padding:3px 10px;background:var(--accent-light);border:1px solid var(--accent-mid);border-radius:7px;font-size:9px;font-weight:700;color:var(--accent);text-decoration:none;">🏛 입학처 바로가기</a>`:'';
    return `<div class="uni-item">
      <div class="uni-rank">${i+1}</div>
      <div class="uni-info">
        <div class="uni-name">${u.n}</div>
        <div class="uni-dept">${u.d}</div>
        <div class="uni-tags">${tagHtml}</div>
        ${rInfoHtml}
        ${gmHtml}
        ${tkHtml}
        ${r25Html}
        ${lnkHtml}
      </div>
      <div class="uni-meta">
        <div class="uni-std">${refDisp}</div>
        <div class="uni-chance ${cc}">${ct} (${diff>=0?'+':''}${Math.round(diff)})</div>
      </div>
    </div>`;
  }).join('');
  return `<div class="grp-hdr"><div class="grp-title">${Ui.escape(title)}</div><div class="grp-badge ${bc}">${unis.length}개 학과</div></div>${items}`;
}
function setF(t,v){if(t==='s')uniFS=v;if(t==='g')uniFG=v;if(t==='r')uniFR=v;if(t==='c')uniFC=!uniFC;if(t==='e')uniFE=v;renderUni();}
function onSearch(v){uniQ=v;clearTimeout(window._st);window._st=setTimeout(renderUni,280);}

// ===== NAV =====
// 상위 카테고리 전환

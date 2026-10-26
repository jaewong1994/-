function mockKeyTag(qno){
  if(MOCK_KEY_Q.g1.includes(qno)) return { tier:1, label:'1등급 핵심', color:'#1d4ed8', bg:'#dbeafe', bd:'#93c5fd' };
  if(MOCK_KEY_Q.g2.includes(qno)) return { tier:2, label:'2등급 핵심', color:'#065f46', bg:'#d1fae5', bd:'#6ee7b7' };
  return null;
}

// 실전모의고사 판별: 30문항짜리
function isMockTest(t){ return Number(t && t.total) === 30; }

// 채점 규칙(기존과 동일): 객관식=문자열 일치, 주관식=| 로 구분된 복수정답 허용
function mockIsCorrect(type, key, val){
  const v = (val==null?'':String(val)).trim();
  if(v==='') return false;
  if((type||'mc')==='mc') return String(key==null?'':key).trim() === v;
  return String(key==null?'':key).split('|').map(s=>s.trim()).filter(Boolean).includes(v);
}

// Keep old navigation callers compatible; ordinary tests also have analysis.
function wMockEntry(testId,title,total){
  const box=document.getElementById('mock-analysis-entry');
  if(box)box.innerHTML='<button class="staff-row-btn" onclick="wResultView('+Number(testId)+','+Ui.argument(title)+','+Number(total)+')">등수 · 문항별 결과 보기</button>';
}
async function renderOwnMockAnalysis(testId,title){
  return StudentTestResults.open(testId,title);
}

// 문항별 분석 화면
async function wRenderMockAnalysis(testId, title, total){
if(_wprofile?.role==='student')return renderOwnMockAnalysis(testId,title);
if(!window.AppSession?.can('manage-tests'))return;
const __mvpEpoch=SessionGuard.capture();

  const cont = document.getElementById('wtest-content');
  const sb = sbReady();
  cont.innerHTML = wHeader(_wprofile.name||'학생','학생') + `<div style="text-align:center;color:var(--t3);font-size:12px;padding:30px;">문항 분석 불러오는 중...</div>`;

  const { data:test,error:testError } = await SessionGuard.wait((readStaffTest(testId)),__mvpEpoch);
  if(testError||!test||!Array.isArray(test.answers)){cont.innerHTML='<p role="alert">시험 분석 자료를 확인하지 못했습니다. 다시 시도해 주세요.</p>';return;}
  const key   = (test && test.answers) ? test.answers : [];
  const types = (test && test.types)   ? test.types   : [];
  const n     = (test && test.total)   ? test.total   : total;

  const { data:subs, error } = await SessionGuard.wait((sb.rpc('mock_submissions', { p_test_id: testId })),__mvpEpoch);
  const backBtn = `<button onclick="renderWStudent()" style="width:100%;margin-top:8px;padding:11px;background:var(--surface);color:var(--t2);border:1px solid var(--border);border-radius:8px;font-size:12px;cursor:pointer;font-family:'Noto Sans KR',sans-serif;">← 목록으로</button>`;
  if(error || !subs){
    cont.innerHTML = wHeader(_wprofile.name||'학생','학생') + `<div class="stg-card"><div class="stg-hdr"><div class="stg-icon">🎯</div><div class="stg-title">${Ui.escape(title)} 문항 분석</div></div><div style="font-size:12px;color:var(--red);text-align:center;padding:16px 0;">${Ui.escape((error&&error.message)||'분석을 불러올 수 없습니다.')}</div>${backBtn}</div>`;
    return;
  }
  const takers = subs || [];
  const takerCount = takers.length;

  // ── 문항별 집계
  const perQ = [];
  const mySolo = [], myKeyG1 = [], myKeyG2 = [], missKeyG1 = [], missKeyG2 = [];
  for(let i=0;i<n;i++){
    const list=[]; let meCorrect=false;
    takers.forEach(t=>{
      const ans = t.answers||[];
      if(mockIsCorrect(types[i], key[i], ans[i])){
        list.push({ name:t.display_name||'익명', isMe:!!t.is_me });
        if(t.is_me) meCorrect=true;
      }
    });
    const solo = list.length===1;
    perQ.push({ qno:i+1, list, meCorrect, solo });
    if(solo && list[0].isMe) mySolo.push(i+1);
    const kt = mockKeyTag(i+1);
    if(kt){
      if(kt.tier===1){ meCorrect?myKeyG1.push(i+1):missKeyG1.push(i+1); }
      else           { meCorrect?myKeyG2.push(i+1):missKeyG2.push(i+1); }
    }
  }

  // ── 요약 히어로
  const hero = `
  <div style="background:linear-gradient(135deg,var(--accent),#4f46e5);border-radius:14px;padding:16px;color:white;">
    <div style="font-size:11px;opacity:.85;letter-spacing:.05em;">실전모의고사 분석 · ${takerCount}명 응시</div>
    <div style="font-size:18px;font-weight:900;margin:2px 0 12px;">${Ui.escape(title)}</div>
    <div style="display:flex;gap:10px;">
      <div style="flex:1;background:rgba(255,255,255,.15);border-radius:10px;padding:10px;text-align:center;">
        <div style="font-family:'Space Mono',monospace;font-size:26px;font-weight:800;">${mySolo.length}</div>
        <div style="font-size:9px;opacity:.85;">🏅 나 혼자 맞춤</div>
      </div>
      <div style="flex:1;background:rgba(255,255,255,.15);border-radius:10px;padding:10px;text-align:center;">
        <div style="font-family:'Space Mono',monospace;font-size:26px;font-weight:800;">${myKeyG1.length}<span style="font-size:12px;opacity:.7;">/${MOCK_KEY_Q.g1.length}</span></div>
        <div style="font-size:9px;opacity:.85;">1등급 핵심 정답</div>
      </div>
      <div style="flex:1;background:rgba(255,255,255,.15);border-radius:10px;padding:10px;text-align:center;">
        <div style="font-family:'Space Mono',monospace;font-size:26px;font-weight:800;">${myKeyG2.length}<span style="font-size:12px;opacity:.7;">/${MOCK_KEY_Q.g2.length}</span></div>
        <div style="font-size:9px;opacity:.85;">2등급 핵심 정답</div>
      </div>
    </div>
    ${mySolo.length?`<div style="margin-top:10px;font-size:12px;font-weight:700;">🏅 혼자 맞춘 문항: ${mySolo.join(', ')}번. 대단해요!</div>`:''}
  </div>`;

  // ── 핵심문항 코칭
  const coachRows = [];
  if(missKeyG1.length) coachRows.push(`<div style="font-size:12px;color:#1d4ed8;"><b>1등급 도약</b>. 아직 놓친 핵심문항: <b>${missKeyG1.join(', ')}번</b></div>`);
  if(missKeyG2.length) coachRows.push(`<div style="font-size:12px;color:#065f46;margin-top:4px;"><b>2등급 도약</b>. 아직 놓친 핵심문항: <b>${missKeyG2.join(', ')}번</b></div>`);
  if(!missKeyG1.length && !missKeyG2.length) coachRows.push(`<div style="font-size:12px;color:var(--a3);font-weight:700;">🎉 등급 도약 핵심문항을 모두 맞혔어요!</div>`);
  const coach = `<div class="stg-card">
    <div class="stg-hdr"><div class="stg-icon">🧭</div><div class="stg-title">등급 도약 코칭</div><div class="stg-sub">이 번호대에 점수 향상 열쇠가 있어요</div></div>
    ${coachRows.join('')}
    <div style="margin-top:10px;display:flex;gap:6px;flex-wrap:wrap;font-size:9px;">
      <span style="padding:2px 8px;border-radius:20px;background:#dbeafe;color:#1d4ed8;font-weight:700;">1등급 핵심 ${MOCK_KEY_Q.g1.join('·')}</span>
      <span style="padding:2px 8px;border-radius:20px;background:#d1fae5;color:#065f46;font-weight:700;">2등급 핵심 ${MOCK_KEY_Q.g2.join('·')}</span>
    </div>
  </div>`;

  // ── 문항별 리스트
  let rows='';
  perQ.forEach(q=>{
    const kt = mockKeyTag(q.qno);
    const rate = takerCount ? Math.round(q.list.length/takerCount*100) : 0;
    const leftBd = kt ? kt.bd : (q.meCorrect ? 'var(--a3)' : 'var(--border)');
    const qColor = q.meCorrect ? 'var(--a3)' : 'var(--red)';
    // 정답자 칩 (나는 강조)
    let chips = q.list.length
      ? q.list.map(p=>`<span style="font-size:10px;padding:2px 8px;border-radius:20px;background:${p.isMe?'var(--accent)':'var(--surface)'};color:${p.isMe?'white':'var(--t2)'};border:1px solid ${p.isMe?'var(--accent)':'var(--border)'};font-weight:${p.isMe?700:400};">${Ui.escape(p.isMe?'나':p.name)}</span>`).join('')
      : `<span style="font-size:10px;color:var(--t3);">아무도 못 맞힘</span>`;
    const soloBadge = q.solo ? `<span style="font-size:10px;font-weight:800;color:#b45309;background:#fef3c7;border:1px solid #fcd34d;border-radius:20px;padding:2px 8px;">🏅 혼자 맞춤${Ui.escape(q.list[0].isMe?' (나!)':' · '+q.list[0].name)}</span>` : '';
    const keyRibbon = kt ? `<span style="font-size:9px;font-weight:800;color:${kt.color};background:${kt.bg};border:1px solid ${kt.bd};border-radius:20px;padding:2px 8px;">⭐ ${Ui.escape(kt.label)}</span>` : '';
    rows += `<div style="border-left:3px solid ${leftBd};background:${kt?kt.bg+'55':'var(--white)'};border-radius:8px;padding:10px 12px;margin-bottom:8px;">
      <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
        <div style="font-size:13px;font-weight:800;color:${qColor};min-width:34px;">${q.qno}번</div>
        <div style="font-size:11px;">${q.meCorrect?'⭕':'❌'}</div>
        ${keyRibbon}${soloBadge}
        <div style="margin-left:auto;font-size:10px;color:var(--t3);">${q.list.length}/${takerCount}명 · ${rate}%</div>
      </div>
      <div style="display:flex;gap:4px;flex-wrap:wrap;margin-top:8px;">${chips}</div>
    </div>`;
  });
  const listCard = `<div class="stg-card">
    <div class="stg-hdr"><div class="stg-icon">📋</div><div class="stg-title">문항별 정답자</div><div class="stg-sub">⭐ 등급핵심 · 🏅 혼자맞춤</div></div>
    ${rows}
  </div>`;

  cont.innerHTML = wHeader(_wprofile.name||'학생','학생')
    + `<div class="stg-card" style="padding:0;background:transparent;border:none;box-shadow:none;">${hero}</div>`
    + coach + listCard + backBtn;
}

// (선생님) 혼자맞춤 메달 지급 — 마감 후 호출. collections.solo 에 누적
async function wAwardSoloMedals(testId, title){
const __mvpEpoch=SessionGuard.capture();

  if(!confirm(`"${Ui.escape(title)}" 실전모의고사의 '혼자맞춤 🏅' 메달을 지급할까요?\n(문항을 혼자 맞힌 학생에게 지급됩니다)`)) return;
  const sb=sbReady();
  const { data, error } = await SessionGuard.wait((sb.rpc('award_solo_medals', { p_test_id: testId })),__mvpEpoch);
  if(error){ alert('지급 실패: '+error.message); return; }
  showToast(`🏅 혼자맞춤 메달 지급 완료${(data!=null)?' · '+data+'개':''}`);
}


// ================================================================
// 🐾 팡팡포카 ── v52 (서버저장판)
//  · 컬렉션 하단 갤러리 · 확대 뷰어 · 메달 꾸미기(서버저장)
//  · 배경 테마(서버저장): 앱 전체 / D-day 카드 / 컬렉션 카드
//  · 시험 응시 1회당 새 카드 1장 자동 지급 (+ 선생님 수동 배부)
//  · 자동로그인 부트: 세션 있으면 앱 전역 로그인 상태 복원
//  ※ 서버: 팡팡포카_supabase.sql 실행 필요
// ================================================================

const PC_RARITY = {
  normal: {label:'노말',  ring:'linear-gradient(135deg,#cbd5e1,#94a3b8)', glow:'rgba(148,163,184,.35)'},
  rare:   {label:'레어',  ring:'linear-gradient(135deg,#60a5fa,#2563eb)', glow:'rgba(37,99,235,.4)'},
  epic:   {label:'에픽',  ring:'linear-gradient(135deg,#c084fc,#7c3aed)', glow:'rgba(124,58,237,.45)'},
  legend: {label:'레전드',ring:'linear-gradient(135deg,#fde047,#f59e0b,#fb923c)', glow:'rgba(245,158,11,.55)'}
};
const PC_MEDAL_EMOJI = { gold:'🥇', silver:'🥈', bronze:'🥉', perfect:'💎', solo:'🏅', jun:'⚔️', kill:'💀', god:'👑' };


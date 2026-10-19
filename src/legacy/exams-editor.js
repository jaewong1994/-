function wNewTest(){
if(!window.AppSession?.can('manage-tests'))return;

  const d=document.getElementById('w-teacher-detail');
  openTopDetail('w-teacher-detail');
  d.innerHTML = `
  <div class="stg-card">
    <div class="stg-hdr"><div class="stg-icon">➕</div><div class="stg-title">새 테스트 등록</div></div>
    <div style="margin-bottom:10px;"><div class="form-lbl" style="margin-bottom:5px;">테스트 이름</div>
      <input id="nt-title" class="target-select" style="width:100%;" placeholder="예: 3월 1주차 모의고사"></div>
    <div style="margin-bottom:8px;">
      <div class="form-lbl" style="margin-bottom:5px;">빠른 설정</div>
      <button onclick="wPreset('math')" style="padding:8px 12px;background:var(--accent-light);color:var(--accent);border:1px solid var(--accent-mid);border-radius:8px;font-size:11px;font-weight:700;cursor:pointer;font-family:'Noto Sans KR',sans-serif;">📐 수능수학 30문항 (배점 자동)</button>
      <div style="font-size:9px;color:var(--t3);margin-top:4px;">2·3·4점, 단답형(16~22·29~30번) 자동 설정 · 100점 만점. 적용 후 정답만 입력하면 됩니다.</div>
    </div>
    <div style="margin-bottom:10px;"><div class="form-lbl" style="margin-bottom:5px;">문항 수</div>
      <input id="nt-total" class="target-select" style="width:100%;" type="number" min="1" max="50" placeholder="예: 20" oninput="wBuildAnswerGrid()"></div>
    <div id="nt-grid"></div>
    <button onclick="wSaveTest()" style="width:100%;margin-top:12px;padding:11px;background:var(--accent);color:white;border:none;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;font-family:'Noto Sans KR',sans-serif;">테스트 저장</button>
    <div id="nt-msg" style="font-size:11px;color:var(--red);margin-top:8px;text-align:center;"></div>
  </div>`;
  document.getElementById('nt-title')?.focus({preventScroll:true});
}

// 수능수학 기본 배점/유형 프리셋
function wPreset(kind){
  if(kind==='math'){
    document.getElementById('nt-total').value = 30;
    wBuildAnswerGrid();
    // 배점: 2점(1,2,23) / 4점(9~15,20~22,28,29,30) / 나머지 3점
    const pts=[2,2,3,3,3,3,3,3,4,4,4,4,4,4,4,3,3,3,3,4,4,4,2,3,3,3,3,4,4,4];
    // 단답형(주관식): 16~22, 29~30
    const saSet=new Set([16,17,18,19,20,21,22,29,30]);
    // 기본 난이도(통상 고난도 배치): 준킬 20,28 / 킬 21,29 / GOD 22,30 (수정 가능)
    const lvMap={20:'jun',28:'jun',21:'kill',29:'kill',22:'god',30:'god'};
    for(let i=0;i<30;i++){
      if(saSet.has(i+1)) wSetType(i,'sa');
      const ptEl=document.querySelector(`.nt-pt[data-pt="${i}"]`);
      if(ptEl) ptEl.value = pts[i];
      if(lvMap[i+1]) wSetLevel(i, lvMap[i+1]);
    }
  }
}

// 정답·배점 입력 그리드 생성
function wBuildAnswerGrid(){
  const total=parseInt(document.getElementById('nt-total').value);
  const g=document.getElementById('nt-grid');
  if(!total||total<1||total>50){ g.innerHTML=''; return; }
  window._ntAnswers = new Array(total).fill('');
  window._ntTypes = new Array(total).fill('mc'); // 기본 객관식
  window._ntLevels = new Array(total).fill('');  // 난이도: ''=일반, jun/kill/god
  let rows='';
  for(let i=0;i<total;i++){
    rows += `<div class="nt-qrow" data-qrow="${i}" style="display:flex;align-items:center;gap:6px;padding:6px;border-radius:8px;border:1px solid var(--border);margin-bottom:5px;flex-wrap:wrap;">
      <div class="omr-qn" style="width:22px;">${i+1}</div>
      <div style="display:flex;gap:3px;flex-shrink:0;">
        <button class="nt-type-btn on" data-tq="${i}" data-type="mc" onclick="wSetType(${i},'mc')" style="padding:4px 6px;font-size:10px;border-radius:6px;border:1px solid var(--accent);background:var(--accent);color:white;cursor:pointer;font-family:'Noto Sans KR',sans-serif;font-weight:700;">객</button>
        <button class="nt-type-btn" data-tq="${i}" data-type="sa" onclick="wSetType(${i},'sa')" style="padding:4px 6px;font-size:10px;border-radius:6px;border:1px solid var(--border);background:var(--white);color:var(--t3);cursor:pointer;font-family:'Noto Sans KR',sans-serif;font-weight:700;">주</button>
      </div>
      <div class="nt-ansbox" data-ansbox="${i}" style="flex:1;min-width:140px;"></div>
      <input class="nt-pt" data-pt="${i}" type="number" min="1" value="5" style="width:38px;padding:5px;border:1px solid var(--border);border-radius:6px;font-family:'Space Mono',monospace;font-size:12px;text-align:center;flex-shrink:0;" title="배점">
      <div style="display:flex;gap:2px;flex-shrink:0;">
        <button class="nt-lv-btn on" data-lq="${i}" data-lv="" onclick="wSetLevel(${i},'')" title="일반" style="width:26px;height:26px;border-radius:6px;border:1px solid var(--accent);background:var(--accent);color:white;cursor:pointer;font-size:10px;">·</button>
        <button class="nt-lv-btn" data-lq="${i}" data-lv="jun" onclick="wSetLevel(${i},'jun')" title="준킬러" style="width:26px;height:26px;border-radius:6px;border:1px solid var(--border);background:var(--white);cursor:pointer;font-size:13px;">⚔️</button>
        <button class="nt-lv-btn" data-lq="${i}" data-lv="kill" onclick="wSetLevel(${i},'kill')" title="킬러" style="width:26px;height:26px;border-radius:6px;border:1px solid var(--border);background:var(--white);cursor:pointer;font-size:13px;">💀</button>
        <button class="nt-lv-btn" data-lq="${i}" data-lv="god" onclick="wSetLevel(${i},'god')" title="GOD" style="width:26px;height:26px;border-radius:6px;border:1px solid var(--border);background:var(--white);cursor:pointer;font-size:13px;">👑</button>
      </div>
    </div>`;
  }
  g.innerHTML = `<div style="font-size:11px;font-weight:700;margin:10px 0 6px;">유형 · 정답 · 배점 · 난이도</div>
    <div style="font-size:9px;color:var(--t3);margin-bottom:8px;line-height:1.6;">주관식 복수정답 <code style="background:var(--surface);padding:0 4px;border-radius:3px;">|</code> 구분 · 난이도: ⚔️준킬 💀킬 👑GOD (맞추면 학생이 아이콘 수집)</div>
    <div style="max-height:460px;overflow-y:auto;padding:2px;">${rows}</div>`;
  for(let i=0;i<total;i++) wRenderAnsBox(i);
}

function wSetLevel(i, lv){
  window._ntLevels[i]=lv;
  document.querySelectorAll(`.nt-lv-btn[data-lq="${i}"]`).forEach(b=>{
    const on=b.dataset.lv===lv;
    b.classList.toggle('on',on);
    b.style.borderColor=on?'var(--accent)':'var(--border)';
    b.style.background=on?(lv===''?'var(--accent)':'var(--accent-light)'):'var(--white)';
  });
}

// 문항별 정답 입력 영역 렌더 (유형에 따라 버블 또는 텍스트)
function wRenderAnsBox(i){
  const box=document.querySelector(`.nt-ansbox[data-ansbox="${i}"]`);
  if(!box)return;
  const type=window._ntTypes[i];
  if(type==='mc'){
    let opts='';
    for(let n=1;n<=5;n++){
      const sel=String(window._ntAnswers[i])===String(n);
      opts+=`<button class="omr-bubble ${sel?'on':''}" data-aq="${i}" data-an="${n}" onclick="wPickAnswer(${i},${n})">${n}</button>`;
    }
    box.innerHTML=`<div class="omr-opts">${opts}</div>`;
  } else {
    const val=window._ntAnswers[i]||'';
    box.innerHTML=`<input class="nt-sa-inp" data-saq="${i}" value="${val.replace(/"/g,'&quot;')}" oninput="wTypeAnswer(${i},this.value)" placeholder="정답 입력 (복수: 답1|답2)" style="width:100%;padding:6px 8px;border:1px solid var(--border);border-radius:6px;font-size:12px;font-family:'Noto Sans KR',sans-serif;">`;
  }
}

function wSetType(i, type){
  window._ntTypes[i]=type;
  window._ntAnswers[i]=''; // 유형 바꾸면 정답 초기화
  document.querySelectorAll(`.nt-type-btn[data-tq="${i}"]`).forEach(b=>{
    const on=b.dataset.type===type;
    b.classList.toggle('on',on);
    b.style.background=on?'var(--accent)':'var(--white)';
    b.style.color=on?'white':'var(--t3)';
    b.style.borderColor=on?'var(--accent)':'var(--border)';
  });
  wRenderAnsBox(i);
}

function wPickAnswer(q,n){
  window._ntAnswers[q]=String(n);
  document.querySelectorAll(`.omr-bubble[data-aq="${q}"]`).forEach(b=>{
    b.classList.toggle('on', String(b.dataset.an)===String(n));
  });
}
function wTypeAnswer(q,v){ window._ntAnswers[q]=v; }

async function wSaveTest(){
const __mvpEpoch=SessionGuard.capture();

  const sb=sbReady();
  const title=document.getElementById('nt-title').value.trim();
  const total=parseInt(document.getElementById('nt-total').value);
  const msg=document.getElementById('nt-msg');
  if(!title||!total){ msg.style.color='var(--red)'; msg.textContent='이름과 문항 수를 입력하세요.'; return; }
  const answers=window._ntAnswers||[];
  const types=window._ntTypes||[];
  for(let i=0;i<total;i++){
    if(answers[i]===''||answers[i]==null){ msg.style.color='var(--red)'; msg.textContent=`${i+1}번 정답을 입력하세요.`; return; }
  }
  const points=[];
  document.querySelectorAll('.nt-pt').forEach(el=>points[parseInt(el.dataset.pt)]=parseInt(el.value)||0);
  const levels=window._ntLevels||new Array(total).fill('');
  msg.style.color='var(--t3)'; msg.textContent='저장 중...';
  const error = await SessionGuard.wait((insertManagedTest({title, answers, types, points, levels, total, created_by:_wuser.id})),__mvpEpoch);
  if(error){ msg.style.color='var(--red)'; msg.textContent='저장 실패: '+error.message; return; }
  renderWTeacher();
}

// 등수 조회 (선생님)
async function wViewRank(testId, title){
if(AppSession.can('read-tests'))return MvpOperationalViews.rank(testId,title);
if(!window.AppSession?.can('manage-tests'))return;

const __mvpEpoch=SessionGuard.capture();

  const sb=sbReady();
  const d=document.getElementById('w-teacher-detail');
  const detailRequest=openTopDetail('w-teacher-detail');
  const jsTitle=title||'';
  const statsBtn=`<button type="button" class="staff-add" onclick="wWrongStats(${testId},${Ui.argument(jsTitle)})" style="margin-left:0;width:100%;justify-content:center;margin-top:12px;">오답분석 리포트</button>`;
  d.innerHTML = `<div class="stg-card"><div style="text-align:center;font-size:12px;color:var(--t3);">불러오는 중...</div></div>`;
  const { data:tinfo, error:tErr } = await SessionGuard.wait((readStaffTest(testId)),__mvpEpoch);
  if(!currentTopDetail('w-teacher-detail',detailRequest))return;
  const closed = tinfo && tinfo.closed;
  const _isMock = tinfo && Number(tinfo.total)===30;
  const { data:subs, error:sErr } = await SessionGuard.wait((loadTestSubmissions(testId)),__mvpEpoch);
  if(!currentTopDetail('w-teacher-detail',detailRequest))return;
  const { data:profs } = await SessionGuard.wait((sb.from('profiles').select('id,name,student_no,class_id')),__mvpEpoch);
  if(!currentTopDetail('w-teacher-detail',detailRequest))return;
  const { data:classes } = await SessionGuard.wait((sb.from('classes').select('id,name')),__mvpEpoch);
  if(!currentTopDetail('w-teacher-detail',detailRequest))return;
  const pmap={}; (profs||[]).forEach(p=>pmap[p.id]=p);
  const cmap={}; (classes||[]).forEach(c=>cmap[c.id]=c.name);

  if(tErr){
    d.innerHTML = `<div class="stg-card"><div class="stg-hdr"><div class="stg-icon">🏆</div><div class="stg-title">${escHtml(title)} · 등수</div></div><div class="staff-empty">테스트를 불러오지 못했습니다.<br>${escHtml(tErr.message)}</div>${statsBtn}</div>`;
    return;
  }
  if(sErr){
    d.innerHTML = `<div class="stg-card"><div class="stg-hdr"><div class="stg-icon">🏆</div><div class="stg-title">${escHtml(title)} · 등수</div></div><div class="staff-empty">등수를 불러오지 못했습니다.<br>${escHtml(sErr.message)}</div>${statsBtn}</div>`;
    return;
  }
  if(!subs||!subs.length){
    d.innerHTML = `<div class="stg-card"><div class="stg-hdr"><div class="stg-icon">🏆</div><div class="stg-title">${escHtml(title)} · 등수</div></div><div style="font-size:12px;color:var(--t3);text-align:center;padding:16px 0;">아직 제출한 학생이 없습니다.</div>${statsBtn}</div>`;
    return;
  }
  let rows=''; let rank=0; let prevScore=null; let realRank=0;
  const maxScore = subs[0].score;
  subs.forEach((s,i)=>{
    realRank++;
    if(s.score!==prevScore){ rank=realRank; prevScore=s.score; }
    const p=pmap[s.user_id]||{};
    const medal = rank===1?'🥇':rank===2?'🥈':rank===3?'🥉':rank;
    const perfect = (s.score===maxScore && maxScore>0) ? ' 💎' : '';
    const wrong = tinfo ? wWrongIdxs(tinfo, s.answers) : [];
    const wrongLabel = wrong.length ? wrong.map(i=>i+1).join(', ') : '만점';
    rows += `<tr>
      <td style="padding:8px;border-bottom:1px solid var(--border);font-weight:700;font-size:13px;text-align:center;">${medal}</td>
      <td style="padding:8px;border-bottom:1px solid var(--border);font-size:12px;">${escHtml(p.name||'(이름없음)')}${perfect}<div style="font-size:9px;color:var(--t3);">${escHtml(p.student_no||'')}${cmap[p.class_id]?' · '+escHtml(cmap[p.class_id]):''}</div></td>
      <td style="padding:8px;border-bottom:1px solid var(--border);font-family:'Space Mono',monospace;font-size:14px;font-weight:700;color:var(--accent);text-align:center;">${s.score}</td>
      <td style="padding:8px;border-bottom:1px solid var(--border);font-size:11px;color:var(--t2);text-align:center;">${s.correct_count}개</td>
      <td style="padding:8px;border-bottom:1px solid var(--border);font-size:10px;color:${wrong.length?'var(--red)':'var(--a3)'};">${escHtml(wrongLabel)}</td>
      <td style="padding:6px;border-bottom:1px solid var(--border);text-align:center;"><button onclick="wEditAnswers(${testId},'${s.user_id}',${Ui.argument(p.name)},${Ui.argument(title)})" style="padding:5px 8px;background:var(--surface);color:var(--t2);border:1px solid var(--border);border-radius:6px;font-size:10px;cursor:pointer;font-family:'Noto Sans KR',sans-serif;">수정</button></td>
    </tr>`;
  });
  const avg = Math.round(subs.reduce((a,s)=>a+s.score,0)/subs.length);
  const closeBtn = closed
    ? `<div style="margin-top:12px;padding:10px;background:var(--a3-light);border:1px solid #a7f3d0;border-radius:8px;font-size:12px;color:#065f46;text-align:center;font-weight:700;">✅ 마감 완료 · 메달/배지가 지급되었습니다</div>` + (_isMock?`<button onclick="wAwardSoloMedals(${testId},${Ui.argument(title)})" style="width:100%;margin-top:8px;padding:10px;background:#fef3c7;color:#92400e;border:1px solid #fcd34d;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer;font-family:'Noto Sans KR',sans-serif;">🏅 혼자맞춤 메달 지급 (실전모의고사)</button>`:'')
    : `<button onclick="wCloseTest(${testId},${Ui.argument(title)})" style="width:100%;margin-top:12px;padding:11px;background:#dc2626;color:white;border:none;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;font-family:'Noto Sans KR',sans-serif;">🔒 답안 마감 + 메달 지급</button>
       <div style="font-size:9px;color:var(--t3);text-align:center;margin-top:5px;">마감하면 더 이상 제출할 수 없고, 1·2·3등 메달과 만점 배지가 지급됩니다.</div>`;
  d.innerHTML = `
  <div class="stg-card">
    <div class="stg-hdr"><div class="stg-icon">🏆</div><div class="stg-title">${Ui.escape(title)} · 등수</div><div class="stg-sub">${subs.length}명 응시</div></div>
    <div style="font-size:11px;color:var(--t2);margin-bottom:10px;padding:8px;background:var(--surface);border-radius:8px;border:1px solid var(--border);">평균 <strong style="color:var(--accent);">${avg}점</strong> · 최고 <strong>${subs[0].score}점</strong> 💎</div>
    <table style="width:100%;border-collapse:collapse;">
      <thead><tr style="background:var(--bg);">
        <th style="padding:8px;font-size:9px;color:var(--t3);font-weight:700;border-bottom:2px solid var(--border);">등수</th>
        <th style="padding:8px;font-size:9px;color:var(--t3);font-weight:700;text-align:left;border-bottom:2px solid var(--border);">이름</th>
        <th style="padding:8px;font-size:9px;color:var(--t3);font-weight:700;border-bottom:2px solid var(--border);">점수</th>
        <th style="padding:8px;font-size:9px;color:var(--t3);font-weight:700;border-bottom:2px solid var(--border);">정답</th>
        <th style="padding:8px;font-size:9px;color:var(--t3);font-weight:700;text-align:left;border-bottom:2px solid var(--border);">틀린 문항</th>
        <th style="padding:8px;font-size:9px;color:var(--t3);font-weight:700;border-bottom:2px solid var(--border);">관리</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <button type="button" class="staff-add" onclick="wWrongStats(${testId},${Ui.argument(jsTitle)})" style="margin-left:0;width:100%;justify-content:center;margin-top:12px;">오답분석 리포트</button>
    ${closeBtn}
  </div>`;
}

async function wCloseTest(testId, title){
if(!window.AppSession?.can('manage-tests'))return;

const __mvpEpoch=SessionGuard.capture();

  if(!confirm(`"${Ui.escape(title)}"을(를) 마감할까요?\n마감 후에는 학생이 제출할 수 없고, 1·2·3등 메달과 만점 배지가 지급됩니다. (되돌릴 수 없음)`)) return;
  const sb=sbReady();
  const { error } = await SessionGuard.wait((sb.rpc('close_test', { p_test_id: testId })),__mvpEpoch);
  if(error){ alert('마감 실패: '+error.message); return; }
  showToast('마감 완료 · 메달이 지급되었습니다');
  wViewRank(testId, title);
}

// 선생님: 학생 답안 수정
async function wEditAnswers(testId, uid, sname, title){
if(!window.AppSession?.can('manage-tests'))return;

const __mvpEpoch=SessionGuard.capture();

  const sb=sbReady();
  const d=document.getElementById('w-teacher-detail');
  const detailRequest=openTopDetail('w-teacher-detail');
  d.innerHTML = `<div class="stg-card"><div style="text-align:center;font-size:12px;color:var(--t3);">불러오는 중...</div></div>`;
  const { data:test } = await SessionGuard.wait((sb.from('tests').select('types,total').eq('id',testId).single()),__mvpEpoch);
  if(!currentTopDetail('w-teacher-detail',detailRequest))return;
  const { data:sub } = await SessionGuard.wait((sb.from('submissions').select('answers').eq('test_id',testId).eq('user_id',uid).single()),__mvpEpoch);
  if(!currentTopDetail('w-teacher-detail',detailRequest))return;
  const types=test.types||new Array(test.total).fill('mc');
  const ans=(sub&&sub.answers)?sub.answers.slice():new Array(test.total).fill('');
  window._editAns=ans;

  let rows='';
  for(let i=0;i<test.total;i++){
    if((types[i]||'mc')==='mc'){
      let opts='';
      for(let n=1;n<=5;n++){
        const sel=String(ans[i])===String(n);
        opts+=`<button class="omr-bubble ${sel?'on':''}" data-eq="${i}" data-en="${n}" onclick="wEditPick(${i},${n})">${n}</button>`;
      }
      rows+=`<div class="omr-row"><div class="omr-qn">${i+1}</div><div class="omr-opts">${opts}</div></div>`;
    } else {
      const v=String(ans[i]||'');
      rows+=`<div class="omr-row" style="align-items:center;"><div class="omr-qn">${i+1}</div><span style="font-size:9px;color:var(--a3);font-weight:700;margin-right:4px;">주관식</span><input data-esa="${i}" value="${v.replace(/"/g,'&quot;')}" oninput="wEditType(${i},this.value)" style="flex:1;padding:6px 9px;border:1px solid var(--border);border-radius:6px;font-size:12px;font-family:'Noto Sans KR',sans-serif;"></div>`;
    }
  }
  d.innerHTML=`<div class="stg-card">
    <div class="stg-hdr"><div class="stg-icon">✏️</div><div class="stg-title">${sname} 답안 수정</div></div>
    <div style="font-size:10px;color:var(--t3);margin-bottom:10px;">학생이 잘못 입력한 답을 고친 뒤 저장하면 자동으로 재채점됩니다.</div>
    <div class="omr-sheet">${rows}</div>
    <button onclick="wSaveEdit(${testId},'${uid}',${Ui.argument(title)})" style="width:100%;margin-top:12px;padding:11px;background:var(--accent);color:white;border:none;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;font-family:'Noto Sans KR',sans-serif;">저장 + 재채점</button>
    <button onclick="wViewRank(${testId},${Ui.argument(title)})" style="width:100%;margin-top:8px;padding:10px;background:var(--surface);color:var(--t2);border:1px solid var(--border);border-radius:8px;font-size:12px;cursor:pointer;font-family:'Noto Sans KR',sans-serif;">← 등수로</button>
  </div>`;
}
function wEditPick(q,n){
  window._editAns[q]=String(n);
  document.querySelectorAll(`.omr-bubble[data-eq="${q}"]`).forEach(b=>b.classList.toggle('on',String(b.dataset.en)===String(n)));
}
function wEditType(q,v){ window._editAns[q]=v; }
async function wSaveEdit(testId, uid, title){
if(!window.AppSession?.can('manage-tests'))return;

const __mvpEpoch=SessionGuard.capture();

  const sb=sbReady();
  const payload=(window._editAns||[]).map(a=>a==null?'':String(a));
  const { error } = await SessionGuard.wait((sb.rpc('teacher_regrade', { p_test_id:testId, p_user_id:uid, p_answers:payload })),__mvpEpoch);
  if(error){ alert('수정 실패: '+error.message); return; }
  showToast('수정 + 재채점 완료');
  wViewRank(testId, title);
}

// 공통 헤더 (로그인 정보 + 로그아웃)
function wHeader(name, roleLabel){
  const icon = roleLabel.indexOf('원장')>=0?'ti-shield-check':(roleLabel.indexOf('선생')>=0?'ti-school':'ti-user');
  return `<div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;padding:12px 14px;background:var(--white);border:1px solid var(--border);border-radius:var(--r);box-shadow:var(--shadow);">
    <div class="w-avatar" aria-hidden="true"><i class="ti ${icon}"></i></div>
    <div style="flex:1;"><div style="font-size:13px;font-weight:800;">${escHtml(name)}</div><div style="font-size:10px;color:var(--t3);">${escHtml(roleLabel)}</div></div>
    <button type="button" class="staff-row-btn" onclick="wLogout()">로그아웃</button>
  </div>`;
}

// ===== 컬렉션 (수집 아이콘 + 메달 자랑 화면) =====

async function wSubmit(testId, total, title){
const __mvpEpoch=SessionGuard.capture();

  const ans = window._wAnswers||[];
  const unanswered = [];
  for(let i=0;i<total;i++){ const a=ans[i]; if(a===''||a==null||a===0) unanswered.push(i+1); }
  let msg = '제출하면 답을 수정할 수 없습니다. 채점할까요?';
  if(unanswered.length) msg = `아직 답하지 않은 문항이 ${unanswered.length}개 있습니다.\n제출하면 답을 수정할 수 없습니다. 그대로 채점할까요?`;
  if(!confirm(msg)) return;

  const sb=sbReady();
  const btn=document.getElementById('w-submit-btn');
  if(btn){ btn.disabled=true; btn.textContent='채점 중...'; btn.style.opacity='.6'; }
  const payload = ans.map(a=>a==null?'':String(a));
  const { data, error } = await SessionGuard.wait((sb.rpc('submit_answers', { p_test_id: testId, p_answers: payload })),__mvpEpoch);
  if(error){
    // 이미 제출한 경우(서버가 차단) → 결과 화면으로
    if(/이미 제출/.test(error.message||'')){
      alert('이미 제출한 시험입니다. 답안 수정은 담당 선생님에게 문의하세요.');
      wResultView(testId, title, total);
      return;
    }
    alert('채점 오류: '+error.message);
    if(btn){ btn.disabled=false; btn.textContent='제출하고 채점하기'; btn.style.opacity='1'; }
    return;
  }
  // 팡팡포카 자동 지급 (뽑기 연출) 후 결과 화면으로
  await SessionGuard.wait((pcClaimAndReveal(testId)),__mvpEpoch);
  wResultView(testId, title, total);
}

// ===== 결과 확인 화면 (점수·등수 + 틀린문항 + 호머식) =====
async function wResultView(testId, title, total){
const __mvpEpoch=SessionGuard.capture();

  const cont=document.getElementById('wtest-content');
  const sb=sbReady();
  cont.innerHTML = wHeader(_wprofile.name||'학생','학생') + `<div style="text-align:center;color:var(--t3);font-size:12px;padding:20px;">결과 불러오는 중...</div>`;

  const { data:mine } = await SessionGuard.wait((sb.from('submissions').select('answers,score,correct_count').eq('test_id',testId).eq('user_id',_wuser.id).maybeSingle()),__mvpEpoch);
  if(!mine){ cont.innerHTML = wHeader(_wprofile.name||'학생','학생')+`<div class="stg-card"><div style="text-align:center;font-size:12px;color:var(--t3);padding:20px;">제출 기록이 없습니다.</div></div>`; return; }
  // 테스트 유형(주관식 여부) 로드
  const { data:test } = await SessionGuard.wait((sb.from('tests').select('types').eq('id',testId).single()),__mvpEpoch);
  window._wTypes = (test && test.types) ? test.types : new Array(total).fill('mc');
  const { data:wrong } = await SessionGuard.wait((sb.rpc('my_wrong_items', { p_test_id: testId })),__mvpEpoch);
  const wrongList = (wrong||[]).map(w=>({idx:w.item_idx, points:w.item_points}));
  const wrongSet = new Set(wrongList.map(w=>w.idx));
  const myAns = mine.answers || [];

  let grid='';
  for(let i=0;i<total;i++){
    const isWrong = wrongSet.has(i);
    const a = (myAns[i]!=null && myAns[i]!=='') ? myAns[i] : '-';
    grid += `<div style="display:flex;flex-direction:column;align-items:center;gap:2px;padding:6px 4px;border-radius:8px;background:${isWrong?'var(--red-light)':'var(--a3-light)'};min-width:42px;">
      <div style="font-size:9px;color:var(--t3);">${i+1}번</div>
      <div style="font-size:14px;">${isWrong?'❌':'⭕'}</div>
      <div style="font-size:10px;font-weight:700;color:${isWrong?'var(--red)':'var(--a3)'};">${Ui.escape(a)}</div>
    </div>`;
  }

  cont.innerHTML = wHeader(_wprofile.name||'학생','학생') + `
  <div class="stg-card">
    <div class="stg-hdr"><div class="stg-icon">📊</div><div class="stg-title">${Ui.escape(title)} 결과</div></div>
    <div id="w-result"></div>
  </div>
  <div class="stg-card">
    <div class="stg-hdr"><div class="stg-icon">📝</div><div class="stg-title">문항별 채점</div>
      <div class="stg-sub">⭕ 정답 · ❌ 오답</div></div>
    <div style="display:flex;flex-wrap:wrap;gap:6px;">${grid}</div>
    ${wrongList.length?`<div style="margin-top:12px;font-size:12px;color:var(--red);font-weight:700;">틀린 문항: ${wrongList.map(w=>w.idx+1).join(', ')}번</div>`:`<div style="margin-top:12px;font-size:12px;color:var(--a3);font-weight:700;">🎉 모두 맞았어요!</div>`}
  </div>
  <div id="homer-zone"></div>
  <div id="hall-of-fame"></div>
  <div id="mock-analysis-entry"></div>
  <button onclick="renderWStudent()" style="width:100%;margin-top:4px;padding:11px;background:var(--surface);color:var(--t2);border:1px solid var(--border);border-radius:8px;font-size:12px;cursor:pointer;font-family:'Noto Sans KR',sans-serif;">← 목록으로</button>`;

  wShowResult(mine.score, mine.correct_count, null);
  wFillRanks(testId);
  wHomerButton(testId);
  wRenderHall(testId);  wMockEntry(testId, title, total);
}

// 명예의 전당 (전체 + 내 반 1·2·3등)
async function wRenderHall(testId){
const __mvpEpoch=SessionGuard.capture();

  const sb=sbReady();
  const box=document.getElementById('hall-of-fame');
  if(!box)return;
  try{
    const { data, error } = await SessionGuard.wait((sb.rpc('hall_of_fame', { p_test_id: testId })),__mvpEpoch);
    if(error || !data || !data.length) return;
    const medal=r=>r===1?'🥇':r===2?'🥈':r===3?'🥉':r;
    const overall=data.filter(d=>d.scope==='overall');
    const cls=data.filter(d=>d.scope==='class');
    function rows(list){
      if(!list.length) return `<div style="font-size:11px;color:var(--t3);text-align:center;padding:8px;">데이터 없음</div>`;
      return list.map(d=>`<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--border);">
        <div style="font-size:18px;width:28px;text-align:center;">${medal(d.rnk)}</div>
        <div style="flex:1;font-size:13px;font-weight:700;">${d.display_name}</div>
        <div style="font-family:'Space Mono',monospace;font-size:14px;font-weight:700;color:var(--accent);">${d.score}점</div>
      </div>`).join('');
    }
    box.innerHTML = `
    <div class="stg-card" style="background:linear-gradient(135deg,#fffbeb,#fef3c7);border:1px solid #fcd34d;">
      <div class="stg-hdr"><div class="stg-icon">🏆</div><div class="stg-title">명예의 전당</div><div class="stg-sub">이번 회차 TOP 3</div></div>
      <div style="font-size:11px;font-weight:800;color:#92400e;margin:4px 0 2px;">🌍 전체</div>
      ${rows(overall)}
      ${cls.length?`<div style="font-size:11px;font-weight:800;color:#92400e;margin:12px 0 2px;">🏫 우리 반</div>${rows(cls)}`:''}
      <div style="font-size:9px;color:var(--t3);text-align:center;margin-top:8px;">닉네임을 설정하지 않으면 '익명'으로 표시됩니다. (실명은 공개되지 않아요)</div>
    </div>`;
  }catch(e){SessionGuard.assert(__mvpEpoch);}
}

function wShowResult(score, correct, rank){
  const res=document.getElementById('w-result');
  if(!res)return;
  res.innerHTML = `
  <div style="background:var(--accent);border-radius:12px;padding:16px;color:white;text-align:center;">
    <div style="font-size:11px;opacity:.8;">채점 결과</div>
    <div style="font-family:'Space Mono',monospace;font-size:36px;font-weight:700;margin:4px 0;">${score}점</div>
    <div style="font-size:12px;opacity:.9;">${correct}문항 정답</div>
    <div id="w-ranks" style="display:flex;gap:8px;justify-content:center;margin-top:10px;"></div>
  </div>
  <div onclick="showPage('collection')" style="margin-top:8px;padding:10px;background:var(--accent-light);border:1px solid var(--accent-mid);border-radius:8px;font-size:11px;color:var(--accent);text-align:center;font-weight:700;cursor:pointer;">🏅 고난도 문항을 맞췄다면 컬렉션 탭에서 수집 아이콘을 확인하세요!</div>`;
}

// 전체등수 + 반내등수 함께 채우기
async function wFillRanks(testId){
const __mvpEpoch=SessionGuard.capture();

  const sb=sbReady();
  const box=document.getElementById('w-ranks');
  if(!box)return;
  try{
    const { data, error } = await SessionGuard.wait((sb.rpc('my_rank', { p_test_id: testId })),__mvpEpoch);
    if(error || !data || !data.length){ return; }
    const r=data[0];
    let html=`<div style="background:rgba(255,255,255,.18);border-radius:8px;padding:6px 12px;">
      <div style="font-size:9px;opacity:.85;">전체</div>
      <div style="font-family:'Space Mono',monospace;font-size:16px;font-weight:700;">${r.overall_rank}<span style="font-size:10px;opacity:.8;">/${r.overall_total}</span></div>
    </div>`;
    if(r.class_name){
      html+=`<div style="background:rgba(255,255,255,.18);border-radius:8px;padding:6px 12px;">
        <div style="font-size:9px;opacity:.85;">${r.class_name} 반</div>
        <div style="font-family:'Space Mono',monospace;font-size:16px;font-weight:700;">${r.class_rank}<span style="font-size:10px;opacity:.8;">/${r.class_total}</span></div>
      </div>`;
    }
    box.innerHTML=html;
  }catch(e){SessionGuard.assert(__mvpEpoch);}
}

// ===== 원장 화면 (계정관리 탭에 렌더) =====

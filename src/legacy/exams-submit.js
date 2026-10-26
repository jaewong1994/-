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
  try{await SessionGuard.wait((pcClaimAndReveal(testId)),__mvpEpoch);}
  catch{SessionGuard.assert(__mvpEpoch);}
  return wResultView(testId, title, total);
}

// All submitted tests share the same read-only result screen.
async function wResultView(testId, title, total){
  return StudentTestResults.open(testId,title);
}

(function(root){
 'use strict';
 // Read-only student projection. Other students' answers and answer keys never enter this module.
 let request=0;
 const esc=value=>Ui.escape(value),integer=value=>value!==null&&value!==''&&Number.isSafeInteger(Number(value));
 const safe=async task=>{try{return await task();}catch{return {data:null,error:true};}};
 function comparison(rows,n,wrong){
  if(!Array.isArray(rows)||rows.length!==n||new Set(rows.map(r=>r?.item_idx)).size!==n||new Set(rows.map(r=>r?.comparison_ready)).size!==1)return null;
  const ready=rows[0]?.comparison_ready;
  const valid=rows.every(r=>r&&Number.isInteger(r.item_idx)&&r.item_idx>=0&&r.item_idx<n&&r.me_correct===!wrong.has(r.item_idx)&&typeof r.comparison_ready==='boolean'&&
   (ready?integer(r.participant_count)&&Number(r.participant_count)>0&&integer(r.correct_count)&&Number(r.correct_count)>=0&&Number(r.correct_count)<=Number(r.participant_count)&&
    r.correct_rate!==null&&Number.isFinite(Number(r.correct_rate))&&Math.abs(Number(r.correct_rate)-100*Number(r.correct_count)/Number(r.participant_count))<=0.051:
    r.correct_count==null&&r.participant_count==null&&r.correct_rate==null&&r.correct_nicknames==null&&r.wrong_nicknames==null));
  if(!valid||ready&&new Set(rows.map(r=>Number(r.participant_count))).size!==1)return null;
  return new Map(rows.map(r=>[r.item_idx,r]));
 }
 function nicknames(row){
  const valid=(names,count)=>Array.isArray(names)&&names.length===count&&names.every(n=>typeof n==='string'&&n.length<=100);
  return valid(row.correct_nicknames,Number(row.correct_count))&&valid(row.wrong_nicknames,Number(row.participant_count)-Number(row.correct_count));
 }
 function rankCard(label,rank,total){
  if(!integer(rank)||!integer(total)||Number(rank)<1||Number(total)<Number(rank))return '';
  return '<div class="str-metric"><dt>'+esc(label)+'</dt><dd><strong>'+Number(rank)+'</strong><span>등 / '+Number(total)+'명</span></dd></div>';
 }
 function chips(names){return names.length?names.map(n=>'<span class="str-nickname">'+esc(n.trim()||'익명')+'</span>').join(''):'<span class="str-muted">없음</span>';}
 function question(i,mine,wrong,row,peers){
  const missed=wrong.has(i),answer=mine.answers[i]==null||mine.answers[i]===''?'미응답':String(mine.answers[i]);
  let html='<article class="str-question" data-result="'+(missed?'wrong':'correct')+'"><div class="str-question-head"><h3><span class="str-qno">'+(i+1)+'</span>번 문항</h3><span class="str-status '+(missed?'is-wrong':'is-correct')+'">'+(missed?'✕ 오답':'✓ 정답')+'</span></div><p class="str-answer">내 답안 <strong>'+esc(answer)+'</strong></p>';
  if(row?.comparison_ready){
   const correct=Number(row.correct_count),total=Number(row.participant_count),rate=Number(row.correct_rate),wrongRate=100-rate;
   html+='<div class="str-rates"><span>정답 <strong>'+rate.toFixed(1)+'%</strong> · '+correct+'명</span><span>오답 <strong>'+wrongRate.toFixed(1)+'%</strong> · '+(total-correct)+'명</span></div><div class="str-rate-bar" aria-hidden="true"><span style="width:'+rate+'%"></span></div>';
   if(row.me_correct&&correct===1)html+='<p class="str-solo">나 혼자 맞힌 문제</p>';
   if(peers)html+='<div class="str-peers"><button type="button" data-action="peers" aria-expanded="false" aria-controls="str-peers-'+i+'">'+(i+1)+'번 맞힌·틀린 학생 닉네임 보기</button><div class="str-peer-columns" id="str-peers-'+i+'" hidden><div><h4>맞힌 학생 · '+correct+'명</h4><div class="str-chips">'+chips(row.correct_nicknames)+'</div></div><div><h4>틀린 학생 · '+(total-correct)+'명</h4><div class="str-chips">'+chips(row.wrong_nicknames)+'</div></div></div></div>';
   else html+='<p class="str-muted" role="status">학생 명단을 불러오지 못했습니다. <button type="button" data-action="retry">다시 불러오기</button></p>';
  }else{
   html+='<p class="str-muted" role="status">정답률·학생 명단을 불러올 수 없습니다. <button type="button" data-action="retry">다시 불러오기</button></p>';
  }
  return html+'</article>';
 }
 function hall(data){
  const rows=Array.isArray(data)?data.filter(r=>['overall','class'].includes(r.scope)&&integer(r.rnk)&&Number(r.rnk)>0&&Number(r.rnk)<=3&&integer(r.score)&&typeof r.display_name==='string'):[];
  if(!rows.length)return '';
  return '<details class="str-extra"><summary>명예의 전당 · TOP 3</summary>'+['overall','class'].map(scope=>{
   const list=rows.filter(r=>r.scope===scope);return list.length?'<h3>'+(scope==='overall'?'전체':'우리 반')+'</h3><ol class="str-hall">'+list.map(r=>'<li><strong>'+Number(r.rnk)+'등</strong><span>'+esc(r.display_name.trim()||'익명')+'</span><b>'+Number(r.score)+'점</b></li>').join('')+'</ol>':'';
  }).join('')+'</details>';
 }
 async function open(testId,title){
  const cont=document.getElementById('wtest-content'),sb=sbReady(),owner=_wuser?.id;
  if(!cont||!sb||_wprofile?.role!=='student'||!owner||!Number.isSafeInteger(Number(testId))||Number(testId)<1)return;
  const epoch=SessionGuard.capture(),ticket=++request,host=document.createElement('section');host.className='student-test-results';
  cont.innerHTML=wHeader(_wprofile.name||'학생','학생');cont.append(host);
  const current=()=>{try{SessionGuard.assert(epoch);return ticket===request&&host.isConnected&&_wuser?.id===owner&&_wprofile?.role==='student';}catch{return false;}};
  host.innerHTML='<p class="str-loading" role="status">점수와 문항별 결과를 불러오는 중입니다.</p>';
  host.addEventListener('click',event=>{
   const button=event.target.closest('button[data-action]');if(!button||!current())return;
   if(button.dataset.action==='back'){request++;renderWStudent();}
   else if(button.dataset.action==='retry')open(testId,title);
   else if(button.dataset.action==='peers'){
    const panel=host.querySelector('#'+button.getAttribute('aria-controls'));if(!panel)return;
    const expanded=button.getAttribute('aria-expanded')==='true';panel.hidden=expanded;button.setAttribute('aria-expanded',String(!expanded));
   }
   else if(button.dataset.action==='filter'){
    const filter=button.dataset.filter;host.querySelectorAll('[data-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
    let visible=0;host.querySelectorAll('[data-result]').forEach(card=>{card.hidden=filter!=='all'&&card.dataset.result!==filter;if(!card.hidden)visible++;});
    host.querySelector('.str-empty').hidden=visible>0;
   }
  });
  const rpc=name=>safe(()=>sb.rpc(name,{p_test_id:testId}));
  const [exam,submission,wrongResult,rankResult,peerResult,hallResult]=await Promise.all([
   safe(()=>sb.from('tests').select('id,title,total,closed,types').eq('id',testId).single()),
   safe(()=>sb.from('submissions').select('answers,score,correct_count').eq('test_id',testId).eq('user_id',owner).maybeSingle()),
   rpc('my_wrong_items'),rpc('my_rank'),sb.schema==='shared-tests-v1'?rpc('student_test_results'):Promise.resolve(null),rpc('hall_of_fame')
  ]);
  if(!current())return;
  const examData=exam.data,n=examData?.total,mine=submission.data,wrongRows=wrongResult.data;
  const buttons='<div class="str-actions"><button type="button" data-action="back">← 테스트 목록</button><button type="button" data-action="retry">다시 불러오기</button></div>';
  if(exam.error||submission.error||wrongResult.error||!Number.isInteger(n)||n<1||n>100||!mine||!Array.isArray(mine.answers)||!Array.isArray(wrongRows)||wrongRows.some(r=>!Number.isInteger(r?.item_idx)||r.item_idx<0||r.item_idx>=n)){
   host.innerHTML='<div class="stg-card"><h2>결과를 불러오지 못했어요</h2><p role="alert">제출 기록과 채점 결과를 확인할 수 없습니다. 잠시 후 다시 불러와 주세요.</p>'+buttons+'</div>';return;
  }
  const wrong=new Set(wrongRows.map(r=>r.item_idx)),closed=examData.closed===true;
  window._wTypes=Array.isArray(examData.types)?examData.types:Array(n).fill('mc');
  let stats=!peerResult?.error?comparison(peerResult?.data,n,wrong):null;
  let hasPeers=stats?.get(0)?.comparison_ready&&[...stats.values()].every(nicknames);
  if(!stats&&sb.schema==='shared-tests-v1'){
   const fallback=await rpc('mock_item_analysis');if(!current())return;
   stats=!fallback.error?comparison(fallback.data,n,wrong):null;hasPeers=false;
  }
  const rank=!rankResult.error&&Array.isArray(rankResult.data)?rankResult.data[0]:null;
  const validRank=rank&&integer(rank.score)&&integer(mine.score)&&Number(rank.score)===Number(mine.score);
  const overall=validRank?rankCard('전체 등수',rank.overall_rank,rank.overall_total):'';
  const cls=validRank&&rank.class_name?rankCard(rank.class_name+' · 반 등수',rank.class_rank,rank.class_total):'';
  const score=integer(mine.score)?Number(mine.score)+'<small>점</small>':'<small>채점 확인 중</small>';
  const comparisonReady=stats?.get(0)?.comparison_ready===true;
  let note=comparisonReady?'현재 제출한 '+Number(stats.get(0).participant_count)+'명 기준 · 미응답은 오답에 포함됩니다.'+(closed?'':' 추가 제출에 따라 정답률이 바뀔 수 있어요.'):stats?'이 시험의 문항별 비교는 아직 공개되지 않았습니다.':'문항별 비교를 불러오지 못했어요. 내 답안은 확인할 수 있습니다. 다시 불러와 주세요.';
  if(comparisonReady&&!hasPeers)note+=' 학생 닉네임은 아직 불러올 수 없습니다.';
  host.innerHTML='<div class="str-heading"><div><p class="str-eyebrow">나의 테스트 결과</p><h2>'+esc(examData.title||title||'테스트')+'</h2></div><span class="str-state">'+(closed?'시험 마감':'진행 중')+'</span></div>'+buttons+
   '<section class="stg-card str-overview" aria-label="점수와 등수"><dl><div class="str-score"><dt>내 점수</dt><dd>'+score+'</dd></div>'+overall+cls+'</dl><p class="str-summary">맞힌 문제 '+(n-wrong.size)+'개 · 오답 '+wrong.size+'개 <span>/ '+n+'문항</span></p>'+
   (overall?'<p class="str-muted">동점자는 같은 등수입니다.'+(closed?'':' 진행 중인 시험은 응시자에 따라 등수가 바뀔 수 있어요.')+'</p>':'<p class="str-muted" role="status">등수를 불러오지 못했어요. 다시 불러오기를 눌러 주세요.</p>')+'</section>'+
   '<section class="stg-card str-analysis"><h2>문항별 결과</h2><p class="str-note"'+(!comparisonReady||!hasPeers?' role="status"':'')+'>'+note+'</p>'+
   (hasPeers?'<p class="str-muted">닉네임만 표시되며, 미설정 학생은 익명으로 표시됩니다.</p>':'')+
   '<div class="str-filters" role="group" aria-label="문항 필터">'+[['all','전체',n],['wrong','오답',wrong.size],['correct','정답',n-wrong.size]].map(([key,label,count])=>'<button type="button" data-action="filter" data-filter="'+key+'" aria-pressed="'+(key==='all')+'">'+label+' <b>'+count+'</b></button>').join('')+'</div>'+
   '<div class="str-questions">'+Array.from({length:n},(_,i)=>question(i,mine,wrong,stats?.get(i),hasPeers)).join('')+'</div><p class="str-empty" role="status" hidden>해당하는 문항이 없습니다.</p></section>'+
   '<section class="stg-card str-more"><h2>더 살펴보기</h2>'+hall(hallResult.error?null:hallResult.data)+'<details class="str-extra"><summary>실수한 문제로 가상 점수 확인</summary><div id="homer-zone"></div></details><button type="button" class="str-collection" onclick="showPage(\'collection\')">내 컬렉션 보기 →</button></section>';
  if(typeof wHomerButton==='function')wHomerButton(testId);
 }
 root.StudentTestResults=Object.freeze({open});
})(window);

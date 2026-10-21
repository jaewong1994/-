function escHtml(v){return String(v==null?'':v).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}
function isDirectorRole(){
  const role=String(_wprofile?.role||'').trim().toLowerCase();
  return role==='director' || role==='원장';
}
function staffRoleLabel(){
  return isDirectorRole()?'원장 · 관리자':'선생님 · 관리자';
}
function staffToolbar(active,persistent=false){
  const shared=document.getElementById('mvp-staff-navigation');if(!persistent&&shared&&!shared.hidden){setStaffActive(active);return '';}
  const item=(id,fn,icon,label)=>`<button type="button" data-staff-id="${id}" class="staff-tool${active===id?' on':''}" onclick="${fn}" ${active===id?'aria-current="page"':''}><i class="ti ${icon}" aria-hidden="true"></i><span>${Ui.escape(label)}</span></button>`;
  return `<div class="staff-toolbar" role="toolbar" aria-label="관리 메뉴">${item('tests',"showCat('wtest')",'ti-clipboard-list','테스트')}${item('classes',"showStaffSection('classes')",'ti-users','반·학생')}${item('counsel',"showCat('counsel')",'ti-school','입시상담')}${item('exam',"showCat('exam-counsel')",'ti-chart-bar','테스트 상담')}${item('poka',"showStaffSection('poka')",'ti-cards','포카')}</div>`;
}
function ownerBadge(name){
  const label=String(name||'').trim();
  if(!label) return '';
  return `<span class="staff-owner" title="${escHtml(label)}">${escHtml(label)}</span>`;
}
function missingCreatedByCol(err){
  return /created_by/i.test(String(err?.message||err?.details||err?.hint||''));
}
async function insertManagedTest(payload){
const __mvpEpoch=SessionGuard.capture();

  const sb=sbReady();
  const draft={...payload};
  // The observed shared-test schema has no creator column. Never reassign existing test IDs.
  if(sb.schema==='shared-tests-v1')delete draft.created_by;
  const { error } = await SessionGuard.wait((sb.from('tests').insert(draft)),__mvpEpoch);
  return error;
}
async function loadManagedTests(){
const __mvpEpoch=SessionGuard.capture();

  const sb=sbReady();
  const rpc=await SessionGuard.wait((sb.rpc('list_managed_tests')),__mvpEpoch);
  return rpc;
}
async function loadTestSubmissions(testId){
const __mvpEpoch=SessionGuard.capture();

  const sb=sbReady();
  const rpc=await SessionGuard.wait((sb.rpc('staff_test_submissions', { p_test_id: testId })),__mvpEpoch);
  if(rpc.error||!Array.isArray(rpc.data))return rpc;
  return {...rpc,data:rankTestSubmissions(rpc.data)};
}

// RPC and paginated compatibility reads need not arrive in score order.
// Rank the complete visible set, without mutating stored submissions or rewards.
function rankTestSubmissions(submissions){
  const rows=submissions.map(s=>({...s,score:s.score!==null&&s.score!==undefined&&String(s.score).trim()!==''&&Number.isFinite(Number(s.score))?Number(s.score):null}));
  rows.sort((a,b)=>a.score===null?(b.score===null?String(a.user_id).localeCompare(String(b.user_id)):1):b.score===null?-1:b.score-a.score||String(a.user_id).localeCompare(String(b.user_id)));
  let previous=null,rank=null;
  return rows.map((s,i)=>{
    if(s.score!==null&&s.score!==previous)rank=i+1;
    previous=s.score;
    return {...s,rank:s.score===null?null:rank};
  });
}

async function renderWTeacher(){
if(!window.AppSession?.can('manage-tests')&&!window.AppSession?.can('read-tests'))return;

const __mvpEpoch=SessionGuard.capture();

  const cont=document.getElementById('wtest-content');
  const sb=sbReady();
  cont.innerHTML = wHeader(_wprofile.name|| (isDirectorRole()?'원장':'선생님'), staffRoleLabel()) + staffToolbar('tests');

  const { data:tests, error } = await SessionGuard.wait((loadManagedTests()),__mvpEpoch);
  const ownerIds=[...new Set((tests||[]).map(t=>t.created_by).filter(Boolean))];
  const owners={};
  (tests||[]).forEach(t=>{ if(t.owner_name) owners[t.created_by]=t.owner_name; });
  if(ownerIds.some(id=>!owners[id])){
    const { data:op } = await SessionGuard.wait((sb.from('profiles').select('id,name').in('id',ownerIds)),__mvpEpoch);
    (op||[]).forEach(p=>{ if(!owners[p.id]) owners[p.id]=p.name||'이름 미설정'; });
  }

  let listHtml = `<div id="w-teacher-detail-view" hidden><button type="button" class="staff-row-btn" onclick="closeTopDetail('w-teacher-detail')">테스트 목록으로</button><div id="w-teacher-detail"></div></div><div class="stg-card" id="w-teacher-detail-list">
    <div class="stg-hdr"><div class="stg-icon" aria-hidden="true"><i class="ti ti-clipboard-list"></i></div><div class="stg-title">테스트 관리</div>
      <button type="button" class="staff-add" onclick="wNewTest()">+ 새 테스트</button>
    </div>`;
  if(error){
    listHtml += `<div class="staff-empty">테스트를 불러오지 못했습니다.<br>${escHtml(error.message)}</div>`;
  } else if(tests && tests.length){
    for(const t of tests){
      const ownerName=t.owner_name||(t.created_by?owners[t.created_by]:'');
      const safeTitle=escHtml(t.title||'제목 없음');
      const jsTitle=t.title||'';
      listHtml += `<div class="staff-row">
        <div class="staff-row-meta"><div class="staff-row-title"><span class="staff-row-name">${safeTitle}</span>${t.closed?'<span class="staff-owner">마감</span>':''}${ownerBadge(ownerName)}</div>
        <div class="staff-row-sub">${escHtml(t.exam_date||'')} · ${t.total}문항</div></div>
        <div class="staff-row-actions">
        <button type="button" class="staff-row-btn" onclick="wRenameTest(${t.id},${Ui.argument(jsTitle)})">이름변경</button>
        <button type="button" class="staff-row-btn" onclick="wEditKey(${t.id},${Ui.argument(jsTitle)})">정답수정</button>
        <button type="button" class="staff-row-btn" onclick="wCopyTest(${t.id},${Ui.argument(jsTitle)})">복사</button>
        ${t.closed?'':`<button type="button" class="staff-row-btn" onclick="wAssign(${t.id},${Ui.argument(jsTitle)})">대상</button>`}
        <button type="button" class="staff-row-btn rank" onclick="wViewRank(${t.id},${Ui.argument(jsTitle)})">등수</button>
        <button type="button" class="staff-row-btn danger" onclick="wDeleteTest(${t.id},${Ui.argument(jsTitle)})">삭제</button>
        </div>
      </div>`;
    }
  } else {
    listHtml += `<div class="staff-empty">${isDirectorRole()||sb.schema==='shared-tests-v1'?'아직 등록된 테스트가 없습니다.':'아직 내가 만든 테스트가 없습니다.'}</div>`;
  }
  listHtml += `</div>`;
  cont.innerHTML += listHtml;
  if(AppSession.context()?.mode==='server'&&!AppSession.can('manage-tests')){cont.insertAdjacentHTML('afterbegin','<p class=\"mvp-read-notice\">조회 전용입니다. 출제·수정·배정·삭제는 사용할 수 없습니다.</p>');cont.querySelectorAll('button[onclick]').forEach(b=>{if(!/^(wViewRank|closeTopDetail)/.test(b.getAttribute('onclick')))b.hidden=true;});}
}

// 테스트 삭제
async function wDeleteTest(testId, title){
if(!window.AppSession?.can('manage-tests'))return;

const __mvpEpoch=SessionGuard.capture();

  if(!confirm(`"${Ui.escape(title)}"을(를) 삭제할까요?\n제출된 답안과 배정 정보도 함께 삭제됩니다. (되돌릴 수 없음)`)) return;
  const sb=sbReady();
  // Existing schema uses ON DELETE CASCADE. One database statement preserves atomicity.
  const { error } = await SessionGuard.wait((sb.from('tests').delete().eq('id',testId)),__mvpEpoch);
  if(error){ alert('삭제 실패: '+error.message); return; }
  showToast('삭제되었습니다');
  renderWTeacher();
}

// 테스트 이름 변경
async function wRenameTest(testId, oldTitle){
if(!window.AppSession?.can('manage-tests'))return;

const __mvpEpoch=SessionGuard.capture();

  const nt=prompt('새 테스트 이름을 입력하세요:', oldTitle);
  if(nt===null) return;
  const name=nt.trim();
  if(!name){ alert('이름을 입력하세요.'); return; }
  const sb=sbReady();
  const { error } = await SessionGuard.wait((sb.from('tests').update({title:name}).eq('id',testId)),__mvpEpoch);
  if(error){ alert('변경 실패: '+error.message); return; }
  showToast('이름이 변경되었습니다');
  renderWTeacher();
}

// 테스트 복사 (답·배점·유형·난이도 동일, 미마감·미배정 상태로 새로 생성)
async function wCopyTest(testId, title){
if(!window.AppSession?.can('manage-tests'))return;

const __mvpEpoch=SessionGuard.capture();

  const sb=sbReady();
  const def=`${Ui.escape(title)} (복사본)`;
  const nt=prompt('복사본 이름을 입력하세요:', def);
  if(nt===null) return;
  const name=nt.trim()||def;
  showToast('복사 중...');
  // 원본 로드
  const { data:src, error:e1 } = await SessionGuard.wait((readStaffTest(testId)),__mvpEpoch);
  if(e1 || !src){ alert('원본을 불러오지 못했습니다: '+(e1?e1.message:'')); return; }
  // 새 행 생성 (id/생성시각 제외, 마감 해제)
  const today=new Date().toISOString().slice(0,10);
  const ins={
    title:name, answers:src.answers, types:src.types, points:src.points,
    levels:src.levels, total:src.total, closed:false, exam_date:today,
    created_by:_wuser.id
  };
  const e2 = await SessionGuard.wait((insertManagedTest(ins)),__mvpEpoch);
  if(e2){ alert('복사 실패: '+e2.message); return; }
  showToast('복사되었습니다');
  renderWTeacher();
}

// ===== 테스트 정답·유형·배점·난이도 수정 (생성 후 수정 + 기존 제출 전원 재채점) =====
// 문항 수(total)는 고정 — 바꾸려면 '복사'로 새 테스트를 만드세요 (기존 제출 답안 길이와 어긋남 방지)
function _ekPad(arr, total, def){
  const a=(Array.isArray(arr)?arr:[]).slice(0,total);
  while(a.length<total) a.push(def);
  return a;
}

async function wEditKey(testId, title){
if(!window.AppSession?.can('manage-tests'))return;

const __mvpEpoch=SessionGuard.capture();

  const sb=sbReady();
  const d=document.getElementById('w-teacher-detail');
  const detailRequest=openTopDetail('w-teacher-detail');
  d.innerHTML = `<div class="stg-card"><div style="text-align:center;font-size:12px;color:var(--t3);">불러오는 중...</div></div>`;
  const { data:test, error } = await SessionGuard.wait((readStaffTest(testId)),__mvpEpoch);
  if(!currentTopDetail('w-teacher-detail',detailRequest))return;
  if(error || !test){
    d.innerHTML = `<div class="stg-card"><div style="font-size:12px;color:var(--red);">불러오기 실패: ${Ui.escape(error?error.message:'테스트 없음')}</div></div>`;
    return;
  }
  const total=test.total;
  const { count } = await SessionGuard.wait((sb.from('submissions').select('id',{count:'exact',head:true}).eq('test_id',testId)),__mvpEpoch);
  if(!currentTopDetail('w-teacher-detail',detailRequest))return;

  window._ekTestId = testId;
  window._ekTitle  = test.title||title||'';
  window._ekTotal  = total;
  window._ekSubs   = count||0;
  window._ekClosed = !!test.closed;
  window._ekOrig    = _ekPad(test.answers,total,'').map(a=>a==null?'':String(a));
  window._ekAnswers = window._ekOrig.slice();
  window._ekTypes   = _ekPad(test.types,total,'mc').map(t=>t||'mc');
  window._ekPoints  = _ekPad(test.points,total,5).map(p=>parseInt(p)||0);
  window._ekLevels  = _ekPad(test.levels,total,'').map(l=>l||'');

  let rows='';
  for(let i=0;i<total;i++){
    const mc = window._ekTypes[i]==='mc';
    const lv = window._ekLevels[i];
    const lvBtn=(v,label,tip)=>{
      const on = lv===v;
      return `<button class="ek-lv-btn ${on?'on':''}" data-lq="${i}" data-lv="${v}" onclick="wEkSetLevel(${i},'${v}')" title="${tip}" style="width:26px;height:26px;border-radius:6px;border:1px solid ${on?'var(--accent)':'var(--border)'};background:${on?(v===''?'var(--accent)':'var(--accent-light)'):'var(--white)'};color:${on&&v===''?'white':'inherit'};cursor:pointer;font-size:${v===''?'10px':'13px'};">${Ui.escape(label)}</button>`;
    };
    rows += `<div class="ek-qrow" data-qrow="${i}" style="display:flex;align-items:center;gap:6px;padding:6px;border-radius:8px;border:1px solid var(--border);margin-bottom:5px;flex-wrap:wrap;">
      <div class="omr-qn" style="width:22px;">${i+1}</div>
      <div style="display:flex;gap:3px;flex-shrink:0;">
        <button class="ek-type-btn ${mc?'on':''}" data-tq="${i}" data-type="mc" onclick="wEkSetType(${i},'mc')" style="padding:4px 6px;font-size:10px;border-radius:6px;border:1px solid ${mc?'var(--accent)':'var(--border)'};background:${mc?'var(--accent)':'var(--white)'};color:${mc?'white':'var(--t3)'};cursor:pointer;font-family:'Noto Sans KR',sans-serif;font-weight:700;">객</button>
        <button class="ek-type-btn ${mc?'':'on'}" data-tq="${i}" data-type="sa" onclick="wEkSetType(${i},'sa')" style="padding:4px 6px;font-size:10px;border-radius:6px;border:1px solid ${mc?'var(--border)':'var(--accent)'};background:${mc?'var(--white)':'var(--accent)'};color:${mc?'var(--t3)':'white'};cursor:pointer;font-family:'Noto Sans KR',sans-serif;font-weight:700;">주</button>
      </div>
      <div class="ek-ansbox" data-ansbox="${i}" style="flex:1;min-width:140px;"></div>
      <input class="ek-pt" data-pt="${i}" type="number" min="1" value="${window._ekPoints[i]}" style="width:38px;padding:5px;border:1px solid var(--border);border-radius:6px;font-family:'Space Mono',monospace;font-size:12px;text-align:center;flex-shrink:0;" title="배점">
      <div style="display:flex;gap:2px;flex-shrink:0;">
        ${lvBtn('','·','일반')}${lvBtn('jun','⚔️','준킬러')}${lvBtn('kill','💀','킬러')}${lvBtn('god','👑','GOD')}
      </div>
    </div>`;
  }

  const warn = window._ekSubs
    ? `<div style="background:var(--accent-light);border:1px solid var(--accent-mid);border-radius:8px;padding:9px 11px;margin-bottom:10px;font-size:10px;color:var(--accent);line-height:1.6;">
         ⚠️ 이미 <strong>${window._ekSubs}명</strong>이 제출했습니다. 저장하면 이 학생들의 점수·개수가 <strong>새 정답 기준으로 자동 재채점</strong>됩니다. (학생이 낸 답안과 제출 시각은 그대로 유지)
         ${window._ekClosed?'<br>🔒 <strong>이미 마감된 테스트</strong>입니다. 점수·등수는 다시 계산되지만, <strong>이미 지급된 메달·배지는 자동으로 조정되지 않습니다.</strong>':''}
       </div>`
    : '';

  d.innerHTML = `<div class="stg-card">
    <div class="stg-hdr"><div class="stg-icon">🛠️</div><div class="stg-title">정답 수정</div><div class="stg-sub">${window._ekTitle} · ${total}문항</div></div>
    ${warn}
    <div style="font-size:9px;color:var(--t3);margin-bottom:8px;line-height:1.6;">주관식 복수정답 <code style="background:var(--surface);padding:0 4px;border-radius:3px;">|</code> 구분 · 난이도: ⚔️준킬 💀킬 👑GOD<br>문항 수 변경은 이 화면에서 할 수 없어요. 필요하면 '복사'로 새 테스트를 만드세요.</div>
    <div style="max-height:460px;overflow-y:auto;padding:2px;">${rows}</div>
    <button onclick="wSaveKey()" style="width:100%;margin-top:12px;padding:11px;background:var(--accent);color:white;border:none;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;font-family:'Noto Sans KR',sans-serif;">저장${window._ekSubs?' + 전원 재채점':''}</button>
    <button onclick="renderWTeacher()" style="width:100%;margin-top:8px;padding:10px;background:var(--surface);color:var(--t2);border:1px solid var(--border);border-radius:8px;font-size:12px;cursor:pointer;font-family:'Noto Sans KR',sans-serif;">← 목록으로</button>
    <div id="ek-msg" style="font-size:11px;color:var(--red);margin-top:8px;text-align:center;"></div>
  </div>`;

  for(let i=0;i<total;i++){ wEkRenderBox(i); wEkMark(i); }
}

// 문항별 정답 입력 영역 렌더 (유형에 따라 버블 또는 텍스트)
function wEkRenderBox(i){
  const box=document.querySelector(`.ek-ansbox[data-ansbox="${i}"]`);
  if(!box) return;
  if(window._ekTypes[i]==='mc'){
    let opts='';
    for(let n=1;n<=5;n++){
      const sel=String(window._ekAnswers[i])===String(n);
      opts+=`<button class="omr-bubble ${sel?'on':''}" data-ekq="${i}" data-ekn="${n}" onclick="wEkPick(${i},${n})">${n}</button>`;
    }
    box.innerHTML=`<div class="omr-opts">${opts}</div>`;
  } else {
    const val=String(window._ekAnswers[i]||'');
    box.innerHTML=`<input class="ek-sa-inp" data-saq="${i}" value="${val.replace(/"/g,'&quot;')}" oninput="wEkType(${i},this.value)" placeholder="정답 입력 (복수: 답1|답2)" style="width:100%;padding:6px 8px;border:1px solid var(--border);border-radius:6px;font-size:12px;font-family:'Noto Sans KR',sans-serif;">`;
  }
}

// 원본과 달라진 문항 표시
function wEkMark(i){
  const row=document.querySelector(`.ek-qrow[data-qrow="${i}"]`);
  if(!row) return;
  const changed = String(window._ekOrig[i]||'') !== String(window._ekAnswers[i]||'');
  row.style.borderColor = changed?'var(--accent)':'var(--border)';
  row.style.background  = changed?'var(--accent-light)':'transparent';
}

function wEkSetType(i, type){
  window._ekTypes[i]=type;
  // 객관식으로 바꿀 때 1~5가 아니면 초기화, 주관식으로 바꿀 때는 기존 값 유지
  if(type==='mc' && !/^[1-5]$/.test(String(window._ekAnswers[i]||'').trim())) window._ekAnswers[i]='';
  document.querySelectorAll(`.ek-type-btn[data-tq="${i}"]`).forEach(b=>{
    const on=b.dataset.type===type;
    b.classList.toggle('on',on);
    b.style.background=on?'var(--accent)':'var(--white)';
    b.style.color=on?'white':'var(--t3)';
    b.style.borderColor=on?'var(--accent)':'var(--border)';
  });
  wEkRenderBox(i); wEkMark(i);
}

function wEkSetLevel(i, lv){
  window._ekLevels[i]=lv;
  document.querySelectorAll(`.ek-lv-btn[data-lq="${i}"]`).forEach(b=>{
    const on=b.dataset.lv===lv;
    b.classList.toggle('on',on);
    b.style.borderColor=on?'var(--accent)':'var(--border)';
    b.style.background=on?(lv===''?'var(--accent)':'var(--accent-light)'):'var(--white)';
    b.style.color=(on&&lv==='')?'white':'inherit';
  });
}

function wEkPick(q,n){
  window._ekAnswers[q]=String(n);
  document.querySelectorAll(`.omr-bubble[data-ekq="${q}"]`).forEach(b=>{
    b.classList.toggle('on', String(b.dataset.ekn)===String(n));
  });
  wEkMark(q);
}
function wEkType(q,v){ window._ekAnswers[q]=v; wEkMark(q); }

async function wSaveKey(){
const __mvpEpoch=SessionGuard.capture();

  const sb=sbReady();
  const testId=window._ekTestId, total=window._ekTotal;
  const msg=document.getElementById('ek-msg');
  const answers=(window._ekAnswers||[]).map(a=>a==null?'':String(a).trim());
  const types=(window._ekTypes||[]).map(t=>t||'mc');
  const levels=(window._ekLevels||[]).map(l=>l||'');
  const points=[];
  document.querySelectorAll('.ek-pt').forEach(el=>{ points[parseInt(el.dataset.pt)]=parseInt(el.value)||0; });

  // 검증
  for(let i=0;i<total;i++){
    if(!answers[i]){ msg.style.color='var(--red)'; msg.textContent=`${i+1}번 정답을 입력하세요.`; return; }
    if(types[i]==='mc' && !/^[1-5]$/.test(answers[i])){
      msg.style.color='var(--red)'; msg.textContent=`${i+1}번은 객관식입니다. 1~5 중에서 고르세요.`; return;
    }
    if(!(points[i]>0)){ msg.style.color='var(--red)'; msg.textContent=`${i+1}번 배점을 확인하세요.`; return; }
  }

  // 변경 요약 후 확인
  const diffs=[];
  for(let i=0;i<total;i++){
    if(String(window._ekOrig[i]||'')!==answers[i]) diffs.push(`${i+1}번 ${window._ekOrig[i]||'(없음)'} → ${answers[i]}`);
  }
  const subs=window._ekSubs||0;
  let cmsg = diffs.length
    ? `정답 변경 ${diffs.length}개\n\n${diffs.slice(0,12).join('\n')}${diffs.length>12?`\n… 외 ${diffs.length-12}개`:''}\n\n`
    : `정답 변경 없음 (유형·배점·난이도만 저장)\n\n`;
  cmsg += subs ? `제출한 학생 ${subs}명의 점수가 새 정답 기준으로 다시 계산됩니다.` : `저장할까요?`;
  if(subs && window._ekClosed) cmsg += `\n(마감된 테스트, 이미 지급된 메달은 조정되지 않습니다)`;
  if(!confirm(cmsg)) return;

  msg.style.color='var(--t3)'; msg.textContent = subs?'저장 + 재채점 중...':'저장 중...';
  const { data, error } = await SessionGuard.wait((sb.rpc('teacher_update_key', {
    p_test_id:testId, p_answers:answers, p_types:types, p_points:points, p_levels:levels
  })),__mvpEpoch);
  if(error){
    msg.style.color='var(--red)';
    msg.textContent='정답 저장·재채점을 확인하지 못했습니다. 기존 정답만 따로 덮어쓰지 않았습니다. 연결 상태를 확인해 주세요.';
    return;
  }
  showToast(subs ? `저장 완료 · ${data}명 재채점됨` : '저장 완료');
  renderWTeacher();
}

// ===== 반·학생 관리 =====
async function wManageClasses(){
if(!window.AppSession?.can('manage-tests'))return;

const __mvpEpoch=SessionGuard.capture();

  const sb=sbReady();
  const cont=document.getElementById('wtest-content');
  cont.innerHTML = wHeader(_wprofile.name|| (isDirectorRole()?'원장':'선생님'), staffRoleLabel())
    + staffToolbar('classes')
    + `<div class="staff-empty">불러오는 중...</div>`;

  const { data:classes } = await SessionGuard.wait((sb.from('classes').select('id,name').order('id')),__mvpEpoch);
  const { data:profs } = await SessionGuard.wait((sb.from('profiles').select('id,name,student_no,role,class_id').eq('role','student').order('name')),__mvpEpoch);
  const cmap={}; (classes||[]).forEach(c=>cmap[c.id]=c.name);

  // 반 관리 카드
  let classHtml = `<div class="stg-card"><div class="stg-hdr"><div class="stg-icon">🏫</div><div class="stg-title">반 관리</div></div>
    <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px;">`;
  (classes||[]).forEach(c=>{
    const cnt=(profs||[]).filter(p=>p.class_id===c.id).length;
    classHtml += `<div style="display:flex;align-items:center;gap:5px;padding:6px 10px;background:var(--accent-light);border:1px solid var(--accent-mid);border-radius:20px;">
      <span style="font-size:12px;font-weight:700;color:var(--accent);">${Ui.escape(c.name)}</span>
      <span style="font-size:10px;color:var(--t3);">${cnt}명</span>
      ${AppSession.context()?.operations==='legacy-compatible-v1'&&!AppSession.can('accounts')?'':`<button type="button" aria-label="반 삭제" onclick="wDeleteClass(${c.id},${Ui.argument(c.name)})" style="cursor:pointer;color:var(--red);font-size:13px;font-weight:700;margin-left:2px;">×</button>`}
    </div>`;
  });
  classHtml += `</div>
    <div style="display:flex;gap:6px;">
      <input id="new-class-name" class="target-select" style="flex:1;" placeholder="새 반 이름 (예: DSM)">
      <button onclick="wAddClass()" style="padding:9px 14px;background:var(--accent);color:white;border:none;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer;font-family:'Noto Sans KR',sans-serif;">추가</button>
    </div></div>`;

  // 학생 배정 카드
  let studentHtml = `<div class="stg-card"><div class="stg-hdr"><div class="stg-icon">🧑‍🎓</div><div class="stg-title">학생 반 배정</div><div class="stg-sub">${(profs||[]).length}명</div></div>`;
  if(!profs || !profs.length){
    studentHtml += `<div style="font-size:12px;color:var(--t3);text-align:center;padding:14px 0;">등록된 학생이 없습니다.</div>`;
  } else {
    const opts = c=>`<option value="">미배정</option>`+(classes||[]).map(cc=>`<option value="${cc.id}" ${c===cc.id?'selected':''}>${Ui.escape(cc.name)}</option>`).join('');
    profs.forEach(p=>{
      studentHtml += `<div style="display:flex;align-items:center;gap:10px;padding:9px 0;border-bottom:1px solid var(--border);">
        <div style="flex:1;"><div style="font-size:12px;font-weight:700;">${Ui.escape(p.name||'(이름없음)')}</div><div style="font-size:9px;color:var(--t3);">${Ui.escape(p.student_no||'')}</div></div>
        <select onchange="wSetStudentClass('${p.id}',this.value)" class="target-select" style="width:110px;padding:6px;font-size:11px;">${opts(p.class_id)}</select>
      </div>`;
    });
  }
  studentHtml += `</div>`;

  cont.innerHTML = wHeader(_wprofile.name|| (isDirectorRole()?'원장':'선생님'), staffRoleLabel())
    + staffToolbar('classes') + classHtml + studentHtml;
}

async function wAddClass(){
if(!window.AppSession?.can('manage-tests'))return;

const __mvpEpoch=SessionGuard.capture();

  const sb=sbReady();
  const name=document.getElementById('new-class-name').value.trim();
  if(!name) return;
  const { error } = await SessionGuard.wait((sb.from('classes').insert({name})),__mvpEpoch);
  if(error){ alert('추가 실패: '+error.message); return; }
  wManageClasses();
}
async function wDeleteClass(id, name){
if(!window.AppSession?.can('manage-tests'))return;
if(AppSession.context()?.operations==='legacy-compatible-v1'&&!AppSession.can('accounts')){showToast('전체 반 삭제는 원장 계정에서 할 수 있습니다.');return;}

const __mvpEpoch=SessionGuard.capture();

  if(!confirm(`${Ui.argument(name)} 반을 삭제할까요?\n이 반 학생들은 미배정 상태가 됩니다.`)) return;
  const sb=sbReady();
  // Live profiles.class_id is NO ACTION: detach and delete in one director-only transaction.
  const operation=sb.schema==='shared-tests-v1'?sb.rpc('delete_class',{p_class_id:id}):sb.from('classes').delete().eq('id',id);
  const { error } = await SessionGuard.wait(operation,__mvpEpoch);
  if(error){ alert('삭제 실패: '+error.message); return; }
  wManageClasses();
}
async function wSetStudentClass(uid, classId){
if(!window.AppSession?.can('manage-tests'))return;

const __mvpEpoch=SessionGuard.capture();

  const sb=sbReady();
  const changed=await SessionGuard.wait((sb.from('profiles').update({class_id: classId===''?null:parseInt(classId)}).eq('id',uid)),__mvpEpoch);
  if(changed.error){showToast('반 배정을 저장하지 못했습니다.');await wManageClasses();return;}
  showToast('반 배정 변경됨');
}

// ===== 테스트 대상 지정 =====
async function wAssign(testId, title){
if(!window.AppSession?.can('manage-tests'))return;

const __mvpEpoch=SessionGuard.capture();

  const sb=sbReady();
  const d=document.getElementById('w-teacher-detail');
  const detailRequest=openTopDetail('w-teacher-detail');
  d.innerHTML = `<div class="stg-card"><div style="text-align:center;font-size:12px;color:var(--t3);">불러오는 중...</div></div>`;
  const { data:classes } = await SessionGuard.wait((sb.from('classes').select('id,name').order('id')),__mvpEpoch);
  if(!currentTopDetail('w-teacher-detail',detailRequest))return;
  const { data:profs } = await SessionGuard.wait((sb.from('profiles').select('id,name,student_no,class_id').eq('role','student').order('name')),__mvpEpoch);
  if(!currentTopDetail('w-teacher-detail',detailRequest))return;
  const { data:assigned } = await SessionGuard.wait((sb.from('test_assignments').select('user_id').eq('test_id',testId)),__mvpEpoch);
  if(!currentTopDetail('w-teacher-detail',detailRequest))return;
  const aset = new Set((assigned||[]).map(a=>a.user_id));
  window._assignSet = aset;

  let html = `<div class="stg-card">
    <div class="stg-hdr"><div class="stg-icon">🎯</div><div class="stg-title">${Ui.escape(title)} · 응시 대상 지정</div></div>
    <div style="font-size:10px;color:var(--t3);margin-bottom:10px;line-height:1.5;">반 전체를 선택하거나 학생을 개별 선택하세요. 지정된 학생에게만 시험이 보입니다. (마감 전까지 언제든 추가 가능)</div>`;

  (classes||[]).forEach(c=>{
    const students=(profs||[]).filter(p=>p.class_id===c.id);
    if(!students.length) return;
    const allOn = students.every(s=>aset.has(s.id));
    html += `<div style="margin-bottom:12px;">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
        <span style="font-size:13px;font-weight:800;color:var(--accent);">${Ui.escape(c.name)}</span>
        <button onclick="wAssignClass(${testId},${Ui.argument(c.name)},${allOn?'false':'true'})" style="padding:4px 10px;background:${allOn?'var(--surface)':'var(--accent)'};color:${allOn?'var(--t2)':'white'};border:1px solid ${allOn?'var(--border)':'var(--accent)'};border-radius:6px;font-size:10px;font-weight:700;cursor:pointer;font-family:'Noto Sans KR',sans-serif;">${allOn?'반 전체 해제':'반 전체 지정'}</button>
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:5px;">`;
    students.forEach(s=>{
      const on=aset.has(s.id);
      html += `<button id="asg-${s.id}" onclick="wToggleAssign(${testId},'${s.id}')" style="padding:5px 10px;border-radius:16px;border:1px solid ${on?'var(--accent)':'var(--border)'};background:${on?'var(--accent)':'var(--white)'};color:${on?'white':'var(--t2)'};font-size:11px;font-weight:600;cursor:pointer;font-family:'Noto Sans KR',sans-serif;">${on?'✓ ':''}${Ui.escape(s.name)}</button>`;
    });
    html += `</div></div>`;
  });
  // 미배정 학생
  const noClass=(profs||[]).filter(p=>!p.class_id);
  if(noClass.length){
    html += `<div style="margin-bottom:12px;"><div style="font-size:12px;font-weight:700;color:var(--t3);margin-bottom:6px;">미배정 학생</div><div style="display:flex;flex-wrap:wrap;gap:5px;">`;
    noClass.forEach(s=>{
      const on=aset.has(s.id);
      html += `<button id="asg-${s.id}" onclick="wToggleAssign(${testId},'${s.id}')" style="padding:5px 10px;border-radius:16px;border:1px solid ${on?'var(--accent)':'var(--border)'};background:${on?'var(--accent)':'var(--white)'};color:${on?'white':'var(--t2)'};font-size:11px;font-weight:600;cursor:pointer;font-family:'Noto Sans KR',sans-serif;">${on?'✓ ':''}${Ui.escape(s.name)}</button>`;
    });
    html += `</div></div>`;
  }
  html += `<div style="font-size:11px;color:var(--a3);text-align:center;padding:8px;background:var(--a3-light);border-radius:8px;">지정 즉시 저장됩니다 ✓</div></div>`;
  d.innerHTML = html;
}

async function wToggleAssign(testId, uid){
if(!window.AppSession?.can('manage-tests'))return;

const __mvpEpoch=SessionGuard.capture();

  const sb=sbReady();
  const aset=window._assignSet;
  const btn=document.getElementById('asg-'+uid);
  if(!btn||btn.disabled)return;btn.disabled=true;
  try{
  if(aset.has(uid)){
    const result=await SessionGuard.wait((sb.from('test_assignments').delete().eq('test_id',testId).eq('user_id',uid)),__mvpEpoch);
    if(result.error){showToast('배정 해제를 저장하지 못했습니다.');return;}
    aset.delete(uid);
    btn.style.background='var(--white)'; btn.style.color='var(--t2)'; btn.style.borderColor='var(--border)';
    btn.textContent=btn.textContent.replace('✓ ','');
  } else {
    const result=await SessionGuard.wait((sb.from('test_assignments').insert({test_id:testId, user_id:uid})),__mvpEpoch);
    if(result.error){showToast('배정을 저장하지 못했습니다.');return;}
    aset.add(uid);
    btn.style.background='var(--accent)'; btn.style.color='white'; btn.style.borderColor='var(--accent)';
    btn.textContent='✓ '+btn.textContent;
  }
  }finally{if(btn.isConnected)btn.disabled=false;}
}
async function wAssignClass(testId, className, turnOn){
if(!window.AppSession?.can('manage-tests'))return;

const __mvpEpoch=SessionGuard.capture();

  const sb=sbReady();
  const { data:cls,error:classError } = await SessionGuard.wait((sb.from('classes').select('id').eq('name',className).single()),__mvpEpoch);
  if(classError||!cls){showToast('반을 확인하지 못했습니다.');return;}
  const { data:students,error:studentError } = await SessionGuard.wait((sb.from('profiles').select('id').eq('role','student').eq('class_id',cls.id)),__mvpEpoch);
  if(studentError||!students?.length){showToast('배정할 학생을 확인하지 못했습니다.');return;}
  if(turnOn){
    const rows=students.map(s=>({test_id:testId, user_id:s.id}));
    const result=await SessionGuard.wait((sb.from('test_assignments').upsert(rows, {onConflict:'test_id,user_id'})),__mvpEpoch);
    if(result.error){showToast('반 배정을 저장하지 못했습니다.');return;}
  } else {
    const result=await SessionGuard.wait(sb.from('test_assignments').delete().eq('test_id',testId).in('user_id',students.map(s=>s.id)),__mvpEpoch);
    if(result.error){showToast('반 배정 해제를 저장하지 못했습니다.');return;}
  }
  const { data:t } = await SessionGuard.wait((sb.from('tests').select('title').eq('id',testId).single()),__mvpEpoch);
  wAssign(testId, t?t.title:'');
  showToast(turnOn?'반 전체 지정됨':'반 전체 해제됨');
}

// ===== 테스트 상담 (정시상담 이전 학생 리포트: 점수·메달·등수추이) =====

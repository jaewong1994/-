async function renderExamCounsel(){
const __mvpEpoch=SessionGuard.capture();

  const cont=document.getElementById('exam-counsel-content');
  if(!cont) return;
  const sb=sbReady();
  if(!sb){ cont.innerHTML=`<div class="stg-card"><div style="font-size:12px;color:var(--t2);">연결이 필요합니다.</div></div>`; return; }
  const { data:{ session } } = await SessionGuard.wait((sb.auth.getSession()),__mvpEpoch);
  if(!session){ cont.innerHTML=`<div class="stg-card"><div style="font-size:12px;color:var(--t3);text-align:center;padding:20px;">로그인이 필요합니다. (테스트 탭에서 로그인)</div></div>`; return; }
  if(!_wprofile){ const { data:prof } = await SessionGuard.wait((sb.from('profiles').select('id,name,nickname,student_no,role,class_id,teacher_id,pw_changed').eq('id',session.user.id).maybeSingle()),__mvpEpoch); _wprofile=prof; _wuser=session.user; }
  if(!_wprofile || (_wprofile.role!=='teacher' && _wprofile.role!=='director')){
    cont.innerHTML=`<div class="stg-card"><div style="font-size:12px;color:var(--t3);text-align:center;padding:20px;">강사·원장 전용 화면입니다.</div></div>`;
    return;
  }

  cont.innerHTML=`<div style="text-align:center;color:var(--t3);font-size:12px;padding:20px;">학생 불러오는 중...</div>`;

  const { data:students,error:studentsError } = await SessionGuard.wait((sb.from('profiles').select('id,name,nickname,student_no,class_id,role').eq('role','student').order('class_id')),__mvpEpoch);
  const { data:classes,error:classesError } = await SessionGuard.wait((sb.from('classes').select('id,name').order('id')),__mvpEpoch);
  if(studentsError||classesError){cont.innerHTML='<div class="stg-card" role="alert">학생·반 목록을 조회하지 못했습니다. 권한과 연결 상태를 확인해 주세요.</div>';return;}
  const clsName={}; (classes||[]).forEach(c=>clsName[c.id]=c.name);

  if(!students || !students.length){
    cont.innerHTML = `<div class="stg-card"><div class="stg-hdr"><div class="stg-icon" aria-hidden="true"><i class="ti ti-school"></i></div><div class="stg-title">학생 상담 리포트</div></div><div style="font-size:12px;color:var(--t3);text-align:center;padding:20px 0;">담당 학생이 없습니다.<br><span style="font-size:10px;">원장이 학생을 배정하면 여기에 표시됩니다.</span></div></div>`;
    return;
  }

  window._repStudents = students;
  window._repClsName = clsName;
  cont.innerHTML = `<div id="rep-detail-view" hidden><button type="button" class="staff-row-btn" onclick="closeTopDetail('rep-detail')">학생 목록으로</button><div id="rep-detail"></div></div><div class="stg-card" id="rep-detail-list">
    <div class="stg-hdr"><div class="stg-icon" aria-hidden="true"><i class="ti ti-school"></i></div><div class="stg-title">학생 상담 리포트</div><div class="stg-sub">${students.length}명</div></div>
    <input id="rep-search" oninput="wRepFilter(this.value)" class="target-select" style="width:100%;margin-bottom:10px;" placeholder="이름·아이디로 검색" aria-label="학생 검색">
    <div id="rep-list"></div>
  </div>`;
  wRepRenderList(students);
}

function wRepRenderList(list){
  const box=document.getElementById('rep-list');
  if(!box) return;
  const clsName=window._repClsName||{};
  if(!list.length){ box.innerHTML=`<div style="font-size:11px;color:var(--t3);text-align:center;padding:10px 0;">해당 학생이 없습니다.</div>`; return; }
  const groups={};
  list.forEach(s=>{ const key=s.class_id||'__none'; (groups[key]=groups[key]||[]).push(s); });
  let html='';
  Object.keys(groups).forEach(key=>{
    const label = key==='__none' ? '반 미배정' : (clsName[key]||('반 '+key));
    html += `<div style="margin-top:10px;"><div style="font-size:11px;font-weight:800;color:var(--accent);padding:6px 0;border-bottom:2px solid var(--accent-light);">${escHtml(label)} (${groups[key].length}명)</div>`;
    groups[key].forEach(s=>{
      html += `<div role="button" tabindex="0" onclick="wOpenStudentReport(${Ui.argument(s.id)})" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();wOpenStudentReport(${Ui.argument(s.id)});}" style="display:flex;align-items:center;gap:8px;padding:10px 4px;min-height:44px;border-bottom:1px solid var(--border);cursor:pointer;">
        <div style="width:30px;height:30px;border-radius:50%;background:var(--accent-light);color:var(--accent);display:flex;align-items:center;justify-content:center;flex-shrink:0;" aria-hidden="true"><i class="ti ti-user"></i></div>
        <div style="flex:1;"><div style="font-size:13px;font-weight:700;">${escHtml(s.name||'(이름미설정)')}</div>
        <div style="font-size:9px;color:var(--t3);">${escHtml(s.student_no||'')}${s.nickname?' · @'+escHtml(s.nickname):''}</div></div>
        <span style="font-size:11px;color:var(--accent);">상담 ›</span>
      </div>`;
    });
    html += `</div>`;
  });
  box.innerHTML=html;
}

function wRepFilter(q){
  const all=window._repStudents||[];
  q=(q||'').trim().toLowerCase();
  const f = !q ? all : all.filter(s=>
    (s.name||'').toLowerCase().includes(q) || (s.student_no||'').toLowerCase().includes(q) || (s.nickname||'').toLowerCase().includes(q)
  );
  wRepRenderList(f);
}

async function wOpenStudentReport(studentId){
const __mvpEpoch=SessionGuard.capture();

  const sb=sbReady();
  const student=(window._repStudents||[]).find(s=>s.id===studentId);
  if(!student)return;
  const name=student?.name || '이름 미설정';
  const detail=document.getElementById('rep-detail');
  if(!detail) return;
  detail.innerHTML=`<div class="stg-card"><div style="text-align:center;color:var(--t3);font-size:12px;padding:16px;">${escHtml(name)} 리포트 불러오는 중...</div></div>`;
  const detailRequest=openTopDetail('rep-detail');

  const [repRes, colRes] = await SessionGuard.wait((Promise.all([
    sb.rpc('student_report', { p_student: studentId }),
    sb.from('collections').select('user_id,jun,kill,god,gold,silver,bronze,perfect').eq('user_id', studentId).maybeSingle()
  ])),__mvpEpoch);
  if(!currentTopDetail('rep-detail',detailRequest))return;
  const { data, error } = repRes;
  if(error||colRes.error){ detail.innerHTML=`<div class="stg-card"><div style="color:var(--red);font-size:12px;text-align:center;padding:14px;">불러오기 실패: ${escHtml((error||colRes.error).message)}</div></div>`; return; }

  const col = colRes.data || {};
  const medals=[
    {k:'gold',label:'금메달',icon:'ti-medal'},
    {k:'silver',label:'은메달',icon:'ti-medal-2'},
    {k:'bronze',label:'동메달',icon:'ti-award'},
    {k:'perfect',label:'만점',icon:'ti-diamond'},
    {k:'jun',label:'준킬러',icon:'ti-sword'},
    {k:'kill',label:'킬러',icon:'ti-flame'},
    {k:'god',label:'GOD',icon:'ti-crown'}
  ];
  const medalHtml = medals.map(m=>{
    const cnt=col[m.k]||0;
    return `<div style="flex:0 0 auto;text-align:center;padding:8px 10px;background:${cnt>0?'var(--accent-light)':'var(--surface)'};border:1px solid ${cnt>0?'var(--accent-mid)':'var(--border)'};border-radius:10px;min-width:54px;opacity:${cnt>0?1:0.45};">
      <div style="font-size:18px;color:${cnt>0?'var(--accent)':'var(--t3)'};" aria-hidden="true"><i class="ti ${m.icon}"></i></div>
      <div style="font-size:9px;color:var(--t3);margin-top:2px;">${Ui.escape(m.label)}</div>
      <div style="font-family:'Space Mono',monospace;font-size:14px;font-weight:800;color:${cnt>0?'var(--accent)':'var(--t3)'};">${cnt}</div>
    </div>`;
  }).join('');
  const medalCard = `<div class="stg-card">
    <div class="stg-hdr"><div class="stg-icon" aria-hidden="true"><i class="ti ti-medal"></i></div><div class="stg-title">획득 메달</div></div>
    <div style="display:flex;gap:6px;overflow-x:auto;padding-bottom:4px;">${medalHtml}</div>
  </div>`;

  if(!data || !data.length){
    detail.innerHTML = `<div class="stg-card"><div class="stg-hdr"><div class="stg-icon" aria-hidden="true"><i class="ti ti-clipboard-list"></i></div><div class="stg-title">${escHtml(name)} 리포트</div></div><div style="font-size:12px;color:var(--t3);text-align:center;padding:16px 0;">아직 응시한 시험이 없습니다.</div></div>` + medalCard;
    return;
  }

  const rows=data;
  const scores=rows.map(r=>Number(r.score)||0);
  const avg=Math.round(scores.reduce((a,b)=>a+b,0)/scores.length);
  const maxS=Math.max(...scores);
  const last=rows[rows.length-1];
  const rankText=(rank,total)=>rank!=null&&total!=null?`${rank}/${total}`:'-';

  let html=`<div class="stg-card">
    <div class="stg-hdr"><div class="stg-icon" aria-hidden="true"><i class="ti ti-clipboard-list"></i></div><div class="stg-title">${escHtml(name)} 리포트</div>
      <div class="stg-sub">총 ${rows.length}회 응시</div></div>
    <div style="display:flex;gap:8px;margin-bottom:14px;">
      <div style="flex:1;background:var(--accent-light);border-radius:10px;padding:10px;text-align:center;">
        <div style="font-size:10px;color:var(--t3);">평균</div>
        <div style="font-family:'Space Mono',monospace;font-size:20px;font-weight:800;color:var(--accent);">${avg}</div></div>
      <div style="flex:1;background:var(--a3-light);border-radius:10px;padding:10px;text-align:center;">
        <div style="font-size:10px;color:var(--t3);">최고</div>
        <div style="font-family:'Space Mono',monospace;font-size:20px;font-weight:800;color:var(--a3);">${maxS}</div></div>
      <div style="flex:1;background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:10px;text-align:center;">
        <div style="font-size:10px;color:var(--t3);">최근</div>
        <div style="font-family:'Space Mono',monospace;font-size:20px;font-weight:800;">${last.score}</div></div>
    </div>
    <div style="font-size:11px;font-weight:700;color:var(--t2);margin-bottom:4px;">점수 추이</div>
    <div style="position:relative;height:160px;margin-bottom:6px;"><canvas id="rep-chart-score"></canvas></div>
    <div style="font-size:11px;font-weight:700;color:var(--t2);margin:10px 0 4px;">전체 등수 추이 (위가 1등)</div>
    <div style="position:relative;height:160px;"><canvas id="rep-chart-rank"></canvas></div>
  </div>`
  + medalCard
  + `<div class="stg-card">
    <div class="stg-hdr"><div class="stg-icon" aria-hidden="true"><i class="ti ti-list"></i></div><div class="stg-title">회차별 성적</div></div>`;
  rows.forEach(r=>{
    html += `<div style="display:flex;align-items:center;gap:8px;padding:10px 0;border-bottom:1px solid var(--border);">
      <div style="flex:1;min-width:0;"><div style="font-size:12px;font-weight:700;">${escHtml(r.title||'')}${r.closed?' 마감':''}</div>
      <div style="font-size:9px;color:var(--t3);">${escHtml(r.exam_date||'')}</div></div>
      <div style="text-align:center;"><div style="font-size:9px;color:var(--t3);">점수</div><div style="font-family:'Space Mono',monospace;font-size:15px;font-weight:700;">${r.score}</div></div>
      <div style="text-align:center;"><div style="font-size:9px;color:var(--t3);">전체</div><div style="font-family:'Space Mono',monospace;font-size:13px;font-weight:700;color:var(--accent);">${rankText(r.overall_rank,r.overall_total)}</div></div>
      ${r.class_rank!=null?`<div style="text-align:center;"><div style="font-size:9px;color:var(--t3);">반</div><div style="font-family:'Space Mono',monospace;font-size:13px;font-weight:700;color:var(--a3);">${rankText(r.class_rank,r.class_total)}</div></div>`:''}
    </div>`;
  });
  html += `</div>`;
  detail.innerHTML = html;

  if(window.Chart){
    if(window._repChartScore) window._repChartScore.destroy();
    window._repChartScore=new Chart(document.getElementById('rep-chart-score'),{
      type:'line',
      data:{ labels:rows.map(r=>r.title), datasets:[{
        label:'점수', data:scores, borderColor:'#6366f1',
        backgroundColor:'rgba(99,102,241,.12)', borderWidth:2.5, tension:.3,
        pointRadius:4, pointBackgroundColor:'#6366f1', fill:true }]},
      options:{ responsive:true, maintainAspectRatio:false,
        scales:{ y:{ beginAtZero:false, ticks:{font:{family:"'Space Mono',monospace"}} }, x:{ticks:{font:{size:10}}} },
        plugins:{ legend:{display:false} } }
    });
    if(window._repChartRank) window._repChartRank.destroy();
    window._repChartRank=new Chart(document.getElementById('rep-chart-rank'),{
      type:'line',
      data:{ labels:rows.map(r=>r.title), datasets:[{
        label:'전체 등수', data:rows.map(r=>r.overall_rank), borderColor:'#10b981',
        backgroundColor:'rgba(16,185,129,.12)', borderWidth:2.5, tension:.3,
        pointRadius:4, pointBackgroundColor:'#10b981', fill:true }]},
      options:{ responsive:true, maintainAspectRatio:false,
        scales:{ y:{ reverse:true, min:1, ticks:{precision:0,font:{family:"'Space Mono',monospace"}} }, x:{ticks:{font:{size:10}}} },
        plugins:{ legend:{display:false} } }
    });
  }

}


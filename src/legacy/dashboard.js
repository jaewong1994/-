function ddayDiff(dateStr){
  const today=new Date(); today.setHours(0,0,0,0);
  const target=new Date(dateStr+'T00:00:00');
  return Math.round((target-today)/(1000*60*60*24));
}

// ===== 그레이 마스코트 (카툰풍 SVG, 레퍼런스 기반·더 까만 몸, 새로고침마다 포즈 랜덤) =====
function catCheer(){
  const positions=[
    'top:8px;left:12px;', 'top:8px;right:12px;', 'bottom:6px;left:12px;',
    'bottom:6px;right:12px;'
  ];
  const pos=positions[Math.floor(Math.random()*positions.length)];
  const poses=['wave','stand','sit','sleep'];
  const pose=poses[Math.floor(Math.random()*poses.length)];
  const size=Math.random()<0.3?108:92;
  const flip=Math.random()<0.5?-1:1;

  // 팔레트 — 부드러운 차콜 + 앰버 눈 + 핑크 포인트
  const BODY='#3a3e45', BODY_D='#26292f', OUT='#181a1e', BELLY='#565c66';
  const EAR_IN='#e9909f', EYE='#f6b141', NOSE='#ef8b98', BLUSH='#ef8b98';

  // 얼굴 (cx,cy 중심) — 반짝이는 큰 눈 + 볼터치 + ω 입
  function face(cx,cy,sleepy){
    if(sleepy){
      return `
        <path d="M${cx-15} ${cy} q6 4.5 11 0" stroke="${OUT}" stroke-width="2.6" fill="none" stroke-linecap="round"/>
        <path d="M${cx+4} ${cy} q6 4.5 11 0" stroke="${OUT}" stroke-width="2.6" fill="none" stroke-linecap="round"/>
        <ellipse cx="${cx-17}" cy="${cy+7}" rx="4.5" ry="2.8" fill="${BLUSH}" opacity=".5"/>
        <ellipse cx="${cx+17}" cy="${cy+7}" rx="4.5" ry="2.8" fill="${BLUSH}" opacity=".5"/>
        <path d="M${cx-2.6} ${cy+7.5} h5.2 l-2.6 2.8 Z" fill="${NOSE}" stroke="${OUT}" stroke-width="1.2" stroke-linejoin="round"/>
        <path d="M${cx} ${cy+10.5} q-3.6 3.2 -7 1.2 M${cx} ${cy+10.5} q3.6 3.2 7 1.2" stroke="${OUT}" stroke-width="1.6" fill="none" stroke-linecap="round"/>`;
    }
    return `
      <ellipse cx="${cx-10.5}" cy="${cy}" rx="7.4" ry="8.6" fill="#fff" stroke="${OUT}" stroke-width="2.2"/>
      <ellipse cx="${cx+10.5}" cy="${cy}" rx="7.4" ry="8.6" fill="#fff" stroke="${OUT}" stroke-width="2.2"/>
      <circle cx="${cx-10.5}" cy="${cy+0.8}" r="5.4" fill="${EYE}"/>
      <circle cx="${cx+10.5}" cy="${cy+0.8}" r="5.4" fill="${EYE}"/>
      <circle cx="${cx-10.5}" cy="${cy+1.4}" r="3" fill="${OUT}"/>
      <circle cx="${cx+10.5}" cy="${cy+1.4}" r="3" fill="${OUT}"/>
      <circle cx="${cx-8.6}" cy="${cy-1.6}" r="1.7" fill="#fff"/>
      <circle cx="${cx+12.4}" cy="${cy-1.6}" r="1.7" fill="#fff"/>
      <circle cx="${cx-12.3}" cy="${cy+3.2}" r=".9" fill="#fff" opacity=".9"/>
      <circle cx="${cx+8.7}" cy="${cy+3.2}" r=".9" fill="#fff" opacity=".9"/>
      <ellipse cx="${cx-18}" cy="${cy+8}" rx="4.6" ry="2.9" fill="${BLUSH}" opacity=".55"/>
      <ellipse cx="${cx+18}" cy="${cy+8}" rx="4.6" ry="2.9" fill="${BLUSH}" opacity=".55"/>
      <path d="M${cx-2.9} ${cy+8.6} h5.8 l-2.9 3.1 Z" fill="${NOSE}" stroke="${OUT}" stroke-width="1.3" stroke-linejoin="round"/>
      <path d="M${cx} ${cy+11.9} q-4.4 3.6 -8 1.2 M${cx} ${cy+11.9} q4.4 3.6 8 1.2" stroke="${OUT}" stroke-width="1.8" fill="none" stroke-linecap="round"/>
      <path d="M${cx-13} ${cy+5.5} q-9 -1.5 -15 .5 M${cx-13} ${cy+9} q-8 .8 -14 3" stroke="${OUT}" stroke-width="1.2" stroke-linecap="round" fill="none" opacity=".7"/>
      <path d="M${cx+13} ${cy+5.5} q9 -1.5 15 .5 M${cx+13} ${cy+9} q8 .8 14 3" stroke="${OUT}" stroke-width="1.2" stroke-linecap="round" fill="none" opacity=".7"/>`;
  }
  // 둥근 귀 (부드러운 곡선 삼각 + 핑크 속귀)
  function ears(cx,cy,r){
    return `
      <path d="M${cx-r*0.78} ${cy-r*0.5} Q${cx-r*1.15} ${cy-r*1.35} ${cx-r*0.92} ${cy-r*1.42} Q${cx-r*0.55} ${cy-r*1.3} ${cx-r*0.22} ${cy-r*0.9} Z" fill="${BODY}" stroke="${OUT}" stroke-width="2.6" stroke-linejoin="round"/>
      <path d="M${cx+r*0.78} ${cy-r*0.5} Q${cx+r*1.15} ${cy-r*1.35} ${cx+r*0.92} ${cy-r*1.42} Q${cx+r*0.55} ${cy-r*1.3} ${cx+r*0.22} ${cy-r*0.9} Z" fill="${BODY}" stroke="${OUT}" stroke-width="2.6" stroke-linejoin="round"/>
      <path d="M${cx-r*0.68} ${cy-r*0.68} Q${cx-r*0.92} ${cy-r*1.16} ${cx-r*0.8} ${cy-r*1.2} Q${cx-r*0.52} ${cy-r*1.08} ${cx-r*0.38} ${cy-r*0.82} Z" fill="${EAR_IN}" opacity=".85"/>
      <path d="M${cx+r*0.68} ${cy-r*0.68} Q${cx+r*0.92} ${cy-r*1.16} ${cx+r*0.8} ${cy-r*1.2} Q${cx+r*0.52} ${cy-r*1.08} ${cx+r*0.38} ${cy-r*0.82} Z" fill="${EAR_IN}" opacity=".85"/>`;
  }

  let inner='';
  if(pose==='wave'){
    inner=`
      <path d="M88 92 Q108 86 106 64 Q105 56 98 58 Q94 60 96 68 Q97 80 84 84 Z" fill="${BODY}" stroke="${OUT}" stroke-width="2.6" stroke-linejoin="round"/>
      <path d="M36 118 Q30 76 62 74 Q94 76 88 118 Z" fill="${BODY}" stroke="${OUT}" stroke-width="3" stroke-linejoin="round"/>
      <path d="M50 115 Q52 88 62 86 Q72 88 74 115 Z" fill="${BELLY}" opacity=".5"/>
      <path d="M30 78 Q18 66 22 52 Q30 50 34 60 Q37 68 38 76 Z" fill="${BODY}" stroke="${OUT}" stroke-width="2.8" stroke-linejoin="round"/>
      <circle cx="24" cy="53" r="7" fill="${BODY}" stroke="${OUT}" stroke-width="2.6"/>
      <path d="M21 50 v3 M24 49 v3.6 M27 50 v3" stroke="${OUT}" stroke-width="1.2" stroke-linecap="round" opacity=".6"/>
      <path d="M18 46 q4 -4 8 0 M16 54 q4 -3 8 -1" stroke="${OUT}" stroke-width="1.8" fill="none" stroke-linecap="round" opacity=".6"/>
      <circle cx="62" cy="48" r="29" fill="${BODY}" stroke="${OUT}" stroke-width="3"/>
      ${ears(62,48,29)}
      ${face(62,47,false)}
      <ellipse cx="48" cy="116" rx="9" ry="5.5" fill="${BODY_D}" stroke="${OUT}" stroke-width="2.4"/>
      <ellipse cx="76" cy="116" rx="9" ry="5.5" fill="${BODY_D}" stroke="${OUT}" stroke-width="2.4"/>
      <path d="M45 114 v3 M48 113.5 v3.8 M51 114 v3" stroke="${OUT}" stroke-width="1.1" stroke-linecap="round" opacity=".55"/>
      <path d="M73 114 v3 M76 113.5 v3.8 M79 114 v3" stroke="${OUT}" stroke-width="1.1" stroke-linecap="round" opacity=".55"/>`;
  } else if(pose==='stand'){
    inner=`
      <path d="M82 100 Q104 96 102 72 Q101 64 94 67 Q91 70 93 77 Q93 90 79 94 Z" fill="${BODY}" stroke="${OUT}" stroke-width="2.6" stroke-linejoin="round"/>
      <ellipse cx="60" cy="88" rx="25" ry="29" fill="${BODY}" stroke="${OUT}" stroke-width="3"/>
      <ellipse cx="60" cy="94" rx="14" ry="18" fill="${BELLY}" opacity=".5"/>
      <ellipse cx="50" cy="117" rx="8" ry="5.5" fill="${BODY_D}" stroke="${OUT}" stroke-width="2.4"/>
      <ellipse cx="70" cy="117" rx="8" ry="5.5" fill="${BODY_D}" stroke="${OUT}" stroke-width="2.4"/>
      <circle cx="60" cy="46" r="28" fill="${BODY}" stroke="${OUT}" stroke-width="3"/>
      ${ears(60,46,28)}
      ${face(60,45,false)}`;
  } else if(pose==='sit'){
    inner=`
      <path d="M36 112 Q16 116 20 100 Q22 92 30 96 Q36 100 36 106 Z" fill="${BODY}" stroke="${OUT}" stroke-width="2.6" stroke-linejoin="round"/>
      <path d="M34 118 Q30 68 62 66 Q94 68 90 118 Z" fill="${BODY}" stroke="${OUT}" stroke-width="3" stroke-linejoin="round"/>
      <path d="M50 114 Q52 82 62 80 Q72 82 74 114 Z" fill="${BELLY}" opacity=".5"/>
      <ellipse cx="48" cy="116" rx="9" ry="5.5" fill="${BODY_D}" stroke="${OUT}" stroke-width="2.4"/>
      <ellipse cx="76" cy="116" rx="9" ry="5.5" fill="${BODY_D}" stroke="${OUT}" stroke-width="2.4"/>
      <circle cx="62" cy="48" r="28" fill="${BODY}" stroke="${OUT}" stroke-width="3"/>
      ${ears(62,48,28)}
      ${face(62,47,false)}`;
  } else { // sleep — 식빵 자세
    inner=`
      <path d="M24 104 Q20 74 62 74 Q104 74 100 104 Q100 112 88 112 L36 112 Q24 112 24 104 Z" fill="${BODY}" stroke="${OUT}" stroke-width="3" stroke-linejoin="round"/>
      <path d="M96 106 Q112 104 110 90 Q109 84 103 87 Q100 90 101 96 Z" fill="${BODY}" stroke="${OUT}" stroke-width="2.4" stroke-linejoin="round"/>
      <ellipse cx="56" cy="84" rx="23" ry="19" fill="${BODY}" stroke="${OUT}" stroke-width="3"/>
      ${ears(56,84,21)}
      ${face(56,84,true)}
      <text x="86" y="62" font-size="14" fill="${OUT}" font-family="'Space Mono',monospace" opacity=".75">z</text>
      <text x="95" y="50" font-size="10" fill="${OUT}" font-family="'Space Mono',monospace" opacity=".5">z</text>`;
  }

  const svg=`<svg viewBox="0 0 124 128" width="${size}" height="${Math.round(size*1.03)}" style="overflow:visible;transform:scaleX(${flip});">${inner}</svg>`;
  const html=`<div class="cat-photo" style="position:absolute;z-index:2;${pos}filter:drop-shadow(0 3px 5px rgba(0,0,0,.25));">${svg}</div>`;
  return {html, msg:''};
}

// ===== 리포트 (등수 추이 그래프) =====
let reportChart=null;
async function renderReport(){
const __mvpEpoch=SessionGuard.capture();

  const cont=document.getElementById('report-content');
  const sb=sbReady();
  if(!sb){
    cont.innerHTML=`<div class="stg-card"><div style="font-size:12px;color:var(--t3);text-align:center;padding:20px 0;">테스트 백엔드가 설정되지 않았습니다.</div></div>`;
    return;
  }
  // 로그인 확인
  const { data:{ session } } = await SessionGuard.wait((sb.auth.getSession()),__mvpEpoch);
  if(!session){
    cont.innerHTML=`<div class="stg-card"><div style="font-size:12px;color:var(--t3);text-align:center;padding:20px 0;">📊 리포트는 로그인 후 이용할 수 있습니다.<br><span style="font-size:10px;">테스트 탭에서 먼저 로그인하세요.</span></div></div>`;
    return;
  }
  cont.innerHTML=`<div style="text-align:center;color:var(--t3);font-size:12px;padding:20px;">리포트 불러오는 중...</div>`;

  // 내가 제출한 테스트 목록 (마감/진행 무관, 제출한 것만)
  const uid=session.user.id;
  const { data:subs } = await SessionGuard.wait((sb.from('submissions').select('test_id,score').eq('user_id',uid)),__mvpEpoch);
  if(!subs || !subs.length){
    cont.innerHTML=`<div class="stg-card"><div style="font-size:12px;color:var(--t3);text-align:center;padding:20px 0;">아직 응시한 테스트가 없습니다.<br><span style="font-size:10px;">테스트를 응시하면 등수 추이가 여기에 표시됩니다.</span></div></div>`;
    return;
  }
  const ids=subs.map(s=>s.test_id);
  const { data:tests } = await SessionGuard.wait((sb.from('tests').select('id,title,exam_date').in('id',ids).order('exam_date',{ascending:true})),__mvpEpoch);

  // 각 테스트별 my_rank 호출
  const rows=[];
  for(const t of (tests||[])){
    try{
      const { data } = await SessionGuard.wait((sb.rpc('my_rank', { p_test_id: t.id })),__mvpEpoch);
      if(data && data.length){
        const r=data[0];
        rows.push({title:t.title, date:t.exam_date, ...r});
      }
    }catch(e){SessionGuard.assert(__mvpEpoch);}
  }
  if(!rows.length){
    cont.innerHTML=`<div class="stg-card"><div style="font-size:12px;color:var(--t3);text-align:center;padding:20px 0;">등수 데이터를 불러올 수 없습니다.</div></div>`;
    return;
  }

  const labels=rows.map(r=>r.title);
  const overallRanks=rows.map(r=>r.overall_rank);
  const classRanks=rows.map(r=>r.class_rank);
  const hasClass=rows.some(r=>r.class_name);
  const className=(rows.find(r=>r.class_name)||{}).class_name||'';

  // 최신 회차 요약
  const last=rows[rows.length-1];
  let summary=`<div class="stg-card">
    <div class="stg-hdr"><div class="stg-icon">📊</div><div class="stg-title">최근 회차: ${Ui.escape(last.title)}</div></div>
    <div style="display:flex;gap:10px;">
      <div style="flex:1;background:var(--accent-light);border:1px solid var(--accent-mid);border-radius:10px;padding:12px;text-align:center;">
        <div style="font-size:10px;color:var(--t3);">전체 등수</div>
        <div style="font-family:'Space Mono',monospace;font-size:24px;font-weight:800;color:var(--accent);">${last.overall_rank}<span style="font-size:12px;color:var(--t3);">/${last.overall_total}</span></div>
      </div>`;
  if(last.class_name){
    summary+=`<div style="flex:1;background:var(--a3-light);border:1px solid #bbf7d0;border-radius:10px;padding:12px;text-align:center;">
        <div style="font-size:10px;color:var(--t3);">${last.class_name} 반 등수</div>
        <div style="font-family:'Space Mono',monospace;font-size:24px;font-weight:800;color:var(--a3);">${last.class_rank}<span style="font-size:12px;color:var(--t3);">/${last.class_total}</span></div>
      </div>`;
  }
  summary+=`</div></div>`;

  cont.innerHTML = summary + `
    <div class="stg-card">
      <div class="stg-hdr"><div class="stg-icon">📈</div><div class="stg-title">등수 추이</div>
        <div class="stg-sub">낮을수록 좋아요 (1등이 위)</div></div>
      <div style="position:relative;height:240px;"><canvas id="report-chart"></canvas></div>
      <div style="font-size:10px;color:var(--t3);text-align:center;margin-top:8px;">📘 전체 = 응시한 모든 학생 중 / 🟢 반 = ${Ui.escape(className||'배정된 반')} 학생 중</div>
    </div>
    <div class="stg-card">
      <div class="stg-hdr"><div class="stg-icon">📋</div><div class="stg-title">회차별 상세</div></div>
      ${rows.map(r=>`<div style="display:flex;align-items:center;gap:8px;padding:9px 0;border-bottom:1px solid var(--border);">
        <div style="flex:1;font-size:12px;font-weight:700;">${Ui.escape(r.title)}<div style="font-size:9px;color:var(--t3);">${r.date||''} · ${r.score}점</div></div>
        <div style="text-align:center;"><div style="font-size:9px;color:var(--t3);">전체</div><div style="font-family:'Space Mono',monospace;font-size:14px;font-weight:700;color:var(--accent);">${r.overall_rank}/${r.overall_total}</div></div>
        ${r.class_name?`<div style="text-align:center;"><div style="font-size:9px;color:var(--t3);">${r.class_name}</div><div style="font-family:'Space Mono',monospace;font-size:14px;font-weight:700;color:var(--a3);">${r.class_rank}/${r.class_total}</div></div>`:''}
      </div>`).join('')}
    </div>
    <div id="wrong-analysis-zone"></div>`;

  // 그래프 (등수는 낮을수록 좋으므로 y축 reverse)
  const ctx=document.getElementById('report-chart');
  if(reportChart) reportChart.destroy();
  const datasets=[{
    label:'전체 등수', data:overallRanks,
    borderColor:'#6366f1', backgroundColor:'rgba(99,102,241,.1)',
    borderWidth:2.5, tension:.3, pointRadius:4, pointBackgroundColor:'#6366f1', fill:false
  }];
  if(hasClass){
    datasets.push({
      label:className+' 반 등수', data:classRanks,
      borderColor:'#10b981', backgroundColor:'rgba(16,185,129,.1)',
      borderWidth:2.5, tension:.3, pointRadius:4, pointBackgroundColor:'#10b981', fill:false
    });
  }
  reportChart=new Chart(ctx,{
    type:'line',
    data:{labels, datasets},
    options:{
      responsive:true, maintainAspectRatio:false,
      scales:{
        y:{ reverse:true, beginAtZero:false, min:1,
            ticks:{ stepSize:1, precision:0, font:{family:"'Space Mono',monospace"} },
            title:{display:true, text:'등수 (1등이 위)', font:{size:10}} },
        x:{ ticks:{font:{size:10}} }
      },
      plugins:{ legend:{ position:'bottom', labels:{font:{family:"'Noto Sans KR',sans-serif",size:11}} } }
    }
  });
  try{ renderMyWrongAnalysis(); }catch(e){SessionGuard.assert(__mvpEpoch);}
}

async function renderDday(){
const __mvpEpoch=SessionGuard.capture();

  const cont=document.getElementById('dday-content');
  const today=new Date();
  const ymd=today.toLocaleDateString('ko-KR',{year:'numeric',month:'long',day:'numeric',weekday:'long'});

  // 개인 D-day 불러오기 (로그인 시)
  let personal=[]; let loggedIn=false;
  const sb=sbReady();
  if(sb){
    try{
      const { data:{ session } } = await SessionGuard.wait((sb.auth.getSession()),__mvpEpoch);
      if(session){
        loggedIn=true;
        const { data } = await SessionGuard.wait((sb.from('personal_ddays').select('id,title,date,icon').order('date',{ascending:true})),__mvpEpoch);
        personal=(data||[]).map(p=>({...p, color:'#9333ea', desc:'내가 추가한 일정', personal:true}));
      }
    }catch(e){SessionGuard.assert(__mvpEpoch);}
  }

  // 메인 히어로 후보 = 기본일정 + 개인일정 통합
  const allForHero=[...DDAY_EVENTS, ...personal];
  const upcoming=allForHero.map(e=>({...e,d:ddayDiff(e.endDate||e.date),dStart:ddayDiff(e.date)}))
    .filter(e=>e.d>=0).sort((a,b)=>a.dStart-b.dStart);
  const main=upcoming[0];

  let heroHtml='';
  if(main){
    const dn=ddayDiff(main.date);
    const label = dn>0?`D-${dn}` : (dn===0?'D-DAY':`D+${-dn}`);
    heroHtml=`
    <div class="dday-hero" style="background:linear-gradient(135deg,${main.color},${main.color}cc);min-height:230px;">
      <div class="dday-hero-shine"></div>
      <div style="position:relative;z-index:2;">
        <div style="font-size:30px;">${main.icon}</div>
        <div style="font-size:13px;opacity:.85;margin-top:4px;">${Ui.escape(main.name||main.title)}까지</div>
        <div style="font-family:'Space Mono',monospace;font-size:52px;font-weight:800;line-height:1.1;margin:2px 0;">${Ui.escape(label)}</div>
        <div style="font-size:11px;opacity:.8;">${main.date.replace(/-/g,'.')}${main.endDate?' ~ '+main.endDate.slice(5).replace('-','.'):''}</div>
      </div>
    </div>`;
  } else {
    heroHtml=`<div class="dday-hero" style="background:linear-gradient(135deg,#64748b,#94a3b8);"><div style="position:relative;z-index:1;"><div style="font-size:34px;">🎓</div><div style="font-size:15px;font-weight:800;margin-top:6px;">다가오는 일정이 없습니다</div></div></div>`;
  }

  // 기본 입시 일정 리스트
  let listHtml=`<div class="stg-card"><div class="stg-hdr"><div class="stg-icon">📅</div><div class="stg-title">2027학년도 주요 일정</div></div>`;
  DDAY_EVENTS.forEach(e=>{
    const dn=ddayDiff(e.date);
    const dnEnd=ddayDiff(e.endDate||e.date);
    let badge,badgeColor;
    if(dnEnd<0){ badge='종료'; badgeColor='var(--t3)'; }
    else if(dn>0){ badge=`D-${dn}`; badgeColor=e.color; }
    else if(dn===0){ badge='오늘!'; badgeColor=e.color; }
    else { badge='진행중'; badgeColor=e.color; }
    const past=dnEnd<0;
    listHtml+=`<div style="display:flex;align-items:center;gap:12px;padding:13px 0;border-bottom:1px solid var(--border);${past?'opacity:.45;':''}">
      <div style="font-size:24px;">${e.icon}</div>
      <div style="flex:1;">
        <div style="font-size:13px;font-weight:700;${past?'text-decoration:line-through;':''}">${Ui.escape(e.name)}</div>
        <div style="font-size:10px;color:var(--t3);margin-top:2px;">${e.desc}</div>
        <div style="font-size:10px;color:var(--t2);font-family:'Space Mono',monospace;margin-top:2px;">${e.date.replace(/-/g,'.')}${e.endDate?' ~ '+e.endDate.replace(/-/g,'.'):''}</div>
      </div>
      <div style="font-family:'Space Mono',monospace;font-size:15px;font-weight:800;color:${badgeColor};white-space:nowrap;">${badge}</div>
    </div>`;
  });
  listHtml+=`</div>`;

  // 내 D-day 카드
  let myHtml='';
  if(loggedIn){
    myHtml=`<div class="stg-card"><div class="stg-hdr"><div class="stg-icon">📌</div><div class="stg-title">내 D-day</div>
      <button onclick="toggleDdayForm()" style="margin-left:auto;padding:6px 12px;background:#9333ea;color:white;border:none;border-radius:7px;font-size:11px;font-weight:700;cursor:pointer;font-family:'Noto Sans KR',sans-serif;">+ 추가</button></div>
      <div id="dday-form" style="display:none;background:#faf5ff;border:1px solid #e9d5ff;border-radius:10px;padding:12px;margin-bottom:10px;">
        <div style="display:flex;gap:6px;margin-bottom:8px;">
          <input id="dday-icon" maxlength="2" value="📌" style="width:44px;text-align:center;padding:8px;border:1px solid var(--border);border-radius:7px;font-size:15px;">
          <input id="dday-title" placeholder="일정 이름 (예: 학원 모의고사)" style="flex:1;padding:8px;border:1px solid var(--border);border-radius:7px;font-size:12px;font-family:'Noto Sans KR',sans-serif;">
        </div>
        <div style="display:flex;gap:6px;">
          <input id="dday-date" type="date" style="flex:1;padding:8px;border:1px solid var(--border);border-radius:7px;font-size:12px;">
          <button onclick="addPersonalDday()" style="padding:8px 16px;background:#9333ea;color:white;border:none;border-radius:7px;font-size:12px;font-weight:700;cursor:pointer;font-family:'Noto Sans KR',sans-serif;">저장</button>
        </div>
      </div>`;
    if(personal.length){
      personal.forEach(e=>{
        const dn=ddayDiff(e.date);
        let badge,badgeColor;
        if(dn>0){ badge=`D-${dn}`; badgeColor='#9333ea'; }
        else if(dn===0){ badge='오늘!'; badgeColor='#9333ea'; }
        else { badge=`D+${-dn}`; badgeColor='var(--t3)'; }
        const past=dn<0;
        myHtml+=`<div style="display:flex;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid var(--border);${past?'opacity:.5;':''}">
          <div style="font-size:22px;">${e.icon||'📌'}</div>
          <div style="flex:1;">
            <div style="font-size:13px;font-weight:700;${past?'text-decoration:line-through;':''}">${Ui.escape(e.title)}</div>
            <div style="font-size:10px;color:var(--t2);font-family:'Space Mono',monospace;margin-top:2px;">${e.date.replace(/-/g,'.')}</div>
          </div>
          <div style="font-family:'Space Mono',monospace;font-size:15px;font-weight:800;color:${badgeColor};">${badge}</div>
          <button onclick="deletePersonalDday(${e.id})" style="padding:4px 8px;background:var(--red-light);color:var(--red);border:1px solid #fecaca;border-radius:6px;font-size:10px;cursor:pointer;font-family:'Noto Sans KR',sans-serif;">삭제</button>
        </div>`;
      });
    } else {
      myHtml+=`<div style="font-size:11px;color:var(--t3);text-align:center;padding:14px 0;">아직 추가한 일정이 없습니다.<br><span style="font-size:10px;">'+ 추가'로 나만의 D-day를 만들어보세요.</span></div>`;
    }
    myHtml+=`</div>`;
  } else {
    myHtml=`<div class="stg-card"><div style="font-size:11px;color:var(--t3);text-align:center;padding:16px 0;">📌 <strong>로그인</strong>하면 나만의 D-day를 추가할 수 있어요.<br><span style="font-size:10px;">테스트 탭에서 로그인하세요.</span></div></div>`;
  }

  cont.innerHTML=`
  <div style="text-align:center;font-size:11px;color:var(--t3);margin-bottom:12px;">오늘은 ${ymd}</div>
  ${heroHtml}
  ${myHtml}
  ${listHtml}
  <div style="font-size:9px;color:var(--t3);text-align:center;margin-top:8px;line-height:1.6;">※ 2027학년도(현 고3) 대입 기준 · 평가원·대교협 발표 일정<br>대학별 세부 일정은 다를 수 있으니 지원 대학 모집요강을 확인하세요.</div>`;
}

function toggleDdayForm(){
  const f=document.getElementById('dday-form');
  if(f) f.style.display = f.style.display==='none' ? 'block' : 'none';
}
async function addPersonalDday(){
const __mvpEpoch=SessionGuard.capture();

  const sb=sbReady();
  const title=document.getElementById('dday-title').value.trim();
  const date=document.getElementById('dday-date').value;
  const icon=document.getElementById('dday-icon').value.trim()||'📌';
  if(!title){ alert('일정 이름을 입력하세요.'); return; }
  if(!date){ alert('날짜를 선택하세요.'); return; }
  // 로그인 사용자 id 확보 (user_id 기본값 미설정이어도 안전)
  const { data:{ session } } = await SessionGuard.wait((sb.auth.getSession()),__mvpEpoch);
  if(!session){ alert('로그인이 필요합니다.'); return; }
  const { error } = await SessionGuard.wait((sb.from('personal_ddays').insert({ user_id: session.user.id, title, date, icon })),__mvpEpoch);
  if(error){ alert('추가 실패: '+error.message); return; }
  showToast('내 D-day 추가됨');
  renderDday();
}
async function deletePersonalDday(id){
const __mvpEpoch=SessionGuard.capture();

  if(!confirm('이 일정을 삭제할까요?')) return;
  const sb=sbReady();
  const { error } = await SessionGuard.wait((sb.from('personal_ddays').delete().eq('id',id)),__mvpEpoch);
  if(error){ alert('삭제 실패: '+error.message); return; }
  showToast('삭제되었습니다');
  renderDday();
}

window.addEventListener('DOMContentLoaded',()=>{
  initToggles();
  updateCutInfo();
  renderScore();
  renderGradeCuts();
  if(window.AppSession?.canOpen('dday'))runPageRender(renderDday);
});

// ===== 지원전략 상태 =====
let stgTarget = {uni:'', dept:'', priority:'uni'}; // priority: 'uni'=대학우선, 'dept'=학과우선
let stgUniList = []; // 검색 결과 캐시


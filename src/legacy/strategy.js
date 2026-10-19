function renderStrategy(){
  const cont = document.getElementById('strategy-content');
  if(!scores.length){
    cont.innerHTML = `<div class="empty"><div class="empty-icon">🎯</div><div class="empty-text">성적을 먼저 입력해주세요<br><button onclick="showPage('input')" style="margin-top:12px;padding:10px 24px;background:var(--accent);color:white;border:none;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;font-family:'Noto Sans KR',sans-serif;">성적 입력하러 가기</button></div></div>`;
    return;
  }
  const r = scores[scores.length-1];

  // 내 점수 분석
  const myStd = (r.kor.std||0)+(r.math.std||0)+(r.sci1.std||0)+(r.sci2.std||0);
  const _tamPctAvg = (r.sci2.pct||r.sci2.name) ? Math.round(((r.sci1.pct||0)+(r.sci2.pct||0))/2) : (r.sci1.pct||0);
  const myPct = (r.kor.pct||0)+(r.math.pct||0)+_tamPctAvg;

  // 수준 분류 (국수탐 표준점수 기준)
  const levels = [
    {lbl:'최상위권',score:380,color:'#1d4ed8',eg:'서울대·연세대·고려대'},
    {lbl:'상위권',  score:340,color:'#059669',eg:'성균관·한양·서강대'},
    {lbl:'중상위권',score:300,color:'#d97706',eg:'중앙·경희·이화여대'},
    {lbl:'중위권',  score:260,color:'#7c3aed',eg:'건국·동국·홍익대'},
  ];
  const myLevel = levels.findIndex(l=>myStd>=l.score);
  const curLevelIdx = myLevel === -1 ? 3 : myLevel;

  // 과목별 향상 여지 분석
  const subjects = [
    {id:'국어', cur:r.kor.std||0, pct:r.kor.pct||0, gr:r.kor.gr||0, max:145, color:'#2563eb', raw:r.kor.raw||0, sub:r.korSub},
    {id:'수학', cur:r.math.std||0, pct:r.math.pct||0, gr:r.math.gr||0, max:145, color:'#d97706', raw:r.math.raw||0, sub:r.mathSub},
    {id:'영어', cur:0, pct:0, gr:r.eng.gr||0, max:0, color:'#059669', raw:r.eng.raw||0, isAbsolute:true},
    {id:'탐구1', cur:r.sci1.std||0, pct:r.sci1.pct||0, gr:r.sci1.gr||0, max:80, color:'#7c3aed', raw:r.sci1.raw||0, sub:r.sci1.name},
    {id:'탐구2', cur:r.sci2.std||0, pct:r.sci2.pct||0, gr:r.sci2.gr||0, max:80, color:'#be185d', raw:r.sci2.raw||0, sub:r.sci2.name},
  ].filter(s=>s.sub||s.isAbsolute);

  // 목표 대학 검색용 대학 목록 (UNI에서 unique 대학명)
  const uniNames = [...new Set(UNI.map(u=>u.n))].sort();

  // 목표 대학의 학과 목록
  const targetUni = stgTarget.uni;
  const deptList = targetUni ? [...new Set(UNI.filter(u=>u.n===targetUni).map(u=>u.d))] : [];
  const targetDept = stgTarget.dept;
  const targetData = targetUni && targetDept ? UNI.find(u=>u.n===targetUni&&u.d===targetDept) : null;

  // 목표까지의 갭 분석
  let gapHtml = '';
  let adviceHtml = '';
  let targetInfoHtml = '';

  if(targetData){
    const useStd = targetData.ind==='표준'||targetData.ind==='표+백';
    const refScore = useStd ? targetData.std : targetData.pct;
    const myScore = useStd ? myStd : myPct;
    const gap = refScore - myScore;
    const indLbl = useStd ? '표준점수' : '백분위';

    targetInfoHtml = `
    <div style="background:var(--accent);border-radius:10px;padding:14px;margin-bottom:12px;color:white;">
      <div style="font-size:10px;opacity:.75;margin-bottom:4px;">🎯 목표 설정</div>
      <div style="font-size:16px;font-weight:800;">${targetData.n} · ${targetData.d}</div>
      <div style="display:flex;gap:12px;margin-top:8px;padding-top:8px;border-top:1px solid rgba(255,255,255,.25);">
        <div><div style="font-size:9px;opacity:.7;">${indLbl} 기준점</div><div style="font-family:'Space Mono',monospace;font-size:20px;font-weight:700;">${refScore}</div></div>
        <div><div style="font-size:9px;opacity:.7;">내 점수</div><div style="font-family:'Space Mono',monospace;font-size:20px;font-weight:700;">${Math.round(myScore)}</div></div>
        <div><div style="font-size:9px;opacity:.7;">차이</div><div style="font-family:'Space Mono',monospace;font-size:20px;font-weight:700;color:${gap<=0?'#86efac':'#fca5a5'}">${gap<=0?'+':'-'}${Math.abs(Math.round(gap))}</div></div>
        <div><div style="font-size:9px;opacity:.7;">${targetData.g}군</div><div style="font-size:14px;font-weight:700;">${targetData.s}</div></div>
      </div>
    </div>`;

    // 필수응시과목 미응시 체크
    const reqMsgs = [];
    if(targetData.mr && r.mathSub==='확률과통계'){
      reqMsgs.push(`수학: <strong>미적분/기하</strong> 필수 (현재 확률과통계 응시)`);
    }
    const saTamList=['생활과윤리','윤리와사상','한국지리','세계지리','동아시아사','세계사','경제','정치와법','사회문화'];
    const kwaTamList=['물리학','화학','생명과학','지구과학'];
    const s1n=r.sci1.name||'', s2n=r.sci2.name||'';
    const isSa=n=>saTamList.some(s=>n.includes(s));
    const isKwa=n=>kwaTamList.some(s=>n.includes(s));
    if(targetData.sr===1){ // 과탐 필수
      if(!s1n||!s2n) reqMsgs.push(`탐구: <strong>과학탐구 2과목</strong> 필수 (현재 탐구 ${[s1n,s2n].filter(Boolean).length}과목 응시)`);
      else if(isSa(s1n)||isSa(s2n)) reqMsgs.push(`탐구: <strong>과학탐구</strong> 필수 (현재 사회탐구 응시)`);
    }
    if(targetData.sr===2){ // 사탐 필수
      if(!s1n||!s2n) reqMsgs.push(`탐구: <strong>사회탐구 2과목</strong> 필수 (현재 탐구 ${[s1n,s2n].filter(Boolean).length}과목 응시)`);
      else if(isKwa(s1n)||isKwa(s2n)) reqMsgs.push(`탐구: <strong>사회탐구</strong> 필수 (현재 과학탐구 응시)`);
    }
    if(targetData.sc>=2 && (!s1n||!s2n)){
      const m=`탐구: <strong>2과목</strong> 반영 (현재 ${[s1n,s2n].filter(Boolean).length}과목만 입력)`;
      if(!reqMsgs.some(x=>x.includes('탐구'))) reqMsgs.push(m);
    }
    if(targetData.hk==='합산' && !(r.hist&&r.hist.gr>0)){
      reqMsgs.push(`한국사: <strong>점수합산 반영</strong>${targetData.hr?` (${targetData.hr}%)`:''} (현재 한국사 미입력)`);
    }
    if(reqMsgs.length){
      targetInfoHtml += `
      <div style="background:#fef2f2;border:1.5px solid #fca5a5;border-radius:10px;padding:13px;margin-bottom:12px;">
        <div style="font-size:12px;font-weight:800;color:#dc2626;margin-bottom:7px;">🚫 필수응시과목을 응시하지 않았습니다</div>
        ${reqMsgs.map(m=>`<div style="font-size:11px;color:#7f1d1d;line-height:1.7;display:flex;gap:6px;"><span>•</span><span>${m}</span></div>`).join('')}
        <div style="font-size:10px;color:#991b1b;margin-top:8px;padding-top:8px;border-top:1px solid #fecaca;">⚠️ 현재 응시 과목으로는 <strong>${targetData.n} ${targetData.d}</strong>에 지원할 수 없습니다. 필수과목을 응시해야 지원 자격이 생깁니다.</div>
      </div>`;
    }

    // 한국사 가산점 / 전형특이사항 / 가감점 안내
    const infoRows = [];
    if(targetData.et==='o'){
      infoRows.push({ic:'📗',c:'#16a34a',t:`<strong>영어 선택반영(택) 대학</strong>입니다. 영어를 포함한 경우와 제외한 경우의 합격선이 다릅니다. 영어 성적이 좋으면 포함, 국·수·탐이 강하면 제외가 유리합니다. 대학추천 탭에서 영어포함/제외를 전환해 확인하세요.`});
    } else if(targetData.et==='n'){
      infoRows.push({ic:'📕',c:'#64748b',t:`이 학과는 <strong>영어를 점수에 반영하지 않습니다</strong> (국·수·탐 중심).`});
    }
    if(targetData.ch){
      const chTxt=targetData.ch.map(g=>{
        const map={'국':'국어','수':'수학','영':'영어','탐':'탐구','한':'한국사'};
        const subs=[...g[0]].map(c=>map[c]||c).join('·');
        return `${subs} 중 ${g[1]}과목`;
      }).join(' + ');
      infoRows.push({ic:'🎯',c:'#0891b2',t:`<strong>선택 반영:</strong> ${chTxt} 선택 가능. 잘 본 과목 위주로 반영됩니다.`});
    }
    if(targetData.hk==='가산'){
      infoRows.push({ic:'📘',c:'#2563eb',t:`<strong>한국사 가산점</strong> 대학입니다. 한국사 등급에 따라 가산점이 부여되니 한국사도 신경 써서 응시하세요.`});
    } else if(targetData.hk==='합산'){
      infoRows.push({ic:'📘',c:'#2563eb',t:`<strong>한국사 점수합산</strong> 대학입니다${targetData.hr?` (반영비율 ${targetData.hr}%)`:''}. 한국사 점수가 총점에 직접 반영됩니다.`});
    } else if(targetData.hk==='응시'){
      infoRows.push({ic:'📘',c:'#64748b',t:`한국사는 <strong>응시만 하면 되는 자격 요건</strong>입니다 (점수 미반영).`});
    }
    if(targetData.gm){
      infoRows.push({ic:'💡',c:'#b45309',t:`<strong>수능 가산/감점:</strong> ${targetData.gm}`});
    }
    if(targetData.tk){
      infoRows.push({ic:'📌',c:'#6d28d9',t:`<strong>전형 특이사항:</strong> ${targetData.tk}`});
    }
    if(infoRows.length){
      targetInfoHtml += `
      <div style="background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:13px;margin-bottom:12px;">
        <div style="font-size:11px;font-weight:800;color:var(--text);margin-bottom:8px;">📋 이 학과 추가 정보</div>
        ${infoRows.map(o=>`<div style="display:flex;gap:8px;margin-bottom:6px;"><span style="flex-shrink:0;">${o.ic}</span><span style="font-size:10.5px;color:var(--t2);line-height:1.6;">${o.t}</span></div>`).join('')}
      </div>`;
    }

    // 과목별 반영비율 기반 갭 분석
    const weights = {국어:targetData.kw, 수학:targetData.mw, 영어:targetData.ew, 탐구:targetData.sw};
    const totalW = (targetData.kw||0)+(targetData.mw||0)+(targetData.sw||0);

    if(gap > 0){
      // 어떤 과목 올리면 가장 효과적인지
      const efficiencies = [];
      if(r.kor.gr > 1) efficiencies.push({id:'국어', w:targetData.kw, gr:r.kor.gr, label:`${r.korSub} (${r.kor.gr}등급)`, color:'#2563eb', potential: Math.min(r.kor.gr-1, 3)*5*(targetData.kw/(totalW||100))});
      if(r.math.gr > 1) efficiencies.push({id:'수학', w:targetData.mw, gr:r.math.gr, label:`${r.mathSub} (${r.math.gr}등급)`, color:'#d97706', potential: Math.min(r.math.gr-1, 3)*7*(targetData.mw/(totalW||100))});
      if(r.sci1.name && r.sci1.gr > 1) efficiencies.push({id:'탐구1', w:targetData.sw, gr:r.sci1.gr, label:`${Ui.escape(r.sci1.name)} (${r.sci1.gr}등급)`, color:'#7c3aed', potential: Math.min(r.sci1.gr-1, 3)*4*(targetData.sw/(totalW||100))});
      if(r.sci2.name && r.sci2.gr > 1) efficiencies.push({id:'탐구2', w:targetData.sw, gr:r.sci2.gr, label:`${Ui.escape(r.sci2.name)} (${r.sci2.gr}등급)`, color:'#be185d', potential: Math.min(r.sci2.gr-1, 3)*4*(targetData.sw/(totalW||100))});
      efficiencies.sort((a,b)=>b.potential-a.potential);

      const priority = stgTarget.priority;
      const topSubj = efficiencies[0];

      let adviceItems = [];
      // 우선순위 전략
      if(priority === 'uni'){
        adviceItems.push({color:'#2563eb', text:`<strong>[대학 우선 전략]</strong> ${targetData.n} 합격을 최우선 목표로 설정합니다. 현재 ${Math.round(gap)}점 부족하며, 여러 과목 균형 향상이 핵심입니다.`});
        if(topSubj) adviceItems.push({color:'#059669', text:`<strong>최우선 과목: ${topSubj.id} (${Ui.escape(topSubj.label)})</strong>. ${targetData.n}의 반영비율 ${topSubj.w}% 과목으로, 1등급 상승 시 배치표 점수 약 ${Math.round(topSubj.potential)}점 향상 효과.`});
        if(efficiencies.length > 1) adviceItems.push({color:'#d97706', text:`<strong>보조 과목: ${efficiencies[1].id} (${Ui.escape(efficiencies[1].label)})</strong>. 함께 올리면 시너지 효과가 있습니다. 2개 과목 집중 시 목표 달성 가능성이 큽니다.`});
        if(targetData.mr && r.mathSub==='확률과통계') adviceItems.push({color:'#dc2626', text:`<strong>⚠️ 수학 선택과목 변경 검토:</strong> ${targetData.n} ${targetData.d}은 미적분/기하 필수입니다. 미적분·기하로 변경하면 지원 자격이 생깁니다.`});
      } else {
        // 학과 우선 전략
        adviceItems.push({color:'#7c3aed', text:`<strong>[학과 우선 전략]</strong> ${targetData.d} 학과 특성에 맞는 과목을 중점 강화합니다. 해당 계열 반영비율이 높은 과목이 핵심입니다.`});
        const highW = [
          {id:'국어', w:targetData.kw||0},
          {id:'수학', w:targetData.mw||0},
          {id:'탐구', w:targetData.sw||0}
        ].sort((a,b)=>b.w-a.w)[0];
        adviceItems.push({color:'#059669', text:`<strong>${highW.id} 반영비율 ${highW.w}%로 최고 비중</strong>. ${targetData.d} 진학에 가장 직접적인 영향을 주는 과목입니다. 이 과목 1등급 달성을 1순위 목표로 삼으세요.`});
        if(targetData.d.includes('의') || targetData.d.includes('약') || targetData.d.includes('간호'))
          adviceItems.push({color:'#d97706', text:`<strong>의약학 계열 팁:</strong> 탐구 2과목 모두 과탐이어야 하며, 특히 생명과학·화학을 권장합니다. 탐구 평균 1등급이 합격의 기준선입니다.`});
        if(targetData.mr)
          adviceItems.push({color:'#dc2626', text:`<strong>⚠️ 미적분/기하 필수:</strong> ${targetData.d}은 이공계 학과로 미적분 또는 기하를 필수 응시해야 합니다. 현재 ${r.mathSub} 응시 중입니다. ${r.mathSub==='확률과통계'?'선택과목 변경이 필요합니다.':'적합합니다.'}`});
      }

      // 수능 전략 가이드
      adviceItems.push({color:'#374151', text:`<strong>수능까지 전략:</strong> 현재 부족한 ${Math.round(gap)}점을 채우려면 각 과목 원점수 기준으로 약 ${Math.ceil(gap/4)}~${Math.ceil(gap/3)}점씩 향상이 필요합니다. 모의고사 성적이 실제 수능보다 낮게 나오는 경향이 있으니 현재보다 +5~10점 목표로 준비하세요.`});

      adviceHtml = adviceItems.map(a=>`
        <div class="advice-item">
          <div class="advice-dot" style="background:${a.color};"></div>
          <div class="advice-text">${a.text}</div>
        </div>`).join('');

      // 과목별 향상 갭 바
      gapHtml = efficiencies.map(e=>{
        const pct = Math.min(100, (e.potential/gap)*100);
        return `<div class="gap-row">
          <div class="gap-subj">${e.id}</div>
          <div class="gap-bar-wrap">
            <div style="font-size:9px;color:var(--t3);margin-bottom:3px;">${Ui.escape(e.label)} · 반영비율 ${e.w}%</div>
            <div class="gap-bar-bg"><div class="gap-bar-fill ${pct>=60?'ok':'need'}" style="width:${pct}%;"></div></div>
          </div>
          <div class="gap-meta" style="color:${pct>=60?'var(--a3)':'var(--red)'};">+${Math.round(e.potential)}점</div>
        </div>`;
      }).join('');
    } else {
      // 이미 목표 초과
      targetInfoHtml += `<div style="background:var(--a3-light);border:1px solid #a7f3d0;border-radius:9px;padding:12px;margin-bottom:12px;font-size:11px;color:#065f46;"><strong>✅ 현재 점수로 ${targetData.n} ${targetData.d} 안정권입니다!</strong><br>더 높은 목표 대학으로 도전해보세요.</div>`;
      adviceHtml = `<div class="advice-item"><div class="advice-dot" style="background:#059669;"></div><div class="advice-text"><strong>현재 성적으로 충분히 합격 가능한 수준입니다.</strong> 수능까지 현재 수준을 유지하면서, 더 상위 대학 도전을 검토해보세요.</div></div>`;
    }
  } else {
    adviceHtml = `
      <div class="advice-item"><div class="advice-dot" style="background:#2563eb;"></div><div class="advice-text"><strong>목표 대학·학과를 선택</strong>하면 맞춤형 지원전략과 과목별 향상 가이드를 제공합니다.</div></div>
      <div class="advice-item"><div class="advice-dot" style="background:#d97706;"></div><div class="advice-text"><strong>현재 수준(${levels[curLevelIdx]?.lbl||'중위권'}):</strong> 국수탐 합산 ${myStd}점 · 대표 지원가능 대학: ${levels[curLevelIdx]?.eg||'해당 없음'}</div></div>
      <div class="advice-item"><div class="advice-dot" style="background:#059669;"></div><div class="advice-text"><strong>다음 레벨 목표:</strong> ${curLevelIdx>0?levels[curLevelIdx-1].lbl+'('+levels[curLevelIdx-1].score+'점 이상)까지 '+(levels[curLevelIdx-1].score-myStd)+'점 향상 필요':'이미 최상위권입니다. 수능까지 현 수준 유지가 핵심!'}</div></div>`;
  }

  // 성적 관리 섹션
  const scoreManageHtml = `
  <div class="stg-card">
    <div class="stg-hdr"><div class="stg-icon">📋</div><div class="stg-title">성적 기록 관리</div></div>
    ${scores.map((s,i)=>{
      const tot=(s.kor.std||0)+(s.math.std||0)+(s.sci1.std||0)+(s.sci2.std||0);
      return `<div style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--border);">
        <div style="flex:1;">
          <div style="font-size:12px;font-weight:700;">${s.examType}</div>
          <div style="font-size:10px;color:var(--t3);">${s.korSub} · ${s.mathSub}${Ui.escape(s.sci1.name?' · '+s.sci1.name.slice(0,4):'')}</div>
        </div>
        <div style="font-family:'Space Mono',monospace;font-size:16px;font-weight:700;color:var(--accent);">${tot}</div>
        <button class="score-del-btn" onclick="delScore(${s.id})">삭제</button>
      </div>`;
    }).join('')}
    ${scores.length>1?`<button onclick="deleteAllMockScores()" style="width:100%;margin-top:10px;padding:10px;border-radius:8px;border:1px solid #fecaca;background:var(--red-light);color:var(--red);font-family:'Noto Sans KR',sans-serif;font-size:12px;font-weight:700;cursor:pointer;">🗑️ 전체 삭제</button>`:''}
  </div>`;

  // 레벨 차트
  const levelHtml = `
  <div class="stg-card">
    <div class="stg-hdr"><div class="stg-icon">📊</div><div class="stg-title">현재 수준 분석</div><div class="stg-sub">국수탐 표준점수 합산</div></div>
    <div class="level-bar">
      ${levels.map((l,i)=>`<div class="level-item ${myStd>=l.score?'on':''}" style="${myStd>=l.score?'background:'+l.color+';border-color:'+l.color+';':''}">
        <div class="li-lbl" style="${myStd>=l.score?'color:rgba(255,255,255,.7)':''}">${l.lbl}</div>
        <div class="li-score" style="${myStd>=l.score?'color:white':''}">${l.score}+</div>
      </div>`).join('')}
    </div>
    <div style="font-size:11px;color:var(--t2);padding:10px;background:var(--surface);border-radius:8px;border:1px solid var(--border);">
      <strong>내 점수: ${myStd}점</strong> (백분위 합산 ${myPct}점)<br>
      현재 <strong style="color:${levels[curLevelIdx]?.color||'#374151'}">${levels[curLevelIdx]?.lbl||'중위권'}</strong> 수준 · ${levels[curLevelIdx]?.eg||''}
      ${curLevelIdx>0?`<br>▶ 다음 레벨까지 <strong>+${levels[curLevelIdx-1].score-myStd}점</strong> 필요`:'<br>▶ 최상위권 유지 중'}
    </div>

    <div style="margin-top:12px;">
      <div style="font-size:11px;font-weight:700;margin-bottom:8px;color:var(--text);">📈 레벨업 전략</div>
      ${(() => {
        const ups = [];
        const korGap = (r.kor.gr||9) - 1;
        const mathGap = (r.math.gr||9) - 1;
        const engGap = (r.eng.gr||9) - 1;
        const sci1Gap = (r.sci1.gr||9) - 1;
        if(mathGap >= 2) ups.push({color:'#d97706', text:`<strong>수학</strong> ${r.mathSub} ${r.math.gr}등급 → 1등급 목표: 표준점수 약 +${mathGap*6}점 향상 가능 (가장 효과적)`});
        if(korGap >= 2) ups.push({color:'#2563eb', text:`<strong>국어</strong> ${r.korSub} ${r.kor.gr}등급 → 1등급 목표: 표준점수 약 +${korGap*5}점 향상 가능`});
        if(engGap >= 1) ups.push({color:'#059669', text:`<strong>영어</strong> ${r.eng.gr}등급 → 1등급: 절대평가이므로 90점 이상만 맞으면 됩니다. 가장 확실한 레벨업`});
        if(r.sci1.name && sci1Gap >= 2) ups.push({color:'#7c3aed', text:`<strong>탐구(${Ui.escape(r.sci1.name.slice(0,4))})</strong> ${r.sci1.gr}등급 → 1등급: 표준점수 약 +${sci1Gap*4}점 향상 가능`});
        if(ups.length === 0) ups.push({color:'#059669', text:'현재 전 과목 최상위권입니다. 수능까지 현 수준 유지가 핵심입니다!'});
        return ups.slice(0,3).map(u=>`<div class="advice-item"><div class="advice-dot" style="background:${u.color};"></div><div class="advice-text">${u.text}</div></div>`).join('');
      })()}
    </div>
  </div>`;

  // 목표 설정 UI
  const targetSetHtml = `
  <div class="stg-card">
    <div class="stg-hdr"><div class="stg-icon">🎯</div><div class="stg-title">목표 대학·학과 설정</div></div>
    <div style="margin-bottom:8px;">
      <div class="form-lbl" style="margin-bottom:5px;">대학 선택</div>
      <select class="target-select" id="stg-uni-sel" onchange="onStgUniChange(this.value)">
        <option value="">-- 대학 선택 --</option>
        ${uniNames.map(n=>`<option value="${n}" ${stgTarget.uni===n?'selected':''}>${n}</option>`).join('')}
      </select>
    </div>
    ${targetUni?`<div style="margin-bottom:12px;">
      <div class="form-lbl" style="margin-bottom:5px;">학과 선택</div>
      <select class="target-select" id="stg-dept-sel" onchange="onStgDeptChange(this.value)">
        <option value="">-- 학과 선택 --</option>
        ${deptList.map(d=>`<option value="${d}" ${stgTarget.dept===d?'selected':''}>${d}</option>`).join('')}
      </select>
    </div>`:''}
    <div style="margin-bottom:10px;">
      <div class="form-lbl" style="margin-bottom:5px;">지원 우선순위</div>
      <div style="display:flex;gap:8px;">
        <div onclick="onStgPriority('uni')" style="flex:1;padding:10px;border-radius:8px;border:2px solid ${stgTarget.priority==='uni'?'var(--accent)':'var(--border)'};background:${stgTarget.priority==='uni'?'var(--accent-light)':'var(--surface)'};cursor:pointer;text-align:center;">
          <div style="font-size:13px;font-weight:700;color:${stgTarget.priority==='uni'?'var(--accent)':'var(--text)'};">🏫 대학 우선</div>
          <div style="font-size:9px;color:var(--t3);margin-top:3px;">이 대학 합격에 집중</div>
        </div>
        <div onclick="onStgPriority('dept')" style="flex:1;padding:10px;border-radius:8px;border:2px solid ${stgTarget.priority==='dept'?'var(--accent)':'var(--border)'};background:${stgTarget.priority==='dept'?'var(--accent-light)':'var(--surface)'};cursor:pointer;text-align:center;">
          <div style="font-size:13px;font-weight:700;color:${stgTarget.priority==='dept'?'var(--accent)':'var(--text)'};">📚 학과 우선</div>
          <div style="font-size:9px;color:var(--t3);margin-top:3px;">이 학과 특성에 맞게 준비</div>
        </div>
      </div>
    </div>
  </div>`;

  // 목표 갭 분석
  let gapCardHtml = '';
  if(targetData && gapHtml){
    gapCardHtml = `<div class="stg-card">
      <div class="stg-hdr"><div class="stg-icon">📉</div><div class="stg-title">과목별 향상 효과 분석</div><div class="stg-sub">${stgTarget.priority==='uni'?'대학 우선':'학과 우선'}</div></div>
      <div style="font-size:10px;color:var(--t3);margin-bottom:8px;">각 과목 1등급 향상 시 배치표 점수 기여도</div>
      ${gapHtml}
    </div>`;
  }

  // 맞춤 조언
  let adviceCardHtml = '';
  if(adviceHtml){
    adviceCardHtml = `<div class="stg-card">
      <div class="stg-hdr"><div class="stg-icon">💡</div><div class="stg-title">맞춤 지원 가이드</div></div>
      ${targetInfoHtml}
      ${adviceHtml}
    </div>`;
  }

  cont.innerHTML = levelHtml + targetSetHtml + adviceCardHtml + gapCardHtml + scoreManageHtml;
}

function onStgUniChange(v){
  stgTarget.uni = v;
  stgTarget.dept = '';
  renderStrategy();
}
function onStgDeptChange(v){
  stgTarget.dept = v;
  renderStrategy();
}
function onStgPriority(v){
  stgTarget.priority = v;
  renderStrategy();
}

// ========================================================================
// 주간테스트 (Supabase 연동)
// ========================================================================
// ▼▼▼ 여기 두 줄만 본인 Supabase 값으로 채우세요 (Project Settings > API) ▼▼▼
// ▲▲▲ anon public key만 넣으세요. service_role key는 절대 넣지 마세요 ▲▲▲

let _sb = null;        // supabase 클라이언트
let _wuser = null;     // 로그인 사용자 {id,email}
let _wprofile = null;  // {name, student_no, role}


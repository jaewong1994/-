async function renderCollection(){
const __mvpEpoch=SessionGuard.capture();

  const cont=document.getElementById('collection-content');
  const sb=sbReady();
  if(!sb){
    cont.innerHTML = `<div class="stg-card"><div class="stg-hdr"><div class="stg-icon">🏅</div><div class="stg-title">컬렉션</div></div><div style="font-size:12px;color:var(--t2);">테스트 설정(Supabase 연결)이 필요합니다.</div></div>`;
    return;
  }
  const { data:{ session } } = await SessionGuard.wait((sb.auth.getSession()),__mvpEpoch);
  if(!session){
    cont.innerHTML = `<div class="stg-card"><div class="stg-hdr"><div class="stg-icon">🏅</div><div class="stg-title">컬렉션</div></div><div style="font-size:12px;color:var(--t2);text-align:center;padding:16px 0;">먼저 <strong>테스트 탭</strong>에서 로그인하세요.</div></div>`;
    return;
  }
  const uid=session.user.id;
  const { data:prof } = await SessionGuard.wait((sb.from('profiles').select('name').eq('id',uid).single()),__mvpEpoch);
  const name = prof ? prof.name : '나';
  // 내 컬렉션
  let { data:col } = await SessionGuard.wait((sb.from('collections').select('*').eq('user_id',uid).maybeSingle()),__mvpEpoch);
  if(!col) col = {jun:0,kill:0,god:0,gold:0,silver:0,bronze:0,perfect:0,solo:0};

  const totalIcons = col.jun+col.kill+col.god;
  const totalMedals = col.gold+col.silver+col.bronze+col.perfect;

  // 난이도 아이콘 카드
  const diffCard = `
    <div class="col-section">
      <div class="col-section-title">⚡ 난이도 정복</div>
      <div class="col-grid">
        ${colItem('⚔️','준킬러',col.jun,'#2563eb')}
        ${colItem('💀','킬러',col.kill,'#7c3aed')}
        ${colItem('👑','GOD',col.god,'#d97706')}
      </div>
    </div>`;

  // 메달 카드
  const medalCard = `
    <div class="col-section">
      <div class="col-section-title">🏆 메달 & 배지</div>
      <div class="col-grid">
        ${colItem('🥇','금메달',col.gold,'#f59e0b')}
        ${colItem('🥈','은메달',col.silver,'#9ca3af')}
        ${colItem('🥉','동메달',col.bronze,'#b45309')}
        ${colItem('💎','만점',col.perfect,'#06b6d4')}
        ${colItem('🏅','혼자맞춤',col.solo||0,'#d97706')}
      </div>
    </div>`;

  // 칭호 계산 (총 수집량 기반)
  const titleInfo = colTitle(col);

  cont.innerHTML = `
  <div class="col-hero">
    <div class="col-hero-shine"></div>
    <div style="position:relative;z-index:1;">
      <div style="font-size:11px;opacity:.8;letter-spacing:1px;">EPSILON COLLECTION</div>
      <div style="font-size:22px;font-weight:900;margin:2px 0 6px;">${Ui.escape(name)}</div>
      <div class="col-title-badge">${titleInfo.icon} ${Ui.escape(titleInfo.title)}</div>
      <div style="display:flex;gap:16px;margin-top:14px;">
        <div><div style="font-family:'Space Mono',monospace;font-size:26px;font-weight:700;">${totalIcons}</div><div style="font-size:9px;opacity:.75;">난이도 정복</div></div>
        <div style="width:1px;background:rgba(255,255,255,.25);"></div>
        <div><div style="font-family:'Space Mono',monospace;font-size:26px;font-weight:700;">${totalMedals}</div><div style="font-size:9px;opacity:.75;">메달·배지</div></div>
      </div>
    </div>
  </div>
  ${diffCard}
  ${medalCard}
  <div style="text-align:center;margin:14px 0 8px;">
    <div style="font-size:10px;color:var(--t3);">📸 이 화면을 캡처해서 친구들에게 자랑하세요!</div>
  </div>
  <div id="photocard-zone"></div>`;
  window._myCol = col;
  if(typeof wRenderMyCards==='function') wRenderMyCards();
}

function colItem(icon, label, count, color){
  const active = count>0;
  const grad = `radial-gradient(circle at 32% 28%, #ffffffcc, transparent 42%), linear-gradient(150deg, ${color} 0%, ${color} 55%, rgba(0,0,0,.28) 130%)`;
  return `<div class="col-item ${active?'on':''}" style="${active?'border-color:'+color+';':''}">
    <div class="col-coin ${active?'':'off'}" style="background:${grad};">${icon}</div>
    <div class="col-item-count" style="${active?'color:'+color+';':'color:var(--t3);'}">×${count}</div>
    <div class="col-item-label">${Ui.escape(label)}</div>
  </div>`;
}

// 총 수집량으로 칭호 부여
function colTitle(col){
  const score = col.god*5 + col.kill*3 + col.jun*1 + col.gold*4 + col.silver*2 + col.bronze*1 + col.perfect*5 + (col.solo||0)*3;
  if(score>=60) return {icon:'🌟',title:'레전드 마스터'};
  if(score>=40) return {icon:'🔥',title:'킬러 헌터'};
  if(score>=25) return {icon:'⚡',title:'상위권 도전자'};
  if(score>=12) return {icon:'🌱',title:'성장하는 수험생'};
  if(score>=1)  return {icon:'🐣',title:'새내기 수집가'};
  return {icon:'📘',title:'아직 시작 전'};
}


// ================================================================
// 실전모의고사(30문항) 문항별 분석  ── v50 신규
//  · 문항별 정답자 공개  · 혼자맞춤 🏅  · 등급 도약 핵심문항 강조
//  ※ 크로스유저 답안은 RLS로 막혀있어 읽기용 RPC(mock_submissions) 사용
// ================================================================

// 등급 도약 핵심문항 (2027 수능 대비 · 언제든 수정 가능)
const MOCK_KEY_Q = {
  g1: [15, 21, 22, 28, 30],   // 1등급 도약 핵심
  g2: [13, 14, 20, 29]        // 2등급 도약 핵심
};


// ================================================================
// 🎯 수시 지원라인 (3개년 커트라인) ── v53
//  출처: 인천교육청 2026 대입 주요대학 3개년 수시 커트라인 (지역균형 제외)
//  데이터: const SUSI (임베드)
// ================================================================
window._susiCat = '인문종합';
window._susiGrade = null;
window._susiOpen = {};       // key -> true
window._susiSafeOnly = false;

const SUSI_CATS = ['인문교과','인문종합','자연교과','자연종합','교대·과기원'];

function _susiRepCut(g){ for(const x of g){ if(x!=null) return x; } return null; }

// --- 학교 순위: 인문교과 '작년(2025)' 등급컷의 학교별 중앙값 ---
function _susiMedian(arr){
  if(!arr || !arr.length) return null;
  const a=arr.slice().sort((x,y)=>x-y), n=a.length;
  return n%2 ? a[(n-1)/2] : (a[n/2-1]+a[n/2])/2;
}
// 학교별 '작년 등급컷' 수집 (계열 지정 가능)
function _susiCollect(cat){
  const by={};
  (typeof SUSI!=='undefined'?SUSI:[]).forEach(e=>{
    if(cat && e.cat!==cat) return;
    e.majors.forEach(m=>{ const c=m.g[0]; if(c!=null){ (by[e.u]=by[e.u]||[]).push(c); } });
  });
  const out={}; for(const s in by) out[s]=_susiMedian(by[s]);
  return out;
}
// 고정 학교순위: 인문교과 작년 중앙값 우선 → 없으면 인문종합 → 없으면 전체(모든 계열)
// 학교마다 값이 하나로 고정되어 모든 탭에서 동일한 배치가 됨
// 수동 순위 고정(핀): 인문교과 전형이 없어 순위가 밀리는 최상위권 학교를
// 지정한 등급값 위치에 고정한다. 값을 바꾸면 순위가 바로 조정됨.
// (앵커 인문교과 중앙값: 연세1.47·고려1.55·이화1.71·한양1.73·성균1.78·홍익2.07·동국2.21)
const SUSI_PIN = {
  '서울대':1.30, '서강대':1.62, '중앙대':1.85, '경희대':1.90,
  '서울시립대':1.95, '한국외대':2.00, '건국대':2.05,
  '숙명여자대':2.15, '인하대':2.30, '세종대':2.35
};
let _susiRankCache=null;
function _susiSchoolRankMap(){
  if(_susiRankCache) return _susiRankCache;
  const hum=_susiCollect('인문교과');     // 1순위 (요청 기준)
  const hjong=_susiCollect('인문종합');    // 2순위 폴백 (서울대 등 교과전형 없는 상위권)
  const allm=_susiCollect(null);           // 3순위 폴백 (인문계 자체가 없는 학교)
  const schools=new Set();
  (typeof SUSI!=='undefined'?SUSI:[]).forEach(e=>schools.add(e.u));
  _susiRankCache={};
  schools.forEach(u=>{
    _susiRankCache[u] = (SUSI_PIN[u]!=null ? SUSI_PIN[u]
                        : (hum[u]!=null?hum[u] : (hjong[u]!=null?hjong[u] : (allm[u]!=null?allm[u] : 99))));
  });
  return _susiRankCache;
}
function _susiSortKey(e){
  const r=_susiSchoolRankMap();
  return r[e.u]!=null ? r[e.u] : 99;
}

// 내 등급 vs 커트 → 지원 판정
function _susiFit(cut){
  const g = window._susiGrade;
  if(g==null || cut==null) return null;
  const d = cut - g;                       // + = 커트가 나보다 나쁨(=나에게 안정)
  if(d >= 0.3)  return {k:'safe',  t:'안정', c:'#047857', bg:'#d1fae5', bd:'#6ee7b7', r:1};
  if(d > -0.3)  return {k:'fit',   t:'적정', c:'#1d4ed8', bg:'#dbeafe', bd:'#93c5fd', r:2};
  if(d >= -1.0) return {k:'reach', t:'소신', c:'#b45309', bg:'#fef3c7', bd:'#fcd34d', r:3};
  return {k:'hard', t:'상향', c:'#6b7280', bg:'#f3f4f6', bd:'#e5e7eb', r:4};
}

// 엔트리의 지원 요약(등급 입력 시)
function _susiEntrySummary(e){
  const g = window._susiGrade;
  if(g==null) return null;
  let safe=0, fit=0, reach=0, hard=0, best=9;
  e.majors.forEach(m=>{
    const cut=_susiRepCut(m.g); if(cut==null) return;
    const f=_susiFit(cut); if(!f) return;
    if(f.k==='safe')safe++; else if(f.k==='fit')fit++; else if(f.k==='reach')reach++; else hard++;
    if(f.r<best) best=f.r;
  });
  return {safe,fit,reach,hard,best,reachable:(safe+fit+reach)>0};
}

function renderSusi(){
  const box = document.getElementById('susi-content');
  if(!box) return;
  const g = window._susiGrade;

  // 계열 탭
  const tabsHtml = SUSI_CATS.map(c=>{
    const on = c===window._susiCat;
    const label = c==='교대·과기원' ? '교대·과기원' : c.replace('인문','인문 ').replace('자연','자연 ');
    return `<button onclick="susiSetCat('${c}')" style="flex:0 0 auto;padding:7px 12px;border-radius:9px;border:1px solid ${on?'var(--accent)':'var(--border)'};background:${on?'var(--accent)':'var(--surface)'};color:${on?'#fff':'var(--t2)'};font-size:12px;font-weight:700;cursor:pointer;font-family:'Noto Sans KR',sans-serif;white-space:nowrap;">${Ui.escape(label)}</button>`;
  }).join('');

  // 내신 입력 바
  const gradeBar = `
    <div style="display:flex;gap:6px;align-items:center;margin:10px 0;">
      <div style="flex:1;display:flex;align-items:center;gap:6px;background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:8px 10px;">
        <span style="font-size:11px;color:var(--t3);white-space:nowrap;">내신 등급</span>
        <input id="susi-grade-in" type="number" inputmode="decimal" step="0.1" min="1" max="9" placeholder="예: 2.3"
          value="${g!=null?g:''}" oninput="susiOnGradeInput(this.value)"
          style="width:100%;border:none;background:transparent;font-size:16px;font-weight:800;color:var(--accent);font-family:'Space Mono',monospace;outline:none;">
      </div>
      ${g!=null?`<button onclick="susiClearGrade()" style="padding:9px 11px;background:var(--surface);color:var(--t3);border:1px solid var(--border);border-radius:9px;font-size:11px;cursor:pointer;font-family:'Noto Sans KR',sans-serif;">초기화</button>`:''}
    </div>`;

  // 데이터 필터/정렬
  let list = (typeof SUSI!=='undefined'?SUSI:[]).filter(e=>e.cat===window._susiCat);
  list = list.slice().sort((a,b)=>{
    const ka=_susiSortKey(a), kb=_susiSortKey(b);   // 인문교과 작년 등급컷 중앙값 기준 학교순위
    if(ka!==kb) return ka-kb;                        // 상위(낮은 등급) 학교부터
    if(a.u!==b.u) return a.u<b.u?-1:1;               // 같은 순위면 학교명
    return a.adm<b.adm?-1:1;                         // 같은 학교면 전형명
  });
  if(g!=null && window._susiSafeOnly){
    list = list.filter(e=>{ const s=_susiEntrySummary(e); return s && s.reachable; });
  }

  // 안내(등급 입력 시 지원가능만 토글)
  const controlBar = g!=null ? `
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;font-size:11px;color:var(--t3);">
      <label style="display:flex;align-items:center;gap:5px;cursor:pointer;">
        <input type="checkbox" ${window._susiSafeOnly?'checked':''} onchange="susiToggleSafe(this.checked)" style="width:15px;height:15px;">
        내 등급으로 지원 가능한 곳만
      </label>
      <span style="margin-left:auto;">${list.length}곳</span>
    </div>` : `<div style="font-size:11px;color:var(--t3);margin-bottom:8px;">상위 학교부터 · ${list.length}곳 · 내신 등급을 넣으면 지원 판정이 나와요</div>`;

  // 학교 카드
  const cards = list.map(e=>susiCardHtml(e)).join('') ||
    `<div style="text-align:center;color:var(--t3);font-size:12px;padding:24px;">표시할 학교가 없습니다.</div>`;

  // 범례 + 디스클레이머
  const legend = g!=null ? `
    <div style="display:flex;gap:5px;flex-wrap:wrap;margin:10px 0 6px;font-size:10px;">
      <span style="padding:2px 8px;border-radius:10px;background:#d1fae5;color:#047857;font-weight:700;">안정 (커트보다 우수)</span>
      <span style="padding:2px 8px;border-radius:10px;background:#dbeafe;color:#1d4ed8;font-weight:700;">적정 (커트 근처)</span>
      <span style="padding:2px 8px;border-radius:10px;background:#fef3c7;color:#b45309;font-weight:700;">소신 (커트보다 아래)</span>
      <span style="padding:2px 8px;border-radius:10px;background:#f3f4f6;color:#6b7280;font-weight:700;">상향</span>
    </div>` : '';

  box.innerHTML = `
    <div style="display:flex;gap:6px;overflow-x:auto;padding-bottom:4px;-webkit-overflow-scrolling:touch;">${tabsHtml}</div>
    ${gradeBar}
    ${controlBar}
    ${legend}
    <div>${cards}</div>
    <div style="margin-top:14px;padding:10px;background:var(--surface);border:1px solid var(--border);border-radius:10px;font-size:10px;color:var(--t3);line-height:1.6;">
      📌 <b>참고용 자료입니다.</b> 최근 3개년(2025·24·23) 수시 합격자 등급이며 <b>2026 예상 커트가 아닙니다.</b> 지역균형(교과추천) 전형은 제외했고, 대학·학과별 산출 기준이 다를 수 있어요. 실제 지원은 반드시 대학 모집요강과 담임·전문가 상담으로 확정하세요.<br>
      학교 순서는 <b>인문교과 작년(2025) 등급컷의 학교별 중앙값</b> 기준이며 모든 계열 탭에 동일하게 적용됩니다(교과전형이 없는 학교는 인문종합 중앙값으로 대체).<br>
      <span style="opacity:.7;">출처: 인천광역시교육청 2026 대입 주요대학 3개년 수시 커트라인</span>
    </div>`;
}

function susiCardHtml(e){
  const key = e.cat+'|'+e.u+'|'+e.adm;
  const open = !!window._susiOpen[key];
  const g = window._susiGrade;
  const sum = _susiEntrySummary(e);

  // 커트 범위 배지
  const range = (e.lo!=null&&e.hi!=null)
    ? `<span style="font-size:10px;font-family:'Space Mono',monospace;padding:2px 7px;border-radius:8px;background:var(--accent-light);color:var(--accent);font-weight:700;white-space:nowrap;">${e.lo}~${e.hi}등급</span>`
    : '';
  // 수능최저 배지
  const minBadge = e.min
    ? `<span style="font-size:9px;padding:2px 7px;border-radius:8px;background:#fef3c7;color:#92400e;font-weight:800;white-space:nowrap;">📕 수능최저</span>`
    : `<span style="font-size:9px;padding:2px 7px;border-radius:8px;background:#eef2ff;color:#4f46e5;font-weight:700;white-space:nowrap;">최저 없음</span>`;
  // 지원 요약(등급 입력 시)
  let fitChips='';
  if(sum){
    const parts=[];
    if(sum.safe) parts.push(`<span style="color:#047857;">안정 ${sum.safe}</span>`);
    if(sum.fit) parts.push(`<span style="color:#1d4ed8;">적정 ${sum.fit}</span>`);
    if(sum.reach) parts.push(`<span style="color:#b45309;">소신 ${sum.reach}</span>`);
    fitChips = parts.length
      ? `<div style="font-size:10px;font-weight:700;margin-top:3px;">${parts.join(' · ')}</div>`
      : `<div style="font-size:10px;color:var(--t3);margin-top:3px;">지원 가능 학과 적음(상향)</div>`;
  }

  const header = `
    <div onclick="susiToggle('${key.replace(/'/g,"\\'")}')" style="display:flex;align-items:flex-start;gap:8px;padding:12px;cursor:pointer;">
      <div style="flex:1;min-width:0;">
        <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
          <span style="font-size:14px;font-weight:800;color:var(--t1);">${e.u}</span>
          ${minBadge}
        </div>
        <div style="font-size:11px;color:var(--t3);margin-top:2px;">${e.adm}</div>
        ${fitChips}
      </div>
      <div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px;">
        ${range}
        <span style="font-size:12px;color:var(--t3);transform:rotate(${open?'180':'0'}deg);transition:.2s;">▾</span>
      </div>
    </div>`;

  let body='';
  if(open){
    // 전형 특이사항 + 방법 + 최저
    let info='';
    if(e.note) info += `<div style="margin-bottom:8px;padding:9px;background:#fffbeb;border:1px solid #fde68a;border-radius:9px;font-size:11px;color:#78350f;line-height:1.6;white-space:pre-line;"><b>📝 전형 특이사항</b>\n${e.note}</div>`;
    if(e.min) info += `<div style="margin-bottom:6px;font-size:11px;color:#92400e;line-height:1.5;"><b>📕 수능최저:</b> ${e.min.replace(/\n/g,' ')}</div>`;
    if(e.method) info += `<div style="margin-bottom:8px;font-size:10px;color:var(--t3);line-height:1.5;"><b>전형방법:</b> ${e.method.replace(/\n/g,' ')}</div>`;

    // 학과 목록 (대표 커트 오름차순)
    const majors = e.majors.slice().map(m=>({...m, _cut:_susiRepCut(m.g)}))
      .sort((a,b)=>(a._cut==null?99:a._cut)-(b._cut==null?99:b._cut));
    const rows = majors.map(m=>{
      const f = _susiFit(m._cut);
      const badge = f ? `<span style="font-size:9px;padding:1px 6px;border-radius:8px;background:${f.bg};color:${f.c};border:1px solid ${f.bd};font-weight:800;white-space:nowrap;">${f.t}</span>` : '';
      const gy = m.g.map((x,i)=>{
        const yr=["'25","'24","'23"][i];
        return `<span style="font-size:9px;color:${i===0?'var(--t1)':'var(--t3)'};font-family:'Space Mono',monospace;">${yr} ${x!=null?x:'-'}</span>`;
      }).join('<span style="color:var(--border);">·</span>');
      const comp = m.c!=null ? `<span style="font-size:9px;color:var(--t3);">경쟁 ${m.c}:1</span>` : '';
      return `<div style="display:flex;align-items:center;gap:6px;padding:7px 0;border-bottom:1px solid var(--border);">
        <div style="flex:1;min-width:0;">
          <div style="font-size:12px;font-weight:600;color:var(--t1);">${m.m}</div>
          <div style="display:flex;gap:6px;align-items:center;margin-top:2px;flex-wrap:wrap;">${gy} ${comp}</div>
        </div>
        ${badge}
      </div>`;
    }).join('');

    body = `<div style="padding:0 12px 12px;">
      ${info}
      <div style="font-size:10px;color:var(--t3);margin-bottom:2px;">학과별 3개년 등급 ('25·'24·'23) · 최근 경쟁률</div>
      ${rows}
    </div>`;
  }

  // 카드 테두리 색(지원 판정 best)
  let edge='var(--border)';
  if(sum){ if(sum.best===1)edge='#6ee7b7'; else if(sum.best===2)edge='#93c5fd'; else if(sum.best===3)edge='#fcd34d'; }

  return `<div style="border:1px solid ${edge};border-radius:12px;margin-bottom:8px;background:var(--card,#fff);overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.04);">${header}${body}</div>`;
}

// --- 상호작용 ---
function susiSetCat(c){ window._susiCat=c; window._susiOpen={}; renderSusi(); }
function susiToggle(key){ window._susiOpen[key]=!window._susiOpen[key]; renderSusi(); }
function susiToggleSafe(v){ window._susiSafeOnly=v; renderSusi(); }
function susiClearGrade(){ window._susiGrade=null; window._susiSafeOnly=false; renderSusi(); }
let _susiGradeTimer=null;
function susiOnGradeInput(v){
  const n=parseFloat(v);
  window._susiGrade = (isFinite(n)&&n>=1&&n<=9)?Math.round(n*100)/100:null;
  clearTimeout(_susiGradeTimer);
  _susiGradeTimer=setTimeout(()=>{
    const el=document.getElementById('susi-grade-in');
    const focused = el && document.activeElement===el;
    renderSusi();
    if(focused){ const n2=document.getElementById('susi-grade-in'); if(n2){ n2.focus(); const val=n2.value; n2.value=''; n2.value=val; } }
  }, 500);
}


// ========================================================================
// 자료실 — 그룹 기반 자료 배포 (원장이 화면에서 직접 관리)
//   viewer_groups        카드 하나. 이름·부제·색상
//   viewer_group_classes 그룹을 어느 반에 줄지 (다대다)
//   viewer_materials     자료. row_key 가 같으면 한 줄에 묶이고 label 이 버튼 글자
// 열람: HTML 은 download → Blob → iframe (Storage 가 HTML 을 text/plain 으로 주기 때문)
//       PDF 는 signed URL 을 새 탭으로 (PDF 는 정상 content-type 으로 나온다)
// ========================================================================
const VW_PALETTE=['#1c46c4','#1a9b3c','#e11f1c','#d97706','#7c3aed','#0891b2','#be185d','#334155'];
const VW_CACHE_MAX=3;

let _vwPaths={};                                  // 버튼 id -> {path,title,kind}
let _vwCache=[];                                  // [{path,url}] 뒤쪽이 최근
let _vw={groups:[],mats:[],classes:[],gc:[]};     // 마지막으로 읽은 데이터
let _vwAdmin=false;                               // 관리 모드 on/off
let _vwEdit=null;                                 // 편집 중인 그룹 id, 새로 만들면 'new'
let _vwAddTo=null;                                // 자료 추가 대상 그룹 id
let _vwBusy=false;


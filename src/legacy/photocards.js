function photoLocalKey(){return 'student-mvp:photobg:'+(_wuser?.id||'guest');}
function pcCompress(file){
  return new Promise((resolve,reject)=>{
    const rd=new FileReader();
    rd.onerror=()=>reject(new Error('파일을 읽지 못했습니다'));
    rd.onload=()=>{
      const img=new Image();
      img.onerror=()=>reject(new Error('이미지를 열지 못했습니다'));
      img.onload=()=>{
        const maxSide=900;
        const sc=Math.min(1, maxSide/Math.max(img.width,img.height));
        const w=Math.round(img.width*sc), h=Math.round(img.height*sc);
        const cv=document.createElement('canvas'); cv.width=w; cv.height=h;
        cv.getContext('2d').drawImage(img,0,0,w,h);
        resolve(cv.toDataURL('image/jpeg',0.82));
      };
      img.src=rd.result;
    };
    rd.readAsDataURL(file);
  });
}

// =====================================================================
// (선생님) 팡팡포카 관리
// =====================================================================
async function wPhotoAdmin(){
if(!window.AppSession?.can('cards'))return;

const __mvpEpoch=SessionGuard.capture();

  const sb=sbReady();
  const cont=document.getElementById('wtest-content');
  cont.innerHTML = wHeader(_wprofile.name|| (isDirectorRole()?'원장':'선생님'), staffRoleLabel())
    + staffToolbar('poka')
    + `<div class="staff-empty">불러오는 중...</div>`;
  const { data:cards, error } = await SessionGuard.wait((sb.from('photocards').select('id,title,rarity,image,in_pool,created_at').order('created_at',{ascending:false})),__mvpEpoch);
  const rarityOpts = Object.keys(PC_RARITY).map(k=>`<option value="${k}">${Ui.escape(PC_RARITY[k].label)}</option>`).join('');

  let listHtml='';
  if(error){ listHtml=`<div style="font-size:12px;color:var(--red);text-align:center;padding:14px;">${Ui.escape(error.message)}<br><span style="font-size:10px;color:var(--t3);">팡팡포카 SQL을 아직 실행하지 않았다면 먼저 실행하세요.</span></div>`; }
  else if(!cards || !cards.length){ listHtml=`<div style="font-size:12px;color:var(--t3);text-align:center;padding:14px;">아직 만든 카드가 없습니다.</div>`; }
  else{
    listHtml = cards.map(c=>{
      const r=PC_RARITY[c.rarity]||PC_RARITY.normal;
      const pool = c.in_pool!==false;
      return `<div style="display:flex;align-items:center;gap:8px;padding:10px 0;border-bottom:1px solid var(--border);flex-wrap:wrap;">
        <div style="width:52px;height:68px;border-radius:8px;background:${r.ring};padding:2.5px;flex-shrink:0;">
          <img src="${c.image}" style="width:100%;height:100%;object-fit:cover;border-radius:6px;display:block;">
        </div>
        <div style="flex:1;min-width:0;">
          <div style="font-size:13px;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${Ui.escape(c.title)}</div>
          <div style="font-size:10px;color:var(--t3);">${Ui.escape(r.label)} · ${(c.created_at||'').slice(0,10)}</div>
        </div>
        <button onclick="wPcTogglePool(${c.id},${pool})" title="응시 자동지급 풀에 포함 여부" style="padding:7px 9px;background:${pool?'var(--a3-light)':'var(--surface)'};color:${pool?'#065f46':'var(--t3)'};border:1px solid ${pool?'#a7f3d0':'var(--border)'};border-radius:7px;font-size:10px;font-weight:700;cursor:pointer;font-family:'Noto Sans KR',sans-serif;">${pool?'💫 자동지급':'수동전용'}</button>
        <button onclick="wPcAward(${c.id},${Ui.argument(c.title)})" style="padding:7px 11px;background:var(--accent-light);color:var(--accent);border:1px solid var(--accent-mid);border-radius:7px;font-size:11px;font-weight:700;cursor:pointer;font-family:'Noto Sans KR',sans-serif;">배부</button>
        <button onclick="wPcDelete(${c.id},${Ui.argument(c.title)})" style="padding:7px 9px;background:var(--red-light);color:var(--red);border:1px solid #fecaca;border-radius:7px;font-size:11px;font-weight:700;cursor:pointer;font-family:'Noto Sans KR',sans-serif;">삭제</button>
      </div>`;
    }).join('');
  }

  cont.innerHTML = wHeader(_wprofile.name|| (isDirectorRole()?'원장':'선생님'), staffRoleLabel()) + staffToolbar('poka') + `
  <div class="stg-card">
    <div class="stg-hdr"><div class="stg-icon">🐾</div><div class="stg-title">팡팡포카 만들기</div></div>
    <div style="font-size:11px;color:var(--t3);margin-bottom:10px;line-height:1.6;">팡팡이 사진을 올리면 자동 압축됩니다. <b>💫 자동지급</b> 카드는 학생이 시험을 제출할 때마다 랜덤으로 1장씩 지급돼요 (이미 가진 카드는 제외).</div>
    <input id="pc-title" class="target-select" placeholder="카드 이름 (예: 팡팡이의 낮잠 #1)" style="width:100%;margin-bottom:8px;box-sizing:border-box;">
    <div style="display:flex;gap:6px;margin-bottom:8px;">
      <select id="pc-rarity" class="target-select" style="flex:1;">${rarityOpts}</select>
      <label style="flex:2;display:flex;align-items:center;justify-content:center;padding:9px;background:var(--surface);border:1px dashed var(--border);border-radius:8px;font-size:12px;color:var(--t2);cursor:pointer;font-weight:700;">
        🖼️ 사진 선택 <input id="pc-file" type="file" accept="image/*" style="display:none;" onchange="wPcPreview(this)">
      </label>
    </div>
    <div id="pc-preview" style="display:none;text-align:center;margin-bottom:8px;"></div>
    <button onclick="wPcCreate()" style="width:100%;padding:11px;background:var(--accent);color:white;border:none;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;font-family:'Noto Sans KR',sans-serif;">카드 만들기</button>
    <div id="pc-msg" style="font-size:11px;margin-top:8px;text-align:center;"></div>
  </div>
  <div class="stg-card">
    <div class="stg-hdr"><div class="stg-icon">🗂️</div><div class="stg-title">카드 목록</div><div class="stg-sub">${(cards||[]).length}장</div></div>
    ${listHtml}
    <div id="pc-award-zone"></div>
  </div>`;
}

async function wPcTogglePool(id, cur){
if(!window.AppSession?.can('cards'))return;

const __mvpEpoch=SessionGuard.capture();

  const sb=sbReady();
  const { error } = await SessionGuard.wait((sb.from('photocards').update({in_pool:!cur}).eq('id',id)),__mvpEpoch);
  if(error){ alert('변경 실패: '+error.message); return; }
  wPhotoAdmin();
}

async function wPcPreview(inp){
const __mvpEpoch=SessionGuard.capture();

  const box=document.getElementById('pc-preview');
  if(!inp.files || !inp.files[0]){ box.style.display='none'; return; }
  try{
    window._pcDataUrl = await SessionGuard.wait((pcCompress(inp.files[0])),__mvpEpoch);
    box.style.display='block';
    box.innerHTML=`<img src="${window._pcDataUrl}" style="max-width:160px;max-height:200px;border-radius:10px;border:1px solid var(--border);">
      <div style="font-size:9px;color:var(--t3);margin-top:4px;">압축 완료 · 약 ${Math.round(window._pcDataUrl.length*0.75/1024)}KB</div>`;
  }catch(e){SessionGuard.assert(__mvpEpoch); alert(e.message); }
}

async function wPcCreate(){
if(!window.AppSession?.can('cards'))return;

const __mvpEpoch=SessionGuard.capture();

  const sb=sbReady();
  const title=document.getElementById('pc-title').value.trim();
  const rarity=document.getElementById('pc-rarity').value;
  const msg=document.getElementById('pc-msg');
  if(!title){ msg.style.color='var(--red)'; msg.textContent='카드 이름을 입력하세요.'; return; }
  if(!window._pcDataUrl){ msg.style.color='var(--red)'; msg.textContent='사진을 선택하세요.'; return; }
  msg.style.color='var(--t3)'; msg.textContent='저장 중...';
  const { error } = await SessionGuard.wait((sb.from('photocards').insert({title, rarity, image:window._pcDataUrl})),__mvpEpoch);
  if(error){ msg.style.color='var(--red)'; msg.textContent='실패: '+error.message; return; }
  window._pcDataUrl=null;
  showToast('🐾 팡팡포카 생성 완료');
  wPhotoAdmin();
}

async function wPcDelete(id, title){
if(!window.AppSession?.can('cards'))return;

const __mvpEpoch=SessionGuard.capture();

  if(!confirm(`"${Ui.escape(title)}" 카드를 삭제할까요?\n학생들이 받은 카드도 함께 사라집니다.`)) return;
  const sb=sbReady();
  const { error } = await SessionGuard.wait((sb.from('photocards').delete().eq('id',id)),__mvpEpoch);
  if(error){ alert('삭제 실패: '+error.message); return; }
  showToast('삭제되었습니다'); wPhotoAdmin();
}

async function wPcAward(cardId, title){
if(!window.AppSession?.can('cards'))return;

const __mvpEpoch=SessionGuard.capture();

  const sb=sbReady();
  const zone=document.getElementById('pc-award-zone');
  zone.innerHTML=`<div style="font-size:11px;color:var(--t3);text-align:center;padding:10px;">대상 불러오는 중...</div>`;
  const { data:classes } = await SessionGuard.wait((sb.from('classes').select('id,name').order('id')),__mvpEpoch);
  const { data:profs } = await SessionGuard.wait((sb.from('profiles').select('id,name,student_no,role,class_id').order('student_no')),__mvpEpoch);
  const students=(profs||[]).filter(p=>p.role==='student');
  const clsOpts=(classes||[]).map(c=>`<option value="${c.id}">${Ui.escape(c.name)}</option>`).join('');
  const stuOpts=students.map(p=>`<option value="${p.id}">${Ui.escape(p.name||p.student_no||'?')}</option>`).join('');
  zone.innerHTML=`<div style="margin-top:12px;padding:12px;background:var(--accent-light);border:1px solid var(--accent-mid);border-radius:10px;">
    <div style="font-size:12px;font-weight:800;color:var(--accent);margin-bottom:8px;">📮 "${Ui.escape(title)}" 배부</div>
    <div style="display:flex;gap:6px;flex-wrap:wrap;">
      <button onclick="wPcGive(${cardId},'all')" style="flex:1;min-width:90px;padding:9px;background:var(--accent);color:white;border:none;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer;font-family:'Noto Sans KR',sans-serif;">전체 학생</button>
      <select id="pc-cls" class="target-select" style="flex:1;min-width:90px;">${clsOpts||'<option value="">반 없음</option>'}</select>
      <button onclick="wPcGive(${cardId},'class')" style="padding:9px 12px;background:var(--surface);color:var(--t2);border:1px solid var(--border);border-radius:8px;font-size:12px;font-weight:700;cursor:pointer;font-family:'Noto Sans KR',sans-serif;">반 배부</button>
    </div>
    <div style="display:flex;gap:6px;margin-top:6px;">
      <select id="pc-stu" class="target-select" style="flex:1;">${stuOpts}</select>
      <button onclick="wPcGive(${cardId},'one')" style="padding:9px 12px;background:var(--surface);color:var(--t2);border:1px solid var(--border);border-radius:8px;font-size:12px;font-weight:700;cursor:pointer;font-family:'Noto Sans KR',sans-serif;">개별 배부</button>
    </div>
    <div style="font-size:9px;color:var(--t3);margin-top:6px;">이미 가진 학생은 중복 지급되지 않습니다.</div>
  </div>`;
  window._pcStudents=students;
}

async function wPcGive(cardId, mode){
if(!window.AppSession?.can('cards'))return;

const __mvpEpoch=SessionGuard.capture();

  const sb=sbReady();
  let targets=[];
  const students=window._pcStudents||[];
  if(mode==='all') targets=students.map(s=>s.id);
  if(mode==='class'){ const cid=document.getElementById('pc-cls').value; targets=students.filter(s=>String(s.class_id)===String(cid)).map(s=>s.id); }
  if(mode==='one'){ const sid=document.getElementById('pc-stu').value; if(sid) targets=[sid]; }
  if(!targets.length){ alert('배부할 학생이 없습니다.'); return; }
  const rows=targets.map(uid=>({card_id:cardId, user_id:uid}));
  const { error } = await SessionGuard.wait((sb.from('photocard_awards').upsert(rows, {onConflict:'card_id,user_id', ignoreDuplicates:true})),__mvpEpoch);
  if(error){ alert('배부 실패: '+error.message); return; }
  showToast(`📮 ${targets.length}명에게 배부 완료`);
}

// =====================================================================
// (학생) 🐾 팡팡포카 갤러리 — 컬렉션 탭 하단
// =====================================================================
async function wRenderMyCards(){
const __mvpEpoch=SessionGuard.capture();

  const zone=document.getElementById('photocard-zone');
  if(!zone) return;
  const sb=sbReady(); if(!sb) return;
  const { data:{ session } } = await SessionGuard.wait((sb.auth.getSession()),__mvpEpoch); if(!session) return;
  const { data:cards, error } = await SessionGuard.wait((sb.from('photocards').select('id,title,rarity,image')),__mvpEpoch);
  if(error || !cards) return;   // SQL 미설치 시 조용히 스킵
  // 내 꾸미기(deco)는 배부 기록에 서버 저장
  const { data:awards } = await SessionGuard.wait((sb.from('photocard_awards').select('card_id,deco').eq('user_id',session.user.id)),__mvpEpoch);
  window._pcDecoMap = {};
  (awards||[]).forEach(a=>{ window._pcDecoMap[a.card_id]=Array.isArray(a.deco)?a.deco:[]; });
  window._pcMyCards = cards;

  let grid='';
  if(!cards.length){
    grid=`<div style="font-size:12px;color:var(--t3);text-align:center;padding:16px 0;">아직 받은 팡팡포카가 없어요.<br><span style="font-size:10px;">시험을 제출하면 팡팡이가 카드를 물어다 줍니다 🐾</span></div>`;
  }else{
    grid=`<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:12px;">`+cards.map((c,idx)=>{
      const r=PC_RARITY[c.rarity]||PC_RARITY.normal;
      const deco=pcGetDeco(c.id);
      const stickers=deco.map(d=>`<span style="position:absolute;left:${d.x}%;top:${d.y}%;transform:translate(-50%,-50%);font-size:20px;filter:drop-shadow(0 1px 2px rgba(0,0,0,.4));pointer-events:none;">${d.e}</span>`).join('');
      return `<div onclick="pcOpenViewer(${idx})" style="cursor:pointer;">
        <div style="position:relative;aspect-ratio:3/4;border-radius:14px;background:${r.ring};padding:3px;box-shadow:0 4px 14px ${r.glow};">
          <div style="position:relative;width:100%;height:100%;border-radius:11px;overflow:hidden;">
            <img src="${c.image}" style="width:100%;height:100%;object-fit:cover;display:block;">
            ${stickers}
            <div style="position:absolute;top:6px;left:6px;font-size:8px;font-weight:800;color:white;background:rgba(0,0,0,.45);backdrop-filter:blur(2px);padding:2px 7px;border-radius:20px;letter-spacing:.05em;">${Ui.escape(r.label.toUpperCase())}</div>
          </div>
        </div>
        <div style="font-size:11px;font-weight:700;margin-top:6px;text-align:center;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${Ui.escape(c.title)}</div>
      </div>`;
    }).join('')+`</div>`;
  }
  const bg=window._pcBg;
  zone.innerHTML=`<div class="col-section">
    <div class="col-section-title">🐾 팡팡포카 <span style="font-weight:400;color:var(--t3);font-size:10px;">· 시험 제출마다 1장 · 탭하면 크게</span></div>
    ${grid}
    ${bg&&bg.scope?`<button onclick="pcClearBg()" style="width:100%;margin-top:12px;padding:9px;background:var(--surface);color:var(--t2);border:1px solid var(--border);border-radius:8px;font-size:11px;cursor:pointer;font-family:'Noto Sans KR',sans-serif;">🧹 배경 테마 해제 (현재: ${pcScopeLabel(bg.scope)})</button>`:''}
  </div>`;
  applyPhotoBg();
}

// ---------- 확대 뷰어 ----------
function pcOpenViewer(idx){
  const c=(window._pcMyCards||[])[idx]; if(!c) return;
  const r=PC_RARITY[c.rarity]||PC_RARITY.normal;
  window._pcCur={card:c, zoom:1, tx:0, ty:0, deco:false, lastTap:0};
  let ov=document.getElementById('pc-viewer');
  if(!ov){ ov=document.createElement('div'); ov.id='pc-viewer'; document.body.appendChild(ov); }
  ov.style.cssText='position:fixed;inset:0;z-index:9999;background:rgba(10,10,18,.94);display:flex;flex-direction:column;';
  ov.innerHTML=`
    <div style="display:flex;align-items:center;gap:8px;padding:14px 16px;padding-top:calc(14px + env(safe-area-inset-top));color:white;">
      <div style="flex:1;min-width:0;">
        <div style="font-size:15px;font-weight:800;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${Ui.escape(c.title)}</div>
        <div style="font-size:10px;opacity:.65;">${Ui.escape(r.label)} · 더블탭으로 확대</div>
      </div>
      <button onclick="pcCloseViewer()" style="width:38px;height:38px;border-radius:50%;background:rgba(255,255,255,.12);border:none;color:white;font-size:18px;cursor:pointer;">✕</button>
    </div>
    <div id="pc-stage" style="flex:1;overflow:hidden;position:relative;touch-action:none;display:flex;align-items:center;justify-content:center;">
      <div id="pc-frame" style="position:relative;max-width:86vw;max-height:100%;aspect-ratio:3/4;border-radius:18px;background:${r.ring};padding:4px;box-shadow:0 10px 40px ${r.glow};transition:transform .18s;">
        <div style="position:relative;width:100%;height:100%;border-radius:14px;overflow:hidden;">
          <img id="pc-img" src="${c.image}" style="width:100%;height:100%;object-fit:cover;display:block;" draggable="false">
          <div id="pc-stickers" style="position:absolute;inset:0;"></div>
        </div>
      </div>
    </div>
    <div id="pc-palette" style="display:none;padding:8px 14px;overflow-x:auto;white-space:nowrap;"></div>
    <div id="pc-actions" style="display:flex;gap:8px;padding:12px 16px;padding-bottom:calc(12px + env(safe-area-inset-bottom));">
      <button onclick="pcSetBgMenu()" style="flex:1;padding:12px;background:rgba(255,255,255,.14);color:white;border:1px solid rgba(255,255,255,.2);border-radius:10px;font-size:12px;font-weight:700;cursor:pointer;font-family:'Noto Sans KR',sans-serif;">🖼️ 배경으로 설정</button>
      <button id="pc-deco-btn" onclick="pcToggleDeco()" style="flex:1;padding:12px;background:rgba(255,255,255,.14);color:white;border:1px solid rgba(255,255,255,.2);border-radius:10px;font-size:12px;font-weight:700;cursor:pointer;font-family:'Noto Sans KR',sans-serif;">🏅 메달 꾸미기</button>
    </div>`;
  pcRenderStickers();
  pcBindGestures();
}
function pcCloseViewer(){ const ov=document.getElementById('pc-viewer'); if(ov) ov.remove(); if(typeof renderCollection==='function') renderCollection(); }

function pcBindGestures(){
  const stage=document.getElementById('pc-stage');
  const frame=document.getElementById('pc-frame');
  const st=window._pcCur;
  let dragging=false, sx=0, sy=0, ox=0, oy=0;
  function apply(){ frame.style.transform=`translate(${st.tx}px,${st.ty}px) scale(${st.zoom})`; }
  stage.addEventListener('pointerdown',e=>{
    if(st.deco){
      const img=document.getElementById('pc-img');
      const rc=img.getBoundingClientRect();
      if(e.clientX>=rc.left&&e.clientX<=rc.right&&e.clientY>=rc.top&&e.clientY<=rc.bottom&&st.pick){
        const x=Math.round((e.clientX-rc.left)/rc.width*100);
        const y=Math.round((e.clientY-rc.top)/rc.height*100);
        const deco=pcGetDeco(st.card.id);
        const hit=deco.findIndex(d=>Math.abs(d.x-x)<9&&Math.abs(d.y-y)<9);
        if(hit>=0) deco.splice(hit,1); else deco.push({e:st.pick,x,y});
        pcSaveDeco(st.card.id,deco); pcRenderStickers();
      }
      return;
    }
    const now=Date.now();
    if(now-st.lastTap<300){
      if(st.zoom>1){ st.zoom=1; st.tx=0; st.ty=0; }
      else { st.zoom=2.2; }
      apply(); st.lastTap=0; return;
    }
    st.lastTap=now;
    if(st.zoom>1){ dragging=true; sx=e.clientX; sy=e.clientY; ox=st.tx; oy=st.ty; }
  });
  stage.addEventListener('pointermove',e=>{
    if(!dragging) return;
    st.tx=ox+(e.clientX-sx); st.ty=oy+(e.clientY-sy); apply();
  });
  stage.addEventListener('pointerup',()=>{ dragging=false; });
  stage.addEventListener('pointercancel',()=>{ dragging=false; });
}

// ---------- 메달 꾸미기 (서버 저장: photocard_awards.deco) ----------
function pcGetDeco(cardId){
  const m=window._pcDecoMap||{};
  return Array.isArray(m[cardId]) ? m[cardId] : (m[cardId]=[]);
}
function pcSaveDeco(cardId,arr){
  window._pcDecoMap=window._pcDecoMap||{};
  window._pcDecoMap[cardId]=arr;
  clearTimeout(window._pcDecoT);
  window._pcDecoT=setTimeout(async ()=>{
const __mvpEpoch=SessionGuard.capture();

    try{
      const sb=sbReady(); if(!sb) return;
      const { data:{ session } } = await SessionGuard.wait((sb.auth.getSession()),__mvpEpoch); if(!session) return;
      await SessionGuard.wait((sb.from('photocard_awards').update({deco:arr}).eq('card_id',cardId).eq('user_id',session.user.id)),__mvpEpoch);
    }catch(e){SessionGuard.assert(__mvpEpoch);}
  }, 500);
}
function pcRenderStickers(){
  const st=window._pcCur; if(!st) return;
  const lay=document.getElementById('pc-stickers'); if(!lay) return;
  lay.innerHTML=pcGetDeco(st.card.id).map(d=>`<span style="position:absolute;left:${d.x}%;top:${d.y}%;transform:translate(-50%,-50%);font-size:30px;filter:drop-shadow(0 2px 3px rgba(0,0,0,.45));pointer-events:none;">${d.e}</span>`).join('');
}
function pcToggleDeco(){
  const st=window._pcCur; st.deco=!st.deco;
  st.zoom=1; st.tx=0; st.ty=0;
  document.getElementById('pc-frame').style.transform='';
  const pal=document.getElementById('pc-palette');
  const btn=document.getElementById('pc-deco-btn');
  if(st.deco){
    const col=window._myCol||{};
    const owned=Object.keys(PC_MEDAL_EMOJI).filter(k=>(col[k]||0)>0);
    if(!owned.length){ alert('아직 획득한 메달이 없어요. 테스트에서 메달을 모아보세요!'); st.deco=false; return; }
    st.pick=PC_MEDAL_EMOJI[owned[0]];
    pal.style.display='block';
    pal.innerHTML=owned.map(k=>`<button onclick="window._pcCur.pick='${PC_MEDAL_EMOJI[k]}';this.parentNode.querySelectorAll('button').forEach(b=>b.style.background='rgba(255,255,255,.1)');this.style.background='rgba(255,255,255,.35)';" style="display:inline-flex;flex-direction:column;align-items:center;gap:2px;margin-right:8px;padding:8px 12px;background:${st.pick===PC_MEDAL_EMOJI[k]?'rgba(255,255,255,.35)':'rgba(255,255,255,.1)'};border:1px solid rgba(255,255,255,.2);border-radius:10px;color:white;font-size:20px;cursor:pointer;">${PC_MEDAL_EMOJI[k]}<span style="font-size:8px;">×${col[k]||0}</span></button>`).join('')
      + `<span style="font-size:10px;color:rgba(255,255,255,.6);margin-left:4px;">카드를 탭해서 붙이기 · 스티커 탭하면 제거</span>`;
    btn.style.background='rgba(245,158,11,.55)'; btn.textContent='✅ 꾸미기 완료';
  }else{
    pal.style.display='none';
    btn.style.background='rgba(255,255,255,.14)'; btn.textContent='🏅 메달 꾸미기';
    showToast('꾸미기 저장 완료 ☁️');
  }
}

// ---------- 배경 테마 (서버 저장: pc_prefs) ----------
function pcScopeLabel(s){ return s==='all'?'앱 전체':(s==='dday'?'D-day 카드':(s==='colhero'?'컬렉션 카드':s)); }

function pcSetBgMenu(){
  const st=window._pcCur; if(!st) return;
  const act=document.getElementById('pc-actions');
  act.innerHTML=`
    <button onclick="pcSetBg('all')" style="flex:1;padding:12px 6px;background:rgba(255,255,255,.2);color:white;border:1px solid rgba(255,255,255,.25);border-radius:10px;font-size:11px;font-weight:700;cursor:pointer;font-family:'Noto Sans KR',sans-serif;">🌌 앱 전체</button>
    <button onclick="pcSetBg('dday')" style="flex:1;padding:12px 6px;background:rgba(255,255,255,.2);color:white;border:1px solid rgba(255,255,255,.25);border-radius:10px;font-size:11px;font-weight:700;cursor:pointer;font-family:'Noto Sans KR',sans-serif;">📆 D-day 카드</button>
    <button onclick="pcSetBg('colhero')" style="flex:1;padding:12px 6px;background:rgba(255,255,255,.2);color:white;border:1px solid rgba(255,255,255,.25);border-radius:10px;font-size:11px;font-weight:700;cursor:pointer;font-family:'Noto Sans KR',sans-serif;">🏅 컬렉션 카드</button>
    <button onclick="pcCloseViewer();" style="padding:12px;background:transparent;color:rgba(255,255,255,.6);border:none;font-size:11px;cursor:pointer;font-family:'Noto Sans KR',sans-serif;">취소</button>`;
}

async function pcSetBg(scope){
const __mvpEpoch=SessionGuard.capture();

  const st=window._pcCur; if(!st) return;
  const prevPos = (window._pcBg && window._pcBg.cardId===st.card.id && window._pcBg.pos) ? window._pcBg.pos : {x:50,y:50};
  window._pcBg={scope, dataUrl:st.card.image, cardId:st.card.id, pos:{x:prevPos.x, y:prevPos.y}};
  try{ localStorage.setItem(photoLocalKey(), JSON.stringify(window._pcBg)); }catch(e){SessionGuard.assert(__mvpEpoch);}
  applyPhotoBg();
  pcOpenPosAdjust(scope);   // 위치 조정 단계
}

async function pcPersistBg(){
const __mvpEpoch=SessionGuard.capture();

  const bg=window._pcBg; if(!bg) return;
  try{
    const sb=sbReady();
    const { data:{ session } } = await SessionGuard.wait((sb.auth.getSession()),__mvpEpoch);
    if(session) await SessionGuard.wait((sb.from('pc_prefs').upsert({user_id:session.user.id, bg_card_id:bg.cardId, bg_scope:bg.scope, bg_pos:bg.pos}, {onConflict:'user_id'})),__mvpEpoch);
  }catch(e){SessionGuard.assert(__mvpEpoch);}
}

// 배경 위치 조정 오버레이 (사진 드래그로 focal point 지정)
function pcOpenPosAdjust(scope){
  const bg=window._pcBg; if(!bg) return;
  let ov=document.getElementById('pc-posadj');
  if(!ov){ ov=document.createElement('div'); ov.id='pc-posadj'; document.body.appendChild(ov); }
  ov.style.cssText='position:fixed;inset:0;z-index:10001;background:rgba(10,10,18,.96);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;padding:20px;padding-top:calc(20px + env(safe-area-inset-top));padding-bottom:calc(20px + env(safe-area-inset-bottom));box-sizing:border-box;';
  const wide = (scope!=='all');
  const previewStyle = wide ? 'width:min(88vw,420px);aspect-ratio:16/9;' : 'width:min(64vw,290px);flex:1;max-height:58vh;';
  const veil = scope==='all' ? 'linear-gradient(rgba(248,249,251,.86),rgba(248,249,251,.92))'
             : (scope==='dday' ? 'linear-gradient(rgba(20,20,40,.42),rgba(20,20,40,.58))'
             : 'linear-gradient(rgba(30,27,75,.5),rgba(30,27,75,.66))');
  const ghost = scope==='all'?'앱 화면':(scope==='dday'?'D-49':'원장');
  const gcol = scope==='all'?'#1e1b4b':'white';
  ov.innerHTML=`
    <div style="color:white;font-size:14px;font-weight:800;">🖼️ 위치 조정 · ${pcScopeLabel(scope)}</div>
    <div style="color:rgba(255,255,255,.6);font-size:11px;margin-top:-6px;">사진을 드래그해서 보일 부분을 맞추세요</div>
    <div id="pc-pos-preview" style="${previewStyle}position:relative;border-radius:16px;overflow:hidden;box-shadow:0 8px 30px rgba(0,0,0,.5);touch-action:none;cursor:grab;background-image:url(${bg.dataUrl});background-size:cover;background-position:${bg.pos.x}% ${bg.pos.y}%;">
      <div style="position:absolute;inset:0;background:${veil};"></div>
      <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:${gcol};font-size:13px;font-weight:800;pointer-events:none;opacity:.45;">${ghost}</div>
    </div>
    <div style="display:flex;gap:8px;width:min(88vw,420px);">
      <button onclick="pcResetPos()" style="padding:12px 14px;background:rgba(255,255,255,.14);color:white;border:1px solid rgba(255,255,255,.2);border-radius:10px;font-size:12px;font-weight:700;cursor:pointer;font-family:'Noto Sans KR',sans-serif;">가운데</button>
      <button onclick="pcSavePos()" style="flex:1;padding:12px;background:white;color:#1e1b4b;border:none;border-radius:10px;font-size:13px;font-weight:800;cursor:pointer;font-family:'Noto Sans KR',sans-serif;">이 위치로 저장</button>
    </div>`;
  pcBindPosDrag();
}
function pcBindPosDrag(){
  const pv=document.getElementById('pc-pos-preview'); if(!pv) return;
  const bg=window._pcBg;
  let drag=false, sx=0, sy=0, px=50, py=50;
  const clamp=v=>Math.max(0,Math.min(100,v));
  pv.addEventListener('pointerdown',e=>{ drag=true; sx=e.clientX; sy=e.clientY; px=bg.pos.x; py=bg.pos.y; pv.style.cursor='grabbing'; try{pv.setPointerCapture(e.pointerId);}catch(_){} });
  pv.addEventListener('pointermove',e=>{
    if(!drag) return;
    const w=pv.clientWidth, h=pv.clientHeight;
    bg.pos.x=clamp(px - (e.clientX-sx)/w*100);
    bg.pos.y=clamp(py - (e.clientY-sy)/h*100);
    pv.style.backgroundPosition=`${bg.pos.x}% ${bg.pos.y}%`;
  });
  pv.addEventListener('pointerup',()=>{ drag=false; pv.style.cursor='grab'; });
  pv.addEventListener('pointercancel',()=>{ drag=false; });
}
function pcResetPos(){ const bg=window._pcBg; if(!bg) return; bg.pos={x:50,y:50}; const pv=document.getElementById('pc-pos-preview'); if(pv) pv.style.backgroundPosition='50% 50%'; }
async function pcSavePos(){
const __mvpEpoch=SessionGuard.capture();

  try{ localStorage.setItem(photoLocalKey(), JSON.stringify(window._pcBg)); }catch(e){SessionGuard.assert(__mvpEpoch);}
  await SessionGuard.wait((pcPersistBg()),__mvpEpoch);
  const ov=document.getElementById('pc-posadj'); if(ov) ov.remove();
  applyPhotoBg();
  showToast('🖼️ 배경 위치 저장 완료 ☁️');
  pcCloseViewer();
}

async function pcClearBg(){
const __mvpEpoch=SessionGuard.capture();

  window._pcBg=null;
  try{ localStorage.removeItem(photoLocalKey()); }catch(e){SessionGuard.assert(__mvpEpoch);}
  applyPhotoBg();
  showToast('배경 테마 해제');
  try{
    const sb=sbReady();
    const { data:{ session } } = await SessionGuard.wait((sb.auth.getSession()),__mvpEpoch);
    if(session) await SessionGuard.wait((sb.from('pc_prefs').upsert({user_id:session.user.id, bg_card_id:null, bg_scope:null, bg_pos:null}, {onConflict:'user_id'})),__mvpEpoch);
  }catch(e){SessionGuard.assert(__mvpEpoch);}
  if(typeof wRenderMyCards==='function') wRenderMyCards();
}

function applyPhotoBg(page){
  if(page) window._pcLastPage=page;
  const bg=window._pcBg;
  const pos = (bg && bg.pos && typeof bg.pos.x==='number') ? `${bg.pos.x}% ${bg.pos.y}%` : 'center';
  // 전체 배경 레이어
  let el=document.getElementById('pc-appbg');
  const showAll = bg && bg.scope==='all';
  if(showAll){
    if(!el){
      el=document.createElement('div'); el.id='pc-appbg';
      el.style.cssText='position:fixed;inset:0;z-index:-1;background-size:cover;transition:opacity .4s;pointer-events:none;';
      const veil=document.createElement('div');
      veil.style.cssText='position:absolute;inset:0;background:linear-gradient(rgba(248,249,251,.86),rgba(248,249,251,.92));backdrop-filter:blur(2px);';
      el.appendChild(veil);
      document.body.prepend(el);
    }
    el.style.backgroundImage=`url(${bg.dataUrl})`;
    el.style.backgroundPosition=pos;
    el.style.opacity='1';
  } else if(el){ el.style.opacity='0'; }
  // D-day 히어로 카드
  document.querySelectorAll('.dday-hero').forEach(h=>{
    if(bg && bg.scope==='dday'){
      h.style.background=`linear-gradient(rgba(20,20,40,.42),rgba(20,20,40,.58)), url(${bg.dataUrl}) ${pos}/cover`;
      h.style.textShadow='0 1px 4px rgba(0,0,0,.5)';
    }
  });
  // 컬렉션 히어로 카드
  document.querySelectorAll('.col-hero').forEach(h=>{
    if(bg && bg.scope==='colhero'){
      h.style.background=`linear-gradient(rgba(30,27,75,.5),rgba(30,27,75,.66)), url(${bg.dataUrl}) ${pos}/cover`;
    }
  });
}

// ---------- 시험 제출 시 자동 지급 (뽑기 연출) ----------
async function pcClaimAndReveal(testId){
const __mvpEpoch=SessionGuard.capture();

  try{
    const sb=sbReady(); if(!sb) return;
    const { data:card, error } = await SessionGuard.wait((sb.rpc('claim_photocard', { p_test_id: testId })),__mvpEpoch);
    if(error || !card || !card.id) return;   // SQL 미설치·이미 수령·풀 소진 → 조용히 통과
    const r=PC_RARITY[card.rarity]||PC_RARITY.normal;
    await SessionGuard.wait((new Promise(res=>{
      const ov=document.createElement('div');
      ov.id='pc-reveal';
      ov.style.cssText='position:fixed;inset:0;z-index:10000;background:rgba(10,10,18,.94);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;';
      ov.innerHTML=`
        <div style="color:white;font-size:14px;font-weight:800;letter-spacing:.04em;">🐾 팡팡이가 카드를 물어왔어요!</div>
        <div style="width:min(62vw,240px);aspect-ratio:3/4;border-radius:18px;background:${r.ring};padding:4px;box-shadow:0 10px 44px ${r.glow};animation:coinIn .55s ease;">
          <img src="${card.image}" style="width:100%;height:100%;object-fit:cover;border-radius:14px;display:block;">
        </div>
        <div style="color:white;font-size:16px;font-weight:900;">${Ui.escape(card.title)}</div>
        <div style="color:rgba(255,255,255,.7);font-size:11px;">${Ui.escape(r.label)} 등급 · 컬렉션 탭 🐾 팡팡포카에 저장됨</div>
        <button id="pc-reveal-ok" style="margin-top:6px;padding:12px 36px;background:white;color:#1e1b4b;border:none;border-radius:24px;font-size:14px;font-weight:800;cursor:pointer;font-family:'Noto Sans KR',sans-serif;">받기 🎉</button>`;
      document.body.appendChild(ov);
      document.getElementById('pc-reveal-ok').onclick=()=>{ ov.remove(); res(); };
    })),__mvpEpoch);
  }catch(e){SessionGuard.assert(__mvpEpoch);}
}

// ---------- 자동로그인 부트 + 배경 복원 ----------
async function pcBoot(){
const __mvpEpoch=SessionGuard.capture();

  if(!window.AppSession?.context())return;
  // Account-scoped local background only after verified context.
  try{ window._pcBg=JSON.parse(localStorage.getItem(photoLocalKey())||'null'); }catch(e){SessionGuard.assert(__mvpEpoch);}
  applyPhotoBg();
  // 2) 세션 복원 → 앱 전역 로그인 상태
  try{
    const sb=sbReady(); if(!sb) return;
    const { data:{ session } } = await SessionGuard.wait((sb.auth.getSession()),__mvpEpoch);
    if(!session) return;
    if(_wuser?.id!==session.user.id)return;
    // 3) 서버 배경 설정 동기화
    const { data:pref } = await SessionGuard.wait((sb.from('pc_prefs').select('bg_card_id,bg_scope,bg_pos').eq('user_id',session.user.id).maybeSingle()),__mvpEpoch);
    if(pref && pref.bg_card_id && pref.bg_scope){
      const { data:card } = await SessionGuard.wait((sb.from('photocards').select('id,image').eq('id',pref.bg_card_id).maybeSingle()),__mvpEpoch);
      if(card){
        window._pcBg={scope:pref.bg_scope, dataUrl:card.image, cardId:card.id, pos: pref.bg_pos || {x:50,y:50}};
        try{ localStorage.setItem(photoLocalKey(), JSON.stringify(window._pcBg)); }catch(e){SessionGuard.assert(__mvpEpoch);}
      }
    } else if(pref && !pref.bg_scope){
      window._pcBg=null;
      try{ localStorage.removeItem(photoLocalKey()); }catch(e){SessionGuard.assert(__mvpEpoch);}
    }
    applyPhotoBg();
    // D-day 탭이 이미 그려져 있으면 다시 그려 배경 반영
    if(document.querySelector('.dday-hero')) renderDday();
  }catch(e){SessionGuard.assert(__mvpEpoch);}
}

// 페이지 전환 후 배경 재적용 훅 (기존 함수 안 건드림)
(function(){
  if(typeof showPage==='function'){ const _sp=showPage; window.showPage=function(n){ _sp(n); try{applyPhotoBg(n);}catch(e){} }; }
  if(typeof showCat==='function'){ const _sc=showCat; window.showCat=function(c){ _sc(c); try{applyPhotoBg(c);}catch(e){} }; }
  if(typeof renderDday==='function'){
    const _rd=renderDday;
    window.renderDday=async function(){
const __mvpEpoch=SessionGuard.capture();
 await SessionGuard.wait((_rd.apply(this,arguments)),__mvpEpoch); try{applyPhotoBg('dday');}catch(e){SessionGuard.assert(__mvpEpoch);} };
  }
  // Session bootstrap runs once in app-session.js after profile resolution.
})();


// ================================================================
// 📊 오답 통계 ── v52+
//  · 선생님/원장: 시험별 문항 오답률 + 반별 필터 + 개인별 오답 (test_wrong_matrix)
//  · 학생 리포트: 내 오답 분석 · 자주 틀리는 번호 · 핵심문항 취약 (my_wrong_history)
//  ※ 서버: 오답통계_supabase.sql
// ================================================================

function _wsKeyStyle(qno){
  const kt = (typeof mockKeyTag==='function') ? mockKeyTag(qno) : null;
  return kt; // {tier,label,color,bg,bd} or null
}

function wWrongIdxs(test, answers){
  const key=test.answers||[];
  const types=test.types||[];
  const total=Number(test.total)||key.length||0;
  const ans=Array.isArray(answers)?answers:[];
  const wrong=[];
  for(let i=0;i<total;i++){
    const ok = typeof mockIsCorrect==='function'
      ? mockIsCorrect(types[i], key[i], ans[i])
      : (String(ans[i]==null?'':ans[i]).trim()!=='' && String(key[i]==null?'':key[i]).trim()===String(ans[i]==null?'':ans[i]).trim());
    if(!ok) wrong.push(i);
  }
  return wrong;
}
async function wLoadWrongMatrixLocal(testId){
const __mvpEpoch=SessionGuard.capture();

  const sb=sbReady();
  const { data:test, error:te } = await SessionGuard.wait((readStaffTest(testId)),__mvpEpoch);
  if(te || !test) return { error: te||{message:'테스트를 찾을 수 없습니다.'} };
  const { data:subs, error:se } = await SessionGuard.wait((sb.from('submissions').select('user_id,score,answers').eq('test_id',testId)),__mvpEpoch);
  if(se) return { error: se };
  const { data:profs } = await SessionGuard.wait((sb.from('profiles').select('id,name,student_no,class_id')),__mvpEpoch);
  const { data:classes } = await SessionGuard.wait((sb.from('classes').select('id,name')),__mvpEpoch);
  const pmap={}; (profs||[]).forEach(p=>pmap[p.id]=p);
  const cmap={}; (classes||[]).forEach(c=>cmap[c.id]=c.name);
  return {
    total:test.total||0,
    data:(subs||[]).map(s=>{
      const p=pmap[s.user_id]||{};
      return {
        user_id:s.user_id,
        name:p.name||'(이름없음)',
        student_no:p.student_no||'',
        class_name:cmap[p.class_id]||'미배정',
        score:s.score,
        wrong_idxs:wWrongIdxs(test, s.answers)
      };
    })
  };
}

// ---------- (선생님/원장) 시험별 오답 통계 ----------
async function wWrongStats(testId, title){
const __mvpEpoch=SessionGuard.capture();

  const sb=sbReady();
  const d=document.getElementById('w-teacher-detail') || document.getElementById('wtest-content');
  d.innerHTML = `<div class="stg-card"><div style="text-align:center;color:var(--t3);font-size:12px;padding:20px;">오답 통계 불러오는 중...</div></div>`;
  let total=0, matrix=null, error=null;
  const rpc=await SessionGuard.wait((sb.rpc('test_wrong_matrix', { p_test_id: testId })),__mvpEpoch);
  if(!rpc.error && Array.isArray(rpc.data)){
    matrix=rpc.data;
    const { data:test } = await SessionGuard.wait((sb.from('tests').select('total').eq('id',testId).single()),__mvpEpoch);
    total=(test&&test.total)||0;
  } else {
    const local=await SessionGuard.wait((wLoadWrongMatrixLocal(testId)),__mvpEpoch);
    if(local.error){
      error=rpc.error||local.error;
    } else {
      matrix=local.data;
      total=local.total||0;
    }
  }
  if(error || !matrix){
    d.innerHTML=`<div class="stg-card"><div style="font-size:12px;color:var(--red);text-align:center;padding:16px;">${escHtml((error&&error.message)||'통계를 불러올 수 없습니다.')}<br><span style="font-size:10px;color:var(--t3);">등수 화면의 제출 기록을 읽지 못했습니다.</span></div></div>`;
    return;
  }
  window._wrongMatrix = { testId, title, total, rows:matrix };
  wRenderWrongStats('all');
}

function wRenderWrongStats(classFilter){
  const M=window._wrongMatrix; if(!M) return;
  const d=document.getElementById('w-teacher-detail') || document.getElementById('wtest-content');
  const { total, title, rows } = M;

  // 반 목록
  const classes = [...new Set(rows.map(r=>r.class_name||'미배정'))].sort();
  const sel = classFilter||'all';
  const view = (sel==='all') ? rows : rows.filter(r=>(r.class_name||'미배정')===sel);
  const N = view.length;

  // 문항별 오답 수
  const wrongCnt = new Array(total).fill(0);
  view.forEach(r=>(r.wrong_idxs||[]).forEach(i=>{ if(i<total) wrongCnt[i]++; }));
  const avgWrong = N ? (view.reduce((a,r)=>a+((r.wrong_idxs||[]).length),0)/N) : 0;

  // 어려웠던 문항 TOP (오답률 순)
  const ranked = wrongCnt.map((c,i)=>({qno:i+1, c, rate:N?Math.round(c/N*100):0}))
                         .filter(x=>x.c>0).sort((a,b)=>b.c-a.c);
  const top = ranked.slice(0,6);

  const clsOpts = `<option value="all">전체 (${rows.length}명)</option>` +
    classes.map(cn=>`<option value="${cn}" ${sel===cn?'selected':''}>${cn} (${rows.filter(r=>(r.class_name||'미배정')===cn).length}명)</option>`).join('');

  // 문항별 막대
  const maxC = Math.max(1, ...wrongCnt);
  let bars='';
  for(let i=0;i<total;i++){
    const c=wrongCnt[i], rate=N?Math.round(c/N*100):0;
    const kt=_wsKeyStyle(i+1);
    const barColor = kt ? kt.color : (rate>=60?'#dc2626':rate>=35?'#f59e0b':'var(--accent)');
    bars += `<div style="display:flex;align-items:center;gap:6px;margin-bottom:3px;">
      <div style="width:34px;font-size:10px;font-weight:700;color:${kt?kt.color:'var(--t2)'};text-align:right;">${i+1}${kt?'⭐':''}</div>
      <div style="flex:1;background:var(--surface);border-radius:5px;height:15px;overflow:hidden;">
        <div style="width:${Math.round(c/maxC*100)}%;height:100%;background:${barColor};border-radius:5px;"></div>
      </div>
      <div style="width:52px;font-size:9px;color:var(--t3);text-align:right;">${c}명·${rate}%</div>
    </div>`;
  }

  // 개인별 오답 (반별 그룹)
  let people='';
  const groups={};
  view.forEach(r=>{ const k=r.class_name||'미배정'; (groups[k]=groups[k]||[]).push(r); });
  Object.keys(groups).sort().forEach(cn=>{
    people+=`<div style="font-size:11px;font-weight:800;color:var(--accent);margin:12px 0 6px;">🏫 ${cn}</div>`;
    groups[cn].forEach(r=>{
      const wl=(r.wrong_idxs||[]).map(i=>i+1);
      const chips = wl.length ? wl.map(q=>{ const kt=_wsKeyStyle(q);
        return `<span style="font-size:9px;padding:1px 6px;border-radius:10px;background:${kt?kt.bg:'var(--red-light)'};color:${kt?kt.color:'var(--red)'};font-weight:${kt?800:400};">${q}${kt?'⭐':''}</span>`;
      }).join('') : `<span style="font-size:9px;color:var(--a3);font-weight:700;">🎉 만점</span>`;
      people+=`<div style="padding:8px 0;border-bottom:1px solid var(--border);">
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
          <span style="font-size:12px;font-weight:700;">${Ui.escape(r.name||'(이름없음)')}</span>
          <span style="font-size:9px;color:var(--t3);">${Ui.escape(r.student_no||'')}</span>
          <span style="margin-left:auto;font-size:10px;color:var(--t3);">${r.score!=null?r.score+'점':''} · 오답 ${wl.length}개</span>
        </div>
        <div style="display:flex;gap:3px;flex-wrap:wrap;">${chips}</div>
      </div>`;
    });
  });

  d.innerHTML = `
  <div class="stg-card">
    <div class="stg-hdr"><div class="stg-icon">📊</div><div class="stg-title">${Ui.escape(title)} · 오답 통계</div><div class="stg-sub">${N}명 · 평균 오답 ${avgWrong.toFixed(1)}개</div></div>
    <select onchange="wRenderWrongStats(this.value)" class="target-select" style="width:100%;margin-bottom:10px;">${clsOpts}</select>
    ${top.length?`<div style="margin-bottom:10px;padding:10px;background:var(--red-light);border:1px solid #fecaca;border-radius:10px;">
      <div style="font-size:11px;font-weight:800;color:var(--red);margin-bottom:6px;">🔥 가장 많이 틀린 문항</div>
      <div style="display:flex;gap:4px;flex-wrap:wrap;">${top.map(t=>{const kt=_wsKeyStyle(t.qno);return `<span style="font-size:11px;padding:3px 9px;border-radius:12px;background:${kt?kt.bg:'white'};color:${kt?kt.color:'var(--red)'};border:1px solid ${kt?kt.bd:'#fecaca'};font-weight:700;">${t.qno}번 ${t.rate}%</span>`;}).join('')}</div>
    </div>`:''}
  </div>
  <div class="stg-card">
    <div class="stg-hdr"><div class="stg-icon">📉</div><div class="stg-title">문항별 오답률</div><div class="stg-sub">⭐ 등급 핵심문항</div></div>
    ${bars}
  </div>
  <div class="stg-card">
    <div class="stg-hdr"><div class="stg-icon">🧑‍🎓</div><div class="stg-title">개인별 오답</div><div class="stg-sub">⭐ 핵심문항 오답 강조</div></div>
    ${people||'<div style="font-size:12px;color:var(--t3);text-align:center;padding:12px;">응시 기록이 없습니다.</div>'}
  </div>
  <button onclick="wViewRank(${M.testId},${Ui.argument(title)})" style="width:100%;margin-top:2px;padding:11px;background:var(--surface);color:var(--t2);border:1px solid var(--border);border-radius:8px;font-size:12px;cursor:pointer;font-family:'Noto Sans KR',sans-serif;">← 등수 화면으로</button>`;
}

// ---------- (학생) 리포트 내 오답 분석 ----------
async function renderMyWrongAnalysis(){
const __mvpEpoch=SessionGuard.capture();

  const box=document.getElementById('wrong-analysis-zone');
  if(!box) return;
  const sb=sbReady(); if(!sb) return;
  const { data:hist, error } = await SessionGuard.wait((sb.rpc('my_wrong_history')),__mvpEpoch);
  if(error || !hist || !hist.length) return;  // SQL 미설치·오답없음 → 조용히 스킵

  // 실전모의고사(30문항)만 번호 빈도 분석 대상
  const mocks = hist.filter(h=>Number(h.total)===30);
  const totalWrong = hist.reduce((a,h)=>a+((h.wrong_idxs||[]).length),0);

  // 번호별 오답 빈도 (몇 회차에서 틀렸나)
  const freq={};
  mocks.forEach(h=>(h.wrong_idxs||[]).forEach(i=>{ const q=i+1; freq[q]=(freq[q]||0)+1; }));
  const freqRanked=Object.keys(freq).map(q=>({q:+q, n:freq[q]})).sort((a,b)=>b.n-a.n||a.q-b.q);
  const topFreq=freqRanked.slice(0,8);

  // 핵심문항 취약 진단
  const g1=(typeof MOCK_KEY_Q!=='undefined')?MOCK_KEY_Q.g1:[15,21,22,28,30];
  const g2=(typeof MOCK_KEY_Q!=='undefined')?MOCK_KEY_Q.g2:[13,14,20,29];
  const weakG1=g1.filter(q=>freq[q]).sort((a,b)=>freq[b]-freq[a]);
  const weakG2=g2.filter(q=>freq[q]).sort((a,b)=>freq[b]-freq[a]);

  let hero=`<div class="stg-card">
    <div class="stg-hdr"><div class="stg-icon">🎯</div><div class="stg-title">내 오답 분석</div><div class="stg-sub">실전모의고사 ${mocks.length}회 기준</div></div>`;
  if(mocks.length){
    hero+=`<div style="font-size:12px;color:var(--t2);line-height:1.7;margin-bottom:10px;">지금까지 실전모의고사에서 <b style="color:var(--red);">가장 자주 틀린 번호</b>예요. 이 번호대를 집중 복습하면 점수가 빨리 올라요.</div>
    <div style="display:flex;gap:4px;flex-wrap:wrap;">${topFreq.map(f=>{const kt=_wsKeyStyle(f.q);return `<span style="font-size:12px;padding:4px 10px;border-radius:14px;background:${kt?kt.bg:'var(--red-light)'};color:${kt?kt.color:'var(--red)'};border:1px solid ${kt?kt.bd:'#fecaca'};font-weight:800;">${f.q}번<span style="opacity:.6;font-weight:400;"> ×${f.n}</span></span>`;}).join('')||'<span style="font-size:11px;color:var(--a3);font-weight:700;">🎉 아직 틀린 문항이 없어요!</span>'}</div>`;

    // 핵심문항 코칭
    if(weakG1.length||weakG2.length){
      hero+=`<div style="margin-top:12px;padding:10px;background:var(--accent-light);border:1px solid var(--accent-mid);border-radius:10px;">
        <div style="font-size:11px;font-weight:800;color:var(--accent);margin-bottom:6px;">🧭 등급 도약 코칭</div>`;
      if(weakG1.length) hero+=`<div style="font-size:11px;color:#1d4ed8;line-height:1.6;"><b>1등급 핵심</b> 중 자주 틀림: <b>${weakG1.join(', ')}번</b></div>`;
      if(weakG2.length) hero+=`<div style="font-size:11px;color:#065f46;line-height:1.6;margin-top:3px;"><b>2등급 핵심</b> 중 자주 틀림: <b>${weakG2.join(', ')}번</b></div>`;
      hero+=`</div>`;
    }
  } else {
    hero+=`<div style="font-size:12px;color:var(--t3);text-align:center;padding:8px 0;">실전모의고사(30문항)를 응시하면 번호별 취약점 분석이 나타나요.</div>`;
  }
  hero+=`</div>`;

  // 회차별 오답 (전체)
  let per=`<div class="stg-card">
    <div class="stg-hdr"><div class="stg-icon">📋</div><div class="stg-title">회차별 틀린 문항</div><div class="stg-sub">총 오답 ${totalWrong}개</div></div>`;
  hist.slice().reverse().forEach(h=>{
    const wl=(h.wrong_idxs||[]).map(i=>i+1);
    const chips = wl.length ? wl.map(q=>{ const kt=(Number(h.total)===30)?_wsKeyStyle(q):null;
      return `<span style="font-size:9px;padding:1px 7px;border-radius:10px;background:${kt?kt.bg:'var(--red-light)'};color:${kt?kt.color:'var(--red)'};font-weight:${kt?800:400};">${q}${kt?'⭐':''}</span>`;
    }).join('') : `<span style="font-size:9px;color:var(--a3);font-weight:700;">🎉 만점</span>`;
    per+=`<div style="padding:9px 0;border-bottom:1px solid var(--border);">
      <div style="display:flex;align-items:center;gap:6px;margin-bottom:5px;">
        <span style="font-size:12px;font-weight:700;">${Ui.escape(h.title||'테스트')}</span>
        <span style="margin-left:auto;font-size:9px;color:var(--t3);">${h.exam_date||''} · 오답 ${wl.length}개</span>
      </div>
      <div style="display:flex;gap:3px;flex-wrap:wrap;">${chips}</div>
    </div>`;
  });
  per+=`</div>`;

  box.innerHTML = hero + per;
}


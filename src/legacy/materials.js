function vwEsc(s){
  return String(s==null?'':s).replace(/[&<>"']/g,function(c){
    return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
  });
}
function vwMB(b){ return b? (b/1048576).toFixed(1)+'MB' : ''; }
function vwBox(msg,sub){
  return '<div class="stg-card"><div style="font-size:12px;color:var(--t2);text-align:center;padding:22px;line-height:1.8;">'+msg+
    (sub?'<br><span style="font-size:11px;color:var(--t3);">'+sub+'</span>':'')+'</div></div>';
}
function vwIsStaff(){ return !!(_wprofile && (_wprofile.role==='teacher' || _wprofile.role==='director')); }
function vwIsDirector(){ return !!(_wprofile && _wprofile.role==='director'); }

// One mutation at a time; a previous account's completion cannot unlock a new one.
let _vwMutationOwner=null;
function vwMutationBegin(){
  if(_vwBusy) return null;
  const token={epoch:SessionGuard.capture()};
  _vwBusy=true; _vwMutationOwner=token;
  return token;
}
function vwMutationCurrent(token){
  try{ SessionGuard.assert(token.epoch); return _vwMutationOwner===token; }
  catch(e){ return false; }
}
function vwMutationEnd(token){
  if(vwMutationCurrent(token)){ _vwBusy=false; _vwMutationOwner=null; }
}
function vwDeletedRow(result,id){
  return result && !result.error && Array.isArray(result.data) && result.data.length===1 && result.data[0].id===id;
}

function vwCacheGet(path){
  const i=_vwCache.findIndex(function(x){return x.path===path;});
  if(i<0) return null;
  const hit=_vwCache.splice(i,1)[0];
  _vwCache.push(hit);
  return hit.url;
}
function vwCachePut(path,url){
  _vwCache.push({path:path,url:url});
  while(_vwCache.length>VW_CACHE_MAX){
    const old=_vwCache.shift();
    try{ URL.revokeObjectURL(old.url); }catch(e){}
  }
}
function vwCacheClear(){
  _vwCache.forEach(function(x){ try{ URL.revokeObjectURL(x.url); }catch(e){} });
  _vwCache=[];
}
function vwCacheDrop(path){
  const i=_vwCache.findIndex(function(x){return x.path===path;});
  if(i>=0){ try{ URL.revokeObjectURL(_vwCache[i].url); }catch(e){} _vwCache.splice(i,1); }
}

// ───────── 데이터 로드 ─────────
async function vwLoad(sb){
const __mvpEpoch=SessionGuard.capture();

  const g  = await SessionGuard.wait((sb.from('viewer_groups').select('*').order('sort_order',{ascending:true}).order('id',{ascending:true})),__mvpEpoch);
  const m  = await SessionGuard.wait((sb.from('viewer_materials').select('*').order('sort_order',{ascending:true}).order('id',{ascending:true})),__mvpEpoch);
  const c  = await SessionGuard.wait((sb.from('classes').select('*').order('name',{ascending:true})),__mvpEpoch);
  const gc = await SessionGuard.wait((sb.from('viewer_group_classes').select('*')),__mvpEpoch);
  if(g.error) throw g.error;
  if(m.error) throw m.error;
  _vw={groups:g.data||[], mats:m.data||[], classes:c.data||[], gc:gc.data||[]};
  return _vw;
}

// 그룹 안의 자료를 row_key 로 묶어 줄 배열로
function vwRows(gid){
  const list=_vw.mats.filter(function(m){return m.group_id===gid;});
  const order=[], byKey={};
  list.forEach(function(m){
    const k=m.row_key||m.title||'';
    if(!byKey[k]){ byKey[k]={key:k, sort:m.sort_order, bytes:0, items:[]}; order.push(k); }
    const r=byKey[k];
    r.items.push(m);
    if((m.bytes||0)>r.bytes) r.bytes=m.bytes||0;
    if(m.sort_order<r.sort) r.sort=m.sort_order;
  });
  return order.map(function(k){return byKey[k];}).sort(function(a,b){return a.sort-b.sort;});
}

// ───────── 학생·강사가 보는 화면 ─────────
async function renderViewer(){
const __mvpEpoch=SessionGuard.capture();

  const cont=document.getElementById('viewer-content');
  if(!cont) return;
  const sb=sbReady();
  if(!sb){ cont.innerHTML=vwBox('연결이 필요합니다.'); return; }
  const { data:{ session } } = await SessionGuard.wait((sb.auth.getSession()),__mvpEpoch);
  if(!session){ cont.innerHTML=vwBox('로그인이 필요합니다.','테스트 탭에서 로그인해 주세요.'); return; }
  if(!_wprofile){
    const { data:prof } = await SessionGuard.wait((sb.from('profiles').select('id,name,nickname,student_no,role,class_id,teacher_id,pw_changed').eq('id',session.user.id).maybeSingle()),__mvpEpoch);
    if(prof){ _wprofile=prof; _wuser=session.user; }
  }
  cont.innerHTML='<div style="text-align:center;color:var(--t3);font-size:12px;padding:26px;">자료 불러오는 중...</div>';

  try{ await SessionGuard.wait((vwLoad(sb)),__mvpEpoch); }
  catch(e){SessionGuard.assert(__mvpEpoch); cont.innerHTML=vwBox('자료를 불러오지 못했습니다.', (e&&e.message)||e); return; }

  if(_vwAdmin && vwIsStaff()){ vwRenderAdmin(); return; }

  let html='';
  if(vwIsStaff()){
    html+='<div class="vw-top"><button class="vw-mini" onclick="vwToggleAdmin(true)">⚙ 자료 관리</button></div>';
  }
  const vis=_vw.groups.filter(function(g){ return vwRows(g.id).length>0; });
  if(!vis.length){
    cont.innerHTML=html+vwBox('열람 가능한 자료가 없습니다.',
      vwIsStaff()? '위 자료 관리에서 그룹을 만들고 파일을 올려 주세요.' : '반이 배정되지 않았을 수 있습니다. 선생님께 문의하세요.');
    return;
  }

  _vwPaths={}; let seq=0;
  vis.forEach(function(g){
    const rows=vwRows(g.id).map(function(r){
      const btns=r.items.map(function(m){
        const id='vwb'+(seq++);
        _vwPaths[id]={path:m.storage_path, kind:m.kind||'html',
                      title:g.name+' '+(m.row_key||m.title)+' · '+(m.label||'열기')};
        const primary=r.items.length>1 && m===r.items[r.items.length-1];
        return '<button class="vw-a'+(primary?' vw-b':'')+'" onclick="vwOpen(\''+id+'\')">'+
               vwEsc(m.label||'열기')+(m.kind==='pdf'?' <span class="vw-pdf">PDF</span>':'')+'</button>';
      }).join('');
      return '<div class="vw-row"><div class="vw-nm">'+vwEsc(r.key)+'<span class="vw-sz">'+vwMB(r.bytes)+'</span></div>'+
             '<div class="vw-lk">'+btns+'</div></div>';
    }).join('');
    html+='<div class="vw-card" style="--vw:'+vwEsc(g.color||'#2563eb')+'">'+
          '<div class="vw-hdr"><i>'+vwEsc(g.name)+'</i><span>'+vwEsc(g.subtitle||'')+'</span>'+
          (g.published?'':'<span class="vw-hide">숨김</span>')+'</div>'+rows+'</div>';
  });
  html+='<div class="vw-note">· 처음 열 때만 1~2초 걸립니다. 최근에 본 3개는 바로 열립니다.<br>'+
        '· 열린 뒤에는 데이터를 더 쓰지 않습니다.</div>';
  cont.innerHTML=html;
}

// ───────── 열기 ─────────
function vwEnsureOverlay(){
  let ov=document.getElementById('vw-ov');
  if(ov) return ov;
  ov=document.createElement('div');
  ov.id='vw-ov'; ov.className='vw-ov';
  ov.innerHTML='<div class="vw-ov-bar"><div class="vw-ov-t" id="vw-ov-t"></div>'+
               '<button class="vw-ov-x" onclick="vwClose()">닫기</button></div>'+
               '<div class="vw-ov-body"><iframe id="vw-ov-f" title="뷰어"></iframe>'+
               '<div class="vw-ov-msg" id="vw-ov-msg"></div></div>';
  document.body.appendChild(ov);
  return ov;
}

async function vwOpen(id){
const __mvpEpoch=SessionGuard.capture();

  const item=_vwPaths[id];
  if(!item) return;
  const sb=sbReady(); if(!sb) return;

  // PDF 는 Storage 가 제대로 된 content-type 으로 주므로 새 탭이 낫다.
  // 팝업 차단을 피하려고 클릭 제스처 안에서 창을 먼저 연다.
  if(item.kind==='pdf'){
    const w=window.open('','_blank');
    try{
      const { data, error } = await SessionGuard.wait((sb.storage.from('viewer').createSignedUrl(item.path, 3600)),__mvpEpoch);
      if(error || !data) throw (error||new Error('링크를 만들지 못했습니다.'));
      if(w) w.location.href=data.signedUrl; else window.location.href=data.signedUrl;
    }catch(e){SessionGuard.assert(__mvpEpoch);
      if(w) w.close();
      showToast('열지 못했습니다. '+((e&&e.message)||e));
    }
    return;
  }

  const ov=vwEnsureOverlay();
  const f=document.getElementById('vw-ov-f');
  const msg=document.getElementById('vw-ov-msg');
  document.getElementById('vw-ov-t').textContent=item.title;
  f.onload=null; f.removeAttribute('src'); f.style.visibility='hidden';
  ov.classList.add('on');
  f.onload=function(){ msg.style.display='none'; f.style.visibility='visible'; };

  const hit=vwCacheGet(item.path);
  if(hit){ msg.style.display='none'; f.src=hit; return; }

  msg.style.display='flex'; msg.textContent='불러오는 중...';
  try{
    const { data, error } = await SessionGuard.wait((sb.storage.from('viewer').download(item.path)),__mvpEpoch);
    if(error || !data) throw (error || new Error('파일을 찾을 수 없습니다.'));
    const url=URL.createObjectURL(new Blob([data],{type:'text/html;charset=utf-8'}));
    vwCachePut(item.path,url);
    f.src=url;
  }catch(e){SessionGuard.assert(__mvpEpoch);
    msg.textContent='열지 못했습니다.  '+((e&&e.message)||e);
  }
}

function vwClose(){
  const ov=document.getElementById('vw-ov'); if(!ov) return;
  const f=document.getElementById('vw-ov-f');
  if(f){ f.onload=null; f.removeAttribute('src'); }
  ov.classList.remove('on');
}

document.addEventListener('keydown',function(e){
  if(e.key==='Escape'){ const ov=document.getElementById('vw-ov'); if(ov&&ov.classList.contains('on')) vwClose(); }
});

// ========================================================================
// 원장 전용 관리 화면
// ========================================================================
function vwToggleAdmin(on){ _vwAdmin=!!on; _vwEdit=null; _vwAddTo=null; renderViewer(); }

function vwRenderAdmin(){
  const cont=document.getElementById('viewer-content');
  let h='<div class="vw-top"><button class="vw-mini" onclick="vwToggleAdmin(false)">← 학생 화면 보기</button>'+
        '<button class="vw-mini vw-mini-p" onclick="vwEditGroup(\'new\')">+ 그룹 만들기</button></div>';

  if(_vwEdit!==null) h+=vwGroupForm(_vwEdit);

  if(!_vw.groups.length && _vwEdit===null){
    h+=vwBox('아직 그룹이 없습니다.','그룹은 학생 화면에서 카드 하나가 됩니다. 교재나 시험 단위로 만드시면 됩니다.');
  }

  _vw.groups.forEach(function(g){
    const cls=_vw.gc.filter(function(x){return x.group_id===g.id;})
      .map(function(x){ const c=_vw.classes.find(function(cc){return cc.id===x.class_id;}); return c?c.name:''; })
      .filter(Boolean).sort();
    const rows=vwRows(g.id);
    const nfile=_vw.mats.filter(function(m){return m.group_id===g.id;}).length;

    h+='<div class="vw-card vw-adm" style="--vw:'+vwEsc(g.color||'#2563eb')+'">'+
       '<div class="vw-hdr"><i>'+vwEsc(g.name)+'</i><span>'+vwEsc(g.subtitle||'')+'</span>'+
       (g.published?'':'<span class="vw-hide">숨김</span>')+'</div>'+
       '<div class="vw-meta">'+(cls.length? '배정: '+vwEsc(cls.join(', ')) : '<b class="vw-warn">배정된 반 없음. 아무도 못 봅니다</b>')+
       ' · 자료 '+nfile+'개</div>'+
       '<div class="vw-btns">'+
         '<button class="vw-mini" onclick="vwEditGroup('+g.id+')">수정</button>'+
         '<button class="vw-mini" onclick="vwAddFiles('+g.id+')">+ 자료 올리기</button>'+
         '<button class="vw-mini" onclick="vwToggleGroup('+g.id+','+(g.published?'false':'true')+')">'+(g.published?'숨기기':'공개하기')+'</button>'+
         (vwIsDirector()? '<button class="vw-mini vw-mini-d" onclick="vwDelGroup('+g.id+')">삭제</button>' : '')+
       '</div>';

    if(_vwAddTo===g.id) h+=vwUploadForm(g.id);

    rows.forEach(function(r){
      h+='<div class="vw-row"><div class="vw-nm">'+vwEsc(r.key)+'<span class="vw-sz">'+vwMB(r.bytes)+'</span></div><div class="vw-lk">';
      r.items.forEach(function(m){
        h+='<span class="vw-chip'+(m.published?'':' vw-chip-off')+'">'+vwEsc(m.label||'열기')+
           (m.kind==='pdf'?' <b>PDF</b>':'')+
           '<button title="삭제" onclick="vwDelMat('+m.id+')">×</button></span>';
      });
      h+='</div></div>';
    });
    h+='</div>';
  });
  if(!vwIsDirector()) h+='<div class="vw-note">· 그룹 통째 삭제는 원장 계정에서만 됩니다. 필요하면 <b>숨기기</b>를 쓰거나 자료를 하나씩 지워 주세요.</div>';
  cont.innerHTML=h;
}

function vwGroupForm(gid){
  const isNew = (gid==='new');
  const g = isNew ? {name:'',subtitle:'',color:VW_PALETTE[0],sort_order:(_vw.groups.length+1)*10,published:true}
                  : _vw.groups.find(function(x){return x.id===gid;});
  if(!g) return '';
  const picked = _vw.gc.filter(function(x){return x.group_id===gid;}).map(function(x){return x.class_id;});
  const swatches = VW_PALETTE.map(function(c){
    return '<span class="vw-sw'+(c===g.color?' on':'')+'" style="background:'+c+'" onclick="vwPickColor(this,\''+c+'\')"></span>';
  }).join('');
  const boxes = _vw.classes.map(function(c){
    return '<label class="vw-chk"><input type="checkbox" class="vw-cls" value="'+c.id+'"'+
           (picked.indexOf(c.id)>=0?' checked':'')+'> '+vwEsc(c.name)+'</label>';
  }).join('');
  return '<div class="vw-form">'+
    '<div class="vw-form-t">'+(isNew?'새 그룹 만들기':'그룹 수정')+'</div>'+
    '<label class="vw-lb">이름 <span>학생 화면 카드 제목</span></label>'+
    '<input id="vwf-name" class="vw-in" maxlength="30" value="'+vwEsc(g.name)+'" placeholder="예: CPM, 9월 모의고사 해설">'+
    '<label class="vw-lb">부제 <span>비워도 됩니다</span></label>'+
    '<input id="vwf-sub" class="vw-in" maxlength="30" value="'+vwEsc(g.subtitle||'')+'" placeholder="예: 1등급 도전">'+
    '<label class="vw-lb">색상</label><div class="vw-sws" id="vwf-sws" data-color="'+vwEsc(g.color)+'">'+swatches+'</div>'+
    '<label class="vw-lb">보여줄 반 <span>여러 개 고를 수 있습니다</span></label><div class="vw-chks">'+boxes+'</div>'+
    '<label class="vw-lb">순서 <span>숫자가 작을수록 위</span></label>'+
    '<input id="vwf-ord" class="vw-in vw-in-s" type="number" value="'+(g.sort_order||0)+'">'+
    '<div class="vw-form-b">'+
      '<button class="vw-mini" onclick="vwEditGroup(null)">취소</button>'+
      '<button class="vw-mini vw-mini-p" onclick="vwSaveGroup('+(isNew?"'new'":gid)+')">저장</button>'+
    '</div></div>';
}

function vwPickColor(el,c){
  const wrap=document.getElementById('vwf-sws');
  Array.prototype.forEach.call(wrap.children,function(x){ x.classList.remove('on'); });
  el.classList.add('on'); wrap.dataset.color=c;
}
function vwEditGroup(gid){ _vwEdit=gid; _vwAddTo=null; vwRenderAdmin(); }

async function vwSaveGroup(gid){
const __mvpEpoch=SessionGuard.capture();

  if(_vwBusy) return;
  const sb=sbReady(); if(!sb) return;
  const name=document.getElementById('vwf-name').value.trim();
  if(!name){ alert('이름을 입력하세요.'); return; }
  const payload={
    name: name,
    subtitle: document.getElementById('vwf-sub').value.trim() || null,
    color: document.getElementById('vwf-sws').dataset.color || VW_PALETTE[0],
    sort_order: parseInt(document.getElementById('vwf-ord').value,10) || 0
  };
  const cls=Array.prototype.filter.call(document.querySelectorAll('.vw-cls'),function(i){return i.checked;})
                 .map(function(i){return parseInt(i.value,10);});
  _vwBusy=true;
  try{
    let id=gid;
    if(gid==='new'){
      const { data, error } = await SessionGuard.wait((sb.from('viewer_groups').insert(payload).select('id').single()),__mvpEpoch);
      if(error) throw error;
      id=data.id;
    }else{
      const { error } = await SessionGuard.wait((sb.from('viewer_groups').update(payload).eq('id',gid)),__mvpEpoch);
      if(error) throw error;
      const { error:e2 } = await SessionGuard.wait((sb.from('viewer_group_classes').delete().eq('group_id',gid)),__mvpEpoch);
      if(e2) throw e2;
    }
    if(cls.length){
      const { error:e3 } = await SessionGuard.wait((sb.from('viewer_group_classes')
        .insert(cls.map(function(c){return {group_id:id, class_id:c};}))),__mvpEpoch);
      if(e3) throw e3;
    }
    showToast(gid==='new'?'그룹을 만들었습니다':'저장했습니다');
    _vwEdit=null;
    await SessionGuard.wait((renderViewer()),__mvpEpoch);
  }catch(e){SessionGuard.assert(__mvpEpoch); alert('저장 실패: '+((e&&e.message)||e)); }
  finally{ _vwBusy=false; }
}

async function vwToggleGroup(gid,pub){
const __mvpEpoch=SessionGuard.capture();

  const sb=sbReady(); if(!sb) return;
  const { error } = await SessionGuard.wait((sb.from('viewer_groups').update({published:pub}).eq('id',gid)),__mvpEpoch);
  if(error){ alert('실패: '+error.message); return; }
  showToast(pub?'공개했습니다':'숨겼습니다');
  renderViewer();
}

async function vwDelGroup(gid){
  if(_vwBusy || !vwIsDirector()) return;
  const g=_vw.groups.find(function(x){return x.id===gid;});
  if(!g) return;
  const n=_vw.mats.filter(function(m){return m.group_id===gid;}).length;
  if(!confirm('"'+(g?g.name:'')+'" 그룹과 안의 자료 '+n+'개를 모두 지웁니다. 되돌릴 수 없습니다.')) return;
  const sb=sbReady(); if(!sb) return;
  const token=vwMutationBegin(); if(!token) return;
  const paths=Array.from(new Set(_vw.mats.filter(function(m){return m.group_id===gid;}).map(function(m){return m.storage_path;})));
  let metadataDeleted=false;
  try{
    const result=await SessionGuard.wait(sb.from('viewer_groups').delete().eq('id',gid).select('id'),token.epoch);
    if(!vwDeletedRow(result,gid)) throw new Error('metadata');
    metadataDeleted=true;
    paths.forEach(vwCacheDrop);
    if(paths.length){
      const removed=await SessionGuard.wait(sb.storage.from('viewer').remove(paths),token.epoch);
      if(!removed || removed.error) throw new Error('storage');
    }
    showToast('삭제했습니다');
  }catch(e){
    if(!vwMutationCurrent(token)) return;
    alert(metadataDeleted
      ? '그룹과 자료 목록은 삭제됐지만 저장소 정리가 완료되지 않았습니다. 남아 있는 원본 파일은 보관되어 있으며 별도 정리가 필요합니다.'
      : '그룹 삭제를 확인하지 못했습니다. 원본 파일은 지우지 않았습니다. 목록을 새로 확인해 주세요.');
  }finally{
    if(vwMutationCurrent(token) && metadataDeleted) await SessionGuard.wait(renderViewer(),token.epoch).catch(function(){});
    vwMutationEnd(token);
  }
}

function vwAddFiles(gid){ _vwAddTo=(_vwAddTo===gid? null : gid); _vwEdit=null; vwRenderAdmin(); }

function vwUploadForm(gid){
  return '<div class="vw-form">'+
    '<div class="vw-form-t">자료 올리기</div>'+
    '<label class="vw-lb">파일 <span>html · pdf, 여러 개 한 번에</span></label>'+
    '<input id="vwu-file" class="vw-in" type="file" accept=".html,.htm,.pdf" multiple onchange="vwFilePicked()">'+
    '<div id="vwu-list" class="vw-ulist"></div>'+
    '<label class="vw-lb">줄 이름 <span>같은 이름끼리 한 줄에 묶입니다</span></label>'+
    '<input id="vwu-row" class="vw-in" maxlength="40" placeholder="예: 수학Ⅰ · 1부">'+
    '<label class="vw-lb">버튼 글자 <span>비우면 파일마다 이름을 따로 묻습니다</span></label>'+
    '<input id="vwu-label" class="vw-in" maxlength="20" placeholder="예: 손풀이">'+
    '<label class="vw-lb">순서</label>'+
    '<input id="vwu-ord" class="vw-in vw-in-s" type="number" value="'+((vwRows(gid).length+1)*10)+'">'+
    '<div class="vw-form-b">'+
      '<button class="vw-mini" onclick="vwAddFiles('+gid+')">취소</button>'+
      '<button class="vw-mini vw-mini-p" id="vwu-go" onclick="vwUpload('+gid+')">올리기</button>'+
    '</div>'+
    '<div id="vwu-prog" class="vw-prog"></div></div>';
}

function vwFilePicked(){
  const f=document.getElementById('vwu-file').files;
  const box=document.getElementById('vwu-list');
  let h='';
  for(let i=0;i<f.length;i++) h+='<div>'+vwEsc(f[i].name)+' <span>'+vwMB(f[i].size)+'</span></div>';
  box.innerHTML=h;
  // 줄 이름이 비어 있으면 첫 파일 이름에서 확장자만 뗀 값을 넣어 준다
  const row=document.getElementById('vwu-row');
  if(f.length && !row.value) row.value=f[0].name.replace(/\.(html?|pdf)$/i,'').slice(0,40);
}

function vwSafePath(gid,name){
  const dot=name.lastIndexOf('.');
  let ext=(dot>0? name.slice(dot+1):'').toLowerCase().replace(/[^a-z0-9]/g,'');
  if(ext==='htm') ext='html';
  if(ext!=='html' && ext!=='pdf') ext='html';
  let base=(dot>0? name.slice(0,dot):name).replace(/[^A-Za-z0-9._-]/g,'');
  if(!base) base='file';
  return {path:'g'+gid+'/'+base.slice(0,40)+'_'+Date.now().toString(36)+Math.floor(Math.random()*1e4)+'.'+ext, ext:ext};
}

async function vwUpload(gid){
  if(_vwBusy || !vwIsStaff()) return;
  const sb=sbReady(); if(!sb) return;
  const files=Array.from(document.getElementById('vwu-file').files||[]);
  if(!files || !files.length){ alert('파일을 고르세요.'); return; }
  const rowKey=document.getElementById('vwu-row').value.trim();
  if(!rowKey){ alert('줄 이름을 입력하세요.'); return; }
  const common=document.getElementById('vwu-label').value.trim();
  const ord=parseInt(document.getElementById('vwu-ord').value,10)||0;
  const prog=document.getElementById('vwu-prog');
  const go=document.getElementById('vwu-go');

  const token=vwMutationBegin(); if(!token) return;
  go.disabled=true;
  let done=0, fail=0, retained=0, cleanupFailed=0;
  try{ for(let i=0;i<files.length;i++){
    if(!vwMutationCurrent(token)) return;
    const file=files[i];
    let label=common;
    if(!label){
      label=prompt('"'+file.name+'" 버튼에 쓸 글자?', file.name.replace(/\.(html?|pdf)$/i,'').slice(0,20));
      if(label===null){ continue; }
      label=label.trim()|| '열기';
    }
    const sp=vwSafePath(gid,file.name);
    prog.textContent='올리는 중... ('+(i+1)+'/'+files.length+') '+file.name;
    let uploaded=false;
    try{
      const ct = sp.ext==='pdf' ? 'application/pdf' : 'text/html';
      const up = await SessionGuard.wait((sb.storage.from('viewer').upload(sp.path, file, {contentType:ct, upsert:false})),token.epoch);
      if(!up || up.error) throw new Error('upload');
      uploaded=true;
      const ins = await SessionGuard.wait((sb.from('viewer_materials').insert({
        group_id:gid, title:rowKey, row_key:rowKey, label:label, kind:sp.ext,
        storage_path:sp.path, bytes:file.size, sort_order:ord, published:true
      }).select('id')),token.epoch);
      if(!ins || ins.error || !Array.isArray(ins.data) || ins.data.length!==1 || !ins.data[0].id) throw new Error('metadata');
      done++;
    }catch(e){
      if(!vwMutationCurrent(token)) return;
      fail++;
      if(uploaded){
        // A failed response can follow a committed insert. Delete the uploaded
        // object only after a fresh read confirms no metadata references it.
        try{
          const check=await SessionGuard.wait(sb.from('viewer_materials').select('id').eq('storage_path',sp.path),token.epoch);
          if(!check || check.error || !Array.isArray(check.data) || check.data.length){ retained++; }
          else{
            const cleanup=await SessionGuard.wait(sb.storage.from('viewer').remove([sp.path]),token.epoch);
            if(!cleanup || cleanup.error){ retained++; cleanupFailed++; }
          }
        }catch(cleanupError){
          if(!vwMutationCurrent(token)) return;
          retained++; cleanupFailed++;
        }
      }
    }
  }
    if(!vwMutationCurrent(token)) return;
    const summary='업로드 결과: 완료 '+done+'개, 실패 '+fail+'개.'+
      (retained?' 원본 '+retained+'개는 저장소에 보관되어 있습니다. 등록 결과 확인 또는 별도 정리가 필요합니다.':'')+
      (cleanupFailed?' 이 중 '+cleanupFailed+'개는 정리 요청을 완료하지 못했습니다.':'');
    if(fail) alert(summary);
    else if(done) showToast(done+'개 올렸습니다');
    if(!fail) _vwAddTo=null;
    await SessionGuard.wait(renderViewer(),token.epoch);
    const currentProgress=document.getElementById('vwu-prog');
    if(fail && _vwAddTo===gid && currentProgress) currentProgress.textContent=summary;
  }catch(e){
    if(vwMutationCurrent(token)) alert('업로드 처리 후 목록을 갱신하지 못했습니다. 다시 열어 등록 결과를 확인해 주세요.');
  }finally{
    if(vwMutationCurrent(token) && document.getElementById('vwu-go')===go) go.disabled=false;
    vwMutationEnd(token);
  }
}

async function vwDelMat(id){
  if(_vwBusy || !vwIsStaff()) return;
  const m=_vw.mats.find(function(x){return x.id===id;});
  if(!m) return;
  if(!confirm('"'+(m.row_key||m.title)+' · '+(m.label||'')+'" 자료를 지웁니다.')) return;
  const sb=sbReady(); if(!sb) return;
  const token=vwMutationBegin(); if(!token) return;
  let metadataDeleted=false;
  try{
    const result=await SessionGuard.wait(sb.from('viewer_materials').delete().eq('id',id).select('id'),token.epoch);
    if(!vwDeletedRow(result,id)) throw new Error('metadata');
    metadataDeleted=true;
    vwCacheDrop(m.storage_path);
    const removed=await SessionGuard.wait(sb.storage.from('viewer').remove([m.storage_path]),token.epoch);
    if(!removed || removed.error) throw new Error('storage');
    showToast('삭제했습니다');
  }catch(e){
    if(!vwMutationCurrent(token)) return;
    alert(metadataDeleted
      ? '자료 목록은 삭제됐지만 저장소 정리가 완료되지 않았습니다. 남아 있는 원본 파일은 보관되어 있으며 별도 정리가 필요합니다.'
      : '자료 삭제를 확인하지 못했습니다. 원본 파일은 지우지 않았습니다. 목록을 새로 확인해 주세요.');
  }finally{
    if(vwMutationCurrent(token) && metadataDeleted) await SessionGuard.wait(renderViewer(),token.epoch).catch(function(){});
    vwMutationEnd(token);
  }
}

// ===== MOBILE APP / PWA =====
let _pwaInstallPrompt=null;
let _sheetReturnFocus=null;


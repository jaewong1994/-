import {session, esc, say} from './school.js';

const statusNames = {active:'재원', paused:'휴원', withdrawn:'퇴원'};
const actions = [
  ['move','반 이동'], ['add','반 추가'], ['remove','반 제외'], ['name','이름 수정'],
  ['paused','휴원 처리'], ['withdrawn','퇴원 처리'], ['active','재원으로 변경']
];
const option = (v, title=v) => '<option value="'+esc(v)+'">'+esc(title)+'</option>';
const unique = values => [...new Set(values)].sort((a,b)=>a.localeCompare(b,'ko'));

async function accounts(op, changes=[]) {
  const {data,error} = await session().rpc('mm_manage_accounts',{op,changes});
  if (error?.code==='PGRST202') throw Error('계정관리 연결을 준비 중입니다. 잠시 후 다시 열어 주세요.');
  if (error) throw Error(error.message || '명단을 불러오지 못했습니다.');
  return data;
}

export function changeFor(person, action, value, from) {
  const patch={id:person.id,revision:person.revision};
  if (action==='name') {
    const name=value.trim();
    if (!name || name.length>40) throw Error('이름은 1~40자로 입력하세요.');
    if (name===person.name) return null;
    return {...patch,name};
  }
  if (Object.hasOwn(statusNames,action)) {
    return action===person.status ? null : {...patch,status:action};
  }
  const target=value.trim();
  if (!target || target.length>40) throw Error('반 이름은 1~40자로 입력하세요.');
  if (action==='move' && (!person.groups.includes(from) || target===from)) return null;
  let groups=person.groups;
  if (action==='move') groups=groups.filter(g=>g!==from);
  groups=action==='remove' ? groups.filter(g=>g!==target) : [...groups,target];
  groups=unique(groups);
  if (!groups.length) throw Error(person.name+' 학생에게 수강반이 하나 이상 필요합니다.');
  if (groups.length>12) throw Error(person.name+' 학생의 반은 12개까지 등록할 수 있습니다.');
  if (groups.length===person.groups.length && groups.every(g=>person.groups.includes(g))) return null;
  return {...patch,groups};
}

export async function accountScreen(root,current) {
  let students=await accounts('list');
  if (!current()) return;
  let visible=[],chosen=new Set(),saving=false,dirtyAfterError=false;
  root.innerHTML=`<div class="row spread"><h1>계정관리</h1><button class="quiet" data-refresh>새로고침</button></div>
    <div class="account-filters"><label>학생 찾기<input type="search" data-search placeholder="이름 또는 전화번호 끝 4자리"></label>
    <label>수강반<select data-class></select></label><label>재원 상태<select data-status>${option('','전체')+Object.entries(statusNames).map(([k,v])=>option(k,v)).join('')}</select></label></div>
    <div class="row spread account-tools"><output aria-live="polite" data-count></output>
    <div><select aria-label="일괄 변경 항목" data-action>${actions.map(([k,v])=>option(k,v)).join('')}</select>
    <button class="primary" data-edit disabled>선택 학생 변경</button></div></div>
    <div class="account-scroll"><table class="account-table"><thead><tr><th><input type="checkbox" aria-label="검색 결과 전체 선택" data-all></th>
    <th scope="col">학생</th><th scope="col">수강반</th><th scope="col">상태</th></tr></thead><tbody></tbody></table></div>
    <dialog data-editor class="account-editor"><form><h2></h2><div data-fields></div><div data-preview></div>
    <p role="alert" data-error></p><div class="actions"><button type="button" data-cancel>취소</button><button class="primary" type="submit">변경 저장</button></div></form></dialog>`;
  const $=sel=>root.querySelector(sel), groups=$('[data-class]'),status=$('[data-status]'),search=$('[data-search]');
  const all=$('[data-all]'),body=$('tbody'),edit=$('[data-edit]'),mode=$('[data-action]'),dialog=$('dialog'), fields=$('[data-fields]');
  function filters() {
    const old=groups.value;
    groups.innerHTML=option('','전체')+unique(students.flatMap(p=>p.groups)).map(g=>option(g)).join('');
    if ([...groups.options].some(o=>o.value===old)) groups.value=old;
  }
  function selection() {
    all.checked=visible.length>0 && visible.every(p=>chosen.has(p.id));
    all.indeterminate=chosen.size>0 && !all.checked;
    all.disabled=!visible.length;
    edit.disabled=!chosen.size || chosen.size>200;
    $('[data-count]').textContent='학생 '+visible.length+'명 · 선택 '+chosen.size+'명'+(chosen.size>200?' (한 번에 200명까지)':'');
  }
  function rows() {
    const word=search.value.trim().toLocaleLowerCase();
    visible=students.filter(p=>(!groups.value || p.groups.includes(groups.value)) && (!status.value || p.status===status.value) &&
      (!word || p.name.toLocaleLowerCase().includes(word) || p.phoneEnd.includes(word)));
    body.innerHTML=visible.map(p=>`<tr><td><input type="checkbox" data-id="${esc(p.id)}" aria-label="${esc(p.name)} 선택" ${chosen.has(p.id)?'checked':''}></td>
      <td><b>${esc(p.name)}</b> <small>· ${esc(p.phoneEnd)}</small></td><td>${p.groups.map(esc).join(' · ')}</td><td>${esc(statusNames[p.status])}</td></tr>`).join('') ||
      '<tr><td colspan="4">해당 학생이 없습니다.</td></tr>';
    selection();
  }
  async function refresh() {
    const updated=await accounts('list');
    if (!current()) return;
    students=updated;chosen.clear();filters();rows();
  }
  search.oninput=groups.onchange=status.onchange=()=>{chosen.clear();rows()};
  all.onchange=()=>{chosen=new Set(all.checked?visible.map(p=>p.id):[]);rows()};
  body.onchange=e=>{const id=e.target.dataset.id;if(!id)return;e.target.checked?chosen.add(id):chosen.delete(id);selection()};
  $('[data-refresh]').onclick=()=>refresh().catch(e=>say(e.message));
  $('[data-cancel]').onclick=()=>{if (!saving) dialog.close()};
  dialog.addEventListener('cancel',e=>{if(saving)e.preventDefault()});
  edit.onclick=()=>{
    const participants=visible.filter(p=>chosen.has(p.id)),action=mode.value;
    const allGroups=unique(students.flatMap(p=>p.groups)), selectedGroups=unique(participants.flatMap(p=>p.groups));
    const labels=Object.fromEntries(actions);
    dialog.querySelector('h2').textContent=labels[action]+' · '+participants.length+'명';
    fields.innerHTML='';
    if (action==='name') {
      fields.innerHTML=participants.map((p,i)=>`<label>${esc(p.name)} · ${esc(p.phoneEnd)}<input maxlength="40" data-name="${i}" value="${esc(p.name)}" required></label>`).join('');
    } else if (action==='move'||action==='add'||action==='remove') {
      if (action==='move') fields.innerHTML='<label>기존 반<select data-from>'+selectedGroups.map(g=>option(g)).join('')+'</select></label>';
      fields.innerHTML+=action==='remove'?'<label>제외할 반<select data-value>'+selectedGroups.map(g=>option(g)).join('')+'</select></label>':
        '<label>'+(action==='move'?'이동할 반':'추가할 반')+'<input data-value list="mm-group-options" maxlength="40" required></label><datalist id="mm-group-options">'+allGroups.map(g=>option(g)).join('')+'</datalist>';
    } else if (action!=='active') {
      fields.textContent='저장하면 해당 학생의 학습실 이용이 중지됩니다. 시험·오답·순공 기록은 보관됩니다.';
    }
    const submit=dialog.querySelector('[type=submit]'),err=$('[data-error]'),preview=$('[data-preview]');
    let edits=[];
    dirtyAfterError=false;
    function review() {
      edits=[];err.textContent='';const lines=[];
      try {
        participants.forEach((p,i)=>{
          const value=action==='name'?fields.querySelector('[data-name="'+i+'"]').value:fields.querySelector('[data-value]')?.value||'';
          const patch=changeFor(p,action,value,fields.querySelector('[data-from]')?.value);
          if(!patch)return;
          edits.push(patch);
          const before=patch.groups?p.groups.join(' · '):patch.name?p.name:statusNames[p.status];
          const after=patch.groups?patch.groups.join(' · '):patch.name||statusNames[patch.status];
          lines.push('<li><strong>'+esc(p.name)+'</strong> '+esc(before)+' → '+esc(after)+'</li>');
        });
      } catch(e) {edits=[];err.textContent=e.message;}
      preview.innerHTML=edits.length?'<ul>'+lines.join('')+'</ul>':'';
      submit.disabled=saving||dirtyAfterError||!edits.length;submit.textContent=edits.length?edits.length+'명 변경 저장':'변경 저장';
    }
    fields.oninput=review;fields.onchange=review;review();
    dialog.querySelector('form').onsubmit=async e=>{
      e.preventDefault();if(saving||!edits.length||dirtyAfterError)return;
      saving=true;submit.disabled=true;
      try {
        const count=await accounts('apply',edits);
        if(!current())return;
        dialog.close();say(count+'명 변경했습니다.');await refresh();
      } catch(e) {
        if(!current())return;
        dirtyAfterError=/새로고침/.test(e.message);
        err.textContent=e.message;
        if(!dialog.open)say(e.message);
      } finally {saving=false;submit.disabled=dirtyAfterError||!edits.length;}
    };
    dialog.showModal();
  };
  filters();rows();
}

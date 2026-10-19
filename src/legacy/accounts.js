/* Existing account contracts; credentials exist only in masked inputs and transient requests. */
(function(root){
 'use strict';
 let view=null,serial=0;
 const fields='id,name,nickname,student_no,role,class_id,teacher_id,pw_changed';
 const allowed=()=>AppSession.can('accounts')&&AppSession.context()?.role==='director';
 const compatible=()=>allowed()&&AppSession.context()?.operations==='legacy-compatible-v1';
 const el=(tag,text)=>{const node=document.createElement(tag);if(text!==undefined)node.textContent=text;return node;};
 function current(v){const c=AppSession.context();return view===v&&v.node.isConnected&&v.node.contains(v.panel)&&c?.id===v.id&&c?.epoch===v.epoch&&allowed()&&(!v.pageActive||v.node.closest('.page')?.classList.contains('on'));}
 function clearSecrets(){document.querySelectorAll('#account-manager input[type=password]').forEach(n=>{n.value='';});}
 root.addEventListener('mvp-session-reset',()=>{clearSecrets();view=null;serial++;root._dirStudents=null;root._dirTeachers=null;});
 function status(v,text,error=false){if(!current(v))return;v.status.textContent=text;v.status.setAttribute('role',error?'alert':'status');}
 function button(text,handler){const n=el('button',text);n.type='button';n.addEventListener('click',handler);return n;}
 function label(text,input){const n=el('label');n.append(el('span',text),input);return n;}
 function input(id,type='text'){const n=el('input');n.id=id;n.type=type;return n;}
 function option(value,text){const n=el('option',text);n.value=value;return n;}
 function mutable(v){return current(v)&&compatible()&&!v.busy;}
 function setBusy(v,busy){v.busy=busy;if(!current(v))return;v.panel.querySelectorAll('button,input,select').forEach(n=>{n.disabled=busy||(n.dataset.accountStateAction==='true'&&!v.statuses?.has(n.dataset.accountId));});v.panel.setAttribute('aria-busy',String(busy));}
 async function run(v,operation,success){
  if(!mutable(v))return;setBusy(v,true);status(v,'처리 중입니다.');
  try{const result=await operation();if(!current(v))return;
   if(!result||result.error||result.data?.error){status(v,'요청을 완료하지 못했습니다. 계정 상태를 확인한 뒤 다시 시도해 주세요.',true);return;}
   await success(result.data);
  }catch(_error){status(v,'요청을 완료하지 못했습니다. 연결 상태를 확인해 주세요.',true);}
  finally{if(current(v))setBusy(v,false);}
 }
 async function refresh(v){
  if(!current(v))return;const request=++v.read;
  try{const [result,accountStates]=await Promise.all([sbReady().from('profiles').select(fields).order('student_no'),sbReady().rpc('staff_account_statuses')]);
   if(!current(v)||v.read!==request)return false;
   if(result.error||!Array.isArray(result.data)){status(v,'계정 목록을 갱신하지 못했습니다. 새로고침으로 확인해 주세요.',true);return false;}
   v.statuses=new Map();if(!accountStates.error&&Array.isArray(accountStates.data))for(const row of accountStates.data){if(typeof row.id==='string'&&typeof row.is_suspended==='boolean')v.statuses.set(row.id,row.is_suspended);}
   v.students=result.data.filter(p=>p.role==='student');v.teachers=result.data.filter(p=>p.role==='teacher');
   root._dirStudents=v.students;root._dirTeachers=v.teachers;renderLists(v);return true;
  }catch(_error){if(current(v)&&v.read===request)status(v,'계정 목록을 갱신하지 못했습니다.',true);return false;}
 }
 function actions(v,p){const box=el('div');box.className='account-actions';
  const known=v.statuses.has(p.id),stopped=v.statuses.get(p.id),change=button(known?(stopped?'사용 재개':'사용 중지'):'상태 확인 필요',()=>root.wSetAccountSuspended(p.id,!stopped));change.disabled=!known;change.dataset.accountStateAction='true';change.dataset.accountId=p.id;box.append(button('비밀번호 재설정',()=>root.wResetPw(p.id,p.student_no)),change);return box;
 }
 function identity(p){const n=el('div');n.className='account-identity';n.append(el('strong',p.name||'이름 미설정'),el('span',[p.student_no,p.nickname?'@'+p.nickname:null,p.class_id==null?null:'반 '+p.class_id].filter(Boolean).join(' · ')));return n;}
 function renderLists(v){if(!current(v))return;v.teachersBox.replaceChildren(el('h3','강사 '+v.teachers.length+'명'));
  for(const p of v.teachers){const row=el('div');row.className='account-row';row.append(identity(p),el('span','담당 '+v.students.filter(s=>s.teacher_id===p.id).length+'명'),actions(v,p));v.teachersBox.append(row);}
  if(!v.teachers.length)v.teachersBox.append(el('p','등록된 강사가 없습니다.'));
  root.wFilterStudents(v.search.value);if(v.busy)setBusy(v,true);
 }
 root.wRenderStudentList=function(list){const v=view;if(!v||!current(v))return;v.studentsBox.replaceChildren();
  if(!list.length){v.studentsBox.append(el('p','조건에 맞는 학생이 없습니다.'));return;}
  for(const p of list){const row=el('div');row.className='account-row';row.dataset.accountId=p.id;const info=identity(p);
   info.append(button('이름 수정',()=>root.wRenameStudent(p.id,p.name)));
   const select=el('select');select.setAttribute('aria-label',(p.name||p.student_no||'학생')+' 담당 강사');select.append(option('','미배정'));
   for(const t of v.teachers)select.append(option(t.id,t.name||t.student_no||'이름 미설정'));select.value=p.teacher_id||'';
   select.addEventListener('change',()=>root.wAssignTeacher(p.id,select.value));row.append(info,label('담당 강사',select),actions(v,p));v.studentsBox.append(row);
  }
 };
 root.wFilterStudents=function(query){const v=view;if(!v||!current(v))return;const q=String(query||'').trim().toLowerCase();root.wRenderStudentList(v.students.filter(p=>[p.name,p.nickname,p.student_no,p.class_id].some(x=>String(x??'').toLowerCase().includes(q))));};
 function target(v,id){return [...v.students,...v.teachers].find(p=>p.id===id);}
 root.renderWDirector=async function(){
  if(!allowed())return;clearSecrets();const node=document.getElementById('wtest-content-admin');if(!node)return;
  const c=AppSession.context(),v={node,id:c.id,epoch:c.epoch,serial:++serial,pageActive:node.closest('.page')?.classList.contains('on'),read:0,busy:false,students:[],teachers:[],statuses:new Map()};view=v;
  node.innerHTML=wHeader(_wprofile.name,'원장');v.panel=el('section');v.panel.id='account-manager';v.panel.className='stg-card account-manager';node.append(v.panel);
  v.panel.append(el('h2','계정 관리'));v.status=el('p');v.status.id='account-status';v.status.setAttribute('role','status');v.panel.append(v.status);
  if(!compatible()){
   v.panel.append(el('p','체험 계정 목록입니다. 계정 발급·사용 중지·비밀번호 재설정은 서버 인증 절차 검증 후 연결합니다.'));
   const list=el('div','불러오는 중');list.id='account-list';v.panel.append(list);
   try{const result=await sbReady().from('profiles').select('id,name,role,student_no,class_id');if(!current(v))return;
    if(result.error){list.textContent='목록을 불러오지 못했습니다.';return;}list.replaceChildren();for(const p of result.data||[])list.append(el('p',[p.name,{student:'학생',teacher:'강사',director:'원장'}[p.role],p.student_no].filter(Boolean).join(' · ')));
   }catch(_error){if(current(v))list.textContent='목록을 불러오지 못했습니다.';}return;
  }
  v.panel.append(el('p','학생·강사 계정과 담당 강사를 관리합니다. 사용 중지는 기존 성적과 기록을 보존하며, 계정을 다시 사용할 수 있습니다.'));
  const form=el('form');form.className='account-create';form.append(el('h3','계정 발급'));
  const role=el('select');role.id='gen-role';role.append(option('student','학생'),option('teacher','강사'));
  const count=input('gen-count','number');count.min='1';count.max='50';count.value='1';count.required=true;
  const prefix=input('gen-prefix');prefix.placeholder='계정 아이디 접두어';prefix.required=true;prefix.maxLength=40;prefix.pattern='[A-Za-z][A-Za-z0-9_-]{0,39}';prefix.title='영문자로 시작하는 영문·숫자·밑줄·하이픈 1~40자';
  const password=input('gen-pw','password');password.autocomplete='new-password';password.minLength=6;password.maxLength=256;password.required=true;
  form.append(label('역할',role),label('개수 (1~50)',count),label('아이디 접두어',prefix),label('새 비밀번호 (6자 이상)',password));
  const create=el('button','계정 발급');create.type='submit';form.append(create);form.addEventListener('submit',e=>{e.preventDefault();void root.wGenAccounts();});v.panel.append(form);
  v.result=el('div');v.result.id='gen-result';v.result.setAttribute('aria-live','polite');v.panel.append(v.result);
  v.editor=el('div');v.editor.id='account-editor';v.panel.append(v.editor);
  v.teachersBox=el('section');v.teachersBox.className='account-section';v.panel.append(v.teachersBox);
  const students=el('section');students.className='account-section';students.append(el('h3','학생 관리'));
  v.search=input('stu-search','search');v.search.placeholder='이름·아이디·닉네임·반 번호 검색';v.search.setAttribute('aria-label','학생 검색');v.search.addEventListener('input',()=>root.wFilterStudents(v.search.value));students.append(v.search);
  v.studentsBox=el('div');v.studentsBox.id='stu-list';students.append(v.studentsBox);v.panel.append(students,button('목록 새로고침',()=>{if(mutable(v))void refresh(v);}));
  status(v,'계정 목록을 불러오고 있습니다.');if(await refresh(v))status(v,'계정 목록을 불러왔습니다.');
 };
 root.wGenAccounts=async function(){const v=view;if(!v||!mutable(v))return;
  const role=v.panel.querySelector('#gen-role').value,count=Number(v.panel.querySelector('#gen-count').value),prefix=v.panel.querySelector('#gen-prefix').value.trim(),pw=v.panel.querySelector('#gen-pw');
  if(!['student','teacher'].includes(role)||!Number.isInteger(count)||count<1||count>50||!/^[A-Za-z][A-Za-z0-9_-]{0,39}$/.test(prefix)||pw.value.length<6||pw.value.length>256){status(v,'역할·개수와 영문으로 시작하는 접두어(40자 이하), 비밀번호(6~256자)를 확인해 주세요.',true);return;}
  await run(v,()=>sbReady().functions.invoke('quick-action',{body:{role,count,prefix,password:pw.value}}),async data=>{
   const accounts=(data?.ok===true||data?.partial===true)&&Array.isArray(data.accounts)?data.accounts:[],ok=accounts.filter(a=>!a.error&&typeof a.email==='string');
   if(!ok.length){pw.value='';status(v,'계정 발급을 확인하지 못했습니다. 중복 발급을 피하려면 계정 목록과 서버 상태를 먼저 확인해 주세요.',true);return;}
   pw.value='';v.result.replaceChildren(el('p',ok.length+'개 발급 확인'+(ok.length<count?' · 일부 계정은 발급되지 않았습니다.':'')));
   const list=el('ul');for(const a of ok)list.append(el('li',a.email));v.result.append(list,el('p','위 계정 아이디와 방금 지정한 비밀번호를 각 사용자에게 별도로 전달해 주세요.'));
   status(v,'계정 발급 결과를 확인했습니다.');await refresh(v);
  });
 };
 root.wDeleteAccount=async function(){const v=view;if(v&&mutable(v))status(v,'학생 기록을 보존하기 위해 계정 삭제 대신 사용 중지를 이용해 주세요.',true);};
 root.wSetAccountSuspended=async function(id,stop){const v=view;if(!v||!mutable(v)||typeof stop!=='boolean')return;const p=target(v,id);if(!p||p.role==='director'||id===v.id||!v.statuses.has(id)||v.statuses.get(id)===stop)return;
  if(!confirm((p.name||p.student_no||'선택한 계정')+'의 사용을 '+(stop?'중지':'재개')+'할까요? 기존 성적·상담·배정 기록은 그대로 보존됩니다.'))return;
  await run(v,()=>sbReady().functions.invoke('quick-action',{body:{action:stop?'suspend':'restore',id}}),async data=>{
   if(data?.ok!==true||data.id!==id||data.is_suspended!==stop){status(v,'계정 사용 상태 변경을 확인하지 못했습니다. 새로고침으로 확인해 주세요.',true);return;}
   const loaded=await refresh(v);if(!current(v))return;if(!loaded||!v.statuses.has(id)||v.statuses.get(id)!==stop){status(v,'계정 변경 요청은 처리됐지만 목록의 상태를 확인하지 못했습니다.',true);return;}
   status(v,stop?'계정 사용을 중지했습니다. 기존 기록은 보존했습니다.':'계정 사용을 재개했습니다. 기존 기록을 계속 사용할 수 있습니다.');
  });
 };
 function editor(v,title,kind,value,submit){if(!mutable(v))return;clearSecrets();v.editor.replaceChildren();const form=el('form');form.className='account-edit-form';form.append(el('h3',title));const field=input('account-edit-value',kind);field.value=value;field.required=true;if(kind==='password'){field.minLength=6;field.maxLength=256;field.autocomplete='new-password';}form.append(label(kind==='password'?'새 비밀번호 (6자 이상)':'학생 이름',field));const save=el('button','저장');save.type='submit';form.append(save,button('취소',()=>{clearSecrets();v.editor.replaceChildren();}));form.addEventListener('submit',e=>{e.preventDefault();void submit(field);});v.editor.append(form);field.focus();}
 root.wResetPw=function(id,_label){const v=view;if(!v||!mutable(v)||!target(v,id))return;editor(v,'비밀번호 재설정','password','',async field=>{
  if(field.value.length<6||field.value.length>256){status(v,'비밀번호는 6~256자로 입력해 주세요.',true);return;}
  await run(v,()=>sbReady().functions.invoke('quick-action',{body:{action:'reset_password',id,password:field.value}}),async data=>{field.value='';if(data?.partial===true&&data.password_changed===true){v.editor.replaceChildren();status(v,'비밀번호는 재설정됐지만 계정의 변경 표시를 갱신하지 못했습니다.',true);return;}if(data?.ok!==true){status(v,'비밀번호 재설정 결과를 확인하지 못했습니다. 계정 상태를 확인해 주세요.',true);return;}v.editor.replaceChildren();const loaded=await refresh(v);if(!current(v))return;if(!loaded||target(v,id)?.pw_changed!==false){status(v,'비밀번호는 재설정됐지만 계정의 변경 표시를 확인하지 못했습니다.',true);return;}status(v,'비밀번호를 재설정했습니다.');});
 });};
 root.wAssignTeacher=async function(id,teacherId){const v=view;if(!v||!mutable(v))return;const p=v.students.find(s=>s.id===id);if(!p||teacherId&&!v.teachers.some(t=>t.id===teacherId))return;
  await run(v,()=>sbReady().from('profiles').update({teacher_id:teacherId||null}).eq('id',id),async()=>{p.teacher_id=teacherId||null;renderLists(v);status(v,'담당 강사를 변경했습니다.');});if(current(v))renderLists(v);
 };
 root.wRenameStudent=function(id,_oldName){const v=view;if(!v||!mutable(v))return;const p=v.students.find(s=>s.id===id);if(!p)return;editor(v,'학생 이름 수정','text',p.name||'',async field=>{
  const name=field.value.trim();if(!name){status(v,'학생 이름을 입력해 주세요.',true);return;}
  await run(v,()=>sbReady().from('profiles').update({name}).eq('id',id),async()=>{p.name=name;v.editor.replaceChildren();renderLists(v);status(v,'학생 이름을 변경했습니다.');});
 });};
 root.renderWDirectorRefreshLists=()=>view&&mutable(view)?refresh(view):Promise.resolve(false);
})(window);

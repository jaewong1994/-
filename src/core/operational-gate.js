(function(root){
 'use strict';
 // Local source contracts only. Remote schema/version and RLS are not probed automatically.
 const columns={profiles:'id,name,nickname,student_no,role,class_id,teacher_id',classes:'id,name',tests:'id,title,total,exam_date,closed,created_by',submissions:'id,test_id,user_id,score,correct_count,created_at',test_assignments:'test_id,user_id',collections:'user_id,jun,kill,god,gold,silver,bronze,perfect',mock_scores:'id,student_id,exam_year,exam_type,score_data,wrong_items,source_mode,created_at,updated_at',consultation_plans:'id,student_id,counselor_id,plan_data,counselor_note,published,created_at,updated_at'};
 const rpcNames=['list_managed_tests','staff_test_submissions','test_wrong_matrix','student_report'];
 const fail=(message='검토되지 않은 조회 또는 원격 변경은 허용하지 않습니다.')=>({data:null,error:{message}});
 const uuid=v=>typeof v==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
 const positive=v=>/^\d+$/.test(String(v))&&Number.isSafeInteger(Number(v))&&Number(v)>0;
 let scope='',students=new Set(),tests=new Set(),assigned=new Set();
 const identity=()=>{const c=root.AppSession?.context();if(!c||c.mode!=='server'||!['student','teacher','director'].includes(c.role))throw Error('계정 확인 후 화면에서 조회해 주세요.');const k=JSON.stringify([c.id,c.role,c.epoch]);if(scope!==k){scope=k;students=new Set();tests=new Set();assigned=new Set();}return {...c,key:k};};
 const check=c=>{if(identity().key!==c.key)throw Error('이전 계정의 조회 응답입니다.');};
 const isStaff=c=>c.role!=='student';
 function safeSelect(table,select){return typeof select==='string'&&select.length>0&&select.split(',').every(c=>columns[table]?.split(',').includes(c));}
 function requestAllowed(url,method,body){try{const c=identity(),name=url.pathname.split('/').pop();
  if(url.pathname.startsWith('/rest/v1/rpc/')){if(!isStaff(c)||!rpcNames.includes(name))return false;if(method!=='POST'||typeof body!=='string')return false;let a;try{a=JSON.parse(body);}catch{return false;}if(name==='list_managed_tests')return Object.keys(a).length===0;if(name==='student_report')return Object.keys(a).join(',')==='p_student'&&students.has(a.p_student);return Object.keys(a).join(',')==='p_test_id'&&tests.has(String(a.p_test_id));}
  if(!url.pathname.startsWith('/rest/v1/')||method!=='GET'||!safeSelect(name,url.searchParams.get('select')))return false;
  const eq=k=>url.searchParams.get(k),own='eq.'+c.id;
  if(name==='profiles')return c.role==='director'||eq('id')===own||c.role==='teacher'&&eq('teacher_id')===own;
  if(name==='classes')return isStaff(c);
  if(name==='tests')return c.role==='director'||c.role==='teacher'&&eq('created_by')===own||c.role==='student'&&/^in\.\([0-9,]+\)$/.test(eq('id')||'')&&(eq('id').slice(4,-1).split(',').every(id=>assigned.has(id)));
  if(name==='test_assignments'||name==='submissions')return eq('user_id')===own;
  const id=(eq(name==='collections'?'user_id':'student_id')||'').replace(/^eq\./,'');
  return uuid(id)&&(id===c.id||isStaff(c)&&students.has(id))&&(name!=='consultation_plans'||isStaff(c)||eq('published')==='eq.true');
 }catch{return false;}}
 function client(auth,raw){
  async function execute(table,selection,filters,orders,single,invalid){try{
   if(!raw||invalid||!safeSelect(table,selection))return fail();const c=identity();const fs=filters.slice();
   if(table==='profiles'){if(c.role==='student')fs.push(['eq','id',c.id]);else if(c.role==='teacher'&&!fs.some(f=>f[0]==='eq'&&f[1]==='id'&&f[2]===c.id)){fs.push(['eq','teacher_id',c.id]);fs.push(['eq','role','student']);}}
   else if(table==='classes'){if(!isStaff(c))return fail();}
   else if(table==='tests'){if(c.role==='teacher')fs.push(['eq','created_by',c.id]);if(c.role==='student'&&!fs.some(f=>f[0]==='in'&&f[1]==='id'&&f[2].every(id=>positive(id)&&assigned.has(String(id)))))return fail();}
   else if(['submissions','test_assignments'].includes(table))fs.push(['eq','user_id',c.id]);
   else {const key=table==='collections'?'user_id':'student_id',id=fs.find(f=>f[0]==='eq'&&f[1]===key)?.[2];if(!uuid(id))return fail();if(c.role==='student'){if(id!==c.id)return fail();if(table==='consultation_plans')fs.push(['eq','published',true]);}else if(!students.has(id))return fail('먼저 담당 학생 목록에서 학생을 선택해 주세요.');}
   let q=raw.from(table).select(selection);for(const [op,k,v] of fs)q=q[op](k,v);for(const [k,opt] of orders)q=q.order(k,opt);q=q.limit(1000);if(single)q=q[single]();const r=await q;check(c);if(r.error)return fail('조회하지 못했습니다. 권한 또는 연결 계약을 확인해 주세요.');
   if(table==='profiles'){for(const p of Array.isArray(r.data)?r.data:[r.data])if(p&&uuid(p.id)&&p.id!==c.id)students.add(p.id);}
   if(['test_assignments','submissions'].includes(table)&&Array.isArray(r.data))for(const row of r.data)if(row.user_id===c.id&&positive(row.test_id))assigned.add(String(row.test_id));
   return r;
  }catch{return fail('조회가 실패했거나 계정이 바뀌었습니다. 다시 열어 주세요.');}}
  function from(table){let selection='',filters=[],orders=[],invalid=!Object.hasOwn(columns,table);const q={select(s){selection=s;return q;},eq(k,v){if(!columns[table]?.split(',').includes(k)||!['string','number','boolean'].includes(typeof v))invalid=true;filters.push(['eq',k,v]);return q;},in(k,v){if(!columns[table]?.split(',').includes(k)||!Array.isArray(v)||v.length>1000||v.some(x=>!['string','number'].includes(typeof x)))invalid=true;filters.push(['in',k,v]);return q;},order(k,opt){if(!columns[table]?.split(',').includes(k))invalid=true;orders.push([k,opt]);return q;},limit(n){if(!Number.isInteger(n)||n<1||n>1000)invalid=true;return q;},range(){invalid=true;return q;},then(ok,bad){return execute(table,selection,filters,orders,null,invalid).then(ok,bad);},single(){return execute(table,selection,filters,orders,'single',invalid);},maybeSingle(){return execute(table,selection,filters,orders,'maybeSingle',invalid);}};for(const op of ['insert','upsert','update','delete','or','not','neq','is','match','gte','lte'])q[op]=()=>{invalid=true;return q;};return q;}
  async function rpc(name,args={}){try{const c=identity();if(!raw||!isStaff(c)||!rpcNames.includes(name))return fail();if(name==='list_managed_tests'){if(Object.keys(args).length)return fail();}else if(name==='student_report'){if(Object.keys(args).join(',')!=='p_student'||!uuid(args.p_student)||!students.has(args.p_student))return fail('담당 학생 목록에서 학생을 선택해 주세요.');}else if(Object.keys(args).join(',')!=='p_test_id'||!positive(args.p_test_id)||!tests.has(String(args.p_test_id)))return fail('테스트 목록에서 먼저 시험을 선택해 주세요.');
   const r=await raw.rpc(name,args);check(c);if(r.error)return fail('조회 계약 또는 권한을 확인할 수 없습니다. 다른 경로로 재시도하지 않았습니다.');if(!Array.isArray(r.data))return fail('조회 응답 형식이 올바르지 않습니다.');if(name==='list_managed_tests'){const rows=r.data.filter(t=>c.role==='director'||t.created_by===c.id);tests=new Set(rows.map(t=>String(t.id)));return {data:rows,error:null};}return r;
  }catch{return fail('조회가 실패했거나 계정이 바뀌었습니다.');}}
  return {auth,from,rpc,functions:{invoke:async()=>fail()},storage:{from:()=>({list:async()=>fail(),download:async()=>fail(),createSignedUrl:async()=>fail(),upload:async()=>fail(),remove:async()=>fail()})}};
 }
 root.MvpOperationalGate=Object.freeze({client,requestAllowed,columns});
 root.addEventListener?.('mvp-session-reset',()=>{scope='';students.clear();tests.clear();assigned.clear();});
 root.MvpContentTargets={async read(){const c=identity();if(!isStaff(c))throw Error('강사·원장 전용입니다.');const client=root.MvpBackend.client;const [p,k]=await Promise.all([client.from('profiles').select('id,name,role,class_id,teacher_id').eq('role','student').order('name'),client.from('classes').select('id,name').order('id')]);check(c);if(p.error||k.error)throw Error('반·학생 목록을 조회하지 못했습니다. 비공개로 보관하고 다시 확인해 주세요.');const ids=new Set(p.data.map(s=>String(s.class_id)));return {students:p.data.map(s=>({id:s.id,name:s.name||'이름 미설정'})),classes:k.data.filter(k=>c.role==='director'||ids.has(String(k.id))).map(k=>({id:String(k.id),name:k.name}))};}};
})(window);

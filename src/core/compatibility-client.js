(function(root){
 'use strict';
 // Existing-schema adapter. Client checks complement (never replace) database RLS.
 const contract='legacy-compatible-v1';
 const fields={
  profiles:'id,name,nickname,student_no,role,class_id,teacher_id,pw_changed',classes:'id,name',
  tests:'id,title,total,exam_date,closed,created_by,created_at,answers,types,points,levels',
  submissions:'id,test_id,user_id,score,correct_count,answers,created_at',test_assignments:'test_id,user_id',
  collections:'user_id,jun,kill,god,gold,silver,bronze,perfect',
  mock_scores:'id,student_id,exam_year,exam_type,score_data,wrong_items,source_mode,created_at,updated_at',
  consultation_plans:'id,student_id,counselor_id,plan_data,counselor_note,published,created_at,updated_at',
  personal_ddays:'id,user_id,title,date,icon',photocards:'id,title,rarity,image,in_pool,created_at',
  photocard_awards:'card_id,user_id,deco',pc_prefs:'user_id,bg_card_id,bg_scope,bg_pos',
  viewer_groups:'id,name,subtitle,color,sort_order,published',
  viewer_materials:'id,group_id,title,row_key,label,kind,storage_path,bytes,sort_order,published',
  viewer_group_classes:'group_id,class_id'
 };
 const writable={profiles:'name,class_id,teacher_id,pw_changed',classes:'name',tests:'title,total,exam_date,created_by,answers,types,points,levels,closed',test_assignments:'test_id,user_id',mock_scores:'student_id,exam_year,exam_type,score_data,wrong_items,source_mode',consultation_plans:'student_id,counselor_id,plan_data,counselor_note,published',personal_ddays:'user_id,title,date,icon',photocards:'title,rarity,image,in_pool',photocard_awards:'card_id,user_id,deco',pc_prefs:'user_id,bg_card_id,bg_scope,bg_pos',viewer_groups:'name,subtitle,color,sort_order,published',viewer_materials:'group_id,title,row_key,label,kind,storage_path,bytes,sort_order,published',viewer_group_classes:'group_id,class_id'};
 const rpcArgs={list_managed_tests:[],staff_test_submissions:['p_test_id'],student_report:['p_student'],test_wrong_matrix:['p_test_id'],submit_answers:['p_test_id','p_answers'],close_test:['p_test_id'],teacher_regrade:['p_test_id','p_user_id','p_answers'],teacher_update_key:['p_test_id','p_answers','p_types','p_points','p_levels'],my_wrong_items:['p_test_id'],my_wrong_history:[],my_rank:['p_test_id'],hall_of_fame:['p_test_id'],award_solo_medals:['p_test_id'],claim_photocard:['p_test_id'],mock_submissions:['p_test_id'],set_my_nickname:['p_nick'],set_my_profile:['p_name','p_class_id']};
 const staffRpc=new Set(['list_managed_tests','staff_test_submissions','student_report','test_wrong_matrix','close_test','teacher_regrade','teacher_update_key','award_solo_medals']);
 const originalRpcNames=Object.keys(rpcArgs);
 const sharedRpcArgs={staff_test_detail:['p_test_id'],mock_item_analysis:['p_test_id'],delete_class:['p_class_id'],staff_account_statuses:[]};
 const leases=new Set();
 const fail=()=>({data:null,error:{message:'요청을 완료하지 못했습니다. 계정 권한 또는 기존 서버 연결을 확인해 주세요.'}});
 const uuid=v=>typeof v==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
 const positive=v=>/^[1-9]\d*$/.test(String(v))&&Number.isSafeInteger(Number(v));
 const plain=v=>v&&typeof v==='object'&&!Array.isArray(v)&&![...Object.keys(v)].some(k=>['__proto__','constructor','prototype'].includes(k));
 const staff=c=>c.role==='teacher'||c.role==='director';
 function context(){const c=root.AppSession?.context();if(!c||c.mode!=='server'||c.operations!==contract||!uuid(c.id)||!['student','teacher','director'].includes(c.role))throw Error();return {...c};}
 function current(c){const n=context();if(n.id!==c.id||n.role!==c.role||n.epoch!==c.epoch)throw Error();}
 function requestAllowed(url,method){try{for(const lease of leases){current(lease.context);if(lease.method===method&&lease.path===decodeURIComponent(url.pathname)&&lease.query(url.searchParams))return true;}}catch{}return false;}
 async function run(c,route,method,operation,query=()=>true){current(c);const lease={context:c,path:route,method,query};leases.add(lease);try{const r=await operation();current(c);return r?.error?fail():r;}catch{return fail();}finally{leases.delete(lease);}}
 const cleanPath=p=>typeof p==='string'&&p.length>0&&p.length<1024&&!p.startsWith('/')&&!/[\\\u0000-\u001f?#%]/.test(p)&&p.split('/').every(s=>s&&s!=='.'&&s!=='..');
 function client(auth,raw,options={}){
  // Select an observed schema explicitly; permission or network errors never select a different schema.
  const schema=options.schema||'owned-tests-v1';
  if(!['owned-tests-v1','shared-tests-v1'].includes(schema))throw Error('지원하지 않는 데이터 계약입니다.');
  const shared=schema==='shared-tests-v1';
  const tableFields={...fields},writeFields={...writable};
  if(shared){
   tableFields.tests=fields.tests.split(',').filter(k=>k!=='created_by').join(',');
   writeFields.tests=writable.tests.split(',').filter(k=>k!=='created_by').join(',');
   tableFields.submissions=fields.submissions.replace('created_at','submitted_at');
   tableFields.collections=fields.collections+',solo,updated_at';
  }
  async function probe(c,table,select,filters){return run(c,'/rest/v1/'+table,'GET',()=>{let q=raw.from(table).select(select);for(const [op,k,v]of filters)q=q[op](k,v);return q.limit(1);});}
  async function student(c,id){if(!uuid(id))throw Error();if(c.role==='director')return;if(c.role!=='teacher')throw Error();const r=await probe(c,'profiles','id',[['eq','id',id],['eq','role','student'],['eq','teacher_id',c.id]]);if(r.error||!r.data?.length)throw Error();}
  async function exam(c,id,assignedOnly=false){if(!positive(id))throw Error();if(c.role==='director')return;if(c.role==='teacher'){const r=await probe(c,'tests','id',[['eq','id',id],...(shared?[]:[['eq','created_by',c.id]])]);if(r.error||!r.data?.length)throw Error();}else{const r=await probe(c,'test_assignments','test_id',[['eq','test_id',id],['eq','user_id',c.id]]);if(r.error)throw Error();if(!r.data?.length){if(assignedOnly)throw Error();const prior=await probe(c,'submissions','test_id',[['eq','test_id',id],['eq','user_id',c.id]]);if(prior.error||!prior.data?.length)throw Error();}}}
  function from(table){
   let op='select',selection=null,data,options={},selectOptions={},filters=[],orders=[],single=null,limit=null,bounds=null,invalid=!Object.hasOwn(tableFields,table);
   const q={select(s='*',opts={}){selection=s;selectOptions=opts;return q;},order(k,o={}){if(!tableFields[table]?.split(',').includes(k))invalid=true;orders.push([k,o]);return q;},limit(n){if(!Number.isInteger(n)||n<1||n>10000)invalid=true;limit=n;return q;},range(a,b){if(!Number.isInteger(a)||!Number.isInteger(b)||a<0||b<a||b-a>=10000)invalid=true;bounds=[a,b];return q;},single(){single='single';return execute();},maybeSingle(){single='maybeSingle';return execute();},then(ok,bad){return execute().then(ok,bad);}};
   for(const kind of ['eq','in','is','neq','gte','lte'])q[kind]=(k,v)=>{if(!tableFields[table]?.split(',').includes(k)||kind==='in'&&(!Array.isArray(v)||v.length>100000||v.some(x=>!['string','number'].includes(typeof x)))||kind!=='in'&&v!==null&&!['string','number','boolean'].includes(typeof v))invalid=true;filters.push([kind,k,v]);return q;};
   for(const kind of ['insert','upsert','update','delete'])q[kind]=(value,opts={})=>{if(op!=='select')invalid=true;op=kind;data=value;options=opts;return q;};
   for(const kind of ['or','not','match'])q[kind]=()=>{invalid=true;return q;};
   async function execute(){try{
    const c=context();if(invalid)throw Error();const writing=op!=='select',fs=filters.map(f=>f.slice());
    const large=fs.filter(f=>f[0]==='in'&&f[2].length>200);
    if(large.length){
     if(writing||large.length>1||bounds||limit||single||selectOptions.head)throw Error();
     const target=large[0],values=[...new Set(target[2])],all=[];
     for(let offset=0;offset<values.length;offset+=200){let part=from(table).select(selection||'*',selectOptions);for(const f of fs)part=part[f[0]](f[1],f===target?values.slice(offset,offset+200):f[2]);for(const order of orders)part=part.order(...order);const r=await part;current(c);if(r.error||!Array.isArray(r.data))return fail();all.push(...r.data);}
     if(orders.length)all.sort((a,b)=>{for(const [key,opt]of orders){if(a[key]===b[key])continue;const n=a[key]<b[key]?-1:1;return opt.ascending===false?-n:n;}return 0;});
     return{data:all,error:null};
    }
    const eq=k=>fs.find(f=>f[0]==='eq'&&f[1]===k)?.[2],force=(k,v)=>{if(eq(k)!==undefined&&eq(k)!==v)throw Error();fs.push(['eq',k,v]);};
    let rows=writing&&op!=='delete'?(Array.isArray(data)?data:[data]).map(v=>{if(!plain(v))throw Error();return {...v};}):[];
    if(rows.length>1000||writing&&op!=='delete'&&!rows.length)throw Error();
    if(writing&&op!=='delete'&&rows.some(r=>Object.keys(r).some(k=>!writeFields[table]?.split(',').includes(k))))throw Error();
    if(writing&&['update','delete'].includes(op)&&!filters.length)throw Error();
    if(table==='profiles'){
     if(!writing){if(c.role==='student')force('id',c.id);else if(c.role==='teacher'&&eq('id')!==c.id)force('teacher_id',c.id);}
     else{if(op!=='update')throw Error();if(eq('id')===c.id){if(rows.some(r=>Object.keys(r).some(k=>k!=='pw_changed'&&!(staff(c)&&k==='name'))||'pw_changed'in r&&r.pw_changed!==true))throw Error();}
      else{if(!staff(c)||rows.some(r=>Object.keys(r).some(k=>!['name','class_id','teacher_id'].includes(k))))throw Error();if(c.role==='teacher'){await student(c,eq('id'));force('teacher_id',c.id);if(rows.some(r=>'teacher_id'in r))throw Error();}else if(!eq('id')&&eq('class_id')===undefined)throw Error();}}
    }else if(table==='tests'){
     if(writing&&!staff(c))throw Error();if(rows.some(r=>'closed'in r&&(op!=='insert'||r.closed!==false)))throw Error();if(c.role==='teacher'&&!shared){
      if(op==='insert'||op==='upsert')rows.forEach(r=>{if(r.created_by&&r.created_by!==c.id)throw Error();r.created_by=c.id;});else force('created_by',c.id);
     }else if(c.role==='student'){const ids=eq('id')!==undefined?[eq('id')]:fs.find(f=>f[0]==='in'&&f[1]==='id')?.[2];if(!ids)throw Error();for(const id of ids)await exam(c,id);}
     if(writing&&['update','delete'].includes(op)&&!positive(eq('id')))throw Error();
     if(writing&&['update','delete'].includes(op))await exam(c,eq('id'));
    }else if(table==='submissions'||table==='test_assignments'){
     if(c.role==='student'){if(writing)throw Error();force('user_id',c.id);}else if(writing){if(table==='submissions'&&op!=='delete')throw Error();for(const r of rows){await exam(c,r.test_id??eq('test_id'));if(r.user_id)await student(c,r.user_id);}if(!rows.length)await exam(c,eq('test_id'));}
     else if(eq('test_id')!==undefined){await exam(c,eq('test_id'));if(shared&&table==='submissions'&&c.role==='teacher'){
      const students=await from('profiles').select('id').eq('role','student');current(c);if(students.error||!Array.isArray(students.data))throw Error();
      const ids=students.data.map(row=>row.id).filter(id=>fs.filter(f=>f[1]==='user_id').every(([kind,,v])=>kind==='eq'?id===v:kind==='in'?v.includes(id):true));if(!ids.length)return{data:single?null:[],error:null};
      if(ids.length>200){let scoped=from(table).select(selection||'*',selectOptions).in('user_id',ids);for(const f of fs)scoped=scoped[f[0]](f[1],f[2]);for(const o of orders)scoped=scoped.order(...o);if(single||limit||bounds)throw Error();return await scoped;}
      fs.push(['in','user_id',ids]);
     }}else if(c.role==='teacher')throw Error();
    }else if(table==='mock_scores'||table==='consultation_plans'||table==='collections'){
     const key=table==='collections'?'user_id':'student_id';
     if(writing){if(table==='collections')throw Error();if(table==='mock_scores'){if(op==='insert'||op==='upsert')rows.forEach(r=>{if(r.student_id!==c.id)throw Error();});else force(key,c.id);}else{if(!staff(c))throw Error();for(const r of rows){await student(c,r.student_id??eq(key));if(r.counselor_id&&r.counselor_id!==c.id)throw Error();r.counselor_id=c.id;}if(!rows.length)await student(c,eq(key));}}
     else if(c.role==='student'){force(key,c.id);if(table==='consultation_plans')force('published',true);}else{if(eq(key)!==c.id)await student(c,eq(key));}
    }else if(table==='personal_ddays'||table==='pc_prefs'){
     if(op==='insert'||op==='upsert')rows.forEach(r=>{if(r.user_id!==c.id)throw Error();});else force('user_id',c.id);
    }else if(table==='photocard_awards'){
     if(!writing||op==='update'){force('user_id',c.id);if(writing&&rows.some(r=>Object.keys(r).some(k=>k!=='deco')))throw Error();}else if(c.role!=='director'||!['insert','upsert'].includes(op))throw Error();
    }else if(table==='photocards'){if(writing&&c.role!=='director')throw Error();}
    else if(table.startsWith('viewer_')){if(writing&&!staff(c))throw Error();if(!writing&&c.role==='student'&&table!=='viewer_group_classes')force('published',true);}
    else if(table==='classes'){if(writing&&!staff(c)||op==='delete'&&c.role!=='director')throw Error();}
    else throw Error();
    let allowed=tableFields[table].split(',');if(table==='tests'&&(shared||c.role==='student'))allowed=allowed.filter(k=>k!=='answers');
    const selected=selection===null?(writing?null:allowed):selection==='*'?allowed:selection.split(',');
    if(selected&&(!selected.length||selected.some(k=>!allowed.includes(k))))throw Error();
    if(options.onConflict&&options.onConflict.split(',').some(k=>!tableFields[table].split(',').includes(k)))throw Error();
    const route='/rest/v1/'+table,method=writing?op==='delete'?'DELETE':op==='update'?'PATCH':'POST':selectOptions.head?'HEAD':'GET';
    const payload=Array.isArray(data)?rows:rows[0];
    async function page(start){return run(c,route,method,()=>{
     let rawQuery=raw.from(table);if(writing)rawQuery=op==='delete'?rawQuery.delete():rawQuery[op](payload,options);
     if(selected)rawQuery=rawQuery.select(selected.join(','),selectOptions);
     for(const [kind,k,v]of fs)rawQuery=rawQuery[kind](k,v);
     for(const [k,o]of orders)rawQuery=rawQuery.order(k,o);
     if(single)rawQuery=rawQuery[single]();else if(bounds)rawQuery=rawQuery.range(...bounds);else if(limit)rawQuery=rawQuery.limit(limit);else if(!writing&&!selectOptions.head){const keys=({test_assignments:['test_id','user_id'],photocard_awards:['card_id','user_id'],viewer_group_classes:['group_id','class_id']})[table]||[tableFields[table].split(',')[0]];for(const key of keys)if(!orders.some(o=>o[0]===key))rawQuery=rawQuery.order(key,{ascending:true});rawQuery=rawQuery.range(start,start+499);}
     return rawQuery;
    },params=>fs.every(([kind,k,v])=>params.getAll(k).includes(kind==='in'?'in.('+v.join(',')+')':kind+'.'+v))&&(!selected||params.get('select')===selected.join(',')));}
    const first=await page(0);if(first.error||writing||single||bounds||limit||selectOptions.head||!Array.isArray(first.data))return first;
    let result=first.data.slice(),count=first.data.length;while(count===500){if(result.length>=100000)return fail();const next=await page(result.length);if(next.error||!Array.isArray(next.data))return fail();result.push(...next.data);count=next.data.length;}return {...first,data:result};
   }catch{return fail();}}
   return q;
  }
  async function rpc(name,args={}){try{
   const c=context(),keys=rpcArgs[name]||(shared?sharedRpcArgs[name]:null);if(!keys||!plain(args)||Object.keys(args).sort().join()!==keys.slice().sort().join())throw Error();
   const staffOnly=staffRpc.has(name)||name==='staff_test_detail'||shared&&name==='mock_submissions';
   if(name==='delete_class'||name==='staff_account_statuses'){if(c.role!=='director'||name==='delete_class'&&!positive(args.p_class_id))throw Error();}
   else{if(staffOnly&&!staff(c))throw Error();if(!staffOnly&&name!=='mock_submissions'&&c.role!=='student')throw Error();}
   if(shared&&name==='list_managed_tests')return await from('tests').select('id,title,total,exam_date,closed').order('exam_date',{ascending:false}).order('id',{ascending:false});
   if(shared&&name==='staff_test_submissions')return await from('submissions').select('user_id,score,correct_count,answers').eq('test_id',args.p_test_id);
   if('p_test_id'in args)await exam(c,args.p_test_id,name==='submit_answers');if('p_student'in args)await student(c,args.p_student);if('p_user_id'in args)await student(c,args.p_user_id);
   if('p_answers'in args&&(!Array.isArray(args.p_answers)||args.p_answers.length>100||args.p_answers.some(v=>typeof v!=='string'||v.length>200)))throw Error();
   if(name==='teacher_update_key'&&['p_types','p_points','p_levels'].some(k=>!Array.isArray(args[k])||args[k].length!==args.p_answers.length))throw Error();
   if(name==='set_my_profile'&&(typeof args.p_name!=='string'||args.p_name.length>100||args.p_class_id!==null&&!positive(args.p_class_id)))throw Error();
   if(name==='set_my_nickname'&&(typeof args.p_nick!=='string'||args.p_nick.length>100))throw Error();
   const r=await run(c,'/rest/v1/rpc/'+name,'POST',()=>raw.rpc(name,args));
   if(!r.error&&name==='list_managed_tests'&&c.role==='teacher'){if(!Array.isArray(r.data))return fail();return {...r,data:r.data.filter(t=>t.created_by===c.id)};}return r;
  }catch{return fail();}}
  async function storage(bucket,kind,value,options){try{
   const c=context();if(bucket!=='viewer')throw Error();const write=['upload','remove'].includes(kind);if(write&&!staff(c))throw Error();
   const paths=kind==='remove'?value:[value];if(!Array.isArray(paths)||!paths.length||paths.length>1000||paths.some(p=>!cleanPath(p)))throw Error();
   if(!write){const r=await probe(c,'viewer_materials','id',[['eq','storage_path',value],...(c.role==='student'?[['eq','published',true]]:[])]);if(r.error||!r.data?.length)throw Error();}
   const base='/storage/v1/object/',route=kind==='remove'?base+bucket:kind==='createSignedUrl'?base+'sign/'+bucket+'/'+value:base+bucket+'/'+value;
   const method=kind==='download'?'GET':kind==='remove'?'DELETE':'POST';
   if(kind==='createSignedUrl'&&(!Number.isInteger(options)||options<1||options>3600))throw Error();
   return await run(c,route,method,()=>raw.storage.from(bucket)[kind](value,options));
  }catch{return fail();}}
  async function invoke(name,opts){try{
   const c=context(),b=opts?.body;if(c.role!=='director'||name!=='quick-action'||!plain(b))throw Error();
   if(['suspend','restore'].includes(b.action)){
    if(!shared||Object.keys(b).sort().join()!=='action,id'||!uuid(b.id)||b.id===c.id)throw Error();
    if(b.action==='suspend'){const target=await probe(c,'profiles','id,role',[['eq','id',b.id]]);if(target.error||target.data?.length!==1||!['student','teacher'].includes(target.data[0].role))throw Error();}
   }
   else if(b.action==='delete'){if(Object.keys(b).sort().join()!=='action,ids'||!Array.isArray(b.ids)||!b.ids.length||b.ids.length>100||b.ids.some(id=>!uuid(id)||id===c.id))throw Error();}
   else if(b.action==='reset_password'){if(Object.keys(b).sort().join()!=='action,id,password'||!uuid(b.id)||typeof b.password!=='string'||b.password.length<6||b.password.length>256)throw Error();}
   else{if(Object.keys(b).sort().join()!=='count,password,prefix,role'||!['student','teacher'].includes(b.role)||!Number.isInteger(b.count)||b.count<1||b.count>100||typeof b.prefix!=='string'||b.prefix.length>80||typeof b.password!=='string'||b.password.length<6||b.password.length>256)throw Error();}
   return await run(c,'/functions/v1/'+name,'POST',()=>raw.functions.invoke(name,{body:b}));
  }catch{return fail();}}
  const wrappedAuth={...auth,updateUser:async data=>{try{const c=context();if(!plain(data)||Object.keys(data).join()!=='password'||typeof data.password!=='string'||data.password.length<6||data.password.length>256)throw Error();return await run(c,'/auth/v1/user','PUT',()=>raw.auth.updateUser(data));}catch{return fail();}}};
  return{schema,fields:Object.freeze({...tableFields}),auth:wrappedAuth,from,rpc,functions:{invoke},storage:{from:bucket=>({createSignedUrl:(p,seconds)=>storage(bucket,'createSignedUrl',p,seconds),download:p=>storage(bucket,'download',p),upload:async(p,file,options)=>{try{const c=context();if(bucket!=='viewer'||!staff(c)||!cleanPath(p)||!file||!Number.isFinite(file.size)||file.size>100*1024*1024||!['application/pdf','text/html'].includes(options?.contentType)||options?.upsert!==false)throw Error();return await run(c,'/storage/v1/object/'+bucket+'/'+p,'POST',()=>raw.storage.from(bucket).upload(p,file,options));}catch{return fail();}},remove:paths=>storage(bucket,'remove',paths)})}};
 }
 root.MvpCompatibility=Object.freeze({contract,client,requestAllowed,fields,rpcNames:originalRpcNames,sharedRpcNames:Object.keys(sharedRpcArgs)});
 root.addEventListener?.('mvp-session-reset',()=>leases.clear());
})(window);

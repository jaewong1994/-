(function(root){
 'use strict';
 // Synthetic adapter: cannot create a remote client or send production data.
 let session=root.MvpAuth.getSession();const listeners=new Set();let rows={};
 root.MvpAuth.subscribe((event,value)=>{session=value;listeners.forEach(fn=>fn(event,value));});
 const users={student:{id:'00000000-0000-4000-8000-000000000001',role:'student',name:'체험 학생',class_id:1,teacher_id:'00000000-0000-4000-8000-000000000002',student_no:'DEMO01'},teacher:{id:'00000000-0000-4000-8000-000000000002',role:'teacher',name:'체험 강사'},director:{id:'00000000-0000-4000-8000-000000000003',role:'director',name:'체험 원장'}};
 function reset(){rows={profiles:Object.values(users).map(x=>({...x})),classes:[{id:1,name:'체험반'}],mock_scores:[],consultation_plans:[],tests:[],submissions:[],test_assignments:[],viewer_groups:[],viewer_group_classes:[],viewer_materials:[],personal_ddays:[],photocards:[],student_photocards:[]};}reset();
 function current(){session=root.MvpAuth.getSession();return rows.profiles.find(p=>p.id===session?.user.id);}
 function visible(table){let data=rows[table]||[];const p=current();if(!p)return[];if(table==='profiles'&&p.role==='student')return data.filter(x=>x.id===p.id);if(['mock_scores','submissions','consultation_plans','personal_ddays'].includes(table)&&p.role==='student')return data.filter(x=>(x.student_id||x.profile_id||x.user_id)===p.id&&(table!=='consultation_plans'||x.is_public));return data;}
 class Query{
  constructor(table){this.table=table;this.filters=[];this.op='select';}
  select(){return this;}eq(k,v){this.filters.push(x=>x[k]===v);return this;}neq(k,v){this.filters.push(x=>x[k]!==v);return this;}in(k,v){this.filters.push(x=>v.includes(x[k]));return this;}is(k,v){return this.eq(k,v);}order(){return this;}limit(){return this;}range(){return this;}or(){return this;}
  insert(value){this.op='insert';this.value=value;return this;}upsert(value){this.op='upsert';this.value=value;return this;}update(value){this.op='update';this.value=value;return this;}delete(){this.op='delete';return this;}
  async result(){
   if(!root.MvpAuth.getSession())return{data:null,error:{message:'로그인이 필요합니다.'}};
   let data=visible(this.table).filter(x=>this.filters.every(f=>f(x)));
   if(this.op!=='select')return{data:null,error:{message:'운영 쓰기는 연결하지 않았습니다. 학습 MVP 체험은 별도 저장소를 사용합니다.'}};
   return{data:structuredClone(data),error:null};
  }
  then(ok,fail){return this.result().then(ok,fail);}async maybeSingle(){const r=await this.result();return{...r,data:r.data?.[0]??null};}single(){return this.maybeSingle();}
 }
 const client={from:t=>new Query(t),rpc:async(name,args={})=>!['teacher','director'].includes(current()?.role)?{data:null,error:{message:'강사·원장 전용 조회입니다.'}}:name==='list_managed_tests'?{data:rows.tests.map(t=>({...t})),error:null}:name==='staff_test_submissions'?{data:[],error:null}:name==='student_report'&&args.p_student===users.student.id?{data:[],error:null}:{data:null,error:{message:'이 기능의 서버 계약은 검증 전입니다.'}},functions:{invoke:async()=>({data:null,error:{message:'계정 발급·삭제·비밀번호 초기화는 서버 검증 전 사용할 수 없습니다.'}})},storage:{from:()=>({list:async()=>({data:[],error:null}),download:async()=>({data:null,error:{message:'체험 자료가 없습니다.'}}),createSignedUrl:async()=>({data:null,error:{message:'체험 자료가 없습니다.'}}),upload:async()=>({data:null,error:{message:'원격 업로드는 연결하지 않았습니다.'}})})},auth:{getSession:async()=>({data:{session:root.MvpAuth.getSession()},error:null}),getUser:async()=>({data:{user:root.MvpAuth.getSession()?.user||null},error:null}),onAuthStateChange(fn){listeners.add(fn);return{data:{subscription:{unsubscribe:()=>listeners.delete(fn)}}};},signInWithPassword:async()=>({data:{session:null},error:{message:'실계정 로그인을 연결하지 않았습니다.'}}),signOut:async()=>{root.MvpAuth.signOut();return{error:null};},updateUser:async()=>({error:{message:'실계정 변경은 연결하지 않았습니다.'}})}};
 root.MvpBackend={client,preview:true,role:()=>current()?.role||null,signInAccount:accountId=>root.MvpAuth.signIn(accountId),reset};
})(window);

async function readStaffTest(id){
 if(!window.AppSession?.can('manage-tests'))return{data:null,error:{message:'권한이 없습니다.'}};
 if(AppSession.context()?.operations==='legacy-compatible-v1'){
  const client=sbReady(),columns='id,title,total,exam_date,closed,answers,types,points,levels';
  if(client.schema==='shared-tests-v1')return client.rpc('staff_test_detail',{p_test_id:id});
  return client.from('tests').select(columns+',created_by').eq('id',id).single();
 }
 return sbReady().rpc('staff_test_detail',{p_test_id:id});
}

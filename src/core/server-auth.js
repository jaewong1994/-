(function(root){
 'use strict';
 // User confirmed no separate suspension policy. Allow only server-verified identity + own known-role profile.
 const ACCOUNT_POLICY='verified-auth-profile-v1';
 function create({client,accountPolicy=ACCOUNT_POLICY,verifyAccount}){
  if(!client?.auth||accountPolicy!==ACCOUNT_POLICY||(verifyAccount!==undefined&&typeof verifyAccount!=='function'))throw Error('서버 인증 및 계정 정책을 확인해 주세요.');
  let revision=0,state={status:'signed-out',session:null,profile:null},disposed=false,blocked=false;
  const listeners=new Set();
  const publish=value=>{state=value;listeners.forEach(fn=>fn(state));};
  function lock(status='checking'){publish({status,session:null,profile:null});}
  async function validate(candidate){
   const token=++revision;lock(candidate?'checking':'signed-out');if(!candidate)return state;
   try{
    // getSession is a persistence hint only. getUser validates identity with the auth service.
    const identity=await client.auth.getUser();if(token!==revision||disposed)return state;
    if(identity.error||typeof identity.data?.user?.id!=='string'||!identity.data.user.id||identity.data.user.id!==candidate.user?.id)throw Error('identity');
    const uid=identity.data.user.id;
    const result=await client.from('profiles').select('id,name,role,class_id,teacher_id,student_no').eq('id',uid).maybeSingle();
    if(token!==revision||disposed)return state;
    const profile=result.data;
    if(result.error||!profile||profile.id!==uid||!['student','teacher','director'].includes(profile.role))throw Error('profile');
    // No fabricated active flag or status RPC. Optional future restrictions can only narrow access.
    if(verifyAccount){
     const permission=await verifyAccount({userId:uid,profile:Object.freeze({...profile})});if(token!==revision||disposed)return state;
     if(permission?.active!==true||permission.userId!==uid)throw Error('inactive');
    }
    publish({status:'signed-in',session:{user:{id:uid}},profile:Object.freeze({...profile})});return state;
   }catch{if(token===revision&&!disposed)lock('denied');return state;}
  }
  async function restore(){if(blocked)return state;const token=++revision;lock();try{const result=await client.auth.getSession();if(token!==revision||disposed)return state;if(result.error)throw Error('session');return validate(result.data?.session||null);}catch{if(token===revision&&!disposed)lock('denied');return state;}}
  async function signIn({email,password}){
   blocked=false;const token=++revision;lock();
   if(typeof email!=='string'||!email.trim()||typeof password!=='string'||!password){lock('denied');return state;}
   try{const result=await client.auth.signInWithPassword({email:email.trim(),password});if(token!==revision||disposed)return state;if(result.error)throw Error('credentials');return await validate(result.data?.session||null);}catch{if(token===revision&&!disposed)lock('denied');return state;}
  }
  async function signOut(){blocked=true;++revision;lock('signed-out');try{const result=await client.auth.signOut({scope:'local'});return{error:result.error?{message:'서버 로그아웃 확인에 실패했습니다. 이 화면은 잠겨 있습니다.'}:null};}catch{return{error:{message:'서버 로그아웃 확인에 실패했습니다. 이 화면은 잠겨 있습니다.'}};}}
  const subscription=client.auth.onAuthStateChange((event,session)=>{
   if(disposed||blocked)return;
   if(event==='SIGNED_OUT'){++revision;lock('signed-out');return;}
   // Leave the SDK auth callback before starting another auth call.
   if(['SIGNED_IN','TOKEN_REFRESHED','USER_UPDATED'].includes(event)){const token=++revision;lock();root.setTimeout(()=>{if(token===revision&&!disposed&&!blocked)void validate(session);},0);}
  }).data.subscription;
  return Object.freeze({mode:'server',restore,signIn,signOut,suspend(){blocked=true;++revision;lock('signed-out');},getState:()=>state,subscribe(fn){listeners.add(fn);return()=>listeners.delete(fn);},dispose(){disposed=true;++revision;subscription.unsubscribe();listeners.clear();}});
 }
 root.MvpServerAuth=Object.freeze({create,ACCOUNT_POLICY});
})(window);

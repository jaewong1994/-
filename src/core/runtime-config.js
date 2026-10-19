(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.MvpRuntimeConfig=api;})(typeof window==='undefined'?{}:window,function(){
 'use strict';
 const columns='id,name,role,class_id,teacher_id,student_no';
 function validate(input){
  const errors=[];let origin='';
  try{const u=new URL(input.url);if(u.protocol!=='https:'||u.username||u.password||u.search||u.hash||u.pathname!=='/'||u.port||!u.hostname.includes('.')||/^[\d.]+$/.test(u.hostname))throw Error();origin=u.origin;}catch{errors.push('MVP_AUTH_URL');}
  let publicKey=false;
  if(typeof input.publicKey==='string'){
   publicKey=/^sb_publishable_[A-Za-z0-9_-]{20,}$/.test(input.publicKey);
   if(!publicKey&&input.publicKey.split('.').length===3)try{const payload=JSON.parse(atob(input.publicKey.split('.')[1].replace(/-/g,'+').replace(/_/g,'/')));publicKey=payload.role==='anon';}catch{}
  }
  if(!publicKey)errors.push('MVP_AUTH_PUBLIC_KEY');
  return errors.length?{ok:false,errors}:{ok:true,config:{url:origin,publicKey:input.publicKey}};
 }
 function fromEnv(env){return validate({url:env.MVP_AUTH_URL,publicKey:env.MVP_AUTH_PUBLIC_KEY});}
 function guardedFetch(config,fetcher,allowRead=()=>false){return async(input,init={})=>{
  let u;try{u=new URL(typeof input==='string'||input instanceof URL?String(input):input.url);}catch{throw Error('인증 요청 경로를 확인할 수 없습니다.');}
  const method=String(init.method||(typeof input==='object'?input.method:null)||'GET').toUpperCase();
  let allowed=u.origin===config.url&&!u.username&&!u.password;
  const auth=u.pathname==='/auth/v1/user'&&method==='GET'||u.pathname==='/auth/v1/logout'&&method==='POST'||u.pathname==='/auth/v1/token'&&method==='POST'&&['password','refresh_token'].includes(u.searchParams.get('grant_type'));
  const profile=u.pathname==='/rest/v1/profiles'&&method==='GET'&&u.searchParams.get('select')===columns&&/^eq\.[\w-]+$/.test(u.searchParams.get('id')||'')&&[...u.searchParams.keys()].every(k=>['select','id'].includes(k));
  allowed=allowed&&(auth||profile||allowRead(u,method,init.body));if(!allowed)throw Error('인증 확인 외 운영 요청은 연결하지 않았습니다.');
  return fetcher(input,init);
 };}
 return Object.freeze({validate,fromEnv,guardedFetch});
});

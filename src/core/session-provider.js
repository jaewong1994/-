(function(root){
root.MvpProviderReady=(async function(){
 'use strict';
 // The local entry never provisions this. Tests inject a mock; production provisioning needs separate approval.
 const runtime=root.MvpAuthRuntime||await root.MvpRuntimeReady;
 if(runtime?.mode==='blocked'){root.MvpSessionProvider={mode:'blocked',session:()=>null,boot(){},signIn:async()=>({error:{message:'연결 설정을 확인할 수 없습니다. 다시 연결한 뒤 새로고침해 주세요.'}})};return;}
 if(!runtime){root.MvpSessionProvider={mode:'demo',session:()=>root.MvpAuth.getSession(),boot(){},signIn:input=>root.MvpBackend.signInAccount(input.accountId)};return;}
 if(runtime.mode!=='server'||!runtime.client)throw Error('인증 연결 구성을 확인해 주세요.');
 const adapter=root.MvpServerAuth.create(runtime),key=runtime.deploymentMode==='production'?'student-mvp-production-logout-v1':'student-mvp-server-logout-v1',listeners=new Set();let storedLogout=true;
 try{storedLogout=root.localStorage.getItem(key)==='1'||root.sessionStorage.getItem(key)==='1';root.localStorage.setItem(key+'-probe','1');root.localStorage.removeItem(key+'-probe');}catch{storedLogout=true;}
 if(storedLogout)adapter.suspend();
 adapter.subscribe(state=>{
  if(state.status==='signed-in'){try{root.localStorage.removeItem(key);root.sessionStorage.removeItem(key);}catch{}storedLogout=false;}
  listeners.forEach(fn=>fn(state.status==='signed-in'?'SIGNED_IN':'SIGNED_OUT',state.session));
 });
 const auth={getSession:async()=>({data:{session:adapter.getState().session},error:null}),getUser:async()=>({data:{user:adapter.getState().session?.user||null},error:null}),onAuthStateChange(fn){listeners.add(fn);return{data:{subscription:{unsubscribe:()=>listeners.delete(fn)}}};},signOut:async()=>{storedLogout=true;try{root.localStorage.setItem(key,'1');}catch{}try{root.sessionStorage.setItem(key,'1');}catch{}return adapter.signOut();},signInWithPassword:input=>adapter.signIn(input)};
 const compatible=runtime.operations===root.MvpCompatibility?.contract&&Boolean(root.MvpCompatibility);
 root.MvpBackend={preview:false,client:compatible?root.MvpCompatibility.client(auth,runtime.client,{schema:runtime.schema}):root.MvpOperationalGate.client(auth,runtime.client),role:()=>adapter.getState().profile?.role||null};
 root.MvpSessionProvider={mode:'server',operations:compatible?runtime.operations:null,appShell:compatible&&runtime.appShell===true,session:()=>adapter.getState().session,profile:()=>adapter.getState().profile,boot:()=>storedLogout?Promise.resolve():adapter.restore(),signIn:async input=>{
  const state=await adapter.signIn(input);return{error:state.status==='denied'?{message:'계정 또는 권한을 확인하지 못했습니다. 연결 상태를 확인해 주세요.'}:null,persisted:true};
 }};
 root.addEventListener('storage',event=>{if(event.key!==key&&event.key!==null)return;let mustLock=true;try{mustLock=root.localStorage.getItem(key)==='1';}catch{}if(mustLock){storedLogout=true;adapter.suspend();}});
})();
})(window);

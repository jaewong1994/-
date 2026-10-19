(function(root){
 'use strict';
 const key='student-mvp-review-session-v1', lifetime=30*24*60*60*1000;
 // Public synthetic IDs only. This repository is NOT a production authentication provider.
 const accounts=Object.freeze(Object.fromEntries(['student','teacher','director'].map((role,i)=>{
  const account=Object.freeze({accountId:'demo-'+role,id:'00000000-0000-4000-8000-00000000000'+(i+1),role,active:true});
  return [account.accountId,account];
 })));
 function create({storage,repository,now=Date.now}){
  let record=null,memoryOnly=false;const listeners=new Set();
  function resolve(value){
   if(!value||Object.keys(value).sort().join(',')!=='accountId,expiresAt,issuedAt,version'||value.version!==1||typeof value.accountId!=='string'||!Number.isFinite(value.issuedAt)||!Number.isFinite(value.expiresAt)||value.issuedAt>now()||value.expiresAt<=now()||value.expiresAt-value.issuedAt!==lifetime)return null;
   const account=repository.find(value.accountId);
   if(!account?.active||!['student','teacher','director'].includes(account.role))return null;
   return {user:{id:account.id},expiresAt:value.expiresAt};
  }
  function remove(){try{storage.removeItem(key);}catch{}}
  function getSession(){const session=resolve(record);if(!session&&record){record=null;remove();listeners.forEach(fn=>fn('SIGNED_OUT',null));}return session;}
  function restore(){if(memoryOnly)return getSession();try{record=JSON.parse(storage.getItem(key));}catch{record=null;remove();}const session=getSession();if(!session)remove();return session;}
  function signOut(){record=null;memoryOnly=false;remove();listeners.forEach(fn=>fn('SIGNED_OUT',null));}
  function signIn(accountId){
   signOut();const account=typeof accountId==='string'?repository.find(accountId.trim().toLowerCase()):null;
   if(!account?.active||!['student','teacher','director'].includes(account.role))return{error:{message:'체험 계정 ID를 확인해 주세요.'},session:null};
   const issuedAt=now();record={version:1,accountId:account.accountId,issuedAt,expiresAt:issuedAt+lifetime};
   let persisted=true;try{storage.setItem(key,JSON.stringify(record));}catch{persisted=false;memoryOnly=true;}
   const session=getSession();listeners.forEach(fn=>fn('SIGNED_IN',session));return{session,error:null,persisted};
  }
  function sync(external=false){const before=getSession();if(external)memoryOnly=false;const session=restore();if(before?.user.id!==session?.user.id||before?.expiresAt!==session?.expiresAt)listeners.forEach(fn=>fn(session?'SIGNED_IN':'SIGNED_OUT',session));}
  return {getSession,restore,signIn,signOut,sync,subscribe(fn){listeners.add(fn);return()=>listeners.delete(fn);}};
 }
 let storage;try{storage=root.localStorage;}catch{}storage=storage||{getItem:()=>null,setItem:()=>{throw Error('unavailable');},removeItem(){}};
 const repository=Object.freeze({find:id=>Object.hasOwn(accounts,id)?accounts[id]:null});
 const auth=create({storage,repository});auth.restore();
 root.MvpAuth={...auth,create,key};
 let expiryTimer;
 function schedule(){root.clearTimeout?.(expiryTimer);const session=auth.getSession();if(session)expiryTimer=root.setTimeout?.(()=>{auth.getSession();schedule();},Math.min(session.expiresAt-Date.now()+1,2147483647));}
 auth.subscribe(schedule);schedule();
 root.addEventListener?.('storage',event=>{if(event.key===key||event.key===null){auth.sync(true);schedule();}});
 root.document?.addEventListener('visibilitychange',()=>{if(!root.document.hidden){auth.sync();schedule();}});
})(window);

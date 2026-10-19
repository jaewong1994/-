(function(root){
 'use strict';
 async function bootstrap(){
  const required=document.documentElement?.dataset?.authMode==='server-required',intentKey=required?'student-mvp-production-intent-v1':'student-mvp-runtime-intent';
  const configVersion=document.documentElement?.dataset?.authConfigVersion;
  if(required&&(typeof configVersion!=='string'||!/^[0-9a-f]{16}$/.test(configVersion)))return{mode:'blocked'};
  if(typeof root.fetch!=='function')return required?{mode:'blocked'}:null;
  const controller=new AbortController(),timer=root.setTimeout(()=>controller.abort(),3000);
  try{
   const response=await root.fetch('./auth-runtime.json'+(required?'?v='+configVersion:''),{cache:'no-store',credentials:'same-origin',signal:controller.signal});
   if(!response.ok)throw Error();const data=await response.json();
   if(data.mode==='disabled'){if(required)throw Error();try{root.localStorage.setItem(intentKey,'disabled');}catch{}return null;}
   const production=data.mode==='production';
   try{root.localStorage.setItem(intentKey,production?'production':'auth-check');}catch{}
   if(!['auth-check','production'].includes(data.mode)||production!==required||data.allowedOrigin!==root.location.origin||production&&typeof data.appShell!=='boolean')throw Error();
   if(production){const origin=new URL(data.allowedOrigin);if(origin.protocol!=='https:'||origin.origin!==data.allowedOrigin||origin.username||origin.password)throw Error();}
   const result=root.MvpRuntimeConfig.validate(data);if(!result.ok)throw Error();
   await new Promise((resolve,reject)=>{const script=document.createElement('script'),timeout=root.setTimeout(()=>reject(Error()),3000);script.src='./vendor/supabase.js';script.onload=()=>{root.clearTimeout(timeout);resolve();};script.onerror=()=>{root.clearTimeout(timeout);reject(Error());};document.head.append(script);});
   const config=result.config;
   const operations=root.MvpCompatibility?.contract;
   if(production&&operations!=='legacy-compatible-v1')throw Error();
   const client=root.supabase.createClient(config.url,config.publicKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false,storageKey:production?'student-mvp-production-auth-v1':'student-mvp-auth-check-v1'},global:{fetch:root.MvpRuntimeConfig.guardedFetch(config,root.fetch.bind(root),(url,method,body)=>operations?root.MvpCompatibility.requestAllowed(url,method,body):root.MvpOperationalGate.requestAllowed(url,method,body))}});
   // The existing student-management database uses shared tests without an author column.
   return{mode:'server',deploymentMode:production?'production':'auth-check',client,operations,schema:operations?'shared-tests-v1':undefined,appShell:data.appShell===true};
  }catch{try{if(!required&&root.localStorage.getItem(intentKey)==='disabled')return null;}catch{}return{mode:'blocked'};}finally{root.clearTimeout(timer);}
 }
 root.MvpRuntimeReady=bootstrap();
})(window);

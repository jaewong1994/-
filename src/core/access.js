(function(root){
  'use strict';
  const common=['wtest','viewer','learning'];
  const student=['ipsi','input','score','trend','cut','uni','susi','strategy','dday','collection','report'];
  const staff=['counsel','exam-counsel'];
  const pages={student:[...common,...student],teacher:[...common,...staff],director:[...common,...staff,'admin']};
  const actions={student:['own-profile','submit','collection'],teacher:['own-profile','manage-tests','counsel'],director:['own-profile','manage-tests','counsel','accounts','materials','cards']};
  root.MvpAccess=Object.freeze({pages,canOpen:(role,page)=>Boolean(pages[role]?.includes(page)),can:(role,action)=>Boolean(actions[role]?.includes(action))});
  let revision=0;
  root.SessionGuard={capture:()=>revision,bump:()=>++revision,assert(token){if(token!==revision){const e=new Error('이전 세션의 응답입니다.');e.name='StaleSession';throw e;}},async wait(promise,token){try{const value=await promise;this.assert(token);return value;}catch(error){this.assert(token);throw error;}}};
  root.Ui={escape:value=>String(value??'').replace(/[&<>"'`]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;','`':'&#96;'}[c])),safeUrl(value){try{const u=new URL(String(value),location.origin);return ['http:','https:','blob:'].includes(u.protocol)?u.href:'';}catch{return '';}}};
})(window);

// Encode JS strings first, then the HTML attribute that contains the handler.
window.Ui.argument=value=>window.Ui.escape(JSON.stringify(String(value??'')));


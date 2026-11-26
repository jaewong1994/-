import {studentScreen,leaveScreen,clearPrivate} from './student.js';
import {staffScreen} from './staff.js';
const main=document.querySelector('main'),tabs=document.querySelector('#tabs'),exit=document.querySelector('#out');
export const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let cfg,sb,shared=sessionStorage.getItem('mm.shared')==='yes',role='',student,sequence=0,pollTimer,toastTimer,sms=false;
export function say(s){document.querySelector('#notice').textContent=s;clearTimeout(toastTimer);toastTimer=setTimeout(()=>document.querySelector('#notice').textContent='',5000)}
export function go(path){if(location.hash.slice(1)===path)render();else location.hash=path}
export const button=(label,action,cl='')=>'<button type="button" data-do="'+esc(action)+'" class="'+esc(cl)+'">'+esc(label)+'</button>';
export function events(root,actions){root.onclick=async e=>{const b=e.target.closest('[data-do]');if(!b||!root.contains(b))return;const [op,...rest]=b.dataset.do.split(':');if(!actions[op])return;b.disabled=true;try{await actions[op](rest.join(':'),b)}catch(err){say(err.message)}finally{b.disabled=false}}}
export function form(id,fn){const f=document.getElementById(id);f.onsubmit=async e=>{e.preventDefault();const b=f.querySelector('[type=submit],button:not([type])');if(b?.disabled)return;if(b)b.disabled=true;try{await fn(Object.fromEntries(new FormData(f)))}catch(err){say(err.message)}finally{if(b)b.disabled=false}}}
export const back=(to='home')=>button('← 뒤로','go:'+to,'back quiet');
export function session(){return sb}
export async function api(op,body={}){const {data}=await sb.auth.getSession();const r=await fetch(cfg.url+'/functions/v1/mm-school',{method:'POST',headers:{'Content-Type':'application/json',apikey:cfg.publicKey,Authorization:'Bearer '+(data.session?.access_token||cfg.publicKey)},body:JSON.stringify({op,...body})});let o;try{o=await r.json()}catch{throw Error('서버에 연결하지 못했습니다.')}if(!r.ok)throw Error(o.error||'연결을 확인해 주세요.');return o}
export async function classroom(op,data={}){const r=await sb.rpc('mm_classroom',{op,data});if(r.error)throw Error(r.error.message||'다시 시도해 주세요.');return r.data}
export async function fileLink(path){const {data,error}=await sb.storage.from('mm-workbooks').createSignedUrl(path,120);if(error)throw Error('자료를 열 수 없습니다.');return data.signedUrl}
const clients=new Map();
function client(){if(clients.has(shared))return clients.get(shared);const value=window.supabase.createClient(cfg.url,cfg.publicKey,{auth:{storage:shared?sessionStorage:localStorage,storageKey:shared?'mm.school.shared':'mm.school',detectSessionInUrl:false}});clients.set(shared,value);return value}
const bin=s=>Uint8Array.from(atob(s.replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0));
const b64=x=>btoa(String.fromCharCode(...new Uint8Array(x))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
function serialize(c){if(c.toJSON)return c.toJSON();const r=c.response,p={clientDataJSON:b64(r.clientDataJSON)};for(const k of ['attestationObject','authenticatorData','signature','userHandle'])if(r[k])p[k]=b64(r[k]);
 if(r.getTransports)p.transports=r.getTransports();return {id:c.id,rawId:b64(c.rawId),type:c.type,response:p,clientExtensionResults:c.getClientExtensionResults()}}
function authOptions(o,creation){if(creation&&PublicKeyCredential.parseCreationOptionsFromJSON)return PublicKeyCredential.parseCreationOptionsFromJSON(o);if(!creation&&PublicKeyCredential.parseRequestOptionsFromJSON)return PublicKeyCredential.parseRequestOptionsFromJSON(o);
 o.challenge=bin(o.challenge);if(o.user)o.user.id=bin(o.user.id);for(const group of ['allowCredentials','excludeCredentials'])if(o[group])o[group]=o[group].map(v=>({...v,id:bin(v.id)}));return o}
async function verified(v){const r=await sb.auth.verifyOtp({token_hash:v.token_hash,type:'email'});if(r.error)throw Error('로그인 시간이 만료되었습니다. 다시 시도해 주세요.');sessionStorage.removeItem('mm.pair');await identify();go('home')}
async function identify(){role='';student=null;const {data}=await sb.auth.getSession();if(!data.session)return;
 student=await api('me');if(student){role='student';return}const r=await sb.from('profiles').select('role').eq('id',data.session.user.id).maybeSingle();if(['director','teacher'].includes(r.data?.role))role='staff'}
function entry(title,body){main.innerHTML='<section class="entry"><h1>'+esc(title)+'</h1>'+body+'</section>'}
async function passLogin(){if(!window.PublicKeyCredential)throw Error('기본 브라우저에서 열거나 현장 확인으로 로그인해 주세요.');
 const {options,id}=await api('login-options');const cred=await navigator.credentials.get({publicKey:authOptions(options,false)});await verified(await api('login',{id,credential:serialize(cred)}))}
function landing(){entry('학습실','<div class="stack">'+button('패스키로 로그인','pass','primary')+button('처음 가입 · 기기 변경','go:join')+button('강사 로그인','go:staff-login','quiet')+'</div>');events(main,{go,pass:passLogin})}
function join(){entry('학생 가입',back('login')+'<form id="join"><label>이름<input name="name" autocomplete="name" maxlength="40" required></label><label>등록한 휴대전화<input name="phone" type="tel" autocomplete="tel-national" placeholder="010-0000-0000" required></label><button class="primary" type="submit">현장에서 확인받기</button>'+(sms?button('문자로 인증','sms'):'')+'</form>');events(main,{go,sms:async()=>{const f=document.getElementById('join');if(!f.reportValidity())return;const body=Object.fromEntries(new FormData(f));const number='+82'+body.phone.replace(/[^0-9]/g,'').replace(/^0/,'');const r=await sb.auth.signInWithOtp({phone:number});if(r.error)throw Error('문자 발송을 확인해 주세요.');sessionStorage.setItem('mm.sms',JSON.stringify({number,name:body.name}));go('sms')}});form('join',async b=>{const r=await api('request',b);sessionStorage.setItem('mm.pair',JSON.stringify({...r,expires:Date.now()+r.expires*1000}));go('pair')})}
function smsVerify(){const b=JSON.parse(sessionStorage.getItem('mm.sms')||'null');if(!b)return go('join');
 entry('문자 확인',back('join')+'<form id="sms"><label>인증번호<input name="token" inputmode="numeric" autocomplete="one-time-code" required></label><button class="primary">확인</button></form>');events(main,{go});form('sms',async data=>{const r=await sb.auth.verifyOtp({phone:b.number,token:data.token,type:'sms'});if(r.error)throw Error('번호 또는 유효시간을 확인하세요.');const pair=await api('phone-ticket',{name:b.name});await sb.auth.signOut({scope:'local'});sessionStorage.removeItem('mm.sms');sessionStorage.setItem('mm.pair',JSON.stringify({...pair,expires:Date.now()+600000}));go('pair')})}
async function pair(seq){const b=JSON.parse(sessionStorage.getItem('mm.pair')||'null');if(!b||Date.now()>b.expires){sessionStorage.removeItem('mm.pair');go('join');return}
 entry('선생님 확인',back('join')+'<p>이 번호를 선생님께 보여 주세요.</p><div class="code">'+esc(b.code.slice(0,4)+' '+b.code.slice(4))+'</div><p class="muted">10분간 유효합니다.</p>');events(main,{go});
 async function poll(){if(seq!==sequence)return;if(Date.now()>b.expires){go('join');return}try{const r=await api('poll',{ticket:b.ticket});if(seq!==sequence)return;if(r.approved){finish(b);return}}catch{if(seq===sequence)say('연결을 확인하는 중입니다.')}if(seq===sequence)pollTimer=setTimeout(poll,3500)}await poll()}
function finish(b){entry('가입 완료하기','<form id="finish"><label>닉네임<input name="nickname" minlength="2" maxlength="12" required autocomplete="off"></label><button class="primary" type="submit">패스키 등록 · 시작</button>'+button('이 기기에서 한 번만 이용','once','quiet')+'</form>');
 const run=async(n,one)=>{if(one){shared=true;sessionStorage.setItem('mm.shared','yes');sb=client();await verified(await api('shared',{ticket:b.ticket,nickname:n}));return}
 if(!window.PublicKeyCredential)throw Error('기본 브라우저로 열거나 한 번만 이용을 선택해 주세요.');const t=await api('register-options',{ticket:b.ticket});const c=await navigator.credentials.create({publicKey:authOptions(t.options,true)});
 await verified(await api('register',{ticket:b.ticket,id:t.id,nickname:n,credential:serialize(c)}))};
 form('finish',v=>run(v.nickname,false));events(main,{once:()=>{const f=document.getElementById('finish');if(f.reportValidity())return run(f.elements.nickname.value,true)}})}
function staffLogin(){entry('강사 작업실',back('login')+'<form id="staff-login"><label>기존 강사 계정<input name="email" type="email" autocomplete="username" required></label><label>비밀번호<input name="password" type="password" autocomplete="current-password" required></label><button type="submit" class="primary">로그인</button></form>');events(main,{go});form('staff-login',async b=>{const r=await sb.auth.signInWithPassword(b);if(r.error)throw Error('강사 계정과 비밀번호를 확인하세요.');await identify();if(role!=='staff'){await sb.auth.signOut({scope:'local'});throw Error('강사 계정이 필요합니다.')}go('home')})}
async function render(){const seq=++sequence;clearTimeout(pollTimer);const stopped=leaveScreen();main.onclick=null;const page=location.hash.slice(1)||'home';tabs.hidden=!role;exit.hidden=!role;
 try{await stopped;if(seq!==sequence)return;if(!role){if(page==='join')join();else if(page==='staff-login')staffLogin();else if(page==='pair')await pair(seq);else if(page==='sms')smsVerify();else landing();return}
 const section=page.split('/')[0];const parent=({omr:'home',result:'home',recovery:'home',report:'publish',requests:role==='staff'?'outputs':'home'})[section]||section;
 const menu=role==='staff'?[['home','학생 관리'],['accounts','계정관리'],['publish','시험 등록'],['videos','수업영상'],['outputs','리커버리']]:[['home','학습실'],['study','순공'],['city','마이시티'],['notes','오답노트'],['book','길눈'],['videos','수업영상']];
 tabs.innerHTML=menu.map(([p,l])=>'<button data-page="'+p+'" '+((p===parent)?'aria-current="page"':'')+'>'+l+'</button>').join('');tabs.onclick=e=>{if(e.target.dataset.page)go(e.target.dataset.page)};
 main.innerHTML='<p role="status">불러오는 중…</p>';if(page.split('/')[0]==='videos'){const {videosScreen}=await import('./videos.js');if(seq===sequence)await videosScreen(main,page,role==='staff',()=>seq===sequence)}else if(role==='staff')await staffScreen(main,page,()=>seq===sequence);else await studentScreen(main,page,()=>seq===sequence)
 }catch(e){if(seq===sequence){main.replaceChildren();const h=document.createElement('p');h.textContent=e.message;main.append(h);const b=document.createElement('button');b.textContent='다시 열기';b.onclick=()=>location.reload();main.append(b)}}}
exit.onclick=async()=>{clearPrivate();await sb.auth.signOut({scope:'local'});sessionStorage.removeItem('mm.pair');sessionStorage.removeItem('mm.sms');sessionStorage.removeItem('mm.shared');shared=false;sb=client();role='';student=null;go('login')};
window.addEventListener('hashchange',render);async function start(){cfg=await (await fetch('/auth-runtime.json',{cache:'no-store'})).json();if(cfg.allowedOrigin!==location.origin||!cfg.url?.startsWith('https://'))throw Error('운영 주소를 확인하세요.');
 sb=client();try{const r=await fetch(cfg.url+'/auth/v1/settings',{headers:{apikey:cfg.publicKey}});sms=!!(await r.json()).external?.phone}catch{}await identify();await render()}
start().catch(e=>{main.textContent=e.message||'연결을 확인해 주세요.'});


if('serviceWorker' in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('/sw.js',{updateViaCache:'none'}).catch(()=>{}));

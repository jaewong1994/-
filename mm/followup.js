import {back,button,esc,events,fileLink,go,say,session} from './school.js';

export async function followup(op,data={}) {
  const result=await session().rpc('mm_followup',{op,data});
  if(result.error) throw Error(result.error.message);
  return result.data;
}


export async function recovery(root,exam,current) {
  const rows=exam.wrong.map(n=>{
    const done=exam.corrected?.includes(n);
    return '<article class="work-row"><div><strong>'+n+'번 리커버리</strong><small>문제와 해설</small></div><div class="actions">'+
      button('PDF 열기','pdf:'+n)+(done?'<span class="mark">고침 완료</span>':button('고쳤어요','correct:'+n))+'</div></article>';
  });
  if(!current()) return;
  root.innerHTML=back('result/'+exam.id)+'<h1>리커버리 숙제</h1><p class="meta">'+esc(exam.title)+'</p>'+rows.join('');
  events(root,{go,async pdf(n){const url=await fileLink(exam.owner+'/'+exam.id+'/r'+n+'.pdf');if(current())location.assign(url)},async correct(n){await followup('correct',{exam:exam.id,n:Number(n)});if(current())go('recovery/'+exam.id)}});
}

export async function report(root,id,current) {
  const info=await followup('report',{exam:id});
  if(!current())return;
  const rows=info.students.map(s=>'<tr><th scope="row">'+esc(s.name)+'</th><td>'+s.score+'점</td><td>'+s.wrong.map(n=>
    '<span class="item-chip'+(s.corrected.includes(n)?' complete':'')+'">'+n+'번'+(s.corrected.includes(n)?' ✓':'')+'</span>').join(' ')+
    (!s.wrong.length?'전부 정답':'')+'</td><td>'+(s.wrong.length?(s.printed?'PDF 저장됨':'출력 대기'):'—')+'</td></tr>').join('');
  root.innerHTML=back('publish')+'<h1>'+esc(info.title)+'</h1><p class="meta">'+esc(info.group)+' · '+info.students.length+'명 제출</p>'+
    (rows?'<div class="account-scroll"><table class="account-table"><thead><tr><th>학생</th><th>점수</th><th>오답 · ✓ 고침</th><th>리커버리</th></tr></thead><tbody>'+rows+'</tbody></table></div>':'<p class="muted">제출한 학생이 없습니다.</p>')+
    button('리커버리 출력함','go:outputs');
  events(root,{go});
}

async function deliver(id,file) {
  if(!file||file.size<5||file.size>25*1024*1024)throw Error('25MB 이하의 PDF를 선택하세요.');
  const bytes=await file.arrayBuffer();
  if(new TextDecoder().decode(bytes.slice(0,5))!=='%PDF-')throw Error('PDF 파일을 확인하세요.');
  const hash=new Uint8Array(await crypto.subtle.digest('SHA-256',bytes));
  const {data,error}=await session().auth.getUser();if(error||!data.user)throw Error('다시 로그인하세요.');
  const key=data.user.id+'/requests/'+id+'/'+Array.from(hash,n=>n.toString(16).padStart(2,'0')).join('')+'.pdf';
  const upload=await session().storage.from('mm-workbooks').upload(key,file,{contentType:'application/pdf',upsert:false});
  if(upload.error&&!(String(upload.error.statusCode)==='409'||upload.error.error==='Duplicate'||/already exists/i.test(upload.error.message)))throw Error('PDF 업로드를 마치지 못했습니다. 다시 시도하세요.');
  await followup('deliver',{id,path:key});
}

let stopWaiting;
export function leaveRequests(){stopWaiting?.();stopWaiting=null}
export async function requests(root,staff,current) {
  leaveRequests();
  const rows=await followup('requests');
  if(!current())return;
  root.innerHTML=back(staff?'outputs':'home')+'<div class="row spread"><h1>'+(staff?'학생 요청자료':'요청한 문제')+'</h1>'+button('새로고침','refresh','quiet')+'</div>'+
    (rows.map((r,i)=>'<article class="work-row"><div><strong>'+esc(r.title)+'</strong><small>'+
      (staff?esc(r.student)+' · ':'')+esc(r.level)+' · '+r.amount+'문항 · '+(r.material?'전달 완료':'요청 중')+'</small></div>'+
      (r.material?button('PDF 열기','open:'+i):staff?'<form data-request="'+i+'"><input aria-label="전달할 PDF" type="file" accept="application/pdf,.pdf" required><button class="primary">PDF 전달</button></form>':'')+'</article>').join('')||'<p class="muted">요청한 문제가 없습니다.</p>');
  events(root,{go,refresh:()=>go('requests'),async open(i){const url=await fileLink(rows[i].material);if(current())location.assign(url)}});
  if(!staff&&rows.some(r=>!r.material)){
    let checking=false;
    const refresh=async()=>{
      if(checking||!current()||document.hidden)return;
      checking=true;
      try{const fresh=await followup('requests');if(current()&&JSON.stringify(fresh)!==JSON.stringify(rows))go('requests')}
      catch{ /* Keep the current list during a temporary connection failure. */ }
      finally{checking=false}
    };
    const tick=setInterval(refresh,15000);
    window.addEventListener('focus',refresh);document.addEventListener('visibilitychange',refresh);
    stopWaiting=()=>{clearInterval(tick);window.removeEventListener('focus',refresh);document.removeEventListener('visibilitychange',refresh)};
  }
  root.querySelectorAll('form').forEach(f=>{f.onsubmit=async e=>{e.preventDefault();const b=f.querySelector('button');if(b.disabled)return;b.disabled=true;
    try{await deliver(rows[Number(f.dataset.request)].id,f.querySelector('input').files[0]);if(current()){say('학생에게 PDF를 전달했습니다.');await requests(root,staff,current)}}
    catch(err){say(err.message)}finally{b.disabled=false}}});
}

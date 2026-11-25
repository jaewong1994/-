import {api,classroom,session,esc,button,events,form,go,say} from './school.js';
const joinUrl='https://epsilonmath-lab.xyz/mm/#join',safe=s=>String(s).replace(/[<>:"/\\|?*\x00-\x1F]/g,'_').replace(/[. ]+$/,'').slice(0,90)||'학생';
let interval;
export function leaveStaff(){clearInterval(interval)}
function fmtCode(c){return c.slice(0,4)+' '+c.slice(4)}
async function upload(root){const files=Array.from(root.querySelector('input[type=file]').files);const index=files.find(f=>['manifest.json','ready.json'].includes(f.name));if(!index)throw Error('manifest.json 또는 ready.json이 있는 등록 폴더를 선택하세요.');
 const pack=JSON.parse(await index.text()),className=root.querySelector('[name=group]').value.trim(),title=root.querySelector('[name=title]').value.trim();
 if(!title||!className)throw Error('시험명과 배정할 반을 입력하세요.');
 const at=index.webkitRelativePath.split('/').slice(0,-1).join('/')+'/',byName=new Map(files.filter(f=>f.webkitRelativePath===at+f.name).map(f=>[f.name,f]));
 const parts=[['paper.pdf',pack.paper],...(pack.solutions?[['solutions.pdf',pack.solutions]]:[])];if(!Array.isArray(pack.items)||!pack.items.length)throw Error('등록할 문항이 없습니다.');
 for(const [i,q] of pack.items.entries()){if(!q.original||!q.recovery_pdf)throw Error((i+1)+'번 원문·리커버리 파일을 확인하세요.');parts.push(['r'+(i+1)+'.pdf',q.recovery_pdf])}
 for(const [,n] of parts)if(!byName.has(n))throw Error('누락된 파일 · '+n);
 const e=await classroom('exam-id'),u=(await session().auth.getUser()).data.user,st=root.querySelector('output');
 for(const [i,[dest,n]] of parts.entries()){st.textContent=(i+1)+' / '+parts.length+' 파일 등록 중';const r=await session().storage.from('mm-workbooks').upload(u.id+'/'+e+'/'+dest,byName.get(n),{contentType:'application/pdf',upsert:false});if(r.error)throw Error('자료 업로드 실패 · '+n)}
 await classroom('publish',{id:e,title,group:className,solutions:!!pack.solutions,items:pack.items.map(q=>({format:q.format,answer:String(q.answer),points:q.points,subject:q.subject,chapter:q.chapter,original:q.original,recoverySplit:q.recoverySplit||1}))});st.textContent='학생 시험 목록에 등록했습니다.';say('시험을 등록했습니다.')}
export async function staffScreen(root,page,current){
 leaveStaff();
 if(page==='publish'){const rows=await classroom('staff-exams');if(!current())return;root.innerHTML='<div class="row spread"><h1>시험 등록</h1><a class="button" href="http://127.0.0.1:5216/?view=teacher" target="_blank" rel="noopener">이 PC에서 출제 작업실 열기</a></div><div class="split"><form id="publish"><label>배정할 반<input name="group" maxlength="40" required></label><label>시험명<input name="title" maxlength="120" required></label><label>PC 작업실의 등록 폴더<input type="file" webkitdirectory multiple required></label><button class="primary">시험 등록</button><output></output></form><section><h2>등록한 시험</h2>'+rows.map(x=>'<p class="card">'+esc(x.title)+'<br><small>'+esc(x.group)+' · '+x.count+'문항</small></p>').join('')+'</section></div>';const f=root.querySelector('#publish'),name=f.elements.title,group=f.elements.group;
 let custom=false;const autoTitle=()=>{if(!custom){const d=new Date();name.value=[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('.')+' '+(group.value.trim()?group.value.trim()+' ':'')+'일일테스트'}};
 name.addEventListener('input',()=>{custom=!!name.value.trim()});group.addEventListener('input',autoTitle);autoTitle();
 form('publish',()=>upload(root));return}
 if(page==='outputs'){
 const show=async()=>{const [jobs,health]=await Promise.all([classroom('print-jobs'),session().rpc('mm_station_status')]);if(!current())return;
 const seen=health.data?.seen&&Date.parse(health.data.seen),online=!!seen&&Date.now()-seen<150000;
 root.innerHTML='<h1>리커버리 출력함</h1><p><span class="mark">'+(online?'출력 PC 연결됨':'출력 PC 대기 중')+'</span></p><p>숙제는 출력 PC의 <strong>MM 리커버리</strong> 폴더에 날짜·학생별 PDF로 저장됩니다.</p><div class="row spread"><h2>출력 대기 '+jobs.length+'</h2>'+button('새로고침','refresh')+'</div>'+jobs.map(j=>'<article class="card">'+esc(j.name)+' · '+esc(j.title)+'<br><small>'+esc(j.wrong.join(' · '))+'번</small></article>').join('');
 events(root,{refresh:show})};await show();if(current())interval=setInterval(()=>show().catch(e=>say(e.message)),30000);return}
 let r=await api('roster');if(!current())return;
 const pending=rows=>rows.map((q,i)=>'<div class="card"><b>'+esc(q.name)+'</b> · <span>'+esc(fmtCode(q.id))+'</span> '+button('같은 번호 확인 · 승인','approve:'+q.person+':'+q.id)+'</div>').join('');
 root.innerHTML='<div class="row spread"><h1>학생 관리</h1>'+button('새로고침','refresh','quiet')+'</div><div class="split"><section><h2>가입 QR</h2><a href="'+joinUrl+'"><img class="qr" src="/mm/join-qr.png" alt="학생 공통 가입 QR"></a><div>'+button('가입 링크 복사','copy')+'</div><h2>명단 등록</h2><form id="roster"><label>이름, 휴대전화, 반<textarea name="rows" rows="5" required placeholder="한 줄에 한 학생 · 여러 반은 |로 구분"></textarea></label><button type="submit" class="primary">명단에 추가</button></form></section><section><h2>현장 확인 <span id="pendingCount">'+r.requests.length+'</span></h2><div id="pendingRoster">'+pending(r.requests)+'</div><h2>학생 '+r.students.length+'</h2>'+r.students.map(s=>'<div class="card"><b>'+esc(s.name)+'</b> '+(s.active?' · '+esc(s.nickname):'')+' <span class="mark">'+(s.active?'가입 완료':'미가입')+'</span><br><small>'+esc(s.groups.join(' · '))+' · '+esc(s.phone)+'</small></div>').join('')+'</section></div>';
 events(root,{refresh:()=>go('home'),copy:()=>navigator.clipboard.writeText(joinUrl).then(()=>say('가입 링크를 복사했습니다.')),approve:async value=>{const [person,code]=value.split(':');await api('approve',{person,code});go('home')}});
 let fetching=false;interval=setInterval(async()=>{if(fetching||!current()||document.hidden)return;fetching=true;try{const next=await api('roster');if(current()&&JSON.stringify(next.requests)!==JSON.stringify(r.requests)){r=next;root.querySelector('#pendingCount').textContent=r.requests.length;root.querySelector('#pendingRoster').innerHTML=pending(r.requests)}}catch{}finally{fetching=false}},6000);
 form('roster',async b=>{const rows=b.rows.trim().split(/\r?\n/).map(l=>{const [name,phone,...groups]=l.split(/[,\t]/).map(v=>v.trim());return {name,phone,groups:groups.flatMap(g=>g.split('|').map(x=>x.trim()))}});await api('save',{rows});say('명단을 저장했습니다.');go('home')})
}


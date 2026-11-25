import {session,esc,go,say} from './school.js';
import {youtubeId,timeLabel,parseMarks,analysisPrompt} from './video-marks.js';

const watch=(id,t=0)=>'https://www.youtube.com/watch?v='+id+(t?'&t='+t+'s':'');
const embed=(id,t=0)=>'https://www.youtube-nocookie.com/embed/'+id+'?playsinline=1&enablejsapi=1&origin='+encodeURIComponent(location.origin)+(t?'&start='+t:'');
const groupKey=g=>g.staff+'/'+g.name;
const dateLabel=stamp=>new Intl.DateTimeFormat('ko-KR',{month:'long',day:'numeric',timeZone:'Asia/Seoul'}).format(new Date(stamp));
async function rpc(operation,entry={}){
  const {data,error}=await session().rpc('mm_class_videos',{operation,entry});
  if(error)throw Error(error.code==='PGRST202'?'수업영상 연결을 준비 중입니다. 잠시 후 다시 열어 주세요.':error.message);
  return data;
}
let youtubeApi;
function openApi(){
  if(window.YT?.Player)return Promise.resolve(window.YT);
  if(!youtubeApi)youtubeApi=new Promise((resolve,reject)=>{
    const script=document.createElement('script'),prev=window.onYouTubeIframeAPIReady;
    const timeout=setTimeout(()=>failed(),12000);
    function failed(){clearTimeout(timeout);script.remove();youtubeApi=null;reject(Error('player unavailable'))}
    window.onYouTubeIframeAPIReady=()=>{clearTimeout(timeout);if(typeof prev==='function')prev();resolve(window.YT)};
    script.onerror=failed;script.src='https://www.youtube.com/iframe_api';document.head.append(script);
  });
  return youtubeApi;
}
function displayPlayer(root,video,current){
  const iframe=root.querySelector('iframe'),link=root.querySelector('[data-external]');
  iframe.src=embed(video.youtube);link.href=watch(video.youtube);
  let player,ready=false,start=0,jumped=false;
  openApi().then(api=>{
    if(!current()||!iframe.isConnected)return;
    player=new api.Player(iframe,{events:{
      onReady(){ready=true;if(jumped&&current()){player.seekTo(start,true);player.playVideo()}},
      onError(){ready=false}
    }});
  }).catch(()=>{});
  root.querySelector('[data-chapters]').onclick=e=>{
    const button=e.target.closest('[data-seconds]');if(!button)return;
    start=Number(button.dataset.seconds);jumped=true;link.href=watch(video.youtube,start);
    for(const x of root.querySelectorAll('[data-seconds]'))x.setAttribute('aria-pressed',String(x===button));
    if(ready&&player){player.seekTo(start,true);player.playVideo()}
    else iframe.src=embed(video.youtube,start)+'&autoplay=1';
  };
}
function videoList(root,data,staff){
  const videos=data.videos;
  root.innerHTML='<div class="row spread"><h1>수업영상</h1>'+(staff?'<a class="button primary" href="#videos/new">영상 등록</a>':'')+'</div>'+
    (videos.length?'<div class="lesson-list">'+videos.map(v=>{
      const groups=staff?v.classes.map(c=>c.name):v.classes;
      return '<a class="lesson-row" href="#videos/'+esc(v.id)+'"><div><small>'+esc([...new Set(groups)].join(' · '))+' · '+esc(dateLabel(v.date))+'</small><strong>'+esc(v.title)+'</strong></div><span>'+(staff&&!v.published?'게시 중지':v.bookmarks.length?'문항 '+v.bookmarks.length+'개':'영상 보기')+' ›</span></a>';
    }).join('')+'</div>':'<p class="muted">'+(staff?'등록한 영상이 없습니다.':'수강 중인 반에 올라온 영상이 없습니다.')+'</p>');
}
function detail(root,video,staff,current){
  root.innerHTML='<a class="back quiet" href="#videos">← 수업영상</a><div class="row spread"><h1>'+esc(video.title)+'</h1>'+
    (staff?'<a class="button" href="#videos/'+esc(video.id)+'/edit">영상 수정</a>':'')+'</div>'+
    '<div class="lesson-player"><iframe title="'+esc(video.title)+'" referrerpolicy="strict-origin-when-cross-origin" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe></div>'+
    '<div class="row spread"><small>'+esc((staff?video.classes.map(g=>g.name):video.classes).join(' · '))+'</small><a data-external target="_blank" rel="noopener noreferrer">YouTube에서 열기 ↗</a></div>'+
    '<div data-chapters class="lesson-chapters">'+video.bookmarks.map(mark=>'<button data-seconds="'+mark.seconds+'" aria-pressed="false"><b>'+mark.number+'번</b><span>'+esc(mark.label)+'</span><time>'+timeLabel(mark.seconds)+'</time></button>').join('')+'</div>';
  displayPlayer(root,video,current);
}
function editor(root,data,v,current){
  const isNew=!v, id=v?.id||crypto.randomUUID(), existing=new Set((v?.classes||[]).map(groupKey));
  const choices=[...new Map([...data.choices,...(v?.classes||[])].map(g=>[groupKey(g),g])).values()];
  const duplicates=new Set(choices.filter((g,i)=>choices.some((c,j)=>j!==i&&c.name===g.name)).map(g=>g.name));
  root.innerHTML='<a class="back quiet" href="'+(v?'#videos/'+id:'#videos')+'">← 뒤로</a><h1>'+(v?'영상 수정':'영상 등록')+'</h1><form class="lesson-form">'+
    '<label>유튜브 링크<input required type="text" inputmode="url" autocomplete="off" name="url" placeholder="https://youtu.be/…" value="'+esc(v?watch(v.youtube):'')+'"></label>'+
    '<label>수업 제목<input name="title" maxlength="120" placeholder="비워두면 날짜와 반 이름으로 등록" value="'+esc(v?.title||'')+'"></label>'+
    '<fieldset><legend>수강반</legend><div class="lesson-classes">'+choices.map((g,i)=>'<label><input type="checkbox" data-group="'+i+'" '+(existing.has(groupKey(g))?'checked':'')+'>'+esc(g.name)+(duplicates.has(g.name)?' · '+esc(g.teacher):'')+'</label>').join('')+(!choices.length?'<a href="#home">학생 관리에서 수강반 등록</a>':'')+'</div></fieldset>'+
    '<fieldset><legend>문항 북마크</legend><div class="actions"><button type="button" data-copy>Gemini 요청문 복사</button><label class="button lesson-file">분석 파일 열기<input type="file" accept=".json,.txt,.md,application/json,text/plain" data-file></label></div>'+
    '<label>분석 결과<textarea name="analysis" rows="5" placeholder="7번 12:34&#10;8번 21:08&#10;또는 Gemini 분석 JSON 붙여넣기"></textarea></label><div data-preview class="lesson-preview" aria-live="polite"></div></fieldset>'+
    '<label class="lesson-publish"><input type="checkbox" name="published" '+(!v||v.published?'checked':'')+'>선택한 반에 공개</label>'+
    '<p role="alert" data-error></p><div class="actions"><button type="submit" class="primary">'+(isNew?'영상 등록':'변경 저장')+'</button></div></form>';
  const form=root.querySelector('form'),analysis=form.elements.analysis,preview=root.querySelector('[data-preview]'),err=root.querySelector('[data-error]'),save=form.querySelector('[type=submit]');
  const fileInput=form.querySelector('[data-file]');let busy=false;
  if(v?.bookmarks.length)analysis.value=JSON.stringify({bookmarks:v.bookmarks},null,2);
  function review(){
    try {
      const marks=parseMarks(analysis.value);
      preview.innerHTML=marks.map(m=>'<span>'+esc(m.number)+'번 <time>'+timeLabel(m.seconds)+'</time>'+(m.label?' · '+esc(m.label):'')+'</span>').join('');
      err.textContent='';save.disabled=busy||!choices.length;return marks;
    }catch(e){preview.replaceChildren();err.textContent=e.message;save.disabled=true;return null}
  }
  analysis.oninput=review;review();
  form.querySelector('[data-copy]').onclick=async()=>{try{await navigator.clipboard.writeText(analysisPrompt);say('Gemini 요청문을 복사했습니다.')}catch{window.prompt('Gemini에 넣을 요청문을 복사하세요.',analysisPrompt)}};
  fileInput.onchange=async()=>{
    const file=fileInput.files[0];if(!file)return;
    try {
      if(file.size>262144)throw Error('분석 파일은 256KB까지 열 수 있습니다.');
      const text=await file.text();if(!current())return;
      parseMarks(text);analysis.value=text;review();
    }catch(e){err.textContent=e.message}finally{fileInput.value=''}
  };
  form.onsubmit=async e=>{
    e.preventDefault();if(busy)return;const bookmarks=review();if(!bookmarks)return;
    const youtube=youtubeId(form.elements.url.value);
    if(!youtube){err.textContent='유효한 유튜브 영상 링크를 입력하세요.';form.elements.url.focus();return}
    const classes=[...form.querySelectorAll('[data-group]:checked')].map(el=>choices[Number(el.dataset.group)]);
    if(!classes.length){err.textContent='수강반을 한 개 이상 선택하세요.';return}
    const title=form.elements.title.value.trim()||dateLabel(Date.now())+' '+classes[0].name+' 수업';
    busy=true;save.disabled=true;
    try{
      await rpc('save',{id,revision:v?.revision||0,title,youtube,bookmarks,classes:classes.map(({staff,name})=>({staff,name})),published:form.elements.published.checked});
      if(current()){say('수업영상을 저장했습니다.');go('videos/'+id)}
    }catch(e){err.textContent=e.message}finally{busy=false;save.disabled=false}
  };
}
export async function videosScreen(root,path,staff,current){
  const data=await rpc('list');if(!current())return;
  const [,id,mode]=path.split('/');
  if(!id)return videoList(root,data,staff);
  if(staff&&id==='new')return editor(root,data,null,current);
  const v=data.videos.find(video=>video.id===id);
  if(!v){root.innerHTML='<a class="back quiet" href="#videos">← 수업영상</a><p>이 영상을 볼 수 없습니다.</p>';return}
  if(staff&&mode==='edit')return editor(root,data,v,current);
  return detail(root,v,staff,current);
}

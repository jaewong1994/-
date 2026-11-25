const videoId = /^[A-Za-z0-9_-]{11}$/;
export function youtubeId(raw) {
  const text=String(raw||'').trim();
  let u;
  try { u=new URL(/^https?:\/\//i.test(text)?text:'https://'+text); } catch {return null;}
  if(!['https:','http:'].includes(u.protocol)||u.username||u.password||u.port)return null;
  const host=u.hostname.toLowerCase(),parts=u.pathname.split('/').filter(Boolean);
  let id;
  if(host==='youtu.be'&&parts.length===1)id=parts[0];
  else if(['www.youtube.com','youtube.com','m.youtube.com','www.youtube-nocookie.com'].includes(host)){
    if(u.pathname==='/watch')id=u.searchParams.get('v');
    else if(parts.length===2&&['embed','shorts','live'].includes(parts[0]))id=parts[1];
  }
  return id&&videoId.test(id)?id:null;
}
export function timeLabel(seconds){
  const n=Math.floor(seconds),s=String(n%60).padStart(2,'0'),m=Math.floor(n/60)%60;
  return n>=3600?Math.floor(n/3600)+':'+String(m).padStart(2,'0')+':'+s:m+':'+s;
}
function toSeconds(v){
  if(typeof v==='number')return Number.isFinite(v)?Math.floor(v):NaN;
  const s=String(v??'').trim();
  if(/^\d+([.,]\d{1,3})?s?$/.test(s))return Math.floor(Number(s.replace(',','.').replace(/s$/,'')));
  if(!/^(?:\d{1,2}:[0-5]\d:[0-5]\d|\d{1,4}:[0-5]\d)(?:[.,]\d{1,3})?$/.test(s))return NaN;
  return s.split(/[.,]/)[0].split(':').reduce((t,n)=>t*60+Number(n),0);
}
function checked(n,t,label,row){
  const m=String(n??'').trim().match(/^(?:문제\s*|문항\s*|Q\s*)?(\d{1,4})(?:\s*번)?$/i);
  const number=m&&Number(m[1]),seconds=toSeconds(t),title=String(label??'').trim();
  if(!number||!Number.isInteger(seconds)||seconds<0||seconds>=86400||title.length>100)
    throw Error(row+'번째 항목의 문항 번호·시각·설명을 확인하세요.');
  return {number,seconds,label:title};
}
function fromObject(o,i){
  if(!o||typeof o!=='object'||Array.isArray(o))throw Error(i+'번째 항목은 문항과 시각이 있는 객체여야 합니다.');
  return checked(o.number??o.problem_number??o.question_number??o.problem??o.question??o['문항번호']??o['문제번호']??o['문항']??o['문제'],
    o.seconds??o.start_seconds??o.startSeconds??o.timestamp??o.start_time??o.start??o.time??o['시각']??o['시작시간'],
    o.label??o.title??o['설명']??'',i);
}
function fromLine(raw,row){
  const text=raw.trim().replace(/^\s*(?:[-*•]\s+|\d+[.)]\s+(?=\D*\d+\s*번))/,'').replace(/[*_\x60]/g,'');
  if(!text||/^[|\s:-]+$/.test(text)||(!/\d/.test(text)&&/^(?:[|#\s]*(?:문항|문제|번호|시각|시간|북마크|question|timestamp|time))/i.test(text)))return null;
  const time=text.match(/(?<![\d:])(?:\d{1,2}:[0-5]\d:[0-5]\d|\d{1,4}:[0-5]\d)(?:[.,]\d{1,3})?(?![\d:])/);
  if(!time)throw Error(row+'행에 시작 시각이 없습니다. 예: 7번 12:34');
  const other=text.slice(0,time.index)+' '+text.slice(time.index+time[0].length);
  const num=other.match(/(?:문제\s*|문항\s*|Q\s*)(\d{1,4})(?:\s*번)?|(?<!\d)(\d{1,4})\s*번/i)||
    other.match(/^[\s|,;:[(-]*(\d{1,4})(?=\s|[|,;:.)\]-]|$)/);
  if(!num)throw Error(row+'행에 문항 번호가 없습니다.');
  const label=(other.slice(0,num.index)+' '+other.slice(num.index+num[0].length)).replace(/^[\s|,;:·–—()[\]-]+|[\s|,;:·–—()[\]-]+$/g,'');
  return checked(num[1]||num[2],time[0],label,row);
}
export function parseMarks(value){
  const raw=String(value??'').replace(/^\uFEFF/,'').trim();
  if(!raw)return [];
  if(raw.length>262144)throw Error('분석 결과는 256KB까지 입력하세요.');
  const fenced=raw.match(/\x60{3}(?:json|text|markdown)?\s*\n([\s\S]*?)\n?\x60{3}/i);
  const text=(fenced?fenced[1]:raw).trim();
  let rows,structured=false;
  if(text.startsWith('{')||text.startsWith('[')&&!/^\[\d+:\d+/.test(text)){
    structured=true;let obj;try{obj=JSON.parse(text)}catch{throw Error('JSON 형식을 확인하세요.')}
    const list=Array.isArray(obj)?obj:obj.bookmarks??obj.chapters??obj.markers??obj.questions;
    if(!Array.isArray(list))throw Error('JSON에 bookmarks 목록이 필요합니다.');
    rows=list.map((item,i)=>fromObject(item,i+1));
  }else rows=text.split(/\r?\n/).map((line,i)=>fromLine(line,i+1)).filter(Boolean);
  if(rows.length>300)throw Error('북마크는 최대 300개입니다.');
  if(!rows.length&&!structured)throw Error('문항 번호와 시각을 찾을 수 없습니다.');
  const seen=new Set();
  for(const r of rows){const key=r.number+'/'+r.seconds;if(seen.has(key))throw Error(r.number+'번 '+timeLabel(r.seconds)+' 북마크가 중복됐습니다.');seen.add(key)}
  return rows.sort((a,b)=>a.seconds-b.seconds||a.number-b.number);
}
export const analysisPrompt='이 수학 수업 영상에서 실제 문제 풀이를 시작하는 시점을 찾아 주세요. 화면이나 음성으로 확인한 문항 번호만 기록하세요. 번호가 불확실한 부분은 생략하고, 같은 문제를 다시 시작하면 별도 시각으로 기록하세요. 영상 맨 처음부터의 경과 시간을 정수 초로 변환하세요. 결과는 {"bookmarks":[{"number":7,"seconds":754,"label":"풀이 시작"}]} 형식의 JSON만 출력하세요. 이 예시의 값은 실제 영상에서 확인한 값으로 바꿔 주세요.';

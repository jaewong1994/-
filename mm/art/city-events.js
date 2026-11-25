import {key,random} from './city-form.js';
import {drawResident} from './village-life.js';

// Dates in the Chungbuk Office of Education's 2027 admissions calendar (Korean civil dates).
export const calendarSource='https://www.cbe.go.kr/upload/news/ebook/2027/calendar/res/pages/pages.pdf';
export const examCalendar=[
 ['2027-03-24','3월 전국연합학력평가','고1–3'],['2027-05-06','5월 전국연합학력평가','고3'],
 ['2027-06-03','6월 모의평가·학력평가','고1–3'],['2027-07-08','7월 전국연합학력평가','고1·3'],
 ['2027-08-25','8월 수능 모의평가','고3'],['2027-10-19','10월 전국연합학력평가','고1–3'],
 ['2027-11-18','2028학년도 수능','고3']
];
const dayMs=86400000;
export function cityEvents(seed,stage,hasFair,now,preview='auto',previewSeconds=0,recentAward=null){
 const local=new Date(now.getTime()+9*3600000),date=local.toISOString().slice(0,10);
 const day=Date.parse(date),weekday=local.getUTCDay(),sec=(local.getUTCHours()*60+local.getUTCMinutes())*60+local.getUTCSeconds()+local.getUTCMilliseconds()/1000;
 const due=examCalendar.map(([d,name,grades])=>({days:(Date.parse(d)-day)/dayMs,name,grades})).find(e=>e.days>=0&&e.days<=7);
 const banner=preview==='banner'?{days:7,name:'3월 전국연합학력평가',grades:'고1–3'}:due;
 const sample=preview==='dance'||preview==='concert';
 let show=null;
 const slot=(type,start,duration)=>{if(sec>=start&&sec<start+duration)show={type,elapsed:sec-start,duration};};
 if(preview==='auto'&&stage>=2){
  const daySeed=seed+'/'+date;
  if(random(daySeed,'street-dance')<.42)slot('dance',(12+Math.floor(random(daySeed,'hour')*7))*3600+Math.floor(random(daySeed,'minute')*60)*60,5*60);
  if(stage>=3&&[5,6].includes(weekday))slot('concert',19*3600+30*60,15*60);
  if(hasFair&&stage>=3&&weekday===0)slot('concert',18*3600,15*60);
  if(recentAward){
   const age=(now.getTime()-recentAward.time)/1000;
   if(age>=0&&age<420)show={type:recentAward.fair&&stage>=3?'concert':'dance',elapsed:age,duration:420,occasion:recentAward.fair?'테마파크 개장 축하':'만점 축하'};
  }
 }
 if(sample&&stage>=2&&(preview!=='concert'||stage>=3))show={type:preview,elapsed:previewSeconds%54,duration:54};
 return {banner,show};
}

// Neighbours reach the square by existing footpaths, then cross the open paving.
export function planVenue(cells,roads,form,seed){
 const centerOf=b=>[b[0]*4+2,b[1]*4+2];
 const publicLot=cells.find(b=>b[2]==='Q')||cells.find(b=>b[2]==='A')||cells.find(b=>b[2]==='P');
 const preferred=publicLot?centerOf(publicLot):centerOf(cells[0]);
 const road=roads.reduce((a,b)=>Math.hypot(a.x-preferred[0],a.y-preferred[1])<Math.hypot(b.x-preferred[0],b.y-preferred[1])?a:b);
 const origin=publicLot?preferred:[road.x,road.y],byKey=new Map(roads.map(r=>[key(r.x,r.y),r]));
 // The pedestrian entrance of the square is kept free even along a riverbank.
 const square=publicLot?.[2]==='Q';
 const gate=square?byKey.get(key(...preferred))||road:road;
 const parents=new Map([[gate,null]]),queue=[gate],dist=new Map([[gate,0]]),starts=[];
 for(let i=0;i<queue.length;i++){const n=queue[i],d=dist.get(n);if(d>=3)starts.push(n);
  if(d===7)continue;
  for(const k of n.exits){const next=byKey.get(k);if(next&&!parents.has(next)){parents.set(next,n);dist.set(next,d+1);queue.push(next);}}
 }
 starts.sort((a,b)=>random(seed,'walk-in'+key(a.x,a.y))-random(seed,'walk-in'+key(b.x,b.y)));
 const cast=Array.from({length:14},(_,i)=>{
  const route=[];for(let n=starts[i%Math.max(1,starts.length)]||gate;n;n=parents.get(n))route.push([n.x,n.y]);
  const col=i%5,row=Math.floor(i/5);
  const x=origin[0]-.89+col*.40+row*.12,y=origin[1]-.07+row*.43+(i%2)*.09;
  route.push([x,y]);return {route,style:Math.floor(random(seed,'cast'+i)*36),id:i};
 });
 return {origin,cast,square,name:square?'대학로 공연광장':publicLot?.[2]==='A'?'동네 운동장':publicLot?'공원 산책로':'동네 어귀'};
}
function slab(c,pts,color){c.fillStyle=color;c.beginPath();for(const [i,p] of pts.entries())i?c.lineTo(...p):c.moveTo(...p);c.closePath();c.fill();}
function rect(c,color,x,y,w,h){c.fillStyle=color;c.fillRect(x,y,w,h);}
function stageArt(c,t){
 slab(c,[[-37,-5],[-8,-17],[34,-7],[6,6]],'#a4785c');slab(c,[[-37,-5],[6,6],[6,11],[-37,0]],'#70574b');
 slab(c,[[6,6],[34,-7],[34,-2],[6,11]],'#4c4850');
 for(const x of [-31,24]){
  rect(c,'#38464e',x,-32,2,30);rect(c,'#b7c3ba',x,-32,1,28);
  rect(c,'#354450',x-4,-8,8,11);rect(c,'#8f9e9a',x-2,-6,4,3);rect(c,'#647880',x-2,-1,4,3);
 }
 // The striped canopy, truss and instruments keep the band readable at phone scale.
 slab(c,[[-35,-35],[-22,-42],[33,-40],[26,-33]],'#974f50');
 for(let j=0;j<6;j++)slab(c,[[-34+j*10,-35],[-22+j*9,-41],[-17+j*9,-41],[-29+j*10,-35]],j%2?'#d8966c':'#f0c586');
 rect(c,'#374750',-31,-34,57,3);
 rect(c,'#ceb27a',-30,-33,55,1);
 rect(c,'#344958',-21,-7,12,5);rect(c,'#dfb576',-21,-9,12,3);
 for(let j=0;j<5;j++)rect(c,'#f6e8c3',-20+j*2,-9,1,2);
 rect(c,'#4b4a48',-18,-4,1,4);rect(c,'#4b4a48',-11,-4,1,4);
 rect(c,'#734c48',1,-11,7,5);rect(c,'#efc88f',1,-12,7,2);
 rect(c,'#7e5b45',-1,-16,1,8);rect(c,'#dbb573',-4,-16,7,1);
 const colors=['#ffce77','#ec9988','#98d6ca','#d5b4d9'];
 for(let i=0;i<4;i++){
  const x=-24+i*14,col=colors[(i+Math.floor(t/2))%4];
  c.save();c.globalAlpha=.15;slab(c,[[x,-31],[x-8,-6],[x+7,-4]],col);c.restore();
  rect(c,col,x-2,-31,4,3);
 }
 const performer=(x,y,id)=>{c.save();c.translate(x,y);c.scale(.75,.75);drawResident(c,{style:id},{frame:Math.floor(t*4+id)%8,act:'play',right:true,back:false},0,0);c.restore();};
 performer(-10,-5,23);performer(8,-3,10);
 rect(c,'#403e43',3,-13,1,11);rect(c,'#e5cfac',1,-14,4,2);
 for(let i=0;i<3;i++){const f=(t*.35+i/3)%1,x=12+i*4+Math.sin(f*5)*3,y=-10-f*20;
  c.save();c.globalAlpha=1-f;rect(c,'#ffe1a1',x,y,2,2);rect(c,'#ffe1a1',x+2,y-4,1,5);c.restore();}
}
export function bannerPosition(scene){
 if(scene.venue.bannerPosition)return scene.venue.bannerPosition;
 const [cx,cy]=scene.venue.origin,{project,scale}=scene;
 const origin=project(cx+.73,cy+.93);
 // Keep both posts in the square or on a nearby street with a clear sightline.
 const sites=[origin,...scene.roads.filter(r=>Math.hypot(r.x-cx,r.y-cy)<=5).map(r=>project(r.x,r.y))];
 let best=origin,bestScore=Infinity;
 for(const p of sites){
  const [x,y]=p,l=x-61*scale,r=x+62*scale,t=y-50*scale;
  if(l<0||r>scene.base.width||t<0||y+2*scale>scene.base.height)continue;
  let covered=0;
  for(const o of scene.objects){
   if(o.sy<y)continue;
   const box=o.box;
   const width=Math.min(r,box.right)-Math.max(l,box.left);
   const height=Math.min(y+scale,box.bottom)-Math.max(t,box.top);
   if(width>0&&height>0)covered+=width*height;
  }
  const score=covered/(scale*scale)+Math.hypot(x-origin[0],y-origin[1])/scale;
  if(score<bestScore){best=p;bestScore=score;}
  if(score===0)break;
 }
 scene.venue.bannerPosition=best;
 return best;
}
export function drawExamBanner(c,scene,b){
 const [x,y]=bannerPosition(scene);
 c.save();c.translate(x,y);c.scale(scene.scale,scene.scale);
 for(const x of [-59,59]){rect(c,'#6a5548',x,-47,2,48);rect(c,'#e0c99d',x,-48,1,46);rect(c,'#edcd79',x-1,-49,4,3);}
 slab(c,[[-58,-44],[0,-40],[59,-44],[59,-26],[0,-23],[-58,-26]],'#f7e8c6');
 slab(c,[[-58,-44],[0,-40],[59,-44],[59,-42],[0,-38],[-58,-42]],'#b34d44');
 for(const x of [-51,47]){rect(c,'#b85f50',x,-35,3,3);rect(c,'#d09264',x+3,-34,2,2);}
 c.fillStyle='#503b39';c.font='bold 9px "Gmarket Sans",sans-serif';c.textAlign='center';
 c.fillText(b.days?'모의고사 D−'+b.days+'  ·  힘내!':'오늘 시험, 힘내!',0,-28,92);
 c.restore();
}
export function eventActors(c,scene,state,actor){
 if(!state||!scene.venue)return;
 const {origin,cast}=scene.venue,[cx,cy]=origin,{project,scale}=scene;
 const prop=(x,y,ext,draw)=>{
  const [u,v]=project(x,y);actor(v,u+ext[0]*scale,v+ext[1]*scale,u+ext[2]*scale,v+ext[3]*scale,()=>{
   c.save();c.translate(u,v);c.scale(scale,scale);draw();c.restore();
  });
 };
 const e=state.show;if(!e)return;
 const t=e.elapsed,transition=Math.min(23,e.duration*.25),concert=e.type==='concert';
 if(concert)prop(cx-.57,cy-.61,[-40,-36,38,14],()=>stageArt(c,t));
 for(const w of cast.slice(0,concert?14:10)){
  const route=w.route,last=route.length-1,delay=(w.id%5)*.085;
  const arrival=Math.max(0,Math.min(1,(t/transition-delay)/(1-delay)));
  const departure=Math.max(0,Math.min(1,((e.duration-t)/transition-delay)/(1-delay)));
  const f=Math.min(arrival,departure);if(f<=0)continue;
  const at=f*last,i=Math.min(last-1,Math.floor(at)),mix=at-i,a=route[i],b=route[i+1];
  let x=a[0]+(b[0]-a[0])*mix,y=a[1]+(b[1]-a[1])*mix;
  const frame=Math.floor(t*(concert?3:4)+(concert?w.id*.63:Math.floor(w.id/5)*2))%8,performing=f===1;
  if(performing&&!concert){const side=w.id%2?1:-1;x+=side*Math.sin(frame*Math.PI/4)*.13;y+=side*Math.cos(frame*Math.PI/4)*.11;}
  const [u,v]=project(x,y);actor(v,u-8*scale,v-16*scale,u+8*scale,v+2*scale,()=>{
   c.save();c.translate(u,v-(performing&&frame%4===1?1:0)*scale);c.scale(scale*.72,scale*.72);c.globalAlpha=Math.min(1,f*12);
   drawResident(c,w,{frame,act:performing?(concert?'cheer':'dance'):'walk',back:performing?concert:(departure<arrival?b[0]+b[1]>a[0]+a[1]:b[0]+b[1]<a[0]+a[1]),right:performing?w.id%2===0:(b[0]-a[0]-b[1]+a[1])*(departure<arrival?-1:1)>=0},0,0);c.restore();
  });
 }
}

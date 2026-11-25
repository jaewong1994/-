import {onSign} from './roof-sign.js';
import {rewardThumbnail} from './reward-buildings.js';
import {rewardKind,rewardSites,siteName} from './reward-sites.js';
import {cityEvents,bannerPosition} from './city-events.js';
import {urbanPlan,growthHours} from './city-form.js';
import {periods,koreanPeriod} from './city-hours.js';
import {W,H,models,hash,paintTown,townScene,countryScene,rewardNames} from './city-scene.js';
export {townScene,hash};
export const HOURS=3600000,TOWN=240*HOURS;
export const stages=['첫 주택가','동네 형성','생활권 확장','도심 개척','광역 생활권','완성된 도시'];
export const thresholds=growthHours;
export const themes=models.map(m=>m.name+'형');
export const rewards=rewardNames;
function rand(seed,key){let a=hash(seed+'|'+key);a=Math.imul(a^(a>>>16),0x85ebca6b);a=Math.imul(a^(a>>>13),0xc2b2ae35);return ((a^(a>>>16))>>>0)/4294967296;}
export function biome(seed,index){
 const order=themes.map((_,i)=>i).sort((a,b)=>rand(seed,'type'+a)-rand(seed,'type'+b));
 return order[index%order.length];
}
export function townName(seed,index,kind=biome(seed,index)){
 const a=['버들','모래','솔빛','해온','푸른','은빛','노을','새봄','달','가람','새벽','별빛'];
 const b=['강변','역촌','공원','광장','물길','숲길'];
 return a[Math.floor(rand(seed,'name'+index)*a.length)]+b[kind];
}
export function phase(ms){return thresholds.reduce((best,h,i)=>ms>=h*HOURS?i:best,0);}
let dispose=()=>{},cameraMemory=null;
export function stopMap(){dispose();dispose=()=>{};}
export function mountMap(canvas,opts){
 stopMap();if(!canvas)return;
 let live=true,frame=0,zoom=1,panX=0,panY=0,scene,world;
 const viewId=[opts.seed,opts.kind,opts.stage,opts.country,opts.mini].join('/');
 if(cameraMemory?.key===viewId)({zoom,panX,panY}=cameraMemory);
 const points=new Map();let lastDrag,dragged=false,previous=0,elapsed=0,inView=false;
 const motion=matchMedia('(prefers-reduced-motion:reduce)');
 let fit=1,viewW=W,viewH=H,initial=true,clockTimer=0,lightKey=null;
 const shell=canvas.closest('.world-shell'),district=shell?.querySelector('#districtVisit'),picker=shell?.querySelector('#eventVisit');
 const happening=shell?.querySelector('#cityHappening'),blurb=shell?.querySelector('#districtBlurb');
 const placement=shell?.querySelector('#rewardPlace');
 let moving=null,sites=[],selectedSite=null,saving=false;
 function closePlacement(){moving=null;sites=[];selectedSite=null;if(placement)placement.hidden=true;}
 const buildable=new Map();
 if(!opts.country&&!opts.mini){for(let style=0;style<rewardNames.length;style++)for(const lot of rewardSites(opts.plan,style,opts.opened)){
  if(!buildable.has(lot))buildable.set(lot,new Set());buildable.get(lot).add(style);
 }}
 function openLot(plot){
  closePlacement();placement.replaceChildren();placement.hidden=false;
  const header=document.createElement('header'),title=document.createElement('strong'),close=document.createElement('button');
  title.textContent='리워드 건물 짓기';close.type='button';close.textContent='← 뒤로';close.onclick=()=>{if(!saving)closePlacement();};header.append(title,close);
  const list=document.createElement('ul'),status=document.createElement('small');status.setAttribute('role','status');
  const available=opts.gifts.filter(g=>buildable.get(plot.lot).has(g.style)).sort((a,b)=>(a.lot>=0)-(b.lot>=0));
  for(const g of available){
   const li=document.createElement('li'),button=document.createElement('button'),name=document.createElement('b'),action=document.createElement('span');
   button.type='button';name.textContent=rewardNames[g.style];action.textContent=g.lot<0?'짓기':'이곳으로 이전';
   button.append(rewardThumbnail(g.style),name,action);li.append(button);list.append(li);
   button.onclick=async()=>{if(saving)return;saving=true;placement.querySelectorAll('button').forEach(b=>b.disabled=true);
    try{await opts.moveGift(g,plot.lot);}catch(error){status.textContent=error.message;placement.querySelectorAll('button').forEach(b=>b.disabled=false);}finally{saving=false;}
   };
  }
  if(!available.length)status.textContent='이 자리에 지을 수 있는 리워드가 아직 없어요.';
  placement.append(header,list,status);close.focus({preventScroll:true});
 }
 function openPlacement(g){
  if(!placement||!g||opts.goal&&!opts.demo||rewardKind(g.style)==='person'||opts.country||opts.mini)return;
  moving=g;selectedSite=null;placement.replaceChildren();placement.hidden=false;
  const occupied=new Set(opts.gifts.filter(other=>other!==g&&other.lot>=0).map(other=>other.lot));
  const allowed=new Set(rewardSites(opts.plan,g.style,opts.opened));
  sites=scene.objects.filter(o=>o.lot!==undefined&&allowed.has(o.lot)&&o.lot!==g.lot&&!occupied.has(o.lot));
  const title=document.createElement('strong');title.textContent=rewardNames[g.style];
  const select=document.createElement('select');select.setAttribute('aria-label','옮길 자리');
  select.add(new Option(sites.length?'옮길 자리 선택':'개척된 빈자리 없음',''));
  for(const o of sites)select.add(new Option(siteName(opts.plan,o.lot),String(o.lot)));
  if(g.lot!==-1)select.add(new Option('보관함으로','-1'));
  const ok=document.createElement('button');ok.type='button';ok.disabled=true;ok.textContent='옮기기';
  const cancel=document.createElement('button');cancel.type='button';cancel.textContent='← 뒤로';
  const msg=document.createElement('small');msg.setAttribute('role','status');
  const controls=document.createElement('div');controls.append(select,ok,cancel);
  placement.append(title,controls,msg);
  select.onchange=()=>{
   selectedSite=select.value===''?null:Number(select.value);ok.disabled=selectedSite===null;
   const plot=sites.find(o=>o.lot===selectedSite);
   if(plot)centerOn([plot.sx,plot.sy-8*scene.scale],Math.max(zoom,2.5));else draw(elapsed);
  };
  cancel.onclick=()=>{if(!saving){closePlacement();draw(elapsed);}};
  ok.onclick=async()=>{
   if(saving||selectedSite===null)return;
   saving=true;ok.disabled=true;select.disabled=true;cancel.disabled=true;
   try{await opts.moveGift(g,selectedSite);}
   catch(error){msg.textContent=error.message;ok.disabled=false;select.disabled=false;cancel.disabled=false;}
   finally{saving=false;}
  };
  draw(elapsed);select.focus({preventScroll:true});
 }
 function updateTicker(){
  if(!scene||!opts.ticker)return;
  scene.ticker=opts.ticker();
  if(!opts.mini)canvas.setAttribute('aria-description',scene.ticker.join(' / '));
 }
 function refreshSign(){updateTicker();draw(elapsed);}
 canvas.addEventListener('ticker-update',refreshSign);
 function chooseCollected(e){openPlacement(opts.gifts.find(g=>g.exam===e.detail));}
 canvas.addEventListener('select-reward',chooseCollected);
 let eventMode=opts.event||'auto',eventBase=null,eventAt=0,previewStart=0;
 if(picker){if(picker.querySelector('option[value="'+eventMode+'"]')?.disabled){eventMode='auto';opts.setEvent?.('auto');}picker.value=eventMode;}
 function eventClock(now){
  if(opts.country||!scene)return;
  eventAt=now.getTime();eventBase=cityEvents(opts.seed,opts.stage,scene.objects.some(o=>o.id==='fair'),now,eventMode,18+(elapsed-previewStart)/1000,opts.recentAward);
  if(happening){
   const {show,banner}=eventBase,items=[];
   if(show)items.push((show.occasion?show.occasion+' · ':'')+(show.type==='concert'?'광장 콘서트':'깜짝 단체 댄스'));
   if(banner)items.push(banner.name+' '+(banner.days?'D−'+banner.days:'시험 당일')+' · '+banner.grades);
   happening.hidden=!items.length;
   happening.textContent=(eventMode!=='auto'?'미리보기 · ':'')+items.join(' / ')+'  ↗';
  }
 }
 function centerOn(point,factor){
  if(!scene||!point)return;
  const z=Math.min(8,factor);panX=(W/2-point[0])*fit*z;panY=(H/2-point[1])*fit*z;change(z);
 }
 function visitEvent(){
  if(!scene)return;
  const bannerVisit=eventBase?.banner&&(eventMode==='banner'||!eventBase.show);
  const [x,y]=bannerVisit?bannerPosition(scene):scene.project(...scene.venue.origin);
  const worldPixel=fit/(viewW/canvas.getBoundingClientRect().width);
  centerOn([x,y-(bannerVisit?34:11)*scene.scale],Math.max(2.6,1.82/(scene.scale*worldPixel)));
  if(district)district.selectedIndex=-1;
  if(blurb){blurb.hidden=false;blurb.textContent=scene.venue.name;}
 }
 if(happening)happening.onclick=visitEvent;
 if(picker)picker.onchange=()=>{
  eventMode=picker.value;opts.setEvent?.(eventMode);previewStart=elapsed;eventClock(new Date());
  if(eventMode!=='auto')visitEvent();else draw(elapsed);
 };
 if(district)district.onchange=()=>{
  if(!scene)return;
  if(district.value==='full'){change(1);if(blurb)blurb.hidden=true;return;}
  const d=urbanPlan(opts.plan).districts.find(d=>d.id===district.value);
  const target=d?scene.project(4*d.hub[0]+2,4*d.hub[1]+2):scene.focus;
  centerOn(target,viewW<viewH?5:2.8);
  if(blurb){blurb.hidden=false;blurb.textContent=d?d.description:'도시가 처음 자라난 구시가지예요.';}
 };
 const c=canvas.getContext('2d');canvas.width=W;canvas.height=H;
 function draw(time){
  c.imageSmoothingEnabled=false;c.fillStyle=({dawn:"#37405c",morning:"#a5ad7b",day:"#90ab78",evening:"#8c8979",night:"#212b40"})[lightKey]||"#90ab78";c.fillRect(0,0,viewW,viewH);
  c.save();c.translate(viewW/2+panX,viewH/2+panY);c.scale(zoom*fit,zoom*fit);c.translate(-W/2,-H/2);
  if(world){
   c.drawImage(world.base,0,0);const shade=periods[lightKey||'day'].shade;
   if(shade[3]){c.fillStyle='rgba('+shade.join(',')+')';c.fillRect(0,0,W,H);}
  }else if(scene){
   if(eventBase){
    let show=eventBase.show;
    if(show){
     const age=eventMode==='auto'?show.elapsed+Math.max(0,(Date.now()-eventAt)/1000):(18+(time-previewStart)/1000)%show.duration;
     show=age>=show.duration?null:{...show,elapsed:age};
    }
    scene.eventState={banner:eventBase.banner,show};
   }
   paintTown(c,scene,time/1000);
   if(moving)for(const plot of sites){
    const radius=6*scene.scale,mark=plot.lot===selectedSite;
    c.beginPath();c.arc(plot.sx,plot.sy,radius,0,Math.PI*2);c.fillStyle=mark?'#dfaa51':'#366657';c.fill();
    c.strokeStyle='#fff6d6';c.lineWidth=scene.scale;c.stroke();c.fillStyle='#fff6dc';c.font='bold '+Math.max(5,8*scene.scale)+'px sans-serif';c.textAlign='center';c.fillText('+',plot.sx,plot.sy+2.8*scene.scale);
   }
  }
  c.restore();
 }
 function clamp(){
  const mx=Math.max(0,(W*zoom*fit-viewW)/2),my=Math.max(0,(H*zoom*fit-viewH)/2);
  panX=Math.max(-mx,Math.min(mx,panX));panY=Math.max(-my,Math.min(my,panY));
 }
 function change(z){zoom=Math.max(1,Math.min(8,z));clamp();draw(elapsed);const out=document.querySelector('#zoomValue');if(out)out.textContent=Number(zoom.toFixed(1))+'×';const all=canvas.parentElement.querySelector('.map-fit');if(all)all.hidden=zoom<=1;}
 function pos(e){const r=canvas.getBoundingClientRect();return [(e.clientX-r.left)*viewW/r.width,(e.clientY-r.top)*viewH/r.height];}
 const distance=()=>{const [a,b]=[...points.values()];return Math.hypot(a[0]-b[0],a[1]-b[1]);};
 canvas.onpointerdown=e=>{if(opts.mini)return;canvas.setPointerCapture(e.pointerId);points.set(e.pointerId,pos(e));lastDrag=pos(e);dragged=points.size>1||false;};
 canvas.onpointermove=e=>{
  if(!points.has(e.pointerId))return;const xy=pos(e),old=points.get(e.pointerId);
  const before=points.size===2?distance():0;points.set(e.pointerId,xy);
  if(before>1){change(zoom*distance()/before);dragged=true;}
  else if(zoom>1){panX+=xy[0]-old[0];panY+=xy[1]-old[1];clamp();draw(elapsed);}
  if(lastDrag&&Math.hypot(xy[0]-lastDrag[0],xy[1]-lastDrag[1])>5)dragged=true;
 };
 canvas.onpointerup=e=>{
  points.delete(e.pointerId);if(dragged||opts.mini)return;
  const p=pos(e),x=(p[0]-viewW/2-panX)/(zoom*fit)+W/2,y=(p[1]-viewH/2-panY)/(zoom*fit)+H/2;
  if(!world&&scene){
   if(moving){
    if(saving)return;
    const pick=sites.map(o=>[o,Math.hypot(o.sx-x,o.sy-y)]).sort((a,b)=>a[1]-b[1])[0];
    if(pick&&pick[1]<Math.max(9*scene.scale,18/(zoom*fit))){
     const select=placement.querySelector('select');select.value=String(pick[0].lot);select.onchange();
    }
    return;
   }
   if(onSign(scene.academy,scene.scale,x,y)&&opts.showPodium){opts.showPodium();return;}
   const front=[...scene.objects].reverse();
   const hit=front.find(o=>{
    if(o.background||!o.label)return false;
    if(o.sprite){
     const b=o.sprite;if(x<=b.left||x>=b.right||y<=b.top||y>=b.bottom)return false;
     const u=Math.floor((x-b.left)*b.image.width/b.width),v=Math.floor((y-b.top)*b.image.height/b.height);
     return b.image.getContext('2d').getImageData(u,v,1,1).data[3]>32;
    }
    return Math.abs(x-o.sx)<o.dw*.44&&y>o.foot-o.dw*(o.gift?(o.gift.style===13?2.25:1.85):o.hitHeight)&&y<o.foot;
   });
   if(hit){
    if(hit.gift)openPlacement(hit.gift);
    else if(buildable.has(hit.lot)&&(!opts.goal||opts.demo))openLot(hit);
    else opts.inspect?.(hit.label,hit.gift);
   }return;
  }
  if(!world)return;
  const near=[...world.pts].sort((a,b)=>Math.hypot(a.x-x,a.y-y)-Math.hypot(b.x-x,b.y-y))[0];
  if(near&&Math.hypot(near.x-x,near.y-y)<35)opts.openTown(near.i);
 };
 canvas.onpointercancel=e=>points.delete(e.pointerId);
 const zoomOut=canvas.parentElement.querySelector('#zoomValue');if(zoomOut)zoomOut.textContent=zoom+'×';
 const controls=canvas.parentElement.querySelectorAll('[data-zoom]');
 controls.forEach(b=>b.onclick=()=>change(b.dataset.zoom==='reset'?1:zoom+Number(b.dataset.zoom)));
 const delay=opts.mini?120:66;
 function running(){return live&&scene&&inView&&!motion.matches&&!document.hidden&&!document.querySelector('dialog[open]');}
 function tick(){
  if(!running())return;
  const now=performance.now();elapsed+=Math.min(now-previous,250);previous=now;draw(elapsed);
  frame=setTimeout(tick,delay);
 }
 function update(){
  clearTimeout(frame);
  if(running()){previous=performance.now();frame=setTimeout(tick,delay);}
 }
 const visibility=new IntersectionObserver(entries=>{inView=entries[0].isIntersecting;update();});
 visibility.observe(canvas);
 const modals=new MutationObserver(update);
 document.querySelectorAll('dialog').forEach(d=>modals.observe(d,{attributes:true,attributeFilter:['open']}));
 document.addEventListener('visibilitychange',update);motion.addEventListener('change',update);
 function checkClock(){
  clearTimeout(clockTimer);
  const now=new Date(),phase=opts.light&&opts.light!=='auto'?opts.light:koreanPeriod(now);
  if(phase!==lightKey&&!opts.country){
   scene=townScene(opts.seed,opts.kind,opts.stage,opts.gifts,opts.plan,phase,opts.hours);
   updateTicker();
   if(opts.demo)scene.highlightLot=opts.gifts?.find(g=>g.lot>=0)?.lot;
  }
  eventClock(now);
  lightKey=phase;const badge=canvas.parentElement.querySelector('#worldTime');
  if(badge){
   const clock=String((now.getUTCHours()+9)%24).padStart(2,'0')+':'+String(now.getUTCMinutes()).padStart(2,'0');
   const current='한국 '+clock+' · '+periods[koreanPeriod(now)].label;
   badge.textContent=opts.light&&opts.light!=='auto'?periods[phase].label+' 풍경':current;
   const auto=canvas.parentElement.querySelector('#cityLight option[value=auto]');if(auto)auto.textContent=current;
  }
  if(!document.hidden&&live){draw(elapsed);clockTimer=setTimeout(checkClock,60050-(Date.now()%60000));}
 }
 function resize(){
  const r=canvas.getBoundingClientRect();if(!r.width||!r.height)return;
  const ratio=Math.min(2,devicePixelRatio||1);
  const oldFit=fit;
  viewW=Math.round(r.width*ratio);viewH=Math.round(r.height*ratio);canvas.width=viewW;canvas.height=viewH;
  fit=Math.min(viewW/W,viewH/H);panX*=fit/oldFit;panY*=fit/oldFit;
  if(initial&&cameraMemory?.key!==viewId&&!opts.country&&!opts.mini&&!opts.overview){
   zoom=2.5;
   const target=scene?.focus;
   if(district)district.selectedIndex=-1;
   if(target){panX=(W/2-target[0])*fit*zoom;panY=(H/2-target[1])*fit*zoom;}
  }
  initial=false;change(zoom);
 }
 document.addEventListener('visibilitychange',checkClock);
 if(opts.country)world=countryScene(opts.root,opts.count,opts.index,opts.currentStage,opts.towns,opts.countryHours);
 checkClock();resize();const sizeObserver=new ResizeObserver(resize);sizeObserver.observe(canvas);
 if(scene&&eventMode!=='auto'&&!opts.mini)visitEvent();
 draw(0);update();
 dispose=()=>{canvas.removeEventListener('ticker-update',refreshSign);canvas.removeEventListener('select-reward',chooseCollected);sizeObserver.disconnect();clearTimeout(clockTimer);document.removeEventListener('visibilitychange',checkClock);cameraMemory={key:viewId,zoom,panX:panX/fit,panY:panY/fit};live=false;clearTimeout(frame);visibility.disconnect();modals.disconnect();
  document.removeEventListener('visibilitychange',update);motion.removeEventListener('change',update);};
}

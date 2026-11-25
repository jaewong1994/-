import {classroomFrame,classroomCatFrame} from './classroom.js';
import {campusActors} from './campus-life.js';
import {rewardSprite} from './reward-buildings.js';
import {fringe} from './city-edge.js';
import {planVenue,eventActors,drawExamBanner} from './city-events.js';
import {treeTile} from './city-trees.js';
import {bakeFrontage} from './city-frontage.js';
import {cityCamera,cityForm,urbanPlan,development,streetsFor,key,random,hash} from './city-form.js';
import {koreanPeriod,periods,destinations} from './city-hours.js';
import {trips,carPose,car,furniture,lamp,fair} from './city-activity.js';
import {populate} from './city-lots.js';
import {trace,districts,waterfront,streets} from './city-fabric.js';
export {hash};
import {fbm2d} from './vendor/village/value-noise.js';
import {tile,tileHeight,shape,line,cityVisitor,drawPatrol,skyRoute,patrolPose} from './city-art.js';
import {planResidents,residentPose,drawResident} from './village-life.js';

export const W=1440,H=824,limits=[1,3,5,8,11,14];
export const models=await (await fetch('/mm/art/city-plans.json')).json();
export const zones={H:'주택가',S:'상점가',C:'공공시설',O:'업무지구',P:'도시공원',T:'역세권'};
import {rewardNames,rewardKind} from './reward-sites.js';
export {rewardNames};
const names={linden:'보리수',plane:'가로수',bench:'공원 벤치',kiosk:'정류장',fountain:'분수', 'court-yard':'동네 운동장',metro:'전철',cottage:'단독주택',studio:'공방',shop:'동네 가게',market:'상가',glass:'유리 업무동',stone:'업무 타워',office:'오피스',redflat:'공동주택',officepair:'업무 단지',strip:'상점가',tower:'고층 사옥',loft:'복합 업무동',workshop:'작업장',library:'시립 도서관',hospital:'종합병원',fire:'소방서',school:'학교',clinic:'보건소',classroom:'학교 별관',bakery:'작은 상점',factory:'공장',hall:'주민센터',utility:'관리소',park:'근린공원',warehouse:'물류 창고',rowhouse:'연립주택',terrace:'테라스 주택',court:'안뜰 주택',brownstone:'벽돌 연립주택',midrise:'주상복합',brickhigh:'고층 아파트',walkup:'다세대주택',brickflat:'벽돌 주택',blockflat:'아파트',condo:'공동주택',fir:'가로수',pine:'소나무'};
export function examplePlan(seed,kind){
 const m=models[kind];return {kind,feature:m.feature,guide:m.guide,motif:m.name,axisY:4,axisX:4,
  blocks:m.blocks.map(([x,y,z],i)=>[x,y,z,hash(seed+'/'+i)])};
}
function canvas(){const b=document.createElement('canvas');b.width=W;b.height=H;return b;}
function polygon(c,project,coords,color){shape(c,color,coords.map(([x,y])=>project(x,y)));}
function road(c,project,x,y,u,v,color,width){line(c,color,width,[project(x,y),project(u,v)]);}
function landscape(c,project,scale,seed){
 c.fillStyle='#8eab75';c.fillRect(0,0,W,H);
 let n=0;const field=fbm2d(60,60,()=>random(seed,'field'+n++));
 for(let x=-30;x<30;x++)for(let y=-30;y<30;y++){
  const [sx,sy]=project(x+.5,y+.5);if(sx< -30||sx>W+30||sy< -20||sy>H+20)continue;
  const v=field[x+30][y+30];const tint=Math.round((v-.5)*10);
  polygon(c,project,[[x-.03,y-.03],[x+1.03,y-.03],[x+1.03,y+1.03],[x-.03,y+1.03]],'rgb('+[142+tint,171+tint,117+tint].join(',')+')');
  if(v>.49&&random(seed,'grass'+key(x,y))>.75){c.fillStyle='#93b088';c.fillRect(sx,sy,Math.max(1,scale),1);c.fillRect(sx+2,sy-1,1,1);}
 }
}
export function townScene(seed,kind,stage,gifts=[],plan=examplePlan(seed,kind),period=koreanPeriod(),hours=null){
 const progress=hours==null?null:development(plan,hours),blocks=progress?.blocks||plan.blocks.slice(0,limits[stage]),blueprint=urbanPlan(plan),form=cityForm(blueprint);
 const cells=progress?.cells||[...blocks,...blueprint.extras.filter(cell=>cell[4]<=blocks.length)];
 const objects=populate(cells,gifts,blueprint,form,names,rewardNames,stage),{project,scale}=cityCamera(cells,form,W,H,objects,tileHeight);
 const base=canvas(),c=base.getContext('2d');c.imageSmoothingEnabled=false;
 landscape(c,project,scale,seed);
 objects.push(...fringe(c,project,scale,cells,form,String(seed)));
 districts(c,project,scale,cells,plan);
 waterfront(c,project,scale,form,cells);
 const next=progress?.next?.cell||plan.blocks[blocks.length];
 if(next){const [a,b]=next,x=a*4,y=b*4;
  c.setLineDash([3*scale,4*scale]);line(c,'#8e9f78',scale,[[x+.5,y+.5],[x+3.5,y+.5],[x+3.5,y+3.5],[x+.5,y+3.5],[x+.5,y+.5]].map(t=>project(...t)));c.setLineDash([]);}
 const network=streetsFor(cells,form),{roads}=network;
 streets(c,project,scale,network,form);
 objects.push(...furniture(network,form,seed));
 const occupied=new Set(cells.map(([x,y])=>key(x,y)));
 // Neighbouring woodland grows in groves with occasional clearings.
 for(let a=-9;a<=9;a++)for(let b=-9;b<=9;b++){
  if(occupied.has(key(a,b)))continue;
  const tag=key(a,b),density=random(seed,'wood'+tag);
  const cx=4*a+.7+random(seed,'cx'+tag)*2.6,cy=4*b+.7+random(seed,'cy'+tag)*2.6;
  for(let i=0;i<Math.floor(density*density*12);i++){
   const angle=random(seed,tag+'a'+i)*6.283,r=random(seed,tag+'r'+i)*1.45;
   const x=cx+Math.cos(angle)*r,y=cy+Math.sin(angle)*r;
   if(occupied.has(key(Math.floor(x/4),Math.floor(y/4))))continue;
   if(form.waterAxis&&Math.abs((form.waterAxis==='y'?y:x)-form.waterLine)<.94)continue;
   const [u,v]=project(x,y);if(u< -12||u>W+12||v< -7||v>H+20)continue;
   objects.push({t:{x,y},id:['pine','linden','plane','fir'][Math.floor(random(seed,tag+'species'+i)*4)],w:9+random(seed,tag+'crown'+i)*10,background:true,flip:i%2===1});
  }
 }
 let rail=null;
 if(plan.feature==='rail'&&stage>=3){
  const points=roads.filter(t=>t.x===plan.axisX).sort((a,b)=>a.y-b.y);
  let longest=[],run=[];
  for(const t of points){if(run.length&&run.at(-1).y+1!==t.y)run=[];run.push(t);if(run.length>longest.length)longest=run.slice();}
  if(longest.length>=3){
   const a=longest[0],b=longest.at(-1);rail=[a,b];
   for(const d of [.30,.44])line(c,'#66685c',1.2*scale,trace(project,[[a.x+d,a.y],[b.x+d,b.y]]));
   for(let i=a.y;i<b.y;i+=.33)road(c,project,a.x+.26,i,a.x+.48,i,'#8a806a',scale);
  }
 }
 const light=periods[period],shade=light.shade;
 if(shade[3]){c.fillStyle='rgba('+shade.join(',')+')';c.fillRect(0,0,W,H);}
 const cars=trips(network,stage,seed);
 for(const o of objects.filter(o=>o.lamp))if(light.lamps>.35){
  const [x,y]=project(o.t.x,o.t.y);
  c.fillStyle='rgba(255,196,103,'+(light.lamps*.12)+')';c.beginPath();c.ellipse(x,y,5*scale,2.4*scale,-.12,0,Math.PI*2);c.fill();
 }
 const walkers=planResidents(roads,destinations(objects,period),Math.min(35,[2,4,7,13,20,29][stage]+gifts.reduce((n,g)=>n+(g.perfect?2:1),0)),k=>random(seed,k));
 for(const o of objects){
  [o.sx,o.sy]=project(o.t.x,o.t.y);o.dw=o.w*scale;o.foot=o.sy+o.dw*.16;
  o.hitHeight=tileHeight(o.id);o.period=period;
  if(o.gift)o.sprite=rewardSprite(o.gift.style,o.sx,o.id==='fair'?o.sy:o.foot,o.id==='fair'?61*scale:o.dw,period);
  else if(o.design)o.sprite=bakeFrontage(o,scale,period);
  o.box=o.sprite||{left:o.sx-o.dw*.83,right:o.sx+o.dw*.83,top:o.foot-o.dw*(o.gift?2.95:o.hitHeight+.41),bottom:o.foot+o.dw*.18};
  if(o.architecture||o.gift){
   const w=o.dw,shadow=o.gift?1.65:o.hitHeight;
   shape(c,'rgba(65,77,65,.14)',[[o.sx-w*.44,o.sy],[o.sx-w*.39-w*shadow*.21,o.sy+w*.09],[o.sx-w*.13,o.sy+w*.23],[o.sx+w*.29,o.sy+w*.06]]);
  }
 }
 objects.sort((a,b)=>a.sy-b.sy);
 const occluders=new Map(),bucket=64;
 for(const [idx,o] of objects.entries()){
  o.order=idx;const b=o.box;
  for(let x=Math.floor(b.left/bucket);x<=Math.floor(b.right/bucket);x++)for(let y=Math.floor(b.top/bucket);y<=Math.floor(b.bottom/bucket);y++){
   const k=key(x,y);if(!occluders.has(k))occluders.set(k,[]);occluders.get(k).push(o);
  }
 }
 const buildings=objects.filter(o=>o.design),park=objects.find(o=>o.id==='fair');
 const densest=buildings.reduce((best,o)=>{
  const score=buildings.reduce((n,b)=>n+Math.max(0,1-((b.sx-o.sx)**2+(b.sy-o.sy)**2)/(135*scale)**2)*(b.design.zone==='O'?1.35:1),0);
  return score>best.score?{score,o}:best;
 },{score:-1,o:buildings[0]}).o;
 const academy=objects.find(o=>o.id==='academy');
 const focus=stage===0&&academy?[academy.sx,academy.sy-academy.design.height*scale*.52]:park?[(park.sx*3+densest.sx)/4,(park.sy*3+densest.sy)/4-22*scale]:[densest.sx,densest.sy-25*scale];
 const venue=planVenue(cells,roads,form,seed);
 const caretakers=walkers.filter(w=>w.stops.some(stop=>stop.act==='feed'));
 const cats=caretakers.length?caretakers.slice(0,stage>=3?3:1):walkers.slice(0,1);
 const heroes=[...new Set(gifts.map(g=>g.style).filter(style=>rewardKind(style)==='person'))];
 const patrol=gifts.some(g=>g.style===0)?skyRoute(buildings,scale):null;
 return {base,objects,walkers,cars,academy,cats,heroes,patrol,period,focus,venue,occluders,bucket,roads,segments:network.segments,project,scale,blocks,cells,rail};
}
function drawParcel(c,o){
 if(treeTile(c,o))return;
 if(o.id==='streetlamp'){lamp(c,o.sx,o.sy,o.dw/7,o.period);return;}
 if(o.id==='fair')return;
 if(o.id==='fair-square'){tile(c,'fountain',o.sx,o.sy,19*o.dw/71);return;}
 if(o.sprite)c.drawImage(o.sprite.image,o.sprite.left,o.sprite.top,o.sprite.width,o.sprite.height);
 else {c.save();if(o.period==='night'||o.period==='dawn')c.globalAlpha=.55;tile(c,o.id,o.sx,o.foot,o.dw,o.flip);c.restore();}
}
function stillFrame(scene){
 const cv=canvas(),c=cv.getContext('2d');c.imageSmoothingEnabled=false;c.drawImage(scene.base,0,0);
 const parcel=scene.objects.find(o=>o.lot!==undefined&&o.lot===scene.highlightLot);
 if(parcel){
  const {x,y}=parcel.t,d=.87,corners=[[x-d,y-d],[x+d,y-d],[x+d,y+d],[x-d,y+d]].map(q=>scene.project(...q));
  for(let i=0;i<4;i++){
   const a=corners[i],part=b=>a.map((v,j)=>v+(b[j]-v)*.34);
   line(c,'#c79443',2*scene.scale,[part(corners[(i+3)%4]),a,part(corners[(i+1)%4])]);
  }
 }
 for(const o of scene.objects)if(o!==scene.academy)drawParcel(c,o);
 return cv;
}
export function paintTown(c,scene,time){
 const room=scene.academy;
 if(room){
  const frame=classroomFrame(scene.period,time,room.design.seed);
  const catPose=['night','dawn'].includes(scene.period)?classroomCatFrame(time,room.design.seed):0;
  if(room.pose!==frame||room.catPose!==catPose){
   room.catPose=catPose;
   room.pose=frame;
   room.sprite=bakeFrontage(room,scene.scale,scene.period,frame,catPose);
   room.label=['night','dawn'].includes(scene.period)?'재웅T 수업준비중':'입실론수학학원 · 민재웅 선생님 강의 중';
  }
 }
 if(!scene.still||scene.mark!==scene.highlightLot){scene.still=stillFrame(scene);scene.mark=scene.highlightLot;}
 c.drawImage(scene.still,0,0);
 const {scale,project}=scene,actors=[];
 function actor(depth,x0,y0,x1,y1,draw){actors.push({depth,x0,y0,x1,y1,draw});}
 for(const o of scene.objects)if(o.gift)for(const style of o.effects.filter(s=>s>0&&s<5)){
  actor(o.sy+16*scale,o.sx-50*scale,o.foot-76*scale,o.sx+50*scale,o.foot+2*scale,
   ()=>cityVisitor(c,style,o.sx,o.foot,scale,time,o.lot+style));
 }
 campusActors(c,scene,time,actor);
 const light=periods[scene.period];
 for(const o of scene.objects)if(o.id==='fair'){
  actor(o.sy,o.sx-74*scale,o.sy-92*scale,o.sx+74*scale,o.sy+33*scale,()=>fair(c,o.sx,o.sy,1.68*scale,time,scene.period));
 }
 for(const trip of scene.cars.slice(0,Math.ceil(scene.cars.length*light.traffic))){
  const p=carPose(trip,time),[x,y]=project(p.x,p.y);actor(y,x-7*scale,y-7*scale,x+7*scale,y+4*scale,()=>car(c,x,y,scale,p,trip.paint,scene.period));
 }
 for(const w of scene.walkers.slice(0,Math.max(1,Math.round(scene.walkers.length*light.people)))){
  const p=residentPose(w,time),[x,y]=project(p.x,p.y);
  actor(y,x-11*scale,y-15*scale,x+11*scale,y+3*scale,()=>{
   c.save();c.translate(x,y);c.scale(scale*.53,scale*.53);drawResident(c,w,p,0,0);c.restore();
  });
 }
 if(scene.rail){
  const [a,b]=scene.rail,f=(1-Math.cos(time*.22))/2;
  for(let i=0;i<2;i++){const y=a.y+.55+(b.y-a.y-1.5)*f+i*.45;
   const [x,v]=project(a.x+.38,y);actor(v,x-11*scale,v-16*scale,x+11*scale,v+3*scale,()=>tile(c,'metro',x,v,16*scale));}
 }
 eventActors(c,scene,scene.eventState,actor);
 for(const a of actors.sort((a,b)=>a.depth-b.depth)){
  a.draw();
  // A moving resident only invalidates a few pixels of the fixed city in front.
  c.save();c.beginPath();c.rect(a.x0,a.y0,a.x1-a.x0,a.y1-a.y0);c.clip();
  const near=new Set(),size=scene.bucket;
  for(let x=Math.floor(a.x0/size);x<=Math.floor(a.x1/size);x++)for(let y=Math.floor(a.y0/size);y<=Math.floor(a.y1/size);y++){
   for(const o of scene.occluders.get(key(x,y))||[])if(o.sy>a.depth)near.add(o);
  }
  for(const o of [...near].sort((p,q)=>p.order-q.order)){
   const b=o.box;
   if(b.left<a.x1&&b.right>a.x0&&b.top<a.y1&&b.bottom>a.y0)drawParcel(c,o);
  }
  c.restore();
 }
 if(scene.patrol){const [x,y,right]=patrolPose(scene.patrol,scale,time);drawPatrol(c,x,y,scale*1.25,right,time);}
 if(scene.eventState?.banner)drawExamBanner(c,scene,scene.eventState.banner);
}
export function countryScene(root,count,selected,stage,towns=[],hours=null){
 const base=canvas(),c=base.getContext('2d');c.imageSmoothingEnabled=false;
 const cols=Math.ceil(Math.sqrt(count)),rows=Math.ceil(count/cols);
 const step=Math.min(158,W*.74/(cols+1),H*.66/(rows+1));
 const pts=Array.from({length:count},(_,i)=>{
  const row=Math.floor(i/cols),col=row%2?cols-1-i%cols:i%cols;
  return {i,x:W/2+(col-(cols-1)/2)*step+(row-(rows-1)/2)*step*.34,y:H*.48+(row-(rows-1)/2)*step*.72-(col-(cols-1)/2)*step*.16};
 });
 landscape(c,(x,y)=>[W/2+(x-y)*19,H/2+(x+y)*9.5],1,root);
 for(let i=1;i<count;i++){
  const a=pts[i-1],b=pts[i],j=[b.x,a.y+(b.x-a.x)*.35];
  line(c,'#d9caaa',7,[[a.x,a.y],j,[b.x,b.y]]);line(c,'#84908b',4,[[a.x,a.y],j,[b.x,b.y]]);
 }
 for(const p of [...pts].sort((a,b)=>a.y-b.y)){
  const town=towns[p.i],plan=town?.plan||examplePlan(root+p.i,p.i%6),area=plan.blocks.slice(0,limits[p.i<count-1?5:stage]);
  const full=urbanPlan(plan),form=cityForm(full);
  if(hours!=null&&p.i===count-1)area.splice(0,area.length,...development(plan,hours).cells);
  else area.push(...full.extras.filter(cell=>cell[4]<=area.length));
  const extent=area.flatMap(([a,b])=>[[a*4,b*4],[a*4+4,b*4],[a*4,b*4+4],[a*4+4,b*4+4]]).map(q=>form.ground(...q));
  const xs=extent.map(q=>q[0]),ys=extent.map(q=>q[1]),lo=Math.min(...xs),hi=Math.max(...xs),top=Math.min(...ys),bottom=Math.max(...ys);
  const scale=Math.min(step*.76/(hi-lo),step*.50/(bottom-top),.21);
  const project=(x,y)=>{const [sx,sy]=form.ground(x,y);return [p.x+(sx-(lo+hi)/2)*scale,p.y+(sy-(top+bottom)/2)*scale];};
  const samples={H:'terrace-row',O:'terraced-tower',S:'arcade',P:'linden',C:'library',T:'platform',A:'court-yard',I:'warehouse'};
  for(const [a,b,z] of area){
   const x=a*4,y=b*4;polygon(c,project,[[x,y],[x+4,y],[x+4,y+4],[x,y+4]],z==='P'?'#98b27e':'#cdc7ab');
   road(c,project,x,y,x+4,y,'#939c90',1);road(c,project,x,y,x,y+4,'#939c90',1);
  }
  for(const [a,b,z] of [...area].sort((v,w)=>project(v[0]*4,v[1]*4)[1]-project(w[0]*4,w[1]*4)[1])){
   const [u,v]=project(a*4+2,b*4+2);tile(c,samples[z],u,v+2,Math.max(4,scale*84));
  }
  if(p.i===selected){c.fillStyle='#b96542';c.fillRect(p.x-1,p.y-20,2,17);shape(c,'#cc7147',[[p.x,p.y-20],[p.x+11,p.y-17],[p.x,p.y-13]]);}
  if(town?.name){c.font='9px "Gmarket Sans",sans-serif';c.textAlign='center';const label=town.name.length>9?town.name.slice(0,8)+'…':town.name;
   c.fillStyle='#f6f2dc';const w=c.measureText(label).width;c.fillRect(p.x-w/2-3,p.y+13,w+6,13);c.fillStyle='#344c49';c.fillText(label,p.x,p.y+23);}
 }
 return {base,pts};
}


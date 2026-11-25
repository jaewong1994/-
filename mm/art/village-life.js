// Walking pose and opposite arm swing adapted from drawWalkingPedestrian in
// amilich/isometric-city (MIT). See vendor/village/IsoCity-LICENSE.txt.
const directions=[[1,0],[0,1],[-1,0],[0,-1]];
const key=(x,y)=>x+','+y;
const distance=(a,b)=>Math.abs(a.x-b.x)+Math.abs(a.y-b.y);

function reachableFrom(start,adjacent){
 const parents=new Map([[start,null]]),queue=[start];
 for(let i=0;i<queue.length;i++){
  const tile=queue[i];
  for(const next of adjacent.get(tile)){
   if(next&&!parents.has(next)){parents.set(next,tile);queue.push(next);}
  }
 }
 return parents;
}

export function planResidents(roads,objects,count,random){
 const streets=new Map(roads.map(t=>[key(t.x,t.y),t]));
 const adjacent=new Map(roads.map(t=>[t,directions.map(([dx,dy])=>key(t.x+dx,t.y+dy)).filter(k=>!t.exits||t.exits.has(k)).map(k=>streets.get(k)).filter(Boolean)]));
 // A disconnected strip across a river must not strand a villager.
 const reachable=new Set(),components=[];
 for(const t of roads){
  if(reachable.has(t))continue;
  const component=[...reachableFrom(t,adjacent).keys()];
  component.forEach(p=>reachable.add(p));
  if(component.length>1)components.push(component);
 }
 if(!components.length)return [];
 const aims=objects.filter(o=>o.act);
 const stopsByComponent=new Map();
 for(const component of components){
  const stops=[],members=new Set(component);
  for(const o of aims){
   const reach=o.act==='study'?3:1.7;
   let tile=null,nearest=reach;
   for(let x=Math.ceil(o.t.x-reach);x<=o.t.x+reach;x++)for(let y=Math.ceil(o.t.y-reach);y<=o.t.y+reach;y++){
    const p=streets.get(key(x,y));if(!members.has(p))continue;
    const d=distance(p,o.t);if(d<=nearest){tile=p;nearest=d;}
   }
   if(!tile)continue;
   const visit={tile,site:o.t,act:o.act};
   for(let j=0;j<(o.weight||1);j++)stops.push(visit);
  }
  stopsByComponent.set(component,stops);
 }
 const trees=new Map();
 function routesFrom(tile){
  if(!trees.has(tile))trees.set(tile,reachableFrom(tile,adjacent));
  return trees.get(tile);
 }
 return Array.from({length:count},(_,id)=>{
  const component=components[id%components.length];
  const rng=n=>random('resident:'+id+':'+n);
  const destinations=stopsByComponent.get(component);
  const homes=destinations.filter(d=>d.act==='rest'),home=homes.length?homes[Math.floor(rng('home')*homes.length)]:{tile:component[0],act:'rest'};
  const start=home.tile,stops=[home];
  const itinerary=[['feed','shop','rest'],['read','study','shop'],['work','shop','rest'],['shop','work','read']][id%4];
  for(const [idx,act] of itinerary.entries()){
   const last=stops.at(-1).tile;
   const options=destinations.filter(d=>(d.tile!==last||act==='feed')&&d.act===act);
   if(options.length)stops.push(options[Math.floor(rng('visit'+idx)*options.length)]);
  }
  if(stops.every(v=>v.tile===start)){
   const other=destinations.find(d=>d.tile!==start)||{tile:component.find(t=>t!==start),act:'rest'};
   stops.push(other);
  }
  const parks=new Set(destinations.filter(d=>d.act==='exercise').map(d=>d.tile));
  const legs=[];let duration=0,steps=0;
  const pace=.23+rng('pace')*.11;
  function add(a,b,seconds,act){
   legs.push({a,b,begin:duration,end:duration+seconds,steps,act});duration+=seconds;
   if(a!==b)steps++;
  }
  for(let i=0;i<stops.length;i++){
   const from=stops[i].tile,to=stops[(i+1)%stops.length];
   if(from===to.tile){if(to.act==='feed')add(from,from,9,'feed');continue;}
   const parents=routesFrom(from);
   const trail=[];
   for(let t=to.tile;t!==from;t=parents.get(t))trail.push(t);
   let last=from;
   for(const t of trail.reverse()){
    add(last,t,1/pace,'walk');last=t;
    if(parks.has(t)&&rng('exercise'+i+':'+t.x+','+t.y)<.14)add(t,t,14,'exercise');
   }
   add(last,last,(to.act==='study'||to.act==='work'?24:7)+rng('pause'+i)*9,to.act);
  }
  let offset=rng('offset')*duration;
  if(id===0){
   const front=legs.filter(l=>l.act==='walk').reduce((a,b)=>a.a.x+a.a.y>b.a.x+b.a.y?a:b);
   offset=front.begin+.1;
  }
  return {id,stops,legs,duration,offset,laneX:(rng('lane-x')-.5)*.26,
   laneY:(rng('lane-y')-.5)*.26,companion:id%9===2,style:Math.floor(rng('style')*36)};
 });
}

export function residentPose(w,time){
 const at=(time+w.offset)%w.duration,idx=w.legs.findIndex(l=>at<l.end),leg=w.legs[idx];
 const fraction=(at-leg.begin)/(leg.end-leg.begin),moving=leg.a!==leg.b;
 const heading=moving?leg:w.legs[(idx+w.legs.length-1)%w.legs.length];
 const dx=heading.b.x-heading.a.x,dy=heading.b.y-heading.a.y;
 return {x:leg.a.x+(leg.b.x-leg.a.x)*fraction+w.laneX,y:leg.a.y+(leg.b.y-leg.a.y)*fraction+w.laneY,
  right:dx-dy>=0,back:dx+dy<0,frame:moving?Math.floor((leg.steps+fraction)*16)%8:8,
  act:leg.act,beat:Math.floor((at-leg.begin)*2)%2};
}

const jackets=[['#a84e43','#e18359'],['#30546b','#5c93a1'],['#64683b','#a8a35a'],['#80566e','#bd8395'],['#9d6a39','#d2a451'],['#396d6d','#66aaa1']];
const skin=['#edbe87','#b57e5f','#d49e72'],hair=['#443b38','#75543e','#595056','#997252'];
const sprites=new Map();
function personBitmap(w,p){
 const cacheKey=[w.style,p.back,p.frame,p.act,['fish','feed','exercise','study','work'].includes(p.act)?p.beat:0].join('/');
 if(sprites.has(cacheKey))return sprites.get(cacheKey);
 const cv=document.createElement('canvas');cv.width=28;cv.height=27;
 const c=cv.getContext('2d'),box=(col,x,y,a,b)=>{c.fillStyle=col;c.fillRect(x,y,a,b);};
 const [shade,shirt]=jackets[w.style%jackets.length],face=skin[w.style%3],head=hair[Math.floor(w.style/3)%4];
 const angle=p.frame%8*Math.PI/4;
 const swing=p.frame===8?0:Math.sin(angle)*3,arm=Math.round(swing*.67);
 const leg=Math.round(swing),lift=p.frame!==8&&Math.abs(Math.cos(angle))>.7?1:0;
 const bob=p.frame!==8&&Math.abs(leg)>1?1:0,outline='#383e45',shoe='#423830';
 function boot(x,y,near){
  box(near?'#4a5460':'#394651',x,18,2,2);
  box(near?'#52606a':'#394651',x+(near?leg:-leg),y-2,2,3);
  const delta=near?leg:-leg;
  box(near?'#52606a':'#394651',Math.min(x,x+delta),y-3,Math.abs(delta)+2,2);
  box(shoe,x+delta,y,3,1);
 }
 boot(11,23-lift,false);boot(13,24-(leg<0?1:0),true);
 box(outline,10,11+bob,6,8);box(shade,10,12+bob,6,6);box(shirt,11,12+bob,4,5);
 box(shade,9,13+bob,2,4);box(face,9-arm,16+bob,2,2);
 box(shirt,14,13+bob,2,4);box(face,14+arm,16+bob,2,2);
 box(head,10,5+bob,6,5);box(head,11,4+bob,4,1);
 box(face,p.back?14:11,7+bob,p.back?2:5,4);box(face,12,10+bob,2,2);
 if(!p.back){box(face,16,8+bob,1,2);box(outline,15,7+bob,1,1);}
 box(head,10,6+bob,2,3);
 if(w.style%4===0){box(shade,9,5+bob,8,2);box(shirt,11,3+bob,4,2);}
 if(w.style%4===2){box(head,9,7+bob,2,5);}
 if(p.act==='dance'||p.act==='cheer'||p.act==='play'){
  const up=p.frame%4<2;
  box(shirt,7,up?10:13,4,2);box(face,6,up?8:14,2,3);
  box(shirt,15,up?12:9,4,2);box(face,18,up?11:7,2,3);
  if(p.act==='play'){box('#efb75d',14,15,5,4);box('#744e41',18,14,3,2);box('#efcf89',20,12,3,2);}
 }else if(p.act==='exercise'){
  box(shirt,7,12-p.beat*3,4,2);box(shirt,15,12-p.beat*3,4,2);
  box(face,6,11-p.beat*4,2,3);box(face,18,11-p.beat*4,2,3);
 }else if(p.act==='feed'){
  box(shirt,14,16,4,2);box(face,17,18+p.beat,2,2);box('#a85e47',20,23,5,2);
 }else if(p.act==='study'||p.act==='work'||p.act==='read'){
  box('#354859',13,14,7,4);box('#fcdf9a',14,14,2,3);box('#f4eed7',17,13,2,4);
 }else if(p.act==='shop'){
  box('#85553d',16,17,3,2);box('#c48a51',15,19,5,4);
 }else if(p.act==='fish'){
  for(let i=0;i<9;i++)box('#705643',16+i,15-i,2,1);
  box('#dfecdf',25,8,1,11+p.beat);box('#db694c',24,19+p.beat,3,2);
 }
 sprites.set(cacheKey,cv);return cv;
}
export function drawResident(c,w,p,x,y){
 c.save();c.translate(Math.round(x),Math.round(y));c.scale(p.right?.76:-.76,.76);
 c.fillStyle='#364a492f';c.fillRect(-4,-1,9,2);
 if(w.companion){
  const foot=p.frame<8&&p.frame%4<2?1:0;
  c.fillStyle='#80634d';c.fillRect(3,-5,3,1);c.fillRect(6,-4,3,1);
  c.fillStyle='#79513b';c.fillRect(8,-5,6,3);c.fillRect(12,-7,3,3);c.fillRect(7,-6,2,2);
  c.fillStyle='#bf9268';c.fillRect(9,-5,4,2);c.fillRect(14,-5,2,1);
  c.fillStyle='#51473e';c.fillRect(9-foot,-2,1,2);c.fillRect(12+foot,-2,1,2);
 }
 c.drawImage(personBitmap(w,p),-13,-24);c.restore();
}


import {line,shape} from './city-art.js';
import {random,key} from './city-form.js';
import {periods,surface} from './city-hours.js';

const drivable=new Set(['boulevard','avenue','street','local']);
export function trips(network,stage,seed){
 if(stage<3)return [];
 const neighbours=new Map(),tags=new Map();
 for(const {a,b,kind} of network.segments)if(drivable.has(kind)){
  if(!neighbours.has(a))neighbours.set(a,[]);if(!neighbours.has(b))neighbours.set(b,[]);
  neighbours.get(a).push(b);neighbours.get(b).push(a);if(kind==='boulevard'||kind==='avenue')tags.set(a,true);
 }
 const starts=[...tags.keys()];if(!starts.length)return [];
 const result=[];
 for(let i=0;i<[0,0,0,6,11,17][stage];i++){
  const start=starts[Math.floor(random(seed,'car-start'+i)*starts.length)],visited=new Map([[start,null]]),queue=[start];
  for(let j=0;j<queue.length;j++)for(const b of neighbours.get(queue[j]))if(!visited.has(b)){visited.set(b,queue[j]);queue.push(b);}
  const far=queue.slice(Math.max(1,Math.floor(queue.length*.46)));if(!far.length)continue;
  const dest=far[Math.floor(random(seed,'car-end'+i)*far.length)],out=[];
  for(let a=dest;a;a=visited.get(a))out.unshift(a);
  const used=new Set(out.slice(1).map((a,k)=>[key(a.x,a.y),key(out[k].x,out[k].y)].sort().join('/')));
  const back=new Map([[dest,null]]),search=[dest];
  for(let j=0;j<search.length&&!back.has(start);j++)for(const b of neighbours.get(search[j])){
   const a=search[j],id=[key(a.x,a.y),key(b.x,b.y)].sort().join('/');
   if(used.has(id)||back.has(b))continue;back.set(b,a);search.push(b);
  }
  let ret=out.slice(1,-1).reverse();
  if(back.has(start)){ret=[];for(let a=back.get(start);a&&a!==dest;a=back.get(a))ret.unshift(a);}
  const route=[...out,...ret];result.push({route,offset:random(seed,'car-pos'+i)*route.length,speed:.8+random(seed,'pace'+i)*.58,paint:i%7});
 }
 return result;
}
export function carPose(trip,time){
 const {route}=trip,v=(time*trip.speed+trip.offset)%route.length,i=Math.floor(v),t=v-i,a=route[i],b=route[(i+1)%route.length];
 const dx=b.x-a.x,dy=b.y-a.y;
 return {x:a.x+dx*t-dy*.071,y:a.y+dy*t+dx*.071,dx,dy};
}
export function car(c,x,y,s,p,index,period){
 const [dx,dy]=[p.dx,p.dy],col=['#c9554c','#f0dbbb','#7796ac','#507e7e','#d4a64d','#8888a0','#dfdfd2'][index];
 const point=(u,v,h=0)=>{const a=dx*u-dy*v,b=dy*u+dx*v;return [x+(a-b)*s,y+((a+b)*.5-h)*s];};
 const panel=(color,pts)=>shape(c,surface(color,period),pts.map(q=>point(...q)));
 panel('#45545c',[[-3,-1.55,0],[3.6,-1.55,0],[3.6,1.55,0],[-3,1.55,0]]);
 for(const side of [-1,1])panel(col,[[-3,side*1.5,.4],[3.6,side*1.5,.4],[3.6,side*1.5,1.7],[-3,side*1.5,1.7]]);
 panel(col,[[-3,-1.55,1.8],[3.6,-1.55,1.8],[3.6,1.55,1.8],[-3,1.55,1.8]]);
 panel('#7498a9',[[-1.9,-1.3,2],[-1.2,-1,3.2],[.8,-1,3.2],[1.65,-1.3,2],[1.65,1.3,2],[.8,1,3.2],[-1.2,1,3.2],[-1.9,1.3,2]]);
 panel(col,[[-1.3,-1,3.3],[.8,-1,3.3],[.8,1,3.3],[-1.3,1,3.3]]);
 for(const v of [-.95,.95]){const [xx,yy]=point(3.65,v,1);c.fillStyle=periods[period].lamps>.4?'#fff0aa':'#d4cfb7';c.fillRect(xx,yy,Math.max(1,s*1.2),Math.max(1,s));}
}
export function furniture(network,form,seed){
 const out=[],seen=new Set();
 for(const {a,b,kind,bridge} of network.segments){
  if(bridge||!['boulevard','avenue','street','market','greenway'].includes(kind)||(a.x+a.y)%3!==0)continue;
  const tag=key(a.x,a.y);if(seen.has(tag))continue;seen.add(tag);
  const side=random(seed,'lamp'+tag)<.5?-.22:.22,dx=b.x-a.x,dy=b.y-a.y,x=a.x+dx*.48-dy*side,y=a.y+dy*.48+dx*side;
  if(form.waterAxis&&Math.abs((form.waterAxis==='x'?x:y)-form.waterLine)<.77)continue;
  out.push({id:'streetlamp',t:{x,y},w:7,ordinaryWidth:7,lamp:kind==='market'?'shop':'street',background:true});
 }
 return out;
}
export function lamp(c,x,y,s,period){
 const level=periods[period].lamps,tip=[x+2*s,y-8*s];
 line(c,surface('#566475',period),1.1*s,[[x,y],[x,y-7*s],tip]);c.fillStyle=level>.4?'#ffe79a':surface('#e6d6ac',period);c.fillRect(tip[0],tip[1],2*s,1.3*s);
 if(level>.4){c.fillStyle='rgba(255,214,113,'+(level*.18)+')';c.fillRect(tip[0]-s,tip[1]-s,4*s,3*s);}
}

export function fair(c,x,y,s,time,period){
 c.save();c.translate(Math.round(x),Math.round(y));c.scale(s,s);
 const lit=periods[period].lamps>.4&&period!=='dawn',color=h=>surface(h,period);
 const poly=(h,p)=>shape(c,color(h),p),stroke=(h,w,p)=>line(c,color(h),w,p);
 const box=(h,a,b,w,d,on=false)=>{c.fillStyle=on?h:color(h);c.fillRect(Math.round(a),Math.round(b),w,d);};
 poly('#cfc6a1',[[-36,-2],[-4,-17],[35,0],[4,15]]);
 poly('#73966b',[[-34,-2],[-22,-8],[-9,-2],[-20,4]]);
 // Ferris wheel in a vertical plane; the hanging cabins stay upright.
 for(const d of [-2,2]){stroke('#577a87',2.3,[[-17+d,2],[-9+d,-25],[-1+d,-3]]);}
 const wheel=(a,back)=>[-9+Math.cos(a)*17+back,-25+Math.sin(a)*17+Math.cos(a)*3-back*.4];
 const rotation=period==='dawn'?0:time*.12;
 for(const offset of [-2,0]){
  const rim=Array.from({length:33},(_,i)=>wheel(i*Math.PI/16+rotation,offset));
  stroke(offset?'#576b83':'#ecd7ad',2,rim);
  if(!offset&&lit)for(const p of rim)box('#ffda7e',p[0],p[1],1.5,1.5,true);
 }
 for(let i=0;i<12;i++){
  const p=wheel(i*Math.PI/6+rotation,0);stroke('#b5a6a4',.75,[[-9,-25],p]);box('#e8cc84',p[0]-1,p[1]-1,2,2,lit);
  if(i%2===0){stroke('#526870',1,[p,[p[0],p[1]+2]]);box(['#d47764','#6c99b3','#d6ae57'][i/2%3],p[0]-2,p[1]+2,4,3);}
 }
 box('#f2c66d',-11,-27,4,4,lit);
 poly('#a6796a',[[5,0],[16,-5],[29,0],[17,5]]);for(const a of [9,15,23])stroke('#b29b75',1,[[a,1],[a,-7]]);
 for(let j=0;j<6;j++){const u=4+j*4;poly(j%2?'#edc59a':'#c96766',[[16,-15],[u,-6+Math.abs(16-u)*.13],[u+4,-6+Math.abs(12-u)*.13]]);}
 for(let j=0;j<4;j++){const a=time*(period==='dawn'?0:.58)+j*Math.PI/2,xx=16+Math.cos(a)*7,yy=-2+Math.sin(a)*2;
  box(j%2?'#d1916a':'#8da6a9',xx,yy,3,2);box('#d2ac76',xx+1,yy-2,1,3);}
 // A bulb-lined castle gate frames the arrival plaza beside the moving rides.
 for(const [xx,yy] of [[1,10],[15,6]]){
  poly('#be8671',[[xx-2,yy],[xx+2,yy+1],[xx+2,yy-6],[xx-2,yy-7]]);
  poly('#705d82',[[xx-3,yy-6],[xx,yy-13],[xx+3,yy-5]]);box('#f0bf73',xx,yy-14,3,1,lit);
 }
 for(let i=0;i<7;i++)box('#f4d58b',2+i*2,3-i*.4,1,1,lit);
 box('#efc98b',15,-17,2,3,lit);stroke('#875e65',2,[[4,10],[4,4],[13,0],[13,6]]);stroke('#dfb771',2,[[3,4],[13,-1]]);
 c.restore();
}

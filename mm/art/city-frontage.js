import {drawClassroom} from './classroom.js';
import {surface,periods} from './city-hours.js';

// Native two-to-one pixel axes. The footprint, facade and roof use the same
// coordinates as the streets; height is exclusively a vertical screen offset.
const finishes=[
 ['#f0ecda','#d1d2c9','#a2b0ad','#71859c'],['#eee3ca','#cec1aa','#9eaaae','#b76851'],
 ['#e0e7e4','#bbcbd0','#859ca8','#507494'],['#e3cead','#c6ab91','#998e86','#779473'],
 ['#d38c70','#ab7265','#7d7979','#555f80'],['#e9dac7','#c6b8b5','#9c979d','#786a8f']
];
const cached=new Map(),roomFrames=new Map();
function bitmap(d,period,pose,catPose){
 const {rx,ry,height:h,type,seed}=d;
 const hw=Math.ceil(rx+ry)+4,up=Math.ceil(d.sky)+10,down=Math.ceil((rx+ry)/2)+4;
 const density=type==='academy'?2:1;
 const image=document.createElement('canvas');image.width=hw*2*density;image.height=(up+down)*density;
 const c=image.getContext('2d');c.scale(density,density);c.translate(hw,up);
 function paint(color,pts,lit=false){
  c.fillStyle=lit?color:surface(color,period);c.beginPath();
  pts.forEach(([x,y],i)=>i?c.lineTo(Math.round(x),Math.round(y)):c.moveTo(Math.round(x),Math.round(y)));c.closePath();c.fill();
 }
 const P=(x,y,z=0)=>[x-y,(x+y)*.5-z];
 const poly=(color,xyz,lit=false)=>paint(color,xyz.map(t=>P(...t)),lit);
 const slab=(x0,y0,x1,y1,z,col)=>poly(col,[[x0,y0,z],[x1,y0,z],[x1,y1,z],[x0,y1,z]]);
 const rect=(col,x,y,w,h,lit=false)=>{c.fillStyle=lit?col:surface(col,period);c.fillRect(Math.round(x),Math.round(y),Math.max(1,Math.round(w)),Math.max(1,Math.round(h)));};
 const n=(a,b=0)=>{let v=Math.imul((seed^Math.imul(a+1,1597334677)^Math.imul(b+3,3812015801))>>>0,2246822519);return ((v^(v>>>15))>>>0)/4294967296;};
 const pick=(arr,k)=>arr[Math.floor(n(k)*arr.length)];
 const pal=finishes[seed%finishes.length],roof=pick(['#535d80','#b56757','#68858c','#687a98','#ad795d','#72896e'],41);
 const warm=['#ffdb79','#ffeeb0','#efb360','#f9d899'],winRate=periods[period].windows[d.zone]??.12;
 function face(x0,y0,x1,y1,z0,z1,side,u0,u1,h0,h1,color,lit=false){
  const q=(u,h)=>side?P(x1,y0+(y1-y0)*u,h):P(x0+(x1-x0)*u,y1,h);
  paint(color,[q(u0,z0+h0),q(u1,z0+h0),q(u1,z0+h1),q(u0,z0+h1)],lit);
 }
 function mass(x0,y0,x1,y1,z0,z1,finish='normal',fenestration=true){
  const glass=finish==='glass',dark=finish==='charcoal',brick=finish==='brick',white=finish==='ivory';
  const left=glass?'#749ab2':dark?'#747d94':brick?'#c1846b':white?'#e9e9dd':pal[0];
  const right=glass?'#416c8a':dark?'#505c78':brick?'#975e56':white?'#acbbbf':pal[1];
  const roofcol=glass?'#9aafb6':dark?'#8792a0':brick?'#b39986':white?'#c6d0c7':pal[2];
  for(let side=0;side<2;side++){
   const f=(u,v,low,high,col,light=false)=>face(x0,y0,x1,y1,z0,z1,side,u,v,low,high,col,light);
   const height=z1-z0,len=side?y1-y0:x1-x0,cols=Math.max(2,Math.round(len/(glass?3.9:5.1)));
   f(0,1,0,height,side?right:left);
   if(!fenestration)continue;
   const rows=Math.max(1,Math.floor((height-1)/d.floorHeight)),pitch=(height-1)/rows;
   for(let r=0;r<rows;r++){
    const z=1+r*pitch;
    if(glass||type==='balcony'||type==='retail'&&r===0)f(0,1,z,z+.75,glass?(side?'#828fa0':'#b7cbd1'):(side?'#9aa2a0':'#d4d5c4'));
    for(let k=0;k<cols;k++){
     const q=k/cols,sz=1/cols;
     const on=n(k+side*57,r+Math.floor(z0)*2)<winRate;
     const pane=on?warm[Math.floor(n(126+k,r)*warm.length)]:glass?
      (k%4===0?(side?'#547d99':'#a0c2cb'):(side?'#345872':'#64839e')):
      (side?'#546572':r%4===2?'#7d94a0':'#637f91');
     f(q+sz*(glass?.09:.19),q+sz*(glass?.88:.72),z+.55,Math.min(height,z+pitch*(glass?.84:.78)),pane,on);
     if(!glass&&r>0&&k%3===1&&type==='apartment')f(q+.08*sz,q+.80*sz,z-.3,z+.45,side?'#c2c7bf':'#f4ecdb');
    }
   }
   if(type==='apartment'||type==='balcony'||type==='glass'){
    const band=type==='glass'?.54:.30,rail=type==='glass'?'#c6d9d7':pick(['#628197','#a87965','#748d82','#a69577'],9);
    f(band,band+Math.min(.15,2.3/len),0,height,rail);
   }
   f(0,1,height-1.2,height,side?'#a2acaa':'#eee8cf');
  }
  slab(x0,y0,x1,y1,z1,roofcol);
  return z1;
 }
 const ax=rx*.94,ay=ry*.94,glass=['glass','fin','setback','twin'].includes(type);
 const box=(a,b,z0,z1,finish='normal',windows=true)=>mass(-a,-b,a,b,z0,z1,finish,windows);
 function gable(a,b,z,col,rise){
  poly(col,[[-a,-b,z],[a,-b,z],[a,0,z+rise],[-a,0,z+rise]]);
  poly(col,[[-a,0,z+rise],[a,0,z+rise],[a,b,z],[-a,b,z]]);
  poly(pal[1],[[a,-b,z],[a,b,z],[a,0,z+rise]]);
  for(let i=-a+3;i<a-2;i+=7)poly('#b5a8a7',[[i,0,z+rise],[i+.65,0,z+rise],[i+.65,b,z],[i,b,z]]);
  const q=P(a*.3,0,z+rise);rect('#7f655d',q[0],q[1]-3,2,4);
 }
 function mechanical(a,b,z){
  slab(-a*.79,-b*.69,a*.79,b*.69,z+.25,'#afb6ac');
  if(type==='balcony'||d.feature==='garden'&&seed%3===0)slab(-a*.65,-b*.55,a*.58,b*.56,z+.6,'#84a274');
  mass(-a*.55,-b*.50,-a*.12,-b*.12,z+1,z+3,'ivory',false);
  if(a+b>16)mass(a*.16,b*.1,a*.49,b*.45,z+1,z+2.6,'charcoal',false);
 }
 slab(-rx,-ry,rx,ry,0,'#b8b9a9');
 if(glass){
  const low=Math.max(7,Math.round(h*.16));box(ax,ay,0,low,'ivory');
  if(type==='twin'){
   const short=h*.77;mass(-ax*.93,-ay*.88,ax*.14,ay*.70,low,h,'glass');
   mass(ax*.25,-ay*.5,ax*.92,ay*.80,low,short,'charcoal');
  }else if(type==='setback'||type==='fin'){
   const z=Math.round(h*.69);box(ax*.84,ay*.84,low,z,'glass');box(ax*.62,ay*.62,z,h,type==='fin'?'charcoal':'glass');
   box(ax*.32,ay*.31,h,h+4,'ivory',false);
   if(type==='fin'){box(ax*.14,ay*.14,h+4,h+11,'glass',false);rect('#a7afb2',0,-h-20,1,11);rect('#ffd37a',0,-h-20,1,1,true);}
  }else{box(ax*.87,ay*.88,low,h,seed%5===1?'charcoal':'glass');mechanical(ax*.83,ay*.82,h);}
 }else if(type==='academy'){
  box(ax,ay,0,h,'ivory',false);
  face(-ax,-ay,ax,ay,0,h,1,.05,.96,2,h-2,'#527683');
  for(const u of [.12,.42,.72])face(-ax,-ay,ax,ay,0,h,1,u,u+.18,3,h-4,'#abd4cc');
  const interior=1.42;c.save();c.scale(interior,interior);
  drawClassroom(c,{...d,rx:d.rx/interior,ry:d.ry/interior,height:h/interior},period,pose,catPose);c.restore();
 }else if(type==='apartment'||type==='balcony'){
  box(ax,ay,0,6,'normal');
  if(type==='balcony'){
   const split=Math.round(h*.60);box(ax*.98,ay*.88,6,split,'ivory');
   slab(-ax*.9,-ay*.8,ax*.9,ay*.8,split+.2,'#709d74');box(ax*.75,ay*.64,split,h,'ivory');mechanical(ax*.70,ay*.62,h);
  }else{box(ax*.91,ay*.9,6,h,['ivory','normal','brick','ivory','charcoal'][seed%5]);mechanical(ax*.86,ay*.85,h);}
 }else if(type==='museum'||type==='clock'){
  box(ax,ay,0,3,'ivory',false);box(ax*.90,ay*.82,3,h,'ivory');
  for(let i=0;i<5;i++){const x=(-.74+i*.36)*ax;mass(x-1,ay*.80,x+1,ay*.93,3,h,'ivory',false);}
  gable(ax*.96,ay*.93,h,'#697d8d',5);
  if(type==='clock'){
   box(ax*.26,ay*.28,h+2,h+14,'normal',false);const q=P(ax*.26,ay*.27,h+10);
   rect('#fbefd3',q[0]-2,q[1]-2,4,4);rect('#506878',q[0],q[1]-1,1,2);
   poly('#527b84',[[-ax*.33,ay*.36,h+14],[ax*.33,ay*.36,h+14],[0,0,h+21]]);
   poly('#3d626c',[[ax*.33,ay*.36,h+14],[ax*.33,-ay*.36,h+14],[0,0,h+21]]);
  }
 }else if(type==='station'||type==='wintergarden'){
  box(ax,ay,0,h*.65,'ivory');
  const z=h*.65,rise=type==='station'?8:10;
  for(let i=0;i<6;i++){const a=i/6,b=(i+1)/6;
   const edge=(x,t)=>[x,ay*(2*t-1),z+Math.sin(Math.PI*t)*rise];
   poly(['#8fa9ac','#bbd1c6','#d2e1cf','#a1c8bc','#7ba7a9','#759a9e'][i],[edge(-ax,a),edge(ax,a),edge(ax,b),edge(-ax,b)]);
   for(let xx=-ax+3;xx<ax;xx+=6)poly('#e1dfc8',[edge(xx,a),edge(xx+.7,a),edge(xx+.7,b),edge(xx,b)]);
   poly('#9eb7b3',[[ax,ay*(2*a-1),z],edge(ax,a),edge(ax,b),[ax,ay*(2*b-1),z]]);
  }
 }else if(type==='factory'||type==='shed'||type==='fieldhouse'){
  box(ax,ay,0,h,type==='factory'?'brick':'normal');
  gable(ax,ay,h,type==='fieldhouse'?'#47798a':'#788498',5);
  if(type==='factory')for(let i=0;i<2;i++){
   const x=ax*(i?-.2:.32),y=-ay*.35;mass(x-1.5,y-1.5,x+1.5,y+1.5,h+2,h+18-i*4,'brick',false);
   mass(x-1.6,y-1.6,x+1.6,y+1.6,h+12-i*4,h+14-i*4,'ivory',false);
  }
 }else{
  box(ax,ay,0,h,type==='school'?'brick':type==='retail'?'ivory':'normal');
  if(type==='gable'||type==='terrace')gable(ax,ay,h,roof,type==='gable'?7:4.5);
  else mechanical(ax,ay,h);
  if(type==='school'){
   const clock=P(ax*.1,ay,h-3),flag=P(-ax*.48,-ay*.40,h+1);
   rect('#505955',clock[0]-2,clock[1]-2,5,5);rect('#f2e3bd',clock[0]-1,clock[1]-1,3,3,true);
   rect('#525c59',clock[0],clock[1]-1,1,2);
   rect('#bcbca7',flag[0],flag[1]-7,1,8);
   paint('#578091',[[flag[0]+1,flag[1]-7],[flag[0]+7,flag[1]-6],[flag[0]+5,flag[1]-3],[flag[0]+1,flag[1]-4]]);
  }
  if(type==='retail'){
   for(let j=0;j<6;j++){
    const x=-ax+ax*j/3,end=x+ax/3,col=j%2?'#f5dcb5':pick(['#b95c54','#507b7c','#c8914f','#5d7d98'],4);
    poly(col,[[x,ay,5],[end,ay,5],[end,ry,3],[x,ry,3]]);
   }
   const q=P(ax*.84,ay,8);rect('#614e52',q[0],q[1],3,6);rect(period==='night'?'#ffcb84':'#d98b63',q[0],q[1],2,4,period==='night');
  }
 }
 return {image,hw,up,density};
}
export function bakeFrontage(o,scale,period,pose=0,catPose=0){
 const d=o.design,key=[d.seed,d.type,d.rx.toFixed(3),d.ry.toFixed(3),period,pose,catPose].join('/');
 const frames=d.type==='academy'?roomFrames:cached,limit=d.type==='academy'?24:1000;
 let b=frames.get(key);
 if(!b){b=bitmap(d,period,pose,catPose);if(frames.size>=limit)frames.delete(frames.keys().next().value);frames.set(key,b);}
 const left=Math.round(o.sx-b.hw*scale),top=Math.round(o.sy-b.up*scale),width=Math.ceil(b.image.width*scale/b.density),height=Math.ceil(b.image.height*scale/b.density);
 return {image:b.image,left,top,width,height,right:left+width,bottom:top+height};
}

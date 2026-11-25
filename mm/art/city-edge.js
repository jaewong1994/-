import {random,key} from './city-form.js';
import {shape,line} from './city-art.js';

// Paint a single field across parcel boundaries. The smooth distance field rounds
// outside corners while every developed parcel keeps its original flat footprint.
export function fringe(c,project,scale,cells,form,seed){
 const blocks=new Set(cells.map(([a,b])=>key(a,b))),near=new Set();
 for(const [a,b] of cells)for(let i=-1;i<=1;i++)for(let j=-1;j<=1;j++)
  if(!blocks.has(key(a+i,b+j)))near.add(key(a+i,b+j));
 const shrubs=[];
 const ridge=(x,y)=>Math.sin(x*.37+y*.20+seed.length)*.32+Math.sin(y*.68-x*.15)*.24;
 for(const addr of near){
  const [a,b]=addr.split(',').map(Number);
  const neighbors=cells.filter(([i,j])=>Math.abs(i-a)<=1&&Math.abs(j-b)<=1);
  const distance=(x,y)=>Math.min(...neighbors.map(([i,j])=>Math.hypot(Math.max(4*i-x,0,x-4*i-4),Math.max(4*j-y,0,y-4*j-4))));
  for(let i=0;i<8;i++)for(let j=0;j<8;j++){
   const salt=addr+'/'+i+'/'+j,r=random(seed,'edge/'+salt);
   const x=a*4+(i+.12+.76*random(seed,'east'+salt))/2,y=b*4+(j+.12+.76*random(seed,'north'+salt))/2;
   const d=distance(x,y),wave=ridge(x,y);
   if(d>2.45+wave||d<.10)continue;
   const tint=Math.max(0,1-d/(2.65+wave)),[u,v]=project(x,y);
   c.fillStyle='rgba(185,179,134,'+(tint*.63)+')';c.beginPath();c.ellipse(u,v,(12+4*r)*scale,(6+2*r)*scale,-.1,0,2*Math.PI);c.fill();
   if(form.waterAxis&&Math.abs((form.waterAxis==='x'?x:y)-form.waterLine)<.91)continue;
   if(d>.48&&r>.71+Math.cos(x*.66+y*.31)*.12){
    shrubs.push({id:r>.94?'plane':r>.83?'linden':'pine',t:{x,y},w:4+d*(1.1+r*3.1),background:true,flip:r>.88});
   }
  }
  // Some dead ends continue as narrow dirt paths into small market gardens.
  const sides=[[1,0],[0,1],[-1,0],[0,-1]].filter(([dx,dy])=>blocks.has(key(a-dx,b-dy)));
  if(!sides.length||random(seed,'gardenlot'+addr)>.41)continue;
  const [dx,dy]=sides[0],x=4*a+2-2*dx,y=4*b+2-2*dy;
  const p=(along,across)=>project(x+dx*along-dy*across,y+dy*along+dx*across);
  const hand=random(seed,'hedge'+addr)<.5?-1:1,end=2.2+random(seed,'track'+addr)*1.15;
  const track=[p(0,-.15*hand),p(.48,-.2*hand),p(.90,-.03*hand),p(1.40,.37*hand),p(1.9,.46*hand),p(end,.24*hand)];
  line(c,'#b5a386',3.3*scale,track);line(c,'#d8c5a1',1.9*scale,track);
  const world=(u,v)=>({x:x+dx*u-dy*v,y:y+dy*u+dx*v});
  const bankSafe=t=>!form.waterAxis||Math.abs((form.waterAxis==='x'?t.x:t.y)-form.waterLine)>1.05;
  for(const [idx,[along,off]] of [[1.1,-.52*hand],[end-.22,.77*hand]].entries()){
   const t=world(along,off);if(!bankSafe(t)||blocks.has(key(Math.floor(t.x/4),Math.floor(t.y/4))))continue;
   const corners=[[-.33,-.28],[.38,-.28],[.36,.36],[-.35,.33]].map(([u,v])=>project(t.x+u,t.y+v));
   shape(c,idx?'#9caf83':'#bfb391',corners);
   shrubs.push({id:idx?'cottage':'bakery',label:idx?'외곽 전원주택':'텃밭 관리동',t,w:idx?21:15,ordinaryWidth:idx?21:15,background:true,flip:hand<0});
  }
  for(let n=0;n<4;n++){
   const k=.35+n*.20;shape(c,n%2?'#96a477':'#ad9d74',[p(.78,k),p(1.56,k+.17),p(1.5,k+.29),p(.77,k+.10)]);
  }
 }
 return shrubs;
}

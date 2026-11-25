import {extendCity} from './metropolis.js';
// The saved district coordinates and lot numbers are the growth ledger. This mesh
// turns those coordinates into a continuous city, shared by streets, people and rivers.
const profiles={
 river:  {x:1.35,y:1.18,long:'x'},
 rail:   {x:1.13,y:1.54,long:'y'},
 park:   {x:1.7,y:1.02,long:'x'},
 court:  {x:1.28,y:1.28,long:'y'},
 canal:  {x:1.16,y:1.42,long:'y'},
 garden: {x:1.45,y:1.24,long:'x'}
};
export const key=(x,y)=>x+','+y;
export function hash(s){let h=2166136261;for(const c of String(s))h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0;}
export function random(seed,label){let a=hash(seed+'|'+label);a=Math.imul(a^(a>>>16),0x85ebca6b);a=Math.imul(a^(a>>>13),0xc2b2ae35);return ((a^(a>>>16))>>>0)/4294967296;}
// Annexes are reserved on the completed blueprint. They open alongside a parent
// district, so added housing never displaces an earlier street or a reward parcel.
const builtPlans=new WeakMap();
export function urbanPlan(plan){
 if(builtPlans.has(plan))return builtPlans.get(plan);
 const core=plan.blocks,seed=core[0][3],occupied=new Map(core.map(b=>[key(b[0],b[1]),b]));
 const extras=[],directions=[[1,0],[-1,0],[0,1],[0,-1]];
 const horizontal=['river','park','garden'].includes(plan.feature);
 const sign=random(seed,'expansion-shore')<.5?-1:1;
 const count=10+Math.floor(random(seed,'annex-count')*4);
 for(let i=0;i<count;i++){
  const candidates=new Map();
  for(const parcel of occupied.values())for(const [dx,dy] of directions){
   const x=parcel[0]+dx,y=parcel[1]+dy,k=key(x,y);
   if(!occupied.has(k))candidates.set(k,[x,y]);
  }
  const ranked=[...candidates.values()].map(([x,y])=>{
   const touching=directions.map(([dx,dy])=>occupied.get(key(x+dx,y+dy))).filter(Boolean);
   const parents=touching.filter(b=>b.length===4);
   const along=horizontal?x:y,across=horizontal?y:x;
   const radius=Math.abs(along)*.86+Math.abs(across)*1.1;
   const branch=i%4<2?along*sign*.53:-across*sign*.49;
   const score=.74*Math.min(touching.length,2)-radius*.33+branch
    +random(seed,'fringe-'+Math.floor(i/3)+'/'+key(x,y))*1.7+(parents.length?.39:0)-(touching.length===4?.8:0);
   return {x,y,touching,score};
  }).sort((a,b)=>b.score-a.score||a.x-b.x||a.y-b.y);
  const {x,y,touching}=ranked[0],touch=touching[0],parent=touch.length===4?core.indexOf(touch)+1:touch[4];
  const unlock=Math.max(4+Math.floor(i*10/count),parent);
  const palette=['H','S','H','P','H','C'];
  const zone=i===1?'A':i===3?'I':i===7?(plan.feature==='rail'?'T':'O'):palette[Math.floor(random(seed,'satellite'+i)*palette.length)];
  const cell=[x,y,zone,hash(seed+'/annex/'+key(x,y)),unlock];
  occupied.set(key(x,y),cell);extras.push(cell);
 }
 const established=[...core,...extras],{added,districts}=extendCity(plan,established,random,hash);
 const city={...plan,blocks:[...established,...added],extras:[...extras,...added],districts};builtPlans.set(plan,city);return city;
}
export const growthHours=[0,6,30,85,160,240],coreLimits=[1,3,5,8,11,14];
const schedules=new WeakMap();
export function development(plan,hours){
 const full=urbanPlan(plan);
 if(!schedules.has(plan)){
  const ordered=[{cell:plan.blocks[0],at:0}],seen=new Set([plan.blocks[0]]);
  for(let i=1;i<growthHours.length;i++){
   const open=full.blocks.filter((c,j)=>!seen.has(c)&&(c[4]??j+1)<=coreLimits[i])
    .sort((a,b)=>(a[4]??plan.blocks.indexOf(a)+1)-(b[4]??plan.blocks.indexOf(b)+1));
   const size=open.length;
   for(let j=0;j<size;j++){
    const adjacent=c=>ordered.some(o=>Math.abs(c[0]-o.cell[0])+Math.abs(c[1]-o.cell[1])===1);
    const idx=open.findIndex(c=>adjacent(c)&&(!plan.blocks.includes(c)||!open.some(d=>plan.blocks.includes(d)&&plan.blocks.indexOf(d)<plan.blocks.indexOf(c))));
    const [cell]=open.splice(Math.max(0,idx),1);seen.add(cell);
    ordered.push({cell,at:growthHours[i-1]+(growthHours[i]-growthHours[i-1])*(j+1)/size});
   }
  }
  schedules.set(plan,ordered);
 }
 const order=schedules.get(plan),eligible=new Set(order.filter(p=>p.at<=hours).map(p=>p.cell));
 return {cells:full.blocks.filter(c=>eligible.has(c)),blocks:plan.blocks.filter(c=>eligible.has(c)),next:order.find(p=>p.at>hours)};
}
export function cityForm(plan){
 const seed=plan.blocks[0][3],profile=profiles[plan.feature];
 const unitX=20*profile.x*(.96+.08*random(seed,'width')),unitY=20*profile.y*(.96+.08*random(seed,'depth'));
 const waterAxis=plan.feature==='river'?'y':plan.feature==='canal'?'x':null;
 const waterLine=waterAxis==='y'?plan.axisY:plan.axisX;
 const landmarkDistrict=plan.blocks.findIndex(b=>b[2]==='O');
 const center=plan.blocks[landmarkDistrict<0?Math.floor(plan.blocks.length/2):landmarkDistrict];
 const bridgeSites=new Set();let mainBridge=null;
 if(waterAxis){
  const banks=new Map();
  plan.blocks.forEach(([x,y,,,unlock],i)=>{
   const across=(waterAxis==='x'?x:y)*4,along=(waterAxis==='x'?y:x)*4;
   if(across!==waterLine&&across+4!==waterLine)return;
   for(const site of [along,along+4]){
    if(!banks.has(site))banks.set(site,[Infinity,Infinity]);
    const times=banks.get(site),side=across===waterLine?1:0;times[side]=Math.min(times[side],unlock||i+1);
   }
  });
  const centerline=(waterAxis==='x'?center[1]:center[0])*4;
  const candidates=[...banks].filter(([,pair])=>pair.every(Number.isFinite)).sort((a,b)=>
   Math.max(...a[1])-Math.max(...b[1])||Math.abs(a[0]-centerline)-Math.abs(b[0]-centerline)||a[0]-b[0]);
  for(const [site] of candidates)if([...bridgeSites].every(v=>Math.abs(v-site)>=8))bridgeSites.add(site);
  mainBridge=[...bridgeSites].sort((a,b)=>Math.abs(a-centerline)-Math.abs(b-centerline))[0];
 }
 const byCell=new Map(plan.blocks.map(b=>[key(b[0],b[1]),b]));
 function ground(x,y){
  const u=x*unitX,v=y*unitY;
  return [u-v,(u+v)/2];
 }
 function streetKind(a,b){
  const horizontal=a.y===b.y,along=horizontal?'x':'y',lane=horizontal?a.y:a.x;
  const low=Math.min(horizontal?a.x:a.y,horizontal?b.x:b.y);
  if(lane%4!==0)return 'lane';
  const k=lane/4,i=Math.floor(low/4);
  const left=byCell.get(horizontal?key(i,k-1):key(k-1,i));
  const right=byCell.get(horizontal?key(i,k):key(k,i));
  if(left&&right&&left[5]!==right[5]&&(left[5]||right[5]))return 'avenue';
  if(left&&right&&(left[5]==='station'||right[5]==='station')&&along===profile.long)return 'avenue';
  if(left&&right){
   if(left[2]==='P'&&right[2]==='P')return 'greenway';
   if(left[2]==='C'&&right[2]==='P'||left[2]==='P'&&right[2]==='C')return 'greenway';
   if(left[2]==='S'&&right[2]==='S')return 'market';
  }
  const primary=(horizontal?center[1]:center[0])*4;
  if(lane===primary)return along===profile.long?'boulevard':'avenue';
  if(left&&right&&(left[2]==='P'||right[2]==='P')&&plan.feature==='garden')return 'greenway';
  if(left&&right&&left[2]==='H'&&right[2]==='H')return 'lane';
  return left&&right?'street':'local';
 }
 return {ground,unitX,unitY,waterAxis,waterLine,landmarkDistrict,byCell,streetKind,bridgeSites,mainBridge};
}
export function cityCamera(blocks,form,w,h,objects,aspect){
 const bounds=[];
 for(const [bx,by] of blocks)for(let i=0;i<=4;i++){
  const x=4*bx,y=4*by;bounds.push(form.ground(x+i,y),form.ground(x+i,y+4),form.ground(x,y+i),form.ground(x+4,y+i));
 }
 for(const o of objects){
  const [x,y]=form.ground(o.t.x,o.t.y),reserved=o.lot!==undefined;
  const ordinary=o.ordinaryWidth,sky=o.design?o.design.sky+10:ordinary*(aspect(o.id)+.12);
  const height=reserved?Math.max(o.id==='fair'||o.id==='fair-square'?86:194,sky):sky,wide=reserved?Math.max(80,ordinary):ordinary;
  bounds.push([x-wide*.69,y-height],[x+wide*.69,y+wide*.20]);
 }
 const xx=bounds.map(p=>p[0]),yy=bounds.map(p=>p[1]),x0=Math.min(...xx),x1=Math.max(...xx),y0=Math.min(...yy),y1=Math.max(...yy);
 const scale=Math.min(2.1*w/896,(w-46)/Math.max(1,x1-x0),(h-36)/Math.max(1,y1-y0));
 const ox=(w-(x1+x0)*scale)/2,oy=(h-(y1+y0)*scale)/2;
 return {scale,project:(x,y)=>{const [u,v]=form.ground(x,y);return [Math.round(ox+u*scale),Math.round(oy+v*scale)];}};
}
// Logical nodes are integer coordinates so the same traversable edges can be used
// by pathfinding and by the renderer. Interior connections differ by land use.
export function streetsFor(blocks,form){
 const nodes=new Map(),edges=new Map();
 function node(x,y){const id=key(x,y);if(!nodes.has(id))nodes.set(id,{x,y,exits:new Set()});return nodes.get(id);}
 function segment(x,y,u,v,kind){
  const dx=Math.sign(u-x),dy=Math.sign(v-y);
  while(x!==u||y!==v){
   const a=node(x,y),b=node(x+dx,y+dy),ids=[key(a.x,a.y),key(b.x,b.y)].sort();
   const crosses=form.waterAxis==='y'?a.y===form.waterLine&&b.y===form.waterLine:
    form.waterAxis==='x'&&a.x===form.waterLine&&b.x===form.waterLine;
   const bridge=form.waterAxis==='y'?(a.y===form.waterLine||b.y===form.waterLine):
    form.waterAxis==='x'&&(a.x===form.waterLine||b.x===form.waterLine);
   const alongBank=form.waterAxis==='y'?a.x:a.y;
   if(!crosses&&(!bridge||form.bridgeSites.has(alongBank)))edges.set(ids.join('/'),{a,b,kind:kind||form.streetKind(a,b),bridge});
   x+=dx;y+=dy;
  }
 }
 for(const [bx,by,zone,v] of blocks){
  const x=bx*4,y=by*4;
  segment(x,y,x+4,y);segment(x,y+4,x+4,y+4);segment(x,y,x,y+4);segment(x+4,y,x+4,y+4);
  if(zone==='H'||zone==='S'){
   const side=v%2?0:4;segment(x+side,y+2,x+2,y+2,'lane');
   if(zone==='S')segment(x+2,y+2,x+4-side,y+2,'market');
   else segment(x+2,y+2,x+2,y+(v%3?4:0),'walk');
  }else if(zone==='O'){
   const side=v%2?4:0;segment(x+side,y+2,x+2,y+2,'walk');segment(x+2,y+2,x+2,y+4,'walk');
  }else if(zone==='C'||zone==='T'||zone==='Q'){
   segment(x+2,y,x+2,y+4,'walk');
  }else if(zone==='P'){
   segment(x,y+2,x+4,y+2,'walk');segment(x+2,y,x+2,y+2,'walk');
  }
 }
 const waterNodes=new Map();
 for(const edge of edges.values())if(edge.bridge){
  for(const n of [edge.a,edge.b])if((form.waterAxis==='y'?n.y:n.x)===form.waterLine)waterNodes.set(n,(waterNodes.get(n)||0)+1);
 }
 const segments=[];
 for(const edge of edges.values()){
  if(edge.bridge&&(waterNodes.get(edge.a)===1||waterNodes.get(edge.b)===1))continue;
  edge.a.exits.add(key(edge.b.x,edge.b.y));edge.b.exits.add(key(edge.a.x,edge.a.y));segments.push(edge);
 }
 return {roads:[...nodes.values()].filter(n=>n.exits.size),segments};
}


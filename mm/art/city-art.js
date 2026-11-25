import {drawBuilding,buildingHeight} from './city-buildings.js';
const base='/mm/art/assets/pixel-city/';
const tiles=await (await fetch(base+'sprites.json')).json();
const sheet=new Image();sheet.src=base+'sprites.png';await sheet.decode();
export function tileHeight(name){
 return buildingHeight(name)??(tiles[name]?tiles[name][3]/tiles[name][2]:1.08);
}
export function tile(c,name,x,y,width,flip=false){
 if(drawBuilding(c,name,x,y,width,flip))return;
 if(['linden','plane','flowering','bench','kiosk','court-yard','fountain','metro'].includes(name)){streetObject(c,name,x,y,width);return;}
 const r=tiles[name];if(!r)return;
 const [sx,sy,w,h]=r,dw=Math.max(1,Math.round(width)),dh=Math.round(dw*h/w);
 c.save();c.translate(Math.round(x),Math.round(y));if(flip)c.scale(-1,1);
 c.imageSmoothingEnabled=false;c.drawImage(sheet,sx,sy,w,h,-Math.floor(dw/2),-dh,dw,dh);c.restore();
}
export function shape(c,color,points){
 c.fillStyle=color;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill();
}
export function line(c,color,width,points){
 c.strokeStyle=color;c.lineWidth=width;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.stroke();
}
function streetObject(c,name,x,y,w){
 c.save();c.translate(Math.round(x),Math.round(y));c.scale(w/22,w/22);
 const rect=(color,a,b,width,height)=>{c.fillStyle=color;c.fillRect(a,b,width,height);};
 if(name==='linden'||name==='plane'||name==='flowering'){
  const pink=name==='flowering',tints=pink?['#8d6178','#be8197','#dfa8b5','#f5d1cd']:name==='plane'?['#486a58','#5b8563','#77a06f','#99b783']:['#4c694a','#668c55','#87aa62','#a7c17b'];
  rect('#685c4c',-1,-10,2,10);line(c,'#736453',1,[[-3,-9],[0,-5],[3,-10]]);
  for(const [a,b,r] of [[3,-10,5],[-4,-11,6],[5,-14,5],[-2,-16,6],[1,-18,4]]){
   rect(tints[0],a-r+1,b-r+2,2*r-1,2*r-3);rect(tints[1],a-r,b-r+2,r*2-1,r+2);
   rect(tints[2],a-r+1,b-r+1,r+2,r-1);rect(tints[3],a-r+2,b-r+1,3,2);
  }
 }else if(name==='bench'){
  shape(c,'#a9ac8e',[[-8,-1],[0,-5],[9,-1],[0,3]]);
  line(c,'#6b634f',2,[[-5,-4],[4,-8]]);line(c,'#a47b50',2,[[-5,-6],[4,-10]]);
  rect('#5d6458',-4,-4,1,4);rect('#5d6458',4,-8,1,4);
 }else if(name==='court-yard'){
  shape(c,'#a68268',[[-12,-3],[0,-9],[12,-3],[0,3]]);line(c,'#e8d9b5',.8,[[-10,-3],[0,-8],[10,-3],[0,2],[-10,-3]]);
  line(c,'#ede0c6',.8,[[-5,-5.5],[5,-.5]]);line(c,'#68736b',1,[[9,-4],[9,-11],[6,-11]]);
 }else if(name==='kiosk'){
  rect('#68756c',-6,-8,2,8);rect('#68756c',5,-7,2,5);
  shape(c,'#507e81',[[-10,-9],[0,-14],[10,-9],[0,-4]]);line(c,'#a7c7b9',1,[[-10,-9],[0,-4],[10,-9]]);
 }else if(name==='fountain'){
  shape(c,'#999c87',[[-11,-3],[0,-8],[11,-3],[0,3]]);
  shape(c,'#87b9bb',[[-8,-3],[0,-6],[8,-3],[0,1]]);rect('#d0e9df',-1,-11,2,8);rect('#b2d8cf',-4,-8,2,2);rect('#b2d8cf',3,-8,2,2);
 }else{
  shape(c,'#506c6c',[[-10,-3],[4,-10],[10,-7],[-4,0]]);shape(c,'#d1d0b6',[[-10,-7],[4,-14],[10,-11],[-4,-4]]);
  shape(c,'#73a4a1',[[-4,-4],[10,-11],[10,-7],[-4,0]]);for(let i=0;i<3;i++)rect('#395761',-2+4*i,-4-2*i,2,2);
 }
 c.restore();
}
const landmarkTiles=['tower','condo','library','court','hospital'];
export function landmark(c,style,x,y,w,level){
 c.save();c.translate(Math.round(x),Math.round(y));c.scale(w/36,w/36);
 if(style===0){
  tile(c,'office',-7,0,23);tile(c,'tower',3,-1,30);
  shape(c,'#36656d',[[-7,-8],[-7,-42],[4,-36],[4,-2]]);
  shape(c,'#4e8990',[[4,-2],[4,-36],[12,-40],[12,-7]]);
  for(let j=0;j<5;j++)line(c,'#98c9bf',1,[[5,-8-j*5],[11,-11-j*5]]);
  shape(c,'#b6ede1',[[-5,-31],[-1,-33],[2,-30],[0,-26],[-4,-26]]);
  shape(c,'#479da6',[[-3,-30],[0,-31],[0,-28],[-2,-28]]);
  shape(c,'#40646a',[[-10,-48],[0,-54],[10,-49],[0,-43]]);
  line(c,'#aff8e9',2,[[-10,-48],[0,-43],[9,-48]]);
  c.fillStyle='#34646b';c.fillRect(-2,-65,3,14);c.fillStyle='#9ef9de';c.fillRect(-1,-66,2,8);
  line(c,'#76dacf',2,[[0,-42],[0,-16],[9,-21]]);
 }else if(style===1){
  tile(c,'brickhigh',0,0,39);
  for(const d of [-8,8]){line(c,'#514956',2,[[d,-41],[d,-58]]);line(c,'#d9ddd2',1,[[d,-56],[0,-46],[-d,-51]]);}
 }else if(style===2){
  tile(c,'library',0,0,42);
  shape(c,'#5483a0',[[-12,-20],[-10,-28],[-5,-33],[2,-35],[9,-30],[12,-23],[11,-19],[0,-15]]);
  line(c,'#b8d6d5',2,[[-8,-27],[-3,-32],[2,-32],[7,-23]]);
  line(c,'#eac987',3,[[2,-32],[12,-39]]);
 }else if(style===3){
  tile(c,landmarkTiles[style],0,0,43);tile(c,'park',0,-15,25);tile(c,'fir',-3,-21,9);
 }else{
  tile(c,landmarkTiles[style],0,0,43);
  shape(c,'#627e7b',[[-10,-18],[0,-23],[11,-18],[0,-13]]);
  c.fillStyle='#f4dda1';c.fillRect(-3,-20,1,4);c.fillRect(1,-20,1,4);c.fillRect(-2,-19,3,1);
 }
 for(let i=1;i<Math.min(level,4);i++){c.fillStyle='#f7c86d';c.fillRect(-8+i*4,0,2,2);}
 c.restore();
}
const costumes=[
 ['.........rrr....','........rGGr....','........rEEr....','.......rrGrr..GG','.....rrRGGrRRRGG','....rRCRRRr.....','...rrRRrrrrG....','..rRRR..rrGG....','.rrr..rRr.......','GG...rRG........','TT...GG.........','.T...TT.........'],
 ['...........rr...','..........rGG...','.....rrr..rr....','....rEER.rr.....','....rRRRrr......','..rrrRDRr.......','.rr.rRRR........','.r..rDDD........','...DD..DD.......','..DD....DD......','..rr....rrr.....']
];
const ink={r:'#822e37',R:'#ce4543',G:'#f6c875',E:'#d7f6ee',C:'#b1fff1',D:'#375675',T:'#96d9d2'};
function hero(c,style){
 const rows=costumes[style];
 rows.forEach((row,y)=>{for(let x=0;x<row.length;x++){const color=ink[row[x]];
  if(color){c.fillStyle=color;c.fillRect(x-7,y-6,1,1);}}});
}
export function drawPatrol(c,x,y,scale,right,time){
 c.save();c.translate(Math.round(x),Math.round(y));c.scale((right?1:-1)*scale,scale);
 c.fillStyle=Math.floor(time*6)%2?'#8adaed':'#f1da88';
 c.fillRect(-9,3,2.5,1);c.fillRect(-7,5,2,1);hero(c,0);c.restore();
}
export function skyRoute(landmarks,scale){
 if(!landmarks.length)return null;
 const candidates=landmarks.map(o=>[o.sx,o.sy-(o.gift?69:o.design.height+14)*scale]);
 const center=candidates.reduce((v,p)=>[v[0]+p[0]/candidates.length,v[1]+p[1]/candidates.length],[0,0]);
 // Pick rooflines facing each compass direction. Include a wider loop for the first block.
 const points=[];
 for(let i=0;i<8;i++){
  const angle=i*Math.PI/4,dx=Math.cos(angle),dy=Math.sin(angle);
  const score=p=>(p[0]-center[0])*dx+(p[1]-center[1])*dy;
  const p=candidates.reduce((a,b)=>score(a)>score(b)?a:b);
  points.push([Math.max(15,Math.min(1425,p[0]+dx*18*scale)),Math.max(15,Math.min(809,p[1]+dy*12*scale))]);
 }
 // Rounded corners avoid instantaneous direction changes over the roofs.
 const path=[];
 for(let i=0;i<points.length;i++){
  const a=points[(i+7)%8],b=points[i],d=points[(i+1)%8];
  for(let k=0;k<9;k++){
   const t=k/9;
   path.push(b.map((v,j)=>(1-t)**2*(a[j]+v)/2+2*(1-t)*t*v+t*t*(v+d[j])/2));
  }
 }
 let length=0;
 const ends=path.map((p,i)=>{const q=path[(i+1)%path.length];length+=Math.hypot(q[0]-p[0],q[1]-p[1]);return length;});
 return {path,ends,length};
}
export function patrolPose(route,scale,time){
 const distance=(time*22*scale)%route.length;
 const i=route.ends.findIndex(end=>end>distance),j=Math.max(0,i),a=route.path[j],b=route.path[(j+1)%route.path.length];
 const start=j?route.ends[j-1]:0,f=(distance-start)/Math.max(.0001,route.ends[j]-start);
 return [a[0]+(b[0]-a[0])*f,a[1]+(b[1]-a[1])*f+Math.sin(time*1.6)*scale,b[0]>=a[0]];
}
export function cityVisitor(c,style,x,y,scale,time,offset){
 c.save();c.translate(x,y);c.scale(scale,scale);
 const t=time*.8+offset;
 if(style===0||style===1||style===4){
  const dx=Math.round(Math.sin(t)*(style===0?34:22)),dy=Math.round((style===1?-36:-47)+Math.cos(t*2)*(style===0?9:6));
  if(style===1)line(c,'#e9eee4',1,[[8,-56],[dx,dy]]);
  c.translate(dx,dy);if(style===0||style===1)c.scale(1.35,1.35);if(Math.cos(t)<0)c.scale(-1,1);
  if(style===4){
   line(c,'#405552',1,[[-9,-3],[8,-3]]);c.fillStyle='#ba594d';c.fillRect(-4,-1,9,4);
   c.fillStyle='#dbe5d5';c.fillRect(3,-1,3,2);c.fillRect(-8,-2,5,1);
  }else{
   hero(c,style);
  }
 }else if(style===2){
  const dx=Math.round(Math.cos(t)*13),dy=Math.round(-37+Math.sin(t)*6);
  c.fillStyle='#e9be70';c.fillRect(dx,dy,3,2);c.fillStyle='#536f90';c.fillRect(dx-3,dy,2,1);c.fillRect(dx+4,dy,2,1);
 }else{
  for(let i=0;i<3;i++){c.fillStyle=i%2?'#ecb163':'#e6cdbc';c.fillRect(Math.round(Math.cos(t+i*2)*12),Math.round(-22+Math.sin(t*1.4+i)*5),2,2);}
 }
 c.restore();
}


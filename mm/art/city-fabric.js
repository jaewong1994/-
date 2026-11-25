import {shape,line} from './city-art.js';
export function trace(project,points){
 const out=[project(...points[0])];
 for(let i=1;i<points.length;i++){
  const [x,y]=points[i-1],[u,v]=points[i],steps=Math.ceil(Math.max(Math.abs(u-x),Math.abs(v-y))*1.5);
  for(let j=1;j<=steps;j++)out.push(project(x+(u-x)*j/steps,y+(v-y)*j/steps));
 }
 return out;
}
const tones={Q:['#c9b7a4','#dfcdb5'],H:['#bcc39b','#cbd0a6'],S:['#cec3a6','#ded0b3'],O:['#bdc5ba','#d3d4c4'],C:['#c5c7ae','#e0d7b9'],P:['#98b981','#acc68e'],T:['#c5bdad','#d4c9b0'],A:['#99b488','#b6c79b'],I:['#b4b5a6','#c6c4b3']};
export function districts(c,project,scale,blocks,plan){
 const occupied=new Set(blocks.map(([a,b])=>a+","+b));
 for(const [a,b,z,v] of blocks){
  const [base,inner]=tones[z],x=a*4,y=b*4,cut=plan.feature==='court'?.43:.16;
  const local=arr=>arr.map(([i,j])=>[x+i,y+j]);
  const fill=(p,col)=>shape(c,col,trace(project,local([...p,p[0]])));
  const path=(p,col,w)=>line(c,col,w*scale,trace(project,local(p)));
  const corner=(d,k)=>[[d+k,d],[4-d-k,d],[4-d,d+k],[4-d,4-d-k],[4-d-k,4-d],[d+k,4-d],[d,4-d-k],[d,d+k]];
  // A corner exposed on both sides is landscaped into a rounded verge.
  const perimeter=d=>{
   const outline=[],corners=[[0,0,-1,-1],[4,0,1,-1],[4,4,1,1],[0,4,-1,1]];
   for(const [j,[u,w,dx,dy]] of corners.entries()){
    const exposed=!occupied.has([a+dx,b].join(','))&&!occupied.has([a,b+dy].join(','));
    const radius=exposed?.78+(v%7)*.045:cut;
    const cx=u-dx*(d+radius),cy=w-dy*(d+radius),start=Math.PI+j*Math.PI/2;
    for(let n=0;n<=4;n++){const angle=start+n*Math.PI/8;outline.push([cx+radius*Math.cos(angle),cy+radius*Math.sin(angle)]);}
   }
   return outline;
  };
  fill(perimeter(.03),base);fill(perimeter(.25),inner);
  if(z==='Q'){
   for(let i=.5;i<3.8;i+=.4){path([[.3,i],[3.7,i]],'#cab9a4',.8);path([[i,.3],[i,3.7]],'#d4bfab',.8);}
   const diamond=[[.77,2],[2,.77],[3.23,2],[2,3.23],[.77,2]];
   path(diamond,'#a78a74',2);path([[1.52,2],[2,1.52],[2.48,2],[2,2.48],[1.52,2]],'#f6e4ba',2);
  }else if(z==='P'){
   fill([[.29,.43],[1.48,.3],[2.1,1.12],[1.43,1.67],[.46,1.43]],'#80a472');
   fill([[.42,2.5],[1.41,2.26],[2.24,2.91],[1.74,3.64],[.51,3.51]],'#88ad79');
   if(v%3!==1){
    const pond=[[2.52,.48],[3.27,.37],[3.65,.81],[3.49,1.40],[2.98,1.57],[2.43,1.22],[2.35,.83]];
    fill(pond,'#88ada6');path(pond.slice(1,5),'#c8d6af',1.5);
   }
   path([[.45,3.51],[1.38,2.62],[2.13,2.06],[2.87,1.61],[3.60,1.69]],'#ebd7ad',2.9);
  }else if(z==='A'){
   const loop=[[.72,1.02],[1.08,.60],[2.22,.61],[2.61,1.04],[2.61,2.93],[2.28,3.36],[1.07,3.37],[.72,2.96],[.72,1.02]];
   fill(loop,'#b5826d');path(loop,'#ddae91',1);
   const pitch=[[1.03,1.07],[2.29,1.07],[2.29,2.95],[1.03,2.95],[1.03,1.07]];
   fill(pitch,'#86a976');path(pitch,'#e4dfb8',1);path([[1.03,2.01],[2.29,2.01]],'#e4dfb8',.8);
   const circle=Array.from({length:17},(_,i)=>[1.66+.22*Math.cos(i*Math.PI/8),2.01+.22*Math.sin(i*Math.PI/8)]);path(circle,'#e4dfb8',.8);
   for(const y of [1.07,2.95]){const inner=y===1.07?1.36:2.66;path([[1.30,y],[1.30,inner],[2.02,inner],[2.02,y]],'#e4dfb8',.8);}
  }else if(z==='I'){
   for(let j=0;j<6;j++){const u=.43+j*.40;path([[u,1.81],[u,2.57]],'#e2d8b9',1.3);}
   for(let j=0;j<4;j++){const u=.70+j*.32;fill([[u,2.92],[u+.22,2.92],[u+.22,3.48],[u,3.48]],j%2?'#af7763':'#76948d');}
  }else if(z==='C'||z==='O'||z==='T'){
   const plaza=z==='O'?[[1.56,1.2],[2.37,1.08],[2.82,1.81],[2.02,2.54],[1.16,2.1]]:corner(.57,.35);
   fill(plaza,z==='C'?'#d2c7a8':'#cad0c3');
   if(z==='C')for(let i=.79;i<3.5;i+=.39)path([[i,.78],[i,3.25]],'#dcd1b6',.70);
   if(z==='O')path([[.23,3.14],[1.47,2.39],[2.27,1.66],[3.76,.88]],'#e6dfbe',2.3);
  }else if(z==='S'&&plan.feature==='court'){
   fill([[1.08,1.14],[2.97,1.14],[2.97,2.83],[1.08,2.83]],'#a8b791');
   path([[1.26,2.68],[2.1,2.24],[2.79,1.33]],'#e6d5af',2.3);
  }else if(z==='H'){
   // Back gardens are connected strips, with different depths on each side of the mews.
   fill([[.46,.49],[3.49,.50],[3.37,1.32],[2.43,1.49],[.49,1.25]],'#b0bd91');
   fill([[.5,2.63],[3.57,2.48],[3.55,3.55],[.5,3.5]],'#aebe90');
  }
 }
}
export function waterfront(c,project,scale,form,blocks){
 if(!form.waterAxis)return;
 const axis=form.waterAxis,at=form.waterLine,canal=axis==='x',width=canal?.53:.64;
 const atPoint=(i,d)=>axis==='y'?[i,at+d]:[at+d,i];
 const shore=blocks.filter(([x,y])=>{const edge=4*(canal?x:y);return edge===at||edge+4===at;}).map(([x,y])=>4*(canal?y:x));
 function openness(i){return Math.min(1,Math.min(...shore.map(a=>Math.max(a-i,0,i-a-4)))/4);}
 function meander(i){const t=openness(i);return t*t*(1.1*Math.sin(i*.24)+.48*Math.sin(i*.50+.5));}
 function bank(i,side,factor){
  const w=width+.09*Math.sin(i*.51)+.06*Math.sin(i*.88+.7)+openness(i)*.14;
  return atPoint(i,meander(i)+side*w*factor);
 }
 const seq=Array.from({length:345},(_,i)=>i*.55-94);
 for(const side of [-1,1]){
  const meadow=seq.map(i=>bank(i,side,1.16+openness(i)*(1.35+.8*Math.sin(i*.35+side))));
  shape(c,'#a3b687',[...meadow,...[...seq].reverse().map(i=>bank(i,side,1.01))].map(p=>project(...p)));
 }
 for(const [spread,col] of [[1.24,'#93a78c'],[1.08,'#dfd2ae'],[1,'#5895aa'],[.74,'#47899e']]){
  const coords=[...seq.map(i=>bank(i,-1,spread)),...[...seq].reverse().map(i=>bank(i,1,spread))];
  shape(c,col,coords.map(p=>project(...p)));
 }
 for(let i=-26;i<=30;i+=.81){const d=meander(i)+Math.sin(i*26)*.36;line(c,'#a8c9c7',scale*.8,[project(...atPoint(i,d)),project(...atPoint(i+.19,d))]);}
 const eastWest=axis==='y';
 for(const [a,b] of blocks){
  const along=(eastWest?a:b)*4,edge=(eastWest?b:a)*4;
  if(edge!==at&&edge+4!==at)continue;
  const side=edge===at?1:-1,path=[];
  for(let j=0;j<=8;j++)path.push(bank(along+j*.5,side,1.27));
  line(c,'#b8ad91',3.7*scale,path.map(p=>project(...p)));
  line(c,'#efe1bd',2.4*scale,path.map(p=>project(...p)));
 }
}
export const streetStyle={
 boulevard:[12,8.7,'#515b62'],avenue:[10.4,7,'#59636a'],street:[7.7,4.9,'#687071'],local:[4.6,2.9,'#879283'],
 lane:[4.1,2.3,'#b9b7a0'],market:[4.6,2.9,'#d7ba98'],walk:[3.8,2.1,'#e0cda9'],greenway:[7.9,3.5,'#dacfad']
};
export function streets(c,project,scale,network,form){
 c.lineCap='round';c.lineJoin='round';
 const paths=new Map();
 // Split an exposed right-angle bend at its midpoint. The two adjoining
 // segments then paint one continuous curved curb in both street layers.
 function turnout(node,towards){
  if(node.exits.size!==2||node.x%4||node.y%4)return null;
  const other=[...node.exits].find(id=>id!==[towards.x,towards.y].join(',')).split(',').map(Number);
  const ux=other[0]-node.x,uy=other[1]-node.y,dx=towards.x-node.x,dy=towards.y-node.y;
  if(ux*dx+uy*dy!==0)return null;
  return [.5,.625,.75,.875,1].map(t=>project(node.x+.66*((1-t)**2*ux+t*t*dx),node.y+.66*((1-t)**2*uy+t*t*dy)));
 }
 for(const e of network.segments){
  const {a,b}=e,start=!e.bridge&&turnout(a,b),end=!e.bridge&&turnout(b,a);
  e.path=start||end?[...(start||[project(a.x,a.y)]),...(end?end.reverse():[project(b.x,b.y)])]:trace(project,[[a.x,a.y],[b.x,b.y]]);
  if(!paths.has(e.kind))paths.set(e.kind,[]);paths.get(e.kind).push(e);
 }
 const ascending=Object.keys(streetStyle).reverse();
 for(const layer of [0,1])for(const k of ascending){
  const group=paths.get(k);if(!group)continue;
  const [rim,core,color]=streetStyle[k];c.strokeStyle=layer?color:k==='greenway'?'#86a67b':k==='local'?'#afb79d':'#d3d1bd';c.lineWidth=(layer?core:rim)*scale;c.beginPath();
  for(const {path} of group){c.moveTo(...path[0]);for(const p of path.slice(1))c.lineTo(...p);}
  c.stroke();
 }
 for(const {a,b,kind,bridge} of network.segments){
  const dx=b.x-a.x,dy=b.y-a.y;
  const p=(f,off=0)=>project(a.x+dx*f-dy*off,a.y+dy*f+dx*off);
  if(kind==='boulevard'||kind==='avenue'){
   line(c,'#ded6af',1.0*scale,[p(.29),p(.65)]);
   if(kind==='boulevard'&&!bridge&&(a.x+a.y)%4===2)line(c,'#a3b08c',2.6*scale,[p(.18),p(.82)]);
  }
  if(bridge){
   const l=p(0),r=p(1),len=Math.hypot(r[0]-l[0],r[1]-l[1])||1;
   const nx=(r[1]-l[1])/len,ny=(l[0]-r[0])/len,d=(streetStyle[kind][0]/2+.4)*scale;
   for(const sign of [-1,1]){
    const rr=[l,r].map(([x,y])=>[x+nx*d*sign,y+ny*d*sign]);
    line(c,'#667b79',1.7*scale,rr);line(c,'#e1d6b7',scale,rr.map(([x,y])=>[x,y-2*scale]));
    for(const [x,y] of rr){c.fillStyle='#7a8478';c.fillRect(x,y-2*scale,scale,2.5*scale);}
   }
  }else if(['avenue','boulevard','street'].includes(kind)){
   for(const [node,sgn] of [[a,1],[b,-1]])if(node.exits.size>=3&&node.x%4===0&&node.y%4===0){
    const cx=node.x+sgn*dx*.24,cy=node.y+sgn*dy*.24;
    const center=project(cx,cy),end=p(node===a?.48:.52),len=Math.hypot(end[0]-center[0],end[1]-center[1])||1;
    const vx=(end[0]-center[0])/len,vy=(end[1]-center[1])/len;
    for(let i=-2;i<=2;i++){const px=center[0]-vy*i*1.22*scale,py=center[1]+vx*i*1.22*scale;
     line(c,'#e3dfca',.72*scale,[[px,py],[px+vx*2*scale,py+vy*2*scale]]);}
   }
  }
 }
 if(form.waterAxis&&form.mainBridge!==undefined){
  const at=form.mainBridge,mid=form.waterLine,along=form.waterAxis==='y';
  if(network.segments.some(e=>e.bridge&&(along?e.a.x:e.a.y)===at)){
   const crossing=(t,off)=>along?project(at+off,mid+t):project(mid+t,at+off);
   for(const side of [-.13,.13]){
    const points=[];
    for(let j=0;j<=10;j++){
     const t=-.92+j*.184,p=crossing(t,side),h=(1-t*t)*8*scale;
     points.push([p[0],p[1]-h]);
     if(j%2===0)line(c,'#577777',1.15*scale,[p,[p[0],p[1]-h]]);
    }
    line(c,'#567979',2.6*scale,points);line(c,'#c0cfba',.9*scale,points.map(([x,y])=>[x,y-scale]));
   }
  }
 }
 c.lineCap='butt';
}

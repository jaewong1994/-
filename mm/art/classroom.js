const nightStops=[
 {action:'window',path:[[-.34,-.55],[-.72,-.58],[-.77,.10]]},
 {action:'coffee',path:[[-.34,-.55],[-.20,-.70],[.58,-.70],[.68,-.56]]},
 {action:'board',path:[[-.34,-.55],[-.26,-.70],[.17,-.72]]},
 {action:'dance',path:[[-.34,-.55],[.23,-.62],[.22,-.13],[.02,-.09],[.02,.23]]},
];

// Four writing poses hold for most of the night. Each short excursion has an
// outward trip, a distinct activity, and the same route back to the chair.
export function classroomFrame(period,time,seed=0){
 const idle=Math.floor(time*1.25)%4;
 if(period!=='night'&&period!=='dawn')return idle;
 const interval=35+(seed%9),first=8+(seed%6);
 if(time<first)return idle;
 const elapsed=time-first,round=Math.floor(elapsed/interval),tick=Math.floor((elapsed%interval)*6);
 return tick>=60?idle:4+((round+(seed%4))%4)*60+tick;
}
function nightMotion(frame){
 if(frame<4)return null;
 const stop=nightStops[Math.floor((frame-4)/60)],tick=(frame-4)%60;
 const travel=Math.min(1,Math.max(0,(tick-4)/14),Math.max(0,(55-tick)/13));
 const lengths=stop.path.slice(1).map(([x,y],i)=>Math.hypot(x-stop.path[i][0],y-stop.path[i][1]));
 let dist=travel*lengths.reduce((a,b)=>a+b,0);
 let n=0;while(n<lengths.length-1&&dist>lengths[n])dist-=lengths[n++];
 const [x,y]=stop.path[n],[endX,endY]=stop.path[n+1],f=Math.min(1,dist/lengths[n]);
 return {x:x+(endX-x)*f,y:y+(endY-y)*f,tick,action:stop.action,
  acting:tick>=18&&tick<=42,rise:Math.min(1,tick/4,(59-tick)/4),returning:tick>42};
}
export function classroomCatFrame(time,seed){
 const tick=(time+seed%7)%(58+seed%11);
 if(tick<29||tick>=45)return Math.floor(time*1.25)%4;
 return 4+Math.min(31,Math.floor((tick-29)*2));
}
function roomCat(c,x,y,frame){
 const sleeping=frame<4,r=frame-4;
 const facing=r<25?-1:1,curled=sleeping||r===0||r===31;
 c.save();c.translate(x,y);c.scale(curled?1:facing,1);
 const px=(color,x,y,w,h)=>{c.fillStyle=color;c.fillRect(x,y,w,h);};
 const coat='#22252b',shine='#41454d';
 if(curled){
  const breath=frame===2?.35:0;
  px('#695d50',-3.4,-.25,6.4,.65);px(coat,-3.0,-2.2-breath,4.9,2.5);
  px(shine,-2.2,-2.6-breath,2.6,.6);px(coat,1,-2.5,2.1,1.8);
  px(coat,1.1,-3.4,1,1);px(coat,2.5,-3.15,.65,1);px('#b2a899',2.1,-1.45,.8,.35);
  px(shine,-3.3,-1.1,1.1,1.1);px(shine,-2.6,-.2,3.7,.55);
 }else{
  const blink=r%9===0,tail=Math.sin(r*1.3);
  px(coat,-2.5,-3,4.2,2.6);px(coat,.8,-4.2,2.5,2.25);
  px(coat,1,-5.15,.7,1.15);px(coat,2.7,-5,.65,1.1);
  px(shine,-2,-3.3,2.4,.55);px('#c6be80',2.65,-3.5,.55,blink?.25:.62);
  px(coat,-2,-.65,1,1.3);px(coat,.8,-.65,1.15,1.25);
  px(coat,-3.4,-2.65,1.5,1);px(shine,-3.65,-4+tail*.4,.8,1.8);
 }
 c.restore();
}
// Open upper-floor classroom. Furniture, walls and people share the building's isometric axes.
export function drawClassroom(c,d,period,pose,catFrame=0){
 const motion=nightMotion(pose);if(motion)pose=motion.tick%4;
 const ax=d.rx*.94,ay=d.ry*.94,floor=d.height,night=period==='night'||period==='dawn';
 const p=(x,y,z=0)=>[x*ax-y*ay,(x*ax+y*ay)/2-floor-z];
 const poly=(color,pts)=>{
  c.beginPath();
  pts.map(([x,y,z])=>p(x,y,z)).forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));
  c.closePath();c.fillStyle=color;c.fill();
 };
 const stroke=(color,pts,width=.55)=>{
  c.beginPath();
  pts.map(([x,y,z])=>p(x,y,z)).forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));
  c.lineWidth=width;c.strokeStyle=color;c.stroke();
 };
 const top=(color,x0,y0,x1,y1,z)=>poly(color,[[x0,y0,z],[x1,y0,z],[x1,y1,z],[x0,y1,z]]);
 const north=(color,y,x0,x1,b,t)=>poly(color,[[x0,y,b],[x1,y,b],[x1,y,t],[x0,y,t]]);
 const west=(color,x,y0,y1,b,t)=>poly(color,[[x,y0,b],[x,y1,b],[x,y1,t],[x,y0,t]]);
 const cube=(x0,y0,x1,y1,z0,z1,lid,front,side)=>{
  north(front,y1,x0,x1,z0,z1);west(side,x1,y0,y1,z0,z1);top(lid,x0,y0,x1,y1,z1);
 };
 const ink=night?'#343942':'#62594d',wood=night?'#77634f':'#c79560';
 const paper=night?'#ffdfa1':'#fff3d6';
 c.save();c.lineJoin='miter';c.lineCap='square';
 // Entrance and fascia are below the open storey, leaving the entire classroom in view.
 north(night?'#304d50':'#3f716f',1,-1,1,-6,-.4);
 north(night?'#536b70':'#8fb2af',1,-.89,-.3,-floor+1,-7);
 north('#becdc3',1,-.61,-.58,-floor+1,-7);
 const [sx,sy]=p(-1,1,-.6);
 c.save();c.translate(sx,sy);c.transform(1,.5,0,1,0,0);
 c.font='bold 4.1px "Gmarket Sans",sans-serif';c.textBaseline='middle';c.textAlign='center';c.fillStyle='#f9ebc9';
 c.fillText('입실론수학학원',ax,2.5,ax*1.86);c.restore();

 top(night?'#726253':'#dbb889',-1,-1,1,1,0);
 for(let i=1;i<9;i++){
  const y=-1+i*2/9;stroke(night?'#63584f':'#c8a578',[[-1,y,0],[1,y,0]],.36);
 }
 cube(-1,-1,1,-.93,0,15,night?'#9a9e93':'#f2ecd2',night?'#777b75':'#e4d8b9',ink);
 cube(-1,-.93,-.93,1,0,15,night?'#84908a':'#ebdfbf',ink,night?'#58666a':'#bebfae');
 // Chalkboard on the back wall and a window with a deep sill in the adjacent wall.
 north('#75583f',-.915,-.86,.57,4.1,13.65);
 north(night?'#304a43':'#365f50',-.901,-.82,.53,4.75,13.12);
 const chalk=night?'#98a99c':'#dfecd8';
 stroke(chalk,[[-.69,-.895,7],[-.61,-.895,8.5],[-.49,-.895,7.65],[-.37,-.895,10.8]],.65);
 for(const [x,z,len] of [[-.2,10.7,.27],[-.2,9.2,.17],[.12,7.4,.18]])stroke(chalk,[[x,-.895,z],[x+len,-.895,z]],.5);
 cube(-.86,-.92,.57,-.84,4,4.55,'#c3a277',ink,ink);
 const [cx,cy]=p(.79,-.89,11);
 c.fillStyle='#444e4b';c.fillRect(cx-1.75,cy-1.75,3.5,3.5);c.fillStyle=night?'#cdc7ab':'#faf3d9';c.fillRect(cx-1.25,cy-1.25,2.5,2.5);
 c.fillStyle=ink;c.fillRect(cx-.1,cy-1,.45,1.15);c.fillRect(cx,cy,.9,.4);
 west('#506067',-.917,-.56,.66,5.3,12.9);
 west(night?'#35485f':'#b9d7d8',-.907,-.5,.60,5.9,12.3);
 west(night?'#65777a':'#edf0d9',-.898,-.01,.035,5.9,12.3);
 cube(-.94,-.56,-.82,.67,5.1,5.65,'#a9a79a',ink,ink);
 if(night){
  poly('#a27f57',[[-.74,-.7,.01],[.19,-.78,.01],[.47,-.15,.01],[.26,.25,.01],[-.44,.30,.01],[-.84,-.07,.01]]);
 }
 const furniture=[];
 function place(x,y,draw){furniture.push({depth:x*ax+y*ay,draw});}
 function desk(x,y,w,depth,height,lit){
  const x0=x-w/2,x1=x+w/2,y0=y-depth/2,y1=y+depth/2;
  for(const px of [x0+.025,x1-.035])for(const py of [y0+.025,y1-.035])stroke(ink,[[px,py,.15],[px,py,height]],.7);
  cube(x0,y0,x1,y1,height-.85,height,lit?'#daa86e':wood,night?'#69513e':'#ab794b',night?'#514d46':'#846849');
 }
 function reader(x,y,variant){
  const [u,v]=p(x,y,0),tone=['#648284','#637491','#a07467','#78836f'][variant];
  c.fillStyle='#655444';c.fillRect(u-1.6,v-2.4,3.4,1.3);
  c.fillStyle='#474845';c.fillRect(u-1.25,v-.95,1.2,1.15);c.fillRect(u+.6,v-1.0,1.25,.9);
  c.fillStyle=tone;c.fillRect(u-1.7,v-5.7,3.6,3.8);
  const lean=(pose===variant?.45:0);
  c.fillStyle='#dfaf82';c.fillRect(u-1.6+lean,v-8,3.1,2.7);
  c.fillStyle=['#49403d','#4d4140','#684939','#403e42'][variant];c.fillRect(u-1.8+lean,v-8.8,3.6,2.6);
  c.fillStyle='#d7a37f';c.fillRect(u+1.45,v-4.8,1.3,1);
  if(variant===2&&pose>=2){
   c.fillStyle=tone;c.fillRect(u+1.45,v-6.6,1.3,2.7);
   c.fillStyle='#e2b48a';c.fillRect(u+2,v-9.15,1.05,3.25);
  }
 }
 for(const [i,[x,y]] of [[-.39,.04],[.42,.04],[-.39,.65],[.42,.65]].entries()){
  place(x,y,()=>{desk(x,y,.53,.29,3.1,false);if(!night)top('#f4e3be',x-.12,y-.09,x+.08,y+.075,3.13);});
  place(x,y+.16,()=>{cube(x-.115,y+.08,x+.115,y+.24,1.7,2.3,night?'#675c52':'#8f775d',ink,ink);
   if(!night)reader(x,y+.18,i);
  });
 }
 if(!night){
  place(.43,-.65,()=>{
   const [u,v]=p(.43,-.65,0),lift=[0,.45,1,.45][pose];
   c.fillStyle='#373e42';c.fillRect(u-1.55,v-3.3,1.3,3.5);c.fillRect(u+.72,v-3.4,1.3,3.4);
   c.fillStyle='#294959';c.fillRect(u-2.15,v-8.3,4.3,5.4);c.fillStyle='#e2dac0';c.fillRect(u-.6,v-8.25,1.25,2.3);
   c.fillStyle='#516e75';c.fillRect(u+1.5,v-7.8,1.1,2.65);
   c.fillStyle='#e2ae83';c.fillRect(u+1.8,v-5.6,.95,1.8);c.fillRect(u-1.6,v-11.2,3.3,3.1);c.fillStyle='#3f3735';c.fillRect(u-1.85,v-12.1,3.8,1.75);
   c.fillStyle='#526168';c.fillRect(u-1.7,v-10.3,2.9,.55);c.fillRect(u-1.6,v-10.1,.4,.65);c.fillRect(u+.45,v-10.1,.4,.6);
   c.strokeStyle='#e3ae83';c.lineWidth=1.25;c.beginPath();c.moveTo(u-1.75,v-7.45);c.lineTo(u-3.3,v-8.1-lift);c.lineTo(u-5,v-9.6-lift);c.stroke();
   c.fillStyle='#fff1c5';c.fillRect(u-5.8,v-10.4-lift,1.25,.75);
  });
 }else{
  // A small drip stand on the back counter, with a glass pot and ceramic cup.
  place(.84,-.65,()=>{
   desk(.83,-.65,.28,.32,3.5,false);
   const [mx,my]=p(.82,-.71,3.55),pour=motion?.action==='coffee'&&motion.acting;
   c.fillStyle='#484a48';c.fillRect(mx-2.6,my-5.7,1,5.6);c.fillRect(mx-2.6,my-5.8,4.7,.9);
   c.fillStyle='#c68c64';c.fillRect(mx-.9,my-4.9,2.8,1.2);c.fillRect(mx-.35,my-3.8,1.65,.95);
   c.fillStyle='#b4cdcb';c.fillRect(mx-1,my-1.65,3.4,1.75);
   c.fillStyle='#79523d';c.fillRect(mx-.65,my-.85,2.7,.75);
   if(pour&&motion.tick<31){c.fillStyle='#dfac6e';c.fillRect(mx+.3,my-2.9+(pose%2)*.45,.55,.95);}
  });
  if(!motion){
   place(-.34,-.55,()=>{
   const [u,v]=p(-.34,-.55,0),nod=pose===2?.55:0;
   c.fillStyle='#46444b';c.fillRect(u-2.1,v-5,4.3,5.1);
   c.fillStyle='#355461';c.fillRect(u-2.05,v-7.0,4.2,4.15);
   c.fillStyle='#67808a';c.fillRect(u-.5,v-7.35,2.55,2.8);c.fillStyle='#e1d4b6';c.fillRect(u+.55,v-7.25,.7,1.4);
   c.fillStyle='#bd8967';c.fillRect(u-.9,v-7.8+nod,2.2,1.15);
   c.fillStyle='#edbd8e';c.fillRect(u-1.4,v-10+nod,3.4,2.7);c.fillRect(u+1.85,v-8.95+nod,.7,.8);
   c.fillStyle='#403b37';c.fillRect(u-1.75,v-10.95+nod,3.65,1.6);c.fillRect(u-1.6,v-9.6+nod,.85,1.2);
   c.fillStyle='#454f4e';c.fillRect(u+.4,v-9.2+nod,1.85,.45);c.fillRect(u+1.65,v-9+nod,.5,.65);
   });
  }else{
   // Depth-sort the teacher with the furniture throughout the trip.
   place(motion.x,motion.y,()=>{
    const {action,acting,tick,rise,returning}=motion;
    const [u,v]=p(motion.x,motion.y),beat=Math.sin(tick*Math.PI/3),dance=acting&&action==='dance';
    const walk=!acting&&tick>4&&tick<55,step=walk?beat*.9:0;
    const hop=dance?Math.max(0,Math.sin(tick*Math.PI/3))*1.8:0;
    const lean=dance?beat*1.25:0,bodyY=v-hop+(1-rise)*2.25;
    const line=(color,w,...pts)=>{c.beginPath();pts.forEach(([a,b],i)=>i?c.lineTo(a,b):c.moveTo(a,b));c.lineWidth=w;c.strokeStyle=color;c.stroke();};
    const coat='#466977',skin='#edbb8c',leg='#383e48';
    const back=acting&&(action==='window'||action==='board'),left=acting?action==='window':(returning!== (action==='window'));
    const head=u+lean+(acting&&action==='window'?-.55:0);
    line(leg,1.35,[u-.9,bodyY-4.5],[u-1.2-step-(dance?1.4:0),v-.6-hop]);
    line(leg,1.35,[u+1,bodyY-4.5],[u+1.4+step+(dance?1.3:0),v-.35-hop]);
    c.fillStyle=coat;c.fillRect(head-2,bodyY-8.2,4.15,4.65);
    c.fillStyle='#829997';c.fillRect(head-1.8,bodyY-8.1,3.5,.65);
    c.fillStyle=skin;c.fillRect(head-1.55,bodyY-11.1,3.15,2.8);
    c.fillStyle='#453d39';c.fillRect(head-1.75,bodyY-12,3.6,back?2.8:1.5);
    c.fillRect(head+(left?.8:-1.6),bodyY-10.8,1.05,1.4);
    if(!back){const dx=left?-1.9:.25;c.fillStyle='#354a50';c.fillRect(head+dx,bodyY-10.2,1.8,.55);}
    function arm(side,ex,ey,hx,hy){line(coat,1.3,[head+side*1.5,bodyY-7.35],[ex,ey]);line(skin,.95,[ex,ey],[hx,hy]);}
    if(acting&&action==='board'){
     const progress=(tick-18)/24, bx=.20+.28*progress,bz=8.1+Math.sin(progress*Math.PI*4)*1.1;
     const [px,py]=p(bx,-.895,bz);
     for(let j=1;j<=tick-18;j++){
      const a=(j-1)/24,b=j/24;
      stroke('#d3d2b7',[[.20+.28*a,-.895,8.1+Math.sin(a*Math.PI*4)*1.1],[.20+.28*b,-.895,8.1+Math.sin(b*Math.PI*4)*1.1]],.55);
     }
     arm(1,(u+px)/2,bodyY-6.9,px,py);c.fillStyle='#f3edcc';c.fillRect(px,py-.7,1,.65);
     arm(-1,u-2.1,bodyY-5.8,u-1.75,bodyY-4.5);
    }else if(acting&&action==='window'){
     const [wx,wy]=p(-.88,.15,5.65);
     arm(-1,u-3,bodyY-7.7,wx,wy);arm(1,u+1.8,bodyY-5.8,u+.4,bodyY-4.9);
    }else if(acting&&action==='coffee'){
     const sip=Math.min(1,Math.max(0,(tick-29)/4),Math.max(0,(42-tick)/4));
     const [potX,potY]=p(.82,-.71,3.55);
     const hx=potX+(u+1.9-potX)*sip,hy=potY-1+(bodyY-9.6-(potY-1))*sip;
     arm(1,u+3.3,bodyY-5.7,hx-.5,hy+.6);arm(-1,u-2,bodyY-5.8,u-.8,bodyY-4.35);
     c.fillStyle='#f1dfb7';c.fillRect(hx-1,hy-.6,2.3,1.8);c.fillRect(hx+1.3,hy-.3,.75,.85);
     if(tick>24){c.fillStyle='#c3c6b1';c.fillRect(hx+(pose%2)*.5,hy-2.3-(pose%2)*.3,.5,.9);}
    }else if(dance){
     arm(-1,u-3.3,bodyY-7.8-beat,u-4.1,bodyY-8.8-beat*2.0);
     arm(1,u+3.25,bodyY-7.7+beat,u+4.25,bodyY-9.2+beat*2.0);
    }else{
     arm(-1,u-2.1-step,bodyY-5.9,u-1.9-step,bodyY-4.8);
     arm(1,u+2.2+step,bodyY-6,u+2+step,bodyY-4.7);
    }
   });
  }
  place(-.24,-.32,()=>{
   desk(-.24,-.32,.86,.39,3.8,true);
   top('#ddcca5',-.51,-.39,-.36,-.16,3.9);
   top(paper,-.36,-.39,-.15,-.16,3.93);
   stroke('#ba8b67',[[-.36,-.39,4],[-.36,-.16,4]],.45);
   stroke('#997650',[[-.31,-.26,4],[-.21,-.26,4]],.4);
   if(!motion&&pose===3)poly('#fff2c9',[[-.27,-.35,3.98],[-.16,-.35,4.9],[-.16,-.18,4.6],[-.27,-.18,3.98]]);
   if(!motion){
   const [u,v]=p(-.27,-.35,4);
   const [shoulderX,shoulderY]=p(-.34,-.55,6.2);
   c.lineWidth=1.6;c.strokeStyle='#547481';c.beginPath();c.moveTo(shoulderX+.8,shoulderY);c.lineTo(shoulderX+1.7,shoulderY+1.4);c.lineTo(u-1.35,v-1.4);c.stroke();
   c.fillStyle='#efbe90';c.fillRect(u-1.45,v-1.55,2+pose*.29,1.1);
   c.fillStyle='#384a50';c.fillRect(u+.4+pose*.29,v-2,.55,1.65);
   }
   cube(-.05,-.48,.065,-.34,4,5,'#93a3a0',ink,ink);
   north('#344a54',-.38,-.02,.12,4.8,8);north('#c6daca',-.375,-.008,.109,5.1,7.7);
   const [lx,ly]=p(-.55,-.38,3.8);
   c.fillStyle='#59574c';c.fillRect(lx-.7,ly-4.1,.8,4);c.fillRect(lx-.9,ly-.5,2.5,.6);
   c.fillStyle='#c0864b';c.fillRect(lx-.7,ly-5.6,1.8,.9);c.fillRect(lx-1.2,ly-4.8,3.2,1.1);
   c.fillStyle='#fff2b8';c.fillRect(lx-1.25,ly-3.8,3.3,.6);
  });
 }
 if(night){
  const tick=catFrame-4,toWindow=catFrame<4?0:Math.max(0,Math.min(1,(tick-1)/5,(30-tick)/5));
  const x=-.56+(-.875+.56)*toWindow,y=-.20+.48*toWindow;
  const z=4.05+1.65*toWindow+Math.sin(Math.PI*toWindow)*4.1;
  // On the desktop, composite the cat after the tabletop; at the sill it sits behind the desks.
  place(toWindow<.3?-.19:x,toWindow<.3?-.29:y,()=>{const [u,v]=p(x,y,z);roomCat(c,u,v,catFrame);});
 }
 furniture.sort((a,b)=>a.depth-b.depth).forEach(obj=>obj.draw());
 north(night?'#aa9272':'#e5cfab',1,-1,1,-.8,.65);
 west(night?'#8e816f':'#b5a48c',1,-1,1,-.8,.65);
 c.restore();
}

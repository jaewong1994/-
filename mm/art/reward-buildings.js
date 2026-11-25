// Hand-drawn isometric parcels. Coordinates are in the same 2:1 projection as the streets.
import {fair} from './city-activity.js';
const sprites=new Map();
function sprite(style,night){
 const image=document.createElement('canvas');image.width=84;image.height=116;
 const c=image.getContext('2d');c.translate(42,100);
 const pt=(x,y,z)=>[Math.round(x-y),Math.round((x+y)/2-z)];
 const face=(color,points)=>{c.fillStyle=color;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill();};
 const rect=(color,x,y,w,h)=>{c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),w,h);};
 const line=(color,points,w=1)=>{c.strokeStyle=color;c.lineWidth=w;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x+.5,y+.5):c.moveTo(x+.5,y+.5));c.stroke();};
 const shade=(color,f)=>'#'+[1,3,5].map(i=>Math.round(parseInt(color.slice(i,i+2),16)*f).toString(16).padStart(2,'0')).join('');
 const box=(x,y,a,b,z,h,col,cap)=>{
  const vertices=[pt(x-a,y-b,z+h),pt(x+a,y-b,z+h),pt(x+a,y+b,z+h),pt(x-a,y+b,z+h)];
  face(shade(col,.72),[vertices[1],vertices[2],pt(x+a,y+b,z),pt(x+a,y-b,z)]);
  face(col,[vertices[2],vertices[3],pt(x-a,y+b,z),pt(x+a,y+b,z)]);
  face(cap||col,vertices);
 };
 const ellipse=(col,x,y,rx,ry)=>{c.fillStyle=col;c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fill();};
 const light=night?'#ffe290':'#b9dce1';
 const windows=(a,b,h,step=5,col=light)=>{
  for(let z=4;z<h-2;z+=step)for(let u=-a+2;u<a-1;u+=4){const [x,y]=pt(u,b,z);rect(col,x,y,2,2);}
  for(let z=5;z<h-2;z+=step)for(let v=-b+2;v<b-1;v+=4){const [x,y]=pt(a,v,z);rect(shade(col,.78),x,y,1,2);}
 };
 const base=(col='#a3a79b')=>box(0,0,11,8,0,1,col,'#dbcfb5');
 const house=(col,cap,h=12,a=8,b=6)=>{base();box(0,0,a,b,1,h,col,cap);windows(a,b,h+1);
  if(h<=14){const awning=shade(cap,.92);box(0,b+1,a-.6,1.3,h*.56,1.2,awning,cap);
   for(const u of [-a+2,0,a-2]){const [x,y]=pt(u,b+.2,2);rect(night?'#ffd68a':'#41565a',x,y-3,2,3);}}
  else{box(0,0,a+.6,b+.6,h-1,1.6,col,cap);}};
 const gable=(x,y,a,b,z,h,col)=>{
  const left=pt(x-a,y+b,z),right=pt(x+a,y+b,z),front=pt(x,y+b,z+h),rear=pt(x,y-b,z+h);
  face(shade(col,.75),[front,right,pt(x+a,y-b,z),rear]);face(col,[left,front,rear,pt(x-a,y-b,z)]);
  face(shade(col,.86),[left,right,front]);
 };
 const stripe=(col,z,a=8,b=6)=>box(0,0,a+.25,b+.25,z,1.1,col,col);
 const pole=(x,y,h,col='#535e68')=>{line(col,[[x,y],[x,y-h]],1);};
 const sign=(bg,x,y,w,h)=>{rect('#40505a',x-.5,y-.5,w+1,h+1);rect(bg,x,y,w,h);};
 const lamp=(x,y)=>{pole(x,y,6);rect(night?'#ffe8ac':'#e8d9a9',x-1,y-7,2,2);};
 // The footprint, pavement and entrance take their palette from the building's use.
 const shops=[15,16,17,18,19,23,29,33,35],towers=[0,1,3,7,13,14,20,22,25];
 const civic=!shops.includes(style)&&!towers.includes(style),stone=shops.includes(style)?'#a38068':civic?'#849893':'#738994';
 if(style===5){fair(c,0,0,.91,4,night?'night':'day');return image;}
 box(0,0,13.8,10.4,-2.5,2,stone,shops.includes(style)?'#dac7a7':civic?'#c9cbb4':'#bfccca');
 for(let i=-11;i<=10;i+=4)line(shade(stone,.91),[pt(i,7,-.3),pt(i,10,-.3)]);
 const hedge=(x,y)=>{const [u,v]=pt(x,y,0);rect('#76624e',u,v-3,1,3);ellipse('#4a705b',u,v-4,2.1,2.7);ellipse('#80a073',u-1,v-5,1.25,1.6);};
 for(const corner of [[-11,5],[10,-6]])hedge(...corner);
 const mast=(x,y,z,h,col)=>{const a=pt(x,y,z),b=pt(x,y,z+h);line('#465c66',[a,b]);rect(col,b[0]-1,b[1]-1,2,2);};
 const glazing=(x,y,a,b,z,h,col)=>{
  box(x,y,a,b,z,h,col,shade(col,.93));
  for(let u=-a+2;u<a;u+=3)line(night?'#d9bb7b':'#bdd7dc',[pt(x+u,y+b,z+1),pt(x+u,y+b,z+h-1)]);
  for(let v=-b+1;v<b;v+=3)line('#547483',[pt(x+a,y+v,z+1),pt(x+a,y+v,z+h-1)]);
  for(let i=z+4;i<z+h;i+=4)line('#73939a',[pt(x-a,y+b,i),pt(x+a,y+b,i),pt(x+a,y-b,i)]);
 };
 const dome=(x,y,rx,ry,col)=>{
  ellipse(shade(col,.65),x,y,rx,ry*.35);c.fillStyle=col;c.beginPath();c.ellipse(x,y,rx,ry,0,Math.PI,2*Math.PI);c.fill();
  for(const f of [.4,.78]){c.beginPath();c.ellipse(x,y,rx*f,ry,0,Math.PI,2*Math.PI);c.strokeStyle=shade(col,.78);c.lineWidth=.75;c.stroke();}
 };
 switch(style){
 case 0: // Split cantilever crown with a luminous arc core.
  glazing(0,0,9,7,0,13,'#657b85');glazing(0,0,6,5,13,29,'#6c9ca5');
  box(1,-1,7,5,41,3,'#bc8263','#e4bd8d');glazing(2,-1,4,4,44,12,'#76939e');
  face('#a75145',[[-8,-34],[-4,-37],[0,-53],[8,-60],[4,-48],[2,-40]]);
  ellipse('#334850',2,-47,4,4);ellipse(night?'#a8ffef':'#b7e8df',2,-47,2.6,2.6);mast(2,-2,55,9,'#f1c379');break;
 case 1:
  glazing(0,0,8,5,0,39,'#517b97');glazing(-2,-1,5,4,39,12,'#6c8098');
  for(const k of [-1,1]){line('#db9e86',[[k*10,0],[k*8,-16],[k*5,-32],[k*2,-51]],1.3);
   for(let z=8;z<45;z+=9)line('#d9cbb9',[[k*8,-z+3],[0,-z-2],[k*6,-z-6]]);}
  mast(-3,-1,50,10,'#ffe5bb');break;
 case 2:
  box(0,0,10,7,0,8,'#ad957f','#d5cbb0');box(-2,-1,7,6,8,7,'#697e82');
  dome(-1,-15,11,11,'#81b9b0');line('#47596a',[[-6,-16],[-1,-25],[5,-23]],2);
  for(let i=0;i<4;i++)box(7,i*1.65-2,2,.64,0,4.8-i,'#c4b49a','#ece3c6');mast(6,-4,7,11,'#e2c176');break;
 case 3:
  for(const [z,a,x] of [[0,9,0],[12,8,-1],[23,6,1],[33,4,0]]){
   glazing(x,0,a,5,z,9,'#7b9990');box(x,0,a+1.4,6,z+9,2,'#c6bba0','#91a777');
   for(const u of [-a+2,a-2]){const [xx,yy]=pt(x+u,4,z+12);ellipse('#48775f',xx,yy,2.5,2.2);rect('#86ac73',xx-1,yy-2,2,1);}}
  break;
 case 4:
  house('#b56c52','#dfc7a6',13,9,6);box(0,0,9,7,14,1,'#546b70','#687f79');
  ellipse('#e3d7b3',0,-16,5.4,2.6);ellipse('#617b79',0,-16,4,1.65);
  ellipse('#b54d3d',0,-20,4.5,2.4);rect('#9bc4cb',1,-22,2,2);line('#824f40',[[-3,-20],[-8,-23],[-9,-25]],2);
  rect('#515f63',-8,-25,16,1);rect('#53666d',0,-24,1,3);break;
 case 6:
  box(0,0,12,7,0,4,'#a5a089','#c8cbb5');
  for(const [x,y,r,h] of [[-6,-6,7,8],[5,-4,8,11],[-1,-8,9,13]])dome(x,y,r,h,'#89c3b6');
  for(const x of [-7,-2,4]){line('#799b7b',[[x,-5],[x-1,-10],[x+1,-13]]);rect('#81a86f',x-3,-10,2,1);}
  box(4,7,3,2,0,4,'#b2a587','#d6c6a4');break;
 case 7:
  box(0,0,9,7,0,5,'#aba28a','#ded1b2');box(0,0,4.6,4,5,23,'#c9916d','#dbb993');
  box(0,0,5.7,4.8,28,8,'#b78c6e','#dbc9a8');ellipse('#eadbb5',-2,-29,3.3,3.9);
  line('#5f5f58',[[-2,-32],[-2,-29],[0,-28]]);gable(0,0,6,5,36,10,'#508780');mast(0,0,46,5,'#f5c772');break;
 case 8:
  house('#8e6663','#b69880',13,10,7);box(0,-4,9,1,14,9,'#454b61','#62647a');
  face('#e5cf9e',[pt(-8,-2.9,15),pt(8,-2.9,15),pt(8,-2.9,22),pt(-8,-2.9,22)]);
  for(let row=0;row<3;row++)for(let seat=0;seat<5;seat++)box(-6+seat*2.9,row*2.1-.7,1,.6,14,1.5,'#a95f56');
  mast(8,4,14,7,'#ffe7a8');break;
 case 12: // Front lawn, stone wings, roof dormers and a small pool.
  box(0,0,13,10,0,1,'#7c9567','#92ae79');box(-2,-2,8,5,1,11,'#ead3ae','#d9c4ac');
  gable(-2,-2,8.8,5.7,12,6,'#59667b');box(-7,0,3,4,1,8,'#dfbd94');gable(-7,0,3.6,4.4,9,4,'#61758a');
  for(const x of [-9,-5,-1]){rect('#d2dece',x,-13,2,3);rect('#485b6b',x,-12,1,2);}
  for(const x of [0,3,6])rect('#f8e8cb',x,-8,1,5);face('#71bdc1',[pt(6,4,1.2),pt(11,4,1.2),pt(11,8,1.2),pt(6,8,1.2)]);break;
 case 13:{
  base();const rings=[[0,11],[10,10],[28,8.5],[45,6.2],[61,3.7],[74,1.3]];
  const edge=(h,r,side)=>[side*r,-h+(side===0?3:0)];
  for(let i=1;i<rings.length;i++){const [z,a]=rings[i-1],[h,b]=rings[i];
   face('#aac7cb',[edge(z,a,-1),edge(z,a,0),edge(h,b,0),edge(h,b,-1)]);
   face('#628e9e',[edge(z,a,0),edge(z,a,1),edge(h,b,1),edge(h,b,0)]);
   for(let y=z+2;y<h;y+=3){const r=a+(b-a)*(y-z)/(h-z);line('#88abb3',[[-r,-y],[0,-y+2],[r,-y]]);}
  }
  line('#ecf2d9',[[-7,-3],[-5,-34],[-2,-62],[-2,-77]]);line('#d6e5dc',[[4,-42],[2,-63],[2,-75]]);break;}
 case 14:
  base();box(0,0,8,5,0,52,'#c29744','#ead186');
  for(let z=3;z<52;z+=3){line(z%2?'#edc870':'#b4863a',[pt(-7,5,z),pt(8,5,z),pt(8,-5,z)]);}
  for(let u=-6;u<8;u+=3)line('#dcb65e',[pt(u,5,2),pt(u,5,50)]);
  box(0,0,6.7,4.2,52,2,'#c8ac6a','#edda91');pole(1,-54,5);break;
 case 15:
  house('#b76b42','#ebd3a1',8);stripe('#e5a14c',8);stripe('#8d4539',6);
  pole(10,1,17);ellipse('#efc372',10,-18,5,3);rect('#ad473c',6,-18,9,2);
  face('#edb74c',[[-8,-10],[-8,-14],[-6,-12],[-4,-15],[-2,-12],[0,-14],[-1,-10]]);break;
 case 16:
  house('#9c4b3e','#d35b46',8);stripe('#d9ba6e',6);
  pole(-10,1,17);sign('#be4237',-15,-22,10,8);
  line('#ffce43',[[-14,-16],[-13,-20],[-12,-21],[-11,-20],[-10,-17],[-9,-20],[-8,-21],[-7,-20],[-6,-16]],1.5);break;
 case 17:
  house('#8aabb0','#cde4d9',8);for(const x of [-8,-4,0]){rect('#d6ebe5',x,-5,3,4);ellipse('#598298',x+1,-3,1,1);}
  line('#7e7d73',[[-9,-11],[0,-13],[6,-12]]);for(const [x,col] of [[-7,'#f4d487'],[-3,'#e7c1b6'],[1,'#99cede']])rect(col,x,-12,2,3);break;
 case 18:
  house('#927262','#b3af86',9);for(let i=0;i<5;i++)rect(['#b3624f','#e0be77','#567c76'][i%3],-9+i*2,-5,1,4);
  ellipse('#373b40',1,-13,3,2);rect('#33383d',2,-16,3,3);rect('#383d41',2,-17,1,2);rect('#383d41',4,-17,1,2);line('#343a40',[[-1,-13],[-4,-14],[-4,-16]]);break;
 case 19:
  base();box(0,0,7,4,0,5,'#b37e46');gable(0,0,9,6,5,4,'#c66d48');
  ellipse('#e5a953',1,-12,5,2.7);face('#d89842',[[-4,-12],[-7,-15],[-7,-10]]);rect('#735246',4,-13,1,1);
  for(let x=-4;x<=2;x+=3)rect('#f2d698',x,-4,2,2);lamp(9,1);break;
 case 20:
  base();line('#657981',[[-10,2],[0,-27],[9,2]],2);
  ellipse('#547585',0,-24,17,18);ellipse(night?'#384b60':'#9cbac4',0,-24,15,16);
  for(let i=0;i<12;i++){const a=i*Math.PI/6,x=Math.cos(a)*16,y=-24+Math.sin(a)*17;line('#e8d3ab',[[0,-24],[x,y]]);if(i%2===0)rect(['#df925c','#b95554','#77a6a3'][i/2%3],x-2,y,4,3);}
  ellipse('#ffe0a0',0,-24,2,2);break;
 case 21:
  house('#b9aa96','#d2cbb0',12,10,6);gable(0,0,10,6,13,4,'#95a69d');
  line('#efe3c4',[[-11,-4],[-6,-7],[-1,-8],[4,-9],[7,-14],[10,-15]],2);
  for(let i=-5;i<=3;i+=2)line('#e6d8b7',[[i,-8],[i+1,-5]]);rect('#ddd0a8',8,-16,4,2);break;
 case 22:
  house('#8b9fae','#cee0d6',34);for(let z=5;z<34;z+=6)stripe('#bdc8c4',z);
  box(0,0,5,3,35,.7,'#d9d6b3','#65b8c3');line('#f2eee0',[[-2,-36],[-2,-39],[0,-40]]);break;
 case 23:
  house('#805858','#645563',8);sign('#463c48',-9,-11,8,5);ellipse('#292e36',1,-13,4.5,4.5);ellipse('#c78b68',1,-13,1.25,1.25);rect('#eacb8c',-7,-7,1,3);break;
 case 24:
  house('#7792a3','#acced1',13);box(0,0,5,3,14,4,'#f0d8af','#f8efcf');
  line('#9e7165',[[-6,-18],[0,-15],[6,-18]]);for(const [x,y] of [[-8,-16],[8,-18],[10,-16]])ellipse('#d2e3dd',x,y,3,2);break;
 case 25:
  base();box(-5,0,1.5,1.5,0,36,'#ab8777');for(let z=4;z<34;z+=6)line('#dfb67a',[[-8,-z],[-4,-z-4],[-8,-z-6]]);
  face('#e5ded2',[[0,-8],[0,-26],[3,-34],[6,-26],[6,-8]]);face('#ce7054',[[0,-26],[3,-34],[6,-26]]);
  face('#b75e4f',[[0,-13],[-4,-5],[1,-8]]);face('#b75e4f',[[6,-13],[9,-5],[5,-8]]);ellipse('#50879b',3,-22,1.7,2);break;
 case 26:
  house('#8b887c','#cdbfa3',9);for(let i=0;i<8;i++)rect(i%2?'#504d55':'#eee1c5',-8+i*2,-7,2,2);
  face('#dccda9',[[-5,-11],[4,-11],[3,-15],[1,-20],[3,-23],[3,-26],[0,-24],[-2,-25],[-6,-19],[-5,-17],[-1,-19],[0,-16]]);break;
 case 27:
  base();ellipse('#8d6275',0,-2,16,8);ellipse('#dbf0e9',0,-4,15,7);ellipse('#aad2db',0,-4,12,5);
  for(const x of [-14,14]){pole(x,-2,13);rect('#ffe5ac',x-2,-16,4,2);}line('#eef9f1',[[-7,-4],[-3,-5],[2,-5],[5,-4]]);break;
 case 28:
  house('#698f98','#80b3b6',13,9,6);ellipse('#4b8293',-4,-6,6,3);ellipse('#b9dbaf',-5,-6,2,1);
  face('#769cab',[[-7,-17],[-4,-22],[2,-23],[6,-20],[10,-22],[8,-17],[5,-17],[3,-15],[-4,-15]]);rect('#cef0e4',-3,-21,1,1);break;
 case 29:
  house('#ceac81','#a68d80',7);ellipse('#f7e7bd',0,-12,3.5,3);ellipse('#f0dfba',-2,-16,1,3);ellipse('#f0dfba',1,-16,1,3);
  ellipse('#b77c60',7,-7,2.6,1.4);line('#794f44',[[5,-11],[9,-5]],1.3);break;
 case 30:
  base();box(0,0,8,6,0,14,'#76668e','#9285ab');sign('#343a5a',-8,-13,10,7);
  rect('#88d9bf',-6,-11,4,1);rect('#d8959c',-2,-9,2,2);rect('#f5ce76',-6,-7,2,2);
  pole(4,-15,4);ellipse('#d96370',4,-20,2.1,2.1);break;
 case 31:
  house('#956757','#ad9c84',12);sign('#f4d495',-11,-11,14,4);for(let i=0;i<4;i++)rect('#a95448',-9+i*3,-11,1,1);
  rect('#404553',-1,-19,11,5);for(let i=0;i<4;i++)line('#e7e0c8',[[i*3,-18],[i*3+2,-19]],1);break;
 case 32:
  base();ellipse('#8b9694',0,-4,17,9);ellipse('#dbdbbf',0,-7,16,9);ellipse('#acc0b8',1,-9,11,6);ellipse('#818c80',1,-10,7,3);ellipse('#81a377',1,-10,4,2);
  for(const x of [-12,12]){pole(x,-8,9);rect('#efdfaf',x-2,-18,4,2);}break;
 case 33:
  house('#d8d4bc','#cad5c5',7);stripe('#648e78',7);stripe('#da9457',6);sign('#f3ddba',-1,-11,10,4);
  ellipse('#eee3ba',5,-11,3,1.2);line('#c28c61',[[3,-12],[5,-14],[7,-13]]);break;
 case 34:
  base();ellipse('#c09a76',0,-2,12,5);for(const x of [-7,0,7]){pole(x,-3,10,'#d3b277');rect('#dccb9c',x-2,-7,4,2);}
  for(let i=0;i<6;i++)face(i%2?'#e3bf96':'#b96565',[[0,-19],[-13+i*4.4,-10],[-8.6+i*4.4,-10]]);pole(0,-19,3);rect('#e5ba66',0,-22,4,2);break;
 case 35:
  house('#c38884','#efc6ac',7);box(0,0,4,3,8,3,'#e2a7a1','#fff0ce');box(0,0,2.3,1.8,11,2,'#e6b2a0','#ffe8cc');
  ellipse('#c25150',0,-15,1.6,1.6);break;
 }
 // Street-facing details are visible at the student's normal map zoom.
 const glow=night?'#ffde83':'#d9ba83';
 switch(style){
 case 12:
  for(const x of [-6,0]){box(x,-1,1.25,1.25,14,3,'#d9c4a4');gable(x,-1,1.65,1.6,17,2,'#5e7382');}
  for(let i=0;i<3;i++)box(1,6.5+i,3,.6,0,2.7-i*.65,'#b9b4a2','#efe2c7');hedge(-9,7);break;
 case 13:
  glazing(0,0,10,7,0,6,'#75969f');line('#e5e7cf',[[2,-10],[4,-36],[3,-52],[1,-65]]);rect(glow,-2,-76,1,2);break;
 case 14:
  box(0,0,10,7,0,6,'#ae8646','#e2c887');glazing(-3,5,3,1.6,0,4,'#5a7577');box(1,0,4,2,53,3,'#ac914f','#e5cf83');break;
 case 15:
  for(const x of [-5,3]){box(x,8,1.8,1,0,1.7,'#966b4c','#f1c67b');}rect('#f4c467',-6,-15,3,1);break;
 case 16:
  for(const u of [-5,-1,3])line('#e9bf76',[pt(u,6,7),pt(u,8.5,5)],1.5);box(-7,6,1.4,1,0,4,'#933f39','#f5b966');break;
 case 17:
  for(const x of [-6,-2,2]){const [u,v]=pt(x,6.8,4);ellipse('#d9e6d8',u,v,1.8,2);ellipse('#547a88',u,v,1,1.3);}mast(8,-4,8,7,'#a5d9d2');break;
 case 18:
  for(let i=0;i<7;i++)box(-6+i*1.5,7.4,.57,.7,0,2.5+i%3,['#ad7364','#6e8680','#c39766'][i%3]);break;
 case 19:
  for(const x of [-4,1,5]){const [u,v]=pt(x,5,6);rect('#e8af73',u,v,2,3);rect('#8e5943',u,v+2,2,1);}break;
 case 20:
  for(const off of [-2,2])line('#73959d',[[-12+off,3],[-2+off,-24],[12+off,2]],1);ellipse('#d2b279',0,-24,2.8,2.8);break;
 case 21:
  for(const u of [-8,-4,0,4,8]){box(u,6.7,.72,.75,0,7.5,'#cfc2a7','#f3ddba');}gable(0,6,10.5,2.4,8.5,3.5,'#8d9990');break;
 case 22:
  for(const u of [-4,0,4]){const [x,y]=pt(u,-2,36);ellipse('#d68773',x,y,1.8,1);rect('#f2dfad',x,y,1,2);}break;
 case 23:
  line('#d9ad73',[[5,-11],[6,-15],[7,-13],[7,-8],[4,-7]],1.6);ellipse(glow,3,-7,1.6,1);break;
 case 24:
  mast(-7,4,8,11,'#e2a182');box(8,6,1.8,1.4,0,4.8,'#527b8b','#d6c3a4');break;
 case 25:
  box(3,1,5,3,0,3,'#879a99','#c2c8ac');line('#d0c19c',[[-7,-23],[0,-24]],2);line('#d0c19c',[[-7,-15],[0,-16]],2);break;
 case 26:
  for(let i=0;i<4;i++)for(let j=0;j<2;j++)box(-4+i*2,7+j*2,1,1,0,.5,(i+j)%2?'#6a6463':'#ddcfb0');break;
 case 27:
  for(let i=0;i<10;i++){const a=(i/9)*Math.PI;rect('#897c71',Math.cos(a)*14,-3+Math.sin(a)*6,1,3);}break;
 case 28:
  for(let i=0;i<6;i++){const [x,y]=pt(-7+i*2.5,6.2,7);ellipse('#9dd4cc',x,y,1.2,1.5);}break;
 case 29:
  ellipse('#8b6859',5,-12,.7,.7);box(4,7,3,1.4,0,2,'#977964','#eee1b8');break;
 case 30:
  for(const x of [-4,0,4]){box(x,7,1.4,1.2,0,4,'#654f70','#cd97a5');const [u,v]=pt(x,7,3);rect('#81cdca',u-1,v,2,1);}break;
 case 31:
  for(let i=0;i<6;i++)rect(glow,-10+i*2,-8,1,1);box(6,6,2,1.6,0,4,'#97534e','#ecd296');break;
 case 32:
  for(let i=0;i<9;i++){const a=Math.PI*i/8;line('#a5b6b0',[[Math.cos(a)*15,-7+Math.sin(a)*8],[Math.cos(a)*8,-10+Math.sin(a)*3]]);}break;
 case 33:
  box(5,7,2.1,.9,0,4,'#7d9981','#efe0be');for(let i=0;i<3;i++)rect('#eac07c',1+i*2,-9,1,1);break;
 case 34:
  for(const x of [-8,-4,0,4,8])rect(glow,x,-9+Math.abs(x)*.1,1,1);ellipse('#b78568',0,-3,2,1);break;
 case 35:
  for(const x of [-3,0,3]){ellipse('#f7e3be',x,-12,1.4,1);rect('#ad4f53',x,-13,1,1);}break;
 }
 if(night){c.globalCompositeOperation='source-atop';c.fillStyle='#1e284755';c.fillRect(-42,-100,84,116);}
 return image;
}
function cachedSprite(style,period){
 const night=period==='night'||period==='dawn',key=style+'/'+night;
 if(sprites.has(key))return sprites.get(key);
 const raw=sprite(style,night),ctx=raw.getContext('2d'),pixels=ctx.getImageData(0,0,raw.width,raw.height).data;
 let x0=raw.width,y0=raw.height,x1=0,y1=0;
 for(let y=0;y<raw.height;y++)for(let x=0;x<raw.width;x++)if(pixels[(y*raw.width+x)*4+3]>12){
  x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);
 }
 const image=document.createElement('canvas');image.width=x1-x0+1;image.height=y1-y0+1;
 image.getContext('2d').drawImage(raw,-x0,-y0);const b={image,ox:42-x0,oy:100-y0};sprites.set(key,b);return b;
}
export function rewardSprite(style,x,y,width,period){
 const b=cachedSprite(style,period),s=width/33,left=x-b.ox*s,top=y-b.oy*s,w=b.image.width*s,h=b.image.height*s;
 return {image:b.image,left,top,right:left+w,bottom:top+h,width:w,height:h};
}
export function drawRewardBuilding(c,style,x,y,width,period){
 const b=rewardSprite(style,x,y,width,period);c.drawImage(b.image,b.left,b.top,b.width,b.height);
}
export function rewardThumbnail(style){
 const {image}=cachedSprite(style,'day'),cv=document.createElement('canvas');cv.width=104;cv.height=100;
 const s=Math.min(94/image.width,92/image.height),w=image.width*s,h=image.height*s;
 const c=cv.getContext('2d');c.imageSmoothingEnabled=false;c.drawImage(image,(104-w)/2,(100-h)/2,w,h);return cv;
}

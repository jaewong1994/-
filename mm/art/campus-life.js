import {drawSign} from './roof-sign.js';
import {residentPose,drawResident} from './village-life.js';
import {tile,shape,line} from './city-art.js';

export function specialBuilding(c,style,x,y,w){
 c.save();c.translate(x,y);c.scale(w/40,w/40);
 if(style===6){
  tile(c,'park',0,0,43);shape(c,'#60968b',[[-17,-10],[-17,-22],[0,-32],[16,-24],[16,-10],[0,-3]]);
  for(let i=0;i<4;i++)line(c,'#d1e9cb',1,[[-16+i*5,-12-i*2],[-16+i*5,-22-i*2],[i*5,-30+i*2],[i*5,-7+i]]);
  tile(c,'fir',7,-6,10);
 }else if(style===7){
  tile(c,'fountain',0,0,34);shape(c,'#9a6345',[[-5,-4],[-5,-37],[0,-42],[6,-38],[6,-5],[0,-2]]);
  shape(c,'#395e67',[[-9,-37],[0,-52],[9,-37],[0,-33]]);c.fillStyle='#f9dc88';c.fillRect(-4,-33,7,7);c.fillStyle='#414e55';c.fillRect(-1,-32,1,3);c.fillRect(-1,-30,3,1);
 }else{
  tile(c,'library',0,0,39);shape(c,'#594065',[[-17,-23],[-17,-39],[12,-47],[12,-30]]);
  shape(c,'#f7d58c',[[-14,-25],[-14,-36],[9,-43],[9,-32]]);line(c,'#b45058',2,[[-12,-29],[-6,-35],[0,-33],[7,-39]]);
 }
 c.restore();
}
function cat(c,x,y,s,t,feeding,variant){
 c.save();c.translate(x,y);c.scale(s,s);
 const coat=['#d19458','#67656a','#eee2c8'][variant%3],ink='#554846',step=feeding?0:Math.floor(t*2)%2;
 const box=(col,u,v,w,h)=>{c.fillStyle=col;c.fillRect(u,v,w,h);};
 box(ink,-5,-3,6,3);box(coat,-5,-4,6,3);box(coat,1,-5+step,3,3);box(ink,1,-6+step,1,1);box(ink,3,-6+step,1,1);
 box(coat,-7,-6+step,1,4);box(coat,-6,-4,2,1);box(ink,-4-step,-1,1,2);box(ink,-1+step,-1,1,2);c.restore();
}
function costume(c,style,p,time){
 const flip=p.right?1:-1;c.scale(flip,1);
 const box=(col,x,y,w,h)=>{c.fillStyle=col;c.fillRect(x,y,w,h);},beat=Math.floor(time*2)%2;
 if(style===9){
  shape(c,'#49948c',[[-2,-16],[-8,-13],[-12,-6+beat],[-5,-8],[1,-12]]);
  box('#d3f0a6',-4,-18,7,2);box('#428477',-4,-20,6,2);box('#ffce73',2,-10,5,5);
 }else if(style===10){
  box('#7c5463',-4,-19,6,4);box('#dec093',-3,-17,6,1);
  shape(c,'#b88243',[[1,-11],[7,-12],[9,-9],[7,-4],[4,-2],[1,-6]]);box('#f3d986',4,-10,1,5);
 }else{
  box('#6b4485',-4,-19,6,3);box('#82dce4',-4,-17,7,2);box('#704982',-6,-12,4,7);
  box('#d5dfe1',4,-12+beat,2,6);box('#96dce0',3,-14+beat,1,3);box('#96dce0',6,-14+beat,1,3);
 }
}
export function campusActors(c,scene,time,actor){
 const {academy,scale,project,walkers,cats,heroes}=scene;
 if(academy){const o=academy;actor(o.sy+.01,o.box.left,o.box.top,o.box.right,o.box.bottom,()=>{c.drawImage(o.sprite.image,o.sprite.left,o.sprite.top,o.sprite.width,o.sprite.height);if(scene.ticker)drawSign(c,o,scale,time,scene.ticker);});}
 for(const [idx,feeder] of cats.entries()){
  const p=residentPose(feeder,time),feeding=p.act==='feed',home=feeder.stops.find(a=>a.act==='feed')?.tile||feeder.stops[0].tile;
  const [bx,by]=project(home.x+.18,home.y+.16);
  actor(by,bx-5*scale,by-3*scale,bx+5*scale,by+2*scale,()=>{
   c.fillStyle='#8c5545';c.fillRect(bx-2*scale,by-1.5*scale,4*scale,1.5*scale);
   c.fillStyle='#e5b879';c.fillRect(bx-scale,by-2*scale,2*scale,scale);
  });
  const phase=time*.12+idx*2,range=.12+.12*Math.cos(phase);
  const [x,y]=project(feeding?p.x+.16:home.x+.16+range,feeding?p.y+.14:home.y+.14);
  actor(y,x-9*scale,y-10*scale,x+8*scale,y+3*scale,()=>{cat(c,x,y,scale*.7,time,feeding,idx);});
 }
 for(const [i,style] of heroes.entries()){
  const w=walkers[(i+1)%walkers.length];if(!w)continue;
  const p=residentPose(w,time+13*(i+1)),[x,y]=project(p.x+.10,p.y+.08);
  actor(y,x-13*scale,y-22*scale,x+13*scale,y+4*scale,()=>{
   c.save();c.translate(x,y);c.scale(scale*.66,scale*.66);
   drawResident(c,{...w,style:style*2,companion:false},p,0,0);c.scale(.76,.76);costume(c,style,p,time);c.restore();
  });
 }
}

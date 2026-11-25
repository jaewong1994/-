import {surface} from './city-hours.js';
const palettes={
 plane:['#486a50','#5b855f','#77a26c','#94b87f','#abc58b'],
 linden:['#4f6948','#668553','#82a45e','#9bb570','#b8c781'],
 flowering:['#936d83','#b97f99','#d79db2','#e9b8c7','#f8d8dc'],
 fir:['#3f614b','#507751','#70935e','#89a568','#a0b779'],
 pine:['#44634d','#547657','#6f9165','#86a474','#a2b685']
};
const native=new Map();
export function treeTile(c,o){
 if(!Object.hasOwn(palettes,o.id))return false;
 const variant=Math.abs(Math.round(o.t.x*7+o.t.y*3))%4,tag=o.id+variant+o.period;
 let sprite=native.get(tag);
 if(!sprite){
  sprite=document.createElement('canvas');sprite.width=28;sprite.height=32;
  const g=sprite.getContext('2d'),ink=h=>surface(h,o.period),colors=palettes[o.id].map(ink);
  g.fillStyle=ink('#755f48');g.fillRect(13,19,2,12);g.fillRect(10,21,3,2);g.fillRect(15,21,3,2);
  const conifer=o.id==='pine'||o.id==='fir';
  function cluster(cx,cy,rx,ry,tier){
   for(let v=-ry;v<=ry;v++){
    const width=conifer?(1+(v+ry)/(2*ry))*rx*.57:Math.sqrt(Math.max(0,1-v*v/(ry*ry)))*rx;
    for(let u=Math.ceil(-width);u<=width;u++){
     const tex=((cx*23+u*47+v*71+variant*29)%17+17)%17,light=-(u/rx*.47+v/ry*.7)+(tex-8)*.055;
     const idx=Math.max(0,Math.min(4,Math.floor(1.6+tier+light*1.35)));
     g.fillStyle=colors[idx];g.fillRect(cx+u,cy+v,1,1);
    }
   }
  }
  if(conifer){cluster(14,18,11,7,0);cluster(13,12,8,7,.35);cluster(13,7,5,6,.45);}
  else{cluster(15,17,9,6,0);cluster(8,15,6,6,.2);cluster(20,13,6,6,.25);cluster(13,10,9,7,.55);cluster(10+variant,7,5,4,.8);}
  native.set(tag,sprite);
 }
 const w=o.dw*1.12;c.drawImage(sprite,Math.round(o.sx-w*.5),Math.round(o.foot-w*32/28),w,w*32/28);return true;
}

// The sign runs parallel to the rear classroom wall, above the chalkboard.
export function signFrame(o,scale){
 const {rx,ry,height}=o.design;
 const left=-rx*.92,back=-ry*.94;
 return {x:o.sx+(left-back)*scale,y:o.sy+((left+back)/2-height-40)*scale,w:rx*1.83*scale,h:15.5*scale,scale};
}
export function onSign(o,scale,x,y){
 if(!o)return false;
 const f=signFrame(o,scale),u=x-f.x,v=y-f.y-u*.5;
 return u>=-scale&&u<=f.w+scale&&v>=-scale*1.6&&v<=f.h+scale*2;
}
export function drawSign(c,o,scale,time,lines){
 const f=signFrame(o,scale),w=f.w/scale,h=f.h/scale;
 c.save();c.translate(f.x,f.y);c.transform(scale,scale*.5,0,scale,0,0);
 for(const x of [2,w-3]){c.fillStyle='#425556';c.fillRect(x,h-.5,1.3,3.3);}
 c.fillStyle='#4d6059';c.fillRect(-.65,-.8,w+1.3,h+1.4);
 c.fillStyle='#142b2a';c.fillRect(0,0,w,h);
 c.fillStyle='#a5b5a1';c.fillRect(-.5,-.8,w+.8,.65);
 c.beginPath();c.rect(1,.7,w-2,h-1.4);c.clip();
 c.font='bold 10.5px "Gmarket Sans", sans-serif';c.textAlign='left';c.textBaseline='middle';
 const words=lines.join('     ◆     ')+'     ◆     ',length=c.measureText(words).width;
 const x=1-(time*13%length);c.fillStyle='#ffdc83';c.fillText(words,x,h*.55);c.fillText(words,x+length,h*.55);
 c.restore();
}

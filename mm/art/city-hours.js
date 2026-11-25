// All students see the same Korean civil time, including when travelling.
export const periods={
 dawn:{label:'새벽',from:0,shade:[24,29,79,.75],surface:.38,tint:[15,23,50],people:.17,traffic:.13,lamps:.82,windows:{H:.13,S:.06,O:.08,C:.06,P:.02,T:.23,I:.13}},
 morning:{label:'아침',from:5,shade:[245,181,117,.18],surface:.88,tint:[248,203,161],people:.83,traffic:1,lamps:.12,windows:{H:.22,S:.18,O:.18,C:.14,P:.03,T:.30,I:.18}},
 day:{label:'낮',from:9,shade:[0,0,0,0],surface:1,tint:[0,0,0],people:1,traffic:.62,lamps:0,windows:{H:.015,S:.04,O:.025,C:.02,P:0,T:.04,I:0}},
 evening:{label:'저녁',from:17,shade:[125,74,98,.39],surface:.67,tint:[122,75,96],people:.92,traffic:.9,lamps:.70,windows:{H:.56,S:.85,O:.42,C:.26,P:.68,T:.66,I:.32}},
 night:{label:'밤',from:20,shade:[13,19,48,.86],surface:.32,tint:[18,30,61],people:.34,traffic:.27,lamps:1,windows:{H:.65,S:.42,O:.19,C:.13,P:.66,T:.49,I:.21}}
};
export function koreanPeriod(date=new Date()){
 const hour=(date.getUTCHours()+9)%24;
 return hour<5?'dawn':hour<9?'morning':hour<17?'day':hour<20?'evening':'night';
}
// The location mix changes as well as the number of pedestrians.
const visits={
 dawn:{H:4,S:1,O:1,C:0,P:0,T:2,I:3},morning:{H:1,S:2,O:4,C:4,P:1,T:5,I:2},
 day:{H:1,S:3,O:3,C:3,P:4,T:2,I:1},evening:{H:3,S:5,O:1,C:1,P:4,T:4,I:1},
 night:{H:4,S:2,O:0,C:0,P:1,T:2,I:1}
};
export function destinations(objects,period){
 const result=[];
 for(const o of objects){
  const zone=o.id==='academy'||o.id==='school'?'C':o.design?.zone||(o.id==='fair'||['rest','exercise','feed'].includes(o.act)?'P':o.act==='shop'?'S':null);
  if(!zone||!o.act&&!['H','O','T','I'].includes(zone))continue;
  const weight=visits[period][zone]||0;
  if(weight||o.act==='feed'||o.act==='exercise')result.push({t:o.t,act:o.act||(zone==='O'||zone==='I'?'work':'rest'),weight:weight||1});
 }
 return result;
}
const cache=new Map();
export function surface(color,period){
 if(period==='day')return color;
 const key=period+color;if(cache.has(key))return cache.get(key);
 const {surface:k,tint}=periods[period],n=parseInt(color.slice(1),16);
 const rgb=[(n>>16)&255,(n>>8)&255,n&255].map((v,i)=>Math.round(v*k+tint[i]*(1-k)));
 const out='rgb('+rgb.join(',')+')';cache.set(key,out);return out;
}

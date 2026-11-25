// Draw at the native pixel pitch once. All elevations share the atlas light direction.
const specs={
 'crown-tower':[[14,11,14],[11,9,41],[8,7,17],[4,4,10]],
 'terraced-tower':[[16,11,15],[13,10,19],[10,8,16],[7,7,12]],
 'glass-blade':[[15,8,9],[12,6,47],[9,4,8]],
 'garden-slab':[[16,11,11],[13,10,12],[11,8,12],[8,7,9]],
 'deco-hall':[[16,10,9],[13,9,14],[8,6,8]],
 'quay-house':[[11,8,12],[10,7,3]],
 'arcade':[[18,9,10],[13,7,5]],
 'glasshouse':[[18,10,4],[15,8,6]],
 'platform':[[20,7,4],[17,5,5]],
 'terrace-row':[[17,8,12],[16,7,4]]
};
export const buildingNames={'crown-tower':'첨탑 금융센터','terraced-tower':'계단식 오피스','glass-blade':'유리 업무 타워','garden-slab':'테라스 아파트','deco-hall':'시민회관','quay-house':'수변 연립주택',arcade:'아케이드 상가',glasshouse:'공원 온실',platform:'역 승강장','terrace-row':'연립주택 거리'};
const materials={
 blue:['#668997','#365d70','#bfd2cd','#b4d6d4'],
 stone:['#b8b399','#858779','#e1d9b9','#5a7778'],
 jade:['#7e9c91','#526e6a','#c3cbb1','#b8d3bb'],
 brick:['#bd8c72','#936c61','#dab992','#5c7072']
};
const cached=new Map();
function bitmap(name){
 const cv=document.createElement('canvas');cv.width=66;cv.height=112;
 const c=cv.getContext('2d');c.translate(33,110);
 const poly=(color,points)=>{c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(Math.round(x),Math.round(y)):c.moveTo(Math.round(x),Math.round(y)));c.closePath();c.fillStyle=color;c.fill();};
 const rect=(color,x,y,w,h)=>{c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),w,h);};
 const glass=['glass-blade','crown-tower','glasshouse'].includes(name);
 const [sun,dark,cap,win]=materials[glass?'blue':name==='terraced-tower'||name==='deco-hall'?'stone':name==='garden-slab'||name==='platform'?'jade':'brick'];
 const levels=specs[name];let top=-12;
 for(const [i,[a,b,h]] of levels.entries()){
  // Front corner stays over the same point as the narrower upper floors step inward.
  const f=top+(a+b)*.36,l=[-a,top+(b-a)*.36],r=[b,top+(a-b)*.36],back=[b-a,top-(a+b)*.36];
  poly(sun,[[0,f],l,[l[0],l[1]-h],[0,f-h]]);
  poly(dark,[[0,f],r,[r[0],r[1]-h],[0,f-h]]);
  for(let z=3;z<h-1;z+=glass?4:5)for(const sign of [-1,1]){
   const len=sign===-1?a:b,roofGarden=name==='garden-slab';
   if(roofGarden||glass&&i>0){
    poly(sign<0?win:'#88a7a4',[[sign,f-z-.5],[sign*(len-1),f-(len-1)*.72-z],[sign*(len-1),f-(len-1)*.72-z-1],[sign,f-z-1.5]]);
   }else for(let q=2;q<len-1;q+=4)rect(sign<0?win:'#405b60',sign*q,f-q*.72-z-1,2,2);
  }
  poly(name==='glasshouse'?'#a9c8c3':cap,[[0,f-h],[l[0],l[1]-h],[back[0],back[1]-h],[r[0],r[1]-h]]);
  if(name==='garden-slab'||name==='terraced-tower'){
   for(let q=2;q<a-1;q+=4){rect('#5b815d',-q,f-q*.72-h-2,3,2);rect('#95aa70',-q,f-q*.72-h-3,2,1);}
  }
  if(i===0&&['terrace-row','arcade','quay-house'].includes(name))for(let q=2;q<a-1;q+=4){
   rect(q%3?'#ead8ae':'#ac6655',-q,f-q*.72-5,4,2);rect('#444d49',-q+1,f-q*.72-3,2,3);
  }
  top-=h;
 }
 if(name==='crown-tower'){rect('#536b71',-1,top-12,2,13);rect('#dda872',-1,top-13,1,2);}
 else if(name==='glasshouse'||name==='platform')for(let q=-11;q<10;q+=4)rect('#e6e4cd',q,top-3-Math.abs(q)*.27,1,4);
 else{rect('#939686',-4,top-3,5,3);rect('#d3d0b6',-4,top-4,5,1);}
 return {cv,native:levels[0][0]+levels[0][1],height:14+levels.reduce((n,l)=>n+l[2],0)};
}
export function buildingHeight(name){return specs[name]?(14+specs[name].reduce((n,l)=>n+l[2],0))/(specs[name][0][0]+specs[name][0][1]):null;}
export function drawBuilding(c,name,x,y,width,flip){
 if(!Object.hasOwn(specs,name))return false;
 if(!cached.has(name))cached.set(name,bitmap(name));
 const {cv,native}=cached.get(name),s=width/native;
 c.save();c.translate(Math.round(x),Math.round(y));c.scale(flip?-s:s,s);c.drawImage(cv,-33,-110);c.restore();return true;
}

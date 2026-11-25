import {rewardSites,rewardKind} from './reward-sites.js';
import {random,key} from './city-form.js';

const label={academy:'입실론수학학원 · 민재웅 선생님',gable:'골목 주택',terrace:'연립주택',retail:'상점가',apartment:'아파트',balcony:'테라스 아파트',
 glass:'유리 업무동',setback:'계단식 업무 타워',twin:'쌍둥이 업무 타워',fin:'금융센터',museum:'시립 미술관',
 clock:'시계탑 도서관',school:'학교',station:'기차역',factory:'공장',shed:'물류 창고',wintergarden:'유리 온실',
 hall:'시민회관',clinic:'보건소',fieldhouse:'체육관'};
const ranges={academy:[4,4],gable:[1,3],terrace:[2,5],retail:[2,5],apartment:[7,19],balcony:[7,17],glass:[11,22],
 setback:[13,24],twin:[13,20],fin:[21,27],museum:[2,3],clock:[2,3],school:[3,5],station:[2,3],
 factory:[2,4],shed:[1,3],wintergarden:[1,2],hall:[3,6],clinic:[3,5],fieldhouse:[1,2]};
const choices=(pool,n)=>pool[Math.floor(n*pool.length)];
function rotated(x,y,n){for(let i=0;i<n;i++)[x,y]=[4-y,x];return [x,y];}

export function populate(cells,gifts,plan,form,names,rewardNames,stage){
 const objects=[],byLot=new Map();
 for(const g of gifts){if(!rewardSites(plan,g.style).includes(g.lot))continue;if(!byLot.has(g.lot))byLot.set(g.lot,[]);byLot.get(g.lot).push(g);}
 cells.forEach((cell,index)=>{
  const [bx,by,zone,variant]=cell,feature=plan.feature;
  const randomAt=tag=>random(variant,tag),pick=(tag,pool)=>choices(pool,randomAt(tag));
  const neighbours=[[1,0],[-1,0],[0,1],[0,-1]].map(([x,y])=>form.byCell.get(key(bx+x,by+y))).filter(b=>b&&(cell[5]||!b[5])).map(b=>b[2]);
  const edgeHome=cell[5]&&neighbours.length<4;
  const central=neighbours.includes('O')||neighbours.includes('T'),europe=feature==='canal'||feature==='court';
  // A riverbank keeps the same level as the other streets. Only the buildable width changes.
  function inland(axis,block,v){
   if(form.waterAxis!==axis)return v;
   if(block*4===form.waterLine)return .83+.7925*v;
   if(block*4+4===form.waterLine)return .7925*v;
   return v;
  }
  const point=(x,y)=>({x:bx*4+inland('x',bx,x),y:by*4+inland('y',by,y)});
  function build(type,x,y,width,depth,tag,lot,act){
   const t=point(x,y),lo=point(x-width/2,y-depth/2),hi=point(x+width/2,y+depth/2);
   const rx=(hi.x-lo.x)*form.unitX/2,ry=(hi.y-lo.y)*form.unitY/2;
   const [cx,cy]=form.ground(t.x,t.y);
   const start=plan.blocks[0],origin=(axis,v)=>form.waterAxis!==axis?v:form.waterLine===0?.83+.7925*v:.7925*v;
   const [ax,ay]=form.ground(start[0]*4+origin('x',1.86),start[1]*4+origin('y',1.99));
   const adjacent=Math.hypot(cx-ax,(cy-ay)*1.8)<85;
   const inFront=cy>=ay&&cy-ay<155&&Math.abs(cx-ax)<rx+ry+42;
   const protectedLot=type!=='academy'&&(adjacent||inFront);
   if(protectedLot&&!['school','gable','retail','terrace'].includes(type))type='retail';
   const n=randomAt(tag+'floors'),[low,high]=ranges[type],floors=protectedLot?1:low+Math.round(n*(high-low));
   const seed=Math.floor(randomAt(tag+'finish')*0xffffffff)>>>0;
   const floorHeight=['shed','museum','station','wintergarden','fieldhouse'].includes(type)?5:['apartment','balcony','glass','setback','fin','twin'].includes(type)?4.8:4;
   const height=type==='academy'?28:4+floorHeight*floors,extra={academy:54,fin:24,clock:21,station:9,museum:11,wintergarden:11,factory:21,
    gable:9,terrace:7,shed:7,apartment:4,balcony:5,glass:4,setback:5,twin:5}[type]||4;
   const design={type,rx,ry,seed,feature,floors,floorHeight,height,sky:height+extra+(rx+ry)/2,zone,stage};
   const tagSlot={shop00:0,shop10:1,business00:0,business11:1,library:1,shops:0,hotel:1};
   if(lot===undefined&&cell.length===4&&Object.hasOwn(tagSlot,tag))lot=plan.blocks.indexOf(cell)*4+tagSlot[tag];
   const earned=byLot.get(lot)||[],gift=earned[0],w=2*(rx+ry);
   if(earned.length){
    const accents=['fountain','plane','bench','flowering','kiosk','linden','fir','fountain','kiosk','bench','plane','flowering'];
    [...new Set(earned.map(g=>g.style))].slice(0,4).forEach((style,i)=>{
     const place=point(x+(i%2?-.5:.5)*width,y+(.42-i*.23)*depth);
     objects.push({t:place,id:accents[style]||'bench',w:8+i%2*2,ordinaryWidth:9,label:rewardNames[style]+' 기념물',act:'rest'});
    });
   }
   objects.push({t,id:type,architecture:true,design,lot,gift,w:gift?(rewardKind(gift.style)==='small'?(index===0?37:Math.max(43,Math.min(60,w))):Math.max(68,Math.min(84,w*1.20))):w,ordinaryWidth:w,
    label:gift?rewardNames[gift.style]:label[type],act,level:earned.length,effects:[...new Set(earned.map(g=>g.style))]});
  }
  function prop(id,x,y,w,act){
   objects.push({id,t:point(x,y),w,ordinaryWidth:w,architecture:false,label:names[id]||'벚나무',act});
  }
  if(index===0){
   build('academy',1.86,1.99,2.92,2.50,'epsilon',undefined,'study');
   build('school',.70,.42,1.12,.56,'first-school',undefined,'read');
   build('gable',3.43,.50,.90,.64,'first-home',0,'rest');
   build('retail',3.44,3.58,.85,.66,'corner-store',1,'shop');
   prop('bench',.58,2.93,10,'feed');prop('plane',.52,3.49,14);
  }else if(zone==='H'){
   const anchors=[[1.12,1.12],[2.86,2.86]].map(([x,y])=>rotated(x,y,variant%4));
   for(let a=0;a<2;a++)for(let b=0;b<2;b++){
    const x0=a?2.15:.22,x1=a?3.78:1.85,y0=b?2.15:.22,y1=b?3.78:1.85;
    const tag='home'+a+b,slot=anchors.findIndex(([x,y])=>(x>2)===!!a&&(y>2)===!!b);
    if(stage===0&&slot<0)continue;
    const high=stage>=3&&!europe&&randomAt(tag+'density')<(edgeHome?.07:cell[5]==='gardens'?.10:central?.80:.46);
    const dwelling=high?pick(tag,['apartment','balcony','apartment']):pick(tag,europe?['gable','terrace','terrace']:['gable','terrace']);
    if(slot>=0){
     const [x,y]=anchors[slot],w=Math.min(x-x0,x1-x)*2-.04,d=Math.min(y-y0,y1-y)*2-.04;
     build(stage===0?'gable':dwelling,x,y,w,d,tag,cell.length===4?index*4+slot:undefined);
     continue;
    }
    const splitX=(variant+a+b)%2===0,tagWidth=x1-x0,tagDepth=y1-y0;
    const units=stage>=2&&!high?3:2;
    for(let j=0;j<units;j++){
     const x=x0+tagWidth*(splitX?(j+.5)/units:.5),y=y0+tagDepth*(splitX?.5:(j+.5)/units);
     build(j===0?dwelling:pick(tag+'annex',high?['apartment','terrace','retail']:['terrace','gable','retail']),
      x,y,tagWidth*(splitX?.95/units:.93),tagDepth*(splitX?.93:.95/units),tag+j);
    }
   }
   if(stage>0){prop('linden',1.90,.48,12);prop('flowering',.40,2.0,13);}
  }else if(zone==='S'){
   for(let row=0;row<2;row++){
    const n=3+(variant+row)%2,step=3.6/n;
    for(let j=0;j<n;j++){const x=.2+(j+.5)*step,y=row?3.02:1.00,tag='shop'+row+j;
     let style=pick(tag,['retail','retail','terrace','gable']);
     if(stage>=3&&j===1&&central)style=europe?'terrace':pick(tag+'office',['apartment','glass','balcony']);
     build(style,x,y,step-.07,1.46,tag,undefined,'shop');
    }
   }
   prop('kiosk',.46,2.06,13,'shop');
  }else if(zone==='O'){
   const core=plan.blocks[form.landmarkDistrict]===cell;
   for(let a=0;a<2;a++)for(let b=0;b<2;b++){
    const x=a?3:1,y=b?3:1,tag='business'+a+b;
    let kind=pick(tag,feature==='garden'?['balcony','glass','setback']:['glass','setback','apartment','twin']);
    if(europe)kind=pick(tag,['terrace','apartment','hall']);
    if(core&&a===0&&b===0)kind=feature==='canal'?'clock':feature==='garden'?'balcony':'fin';
    if((a+b)%2===0)build(kind,x,y,1.56,1.52,tag);
    else{
     build(kind,x-.40,y,.76,1.53,tag);
     build(pick(tag+'side',['hall','glass','apartment']),x+.41,y,.72,1.40,tag+'wing');
    }
   }
   prop('plane',2,1.72,12);prop('kiosk',2,3.37,12,'shop');
  }else if(zone==='C'){
   const academy=plan.blocks.find(b=>b[2]==='C')===cell||cell[5]==='campus'&&variant%3===0||cell[5]==='gardens';
   build(academy?'school':cell[5]==='campus'?pick('faculty',['museum','hall','clock']):pick('civic',['museum','clock','hall']),1.06,1.80,1.64,2.78,'institution',undefined,'read');
   build(academy||cell[5]==='campus'?'clock':'clinic',2.98,2.99,1.53,1.43,'library',undefined,'read');
   prop(academy?'court-yard':'fountain',3,1.22,42,'rest');prop('flowering',2.44,.45,17);
   if(!academy)build('retail',3.19,.55,1.03,.53,'cafe',undefined,'shop');
   prop('linden',2.28,2.08,15);prop('bench',2.6,1.91,11,'rest');
  }else if(zone==='Q'){
   prop('kiosk',.48,.57,16,'shop');prop('bench',.85,3.52,13,'rest');prop('bench',3.50,1.1,13,'rest');
   for(const [x,y] of [[.48,3.55],[3.56,.48]])prop('flowering',x,y,17);
  }else if(zone==='I'){
   if(cell[5]==='works'&&variant%3===0){
    build('shed',1.96,1.12,3.24,1.55,'freight');build('shed',1.05,2.99,1.45,1.31,'dispatch');
    build('retail',3.22,3.14,.88,1.02,'canteen',undefined,'shop');
   }else if(cell[5]==='works'&&variant%3===1){
    build('factory',1.2,1.66,1.72,2.45,'turbine');build('factory',3.02,1.72,1.25,2.63,'press');
    build('shed',2.22,3.47,2.13,.66,'workshop');prop('plane',.45,3.51,13);
   }else{
    build('factory',1.04,1.24,1.62,1.94,'kiln');build('shed',3.00,1.40,1.53,2.06,'depot');
    build('shed',1.23,3.16,1.89,1.08,'storage');build('hall',3.20,3.18,.96,1.10,'office');
   }
  }else if(zone==='T'){
   build('station',1.02,2.00,1.48,3.38,'concourse',undefined,'rest');build('retail',3.05,3.05,1.56,1.43,'shops',undefined,'shop');
   build('glass',3.05,1.02,1.49,1.50,'hotel');prop('kiosk',2.43,2.04,13,'shop');
  }else if(zone==='A'){
   build('fieldhouse',3.28,2.63,.94,1.91,'stands',undefined,'rest');prop('kiosk',3.09,.68,15,'shop');
   for(let j=0;j<5;j++)prop(j===2?'flowering':'linden',.40,.56+j*.72,12);
  }else{
   const signature=plan.blocks.find(b=>b[2]==='P')===cell;
   if(cell.length===4){
    const lot=plan.blocks.indexOf(cell)*4+3,t=point(2.08,2.25),earned=(byLot.get(lot)||[]).filter(g=>g.style===5);
    objects.push({id:earned.length?'fair':'fair-square',t,lot,gift:earned[0],level:earned.length,effects:[],ordinaryWidth:71,w:71,
     label:earned.length?rewardNames[5]:'축제 광장',act:'rest'});
   }
   if(signature)build('wintergarden',3.24,.90,.86,.95,'glasshouse',undefined,'rest');
   else if(cell.length!==4)prop('fountain',3,2.97,25,'rest');
   const border=feature==='garden'?14:9;
   for(let j=0;j<border;j++){
    const x=j%2?.42:3.59,y=.42+Math.floor(j/2)*3.11/Math.ceil(border/2);
    prop(j%5===1?'flowering':j%3?'plane':'linden',x,y,15+randomAt('tree'+j)*9);
   }
   prop('bench',.65,1.42,12,'exercise');prop('flowering',1.22,3.14,22);
  }
 });
 return objects;
}

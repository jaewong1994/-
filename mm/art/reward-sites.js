const response=await fetch('/mm/art/city-rewards.json');
if(!response.ok)throw Error('마이시티 리워드 목록을 열 수 없습니다.');
const rules=await response.json();
export const rewardNames=rules.rewards.map(r=>r[0]);
export const rewardKind=style=>rules.rewards[style]?.[1];
const low=new Set(rules.lowBlocks.map(xy=>xy.join(',')));
export function rewardSites(plan,style,limit=14){
 const kind=rewardKind(style),lots=[];
 if(!kind||kind==='person')return lots;
 plan.blocks.slice(0,limit).forEach(([x,y,zone],i)=>{
  if((kind==='park')!==(zone==='P')||(low.has(x+','+y)&&!['small','park'].includes(kind)))return;
  for(const slot of rules.slots[zone]||[])if(i||slot===0)lots.push(i*4+slot);
 });
 return lots;
}
export function siteName(plan,lot){
 if(lot===-1)return '보관함';
 const index=Math.floor(lot/4),zone=plan.blocks[index][2];
 return (index+1)+'구역 · '+({H:'주택가',S:'상점가',O:'업무지구',T:'역세권',C:'문화거리',P:'공원'})[zone]+([' 서편',' 동편','',' 광장'][lot%4]);
}

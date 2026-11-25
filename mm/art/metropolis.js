// Each footprint is ordered from its connection to the older neighbourhood outwards.
const quarters=[
 {id:'station',name:'중앙역 상권',description:'역 앞 시장길에서 오피스와 주상복합으로 이어져요.',
  rows:[[0,0,'T'],[0,1,'S'],[1,0,'S'],[1,1,'O'],[0,-1,'S'],[1,-1,'H'],[2,0,'O'],[2,1,'H'],[2,-1,'S'],[3,0,'T'],[3,-1,'H'],[3,1,'H'],[1,2,'P'],[2,2,'H']]},
 {id:'campus',name:'대학로 문화지구',description:'공연 광장 양옆에 대학 도서관과 카페, 운동장이 있어요.',
  rows:[[0,0,'Q'],[1,0,'C'],[0,1,'S'],[1,1,'C'],[0,-1,'S'],[1,-1,'P'],[2,0,'A'],[2,1,'H'],[1,2,'C'],[2,2,'H'],[0,2,'H'],[1,-2,'H'],[2,-1,'P'],[2,3,'H']]},
 {id:'gardens',name:'가로수 주택가',description:'낮은 연립주택 사이로 녹지와 학교를 잇는 산책로가 나 있어요.',
  rows:[[0,0,'P'],[0,1,'H'],[1,0,'H'],[1,1,'P'],[1,-1,'H'],[0,-1,'H'],[1,2,'H'],[2,1,'C'],[2,2,'H'],[0,2,'S'],[2,0,'H'],[2,-1,'H'],[2,3,'P'],[1,3,'H']]},
 {id:'works',name:'창고·제조 지구',description:'공방과 완충녹지 너머에 공장, 창고와 물류 도로가 모여 있어요.',
  rows:[[0,0,'S'],[1,0,'P'],[0,1,'H'],[1,1,'C'],[2,0,'I'],[2,1,'I'],[2,-1,'I'],[1,-1,'P'],[3,0,'I'],[3,1,'I'],[3,-1,'I'],[2,2,'T'],[4,0,'I'],[3,2,'S']]}
];
const axes=[[1,0],[0,1],[-1,0],[0,-1]];
const key=(x,y)=>x+','+y;

export function extendCity(plan,established,random,hash){
 const occupied=new Map(established.map(b=>[key(b[0],b[1]),b]));
 const seed=plan.blocks[0][3],turn=Math.floor(random(seed,'borough-axis')*4);
 const total=established.length*2,added=[],districts=[];
 for(const [i,district] of quarters.entries()){
  const n=Math.floor(total/4)+(i<total%4?1:0),parts=district.rows.slice(0,n);
  let best=null;
  for(const parent of occupied.values())for(const [j,[dx,dy]] of axes.entries()){
   const bx=parent[0]+dx,by=parent[1]+dy;
   for(const hand of [-1,1]){
    const cells=parts.map(([a,b,z])=>[bx+a*dx-b*dy*hand,by+a*dy+b*dx*hand,z]);
    if(cells.some(([x,y])=>occupied.has(key(x,y))))continue;
    let contact=0,radius=0;
    for(const [x,y] of cells){
     radius+=x*x+y*y;
     contact+=axes.filter(([ax,ay])=>occupied.has(key(x+ax,y+ay))).length;
    }
    const side=(turn+i)%4,alignment=(j===side?8:(j+2)%4===side?-7:0);
    const score=alignment+Math.min(9,contact)*1.05-radius/n*.19+(parent[5]?-3:1)+random(seed,[i,bx,by,j,hand].join('/'));
    if(!best||score>best.score)best={cells,score,parent};
   }
  }
  const inherited=best.parent[4]??plan.blocks.indexOf(best.parent)+1;
  const parcels=best.cells.map(([x,y,z],j)=>[x,y,z,hash([seed,district.id,x,y].join('/')),Math.max(inherited,Math.min(14,5+Math.floor((j+i*.55)*9/n))),district.id]);
  for(const b of parcels){occupied.set(key(b[0],b[1]),b);added.push(b);}
  const hub=parcels[i===3?4:0];
  districts.push({id:district.id,name:district.name,description:district.description,hub});
 }
 return {added,districts};
}

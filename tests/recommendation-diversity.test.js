const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const e=require('../counseling-engine.js');
const all=JSON.parse(fs.readFileSync(path.join(__dirname,'../index.html'),'utf8').split('\n').find(x=>x.startsWith('const UNI = ')).slice(12,-1));
const r={kor:{std:125,pct:89,gr:2},math:{std:122,pct:89,gr:2},eng:{gr:2},sci1:{std:61,pct:89,gr:2,name:'사회문화'},sci2:{std:61,pct:89,gr:2,name:'생활과윤리'},mathSub:'확률과통계',hist:{gr:2}};
const rows=all.map(u=>({u,...e.scoreUniversity(u,r)})).filter(x=>x.valid);
const shown=new Set();
for(const group of e.balancedRows(rows,rows.length)){
 const ranked=e.rankSchools(group.rows,group.key);
 assert.equal(new Set(ranked.map(x=>x[0])).size,ranked.length,'one university per box');
 assert.equal(ranked.reduce((n,x)=>n+x[1].length,0),group.rows.length,'no majors dropped');
 ranked.slice(0,16).forEach(x=>shown.add(x[0]));
}
for(const n of ['국민대','숭실대','단국대(죽전)'])assert.ok(shown.has(n),n+' accessible in default recommendation fixture');
assert.equal(e.matchesTrack('인문','자연'),false);assert.equal(e.matchesTrack('공통','자연'),true);
const mixed={...r,mathSub:'미적분',sci1:{std:60,pct:80,name:'물리학Ⅰ'},sci2:{std:70,pct:90,name:'사회문화'}};
const unit={n:'가상대',s:'자연',sc:2,gm:'과탐 과목별 5% 가산'};
let b=e.bonusProfile(unit,mixed,true,{국:125,수:122,영:110,탐:130});assert.equal(b.score.탐,133,'only science subject gets bonus, not social');
b=e.bonusProfile(unit,mixed,false,{국:89,수:89,영:89,탐:85});assert.equal(b.score.탐,87,'percentile average adjusted per subject');
b=e.bonusProfile({...unit,sc:1},mixed,true,{국:125,수:122,영:110,탐:70});assert.equal(b.score.탐,70,'best-one inquiry is selected after bonus');
b=e.bonusProfile({...unit,gm:'과탐II 5% 가산'},mixed,true,{국:125,수:122,영:110,탐:130});assert.equal(b.score.탐,130,'science I does not receive science II bonus');
b=e.bonusProfile({n:'국민대',s:'자연',sc:2},mixed,true,{국:125,수:122,영:110,탐:130});assert.ok(Math.abs(b.score.수-128.1)<1e-8);assert.equal(b.score.탐,133);
b=e.bonusProfile({n:'숭실대',s:'자연',d:'수학',sc:2,gm:'수학 7%'},mixed,true,{국:125,수:122,영:110,탐:130});assert.equal(b.status,'review');assert.ok(b.score.수>122);assert.equal(b.score.탐,130,'do not invent inquiry conversion');
assert.deepEqual(e.currentRules(e.currentRules({n:'숭실대',s:'자연',gm:'수학 7%'})),e.currentRules({n:'숭실대',s:'자연',gm:'수학 7%'}),'rules idempotent');
console.log('Diversity/bonus regression OK: real midrange university fixture, complete school grouping, tracks, mixed inquiry, science II, partial conversion hold');

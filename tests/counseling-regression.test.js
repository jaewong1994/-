'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const engine=require('../counseling-engine.js');

assert.equal(engine.fit(8)[1],'안정');
assert.equal(engine.fit(-5)[1],'적정');
assert.equal(engine.fit(-18)[1],'소신');
assert.equal(engine.fit(-19)[1],'상향');

const diffs=[-40,-26,-18,-10,-5,0,8,20,40];
const chances=diffs.map(diff=>engine.admissionChance(diff,{verified:true,useStd:true,quality:'high'}).point);
for(let i=1;i<chances.length;i++)assert.ok(chances[i]>=chances[i-1],'합격률은 점수차가 좋아질수록 감소하면 안 됨');
const exact=engine.admissionChance(-10,{verified:true,useStd:true,quality:'high'});
const estimated=engine.admissionChance(-10,{verified:false,useStd:true,quality:'low'});
assert.ok((exact.high-exact.low)<(estimated.high-estimated.low),'확인 점수의 오차범위가 더 좁아야 함');

const base={mathSub:'미적분',kor:{gr:4,std:108,pct:64},math:{gr:4,std:110,pct:66},eng:{gr:3},sci1:{name:'물리',gr:4,std:56,pct:65},sci2:{name:'화학',gr:4,std:55,pct:63}};
const improved=engine.scenarioRecord(base,{kor:3,math:3,eng:3,sci1:3,sci2:3});
const worsened=engine.scenarioRecord(base,{kor:5,math:5,eng:4,sci1:5,sci2:5});
assert.ok(engine.scenarioSummaryStd(improved,{kor:3,math:3,eng:3,sci1:3,sci2:3})>engine.scenarioSummaryStd(worsened,{kor:5,math:5,eng:4,sci1:5,sci2:5}));
assert.equal(engine.compatible({mr:1},Object.assign({},base,{mathSub:'확률과통계'})),false);

const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const uniLine=html.split(/\r?\n/).find(line=>line.startsWith('const UNI = '));
assert.ok(uniLine,'UNI 데이터가 존재해야 함');
const universities=JSON.parse(uniLine.slice(12,-1));
assert.ok(universities.length>=4000,'정시 데이터가 4,000개 이상이어야 함');
let valid=0;
let monotonic=0;
for(const u of universities){
  const result=engine.scoreUniversity(u,improved);
  const lower=engine.scoreUniversity(u,worsened);
  if(result.compatible&&result.valid){
    assert.ok(Number.isFinite(result.diff));valid++;
    if(lower.compatible&&lower.valid){assert.ok(result.diff>=lower.diff-1e-9,`${u.n} ${u.d}: 성적 향상 시 비교점수가 하락함`);monotonic++;}
  }
}
assert.ok(valid>=3500,'대부분의 대학에 유효한 비교점수가 계산되어야 함');
assert.ok(monotonic>=3500,'대학별 시나리오 단조성 검사가 충분해야 함');

const sample=[-30,-17,-4,8,20].map((diff,i)=>({diff,cut:500-i}));
const groups=engine.balancedRows(sample,1);
assert.deepEqual(groups.map(x=>x.key),['hard','reach','fit','safe']);
assert.ok(groups.every(x=>x.rows.length<=1));

console.log(`counseling regression OK ${engine.version}: ${universities.length} majors, ${valid} scored, ${monotonic} monotonic, chance ${chances.join('→')}`);

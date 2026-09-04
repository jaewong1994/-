'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const engine=require('../counseling-engine.js');

assert.equal(engine.fit(12)[1],'안정');
assert.equal(engine.fit(3)[1],'적정');
assert.equal(engine.fit(-4)[1],'소신');
assert.equal(engine.fit(-11)[1],'상향');

const diffs=[-40,-26,-18,-10,-5,0,8,20,40];
const chances=diffs.map(diff=>engine.admissionChance(diff,{verified:true,useStd:true,quality:'high'}).point);
for(let i=1;i<chances.length;i++)assert.ok(chances[i]>=chances[i-1],'합격률은 점수차가 좋아질수록 감소하면 안 됨');
const exact=engine.admissionChance(-10,{verified:true,useStd:true,quality:'high'});
const estimated=engine.admissionChance(-10,{verified:false,useStd:true,quality:'low'});
assert.ok((exact.high-exact.low)<(estimated.high-estimated.low),'확인 점수의 오차범위가 더 좁아야 함');
assert.ok(engine.admissionChance(-4,{verified:false,useStd:true,quality:'low'}).point<36,'70% 컷 -4점은 기존 36%보다 보수적으로 표시해야 함');

const snu=engine.selectionProfile({n:'서울대',d:'식품영양학과',gm:'과탐 가산'});
assert.equal(snu.finalAvailable,false);
assert.equal(snu.stageLabel,'1단계 수능선');
assert.ok(snu.requirements.some(x=>x.text.includes('교과평가 20%')));
const ku=engine.selectionProfile({n:'고려대',d:'신소재공학부(교과우수자)'});
assert.equal(ku.nonScoreShare,20);
assert.ok(ku.requirements.some(x=>x.text.includes('학생부(교과) 20%')));
assert.equal(engine.selectionProfile({n:'고려대',d:'신소재공학부'}).finalAvailable,true);
assert.equal(engine.selectionProfile({n:'남서울대',d:'간호학과'}).finalAvailable,true,'남서울대를 서울대로 오인하면 안 됨');
assert.equal(engine.selectionProfile({n:'연세대',d:'경제학부'}).nonScoreShare,5);
assert.equal(engine.selectionProfile({n:'연세대',d:'의예'}).requirements.some(x=>x.kind==='interview'),true);
assert.equal(engine.selectionProfile({n:'한양대',d:'기계공학부'}).nonScoreShare,10);
assert.equal(engine.selectionProfile({n:'중앙대',d:'경영학부'}).nonScoreShare,10);
assert.equal(engine.selectionProfile({n:'성균관대',d:'수학교육'}).regularAvailable,false);
assert.equal(engine.scoreUniversity({n:'성균관대',d:'수학교육'},{}).unavailable,true,'2027 성균관대 사범계열은 정시 수능 후보에서 제외해야 함');

const base={mathSub:'미적분',kor:{gr:4,std:108,pct:64},math:{gr:4,std:110,pct:66},eng:{gr:3},sci1:{name:'물리학Ⅰ',gr:4,std:56,pct:65},sci2:{name:'화학Ⅱ',gr:4,std:55,pct:63},hist:{raw:38,gr:3}};
const mathStrong=Object.assign({},base,{kor:{gr:3,std:120,pct:80},math:{gr:1,std:140,pct:98}});
const mathHeavy={kw:20,mw:50,ew:10,sw:20,sc:2};
const korHeavy={kw:50,mw:20,ew:10,sw:20,sc:2};
assert.ok(engine.strategyMatch(mathHeavy,mathStrong).score>engine.strategyMatch(korHeavy,mathStrong).score,'수학 강점 학생은 수학 고반영 대학의 궁합이 더 높아야 함');
const scienceBonus=engine.strategyMatch({kw:25,mw:35,ew:10,sw:30,sc:2,gm:'과탐 2과목 선택 시 3% 가산'},mathStrong);
assert.equal(scienceBonus.bonusEligible,true,'과탐 2과목 가산조건을 탐지해야 함');
const improved=engine.scenarioRecord(base,{kor:3,math:3,eng:3,sci1:3,sci2:3});
const worsened=engine.scenarioRecord(base,{kor:5,math:5,eng:4,sci1:5,sci2:5});
assert.ok(engine.scenarioSummaryStd(improved,{kor:3,math:3,eng:3,sci1:3,sci2:3})>engine.scenarioSummaryStd(worsened,{kor:5,math:5,eng:4,sci1:5,sci2:5}));
assert.equal(engine.compatible({mr:1},Object.assign({},base,{mathSub:'확률과통계'})),false);
assert.equal(engine.eligibilityProfile({mr:1},Object.assign({},base,{mathSub:'확률과통계'})).status,'ineligible','필수 미적분/기하 미응시는 지원불가여야 함');
assert.equal(engine.eligibilityProfile({sr:1,sc:2},base).status,'eligible','과탐 2과목 입력은 자연계 필수응시를 충족해야 함');
assert.equal(engine.eligibilityProfile({sr:2,sc:2},base).status,'ineligible','과탐 응시자는 사탐 필수 모집단위에서 제외해야 함');
assert.equal(engine.eligibilityProfile({d:'의예과'},Object.assign({},base,{mathSub:'확률과통계'})).status,'ineligible','확률과통계 응시자에게 의예과를 추천하면 안 됨');
assert.equal(engine.eligibilityProfile({d:'의공학과'},Object.assign({},base,{mathSub:'확률과통계'})).status,'eligible','의공학과를 의약학계열로 오인하면 안 됨');
assert.equal(engine.eligibilityProfile({sc:2},Object.assign({},base,{sci2:{}})).status,'review','탐구 2과목 반영 대학은 두 번째 선택과목 누락을 경고해야 함');
const mathBonus=engine.bonusProfile({gm:'수학(미적분/기하) 10% 가산',sc:2},base,true,{국:108,수:110,영:115,탐:111});
assert.equal(mathBonus.status,'applied');
assert.equal(Math.round(mathBonus.adjustment),11,'미적분 가산은 학생 수학점수에 실제 반영돼야 함');
const inquiryBonus=engine.bonusProfile({gm:'과탐 I+II 또는 II+II선택 시 2과목 모두 5% 가산',sc:2},base,true,{국:108,수:110,영:115,탐:111});
assert.equal(inquiryBonus.status,'applied','과탐 I+II 조건을 저장된 탐구명으로 판정해야 함');
assert.equal(engine.bonusProfile({gm:'과탐 I+II 또는 II+II선택 시 2과목 모두 5% 가산',sc:2},Object.assign({},base,{sci2:{name:'화학Ⅰ'}}),true,{국:108,수:110,영:115,탐:111}).status,'not-applicable','과탐 II 미응시는 I+II 가산에서 제외해야 함');
assert.equal(engine.bonusProfile({gm:'과탐 10% 가산(단, 상위1과목만 가산)',sc:2},base,true,{국:108,수:110,영:115,탐:111}).status,'review','상위 과목 복합 산식은 임의 계산하면 안 됨');
const noBonusScore=engine.scoreUniversity({n:'테스트대',d:'공학',ind:'표준',fx:'국수탐',std:300,sc:2,hk:'응시'},base);
const withBonusScore=engine.scoreUniversity({n:'테스트대',d:'공학',ind:'표준',fx:'국수탐',std:300,sc:2,hk:'응시',gm:'수학(미적분/기하) 10% 가산'},base);
assert.ok(withBonusScore.score>noBonusScore.score&&withBonusScore.bonusPoints>0,'선택과목 가산은 대학 비교점수를 높여야 함');
assert.equal(engine.scoreUniversity({n:'한글역사대',d:'일반',ind:'표준',fx:'국수영탐한',stdE:300,sc:2,hk:'합산'},base).count,3,'한국사는 구조화된 환산표 없이 0점 영역으로 평균에 넣으면 안 됨');

const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const uniLine=html.split(/\r?\n/).find(line=>line.startsWith('const UNI = '));
assert.ok(uniLine,'UNI 데이터가 존재해야 함');
const universities=JSON.parse(uniLine.slice(12,-1));
assert.ok(universities.length>=4000,'정시 데이터가 4,000개 이상이어야 함');
let valid=0;
let monotonic=0;
let strategic=0;
let bonusAutomatic=0;
for(const u of universities){
  const result=engine.scoreUniversity(u,improved);
  const lower=engine.scoreUniversity(u,worsened);
  if(result.compatible&&result.valid){
    assert.ok(Number.isFinite(result.diff));valid++;
    assert.ok(Number.isFinite(result.strategicRank));
    assert.ok(Number.isFinite(result.match.score));strategic++;
    if(result.bonus&&(result.bonus.status==='applied'||result.bonus.status==='not-applicable'))bonusAutomatic++;
    if(lower.compatible&&lower.valid){assert.ok(result.diff>=lower.diff-1e-9,`${u.n} ${u.d}: 성적 향상 시 비교점수가 하락함`);monotonic++;}
  }
}
assert.ok(valid>=3500,'대부분의 대학에 유효한 비교점수가 계산되어야 함');
assert.ok(monotonic>=3500,'대학별 시나리오 단조성 검사가 충분해야 함');
assert.equal(strategic,valid,'모든 산출 대학에 전략 궁합 점수가 있어야 함');
assert.ok(bonusAutomatic>=1300,'대학 가산 문구의 다수를 선택과목 데이터로 자동 판정해야 함');

const sample=[-30,-11,-4,3,12,20].map((diff,i)=>({diff,cut:500-i}));
const groups=engine.balancedRows(sample,1);
assert.deepEqual(groups.map(x=>x.key),['fit','safe','reach','hard'],'상담 결과는 적정 구간을 가장 먼저 보여줘야 함');
assert.ok(groups.every(x=>x.rows.length<=1));

const ranked=engine.balancedRows([{diff:4,strategicRank:100},{diff:4,strategicRank:120}],2).find(x=>x.key==='fit').rows;
assert.equal(ranked[0].strategicRank,120,'같은 판정 구간에서는 전략순위가 높은 대학이 먼저여야 함');
assert.ok(engine.selectivityScore({pct:299,fx:'국수영탐',sc:2})>engine.selectivityScore({pct:189,fx:'수영탐',sc:2}),'서로 다른 반영영역 수를 정규화해도 최상위 대학선이 역전되면 안 됨');

assert.deepEqual(engine.parseEarlyMinimum({min:'국수탐(1) 중 2개 합 4',note:'서류 100%'}),{kind:'sum',count:2,limit:4,text:'국수탐(1) 중 2개 합 4 서류 100%'});
assert.equal(engine.parseEarlyMinimum({min:'서류 70% + 면접 30%',note:'없음'}).kind,'none','수능최저가 없는 면접 전형은 별도 분류해야 함');
assert.equal(engine.parseEarlyMinimum({min:'없음/단, 체교(2개 합6), 디자인(3합7)',note:''}).kind,'review','학과별 예외를 하나의 최저로 단정하면 안 됨');
assert.equal(engine.parseEarlyMinimum({min:'2개 합7/야간 합8',note:''}).kind,'review','주야간별 조건을 하나의 최저로 단정하면 안 됨');
const earlyScenario={kor:1,math:2,eng:3,sci1:2,sci2:4};
const hardMin=engine.earlyAssessment({min:'3개 합5'},earlyScenario,1.8);
const easyMin=engine.earlyAssessment({min:'2개 합5'},earlyScenario,1.8);
assert.equal(hardMin.status,'met');
assert.ok(hardMin.difficulty>easyMin.difficulty,'충족 가능한 최저 중 더 까다로운 조합의 난도가 높아야 함');
const earlyRanked=engine.rankEarlyAdmissions([
  {u:'상위대',adm:'교과',cat:'인문',min:'2개 합4',note:'',lo:1.8},
  {u:'중위대',adm:'교과',cat:'인문',min:'3개 합5',note:'',lo:2.1},
  {u:'면접대',adm:'종합',cat:'인문',min:'서류 70% + 면접 30%',note:'없음',lo:2.0},
  {u:'확인대',adm:'교과',cat:'인문',min:'없음/단, 특정학과 2개 합6',note:'',lo:2.4}
],earlyScenario,{상위대:1.5,중위대:2.2,면접대:2,확인대:3});
assert.equal(earlyRanked.met[0].e.u,'중위대','난도·대학·충족여유 가중치가 더 효율적인 충족 전형을 우선해야 함');
assert.equal(earlyRanked.none[0].e.u,'면접대','수능최저 없는 전형은 별도 목록이어야 함');
assert.equal(earlyRanked.other[0].e.u,'확인대','복합 조건은 요강 확인 목록이어야 함');

const counselingSource=fs.readFileSync(path.join(__dirname,'..','counseling.js'),'utf8');
assert.match(counselingSource,/baseExam/,'6월·9월 추천 기준 시험 상태가 있어야 함');
assert.match(counselingSource,/응시 선택과목/,'상담 카드에 학생의 응시 선택과목을 표시해야 함');
assert.match(counselingSource,/readScoresLocal\(_wuser\.id\)/,'로컬 성적은 로그인 계정별 저장소에서 읽어야 함');
assert.match(html,/epsilon_scores:\$\{userId\}/,'로컬 성적 키는 계정 ID로 분리돼야 함');

console.log(`counseling regression OK ${engine.version}: ${universities.length} majors, ${valid} scored, ${monotonic} monotonic, ${strategic} strategic, chance ${chances.join('→')}`);

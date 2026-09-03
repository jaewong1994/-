(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.CounselingEngine=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';

  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  const pctAnchor={1:96,2:89,3:77,4:64,5:48,6:32,7:19,8:9,9:3};
  const stdStep={kor:7,math:8,sci1:5,sci2:5};
  const socialRx=/생활과윤리|윤리와사상|한국지리|세계지리|동아시아사|세계사|경제|정치와법|사회문화/;
  const scienceRx=/물리|화학|생명과학|지구과학/;

  // The reference is a historical 70% enrolled-student cut, not a pass line.
  function fit(diff){if(diff>=12)return ['safe','안정'];if(diff>=3)return ['fit','적정'];if(diff>=-10)return ['reach','소신'];return ['hard','상향'];}
  function scenarioChanged(r,s){return ['kor','math','eng','sci1','sci2'].some(k=>Number(r?.[k]?.gr||9)!==Number(s?.[k]||9));}
  function shiftedSubject(base,key,targetGrade){
    const src=base||{},current=Number(src.gr)||9,target=clamp(Number(targetGrade)||9,1,9);
    const fallbackMax=key==='sci1'||key==='sci2'?70:132;
    const stdBase=Number(src.std)||Math.max(20,fallbackMax-(current-1)*(stdStep[key]||6));
    const pctBase=Number(src.pct)||pctAnchor[current];
    return Object.assign({},src,{gr:target,std:Math.max(0,Math.round(stdBase+(current-target)*(stdStep[key]||6))),pct:clamp(Math.round(pctBase+pctAnchor[target]-pctAnchor[current]),1,100)});
  }
  function scenarioRecord(r,s){
    const out=Object.assign({},r);
    ['kor','math','sci1','sci2'].forEach(k=>{out[k]=shiftedSubject(r?.[k],k,s?.[k]);});
    out.eng=Object.assign({},r?.eng||{},{gr:clamp(Number(s?.eng)||9,1,9)});
    return out;
  }
  function scenarioSummaryStd(r,s){const x=scenarioRecord(r,s);return ['kor','math','sci1','sci2'].reduce((sum,k)=>sum+(Number(x[k]?.std)||0),0);}
  function scenarioSummaryPct(r,s){const x=scenarioRecord(r,s);return (x.kor?.pct||0)+(x.math?.pct||0)+Math.round(((x.sci1?.pct||0)+(x.sci2?.pct||0))/2);}
  function engApprox(grade,useStd){const g=clamp(Number(grade)||9,1,9);return useStd?Math.max(55,133-(g-1)*9):pctAnchor[g];}
  function subjectScores(u,r,useStd){
    const s1=useStd?(r.sci1?.std||0):(r.sci1?.pct||0),s2=useStd?(r.sci2?.std||0):(r.sci2?.pct||0);
    return {국:useStd?(r.kor?.std||0):(r.kor?.pct||0),수:useStd?(r.math?.std||0):(r.math?.pct||0),영:engApprox(r.eng?.gr,useStd),탐:Number(u.sc)>=2?(useStd?s1+s2:Math.round((s1+s2)/2)):s1};
  }
  function areaScore(u,r,useStd,engMode){
    const score=subjectScores(u,r,useStd),value=c=>score[c]||0;let total=0;
    for(const c of u.fx||''){if(c!=='영'||engMode==='inc')total+=value(c);}
    for(const group of u.ch||[]){const pool=[...String(group[0]||'')].filter(c=>c!=='영'||engMode==='inc').map(value).sort((a,b)=>b-a);for(let i=0;i<Number(group[1]||0)&&i<pool.length;i++)total+=pool[i];}
    return total;
  }
  function areaCount(u,engMode){
    let count=[...String(u.fx||'')].filter(c=>c!=='영'||engMode==='inc').length;
    for(const group of u.ch||[]){const pool=[...String(group[0]||'')].filter(c=>c!=='영'||engMode==='inc').length;count+=Math.min(Number(group[1]||0),pool);}
    return Math.max(1,count);
  }
  function compatible(u,r){
    if(u.mr&&r.mathSub==='확률과통계')return false;
    const names=`${r.sci1?.name||''} ${r.sci2?.name||''}`;
    if(Number(u.sr)===1&&socialRx.test(names))return false;
    if(Number(u.sr)===2&&scienceRx.test(names))return false;
    return true;
  }
  function strategyMatch(u,r){
    const scores={
      국:Number(r?.kor?.pct)||pctAnchor[Number(r?.kor?.gr)||9],
      수:Number(r?.math?.pct)||pctAnchor[Number(r?.math?.gr)||9],
      영:pctAnchor[Number(r?.eng?.gr)||9],
      탐:Number(u?.sc)>=2?((Number(r?.sci1?.pct)||pctAnchor[Number(r?.sci1?.gr)||9])+(Number(r?.sci2?.pct)||pctAnchor[Number(r?.sci2?.gr)||9]))/2:Math.max(Number(r?.sci1?.pct)||pctAnchor[Number(r?.sci1?.gr)||9],Number(r?.sci2?.pct)||pctAnchor[Number(r?.sci2?.gr)||9])
    };
    const weights={국:Number(u?.kw)||0,수:Number(u?.mw)||0,영:Number(u?.ew)||0,탐:Number(u?.sw)||0};
    const active=Object.keys(scores).filter(k=>weights[k]>0),weightSum=active.reduce((s,k)=>s+weights[k],0);
    const equal=active.length?active.reduce((s,k)=>s+scores[k],0)/active.length:0;
    const weighted=weightSum?active.reduce((s,k)=>s+scores[k]*weights[k],0)/weightSum:equal;
    const scienceCount=[r?.sci1?.name,r?.sci2?.name].filter(x=>scienceRx.test(String(x||''))).length;
    const socialCount=[r?.sci1?.name,r?.sci2?.name].filter(x=>socialRx.test(String(x||''))).length;
    const gm=String(u?.gm||'');
    const bonusEligible=(/과탐/.test(gm)&&scienceCount>=(/2과목/.test(gm)?2:1))||(/사탐/.test(gm)&&socialCount>=(/2과목/.test(gm)?2:1));
    const delta=clamp(weighted-equal,-15,15),strongest=active.slice().sort((a,b)=>scores[b]-scores[a])[0]||'';
    const label=Math.abs(delta)<1?'균형형':delta>0?`${strongest} 강점 활용`:'반영비율 불리';
    return {score:Math.round(delta*10)/10,bonusEligible,label};
  }
  function selectivityScore(u){
    const count=areaCount(u,'exc'),pctRef=Number(u?.pctE||u?.pct||u?.pctI||0),stdRef=Number(u?.stdE||u?.std||u?.stdI||0);
    // Percentile sums are comparable across differently sized subject sets; raw standard-score sums are not.
    return pctRef?pctRef*3/count:stdRef*.72*3/count;
  }
  function scoreUniversity(u,r){
    if(!compatible(u,r))return {compatible:false};
    const useStd=u.ind==='표준'||u.ind==='표+백',stdKey=useStd?'std':'pct',stdI=useStd?'stdI':'pctI',stdE=useStd?'stdE':'pctE';
    const options=[];
    const excRef=Number(u[stdE]||u[stdKey]||0),excScore=areaScore(u,r,useStd,'exc');
    if(excRef)options.push({mode:'영어 제외',score:excScore,ref:excRef,count:areaCount(u,'exc')});
    if(u.et==='o'&&Number(u[stdI])&&Number(u[stdE])){
      const incRef=Number(u[stdI]),incRaw=areaScore(u,r,useStd,'inc'),incScore=Math.round(incRaw*(incRef/Number(u[stdE])));
      options.push({mode:'영어 포함',score:incScore,ref:incRef,count:areaCount(u,'inc')});
    }
    if(!options.length)return {compatible:true,valid:false,useStd};
    options.forEach(x=>{x.rawDiff=x.score-x.ref;x.diff=x.rawDiff*3/x.count;});
    const best=options.sort((a,b)=>b.diff-a.diff)[0];
    const quality=(u.ind==='등급점수화'||!u.sk)?'low':(u.et==='o'?'medium':'high');
    const match=strategyMatch(u,r),selectivity=selectivityScore(u);
    // Within each fit band, selectivity dominates; score fit and subject affinity only break near-ties.
    const rawSelectivity=Number(u?.stdE||u?.std||u?.stdI||0);
    return Object.assign({compatible:true,valid:true,useStd,quality,match,selectivity,strategicRank:selectivity+rawSelectivity/10000+best.diff/1000000+match.score/10000000+(match.bonusEligible?0.00001:0)},best);
  }
  function selectionProfile(u){
    const university=String(u?.n||''),dept=String(u?.d||''),requirements=[];
    let finalAvailable=true,nonScoreShare=0,stageLabel='최종',sourceUrl='',sourceLabel='';
    const add=(kind,text)=>{if(text&&!requirements.some(x=>x.text===text))requirements.push({kind,text});};
    if(university==='서울대'){
      sourceUrl='https://admission.snu.ac.kr/materials/guide_movie/admission_guide';sourceLabel='서울대 2027 전형안내';
      if(/지역균형/.test(dept)){
        nonScoreShare=40;finalAvailable=false;stageLabel='수능 성적 부분';
        add('record','수능 60% + 교과평가 40% · 교과평가 입력 전 최종 판정 보류');
      }else{
        nonScoreShare=20;finalAvailable=false;stageLabel='1단계 수능선';
        add('stage','1단계 수능 100%로 2배수 선발');
        add('record','2단계: 1단계 성적 80% + 교과평가 20% · 최종 판정 보류');
      }
      if(/교육과|교육학과|사범대/.test(dept))add('interview','교직적성·인성면접: 가산점 및 결격 판단');
      if(/수의|의예|의과|치의/.test(dept))add('interview','적성·인성면접: 결격 여부 판단');
    }else if(university==='고려대'){
      sourceUrl='https://www.adiga.kr/ucp/uvt/uni/univDetailSelection.do?menuId=PCUVTINF2000&searchSyr=2027&unvCd=0000069';sourceLabel='대입정보포털 2027 고려대';
      if(/교과우수/.test(dept)){
        nonScoreShare=20;finalAvailable=false;stageLabel='수능 성적 부분';
        add('record','수능 80% + 학생부(교과) 20% · 학생부 입력 전 최종 판정 보류');
      }
      if(/의예|의과|의학/.test(dept)){finalAvailable=false;add('interview','적성·인성면접 시행');}
      if(/체육교육|디자인조형/.test(dept)){
        nonScoreShare=Math.max(nonScoreShare,30);finalAvailable=false;stageLabel='수능 성적 부분';
        add('practical','수능 70% + 실기 30% · 실기 입력 전 최종 판정 보류');
      }
      if(/사이버국방/.test(dept)){
        nonScoreShare=Math.max(nonScoreShare,20);finalAvailable=false;stageLabel='수능 성적 부분';
        add('practical','수능 80% + 실기 20% · 추가 전형요소 확인 필요');
      }
    }else if(university==='연세대'){
      sourceUrl='https://www.adiga.kr/ucp/uvt/uni/univDetailSelection.do?menuId=PCUVTINF2000&searchSyr=2027&unvCd=0000149';sourceLabel='대입정보포털 2027 연세대';
      nonScoreShare=5;finalAvailable=false;stageLabel='수능 성적 부분';
      add('record','수능 95% + 학생부 5%(교과·출결) · 학생부 입력 전 최종 판정 보류');
      if(/의예|국제|언더우드/.test(dept))add('interview','단계별 면접평가 반영 · 모집단위별 선발배수 확인');
    }else if(university==='한양대'){
      sourceUrl='https://www.adiga.kr/ucp/uvt/uni/univDetailSelection.do?menuId=PCUVTINF2000&searchSyr=2027&unvCd=0000203';sourceLabel='대입정보포털 2027 한양대';
      nonScoreShare=10;finalAvailable=false;stageLabel='수능 성적 부분';
      add('record','수능 90% + 학생부종합평가 10% · 학생부 입력 전 최종 판정 보류');
      if(/연출|스탭|연기/.test(dept))add('practical','수능 55% + 실기 45%');
      if(/스포츠사이언스/.test(dept))add('practical','수능 70% + 실기 30%');
    }else if(university==='중앙대'){
      sourceUrl='https://www.adiga.kr/ucp/uvt/uni/univDetailSelection.do?menuId=PCUVTINF2000&searchSyr=2027&unvCd=0000175';sourceLabel='대입정보포털 2027 중앙대';
      nonScoreShare=10;finalAvailable=false;stageLabel='수능 성적 부분';
      add('record','수능 90% + 비교과(출결) 10% · 출결 입력 전 최종 판정 보류');
      if(/체육교육/.test(dept))add('record','체육교육과: 수능 80% + 서류 20%');
    }
    const note=String(u?.tk||'');
    if(/면접/.test(note)){finalAvailable=false;add('interview','면접 전형요소 있음 · 세부 배점과 결격 기준 확인');}
    if(/실기/.test(note)){finalAvailable=false;add('practical','실기 전형요소 있음 · 종목과 배점 확인');}
    if(/학교생활기록부|학생부종합평가|비교과\(출결\)/.test(note)&&/반영|평가|감점/.test(note)){
      finalAvailable=false;nonScoreShare=Math.max(nonScoreShare,5);stageLabel=stageLabel==='최종'?'수능 성적 부분':stageLabel;
      add('record','학생부·출결 반영 있음 · 입력 전 최종 판정 보류');
    }
    if(u?.gm)add('bonus',`가산·감점: ${u.gm}`);
    if(note)add('notice',note);
    return {finalAvailable,nonScoreShare,stageLabel,requirements,sourceUrl,sourceLabel};
  }
  function admissionChance(diff,{verified=false,useStd=true,quality='medium',finalAvailable=true,nonScoreShare=0}={}){
    const scale=useStd?7:5.5,point=Math.round(clamp(100/(1+Math.exp(-(diff-3)/scale)),2,93));
    let spread=verified?10:16;if(quality==='medium')spread+=2;if(quality==='low')spread+=5;
    if(!finalAvailable)spread+=Math.max(5,Math.round(nonScoreShare/5));
    spread=Math.min(spread,24);
    return {point,low:Math.max(1,point-spread),high:Math.min(98,point+spread),confidence:spread<=11?'높음':spread<=18?'보통':'낮음'};
  }
  function balancedRows(rows,perGroup=8){
    const groups={hard:[],reach:[],fit:[],safe:[]};rows.forEach(x=>groups[fit(x.diff)[0]].push(x));
    Object.values(groups).forEach(group=>group.sort((a,b)=>(Number(b.strategicRank)||0)-(Number(a.strategicRank)||0)||(b.diff-a.diff)));
    return ['hard','reach','fit','safe'].map(key=>({key,rows:groups[key].slice(0,perGroup),total:groups[key].length}));
  }
  return {version:'2026.09-v4',fit,scenarioChanged,scenarioRecord,scenarioSummaryStd,scenarioSummaryPct,compatible,strategyMatch,selectivityScore,scoreUniversity,selectionProfile,admissionChance,balancedRows};
});

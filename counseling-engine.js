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

  function fit(diff){if(diff>=8)return ['safe','안정'];if(diff>=-5)return ['fit','적정'];if(diff>=-18)return ['reach','소신'];return ['hard','상향'];}
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
    return Object.assign({compatible:true,valid:true,useStd,quality},best);
  }
  function admissionChance(diff,{verified=false,useStd=true,quality='medium'}={}){
    const scale=useStd?7:5.5,point=Math.round(clamp(100/(1+Math.exp(-diff/scale)),2,95));
    let spread=verified?10:16;if(quality==='medium')spread+=2;if(quality==='low')spread+=5;
    spread=Math.min(spread,24);
    return {point,low:Math.max(1,point-spread),high:Math.min(98,point+spread),confidence:spread<=11?'높음':spread<=18?'보통':'낮음'};
  }
  function balancedRows(rows,perGroup=8){
    const groups={hard:[],reach:[],fit:[],safe:[]};rows.forEach(x=>groups[fit(x.diff)[0]].push(x));
    return ['hard','reach','fit','safe'].map(key=>({key,rows:groups[key].slice(0,perGroup),total:groups[key].length}));
  }
  return {version:'2026.09-v2',fit,scenarioChanged,scenarioRecord,scenarioSummaryStd,scenarioSummaryPct,compatible,scoreUniversity,admissionChance,balancedRows};
});

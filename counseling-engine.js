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
  function areaScore(u,r,useStd,engMode,provided){
    const score=provided||subjectScores(u,r,useStd),value=c=>score[c]||0;let total=0;
    for(const c of u.fx||''){if(c!=='한'&&(c!=='영'||engMode==='inc'))total+=value(c);}
    for(const group of u.ch||[]){const pool=[...String(group[0]||'')].filter(c=>c!=='한'&&(c!=='영'||engMode==='inc')).map(value).sort((a,b)=>b-a);for(let i=0;i<Number(group[1]||0)&&i<pool.length;i++)total+=pool[i];}
    return total;
  }
  function areaCount(u,engMode){
    let count=[...String(u.fx||'')].filter(c=>c!=='한'&&(c!=='영'||engMode==='inc')).length;
    for(const group of u.ch||[]){const pool=[...String(group[0]||'')].filter(c=>c!=='한'&&(c!=='영'||engMode==='inc')).length;count+=Math.min(Number(group[1]||0),pool);}
    return Math.max(1,count);
  }
  function eligibilityProfile(u,r){
    const blocked=[],review=[],requirements=[],mathSub=String(r?.mathSub||'');
    const inquiry=[r?.sci1,r?.sci2],names=inquiry.map(x=>String(x?.name||''));
    const scienceCount=names.filter(x=>scienceRx.test(x)).length,socialCount=names.filter(x=>socialRx.test(x)).length;
    if(Number(u?.mr)){
      requirements.push('수학 미적분 또는 기하 필수');
      if(!mathSub)review.push('수학 선택과목 입력 필요');
      else if(mathSub==='확률과통계')blocked.push('필수 수학(미적분/기하) 미응시');
    }
    if(Number(u?.sc)>=2){
      requirements.push('탐구 2과목 반영');
      if(names.filter(Boolean).length<2)review.push('탐구 선택과목 2개 입력 필요');
    }
    if(Number(u?.sr)===1){
      requirements.push('과학탐구 응시 필수');
      if(names.filter(Boolean).length<Math.min(2,Number(u?.sc)||1))review.push('과학탐구 선택과목 입력 필요');
      else if(socialCount>0||scienceCount<Math.min(2,Number(u?.sc)||1))blocked.push('필수 과학탐구 과목 미응시');
    }
    if(Number(u?.sr)===2){
      requirements.push('사회탐구 응시 필수');
      if(names.filter(Boolean).length<Math.min(2,Number(u?.sc)||1))review.push('사회탐구 선택과목 입력 필요');
      else if(scienceCount>0||socialCount<Math.min(2,Number(u?.sc)||1))blocked.push('필수 사회탐구 과목 미응시');
    }
    const required=[...String(u?.fx||''),...(u?.ch||[]).flatMap(g=>[...String(g?.[0]||'')])];
    const missing={국:!Number(r?.kor?.std||r?.kor?.pct||r?.kor?.gr),수:!Number(r?.math?.std||r?.math?.pct||r?.math?.gr),영:!Number(r?.eng?.gr),탐:!Number(r?.sci1?.std||r?.sci1?.pct||r?.sci1?.gr)};
    Object.keys(missing).forEach(k=>{if(required.includes(k)&&missing[k])review.push(`${k} 영역 성적 입력 필요`);});
    if(String(u?.hk||'')&&!Number(r?.hist?.gr))review.push('한국사 응시·등급 입력 필요');
    if(String(u?.hk||'').includes('응시'))requirements.push('한국사 필수 응시');
    if(String(u?.hk||'').match(/가산|합산/))requirements.push(`한국사 ${u.hk} 환산표 적용 확인 필요`);
    const status=blocked.length?'ineligible':review.length?'review':'eligible';
    return {status,blocked:[...new Set(blocked)],review:[...new Set(review)],requirements:[...new Set(requirements)],scienceCount,socialCount};
  }
  function compatible(u,r){return eligibilityProfile(u,r).status!=='ineligible';}
  function bonusProfile(u,r,useStd,base){
    const text=String(u?.gm||'').trim(),score=Object.assign({},base),applied=[],student=[];
    if(!text)return {status:'none',text,score,applied,student,adjustment:0};
    const names=[String(r?.sci1?.name||''),String(r?.sci2?.name||'')],scienceCount=names.filter(x=>scienceRx.test(x)).length,socialCount=names.filter(x=>socialRx.test(x)).length;
    const mathSub=String(r?.mathSub||''),hasScienceII=names.some(x=>scienceRx.test(x)&&/(?:Ⅱ|II|2)\s*$/.test(x));
    const complex=/총점|상위\s*1|낮은|우수|별도\s*산식|생활과윤리|윤리와사상|물리학?\s*[ⅠI]|화학\s*[ⅠI]|생명과학\s*[ⅠI]|지구과학\s*[ⅠI]|서로\s*다른|과탐\s*[ⅠI]\s*\d/.test(text);
    if(complex)return {status:'review',text,score,applied,student,adjustment:0,reason:'대학별 세부 환산식 확인 필요'};
    const before=Object.assign({},score);
    const math=text.match(/수학(?:\((미적분\/기하|미적분|기하|확률과통계)\))?(?:(?!수학)[^,%])*?(\d+(?:\.\d+)?)%\s*(가산|감산)/);
    if(math){
      const selector=math[1]||'',rate=Number(math[2])*(math[3]==='감산'?-1:1);
      const selected=!selector||(selector==='미적분/기하'?/미적분|기하/.test(mathSub):mathSub===selector);
      const condition=!/수학≥국어/.test(text)||(Number(r?.math?.pct||r?.math?.std||0)>=Number(r?.kor?.pct||r?.kor?.std||0));
      if(selected&&condition){score.수+=score.수*rate/100;applied.push(`${mathSub||'수학'} ${rate>=0?'+':''}${rate}%`);student.push(mathSub||'수학');}
    }
    const inquiry=text.match(/(과탐|사탐)(?:\s*2과목\s*선택\s*시)?[^,%]*?(\d+(?:\.\d+)?)%\s*(가산|감산)/);
    if(inquiry){
      const type=inquiry[1],count=type==='과탐'?scienceCount:socialCount,needsTwo=/2과목|I\+II|Ⅱ\+Ⅱ|II\+II/.test(text),levelOk=!/I\+II|Ⅰ\+Ⅱ|II\+II|Ⅱ\+Ⅱ/.test(text)||hasScienceII;
      if(count>=(needsTwo?2:1)&&levelOk){const rate=Number(inquiry[2])*(inquiry[3]==='감산'?-1:1);score.탐+=score.탐*rate/100;applied.push(`${type} ${rate>=0?'+':''}${rate}%`);student.push(...names.filter(x=>type==='과탐'?scienceRx.test(x):socialRx.test(x)));}
    }
    const perSubject=text.match(/(과탐|사탐)\s*1과목당\s*(\d+(?:\.\d+)?)점\s*(가산|감산)?/);
    if(perSubject){const type=perSubject[1],count=type==='과탐'?scienceCount:socialCount,points=Number(perSubject[2])*(perSubject[3]==='감산'?-1:1);if(count){score.탐+=points*(Number(u?.sc)>=2&&useStd?count:1);applied.push(`${type} ${count}과목 · ${points>=0?'+':''}${points}점씩`);student.push(...names.filter(x=>type==='과탐'?scienceRx.test(x):socialRx.test(x)));}}
    const adjustment=(score.수-before.수)+(score.탐-before.탐),recognized=!!(math||inquiry||perSubject);
    return {status:recognized?(applied.length?'applied':'not-applicable'):'review',text,score,applied:[...new Set(applied)],student:[...new Set(student)],adjustment,reason:recognized?'선택과목 조건 불충족':'자동 해석할 수 없는 가산식'};
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
    const selection=selectionProfile(u);
    if(!selection.regularAvailable)return {compatible:false,unavailable:true,reason:selection.unavailableReason};
    const eligibility=eligibilityProfile(u,r);
    if(eligibility.status==='ineligible')return {compatible:false,ineligible:true,eligibility,reason:eligibility.blocked.join(' · ')};
    const useStd=u.ind==='표준'||u.ind==='표+백',stdKey=useStd?'std':'pct',stdI=useStd?'stdI':'pctI',stdE=useStd?'stdE':'pctE';
    const baseSubjects=subjectScores(u,r,useStd),bonus=bonusProfile(u,r,useStd,baseSubjects);
    const options=[];
    const excRef=Number(u[stdE]||u[stdKey]||0),excBase=areaScore(u,r,useStd,'exc',baseSubjects),excScore=areaScore(u,r,useStd,'exc',bonus.score);
    if(excRef)options.push({mode:'영어 제외',score:excScore,baseScore:excBase,ref:excRef,count:areaCount(u,'exc')});
    if(u.et==='o'&&Number(u[stdI])&&Number(u[stdE])){
      const incRef=Number(u[stdI]),ratio=incRef/Number(u[stdE]),incRaw=areaScore(u,r,useStd,'inc',bonus.score),incBase=areaScore(u,r,useStd,'inc',baseSubjects),incScore=Math.round(incRaw*ratio);
      options.push({mode:'영어 포함',score:incScore,baseScore:Math.round(incBase*ratio),ref:incRef,count:areaCount(u,'inc')});
    }
    if(!options.length)return {compatible:true,valid:false,useStd,eligibility,bonus};
    options.forEach(x=>{x.rawDiff=x.score-x.ref;x.diff=x.rawDiff*3/x.count;x.bonusPoints=x.score-x.baseScore;});
    const best=options.sort((a,b)=>b.diff-a.diff)[0];
    const quality=(u.ind==='등급점수화'||!u.sk||bonus.status==='review')?'low':(u.et==='o'?'medium':'high');
    const match=strategyMatch(u,r),selectivity=selectivityScore(u);
    // Within each fit band, selectivity dominates; score fit and subject affinity only break near-ties.
    const rawSelectivity=Number(u?.stdE||u?.std||u?.stdI||0);
    return Object.assign({compatible:true,valid:true,useStd,quality,match,selectivity,eligibility,bonus,strategicRank:selectivity+rawSelectivity/10000+best.diff/1000000+match.score/10000000+(bonus.status==='applied'?0.00001:0)},best);
  }
  function selectionProfile(u){
    const university=String(u?.n||''),dept=String(u?.d||''),requirements=[];
    let finalAvailable=true,regularAvailable=true,unavailableReason='',nonScoreShare=0,stageLabel='최종',sourceUrl='',sourceLabel='';
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
    }else if(university==='성균관대'&&/한문교육|컴퓨터교육|수학교육|^교육$/.test(dept)){
      sourceUrl='https://www.adiga.kr/ucp/uvt/uni/univDetailSelection.do?menuId=PCUVTINF2000&searchSyr=2027&unvCd=0000133';sourceLabel='대입정보포털 2027 성균관대';
      regularAvailable=false;finalAvailable=false;unavailableReason='2027학년도 사범계열은 학생부종합전형 100% 선발';
      add('record',unavailableReason);
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
    return {finalAvailable,regularAvailable,unavailableReason,nonScoreShare,stageLabel,requirements,sourceUrl,sourceLabel};
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
  function earlyKey(e){return [e?.u,e?.adm,e?.cat].map(v=>String(v||'').trim()).join('|');}
  function parseEarlyMinimum(entry){
    const min=String(entry?.min??entry??'').trim(),note=typeof entry==='object'?String(entry?.note||'').trim():'';
    if(typeof entry==='object'&&!min)return {kind:'none',text:'없음'};
    const raw=`${min} ${note}`.trim(),t=raw.replace(/\s/g,'');
    if(!t)return {kind:'none',text:'없음'};
    const sumMatches=[...t.matchAll(/(\d)개(?:영역)?(?:등급)?합(\d{1,2})/g),...t.matchAll(/(?<!개)(\d)합(\d{1,2})/g)];
    const unique=[...new Map(sumMatches.map(m=>[`${m[1]}|${m[2]}`,m])).values()];
    // 학과별 예외, 범위, 복수 조합은 하나의 자동 판정으로 단정하지 않는다.
    const sumTokenCount=(t.match(/합\d{1,2}/g)||[]).length;
    if(unique.length>1||(/[~～]/.test(t)&&unique.length)||(/없음|폐지/.test(t)&&unique.length)||sumTokenCount>unique.length)return {kind:'review',text:raw,reason:'모집단위별 조건'};
    if(unique.length===1){
      const m=unique[0],count=Number(m[1]),limit=Number(m[2]);
      if(count>=1&&count<=4&&limit>=count&&limit<=36)return {kind:'sum',count,limit,text:raw};
    }
    const each=t.match(/(\d)개(?:영역)?.*?(\d)등급(?:이내)?/);
    if(each)return {kind:'each',count:Number(each[1]),limit:Number(each[2]),text:raw};
    if(/(?:수능|수능최저|최저학력기준).{0,8}(?:없음|미적용)/.test(t)||t==='없음'||note==='없음')return {kind:'none',text:'없음'};
    if(!/등급|합\d/.test(t)&&/서류|면접|학생부|교과|실기|단계|일괄|종합평가|추천/.test(t))return {kind:'none',text:'없음'};
    return {kind:'review',text:raw,reason:'문장형 조건'};
  }
  function earlyAssessment(entry,scenario,rank=99){
    const rule=parseEarlyMinimum(entry),grades=[scenario?.kor,scenario?.math,scenario?.eng,Math.min(Number(scenario?.sci1)||9,Number(scenario?.sci2)||9)].map(x=>clamp(Number(x)||9,1,9)).sort((a,b)=>a-b);
    if(rule.kind==='none')return {status:'none',fit:'hard',label:'최저 없음',rule,rank,efficiency:0};
    if(rule.kind==='review')return {status:'review',fit:'hard',label:'요강 확인',rule,rank,efficiency:0};
    const achieved=rule.kind==='sum'?grades.slice(0,rule.count).reduce((a,b)=>a+b,0):grades.filter(x=>x<=rule.limit).length;
    const met=rule.kind==='sum'?achieved<=rule.limit:achieved>=rule.count;
    const margin=rule.kind==='sum'?rule.limit-achieved:achieved-rule.count;
    const averageLimit=rule.kind==='sum'?rule.limit/rule.count:rule.limit;
    const difficulty=clamp(Math.round(100-(averageLimit-1)*22+rule.count*3),0,100);
    const prestige=clamp(Math.round(108-(Number(rank)||99)*26),0,100);
    const closeness=met?clamp(Math.round(100-Math.max(0,margin)*28),0,100):0;
    const efficiency=Math.round(difficulty*.55+prestige*.35+closeness*.10);
    return {status:met?'met':'unmet',fit:met?'safe':'reach',label:met?'최저 충족':'최저 미충족',rule,rank,achieved,margin,difficulty,prestige,closeness,efficiency};
  }
  function rankEarlyAdmissions(entries,scenario,rankMap={}){
    const rows=(entries||[]).map((e,index)=>({e,index,key:earlyKey(e),rank:Number(rankMap[e?.u])||99,assessment:earlyAssessment(e,scenario,Number(rankMap[e?.u])||99)}));
    const byName=(a,b)=>(a.e?.adm||'').localeCompare(b.e?.adm||'ko');
    return {
      met:rows.filter(x=>x.assessment.status==='met').sort((a,b)=>b.assessment.efficiency-a.assessment.efficiency||a.rank-b.rank||byName(a,b)),
      none:rows.filter(x=>x.assessment.status==='none').sort((a,b)=>a.rank-b.rank||(Number(a.e?.lo)||99)-(Number(b.e?.lo)||99)||byName(a,b)),
      other:rows.filter(x=>x.assessment.status==='review'||x.assessment.status==='unmet').sort((a,b)=>(a.assessment.status==='review'?0:1)-(b.assessment.status==='review'?0:1)||a.rank-b.rank||byName(a,b))
    };
  }
  return {version:'2026.09-v7',fit,scenarioChanged,scenarioRecord,scenarioSummaryStd,scenarioSummaryPct,compatible,eligibilityProfile,bonusProfile,strategyMatch,selectivityScore,scoreUniversity,selectionProfile,admissionChance,balancedRows,earlyKey,parseEarlyMinimum,earlyAssessment,rankEarlyAdmissions};
});

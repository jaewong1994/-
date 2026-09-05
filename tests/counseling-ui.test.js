const {chromium}=require('playwright');
const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const root=path.join(__dirname,'..');
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'msedge'});
 const page=await browser.newPage({viewport:{width:375,height:812}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setContent('<div id="uni-content"></div><div id="csl-workspace"></div>');
 await page.addStyleTag({path:path.join(root,'counseling.css')});
 await page.addScriptTag({path:path.join(root,'counseling-engine.js')});
 await page.evaluate(()=>{
 window._wuser={id:'student-a'};window._wprofile={role:'student'};
 window.scores=[{examType:'9월 모평',kor:{gr:2},math:{gr:2},eng:{gr:2},sci1:{gr:2},sci2:{gr:2},mathSub:'확률과통계'}];
 window.UNI=Array.from({length:12},(_,i)=>({n:'테스트대',s:i===11?'자연':'인문',d:i===11?'간호학과':'경영학과 '+i,kw:i===11?30:40,mw:40,ew:10,sw:10,sk:'조건 없음'}));
 window.SUSI=[];window.renderStrategy=()=>{};
 window.CounselingEngine={...window.CounselingEngine,scenarioSummaryStd:()=>390,scenarioSummaryPct:()=>280,scenarioRecord:r=>r,scenarioChanged:()=>false,
 scoreUniversity:u=>({compatible:true,valid:true,ref:380,score:390,diff:10,match:{score:0,label:'보통'},eligibility:{status:'eligible'},bonus:{status:'none'}}),
 balancedRows:rows=>[{key:'fit',rows,total:rows.length}],fit:()=>['fit','적정'],selectionProfile:()=>({requirements:[],finalAvailable:true}),admissionChance:()=>({point:60,low:40,high:80,confidence:'낮음'})};
 });
 await page.addScriptTag({path:path.join(root,'counseling.js')});
 await page.evaluate(()=>renderUni());
 assert.equal(await page.locator('details').count(),1,'same school grouped before pagination');
 assert.equal(await page.locator('details article').count(),12,'all majors retained');
 assert.match(await page.locator('summary').innerText(),/모집단위별 상이/);
 const search=page.getByPlaceholder('예: 경영, 간호');await search.fill('간호');
 assert.equal(await search.evaluate(el=>document.activeElement===el),true,'search keeps focus');
 assert.equal(await page.locator('details article').count(),1,'major filter applies');
 await search.fill('경영');assert.equal(await search.evaluate(el=>document.activeElement===el),true);
 assert.equal(await page.locator('details article').count(),11);
 await search.fill('');await page.locator('select[onchange="personalTrack(this.value)"]').selectOption('자연');
 assert.equal(await page.locator('details article').count(),1,'natural track isolates natural majors');
 await page.locator('select[onchange="personalTrack(this.value)"]').selectOption('인문');
 assert.equal(await page.locator('details article').count(),11,'humanities track isolates humanities majors');
 await page.locator('select[onchange="personalSort(this.value)"]').selectOption('close');
 await page.locator('summary').click();assert.equal(await page.locator('details').getAttribute('open'),'');
 await page.setViewportSize({width:1024,height:768});
 await page.evaluate(()=>{_wuser={id:'student-b'};scores=[];renderUni();});
 assert.equal(await page.locator('details').count(),0,'account switch clears recommendations');
 assert.deepEqual(errors,[]);await browser.close();console.log('UI regression OK: grouping, shared-field variance, 12 majors, focus, major filter, expand, account switch');
})().catch(e=>{console.error(e);process.exit(1);});

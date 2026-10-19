function wPreprocessOmr(dataUrl, rotateDeg){
  rotateDeg = ((rotateDeg||0)%360+360)%360;
  return new Promise((resolve,reject)=>{
    const img=new Image();
    img.onload=()=>{
      try{
        const maxSide=1600;
        let nw=img.naturalWidth, nh=img.naturalHeight;
        const scale=Math.min(1, maxSide/Math.max(nw,nh));
        let w=Math.round(nw*scale), h=Math.round(nh*scale);
        const cv=document.createElement('canvas');
        const ctx=cv.getContext('2d');
        // 회전 반영: 90/270이면 가로세로 스왑
        if(rotateDeg===90||rotateDeg===270){ cv.width=h; cv.height=w; }
        else { cv.width=w; cv.height=h; }
        ctx.save();
        if(rotateDeg===90){ ctx.translate(cv.width,0); ctx.rotate(Math.PI/2); }
        else if(rotateDeg===180){ ctx.translate(cv.width,cv.height); ctx.rotate(Math.PI); }
        else if(rotateDeg===270){ ctx.translate(0,cv.height); ctx.rotate(-Math.PI/2); }
        ctx.drawImage(img,0,0,w,h);
        ctx.restore();
        // 픽셀 보정: 대비 강화 + 약한 흑백화
        const imgd=ctx.getImageData(0,0,cv.width,cv.height);
        const d=imgd.data;
        const contrast=1.35;
        const intercept=128*(1-contrast);
        for(let i=0;i<d.length;i+=4){
          let r=d[i]*contrast+intercept;
          let g=d[i+1]*contrast+intercept;
          let b=d[i+2]*contrast+intercept;
          const gray=0.299*r+0.587*g+0.114*b;
          r=r*0.5+gray*0.5; g=g*0.5+gray*0.5; b=b*0.5+gray*0.5;
          d[i]=Math.max(0,Math.min(255,r));
          d[i+1]=Math.max(0,Math.min(255,g));
          d[i+2]=Math.max(0,Math.min(255,b));
        }
        ctx.putImageData(imgd,0,0);
        const out=cv.toDataURL('image/jpeg',0.9);
        resolve(out.split(',')[1]);
      }catch(e){ reject(e); }
    };
    img.onerror=()=>reject(new Error('이미지 로드 실패'));
    img.src=dataUrl;
  });
}

// =====================================================================
//  Method A — 순수 픽셀 OMR 판독 엔진 v7 (AI 미사용, 클라이언트 전부 처리)
//  · Stage A/B: 종이 평면화(homography) → 자주색 인쇄영역 (2200×1680) 정규화
//  · 마스크 2종: blk(조명보정 후 검정 마킹, 밝은 분홍 인쇄 제외) / pink(인쇄 구조)
//  · 셀 스냅: 명목좌표 주변 (blk+pink) fill 최대 위치 탐색 → 국소 왜곡 흡수
//  · 2패스 충돌해소: 한 마킹을 두 셀이 공유하는 케이스를 앵커(확실마킹 오프셋)로 귀속
//  · 적응 임계: 확실마킹 중앙값 기반 T + 그레이존/확신도(high·low·ambig·none)
//  검증: 마킹 휴대폰사진 30/30 전 문항 정답 · 빈 양식 오탐 0건 (Python↔JS 교차검증)
// =====================================================================

// 표준(마킹본) 좌표계 상수
const OMR_STD = {
  W: 2200, H: 1680,
  // 좌표계: 종이 평면화 → 자주색 인쇄영역의 (축정렬) 바운딩박스를 (W×H)로 정규화한 공간.
  // 인쇄 범위는 스캔/사진 공통이라 좌표가 일관됨.
  // 공통 객관식 좌열 Q1~10 / 우열 Q11~15
  mcL: { xs:[772.7,821.0,869.3,917.5,965.8],
         ys:[142.4,215.0,287.6,360.2,432.8,505.4,577.9,650.5,723.1,795.6], q0:1 },
  mcR: { xs:[1117.7,1166.0,1214.3,1262.5,1310.8],
         ys:[142.4,215.0,287.6,360.2,432.8], q0:11 },
  // 선택 객관식 Q23~28
  sel: { xs:[1999.2,2043.4,2086.4,2126.2,2168.2], ys:[281.6,355.4,430.3,502.9,576.7,649.3], q0:23 },
  // 단답형: 박스별 [백x,십x,일x] 열좌표. 자리 y = row0 + dy*숫자(0~9), 백의자리는 1부터.
  sa: {
    cols:{16:[694.3,738.5,782.6],17:[866.7,910.9,955.0],18:[1040.1,1084.3,1128.5],
          19:[1211.4,1255.5,1299.7],20:[1383.7,1427.8,1472.0],21:[1536.6,1580.7,1624.8],
          22:[1689.4,1733.5,1777.7],29:[1873.4,1919.7,1964.9],30:[2088.6,2129.5,2170.4]},
    row0:940.6, dy:78.2
  },
  // 검정마킹 마스크: 조명보정(배경나눗셈) 후 norm<blkThresh
  blkThresh:165
};

// OpenCV.js 지연 로드 (최초 스캔 시 1회)
let _cvReadyPromise=null;
function loadOpenCV(){
  if(_cvReadyPromise) return _cvReadyPromise;
  const SOURCES=[
    'https://cdn.jsdelivr.net/npm/@techstark/opencv-js@4.10.0-release.1/dist/opencv.js',
    'https://docs.opencv.org/4.10.0/opencv.js',
    'https://docs.opencv.org/4.x/opencv.js'
  ];
  _cvReadyPromise=new Promise((resolve,reject)=>{
    if(window.cv && window.cv.Mat){ resolve(); return; }
    let i=0;
    const tryNext=()=>{
      if(i>=SOURCES.length){
        reject(new Error('OpenCV 로드 실패 (인터넷 연결 확인)'));
        return;
      }
      const url=SOURCES[i++];
      const s=document.createElement('script');
      s.src=url;
      s.async=true;
      s.onload=()=>{
        const finish=()=>{
          if(window.cv && window.cv.Mat) resolve();
          else tryNext();
        };
        if(window.cv && window.cv.Mat) return finish();
        // WASM 초기화 콜백 대기 (+ 안전 타임아웃)
        window.cv = window.cv || {};
        const prev = window.cv.onRuntimeInitialized;
        let settled=false;
        const t=setTimeout(()=>{ if(!settled){ settled=true; tryNext(); } }, 20000);
        window.cv.onRuntimeInitialized=()=>{
          if(prev) try{prev();}catch(e){}
          if(!settled){ settled=true; clearTimeout(t); resolve(); }
        };
      };
      s.onerror=()=>tryNext();  // 다음 CDN으로
      document.head.appendChild(s);
    };
    tryNext();
  });
  return _cvReadyPromise;
}

// dataURL → ImageData (장변 maxSide로 축소, 색보정 없음=원색 유지)
function wOmrLoadImageData(dataUrl, maxSide){
  return new Promise((resolve,reject)=>{
    const img=new Image();
    img.onload=()=>{
      try{
        let nw=img.naturalWidth, nh=img.naturalHeight;
        const scale=Math.min(1, maxSide/Math.max(nw,nh));
        const w=Math.max(1,Math.round(nw*scale)), h=Math.max(1,Math.round(nh*scale));
        const cnv=document.createElement('canvas'); cnv.width=w; cnv.height=h;
        const ctx=cnv.getContext('2d',{willReadFrequently:true});
        ctx.drawImage(img,0,0,w,h);
        resolve(ctx.getImageData(0,0,w,h));
      }catch(e){ reject(e); }
    };
    img.onerror=()=>reject(new Error('이미지 로드 실패'));
    img.src=dataUrl;
  });
}

// HSV inRange 마스크 (low/high: [H,S,V]) → 8UC1 Mat (호출측 delete)
function _omrInRange(hsv, low, high){
  const cv=window.cv;
  const lo=new cv.Mat(hsv.rows,hsv.cols,hsv.type(),[low[0],low[1],low[2],0]);
  const hi=new cv.Mat(hsv.rows,hsv.cols,hsv.type(),[high[0],high[1],high[2],255]);
  const mask=new cv.Mat();
  cv.inRange(hsv,lo,hi,mask);
  lo.delete(); hi.delete();
  return mask;
}

// 4점 정렬: TL=min(x+y), TR=max(x-y), BR=max(x+y), BL=min(x-y)
function _omrOrderQuad(pts){
  let tl=pts[0],tr=pts[0],br=pts[0],bl=pts[0];
  for(const p of pts){
    if(p[0]+p[1] < tl[0]+tl[1]) tl=p;
    if(p[0]+p[1] > br[0]+br[1]) br=p;
    if(p[0]-p[1] > tr[0]-tr[1]) tr=p;
    if(p[0]-p[1] < bl[0]-bl[1]) bl=p;
  }
  return [tl,tr,br,bl];
}

// [Stage A] 흰 종이 사각형 검출(밝기 Otsu + 최대 윤곽 + 4점 근사). 실패 시 null.
function _omrDetectPaper(rgb){
  const cv=window.cv;
  const g=new cv.Mat(); cv.cvtColor(rgb,g,cv.COLOR_RGB2GRAY);
  cv.GaussianBlur(g,g,new cv.Size(7,7),0);
  const th=new cv.Mat(); cv.threshold(g,th,0,255,cv.THRESH_BINARY+cv.THRESH_OTSU);
  g.delete();
  const K=cv.getStructuringElement(cv.MORPH_RECT,new cv.Size(25,25));
  cv.morphologyEx(th,th,cv.MORPH_CLOSE,K,new cv.Point(-1,-1),2);
  cv.morphologyEx(th,th,cv.MORPH_OPEN,K,new cv.Point(-1,-1),2);
  K.delete();
  const cnts=new cv.MatVector(), hi=new cv.Mat();
  cv.findContours(th,cnts,hi,cv.RETR_EXTERNAL,cv.CHAIN_APPROX_SIMPLE);
  th.delete(); hi.delete();
  const imgArea=rgb.cols*rgb.rows;
  let best=null,bestA=0;
  for(let i=0;i<cnts.size();i++){ const c=cnts.get(i); const a=cv.contourArea(c);
    if(a>bestA){ bestA=a; if(best)best.delete(); best=c; } else c.delete(); }
  cnts.delete();
  if(!best || bestA < 0.15*imgArea){ if(best)best.delete(); return null; }
  const peri=cv.arcLength(best,true);
  let quad=null;
  for(const eps of [0.02,0.03,0.05,0.08]){
    const ap=new cv.Mat(); cv.approxPolyDP(best,eps*peri,true,ap);
    if(ap.rows===4){ const d=ap.data32S; quad=[[d[0],d[1]],[d[2],d[3]],[d[4],d[5]],[d[6],d[7]]]; ap.delete(); break; }
    ap.delete();
  }
  if(!quad){ const rr=cv.minAreaRect(best); const p=cv.RotatedRect.points(rr); quad=p.map(q=>[q.x,q.y]); }
  best.delete();
  return _omrOrderQuad(quad);
}

// [Stage A] 종이 사각형으로 원근 제거 → 평면화 RGB Mat 반환 (호출측 delete). 미검출 시 원본 복제.
function _omrRectifyPaper(rgb){
  const cv=window.cv;
  const q=_omrDetectPaper(rgb);
  if(!q) return rgb.clone();
  const [TL,TR,BR,BL]=q;
  const dist=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
  const wA=Math.max(1,Math.round(Math.max(dist(TR,TL),dist(BR,BL))));
  const hA=Math.max(1,Math.round(Math.max(dist(BL,TL),dist(BR,TR))));
  const srcM=cv.matFromArray(4,1,cv.CV_32FC2,[TL[0],TL[1],TR[0],TR[1],BR[0],BR[1],BL[0],BL[1]]);
  const dstM=cv.matFromArray(4,1,cv.CV_32FC2,[0,0,wA,0,wA,hA,0,hA]);
  const M=cv.getPerspectiveTransform(srcM,dstM);
  const out=new cv.Mat();
  cv.warpPerspective(rgb,out,M,new cv.Size(wA,hA),cv.INTER_LINEAR,cv.BORDER_CONSTANT,new cv.Scalar(255,255,255));
  srcM.delete(); dstM.delete(); M.delete();
  return out;
}

// [Stage B] 평면화 RGB → 자주색 인쇄영역의 축정렬 바운딩박스를 (W×H)로 정규화한 RGB 반환. 실패 시 null.
function _omrNormalizePrint(rgb){
  const cv=window.cv;
  const hsv=new cv.Mat(); cv.cvtColor(rgb,hsv,cv.COLOR_RGB2HSV);
  const mag=_omrInRange(hsv,[130,18,40],[179,255,255]); hsv.delete();
  const k=cv.getStructuringElement(cv.MORPH_RECT,new cv.Size(11,11));
  cv.morphologyEx(mag,mag,cv.MORPH_CLOSE,k,new cv.Point(-1,-1),2); k.delete();
  const cnts=new cv.MatVector(), hi=new cv.Mat();
  cv.findContours(mag,cnts,hi,cv.RETR_EXTERNAL,cv.CHAIN_APPROX_SIMPLE);
  mag.delete(); hi.delete();
  const minA=0.0008*rgb.cols*rgb.rows;
  let bx=1e9,by=1e9,bx2=-1,by2=-1, found=false;
  for(let i=0;i<cnts.size();i++){ const c=cnts.get(i);
    if(cv.contourArea(c)>minA){ const d=c.data32S;
      for(let j=0;j<d.length;j+=2){ const x=d[j],y=d[j+1];
        if(x<bx)bx=x; if(y<by)by=y; if(x>bx2)bx2=x; if(y>by2)by2=y; found=true; } }
    c.delete();
  }
  cnts.delete();
  if(!found) return null;
  bx=Math.max(0,bx); by=Math.max(0,by);
  bx2=Math.min(rgb.cols-1,bx2); by2=Math.min(rgb.rows-1,by2);
  const bw=bx2-bx+1, bh=by2-by+1;
  if(bw<10||bh<10) return null;
  const roi=rgb.roi(new cv.Rect(bx,by,bw,bh));
  const out=new cv.Mat();
  cv.resize(roi,out,new cv.Size(OMR_STD.W,OMR_STD.H),0,0,cv.INTER_AREA);
  roi.delete();
  return out;
}

// [v7] 정규화 RGB → 마스크 2종 (plain 객체 {data:Uint8Array,w,h}로 즉시 추출 후 Mat 해제)
//  blk : 조명보정(배경나눗셈) 후 norm<blkThresh 역이진 − dilate(pink) 차감(밝은 분홍 인쇄 제외)
//  pink: HSV inRange(H120~179, S≥40, V≥120) — 인쇄 구조
//  핵심: 마킹 픽셀은 V<30(단 S 200+ → S로 거르면 안 됨), 인쇄 분홍 V 180~215. V로만 분리.
function _omrBuildMasks(warped){
  const cv=window.cv;
  const g=new cv.Mat(); cv.cvtColor(warped,g,cv.COLOR_RGB2GRAY);
  const bg=new cv.Mat(); cv.blur(g,bg,new cv.Size(151,151)); // 국소 배경(조명) 추정
  const nm=new cv.Mat(); cv.divide(g,bg,nm,255);             // 조명 평탄화
  const blk=new cv.Mat(); cv.threshold(nm,blk,OMR_STD.blkThresh,255,cv.THRESH_BINARY_INV);
  g.delete(); bg.delete(); nm.delete();
  const hsv=new cv.Mat(); cv.cvtColor(warped,hsv,cv.COLOR_RGB2HSV);
  const pink=_omrInRange(hsv,[120,40,120],[179,255,255]); hsv.delete();
  const k3=cv.Mat.ones(3,3,cv.CV_8U);
  const pd=new cv.Mat(); cv.dilate(pink,pd,k3); k3.delete();
  const npd=new cv.Mat(); cv.bitwise_not(pd,npd); pd.delete();
  cv.bitwise_and(blk,npd,blk); npd.delete();
  const out={
    blk:  { data:new Uint8Array(blk.data),  w:blk.cols,  h:blk.rows },
    pink: { data:new Uint8Array(pink.data), w:pink.cols, h:pink.rows }
  };
  blk.delete(); pink.delete();
  return out;
}

// 입력 ImageData → 종이 평면화 + 인쇄영역 정규화 + 방향 자동보정한 마스크 2종
// 반환 {blk, pink, rot}  (plain 객체라 별도 해제 불필요)
// 방향 판별은 _omrOrientScore(대비 점수) — 원시 밀도 점수는 90° 오선택 이력 → 금지
function _omrRectify(imgData){
  const cv=window.cv;
  const src=cv.matFromImageData(imgData);
  const rgb0=new cv.Mat(); cv.cvtColor(src,rgb0,cv.COLOR_RGBA2RGB); src.delete();

  // Stage A: 종이 사각형으로 원근 제거(평면화)
  const rect=_omrRectifyPaper(rgb0); rgb0.delete();

  // Stage B: 4방향 각각 인쇄영역 정규화 → 대비 점수 최대 방향 선택
  let best=null;
  for(const deg of [0,90,180,270]){
    let r;
    if(deg===0){ r=rect.clone(); }
    else { r=new cv.Mat();
      const code=deg===90?cv.ROTATE_90_CLOCKWISE:deg===180?cv.ROTATE_180:cv.ROTATE_90_COUNTERCLOCKWISE;
      cv.rotate(rect,r,code);
    }
    const norm=_omrNormalizePrint(r); r.delete();
    if(!norm){ continue; }
    const masks=_omrBuildMasks(norm); norm.delete();
    const score=_omrOrientScore(masks.blk, masks.pink);
    if(!best || score>best.score){ best={ score, rot:deg, blk:masks.blk, pink:masks.pink }; }
  }
  rect.delete();
  if(!best){ throw new Error('OMR 표를 찾지 못했습니다. 답안지 전체가 보이게(가장자리까지) 밝고 정면으로 촬영하세요.'); }
  return { blk:best.blk, pink:best.pink, rot:best.rot };
}

// =====================================================================
//  OMR v7 판독 코어 (파이썬 프로토타입 omr_v7 포팅)
//  마스크 2종(blk=검정마킹, pink=인쇄) → 셀 스냅 → 2패스 충돌해소 → 적응임계 판정
//  검증: 마킹 사진 30/30 전 문항 정답, 빈 양식 오탐 0건
//  마스크는 plain 객체 {data:Uint8Array, w, h} — OpenCV Mat 수명과 무관하게 안전
// =====================================================================
const OMR_V7 = {
  R_MC:20, R_SA:16,                    // 셀 원형 ROI 반지름
  MC_WX:18, MC_WY:26,                  // 객관식 스냅 탐색창 (±)
  SA_WX:16, SA_WY:36,                  // 단답형 스냅 탐색창 (±)
  SNAP_STEP:3,                         // 조밀 탐색 간격 → best 주변 ±2 미세조정
  PAIR_MIN:0.05,                       // 충돌쌍 후보 최소 fill
  PAIR_D_MC:30, PAIR_D_SA:26,          // 같은 마킹 공유로 보는 스냅 거리
  ANCHOR_MIN:0.15,                     // 앵커(확실마킹) 최소 fill
  T_K:0.30, T_LO:0.06, T_HI:0.14,      // 적응 임계 T = clamp(T_K·ref, T_LO, T_HI)
  NOISE:0.035, GRAY_K:0.6,             // 그레이존: bv≥0.6T && sv<NOISE
  MC_RATIO:1.5, SA_RATIO:1.35          // 1위/2위 우세비
};

// 원형 커널 오프셋 캐시 (Int32Array [dx,dy,...])
const _omrKC = {};
function _omrKernel(r){
  if(_omrKC[r]) return _omrKC[r];
  const offs=[];
  for(let dy=-r; dy<=r; dy++)
    for(let dx=-r; dx<=r; dx++)
      if(dx*dx+dy*dy <= r*r) offs.push(dx,dy);
  const k={ offs:new Int32Array(offs), n:offs.length/2 };
  _omrKC[r]=k;
  return k;
}

// fill 비율: (cx,cy) 중심 반지름 r 원 내 마킹 픽셀 비율 0~1 (m: {data,w,h})
function _omrFill(m, cx, cy, r){
  const k=_omrKernel(r);
  let x0=Math.round(cx-r), y0=Math.round(cy-r);
  x0=Math.max(0, Math.min(m.w-2*r-1, x0));
  y0=Math.max(0, Math.min(m.h-2*r-1, y0));
  const ctx=x0+r, cty=y0+r, d=m.data, W=m.w, offs=k.offs;
  let s=0;
  for(let i=0;i<offs.length;i+=2) s += d[(cty+offs[i+1])*W + (ctx+offs[i])];
  return s/(k.n*255);
}

// 두 마스크 fill 합 (스냅 탐색용 — 한 번의 커널 순회로 계산)
function _omrFill2(a, b, cx, cy, r){
  const k=_omrKernel(r);
  let x0=Math.round(cx-r), y0=Math.round(cy-r);
  x0=Math.max(0, Math.min(a.w-2*r-1, x0));
  y0=Math.max(0, Math.min(a.h-2*r-1, y0));
  const ctx=x0+r, cty=y0+r, da=a.data, db=b.data, W=a.w, offs=k.offs;
  let s=0;
  for(let i=0;i<offs.length;i+=2){
    const idx=(cty+offs[i+1])*W + (ctx+offs[i]);
    s += da[idx]+db[idx];
  }
  return s/(k.n*255);
}

// 셀 스냅: 명목중심 주변에서 (blk+pink) fill 최대 위치 탐색 → [그 위치의 blk fill, x, y]
// 마킹 셀은 검정 점에, 빈 셀은 분홍 글리프에 스냅 (둘 다 셀 실제 중심의 근거)
function _omrCellSnap(blk, pink, cx, cy, r, wx, wy){
  const step=OMR_V7.SNAP_STEP;
  let bx=cx, by=cy, bs=-1;
  for(let dx=-wx; dx<=wx; dx+=step){
    for(let dy=-wy; dy<=wy; dy+=step){
      const s=_omrFill2(blk, pink, cx+dx, cy+dy, r);
      if(s>bs){ bs=s; bx=cx+dx; by=cy+dy; }
    }
  }
  for(let dx=-2; dx<=2; dx++){
    for(let dy=-2; dy<=2; dy++){
      const x=bx+dx, y=by+dy;
      const s=_omrFill2(blk, pink, x, y, r);
      if(s>bs){ bs=s; bx=x; by=y; }
    }
  }
  return [_omrFill(blk, bx, by, r), bx, by];
}

// 같은 위치로 스냅된 셀 쌍(한 마킹을 두 셀이 공유) 수집 → [[i,j,resolved],...]
function _omrFindPairs(cells, minD){
  const pairs=[];
  for(let i=0;i<cells.length;i++){
    for(let j=i+1;j<cells.length;j++){
      const a=cells[i].snap, b=cells[j].snap;
      if(a[0]>OMR_V7.PAIR_MIN && b[0]>OMR_V7.PAIR_MIN &&
         Math.abs(a[1]-b[1])<minD && Math.abs(a[2]-b[2])<minD){
        pairs.push([i,j,false]);
      }
    }
  }
  return pairs;
}

function _omrD2(c, px, py, ox, oy){
  const dx=c.nom[0]+ox-px, dy=c.nom[1]+oy-py;
  return dx*dx+dy*dy;
}

// 1패스: 명목거리 여유가 큰 충돌쌍 즉시 해소 (패자 val=0)
function _omrPass1(cells, vals, pairs){
  for(const p of pairs){
    const i=p[0], j=p[1];
    if(vals[i]<=0 || vals[j]<=0){ p[2]=true; continue; }
    const win = vals[i]>=vals[j] ? cells[i].snap : cells[j].snap;
    const px=win[1], py=win[2];
    const di=_omrD2(cells[i],px,py,0,0), dj=_omrD2(cells[j],px,py,0,0);
    if(di>=4*dj || dj>=4*di || Math.max(di,dj)>=2.0*Math.min(di,dj)+400){
      if(di<=dj) vals[j]=0; else vals[i]=0;
      p[2]=true;
    }
  }
}

// 미해소 충돌에 연루되지 않은 확실마킹들의 (스냅-명목) 오프셋 목록
function _omrUnitAnchors(cells, vals, pairs){
  const unres=new Set();
  for(const p of pairs) if(!p[2]){ unres.add(p[0]); unres.add(p[1]); }
  const out=[];
  for(let k=0;k<cells.length;k++){
    if(!unres.has(k) && vals[k]>=OMR_V7.ANCHOR_MIN){
      out.push([cells[k].snap[1]-cells[k].nom[0], cells[k].snap[2]-cells[k].nom[1]]);
    }
  }
  return out;
}

// 2패스: 남은 충돌쌍을 (명목+앵커오프셋 → 공유점) 거리로 귀속 (패자 val=0)
function _omrPass2(cells, vals, pairs, ox, oy){
  for(const p of pairs){
    const i=p[0], j=p[1];
    if(p[2] || vals[i]<=0 || vals[j]<=0) continue;
    const win = vals[i]>=vals[j] ? cells[i].snap : cells[j].snap;
    const px=win[1], py=win[2];
    const di=_omrD2(cells[i],px,py,ox,oy), dj=_omrD2(cells[j],px,py,ox,oy);
    if(di<=dj) vals[j]=0; else vals[i]=0;
  }
}

function _omrMedian(arr){
  if(!arr.length) return 0;
  const s=arr.slice().sort((a,b)=>a-b);
  const m=s.length>>1;
  return (s.length%2) ? s[m] : (s[m-1]+s[m])/2;
}

// 전체 판독 → { answers:{번호:답}, conf:{번호:'high'|'low'|'ambig'|'none'}, T, ref }
function _omrReadAll(blk, pink){
  const S=OMR_STD, V=OMR_V7;
  const answers={}, conf={};
  // ---- 객관식: 블록(열그룹) 단위로 스냅+1패스 → 블록 공유 앵커 → 2패스 ----
  const mcRows=[];
  const mcBlocks=[[S.mcL.xs,S.mcL.ys,S.mcL.q0],[S.mcR.xs,S.mcR.ys,S.mcR.q0],[S.sel.xs,S.sel.ys,S.sel.q0]];
  for(const [xs,ys,q0] of mcBlocks){
    const units=[];
    ys.forEach((cy,i)=>{
      const cells=xs.map(x=>({ nom:[x,cy], snap:_omrCellSnap(blk,pink,x,cy,V.R_MC,V.MC_WX,V.MC_WY) }));
      const vals=cells.map(c=>c.snap[0]);
      const pairs=_omrFindPairs(cells,V.PAIR_D_MC);
      _omrPass1(cells,vals,pairs);
      units.push({ q:q0+i, cells, vals, pairs });
    });
    const anchors=[];
    for(const u of units) anchors.push(..._omrUnitAnchors(u.cells,u.vals,u.pairs));
    const ox=_omrMedian(anchors.map(a=>a[0])), oy=_omrMedian(anchors.map(a=>a[1]));
    for(const u of units){
      _omrPass2(u.cells,u.vals,u.pairs,ox,oy);
      mcRows.push([u.q,u.vals]);
    }
  }
  // ---- 단답형: 박스(3열) 단위로 스냅+1패스 → 박스 공유 앵커 → 2패스 ----
  const saData={};
  for(const q of Object.keys(S.sa.cols)){
    const cols=S.sa.cols[q];
    const units=[];
    for(let j=0;j<3;j++){
      const cx=cols[j], start=(j===0)?1:0;
      const cells=[];
      for(let d=start; d<=9; d++){
        const ny=S.sa.row0+S.sa.dy*d;
        cells.push({ d, nom:[cx,ny], snap:_omrCellSnap(blk,pink,cx,ny,V.R_SA,V.SA_WX,V.SA_WY) });
      }
      const vals=cells.map(c=>c.snap[0]);
      const pairs=_omrFindPairs(cells,V.PAIR_D_SA);
      _omrPass1(cells,vals,pairs);
      units.push({ cells, vals, pairs });
    }
    const anchors=[];
    for(const u of units) anchors.push(..._omrUnitAnchors(u.cells,u.vals,u.pairs));
    const ox=_omrMedian(anchors.map(a=>a[0])), oy=_omrMedian(anchors.map(a=>a[1]));
    const box=[];
    for(const u of units){
      _omrPass2(u.cells,u.vals,u.pairs,ox,oy);
      box.push(u.cells.map((c,k)=>[c.d,u.vals[k]]));
    }
    saData[q]=box;
  }
  // ---- 적응 임계: 확실마킹(1위≥0.15 & 2위 2배 초과) 중앙값 기반 ----
  const definite=[];
  for(const [,vs] of mcRows){
    const o=vs.slice().sort((a,b)=>b-a);
    if(o[0]>=0.15 && o[0]>2*o[1]) definite.push(o[0]);
  }
  for(const q of Object.keys(saData)){
    for(const col of saData[q]){
      const o=col.map(t=>t[1]).sort((a,b)=>b-a);
      if(o[0]>=0.15 && o[0]>2*o[1]) definite.push(o[0]);
    }
  }
  const ref = definite.length ? _omrMedian(definite) : 0.3;
  const T = Math.min(V.T_HI, Math.max(V.T_LO, V.T_K*ref));
  // ---- 객관식 판정 ----
  for(const [q,vs] of mcRows){
    const o=[0,1,2,3,4].sort((a,b)=>vs[b]-vs[a]);
    const bv=vs[o[0]], sv=vs[o[1]];
    let a='', c='none';
    if(bv>=T && (sv<1e-6 || bv>V.MC_RATIO*sv)){ a=String(o[0]+1); c=(bv>=0.15)?'high':'low'; }
    else if(bv>=T*V.GRAY_K && sv<V.NOISE){ a=String(o[0]+1); c='low'; }
    else if(bv>=T*V.GRAY_K){ c='ambig'; }
    answers[String(q)]=a; conf[String(q)]=c;
  }
  // ---- 단답형 판정 (자리별 → parseInt로 선행 0 제거) ----
  for(const q of Object.keys(saData)){
    let out='', c='none';
    for(const col of saData[q]){
      const cs=col.slice().sort((a,b)=>b[1]-a[1]);
      const d=cs[0][0], bv=cs[0][1], sv=cs.length>1?cs[1][1]:0;
      if(bv>=T && (sv<1e-6 || bv>V.SA_RATIO*sv)){
        out+=String(d);
        c = ((c==='none'||c==='high') && bv>=0.15) ? 'high' : 'low';
      }
      else if(bv>=T*V.GRAY_K && sv<V.NOISE){ out+=String(d); c='low'; }
      else if(bv>=T*V.GRAY_K && c==='none'){ c='ambig'; }
    }
    answers[q] = out ? String(parseInt(out,10)) : '';
    conf[q]=c;
  }
  return { answers, conf, T, ref };
}

// 방향 판별 점수: Σ(셀 중심의 pink+blk fill − 인접 중간점의 fill) — 대비 방식
// (원시 밀도 점수는 텍스트 밀집영역과의 우연 정렬로 90° 오선택 이력 있음 → 반드시 대비식)
function _omrOrientScore(blk, pink){
  const S=OMR_STD, V=OMR_V7;
  let sc=0;
  const mcBlocks=[[S.mcL.xs,S.mcL.ys],[S.mcR.xs,S.mcR.ys],[S.sel.xs,S.sel.ys]];
  for(const [xs,ys] of mcBlocks){
    const dxp=(xs[1]-xs[0])/2;
    for(const cy of ys){
      for(let i=0;i<xs.length;i++){
        const x=xs[i];
        const c=_omrFill2(pink,blk,x,cy,V.R_MC);
        const mx=(i<xs.length-1) ? x+dxp : x-dxp;
        const m=_omrFill2(pink,blk,mx,cy,V.R_MC);
        sc += c-m;
      }
    }
  }
  for(const q of Object.keys(S.sa.cols)){
    for(const cx of S.sa.cols[q]){
      for(let d=0; d<=9; d+=3){
        const y=S.sa.row0+S.sa.dy*d;
        const c=_omrFill2(pink,blk,cx,y,V.R_SA);
        const m=_omrFill2(pink,blk,cx,y+S.sa.dy/2,V.R_SA);
        sc += c-m;
      }
    }
  }
  return sc;
}

// 진입점: dataURL → 판독 결과 객체 {rot, answers:{번호:답}}
// 문항별 확신도(high/low/ambig/none)는 window._omrConf에 저장 (UI 경고용)
async function wOmrPixelScan(dataUrl){
const __mvpEpoch=SessionGuard.capture();

  await SessionGuard.wait((loadOpenCV()),__mvpEpoch);
  const imgData=await SessionGuard.wait((wOmrLoadImageData(dataUrl, 2000)),__mvpEpoch);
  const { blk, pink, rot } = _omrRectify(imgData);
  const { answers, conf } = _omrReadAll(blk, pink);
  window._omrConf = conf;
  return { rot, answers };
}

async function wOmrScan(input){
const __mvpEpoch=SessionGuard.capture();

  const file = input.files && input.files[0];
  if(!file) return;
  const status=document.getElementById('omr-scan-status');
  const total=window._wTotal||0;
  const types=window._wTypes||[];
  status.style.color='var(--accent)';
  status.innerHTML='🖼️ 이미지 준비 중...';

  try{
    const rawDataUrl = await SessionGuard.wait((new Promise((res,rej)=>{
      const r=new FileReader();
      r.onload=()=>res(String(r.result));
      r.onerror=()=>rej(new Error('파일 읽기 실패'));
      r.readAsDataURL(file);
    })),__mvpEpoch);

    // Method A: 순수 픽셀 판독 (서버/AI 미사용, 기기 내 처리)
    status.innerHTML='🧠 판독 엔진 준비 중...';
    await SessionGuard.wait((loadOpenCV()),__mvpEpoch);
    status.innerHTML='🔍 답안 판독 중... (보통 1~3초)';
    const { rot, answers } = await SessionGuard.wait((wOmrPixelScan(rawDataUrl)),__mvpEpoch);

    // 자동 채움 (유형별 후처리)
    let filled=0;
    for(let i=0;i<total;i++){
      const key=String(i+1);
      let v=(answers[key]==null?'':String(answers[key])).trim();
      if((types[i]||'mc')==='mc'){
        const m=v.match(/[1-5]/); v=m?m[0]:'';
        window._wAnswers[i]=v;
        document.querySelectorAll(`.omr-bubble[data-q="${i}"]`).forEach(b=>{ b.classList.toggle('on', b.dataset.n===v); });
      } else {
        v=v.replace(/[^0-9]/g,''); if(v) v=String(parseInt(v,10));
        window._wAnswers[i]=v;
        const inp=document.querySelector(`.w-sa-inp[data-saq="${i}"]`);
        if(inp) inp.value=v;
      }
      if(window._wAnswers[i]) filled++;
    }
    // 저신뢰(low/ambig) 문항 경고
    const _conf=window._omrConf||{};
    const lowQ=[];
    for(let i=0;i<total;i++){
      const c=_conf[String(i+1)];
      if(c==='low'||c==='ambig') lowQ.push(i+1);
    }
    const lowMsg = lowQ.length
      ? `<br><span style="color:#b45309;">⚠️ ${lowQ.join(', ')}번 확신도 낮음, 직접 확인</span>`
      : '';
    status.style.color='var(--a3)';
    status.innerHTML=`✓ ${filled}/${total}문항 인식됨${rot?` (사진 ${rot}° 자동 회전 보정)`:''}. <strong>아래에서 꼭 확인</strong> 후 제출하세요. 틀린 곳은 직접 고치면 돼요.${lowMsg}`;
  }catch(e){SessionGuard.assert(__mvpEpoch);
    status.style.color='var(--red)';
    status.innerHTML='인식 실패: '+e.message+'<br><span style="font-size:9px;">더 밝고 정면으로 다시 찍거나, 수동으로 입력하세요.</span>';
  } finally {
    input.value='';
  }
}

// 호머식 채점 버튼 + 영역
function wHomerButton(testId){
  let zone=document.getElementById('homer-zone');
  if(!zone){
    const res=document.getElementById('w-result');
    if(!res)return;
    res.innerHTML += `<div id="homer-zone" style="margin-top:12px;"></div>`;
    zone=document.getElementById('homer-zone');
  }
  zone.innerHTML = `
    <button onclick="wHomerStart(${testId})" style="width:100%;padding:11px;background:linear-gradient(135deg,#fbbf24,#f59e0b);color:#7c2d12;border:none;border-radius:10px;font-size:13px;font-weight:800;cursor:pointer;font-family:'Noto Sans KR',sans-serif;">🍩 호머식 채점 (만약에 말이야...)</button>
    <div style="font-size:9px;color:var(--t3);text-align:center;margin-top:4px;">계산실수로 틀린 문제를 체크하면, "안 틀렸다면?"의 점수·등수를 볼 수 있어요 (나만 보임 · 실제 순위엔 영향 없음)</div>`;
}

async function wHomerStart(testId){
const __mvpEpoch=SessionGuard.capture();

  const sb=sbReady();
  const zone=document.getElementById('homer-zone');
  zone.innerHTML = `<div style="text-align:center;font-size:12px;color:var(--t3);padding:10px;">틀린 문제 불러오는 중...</div>`;
  const { data:wrong, error } = await SessionGuard.wait((sb.rpc('my_wrong_items', { p_test_id: testId })),__mvpEpoch);
  if(error){ zone.innerHTML=`<div style="color:var(--red);font-size:12px;text-align:center;">${Ui.escape(error.message)}</div>`; return; }
  if(!wrong || !wrong.length){
    zone.innerHTML = `<div style="background:linear-gradient(135deg,#fef9c3,#fde68a);border-radius:12px;padding:16px;text-align:center;">
      <div style="font-size:28px;">🍩✨</div>
      <div style="font-size:13px;font-weight:800;color:#7c2d12;margin-top:4px;">틀린 문제가 없어요!</div>
      <div style="font-size:11px;color:#92400e;margin-top:2px;">호머도 인정하는 완벽한 점수 👏</div>
    </div>`;
    return;
  }
  window._homerWrong = wrong.map(w=>({idx:w.item_idx, points:w.item_points}));
  window._homerChecked = new Set();
  window._homerTestId = testId;
  let chips='';
  window._homerWrong.forEach(w=>{
    chips += `<button id="hm-${w.idx}" onclick="wHomerToggle(${w.idx})" style="padding:8px 12px;border-radius:10px;border:2px solid var(--border);background:var(--white);color:var(--t2);font-size:12px;font-weight:700;cursor:pointer;font-family:'Noto Sans KR',sans-serif;">${w.idx+1}번 <span style="font-size:9px;color:var(--t3);">(${w.points}점)</span></button>`;
  });
  zone.innerHTML = `
  <div style="background:linear-gradient(135deg,#fff7ed,#fef3c7);border:2px solid #fbbf24;border-radius:14px;padding:16px;">
    <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;">
      <span style="font-size:20px;">🍩</span>
      <span style="font-size:14px;font-weight:900;color:#7c2d12;">호머식 채점</span>
    </div>
    <div style="font-size:11px;color:#92400e;margin-bottom:12px;line-height:1.6;">"이건 진짜 아는 건데 계산만 틀렸어!"<br>계산실수한 문항을 골라봐 (양심껏 🤫)</div>
    <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px;">${chips}</div>
    <button onclick="wHomerCalc()" style="width:100%;padding:11px;background:#f59e0b;color:white;border:none;border-radius:10px;font-size:13px;font-weight:800;cursor:pointer;font-family:'Noto Sans KR',sans-serif;">🤔 만약 다 맞았다면?</button>
    <div id="homer-result" style="margin-top:12px;"></div>
  </div>`;
}

function wHomerToggle(idx){
  const s=window._homerChecked;
  const btn=document.getElementById('hm-'+idx);
  if(s.has(idx)){ s.delete(idx); btn.style.background='var(--white)'; btn.style.color='var(--t2)'; btn.style.borderColor='var(--border)'; }
  else { s.add(idx); btn.style.background='#fbbf24'; btn.style.background='#fde68a'; btn.style.color='#7c2d12'; btn.style.borderColor='#f59e0b'; }
}

async function wHomerCalc(){
const __mvpEpoch=SessionGuard.capture();

  const sb=sbReady();
  const testId=window._homerTestId;
  const checked=window._homerChecked;
  // 내 실제 점수
  const { data:mine } = await SessionGuard.wait((sb.from('submissions').select('score').eq('test_id',testId).eq('user_id',_wuser.id).single()),__mvpEpoch);
  const myScore=mine.score;
  // 체크한 문항 배점 합 = 호머 보너스
  let bonus=0;
  window._homerWrong.forEach(w=>{ if(checked.has(w.idx)) bonus+=w.points; });
  const homerScore=myScore+bonus;
  // 호머 등수: 다른 사람은 실제 점수, 나만 homerScore로 가정
  const { data:allSubs } = await SessionGuard.wait((sb.from('submissions').select('user_id,score').eq('test_id',testId)),__mvpEpoch);
  let betterCount=0;
  (allSubs||[]).forEach(s=>{ if(s.user_id!==_wuser.id && s.score>homerScore) betterCount++; });
  const homerRank=betterCount+1;
  // 실제 등수
  let realBetter=0; (allSubs||[]).forEach(s=>{ if(s.user_id!==_wuser.id && s.score>myScore) realBetter++; });
  const realRank=realBetter+1;

  const res=document.getElementById('homer-result');
  const gain = realRank - homerRank;
  res.innerHTML = `
  <div style="background:white;border-radius:12px;padding:14px;text-align:center;border:1px dashed #f59e0b;">
    <div style="font-size:10px;color:#92400e;">🍩 호머의 상상 속 점수</div>
    <div style="font-family:'Space Mono',monospace;font-size:34px;font-weight:800;color:#f59e0b;margin:2px 0;">${homerScore}점</div>
    <div style="display:flex;justify-content:center;gap:16px;margin-top:8px;">
      <div><div style="font-size:9px;color:var(--t3);">실제</div><div style="font-size:14px;font-weight:700;color:var(--t2);">${myScore}점 · ${realRank}등</div></div>
      <div style="font-size:18px;align-self:center;">→</div>
      <div><div style="font-size:9px;color:var(--t3);">호머 세계</div><div style="font-size:14px;font-weight:700;color:#f59e0b;">${homerScore}점 · ${homerRank}등</div></div>
    </div>
    <div style="margin-top:10px;font-size:12px;font-weight:700;color:#7c2d12;">${bonus===0?'🍩 음... 체크를 안 했네?':(gain>0?`🚀 ${gain}계단이나 올라갔어! "거봐 내가 잘하잖아~"`:'🍩 점수는 올랐지만 등수는 그대로네 ㅎㅎ')}</div>
    <div style="font-size:9px;color:var(--t3);margin-top:8px;">⚠️ 이건 너만 보는 상상의 점수야. 실제 순위·메달엔 1도 영향 없음 😎</div>
  </div>`;
}

function wPick(q,n){
  if(!window._wAnswers) window._wAnswers=[];
  window._wAnswers[q]=String(n);
  document.querySelectorAll(`.omr-bubble[data-q="${q}"]`).forEach(b=>{
    b.classList.toggle('on', String(b.dataset.n)===String(n));
  });
}
function wTypeStudent(q,v){ if(!window._wAnswers)window._wAnswers=[]; window._wAnswers[q]=v; }


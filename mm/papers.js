import {fileLink} from './school.js';
let reader,writer;const docs=new Map();
async function pdfjs(){if(!reader)reader=import('./lib/pdf.mjs').then(m=>{m.GlobalWorkerOptions.workerSrc='/mm/lib/pdf.worker.mjs';return m});return reader}
async function pdflib(){if(!writer)writer=new Promise((ok,no)=>{const s=document.createElement('script');s.src='/mm/lib/pdf-lib.min.js';s.onload=()=>ok(window.PDFLib);s.onerror=no;document.head.append(s)});return writer}
export async function loadPdf(path,suppliedUrl){if(!docs.has(path))docs.set(path,(async()=>{const m=await pdfjs();return m.getDocument({url:suppliedUrl||await fileLink(path),isEvalSupported:false,useSystemFonts:true}).promise})().catch(e=>{docs.delete(path);throw e}));return docs.get(path)}
export function clearPdfs(){for(const doc of docs.values())doc.then(x=>x.destroy()).catch(()=>{});docs.clear()}
export async function drawCrop(canvas,pdf,n,box=[0,0,1,1],target=750){const page=await pdf.getPage(n),unit=page.getViewport({scale:1}),width=Math.max(.02,box[2]-box[0])*unit.width;
 const scale=Math.min(3,target/width),v=page.getViewport({scale});canvas.width=Math.ceil(width*scale);canvas.height=Math.max(1,Math.ceil((box[3]-box[1])*v.height));
 await page.render({canvasContext:canvas.getContext('2d'),canvas,viewport:v,transform:[1,0,0,1,-box[0]*v.width,-box[1]*v.height],background:'#fff'}).promise}
export async function original(canvas,r){if(!r.original?.box)throw Error('문항 원문 영역이 없습니다.');await drawCrop(canvas,await loadPdf(r.owner+'/'+r.exam+'/paper.pdf'),r.original.page,r.original.box)}
export function saveBlob(bytes,name){const url=URL.createObjectURL(new Blob([bytes],{type:'application/pdf'}));const a=Object.assign(document.createElement('a'),{href:url,download:name});a.click();setTimeout(()=>URL.revokeObjectURL(url),30000)}
export async function notebookPDF(rows){const {PDFDocument,rgb}=await pdflib(),out=await PDFDocument.create();let page,col=0,y=0;
 for(const row of rows){const canvas=document.createElement('canvas');await original(canvas,row);const image=await out.embedPng(canvas.toDataURL('image/png'));
  const h=Math.min(475,245*image.height/image.width),cell=Math.max(303,h+116);
  if(!page||y+cell>770){if(!page||col===1){page=out.addPage([595,842]);col=0;page.drawLine({start:{x:297,y:55},end:{x:297,y:800},thickness:.45,color:rgb(.84,.84,.82)})}else col=1;y=0}
  const x=col?315:34;page.drawImage(image,{x,y:800-y-h,width:Math.min(245,h*image.width/image.height),height:h});y+=cell;
 }return out.save()}

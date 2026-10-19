function renderLearning(){
 if(!AppSession.canOpen('learning'))return;
 const context=AppSession.context(),container=document.getElementById('learning-content');
 container.replaceChildren();
 const frame=document.createElement('iframe');frame.id='learning-frame';frame.title=context.role==='student'?'강의 영상과 숙제':'강의, 숙제 관리와 커뮤니티';
 const role=context.role==='student'?'student':'teacher';
 frame.src=context.mode==='server'?'./learning/#/':'./learning/?preview='+role+'#/';
 frame.allow='fullscreen';frame.setAttribute('referrerpolicy','no-referrer');container.append(frame);
}

window.addEventListener('message',event=>{
 const frame=document.getElementById('learning-frame');
 if(!frame||event.origin!==location.origin||event.source!==frame.contentWindow||event.data?.type!=='student-mvp:height')return;
 const h=event.data.height;if(Number.isFinite(h)&&h>0&&h<=20000)frame.style.height=Math.max(560,h+24)+'px';
});

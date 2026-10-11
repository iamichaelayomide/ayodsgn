export function installPolish(){
 const form=document.getElementById('task-form');let step=0;
 function show(n){step=Math.max(0,Math.min(2,n));form.querySelectorAll('[data-task-step]').forEach(s=>s.hidden=Number(s.dataset.taskStep)!==step);document.getElementById('task-step-label').textContent=`${step+1} of 3 · ${['The essentials','A little context','Optional extras'][step]}`;document.getElementById('task-back').hidden=step===0;document.getElementById('task-next').hidden=step===2;}
 document.getElementById('task-next').onclick=()=>{if(!form.elements.title.value.trim()){show(0);form.elements.title.reportValidity();return;}show(step+1);form.querySelector(`[data-task-step="${step}"] input:not([type=hidden]),[data-task-step="${step}"] textarea`)?.focus();};
 document.getElementById('task-back').onclick=()=>show(step-1);
 document.addEventListener('life:task-open',e=>{show(0);form.querySelector('.task-more').open=false;document.getElementById('task-attachments').hidden=!e.detail.existing;});
 form.addEventListener('invalid',e=>{const section=e.target.closest('[data-task-step]');if(section)show(Number(section.dataset.taskStep));const detail=e.target.closest('details');if(detail)detail.open=true;},true);
 const button=document.createElement('button');button.id='voice-preview';button.className='voice-fab';button.type='button';button.setAttribute('aria-label','Voice conversation preview');button.title='Voice conversation';button.innerHTML='<img src="./icons/microphone.svg" alt=""><span class="visually-hidden">Voice conversation</span>';
 document.getElementById('workspace').append(button);button.setAttribute('aria-label','Talk to Ramble');button.onclick=()=>{document.dispatchEvent(new Event('life:voice-open'));};
}

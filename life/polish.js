export function installPolish(){
 const form=document.getElementById('task-form');let step=0;
 function show(n){step=Math.max(0,Math.min(2,n));form.querySelectorAll('[data-task-step]').forEach(s=>s.hidden=Number(s.dataset.taskStep)!==step);document.getElementById('task-step-label').textContent=`${step+1} of 3 · ${['The essentials','A little context','Optional extras'][step]}`;document.getElementById('task-back').hidden=step===0;document.getElementById('task-next').hidden=step===2;}
 document.getElementById('task-next').onclick=()=>{if(!form.elements.title.value.trim()){show(0);form.elements.title.reportValidity();return;}show(step+1);form.querySelector(`[data-task-step="${step}"] input:not([type=hidden]),[data-task-step="${step}"] textarea`)?.focus();};
 document.getElementById('task-back').onclick=()=>show(step-1);
 document.addEventListener('life:task-open',e=>{show(0);form.querySelector('.task-more').open=false;document.getElementById('task-attachments').hidden=!e.detail.existing;});
 form.addEventListener('invalid',e=>{const section=e.target.closest('[data-task-step]');if(section)show(Number(section.dataset.taskStep));const detail=e.target.closest('details');if(detail)detail.open=true;},true);
 const picker=document.querySelector('.board-picker'),toolbar=document.querySelector('.toolbar');
 const options=document.createElement('details');options.className='board-options';options.innerHTML='<summary aria-label="Board options"><img class="action-icon" src="./icons/more.svg" alt=""></summary><div class="board-options-items"></div>';
 ['new-board','rename-board','new-list'].forEach(id=>options.querySelector('div').append(document.getElementById(id)));picker.append(document.getElementById('new-task'),options);
 const filters=document.createElement('details');filters.className='board-filter-options';filters.innerHTML='<summary><img class="action-icon" src="./icons/filter.svg" alt=""><span>Filters</span><span id="active-filter-count" hidden></span></summary><div></div>';
 ['priority-filter','label-filter'].forEach(id=>filters.querySelector('div').append(document.getElementById(id).closest('label')));toolbar.querySelector('.search').after(filters);
 const search=document.querySelector('.search-icon');const img=document.createElement('img');img.src='./icons/search-normal.svg';img.alt='';img.className='search-icon';search.replaceWith(img);
 document.querySelectorAll('.sidebar [title]').forEach(el=>{if(el.querySelector('.nav-label'))el.removeAttribute('title');});
 function filterCount(){const n=['priority-filter','label-filter'].filter(id=>document.getElementById(id).value).length;const b=document.getElementById('active-filter-count');b.hidden=!n;b.textContent=n;}
 toolbar.addEventListener('change',filterCount);toolbar.addEventListener('click',()=>queueMicrotask(filterCount));
 document.addEventListener('life:board-toolbar',()=>{filterCount();options.open=false;});
 options.querySelector('div').addEventListener('click',()=>options.open=false);
 document.addEventListener('keydown',e=>{if(e.key==='Escape'){options.open=false;filters.open=false;}});
 document.addEventListener('click',e=>{if(!options.contains(e.target))options.open=false;if(!filters.contains(e.target))filters.open=false;});
 const button=document.createElement('button');button.id='voice-preview';button.className='voice-fab';button.type='button';button.setAttribute('aria-label','Voice conversation preview');button.title='Voice conversation';button.innerHTML='<img src="./icons/microphone.svg" alt=""><span class="visually-hidden">Voice conversation</span>';
 document.getElementById('workspace').append(button);button.setAttribute('aria-label','Talk to Ramble');button.onclick=()=>{document.dispatchEvent(new Event('life:voice-open'));};
}

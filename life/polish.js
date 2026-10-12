export function installPolish(){
 const form=document.getElementById('task-form');const weekSwitch=document.querySelector('.week-switch');weekSwitch.classList.add('week-picker-line');document.getElementById('sprint-panel').before(weekSwitch);
 const sizeTitle=()=>{const title=form.elements.title;if(!document.getElementById('task-dialog').open)return;title.style.height='auto';title.style.height=Math.min(180,Math.max(60,title.scrollHeight))+'px';};form.elements.title.addEventListener('input',sizeTitle);document.addEventListener('life:task-open',()=>requestAnimationFrame(sizeTitle));window.addEventListener('resize',sizeTitle);
 const sections=[...form.querySelectorAll('[data-task-step]')];sections.forEach(s=>s.hidden=false);
 document.getElementById('task-step-label').hidden=true;form.querySelector('.task-step-actions').hidden=true;
 const actions=document.createElement('div');actions.className='task-detail-actions';sections[0].after(actions);
 const panels=document.createElement('div');panels.className='task-detail-panels';actions.after(panels);
 function panel(name,icon,nodes){const button=document.createElement('button');button.type='button';button.innerHTML=`<img class="action-icon" src="./icons/${icon}.svg" alt="">`;button.setAttribute('aria-label',name);button.title=name;button.setAttribute('aria-expanded','false');const area=document.createElement('section');area.hidden=true;area.id='task-panel-'+name.toLowerCase();button.setAttribute('aria-controls',area.id);nodes.filter(Boolean).forEach(n=>area.append(n));actions.append(button);panels.append(area);button.onclick=()=>{const open=area.hidden;area.hidden=!open;button.setAttribute('aria-expanded',String(open));};return area;}
 const field=name=>form.elements[name]?.closest('label');
 panel('Dates','calendar',[field('dueDate'),field('inSprint')]);
 const description=field('notes');description.classList.add('task-description');panels.before(description);const descriptionToggle=document.createElement('button');descriptionToggle.type='button';descriptionToggle.className='description-toggle';descriptionToggle.textContent='Add description';description.before(descriptionToggle);descriptionToggle.onclick=()=>{description.hidden=false;descriptionToggle.hidden=true;form.elements.notes.focus();};
 const checklist=panel('Checklist','tick-square',[form.querySelector('.checklist-heading'),document.getElementById('checklist')]);
 const files=document.createElement('section');files.className='task-existing-files';files.hidden=true;files.innerHTML='<h3>Attachments</h3>';files.append(document.getElementById('attachment-list'));panels.after(files);
 const attachments=panel('Attachment','attach-circle',[document.getElementById('task-attachments')]);
 const more=panel('More','more',[field('priority'),field('goalId'),field('effortMinutes'),field('labels'),field('blocker'),field('dependencies'),document.getElementById('archive-task')]);
 const completion=document.createElement('button');completion.type='button';completion.className='task-completion';completion.textContent='Mark done';field('listId').after(completion);completion.onclick=()=>document.dispatchEvent(new Event('life:complete-open-task'));
 const saveState=document.createElement('p');saveState.className='task-save-state';saveState.setAttribute('role','status');form.querySelector('.dialog-actions').before(saveState);
 form.addEventListener('input',()=>{saveState.textContent='Unsaved changes';});form.addEventListener('change',()=>{saveState.textContent='Unsaved changes';});
 form.addEventListener('submit',()=>{saveState.textContent='Saving…';});
 new MutationObserver(()=>{if(document.getElementById('task-error').textContent)saveState.textContent='Not saved · your changes are kept';}).observe(document.getElementById('task-error'),{childList:true,subtree:true,characterData:true});
 new MutationObserver(()=>{if(document.getElementById('attachment-list').querySelector('a')){files.hidden=false;}}).observe(document.getElementById('attachment-list'),{childList:true,subtree:true});
 sections.slice(1).forEach(s=>s.hidden=true);
 document.addEventListener('life:task-open',e=>{saveState.textContent='';completion.hidden=!e.detail.existing;completion.textContent=e.detail.done?'Reopen task':'Mark done';description.hidden=!e.detail.existing&&!form.elements.notes.value;descriptionToggle.hidden=!description.hidden;files.hidden=!document.getElementById('attachment-list').querySelector('a');panels.querySelectorAll(':scope>section').forEach(p=>p.hidden=true);actions.querySelectorAll('button').forEach(b=>b.setAttribute('aria-expanded','false'));document.getElementById('task-attachments').hidden=!e.detail.existing;attachments.querySelector('.new-attachment-note')?.remove();if(!e.detail.existing){const note=document.createElement('p');note.className='new-attachment-note';note.textContent='Save the task first, then attach a file.';attachments.append(note);}if(document.getElementById('checklist').children.length){checklist.hidden=false;actions.querySelector('[aria-controls="task-panel-checklist"]').setAttribute('aria-expanded','true');}});
 form.addEventListener('invalid',e=>{const area=e.target.closest('.task-detail-panels>section');if(area){area.hidden=false;actions.querySelector(`[aria-controls="${area.id}"]`)?.setAttribute('aria-expanded','true');}},true);
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

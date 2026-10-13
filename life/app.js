import {createTaskHistory} from './task-history.js?v=3';
import {installCardDrag} from './card-drag.js?v=1';
import {installEmailAuth} from './auth-entry.js?v=2';
import {createAccountSettings,plannerTimezone} from './accounts.js?v=44';
import {installUploadPolish} from './upload-polish.js?v=43';
import {installDateControls,chooseDate} from './date-controls.js?v=1';
import {createAnalytics} from './analytics.js?v=2';
import {installReminders} from './reminders.js?v=1';
import {installTaskEditor} from './task-editor.js?v=2';
import {installPolish} from './polish.js?v=43';
import {createCompanion} from './companion.js?v=48';
import {createThinking} from './thinking.js?v=5';
import {createRoutines} from './routines.js?v=3';
import {createAccountability} from './accountability.js?v=4';
import {emptyState} from './empty-states.js?v=2';
import {createGoals} from './goals.js?v=4';
import {installNavigation} from './navigation.js?v=2';
installNavigation();
import {createCalendar} from './calendar.js?v=43';
import {installSelects} from './selects.js?v=4';
const refreshSelects = installSelects();
const $ = (id) => document.getElementById(id);
let csrf = '', setup = false, data = null, view = 'board', selectedWeek = '', mobileList = '', saving = false, dragging = null, conflict = false;
let suspendedDialog = '', role='owner', selectedBoard='';
try{selectedBoard=localStorage.getItem('life.board')||'';}catch{}
const inviteParams=new URLSearchParams(location.search);let inviteToken=inviteParams.get('invite');const partnerId=inviteParams.get('partner');
const API = new URL('../api/life/',import.meta.url).pathname;
const order = (items) => [...items].sort((a,b) => a.position-b.position);
const activeLists = () => order(data.state.lists.filter(l => !l.archived&&(l.boardId||data.state.board.id)===selectedBoard));
const sprint = () => data.state.sprints[selectedWeek] || {goal:'',taskIds:[]};
const escape = (s) => String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function announce(message) { $('announcement').textContent=message; setTimeout(()=>{$('announcement').textContent='';},4000); }
function pageError(message) { $('page-error').textContent=message; $('page-error').hidden=!message; }
async function request(action, body) {
  let response;
  try { response = await fetch(`${API}?action=${action}`,{method:body?'POST':'GET',credentials:'same-origin',cache:'no-store',headers:body?{'Content-Type':'application/json','X-CSRF-Token':csrf}:{},body:body?JSON.stringify(body):undefined}); }
  catch { throw new Error('Connection interrupted. Your draft is still here. Please retry.'); }
  let result;
  try { result=await response.json(); } catch { throw new Error('The server could not respond. Your draft is preserved.'); }
  if (!response.ok) {
    const error=new Error(result.error || 'The request could not be completed.'); error.status=response.status;
    if (response.status===409 && action==='mutate') { conflict=true; document.querySelectorAll('#reload,[data-reload]').forEach(b=>b.hidden=false); }
    if (response.status===401 && action!=='login') { const openDialog=document.querySelector('dialog[open]'); if(openDialog){suspendedDialog=openDialog.id;openDialog.close();} const session=await request('session');csrf=session.csrf; $('workspace').hidden=true; $('auth').hidden=false; $('auth-copy').textContent='Your session ended. Sign in again to continue; your open draft is preserved.'; }
    throw error;
  }
  return result;
}
async function mutate(action,args) {
  if(args.id&&[...document.querySelectorAll('dialog[open]')].some(d=>d.dataset.aiChanged===args.id))throw Error('Ramble changed this record while your draft was open. Your draft is preserved. Copy it if needed, then close and reopen the record before saving.');
  if (saving) throw new Error('Another change is saving. Please wait.');
  if (conflict) throw new Error('Load the latest board before saving. Your open draft will stay intact.');
  saving=true; $('save-status').textContent='Saving…'; document.body.classList.add('saving');
  try {
    data=await request('mutate',{version:data.version,action,args}); render(); pageError(''); $('save-status').textContent='All changes saved'; return data;
  } catch(e) { $('save-status').textContent='Changes not saved'; pageError(e.message); throw e; }
  finally { saving=false; document.body.classList.remove('saving'); }
}
async function loadBoard() {
  data=await request('board'); selectedWeek ||= data.week; conflict=false;selectedBoard=(data.state.boards||[data.state.board]).some(b=>b.id===selectedBoard&&!b.archived)?selectedBoard:(data.state.boards||[data.state.board]).find(b=>!b.archived)?.id; document.querySelectorAll('#reload,[data-reload]').forEach(b=>b.hidden=true);
  $('auth').hidden=true; $('workspace').hidden=false; if(role==='owner'&&data.state.lists.some(l=>!l.archived&&l.name==='Inbox'))await mutate('board.refine',{}); if(role==='owner'&&(data.state.routines||[]).some(r=>!r.archived&&r.nextDate<=today()))await mutate('routine.generate',{});render();document.dispatchEvent(new Event('life:reminders-ready')); if(suspendedDialog){$(suspendedDialog).showModal();suspendedDialog='';}
}
const accountSettings=createAccountSettings({request});
const emailAuth=installEmailAuth({request,onAuthenticated:()=>start()});
async function start() {
  try {
    let session=await request('session'); csrf=session.csrf;
    accountSettings.refresh(session);emailAuth.refresh(session);setup=session.setupRequired;role=session.role||'owner';document.body.classList.toggle('partner-mode',role==='partner');
    $('setup-label').hidden=!setup; $('auth-submit').disabled=false; $('auth-submit').textContent=setup?'Create my private planner':'Sign in';
    if(setup&&new URLSearchParams(location.search).get('owner-access')==='1')$('auth-copy').textContent='Enter your one-time setup key and choose a passphrase of at least 14 characters.';
    $('auth-form').elements.password.autocomplete=setup?'new-password':'current-password';
    if(inviteToken||partnerId){$('auth-error').textContent='Accountability invitations are paused. Sign in with Google to use your own planner.';}
    if (session.authenticated) await loadBoard();
  } catch(e) { $('auth-error').textContent=e.message; $('auth-submit').textContent='Unavailable'; }
}
$('auth-form').addEventListener('submit',async(e)=>{
  e.preventDefault(); const form=e.currentTarget; $('auth-error').textContent=''; $('auth-submit').disabled=true;
  try { if(!$('policy-accept').checked)throw Error('Please agree to the Privacy Policy and Terms to continue.');const result=await request(inviteToken?'partner.accept':setup?'setup':'login',{password:form.elements.password.value,token:inviteToken||form.elements.token.value,id:partnerId,partnerId:form.elements.partnerId.value,policyAccepted:true,privacyVersion:$('policy-privacy-version').value,termsVersion:$('policy-terms-version').value}); csrf=result.csrf;role=result.role||'owner';document.body.classList.toggle('partner-mode',role==='partner');if(inviteToken){history.replaceState(null,'',location.pathname+'?partner='+partnerId);inviteToken=null;}setup=false; form.reset(); await loadBoard(); }
  catch(e) { $('auth-error').textContent=e.message; }
  finally { $('auth-submit').disabled=false; }
});
$('logout').addEventListener('click',async()=>{
  try { await request('logout',{}); data=null; $('workspace').hidden=true; $('auth').hidden=false; document.querySelectorAll('dialog[open]').forEach(d=>d.close()); $('email-auth-form').reset(); $('task-form').reset(); $('sprint-goal').value=''; await start(); }
  catch(e) { pageError(e.message); }
});
function matches(task) {
  const search=$('search').value.toLowerCase().trim(), priority=$('priority-filter').value, label=$('label-filter').value;
  return (!search || `${task.title} ${task.notes} ${task.labels.join(' ')} ${task.blocker}`.toLowerCase().includes(search)) && (!priority || task.priority===priority) && (!label || task.labels.includes(label));
}
function dayLabel(value) {
  return new Date(`${value}T12:00:00+01:00`).toLocaleDateString('en-GB',{day:'numeric',month:'short',timeZone:plannerTimezone()});
}
function today() { return new Intl.DateTimeFormat('en-CA',{timeZone:plannerTimezone(),year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date()); }
function taskCard(task) {
  const complete=task.checklist.filter(c=>c.done).length;
  return `<div class="task-shell" data-color="${escape(task.color||'pink')}"><button type="button" class="drag-handle" data-drag-task="${task.id}" aria-label="Drag task: ${escape(task.title)}" title="Drag to move"><img src="./icons/grip-vertical.svg" alt=""></button><button class="task-card" data-task="${task.id}" draggable="false" aria-label="Open task: ${escape(task.title)}"><span class="card-labels">${task.labels.map(l=>`<span class="tag">${escape(l)}</span>`).join('')}</span><strong data-rename-task="${task.id}" title="Double-click to rename">${escape(task.title)}</strong>${(task.dependencies||[]).length?`<span class="blocked-note">${task.dependencies.filter(id=>{const t=data.state.tasks.find(t=>t.id===id);return t&&!data.state.lists.find(l=>l.id===t.listId)?.isDone;}).length} unfinished dependencies</span>`:''}${task.blocker?`<span class="blocked-note">Blocked: ${escape(task.blocker)}</span>`:''}<span class="card-meta"><span class="priority ${task.priority}">${escape(task.priority)} priority</span>${task.dueDate?`<span class="due ${task.dueDate<today()?'overdue':''}">${task.dueDate<today()?'Overdue · ':''}${dayLabel(task.dueDate)}</span>`:''}${task.checklist.length?`<span class="check-progress">${complete}/${task.checklist.length} done</span>`:''}</span></button>${task.checklist.length?`<div class="card-checklist">${task.checklist.map(c=>`<label class="card-check"><input type="checkbox" data-check-task="${task.id}" data-check-item="${c.id}" ${role==='partner'?'disabled':''} ${c.done?'checked':''}><span>${escape(c.text)}</span></label>`).join('')}</div>`:''}</div>`;
}
const planning = createCalendar({getData:()=>data,today,mutate,openTask,refreshSelects,escape});
const routines=createRoutines({getData:()=>data,mutate,escape,refreshSelects,today});
const accountability=createAccountability({getData:()=>data,request,mutate,escape,role:()=>role});
const goals=createGoals({getData:()=>data,mutate,escape,refreshSelects,week:()=>selectedWeek});
const thinking=createThinking({getData:()=>data,mutate,escape,refreshSelects,role:()=>role,openTask,week:()=>selectedWeek});
installPolish();installDateControls({refreshSelects});installTaskEditor({request,refreshSelects});installUploadPolish();installReminders({request,openTask,isOwner:()=>role==='owner'&&!!data});
const analytics=createAnalytics({getData:()=>data,escape,week:()=>data.week,openGoal:id=>goals.open(id)});
const companion=createCompanion({request,escape,uploadAudio:async file=>{const body=new FormData();body.append("audio",file);const response=await fetch(API+"?action=ai.audio",{method:"POST",credentials:"same-origin",headers:{"X-CSRF-Token":csrf},body});const result=await response.json();if(!response.ok)throw new Error(result.error||"Audio could not be transcribed.");return result;},sendStream:async(args,onPartial)=>{const response=await fetch(API+'?action=ai.send.stream',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json','X-CSRF-Token':csrf},body:JSON.stringify(args)});if(!response.ok){const err=await response.json();throw Error(err.error||'Ramble could not respond.');}const reader=response.body.getReader(),decoder=new TextDecoder();let pending='',result;while(true){const chunk=await reader.read();pending+=decoder.decode(chunk.value||new Uint8Array(),{stream:!chunk.done});let pos;while((pos=pending.indexOf('\n'))>=0){const line=pending.slice(0,pos);pending=pending.slice(pos+1);if(!line.trim())continue;const event=JSON.parse(line);if(event.error)throw Error(event.error);if(event.partial)onPartial(event.partial);if(event.result)result=event.result;}if(chunk.done)break;}if(!result)throw Error('Connection interrupted. Your draft is preserved.');return result;},getBoard:()=>data,getScreen:()=>({view,boardId:selectedBoard,taskId:$('task-dialog').open?$('task-form').elements.id.value:'',goalId:$('goal-dialog').open?$('goal-form').elements.id.value:'',mapGroup:$('map-group')?.value||''}),refreshSelects,role:()=>role,reloadBoard:async()=>{const scroll=window.scrollY,boardScroll=$('board').scrollLeft,previous=data;const drafts=[...document.querySelectorAll('dialog[open]')].map(d=>({dialog:d,id:d.querySelector('[name=id]')?.value}));await loadBoard();for(const draft of drafts){if(!draft.id)continue;const find=s=>['tasks','goals','notes','mapNodes'].flatMap(k=>s[k]||[]).find(r=>r.id===draft.id);if(JSON.stringify(find(previous.state))!==JSON.stringify(find(data.state))){draft.dialog.dataset.aiChanged=draft.id;let note=draft.dialog.querySelector('.ai-draft-warning');if(!note){note=document.createElement('p');note.className='error ai-draft-warning';note.setAttribute('role','alert');draft.dialog.prepend(note);}note.textContent='Ramble updated this record. Your open draft is preserved. Close and reopen to see the saved changes.';draft.dialog.addEventListener('close',()=>{delete draft.dialog.dataset.aiChanged;note.remove();},{once:true});}}$('board').scrollLeft=boardScroll;window.scrollTo(0,scroll);},openSource:(type,id)=>{if(type==='tasks'){openTask(id);return;}view=type==='goals'?'goals':type==='mapNodes'?'mindmap':'notes';render();if(type==='goals')goals.open(id);else thinking.open(type,id);}});
const taskHistory=createTaskHistory({root:$('task-history'),request,escape,getData:()=>data,mutate});
function render() {
 $('task-history').hidden=view!=='task-history';
 if(view==='task-history'){for(const id of ['board','archive','routines','accountability','goals','planning','thinking','companion','analytics','sprint-panel','board-footnote','new-task'])$(id).hidden=true;document.querySelector('.toolbar').hidden=true;document.querySelector('.board-picker').hidden=true;document.querySelector('.week-picker-line').hidden=true;$('workspace').dataset.view=view;$('workspace').classList.remove('ramble-view');$('breadcrumb').textContent='History';$('page-title').textContent='History';$('page-description').textContent='Your completed, blocked and archived tasks and goals.';document.querySelectorAll('[data-view]').forEach(b=>{if(b.dataset.view===view)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');});taskHistory.render();return;}
 if(data&&!data.state.boards.some(b=>b.id===selectedBoard&&!b.archived))selectedBoard=data.state.boards.find(b=>!b.archived)?.id;
 document.querySelector('.week-picker-line').hidden=view!=='week';
 $('analytics').hidden=view!=='analytics';
 $('workspace').dataset.view=view;const newTask=$('new-task');newTask.hidden=['today','goals','analytics','companion','calendar','routines','week'].includes(view);(view==='board'?document.querySelector('.board-picker'):document.querySelector('.page-heading')).append(newTask);
 document.dispatchEvent(new Event('life:board-toolbar'));
 $('workspace').classList.toggle('ramble-view',view==='companion');
 $('companion').hidden=view!=='companion';if(view==='companion'){for(const id of ['board','archive','routines','accountability','goals','planning','thinking','sprint-panel','board-footnote'])$(id).hidden=true;document.querySelector('.toolbar').hidden=true;document.querySelector('.board-picker').hidden=true;$('breadcrumb').textContent='Ramble';$('page-title').innerHTML='A little <em>clarity.</em>';$('page-description').textContent='Think it through. Find a direction. Choose your next step.';document.querySelectorAll('[data-view]').forEach(b=>{if(b.dataset.view===view)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');});companion.render();return;}

 if(view==='analytics'){for(const id of ['board','archive','routines','accountability','goals','planning','thinking','sprint-panel','board-footnote'])$(id).hidden=true;document.querySelector('.toolbar').hidden=true;document.querySelector('.board-picker').hidden=true;$('breadcrumb').textContent='Analytics';$('page-title').textContent='See your progress.';$('page-description').textContent='Keep track of the goals you are working towards.';document.querySelectorAll('[data-view]').forEach(b=>{if(b.dataset.view===view)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');});analytics.render();return;}
 $('thinking').hidden=!['notes','mindmap','templates','history'].includes(view);
 if(!$('thinking').hidden){for(const id of ['board','archive','routines','accountability','goals','planning','sprint-panel','board-footnote'])$(id).hidden=true;document.querySelector('.toolbar').hidden=true;document.querySelector('.board-picker').hidden=true;$('breadcrumb').textContent={notes:'Thoughts',mindmap:'Mind map',templates:'Templates',history:'Activity'}[view];$('page-title').textContent={notes:'Room to think.',mindmap:'Connect your thinking.',templates:'Your rhythm, repeated.',history:'Every step counts.'}[view];$('page-description').textContent='Your ideas, plans and progress, all in one place.';document.querySelectorAll('[data-view]').forEach(b=>{if(b.dataset.view===view)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');});thinking.render(view);return;}

  $('board-select').innerHTML=(data.state.boards||[data.state.board]).filter(b=>!b.archived).map(b=>`<option value="${b.id}">${escape(b.name)}</option>`).join('');$('board-select').value=selectedBoard;document.querySelector('.board-picker').hidden=!['board','week','archive'].includes(view);$('routines').hidden=view!=='routines';
  if(view==='routines'){$('goals').hidden=true;$('accountability').hidden=true;$('planning').hidden=true;document.querySelector('.toolbar').hidden=true;$('board').hidden=true;$('archive').hidden=true;$('sprint-panel').hidden=true;$('board-footnote').hidden=true;$('breadcrumb').textContent='Routines';$('page-title').innerHTML='Build your <em>rhythm.</em>';$('page-description').textContent='Make the important things a little easier to repeat.';document.querySelectorAll('[data-view]').forEach(b=>{if(b.dataset.view===view)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');});routines.render();return;}
  $('accountability').hidden=view!=='accountability';
  if(view==='accountability'){$('goals').hidden=true;$('planning').hidden=true;document.querySelector('.toolbar').hidden=true;$('board').hidden=true;$('archive').hidden=true;$('sprint-panel').hidden=true;$('board-footnote').hidden=true;$('breadcrumb').textContent='Accountability';$('page-title').innerHTML='Better, <em>together.</em>';$('page-description').textContent='A trusted perspective. A little encouragement. Shared progress.';document.querySelectorAll('[data-view]').forEach(b=>{if(b.dataset.view===view)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');});accountability.render();return;}
  $('goals').hidden=view!=='goals';
  if(view==='goals'){$('planning').hidden=true;document.querySelector('.toolbar').hidden=true;$('board').hidden=true;$('archive').hidden=true;$('sprint-panel').hidden=true;$('board-footnote').hidden=true;$('breadcrumb').textContent='Goals';$('page-title').innerHTML='Keep your <em>big picture.</em>';$('page-description').textContent='Give your quarter a direction. Turn it into smaller, meaningful steps.';document.querySelectorAll('[data-view]').forEach(b=>{if(b.dataset.view===view)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');});goals.render();return;}
  const isPlanning=view==='today'||view==='calendar';
  $('planning').hidden=!isPlanning;
  document.querySelector('.toolbar').hidden=isPlanning;
  if(isPlanning){
    $('board').hidden=true;$('archive').hidden=true;$('sprint-panel').hidden=true;$('board-footnote').hidden=true;
    $('breadcrumb').textContent=view==='today'?'Today':'Calendar';
    $('page-title').innerHTML=view==='today'?'Make today <em>count.</em>':'Make room for <em>your plans.</em>';
    $('page-description').textContent=view==='today'?'A simple checklist for today. Small steps count, whether linked to a goal or ad hoc.':'Plan time separately from deadlines. Your board and calendar share the same tasks.';
    document.querySelectorAll('[data-view]').forEach(b=>{if(b.dataset.view===view)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');});
    planning.render(view);return;
  }
  const lists=activeLists(), selectedLabel=$('label-filter').value;
  $('label-filter').innerHTML='<option value="">All labels</option>'+[...new Set(data.state.tasks.filter(t=>!t.archived).flatMap(t=>t.labels))].sort().map(l=>`<option value="${escape(l)}">${escape(l)}</option>`).join(''); $('label-filter').value=selectedLabel;
  if (!lists.some(l=>l.id===mobileList)) mobileList=lists[0]?.id;
  $('mobile-list').innerHTML=lists.map(l=>`<option value="${l.id}">${escape(l.name)}</option>`).join(''); $('mobile-list').value=mobileList;
  const inWeek=new Set(sprint().taskIds);
  const tasks=order(data.state.tasks.filter(t=>!t.archived && lists.some(l=>l.id===t.listId) && matches(t) && (view!=='week' || inWeek.has(t.id))));
  $('task-count').textContent=`${tasks.length} task${tasks.length===1?'':'s'}`;
  $('clear-filters').hidden=!($('search').value || $('priority-filter').value || $('label-filter').value);
  $('board').hidden=view==='archive'; $('archive').hidden=view!=='archive'; $('sprint-panel').hidden=view!=='week'; $('new-list').hidden=view!=='board'; $('board-footnote').hidden=view==='archive';
  $('page-title').textContent=['board','week'].includes(view)?data.state.boards.find(b=>b.id===selectedBoard)?.name||'My board':'Your archive';
  $('breadcrumb').textContent=view==='board'?'My board':view==='week'?'This week':'Archive';
  $('page-description').textContent=view==='board'?'Capture the thought. Take the next step. Keep the bigger picture close.':view==='week'?'A clear goal, a considered shortlist, and space to make progress.':'Lists, tasks and thoughts. Restore whenever you’re ready.';
  document.querySelectorAll('[data-view]').forEach(b=>{ if(b.dataset.view===view)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current'); });
  if(view==='archive') { renderArchive(); refreshSelects(); return; }
  $('board').innerHTML=lists.map((list,index)=>{
    const cards=tasks.filter(t=>t.listId===list.id);
    return `<section class="column ${list.id!==mobileList?'mobile-hidden':''}" data-list="${list.id}" aria-label="${escape(list.name)} list"><div class="column-header"><h2><button class="list-title" data-list-edit="${list.id}" title="Rename list">${escape(list.name==='Inbox'?'Idea Box':list.name)}</button></h2><div class="column-actions"><span class="column-count">${cards.length}</span>${!list.isDone?`<button data-list-archive="${list.id}" aria-label="Archive ${escape(list.name)}" title="Archive list"><img src="./icons/archive.svg" alt="" class="action-icon"></button>`:''}</div></div><div class="cards">${cards.length?cards.map(taskCard).join(''):`<div class="empty-column"><img src="./ideas-empty.png" alt="" width="110" height="90"><p>${cards.length===0&&data.state.tasks.some(t=>!t.archived&&t.listId===list.id)?'No tasks match these filters.':(list.name==='Inbox'||list.name==='Idea Box')?'Drop a thought.<br>Make space for what could be.':list.isDone?'A little space to celebrate progress.':list.name==='Review'?'Make room for a fresh perspective.':list.name==='Blocked'?'A space to untangle what is in the way.':'A little space for your next step.'}</p></div>`}</div><form class="quick-add" data-quick-list="${list.id}"><input name="title" aria-label="Add to ${escape(list.name==='Inbox'?'Idea Box':list.name)}" maxlength="200" required placeholder="${(list.name==='Inbox'||list.name==='Idea Box')?'Drop an idea…':'Add a task…'}"><button aria-label="Add card" type="submit">+</button></form></section>`;
  }).join('');
  refreshSelects();
  if(view==='week') {
    // Keep a goal draft intact when unrelated tasks are saved.
    if(document.activeElement!==$('sprint-goal') && !$('sprint-goal').dataset.dirty) $('sprint-goal').value=sprint().goal;
    const end=new Date(`${selectedWeek}T12:00:00+01:00`); end.setUTCDate(end.getUTCDate()+6);
    $('week-range').textContent=`${dayLabel(selectedWeek)} – ${end.toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric',timeZone:plannerTimezone()})}`;
    const selected=data.state.tasks.filter(t=>inWeek.has(t.id)); const done=selected.filter(t=>data.state.lists.find(l=>l.id===t.listId)?.isDone).length;
    if(document.activeElement!==$('week-capacity'))$('week-capacity').value=(sprint().capacityMinutes||0)/60;const effort=selected.reduce((sum,t)=>sum+(t.effortMinutes||0),0),capacity=sprint().capacityMinutes||0;$('capacity-summary').textContent=`${(effort/60).toFixed(1)} hours estimated / ${(capacity/60).toFixed(1)} hours available${capacity&&effort>capacity?' · Over capacity':''}${selected.filter(t=>!t.effortMinutes).length?' · '+selected.filter(t=>!t.effortMinutes).length+' tasks need estimates':''}`;
    $('sprint-progress').textContent=selected.length?`${Math.round(done/selected.length*100)}% · ${done} of ${selected.length} tasks done`:'Choose a few tasks for your week.';
  }
}
function renderArchive() {
 const lists=data.state.lists.filter(l=>l.archived),tasks=data.state.tasks.filter(t=>t.archived&&(t.title+' '+t.notes).toLowerCase().includes($('search').value.toLowerCase())),notes=(data.state.notes||[]).filter(n=>n.archived&&n.title.toLowerCase().includes($('search').value.toLowerCase())),archivedGoals=(data.state.goals||[]).filter(g=>g.archived&&g.title.toLowerCase().includes($('search').value.toLowerCase()));
 const available=order(data.state.lists.filter(l=>!l.archived));
 $('task-count').textContent=`${data.state.boards.filter(b=>b.archived).length+lists.length+tasks.length+notes.length+archivedGoals.length} archived items`;
 const section=(title,items)=>items.length?`<section class="archive-section"><h2>${title}<span>${items.length}</span></h2>${items.join('')}</section>`:'';
 $('archive').innerHTML=section('Boards',data.state.boards.filter(b=>b.archived).map(b=>`<div class="archive-row"><strong>${escape(b.name)}</strong><button data-board-restore="${b.id}">Restore board</button></div>`))+section('Lists',lists.map(l=>`<div class="archive-row"><span class="archive-kind"><img class="action-icon" src="./icons/archive.svg" alt=""></span><strong>${escape(l.name)}</strong><button data-list-restore="${l.id}">Restore</button></div>`))+section('Tasks',tasks.map(t=>`<div class="archive-row"><span class="archive-kind">Task</span><strong>${escape(t.title)}</strong><select aria-label="Restore list for ${escape(t.title)}" data-restore-list="${t.id}">${available.map(l=>`<option value="${l.id}" ${l.id===t.listId?'selected':''}>${escape(l.name)}</option>`).join('')}</select><button data-task-restore="${t.id}" ${available.length?'':'disabled'}>Restore</button></div>`))+section('Thoughts',notes.map(n=>`<div class="archive-row"><span class="archive-kind">${n.kind==='idea'?'Idea':'Note'}</span><strong>${escape(n.title)}</strong><button data-note-restore="${n.id}">Restore</button></div>`))+section('Goals',archivedGoals.map(g=>`<div class="archive-row"><span class="archive-kind">Goal</span><strong>${escape(g.title)}</strong><button data-goal-restore="${g.id}">Restore</button></div>`))||emptyState('archive','Nothing archived yet. Your saved work will be here when you need it.');
}

function checklistRow(item={text:'',done:false,id:''}) {
  const row=document.createElement('div');row.className='check-row';row.dataset.id=item.id||'';
  row.innerHTML=`<input type="checkbox" aria-label="Checklist item completed" ${item.done?'checked':''}><input type="text" aria-label="Checklist item text" maxlength="300" value="${escape(item.text)}" required><button type="button" aria-label="Remove checklist item" title="Delete checklist item"><img class="action-icon" src="./icons/trash.svg" alt=""></button>`;
  row.querySelector('button').addEventListener('click',()=>row.remove());$('checklist').append(row);return row;
}
function openTask(id='',listId='') {
  const task=data.state.tasks.find(t=>t.id===id), form=$('task-form'); form.reset();$('task-error').textContent='';$('checklist').replaceChildren();
  $('attachment-list').innerHTML=(data.state.attachments||[]).filter(a=>!a.archived&&a.taskId===id).map(a=>`<p><a href="${API}?action=attachment&id=${a.id}">${escape(a.name)}</a></p>`).join('')||'<p>No attachments yet.</p>';$('upload-attachment').disabled=!id||role==='partner';
  form.elements.listId.innerHTML=order(data.state.lists.filter(l=>!l.archived)).map(l=>`<option value="${l.id}">${escape((data.state.boards.find(b=>b.id===(l.boardId||data.state.board.id))?.name||'')+' · '+l.name)}</option>`).join('');
  for(const key of ['id','title','notes','blocker','priority','dueDate'])form.elements[key].value=task?.[key]??(key==='priority'?'normal':'');
  form.elements.listId.value=task?.listId||listId||mobileList||activeLists()[0].id;
  const peers=order(data.state.tasks.filter(t=>!t.archived&&t.listId===form.elements.listId.value));form.elements.position.value=task?peers.findIndex(t=>t.id===task.id)+1:peers.length+1;
  form.elements.dependencies.innerHTML=data.state.tasks.filter(t=>!t.archived&&t.id!==id).map(t=>`<option value="${t.id}" ${(task?.dependencies||[]).includes(t.id)?'selected':''}>${escape(t.title)}</option>`).join('');
  form.elements.labels.value=task?.labels.join(', ')||'';form.elements.inSprint.checked=task?sprint().taskIds.includes(task.id):view==='week';
  form.elements.goalId.innerHTML='<option value="">Ad hoc — no linked goal</option>'+(data.state.goals||[]).filter(g=>!g.archived).map(g=>`<option value="${g.id}">${escape(g.title)} · ${escape(g.period||'Ad hoc')}</option>`).join('');form.elements.goalId.value=task?.goalId||'';form.elements.effortMinutes.value=task?.effortMinutes||0;task?.checklist.forEach(checklistRow);$('archive-task').hidden=!task;$('task-dialog-title').textContent=task?'Your next step':'New task';refreshSelects();$('task-form').querySelectorAll('input,textarea,select,button').forEach(el=>{if(!el.hasAttribute('data-close'))el.disabled=role==='partner';});if(role==='partner')form.querySelector('.task-completion').disabled=false;document.dispatchEvent(new CustomEvent('life:task-open',{detail:{task,existing:!!id,done:!!data.state.lists.find(l=>l.id===task?.listId)?.isDone,accountability:!!data.state.accountabilityEnabled}}));$('task-dialog').showModal();form.elements.title.focus();
}
function openList(id='') {
  const list=data.state.lists.find(l=>l.id===id),form=$('list-form');form.reset();form.elements.id.value=id;form.elements.name.value=list?.name||'';
  $('list-error').textContent='';$('list-dialog-title').textContent=list?'Rename list':'Add list';$('list-dialog').showModal();form.elements.name.focus();
}
async function confirmArchive(action,id) {
  const d=$('confirm-dialog'); d.showModal();
  const answer=await new Promise(resolve=>{
    const yes=()=>{cleanup();d.close();resolve(true);},no=()=>{cleanup();d.close();resolve(false);};
    const cancel=(e)=>{e.preventDefault();no();};
    function cleanup(){$('confirm-yes').removeEventListener('click',yes);$('confirm-cancel').removeEventListener('click',no);d.removeEventListener('cancel',cancel);}
    $('confirm-yes').addEventListener('click',yes);$('confirm-cancel').addEventListener('click',no);d.addEventListener('cancel',cancel);
  });
  if(answer) await mutate(action,{id});return answer;
}
document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>{view=b.dataset.view;render();}));
['search','priority-filter','label-filter'].forEach(id=>$(id).addEventListener(id==='search'?'input':'change',render));
$('mobile-list').addEventListener('change',()=>{mobileList=$('mobile-list').value;render();document.querySelector(`[data-list="${mobileList}"]`)?.scrollIntoView({behavior:'smooth',block:'nearest',inline:'start'});});
$('clear-filters').addEventListener('click',()=>{['search','priority-filter','label-filter'].forEach(id=>$(id).value='');render();});
$('new-task').addEventListener('click',()=>openTask());$('new-list').addEventListener('click',()=>openList());
$('add-checklist').addEventListener('click',()=>checklistRow().querySelector('input[type=text]').focus());
document.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',()=>b.closest('dialog').close()));
document.addEventListener('life:complete-open-task',async()=>{const f=$('task-form'),task=data.state.tasks.find(t=>t.id===f.elements.id.value),current=data.state.lists.find(l=>l.id===task?.listId);if(role==='owner'){const target=data.state.lists.find(l=>!l.archived&&(l.boardId||data.state.board.id)===(current?.boardId||data.state.board.id)&&l.isDone===!current?.isDone);if(!target){$('task-error').textContent='No destination list is available.';return;}f.elements.listId.value=target.id;refreshSelects();f.requestSubmit();return;}try{await mutate('task.complete',{id:f.elements.id.value,done:!current?.isDone});$('task-dialog').close();announce(current?.isDone?'Task reopened':'Task marked done');}catch(e){$('task-error').textContent=e.message;}});
$('task-form').addEventListener('submit',async(e)=>{
  e.preventDefault();const f=e.currentTarget,submit=f.querySelector('[type=submit]');$('task-error').textContent='';submit.disabled=true;
  const args={};for(const key of ['id','title','notes','blocker','priority','dueDate','listId','goalId'])args[key]=f.elements[key].value;
  args.color=f.elements.color.value;args.notesDelta=JSON.parse(f.dataset.notesDelta||'null');args.dueTime=f.elements.dueTime.value;args.reminderMinutes=f.elements.reminderMinutes.value===''?null:Number(f.elements.reminderMinutes.value);
  args.labels=f.elements.labels.value.split(',').map(l=>l.trim()).filter(Boolean);
  args.checklist=[...$('checklist').children].map(row=>({id:row.dataset.id,text:row.querySelector('[type=text]').value,done:row.querySelector('[type=checkbox]').checked}));
  args.sprintWeek=selectedWeek;args.inSprint=f.elements.inSprint.checked;
  args.position=Number(f.elements.position.value)-1;args.effortMinutes=Number(f.elements.effortMinutes.value);
  try {await mutate('task.save',args);const saved=args.id||data.state.tasks.at(-1).id;f.elements.id.value=saved;await mutate('task.dependencies',{id:saved,ids:[...f.elements.dependencies.selectedOptions].map(o=>o.value)});$('task-dialog').close();announce('Task saved');}catch(e){$('task-error').textContent=e.message;}finally{submit.disabled=false;}
});
$('list-form').addEventListener('submit',async(e)=>{e.preventDefault();const f=e.currentTarget,button=f.querySelector('[type=submit]');button.disabled=true;try{await mutate('list.save',{id:f.elements.id.value,name:f.elements.name.value,boardId:selectedBoard});$('list-dialog').close();}catch(e){$('list-error').textContent=e.message;}finally{button.disabled=false;}});
$('archive-task').addEventListener('click',async()=>{try{if(await confirmArchive('task.archive',$('task-form').elements.id.value))$('task-dialog').close();}catch(e){$('task-error').textContent=e.message;}});
let cardOpenTimer;
document.addEventListener('click',async(e)=>{
  const b=e.target.closest('button');if(!b||!data)return;
  try{
    if(b.dataset.boardRestore){await mutate('board.restore',{id:b.dataset.boardRestore});}
    else if(b.dataset.task){if(e.detail>1)return;clearTimeout(cardOpenTimer);cardOpenTimer=setTimeout(()=>openTask(b.dataset.task),280);}
    else if(b.dataset.addTask)openTask('',b.dataset.addTask);
    else if(b.dataset.listEdit)openList(b.dataset.listEdit);
    else if(b.dataset.listMove)await mutate('list.move',{id:b.dataset.listMove,position:Number(b.dataset.position)});
    else if(b.dataset.listArchive)await confirmArchive('list.archive',b.dataset.listArchive);
    else if(b.dataset.goalRestore)await mutate('goal.restore',{id:b.dataset.goalRestore});else if(b.dataset.noteRestore)await mutate('note.restore',{id:b.dataset.noteRestore});
    else if(b.dataset.listRestore)await mutate('list.restore',{id:b.dataset.listRestore});
    else if(b.dataset.taskRestore){const id=b.dataset.taskRestore;await mutate('task.restore',{id,listId:document.querySelector(`[data-restore-list="${id}"]`).value});}
  }catch(e){pageError(e.message);}
});
function changeWeek(offset) {const d=new Date(`${selectedWeek}T12:00:00+01:00`);d.setUTCDate(d.getUTCDate()+offset);selectedWeek=d.toISOString().slice(0,10);delete $('sprint-goal').dataset.dirty;render();}
$('previous-week').addEventListener('click',()=>changeWeek(-7));$('next-week').addEventListener('click',()=>changeWeek(7));
$('week-range').onclick=()=>chooseDate({value:selectedWeek,title:'Choose a week',onSelect:value=>{if($('sprint-goal').dataset.dirty){pageError('Save your weekly intention before choosing another week.');return;}const d=new Date(value+'T12:00:00Z');d.setUTCDate(d.getUTCDate()-((d.getUTCDay()+6)%7));selectedWeek=d.toISOString().slice(0,10);delete $('sprint-goal').dataset.dirty;render();}});
$('current-week').addEventListener('click',()=>{selectedWeek=data.week;delete $('sprint-goal').dataset.dirty;render();});
$('sprint-goal').addEventListener('input',()=>{$('sprint-goal').dataset.dirty='true';$('save-status').textContent='Sprint goal not saved';});
$('save-goal').addEventListener('click',async()=>{try{await mutate('sprint.save',{week:selectedWeek,goal:$('sprint-goal').value,taskIds:sprint().taskIds,capacityMinutes:Math.round(Number($('week-capacity').value)*60)});delete $('sprint-goal').dataset.dirty;announce('Sprint goal saved');}catch(e){pageError(e.message);}});
$('choose-tasks').addEventListener('click',()=>{
  const selected=new Set(sprint().taskIds);$('sprint-error').textContent='';
  $('sprint-choices').innerHTML=data.state.tasks.filter(t=>!t.archived).map(t=>`<label class="sprint-choice"><input type="checkbox" name="task" value="${t.id}" ${selected.has(t.id)?'checked':''}><span>${escape(t.title)}</span></label>`).join('')||'<p>Add a task to your board first.</p>';$('sprint-dialog').showModal();
});
$('sprint-form').addEventListener('submit',async(e)=>{e.preventDefault();const visible=[...$('sprint-choices').querySelectorAll('input:checked')].map(i=>i.value);const archived=sprint().taskIds.filter(id=>data.state.tasks.find(t=>t.id===id)?.archived);try{await mutate('sprint.save',{week:selectedWeek,goal:sprint().goal,taskIds:[...visible,...archived]});$('sprint-dialog').close();}catch(e){$('sprint-error').textContent=e.message;}});
document.querySelectorAll('#reload,[data-reload]').forEach(button=>button.addEventListener('click',async()=>{try{await loadBoard();const message='Latest board loaded. Review your preserved draft before saving.';pageError(message);document.querySelectorAll('dialog[open] .error').forEach(el=>el.textContent=message);}catch(e){pageError(e.message);}}));
window.addEventListener('beforeunload',(e)=>{if(saving||$('sprint-goal').dataset.dirty||document.querySelector('dialog[open] form')){e.preventDefault();e.returnValue='';}});
$('board-select').addEventListener('change',()=>{selectedBoard=$('board-select').value;try{localStorage.setItem('life.board',selectedBoard);}catch{}render();});
function openBoard(id=''){const f=$('board-form');f.reset();f.elements.id.value=id;f.elements.name.value=(data.state.boards||[]).find(b=>b.id===id)?.name||'';$('board-dialog').showModal();f.elements.name.focus();}
$('page-title').addEventListener('dblclick',()=>{if(['board','week'].includes(view))openBoard(selectedBoard);});$('page-title').tabIndex=0;$('page-title').addEventListener('keydown',e=>{if(['board','week'].includes(view)&&e.key==='Enter')openBoard(selectedBoard);});
$('archive-board').onclick=async()=>{try{await confirmArchive('board.archive',selectedBoard);}catch(e){pageError(e.message);}};
$('new-board').addEventListener('click',()=>openBoard());$('rename-board').addEventListener('click',()=>openBoard(selectedBoard));$('board-form').addEventListener('submit',async e=>{e.preventDefault();const f=e.target;try{await mutate('board.save',Object.fromEntries(new FormData(f)));if(!f.elements.id.value){selectedBoard=data.state.boards.at(-1).id;try{localStorage.setItem('life.board',selectedBoard);}catch{}render();}$('board-dialog').close();}catch(err){f.querySelector('.error').textContent=err.message;}});
$('save-capacity').addEventListener('click',async()=>{try{await mutate('sprint.save',{week:selectedWeek,goal:sprint().goal,taskIds:sprint().taskIds,capacityMinutes:Math.round(Number($('week-capacity').value)*60)});}catch(err){pageError(err.message);}});

start();

const boardElement=$('board');
installCardDrag({board:boardElement,getData:()=>data,canMove:()=>!saving&&role==='owner',move:args=>mutate('task.move',args),onError:e=>{render();pageError(e.message);}});
let boardScrollFrame=0;
boardElement.addEventListener('scroll',()=>{cancelAnimationFrame(boardScrollFrame);boardScrollFrame=requestAnimationFrame(()=>{
  if(innerWidth>480||!data)return;const left=boardElement.getBoundingClientRect().left+20;
  const nearest=[...boardElement.querySelectorAll('[data-list]')].sort((a,b)=>Math.abs(a.getBoundingClientRect().left-left)-Math.abs(b.getBoundingClientRect().left-left))[0];
  if(nearest&&mobileList!==nearest.dataset.list){mobileList=nearest.dataset.list;$('mobile-list').value=mobileList;refreshSelects();}
});},{passive:true});
boardElement.addEventListener('keydown',event=>{const handle=event.target.closest('[data-drag-task]');if(handle&&['Enter',' '].includes(event.key)){event.preventDefault();openTask(handle.dataset.dragTask);}});

$('board').addEventListener('submit',async event=>{const form=event.target.closest('[data-quick-list]');if(!form)return;event.preventDefault();const title=form.elements.title.value.trim();if(!title)return;try{await mutate('task.save',{title,listId:form.dataset.quickList,priority:'normal',labels:[],checklist:[],notes:'',blocker:'',dueDate:'',...(view==='week'?{sprintWeek:selectedWeek,inSprint:true}:{})});}catch(e){pageError(e.message);}});
$('board').addEventListener('change',async event=>{const input=event.target.closest('[data-check-item]');if(!input)return;input.disabled=true;try{await mutate('checklist.toggle',{id:input.dataset.checkTask,itemId:input.dataset.checkItem,done:input.checked});}catch(e){input.checked=!input.checked;input.disabled=false;pageError(e.message);}});
$('board').addEventListener('dblclick',event=>{const title=event.target.closest('[data-rename-task]');if(!title)return;clearTimeout(cardOpenTimer);event.preventDefault();const task=data.state.tasks.find(t=>t.id===title.dataset.renameTask),form=document.createElement('form');form.className='inline-rename';form.innerHTML=`<input aria-label="Rename card" maxlength="200" required value="${escape(task.title)}"><button type="submit">Save</button><button type="button">Cancel</button>`;title.closest('.task-shell').append(form);form.querySelector('input').focus();form.querySelector('input').select();form.querySelector('[type=button]').addEventListener('click',()=>form.remove());form.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();form.remove();}});form.addEventListener('submit',async e=>{e.preventDefault();try{await mutate('task.rename',{id:task.id,title:form.querySelector('input').value});}catch(error){pageError(error.message);}});});

$('upload-attachment').addEventListener('click',async()=>{const file=$('attachment-file').files[0],id=$('task-form').elements.id.value;if(!file||!id){$('task-error').textContent='Save the task and choose a file first.';return;}const body=new FormData();body.append('file',file);body.append('taskId',id);body.append('version',data.version);try{const response=await fetch(API+'?action=upload',{method:'POST',credentials:'same-origin',headers:{'X-CSRF-Token':csrf},body});const result=await response.json();if(!response.ok){if(response.status===409){conflict=true;document.querySelectorAll('#reload,[data-reload]').forEach(b=>b.hidden=false);}if(response.status===401)await request('board');throw new Error(result.error);}data=result;render();$('attachment-list').insertAdjacentHTML('beforeend',`<p><a href="${API}?action=attachment&id=${result.state.attachments.at(-1).id}">${escape(file.name)}</a></p>`);$('attachment-file').value='';}catch(e){$('task-error').textContent=e.message;}});

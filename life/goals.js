import {emptyState} from './empty-states.js?v=1';
import {plannerTimezone} from './accounts.js?v=1';
import {chooseDate} from './date-controls.js?v=1';
const types={adhoc:'Independent',day:'Day',week:'Week',month:'Month',quarter:'Quarter'};
const statuses={todo:'To do',progress:'In progress',done:'Done'};
export function goalPeriodFromDate(type,value){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(value||''))return '';
 const date=new Date(value+'T12:00:00Z');if(!Number.isFinite(date.getTime())||date.toISOString().slice(0,10)!==value)return '';
 if(type==='quarter')return `${value.slice(0,4)}-Q${Math.ceil((date.getUTCMonth()+1)/3)}`;
 if(type==='month')return value.slice(0,7);
 if(type==='week'){date.setUTCDate(date.getUTCDate()-(date.getUTCDay()+6)%7);return date.toISOString().slice(0,10);}
 return value;
}
export function goalPeriodDate(type,period){
 if(type==='quarter'&&/^\d{4}-Q[1-4]$/.test(period||''))return `${period.slice(0,4)}-${String((Number(period.slice(-1))-1)*3+1).padStart(2,'0')}-01`;
 if(type==='month'&&/^\d{4}-(0[1-9]|1[0-2])$/.test(period||''))return period+'-01';
 return goalPeriodFromDate('day',period);
}
export function goalPeriodLabel(type,period){
 const value=goalPeriodDate(type,period);if(!value)return period||({week:'Choose week',month:'Choose month',quarter:'Choose quarter',day:'Choose date',adhoc:'Any time'}[type]||'Choose date');
 const date=new Date(value+'T12:00:00Z'),format=options=>new Intl.DateTimeFormat('en-GB',{...options,timeZone:'UTC'}).format(date);
 if(type==='quarter'){const end=new Date(date);end.setUTCMonth(end.getUTCMonth()+2);return `${format({month:'short'})}–${new Intl.DateTimeFormat('en-GB',{month:'short',timeZone:'UTC'}).format(end)} ${format({year:'numeric'})}`;}
 if(type==='month')return format({month:'long',year:'numeric'});
 return `${type==='week'?'Week of ':''}${format({day:'numeric',month:'short',year:'numeric'})}`;
}
export function goalStatus(goal){return statuses[goal.status]?goal.status:goal.completed?'done':'todo';}
export function keyResultProgress(result){
 if([result.baseline,result.current,result.target].some(v=>v===null||v===''||v===undefined||!Number.isFinite(Number(v))))return null;
 const distance=Number(result.target)-Number(result.baseline);return distance?Math.round(Math.max(0,Math.min(1,(Number(result.current)-Number(result.baseline))/distance))*100):null;
}
export function filterGoalRecords(records,{type='all',period='',search=''}={}){const query=search.trim().toLocaleLowerCase();return records.filter(g=>!g.archived&&(type==='all'||g.type===type)&&(!period||g.period===period)&&(!query||[g.title,g.notes,g.category,g.period].some(v=>String(v||'').toLocaleLowerCase().includes(query))));}
function descendants(state,id){const goals=(state.goals||[]).filter(g=>!g.archived),ids=new Set([id]);let changed=true;while(changed){changed=false;for(const child of goals)if(ids.has(child.parentId)&&!ids.has(child.id)){ids.add(child.id);changed=true;}}return {goals,ids};}
export function goalTaskProgress(state,goalId){
 const {ids}=descendants(state,goalId),seen=new Set(),linked=(state.tasks||[]).filter(t=>{if(t.archived||!ids.has(t.goalId)||seen.has(t.id))return false;seen.add(t.id);return true;}),done=linked.filter(t=>(state.lists||[]).find(l=>l.id===t.listId)?.isDone).length;
 return {linked,done,percent:linked.length?Math.round(done*100/linked.length):0};
}
export function goalDeliveryProgress(state,goalId){
 const {goals,ids}=descendants(state,goalId),tasks=goalTaskProgress(state,goalId);
 const childGoals=goals.filter(g=>g.id!==goalId&&ids.has(g.id)&&!goals.some(c=>c.parentId===g.id)&&!tasks.linked.some(t=>t.goalId===g.id));
 const total=tasks.linked.length+childGoals.length,done=tasks.done+childGoals.filter(g=>goalStatus(g)==='done').length;
 return {...tasks,childGoals,total,done,percent:total?Math.round(done*100/total):0};
}
export function createGoals({getData,mutate,escape,refreshSelects,openTask,week,pickDate=chooseDate}){
 const root=document.getElementById('goals'),dialog=document.getElementById('goal-dialog'),form=document.getElementById('goal-form');
 const all=()=>getData().state.goals||[],partner=()=>document.body.classList.contains('partner-mode');
 const today=()=>{const parts=new Intl.DateTimeFormat('en-CA',{timeZone:plannerTimezone(),year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());const part=k=>parts.find(p=>p.type===k).value;return `${part('year')}-${part('month')}-${part('day')}`;};
 const defaultPeriod=type=>{const date=today();return {quarter:`${date.slice(0,4)}-Q${Math.ceil(Number(date.slice(5,7))/3)}`,month:date.slice(0,7),week:week(),day:date,adhoc:''}[type]||'';};
 let selectedType='all',selectedPeriod='',search='',presentation='list',boardMode=false,boardInitialized=false,keyResults=[],draggedId='',lastFormType='adhoc',periodButton=null,clearPeriodButton=null;
 const error=message=>{document.getElementById('goal-error').textContent=message;};
 const resultRoot=()=>form.querySelector('[data-key-results]');
 function readResults(){return [...resultRoot().querySelectorAll('[data-result]')].map(row=>{const result=keyResults[Number(row.dataset.result)]||{};return {...result,...Object.fromEntries([...row.querySelectorAll('[data-result-field]')].map(input=>[input.dataset.resultField,['baseline','current','target'].includes(input.dataset.resultField)?input.value===''?null:Number(input.value):input.value]))};});}
 function renderResults(){
  form.querySelector('[data-results-section]').hidden=form.elements.type.value!=='quarter';
  resultRoot().innerHTML=keyResults.map((r,i)=>`<fieldset class="goal-result-editor" data-result="${i}"><legend>Result ${i+1}</legend><label>Measurable outcome<input data-result-field="title" value="${escape(r.title||'')}" maxlength="200" placeholder="What will be different?" ${form.elements.type.value==='quarter'?'required':''}></label><div class="goal-metric-fields">${['baseline','current','target'].map(k=>`<label>${k[0].toUpperCase()+k.slice(1)}<input type="number" step="any" inputmode="decimal" data-result-field="${k}" value="${escape(String(r[k]??''))}"></label>`).join('')}<label>Unit<input data-result-field="unit" value="${escape(r.unit||'')}" maxlength="40" placeholder="e.g. %"></label></div><button type="button" data-remove-result="${i}" ${partner()?'disabled':''}>Remove result</button></fieldset>`).join('');
  form.querySelector('[data-add-result]').disabled=keyResults.length>=4||partner();
 }
 function resultOptions(){const parent=all().find(g=>g.id===form.elements.parentId.value),old=form.elements.keyResultId.value;form.elements.keyResultId.innerHTML='<option value="">No specific key result</option>'+(parent?.keyResults||[]).map(r=>`<option value="${escape(r.id)}">${escape(r.title)}</option>`).join('');form.elements.keyResultId.value=old;form.elements.keyResultId.closest('label').hidden=form.elements.type.value!=='month'||!parent;refreshSelects();}
 function options(){const need={month:'quarter',week:'month',day:'week'}[form.elements.type.value],old=form.elements.parentId.value;form.elements.parentId.innerHTML='<option value="">Independent goal</option>'+all().filter(g=>!g.archived&&g.type===need&&g.id!==form.elements.id.value).map(g=>`<option value="${escape(g.id)}">${escape(g.title)} · ${escape(g.period||'Anytime')}</option>`).join('');form.elements.parentId.value=old;form.elements.parentId.closest('label').hidden=!need;resultOptions();refreshSelects();}
 function syncPeriodControl(){
  const input=form.elements.period,type=form.elements.type.value;input.type='hidden';const hint=input.closest('label')?.querySelector?.('small');if(hint)hint.hidden=type!=='adhoc';
  if(!periodButton){
   periodButton=document.createElement('button');periodButton.type='button';periodButton.className='date-control goal-period-picker';periodButton.setAttribute('aria-label','Choose goal date or period');input.after(periodButton);
   clearPeriodButton=document.createElement('button');clearPeriodButton.type='button';clearPeriodButton.className='goal-period-clear';clearPeriodButton.textContent='Clear date';periodButton.after(clearPeriodButton);
   periodButton.onclick=()=>{if(partner())return;const type=form.elements.type.value;pickDate({value:goalPeriodDate(type,input.value),title:{week:'Choose a date in your week',month:'Choose a date in your month',quarter:'Choose a date in your quarter'}[type]||'Choose date',onSelect:value=>{input.value=goalPeriodFromDate(type,value);syncPeriodControl();}});};
   clearPeriodButton.onclick=()=>{if(partner()||form.elements.type.value!=='adhoc')return;input.value='';syncPeriodControl();};
  }
  periodButton.textContent=goalPeriodLabel(type,input.value);periodButton.disabled=partner();clearPeriodButton.disabled=partner();clearPeriodButton.hidden=type!=='adhoc'||!input.value;
 }
 function open(id='',newType='week'){
  const goal=all().find(g=>g.id===id);form.reset();const type=goal?.type||(types[newType]&&newType!=='day'?newType:'week');lastFormType=type;
  for(const key of ['id','title','notes','type','period','category','status','progressMode'])form.elements[key].value=goal?.[key]??({type,category:'Personal',period:selectedType===type&&selectedPeriod?selectedPeriod:defaultPeriod(type),status:goalStatus(goal||{}),progressMode:'manual'}[key]||'');
  const dayOption=form.elements.type.querySelector?.('option[value=day]');if(goal?.type==='day'){if(!dayOption)form.elements.type.insertAdjacentHTML?.('beforeend','<option value="day">Day</option>');form.elements.type.value='day';}else dayOption?.remove();form.elements.status.value=goalStatus(goal||{});options();form.elements.parentId.value=goal?.parentId||'';resultOptions();form.elements.keyResultId.value=goal?.keyResultId||'';
  keyResults=(goal?.keyResults||[]).map(r=>({...r}));renderResults();refreshSelects();error('');
  form.querySelectorAll('input,select,textarea,button').forEach(el=>{if(!el.hasAttribute('data-close'))el.disabled=partner();});form.querySelector('[data-add-result]').disabled=keyResults.length>=4||partner();
  syncPeriodControl();
  document.getElementById('goal-title').textContent=goal?'Edit goal':'New goal';dialog.showModal();if(!partner())form.elements.title.focus();
 }
 function card(g){
  const state=getData().state,delivery=goalDeliveryProgress(state,g.id),taskProgress=goalTaskProgress(state,g.id),status=goalStatus(g),linked=g.progressMode==='linked',percent=linked?delivery.percent:status==='done'?100:status==='progress'?50:0,parent=all().find(p=>p.id===g.parentId),result=parent?.keyResults?.find(r=>r.id===g.keyResultId);
  const details=Boolean(parent||g.notes||g.category&&g.category!=='Personal'||g.keyResults?.length||taskProgress.linked.length||linked);
  return `<article class="goal-card" ${partner()?'':'draggable="true"'} data-goal-card="${escape(g.id)}"><div class="goal-meta"><span>${escape(g.period?goalPeriodLabel(g.type,g.period):types[g.type]||g.type)}</span></div><button class="goal-title-button" data-edit-goal="${escape(g.id)}"><strong>${escape(g.title)}</strong></button><div class="goal-progress"><div class="goal-progress-label"><strong>${percent}%</strong>${linked?`<small>${delivery.done}/${delivery.total} linked</small>`:''}</div><progress value="${percent}" max="100" aria-label="${escape(g.title)}: ${percent}% ${linked?'linked delivery':'manual progress'}"></progress></div><div class="goal-status-control"><label class="sr-only" for="goal-status-${escape(g.id)}">Status for ${escape(g.title)}</label><select id="goal-status-${escape(g.id)}" data-goal-status="${escape(g.id)}" ${partner()?'disabled':''}>${Object.entries(statuses).map(([s,label])=>`<option value="${s}" ${s===status?'selected':''}>${label}</option>`).join('')}</select></div>${details?`<details class="goal-card-details"><summary>Details${taskProgress.linked.length?` · ${taskProgress.linked.length} task${taskProgress.linked.length===1?'':'s'}`:''}${g.keyResults?.length?` · ${g.keyResults.length} result${g.keyResults.length===1?'':'s'}`:''}</summary>${parent?`<p class="goal-parent">↳ ${escape(parent.title)}${result?` · ${escape(result.title)}`:''}</p>`:''}${g.category&&g.category!=='Personal'?`<p class="goal-area">${escape(g.category)}</p>`:''}${g.notes?`<p class="goal-notes">${escape(g.notes)}</p>`:''}${linked?'<p class="goal-linked-mode">Linked work updates progress. Changing status switches to manual.</p>':''}${g.keyResults?.length?`<div class="goal-results"><ul>${g.keyResults.map(r=>{const p=keyResultProgress(r);return `<li><strong>${escape(r.title)}</strong><span>${escape(String(r.current??'—'))} / ${escape(String(r.target??'—'))} ${escape(r.unit||'')}${p===null?'':` · ${p}%`}</span></li>`;}).join('')}</ul></div>`:''}${taskProgress.linked.length?`<div class="goal-linked-tasks"><ul>${taskProgress.linked.map(t=>`<li><button data-goal-task="${escape(t.id)}">${escape(t.title)}</button><span>${state.lists?.find(l=>l.id===t.listId)?.isDone?'Done':'In progress'}</span></li>`).join('')}</ul></div>`:''}</details>`:''}</article>`;
 }
 function render(){
  const items=filterGoalRecords(all(),{type:selectedType,period:selectedPeriod,search}),quarterCount=all().filter(g=>!g.archived&&g.type==='quarter'&&g.period===(selectedPeriod||defaultPeriod('quarter'))).length;
  root.classList.toggle('goals-board-mode',boardMode);root.dataset.goalView=presentation;
  root.innerHTML=`<div class="goal-toolbar"><div class="goal-filter-row"><label>Period<select data-goal-type aria-label="Goal period"><option value="all">All time</option>${Object.entries(types).filter(([type])=>type!=='day').map(([type,label])=>`<option value="${type}" ${selectedType===type?'selected':''}>${label}</option>`).join('')}</select></label><label ${selectedType==='all'?'hidden':''}>${selectedType==='quarter'?'Quarter':selectedType==='month'?'Month':selectedType==='week'?'Week of':'Date'}<input data-goal-period type="hidden" value="${escape(selectedPeriod)}"><button type="button" class="date-control goal-period-picker" data-goal-period-choose>${escape(selectedPeriod?goalPeriodLabel(selectedType,selectedPeriod):{week:'Any week',month:'Any month',quarter:'Any quarter',adhoc:'Any date'}[selectedType]||'Choose date')}</button>${selectedPeriod?'<button type="button" class="goal-period-clear" data-clear-goal-period>Clear date</button>':''}</label><label class="goal-search"><span class="sr-only">Search goals</span><input data-goal-search type="search" enterkeyhint="search" placeholder="Search goals" value="${escape(search)}"></label></div><div class="goal-action-row"><div class="goal-view-switch" role="group" aria-label="Goal view">${['board','list'].map(mode=>`<button data-goal-view="${mode}" aria-pressed="${mode===presentation}">${mode[0].toUpperCase()+mode.slice(1)}</button>`).join('')}</div><button class="primary" data-new-goal ${partner()?'disabled':''}>+ New goal</button></div></div>${selectedType==='quarter'?`<p class="goal-limit-note">${quarterCount} of 3 quarterly goals</p>`:''}<p class="goal-view-error error" role="alert"></p><div aria-live="polite" class="sr-only">${items.length} goal${items.length===1?'':'s'}</div>${!items.length?`<div class="goal-create-card">${emptyState(selectedType==='all'?'adhoc':selectedType,search||selectedPeriod?'No goals match this view.':'No goals yet.')}<div>${search||selectedPeriod?'<button data-clear-goals>Clear filters</button>':''}<button class="primary" data-new-goal ${partner()?'disabled':''}>+ New goal</button></div></div>`:presentation==='board'?`<div class="goal-board">${Object.entries(statuses).map(([s,label])=>`<section class="goal-lane" data-goal-lane="${s}" aria-label="${label}"><header><h2>${label}</h2><span>${items.filter(g=>goalStatus(g)===s).length}</span></header><div class="goal-lane-cards">${items.filter(g=>goalStatus(g)===s).map(card).join('')}</div></section>`).join('')}</div>`:`<div class="goal-list">${items.map(card).join('')}</div>`}`;
  refreshSelects();
 }
 async function changeStatus(id,status){
  if(partner())return;const goal=all().find(g=>g.id===id);if(!goal||goalStatus(goal)===status)return;
  try{await mutate('goal.save',{id:goal.id,status,completed:status==='done',progressMode:'manual'});render();}catch(err){root.querySelector('.goal-view-error').textContent=err.message;const select=root.querySelector(`[data-goal-status="${CSS.escape(id)}"]`);if(select)select.value=goalStatus(goal);}
 }
 root.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.hasAttribute('data-goal-period-choose')){pickDate({value:goalPeriodDate(selectedType,selectedPeriod),title:{week:'Choose a date in the week',month:'Choose a date in the month',quarter:'Choose a date in the quarter'}[selectedType]||'Choose date',onSelect:value=>{selectedPeriod=goalPeriodFromDate(selectedType,value);render();}});}else if(b.hasAttribute('data-clear-goal-period')){selectedPeriod='';render();}else if(b.hasAttribute('data-new-goal'))open('',selectedType==='all'?'week':selectedType);else if(b.dataset.editGoal)open(b.dataset.editGoal);else if(b.dataset.goalTask)openTask(b.dataset.goalTask);else if(['board','list'].includes(b.dataset.goalView)){presentation=b.dataset.goalView;render();}else if(b.hasAttribute('data-clear-goals')){search='';selectedPeriod='';render();}});
 root.addEventListener('change',e=>{if(e.target.hasAttribute('data-goal-type')){selectedType=e.target.value;selectedPeriod='';render();}else if(e.target.hasAttribute('data-goal-period')){selectedPeriod=goalPeriodFromDate(selectedType,e.target.value);render();}else if(e.target.dataset.goalStatus)changeStatus(e.target.dataset.goalStatus,e.target.value);});
 root.addEventListener('input',e=>{if(!e.target.hasAttribute('data-goal-search'))return;search=e.target.value;const position=e.target.selectionStart;render();const input=root.querySelector('[data-goal-search]');input.focus();try{input.setSelectionRange(position,position);}catch{}});
 root.addEventListener('dragstart',e=>{const item=e.target.closest('[data-goal-card]');if(!item||partner()||e.target.closest('button,select,input,a,summary')){e.preventDefault();return;}draggedId=item.dataset.goalCard;e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/plain',draggedId);});
 root.addEventListener('dragover',e=>{if(draggedId&&e.target.closest('[data-goal-lane]')){e.preventDefault();e.dataTransfer.dropEffect='move';}});
 root.addEventListener('drop',e=>{const lane=e.target.closest('[data-goal-lane]');if(!lane||!draggedId)return;e.preventDefault();changeStatus(draggedId,lane.dataset.goalLane);draggedId='';});root.addEventListener('dragend',()=>{draggedId='';});
 form.elements.type.addEventListener('change',()=>{keyResults=readResults();options();const type=form.elements.type.value,period=form.elements.period.value;form.elements.period.value=goalPeriodFromDate(type,goalPeriodDate(lastFormType,period))||defaultPeriod(type);lastFormType=type;syncPeriodControl();renderResults();});
 form.elements.parentId.addEventListener('change',resultOptions);
 form.elements.status.addEventListener('change',()=>{form.elements.progressMode.value='manual';refreshSelects();});
 form.addEventListener('click',e=>{const add=e.target.closest('[data-add-result]'),remove=e.target.closest('[data-remove-result]');if(!add&&!remove||partner())return;keyResults=readResults();if(add&&keyResults.length<4)keyResults.push({id:crypto.randomUUID().replaceAll('-',''),title:'',baseline:null,current:null,target:null,unit:''});if(remove)keyResults.splice(Number(remove.dataset.removeResult),1);renderResults();if(add)resultRoot().lastElementChild?.querySelector('input')?.focus();});
 form.addEventListener('submit',async e=>{e.preventDefault();if(partner())return;const args={};for(const k of ['id','title','notes','type','period','category','parentId','keyResultId','status','progressMode'])args[k]=form.elements[k].value;args.completed=args.status==='done';args.keyResults=readResults();
  const old=all().find(g=>g.id===args.id);if(args.type!=='quarter'){if(old?.type==='quarter'&&old.keyResults?.length){error('Remove measured results before changing this objective’s period type.');return;}args.keyResults=old?.type===args.type?old.keyResults||[]:[];}const quarters=all().filter(g=>!g.archived&&g.type==='quarter'&&g.period===args.period&&g.id!==args.id);
  if(args.type==='quarter'&&quarters.length>=3&&(!old||old.type!=='quarter'||old.period!==args.period)){error('This quarter already has 3 objectives. Edit an existing objective or choose another quarter.');return;}
  if(args.keyResults.length>4&&args.keyResults.length>(old?.keyResults?.length||0)){error('Each objective can have up to 4 measured results.');return;}
  const submit=form.querySelector('[type=submit]');submit.disabled=true;error('');try{await mutate('goal.save',args);dialog.close();}catch(err){error(err.message);}finally{submit.disabled=partner();}
 });
 return {render,open,setBoardMode(value){if(boardMode===Boolean(value))return;boardMode=Boolean(value);if(boardMode&&!boardInitialized){presentation='board';boardInitialized=true;}render();}};
}

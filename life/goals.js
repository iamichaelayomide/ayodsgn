import {emptyState} from './empty-states.js?v=1';
import {plannerTimezone} from './accounts.js?v=1';
export function createGoals({getData,mutate,escape,refreshSelects,openTask,week}){
 const root=document.getElementById('goals'),dialog=document.getElementById('goal-dialog'),form=document.getElementById('goal-form');
 const currentQuarter=()=>{const date=new Intl.DateTimeFormat('en-CA',{timeZone:plannerTimezone(),year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());return `${date.slice(0,4)}-Q${Math.ceil(Number(date.slice(5,7))/3)}`;};
 const all=()=>getData().state.goals||[];
 let selectedType='quarter';
 const names={quarter:'Quarterly goals',month:'Monthly goals',week:'Weekly goals',adhoc:'Ad hoc goals'};
 function options(){const type=form.elements.type.value,need={month:'quarter',week:'month'}[type];form.elements.parentId.innerHTML='<option value="">Independent goal</option>'+all().filter(g=>!g.archived&&g.type===need&&g.id!==form.elements.id.value).map(g=>`<option value="${g.id}">${escape(g.title)} · ${escape(g.period)}</option>`).join('');refreshSelects();}
 function open(id='',newType='quarter'){const goal=all().find(g=>g.id===id);form.reset();for(const key of ['id','title','notes','type','period','category'])form.elements[key].value=goal?.[key]??({type:newType,category:'Personal',period:{quarter:currentQuarter(),month:new Intl.DateTimeFormat('en-CA',{timeZone:plannerTimezone(),year:'numeric',month:'2-digit'}).format(new Date()),week:week(),adhoc:''}[newType]}[key]||'');options();form.elements.parentId.value=goal?.parentId||'';form.elements.completed.checked=goal?.completed||false;refreshSelects();document.getElementById('goal-error').textContent='';const partner=document.body.classList.contains('partner-mode');form.querySelectorAll('input,select,textarea,button').forEach(el=>{if(!el.hasAttribute('data-close'))el.disabled=partner;});dialog.showModal();if(!partner)form.elements.title.focus();}
 function render(){
  const data=getData(),goals=all().filter(g=>!g.archived);
  root.innerHTML=`<div class="goal-view-controls"><label>Goal type<select aria-label="Goal type" data-goal-type>${['quarter','month','week','adhoc','all'].map(type=>`<option value="${type}" ${type===selectedType?'selected':''}>${names[type]||'All goals'}</option>`).join('')}</select></label></div>${(selectedType==='all'?['quarter','month','week','adhoc']:[selectedType]).map(type=>{
   const items=goals.filter(g=>g.type===type),text={quarter:'Give the next three months a direction.',month:'Bring your bigger goal one month closer.',week:'Choose one meaningful focus for the week.',adhoc:'Make room for a new possibility.'};
   return `<section class="goal-section"><header class="goal-section-heading"><h2>${names[type]}</h2>${items.length?`<button class="primary" data-new-goal="${type}">+ New goal</button>`:''}</header>${items.length?'':`<div class="goal-create-card">${emptyState(type,text[type])}<button class="primary" data-new-goal="${type}">+ New goal</button></div>`}<div class="goal-grid">${items.map(g=>{
    const {linked,done,percent}=goalTaskProgress(data.state,g.id);
    return `<article class="goal-card"><div class="goal-meta"><span>${escape(g.category)}</span><span>${escape(g.period||'Anytime')}</span></div><button data-edit-goal="${g.id}"><strong>${escape(g.title)}</strong></button>${g.notes?`<p>${escape(g.notes)}</p>`:''}<div class="goal-progress"><div class="goal-progress-label"><strong>${percent}%</strong><small>${done}/${linked.length} linked tasks done</small></div><progress value="${percent}" max="100" aria-label="${percent}% of linked tasks completed"></progress><small>${g.completed?'Goal complete':'Goal in progress'}</small></div><details class="goal-linked-tasks"><summary>${linked.length?`View ${linked.length} linked task${linked.length===1?'':'s'}`:'No linked tasks yet'}</summary>${linked.length?`<ul>${linked.map(t=>{const list=data.state.lists.find(l=>l.id===t.listId),board=data.state.boards?.find(b=>b.id===list?.boardId);return `<li><button data-goal-task="${t.id}">${escape(t.title)}</button><span>${list?.isDone?'Done':escape(list?.name||'In progress')}${board?' · '+escape(board.name):''}</span></li>`;}).join('')}</ul>`:'<p>Choose this goal when adding or editing a task to track its progress.</p>'}</details></article>`;
   }).join('')}</div></section>`;
  }).join('')}`;refreshSelects();
 }
 function loadReview(){const f=root.querySelector('#weekly-review-form'),r=getData().state.reviews?.[f.elements.week.value]||{};for(const k of ['wins','obstacles','next'])f.elements[k].value=r[k]||'';}
 root.addEventListener('click',e=>{const b=e.target.closest('button');if(b?.hasAttribute('data-new-goal'))open('',b.dataset.newGoal);else if(b?.dataset.editGoal)open(b.dataset.editGoal);else if(b?.dataset.goalTask)openTask(b.dataset.goalTask);});root.addEventListener('change',e=>{if(e.target.hasAttribute('data-goal-type')){selectedType=e.target.value;render();}else if(e.target.name==='week')loadReview();});
 root.addEventListener('submit',async e=>{if(e.target.id!=='weekly-review-form')return;e.preventDefault();const f=e.target,args={};for(const k of ['week','wins','obstacles','next'])args[k]=f.elements[k].value;try{await mutate('review.save',args);}catch(error){f.querySelector('.error').textContent=error.message;}});
 form.elements.type.addEventListener('change',()=>{options();const now=new Intl.DateTimeFormat('en-CA',{timeZone:plannerTimezone(),year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());form.elements.period.value={quarter:`${now.slice(0,4)}-Q${Math.ceil(Number(now.slice(5,7))/3)}`,month:now.slice(0,7),week:week(),adhoc:''}[form.elements.type.value];});
 form.addEventListener('submit',async e=>{e.preventDefault();const args={};for(const k of ['id','title','notes','type','period','category','parentId'])args[k]=form.elements[k].value;args.completed=form.elements.completed.checked;const submit=form.querySelector('[type=submit]');submit.disabled=true;try{await mutate('goal.save',args);dialog.close();}catch(error){document.getElementById('goal-error').textContent=error.message;}finally{submit.disabled=false;}});


 function loadQuarterReview(){const f=root.querySelector('#quarter-review-form');if(!f)return;const r=getData().state.quarterReviews?.[f.elements.quarter.value]||{};for(const k of ['wins','lessons','next'])f.elements[k].value=r[k]||'';}
 root.addEventListener('change',e=>{if(e.target.name==='quarter')loadQuarterReview();});
 root.addEventListener('submit',async e=>{if(e.target.id!=='quarter-review-form')return;e.preventDefault();const f=e.target,args=Object.fromEntries(new FormData(f));try{await mutate('quarter.review',args);}catch(err){root.querySelector('#quarter-review-form .error').textContent=err.message;}});
 return {render,open};
}

export function goalTaskProgress(state,goalId){
 const goals=(state.goals||[]).filter(g=>!g.archived),ids=new Set([goalId]);
 let changed=true;while(changed){changed=false;for(const child of goals)if(ids.has(child.parentId)&&!ids.has(child.id)){ids.add(child.id);changed=true;}}
 const linked=state.tasks.filter(t=>!t.archived&&ids.has(t.goalId)),done=linked.filter(t=>state.lists.find(l=>l.id===t.listId)?.isDone).length;
 return {linked,done,percent:linked.length?Math.round(done*100/linked.length):0};
}

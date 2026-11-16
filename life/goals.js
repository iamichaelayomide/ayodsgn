import {createPeriodGoals} from './period-goals.js?v=3';
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
 if(type==='quarter')return `${period.slice(-2)} ${format({year:'numeric'})}`;
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
export function chooseGoalPeriod({type,value,onSelect}){
 const isQuarter=type==='quarter',label=isQuarter?'quarter':'month';
 let year=Number(value.slice(0,4));
 const picker=document.createElement('dialog');
 picker.className='goal-choice-dialog';
 picker.setAttribute('aria-label',`Choose a ${label}`);
 picker.innerHTML=`<div class="dialog-heading"><h2>Choose a ${label}</h2><button type="button" aria-label="Close period picker">×</button></div>
 <div class="goal-choice-year"><button type="button" data-year-step="-1" aria-label="Previous year">‹</button><strong aria-live="polite"></strong><button type="button" data-year-step="1" aria-label="Next year">›</button></div>
 <div class="goal-choice-grid" data-kind="${type}"></div>`;
 const grid=picker.querySelector('.goal-choice-grid');
 const yearLabel=picker.querySelector('.goal-choice-year strong');
 const monthName=new Intl.DateTimeFormat('en-GB',{month:'long',timeZone:'UTC'});
 function draw(){
  yearLabel.textContent=year;
  grid.replaceChildren();
  for(let index=0;index<(isQuarter?4:12);index++){
   const option=isQuarter?`Q${index+1}`:String(index+1).padStart(2,'0');
   const period=`${String(year).padStart(4,'0')}-${option}`;
   const button=document.createElement('button');
   button.type='button';button.textContent=isQuarter?option:monthName.format(new Date(Date.UTC(2026,index,1)));
   button.setAttribute('aria-pressed',String(period===value));
   button.onclick=()=>{picker.close();onSelect(period);};
   grid.append(button);
  }
 }
 picker.querySelector('[aria-label="Close period picker"]').onclick=()=>picker.close();
 picker.querySelectorAll('[data-year-step]').forEach(button=>{button.onclick=()=>{
  year=Math.max(1000,Math.min(9999,year+Number(button.dataset.yearStep)));
  draw();
 };});
 picker.addEventListener('close',()=>picker.remove(),{once:true});
 document.body.append(picker);
 draw();
 picker.showModal();
 (grid.querySelector('[aria-pressed=true]')||grid.firstElementChild)?.focus();
}

export function createGoals({getData,mutate,escape,refreshSelects,openTask,createTask,archiveGoal,week,pickDate=chooseDate,pickPeriod=chooseGoalPeriod}){
 const root=document.getElementById('goals'),dialog=document.getElementById('goal-dialog'),form=document.getElementById('goal-form');
 const all=()=>getData().state.goals||[],partner=()=>document.body.classList.contains('partner-mode');
 const today=()=>{const parts=new Intl.DateTimeFormat('en-CA',{timeZone:plannerTimezone(),year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());const part=k=>parts.find(p=>p.type===k).value;return `${part('year')}-${part('month')}-${part('day')}`;};
 const defaultPeriod=type=>{const date=today();return {quarter:`${date.slice(0,4)}-Q${Math.ceil(Number(date.slice(5,7))/3)}`,month:date.slice(0,7),week:week(),day:date,adhoc:''}[type]||'';};
 let lastFormType='adhoc',periodButton=null,clearPeriodButton=null;
 const error=message=>{document.getElementById('goal-error').textContent=message;};
 function options(){
  const field=form.elements.parentId;
  const requiredType={month:'quarter',week:'month',day:'week'}[form.elements.type.value],previous=field.value;
  const parents=all().filter(goal=>!goal.archived&&goal.type===requiredType&&goal.id!==form.elements.id.value);
  field.innerHTML='<option value="">Independent goal</option>'+parents.map(goal=>
   `<option value="${escape(goal.id)}">${escape(goal.title)} · ${escape(goalPeriodLabel(goal.type,goal.period))}</option>`).join('');
  field.value=parents.some(goal=>goal.id===previous)?previous:'';
  field.closest('label').hidden=!requiredType;
  refreshSelects();
 }
 function syncPeriodControl(){
  const input=form.elements.period,type=form.elements.type.value;input.type='hidden';const hint=input.closest('label')?.querySelector?.('small');if(hint)hint.hidden=type!=='adhoc';
  if(!periodButton){
   periodButton=document.createElement('button');periodButton.type='button';periodButton.className='date-control goal-period-picker';periodButton.setAttribute('aria-label','Choose goal date or period');input.after(periodButton);
   clearPeriodButton=document.createElement('button');clearPeriodButton.type='button';clearPeriodButton.className='goal-period-clear';clearPeriodButton.textContent='Clear date';periodButton.after(clearPeriodButton);
   periodButton.onclick=()=>{
    if(partner())return;
    const kind=form.elements.type.value;
    const apply=period=>{input.value=period;syncPeriodControl();};
    if(kind==='quarter'||kind==='month')pickPeriod({type:kind,value:input.value||defaultPeriod(kind),onSelect:apply});
    else pickDate({value:goalPeriodDate(kind,input.value),title:kind==='week'?'Choose a date in your week':'Choose date',onSelect:value=>apply(goalPeriodFromDate(kind,value))});
   };
   clearPeriodButton.onclick=()=>{if(partner()||form.elements.type.value!=='adhoc')return;input.value='';syncPeriodControl();};
  }
  periodButton.textContent=goalPeriodLabel(type,input.value);periodButton.disabled=partner();clearPeriodButton.disabled=partner();clearPeriodButton.hidden=type!=='adhoc'||!input.value;
 }
 function open(id='',newType='week',defaults={}){
  const goal=all().find(g=>g.id===id);form.reset();const more=form.querySelector('.goal-form-details');if(more)more.open=Boolean(goal||defaults.parentId);const type=goal?.type||(types[newType]&&newType!=='day'?newType:'week');lastFormType=type;
  for(const key of ['id','title','notes','type','period','category','status'])form.elements[key].value=goal?.[key]??defaults[key]??({type,category:'',period:defaultPeriod(type),status:goalStatus(goal||{})}[key]||'');
  const dayOption=form.elements.type.querySelector?.('option[value=day]');if(goal?.type==='day'){if(!dayOption)form.elements.type.insertAdjacentHTML?.('beforeend','<option value="day">Day</option>');form.elements.type.value='day';}else dayOption?.remove();form.elements.status.value=goalStatus(goal||{});options();form.elements.parentId.value=goal?.parentId||defaults.parentId||'';
  const areaOptions=document.getElementById('life-areas');
  if(areaOptions){
   const names=new Set(['Personal','Master’s','Research','NYSC','Full-time work','Business','Health','Family',...all().filter(g=>!g.archived).map(g=>g.category).filter(Boolean)]);
   areaOptions.innerHTML=[...names].map(name=>`<option value="${escape(name)}"></option>`).join('');
  }
  refreshSelects();error('');
  form.querySelectorAll('input,select,textarea,button').forEach(el=>{if(!el.hasAttribute('data-close'))el.disabled=partner();});
  syncPeriodControl();
  document.getElementById('goal-title').textContent=goal?'Edit goal':'New goal';dialog.showModal();if(!partner())form.elements.title.focus();return dialog;
 }
 const periodView = createPeriodGoals({
  root,detail:document.getElementById('period-goal-detail'),getData,open,openTask,createTask,archiveGoal,escape,today,partner,pickDate,pickPeriod,
  periodOf:goalPeriodFromDate,dateOf:goalPeriodDate,labelOf:goalPeriodLabel,statusOf:goalStatus
 });
 form.elements.type.addEventListener('change',()=>{
  const type=form.elements.type.value,period=form.elements.period.value;
  form.elements.period.value=goalPeriodFromDate(type,goalPeriodDate(lastFormType,period))||defaultPeriod(type);
  lastFormType=type;options();syncPeriodControl();
 });
 form.addEventListener('submit',async event=>{
  event.preventDefault();
  if(partner())return;
  const args=Object.fromEntries(['id','title','notes','type','period','category','parentId','status'].map(key=>[key,form.elements[key].value]));
  args.completed=args.status==='done';
  const old=all().find(goal=>goal.id===args.id);
  if(old?.type==='quarter'&&args.type!=='quarter'&&old.keyResults?.length){error('This existing goal has saved results. Keep its period type as Quarter.');return;}
  if(old?.keyResultId&&old.parentId!==args.parentId)args.keyResultId='';
  if(old&&goalStatus(old)!==args.status)args.progressMode='manual';
  const submit=form.querySelector('[type=submit]');
  submit.disabled=true;error('');
  try{await mutate('goal.save',args);dialog.close();}catch(err){error(err.message);}finally{submit.disabled=partner();}
 });
 return {...periodView,open};
}

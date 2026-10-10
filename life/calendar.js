export function createCalendar({getData,today,mutate,openTask,refreshSelects,escape}) {
  const root=document.getElementById('planning'), dialog=document.getElementById('schedule-dialog'),form=document.getElementById('schedule-form');
  let mode='month',anchor=today(),currentView='calendar';
  const add=(date,days)=>{const d=new Date(`${date}T12:00:00Z`);d.setUTCDate(d.getUTCDate()+days);return d.toISOString().slice(0,10);};
  const monday=date=>add(date,-((new Date(`${date}T12:00:00Z`).getUTCDay()+6)%7));
  const format=date=>new Date(`${date}T12:00:00Z`).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric',timeZone:'Africa/Lagos'});
  const tasks=()=>getData().state.tasks.filter(t=>!t.archived);
  const done=t=>getData().state.lists.find(l=>l.id===t.listId)?.isDone;
  function entry(task,date){
    const work=task.schedule?.date===date,deadline=task.dueDate===date;
    return `<div class="calendar-entry ${done(task)?'is-complete':''}" draggable="true" data-calendar-drag="${task.id}"><button class="calendar-task" data-calendar-task="${task.id}">${escape(task.title)}</button><small>${work?`${task.schedule.time} · ${task.schedule.minutes} min${deadline?' · ':''}`:''}${deadline?'Deadline':''}${done(task)?' · Done':''}</small><button class="calendar-schedule" data-schedule="${task.id}" data-date="${date}">${work?'Edit work block':'Plan time'}</button></div>`;
  }
  function schedule(id='',date=anchor){
    const available=tasks(),task=available.find(t=>t.id===id)||available[0];if(!task)return;
    form.reset();form.elements.taskId.innerHTML=available.map(t=>`<option value="${t.id}">${escape(t.title)}</option>`).join('');
    form.elements.taskId.value=task.id;form.elements.date.value=date||today();form.elements.time.value=task.schedule?.time||'09:00';form.elements.minutes.value=task.schedule?.minutes||60;
    document.getElementById('schedule-error').textContent='';document.getElementById('unschedule-task').hidden=!task.schedule;
    refreshSelects();dialog.showModal();form.elements.date.focus();
  }
  function render(view=currentView){
    currentView=view;
    if(view==='today'){
      const date=today(),active=tasks(),items=active.filter(t=>t.dueDate===date||t.schedule?.date===date||(!done(t)&&t.dueDate&&t.dueDate<date)).sort((a,b)=>Number(done(a))-Number(done(b)));
      root.innerHTML=`<div class="calendar-summary"><p>${format(date)} · Africa/Lagos</p></div><form class="today-add"><input name="title" required maxlength="200" aria-label="Add a to-do for today" placeholder="What do you want to do today?"><button class="primary">Add to today</button></form><div class="today-list">${items.map(t=>`<article class="today-row ${done(t)?'is-done':''}"><label><input type="checkbox" data-today-complete="${t.id}" ${done(t)?'checked':''}><span>${escape(t.title)}</span></label><small>${t.schedule?.date===date?`${t.schedule.time} · ${t.schedule.minutes} min`:t.dueDate<date?'Overdue':'Today'} · ${t.goalId?'Linked to a goal':'Ad hoc'}</small><button data-calendar-task="${t.id}" aria-label="Edit ${escape(t.title)}">Details</button></article>`).join('')||'<p class="planning-empty">A fresh page for today. Add one small next step.</p>'}</div>`;return;
    }
    let dates=[];
    if(mode==='day')dates=[anchor];
    else if(mode==='week')dates=Array.from({length:7},(_,i)=>add(monday(anchor),i));
    else {const start=monday(anchor.slice(0,8)+'01');dates=Array.from({length:42},(_,i)=>add(start,i));}
    const title=mode==='month'?new Date(`${anchor}T12:00:00Z`).toLocaleDateString('en-GB',{month:'long',year:'numeric',timeZone:'Africa/Lagos'}):mode==='week'?`${format(dates[0])} – ${format(dates[6])}`:format(anchor);
    root.innerHTML=`<div class="calendar-toolbar"><div class="calendar-navigation"><button data-calendar-nav="-1" aria-label="Previous calendar period">Previous</button><button data-calendar-now>Today</button><button data-calendar-nav="1" aria-label="Next calendar period">Next</button></div><div class="calendar-modes" aria-label="Calendar view">${['day','week','month'].map(m=>`<button data-calendar-mode="${m}" aria-pressed="${m===mode}">${m[0].toUpperCase()+m.slice(1)}</button>`).join('')}</div><button data-schedule-new ${tasks().length?'':'disabled'}>+ Plan a work block</button></div><div class="calendar-summary"><h2>${title}</h2><p>Africa/Lagos · Work blocks and deadlines</p></div><div class="calendar-scroll" tabindex="0" aria-label="Scrollable calendar"><div class="calendar-grid ${mode}">${dates.map(date=>`<section class="calendar-day ${date===today()?'is-today':''} ${mode==='month'&&date.slice(0,7)!==anchor.slice(0,7)?'outside-month':''}" data-calendar-date="${date}"><header><span>${new Date(`${date}T12:00:00Z`).toLocaleDateString('en-GB',{weekday:'short',day:'numeric',timeZone:'Africa/Lagos'})}</span><button data-add-date="${date}" aria-label="Plan time on ${format(date)}" ${tasks().length?'':'disabled'}>+</button></header>${tasks().filter(t=>t.dueDate===date||t.schedule?.date===date).sort((a,b)=>(a.schedule?.time||'99').localeCompare(b.schedule?.time||'99')).map(t=>entry(t,date)).join('')}</section>`).join('')}</div></div><section class="unscheduled"><h2>Unscheduled tasks</h2><p>These tasks have no work block yet. Deadlines remain visible on the calendar.</p>${tasks().filter(t=>!done(t)&&!t.schedule).map(t=>`<div class="unscheduled-row"><button data-calendar-task="${t.id}">${escape(t.title)}</button><button data-schedule="${t.id}">Plan time</button></div>`).join('')||'<p>All active tasks have a work block.</p>'}</section>`;
  }
  root.addEventListener('submit',async event=>{if(!event.target.matches('.today-add'))return;event.preventDefault();const form=event.target,list=getData().state.lists.find(l=>!l.archived&&!l.isDone);try{await mutate('task.save',{title:form.elements.title.value,listId:list.id,dueDate:today(),priority:'normal',notes:'',blocker:'',labels:[],checklist:[]});}catch(e){document.getElementById('page-error').textContent=e.message;document.getElementById('page-error').hidden=false;}});
  root.addEventListener('change',async event=>{const input=event.target.closest('[data-today-complete]');if(!input)return;input.disabled=true;try{await mutate('task.complete',{id:input.dataset.todayComplete,done:input.checked});}catch(e){input.checked=!input.checked;input.disabled=false;document.getElementById('page-error').textContent=e.message;document.getElementById('page-error').hidden=false;}});
  root.addEventListener('click',event=>{
    const b=event.target.closest('button');if(!b)return;
    if(b.dataset.calendarTask)openTask(b.dataset.calendarTask);
    else if(b.hasAttribute('data-schedule-new'))schedule('',currentView==='today'?today():anchor);
    else if(b.dataset.schedule)schedule(b.dataset.schedule,b.dataset.date||tasks().find(t=>t.id===b.dataset.schedule)?.schedule?.date||anchor);
    else if(b.dataset.addDate)schedule('',b.dataset.addDate);
    else if(b.dataset.calendarMode){mode=b.dataset.calendarMode;render();}
    else if(b.hasAttribute('data-calendar-now')){anchor=today();render();}
    else if(b.dataset.calendarNav){const step=Number(b.dataset.calendarNav);if(mode==='month'){const d=new Date(`${anchor.slice(0,8)}01T12:00:00Z`);d.setUTCMonth(d.getUTCMonth()+step);anchor=d.toISOString().slice(0,10);}else anchor=add(anchor,step*(mode==='week'?7:1));render();}
  });
  form.elements.taskId.addEventListener('change',()=>{const task=tasks().find(t=>t.id===form.elements.taskId.value);document.getElementById('unschedule-task').hidden=!task?.schedule;form.elements.time.value=task?.schedule?.time||'09:00';form.elements.minutes.value=task?.schedule?.minutes||60;});
  async function save(remove=false){const error=document.getElementById('schedule-error'),buttons=[...form.querySelectorAll('button')];error.textContent='';buttons.forEach(b=>b.disabled=true);try{await mutate('task.schedule',{id:form.elements.taskId.value,date:remove?'':form.elements.date.value,time:form.elements.time.value,minutes:Number(form.elements.minutes.value)});dialog.close();}catch(e){error.textContent=e.message;}finally{buttons.forEach(b=>b.disabled=false);}}
  form.addEventListener('submit',event=>{event.preventDefault();save();});document.getElementById('unschedule-task').addEventListener('click',()=>save(true));
  let dragged='';root.addEventListener('dragstart',event=>{const entry=event.target.closest('[data-calendar-drag]');if(entry){dragged=entry.dataset.calendarDrag;event.dataTransfer.setData('text/plain',dragged);}});
  root.addEventListener('dragover',event=>{if(dragged&&event.target.closest('[data-calendar-date]'))event.preventDefault();});
  root.addEventListener('drop',async event=>{const cell=event.target.closest('[data-calendar-date]');if(!dragged||!cell)return;event.preventDefault();const task=tasks().find(t=>t.id===dragged);dragged='';try{await mutate('task.schedule',{id:task.id,date:cell.dataset.calendarDate,time:task.schedule?.time||'09:00',minutes:task.schedule?.minutes||60});}catch(e){document.getElementById('page-error').textContent=e.message;document.getElementById('page-error').hidden=false;}});root.addEventListener('dragend',()=>dragged='');
  return {render};
}

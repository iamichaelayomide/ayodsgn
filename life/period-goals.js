const periods = {quarter:'Quarter', month:'Month', week:'Week'};
const headings = {quarter:'Quarterly goals', month:'Monthly goals', week:'Weekly goals', adhoc:'Other goals'};
const areaOf = goal => goal.category?.trim() || 'Personal';

export function goalsByArea(goals) {
  const areas = new Map();
  for (const goal of goals) {
    const area = areaOf(goal);
    const key = area.toLocaleLowerCase();
    if (!areas.has(key)) areas.set(key, {area, goals:[]});
    areas.get(key).goals.push(goal);
  }
  return [...areas.values()].sort((a,b) => a.area.localeCompare(b.area));
}

export function createPeriodGoals({root, detail, getData, open, openTask, createTask, archiveGoal, escape, today, partner, pickDate, pickPeriod, periodOf, dateOf, labelOf, statusOf}) {
  let date = '', mode = 'overview', area = '', goalId = '';
  const active = () => (getData()?.state.goals || []).filter(goal => !goal.archived);
  const period = type => periodOf(type,date || today());
  const types = records => mode === 'overview' ? [...Object.keys(periods), ...(records.some(g => g.type === 'adhoc' && (!area || areaOf(g).toLocaleLowerCase() === area.toLocaleLowerCase())) ? ['adhoc'] : [])] : [mode];
  const add = (type, category = '', label = '+ Add goal') => partner() ? '' :
    `<button type="button" class="period-add" data-plan-add="${type}" data-area="${escape(category)}">${label}</button>`;
  const goalRow = (goal, records) => {
    const parent = records.find(record => record.id === goal.parentId);
    return `<li><button type="button" class="period-goal" data-plan-goal="${escape(goal.id)}"><span class="goal-dot" data-status="${statusOf(goal)}" aria-hidden="true"></span><span><strong>${escape(goal.title)}</strong>${parent ? `<small>↳ ${escape(parent.title)}</small>` : ''}</span><span class="goal-row-arrow" aria-hidden="true">›</span></button></li>`;
  };

  function render() {
    const records = active();
    const dateType = mode === 'overview' ? 'month' : mode;
    const sections = types(records).map(type => {
      const current = period(type);
      const group = goalsByArea(records.filter(g => {
        if (g.type === type) return type === 'adhoc' || g.period === current;
        return type === 'week' && g.type === 'day' && periodOf('week',g.period) === current;
      }));
      const matching = area ? group.filter(g => g.area.toLocaleLowerCase() === area.toLocaleLowerCase()) : group;
      return `<section class="period-section" data-period="${type}">
        <header><div><h2>${headings[type]}</h2>${type === 'adhoc' ? '' : `<span>${escape(labelOf(type,current))}</span>`}</div>${add(type,area,type === 'adhoc' ? '+ Add goal' : `+ ${periods[type]} goal`)}</header>
        ${matching.length ? matching.map(group => `<div class="period-area">
          <div class="period-area-header">${area ? `<h3>${escape(group.area)}</h3>` : `<h3><button type="button" data-plan-area="${escape(group.area)}">${escape(group.area)} <span aria-hidden="true">›</span></button></h3>`}</div>
          <ul>${group.goals.map(g => goalRow(g,records)).join('')}</ul>
        </div>`).join('') : '<p class="period-empty">No goals planned for this period.</p>'}
      </section>`;
    });
    root.innerHTML = `<div class="period-toolbar">
      <div class="period-tabs" role="group" aria-label="Goal timeframe">${[['overview','Overview'],...Object.entries(periods)].map(([key,label]) => `<button type="button" data-plan-mode="${key}" aria-pressed="${mode === key}">${label}</button>`).join('')}</div>
      <div class="period-date"><button type="button" data-plan-shift="-1" aria-label="Previous period">‹</button><button type="button" data-plan-date>${escape(labelOf(dateType,period(dateType)))}</button><button type="button" data-plan-shift="1" aria-label="Next period">›</button></div>
    </div>
    ${area ? `<header class="period-area-title"><button type="button" data-plan-area="">← All areas</button><h2>${escape(area)}</h2></header>` : ''}
    <div class="period-sections">${sections.join('')}</div>`;
    if (detail.open) {
      const focused = detail.contains(document.activeElement);
      renderDetail();
      if (focused) detail.querySelector('[data-plan-close]')?.focus();
    }
  }

  function renderDetail() {
    const records = active();
    const goal = records.find(g => g.id === goalId);
    if (!goal) { if (detail.open) detail.close(); return; }
    const state = getData().state;
    const parent = records.find(g => g.id === goal.parentId);
    const children = records.filter(g => g.parentId === goal.id);
    const tasks = state.tasks.filter(task => !task.archived && task.goalId === goal.id);
    const childType = {quarter:'month',month:'week'}[goal.type];
    const isDated = Boolean(periods[goal.type]);
    detail.innerHTML = `<div class="period-detail-inner">
      <header class="period-detail-top"><button type="button" data-plan-close>← Goals</button>${partner() ? '' : '<button type="button" class="primary" data-plan-edit>Edit goal</button>'}</header>
      <p class="period-detail-meta">${escape(areaOf(goal))}${goal.period ? ' · '+escape(labelOf(goal.type,goal.period)) : ''}</p>
      <h2 id="period-detail-title">${escape(goal.title)}</h2>
      <p class="period-detail-status"><span class="goal-dot" data-status="${statusOf(goal)}" aria-hidden="true"></span>${({todo:'To do',progress:'In progress',done:'Done'})[statusOf(goal)]}</p>
      ${parent ? `<p class="period-parent">Supports <button type="button" data-plan-goal="${escape(parent.id)}">${escape(parent.title)}</button></p>` : ''}
      ${goal.notes ? `<p class="period-notes">${escape(goal.notes)}</p>` : ''}
      ${childType || children.length ? `<section><header><h3>${childType ? (childType === 'month' ? 'Monthly goals' : 'Weekly goals') : 'Linked goals'}</h3>${childType && !partner() ? `<button type="button" data-plan-child="${childType}">+ Add ${childType} goal</button>` : ''}</header>${children.length ? `<ul class="period-detail-list">${children.map(child => goalRow(child,records)).join('')}</ul>` : '<p class="period-empty">No linked goals yet.</p>'}</section>` : ''}
      <section><header><h3>Linked tasks</h3>${isDated && !partner() ? '<button type="button" data-plan-task-new>+ Add weekly task</button>' : ''}</header>
      ${tasks.length ? `<ul class="period-detail-list">${tasks.map(task => `<li><button type="button" data-plan-task="${escape(task.id)}">${escape(task.title)}</button><small>${state.lists.find(list => list.id === task.listId)?.isDone ? 'Done' : 'Open'}</small></li>`).join('')}</ul>` : '<p class="period-empty">No linked tasks yet.</p>'}</section>
      ${partner() ? '' : '<button type="button" class="period-archive" data-plan-archive>Archive goal</button>'}
      <p class="error" data-plan-error role="alert"></p>
    </div>`;
  }

  function showGoal(id) {
    if (!active().some(g => g.id === id)) return;
    goalId = id;
    renderDetail();
    if (!detail.open) detail.showModal();
    detail.querySelector('[data-plan-close]')?.focus();
  }

  function shift(delta) {
    const value = date || today();
    const next = new Date(value+'T12:00:00Z');
    if (mode === 'week') next.setUTCDate(next.getUTCDate()+delta*7);
    else {
      const day = next.getUTCDate();
      next.setUTCDate(1);
      next.setUTCMonth(next.getUTCMonth()+delta*(mode === 'quarter' ? 3 : 1));
      const daysInMonth = new Date(Date.UTC(next.getUTCFullYear(),next.getUTCMonth()+1,0)).getUTCDate();
      next.setUTCDate(Math.min(day,daysInMonth));
    }
    date = next.toISOString().slice(0,10);
    render();
    root.querySelector(`[data-plan-shift="${delta}"]`)?.focus();
  }

  root.addEventListener('click',event => {
    const button = event.target.closest('button');
    if (!button) return;
    const {planMode,planShift,planArea,planGoal,planAdd} = button.dataset;
    if (planMode) {
      mode = planMode;
      render();
      root.querySelector(`[data-plan-mode="${mode}"]`)?.focus();
    } else if (planShift) shift(Number(planShift));
    else if (button.hasAttribute('data-plan-date')) {
      const type = mode === 'overview' ? 'month' : mode;
      const apply = value => {date = value; render(); queueMicrotask(()=>root.querySelector('[data-plan-date]')?.focus());};
      if (type === 'week') pickDate({value:date || today(),title:'Choose a planning week',onSelect:apply});
      else pickPeriod({type,value:period(type),onSelect:selected => {
        if (selected === period(type)) apply(date || today());
        else if (selected === periodOf(type,today())) apply(today());
        else apply(dateOf(type,selected));
      }});
    } else if (planArea !== undefined) {
      area = planArea;
      render();
      window.scrollTo(0,0);
      root.querySelector(area ? '[data-plan-area=""]' : '[data-plan-mode][aria-pressed=true]')?.focus();
    } else if (planGoal) showGoal(planGoal);
    else if (planAdd && !partner()) open('',planAdd,{period:period(planAdd),category:button.dataset.area || ''});
  });

  function afterClosingDetail(action) {
    const id = goalId;
    detail.close();
    const editor = action();
    if (editor?.open) editor.addEventListener('close',() => {
      if (active().some(goal => goal.id === id)) showGoal(id);
    },{once:true});
  }

  detail.addEventListener('click',async event => {
    const button = event.target.closest('button');
    if (!button) return;
    const goal = active().find(g => g.id === goalId);
    if (!goal) return;
    const {planGoal,planChild,planTask} = button.dataset;
    if (button.hasAttribute('data-plan-close')) detail.close();
    else if (planGoal) showGoal(planGoal);
    else if (planTask) afterClosingDetail(() => openTask(planTask));
    else if (!partner() && button.hasAttribute('data-plan-edit')) afterClosingDetail(() => open(goal.id));
    else if (!partner() && button.hasAttribute('data-plan-archive')) {
      try { if (await archiveGoal(goal.id) && detail.open) detail.close(); }
      catch (error) { detail.querySelector('[data-plan-error]').textContent = error.message; }
    } else if (!partner() && planChild) {
      let childPeriod = period(planChild);
      if (planChild === 'month' && periodOf('quarter',childPeriod+'-01') !== goal.period) {
        childPeriod = goal.period.slice(0,4)+'-'+String((Number(goal.period.at(-1))-1)*3+1).padStart(2,'0');
      }
      if (planChild === 'week' && !childPeriod.startsWith(goal.period)) {
        const first = new Date(goal.period+'-01T12:00:00Z');
        first.setUTCDate(1+(8-first.getUTCDay())%7);
        childPeriod = first.toISOString().slice(0,10);
      }
      afterClosingDetail(() => open('',planChild,{period:childPeriod,category:areaOf(goal),parentId:goal.id}));
    } else if (!partner() && button.hasAttribute('data-plan-task-new')) {
      afterClosingDetail(() => createTask(goal.id,goal.type === 'week' ? goal.period : period('week')));
    }
  });

  return {render,showGoal,newGoal:() => {
    const type = mode === 'overview' ? 'month' : mode;
    return open('',type,{period:period(type),category:area});
  },reset() { date = ''; mode = 'overview'; area = ''; goalId = ''; }};
}

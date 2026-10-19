import assert from 'node:assert/strict';
import {titleReady,taskInPeriod,taskColumns,swipeIntent} from '../life/planner-interactions.js';
assert.equal(titleReady('  '),false);assert.equal(titleReady('First task'),true);assert.equal(titleReady('First task',true),false);
const lists=[{id:'ideas',name:'Idea Box',isDone:false},{id:'progress',name:'In Progress',isDone:false}];
const state={lists,tasks:[{id:'a',listId:'ideas',dueDate:''},{id:'b',listId:'ideas',dueDate:'2026-10-20'},{id:'c',listId:'progress',dueDate:'2026-11-01'}],sprints:{'2026-10-19':{taskIds:['b']}}};
assert.equal(taskInPeriod(state.tasks[2],'month','2026-10-19',state),false);
assert.equal(taskInPeriod(state.tasks[1],'week','2026-10-19',state),true);
const columns=taskColumns(state,lists,'2026-10-19','day','2026-10-19');
assert.deepEqual(columns.map(c=>c.id),['ideas','this-week','progress']);
assert.deepEqual(columns[0].tasks.map(t=>t.id),['a'],'Idea Box stays all time; committed idea appears once in This week');
assert.deepEqual(columns[1].tasks.map(t=>t.id),['b']);
assert.equal(columns[2].tasks.length,0);
assert.equal(state.tasks[1].dueDate,'2026-10-20','Commitment does not alter deadline');
assert.equal(swipeIntent({dx:65,dy:4,elapsed:300,open:false}), 'open');
assert.equal(swipeIntent({dx:-65,dy:4,elapsed:300,open:true}), 'close');
assert.equal(swipeIntent({dx:20,dy:100,elapsed:100,open:false}),null);
assert.equal(swipeIntent({dx:7,dy:0,elapsed:5,open:false}),null,'Tiny jitter never opens drawer');

const committedWorkflow={...state,sprints:{'2026-10-19':{taskIds:['b','c']}}};const overview=taskColumns(committedWorkflow,lists,'2026-10-19','all','2026-10-19');assert.deepEqual(overview[1].tasks.map(t=>t.id),['b','c']);assert.deepEqual(overview[2].tasks.map(t=>t.id),['c'],'Weekly overview does not move workflow records');assert.equal(committedWorkflow.tasks[2].listId,'progress');

console.log('17 task readiness, period, weekly workflow and drawer gesture checks passed');

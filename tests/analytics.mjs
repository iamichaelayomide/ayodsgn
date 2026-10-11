import assert from 'node:assert/strict';
import {goalProgress} from '../life/analytics.js';
const state={goals:[{id:'q',type:'quarter'},{id:'m',parentId:'q'},{id:'w',parentId:'m'}],lists:[{id:'todo',isDone:false},{id:'done',isDone:true}],tasks:[{id:'1',goalId:'q',listId:'done'},{id:'2',goalId:'w',listId:'todo'},{id:'3',goalId:'m',listId:'done',archived:true},{id:'4',goalId:'other',listId:'done'}]};
assert.deepEqual(goalProgress(state,state.goals[0]),{total:2,done:1,percent:50});assert.equal(goalProgress(state,{id:'empty'}).percent,null);state.tasks[1].listId='done';assert.equal(goalProgress(state,state.goals[0]).percent,100);state.goals[2].archived=true;assert.equal(goalProgress(state,state.goals[0]).total,1);console.log('4 Analytics checks passed');

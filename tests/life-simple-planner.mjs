import assert from 'node:assert/strict';
import * as planner from '../life/planner-interactions.js';
assert.equal(typeof planner.creationActions,'function','Contextual creation choices are explicit');
assert.deepEqual(planner.creationActions('board','tasks'),['task','goal']);
assert.deepEqual(planner.creationActions('goals'),['goal','task']);
assert.deepEqual(planner.creationActions('applications'),['opportunity','group']);
assert.deepEqual(planner.creationActions('notes'),['note']);
assert.equal(planner.laneTone({name:'Idea Box'}),'idea');
assert.equal(planner.laneTone({name:'In Progress'}),'progress');
assert.equal(planner.laneTone({name:'Review'}),'review');
assert.equal(planner.laneTone({name:'My special list'}),'neutral','Custom names do not inherit a guessed workflow');
assert.equal(planner.laneTone({name:'Finished',isDone:true}),'done');
console.log('Contextual add choices and subtle status-color semantics passed');

const {readFileSync}=await import('node:fs');
const css=readFileSync(new URL('../life/simple-ui.css',import.meta.url),'utf8');
assert.match(css,/\.board\.is-list:not\(\[hidden\]\)/,'List layout must not override hidden views');

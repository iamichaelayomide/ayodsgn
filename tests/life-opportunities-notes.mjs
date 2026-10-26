import assert from 'node:assert/strict';
import {createAyoOS} from '../life/ayo-os.js';
const handlers={};const root={innerHTML:'',addEventListener(type,fn){handlers[type]=fn;},querySelector(){return null;},querySelectorAll(){return [];}};
createAyoOS({root,request(){throw Error('Clearing a local field must not make a request');},escape:String,role:()=> 'owner'});
let changes=0;const date={value:'2026-10-26',dispatchEvent(event){assert.equal(event.type,'change');assert.equal(event.bubbles,true);changes++;}};
const button={dataset:{ayoAction:'clear-followup'},closest(selector){assert.equal(selector,'form');return {elements:{followUpDate:date}};}};
await handlers.click({target:{closest:()=>button}});
assert.equal(date.value,'','Clear date empties the native field consumed by the date enhancer');assert.equal(changes,1,'Calendar label receives exactly one change event');
console.log('Follow-up clearing checks passed');

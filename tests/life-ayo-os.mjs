import assert from 'node:assert/strict';
import {createAyoOS} from '../life/ayo-os.js';
const root={innerHTML:'',addEventListener(){},querySelector(){return null;},querySelectorAll(){return [];}};
let resolve;const pending=new Promise(r=>resolve=r);
const os=createAyoOS({root,request:()=>pending,escape:s=>String(s),role:()=> 'owner'});
os.render();os.reset();resolve({version:1,state:{companies:[{name:'PRIVATE'}],contacts:[],opportunities:[],research:[],drafts:[],approvals:[]},approvalIds:{}});
await new Promise(r=>setTimeout(r,0));assert.equal(root.innerHTML,'','Late response cannot repopulate signed-out account');
let calls=0;const privateView=createAyoOS({root,request:()=>{calls++;},escape:String,role:()=> 'partner'});privateView.render();assert.equal(calls,0);assert.match(root.innerHTML,/account owner/);
console.log('Ayo OS session isolation checks passed');

export function createOpportunityCVPicker({request,getData,uploadDocument,escape:e,onSaved}){
 let dialog=null,generation=0;
 function reset(){generation++;const old=dialog;dialog=null;if(old){old.close();old.remove();}}
 function open(id){
  reset();const initial=getData(),op=initial?.state.opportunities.find(o=>o.id===id);if(!op)return;
  const owner=initial.workspaceId,current=generation,d=document.createElement('dialog');dialog=d;d.className='ayo-cv-dialog';
  d.innerHTML=`<form><header><h2>Choose a CV</h2><button type="button" data-close aria-label="Close CV picker">×</button></header><div class="ayo-cv-picker-body"><label for="ayo-saved-cv">Saved CVs</label><select id="ayo-saved-cv" name="documentId"><option value="">Choose a saved CV</option>${(initial.documents||[]).filter(doc=>doc.kind==='cv').map(doc=>`<option value="${e(doc.id)}">${e(doc.name)}</option>`).join('')}</select><span class="ayo-cv-picker-or">or</span><button type="button" data-upload>Upload CV</button><input type="file" accept=".pdf,.doc,.docx" hidden><p role="alert"></p></div><footer><button type="button" data-close>Cancel</button><button type="submit" class="primary" disabled>Attach CV</button></footer></form>`;
  document.body.append(d);d.showModal();const form=d.querySelector('form'),select=form.elements.documentId,file=d.querySelector('input[type=file]'),submit=d.querySelector('[type=submit]'),alert=d.querySelector('[role=alert]');let pending=false;
  const valid=()=>current===generation&&dialog===d&&getData()?.workspaceId===owner;
  const lock=value=>{pending=value;d.querySelectorAll('button,select').forEach(el=>el.disabled=value);submit.disabled=value||!select.value;};
  d.addEventListener('close',()=>{d.remove();if(dialog===d){dialog=null;generation++;}});
  d.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>{if(!pending)d.close();});
  d.addEventListener('cancel',event=>{if(pending)event.preventDefault();});
  select.onchange=()=>{submit.disabled=!select.value;};d.querySelector('[data-upload]').onclick=()=>file.click();
  async function attach(docId,snapshot){
   if(!valid()||snapshot.workspaceId!==owner)return;
   const opportunity=snapshot.state.opportunities.find(o=>o.id===id);if(!opportunity)throw Error('This opportunity is no longer available.');
   if(!(snapshot.documents||[]).some(doc=>doc.id===docId&&doc.kind==='cv'))throw Error('Choose an available CV.');
   const next=await request('ayo-os.mutate',{workspaceId:owner,version:snapshot.version,operation:'opportunity.save',args:{id,documentIds:[...new Set([...(opportunity.documentIds||[]),docId])]}});
   if(!valid())return;await onSaved(next);if(valid())d.close();
  }
  form.onsubmit=async event=>{event.preventDefault();if(pending||!select.value)return;lock(true);alert.textContent='';try{await attach(select.value,getData());}catch(error){if(valid()){alert.textContent=error.message;lock(false);}}};
  file.onchange=async()=>{
   const chosen=file.files?.[0];if(!chosen||pending)return;lock(true);alert.textContent='Uploading CV…';
   try{const snapshot=getData(),tracker=snapshot.documentTrackers?.[0];if(!uploadDocument||!tracker)throw Error('Add a document folder in CVs & documents first.');const body=new FormData();body.append('file',chosen);body.append('version',String(snapshot.documentVersion));body.append('trackerId',tracker.id);body.append('kind','cv');body.append('requestId',crypto.randomUUID());const uploaded=await uploadDocument(body);if(!valid())return;const docId=uploaded.receipt?.recordId;if(!docId)throw Error('Your upload finished. Reopen this picker to choose the saved CV.');const fresh=await request('ayo-os');if(!valid())return;await attach(docId,fresh);}catch(error){if(valid()){alert.textContent=error.message;lock(false);file.value='';}}
  };
 }
 return {open,reset};
}

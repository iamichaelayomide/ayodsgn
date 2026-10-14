const extensions=new Set(['docx','pdf','txt','png','jpg','jpeg','webp']);
export function uploadSelection(files){
 if(files.length!==1)return {error:'Choose one document at a time.'};
 const file=files[0];
 if(!extensions.has(file.name.split('.').pop().toLowerCase()))return {error:'Choose a Word, PDF, text, PNG, JPG or WebP document.'};
 if(file.size<1||file.size>5*1024*1024)return {error:'Choose a document up to 5 MB.'};
 return {file,size:file.size<1024*1024?`${Math.max(1,Math.round(file.size/1024))} KB`:`${(file.size/(1024*1024)).toFixed(1)} MB`};
}
export function bindUploadCard(dialog){
 const input=dialog.querySelector('[name=file]'),card=dialog.querySelector('.application-upload-card'),name=dialog.querySelector('[data-upload-name]'),help=dialog.querySelector('[data-upload-help]'),remove=dialog.querySelector('[data-upload-remove]'),error=dialog.querySelector('[data-upload-error]'),submit=dialog.querySelector('[type=submit]');
 function update(){
  const selected=input.files.length?uploadSelection(input.files):null;
  if(selected?.error){input.value='';error.textContent=selected.error;}else error.textContent='';
  const file=selected?.file;
  card.classList.toggle('has-file',!!file);name.textContent=file?file.name:'Click to upload';help.textContent=file?`${selected.size} · Click to replace`:'or drag and drop';remove.hidden=!file;submit.disabled=!file;
 }
 input.addEventListener('change',update);
 remove.addEventListener('click',()=>{input.value='';update();input.focus();});
 for(const type of ['dragenter','dragover'])card.addEventListener(type,event=>{event.preventDefault();if(dialog.querySelector('form').getAttribute('aria-busy')==='true')return;card.classList.add('is-dragging');});
 card.addEventListener('dragleave',event=>{if(!card.contains(event.relatedTarget))card.classList.remove('is-dragging');});
 card.addEventListener('drop',event=>{
  event.preventDefault();card.classList.remove('is-dragging');if(dialog.querySelector('form').getAttribute('aria-busy')==='true')return;
  const selected=uploadSelection(event.dataTransfer?.files||[]);
  if(selected.error){error.textContent=selected.error;return;}
  input.files=event.dataTransfer.files;update();
 });
 update();
}

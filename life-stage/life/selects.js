// Keep the form's select values as the source of truth; provide a branded listbox UI.
export function installSelects() {
  const controls = new Map();
  let opened = null, sequence = 0;
  function close(focus = false) {
    if (!opened) return;
    const control = opened; opened = null;
    control.menu.remove(); control.button.setAttribute('aria-expanded', 'false');
    if (focus && control.button.isConnected) control.button.focus();
  }
  function sync(control) {
    const {select, button} = control;
    button.textContent = select.multiple ? ([...select.selectedOptions].map(o=>o.textContent).join(', ')||'No dependencies') : select.selectedOptions[0]?.textContent || 'Choose…';
    button.disabled = select.disabled;
    button.setAttribute('aria-description',`Selected: ${button.textContent}`);
    const label = select.getAttribute('aria-label') || [...(select.labels || [])].map(l => {const copy=l.cloneNode(true);copy.querySelectorAll('select,button').forEach(el=>el.remove());return copy.textContent.trim();}).join(' ');
    button.setAttribute('aria-label', label || select.name || 'Choose an option');
  }
  function open(control, direction = 0) {
    close(); sync(control);
    const {select, button} = control;
    const menu = document.createElement('div'); menu.className = 'select-menu';
    menu.id = button.getAttribute('aria-controls'); menu.setAttribute('role', 'listbox');
    menu.setAttribute('aria-label', button.getAttribute('aria-label'));
    if(select.multiple)menu.setAttribute('aria-multiselectable','true');
    control.menu = menu; opened = control;
    const options = [...select.options];
    const choose = index => {
      if (options[index].disabled) return;
      if(select.multiple){options[index].selected=!options[index].selected;menu.querySelectorAll('[role=option]')[index].setAttribute('aria-selected',String(options[index].selected));}else{select.selectedIndex = index; close(true);} sync(control);
      select.dispatchEvent(new Event('change', {bubbles:true})); refresh();
    };
    const items = options.map((option,index) => {
      const item = document.createElement('button'); item.type = 'button'; item.className = 'select-option';
      item.setAttribute('role','option'); item.setAttribute('aria-selected',String(option.selected));
      item.disabled = option.disabled; item.tabIndex = -1; item.textContent = option.textContent;
      item.addEventListener('click', () => choose(index)); menu.append(item); return item;
    });
    // A dialog's children remain in its top layer, above its backdrop.
    (select.closest('dialog') || document.body).append(menu);
    const rect = button.getBoundingClientRect();
    const width = Math.min(rect.width,innerWidth-24);
    menu.style.width = `${width}px`; menu.style.left = `${Math.max(12,Math.min(rect.left,innerWidth-width-12))}px`;
    const below = innerHeight-rect.bottom-12, above = rect.top-12;
    const upward = below < Math.min(260,menu.scrollHeight) && above > below;
    menu.style.maxHeight = `${Math.max(80,Math.min(280,upward?above:below))}px`;
    menu.style.top = `${upward?Math.max(12,rect.top-menu.getBoundingClientRect().height-6):rect.bottom+6}px`;
    button.setAttribute('aria-expanded','true');
    let index = select.selectedIndex;
    if (index < 0 || options[index]?.disabled) index = options.findIndex(o=>!o.disabled);
    if (direction === -1 && select.selectedIndex < 0) index = items.length-1;
    items[index]?.focus();
    let typed = '', lastType = 0;
    menu.addEventListener('keydown', event => {
      const current = items.indexOf(document.activeElement);
      let target = current;
      if (event.key==='Escape') {event.preventDefault(); event.stopPropagation(); close(true); return;}
      if (event.key==='Tab') {close(true); return;}
      if (event.key==='ArrowDown' || event.key==='ArrowUp') {
        const step = event.key==='ArrowDown'?1:-1;
        for (let n=0;n<items.length;n++) {target=(target+step+items.length)%items.length;if(!items[target].disabled)break;}
      } else if (event.key==='Home') target=items.findIndex(i=>!i.disabled);
      else if (event.key==='End') {target=items.length-1;while(target>=0&&items[target].disabled)target--;}
      else if(event.key.length===1 && !event.ctrlKey && !event.metaKey && event.key!==' ') {
        typed=Date.now()-lastType>700?event.key:typed+event.key; lastType=Date.now();
        target=options.findIndex(o=>!o.disabled && o.textContent.toLowerCase().startsWith(typed.toLowerCase()));
      } else return;
      event.preventDefault(); if(target>=0)items[target].focus();
    });
  }
  function refresh() {
    for (const [select, control] of controls) {
      if (!select.isConnected) {if(opened===control)close();controls.delete(select);continue;}
      sync(control);
    }
    document.querySelectorAll('select').forEach(select => {
      if (controls.has(select)) return;
      const wrapper=document.createElement('span'); wrapper.className='select-control';
      select.before(wrapper); wrapper.append(select); select.hidden=true;
      const button=document.createElement('button'); button.type='button'; button.className='select-trigger';
      button.setAttribute('aria-haspopup','listbox');button.setAttribute('aria-expanded','false');
      button.setAttribute('aria-controls',`select-menu-${++sequence}`);wrapper.append(button);
      const control={select,button,menu:null};controls.set(select,control);sync(control);
      button.addEventListener('click',()=>opened===control?close(true):open(control));
      button.addEventListener('keydown',event=>{
        if(['ArrowDown','ArrowUp','Home','End'].includes(event.key)){event.preventDefault();open(control,event.key==='ArrowUp'?-1:1);}
      });
      select.addEventListener('change',()=>sync(control));
    });
  }
  document.addEventListener('pointerdown',event=>{if(opened&&!opened.menu.contains(event.target)&&!opened.button.contains(event.target))close();});
  window.addEventListener('resize',()=>close());
  document.addEventListener('scroll',event=>{if(opened&&!opened.menu.contains(event.target))close();},true);
  document.querySelectorAll('dialog').forEach(dialog=>dialog.addEventListener('close',()=>close()));
  document.addEventListener('reset',()=>queueMicrotask(refresh));
  new MutationObserver(records=>{
    // Ignore our button labels and popup DOM; only native option changes require resync.
    if(records.some(r=>r.target.closest?.('select') || [...r.addedNodes].some(n=>n.nodeType===1&&(n.matches('select')||n.querySelector('select')))))refresh();
  }).observe(document.body,{childList:true,subtree:true});
  refresh(); return refresh;
}

// Session-only navigation: return to a prior view without changing planner data.
export function createNavigationHistory(limit=40){
 const entries=[];const copy=value=>JSON.parse(JSON.stringify(value));
 return {remember(value){const entry=copy(value);if(JSON.stringify(entries.at(-1))===JSON.stringify(entry))return;entries.push(entry);if(entries.length>limit)entries.shift();},back(){return entries.length?copy(entries.pop()):null;},get canBack(){return entries.length>0;},clear(){entries.length=0;},snapshot(){return copy(entries);},restore(values){entries.splice(0,entries.length,...copy(values||[]).slice(-limit));}};
}

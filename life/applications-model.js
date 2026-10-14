export const stageName=(tracker,key)=>tracker?.stages.find(s=>s.id===key)?.name||key;
export function opportunities(state,{tracker='',category='',stage='',query='',view='all',today=''}={}){
 const activeTrackers=new Set(state.trackers.filter(t=>!t.archived).map(t=>t.id));
 const activeCategories=new Set(state.categories.filter(c=>!c.archived).map(c=>c.id));
 return state.opportunities.filter(o=>{
  const archived=o.archived||!activeTrackers.has(o.trackerId)||(o.categoryId&&!activeCategories.has(o.categoryId));
  if((view==='archived')!==Boolean(archived))return false;
  if(tracker&&o.trackerId!==tracker||category&&o.categoryId!==category||stage&&o.stage!==stage)return false;
  if(view==='not-applied'&&o.appliedDate||view==='applied'&&!o.appliedDate||view==='upcoming'&&o.availability!=='upcoming')return false;
  if(view==='deadlines'&&(!o.deadline||o.deadline<today||o.deadline>new Date(new Date(today+'T12:00:00Z').getTime()+7*86400000).toISOString().slice(0,10)))return false;
  if(view==='successful'&&!state.trackers.find(t=>t.id===o.trackerId)?.stages.find(s=>s.id===o.stage)?.successful)return false;
  if(view==='waiting'){const s=state.trackers.find(t=>t.id===o.trackerId)?.stages.find(s=>s.id===o.stage);if(!s?.submitted||s.successful||['withdrawn','rejected'].includes(o.stage))return false;}
  return !query||[o.title,o.organisation,o.description,o.notes,o.location,o.cycle,...o.customFields.map(f=>f.name+' '+f.value)].join(' ').toLocaleLowerCase().includes(query.toLocaleLowerCase().trim());
 }).sort((a,b)=>(a.deadline||'9999').localeCompare(b.deadline||'9999')||b.updatedAt.localeCompare(a.updatedAt));
}
export function documentsFor(state,opportunity){return state.documents.filter(d=>!d.archived&&d.trackerId===opportunity.trackerId&&(!d.categoryId||d.categoryId===opportunity.categoryId)&&(!d.opportunityId||d.opportunityId===opportunity.id));}

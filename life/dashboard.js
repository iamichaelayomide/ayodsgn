// Snapshot counts and recorded email activity, never inferred application outcomes.
import {opportunityStatus,stages} from './opportunities-view.js?v=3';
const dayKey=value=>{
 const date=new Date(value);
 return Number.isFinite(date.getTime())?new Intl.DateTimeFormat('en-CA',{timeZone:'Africa/Lagos',year:'numeric',month:'2-digit',day:'2-digit'}).format(date):'';
};
export function opportunityOverview(rows,communications,today,pipelineOf,names){
 const ids=new Set(rows.map(o=>o.id)),seen=new Set();
 const start=new Date(today+'T12:00:00Z');start.setUTCDate(start.getUTCDate()-27);
 const days=Array.from({length:28},(_,i)=>{const d=new Date(start);d.setUTCDate(d.getUTCDate()+i);return {date:d.toISOString().slice(0,10),sent:0,received:0};});
 for(const m of communications||[]){
  if(!ids.has(m.opportunityId)||!['sent','received'].includes(m.direction))continue;
  const key=m.messageId||m.id;if(key&&seen.has(key))continue;if(key)seen.add(key);
  const day=days.find(d=>d.date===dayKey(m.occurredAt));if(day)day[m.direction]++;
 }
 const weeks=Array.from({length:4},(_,i)=>{const part=days.slice(i*7,i*7+7);return {start:part[0].date,end:part.at(-1).date,sent:part.reduce((n,d)=>n+d.sent,0),received:part.reduce((n,d)=>n+d.received,0)};});
 const pipelines=Object.entries(names).map(([id,name])=>({id,name,count:rows.filter(o=>pipelineOf(o)===id).length})).filter(p=>p.count).sort((a,b)=>b.count-a.count);
 const statuses=Object.entries(rows.reduce((out,o)=>{const s=opportunityStatus(o,pipelineOf(o)==='ai-testing');out[s]=(out[s]||0)+1;return out;},{}));
 return {days,weeks,pipelines,statuses,total:rows.length};
}
// SVG keeps this small, non-React dashboard responsive without a chart runtime.
// Status slices are categorical shares; lengths provide the precise comparison.
const tones={researched:'#a6b1c5',ready:'#899de0',drafted:'#ac9bd5',scheduled:'#d4a752',sent:'#4285ee',submitted:'#4285ee',replied:'#39a99c',conversation:'#39a99c',offer:'#e2ac48',won:'#50ad7b',accepted:'#50ad7b',closed:'#b0b2ba',bounced:'#db8585','not-accepted':'#b0b2ba',pending:'#a6b1c5',paused:'#c6b08b',incomplete:'#c6b08b'};
export function renderOpportunityOverview(model,e,scoped=false){
 const statusRows=model.statuses.map(([id,count])=>({id,name:stages[id]||id,count,color:tones[id]||'#9d9eaf'})).sort((a,b)=>b.count-a.count);
 let offset=0;const circles=statusRows.map(p=>{const length=p.count/Math.max(1,model.total)*100,start=offset;offset+=length;return `<circle class="status-arc" cx="80" cy="80" r="62" fill="none" stroke="${p.color}" stroke-width="17" pathLength="100" stroke-dasharray="${Math.max(0,length-.65)} ${100-Math.max(0,length-.65)}" stroke-dashoffset="${-start}" transform="rotate(-90 80 80)"><title>${e(p.name)}: ${p.count}</title></circle>`;}).join('');
 const breakdown=scoped?statusRows:model.pipelines.map((p,i)=>({...p,color:['#4285ee','#39a99c','#ac9bd5','#e2ac48','#93a4bf'][i%5]}));
 const legend=statusRows.length?statusRows.map(p=>`<li><i style="background:${p.color}" aria-hidden="true"></i><span>${e(p.name)}</span><strong>${p.count}</strong></li>`).join(''):'<li>No applications yet.</li>';
 return `<div class="opportunity-insights"><section class="insight-card application-status-card" aria-labelledby="status-heading"><header><h2 id="status-heading">Application status</h2><span class="chart-period">Current snapshot</span></header><div class="status-composition"><div class="status-donut"><svg viewBox="0 0 160 160" role="img" aria-label="Application status distribution: ${model.total} opportunities"><circle cx="80" cy="80" r="62" fill="none" stroke="#f0f1f4" stroke-width="17"/>${circles}</svg><div class="donut-total"><strong>${model.total}</strong><span>opportunities</span></div></div><ul class="status-legend">${legend}</ul></div></section><section class="insight-card pipeline-card" aria-labelledby="pipeline-heading"><header><h2 id="pipeline-heading">${scoped?'Stage breakdown':'Opportunity mix'}</h2><span class="chart-period">${model.total} total</span></header><div class="pipeline-bars">${breakdown.map(p=>`<${scoped?'div':'button type="button"'} ${scoped?'':`data-ayo-action="pipeline" data-id="${e(p.id)}" aria-label="Show ${e(p.name)}: ${p.count} opportunities"`} class="pipeline-breakdown" style="--segment:${p.color}"><span>${e(p.name)}</span><strong>${p.count}<small>${Math.round(p.count/Math.max(1,model.total)*100)}%</small></strong><span class="pipeline-track" aria-hidden="true"><i style="width:${p.count/Math.max(1,model.total)*100}%"></i></span></${scoped?'div':'button'}>`).join('')||'<p class="chart-no-data">Save an opportunity to see the breakdown.</p>'}</div></section></div>`;
}

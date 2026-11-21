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
 const statuses=Object.entries(rows.reduce((out,o)=>{const s=opportunityStatus(o);out[s]=(out[s]||0)+1;return out;},{}));
 return {days,weeks,pipelines,statuses,total:rows.length};
}
export function renderOpportunityOverview(model,e,scoped=false){
 const date=s=>new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'short',timeZone:'UTC'}).format(new Date(s+'T12:00:00Z'));
 const max=Math.max(1,...model.weeks.map(w=>Math.max(w.sent,w.received))),sent=model.weeks.reduce((n,w)=>n+w.sent,0),received=model.weeks.reduce((n,w)=>n+w.received,0);
 const breakdown=scoped?model.statuses.map(([id,count])=>({id,name:stages[id]||id,count})):model.pipelines;
 return `<div class="opportunity-insights"><section class="insight-card activity-card" aria-labelledby="activity-heading"><header><div><span class="chart-eyebrow">COMMUNICATIONS</span><h2 id="activity-heading">Email activity</h2></div><span class="chart-period">Last 28 days</span></header><div class="chart-headline"><strong>${sent+received}</strong><span>recorded emails<span class="chart-legend"><span><i class="sent"></i>${sent} sent</span><span><i class="received"></i>${received} received</span></span></span></div><div class="activity-chart" role="list" aria-label="Weekly recorded emails"><div class="chart-scale" aria-hidden="true"><span>${max}</span><span>0</span></div>${model.weeks.map(w=>`<div class="activity-week" role="listitem" tabindex="0" aria-label="${date(w.start)} to ${date(w.end)}: ${w.sent} sent, ${w.received} received"><div class="activity-columns"><div class="activity-track"><span class="activity-bar sent" style="--bar:${w.sent/max*100}%"><span>${w.sent}</span></span></div><div class="activity-track"><span class="activity-bar received" style="--bar:${w.received/max*100}%"><span>${w.received}</span></span></div></div><span class="activity-week-label">${date(w.start)}</span><span class="chart-tooltip">${date(w.start)} – ${date(w.end)} · ${w.sent} sent / ${w.received} received</span></div>`).join('')}</div>${!sent&&!received?'<p class="chart-empty-caption">No recorded emails in this period.</p>':''}</section><section class="insight-card pipeline-card" aria-labelledby="pipeline-heading"><header><div><span class="chart-eyebrow">${scoped?'APPLICATION PROGRESS':'YOUR OPPORTUNITIES'}</span><h2 id="pipeline-heading">${scoped?'Pipeline stages':'Opportunity mix'}</h2></div><span class="chart-period">${model.total} total</span></header><div class="segmented-overview" aria-hidden="true">${breakdown.map((p,i)=>`<i style="flex:${p.count};--segment:${['#2b70f0','#1db5c6','#ff9c33','#a385e0','#65b57c'][i%5]}"></i>`).join('')}</div><div class="pipeline-bars">${breakdown.map((p,i)=>`<${scoped?'div':'button type="button"'} ${scoped?'':`data-ayo-action="pipeline" data-id="${e(p.id)}" aria-label="Show ${e(p.name)}: ${p.count} opportunities"`} class="pipeline-breakdown" style="--segment:${['#2b70f0','#1db5c6','#ff9c33','#a385e0','#65b57c'][i%5]}"><span>${e(p.name)}</span><strong>${p.count}<small>${Math.round(p.count/Math.max(1,model.total)*100)}%</small></strong><span class="pipeline-track" aria-hidden="true"><i style="width:${p.count/Math.max(1,model.total)*100}%"></i></span></${scoped?'div':'button'}>`).join('')||'<p class="chart-no-data">Save your first opportunity to see its progress here.</p>'}</div></section></div>`;
}

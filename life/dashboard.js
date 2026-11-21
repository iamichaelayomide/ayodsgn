// Snapshot counts and recorded email activity, never inferred application outcomes.
import {opportunityStatus} from './opportunities-view.js?v=3';
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
 return {weeks,pipelines,statuses,total:rows.length};
}
export function renderOpportunityOverview(model,e){
 const date=s=>new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'short',timeZone:'UTC'}).format(new Date(s+'T12:00:00Z'));
 const max=Math.max(1,...model.weeks.map(w=>Math.max(w.sent,w.received)));
 const hasActivity=model.weeks.some(w=>w.sent+w.received);
 return `<div class="opportunity-insights"><section class="insight-card activity-card" aria-labelledby="activity-heading"><header><h2 id="activity-heading">Email activity</h2><span>Last 28 days</span></header>${hasActivity?`<div class="activity-chart" role="list" aria-label="Weekly recorded emails"><div class="chart-scale" aria-hidden="true"><span>${max}</span><span>0</span></div>${model.weeks.map(w=>`<div class="activity-week" role="listitem" tabindex="0" aria-label="${date(w.start)} to ${date(w.end)}: ${w.sent} sent, ${w.received} received"><div class="activity-columns"><span class="activity-bar sent" style="--bar:${w.sent/max*100}%"><span>${w.sent}</span></span><span class="activity-bar received" style="--bar:${w.received/max*100}%"><span>${w.received}</span></span></div><span class="activity-week-label">${date(w.start)}</span></div>`).join('')}</div><div class="chart-legend"><span><i class="sent"></i>Sent</span><span><i class="received"></i>Received</span></div>`:'<div class="chart-no-data"><img src="./icons/messages.svg?v=ios1" alt=""><p>No recorded emails in this period.</p></div>'}</section><section class="insight-card pipeline-card" aria-labelledby="pipeline-heading"><header><h2 id="pipeline-heading">Opportunity mix</h2><span>By pipeline</span></header><div class="pipeline-bars">${model.pipelines.map(p=>`<button type="button" data-ayo-action="pipeline" data-id="${e(p.id)}" aria-label="Show ${e(p.name)}: ${p.count} opportunities"><span>${e(p.name)}</span><strong>${p.count}</strong><span class="pipeline-track" aria-hidden="true"><i style="width:${p.count/Math.max(1,model.total)*100}%"></i></span></button>`).join('')||'<p class="chart-no-data">Your pipelines will appear here.</p>'}</div></section></div>`;
}

/** Presentation only: keep imported source titles and evidence unchanged. */
export const pipelines={nysc:'NYSC',freelance:'Freelance',career:'Career','ai-testing':'AI testing'};
export const stages={researched:'Researched',ready:'Ready',drafted:'Drafted',scheduled:'Scheduled',sent:'Sent',submitted:'Submitted',replied:'Replied',conversation:'In discussion',offer:'Offer',won:'Accepted',closed:'Closed',bounced:'Delivery failed',pending:'Pending',accepted:'Accepted','not-accepted':'Not accepted',paused:'Paused',incomplete:'Incomplete'};
export function safeLink(value){try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password?u.href:'';}catch{return '';}}
export function pipelineFor(o,c){return o.pipeline==='career'&&/^(Mercor|Taste(?: \/ TasteMakers)?|micro1)$/i.test(c?.name||'')?'ai-testing':o.pipeline;}
export function opportunityStatus(o,ai=false){
 const title=o.title||'';let stage=o.stage||'researched';
 const prefixes=[['DELIVERY FAILED','bounced'],['SENT','sent'],['SUBMITTED','submitted'],['FORM SUBMITTED','submitted'],['SCHEDULED','scheduled'],['REPLIED','replied'],['DECLINED','not-accepted'],['INCOMPLETE','incomplete'],['PROJECT PAUSED','paused']];
 for(const [prefix,value]of prefixes)if((stage==='researched'||!o.stage)&&title.startsWith(prefix+' — ')){stage=value;break;}
 if(ai)return stage==='accepted'||stage==='won'?'accepted':stage==='not-accepted'||stage==='closed'?'not-accepted':'pending';
 return stage;
}
export function opportunityLabel(o){
 let s=(o.title||'Opportunity').replace(/^(?:DELIVERY FAILED|SENT|SUBMITTED|FORM SUBMITTED|SCHEDULED|REPLIED|DECLINED|INCOMPLETE|PROFILE ACTIVE|INVITED TO APPLY|PROJECT PAUSED|STAGE 2|VIDEO REQUESTED) — /,'');
 s=s.replace(/^Application Submitted - /,'').replace(/ on Mercor$/,'').replace(/^Your profile is live — /,'').replace(/^Thank you for filling out: /,'');
 s=s.replace(/^NYSC (?:interest in|enquiry (?:on|for)|placement enquiry on) /i,'').replace(/^NYSC Placement (?:Enquiry|Application) \| /i,'').replace(/^For Recruitment Team \| NYSC Placement Enquiry - /i,'');
 s=s.replace(/^(?:Pouchers|Acceede|Foregate|Platos|Trade Lenda|STAXIS|Growwr|CreditChek|Datab|Indigenius|Mobihealth|Overite|Codar|BioVana|Tuteria|Fertitude|Swoop|AiWaziri)(?:'s)?\s+/i,'');
 return s.charAt(0).toUpperCase()+s.slice(1);
}
export function messageText(value){return String(value||'').replace(/<style[\s\S]*?<\/style>/gi,'').replace(/<[^>]+>/g,'').replace(/&nbsp;/g,' ').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&#39;/g,"'").replace(/&quot;/g,'"').split(/\n\s*On [^\n]+wrote:\s*\n|\n\s*-{2,}\s*Forwarded message/i)[0].trim();}
export function isActivityNote(r){return r.category==='activity'||/^(?:Correspondence \/ tracker evidence|Evidence checked|Gmail delivery-status notice)/i.test(r.body||'');}
export function summaryCounts(rows,today){return {tracking:rows.length,applied:rows.filter(o=>['sent','submitted'].includes(opportunityStatus(o))).length,followups:rows.filter(o=>o.followUpDate&&o.followUpDate<=today).length,accepted:rows.filter(o=>['accepted','won'].includes(opportunityStatus(o))).length};}

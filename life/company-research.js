export async function queueCompanyResearch({request,snapshot,id,isCurrent}){
 const opportunity=snapshot?.state.opportunities.find(o=>o.id===id);if(!opportunity)throw Error('This opportunity is unavailable.');
 const context=await request('ayo-os.agents.private.status',{workspaceId:snapshot.workspaceId});if(!isCurrent())return null;
 return request('ayo-os.agents.queue',{workspaceId:snapshot.workspaceId,opportunityId:id,query:'Research what this company does, recent verified activity, up to two relevant people with published professional contact details, and where my actual experience can help. Distinguish facts from possible opportunities. Add clear source links and concise plain English notes.',usePrivateContext:context.configured===true&&Object.hasOwn(context.selection?.documentsByPipeline||{},opportunity.pipeline),autoApply:true});
}

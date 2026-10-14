/** Suggestions use saved planner context; clicking one only prepares an editable message. */
export function chatSuggestions(state,applications,today){
 const tasks=(state?.tasks||[]).filter(t=>!t.archived&&!state.lists?.find(l=>l.id===t.listId)?.isDone);
 const due=tasks.filter(t=>t.dueDate&&t.dueDate<=today);
 const blocked=tasks.find(t=>t.blocker);
 const options=[{icon:'tick-square',label:due.length?'Plan my day · '+due.length+' due':'Plan my day',prompt:'Help me plan today around my tasks and the time I have.'}];
 if(blocked)options.push({icon:'messages',label:'Work through a blocker',prompt:'Help me work through the blocker on “'+blocked.title+'”. Suggest options before changing anything.'});
 else options.push({icon:'edit',label:'Turn a thought into a plan',prompt:'Help me turn a thought into a practical plan. Ask me what I want to work on.'});
 if(applications?.opportunities?.some(o=>!o.archived))options.push({icon:'attach-circle',label:'Review my applications',prompt:'Help me review my applications and decide what to prepare next. Do not mark anything applied.'});
 else options.push({icon:'calendar',label:'Make room for my week',prompt:'Help me organise my week. Ask about my priorities and available time before making changes.'});
 return options;
}

/** Input and response lifetimes are separate: barge-in never reuses an old command envelope. */
export function createNativeTurns(){
 const all=[];let input=null,response=null,captionTarget=null;const cancelledTools=new Set(),unassigned=[];
 const normalized=text=>String(text||'').toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim();
 function make(source='audio'){return {id:crypto.randomUUID(),source,hasSpeech:false,user:'',interim:'',request:'',kind:'unknown',output:'',buffers:[],receipts:[],errors:[],tools:Promise.resolve(),registered:false,callKeys:{},complete:false,cancelled:false,saved:false,repairing:false,repaired:false,startedAt:Date.now()};}
 function begin(source='audio'){const previous=input,value=make(source);all.push(value);input=value;
  // When a prior input has no final marker, don't silently attach its delayed caption to a new turn.
  if(!previous||previous.source==='greeting'||previous.captionFinal)captionTarget=value;else captionTarget=null;
  return value;}
 function attach(target,value,interim,finished){if(interim)target.interim=value;else{target.user+=value;target.interim='';if(finished)target.captionFinal=true;}return target;}
 function match(value){const words=normalized(value);if(!words)return null;const candidates=all.filter(t=>t.source!=='greeting'&&normalized(t.request||t.user).includes(words));return candidates.length===1?candidates[0]:null;}
 return {
  begin,
  current(){return input||begin('greeting');},response(){return response||(response=this.current());},setResponse(turn){response=turn;},releaseResponse(turn){if(response===turn)response=null;},
  activity(){const old=response;if(old&&!old.complete)old.cancelled=true;response=null;const turn=begin();turn.hasSpeech=true;return {old,turn};},
  speech(){if(input?.source==='audio'&&!input.complete)input.hasSpeech=true;},
  request(turn,text){turn.request=text;for(let i=unassigned.length-1;i>=0;i--){const chunk=unassigned[i],target=match(chunk.value);if(target){attach(target,chunk.value,chunk.interim,chunk.finished);unassigned.splice(i,1);}}},
  caption(value,{interim=false,finished=false,turnId}={}){let target=turnId?all.find(t=>t.id===turnId):captionTarget;if(interim&&!turnId)target=input;if(!target)target=match(value);
   if(!target){if(unassigned.length<100)unassigned.push({value,interim,finished});return input;}
   return attach(target,value,interim,finished);},
  typed(text){const turn=begin('typed');turn.hasSpeech=true;turn.user=text;turn.captionFinal=true;captionTarget=turn;return turn;},
  cancelTool(id){cancelledTools.add(id);},isToolCancelled(id){return cancelledTools.has(id);},list(){return all;},reset(){all.length=0;unassigned.length=0;input=response=captionTarget=null;cancelledTools.clear();}
 };
}

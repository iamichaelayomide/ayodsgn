/** Decode all provider frames promptly. Tool HTTP requests must not block caption delivery. */
export function createLiveConnection({onMessage,onState,onFailure}){
 let socket,session,handle='',generation=0,retries=0,closed=true,decode=Promise.resolve(),timeout;
 function connect(resuming){const epoch=++generation;onState(resuming?'Reconnecting…':'Connecting…');socket=new WebSocket('wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContentConstrained?access_token='+encodeURIComponent(session.token));
 timeout=setTimeout(()=>{if(epoch===generation&&!closed)onFailure('Voice connection timed out. Try text or reconnect.');},20000);
 socket.onopen=()=>{const setup={...session.setup};if(resuming&&handle)setup.sessionResumption={handle};socket.send(JSON.stringify({setup}));};
 socket.onmessage=event=>{decode=decode.then(async()=>{if(closed||epoch!==generation)return;const data=JSON.parse(typeof event.data==='string'?event.data:await event.data.text());if(data.setupComplete){clearTimeout(timeout);onMessage(data,{resuming});}else if(data.error){onFailure(data.error.message||'Voice unavailable. Text remains available.');}else{if(data.sessionResumptionUpdate?.resumable)handle=data.sessionResumptionUpdate.newHandle;if(data.goAway){socket.close();return;}onMessage(data,{resuming});}}).catch(()=>onFailure('Voice connection interrupted. Your saved changes are kept.'));};
 socket.onclose=event=>{clearTimeout(timeout);if(closed||epoch!==generation)return;if(event.code!==1008&&handle&&retries++<2&&Date.now()<Date.parse(session.expiresAt)-3000)connect(true);else onFailure('Voice disconnected. Reconnect to continue; saved changes are kept.');};socket.onerror=()=>onState('Connection interrupted…');
 }
 return {open(value){session=value;closed=false;retries=0;handle='';connect(false);},send(value){if(!closed&&socket?.readyState===WebSocket.OPEN)socket.send(JSON.stringify(value));},close(){closed=true;generation++;clearTimeout(timeout);socket?.close();socket=null;},ready(){return !closed&&socket?.readyState===WebSocket.OPEN;}};
}

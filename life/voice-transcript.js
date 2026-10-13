import {createSpeechCapture} from './voice-capture.js?v=1';
// Transcripts and tool calls may arrive in different WebSocket messages.
// Decode without blocking on tools, and keep each provider turn separate.
export function createVoiceInbox(timeoutMs=2500){
 const normalize=text=>String(text||'').toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim();
 function turn(){let text='',typed=false,recognized=false,recognition=null,waiters=new Set();const capture=createSpeechCapture();return {
  append(chunk){if(!recognized)text+=chunk;for(const wake of waiters)wake();},
  typed(value){typed=true;text+=value;},
  audio(bytes){capture.add(bytes);},
  hasSpeech(){return capture.hasSpeech();},
  recognize(transcribe){if(typed)return Promise.resolve(text);if(!recognition)recognition=capture.finish().then(transcribe).then(value=>{text=value;recognized=true;for(const wake of waiters)wake();return text;});return recognition;},
  read(){return text;},
  wait(quote){return new Promise((resolve,reject)=>{const wanted=normalize(quote);let timer;const done=()=>{clearTimeout(timer);waiters.delete(check);};const check=()=>{if(wanted&&normalize(text).includes(wanted)){done();resolve(text);}};waiters.add(check);timer=setTimeout(()=>{done();reject(Error('I haven’t received the complete instruction yet. Please repeat what you want me to change.'));},timeoutMs);check();});}
 };}
 let current=turn();const cancelled=new Set();return {
  receive(message){for(const id of message.toolCallCancellation?.ids||[])cancelled.add(id);const captured=current;const content=message.serverContent;if(content?.inputTranscription?.text)captured.append(content.inputTranscription.text);if(content?.turnComplete)current=turn();return captured;},
  typed(text){current.typed(text);},
  audio(bytes){current.audio(bytes);},
  isCancelled(id){return cancelled.has(id);},
  reset(){current=turn();cancelled.clear();}
 };
}

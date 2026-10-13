// Real Gemini PCM through the production voice client, with disposable private storage.
// Audio devices are simulated; this does not certify a human microphone or acoustic echo cancellation.
import {spawn} from 'node:child_process';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {createVoice} from '../life/voice.js';
const {LIFE_VOICE_TEST_HOST:host,LIFE_VOICE_TEST_KEY:key,LIFE_VOICE_TEST_DRIVER:driver,LIFE_VOICE_TEST_AUDIO:wave}=process.env;
if(!host||!key||!driver||!wave)throw Error('Configure a disposable private driver and synthetic booking WAV.');
const child=spawn('ssh',['-i',key,'-p',process.env.LIFE_VOICE_TEST_PORT||'65002','-o','BatchMode=yes','-o','UserKnownHostsFile='+process.env.LIFE_VOICE_TEST_KNOWN_HOSTS,host,'php '+driver+' --persistent'],{stdio:['pipe','pipe','pipe']});
let wire='';const pending=[];child.stdout.on('data',chunk=>{wire+=chunk;let end;while((end=wire.indexOf('\n'))>=0){const line=wire.slice(0,end);wire=wire.slice(end+1);const pair=pending.shift();try{const value=JSON.parse(line);value.testError?pair.reject(Error(value.testError)):pair.resolve(value);}catch{pair?.reject(Error('Invalid disposable staging response'));}}});child.on('close',()=>{for(const item of pending.splice(0))item.reject(Error('Disposable staging connection closed'));});
const remote=body=>new Promise((resolve,reject)=>{pending.push({resolve,reject});child.stdin.write(JSON.stringify(body)+'\n');});

const session=await remote({action:'start'}),elements=new Map(),saved=[];let worklet,playing=0,confirmedAudio=0,speechEnd=0,confirmationLatency=null;
const element=()=>({hidden:false,disabled:false,textContent:'',innerHTML:'',setAttribute(){},addEventListener(){},querySelector(name){if(!elements.has(name))elements.set(name,element());return elements.get(name);},show(){this.open=true;},close(){this.open=false;}});
globalThis.document={createElement:element,body:{append(){}}};globalThis.window={addEventListener(){}};
Object.defineProperty(globalThis,'navigator',{value:{mediaDevices:{getUserMedia:async()=>({getTracks:()=>[{stop(){}}],getAudioTracks:()=>[{enabled:true}]})}}});
class Audio{constructor(){this.sampleRate=48000;this.currentTime=0;this.audioWorklet={addModule:async()=>{}};}resume(){return Promise.resolve();}close(){return Promise.resolve();}createMediaStreamSource(){return {connect(){},disconnect(){}};}createGain(){return {gain:{},connect(){},disconnect(){}};}createBuffer(c,n){return {getChannelData:()=>new Float32Array(n),duration:n/24000};}}
// Schedule synthetic playback exactly like a browser AudioBufferSource, with cancellation.
Audio.prototype.createBufferSource=function(){let timer;const node={connect(){},start:()=>{playing++;if(saved.length){confirmedAudio++;if(speechEnd&&confirmationLatency===null)confirmationLatency=Date.now()-speechEnd;}timer=setTimeout(()=>{playing--;node.onended?.();},node.buffer.duration*1000);},stop(){clearTimeout(timer);playing=Math.max(0,playing-1);}};return node;};
const NativeSocket=globalThis.WebSocket;globalThis.WebSocket=class extends NativeSocket{constructor(...args){super(...args);this.addEventListener('message',async e=>{const m=JSON.parse(typeof e.data==='string'?e.data:await e.data.text());if(m.serverContent?.interrupted)console.log('Provider interrupted:',Date.now());if(m.toolCallCancellation)console.log('Provider cancellation:',m.toolCallCancellation.ids);if(m.toolCall)console.log('Provider tools:',m.toolCall.functionCalls.map(c=>c.name));if(m.voiceActivity){if(m.voiceActivity.type==='ACTIVITY_END')speechEnd=Date.now();console.log('Provider activity:',m.voiceActivity.type);}if(m.serverContent?.inputTranscription)console.log('Native input:',m.serverContent.inputTranscription.text);if(m.serverContent?.turnComplete)console.log('Native response complete');});}send(text){const m=JSON.parse(text);if(m.toolResponse)console.log('Sent tool results:',m.toolResponse.functionResponses.map(r=>[r.name,r.id,r.response.saved,r.response.error]));return super.send(text);}};
globalThis.AudioContext=Audio;globalThis.AudioWorkletNode=class{constructor(){worklet=this;this.port={};}connect(){}disconnect(){}};
const request=async(action,args)=>{if(action==='ai.voice.start')return session;console.log('Client request:',action,args.kind||'',args.request||'',args.plan?.request||'');const op=action.replace('ai.voice.','');let result;try{result=await remote({action:op,args});}catch(e){console.log('Request failed:',action,e.message);throw e;}if(op==='command'){saved.push(result.receipt);console.log('Verified native-client receipt:',result.receipt.summary);}return result;};
const voice=createVoice({request,prepare:async()=>({version:1,screen:{view:'board'}}),escape:s=>s,onSaved(){},onCommand(){},getScreen:()=>({view:'board'}),refreshSelects(){}});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));const wait=async(fn,ms)=>{const start=Date.now();while(!fn()){if(Date.now()-start>ms)throw Error('Native-client acceptance timeout: '+elements.get('#voice-status')?.textContent);await sleep(50);}};
try{
 voice.open();await wait(()=>!!worklet?.port.onmessage,25000);await wait(()=>playing>0,20000);await wait(()=>playing===0,20000);await sleep(2000);
 const data=await fs.readFile(wave);let at=12,pcm;assert.equal(data.readUInt32LE(24),48000);while(at+8<data.length){const size=data.readUInt32LE(at+4);if(data.toString('ascii',at,at+4)==='data'){pcm=data.subarray(at+8,at+8+size);break;}at+=8+size+(size%2);}assert.ok(pcm);
 const send=buffer=>worklet.port.onmessage({data:Uint8Array.from(buffer).buffer});
 for(let i=0;i<50;i++){send(Buffer.alloc(1920));await sleep(20);}for(let i=0;i<pcm.length;i+=1920){send(pcm.subarray(i,i+1920));await sleep(20);}for(let i=0;i<100;i++){send(Buffer.alloc(1920));await sleep(20);}
 await wait(()=>saved.length>0,45000);await sleep(15000);const board=await remote({action:'check'});const call=board.state.tasks.find(t=>t.title==='Call');assert.ok(call);assert.equal(call.schedule.time,'21:00');assert.equal(call.schedule.minutes,30);assert.equal(board.state.tasks.length,1);assert.equal(saved.length,1);assert.ok(confirmedAudio>0,'Verified booking confirmation must reach native playback');console.log('Production client + real native PCM booking + persisted calendar state passed.',{confirmationLatencyMs:confirmationLatency});
}finally{await voice.stop();child.stdin.end();}
process.exit(0);

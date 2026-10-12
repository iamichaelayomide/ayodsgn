import assert from 'node:assert/strict';
import {createVoice} from '../life/voice.js';
const elements=new Map();const element=()=>({hidden:false,disabled:false,textContent:'',innerHTML:'',classList:{toggle(){}},setAttribute(){},addEventListener(){},querySelector(key){if(!elements.has(key))elements.set(key,element());return elements.get(key);},show(){this.open=true;},close(){this.open=false;}});
globalThis.document={createElement:element,body:{append(){}}};globalThis.window={addEventListener(){}};
const stream={getTracks:()=>[{stop(){}}],getAudioTracks:()=>[]};Object.defineProperty(globalThis,'navigator',{value:{mediaDevices:{getUserMedia:async()=>stream}},configurable:true});
class Audio {constructor(){this.audioWorklet={addModule:async()=>{}};}resume(){return Promise.resolve();}close(){return Promise.resolve();}createMediaStreamSource(){return {connect(){},disconnect(){}};}createGain(){return {gain:{},connect(){},disconnect(){}};}}
globalThis.AudioContext=Audio;globalThis.AudioWorkletNode=class{constructor(){this.port={};}connect(){}disconnect(){}};
let socket;class Socket{static OPEN=1;constructor(){socket=this;this.readyState=1;this.messages=[];setTimeout(()=>this.onopen?.(),0);}send(text){this.messages.push(JSON.parse(text));}close(){}emit(message){this.onmessage({data:JSON.stringify(message)});}}globalThis.WebSocket=Socket;
const commands=[];const request=async(action,args)=>{if(action==='ai.voice.start')return {sessionId:'test',token:'fake',setup:{},boardVersion:1,seconds:600};if(action==='ai.voice.command'){commands.push(args);return {board:{version:2},receipt:{id:'receipt',operations:['task.save'],summary:'Added groceries.'}};}return {};};
const voice=createVoice({request,prepare:async()=>({version:1,screen:{boardId:'board'},temporary:false}),onSaved(){},onCommand:async()=>{throw Error('Preview refresh failed');},escape:text=>text,refreshSelects(){}});
const tick=ms=>new Promise(r=>setTimeout(r,ms));voice.open();await tick(20);socket.emit({setupComplete:{}});await tick(20);
socket.emit({toolCall:{functionCalls:[{id:'call1',name:'planner_changes',args:{authorization:'Add a task: Buy groceries.',actions:[]}}]}});await tick(20);assert.equal(commands.length,0);
socket.emit({serverContent:{inputTranscription:{text:'Add a task '}}});socket.emit({serverContent:{inputTranscription:{text:'buy groceries'}}});await tick(30);assert.equal(commands.length,1);assert.equal(commands[0].text,'Add a task buy groceries');assert.equal(socket.messages.find(m=>m.toolResponse)?.toolResponse.functionResponses[0].response.saved,true);
socket.emit({serverContent:{turnComplete:true}});await tick(20);
socket.emit({toolCall:{functionCalls:[{id:'call2',name:'planner_changes',args:{authorization:'Add a task: Buy groceries.',actions:[]}}]}});await tick(2600);assert.equal(commands.length,1);assert.equal(socket.messages.filter(m=>m.toolResponse).at(-1).toolResponse.functionResponses[0].response.saved,false);
await voice.stop();console.log('5 full voice-client delayed-transcript, save acknowledgement and stale-turn checks passed');

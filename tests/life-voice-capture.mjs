import assert from 'node:assert/strict';
import {createSpeechCapture,pcmBase64} from '../life/voice-capture.js';
import {createVoiceInbox} from '../life/voice-transcript.js';
const frame=(value=0,n=1024)=>new Int16Array(n).fill(value).buffer;
const capture=createSpeechCapture();for(let i=0;i<1000;i++)capture.add(frame());assert.equal(capture.hasSpeech(),false);
for(let i=0;i<4;i++)capture.add(frame(3000));for(let i=0;i<13;i++)capture.add(frame());assert.equal(capture.hasSpeech(),true);const bytes=await capture.finish();assert.ok(bytes.length<50000);assert.equal(Buffer.from(pcmBase64(bytes),'base64').length,bytes.length);
const long=createSpeechCapture();for(let i=0;i<710;i++)long.add(frame(3000));await assert.rejects(long.finish(),/too long/);
const inbox=createVoiceInbox();for(let i=0;i<4;i++)inbox.audio(frame(3000));for(let i=0;i<13;i++)inbox.audio(frame());const turn=inbox.receive({serverContent:{inputTranscription:{text:'by groceries to my book'}}});let calls=0;assert.equal(await turn.recognize(async()=>{calls++;return 'Buy groceries to my board';}),'Buy groceries to my board');turn.append('garbled fragment');assert.equal(turn.read(),'Buy groceries to my board');await turn.recognize(()=>{throw Error('Must be cached');});assert.equal(calls,1);inbox.receive({serverContent:{turnComplete:true}});assert.equal(inbox.receive({}).hasSpeech(),false);
console.log('9 speech capture, silence, duration, recognition caching and turn isolation checks passed');

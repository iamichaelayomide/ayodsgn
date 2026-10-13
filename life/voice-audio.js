/** Full-duplex PCM capture and Gemini-only playback. Raw microphone audio is never retained. */
export function createVoiceAudio({onPCM,onSpeech,onPlayback}){
 let input,output,stream,node,source,sink,queued=[],at=0,muted=false,speakerMuted=false;
 return {
  async open(){input=new AudioContext();output=new AudioContext();await Promise.all([input.resume(),output.resume()]);stream=await navigator.mediaDevices.getUserMedia({audio:{channelCount:1,echoCancellation:true,noiseSuppression:true,autoGainControl:true},video:false});await input.audioWorklet.addModule('./voice-worklet.js?v=2');},
  capture(){source=input.createMediaStreamSource(stream);node=new AudioWorkletNode(input,'ramble-capture');sink=input.createGain();sink.gain.value=0;source.connect(node);node.connect(sink);sink.connect(input.destination);node.port.onmessage=event=>{if(muted)return;const bytes=event.data;let energy=0;const samples=new Int16Array(bytes);for(const value of samples)energy+=value*value;if(Math.sqrt(energy/Math.max(1,samples.length))>90)onSpeech?.();onPCM(bytes,input.sampleRate);};},
  play(base64){if(speakerMuted||!output)return;const raw=atob(base64),pcm=new Int16Array(raw.length/2);for(let i=0;i<pcm.length;i++)pcm[i]=raw.charCodeAt(i*2)|(raw.charCodeAt(i*2+1)<<8);const buffer=output.createBuffer(1,pcm.length,24000);const channel=buffer.getChannelData(0);for(let i=0;i<pcm.length;i++)channel[i]=pcm[i]/32768;const sound=output.createBufferSource();sound.buffer=buffer;sound.connect(output.destination);at=Math.max(at,output.currentTime+.03);sound.start(at);at+=buffer.duration;queued.push(sound);onPlayback?.(true);sound.onended=()=>{queued=queued.filter(n=>n!==sound);if(!queued.length)onPlayback?.(false);};},
  clear(){const old=queued;queued=[];for(const sound of old){sound.onended=null;try{sound.stop();}catch{}}at=0;onPlayback?.(false);},
  mute(value){muted=value;stream?.getAudioTracks().forEach(t=>t.enabled=!value);},
  speaker(value){speakerMuted=value;if(value)this.clear();},
  async close(){stream?.getTracks().forEach(t=>t.stop());source?.disconnect();node?.disconnect();sink?.disconnect();this.clear();await input?.close().catch(()=>{});await output?.close().catch(()=>{});stream=input=output=source=node=sink=null;},
  playing(){return queued.length>0;}
 };
}

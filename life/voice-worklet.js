class RambleCapture extends AudioWorkletProcessor {
 constructor(){super();this.pending=[];this.phase=0;}
 process(inputs){const samples=inputs[0]?.[0];if(samples){const ratio=sampleRate/16000;for(let i=0;i<samples.length;i++){this.phase+=1;if(this.phase>=ratio){this.phase-=ratio;this.pending.push(Math.round(Math.max(-1,Math.min(1,samples[i]))*32767));if(this.pending.length===1024){const pcm=new Int16Array(this.pending);this.port.postMessage(pcm.buffer,[pcm.buffer]);this.pending=[];}}}}return true;}
}
registerProcessor('ramble-capture',RambleCapture);

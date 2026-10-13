class RambleCapture extends AudioWorkletProcessor {
 constructor(){super();this.size=Math.round(sampleRate*.02);this.pcm=new Int16Array(this.size);this.offset=0;}
 process(inputs){const samples=inputs[0]?.[0];if(samples)for(const sample of samples){this.pcm[this.offset++]=Math.round(Math.max(-1,Math.min(1,sample))*32767);if(this.offset===this.size){this.port.postMessage(this.pcm.buffer,[this.pcm.buffer]);this.pcm=new Int16Array(this.size);this.offset=0;}}return true;}
}
registerProcessor('ramble-capture',RambleCapture);

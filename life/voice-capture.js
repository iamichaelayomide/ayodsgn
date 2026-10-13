// Collect utterances locally; discard idle silence and cap a single command at 45 seconds.
export function createSpeechCapture(){
 let chunks=[],prefix=[],active=false,quiet=0,total=0,tooLong=false;
 return {
  add(buffer){const bytes=new Uint8Array(buffer),samples=new Int16Array(buffer);let sum=0;for(const value of samples)sum+=value*value;const voiced=Math.sqrt(sum/Math.max(1,samples.length))>=350;
   if(!active){prefix.push(bytes.slice());if(prefix.length>5)prefix.shift();if(!voiced)return;active=true;chunks=prefix;prefix=[];total=chunks.reduce((n,c)=>n+c.length,0);}
   else {chunks.push(bytes.slice());total+=bytes.length;}
   quiet=voiced?0:quiet+samples.length;if(total>1440000){tooLong=true;chunks=[];}if(quiet>=12800)active=false;
  },
  hasSpeech(){return chunks.length>0||tooLong;},
  async finish(){if(active){const started=Date.now();while(active&&Date.now()-started<2500)await new Promise(r=>setTimeout(r,40));}if(tooLong)throw Error('That instruction was too long. Please repeat it in shorter parts.');if(!chunks.length)throw Error('I couldn’t capture a clear instruction. Please repeat it.');const merged=new Uint8Array(chunks.reduce((n,c)=>n+c.length,0));let offset=0;for(const c of chunks){merged.set(c,offset);offset+=c.length;}return merged;}
 };
}
export function pcmBase64(bytes){let text='';for(let i=0;i<bytes.length;i+=8192)text+=String.fromCharCode(...bytes.subarray(i,i+8192));return btoa(text);}

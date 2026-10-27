import {applySource,audioAssets,createReflectionBus,createSourceChannel,roomMix,scheduleSource} from './acoustics.mjs';

export class EpisodeAudio{
  constructor(){this.context=null;this.nodes=[];this.buffers=new Map();this.decoded=new Map();this.muted=false;this.playing=false;this.reverb=true;this.wet=.55;this.solo=null;}
  async unlock(){
    if(!this.context){this.context=new AudioContext();this.master=this.context.createGain();this.master.gain.value=this.muted?0:.8;this.master.connect(this.context.destination);}
    await this.context.resume();
  }
  async load(episode){
    this.stop();this.episode=episode;this.solo=null;
    const voices=episode.sources.filter(s=>s.speakerId);
    if(voices.length){
      const metadata=await (await fetch('assets/audio/voice-metadata.json')).json();
      for(const voice of voices){const profile=[metadata.activeSpeaker,metadata.replacedSpeaker].find(p=>p.id===voice.speakerId);
        if(!profile||profile.gender!==voice.voiceGender||profile.gender!==voice.characterGender||profile.file!==voice.audio.split('/').at(-1))throw new Error(`Voice binding mismatch for ${voice.id}: check character, speaker metadata and recording.`);
      }
    }
    for(const url of audioAssets(episode))if(!this.buffers.has(url)){
      const response=await fetch(url);if(!response.ok)throw new Error(`Audio missing: ${url}`);this.buffers.set(url,await response.arrayBuffer());
    }
  }
  async start(state,scene){
    await this.unlock();this.stop();const generation=this.generation,decoded=this.decoded;
    for(const url of audioAssets(this.episode))if(!decoded.has(url))decoded.set(url,await this.context.decodeAudioData(this.buffers.get(url).slice(0)));
    if(generation!==this.generation)return;
    this.reflections=createReflectionBus(this.context,this.episode,decoded,this.master,{reverb:this.reverb,wet:this.wet});
    const clock=this.context.currentTime;
    this.nodes=this.episode.sources.map(source=>{const channel=createSourceChannel(this.context,source,this.reflections,this.master);channel.buffer=decoded.get(source.audio);scheduleSource(this.context,channel,decoded,state.time,clock);return channel;});
    this.playing=true;this.startTime=state.time;this.startClock=clock;this.update(state,scene,true);
  }
  update(state,scene,immediate=false){
    if(!this.context||!this.playing)return;const now=this.context.currentTime;
    const set=(p,v)=>immediate?p.setValueAtTime(v,now):p.setTargetAtTime(v,now,.035);
    const listener=this.context.listener;state.camera.position.forEach((x,i)=>set(listener[['positionX','positionY','positionZ'][i]],x));
    state.camera.forward.forEach((x,i)=>set(listener[['forwardX','forwardY','forwardZ'][i]],x));
    set(listener.upX,0);set(listener.upY,1);set(listener.upZ,0);
    this.nodes.forEach((n,i)=>applySource(n,state.sources[i],scene.obstruction(state.sources[i].position,state.camera.position),set,!this.solo||this.solo===n.source.id));
    roomMix(state).forEach((weight,i)=>{if(this.reflections.rooms[i])set(this.reflections.rooms[i].gain.gain,weight);});
    set(this.reflections.output.gain,this.reverb?this.wet:0);
  }
  setMute(muted){this.muted=muted;if(this.master)this.master.gain.setTargetAtTime(muted?0:.8,this.context.currentTime,.02);}
  stop(){
    this.playing=false;this.generation=(this.generation||0)+1;
    for(const n of this.nodes)n.dispose();this.nodes=[];this.reflections?.dispose();this.reflections=null;
  }
}

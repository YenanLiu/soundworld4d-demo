export const SPATIAL_AUDIO_SETTINGS=Object.freeze({
  panningModel:'HRTF',distanceModel:'inverse',rolloffFactor:1,maxDistance:60,
  clearLowpassHz:19000,occludedDirectGain:.24,occludedLowpassHz:1050,
  occludedReflectionGain:.55,reflectionDistanceFactor:.3,
});

export function sourceMixSettings(item,blocked,enabled=true){
  const model=SPATIAL_AUDIO_SETTINGS,occlusion=item.occlusion;
  const distance=Math.max(item.refDistance,item.distance);
  const cutoff=occlusion?.lowpassHz??model.occludedLowpassHz;
  return {
    sourceGain:enabled&&item.enabled!==false?item.gain:0,
    distanceGain:item.refDistance/(item.refDistance+model.rolloffFactor*(distance-item.refDistance)),
    occlusionGain:blocked?(occlusion?.directGain??model.occludedDirectGain):1,
    directLowpassHz:blocked?cutoff:model.clearLowpassHz,
    reflectionLowpassHz:blocked&&occlusion?cutoff:model.clearLowpassHz,
    reflectionSendGain:(item.reverbSend??1)*item.refDistance/(item.refDistance+model.reflectionDistanceFactor*item.distance)*(blocked?(occlusion?.reflectionGain??model.occludedReflectionGain):1),
  };
}

export function roomMix(state){
  const u=Math.max(0,Math.min(1,(state.camera.position[0]+2.8)/.8)),living=u*u*(3-2*u);
  return [1-living,living];
}

export function audioAssets(episode){
  return [...new Set([...episode.sources.flatMap(s=>[s.audio,...(s.audioVariants||[])]),...(episode.reverb||[]).map(r=>r.audio)])];
}

export function createReflectionBus(context,episode,buffers,destination,options={}){
  const input=context.createGain(),output=context.createGain();output.gain.value=options.reverb===false?0:(options.wet??.55);output.connect(destination);
  const rooms=(episode.reverb||[]).map(room=>{
    const convolver=context.createConvolver(),gain=context.createGain();convolver.normalize=false;convolver.buffer=buffers.get(room.audio);
    input.connect(convolver);convolver.connect(gain);gain.connect(output);return {convolver,gain};
  });
  return {input,output,rooms,dispose(){input.disconnect();output.disconnect();for(const r of rooms){r.convolver.disconnect();r.gain.disconnect();}}};
}

export function createSourceChannel(context,source,reflections,destination){
  const model=SPATIAL_AUDIO_SETTINGS;
  const input=context.createGain(),panner=new PannerNode(context,{panningModel:model.panningModel,distanceModel:model.distanceModel,refDistance:source.refDistance,rolloffFactor:model.rolloffFactor,maxDistance:model.maxDistance});
  const filter=context.createBiquadFilter();filter.type='lowpass';filter.frequency.value=model.clearLowpassHz;
  const gain=context.createGain(),send=context.createGain(),sendFilter=context.createBiquadFilter();sendFilter.type='lowpass';sendFilter.frequency.value=model.clearLowpassHz;
  input.connect(panner);panner.connect(filter);filter.connect(gain);gain.connect(destination);input.connect(sendFilter);sendFilter.connect(send);send.connect(reflections.input);
  return {source,input,panner,filter,gain,send,sendFilter,voices:[],dispose(){for(const v of this.voices){try{v.node.stop();}catch{}v.node.disconnect();v.envelope.disconnect();}for(const n of [input,panner,filter,gain,send,sendFilter])n.disconnect();}};
}

// Schedule contacts on the audio clock, including the offset when seeking into a sound.
export function scheduleSource(context,channel,buffers,from=0,now=context.currentTime){
  const s=channel.source;if(s.enabled===false)return;
  const events=s.audioEvents||s.activity.map(([start,end])=>({start,end,audio:s.audio,level:1}));
  for(const event of events){
    const {start:a,end:b}=event,buffer=buffers.get(event.audio);
    const end=Math.min(b,s.loop?b:a+buffer.duration);if(end<=from)continue;
    const start=Math.max(a,from),when=now+start-from,duration=end-start,offset=start-a;
    const node=context.createBufferSource(),envelope=context.createGain();node.buffer=buffer;node.loop=s.loop;
    const fadeIn=Math.min(s.fadeIn??.12,(b-a)/2),fadeOut=Math.min(s.fadeOut??.16,(b-a)/2);
    const level=t=>(event.level??1)*Math.max(0,Math.min(1,(t-a)/fadeIn,(b-t)/fadeOut));
    envelope.gain.setValueAtTime(level(start),when);
    for(const t of [a+fadeIn,b-fadeOut,b])if(t>start&&t<=end)envelope.gain.linearRampToValueAtTime(level(t),now+t-from);
    node.connect(envelope);envelope.connect(channel.input);node.start(when,offset%buffer.duration);node.stop(when+duration);channel.voices.push({node,envelope,start:a,end,audio:event.audio,level:event.level??1});
  }
}

export function applySource(channel,item,blocked,set,enabled=true){
  item.position.forEach((v,k)=>set(channel.panner[['positionX','positionY','positionZ'][k]],v));
  const settings=sourceMixSettings(item,blocked,enabled);
  set(channel.input.gain,settings.sourceGain);set(channel.gain.gain,settings.occlusionGain);set(channel.filter.frequency,settings.directLowpassHz);
  set(channel.sendFilter.frequency,settings.reflectionLowpassHz);
  set(channel.send.gain,settings.reflectionSendGain);channel.blocked=blocked;
}

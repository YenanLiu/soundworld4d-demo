import {soundParameterSnapshot} from './sound-parameters.mjs';

const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const number=(value,digits=2)=>Number.isFinite(value)?value.toFixed(digits):'Unavailable';
const facts=rows=>rows.map(([name,value])=>`<dt>${escape(name)}</dt><dd>${escape(value)}</dd>`).join('');

export class ParameterInspector{
  constructor(element){
    this.element=element;this.picker=element.querySelector('#parameter-source');this.sourceId='FP';
    this.picker.onchange=()=>{this.sourceId=this.picker.value;this.staticKey=null;this.render();};
    this.metadataReady=fetch('./assets/audio/acoustics-metadata.json').then(response=>{
      if(!response.ok)throw new Error('Acoustic metadata unavailable');return response.json();
    }).then(metadata=>{this.metadata=metadata;this.staticKey=null;this.render();}).catch(()=>{
      this.metadataError=true;this.staticKey=null;this.render();
    });
  }
  setEpisode(episode){
    this.episode=episode;this.state=null;this.snapshot=null;this.staticKey=null;
    if(!episode.sources.some(source=>source.id===this.sourceId))this.sourceId='FP';
    this.picker.innerHTML=episode.sources.map(source=>`<option value="${escape(source.id)}">${escape(source.id+' / '+source.label+(source.enabled===false?' (off)':''))}</option>`).join('');
    this.picker.value=this.sourceId;
    this.element.setAttribute('aria-busy','true');
  }
  update(state,blocked,options){
    this.state=state;this.blocked=blocked;this.options=options;this.render();
  }
  getSnapshot(overrides={}){
    return soundParameterSnapshot(this.episode,this.state,this.blocked,this.metadata,{...this.options,...overrides});
  }
  render(){
    if(!this.state||!this.episode)return;
    const snapshot=this.getSnapshot();
    this.snapshot=snapshot;
    const source=snapshot.sources.find(source=>source.id===this.sourceId),basis=source.basis;
    const query=selector=>this.element.querySelector(selector);
    const key=`${this.episode.id}/${this.sourceId}/${Boolean(this.metadata)}/${Boolean(this.metadataError)}`;
    if(key!==this.staticKey){
      query('#parameter-material-status').textContent=basis.materialStatus;
      query('#parameter-source-facts').innerHTML=facts([
        ['Material',basis.material],['Sound input',basis.input],['Emission trigger',basis.trigger],
        ['Motion / timing basis',basis.parameter],['Source gain (linear)',number(source.configuredSourceGain)],
        ['Reference distance',`${number(source.referenceDistanceMeters)} m`],
      ])+'<dt>Source state</dt><dd id="parameter-activity"></dd>';
      query('#parameter-listener-facts').innerHTML=[
        ['Distance / source speed','distance'],['Direct distance gain','distance-gain'],
        ['Geometry obstruction','obstruction'],['Occlusion multiplier','occlusion'],
        ['Direct low-pass','lowpass'],['Reflection send gain','send'],['Reflection low-pass','send-lowpass'],
      ].map(([label,id])=>`<dt>${label}</dt><dd id="parameter-${id}"></dd>`).join('');
      query('#parameter-recording').textContent=source.recording;
      query('#parameter-metadata').href=basis.metadata;
      query('#parameter-source-scope').textContent=basis.limitation;
      const model=snapshot.model;
      query('#parameter-model').textContent=`${model.panningModel} / ${model.distanceModel} distance / rolloff ${model.rolloffFactor} / gain = refDistance / max(distance, refDistance)`;
      const environment=snapshot.environment,atmosphere=environment.atmosphere;
      query('#parameter-environment-facts').innerHTML=facts([
        ['Environment',environment.enclosure+' / '+environment.settingLabel.toLowerCase()],
        ['Surface acoustics',environment.surfaceAcoustics],
        ['Reflections / reverb',environment.reflectionModel],
        ['Early reflections',environment.earlyReflections],
      ])+'<dt>Listener IR zone</dt><dd id="parameter-listener-zone"></dd>'+
        (environment.door?'<dt>Bedroom door</dt><dd id="parameter-door-state"></dd>':'');
      query('#parameter-atmosphere-facts').innerHTML=facts([
        ['Temperature',`${number(atmosphere.temperatureCelsius,1)} \u00b0C`],
        ['Relative humidity',`${number(atmosphere.relativeHumidityPercent,0)}%`],
        ['Air pressure',`${number(atmosphere.pressureKilopascals,3)} kPa`],
        ['Air absorption','Not simulated'],['Wind / weather','Not simulated'],
      ]);
      query('#parameter-atmosphere-scope').textContent='Demo defaults, not measurements or documented IR-generation settings. These values do not change the rendered audio.';
      query('#parameter-room-heading').innerHTML=snapshot.reflections.rooms.length?
        'Room responses <span class="parameter-assumed">Assumed</span>':'Outdoor response';
      query('#parameter-room-data').innerHTML=snapshot.reflections.rooms.length?
        '<div class="parameter-table-wrap"><table><thead><tr><th>Room (assumed)</th><th>Dimensions (m)</th><th>Absorption</th><th>T60 target / IR estimate (s)</th><th>Listener-zone mix</th></tr></thead><tbody>'+snapshot.reflections.rooms.map((room,i)=>
          `<tr><th>${escape(room.name)}</th><td>${room.dimensionsMeters?room.dimensionsMeters.map(n=>number(n,1)).join(' x '):'Unavailable'}</td><td>${number(room.assumedAbsorption,3)}</td><td>${number(room.targetT60Seconds)} / ${number(room.estimatedIRT60Seconds)}</td><td id="parameter-room-${i}"></td></tr>`).join('')+'</tbody></table></div>':
        '<p class="parameter-open-air">Open air. No room-convolution response or assumed room absorption.</p>';
      query('#parameter-room-scope').textContent=snapshot.reflections.rooms.length?
        'Fixed pyroomacoustics shoebox responses, crossfaded by listener zone. Room dimensions and absorption are assumptions, not house measurements. Door motion changes raycast obstruction and source filters, not the fixed reflection paths.':
        'No added ground reflections, echoes, diffraction or room reverberation. Source recordings may retain their original environmental cues. The stream is one point emitter, not distributed water flow.';
      this.staticKey=key;
    }
    query('#parameter-activity').textContent=!source.enabled?'Disabled':source.active?'Active':'Silent';
    query('#parameter-distance').textContent=`${number(source.distanceMeters)} m / ${number(source.speedMetersPerSecond)} m/s`;
    query('#parameter-distance-gain').textContent=number(source.mix.distanceGain,3);
    query('#parameter-obstruction').textContent=source.occluded?'Blocked (raycast proxy)':'Clear (raycast proxy)';
    query('#parameter-occlusion').textContent=number(source.mix.occlusionGain,3);
    query('#parameter-lowpass').textContent=`${number(source.mix.directLowpassHz,0)} Hz`;
    query('#parameter-send').textContent=snapshot.reflections.enabled?number(source.mix.reflectionSendGain,3):'Off';
    query('#parameter-send-lowpass').textContent=snapshot.reflections.enabled?`${number(source.mix.reflectionLowpassHz,0)} Hz`:'Off';
    query('#parameter-reflection-return').textContent=`Room reflection return: ${snapshot.reflections.enabled?number(snapshot.reflections.returnGain):'off'}`;
    query('#parameter-environment-status').textContent=snapshot.reflections.rooms.length?(snapshot.reflections.enabled?'Room IRs on':'Room IRs off'):'Open air';
    query('#parameter-listener-zone').textContent=snapshot.environment.listenerZone+(snapshot.reflections.rooms.length?' (assumed)':'');
    if(snapshot.environment.door){
      const door=snapshot.environment.door;
      query('#parameter-door-state').textContent=`${door.phase[0].toUpperCase()+door.phase.slice(1)} / ${number(door.angleDegrees,1)} deg`;
    }
    snapshot.reflections.rooms.forEach((room,i)=>{query(`#parameter-room-${i}`).textContent=`${number(room.mixWeight*100,0)}%`;});
    query('#parameter-timestamp').textContent=`${number(snapshot.timeSeconds,1)} s`;
    this.element.setAttribute('aria-busy','false');
  }
}

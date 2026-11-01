import {SPATIAL_AUDIO_SETTINGS,sourceMixSettings,roomMix} from './acoustics.mjs';

export function sourceSoundBasis(episode,source){
  const surface=source.surface==='wood'?'Wood floor':source.surface==='grass'?'Grass / soft ground':null;
  if(source.id==='FP')return {
    material:surface,materialStatus:'Assigned category',input:'8 recorded footfall variations',
    trigger:'Animation-phase toe contacts along the authored path',
    parameter:'1.10 m walk cycle; 60 ms recorded-peak offset',
    limitation:'No measured shoe, surface stiffness, contact force or mass. Surface category selects the recording bank.',
    metadata:'./assets/audio/footsteps/manifest.json',
  };
  if(source.id==='GP')return {
    material:surface,materialStatus:source.surface==='wood'?'Unverified floor category':'Assigned category',input:'8 recorded canine paw transients',
    trigger:'Estimated paw-height contacts from the native gait',
    parameter:`${episode.sources.find(s=>s.id==='G1').gait.strideLength.toFixed(3)} m gait cycle; 130 ms excerpts`,
    limitation:'Paw timing is an animation estimate, not measured force. The indoor recording does not document its floor material.',
    metadata:'./assets/living/paws/manifest.json',
  };
  if(source.id==='D1')return {
    material:'Wood door / metal hardware',materialStatus:'Visual only',input:'Recorded door-closing impact',
    trigger:`Recording peak at ${episode.door.closing[1].toFixed(1)} s, when the door closes`,
    parameter:`${(episode.door.maxAngle*180/Math.PI).toFixed(1)} deg maximum hinge angle`,
    limitation:'Authored hinge motion and hand contact. No torque, latch force, stiffness or instance-matched sound synthesis.',
    metadata:'./SOURCES.json',
  };
  if(source.id==='F1')return {
    material:'No acoustic material model',materialStatus:'Not simulated',input:'Recorded desk-fan loop',
    trigger:'Authored on/off interval; independent of listener position',
    parameter:`${source.rotationsPerSecond.toFixed(1)} rev/s visible rotor (${(source.rotationsPerSecond*60).toFixed(0)} rpm)`,
    limitation:'Rotor speed animates the mesh only. It does not synthesize or change the pitch of the recording.',
    metadata:'./assets/audio/acoustics-metadata.json',
  };
  if(source.id==='R1')return {
    material:'No acoustic material model',materialStatus:'Not simulated',input:'Recorded robot-vacuum motor loop',
    trigger:'Authored operating interval, 2-28 s',parameter:'Moving point emitter at the robot position',
    limitation:'The motor recording is not calibrated to wheel speed, suction, RPM or the rendered robot.',
    metadata:'./assets/living/manifest.json',
  };
  if(source.id==='S1'&&episode.id==='indoor')return {
    material:'Wood body / metal mechanism',materialStatus:'Visual only',input:'Recorded AID music-box loop',
    trigger:'Continuous playback, 0-32 s',parameter:`${(source.fadeIn??.12).toFixed(2)} s fade-in; ${(source.occlusion?.transitionSeconds??.035).toFixed(2)} s occlusion time constant`,
    limitation:'No physical melody synthesis or material-to-timbre calculation. Level is an audition setting, not calibrated sound power.',
    metadata:'./assets/audio/music-box-metadata.json',
  };
  if(source.id==='S1')return {
    material:'Water',materialStatus:'Visual category',input:'Recorded stream ambience',
    trigger:'Continuous playback, 0-32 s',parameter:'One fixed point emitter, not a distributed stream',
    limitation:'No flow-rate, fluid or material simulation. The field recording retains its original environmental cues.',
    metadata:'./SOURCES.json',
  };
  if(source.id==='S2')return {
    material:'Not applicable to voice',materialStatus:'Recorded voice',input:'Recorded EARS speech',
    trigger:'Authored speech interval; emitter follows the mouth',parameter:'Phone is a silent visual prop',
    limitation:'Virtual voice pairing, with no identity match, lip synchronization, physical voice synthesis or validated directivity.',
    metadata:'./assets/audio/voice-metadata.json',
  };
  return {
    material:'Not applicable to vocalization',materialStatus:'Recorded source',
    input:source.role==='bird'?'Recorded bird phrases':'Recorded bark',
    trigger:'Authored vocalization intervals',parameter:'Emitter follows the visible source',
    limitation:source.pairing,metadata:'./assets/living/manifest.json',
  };
}

export function soundParameterSnapshot(episode,state,blocked,metadata,options={}){
  const indoor=Boolean(episode.reverb),weights=indoor?roomMix(state):[];
  const reflectionsEnabled=indoor&&options.reverb!==false;
  return {
    schema:'soundworld4d.sound-parameters/1',episode:episode.id,timeSeconds:state.time,
    model:{...SPATIAL_AUDIO_SETTINGS,
      distanceGainFormula:'refDistance / (refDistance + rolloffFactor * (max(distance, refDistance) - refDistance))',
      maxDistanceUse:'Applies to the linear model only; ignored by the active inverse model',
      reference:'https://www.w3.org/TR/webaudio/#enumdef-distancemodeltype',
      occlusion:'Binary source-listener raycast against scene walls and door geometry'},
    listener:{positionMeters:state.camera.position,forward:state.camera.forward},
    audition:{soloSourceId:options.solo??null},
    environment:{setting:episode.setting,settingLabel:episode.settingLabel,
      enclosure:indoor?'Enclosed rooms':'Open air',
      atmosphere:{...episode.environment.atmosphere},
      listenerZone:indoor?(weights[0]>=weights[1]?'Bedroom':'Living room'):'Open air',
      listenerZoneBasis:indoor?'Authored position-based IR crossfade, not mesh room detection':'Outdoor scene',
      door:state.door?{id:state.door.id,phase:state.door.phase,angleDegrees:state.door.angle*180/Math.PI}:null,
      reflectionModel:indoor?'Fixed stereo shoebox IRs':'No added environmental reflections',
      earlyReflections:indoor?'Baked into fixed IRs; not updated from scene geometry':'Not simulated',
      reverberation:indoor?'Fixed room IRs crossfaded by listener zone':'No added room reverberation',
      surfaceAcoustics:indoor?'Assumed room-average absorption, not per-surface coefficients':'Ground and surface reflections not simulated',
      doorAffects:indoor?'Raycast obstruction and source filters, not fixed room IRs':null,
      airAbsorptionSimulated:false,weatherSimulated:false,diffractionSimulated:false,
      distancePropagationDelaySimulated:false},
    reflections:{enabled:reflectionsEnabled,returnGain:reflectionsEnabled?(options.wet??.55):0,
      rooms:(episode.reverb||[]).map((room,i)=>{
        const reference=metadata?.rooms?.[i];
        return {name:room.name,dimensionsMeters:reference?.dimensionsMeters??null,
          assumedAbsorption:reference?.absorption??null,targetT60Seconds:room.targetRT60,
          estimatedIRT60Seconds:reference?.estimatedRT60??null,mixWeight:weights[i],
          imageSourceOrder:reference?.imageSourceOrder??null,engine:reference?.engine??null,
          response:room.audio,status:'Assumed fixed shoebox response, not measured from the house mesh'};
      })},
    sources:state.sources.map(source=>({
      id:source.id,name:source.label,enabled:source.enabled,active:source.active,
      basis:sourceSoundBasis(episode,source),recording:source.recording,pairing:source.pairing,
      audio:source.audio,variants:source.audioVariants??[],activity:source.activity,
      contacts:source.contacts??source.pawContacts??[],audioEvents:source.audioEvents??[],
      positionMeters:source.position,speedMetersPerSecond:source.speed,distanceMeters:source.distance,
      azimuthDegrees:source.azimuth,elevationDegrees:source.elevation,
      referenceDistanceMeters:source.refDistance,configuredSourceGain:source.gain,
      fadeInSeconds:source.fadeIn??.12,fadeOutSeconds:source.fadeOut??.16,
      configuredReflectionSend:source.reverbSend??1,configuredOcclusion:source.occlusion??null,
      occluded:Boolean(blocked[source.id]),mix:sourceMixSettings(source,Boolean(blocked[source.id]),!options.solo||options.solo===source.id),
    })),
    scope:{sourceSounds:'Recorded waveforms, not physical source synthesis',
      physicalProperties:'No simulated mass, stiffness, friction, contact force or per-surface acoustic absorption',
      calibration:'Gains and filter cutoffs are illustrative settings, not measured SPL or wall transmission',
      acoustics:metadata?.limitations??'Fixed room responses; no validated mesh-acoustic solver',
      outdoor:'No room convolution, weather model, terrain diffraction or validated source directivity'},
  };
}

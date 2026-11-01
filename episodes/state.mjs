import {locomotionWeight,routeHeading,sampleAnimalPath,phoneWeight,blendAngle} from './motion.mjs';
import {DOG_GAIT} from './dog-gait.mjs';
export const COLORS={camera:0x167fa5,actor:0xc65083,static:0xc79318};
const wp=(t,x,z,lookX=x+1,lookZ=z)=>({t,position:[x,1.65,z],lookAt:[lookX,1.45,lookZ]});
const actor=(t,x,z)=>({t,position:[x,0,z]});
const atmosphere=Object.freeze({temperatureCelsius:20,relativeHumidityPercent:50,pressureKilopascals:101.325,
  status:'Assumed baseline',affectsRendering:false,
  provenance:'Authored demo defaults, not measured weather or documented IR-generation settings'});
const speaker={id:'S2',label:'Woman on phone',english:'Woman on phone',kind:'moving',audio:'assets/audio/ears-p002-female-original.wav',gain:4.5,refDistance:1.6,height:1.52,loop:false,asset:'Microsoft Rocketbox Female Adult 01 + native Idle / Walk + authored left-hand phone pose',recording:'EARS/p002_emo_adoration_sentences.wav',speakerId:'p002',voiceGender:'female',characterGender:'female',voiceMetadataSource:'https://github.com/facebookresearch/ears_dataset/blob/main/speaker_statistics.json',pairing:'Gender-compatible noncommercial virtual pairing staged as a phone call; no identity match, lip synchronization, dialogue rewriting or pitch alteration'};

export const EPISODES={
  indoor:{id:'indoor',title:'A woman opens a bedroom door and takes a phone call',englishTitle:'A woman opens a bedroom door and takes a phone call',duration:32,
    settingLabel:'BEDROOM & LIVING ROOM',
    setting:'A furnished home with wood floors and a bedroom adjoining the living room.',
    story:'A woman enters the bedroom for a phone call, then returns to the living room and closes the door. The listener starts inside the bedroom, hears music through the doorway and finally approaches the music box.',
    recordingPlan:'Hold in the bedroom for the fan and muffled music. Turn towards the caller, cross the open doorway into the living-room sound field, then look back for the latch impact at 26.5 s. Approach the music box after the call ends.',
    ambience:[
      {sourceId:'F1',description:'Fan in the bedroom',story:'A fan hums in the bedroom.',placement:'On the bedroom floor near the wall shared with the living room.',role:'Local ambience',captureWindows:[[0,2]],capturePlan:'Start in the same room and hold before the woman approaches. The fan can be heard without centering it in the image.'},
      {sourceId:'S1',description:'Music box in the living room',story:'A music box plays on a low table in the adjoining living room.',placement:'On a low table in the living room, beyond the bedroom doorway.',role:'Off-screen, then foreground',captureWindows:[[0,2],[27,32]],capturePlan:'First receive it through the closed door. At the end, approach its table from the living-room side after speech has ended; its source stays fixed as the listener moves closer.'},
      {sourceId:'R1',description:'Robot vacuum in the living room',story:'A robot vacuum cleans the living-room floor during the visit.',placement:'Moving across an open strip of the living-room floor.',role:'Moving background',captureWindows:[[18,26]],capturePlan:'Receive its motor while entering and settling in the living room. It stays a background layer beneath the call and runs from 2 to 28 s.'},
      {sourceId:'G1',description:'Dog in the living room',story:'A dog walks through the living room and gives two short barks.',placement:'On the living-room side of the bedroom door.',role:'Optional bark accents',captureWindows:[[6.1,6.65],[24.15,24.7]],capturePlan:'Receive the first bark from inside the bedroom and the second from the living room. The dog stays on its own route.'},
    ],
    sourceLabel:'Model scene, not a real-world scan / RoboMaker house + VLNVerse door / AID, EARS audio',
    bounds:{minX:-10.3,maxX:10,minZ:-5.4,maxZ:6},
    camera:[wp(0,-4.8,-1.6,-2.4,-.65),wp(11.5,-4.8,-1.6,-2.4,-.65),wp(14,-4.8,-1.6,-4.25,.65),wp(16,-4.8,-1.6,-4.25,.65),wp(18,-3.25,-.65,-2.4,-.65),wp(20,-1.55,-.65,2,-.8),wp(22,-1.55,-1.85,-2.46,-.65),wp(26,-.6,-1.6,-2.46,-.65),wp(29,2.85,-1.85,1.51,1.73),wp(32,3.25,.85,1.51,1.73)],
    door:{id:'D1',asset:'VLNVerse / kujiale_0003 / door_0000',center:[-2.46,0,-.65],rotation:Math.PI/2,widthScale:1.42,hingeX:-.4066,handleLocal:[.71,1.015,-.025],opening:[8,10.5],closing:[24,26.5],maxAngle:Math.PI*.49},
    sources:[
      {id:'S1',label:'Music box',english:'Music box',kind:'static',audio:'assets/audio/aid-music-box-loop.wav',gain:.30,refDistance:1.4,reverbSend:.12,occlusion:{directGain:.08,lowpassHz:750,reflectionGain:.08,transitionSeconds:.35},height:.52,loop:true,fadeIn:.8,fadeOut:.4,path:[actor(0,1.51,1.73),actor(32,1.51,1.73)],activity:[[0,32]],asset:'authored-music-box',recording:'AID/music_box_02_RHODE_NT1.wav; filtered and dynamically balanced for playback',pairing:'Category-compatible virtual pairing; source level and occlusion are demonstration settings, not calibrated sound power or measured wall transmission'},
      {...speaker,path:[actor(0,1.1,-.92),actor(2,1.1,-.92),actor(6,-2.185,-.920828),actor(8,-2.185,-.920828),actor(10.5,-3.2991,-.3741),actor(11.5,-3.2991,-.3741),actor(13,-3.85,-.7),actor(15,-4.25,.65),actor(20,-4.25,.65),actor(21.3,-4.25,-1),actor(23.2,-3.2991,-.3741),actor(24,-3.2991,-.3741),actor(26.5,-2.185,-.920828),actor(27,-2.185,-.920828),actor(29,-1.0,-.65),actor(32,2.65,-.65)],activity:[[13,22.76475]]},
      {id:'D1',label:'Door latch',english:'Door latch',kind:'articulated',audio:'assets/audio/door-close.wav',gain:8,refDistance:1.6,height:1.015,loop:false,fadeIn:.003,fadeOut:.04,path:[],activity:[[26.4140833333333,26.840375]],asset:'VLNVerse door_0000',recording:'door closed.wav / soundofsong / Freesound 647645, CC0; HQ MP3 preview converted to mono 48 kHz WAV',pairing:'Category-compatible recorded closing effect, not a dry or instance-matched measurement',peakOffset:.0859166666667}
    ],
    events:[
      {id:'I01',start:0,end:2,title:'Music beyond the closed door',detail:'The woman waits in the living room while the bedroom fan runs.',recording:'Hold inside the bedroom, facing the closed door, for local fan ambience and distant music.',dependsOn:[],writes:['S1.activity'],expected:'The fan shares the listener\'s room; music arrives from the unseen living-room source through the closed door.'},
      {id:'I02',start:2,end:7,title:'Approach the bedroom door',detail:'The woman walks across the living room, stops at the door and faces the handle.',recording:'Keep the closed doorway in view from inside the bedroom.',dependsOn:['I01'],writes:['S2.pose'],expected:'Wood-floor footsteps follow the approaching woman, even while she is out of view.'},
      {id:'I03',start:7,end:11.5,title:'Open the door and step inside',detail:'Her right hand follows the handle as she pushes the door open from 8 to 10.5 s.',recording:'Hold the doorway in frame as the woman comes into view.',dependsOn:['I02'],writes:['S2.rightArm','D1.angle','propagation'],expected:'Hand and handle move together; the opening door changes obstruction of the living-room music.'},
      {id:'I04',start:11.5,end:20,title:'Take a call in the bedroom',detail:'She raises the phone, speaks from 13 s and pauses in the bedroom at 15 s.',recording:'Turn in place towards her, then cross into the living room after 16 s.',dependsOn:['I03'],writes:['S2.pose','S2.leftArm','S2.phone','S2.activity','camera.pose'],expected:'Speech follows her mouth, not the silent phone; footfalls stop while she stands.'},
      {id:'I05',start:20,end:23.2,title:'Finish the call and return',detail:'She walks back to the door as her speech ends at 22.8 s, then starts lowering the phone.',recording:'Turn back from the living room and stay clear of the doorway.',dependsOn:['I04'],writes:['S2.pose','S2.leftArm','S2.phone','camera.pose','S2.activity'],expected:'Speech ends with the call; footsteps follow her return rather than the camera motion.'},
      {id:'I06',start:23.2,end:27,title:'Close the bedroom door',detail:'She takes the handle and steps back into the living room, pulling the door closed from 24 to 26.5 s.',recording:'Keep the woman, handle and closing door in view from the living room.',dependsOn:['I05'],writes:['S2.rightArm','S2.pose','D1.angle','D1.activity','propagation'],expected:'The recorded latch impact peaks at closure, 26.5 s; the bedroom fan is now behind the door.'},
      {id:'I07',start:27,end:32,title:'Approach the music box',detail:'The woman releases the handle and walks away while the music continues.',recording:'Move towards the living-room music box and turn to frame it.',dependsOn:['I06'],writes:['S2.pose','camera.pose'],expected:'The music box stays fixed; its received sound changes with listener distance, not the woman\'s motion.'}
    ],
    reverb:[{name:'Bedroom',audio:'assets/audio/room-bedroom.wav',targetRT60:.5},{name:'Living room',audio:'assets/audio/room-living.wav',targetRT60:.75}],
    environment:{atmosphere,door:'Actual VLNVerse mesh with authored hinge and hand contact. Opening and closing update geometry. The closing effect is category-compatible, not anechoic.',ceiling:'Hidden only in the overview.',acousticModel:'Web Audio HRTF, distance attenuation, moving-geometry raycast occlusion and stereo shoebox convolution reflections',assumptions:['The house is AWS RoboMaker, not a VLNVerse full-scene import or a captured real-world scan','VLNVerse source licensing must be reviewed before redistribution','Room dimensions and absorption are illustrative assumptions; fixed pyroomacoustics responses crossfade by listener zone, not a moving-pose mesh acoustic solver','No measured materials, calibrated SPL, diffraction or validated source directivity','Female EARS p002 voice is virtually paired with the female character; no identity match or lip synchronization','Camera and character paths are authored; no embodied navigation policy']}
  },
  outdoor:{id:'outdoor',title:'A woman walks and takes a phone call in a streamside park',englishTitle:'A woman walks and takes a phone call in a streamside park',duration:32,
    settingLabel:'STREAMSIDE WOODLAND PARK',
    setting:'A woodland park with grass banks, a flowing stream, benches and a wooden footbridge.',
    story:'A woman takes a phone call while walking towards the water, then pauses after the call. The listener follows the path and moves onto the bridge during her quiet pause to record the stream, before looking back from the other bank.',
    recordingPlan:'Approach along the path, receiving speech and grass footfalls. Leave a listening window after the call ends at 18.8 s, then use her 23-26 s pause for stream audio beside the bridge. Look back after crossing while retaining off-screen ambience.',
    ambience:[
      {sourceId:'S1',description:'Stream beside the footbridge',story:'A stream flows beside the park path and wooden footbridge.',placement:'In the water beside the wooden footbridge, fixed to the stream rather than the camera.',role:'Background, then foreground',captureWindows:[[23,26]],capturePlan:'Move onto the bridge while the woman is silent and standing. This brings the listener near the water without adding a camera footstep track.'},
      {sourceId:'G1',description:'Dog on the grassy near bank',story:'A dog walks on the grassy near bank and pauses to bark.',placement:'On the grassy near bank, separate from the woman and the bridge crossing.',role:'Nearby bark accents',captureWindows:[[19,22]],capturePlan:'Pass near its stopping point after speech ends. Its two late barks at 20.1 and 21.1 s fall before the stream-focused pause.'},
      {sourceId:'B1',description:'Bird on a park bench',story:'A bird sings short phrases from a park bench.',placement:'Perched on a park bench away from the bridge crossing.',role:'Distant ambience',captureWindows:[[1,4.2],[6.2,9.4],[24,27.2]],capturePlan:'Retain its phrases behind the approach and crossing. The current route does not pass close to the bench, so this is not a close-up bird take.'},
    ],
    sourceLabel:'Authored outdoor assembly, not a scan or Infinigen export / Poly Haven / EARS speech',
    bounds:{minX:-12,maxX:12,minZ:-9,maxZ:9},
    camera:[wp(0,-8,5,-3,2),wp(3,-8,5,-3,2),wp(10,-3,2,-1,-3),wp(16,.5,.4,2,-1),wp(21,3.1,0,5.7,2),wp(25,5.8,0,2,1),wp(27,7.5,0,5.7,2),wp(30,8.4,-2.8,5.7,2),wp(32,8.4,-2.8,2,1)],
    sources:[
      {id:'S1',label:'Stream',english:'Stream',kind:'static',audio:'../assets/stream.wav',gain:2.2,refDistance:2,height:.18,loop:true,path:[actor(0,5.8,2),actor(32,5.8,2)],activity:[[0,32]],asset:'authored-stream',recording:'Swale.ogg by Siddharth Patil (Ksd5), CC0',pairing:'Field recording used as a localized stream proxy; not an anechoic source'},
      {...speaker,path:[actor(0,-4,-4.5),actor(4,-4,-4.5),actor(11,0,-3),actor(17,2,-1),actor(23,2,1),actor(26,2,1),actor(32,-.5,4)],activity:[[9,18.76475]]}
    ],
    events:[
      {id:'O01',start:0,end:4,title:'Establish the streamside park',detail:'The woman waits on the park path while the stream flows nearby.',recording:'Hold at the path entrance until 3 s, then begin moving towards the stream.',dependsOn:[],writes:['S1.activity'],expected:'Water sound belongs to the stream; the silent woman does not emit speech or footfalls.'},
      {id:'O02',start:4,end:9,title:'Walk towards the stream',detail:'The woman walks along the grass bank and raises her phone before the call.',recording:'Move along the path and turn towards the approaching woman.',dependsOn:['O01'],writes:['camera.pose','S2.pose'],expected:'Grass-category footfalls follow her steps; the camera adds no footstep source.'},
      {id:'O03',start:9,end:17,title:'Talk while walking along the bank',detail:'She speaks into the call while continuing towards the water.',recording:'Approach along the path, keeping her moving position in the viewing direction.',dependsOn:['O02'],writes:['S2.activity','S2.leftArm','S2.phone','S2.pose'],expected:'Speech follows her mouth and footfalls follow her steps; stream audio remains at the water.'},
      {id:'O04',start:17,end:23,title:'End the call beside the water',detail:'She finishes speaking at 18.8 s, lowers the phone and approaches her stopping point.',recording:'Turn towards the stream and bridge; the woman stays on the near bank and may leave the frame.',dependsOn:['O03'],writes:['camera.pose','S2.activity'],expected:'Turning the camera changes received direction cues without moving or restarting the sources.'},
      {id:'O05',start:23,end:26,title:'Pause as the camera crosses',detail:'The woman stands on the near bank while the camera moves onto the wooden bridge.',recording:'Approach the stream along the raised bridge surface and look back towards her.',dependsOn:['O04'],writes:['camera.pose','S2.pose'],expected:'Her speech and footfalls stay silent, leaving a listening window for the stream; only the camera crosses the bridge.'},
      {id:'O06',start:26,end:32,title:'Continue along the near bank',detail:'The woman resumes walking on her side of the stream after the call has ended.',recording:'Finish crossing by 27 s, move along the far bank and keep looking back.',dependsOn:['O05'],writes:['camera.pose','S2.pose'],expected:'Grass footfalls resume with her steps, not bridge footsteps or restarted speech.'}
    ],
    environment:{atmosphere,construction:'Authored 24 x 18 m park ground, stream, bridge and open-slat park benches with downloaded Poly Haven trees and rocks. This is NOT Infinigen output or a complete captured scene.',acousticModel:'Web Audio HRTF + inverse-distance attenuation; no artificial room reverb outdoors',assumptions:['Stream is one point emitter, not a distributed flow field','No meteorological propagation or terrain diffraction','Water recording retains original environmental cues','Only the visible visitor has footstep audio; camera motion adds no footsteps','Recorded grass footfalls are category-compatible, not calibrated to the rendered ground or shoes','Speech has no lip synchronization']}
  }
};

const smooth=(a,b,t)=>{const u=Math.max(0,Math.min(1,(t-a)/(b-a)));return u*u*(3-2*u);};
export function doorState(t){const d=EPISODES.indoor.door;return {id:d.id,angle:smooth(...d.opening,t)*(1-smooth(...d.closing,t))*d.maxAngle,contact:Math.max(smooth(7,8,t)*(1-smooth(10.5,11.5,t)),smooth(23.2,24,t)*(1-smooth(26.5,27,t))),phase:t<8?'closed':t<10.5?'opening':t<24?'open':t<26.5?'closing':'closed'};}
export function doorHandlePosition(t){const d=EPISODES.indoor.door,a=doorState(t).angle,u=d.handleLocal[0]*d.widthScale,v=d.handleLocal[2];return [d.center[0]-u*Math.sin(a)+v*Math.cos(a),d.handleLocal[1],d.center[2]-d.hingeX*d.widthScale-u*Math.cos(a)-v*Math.sin(a)];}
// Both contact paths are sampled from the same moving hinge, including body clearance.
const door=EPISODES.indoor.door,path=EPISODES.indoor.sources[1].path;
for(const [start,end] of [door.opening,door.closing])for(let t=start+.125;t<end;t+=.125){const a=doorState(t).angle,h=doorHandlePosition(t);path.push({...actor(t,h[0]+.30*Math.cos(a)+.16*Math.sin(a),h[2]-.30*Math.sin(a)+.16*Math.cos(a)),label:false});}
path.sort((a,b)=>a.t-b.t);
EPISODES.indoor.sources[2].path=[...new Set([0,...path.map(p=>p.t),32])].sort((a,b)=>a-b).map(t=>{const h=doorHandlePosition(t);return actor(t,h[0],h[2]);});
EPISODES.indoor.sources.push({id:'F1',label:'Bedroom fan',english:'Bedroom fan',kind:'static',audio:'assets/audio/fan-loop.wav',gain:.4,refDistance:1.5,reverbSend:.2,occlusion:{directGain:.12,lowpassHz:900,reflectionGain:.1},height:1.15,loop:true,path:[actor(0,-3.45,1.3),actor(32,-3.45,1.3)],activity:[[0,32]],rotationsPerSecond:6,asset:'Authored pedestal fan with driven rotor',recording:'TimBahrij / Freesound 191580 / CC0; steady 6-15.5 s excerpt',pairing:'Recorded desk-fan timbre with an authored fan; operating state matched, not instance- or RPM-calibrated'});

export function walkContacts(path,reverse=false){
  const contacts=[];let distance=0;
  for(let i=0;i<path.length-1;i++){
    const a=path[i],b=path[i+1],length=Math.hypot(...b.position.map((v,k)=>v-a.position[k]));
    const backwards=reverse&&a.t>=24&&a.t<26.5;
    // Native Rocketbox toe-contact phases sampled from its walk animation.
    const phases=backwards?[.215,.69]:[.31,.785];
    if(length>.001)for(let cycle=Math.floor(distance/1.1)-1;cycle<=(distance+length)/1.1;cycle++)for(let foot=0;foot<2;foot++){
      const d=(cycle+phases[foot])*1.1;
      if(d<=distance||d>distance+length)continue;
      const t=a.t+(d-distance)/length*(b.t-a.t);
      if(t<.05||t>31.7)continue;
      const contact={time:t,foot:foot===0?'left':'right'};
      contacts.push(contact);
    }
    distance+=length;
  }
  return contacts.sort((a,b)=>a.time-b.time);
}
for(const e of Object.values(EPISODES)){
  const path=e.sources[1].path,contacts=walkContacts(path,e.id==='indoor'),surface=e.id==='indoor'?'wood':'grass';
  const audioVariants=Array.from({length:8},(_,i)=>`assets/audio/footsteps/${surface}-${String(i+1).padStart(2,'0')}.wav`),order=[0,3,1,6,4,7,2,5];
  const audioEvents=contacts.map((c,i)=>({start:c.time-.06,end:Math.min(32,c.time-.06+.48),audio:audioVariants[order[i%8]],foot:c.foot,contactTime:c.time,level:(.50+.38*Math.min(1,samplePath(path,c.time).speed/.85))*(c.foot==='left'?.94:1)}));
  e.sources.push({id:'FP',label:'Visitor footsteps',english:'Visitor footsteps',kind:'moving',audio:audioVariants[0],audioVariants,audioEvents,surface,gain:1,refDistance:1.3,reverbSend:.25,height:.08,loop:false,fadeIn:.005,fadeOut:.055,path,activity:audioEvents.map(c=>[c.start,c.end]),contacts,follows:'S2',asset:'Native walk contacts with eight recorded footfall variations',recording:surface==='wood'?'Joseph Sardin / BigSoundBank 1518 / CC0; lossless wood footsteps':'SilentStrikeZ / Freesound 389625 / CC0; grass footsteps from public HQ preview',pairing:'Surface-category compatible recorded footfalls, aligned to rendered contact phases; not instance-matched shoes or measured acoustic calibration'});
}
export function samplePath(path,t){
  const end=path.at(-1);if(t>=end.t)return {...end,position:[...end.position],speed:0,heading:headingAt(path,path.length-2)};
  let i=0;while(i<path.length-2&&t>=path[i+1].t)i++;
  const a=path[i],b=path[i+1],u=Math.max(0,Math.min(1,(t-a.t)/(b.t-a.t))),mix=(x,y)=>x.map((v,k)=>v+(y[k]-v)*u);
  return {position:mix(a.position,b.position),lookAt:a.lookAt?mix(a.lookAt,b.lookAt):undefined,speed:Math.hypot(...a.position.map((v,k)=>b.position[k]-v))/(b.t-a.t),heading:headingAt(path,i),segment:i};
}

const dogBase={id:'G1',label:'Dog',english:'Dog',kind:'moving',role:'dog',optional:true,icon:'dog',color:0x9b70b5,audio:'assets/living/dog-bark.wav',gain:.8,refDistance:1.5,height:.43,loop:false,fadeIn:.008,fadeOut:.08,showRoute:true,gait:DOG_GAIT,pathInterpolation:'CubicBezierCurve3 with continuous corner tangents and zero-velocity pauses',asset:'Quaternius German Shepard, distance-driven native Idle / Walk with authored alert head motion during barking; CC BY 3.0 via Poly Pizza',recording:'Joseph Sardin / BigSoundBank 2353 / CC0; single 0.55 s bark',pairing:'Category-compatible virtual pairing; not an instance, body-size or jaw-motion calibrated recording'};
EPISODES.indoor.sources.push(
  {...dogBase,enabled:false,path:[actor(0,-1.5,-1.0),actor(2,-1.5,-1.0),actor(6,.2,-1),actor(7,.2,-1),actor(15,2.8,-1),actor(19,2.8,-.1),actor(24,2,.4),actor(25,2,.4),actor(32,.2,.4)],activity:[[6.1,6.65],[24.15,24.7]]},
  {id:'R1',label:'Robot vacuum',english:'Robot vacuum',kind:'moving',role:'vacuum',optional:true,enabled:true,icon:'bot',color:0xb68e20,audio:'assets/living/vacuum-loop.wav',gain:.3,refDistance:1.2,reverbSend:.16,occlusion:{directGain:.1,lowpassHz:800,reflectionGain:.1},height:.10,loop:true,fadeIn:.5,fadeOut:.6,showRoute:true,path:[actor(0,-.6,.25),actor(2,-.6,.25),actor(12,2.4,.25),actor(14,2.4,.25),actor(17,2.4,-.55),actor(27,-.6,-.55),actor(32,-.6,-.55)],activity:[[2,28]],asset:'Authored robot vacuum with rolling wheels, rotating side brushes and operating indicator',recording:'Joseph Sardin / BigSoundBank 1623 / CC0; steady 30-42 s excerpt',pairing:'Recorded Roomba motor paired with an authored generic robot; not an instance, RPM or suction calibration'}
);
EPISODES.outdoor.sources.push(
  {...dogBase,enabled:true,path:[actor(0,-5.8,1.4),actor(4,-5.8,1.4),actor(8,-2.3,-.3),actor(10,-1.5,-.4),actor(11.2,-1.5,-.4),actor(16,1.6,-.5),actor(19,3,1.5),actor(22,3,1.5),actor(27,2.3,3.6),actor(32,-.5,5)],activity:[[10.15,10.7],[20.05,20.6],[21.1,21.65]]},
  {id:'B1',label:'Birdsong',english:'Birdsong',kind:'static',role:'bird',optional:true,enabled:true,icon:'bird',color:0x626fa5,audio:'assets/living/bird-call.wav',gain:1,refDistance:1.3,height:.16,loop:false,fadeIn:.02,fadeOut:.15,path:[{t:0,position:[0,.93,-5.91]},{t:32,position:[0,.93,-5.91]}],activity:[[1,4.2],[6.2,9.4],[24,27.2]],asset:'Authored blackbird-like model perched on the park bench; illustrative head and beak motion',recording:'Le tiroir du fond / BigSoundBank Common Blackbird 20, 3493 / CC0',pairing:'Category-compatible virtual pairing, not an instance or articulatory-motion calibration'}
);
for(const e of Object.values(EPISODES)){
  const dog=e.sources.find(s=>s.id==='G1'),surface=e.id==='indoor'?'wood':'grass';
  const audioVariants=Array.from({length:8},(_,i)=>`assets/living/paws/${surface}-${String(i+1).padStart(2,'0')}.wav`),pawContacts=[];
  const total=sampleAnimalPath(dog.path,32).travelDistance;
  for(let cycle=0;cycle<=Math.ceil(total/DOG_GAIT.strideLength);cycle++)for(const foot of DOG_GAIT.contacts){
    const target=(cycle+foot.phase)*DOG_GAIT.strideLength;if(target<=0||target>=total)continue;
    let lo=0,hi=32;for(let i=0;i<24;i++){const mid=(lo+hi)/2;if(sampleAnimalPath(dog.path,mid).travelDistance<target)lo=mid;else hi=mid;}
    const time=(lo+hi)/2;
    if(sampleAnimalPath(dog.path,time).speed>.06&&locomotionWeight(dog.path,time,.45)>.45)pawContacts.push({time,paw:foot.paw,phase:foot.phase});
  }
  pawContacts.sort((a,b)=>a.time-b.time);
  const audioEvents=pawContacts.map((c,i)=>({start:c.time-.01,end:Math.min(32,c.time+.12),audio:audioVariants[[0,3,1,6,4,7,2,5][i%8]],contactTime:c.time,paw:c.paw,level:c.paw.startsWith('front')?.86:.68}));
  e.sources.push({id:'GP',label:'Dog paws',english:'Dog paws',kind:'moving',follows:'G1',surface,path:dog.path,pathInterpolation:dog.pathInterpolation,height:.035,gain:.6,refDistance:1.1,reverbSend:.12,loop:false,fadeIn:.003,fadeOut:.02,audio:audioVariants[0],audioVariants,audioEvents,pawContacts,activity:audioEvents.map(v=>[v.start,v.end]),asset:'Native paw-height contact estimates with quiet canine foley',recording:surface==='wood'?'Angellu16 / Freesound 533824 / CC0; public HQ preview':'congusbongus / Dog running, derived from sabotovat / Wolf run.wav / CC BY 3.0',pairing:'Quiet canine paw foley, not human shoe steps. Surface categories and paw-height contact estimates are illustrative, not measured force or material calibration.'});
}
for(const e of Object.values(EPISODES))for(const s of e.sources.filter(s=>s.showRoute))s.path.forEach((p,i)=>{if(i>0&&i<s.path.length-1)p.label=false;});
function headingAt(path,i){for(let j=i;j>=0;j--){const d=path[j+1].position.map((v,k)=>v-path[j].position[k]);if(Math.hypot(d[0],d[2])>.001)return Math.atan2(d[0],d[2]);}return -Math.PI/2;}
export function distanceAt(path,t){let d=0;for(let i=0;i<path.length-1;i++){const a=path[i],b=path[i+1];if(t<=a.t)break;d+=Math.hypot(...a.position.map((v,k)=>b.position[k]-v))*Math.min(1,(t-a.t)/(b.t-a.t));}return d;}
export function bridgeHeight(x,z){return Math.abs(z)<.8?.13*Math.max(0,Math.min(1,(x-4.35)/.35,(7.5-x)/.35)):0;}
export function getState(id,t){
  const e=EPISODES[id];t=Math.max(0,Math.min(e.duration,t));const c=samplePath(e.camera,t);
  if(id==='outdoor')c.position[1]+=bridgeHeight(c.position[0],c.position[2]);
  const forward=c.lookAt.map((v,k)=>v-c.position[k]),l=Math.hypot(...forward);for(let k=0;k<3;k++)forward[k]/=l;
  return {time:t,door:id==='indoor'?doorState(t):undefined,camera:{...c,forward},event:e.events.find(x=>t>=x.start&&t<x.end)||e.events.at(-1),sources:e.sources.map(s=>{
    const p=s.role==='dog'||s.follows==='G1'?sampleAnimalPath(s.path,t):samplePath(s.path,t),interval=s.activity.find(([a,b])=>t>=a&&t<b),position=[p.position[0],p.position[1]+s.height,p.position[2]],enabled=s.enabled!==false&&(!s.follows||e.sources.find(v=>v.id===s.follows)?.enabled!==false);
    const delta=position.map((v,k)=>v-c.position[k]),distance=Math.hypot(...delta),horizontal=Math.hypot(forward[0],forward[2]),right=[-forward[2]/horizontal,0,forward[0]/horizontal],up=[-forward[1]*right[2],horizontal,forward[1]*right[0]],dot=v=>delta.reduce((sum,x,k)=>sum+x*v[k],0),local=[dot(right),dot(up),dot(forward)];
    let heading=routeHeading(s.path,t,s.role==='dog'?.6:.42);
    if(id==='indoor'&&s.id==='S2'){
      const facing=Math.max(smooth(6,7,t)*(1-smooth(10.5,11.6,t)),smooth(22.8,23.2,t)*(1-smooth(26.5,27.3,t)));
      heading=blendAngle(heading,-Math.PI/2+doorState(t).angle,facing);
    }
    return {...s,...p,heading,enabled,reverseWalk:id==='indoor'&&s.id==='S2'&&t>=24&&t<=26.5,walkWeight:locomotionWeight(s.path,t,s.role==='dog'?.45:.3),phoneWeight:s.id==='S2'?phoneWeight(s,t):0,position,groundPosition:p.position,distance,relativePosition:local,azimuth:Math.atan2(local[0],local[2])*180/Math.PI,elevation:Math.atan2(local[1],Math.hypot(local[0],local[2]))*180/Math.PI,active:enabled&&!!interval,audioOffset:interval?t-interval[0]:0,travelDistance:p.travelDistance??distanceAt(s.path,t),rotorAngle:s.id==='F1'?Math.min(t,32)*s.rotationsPerSecond*2*Math.PI:undefined};
  })};
}
export function annotations(id,fps=30){const e=EPISODES[id];return {schema:'soundworld4d.episode/4',coordinates:'meters, Y up; listener relative = right/up/forward, azimuth positive right, elevation positive up',fps,episode:e,frames:Array.from({length:e.duration*fps+1},(_,i)=>{const s=getState(id,i/fps);return {frame:i,time:s.time,door:s.door,camera:{position:s.camera.position,forward:s.camera.forward,speed:s.camera.speed},sources:s.sources.map(x=>({id:x.id,position:x.position,relativePosition:x.relativePosition,heading:x.heading,speed:x.speed,walkWeight:x.walkWeight,phoneWeight:x.phoneWeight,travelDistance:x.travelDistance,distance:x.distance,azimuthDeg:x.azimuth,elevationDeg:x.elevation,enabled:x.enabled,active:x.active,rotorAngle:x.rotorAngle}))};})};}

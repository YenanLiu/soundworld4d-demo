export const COLORS={camera:0x167fa5,actor:0xc65083,static:0xc79318};
const wp=(t,x,z,lookX=x+1,lookZ=z)=>({t,position:[x,1.65,z],lookAt:[lookX,1.45,lookZ]});
const actor=(t,x,z)=>({t,position:[x,0,z]});
const speaker={id:'S2',label:'Female speaker',english:'Female speaker',kind:'moving',audio:'assets/audio/ears-p002-female-original.wav',gain:4.5,refDistance:1.6,height:1.52,loop:false,asset:'Microsoft Rocketbox Female Adult 01 + native Idle / Walk',recording:'EARS/p002_emo_adoration_sentences.wav',speakerId:'p002',voiceGender:'female',characterGender:'female',voiceMetadataSource:'https://github.com/facebookresearch/ears_dataset/blob/main/speaker_statistics.json',pairing:'Gender-compatible noncommercial virtual pairing; no identity match, lip synchronization or pitch alteration'};

export const EPISODES={
  indoor:{id:'indoor',title:'A visitor opens and closes the door',englishTitle:'A visitor opens and closes the door',duration:32,
    story:'A fan runs in the bedroom while a visitor approaches, opens the door and steps inside to speak. Footsteps follow the visitor only. The visitor returns to close the door as the listener enters the living room.',
    sourceLabel:'Model scene, not a real-world scan / RoboMaker house + VLNVerse door / AID, EARS audio',
    bounds:{minX:-10.3,maxX:10,minZ:-5.4,maxZ:6},
    camera:[wp(0,-4.8,-1.6,-2.4,-.65),wp(11.5,-4.8,-1.6,-2.4,-.65),wp(14,-4.8,-1.6,-4.25,.65),wp(16,-4.8,-1.6,-4.25,.65),wp(18,-3.25,-.65,-2.4,-.65),wp(20,-1.55,-.65,2,-.8),wp(22,-1.55,-1.85,-2.46,-.65),wp(26,-.6,-1.6,-2.46,-.65),wp(29,2.85,-1.85,1.51,1.73),wp(32,3.25,.85,1.51,1.73)],
    door:{id:'D1',asset:'VLNVerse / kujiale_0003 / door_0000',center:[-2.46,0,-.65],rotation:Math.PI/2,widthScale:1.42,hingeX:-.4066,handleLocal:[.71,1.015,-.025],opening:[8,10.5],closing:[24,26.5],maxAngle:Math.PI*.49},
    sources:[
      {id:'S1',label:'Music box',english:'Music box',kind:'static',audio:'assets/audio/aid-music-box-original.wav',gain:3,refDistance:1.4,height:.52,loop:true,path:[actor(0,1.51,1.73),actor(32,1.51,1.73)],activity:[[0,27]],asset:'authored-music-box',recording:'AID/music_box_01_RHODE_NT1.wav',pairing:'Category-compatible virtual pairing; not the recorded physical instance'},
      {...speaker,path:[actor(0,1.1,-.92),actor(2,1.1,-.92),actor(6,-2.185,-.920828),actor(8,-2.185,-.920828),actor(10.5,-3.2991,-.3741),actor(11.5,-3.2991,-.3741),actor(13,-3.85,-.7),actor(15,-4.25,.65),actor(20,-4.25,.65),actor(21.3,-4.25,-1),actor(23.2,-3.2991,-.3741),actor(24,-3.2991,-.3741),actor(26.5,-2.185,-.920828),actor(27,-2.185,-.920828),actor(29,-1.0,-.65),actor(32,2.65,-.65)],activity:[[13,22.76475]]},
      {id:'D1',label:'Door latch',english:'Door latch',kind:'articulated',audio:'assets/audio/door-close.wav',gain:8,refDistance:1.6,height:1.015,loop:false,fadeIn:.003,fadeOut:.04,path:[],activity:[[26.4140833333333,26.840375]],asset:'VLNVerse door_0000',recording:'door closed.wav / soundofsong / Freesound 647645, CC0; HQ MP3 preview converted to mono 48 kHz WAV',pairing:'Category-compatible recorded closing effect, not a dry or instance-matched measurement',peakOffset:.0859166666667}
    ],
    events:[
      {id:'I01',start:0,end:2,title:'A melody behind the door',detail:'The listener waits in the bedroom. S1 plays in the living room.',dependsOn:[],writes:['S1.activity'],expected:'The music source is outside the initial view.'},
      {id:'I02',start:2,end:7,title:'The visitor approaches',detail:'S2 walks to the closed door, stops and faces the handle.',dependsOn:['I01'],writes:['S2.pose'],expected:'Locomotion blends into a standing pose before reaching.'},
      {id:'I03',start:7,end:11.5,title:'Reach, push and release',detail:'The hand follows the door handle; the door opens from 8 to 10.5 s.',dependsOn:['I02'],writes:['S2.rightArm','D1.angle','propagation'],expected:'Hand contact and the swinging door share one state timeline.'},
      {id:'I04',start:11.5,end:20,title:'Enter and speak',detail:'S2 steps inside, starts speaking at 13 s and stands at 15 s. The listener follows.',dependsOn:['I03'],writes:['S2.pose','S2.activity','camera.pose'],expected:'Speech moves with the person; stopped legs use an Idle animation.'},
      {id:'I05',start:20,end:23.2,title:'Return to the handle',detail:'The listener is clear of the doorway. The visitor approaches the open door; speech ends at 22.8 s.',dependsOn:['I04'],writes:['S2.pose','camera.pose','S2.activity'],expected:'The listener crosses before the closing event begins.'},
      {id:'I06',start:23.2,end:27,title:'Pull the door closed',detail:'The hand reaches the handle, then pulls from 24 to 26.5 s. A recorded latch impact marks closure.',dependsOn:['I05'],writes:['S2.rightArm','S2.pose','D1.angle','D1.activity','propagation'],expected:'The closing sound peak aligns with the fully closed door at 26.5 s.'},
      {id:'I07',start:27,end:32,title:'Leave the door latched',detail:'The visitor releases the handle and walks away. The music box and its mechanism stop at 27 s.',dependsOn:['I06'],writes:['S1.activity','S1.animation','S2.pose'],expected:'The door stays closed while unrelated speech is not restarted.'}
    ],
    reverb:[{name:'Bedroom',audio:'assets/audio/room-bedroom.wav',targetRT60:.5},{name:'Living room',audio:'assets/audio/room-living.wav',targetRT60:.75}],
    environment:{door:'Actual VLNVerse mesh with authored hinge and hand contact. Opening and closing update geometry. The closing effect is category-compatible, not anechoic.',ceiling:'Hidden only in the overview.',acousticModel:'Web Audio HRTF, distance attenuation, moving-geometry raycast occlusion and stereo shoebox convolution reflections',assumptions:['The house is AWS RoboMaker, not a VLNVerse full-scene import or a captured real-world scan','VLNVerse source licensing must be reviewed before redistribution','Room dimensions and absorption are illustrative assumptions; fixed pyroomacoustics responses crossfade by listener zone, not a moving-pose mesh acoustic solver','No measured materials, calibrated SPL, diffraction or validated source directivity','Female EARS p002 voice is virtually paired with the female character; no identity match or lip synchronization','Camera and character paths are authored; no embodied navigation policy']}
  },
  outdoor:{id:'outdoor',title:'A conversation by the stream',englishTitle:'A conversation by the stream',duration:32,
    story:'The listener follows a woodland path towards a stream. A visitor approaches while speaking, then pauses beside the water. The listener crosses the bridge and turns back as the visitor continues down the bank.',
    sourceLabel:'Authored outdoor assembly, not a scan or Infinigen export / Poly Haven / EARS speech',
    bounds:{minX:-12,maxX:12,minZ:-9,maxZ:9},
    camera:[wp(0,-8,5,-3,2),wp(3,-8,5,-3,2),wp(10,-3,2,-1,-3),wp(16,.5,.4,2,-1),wp(21,3.1,0,5.7,2),wp(25,5.8,0,2,1),wp(27,7.5,0,5.7,2),wp(30,8.4,-2.8,5.7,2),wp(32,8.4,-2.8,2,1)],
    sources:[
      {id:'S1',label:'Stream',english:'Stream',kind:'static',audio:'../assets/stream.wav',gain:2.2,refDistance:2,height:.18,loop:true,path:[actor(0,5.8,2),actor(32,5.8,2)],activity:[[0,32]],asset:'authored-stream',recording:'Swale.ogg by Siddharth Patil (Ksd5), CC0',pairing:'Field recording used as a localized stream proxy; not an anechoic source'},
      {...speaker,path:[actor(0,-4,-4.5),actor(4,-4,-4.5),actor(11,0,-3),actor(17,2,-1),actor(23,2,1),actor(26,2,1),actor(32,-.5,4)],activity:[[9,18.76475]]}
    ],
    events:[
      {id:'O01',start:0,end:4,title:'Listen to the stream',detail:'The listener waits while S1 plays continuously.',dependsOn:[],writes:['S1.activity'],expected:'Water stays fixed while its surface texture moves.'},
      {id:'O02',start:4,end:9,title:'Approach the water',detail:'The visitor approaches from ahead and to the left.',dependsOn:['O01'],writes:['camera.pose','S2.pose'],expected:'Two independent paths share world coordinates.'},
      {id:'O03',start:9,end:17,title:'Walk and talk',detail:'Speech starts at 9 s and follows the visitor along the bank.',dependsOn:['O02'],writes:['S2.activity','S2.pose'],expected:'Speech bearing follows the head-height source.'},
      {id:'O04',start:17,end:23,title:'Turn towards the bridge',detail:'The visitor approaches the bank; female speech ends at 18.8 s.',dependsOn:['O03'],writes:['camera.pose','S2.activity'],expected:'Camera yaw changes perception, not the source recording.'},
      {id:'O05',start:23,end:26,title:'Cross the bridge',detail:'The visitor stands naturally while the listener passes near S1.',dependsOn:['O04'],writes:['camera.pose','S2.pose'],expected:'The listener follows the bridge height; the visitor uses Idle.'},
      {id:'O06',start:26,end:32,title:'Look back from the far bank',detail:'The visitor resumes walking while the listener turns back.',dependsOn:['O05'],writes:['camera.pose','S2.pose'],expected:'Walking resumes without restarting finished speech.'}
    ],
    environment:{construction:'Authored 24 x 18 m park ground, stream, bridge and open-slat park benches with downloaded Poly Haven trees and rocks. This is NOT Infinigen output or a complete captured scene.',acousticModel:'Web Audio HRTF + inverse-distance attenuation; no artificial room reverb outdoors',assumptions:['Stream is one point emitter, not a distributed flow field','No meteorological propagation or terrain diffraction','Water recording retains original environmental cues','Only the visible visitor has footstep audio; camera motion adds no footsteps','Recorded grass footfalls are category-compatible, not calibrated to the rendered ground or shoes','Speech has no lip synchronization']}
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
EPISODES.indoor.sources.push({id:'F1',label:'Bedroom fan',english:'Bedroom fan',kind:'static',audio:'assets/audio/fan-loop.wav',gain:1.8,refDistance:1.5,height:1.15,loop:true,path:[actor(0,-3.45,1.3),actor(32,-3.45,1.3)],activity:[[0,32]],rotationsPerSecond:6,asset:'Authored pedestal fan with driven rotor',recording:'TimBahrij / Freesound 191580 / CC0; steady 6-15.5 s excerpt',pairing:'Recorded desk-fan timbre with an authored fan; operating state matched, not instance- or RPM-calibrated'});

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
function headingAt(path,i){for(let j=i;j>=0;j--){const d=path[j+1].position.map((v,k)=>v-path[j].position[k]);if(Math.hypot(d[0],d[2])>.001)return Math.atan2(d[0],d[2]);}return -Math.PI/2;}
function movingWeight(path,t){let weight=0;for(let i=0;i<path.length-1;i++){const a=path[i],b=path[i+1];if(a.position.some((v,k)=>Math.abs(v-b.position[k])>.001))weight=Math.max(weight,smooth(a.t-.18,a.t+.18,t)*(1-smooth(b.t-.18,b.t+.18,t)));}return weight;}
function smoothHeading(path,t){const before=samplePath(path,Math.max(0,t-.22)).heading,after=samplePath(path,Math.min(32,t+.22)).heading;return before+Math.atan2(Math.sin(after-before),Math.cos(after-before))/2;}
export function distanceAt(path,t){let d=0;for(let i=0;i<path.length-1;i++){const a=path[i],b=path[i+1];if(t<=a.t)break;d+=Math.hypot(...a.position.map((v,k)=>b.position[k]-v))*Math.min(1,(t-a.t)/(b.t-a.t));}return d;}
export function bridgeHeight(x,z){return Math.abs(z)<.8?.13*Math.max(0,Math.min(1,(x-4.35)/.35,(7.5-x)/.35)):0;}
export function getState(id,t){
  const e=EPISODES[id];t=Math.max(0,Math.min(e.duration,t));const c=samplePath(e.camera,t);
  if(id==='outdoor')c.position[1]+=bridgeHeight(c.position[0],c.position[2]);
  const forward=c.lookAt.map((v,k)=>v-c.position[k]),l=Math.hypot(...forward);for(let k=0;k<3;k++)forward[k]/=l;
  return {time:t,door:id==='indoor'?doorState(t):undefined,camera:{...c,forward},event:e.events.find(x=>t>=x.start&&t<x.end)||e.events.at(-1),sources:e.sources.map(s=>{
    const p=samplePath(s.path,t),interval=s.activity.find(([a,b])=>t>=a&&t<b),position=[p.position[0],p.position[1]+s.height,p.position[2]];
    const delta=position.map((v,k)=>v-c.position[k]),distance=Math.hypot(...delta),horizontal=Math.hypot(forward[0],forward[2]),right=[-forward[2]/horizontal,0,forward[0]/horizontal],up=[-forward[1]*right[2],horizontal,forward[1]*right[0]],dot=v=>delta.reduce((sum,x,k)=>sum+x*v[k],0),local=[dot(right),dot(up),dot(forward)];
    let heading=smoothHeading(s.path,t);if(id==='indoor'&&s.id==='S2'&&((t>=6&&t<11.5)||(t>=23.2&&t<27)))heading=-Math.PI/2+doorState(t).angle;
    if(id==='indoor'&&s.id==='S2'&&t>=15&&t<20.8){const facing=Math.atan2(-.55,-2.25),before=samplePath(s.path,14.9).heading;heading=t<20?before+Math.atan2(Math.sin(facing-before),Math.cos(facing-before))*smooth(15,15.8,t):facing+Math.atan2(Math.sin(Math.PI-facing),Math.cos(Math.PI-facing))*smooth(20,20.8,t);}
    return {...s,...p,heading,reverseWalk:id==='indoor'&&s.id==='S2'&&t>=24&&t<=26.5,walkWeight:movingWeight(s.path,t),position,groundPosition:p.position,distance,relativePosition:local,azimuth:Math.atan2(local[0],local[2])*180/Math.PI,elevation:Math.atan2(local[1],Math.hypot(local[0],local[2]))*180/Math.PI,active:!!interval,audioOffset:interval?t-interval[0]:0,travelDistance:distanceAt(s.path,t),rotorAngle:s.id==='F1'?Math.min(t,32)*s.rotationsPerSecond*2*Math.PI:undefined};
  })};
}
export function annotations(id,fps=30){const e=EPISODES[id];return {schema:'soundworld4d.episode/3',coordinates:'meters, Y up; listener relative = right/up/forward, azimuth positive right, elevation positive up',fps,episode:e,frames:Array.from({length:e.duration*fps+1},(_,i)=>{const s=getState(id,i/fps);return {frame:i,time:s.time,door:s.door,camera:{position:s.camera.position,forward:s.camera.forward,speed:s.camera.speed},sources:s.sources.map(x=>({id:x.id,position:x.position,relativePosition:x.relativePosition,heading:x.heading,speed:x.speed,distance:x.distance,azimuthDeg:x.azimuth,elevationDeg:x.elevation,active:x.active,rotorAngle:x.rotorAngle}))};})};}

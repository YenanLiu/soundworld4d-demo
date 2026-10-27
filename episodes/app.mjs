import {EPISODES,getState,annotations} from './state.mjs';
import {EpisodeScene} from './scene.mjs';
import {EpisodeAudio} from './audio.mjs';
import {applySource,audioAssets,createReflectionBus,createSourceChannel,roomMix,scheduleSource} from './acoustics.mjs';

const $=id=>document.getElementById(id),icon=(id,name)=>{$(id).innerHTML=`<i data-lucide="${name}"></i>`;window.lucide.createIcons();};
const scene=new EpisodeScene($('ego'),$('map'),text=>$('load-state').textContent=text),audio=new EpisodeAudio();
let id=new URLSearchParams(location.search).get('scene')==='outdoor'?'outdoor':'indoor',time=0,playing=false,last=performance.now(),switching=false;
let uiStamp=-1;
function download(blob,filename){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);}
function textFile(text){return new Blob([text],{type:'text/plain;charset=utf-8'});}
function episodeStory(e){return `# ${e.title}\n\n${e.story}\n\n## Scene and coordinates\n\n${e.sourceLabel}\nMetres, Y up, X/Z ground plane. Listener height: 1.65 m.\n\n## Event timeline\n\n`+e.events.map(x=>`${x.start}-${x.end} s | ${x.title}\n${x.detail}\nDependencies: ${x.dependsOn.join(', ')||'none'}\n`).join('\n')+`\n## Sources\n\n`+e.sources.map(s=>`${s.id} ${s.label}: ${s.kind}; activity ${JSON.stringify(s.activity)}\nRecording: ${s.recording}\nPairing: ${s.pairing}\n`).join('\n')+`\n## Limitations\n\n${JSON.stringify(e.environment,null,2)}\n`;}
function renderTimeline(){
  const e=EPISODES[id];$('scene-kind').textContent=id==='indoor'?'INDOOR / 01':'OUTDOOR / 02';$('scene-title').textContent=e.title;$('story').textContent=e.story;$('scene-source').textContent=e.sourceLabel;
  $('events').innerHTML=e.events.map(x=>`<li data-event="${x.id}"><button data-time="${x.start}" title="Seek to ${x.start} seconds"><span class="event-time">${String(x.start).padStart(2,'0')}-${String(x.end).padStart(2,'0')} s</span><strong>${x.title}</strong><p>${x.detail}</p></button></li>`).join('');
  $('events').querySelectorAll('button').forEach(button=>button.onclick=()=>seek(Number(button.dataset.time)));
  const rows=[{label:'Camera C',kind:'camera',windows:e.camera.slice(0,-1).flatMap((p,i)=>p.position.some((v,k)=>v!==e.camera[i+1].position[k])?[[p.t,e.camera[i+1].t]]:[])},{label:'S1 / '+e.sources[0].label,kind:'static',windows:e.sources[0].activity},{label:'S2 / Walk',kind:'actor',windows:e.sources[1].path.slice(0,-1).flatMap((p,i)=>p.position.some((v,k)=>v!==e.sources[1].path[i+1].position[k])?[[p.t,e.sources[1].path[i+1].t]]:[])},{label:'S2 / Speech',kind:'actor',windows:e.sources[1].activity}];
  if(e.door)rows.push({label:'D1 / Open',kind:'static',windows:[e.door.opening]},{label:'D1 / Close',kind:'static',windows:[e.door.closing]},{label:'D1 / Latch',kind:'static',windows:e.sources.find(s=>s.id==='D1').activity});
  for(const s of e.sources.filter(s=>['FP','F1'].includes(s.id)))rows.push({label:s.id+' / '+(s.id==='F1'?'Fan':'Footsteps'),kind:s.id==='F1'?'static':'actor',windows:s.activity});
  $('tracks').innerHTML=rows.map(row=>`<div class="track ${row.kind}"><span>${row.label}</span><div class="track-rail">${row.windows.map(([a,b])=>`<span class="track-block" style="left:${a/e.duration*100}%;width:${(b-a)/e.duration*100}%"></span>`).join('')}<b class="track-playhead"></b></div></div>`).join('');
  $('source-readouts').innerHTML=`<table><thead><tr><th>Source</th><th>Distance</th><th>Azimuth</th><th>Elevation</th><th class="path-state">Path / state</th><th>Solo</th></tr></thead><tbody>${e.sources.map(s=>`<tr id="read-${s.id}"><th><span class="identifier">${s.id}</span>${s.label}</th><td data-value="distance"></td><td data-value="azimuth"></td><td data-value="elevation"></td><td class="path-state" data-value="state"></td><td><button class="icon solo" data-solo="${s.id}" title="Solo ${s.label}" aria-label="Solo ${s.label}" aria-pressed="false"><i data-lucide="headphones"></i></button></td></tr>`).join('')}</tbody></table>`;
  $('source-readouts').querySelectorAll('[data-solo]').forEach(button=>button.onclick=async()=>{audio.solo=audio.solo===button.dataset.solo?null:button.dataset.solo;if(playing)await audio.start(getState(id,time),scene);renderUI(getState(id,time));});
  $('reverb').disabled=!e.reverb;$('wet').disabled=!e.reverb;$('reverb').checked=audio.reverb;window.lucide.createIcons();
  for(const b of document.querySelectorAll('[data-scene]'))b.classList.toggle('selected',b.dataset.scene===id);
}
function renderUI(state){
  const s=time.toFixed(1);$('clock').textContent=`${s.padStart(4,'0')} / 32.0 s`;$('timebadge').textContent=s.padStart(4,'0')+' s';$('seek').value=time;
  $('event-now').textContent=state.event.title;$('camera-coordinate').textContent=`x ${state.camera.position[0].toFixed(1)} · z ${state.camera.position[2].toFixed(1)} m`;
  document.querySelectorAll('.track-playhead').forEach(x=>x.style.left=`${time/32*100}%`);
  document.querySelectorAll('[data-event]').forEach(x=>x.classList.toggle('active',x.dataset.event===state.event.id));
  $('listener-pose').textContent=`Camera [${state.camera.position.map(v=>v.toFixed(2)).join(', ')}] m · yaw ${(Math.atan2(state.camera.forward[0],-state.camera.forward[2])*180/Math.PI).toFixed(0)}°`;
  $('reverb-label').textContent=EPISODES[id].reverb?(audio.reverb?`${roomMix(state)[0]>.5?'Bedroom · target 0.50 s':'Living room · target 0.75 s'} (assumed)`:'Room reflections off'):'Open air · no room reverb';
  state.sources.forEach(s=>{const row=$('read-'+s.id),blocked=scene.obstruction(s.position,state.camera.position),values={distance:s.distance.toFixed(2)+' m',azimuth:(s.azimuth>=0?'+':'')+s.azimuth.toFixed(1)+'°',elevation:(s.elevation>=0?'+':'')+s.elevation.toFixed(1)+'°',state:`${s.active?'Active':'Silent'} · ${blocked?'Occluded':'Clear'}`};for(const [key,value] of Object.entries(values))row.querySelector(`[data-value="${key}"]`).textContent=value;row.classList.toggle('active',s.active);row.querySelector('button').setAttribute('aria-pressed',audio.solo===s.id);});
}
async function selectScene(next){
  if(switching)return;switching=true;playing=false;audio.stop();icon('play','play');id=next;time=0;uiStamp=-1;window.episodesDemo.ready=false;renderTimeline();$('load-state').classList.remove('error');
  for(const button of document.querySelectorAll('[data-scene],#play,#export-btn'))button.disabled=true;
  try{scene.dispose();await scene.load(EPISODES[id]);await audio.load(EPISODES[id]);const state=getState(id,time);scene.update(state);scene.render();renderUI(state);window.episodesDemo.ready=true;$('load-state').textContent='Assets loaded / 32 s';history.replaceState({},'',`?scene=${id}`);}
  catch(error){console.error(error);$('load-state').textContent='Loading failed: '+error.message;$('load-state').classList.add('error');window.episodesDemo.error=error.message;}
  finally{switching=false;for(const button of document.querySelectorAll('[data-scene],#play,#export-btn'))button.disabled=false;}
}
async function seek(value){time=Math.max(0,Math.min(32,value));uiStamp=-1;const s=getState(id,time);scene.update(s);scene.render();renderUI(s);if(playing)await audio.start(s,scene);}
async function togglePlay(){
  if(!scene.ready)return;
  if(playing){playing=false;audio.stop();icon('play','play');$('play').title=$('play').ariaLabel='Play';}
  else{if(time>=32)time=0;await audio.start(getState(id,time),scene);last=performance.now();playing=true;icon('play','pause');$('play').title=$('play').ariaLabel='Pause';}
}
function tick(now){
  last=now;
  if(playing&&audio.playing){time=Math.min(32,audio.startTime+audio.context.currentTime-audio.startClock);if(time>=32){playing=false;audio.stop();icon('play','play');}}
  if(scene.ready&&!window.episodesDemo?.capturing){const s=getState(id,time);scene.update(s);if(playing)audio.update(s,scene);scene.render();if(Math.floor(time*20)!==uiStamp){renderUI(s);uiStamp=Math.floor(time*20);}}
  requestAnimationFrame(tick);
}

function encodeWav(buffer){
  const channels=buffer.numberOfChannels,length=buffer.length,bytes=new ArrayBuffer(44+length*channels*2),view=new DataView(bytes),str=(p,s)=>[...s].forEach((c,i)=>view.setUint8(p+i,c.charCodeAt(0)));
  str(0,'RIFF');view.setUint32(4,bytes.byteLength-8,true);str(8,'WAVE');str(12,'fmt ');view.setUint32(16,16,true);view.setUint16(20,1,true);view.setUint16(22,channels,true);view.setUint32(24,buffer.sampleRate,true);view.setUint32(28,buffer.sampleRate*channels*2,true);view.setUint16(32,channels*2,true);view.setUint16(34,16,true);str(36,'data');view.setUint32(40,length*channels*2,true);
  const data=Array.from({length:channels},(_,i)=>buffer.getChannelData(i));let p=44;for(let frame=0;frame<length;frame++)for(let ch=0;ch<channels;ch++,p+=2)view.setInt16(p,Math.round(Math.max(-1,Math.min(1,data[ch][frame]))*32767),true);return bytes;
}
async function renderAudio(selected,options={}){
  const e=EPISODES[id],ctx=new OfflineAudioContext(2,32*48000,48000);
  const listener=ctx.listener,axes=['X','Y','Z'],master=ctx.createGain();master.gain.value=.8;master.connect(ctx.destination);
  const buffers=new Map();for(const url of audioAssets(e))buffers.set(url,await ctx.decodeAudioData(audio.buffers.get(url).slice(0)));
  const reflections=createReflectionBus(ctx,e,buffers,master,{reverb:options.reverb??audio.reverb,wet:options.wet??audio.wet});
  for(let t=0;t<=32.001;t+=.05){const s=getState(id,Math.min(32,t));for(let i=0;i<3;i++){listener['position'+axes[i]].linearRampToValueAtTime(s.camera.position[i],t);listener['forward'+axes[i]].linearRampToValueAtTime(s.camera.forward[i],t);}listener.upY.setValueAtTime(1,t);roomMix(s).forEach((w,i)=>reflections.rooms[i]?.gain.gain.linearRampToValueAtTime(w,t));}
  for(const index of selected){
    const source=e.sources[index],channel=createSourceChannel(ctx,source,reflections,master);
    for(let t=0;t<=32.001;t+=.05){const s=getState(id,Math.min(32,t)),item=s.sources[index];scene.setEnvironment(s);applySource(channel,item,scene.obstruction(item.position,s.camera.position),(p,v)=>p.linearRampToValueAtTime(v,t));}
    scheduleSource(ctx,channel,buffers);
  }
  scene.update(getState(id,time));return encodeWav(await ctx.startRendering());
}
async function exportEpisode(){
  if(!scene.ready)return;const button=$('export-btn');button.disabled=true;const wasPlaying=playing;if(wasPlaying)await togglePlay();
  try{
    $('load-state').textContent='Exporting trajectories and spatial audio...';const zip=new window.JSZip(),e=EPISODES[id],ann=annotations(id);
    zip.file('episode.json',JSON.stringify(e,null,2));zip.file('frames-30fps.json',JSON.stringify(ann));zip.file('story.md',episodeStory(e));zip.file('overview.png',scene.overviewPng().split(',')[1],{base64:true});
    zip.file('camera.csv','time,x,y,z,forward_x,forward_y,forward_z,speed_m_s\n'+ann.frames.map(f=>[f.time,...f.camera.position,...f.camera.forward,f.camera.speed].join(',')).join('\n'));
    zip.file('sources.csv','time,id,x,y,z,speed_m_s,distance_m,azimuth_deg,elevation_deg,right_m,up_m,forward_m,active\n'+ann.frames.flatMap(f=>f.sources.map(s=>[f.time,s.id,...s.position,s.speed,s.distance,s.azimuthDeg,s.elevationDeg,...s.relativePosition,s.active].join(','))).join('\n'));
    zip.file('audio-settings.json',JSON.stringify({reverb:audio.reverb,wet:audio.wet,rooms:e.reverb||[],solo:'Audition only; exports include all selected sources'},null,2));
    for(const [name,url] of [['SOURCES.json','./SOURCES.json'],['acoustics-metadata.json','./assets/audio/acoustics-metadata.json'],['footstep-manifest.json','./assets/audio/footsteps/manifest.json']])zip.file(name,await (await fetch(url)).text());
    zip.file('audio/spatial-mix.wav',await renderAudio(e.sources.map((_,i)=>i)));
    for(let i=0;i<e.sources.length;i++)zip.file(`audio/${e.sources[i].id}-spatial.wav`,await renderAudio([i]));
    zip.file('README.txt','Spatial audio uses browser HRTF, inverse-distance attenuation, a raycast occlusion proxy and indoor stereo shoebox convolution reflections. Fixed room responses and their dimensions/absorption are assumptions, not measured moving-pose RIRs of this house. Azimuth is positive right; elevation positive up; relative XYZ are right/up/forward in the camera basis. Scene geometry lives in episodes/assets. See README.md, acoustics-metadata.json and SOURCES.json for provenance. EARS is CC BY-NC 4.0.');
    download(await zip.generateAsync({type:'blob',compression:'DEFLATE',compressionOptions:{level:3}}),`soundworld4d-${id}-episode.zip`);
    $('load-state').textContent='Script, trajectories and audio exported';
  }catch(error){console.error(error);$('load-state').textContent='Export failed: '+error.message;}
  finally{button.disabled=false;}
}
async function showSources(){
  const response=await fetch('./SOURCES.json');const sources=await response.json();
  $('source-details').innerHTML='<p class="limitation">Local noncommercial prototype, not a physically validated dataset. The door uses actual VLNVerse geometry; music and speech use AID and EARS. The house and outdoor scenery remain RoboMaker and Poly Haven, not VLNVerse and Infinigen full-scene imports. The additional Rocketbox human uses a virtual voice pairing without lip sync. Door motion is an authored hand-contact animation, not a trained interaction policy.</p>'+sources.resources.map(s=>`<article><h3>${s.name}</h3><span class="license">${s.license}</span><p>${s.use}<br><a href="${s.source}" target="_blank" rel="noopener">Original source</a></p></article>`).join('');$('source-dialog').showModal();
}
$('play').onclick=togglePlay;$('restart').onclick=()=>seek(0);$('seek').oninput=e=>seek(Number(e.target.value));$('mute').onclick=()=>{audio.setMute(!audio.muted);icon('mute',audio.muted?'volume-x':'volume-2');$('mute').title=$('mute').ariaLabel=audio.muted?'Unmute':'Mute';};
$('reverb').onchange=e=>{audio.reverb=e.target.checked;renderUI(getState(id,time));};$('wet').oninput=e=>{audio.wet=Number(e.target.value);$('wet-value').textContent=Math.round(audio.wet*100)+'%';};
$('sources-btn').onclick=showSources;$('close-dialog').onclick=()=>$('source-dialog').close();$('export-btn').onclick=exportEpisode;
$('overview-export').onclick=()=>download(new Blob([Uint8Array.from(atob(scene.overviewPng().split(',')[1]),c=>c.charCodeAt(0))],{type:'image/png'}),`${id}-trajectory-overview.png`);
document.querySelectorAll('[data-scene]').forEach(button=>button.onclick=()=>selectScene(button.dataset.scene));
new ResizeObserver(()=>{scene.resize();scene.render();}).observe($('ego-wrap'));new ResizeObserver(()=>{scene.resize();scene.render();}).observe($('map-wrap'));
window.episodesDemo={ready:false,scene,audio,getState:()=>getState(id,time),get episode(){return EPISODES[id];},seek,selectScene,togglePlay,exportEpisode,renderAudio,annotations:()=>annotations(id),get time(){return time;},get playing(){return playing;}};
const initialTime=Number(new URLSearchParams(location.search).get('t')||0);
window.lucide.createIcons();requestAnimationFrame(tick);await selectScene(id);if(Number.isFinite(initialTime)&&initialTime>0)await seek(initialTime);

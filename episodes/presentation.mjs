export const CAMERA_COLOR='#167fa5';
export const PERSON_COLOR='#c65083';
export function ambientSources(episode){
  return episode.ambience.filter(item=>{
    const source=episode.sources.find(source=>source.id===item.sourceId);
    return source&&source.enabled!==false;
  }).map(item=>({...item,name:episode.sources.find(source=>source.id===item.sourceId).label}));
}
export function ambientSounds(episode){return ambientSources(episode).map(item=>item.description);}
export function episodeSynopsis(episode){return [...ambientSources(episode).map(item=>item.story),episode.story].join(' ');}
export function captureWindowLabel(windows){return windows.map(([a,b])=>`${Number(a.toFixed(2))}-${Number(b.toFixed(2))} s`).join('; ');}
const styles={
  S2:{name:'Person / Speech',mapName:'Person',color:PERSON_COLOR,icon:'speech'},
  FP:{name:'Person / Steps',mapName:'Person steps',color:'#d47b49',icon:'footprints'},
  D1:{name:'Door / Latch',mapName:'Door',color:'#b88b25',icon:'door-closed'},
  F1:{name:'Fan / Hum',mapName:'Fan',color:'#438599',icon:'fan'},
  G1:{name:'Dog / Bark',mapName:'Dog',color:'#9b70b5',icon:'dog'},
  GP:{name:'Dog / Paws',mapName:'Dog paws',color:'#b28bce',icon:'paw-print'},
  R1:{name:'Robot / Motor',mapName:'Robot vacuum',color:'#b68e20',icon:'bot'},
  B1:{name:'Bird / Calls',mapName:'Bird',color:'#626fa5',icon:'bird'},
};
export function sourceStyle(source,scene){
  if(source.id==='S1')return scene==='indoor'?{name:'Music / Melody',mapName:'Music box',color:'#b78d25',icon:'music-2'}:{name:'Stream / Water',mapName:'Stream',color:'#397ab8',icon:'waves'};
  return styles[source.id]||{name:source.label,mapName:source.label,color:'#777777',icon:'volume-2'};
}
export function cameraWaypoints(path){
  const points=[];
  for(const p of path){
    const last=points.at(-1);
    if(last&&p.position.every((v,k)=>v===last.position[k]))last.endTime=p.t;
    else points.push({index:points.length,time:p.t,endTime:p.t,position:[...p.position]});
  }
  return points.map(p=>({...p,label:`C${p.index} / ${p.time}${p.endTime>p.time?'-'+p.endTime:''} s`}));
}
export function motionWindows(path){
  const windows=[];
  for(let i=0;i<path.length-1;i++)if(path[i].position.some((v,k)=>Math.abs(v-path[i+1].position[k])>.001)){
    const last=windows.at(-1);if(last&&last[1]===path[i].t)last[1]=path[i+1].t;else windows.push([path[i].t,path[i+1].t]);
  }
  return windows;
}
export function timelineRows(episode){
  const enabled=s=>s.enabled!==false&&(!s.follows||episode.sources.find(v=>v.id===s.follows)?.enabled!==false);
  const moving=[{id:'camera-motion',label:'Camera / Move',mode:'motion',color:CAMERA_COLOR,icon:'camera',windows:motionWindows(episode.camera)},
    {id:'person-motion',label:'Person / Walk',mode:'motion',color:PERSON_COLOR,icon:'person-standing',windows:motionWindows(episode.sources[1].path)}];
  if(episode.door)moving.push(...[['Open',episode.door.opening],['Close',episode.door.closing]].map(([label,window])=>({id:'door-'+label.toLowerCase(),label:'Door / '+label,mode:'motion',color:'#b88b25',icon:'door-open',windows:[window]})));
  for(const s of episode.sources.filter(s=>s.showRoute&&enabled(s))){const style=sourceStyle(s,episode.id);moving.push({id:s.id+'-motion',label:s.role==='dog'?'Dog / Walk':'Robot / Move',mode:'motion',color:style.color,icon:style.icon,windows:motionWindows(s.path)});}
  const order=['S1','S2','FP','D1','F1','G1','GP','B1','R1'];
  const audio=[...episode.sources].filter(enabled).sort((a,b)=>order.indexOf(a.id)-order.indexOf(b.id)).map(s=>{
    const style=sourceStyle(s,episode.id);return{id:s.id+'-audio',sourceId:s.id,label:style.name,mode:'audio',color:style.color,icon:style.icon,windows:s.activity};
  });
  return [...moving,...audio];
}

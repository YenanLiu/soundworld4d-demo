import {CubicBezierCurve3,Vector3} from '../vendor/three.module.js';

export const ease=(a,b,t)=>{const u=Math.max(0,Math.min(1,(t-a)/(b-a)));return u*u*(3-2*u);};
export const blendAngle=(a,b,w)=>a+Math.atan2(Math.sin(b-a),Math.cos(b-a))*w;
const length=(a,b)=>Math.hypot(...b.map((v,k)=>v-a[k]));

export function locomotionWeight(path,t,fade=.3){
  let start=null,end=0,weight=0;
  const include=()=>{if(start!==null){const f=Math.min(fade,(end-start)/3);weight=Math.max(weight,ease(start,start+f,t)*(1-ease(end-f,end,t)));}};
  // Adjacent moving segments are one walk, not a fresh fade at every waypoint.
  for(let i=0;i<path.length-1;i++){
    const a=path[i],b=path[i+1];
    if(length(a.position,b.position)>.001){start??=a.t;end=b.t;}
    else{include();start=null;}
  }
  include();return weight;
}

export function routeHeading(path,t,window=.42){
  const turns=[];
  for(let i=0;i<path.length-1;i++){
    const a=path[i],b=path[i+1],dx=b.position[0]-a.position[0],dz=b.position[2]-a.position[2];
    if(Math.hypot(dx,dz)>.001)turns.push({time:a.t,angle:Math.atan2(dx,dz)});
  }
  if(!turns.length)return 0;
  let result=turns[0].angle;
  for(let i=1;i<turns.length;i++){
    const delta=Math.atan2(Math.sin(turns[i].angle-turns[i-1].angle),Math.cos(turns[i].angle-turns[i-1].angle));
    result+=delta*ease(turns[i].time-window,turns[i].time+window,t);
  }
  return result;
}

const curves=new WeakMap();
function curvedRoute(path){
  const signature=path.map(p=>[p.t,...p.position].join(',')).join(';');
  if(curves.get(path)?.signature===signature)return curves.get(path);
  const velocity=(i)=>{
    if(i<0||i>=path.length-1)return new Vector3();
    return new Vector3(...path[i+1].position).sub(new Vector3(...path[i].position)).divideScalar(path[i+1].t-path[i].t);
  };
  const tangents=path.map((_,i)=>{
    const a=velocity(i-1),b=velocity(i);
    if(a.lengthSq()<1e-8||b.lengthSq()<1e-8)return new Vector3();
    const limit=Math.min(a.length(),b.length());
    return a.add(b).multiplyScalar(.5).clampLength(0,limit);
  });
  let total=0;
  const segments=path.slice(0,-1).map((a,i)=>{
    const b=path[i+1],duration=b.t-a.t,p0=new Vector3(...a.position),p3=new Vector3(...b.position),distance=p0.distanceTo(p3);
    const offset=(v)=>v.clone().multiplyScalar(duration/3).clampLength(0,distance/3);
    const curve=new CubicBezierCurve3(p0,p0.clone().add(offset(tangents[i])),p3.clone().sub(offset(tangents[i+1])),p3);
    curve.arcLengthDivisions=80;
    const lengths=distance<1e-10?Array(81).fill(0):curve.getLengths(80),segment={start:a.t,end:b.t,curve,lengths,distance:lengths.at(-1),before:total};
    total+=segment.distance;return segment;
  });
  const result={signature,segments,total};curves.set(path,result);return result;
}

export function sampleAnimalPath(path,t){
  const route=curvedRoute(path),segment=route.segments.find(s=>t<s.end)||route.segments.at(-1);
  if(segment.distance<1e-10)return {position:segment.curve.v0.toArray(),speed:0,travelDistance:segment.before};
  const u=Math.max(0,Math.min(1,(t-segment.start)/(segment.end-segment.start)));
  const position=segment.curve.getPoint(u),n=u*80,index=Math.min(79,Math.floor(n));
  const traveled=segment.lengths[index]+(segment.lengths[index+1]-segment.lengths[index])*(n-index);
  const dt=.001,lo=Math.max(0,u-dt),hi=Math.min(1,u+dt);
  const speed=t>=path.at(-1).t?0:segment.curve.getPoint(hi).distanceTo(segment.curve.getPoint(lo))/((hi-lo)*(segment.end-segment.start));
  return {position:position.toArray(),speed,travelDistance:segment.before+traveled};
}

export function phoneWeight(source,t){
  return Math.max(0,...source.activity.map(([a,b])=>ease(a-1.1,a-.1,t)*(1-ease(b+.2,b+1.15,t))));
}

import * as T from '../vendor/three.module.js';
import {clone} from '../vendor/utils/SkeletonUtils.js';
import {ease} from './motion.mjs';

export function createAnimal(asset,motions,type,gait=null){
  const root=new T.Group(),display=new T.Group(),model=clone(asset.scene);root.name='Quaternius_German_Shepherd';display.add(model);root.add(display);
  model.traverse(n=>{if(n.isMesh){n.castShadow=true;n.receiveShadow=true;for(const m of Array.isArray(n.material)?n.material:[n.material]){m.roughness=.88;m.metalness=0;if(m.map){m.map.colorSpace=T.SRGBColorSpace;m.map.anisotropy=8;}}}});
  const clips=motions.animations.filter(c=>['Walk','Idle'].includes(c.name)).map(source=>{
    const clip=source.clone();
    // Body is Z-up beneath the imported armature. Preserve its vertical stride.
    for(const track of clip.tracks){
      const size=track.getValueSize(),first=track.values.slice(0,size);
      if(track.name==='Body.position'){
        const last=track.values.slice(-3);
        for(let i=0;i<track.times.length;i++)for(const axis of [0,1])track.values[i*3+axis]-=(last[axis]-first[axis])*track.times[i]/clip.duration;
      }
      // The native cycle has a small end-point mismatch; feather the loop seam.
      for(let i=0;i<track.times.length;i++){
        const w=ease(clip.duration-.12,clip.duration,track.times[i]),offset=i*size;
        if(!w)continue;
        if(track.ValueTypeName==='quaternion')T.Quaternion.slerpFlat(track.values,offset,track.values,offset,first,0,w);
        else for(let k=0;k<size;k++)track.values[offset+k]+=(first[k]-track.values[offset+k])*w;
      }
    }
    return clip;
  });
  const barkClip=clips.find(c=>c.name==='Idle').clone();barkClip.name='Bark';clips.push(barkClip);
  const mixer=new T.AnimationMixer(model),actions=new Map(clips.map(c=>[c.name,mixer.clipAction(c).play()]));
  for(const a of actions.values())a.weight=0;actions.get('Idle').weight=1;mixer.update(0);
  // Native FBX-converted clips animate their unit scale; normalize an unanimated wrapper.
  root.updateMatrixWorld(true);const bounds=new T.Box3().setFromObject(model,true),size=bounds.getSize(new T.Vector3());
  display.scale.setScalar(.63/size.y);root.updateMatrixWorld(true);display.position.y-=new T.Box3().setFromObject(model,true).min.y;root.updateMatrixWorld(true);
  const canonical=name=>name.replace(/[^a-z0-9]/gi,'');const nodes=new Map();model.traverse(n=>nodes.set(canonical(n.name),n));
  const feetNames=['FFL','FFR','FFBL','FFBR'];
  const feet=feetNames.map(name=>nodes.get(canonical(name))).filter(Boolean),vector=new T.Vector3();
  const footHeight=()=>Math.min(...feet.map(n=>n.getWorldPosition(vector).y));
  const restFoot=feet.length?footHeight():0;
  // Estimate cycle travel from native planted-paw motion instead of a generic stride.
  const samples=[],duration=actions.get('Walk').getClip().duration;
  actions.get('Idle').weight=0;actions.get('Walk').weight=1;
  for(let i=0;i<=60;i++){
    actions.get('Walk').time=i/60*duration;mixer.update(0);root.updateMatrixWorld(true);
    samples.push(feet.map(n=>n.getWorldPosition(new T.Vector3())));
  }
  const strides=[];
  for(let foot=0;foot<feet.length;foot++){
    const floor=Math.min(...samples.map(s=>s[foot].y));
    for(let i=1;i<60;i++)if(samples[i][foot].y<floor+.018){
      const stride=-(samples[i+1][foot].z-samples[i-1][foot].z)*30;
      if(stride>.25&&stride<1.2)strides.push(stride);
    }
  }
  strides.sort((a,b)=>a-b);
  const nativeStrideEstimate=Math.max(.4,Math.min(.95,strides.length?strides[Math.floor(strides.length/2)]:.62));
  const strideLength=gait?.strideLength??nativeStrideEstimate;
  actions.get('Walk').weight=0;actions.get('Walk').time=0;actions.get('Idle').weight=1;mixer.update(0);
  return{root,model,mixer,actions,strideLength,nativeStrideEstimate,
    update(source,time){
      root.visible=source.enabled!==false;if(!root.visible)return;
      root.position.fromArray(source.groundPosition);root.rotation.y=source.heading;
      const barkWeight=type==='dog'?Math.max(0,...source.activity.map(([a,b])=>ease(a-.13,a+.05,time)*(1-ease(b-.05,b+.14,time)))):0;
      const bark=type==='dog'?source.activity.find(([a,b])=>time>=a-.13&&time<b+.14):null;
      const walkWeight=source.walkWeight*(1-barkWeight);
      for(const[name,action]of actions){
        action.weight=name==='Bark'?barkWeight:name==='Walk'?walkWeight:1-walkWeight-barkWeight;
        const duration=action.getClip().duration;
        action.time=name==='Walk'?(source.travelDistance/strideLength*duration)%duration:time%duration;
      }
      mixer.update(0);
      if(bark){const phase=Math.max(0,Math.min(1,(time-bark[0])/(bark[1]-bark[0])));model.getObjectByName('Head')?.rotateX(-.07*Math.sin(phase*Math.PI)*barkWeight);}
      root.updateMatrixWorld(true);
      if(feet.length){root.position.y+=restFoot+source.groundPosition[1]-footHeight();root.updateMatrixWorld(true);}
      model.traverse(n=>{if(n.isSkinnedMesh)n.skeleton.update();});
    },
    dispose(){mixer.stopAllAction();},
  };
}

export function createPerchedBird(){
  const root=new T.Group();root.name='Authored_Perched_Blackbird';
  const plumage=new T.MeshStandardMaterial({color:0x262421,roughness:.91}),wingMat=new T.MeshStandardMaterial({color:0x34302a,roughness:.94});
  const bill=new T.MeshStandardMaterial({color:0xd3a33d,roughness:.72}),eyeMat=new T.MeshPhysicalMaterial({color:0x080908,roughness:.12,clearcoat:.7});
  function oval(parent,scale,position,material){const mesh=new T.Mesh(new T.SphereGeometry(1,24,16),material);mesh.scale.set(...scale);mesh.position.set(...position);parent.add(mesh);return mesh;}
  oval(root,[.047,.057,.082],[0,.103,-.015],plumage);
  const head=new T.Group();head.position.set(0,.171,.045);root.add(head);oval(head,[.032,.033,.038],[0,0,0],plumage);
  for(const x of[-.027,.027])oval(head,[.005,.006,.005],[x,.007,.018],eyeMat);
  const upper=new T.Mesh(new T.ConeGeometry(.008,.045,10),bill);upper.rotation.x=Math.PI/2;upper.position.set(0,-.004,.051);head.add(upper);
  const lower=new T.Group();lower.position.set(0,-.009,.03);head.add(lower);
  const lowerBill=new T.Mesh(new T.ConeGeometry(.005,.04,8),bill);lowerBill.rotation.x=Math.PI/2;lowerBill.position.z=.022;lower.add(lowerBill);
  for(const side of[-1,1]){
    oval(root,[.012,.041,.066],[side*.042,.113,-.028],wingMat);
    for(let i=0;i<6;i++){const feather=oval(root,[.008,.003,.045],[side*(.032+i*.003),.096-i*.003,-.073-i*.003],wingMat);feather.rotation.y=side*.10;}
    const leg=new T.Mesh(new T.CylinderGeometry(.002,.0025,.04,8),wingMat);leg.position.set(side*.018,.033,-.005);root.add(leg);
    for(const angle of[-.3,.3,2.7]){const toe=new T.Mesh(new T.CylinderGeometry(.001,.0012,.025,6),wingMat);toe.rotation.x=Math.PI/2;toe.rotation.z=angle;toe.position.set(side*.018+Math.sin(angle)*.009,.013,Math.cos(angle)*.009-.005);root.add(toe);}
  }
  for(let i=0;i<5;i++){const tail=oval(root,[.009,.003,.061],[(i-2)*.006,.087,-.115],wingMat);tail.rotation.x=-.10;}
  root.traverse(n=>{if(n.isMesh){n.castShadow=true;n.receiveShadow=true;}});
  return{root,update(source,time){root.visible=source.enabled!==false;root.position.fromArray(source.groundPosition);root.rotation.y=source.heading;head.rotation.y=.10*Math.sin(time*1.7);lower.rotation.x=source.active?.18*(.35+.65*Math.abs(Math.sin(time*13))):0;},dispose(){}};
}

export function createVacuum(){
  const root=new T.Group();root.name='Authored_Robot_Vacuum';
  const ivory=new T.MeshPhysicalMaterial({color:0xe8e9e7,roughness:.3,clearcoat:.4,clearcoatRoughness:.3});
  const black=new T.MeshStandardMaterial({color:0x202325,roughness:.65}),rubber=new T.MeshStandardMaterial({color:0x111315,roughness:.95});
  function cylinder(radius,height,y,material){const mesh=new T.Mesh(new T.CylinderGeometry(radius,radius,height,64),material);mesh.position.y=y;root.add(mesh);return mesh;}
  cylinder(.177,.055,.06,black);cylinder(.174,.025,.098,ivory);cylinder(.158,.008,.114,ivory);
  const rim=new T.Mesh(new T.TorusGeometry(.174,.007,8,80),black);rim.rotation.x=Math.PI/2;rim.position.y=.085;root.add(rim);
  const lidar=cylinder(.047,.035,.136,black);lidar.position.z=-.04;
  const lidarCap=cylinder(.05,.008,.157,ivory);lidarCap.position.z=-.04;
  const sensor=new T.Mesh(new T.BoxGeometry(.115,.025,.014),new T.MeshPhysicalMaterial({color:0x111a20,roughness:.12,clearcoat:1}));sensor.position.set(0,.071,.173);root.add(sensor);
  const lamp=new T.Mesh(new T.CircleGeometry(.012,24),new T.MeshBasicMaterial({color:0x5bb8e1}));lamp.rotation.x=-Math.PI/2;lamp.position.set(0,.12,.067);root.add(lamp);
  const wheels=[];
  for(const x of[-.15,.15]){const wheel=new T.Mesh(new T.CylinderGeometry(.037,.037,.025,24),rubber);wheel.rotation.z=Math.PI/2;wheel.position.set(x,.038,0);root.add(wheel);wheels.push(wheel);}
  const brushes=[];
  for(const x of[-.13,.13]){const brush=new T.Group();brush.position.set(x,.019,.11);for(let i=0;i<3;i++){const bristle=new T.Mesh(new T.BoxGeometry(.009,.007,.075),rubber);bristle.rotation.y=i*Math.PI*2/3;bristle.position.set(Math.sin(bristle.rotation.y)*.03,0,Math.cos(bristle.rotation.y)*.03);brush.add(bristle);}root.add(brush);brushes.push(brush);}
  root.traverse(n=>{if(n.isMesh){n.castShadow=true;n.receiveShadow=true;}});
  return{root,brushes,wheels,update(source,time){root.visible=source.enabled!==false;root.position.fromArray(source.groundPosition);root.rotation.y=source.heading;brushes.forEach((b,i)=>b.rotation.y=Math.min(Math.max(time-2,0),26)*(i?1:-1)*18);wheels.forEach(w=>w.rotation.x=-source.travelDistance/.037);lamp.material.color.set(source.active?0x5bb8e1:0x34383a);},dispose(){}};
}

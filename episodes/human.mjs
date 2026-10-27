import * as T from '../vendor/three.module.js';
import {clone} from '../vendor/utils/SkeletonUtils.js';
import {CCDIKSolver} from '../vendor/utils/CCDIKSolver.js';

export function createHuman(character,walkSource,idleSource){
  const model=clone(character),root=new T.Group();let skin;
  model.traverse(n=>{if(n.isSkinnedMesh&&!skin)skin=n;if(n.isMesh){n.castShadow=true;n.receiveShadow=true;n.material=(Array.isArray(n.material)?n.material:[n.material]).map(m=>{const opacity=/opacity/i.test(m.name);return new T.MeshStandardMaterial({name:m.name,map:m.map,normalMap:m.normalMap,roughness:opacity?.8:.92,side:opacity?T.DoubleSide:T.FrontSide,alphaTest:opacity?.4:0});});}});
  // Native Rocketbox clips share this rig. Retain joint lengths and remove root travel.
  function inPlace(source,name){const clip=source.clone();clip.name=name;clip.tracks=clip.tracks.filter(t=>{
    const [node,property]=t.name.split('.');return !!model.getObjectByName(node)&&(property==='quaternion'||t.name==='Bip01.position');
  });for(const track of clip.tracks)if(track.name==='Bip01.position')for(let i=0;i<track.values.length;i+=3){track.values[i]=0;track.values[i+2]=0;}return clip;}
  const walkClip=inPlace(walkSource,'Walk'),idleClip=inPlace(idleSource,'Idle'),mixer=new T.AnimationMixer(model),walk=mixer.clipAction(walkClip).play(),idle=mixer.clipAction(idleClip).play();
  walk.weight=0;idle.weight=1;mixer.update(0);model.scale.setScalar(.01);root.add(model);root.updateMatrixWorld(true);skin.skeleton.update();
  const bounds=new T.Box3().setFromObject(model,true);model.position.y=-bounds.min.y;root.updateMatrixWorld(true);
  const bone=name=>model.getObjectByName(name),feet=[bone('Bip01_L_Toe0'),bone('Bip01_R_Toe0')],toeHeight=Math.min(...feet.map(b=>b.getWorldPosition(new T.Vector3()).y));
  const target=new T.Bone();target.name='DoorHandleTarget';root.add(target);
  // Keep IK targets out of the render skeleton and its shared inverse-bind array.
  const targetIndex=skin.skeleton.bones.length,ikMesh=new T.SkinnedMesh();ikMesh.skeleton=new T.Skeleton([...skin.skeleton.bones,target]);
  const index=name=>skin.skeleton.bones.indexOf(bone(name)),ik=new CCDIKSolver(ikMesh,[{target:targetIndex,effector:index('Bip01_R_Hand'),links:[{index:index('Bip01_R_Forearm')},{index:index('Bip01_R_UpperArm')}],iteration:48,maxAngle:.2}]);
  return {root,model,mixer,skin,walkClip,idleClip,hand:bone('Bip01_R_Hand'),
    update(state,handle){
      const actor=state.sources[1];root.position.fromArray(actor.groundPosition);root.rotation.y=actor.heading;
      walk.weight=actor.walkWeight;idle.weight=1-actor.walkWeight;
      // Explicit action times make backward scrubbing deterministic.
      const phase=actor.travelDistance/1.1*walkClip.duration*(actor.reverseWalk?-1:1);walk.time=((phase%walkClip.duration)+walkClip.duration)%walkClip.duration;idle.time=state.time%idleClip.duration;mixer.update(0);root.updateMatrixWorld(true);
      const floor=Math.min(...feet.map(b=>b.getWorldPosition(new T.Vector3()).y));root.position.y+=toeHeight-floor+actor.groundPosition[1];root.updateMatrixWorld(true);
      if(handle&&state.door?.contact>0){target.position.copy(root.worldToLocal(handle.clone()));root.updateMatrixWorld(true);ik.update(state.door.contact);root.updateMatrixWorld(true);}
      skin.skeleton.update();
    }
  };
}

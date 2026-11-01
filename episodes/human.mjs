import * as T from '../vendor/three.module.js';
import {clone} from '../vendor/utils/SkeletonUtils.js';
import {CCDIKSolver} from '../vendor/utils/CCDIKSolver.js';

export function createHuman(character,walkSource,idleSource){
  const model=clone(character),root=new T.Group();let skin;
  model.traverse(n=>{if(n.isSkinnedMesh&&!skin)skin=n;if(n.isMesh){n.castShadow=true;n.receiveShadow=true;n.material=(Array.isArray(n.material)?n.material:[n.material]).map(m=>{const opacity=/opacity/i.test(m.name),head=/head/i.test(m.name);return new T.MeshStandardMaterial({name:m.name,map:m.map,normalMap:m.normalMap,normalScale:new T.Vector2(.65,.65),roughness:opacity?.85:head?.55:.76,side:opacity?T.DoubleSide:T.FrontSide,alphaTest:opacity?.4:0});});}});
  // Native Rocketbox clips share this rig. Retain joint lengths and remove root travel.
  function inPlace(source,name){const clip=source.clone();clip.name=name;clip.tracks=clip.tracks.filter(t=>{
    const [node,property]=t.name.split('.');return !!model.getObjectByName(node)&&(property==='quaternion'||t.name==='Bip01.position');
  });for(const track of clip.tracks)if(track.name==='Bip01.position')for(let i=0;i<track.values.length;i+=3){track.values[i]=0;track.values[i+2]=0;}return clip;}
  const walkClip=inPlace(walkSource,'Walk'),idleClip=inPlace(idleSource,'Idle'),mixer=new T.AnimationMixer(model),walk=mixer.clipAction(walkClip).play(),idle=mixer.clipAction(idleClip).play();
  walk.weight=0;idle.weight=1;mixer.update(0);model.scale.setScalar(.01);root.add(model);root.updateMatrixWorld(true);skin.skeleton.update();
  const bounds=new T.Box3().setFromObject(model,true);model.position.y=-bounds.min.y;root.updateMatrixWorld(true);
  const bone=name=>model.getObjectByName(name),feet=[bone('Bip01_L_Toe0'),bone('Bip01_R_Toe0')],toeHeight=Math.min(...feet.map(b=>b.getWorldPosition(new T.Vector3()).y));
  const target=new T.Bone();target.name='DoorHandleTarget';root.add(target);
  const phoneTarget=new T.Bone();phoneTarget.name='PhoneEarTarget';root.add(phoneTarget);
  // Keep IK targets out of the render skeleton and its shared inverse-bind array.
  const targetIndex=skin.skeleton.bones.length,ikMesh=new T.SkinnedMesh();ikMesh.skeleton=new T.Skeleton([...skin.skeleton.bones,target,phoneTarget]);
  const index=name=>skin.skeleton.bones.indexOf(bone(name)),ik=new CCDIKSolver(ikMesh,[{target:targetIndex,effector:index('Bip01_R_Hand'),links:[{index:index('Bip01_R_Forearm')},{index:index('Bip01_R_UpperArm')},{index:index('Bip01_R_Clavicle')}],iteration:64,maxAngle:.15}]);
  const leftHand=bone('Bip01_L_Hand'),leftElbow=bone('Bip01_L_Forearm'),leftArm=bone('Bip01_L_UpperArm'),head=bone('Bip01_Head');
  const phoneIK=new CCDIKSolver(ikMesh,[{target:targetIndex+1,effector:index('Bip01_L_Hand'),links:[{index:index('Bip01_L_Forearm')},{index:index('Bip01_L_UpperArm')}],iteration:64,maxAngle:.15}]);
  // Native hand X follows the fingers, Y faces the palm, and Z spans its width.
  const phone=new T.Group();phone.name='Authored_Smartphone';leftHand.add(phone);
  phone.rotation.set(Math.PI/2,0,.3);
  const caseMat=new T.MeshStandardMaterial({color:0x272a30,metalness:.45,roughness:.3});
  const glass=new T.MeshPhysicalMaterial({color:0x10151b,metalness:.2,roughness:.16,clearcoat:1});
  const shape=new T.Shape(),x=7.1,y=3.4,r=.65;
  shape.moveTo(-x+r,-y);shape.lineTo(x-r,-y);shape.quadraticCurveTo(x,-y,x,-y+r);shape.lineTo(x,y-r);shape.quadraticCurveTo(x,y,x-r,y);shape.lineTo(-x+r,y);shape.quadraticCurveTo(-x,y,-x,y-r);shape.lineTo(-x,-y+r);shape.quadraticCurveTo(-x,-y,-x+r,-y);
  const body=new T.Mesh(new T.ExtrudeGeometry(shape,{depth:.65,bevelEnabled:true,bevelThickness:.1,bevelSize:.12,bevelSegments:2,curveSegments:6}),caseMat);
  body.position.set(14.2,-1.3,-2);phone.add(body);
  const screen=new T.Mesh(new T.BoxGeometry(12.5,5.8,.06),glass);screen.position.set(14.2,-1.3,-2.15);phone.add(screen);
  const lens=new T.Mesh(new T.CylinderGeometry(.45,.45,.12,16),glass);lens.rotation.x=Math.PI/2;lens.position.set(19.3,.7,-1.19);phone.add(lens);
  phone.traverse(n=>{if(n.isMesh){n.castShadow=true;n.receiveShadow=true;}});
  const phoneEar=new T.Object3D();phoneEar.name='PhoneEarContact';phoneEar.position.set(7.5,-.6,9.3);head.add(phoneEar);
  const phoneSpeaker=new T.Object3D();phoneSpeaker.name='PhoneSpeakerContact';phoneSpeaker.position.set(20.2,-1.3,-2.19);phone.add(phoneSpeaker);
  const phoneTilt=new T.Quaternion().setFromEuler(new T.Euler(0,.2,-.38));
  const palm=phoneTilt.clone().multiply(phone.quaternion.clone().invert());
  const uprightHead=new T.Quaternion().setFromRotationMatrix(new T.Matrix4().makeBasis(new T.Vector3(0,1,0),new T.Vector3(0,0,1),new T.Vector3(1,0,0)));
  const upperX=new T.Vector3(.16,-.58,.8).normalize(),upperY=new T.Vector3(1,0,0).cross(upperX).normalize(),upperZ=upperX.clone().cross(upperY);
  const upperPose=new T.Quaternion().setFromRotationMatrix(new T.Matrix4().makeBasis(upperX,upperY,upperZ));
  const desired=new T.Quaternion(),parentQ=new T.Quaternion(),worldQ=new T.Quaternion();
  const callQ=new T.Quaternion(),upperBase=new T.Quaternion(),elbowBase=new T.Quaternion(),handBase=new T.Quaternion();
  const phoneOffset=new T.Vector3(),phoneWrist=new T.Vector3(),armAxis=new T.Vector3(),currentNormal=new T.Vector3(),palmNormal=new T.Vector3(),cross=new T.Vector3();
  const shoulder=new T.Vector3(),elbowDirection=new T.Vector3(),poleDirection=new T.Vector3(),poleQ=new T.Quaternion();
  const grip=[];
  model.traverse(n=>{
    const match=n.isBone&&n.name.match(/^Bip01_L_Finger([0-4])([12]?)$/);if(!match)return;
    const finger=Number(match[1]),joint=Number(match[2]||0),q=n.quaternion.clone();
    if(finger===0)q.multiply(new T.Quaternion().setFromAxisAngle(new T.Vector3(0,0,1),joint?.12:.08));
    else if(joint)q.setFromEuler(new T.Euler(0,0,joint===1?.6:.85));
    else q.setFromEuler(new T.Euler(0,0,.04));
    grip.push({bone:n,quaternion:q});
  });
  // Constrain a point inside the curled hand, keeping the wrist in front of the lever.
  const hand=bone('Bip01_R_Hand'),doorGrip=new T.Object3D();doorGrip.name='DoorPalmGrip';doorGrip.position.set(10.5,1.4,-1.1);hand.add(doorGrip);
  const tilt=Math.PI/6,gripPose=new T.Quaternion().setFromRotationMatrix(new T.Matrix4().makeBasis(new T.Vector3(0,-Math.cos(tilt),-Math.sin(tilt)),new T.Vector3(0,Math.sin(tilt),-Math.cos(tilt)),new T.Vector3(1,0,0)));
  const gripQ=new T.Quaternion(),handScale=new T.Vector3(),wristOffset=new T.Vector3(),wristTarget=new T.Vector3();
  const doorFingers=[];
  model.traverse(n=>{
    const match=n.isBone&&n.name.match(/^Bip01_R_Finger([0-4])([12]?)$/);if(!match)return;
    const finger=Number(match[1]),joint=Number(match[2]||0),q=n.quaternion.clone();
    if(finger===0)q.multiply(new T.Quaternion().setFromAxisAngle(new T.Vector3(0,0,1),joint?.35:.18));
    else q.setFromEuler(new T.Euler(0,0,joint===0?.2:joint===1?1.45:1.4));
    doorFingers.push({bone:n,quaternion:q});
  });
  return {root,model,mixer,skin,walkClip,idleClip,phone,leftHand,phoneTarget,phoneEar,phoneSpeaker,hand,doorGrip,
    update(state,handle,doorFrame){
      const actor=state.sources[1];root.position.fromArray(actor.groundPosition);root.rotation.y=actor.heading;
      walk.weight=actor.walkWeight;idle.weight=1-actor.walkWeight;
      // Explicit action times make backward scrubbing deterministic.
      const phase=actor.travelDistance/1.1*walkClip.duration*(actor.reverseWalk?-1:1);walk.time=((phase%walkClip.duration)+walkClip.duration)%walkClip.duration;idle.time=state.time%idleClip.duration;mixer.update(0);root.updateMatrixWorld(true);
      const floor=Math.min(...feet.map(b=>b.getWorldPosition(new T.Vector3()).y));root.position.y+=toeHeight-floor+actor.groundPosition[1];root.updateMatrixWorld(true);
      if(handle&&doorFrame&&state.door?.contact>0){
        const contact=state.door.contact;
        gripQ.copy(doorFrame).multiply(gripPose);hand.getWorldScale(handScale);
        wristOffset.copy(doorGrip.position).multiply(handScale).applyQuaternion(gripQ);
        wristTarget.copy(handle).sub(wristOffset);target.position.copy(root.worldToLocal(wristTarget));
        root.updateMatrixWorld(true);ik.update(contact);root.updateMatrixWorld(true);
        hand.parent.getWorldQuaternion(parentQ);desired.copy(parentQ).invert().multiply(gripQ);
        hand.quaternion.slerp(desired,Math.min(1,contact*2));
        const curl=Math.max(0,Math.min(1,(contact-.7)/.3));
        for(const finger of doorFingers)finger.bone.quaternion.slerp(finger.quaternion,curl*curl*(3-2*curl));
        root.updateMatrixWorld(true);
      }
      const call=actor.phoneWeight||0;
      if(call>0){
        upperBase.copy(leftArm.quaternion);elbowBase.copy(leftElbow.quaternion);handBase.copy(leftHand.quaternion);
        // Keep a stable handset angle while retaining small head-following motion.
        root.getWorldQuaternion(callQ).multiply(uprightHead);head.getWorldQuaternion(worldQ);
        callQ.slerp(worldQ,.35).multiply(palm);
        phoneOffset.copy(phoneSpeaker.position).applyQuaternion(phone.quaternion);
        leftHand.getWorldScale(handScale);phoneOffset.multiply(handScale).applyQuaternion(callQ);
        phoneEar.getWorldPosition(phoneWrist).sub(phoneOffset);phoneTarget.position.copy(root.worldToLocal(phoneWrist));
        // Seed a relaxed, forward elbow instead of solving from the walking swing.
        root.getWorldQuaternion(worldQ).multiply(upperPose);leftArm.parent.getWorldQuaternion(parentQ);
        leftArm.quaternion.copy(parentQ).invert().multiply(worldQ);
        leftElbow.quaternion.setFromAxisAngle(new T.Vector3(0,0,1),-2.3);
        root.updateMatrixWorld(true);phoneIK.update();root.updateMatrixWorld(true);
        // Correct the bend plane without moving the solved wrist target.
        leftArm.getWorldPosition(shoulder);leftHand.getWorldPosition(armAxis).sub(shoulder).normalize();
        leftElbow.getWorldPosition(elbowDirection).sub(shoulder);
        elbowDirection.addScaledVector(armAxis,-elbowDirection.dot(armAxis)).normalize();
        root.getWorldQuaternion(worldQ);poleDirection.set(.2,-1,.45).applyQuaternion(worldQ);
        poleDirection.addScaledVector(armAxis,-poleDirection.dot(armAxis)).normalize();
        const swivel=Math.atan2(armAxis.dot(cross.crossVectors(elbowDirection,poleDirection)),elbowDirection.dot(poleDirection));
        poleQ.setFromAxisAngle(armAxis,swivel);leftArm.getWorldQuaternion(worldQ).premultiply(poleQ);
        leftArm.parent.getWorldQuaternion(parentQ);leftArm.quaternion.copy(parentQ).invert().multiply(worldQ);
        root.updateMatrixWorld(true);
        // Put palm rotation into forearm pronation instead of a sharp wrist twist.
        leftElbow.getWorldQuaternion(worldQ);armAxis.set(1,0,0).applyQuaternion(worldQ);
        currentNormal.set(0,0,1).applyQuaternion(worldQ);palmNormal.set(0,0,1).applyQuaternion(callQ);
        palmNormal.addScaledVector(armAxis,-palmNormal.dot(armAxis)).normalize();
        const twist=Math.max(-1.4,Math.min(1.4,Math.atan2(armAxis.dot(cross.crossVectors(currentNormal,palmNormal)),currentNormal.dot(palmNormal))));
        leftElbow.rotateX(twist);root.updateMatrixWorld(true);
        leftHand.parent.getWorldQuaternion(parentQ);leftHand.quaternion.copy(parentQ).invert().multiply(callQ);
        leftArm.quaternion.slerp(upperBase,1-call);
        leftElbow.quaternion.slerp(elbowBase,1-call);
        leftHand.quaternion.slerp(handBase,1-call);
        for(const finger of grip)finger.bone.quaternion.slerp(finger.quaternion,call);
        root.updateMatrixWorld(true);
      }
      phone.userData.callWeight=call;
      skin.skeleton.update();
    }
  };
}

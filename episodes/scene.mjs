import * as T from '../vendor/three.module.js';
import {GLTFLoader} from '../vendor/loaders/GLTFLoader.js';
import {ColladaLoader} from '../vendor/loaders/ColladaLoader.js';
import {COLORS} from './state.mjs';
import {createHuman} from './human.mjs';
import {FBXLoader} from '../vendor/loaders/FBXLoader.js';
import {TGALoader} from '../vendor/loaders/TGALoader.js';
import {createRenderLook} from './rendering.mjs';
import {RENDER_QUALITY, renderRatio, captureDimensions} from './render-quality.mjs';
import {createAnimal,createVacuum,createPerchedBird} from './living.mjs';
import {CAMERA_COLOR,sourceStyle,cameraWaypoints} from './presentation.mjs';

const flat=(color)=>new T.MeshStandardMaterial({color,roughness:.8});
function box(parent,size,position,material){const m=new T.Mesh(new T.BoxGeometry(...size),material);m.position.set(...position);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
function cylinder(parent,radius,length,position,material){const m=new T.Mesh(new T.CylinderGeometry(radius,radius,length,24),material);m.position.set(...position);parent.add(m);return m;}
function terrainHeight(x,z){const margin=Math.max(Math.abs(x)-12,Math.abs(z)-10,0),blend=Math.min(1,margin/25)*Math.min(1,Math.abs(x-5.8)/10);return blend*(1.6+1.2*Math.sin(x*.055+z*.063)+.7*Math.cos(z*.09-x*.045));}
function label(text,color){
  const c=document.createElement('canvas'),ctx=c.getContext('2d');ctx.font='bold 34px Arial';c.width=Math.max(120,Math.ceil(ctx.measureText(text).width)+26);c.height=64;
  ctx.fillStyle='#ffffffee';ctx.beginPath();ctx.roundRect(1,1,c.width-2,62,9);ctx.fill();ctx.strokeStyle=color;ctx.lineWidth=3;ctx.stroke();
  ctx.fillStyle=color;ctx.font='bold 34px Arial';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,c.width/2,34);
  const texture=new T.CanvasTexture(c);texture.colorSpace=T.SRGBColorSpace;
  const sprite=new T.Sprite(new T.SpriteMaterial({map:texture,depthTest:false,depthWrite:false,toneMapped:false}));sprite.scale.set(c.width/100,.64,1);sprite.renderOrder=50;sprite.userData.label=text;sprite.userData.labelWidth=c.width/100;return sprite;
}
async function cameraSymbol(){
  const canvas=document.createElement('canvas');canvas.width=192;canvas.height=192;
  const context=canvas.getContext('2d');context.fillStyle='#fffffff5';context.strokeStyle=CAMERA_COLOR;context.lineWidth=6;
  context.beginPath();context.arc(96,96,82,0,Math.PI*2);context.fill();context.stroke();
  const svg=window.lucide.createElement(window.lucide.icons.Camera,{stroke:CAMERA_COLOR,'stroke-width':1.8,width:112,height:112});
  const img=new Image();const ready=new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=reject;});
  img.src='data:image/svg+xml;base64,'+btoa(new XMLSerializer().serializeToString(svg));await ready;context.drawImage(img,40,40,112,112);
  const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;
  const sprite=new T.Sprite(new T.SpriteMaterial({map:texture,depthTest:false,depthWrite:false,toneMapped:false}));
  sprite.scale.set(.85,.85,1);sprite.renderOrder=65;return sprite;
}
function makeRoute(parent,path,color,prefix){
  const unique=path.filter((v,i)=>!i||v.position.some((x,k)=>x!==path[i-1].position[k]));
  for(let i=0;i<unique.length-1;i++){
    const a=new T.Vector3(unique[i].position[0],3.9,unique[i].position[2]),b=new T.Vector3(unique[i+1].position[0],3.9,unique[i+1].position[2]);
    const d=b.clone().sub(a),line=new T.Mesh(new T.CylinderGeometry(.038,.038,d.length(),8),new T.MeshBasicMaterial({color,depthTest:false}));
    line.position.copy(a).add(b).multiplyScalar(.5);line.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d.normalize());line.renderOrder=25;parent.add(line);
  }
  if(prefix!=='C')return;
  cameraWaypoints(path).forEach(p=>{
    const sphere=new T.Mesh(new T.SphereGeometry(.1,12,8),new T.MeshBasicMaterial({color,depthTest:false}));sphere.position.set(p.position[0],4,p.position[2]);sphere.renderOrder=30;parent.add(sphere);
    const text=label(p.label,'#'+new T.Color(color).getHexString());text.position.set(p.position[0]+.22,4.3,p.position[2]-.48);text.userData.preferred=text.position.clone();text.userData.anchor=new T.Vector3(p.position[0],4,p.position[2]);parent.add(text);
    sphere.userData.cameraWaypoint=true;text.userData.cameraWaypoint=true;
  });
}

export class EpisodeScene{
  constructor(egoCanvas,mapCanvas,onProgress=()=>{}){
    this.onProgress=onProgress;this.renderers=[egoCanvas,mapCanvas].map(canvas=>{const r=new T.WebGLRenderer({canvas,antialias:true,preserveDrawingBuffer:true});r.setPixelRatio(Math.min(devicePixelRatio,1.5));r.outputColorSpace=T.SRGBColorSpace;r.toneMapping=T.ACESFilmicToneMapping;r.toneMappingExposure=1.12;r.shadowMap.enabled=true;r.shadowMap.type=T.PCFSoftShadowMap;return r;});
    this.camera=new T.PerspectiveCamera(68,1,.05,180);this.overhead=new T.OrthographicCamera(-13,13,10,-10,.1,180);this.overhead.up.set(0,0,-1);
    this.quality=innerWidth<700?'balanced':'high';
    this.showCameraWaypoints=false;
    this.ray=new T.Raycaster();this.assets=new Map();this.envs=new Map();this.ready=false;
  }
  async loadAsset(url,loader=new GLTFLoader()){
    if(!this.assets.has(url))this.assets.set(url,loader.loadAsync(url));return this.assets.get(url);
  }
  async load(episode){
    this.ready=false;this.lastState=null;this.episode=episode;this.scene=new T.Scene();this.scene.background=new T.Color(episode.id==='indoor'?0xe7e7e5:0xc9dce4);
    this.onProgress('Preparing lighting and materials');this.look=await createRenderLook(this.scene,this.renderers,this.camera,episode.id==='indoor');this.look.quality(this.quality);
    this.world=new T.Group();this.scene.add(this.world);this.ceilings=[];this.occluders=[];this.door=null;this.musicRotor=null;this.water=null;this.fanRotor=null;this.fan=null;this.parkBenches=[];
    if(episode.id==='indoor')await this.buildHouse();else await this.buildOutdoor();
    await this.buildActor();await this.buildLivingSources();
    this.routes=new T.Group();this.scene.add(this.routes);makeRoute(this.routes,episode.camera,COLORS.camera,'C');makeRoute(this.routes,episode.sources[1].path,COLORS.actor,'P');
    this.extraRoutes=new Map();
    for(const source of episode.sources.filter(s=>s.showRoute)){const group=new T.Group();makeRoute(group,source.path,source.color,source.id[0]);this.routes.add(group);this.extraRoutes.set(source.id,group);}
    this.cameraWaypointNodes=this.routes.children.filter(n=>n.userData.cameraWaypoint);this.cameraWaypointNodes.forEach(n=>n.visible=this.showCameraWaypoints);
    this.markers=episode.sources.map(s=>{const style=sourceStyle(s,episode.id),sprite=label(style.mapName,style.color);this.routes.add(sprite);return sprite;});
    this.cameraMarker=new T.Group();this.cameraMarker.name='CameraPoseIcon';this.cameraMarker.add(await cameraSymbol());this.routes.add(this.cameraMarker);
    const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(new Float32Array(9),3));
    this.cameraFrustum=new T.Mesh(geometry,new T.MeshBasicMaterial({color:COLORS.camera,transparent:true,opacity:.22,side:T.DoubleSide,depthTest:false,depthWrite:false}));
    this.cameraFrustum.name='CameraViewingDirection';this.cameraFrustum.renderOrder=28;this.routes.add(this.cameraFrustum);
    this.cameraTag=label('Camera',CAMERA_COLOR);this.routes.add(this.cameraTag);
    const points=new Float32Array(this.routes.children.filter(n=>n.isSprite).length*6);this.callouts=new T.LineSegments(new T.BufferGeometry().setAttribute('position',new T.BufferAttribute(points,3)),new T.LineBasicMaterial({color:0x7b7b76,transparent:true,opacity:.6,depthTest:false,toneMapped:false}));this.callouts.renderOrder=23;this.routes.add(this.callouts);
    const {minX,maxX,minZ,maxZ}=episode.bounds;this.center=new T.Vector3((minX+maxX)/2,0,(minZ+maxZ)/2);this.overhead.position.set(this.center.x,65,this.center.z);this.overhead.lookAt(this.center);
    this.ready=true;this.resize();this.onProgress('Scene ready');
  }
  async buildHouse(){
    const response=await fetch('assets/house/layout.json');if(!response.ok)throw new Error('Missing house layout');const layout=await response.json();this.layout=layout;
    const loader=new ColladaLoader();const basis=new T.Matrix4().makeRotationX(-Math.PI/2),inverse=basis.clone().invert();let done=0;
    const unique=[...new Set(layout.objects.map(x=>x.mesh))];
    const loaded=new Map();
    // Limit concurrent Collada parsing to keep the first load responsive.
    for(let i=0;i<unique.length;i+=6){
      await Promise.all(unique.slice(i,i+6).map(async path=>{const data=await this.loadAsset(path,loader);loaded.set(path,data);this.onProgress(`House assets ${++done}/${unique.length}`);}));
    }
    for(const item of layout.objects){
      const group=new T.Group();group.name=item.id;
      const [x,y,z,rx,ry,rz]=item.pose;
      const q=new T.Quaternion().setFromEuler(new T.Euler(rx,ry,rz,'ZYX'));
      const m=new T.Matrix4().compose(new T.Vector3(x,y,z),q,new T.Vector3(1,1,1));m.premultiply(basis).multiply(inverse);group.applyMatrix4(m);
      const object=loaded.get(item.mesh).scene.clone(true);group.add(object);this.world.add(group);
      object.traverse(n=>{if(n.isMesh){n.receiveShadow=true;n.castShadow=!/Floor|Ceiling/.test(item.id);if(n.material)n.material=Array.isArray(n.material)?n.material.map(m=>this.look.upgrade(m,item.id)):this.look.upgrade(n.material,item.id);}});
      if(item.ceiling)this.ceilings.push(group);
      if(/FoldingDoor/.test(item.id))group.visible=false;
      if(/HouseWall|RoomWall/.test(item.id))group.traverse(n=>{if(n.isMesh)this.occluders.push(n);});
    }
    this.world.updateMatrixWorld(true);
    // The single-leaf replacement leaves part of the original wide doorway open.
    const shell=this.occluders.find(mesh=>mesh.name==='aws_HouseWallB_01_visual');
    const wallMaterial=Array.isArray(shell.material)?shell.material[0]:shell.material;
    const infill=box(this.world,[.2,2.24,3.735],[-2.6,1.12,1.8925],wallMaterial);
    infill.name='Bedroom_Doorway_Infill';this.occluders.push(infill);
    const music=new T.Group();music.position.set(1.51,.47,1.73);this.world.add(music);this.musicBox=music;
    const wood=flat(0x8c5d36),metal=new T.MeshStandardMaterial({color:0xd7b66c,metalness:.7,roughness:.3});
    box(music,[.42,.12,.29],[0,.01,0],wood);box(music,[.4,.035,.27],[0,.1,0],flat(0x1e343c));
    const rotor=cylinder(music,.065,.27,[0,.18,0],metal);rotor.rotation.z=Math.PI/2;this.musicRotor=rotor;
    for(let i=0;i<14;i++)box(rotor,[.007,.013,.012],[Math.cos(i*2.2)*.064,(i-6.5)*.017,Math.sin(i*2.2)*.064],metal);
    const key=box(music,[.018,.09,.05],[.235,.09,0],metal);this.musicKey=key;
    this.musicLight=new T.PointLight(0xffdb85,.28,1);this.musicLight.position.set(0,.3,0);music.add(this.musicLight);
    await this.buildDoor();this.buildFan();
  }
  buildFan(){
    const spec=this.episode.sources.find(s=>s.id==='F1'),fan=new T.Group();fan.name='Authored_Pedestal_Fan';fan.position.set(spec.path[0].position[0],0,spec.path[0].position[2]);fan.rotation.y=Math.PI;this.world.add(fan);
    const dark=flat(0x394443),body=flat(0xdce4e1),steel=new T.MeshStandardMaterial({color:0x9ba7a4,metalness:.7,roughness:.33});
    const base=cylinder(fan,.21,.055,[0,.035,0],dark);base.scale.z=.8;cylinder(fan,.027,.84,[0,.46,0],steel);cylinder(fan,.045,.24,[0,.84,0],body);
    const head=new T.Group();head.position.y=spec.height;fan.add(head);
    const motor=cylinder(head,.075,.15,[0,0,-.10],dark);motor.rotation.x=Math.PI/2;
    const rotor=new T.Group();head.add(rotor);this.fanRotor=rotor;
    const shape=new T.Shape();shape.moveTo(.025,0);shape.bezierCurveTo(.07,-.045,.23,-.105,.248,-.025);shape.bezierCurveTo(.27,.04,.12,.11,.04,.055);shape.closePath();
    const bladeGeometry=new T.ExtrudeGeometry(shape,{depth:.008,bevelEnabled:true,bevelThickness:.003,bevelSize:.003,bevelSegments:1,steps:1,curveSegments:12});
    for(let i=0;i<3;i++){const blade=new T.Mesh(bladeGeometry,body);blade.rotation.z=i*Math.PI*2/3;rotor.add(blade);}
    const cap=new T.Mesh(new T.SphereGeometry(.053,20,12),dark);cap.scale.z=.55;cap.position.z=.035;rotor.add(cap);
    for(const z of [-.035,.065])for(const radius of [.09,.15,.21,.285]){const rim=new T.Mesh(new T.TorusGeometry(radius,.003,5,64),steel);rim.position.z=z;head.add(rim);}
    for(let i=0;i<20;i++){const a=i*Math.PI/10,points=[new T.Vector3(Math.cos(a)*.055,Math.sin(a)*.055,.075),new T.Vector3(Math.cos(a)*.285,Math.sin(a)*.285,.025),new T.Vector3(Math.cos(a)*.285,Math.sin(a)*.285,-.035)];const wire=new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points),10,.0025,5,false),steel);head.add(wire);}
    const lamp=new T.Mesh(new T.SphereGeometry(.009,8,6),new T.MeshBasicMaterial({color:0x4baa8d}));lamp.position.set(0,.92,.05);fan.add(lamp);
    fan.traverse(n=>{if(n.isMesh){n.castShadow=true;n.receiveShadow=true;}});this.fan=fan;
  }
  async buildDoor(){
    const data=await (await fetch('assets/vlnverse/door_0000.json')).json(),spec=this.episode.door,frame=new T.Group(),hinge=new T.Group();
    frame.position.fromArray(spec.center);frame.rotation.y=spec.rotation;hinge.position.x=spec.hingeX*spec.widthScale;frame.add(hinge);
    const material=this.look.wood.clone();material.side=T.DoubleSide;const trim=flat(0xe6ded0),metal=new T.MeshStandardMaterial({color:0xb6bbc0,metalness:.8,roughness:.3});
    for(const part of data.meshes){
      const geometry=new T.BufferGeometry(),leaf=part.group==='leaf';
      geometry.setAttribute('position',new T.Float32BufferAttribute(part.positions.flatMap(([x,y,z])=>[(x-(leaf?spec.hingeX:0))*spec.widthScale,y,z]),3));geometry.setIndex(part.indices);geometry.computeVertexNormals();
      geometry.setAttribute('uv',new T.Float32BufferAttribute(part.positions.flatMap(([x,y])=>[x*.7,y*.7]),2));
      const m=new T.Mesh(geometry,/Clutter/.test(part.name)?metal:leaf?material:trim);m.name=`VLNVerse_${part.name}`;m.castShadow=true;m.receiveShadow=true;(leaf?hinge:frame).add(m);this.occluders.push(m);
    }
    this.world.add(frame);this.door={frame,hinge,spec};
  }
  setEnvironment(state){
    if(this.door){this.door.hinge.rotation.y=state.door.angle;this.door.frame.updateMatrixWorld(true);}
  }
  doorHandle(){
    if(!this.door)return null;const {hinge,spec}=this.door;return hinge.localToWorld(new T.Vector3(spec.handleLocal[0]*spec.widthScale,...spec.handleLocal.slice(1)));
  }
  async buildActor(){
    this.onProgress('Loading Rocketbox human and native motion');
    const manager=new T.LoadingManager();manager.addHandler(/\.tga$/i,new TGALoader(manager));manager.setURLModifier(url=>url.includes('.tga')?'assets/rocketbox/'+url.split(/[\\/]/).at(-1):url);
    const loader=new FBXLoader(manager),character=await this.loadAsset('assets/rocketbox/Female_Adult_01.fbx',loader),walk=await this.loadAsset('assets/rocketbox/walk.fbx',loader),idle=await this.loadAsset('assets/rocketbox/idle.fbx',loader);
    this.human=createHuman(character,walk.animations[0],idle.animations[0]);this.actorRoot=this.human.root;this.actorModel=this.human.model;this.mixer=this.human.mixer;this.walkClip=this.human.walkClip;this.world.add(this.actorRoot);
  }
  async buildLivingSources(){
    this.living=new Map();
    for(const source of this.episode.sources.filter(s=>s.role)){
      this.onProgress(`Preparing ${source.label.toLowerCase()}`);let asset;
      if(source.role==='vacuum')asset=createVacuum();
      else if(source.role==='dog'){
        const model=await this.loadAsset('assets/living/shepherd.glb');asset=createAnimal(model,model,'dog',source.gait);
      }else asset=createPerchedBird();
      this.world.add(asset.root);this.living.set(source.id,asset);
    }
  }
  async buildOutdoor(){
    const grass=await this.look.image('grass-diffuse.jpg',true);
    const normal=await this.look.image('grass-normal.jpg'),roughness=await this.look.image('grass-roughness.jpg');
    const ground=new T.MeshStandardMaterial({map:grass,normalMap:normal,normalScale:new T.Vector2(.55,.55),roughnessMap:roughness,color:0xb2cf93,roughness:1});
    for(const [width,centerX] of [[64.9,-27.55],[53.3,33.35]]){const geometry=new T.PlaneGeometry(width,120,48,80),positions=geometry.attributes.position,uv=geometry.attributes.uv;for(let i=0;i<positions.count;i++){const x=positions.getX(i)+centerX,z=-positions.getY(i);positions.setZ(i,terrainHeight(x,z));uv.setXY(i,x/2,z/2);}geometry.computeVertexNormals();const land=new T.Mesh(geometry,ground);land.rotation.x=-Math.PI/2;land.position.set(centerX,-.02,0);land.receiveShadow=true;this.world.add(land);}
    const pathColor=grass.clone();pathColor.repeat.set(7,1);pathColor.needsUpdate=true;
    const pathMat=new T.MeshStandardMaterial({map:pathColor,roughness:1,color:0xa3a286});box(this.world,[14.8,.025,1.55],[-2.7,.005,0],pathMat);
    // A separate walkable path branch connects the entrance and bridge.
    for(const [a,b] of [[[ -8,5],[-3,2]],[[-3,2],[.5,.4]],[[7.15,0],[8.4,-2.8]]]){
      const dx=b[0]-a[0],dz=b[1]-a[1],p=box(this.world,[Math.hypot(dx,dz),.028,1.5],[(a[0]+b[0])/2,.009,(a[1]+b[1])/2],pathMat);p.rotation.y=-Math.atan2(dz,dx);
    }
    this.water=await this.look.water();this.world.add(this.water);
    const bridgeMat=this.look.wood;for(let x=4.65;x<=7.12;x+=.18)box(this.world,[.165,.12,1.55],[x,.06,0],bridgeMat);
    for(const [x,sign] of [[4.525,1],[7.325,-1]]){const ramp=box(this.world,[.38,.04,1.55],[x,.06,0],bridgeMat);ramp.rotation.z=sign*Math.atan(.13/.35);}
    for(const z of [-.76,.76]){for(const x of [4.65,5.85,7.15])cylinder(this.world,.045,.85,[x,.5,z],bridgeMat);box(this.world,[2.6,.055,.06],[5.9,.91,z],bridgeMat);}
    this.onProgress('Outdoor props and trees');
    for(const [x,z,rotation] of [[.3,-5.6,0],[-6.2,1.1,Math.PI/2]]){
      const bench=this.buildParkBench();bench.position.set(x,0,z);bench.rotation.y=rotation;this.world.add(bench);this.parkBenches.push(bench);
    }
    const rocks=await this.loadAsset('assets/rock_moss_set_01/rock_moss_set_01.gltf');const rockMeshes=[];rocks.scene.traverse(n=>{if(n.isMesh)rockMeshes.push(n);});
    for(let i=0;i<26;i++){const model=rockMeshes[i%rockMeshes.length].clone();const side=i%2?-1:1;const z=-8.3+Math.floor(i/2)*1.34;this.placeGrounded(model,5.8+side*(1.1+(i%3)*.08),z,.48+(i%4)*.13,i*.83);this.world.add(model);}
    const tree=await this.loadAsset('assets/tree_small_02/tree_small_02_lod.gltf');
    const leavesAlpha=await this.look.image('leaves-alpha.png');tree.scene.traverse(n=>{if(n.isMesh)for(const m of Array.isArray(n.material)?n.material:[n.material])if(/leaves/.test(m.name)){m.alphaMap=leavesAlpha;m.alphaTest=.48;m.transparent=false;m.depthWrite=true;m.needsUpdate=true;}});
    const places=[[-10,-6],[-7,-6.5],[-3.5,-7],[2,-7],[-10,1],[-10,7],[-5,7],[0,7],[3.2,7],[10,6.5],[10,-6.5]];
    places.forEach(([x,z],i)=>{const model=tree.scene.clone(true);this.placeGrounded(model,x,z,4.2+(i%3)*.4,i*1.7,'height');this.world.add(model);});
    for(const [i,[x,z]] of [[-15,17],[-5,21],[8,20],[17,15],[-15,-18],[13,-19]].entries()){const model=tree.scene.clone(true);this.placeGrounded(model,x,z,5.5+(i%3),i*.9,'height');model.position.y+=terrainHeight(x,z);model.name='Background_Tree';this.world.add(model);}
    const tuft=await this.loadAsset('assets/rendering/grass/grass_medium_02.gltf'),grassAlpha=await this.look.image('grass/alpha.png');
    tuft.scene.traverse(n=>{if(n.isMesh)for(const m of Array.isArray(n.material)?n.material:[n.material]){m.alphaMap=grassAlpha;m.alphaTest=.45;m.transparent=false;m.depthWrite=true;m.needsUpdate=true;}});
    const grasses=new T.Group();grasses.name='PolyHaven_Bank_Grass';this.world.add(grasses);
    for(let i=0;i<64;i++){const z=-7.7+(i%16)*1.02,side=i<32?-1:1,x=5.8+side*(1.2+Math.floor((i%32)/16)*.8+.10*Math.sin(i*8.13));if(Math.abs(z)<1.3||Math.hypot(x-8.4,z+2.8)<.8)continue;const plant=tuft.scene.clone(true);this.placeGrounded(plant,x,z,.16+(i%5)*.035,i*1.83,'height');grasses.add(plant);}
    this.world.traverse(n=>{if(n.isMesh){n.receiveShadow=true;n.castShadow=true;}});
  }
  buildParkBench(){
    const bench=new T.Group();bench.name='ParkBench_OpenSlat';
    const frame=new T.MeshStandardMaterial({color:0x364340,metalness:.65,roughness:.55});
    const woods=[0x9f987e,0xaaa18a,0x99927c].map(flat);
    for(let i=0;i<5;i++)box(bench,[1.7,.035,.085],[0,.455,-.20+i*.10],woods[i%3]);
    const back=new T.Group();back.position.set(0,.50,-.265);back.rotation.x=-.12;bench.add(back);
    for(let i=0;i<4;i++)box(back,[1.7,.085,.03],[0,.07+i*.105,0],woods[(i+1)%3]);
    for(const x of [-.65,.65]){
      for(const z of [-.20,.20])box(bench,[.04,.43,.045],[x,.215,z],frame);
      box(bench,[.045,.04,.50],[x,.41,0],frame);
      box(bench,[.035,.50,.035],[x,.68,-.25],frame);
      box(bench,[.035,.20,.035],[x,.56,.18],frame);
      box(bench,[.055,.035,.47],[x,.665,-.025],frame);
    }
    return bench;
  }
  placeGrounded(model,x,z,size,rotation,mode='width'){
    model.updateMatrixWorld(true);let b=new T.Box3().setFromObject(model);const s=new T.Vector3();b.getSize(s);const k=size/(mode==='height'?s.y:Math.max(s.x,s.z));model.scale.multiplyScalar(k);model.rotation.y+=rotation;
    model.updateMatrixWorld(true);b=new T.Box3().setFromObject(model);const c=new T.Vector3();b.getCenter(c);model.position.add(new T.Vector3(x-c.x,-b.min.y,z-c.z));
  }
  resize(){
    for(const [index,renderer] of this.renderers.entries()){const {width,height}=renderer.domElement.parentElement.getBoundingClientRect();if(width&&height){renderer.setPixelRatio(index===0?renderRatio(this.quality,width,height,devicePixelRatio):Math.min(devicePixelRatio,1.5));renderer.setSize(width,height,false);}}
    const a=this.renderers[0].domElement;this.camera.aspect=a.width/a.height;this.camera.updateProjectionMatrix();
    if(!this.episode)return;
    const b=this.episode.bounds,c=this.renderers[1].domElement,aspect=c.width/c.height,w=b.maxX-b.minX+1.8,h=b.maxZ-b.minZ+1.8,viewH=Math.max(h,w/aspect),viewW=viewH*aspect;
    Object.assign(this.overhead,{left:-viewW/2,right:viewW/2,top:viewH/2,bottom:-viewH/2});this.overhead.updateProjectionMatrix();
    const cssHeight=Math.max(1,c.getBoundingClientRect().height),labelScale=10.5*viewH/(.34*cssHeight);
    for(const node of this.routes?.children||[])if(node.isSprite)node.scale.set(node.userData.labelWidth*labelScale,.64*labelScale,1);
    const iconSize=24*viewH/cssHeight;this.cameraMarker?.children[0].scale.set(iconSize,iconSize,1);
    if(this.lastState){this.cameraTag.userData.preferred.z=this.lastState.camera.position[2]+iconSize/2+this.cameraTag.scale.y/2+.15;this.declutterLabels();}
  }
  setQuality(value){
    if(!RENDER_QUALITY[value])throw new Error('Unknown render quality');
    this.quality=value;this.look?.quality(value);this.resize();this.render();
  }
  setCameraWaypoints(visible){
    this.showCameraWaypoints=Boolean(visible);
    this.cameraWaypointNodes?.forEach(n=>n.visible=this.showCameraWaypoints);
    if(this.ready){this.declutterLabels();this.render();}
  }
  capturePng(longEdge=3840){
    if(!this.ready)throw new Error('Scene is not ready');
    const renderer=this.renderers[0],size=renderer.getSize(new T.Vector2()),ratio=renderer.getPixelRatio(),aspect=this.camera.aspect;
    const {width,height}=captureDimensions(aspect,longEdge);
    try{
      renderer.setPixelRatio(1);renderer.setSize(width,height,false);this.camera.aspect=width/height;this.camera.updateProjectionMatrix();
      this.routes.visible=false;this.ceilings.forEach(x=>x.visible=true);this.look.environment(0);this.look.render(true);
      return renderer.domElement.toDataURL('image/png');
    }finally{
      renderer.setPixelRatio(ratio);renderer.setSize(size.x,size.y,false);this.camera.aspect=aspect;this.camera.updateProjectionMatrix();this.render();
    }
  }
  update(state){
    if(!this.ready)return;
    this.camera.position.fromArray(state.camera.position);this.camera.lookAt(new T.Vector3(...state.camera.lookAt));
    this.setEnvironment(state);this.human.update(state,this.doorHandle(),this.door?.hinge.getWorldQuaternion(new T.Quaternion()));
    for(const source of state.sources){this.living.get(source.id)?.update(source,state.time);const route=this.extraRoutes.get(source.id);if(route)route.visible=source.enabled;}
    if(this.musicRotor){const elapsed=this.episode.sources[0].activity.reduce((total,[start,end])=>total+Math.max(0,Math.min(state.time,end)-start),0);this.musicRotor.rotation.x=elapsed*2.7;this.musicKey.rotation.x=elapsed*1.1;this.musicLight.intensity=state.sources[0].active?.25:0;}
    if(this.fanRotor)this.fanRotor.rotation.z=state.sources.find(s=>s.id==='F1').rotorAngle;
    if(this.water)this.water.material.uniforms.time.value=state.time*.28;
    state.sources.forEach((s,i)=>{const n=this.markers[i];n.visible=s.enabled&&!s.follows;n.position.set(s.position[0]+.3,4.8,s.position[2]-.7);n.userData.preferred=n.position.clone();n.userData.anchor=new T.Vector3(s.position[0],4,s.position[2]);});
    this.cameraMarker.position.set(state.camera.position[0],4.7,state.camera.position[2]);
    const halfFov=Math.atan(Math.tan(T.MathUtils.degToRad(this.camera.fov/2))*this.camera.aspect),radius=1.9;
    const points=this.cameraFrustum.geometry.attributes.position;
    points.setXYZ(0,0,0,0);points.setXYZ(1,-Math.sin(halfFov)*radius,0,Math.cos(halfFov)*radius);points.setXYZ(2,Math.sin(halfFov)*radius,0,Math.cos(halfFov)*radius);points.needsUpdate=true;
    this.cameraFrustum.geometry.computeBoundingSphere();this.cameraFrustum.position.set(state.camera.position[0],4.1,state.camera.position[2]);this.cameraFrustum.rotation.y=Math.atan2(state.camera.forward[0],state.camera.forward[2]);
    this.cameraTag.position.set(state.camera.position[0],5,state.camera.position[2]+this.cameraMarker.children[0].scale.y/2+this.cameraTag.scale.y/2+.15);
    this.cameraTag.userData.preferred=this.cameraTag.position.clone();this.cameraTag.userData.anchor=new T.Vector3(state.camera.position[0],4,state.camera.position[2]);this.declutterLabels();
    this.world.updateMatrixWorld(true);this.lastState=state;
  }
  declutterLabels(){
    const sprites=[this.cameraTag,...this.markers.filter(n=>n.visible),...this.routes.children.filter(n=>n.isSprite&&n.visible&&!this.markers.includes(n)&&n!==this.cameraTag)],placed=[],attr=this.callouts.geometry.attributes.position,b=this.episode.bounds;
    attr.array.fill(0);
    const icon=this.cameraMarker.children[0];placed.push({x:this.cameraMarker.position.x,z:this.cameraMarker.position.z,width:icon.scale.x,height:icon.scale.y});
    sprites.forEach((n,i)=>{
      const p=n.userData.preferred,a=n.userData.anchor,width=n.scale.x,height=n.scale.y,offsets=[[0,0]];let choice;
      for(let ring=1;ring<=3;ring++){const x=ring*(width+.18),z=ring*(height+.16);offsets.push([0,z],[0,-z],[x,0],[-x,0],[x,z],[-x,z],[x,-z],[-x,-z]);}
      for(const [dx,dz] of offsets){const x=p.x+dx,z=p.z+dz;if(x<b.minX+width/2+.1||x>b.maxX-width/2-.1||z<b.minZ+height/2+.1||z>b.maxZ-height/2-.1)continue;if(!placed.some(v=>Math.abs(v.x-x)<(v.width+width)/2+.12&&Math.abs(v.z-z)<(v.height+height)/2+.1)){choice={x,z};break;}}
      choice??={x:p.x,z:p.z};n.position.set(choice.x,p.y,choice.z);placed.push({...choice,width,height});attr.setXYZ(i*2,a.x,4.05,a.z);attr.setXYZ(i*2+1,choice.x,4.05,choice.z);
    });attr.needsUpdate=true;
  }
  obstruction(source,listener){
    if(!this.occluders.length)return false;const start=new T.Vector3(...source),end=new T.Vector3(...listener),d=end.sub(start),distance=d.length();this.ray.set(start,d.normalize());this.ray.near=.07;this.ray.far=distance-.1;return this.ray.intersectObjects(this.occluders,false).length>0;
  }
  render(){
    if(!this.ready)return;
    this.routes.visible=false;this.ceilings.forEach(x=>x.visible=true);this.look.environment(0);this.look.render();
    this.routes.visible=true;this.ceilings.forEach(x=>x.visible=false);this.look.environment(1);this.renderers[1].render(this.scene,this.overhead);
  }
  overviewPng(){this.render();return this.renderers[1].domElement.toDataURL('image/png');}
  dispose(){
    if(this.mixer)this.mixer.stopAllAction();for(const item of this.living?.values()||[])item.dispose();this.look?.dispose();this.look=null;this.ready=false;
  }
}

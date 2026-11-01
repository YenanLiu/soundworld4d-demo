import * as T from '../vendor/three.module.js';
import {HDRLoader} from '../vendor/loaders/HDRLoader.js';
import {EffectComposer} from '../vendor/postprocessing/EffectComposer.js';
import {RenderPass} from '../vendor/postprocessing/RenderPass.js';
import {SSAOPass} from '../vendor/postprocessing/SSAOPass.js';
import {ShaderPass} from '../vendor/postprocessing/ShaderPass.js';
import {OutputPass} from '../vendor/postprocessing/OutputPass.js';
import {FXAAShader} from '../vendor/shaders/FXAAShader.js';
import {Water} from '../vendor/objects/Water.js';
import {RENDER_QUALITY} from './render-quality.mjs';

export async function createRenderLook(scene, renderers, camera, indoor) {
  const textureLoader = new T.TextureLoader(), textures = new Map();
  const image = async (name, color = false) => {
    const texture = await textureLoader.loadAsync(`assets/rendering/${name}`);
    texture.colorSpace = color ? T.SRGBColorSpace : T.NoColorSpace;
    texture.wrapS = texture.wrapT = T.RepeatWrapping;
    texture.anisotropy = Math.min(16, renderers[0].capabilities.getMaxAnisotropy());
    textures.set(name, texture); return texture;
  };
  const hdr = await new HDRLoader().loadAsync(`assets/rendering/${indoor ? 'interior' : 'sky'}.hdr`);
  hdr.mapping = T.EquirectangularReflectionMapping;
  const environments = renderers.map(renderer => {
    const pmrem = new T.PMREMGenerator(renderer), target = pmrem.fromEquirectangular(hdr); pmrem.dispose(); return target;
  });
  for (const renderer of renderers) {
    renderer.toneMapping = T.NeutralToneMapping; renderer.toneMappingExposure = indoor ? 1.3 : 1.05;
    renderer.shadowMap.type = T.PCFSoftShadowMap;
  }
  scene.environment = environments[0].texture; scene.environmentIntensity = indoor ? .32 : .7;
  if (!indoor) {scene.background = hdr; scene.backgroundIntensity = .85;}
  scene.add(new T.HemisphereLight(0xdce9fa, 0x8b806a, indoor ? .2 : .35));
  const sun = new T.DirectionalLight(0xfff1de, indoor ? 1.3 : 2.8);
  sun.position.set(-9, 13, 8); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, {left: -15, right: 15, top: 14, bottom: -14, near: .2, far: 65});
  sun.shadow.bias = -.00012; sun.shadow.normalBias = .018; sun.shadow.radius = 3;
  scene.add(sun);
  const shadowLights = [sun];
  if (indoor) {
    for (const [x, z, intensity] of [[-5.4, -1, 13], [1.6, 1.3, 15], [6.4, -1.6, 13]]) {
      const light = new T.SpotLight(0xfff5e8, intensity, 10, 1.2, .85, 2);
      light.position.set(x, 2.35, z); light.target.position.set(x + .7, 0, z + .6);
      light.castShadow = true; light.shadow.camera.near = .08; light.shadow.camera.far = 10;
      light.shadow.bias = -.00006; light.shadow.normalBias = .006;
      scene.add(light, light.target); shadowLights.push(light);
      const fill = new T.PointLight(0xfff5e8, 3, 8, 2); fill.position.copy(light.position); scene.add(fill);
    }
  }
  const [woodColor, woodNormal, woodRoughness] = await Promise.all([
    image('wood-diffuse.jpg', true), image('wood-normal.jpg'), image('wood-roughness.jpg'),
  ]);
  const wood = new T.MeshStandardMaterial({map: woodColor, normalMap: woodNormal, normalScale: new T.Vector2(.35, .35), roughnessMap: woodRoughness, roughness: .85, metalness: 0, color: 0xd5c7b9});
  const materials = new Map();
  function upgrade(material, role = '') {
    if (!material?.isMeshPhongMaterial && !material?.isMeshLambertMaterial) return material;
    const key = `${material.uuid}:${role}`;
    if (materials.has(key)) return materials.get(key);
    const metal = /Aircondition|Refrigerator|RangeHood|Stove|Dumbbell/i.test(role);
    const fabric = /Sofa|Bed|Carpet|Chair/i.test(role);
    const roughness = metal ? .43 : fabric ? .92 : /Floor/.test(role) ? .54 : /Wall|Ceiling/.test(role) ? .96 : .72;
    const result = new T.MeshStandardMaterial({
      name: material.name, color: material.color, map: material.map, normalMap: material.normalMap,
      bumpMap: material.bumpMap, bumpScale: material.bumpScale, alphaMap: material.alphaMap,
      transparent: material.transparent, opacity: material.opacity, alphaTest: material.alphaTest,
      side: T.DoubleSide, metalness: metal ? .18 : 0, roughness,
    });
    if (result.map) {result.map.colorSpace = T.SRGBColorSpace; result.map.anisotropy = Math.min(16, renderer.capabilities.getMaxAnisotropy());}
    materials.set(key, result); return result;
  }
  const renderer = renderers[0], composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  let ao = null;
  if (indoor) {
    ao = new SSAOPass(scene, camera, 512, 512, 32);
    ao.kernelRadius = .32; ao.minDistance = .00015; ao.maxDistance = .035;
    composer.addPass(ao);
  }
  composer.addPass(new OutputPass());
  const antialias = new ShaderPass(FXAAShader); composer.addPass(antialias);
  renderer.info.autoReset = false;
  let width = 0, height = 0, ratio = 0, quality = 'high';
  const size = new T.Vector2();
  return {
    hdr, wood, image, upgrade, sun, composer, ao,
    quality(value) {
      quality = value;
      const profile = RENDER_QUALITY[value] || RENDER_QUALITY.high;
      for (const light of shadowLights) {
        const resolution = light === sun ? profile.shadow : Math.min(profile.shadow, 2048);
        if (light.shadow.mapSize.x === resolution) continue;
        light.shadow.map?.dispose(); light.shadow.map = null;
        light.shadow.mapSize.set(resolution, resolution); light.shadow.needsUpdate = true;
      }
    },
    environment(index) {scene.environment = environments[index].texture;},
    render(capture = false) {
      renderer.getSize(size);
      const pixelRatio = renderer.getPixelRatio();
      if (size.x !== width || size.y !== height || ratio !== pixelRatio) {
        width = size.x; height = size.y; ratio = pixelRatio;
        composer.setPixelRatio(ratio);
        composer.setSize(renderer.domElement.width / ratio, renderer.domElement.height / ratio);
        antialias.material.uniforms.resolution.value.set(1 / renderer.domElement.width, 1 / renderer.domElement.height);
      }
      if (ao) ao.enabled = capture || RENDER_QUALITY[quality].ao;
      antialias.enabled = !capture && quality === 'balanced';
      renderer.info.reset(); composer.render(0);
    },
    async water() {
      const normal = await image('water-normal.jpg');
      const water = new Water(new T.PlaneGeometry(1.8, 120), {
        textureWidth: 256, textureHeight: 256, waterNormals: normal,
        sunDirection: sun.position.clone().normalize(), sunColor: 0xfff7e8,
        waterColor: 0x1e423b, distortionScale: 1.5, alpha: .94,
      });
      water.material.uniforms.size.value = 75;
      // The upstream example uses an artistic 0.3; clear water has much lower F0.
      water.material.fragmentShader = water.material.fragmentShader.replace('float rf0 = 0.3;', 'float rf0 = 0.025;');
      const reflect = water.onBeforeRender;
      water.onBeforeRender = function (renderer, scene, camera, ...rest) {
        if (!camera.isOrthographicCamera && !scene.overrideMaterial) reflect.call(this, renderer, scene, camera, ...rest);
      };
      water.rotation.x = -Math.PI / 2; water.position.set(5.8, -.05, 0); return water;
    },
    dispose() {
      for (const pass of composer.passes) pass.dispose?.(); composer.dispose();
      for (const target of environments) target.dispose(); hdr.dispose();
      for (const texture of textures.values()) texture.dispose();
      for (const material of materials.values()) material.dispose(); wood.dispose();
    },
  };
}

import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { SavePass } from 'three/examples/jsm/postprocessing/SavePass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

/** Shared subtle bloom, retaining transparent canvas backgrounds in the hero. */
export function createSceneBloom(renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.Camera, transparent = false) {
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const original = transparent ? new SavePass() : null;
  if (original) composer.addPass(original);
  composer.addPass(new UnrealBloomPass(new THREE.Vector2(1, 1), 0.22, 0.4, 0.75));
  if (original) {
    // UnrealBloomPass writes opaque alpha. Restore the scene's coverage, adding
    // coverage for the glow so the canvas never becomes an opaque rectangle.
    const restoreAlpha = new ShaderPass({
      uniforms: { tDiffuse: { value: null }, original: { value: null } },
      vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
      fragmentShader: `uniform sampler2D tDiffuse; uniform sampler2D original; varying vec2 vUv;
        void main(){
          vec4 base=texture2D(original,vUv); vec3 color=texture2D(tDiffuse,vUv).rgb;
          vec3 glow=max(color-base.rgb,vec3(0.0));
          float alpha=max(base.a,clamp(max(glow.r,max(glow.g,glow.b)),0.0,1.0));
          gl_FragColor=vec4(color,alpha);
        }`,
    });
    // ShaderPass clones uniforms; render-target textures must be assigned after
    // construction because Three.js deliberately refuses to clone them.
    restoreAlpha.uniforms.original.value = original.renderTarget.texture;
    composer.addPass(restoreAlpha);
  }
  composer.addPass(new OutputPass());
  const resize = () => {
    const size = renderer.getSize(new THREE.Vector2());
    composer.setPixelRatio(renderer.getPixelRatio());
    composer.setSize(size.x, size.y);
  };
  resize();
  return {
    render: () => composer.render(),
    resize,
    dispose: () => {
      composer.passes.forEach(pass => pass.dispose());
      composer.dispose();
    },
  };
}

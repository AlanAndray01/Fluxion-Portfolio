import * as THREE from 'three';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import { expose } from 'comlink';
import type { QualityPreset } from '../utils/qualityPresets';
import { FrameRateSampler } from '../utils/frameRate';

let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let renderer: THREE.WebGLRenderer;
let group: THREE.Group;
let textMesh: THREE.Mesh;
let animationFrameId: number;
let visible = false;
let disposed = false;
let renderFrame: ((now: number) => void) | null = null;
const sampler = new FrameRateSampler();

let mouseX = 0;
let mouseY = 0;

const api = {
  init: (canvas: OffscreenCanvas, width: number, height: number, pixelRatio: number, preset: QualityPreset | null, reportFPS: (fps: number | null) => void) => {

    const nearDist = 0.1;
    const farDist = 10000;

    scene = new THREE.Scene();
    // Keep the scene background consistent with the surrounding cyan section.
    scene.background = new THREE.Color('#4DD0E1');
    camera = new THREE.PerspectiveCamera(75, width / height, nearDist, farDist);

    const getResponsiveZ = (w: number) => {
      // Zoomed in closer for much better mobile readability while preserving margin
      if (w < 480) return 520; // Doubled zoom per request 
      if (w < 768) return 460;
      return 450; // Desktop default, closer and sharper
    };
    camera.position.z = getResponsiveZ(width);

    const finalPixelRatio = preset?.pixelRatio ?? Math.min(pixelRatio, 2);
    const antialias = preset?.antialias ?? true;

    renderer = new THREE.WebGLRenderer({ 
      canvas, 
      antialias, 
      powerPreference: "high-performance",
      alpha: false 
    });
    renderer.setClearColor("#4DD0E1");
    renderer.setPixelRatio(finalPixelRatio);
    renderer.setSize(width, height, false);

    // Lights
    const ambientLightIntensity = preset?.ambientLightIntensity ?? 0.64;
    const directionalLightIntensity = preset?.directionalLightIntensity ?? 1.1;
    const ambientLight = new THREE.AmbientLight(0xffffff, ambientLightIntensity);
    scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0xfff0f0, directionalLightIntensity);
    dirLight.position.set(200, 400, 300);
    scene.add(dirLight);

    // Bubbles
    const isMobile = width < 480;
    const isTablet = width >= 480 && width < 768;
    const bubbleSize = isMobile ? 35 : isTablet ? 45 : 60;
    
    // Dynamic Level of Detail based on Preset and Viewport
    const sphereGeoSegments = Math.max(8, Math.floor((preset?.sphereSegments ?? 32) * (isMobile ? 0.5 : 1)));
    const geometry = new THREE.SphereGeometry(bubbleSize, sphereGeoSegments, sphereGeoSegments);   
    const material = new THREE.MeshNormalMaterial();
    group = new THREE.Group();
    const bubbleCount = isMobile ? Math.min(100, preset?.bubbleCount ?? 150) : (preset?.bubbleCount ?? 350);
    for (let i = 0; i < bubbleCount; i++) {
      const mesh = new THREE.Mesh(geometry, material);
      const dist = farDist / 3;
      const distDouble = dist * 2;
      mesh.position.set(
        Math.random() * distDouble - dist,
        Math.random() * distDouble - dist,
        Math.random() * distDouble - dist
      );
      mesh.rotation.set(
        Math.random() * 2 * Math.PI,
        Math.random() * 2 * Math.PI,
        Math.random() * 2 * Math.PI
      );
      mesh.matrixAutoUpdate = false;
      mesh.updateMatrix();
      group.add(mesh);
    }
    scene.add(group);

    // Typography
    const loader = new FontLoader();
    textMesh = new THREE.Mesh();
    // Use fast cdn url instead of official domain rate-limiting or slow speeds
    loader.load('https://cdn.jsdelivr.net/npm/three@0.149.0/examples/fonts/helvetiker_regular.typeface.json', (font) => { 
      if (disposed) return;
      const isMobile = width < 480;
      const isTablet = width >= 480 && width < 768;
      // Drastically increased scale for high-impact mobile legibility (~double the delta of previous adjustment)
      const cubeSize = isMobile ? 85 : isTablet ? 100 : 110;
      
      const bevelSegments = preset?.textBevelSegments ?? 8;
      const curveSegments = preset?.textCurveSegments ?? 12;
      
      const typoProperties = {
        font: font,
        size: cubeSize,
        height: isMobile ? cubeSize / 4 : cubeSize / 2,
        curveSegments: curveSegments,
        bevelEnabled: bevelSegments > 1,
        bevelThickness: isMobile ? 3 : 10,
        bevelSize: isMobile ? 2 : 6,
        bevelOffset: 1,
        bevelSegments: bevelSegments,
      };

      const text1 = new TextGeometry("Fluxion Crafts", typoProperties);
      text1.computeBoundingBox();
      const mesh1 = new THREE.Mesh(text1, material);
      if (text1.boundingBox) {
        mesh1.position.x = -0.5 * (text1.boundingBox.max.x - text1.boundingBox.min.x);
      }
      mesh1.position.y = cubeSize * 0.75;

      const text2 = new TextGeometry("Elegance", typoProperties);
      text2.computeBoundingBox();
      const mesh2 = new THREE.Mesh(text2, material);
      if (text2.boundingBox) {
        mesh2.position.x = -0.5 * (text2.boundingBox.max.x - text2.boundingBox.min.x);
      }
      mesh2.position.y = -cubeSize * 0.75;

      textMesh.add(mesh1, mesh2);
      
      textMesh.updateMatrixWorld(true);
      const bbox = new THREE.Box3().setFromObject(textMesh);
      textMesh.position.y = -0.5 * (bbox.max.y + bbox.min.y);
      textMesh.position.z = -cubeSize;
      scene.add(textMesh);
    });

    const render = (now: number) => {
      if (!visible || disposed) return;
      const t = Date.now() * 0.001;
      const rx = Math.sin(t * 0.7) * 0.5;
      const ry = Math.sin(t * 0.3) * 0.5;
      const rz = Math.sin(t * 0.2) * 0.5;

      camera.position.x += (mouseX - camera.position.x) * 0.05;
      camera.position.y += (-mouseY - camera.position.y) * 0.05;
      camera.lookAt(scene.position);

      group.rotation.set(rx, ry, rz);

      if (textMesh) {
        const textRotationMultiplier = preset?.textRotationMultiplier ?? 0.25;
        textMesh.rotation.x = rx * textRotationMultiplier;
        textMesh.rotation.y = ry * textRotationMultiplier;
        textMesh.rotation.z = rz * textRotationMultiplier;
      }

      renderer.render(scene, camera);
      const fps = sampler.frame(now);
      if (fps !== null) void reportFPS(fps);
      animationFrameId = self.requestAnimationFrame(render);
    };

    renderFrame = render;
  },
  setVisible: (next: boolean) => {
    if (next === visible || disposed) return;
    visible = next;
    self.cancelAnimationFrame(animationFrameId);
    sampler.reset();
    if (visible && renderFrame) animationFrameId = self.requestAnimationFrame(renderFrame);
  },
  onMouseMove: (x: number, y: number) => {
    mouseX = x;
    mouseY = y;
  },
  onResize: (width: number, height: number) => {
    if (camera && renderer) {
      camera.aspect = width / height;

      const getResponsiveZ = (w: number) => {
        if (w < 480) return 520;
        if (w < 768) return 460;
        return 450;
      };
      camera.position.z = getResponsiveZ(width);

      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    }
  },
  cleanup: () => {
    self.cancelAnimationFrame(animationFrameId);
    disposed = true;
    const geometries = new Set<THREE.BufferGeometry>();
    const materials = new Set<THREE.Material>();
    scene.traverse(object => {
      if (object instanceof THREE.Mesh) {
        geometries.add(object.geometry);
        (Array.isArray(object.material) ? object.material : [object.material]).forEach(material => materials.add(material));
      }
    });
    geometries.forEach(geometry => geometry.dispose());
    materials.forEach(material => material.dispose());
    renderer.dispose();
  },
};

expose(api);

export type ThreeWorkerApi = typeof api;

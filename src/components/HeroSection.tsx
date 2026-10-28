'use client';

import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { getDeviceConfig, QUALITY_UPDATED, reportSceneFPS } from '@/utils/deviceConfig';
import { getQualityPreset } from '@/utils/qualityPresets';
import { FrameRateSampler } from '@/utils/frameRate';
import './HeroSection.css';

export default function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    // Get detected device tier and preset
    let deviceTier = 'MEDIUM'; // default fallback
    let preset = null;

    try {
      const config = getDeviceConfig();
      deviceTier = config.tier;
      preset = getQualityPreset(config.tier);
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`[HeroSection] Initializing with ${deviceTier} quality preset`);
      }
    } catch (error) {
      console.warn('[HeroSection] Device config not available, using defaults:', error);
      preset = getQualityPreset('MEDIUM');
    }

    // Scene setup
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const dat = require('dat.gui');
    const scene = new THREE.Scene();
    
    // Responsive camera settings
    const getResponsiveCamera = () => {
      const width = window.innerWidth;
      let fov = 25;
      let zPos = 24;
      
      if (width < 480) {
        // Mobile: small phones
        fov = 40;
        zPos = 25;
      } else if (width < 768) {
        // Mobile: larger phones
        fov = 35;
        zPos = 25;
      } else if (width < 1024) {
        // Tablet
        fov = 28;
        zPos = 26;
      }
      
      return { fov, zPos };
    };
    
    const { fov, zPos } = getResponsiveCamera();
    const camera = new THREE.PerspectiveCamera(fov, window.innerWidth / window.innerHeight, 0.1, 1000);

    camera.position.z = zPos;

    // Apply quality settings from preset
    const pixelRatio = preset?.pixelRatio ?? window.devicePixelRatio;
    const antialias = preset?.antialias ?? true;
    const shadowsEnabled = preset?.shadowsEnabled ?? true;
    const shadowMapType = preset?.shadowMapType ?? 'PCFSoftShadowMap';
    const sphereSegments = preset?.sphereSegments ?? 64;
    const ambientLightIntensity = preset?.ambientLightIntensity ?? 0.64;
    const directionalLightIntensity = preset?.directionalLightIntensity ?? 1.1;
    const roomEnvQuality = preset?.roomEnvironmentQuality ?? 0.04;

    const renderer = new THREE.WebGLRenderer({
      canvas: document.querySelector('#webgl') as HTMLCanvasElement,
      antialias: antialias,
      alpha: true
    });
    
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(pixelRatio);
    renderer.shadowMap.enabled = shadowsEnabled;
    renderer.shadowMap.type = THREE[`${shadowMapType}` as keyof typeof THREE] as THREE.ShadowMapType;

    // Add RoomEnvironment for ultra-realistic soft lighting
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();
    const room = new RoomEnvironment();
    const environment = pmremGenerator.fromScene(room, roomEnvQuality);
    scene.environment = environment.texture;
    room.dispose();
    pmremGenerator.dispose();

      
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.autoRotate = false;
    controls.autoRotateSpeed = 0;
    controls.enableZoom = false;
    controls.enablePan = false;
    controls.enableRotate = false;
    controls.target.set(0, 0, 0);
    controls.update();

    const radii = [1, 0.6, 0.8, 0.4, 0.9, 0.7, 0.9, 0.3, 0.2, 0.5, 0.6, 0.4, 0.5, 0.6, 0.7, 0.3, 0.4, 0.8, 0.7, 0.5, 0.4, 0.6, 0.35, 0.38, 0.9, 0.3, 0.6, 0.4, 0.2, 0.35, 0.5, 0.15, 0.2, 0.25, 0.4, 0.8, 0.76, 0.8, 1, 0.8, 0.7, 0.8, 0.3, 0.5, 0.6, 0.55, 0.42, 0.75, 0.66, 0.6, 0.7, 0.5, 0.6, 0.35, 0.35, 0.35, 0.8, 0.6, 0.7, 0.8, 0.4, 0.89, 0.3, 0.3, 0.6, 0.4, 0.2, 0.52, 0.5, 0.15, 0.2, 0.25, 0.4, 0.8, 0.76, 0.8, 1, 0.8, 0.7, 0.8, 0.3, 0.5, 0.6, 0.8, 0.7, 0.75, 0.66, 0.6, 0.7, 0.5, 0.6, 0.35, 0.35, 0.35, 0.8, 0.6, 0.7, 0.8, 0.4, 0.89, 0.3];

    const positions = [
      {x:0,y:0,z:0}, {x:1.2,y:0.9,z:-0.5}, {x:1.8,y:-0.3,z:0}, {x:-1,y:-1,z:0}, {x:-1,y:1.62,z:0}, {x:-1.65,y:0,z:-0.4}, {x:-2.13,y:-1.54,z:-0.4}, {x:0.8,y:0.94,z:0.3}, {x:0.5,y:-1,z:1.2}, {x:-0.16,y:-1.2,z:0.9}, {x:1.5,y:1.2,z:0.8}, {x:0.5,y:-1.58,z:1.4}, {x:-1.5,y:1,z:1.15}, {x:-1.5,y:-1.5,z:0.99}, {x:-1.5,y:-1.5,z:-1.9}, {x:1.85,y:0.8,z:0.05}, {x:1.5,y:-1.2,z:-0.75}, {x:0.9,y:-1.62,z:0.22}, {x:0.45,y:2,z:0.65}, {x:2.5,y:1.22,z:-0.2}, {x:2.35,y:0.7,z:0.55}, {x:-1.8,y:-0.35,z:0.85}, {x:-1.02,y:0.2,z:0.9}, {x:0.2,y:1,z:1}, {x:-2.88,y:0.7,z:1}, {x:-2,y:-0.95,z:1.5}, {x:-2.3,y:2.4,z:-0.1}, {x:-2.5,y:1.9,z:1.2}, {x:-1.8,y:0.37,z:1.2}, {x:-2.4,y:1.42,z:0.05}, {x:-2.72,y:-0.9,z:1.1}, {x:-1.8,y:-1.34,z:1.67}, {x:-1.6,y:1.66,z:0.91}, {x:-2.8,y:1.58,z:1.69}, {x:-2.97,y:2.3,z:0.65}, {x:1.1,y:-0.2,z:-1.45}, {x:-4,y:1.78,z:0.38}, {x:0.12,y:1.4,z:-1.29}, {x:-1.64,y:1.4,z:-1.79}, {x:-3.5,y:-0.58,z:0.1}, {x:-0.1,y:-1,z:-2}, {x:-4.5,y:0.55,z:-0.5}, {x:-3.87,y:0,z:1}, {x:-4.6,y:-0.1,z:0.65}, {x:-3,y:1.5,z:-0.7}, {x:-0.5,y:0.2,z:-1.5}, {x:-1.3,y:-0.45,z:-1.5}, {x:-3.35,y:0.25,z:-1.5}, {x:-4.76,y:-1.26,z:0.4}, {x:-4.32,y:0.85,z:1.4}, {x:-3.5,y:-1.82,z:0.9}, {x:-3.6,y:-0.6,z:1.46}, {x:-4.55,y:-1.5,z:1.63}, {x:-3.8,y:-1.15,z:2.1}, {x:-2.9,y:-0.25,z:1.86}, {x:-2.2,y:-0.4,z:1.86}, {x:-5.1,y:-0.24,z:1.86}, {x:-5.27,y:1.24,z:0.76}, {x:-5.27,y:2,z:-0.4}, {x:-6.4,y:0.4,z:1}, {x:-5.15,y:0.95,z:2}, {x:-6.2,y:0.5,z:-0.8}, {x:-4,y:0.08,z:1.8}, {x:2,y:-0.95,z:1.5}, {x:2.3,y:2.4,z:-0.1}, {x:2.5,y:1.9,z:1.2}, {x:1.8,y:0.37,z:1.2}, {x:3.24,y:0.6,z:1.05}, {x:2.72,y:-0.9,z:1.1}, {x:1.8,y:-1.34,z:1.67}, {x:1.6,y:1.99,z:0.91}, {x:2.8,y:1.58,z:1.69}, {x:2.97,y:2.3,z:0.65}, {x:-1.3,y:-0.2,z:-2.5}, {x:4,y:1.78,z:0.38}, {x:1.72,y:1.4,z:-1.29}, {x:2.5,y:-1.2,z:-2}, {x:3.5,y:-0.58,z:0.1}, {x:0.1,y:0.4,z:-2.42}, {x:4.5,y:0.55,z:-0.5}, {x:3.87,y:0,z:1}, {x:4.6,y:-0.1,z:0.65}, {x:3,y:1.5,z:-0.7}, {x:2.3,y:0.6,z:-2.6}, {x:4,y:1.5,z:-1.6}, {x:3.35,y:0.25,z:-1.5}, {x:4.76,y:-1.26,z:0.4}, {x:4.32,y:0.85,z:1.4}, {x:3.5,y:-1.82,z:0.9}, {x:3.6,y:-0.6,z:1.46}, {x:4.55,y:-1.5,z:1.63}, {x:3.8,y:-1.15,z:2.1}, {x:2.9,y:-0.25,z:1.86}, {x:2.2,y:-0.4,z:1.86}, {x:5.1,y:-0.24,z:1.86}, {x:5.27,y:1.24,z:0.76}, {x:5.27,y:2,z:-0.4}, {x:6.4,y:0.4,z:1}, {x:5.15,y:0.95,z:2}, {x:6.2,y:0.5,z:-0.8}, {x:4,y:0.08,z:1.8}
    ];

const gui = new dat.GUI({ closed: true });
gui.close(); // Double ensure it's closed by default

    // Helper function to convert hex to RGB
    const hexToRgb = (hex: string): string => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '202, 112, 0';
    };

    // Helper function to update CSS variables for About Section bubble
    const updateBubbleStyles = () => {
      const root = document.documentElement;
      root.style.setProperty('--bubble-primary-color', params.color);
      root.style.setProperty('--bubble-emissive-color', params.emissive);
      const rgb = hexToRgb(params.color);
      root.style.setProperty('--bubble-shadow-rgb', rgb);
      root.style.setProperty('--bubble-roughness', String(params.roughness));

      // Synchronize Contact section
      root.style.setProperty('--contact-primary-color', params.color);
      root.style.setProperty('--contact-shadow-rgb', rgb);
    };

      const params = {
        color: '#4DD0E1',
        emissive: '#000000',
        roughness: 1,
        metalness: 1,
        clearcoat: 0.3,
        ambientLight: ambientLightIntensity,
        directionalLight: directionalLightIntensity
      };

      const qualityGuiParams = {
        openQualitySettings: () => {
          window.dispatchEvent(new CustomEvent('open-quality-settings'));
        }
      };
      gui.add(qualityGuiParams, 'openQualitySettings').name('Change Quality...');

    // Select material based on quality tier
    let material: THREE.Material;
    
    if (preset?.materialType === 'MeshBasicMaterial') {
      material = new THREE.MeshBasicMaterial({
        color: params.color,
      });
    } else if (preset?.materialType === 'MeshStandardMaterial') {
      material = new THREE.MeshStandardMaterial({
        color: params.color,
        emissive: params.emissive,
        roughness: params.roughness,
        metalness: params.metalness,
      });
    } else {
      // HIGH tier: MeshPhysicalMaterial
      material = new THREE.MeshPhysicalMaterial({
        color: params.color,
        emissive: params.emissive,
        roughness: params.roughness,
        metalness: params.metalness,
        clearcoat: params.clearcoat,
        clearcoatRoughness: 0.2,
      });
    }

    // Initialize CSS variables with default values
    updateBubbleStyles();

    const guiMaterial = gui.addFolder('Material');
    guiMaterial.addColor(params, 'color').onChange((v: string) => {
      if ('color' in material) {
        (material as THREE.MeshPhysicalMaterial | THREE.MeshStandardMaterial | THREE.MeshBasicMaterial).color.set(v);
      }
      updateBubbleStyles();
    });
    
    // Only show emissive/clearcoat in HIGH tier to reduce GUI complexity on weak devices
    if (deviceTier === 'HIGH') {
      guiMaterial.addColor(params, 'emissive').onChange((v: string) => {
        if ('emissive' in material) {
          (material as THREE.MeshPhysicalMaterial | THREE.MeshStandardMaterial).emissive?.set(v);
        }
        updateBubbleStyles();
      });
    }
    
    if ('roughness' in material) {
      guiMaterial.add(params, 'roughness', 0, 1).onChange((v: number) => {
        (material as THREE.MeshPhysicalMaterial | THREE.MeshStandardMaterial).roughness = v;
        updateBubbleStyles();
      });
    }
    
    if ('metalness' in material) {
      guiMaterial.add(params, 'metalness', 0, 1).onChange((v: number) => {
        (material as THREE.MeshPhysicalMaterial | THREE.MeshStandardMaterial).metalness = v;
        updateBubbleStyles();
      });
    }
    
    if (deviceTier === 'HIGH' && 'clearcoat' in material) {
      guiMaterial.add(params, 'clearcoat', 0, 1).onChange((v: number) => {
        (material as THREE.MeshPhysicalMaterial).clearcoat = v;
        updateBubbleStyles();
      });
    }
    // guiMaterial.open();

    const group = new THREE.Group();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const spheres: any[] = [];

    // Use quality preset for sphere segments
    const geometrySegments = sphereSegments;

    positions.forEach((pos, i) => {
      const radius = radii[i];
      const geometry = new THREE.SphereGeometry(radius, geometrySegments, geometrySegments);
      const sphere = new THREE.Mesh(geometry, material);
      sphere.position.set(pos.x, pos.y, pos.z);
      sphere.userData = {originalPosition: {...pos}, radius};
      sphere.castShadow = shadowsEnabled;
      sphere.receiveShadow = shadowsEnabled;
      spheres.push(sphere);
      group.add(sphere);
    });

      scene.add(group);

      const handleResize = () => {
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        // Update Camera
        const camSettings = getResponsiveCamera();
        camera.fov = camSettings.fov;
        camera.position.z = camSettings.zPos;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();

        // Update Group Scale for Mobile
        if (width < 480) {
          group.scale.set(0.6, 0.6, 0.6);
        } else if (width < 768) {
          group.scale.set(0.85, 0.85, 0.85);
        } else if (width < 1024) {
          group.scale.set(0.95, 0.95, 0.95);
        } else {
          group.scale.set(1, 1, 1);
        }

        renderer.setSize(width, height);
      };

      // Call first time
      handleResize();
      window.addEventListener('resize', handleResize);

      // Enhance soft shadows and warm light (using preset values)
      const ambientLight = new THREE.AmbientLight(0xffffff, ambientLightIntensity);
      scene.add(ambientLight);

      const dirLight = new THREE.DirectionalLight(0xfff0f0, directionalLightIntensity); // Slight warm tint
      dirLight.position.set(10, 20, 15);
      dirLight.castShadow = shadowsEnabled;
      dirLight.shadow.mapSize.width = shadowsEnabled ? 1024 : 512;
      dirLight.shadow.mapSize.height = shadowsEnabled ? 1024 : 512;
      dirLight.shadow.bias = -0.0001;
      scene.add(dirLight);

      const hemiLight = new THREE.HemisphereLight(0xffffff, 0xffe6f0, 0.4);
      scene.add(hemiLight);

      const applyQuality = () => {
        preset = getDeviceConfig().preset;
        renderer.setPixelRatio(preset.pixelRatio);
        renderer.shadowMap.enabled = preset.shadowsEnabled;
        dirLight.castShadow = preset.shadowsEnabled;
        ambientLight.intensity = preset.ambientLightIntensity;
        dirLight.intensity = preset.directionalLightIntensity;
        const previousMaterial = material;
        const materialProps = { color: params.color, emissive: params.emissive, roughness: params.roughness, metalness: params.metalness };
        material = preset.materialType === 'MeshBasicMaterial'
          ? new THREE.MeshBasicMaterial({ color: params.color })
          : preset.materialType === 'MeshStandardMaterial'
            ? new THREE.MeshStandardMaterial(materialProps)
            : new THREE.MeshPhysicalMaterial({ ...materialProps, clearcoat: params.clearcoat, clearcoatRoughness: 0.2 });
        spheres.forEach(sphere => {
          sphere.geometry.dispose();
          sphere.geometry = new THREE.SphereGeometry(sphere.userData.radius, preset!.sphereSegments, preset!.sphereSegments);
          sphere.castShadow = sphere.receiveShadow = preset!.shadowsEnabled;
          sphere.material = material;
        });
        previousMaterial.dispose();
        sampler.reset();
      };
      window.addEventListener(QUALITY_UPDATED, applyQuality);

      const guiLights = gui.addFolder('Lights');
      guiLights.add(params, 'ambientLight', 0, 3).onChange((v: number) => { ambientLight.intensity = v; });
      guiLights.add(params, 'directionalLight', 0, 3).onChange((v: number) => { dirLight.intensity = v; });
      // guiLights.open();

      gui.close(); // Close the GUI by default

      const raycaster = new THREE.Raycaster();
      const mouse = new THREE.Vector2();
      const tempVector = new THREE.Vector3();
      const forces = new Map();

      const initY = -25;
      const revolutionRadius = 4;
      const revolutionDuration = 1.7;  // Reduced from 2 to 0.7 seconds
      const breathingAmplitude = 0.1;
      const breathingSpeed = 0.002;

      spheres.forEach(sphere => {
        sphere.position.y = initY;
      });

      let loadingComplete = false;
      const introTimelines: gsap.core.Timeline[] = [];

      const initLoadingAnimation = () => {
        spheres.forEach((sphere, i) => {
          const delay = i * 0.02;
          const timeline = gsap.timeline()
            .to(sphere.position, {
              duration: revolutionDuration / 2,
              y: revolutionRadius,
              ease: 'power1.out',
              onUpdate: function() {
                const progress = this.progress();
                sphere.position.z = sphere.userData.originalPosition.z + Math.sin(progress * Math.PI) * revolutionRadius;
              },
              delay: delay
            })
            .to(sphere.position, {
              duration: revolutionDuration / 2,
              y: initY / 5,
              ease: 'power1.out',
              onUpdate: function() {
                const progress = this.progress();
                sphere.position.z = sphere.userData.originalPosition.z - Math.sin(progress * Math.PI) * revolutionRadius;
              }
            })
            .to(sphere.position, {
              duration: 0.6,
              x: sphere.userData.originalPosition.x,
              y: sphere.userData.originalPosition.y,
              z: sphere.userData.originalPosition.z,
              ease: 'power1.out'
            });
          introTimelines.push(timeline);
        });
      };

      initLoadingAnimation();

      const hiddenElements = document.querySelectorAll('.hide-text');
      const mainTxt = document.querySelector('.main-txt');
      const mouseEffect = document.querySelector<HTMLElement>('.mouse-effect');

      hiddenElements.forEach(el => {
        (el as HTMLElement).style.opacity = '0';
      });

      const loadingTimer = setTimeout(() => {
        loadingComplete = true;
        hiddenElements.forEach(el => {
          (el as HTMLElement).style.opacity = '1';
        });
        if (mainTxt) (mainTxt as HTMLElement).style.opacity = '0';
      }, (revolutionDuration + 1) * 1000);

      const onMouseMove = (event: MouseEvent) => {
        // Move both cursor shapes together on this event, without easing or a trail.
        if (mouseEffect) {
          mouseEffect.style.transform = `translate3d(${event.clientX}px, ${event.clientY}px, 0)`;
          mouseEffect.style.opacity = '1';
          document.documentElement.classList.add('custom-cursor-active');
        }

        if (!loadingComplete || !inViewport || document.hidden) return;

        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(spheres);

        if (intersects.length > 0) {
          const hoveredSphere = intersects[0].object;
          const force = new THREE.Vector3();
          force.subVectors(intersects[0].point, hoveredSphere.position).normalize().multiplyScalar(0.2);
          forces.set(hoveredSphere.uuid, force);
        }
      };

      const hideCustomCursor = () => {
        if (mouseEffect) (mouseEffect as HTMLElement).style.opacity = '0';
        document.documentElement.classList.remove('custom-cursor-active');
      };

      const handleCollisions = () => {
        for (let i = 0; i < spheres.length; i++) {
          const sphereA = spheres[i];
          const radiusA = sphereA.userData.radius;

          for (let j = i + 1; j < spheres.length; j++) {
            const sphereB = spheres[j];
            const radiusB = sphereB.userData.radius;

            const distance = sphereA.position.distanceTo(sphereB.position);
            const minDistance = (radiusA + radiusB) * 1.2;

            if (distance < minDistance) {
              tempVector.subVectors(sphereB.position, sphereA.position).normalize();
              const pushStrength = (minDistance - distance) * 0.4;
              sphereA.position.sub(tempVector.clone().multiplyScalar(pushStrength));
              sphereB.position.add(tempVector.multiplyScalar(pushStrength));
            }
          }
        }
      };

      const sampler = new FrameRateSampler();
      let animationFrame = 0;
      let inViewport = false;
      const animate = (now: number) => {
        animationFrame = 0;
        if (document.hidden || !inViewport) return;

        if (loadingComplete) {
          const time = Date.now() * breathingSpeed;
          spheres.forEach((sphere, i) => {
            const offset = i * 0.2;
            const breathingY = Math.sin(time + offset) * breathingAmplitude;
            const breathingZ = Math.cos(time + offset) * breathingAmplitude * 0.5;

            const force = forces.get(sphere.uuid);
            if (force) {
              sphere.position.add(force);
              force.multiplyScalar(0.95);
              if (force.length() < 0.01) forces.delete(sphere.uuid);
            }

            const originalPos = sphere.userData.originalPosition;
            tempVector.set(originalPos.x, originalPos.y + breathingY, originalPos.z + breathingZ);
            sphere.position.lerp(tempVector, 0.018);
          });

          handleCollisions();
        }

        controls.update();
        renderer.render(scene, camera);
        if (loadingComplete) {
          const fps = sampler.frame(now);
          if (fps !== null) reportSceneFPS('hero', fps);
        }
        animationFrame = requestAnimationFrame(animate);
      };

      const updateVisibility = () => {
        sampler.reset();
        reportSceneFPS('hero', null);
        if (inViewport && !document.hidden) {
          if (!animationFrame) animationFrame = requestAnimationFrame(animate);
        } else {
          cancelAnimationFrame(animationFrame);
          animationFrame = 0;
        }
      };
      const observer = new IntersectionObserver(([entry]) => {
        inViewport = entry.isIntersecting && entry.intersectionRatio > 0;
        updateVisibility();
      });
      observer.observe(containerRef.current!);
      document.addEventListener('visibilitychange', updateVisibility);

      window.addEventListener('mousemove', onMouseMove);
      document.documentElement.addEventListener('mouseleave', hideCustomCursor);
      window.addEventListener('blur', hideCustomCursor);

      return () => {
        observer.disconnect();
        document.removeEventListener('visibilitychange', updateVisibility);
        window.removeEventListener(QUALITY_UPDATED, applyQuality);
        cancelAnimationFrame(animationFrame);
        reportSceneFPS('hero', null);
        clearTimeout(loadingTimer);
        introTimelines.forEach(timeline => timeline.kill());
        window.removeEventListener('mousemove', onMouseMove);
        document.documentElement.removeEventListener('mouseleave', hideCustomCursor);
        window.removeEventListener('blur', hideCustomCursor);
        hideCustomCursor();
        window.removeEventListener('resize', handleResize);
        gui.destroy();
        controls.dispose();
        spheres.forEach(sphere => sphere.geometry.dispose());
        material.dispose();
        dirLight.shadow.dispose();
        environment.dispose();
        renderer.dispose();
      };
  }, []);

  return (
    <>
      <div className="mouse-effect">
        <div className="circle"></div>
        <div className="circle-follow"></div>
      </div>
      <div className="hero-section-container" ref={containerRef} id="home">

        <header className="hide-text">
          <div className="header-inner">
            <a href="#" className="navbar-brand">Fluxion</a>
            <nav className="desktop-nav">
              <ul>
                <li><a href="#home">Home</a></li>
                <li><a href="#projects-bottom">Projects</a></li>
                <li><a href="#about">Profile</a></li>
                <li><a href="#3dmodal">3D Modal</a></li>
                <li><a href="#contact">Contact Me</a></li>
                <li>
                  <a 
                    href="/Syed Arslan Shah CV.pdf" 
                    className="cv-btn" 
                    download="Syed Arslan Shah.pdf" 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    My CV
                  </a>
                </li>
              </ul>
            </nav>
            <div 
              className="ham-btn" 
              onClick={() => setIsMenuOpen(true)}
              style={{ display: 'none', cursor: 'pointer', flexDirection: 'column', justifyContent: 'space-between', height: '42px', padding: '10px 0' }}
            >
              <div style={{ width: '22px', height: '2px', background: '#000' }}></div>
              <div style={{ width: '22px', height: '2px', background: '#000' }}></div>
              <div style={{ width: '22px', height: '2px', background: '#000' }}></div>
            </div>
          </div>
        </header>

        {/* Mobile Menu Overlay */}
        <div className={`mobile-menu-overlay ${isMenuOpen ? 'open' : ''}`}>
          <div className="mobile-menu-header">
            <span className="navbar-brand" style={{ fontSize: '22px' }}>Fluxion</span>
            <div className="close-btn" onClick={() => setIsMenuOpen(false)}>
              &times;
            </div>
          </div>
          <div className="mobile-menu-divider"></div>
          
          <nav className="mobile-nav">
            <ul>
              <li><a href="#home" onClick={() => setIsMenuOpen(false)}>Home</a></li>
              <li><a href="#projects-bottom" onClick={() => setIsMenuOpen(false)}>Projects</a></li>
              <li><a href="#about" onClick={() => setIsMenuOpen(false)}>Profile</a></li>
              <li><a href="#3dmodal" onClick={() => setIsMenuOpen(false)}>3D Modal</a></li>
              <li><a href="#contact" onClick={() => setIsMenuOpen(false)}>Contact Me</a></li>
              <li className="cv-btn-container">
                <a 
                  href="/Syed Arslan Shah CV.pdf" 
                  className="cv-btn" 
                  download="Syed Arslan Shah.pdf" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  onClick={() => setIsMenuOpen(false)}
                >
                  My CV
                </a>
              </li>
            </ul>
          </nav>
        </div>

        <h1 className="main-txt">Fluxion</h1>

        <section className="banner hide-text">
          <div className="banner-inner">
            <div className="top-desc">
              <div className="h5">Despersion Collisions</div>
              <div className="h6">Research & Development</div>
              <span></span>
            </div>
            <div className="bottom-desc">
              <div className="left-desc">
                <div className="desc-inner">
                  <div className="h5">Pink & Rose Gold</div>
                  <div className="h6">Lighting & Material Study</div>
                </div>
              </div>
              <div className="middle-desc">
                <h2>Dynamic Collisions</h2>
              </div>
              <div className="right-desc">
                <div className="h1">01</div>
                <div className="desc-inner">
                  <span>Social Links</span>
                  <ul className="social-links">
                    <li><a href="#" aria-label="Discord"><i className="fa-brands fa-discord"></i></a></li>
                    <li><a href="#" aria-label="LinkedIn"><i className="fa-brands fa-linkedin-in"></i></a></li>
                    <li><a href="#" aria-label="WhatsApp"><i className="fa-brands fa-whatsapp"></i></a></li>
                    <li><a href="#" aria-label="Instagram"><i className="fa-brands fa-instagram"></i></a></li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        <span className="rotated-text hide-text">Drag cursor to perfect</span>
        <canvas className="webgl" id="webgl"></canvas>
      </div>
    </>
  );
}

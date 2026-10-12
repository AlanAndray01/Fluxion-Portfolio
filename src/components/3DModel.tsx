'use client';

import { useEffect, useRef } from 'react';
import { wrap, transfer, proxy, releaseProxy } from 'comlink';
import styles from './3DModel.module.css';
import { getDeviceConfig, reportSceneFPS } from '@/utils/deviceConfig';
import { getQualityPreset } from '@/utils/qualityPresets';
import { useQualityTier } from '@/hooks/useDeviceConfig';

export default function Model3D() {
  const containerRef = useRef<HTMLDivElement>(null);
  const tier = useQualityTier();

  useEffect(() => {
    if (!containerRef.current || !tier) return;
    
    const container = containerRef.current;
    
    // Dynamically create the canvas to avoid React StrictMode transferControlToOffscreen issues
    const canvas = document.createElement('canvas');
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.pointerEvents = 'auto';
    container.appendChild(canvas);

    let offscreen: OffscreenCanvas;
    try {
      offscreen = canvas.transferControlToOffscreen();
    } catch (e) {
      console.warn('OffscreenCanvas transfer failed:', e);
      canvas.remove();
      return;
    }
    
    const worker = new Worker(new URL('../workers/three.worker.ts', import.meta.url));
    const workerApi = wrap<import('../workers/three.worker').ThreeWorkerApi>(worker);
    let disposed = false;

    let preset = null;
    try {
        const config = getDeviceConfig();
        preset = getQualityPreset(config.tier);
    } catch (error) {
        console.warn('[3DModel] Device config not available, using defaults:', error);
    }

    const ready = workerApi.init(transfer(offscreen, [offscreen]), container.clientWidth, container.clientHeight, window.devicePixelRatio || 1, preset,
      proxy((fps: number | null) => { if (!disposed) reportSceneFPS('model', fps); }));
    const handleError = (error: unknown) => { if (!disposed) console.error('[3DModel]', error); };
    void ready.catch(handleError);
    let inViewport = false;
    const updateVisibility = () => {
      if (document.hidden || !inViewport) reportSceneFPS('model', null);
      void ready.then(() => { if (!disposed) return workerApi.setVisible(inViewport && !document.hidden); }).catch(handleError);
    };
    const observer = new IntersectionObserver(([entry]) => {
      inViewport = entry.isIntersecting && entry.intersectionRatio > 0;
      updateVisibility();
    });
    observer.observe(container);
    document.addEventListener('visibilitychange', updateVisibility);

    const onMouseMove = (e: MouseEvent) => {
        const mouseMultiplier = preset?.mouseMultiplier ?? 5;
        const mouseX = (e.clientX - window.innerWidth / 2) * mouseMultiplier;
        const mouseY = (e.clientY - window.innerHeight / 2) * mouseMultiplier;
        void ready.then(() => { if (!disposed) return workerApi.onMouseMove(mouseX, mouseY); }).catch(handleError);
    };

    const onResize = () => {
        if (!container) return;
        void ready.then(() => { if (!disposed) return workerApi.onResize(container.clientWidth, container.clientHeight); }).catch(handleError);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('resize', onResize);

    return () => {
        disposed = true;
        observer.disconnect();
        document.removeEventListener('visibilitychange', updateVisibility);
        reportSceneFPS('model', null);
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('resize', onResize);
        void ready.then(() => workerApi.cleanup()).catch(() => {}).finally(() => {
          workerApi[releaseProxy]();
          worker.terminate();
        });
        canvas.remove();
    };
  }, [tier]);

  return (
    <div 
      ref={containerRef} 
      id="3dmodal"
      className={styles.modal3D} 
      aria-label="Interactive 3D floating animation"
      role="img"
    />
  );
}

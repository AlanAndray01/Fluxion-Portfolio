import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { getActivePreset, QUALITY_UPDATED } from './deviceConfig';

/** Numeric scrub must drive an animation; ScrollTrigger.onUpdate alone has no smoothing. */
export function createQualityScroll(vars: ScrollTrigger.Vars, update: (progress: number) => void) {
  const proxy = { progress: 0 };
  const animation = gsap.to(proxy, {
    progress: 1, duration: 1, ease: 'none', paused: true,
    onUpdate: () => update(proxy.progress),
  });
  const trigger = ScrollTrigger.create({ ...vars, animation, scrub: getActivePreset().gsapScrubValue });
  const applyQuality = () => {
    const duration = getActivePreset().gsapScrubValue;
    trigger.vars.scrub = duration;
    // GSAP exposes this method at runtime; its bundled declarations omit it.
    (trigger as ScrollTrigger & { scrubDuration(value: number): void }).scrubDuration(duration);
  };
  window.addEventListener(QUALITY_UPDATED, applyQuality);
  return () => {
    window.removeEventListener(QUALITY_UPDATED, applyQuality);
    trigger.kill();
    animation.kill();
  };
}

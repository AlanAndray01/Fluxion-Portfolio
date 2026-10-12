'use client';

/**
 * AboutSection.tsx
 *
 * HOW THE BUBBLE JOURNEY WORKS
 * ─────────────────────────────
 * 1. A `position:fixed` div (.bubble-traveller) is placed at the centre of
 *    the hero canvas (#webgl), sized like a medium hero sphere (~80px).
 *
 * 2. A GSAP ScrollTrigger with `scrub: true` ties the bubble's motion
 *    entirely to the scroll position between:
 *      start: "top bottom"  (about section enters viewport bottom)
 *      end:   "top 20%"     (about section almost at top)
 *
 *    During that scroll range the traveller:
 *      • fades in
 *      • moves from hero-canvas coordinates → anchor coordinates
 *      • GROWS from 80px → 320px  (the key scale-up effect)
 *      • follows a gentle arc (y dips then rises via a separate tween)
 *
 * 3. When the scrub completes (progress = 1) the traveller fades out,
 *    the DOM-positioned .bubble-landed snaps in, and the profile image
 *    cross-fades through the blue sphere.
 *
 * 4. Text column animates in with staggered children once landing is done.
 */

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { createQualityScroll } from '@/utils/qualityScroll';
import './AboutSection.css';



gsap.registerPlugin(ScrollTrigger);

// ─── Data ──────────────────────────────────────────────────────────────────
const SKILLS = [
  'React / Next.js',
  'TypeScript',
  'Node.js',
  'Three.js / WebGL',
  'PostgreSQL',
  'REST & GraphQL',
  'Tailwind CSS',
  'Docker / CI',
  'GSAP',
];

// ─── Helper: get a point inside the hero canvas (where the balls cluster) ──
function getHeroSpawnPoint(): { x: number; y: number } {
  const canvas = document.querySelector<HTMLCanvasElement>('#webgl');
  if (canvas) {
    const r = canvas.getBoundingClientRect();
    // Pick a point roughly where the big cluster sits — centre-slightly-right
    return {
      x: r.left + r.width  * 0.52,
      y: r.top  + r.height * 0.46,
    };
  }
  // Fallback: viewport centre
  return { x: window.innerWidth / 2, y: window.innerHeight * 0.42 };
}

// ─── Helper: get the centre of the bubble anchor in the about section ───────
function getAnchorCentre(anchor: HTMLElement, bubbleSize: number): { x: number; y: number } {
  const r = anchor.getBoundingClientRect();
  return {
    x: r.left + r.width  / 2 - bubbleSize / 2,
    y: r.top  + r.height / 2 - bubbleSize / 2,
  };
}

// ─── Component ─────────────────────────────────────────────────────────────
export default function AboutSection() {
  const sectionRef  = useRef<HTMLElement>(null);
  const travRef     = useRef<HTMLDivElement>(null);
  const landedRef   = useRef<HTMLDivElement>(null);
  const anchorRef   = useRef<HTMLDivElement>(null);
  const textColRef  = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);
  const hasLanded   = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const traveller = travRef.current!;
    const landed    = landedRef.current!;
    const anchor    = anchorRef.current!;
    const section   = sectionRef.current!;
    const textCol   = textColRef.current!;

    // ── Size constants ──────────────────────────────────────────────────
    // ─── Helper: get responsive ball sizes based on screen width ──────────
    const getResponsiveBallSizes = () => {
      const width = window.innerWidth;
      let startSize = 82;   // Desktop hero sphere base
      let endSize = 320;    // Desktop landing bubble
      
      if (width < 480) {
        // Mobile: small phones
        startSize = 50;   // 82 * 0.6 (hero scale)
        endSize = 200;    // mobile bubble landing size
      } else if (width < 768) {
        // Mobile: larger phones
        startSize = 70;   // 82 * 0.85 (hero scale)
        endSize = 200;    // mobile bubble landing size
      } else if (width < 900) {
        // Tablet
        startSize = 80;   // 82 * 0.95 (hero scale)
        endSize = 260;    // tablet bubble landing size
      } else if (width < 1024) {
        // Larger tablet
        startSize = 80;
        endSize = 260;
      }
      
      return { startSize, endSize };
    };

    const { startSize: START_SIZE, endSize: END_SIZE } = getResponsiveBallSizes();

    // ── Seed the traveller at hero position, tiny, invisible ─────────────
    const spawn = getHeroSpawnPoint();

    // Centre the bubble on the spawn point
    gsap.set(traveller, {
      width:   START_SIZE,
      height:  START_SIZE,
      left:    spawn.x - START_SIZE / 2,
      top:     spawn.y - START_SIZE / 2,
      opacity: 0,
      borderRadius: '50%',
    });

    // ── ScrollTrigger: scrub bubble travel to scroll position ─────────────
    // We use a proxy object so we can interpolate all values together

    // Snapshot destination once (recomputed on resize)
    let dest = getAnchorCentre(anchor, END_SIZE);
    let currentStartSize = START_SIZE;
    let currentEndSize = END_SIZE;

    // Recompute on resize
    const onResize = () => {
      const { startSize, endSize } = getResponsiveBallSizes();
      currentStartSize = startSize;
      currentEndSize = endSize;
      dest = getAnchorCentre(anchor, currentEndSize);
    };
    window.addEventListener('resize', onResize);

    const disposeScroll = createQualityScroll({
      trigger: section,
      start:   'top bottom',    // traveller starts moving when about enters viewport
      end:     'top 18%',       // fully landed when about section is near top
      onLeaveBack() {
        gsap.to(traveller, { opacity: 0, duration: 0.3 });
      },
    }, (p) => {

        // Recalculate dest each frame (handles slow reflows)
        dest = getAnchorCentre(anchor, currentEndSize);
        const spawnNow = getHeroSpawnPoint();

        // Interpolated size
        const size = gsap.utils.interpolate(currentStartSize, currentEndSize, p);

        // Interpolated position (centred)
        const x = gsap.utils.interpolate(
          spawnNow.x - currentStartSize / 2,
          dest.x,
          p
        );

        // Arc: Y goes slightly UP in the middle then comes back down
        // We use a parabola: mid-point lifts by arcHeight px
        // Reduced arc to keep bubble within landing container bounds
        const arcHeight = 30;
        const yLinear = gsap.utils.interpolate(
          spawnNow.y - currentStartSize / 2,
          dest.y,
          p
        );
        const arcOffset = arcHeight * 4 * p * (1 - p); // parabola peak at p=0.5
        const y = yLinear - arcOffset;

        // Opacity: fade in fast at start, stay solid until 98%, then instant hide
        let opacity;
        if (p < 0.98) {
          opacity = Math.min(1, p * 5);
        } else {
          opacity = 0; // Instant disappear at destination
        }

        // Apply all at once
        gsap.set(traveller, {
          width:   size,
          height:  size,
          left:    x,
          top:     y,
          opacity: opacity,
          // Slightly spin while travelling
          rotation: p * 25,
        });

        // ── When fully arrived → swap traveller for landed bubble ──────
        if (p >= 0.98 && !hasLanded.current) {
          hasLanded.current = true;
          triggerLanding();
        }

        // ── If user scrolls back, reset landing state ──────────────────
        if (p < 0.9 && hasLanded.current) {
          hasLanded.current = false;
          // Hide landed, show traveller
          gsap.set(landed, { opacity: 0, scale: 0.88 });
          landed.classList.remove('is-floating', 'show-image');
          document.querySelectorAll<HTMLElement>('.bubble-halo')
            .forEach(h => h.classList.remove('is-visible'));
          gsap.set(textCol, { opacity: 0, x: 50 });
          document.querySelectorAll<HTMLElement>('.skill-pill')
            .forEach(pill => gsap.set(pill, { opacity: 0, y: 10 }));
        }
    });

    // ── Landing sequence — called once traveller reaches destination ──────
    function triggerLanding() {
      // Instantly show the landed bubble (no animation)
      gsap.set(landed, {
        opacity: 1,
        scale: 1,
      });
      
      landed.classList.add('is-floating');
      document.querySelectorAll<HTMLElement>('.bubble-halo')
        .forEach(h => h.classList.add('is-visible'));
      
      // Show profile image immediately
      landed.classList.add('show-image');

      // Animate text column
      const tl = gsap.timeline();
      
      tl.to(textCol, {
        opacity:  1,
        x:        0,
        duration: 0.85,
        ease:    'power3.out',
      });

      // Stagger text children
      tl.fromTo(
        Array.from(textCol.children),
        { opacity: 0, y: 20 },
        {
          opacity:  1,
          y:        0,
          duration: 0.5,
          stagger:  0.07,
          ease:    'power2.out',
          clearProps: 'all',
        },
        '-=0.6'
      );

      // Cascade skill pills
      tl.fromTo(
        '.skill-pill',
        { opacity: 0, y: 12, scale: 0.85 },
        {
          opacity:  1,
          y:        0,
          scale:    1,
          duration: 0.38,
          stagger:  0.042,
          ease:    'back.out(1.7)',
        },
        '-=0.35'
      );
    }

    // ── REMOVED: Parallax movement that pushed bubble down ────────────────
    // The bubble now stays locked in position after landing
    // No scroll-based movement applied to the anchor

    // ── Magnetic hover ────────────────────────────────────────────────────
    const onMouseMove = (e: MouseEvent) => {
      // Only apply magnetic effect before image lands
      if (hasLanded.current) return;
      
      const r   = anchor.getBoundingClientRect();
      const cx  = r.left + r.width  / 2;
      const cy  = r.top  + r.height / 2;
      const dx  = (e.clientX - cx) / (r.width  / 2);
      const dy  = (e.clientY - cy) / (r.height / 2);
      if (Math.sqrt(dx * dx + dy * dy) < 1.8) {
        gsap.to(anchor, {
          x:        dx * 20,
          y:        dy * 20,
          rotateX: -dy * 11,
          rotateY:  dx * 11,
          duration: 0.45,
          ease:    'power2.out',
        });
      }
    };

    const onMouseLeave = () => {
      gsap.to(anchor, {
        x: 0, y: 0, rotateX: 0, rotateY: 0,
        duration: 0.9,
        ease: 'elastic.out(1, 0.55)',
      });
    };

    section.addEventListener('mousemove', onMouseMove);
    section.addEventListener('mouseleave', onMouseLeave);

    return () => {
      window.removeEventListener('resize', onResize);
      section.removeEventListener('mousemove', onMouseMove);
      section.removeEventListener('mouseleave', onMouseLeave);
      disposeScroll();
      initialized.current = false;
      hasLanded.current = false;
    };
  }, []);

  return (
    <>
      {/* ── FIXED TRAVELLING BUBBLE — outside section flow ── */}
      <div
        className="bubble-traveller"
        ref={travRef}
        aria-hidden="true"
      />

      {/* ── ABOUT SECTION ── */}
      <section className="about-section" ref={sectionRef} id="about">
        <div className="about-inner">

          {/* LEFT — bubble landing zone */}
          <div className="about-image-col">
            <div className="bubble-anchor" ref={anchorRef}>
              {/* Halo rings (invisible until landing) */}
              <div className="bubble-halo" aria-hidden="true" />
              <div className="bubble-halo" aria-hidden="true" />
              <div className="bubble-halo" aria-hidden="true" />

              {/* DOM-positioned resting bubble */}
              <div className="bubble-landed" ref={landedRef}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/profile.jpeg"
                  alt="Profile photo"
                  draggable={false}
                  loading="lazy"
                />
              </div>
            </div>
          </div>

          {/* RIGHT — text */}
          <div className="about-text-col" ref={textColRef}>

            <div className="about-tag">
              <div className="h5-style">Full Stack Developer</div>
              <div className="h6-style">Design &amp; Engineering</div>
              <div className="about-tag-line" />
            </div>

            <h2 className="about-name">
              Arslan
              <span className="about-name-accent">Shah</span>
            </h2>

            <p className="about-role">
              Creative Technologist &amp; WebGL Engineer
            </p>

            <p className="about-description">
              I build immersive digital experiences at the intersection of
              engineering and art. From performant full-stack applications to
              real-time 3D interfaces — I turn complex ideas into elegant,
              interactive realities that feel alive.
            </p>

            <p className="about-skills-label">Technologies</p>
            <div className="about-skills" role="list">
              {SKILLS.map(skill => (
                <div className="skill-pill" key={skill} role="listitem">
                  {skill}
                </div>
              ))}
            </div>

          </div>
        </div>

        {/* Hero-style vertical side text */}
        <span className="about-side-text" aria-hidden="true">
          Scroll to explore
        </span>

        {/* Hero-style large index number */}
        <span className="about-index" aria-hidden="true"> 02</span>
      </section>
    </>
  );
}

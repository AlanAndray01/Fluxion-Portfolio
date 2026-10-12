/** Samples completed render frames, discarding pauses rather than counting them as slow frames. */
export class FrameRateSampler {
  private start: number | null = null;
  private previous: number | null = null;
  private frames = 0;

  reset() {
    this.start = this.previous = null;
    this.frames = 0;
  }

  frame(now: number): number | null {
    if (this.start === null || this.previous === null || now - this.previous > 1000) {
      this.start = this.previous = now;
      this.frames = 0;
      return null;
    }
    this.previous = now;
    this.frames++;
    const elapsed = now - this.start;
    if (elapsed < 1000) return null;
    const fps = this.frames * 1000 / elapsed;
    this.start = now;
    this.frames = 0;
    return fps;
  }
}

type Tier = 'LOW' | 'MEDIUM' | 'HIGH';

/** Only step down after warmup and sustained pressure. Never override a manual choice. */
export class AdaptiveQualityPolicy {
  private warmupUntil = 0;
  private slowSince: number | null = null;
  private previous: number | null = null;

  reset(now: number) {
    this.warmupUntil = now + 8000;
    this.slowSince = this.previous = null;
  }

  sample(fps: number, now: number, tier: Tier, manual: boolean): Tier | null {
    const gap = this.previous !== null && now - this.previous > 2500;
    this.previous = now;
    if (gap) this.reset(now);
    if (!Number.isFinite(fps) || fps <= 0 || manual || tier === 'LOW' || now < this.warmupUntil || fps >= 35) {
      this.slowSince = null;
      return null;
    }
    this.slowSince ??= now;
    if (now - this.slowSince < 5000) return null;
    this.reset(now);
    this.warmupUntil = now + 15000;
    return tier === 'HIGH' ? 'MEDIUM' : 'LOW';
  }
}

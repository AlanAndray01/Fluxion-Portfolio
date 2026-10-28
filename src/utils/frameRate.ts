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

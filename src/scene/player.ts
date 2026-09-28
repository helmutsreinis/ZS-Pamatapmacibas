import { clamp } from './math';

export type PlayerState = {
  time: number;
  playing: boolean;
  /** True while moving towards a target (next, previous, play). */
  animating: boolean;
  speed: number;
};

type PlayerOptions = {
  length: number;
  /** Seconds that segment `index` takes at 1× speed. */
  durationOf: (index: number) => number;
  onFrame: (time: number) => void;
  onChange: (state: PlayerState) => void;
  reducedMotion: boolean;
};

const HOLD = 0.6;          // pause between steps while playing everything
const REWIND_SPEED = 3;    // stepping back is quicker than stepping forward

/** Moves a timeline position towards a target at the speed of each segment. */
export class Player {
  private time = 0;
  private target: number | null = null;
  private playing = false;
  private hold = 0;
  private speed = 1;
  private frame = 0;
  private last = 0;
  private lastIndex = -1;

  constructor(private readonly options: PlayerOptions) {
    this.loop = this.loop.bind(this);
    this.frame = requestAnimationFrame(this.loop);
  }

  get state(): PlayerState {
    return { time: this.time, playing: this.playing, animating: this.target !== null, speed: this.speed };
  }

  destroy(): void {
    cancelAnimationFrame(this.frame);
  }

  setSpeed(speed: number): void {
    this.speed = speed;
    this.emit();
  }

  /** Jump without animation (scrubber, mode change). */
  seek(time: number): void {
    this.time = clamp(time, 0, this.options.length);
    this.target = null;
    this.playing = false;
    this.emit();
    this.options.onFrame(this.time);
  }

  play(): void {
    if (this.time >= this.options.length - 1e-6) this.seek(0);
    this.playing = true;
    this.target = this.nextStop();
    this.emit();
  }

  pause(): void {
    this.playing = false;
    // Finish the step in progress so the scene never rests half-way through a movement.
    if (this.target !== null) this.target = Math.ceil(this.time - 1e-6);
    this.emit();
  }

  toggle(): void {
    if (this.playing) this.pause(); else this.play();
  }

  next(): void {
    this.playing = false;
    this.target = Math.min(this.options.length, Math.floor(this.time + 1e-6) + 1);
    this.emit();
  }

  previous(): void {
    this.playing = false;
    this.target = Math.max(0, Math.ceil(this.time - 1e-6) - 1);
    this.emit();
  }

  /** Show segment `index` from its start: short hops animate, long jumps cut straight to it. */
  playSegment(index: number): void {
    this.playing = false;
    const start = clamp(index, 0, this.options.length - 1);
    if (Math.abs(this.time - start) > 1.01) this.time = start;
    this.target = start + 1;
    if (this.time > start) this.time = start;
    this.emit();
  }

  private nextStop(): number {
    return Math.min(this.options.length, Math.floor(this.time + 1e-6) + 1);
  }

  private emit(): void {
    this.options.onChange(this.state);
  }

  private loop(now: number): void {
    const dt = this.last ? Math.min((now - this.last) / 1000, 0.1) : 0;
    this.last = now;
    if (this.target !== null) {
      if (this.options.reducedMotion) {
        this.time = this.target;
      } else if (this.hold > 0) {
        this.hold -= dt;
      } else {
        const forward = this.target > this.time;
        const index = Math.min(Math.floor(forward ? this.time + 1e-6 : this.time - 1e-6), this.options.length - 1);
        const rate = (forward ? this.speed : this.speed * REWIND_SPEED) / this.options.durationOf(Math.max(index, 0));
        const next = this.time + (forward ? 1 : -1) * rate * dt;
        this.time = forward ? Math.min(next, this.target) : Math.max(next, this.target);
      }
      if (Math.abs(this.time - this.target) < 1e-9) {
        this.time = this.target;
        if (this.playing && this.time < this.options.length) {
          this.target = this.nextStop();
          this.hold = this.options.reducedMotion ? 0 : HOLD;
          if (this.options.reducedMotion) this.pauseBriefly();
        } else {
          this.target = null;
          this.playing = false;
        }
        this.emit();
      }
    }
    const index = Math.ceil(this.time - 1e-6);
    if (index !== this.lastIndex) {
      this.lastIndex = index;
      this.emit();
    }
    this.options.onFrame(this.time);
    this.frame = requestAnimationFrame(this.loop);
  }

  /** With reduced motion, "play" still steps through the states, one every two seconds. */
  private pauseBriefly(): void {
    const target = this.target;
    this.target = null;
    window.setTimeout(() => {
      if (this.playing && target !== null) {
        this.target = target;
        this.emit();
      }
    }, 2000);
  }
}

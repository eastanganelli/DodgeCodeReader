/**
 * Turns a stream of brightness samples (one per video frame) into
 * two-digit flash codes.
 *
 * Chrysler flash-code protocol (as observed on the check-engine lamp):
 *   - blinks of one digit are separated by a short gap   (< digitGap)
 *   - digits of one code are separated by a medium gap   (digitGap .. codeGap)
 *   - codes are separated by a long gap                  (>= codeGap)
 */

export interface DecoderConfig {
  /** Gap (s) below which the next blink belongs to the same digit. */
  digitGap: number;
  /** Gap (s) at or above which the next blink starts a new code. */
  codeGap: number;
  /** Auto-adapt threshold to the brightness range seen. */
  autoThreshold: boolean;
  /** Manual threshold (0-255) when autoThreshold is false. */
  manualThreshold: number;
  /** Ignore ON/OFF changes shorter than this (s) – rejects flicker/noise. */
  minStateDuration: number;
}

export const DEFAULT_DECODER_CONFIG: DecoderConfig = {
  digitGap: 1.1,
  codeGap: 2.0,
  autoThreshold: true,
  manualThreshold: 128,
  minStateDuration: 0.06,
};

export interface Sample {
  time: number;
  brightness: number;
  threshold: number;
  state: 'on' | 'off';
}

export interface DecoderSnapshot {
  codes: number[];
  /** digits already completed for the code in progress */
  pendingDigits: number[];
  /** blinks counted for the digit in progress */
  currentCount: number;
  blinks: number;
  threshold: number;
}

const WINDOW_SECONDS = 5;
const MIN_RANGE = 10;
const HYSTERESIS = 0.08; // fraction of range
const SEPARATION = 4; // cluster gap must exceed this many pooled std devs

export class PulseDecoder {
  private cfg: DecoderConfig;
  private window: { t: number; b: number }[] = [];
  private threshold: number;
  private range = 0;
  private hasSignal = false;

  private stableState: 'on' | 'off' = 'off';
  private candidateState: 'on' | 'off' = 'off';
  private candidateSince = 0;

  private lastPulseEnd = -1;
  private currentCount = 0;
  private pendingDigits: number[] = [];
  private codes: number[] = [];
  private blinks = 0;

  constructor(cfg: Partial<DecoderConfig> = {}) {
    this.cfg = { ...DEFAULT_DECODER_CONFIG, ...cfg };
    this.threshold = this.cfg.manualThreshold;
  }

  push(time: number, brightness: number): Sample {
    this.updateThreshold(time, brightness);

    const band = this.cfg.autoThreshold ? this.range * HYSTERESIS : 2;
    let raw: 'on' | 'off' = this.candidateState;
    if (brightness > this.threshold + band / 2) raw = 'on';
    else if (brightness < this.threshold - band / 2) raw = 'off';

    if (raw !== this.candidateState) {
      this.candidateState = raw;
      this.candidateSince = time;
    }

    // Debounce: accept the candidate once it has held long enough.
    // The transition time is the moment the candidate first appeared.
    if (this.candidateState !== this.stableState &&
        time - this.candidateSince >= this.cfg.minStateDuration - 1e-9) {
      this.onTransition(this.candidateState, this.candidateSince);
      this.stableState = this.candidateState;
    }

    return { time, brightness, threshold: this.threshold, state: this.stableState };
  }

  /** Call when the stream ends. Flushes the code in progress. */
  finish(): DecoderSnapshot {
    this.finalizeDigit();
    this.finalizeCode();
    return this.snapshot();
  }

  snapshot(): DecoderSnapshot {
    return {
      codes: [...this.codes],
      pendingDigits: [...this.pendingDigits],
      currentCount: this.currentCount,
      blinks: this.blinks,
      threshold: this.threshold,
    };
  }

  private updateThreshold(time: number, b: number) {
    if (!this.cfg.autoThreshold) {
      this.threshold = this.cfg.manualThreshold;
      return;
    }
    this.window.push({ t: time, b });
    while (this.window.length && time - this.window[0].t > WINDOW_SECONDS) this.window.shift();
    if (this.window.length < 5) return;

    let min = Infinity, max = -Infinity;
    for (const s of this.window) { if (s.b < min) min = s.b; if (s.b > max) max = s.b; }
    const range = max - min;
    if (range < MIN_RANGE) return;

    const mid = min + range * 0.5;
    // Bimodality check: a real lamp gives two well-separated clusters;
    // plain sensor/compression noise does not.
    let nLo = 0, nHi = 0, sLo = 0, sHi = 0, qLo = 0, qHi = 0;
    for (const s of this.window) {
      if (s.b < mid) { nLo++; sLo += s.b; qLo += s.b * s.b; }
      else { nHi++; sHi += s.b; qHi += s.b * s.b; }
    }
    if (nLo < 2 || nHi < 2) return;
    const mLo = sLo / nLo, mHi = sHi / nHi;
    const varLo = qLo / nLo - mLo * mLo, varHi = qHi / nHi - mHi * mHi;
    const pooled = Math.sqrt(Math.max(0, (varLo * nLo + varHi * nHi) / (nLo + nHi)));
    if (mHi - mLo < SEPARATION * pooled) return;

    const target = (mLo + mHi) / 2;
    if (!this.hasSignal) {
      this.threshold = target;
      this.hasSignal = true;
    } else {
      this.threshold = this.threshold * 0.9 + target * 0.1;
    }
    this.range = range;
  }

  private onTransition(state: 'on' | 'off', at: number) {
    if (state === 'on') {
      this.blinks++;
      if (this.lastPulseEnd < 0) {
        this.currentCount = 1;
        return;
      }
      const gap = at - this.lastPulseEnd;
      if (gap < this.cfg.digitGap) {
        this.currentCount++;
      } else if (gap < this.cfg.codeGap) {
        this.finalizeDigit();
        this.currentCount = 1;
      } else {
        this.finalizeDigit();
        this.finalizeCode();
        this.currentCount = 1;
      }
    } else {
      this.lastPulseEnd = at;
    }
  }

  private finalizeDigit() {
    if (this.currentCount > 0) {
      this.pendingDigits.push(this.currentCount);
      this.currentCount = 0;
      if (this.pendingDigits.length >= 2) this.finalizeCode();
    }
  }

  private finalizeCode() {
    if (this.pendingDigits.length === 0) return;
    const [d1, d2 = 0] = this.pendingDigits;
    this.codes.push(d1 * 10 + d2);
    this.pendingDigits = [];
  }
}

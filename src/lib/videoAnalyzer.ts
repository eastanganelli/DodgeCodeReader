import { PulseDecoder, DecoderConfig, Sample, DecoderSnapshot } from './pulseDecoder';

/** Region in normalized video coordinates (0..1). */
export interface Region { x: number; y: number; w: number; h: number; }

const SAMPLE_SIZE = 32;

function seek(video: HTMLVideoElement, time: number): Promise<void> {
  return new Promise((resolve) => {
    if (Math.abs(video.currentTime - time) < 1e-4 && video.readyState >= 2) return resolve();
    const done = () => { clearTimeout(timer); video.removeEventListener('seeked', done); resolve(); };
    const timer = setTimeout(done, 3000);
    video.addEventListener('seeked', done);
    video.currentTime = time;
  });
}

function luma(d: ArrayLike<number>, i: number) {
  return 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
}

/**
 * Brightness of a region: mean of the brightest quarter of pixels.
 * Robust when the lamp is small inside a large box.
 */
export function regionBrightness(ctx: CanvasRenderingContext2D, video: HTMLVideoElement, r: Region): number {
  const vw = video.videoWidth, vh = video.videoHeight;
  const sx = Math.max(0, r.x * vw), sy = Math.max(0, r.y * vh);
  const sw = Math.max(1, Math.min(vw - sx, r.w * vw)), sh = Math.max(1, Math.min(vh - sy, r.h * vh));
  ctx.drawImage(video, sx, sy, sw, sh, 0, 0, SAMPLE_SIZE, SAMPLE_SIZE);
  return topQuartileLuma(ctx.getImageData(0, 0, SAMPLE_SIZE, SAMPLE_SIZE).data);
}

/** Mean luma of the brightest 25% of pixels in an RGBA buffer. */
export function topQuartileLuma(d: Uint8ClampedArray | Uint8Array): number {
  const vals = new Float32Array(d.length / 4);
  for (let i = 0, j = 0; i < d.length; i += 4, j++) vals[j] = luma(d, i);
  vals.sort();
  const from = Math.floor(vals.length * 0.75);
  let sum = 0;
  for (let i = from; i < vals.length; i++) sum += vals[i];
  return sum / (vals.length - from);
}

/**
 * Accumulates downscaled RGBA frames and finds the spot whose brightness
 * changes most over time (the blinking lamp).
 */
export class BlinkLocator {
  private sum: Float64Array;
  private sq: Float64Array;
  private count = 0;
  constructor(readonly gw: number, readonly gh: number) {
    this.sum = new Float64Array(gw * gh);
    this.sq = new Float64Array(gw * gh);
  }
  addFrame(d: Uint8ClampedArray | Uint8Array) {
    const n = this.gw * this.gh;
    for (let i = 0, j = 0; j < n; i += 4, j++) { const l = luma(d, i); this.sum[j] += l; this.sq[j] += l * l; }
    this.count++;
  }
  /** Center of the strongest blinking spot in normalized coords, or null. */
  result(minStd = 12): { cx: number; cy: number } | null {
    const { gw, gh, count } = this;
    if (count < 2) return null;
    const n = gw * gh, std = new Float64Array(n);
    for (let j = 0; j < n; j++) { const m = this.sum[j] / count; std[j] = Math.sqrt(Math.max(0, this.sq[j] / count - m * m)); }
    // 3x3 box blur favours solid blobs over single noisy pixels
    let best = -1, bx = 0, by = 0;
    for (let y = 1; y < gh - 1; y++) for (let x = 1; x < gw - 1; x++) {
      let s = 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) s += std[(y + dy) * gw + x + dx];
      if (s > best) { best = s; bx = x; by = y; }
    }
    if (best / 9 < minStd) return null;
    return { cx: (bx + 0.5) / gw, cy: (by + 0.5) / gh };
  }
}

function makeCtx(w: number, h: number) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Canvas 2D not available');
  return ctx;
}

/**
 * Locate the blinking lamp: the spot whose brightness changes most over time.
 * Returns null when nothing in the video blinks clearly.
 */
export async function findBlinkingLight(
  video: HTMLVideoElement,
  start: number,
  end: number,
  onProgress?: (p: number) => void,
  signal?: AbortSignal,
): Promise<Region | null> {
  const GW = 96;
  const GH = Math.max(1, Math.round(GW * video.videoHeight / video.videoWidth));
  const ctx = makeCtx(GW, GH);
  const locator = new BlinkLocator(GW, GH);
  const span = Math.min(end - start, 30);
  const FRAMES = 60;

  for (let k = 0; k < FRAMES; k++) {
    if (signal?.aborted) return null;
    await seek(video, start + (span * k) / FRAMES);
    ctx.drawImage(video, 0, 0, GW, GH);
    locator.addFrame(ctx.getImageData(0, 0, GW, GH).data);
    onProgress?.((k + 1) / FRAMES);
  }

  const spot = locator.result();
  if (!spot) return null;
  return regionAround(spot.cx, spot.cy, video.videoWidth / video.videoHeight);
}

/** Square-ish box (12% of width) centred on a normalized point. */
export function regionAround(cx: number, cy: number, aspect: number, size = 0.12): Region {
  const w = size, h = Math.min(1, size * aspect);
  return clampRegion({ x: cx - w / 2, y: cy - h / 2, w, h });
}

export function clampRegion(r: Region): Region {
  const w = Math.min(1, Math.max(0.02, r.w)), h = Math.min(1, Math.max(0.02, r.h));
  return { x: Math.min(1 - w, Math.max(0, r.x)), y: Math.min(1 - h, Math.max(0, r.y)), w, h };
}

export interface AnalyzeOptions {
  region: Region;
  start: number;
  end: number;
  fps?: number;
  decoder?: Partial<DecoderConfig>;
  signal?: AbortSignal;
  onProgress?: (p: number, sample: Sample, snap: DecoderSnapshot) => void;
}

export async function analyzeVideo(video: HTMLVideoElement, o: AnalyzeOptions): Promise<{ snapshot: DecoderSnapshot; samples: Sample[] }> {
  const ctx = makeCtx(SAMPLE_SIZE, SAMPLE_SIZE);
  const decoder = new PulseDecoder(o.decoder);
  const step = 1 / (o.fps ?? 30);
  const samples: Sample[] = [];
  const total = Math.max(step, o.end - o.start);
  video.pause();

  for (let t = o.start; t <= o.end + 1e-6; t += step) {
    if (o.signal?.aborted) break;
    await seek(video, t);
    const s = decoder.push(t, regionBrightness(ctx, video, o.region));
    samples.push(s);
    // throttle UI updates
    if (samples.length % 3 === 0) o.onProgress?.((t - o.start) / total, s, decoder.snapshot());
  }
  const snapshot = decoder.finish();
  o.onProgress?.(1, samples[samples.length - 1], snapshot);
  return { snapshot, samples };
}

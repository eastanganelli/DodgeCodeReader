/**
 * Runs the full pipeline (locate lamp -> measure -> decode -> report) on a real
 * video file, using ffmpeg to decode frames instead of the browser.
 *
 *   FIXTURE_VIDEO=/path/to/clip.mp4 [EXPECT_CODES=12,43,55] npm test
 *
 * Skipped when FIXTURE_VIDEO is not set.
 */
import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import { BlinkLocator, regionAround, topQuartileLuma } from './videoAnalyzer';
import { PulseDecoder } from './pulseDecoder';
import { buildReport, reportToText } from './report';

const VIDEO = process.env.FIXTURE_VIDEO;

function probe(file: string) {
  const out = execFileSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries',
    'stream=width,height', '-show_entries', 'format=duration', '-of', 'json', file]).toString();
  const j = JSON.parse(out);
  return { w: j.streams[0].width as number, h: j.streams[0].height as number, duration: +j.format.duration };
}

function frames(file: string, vf: string, w: number, h: number): Uint8Array[] {
  const buf = execFileSync('ffmpeg', ['-v', 'error', '-i', file, '-vf', vf, '-f', 'rawvideo', '-pix_fmt', 'rgba', '-'],
    { maxBuffer: 1 << 30 });
  const size = w * h * 4, out: Uint8Array[] = [];
  for (let o = 0; o + size <= buf.length; o += size) out.push(buf.subarray(o, o + size));
  return out;
}

describe.skipIf(!VIDEO)('pipeline on real video', () => {
  it('finds the lamp and decodes codes', () => {
    const file = VIDEO!;
    const { w, h, duration } = probe(file);
    const GW = 96, GH = Math.round(GW * h / w);
    const span = Math.min(duration, 30);
    const loc = new BlinkLocator(GW, GH);
    for (const f of frames(file, `trim=0:${span},fps=${60 / span},scale=${GW}:${GH}`, GW, GH)) loc.addFrame(f);
    const spot = loc.result();
    expect(spot).not.toBeNull();
    const r = regionAround(spot!.cx, spot!.cy, w / h);
    console.log('lamp region', r);

    const cw = Math.round(r.w * w), ch = Math.round(r.h * h), cx = Math.round(r.x * w), cy = Math.round(r.y * h);
    const dec = new PulseDecoder();
    const fs = frames(file, `fps=30,crop=${cw}:${ch}:${cx}:${cy},scale=32:32`, 32, 32);
    fs.forEach((f, i) => dec.push(i / 30, topQuartileLuma(f)));
    const { codes } = dec.finish();
    console.log('codes', codes.join(' '));
    console.log(reportToText(buildReport(codes), 'en'));
    if (process.env.EXPECT_CODES) expect(codes).toEqual(process.env.EXPECT_CODES.split(',').map(Number));
  }, 300_000);
});

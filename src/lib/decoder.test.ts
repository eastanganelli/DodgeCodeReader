import { describe, it, expect } from 'vitest';
import { PulseDecoder } from './pulseDecoder';
import { buildReport, reportToText } from './report';

/** Build a synthetic lamp signal for a list of codes. */
function synth(codes: number[], opts: { fps?: number; noise?: number; on?: number; off?: number; flicker?: boolean } = {}) {
  const { fps = 30, noise = 6, on = 0.3, off = 0.4, flicker = false } = opts;
  const DIGIT_GAP = 1.5, CODE_GAP = 3.0, LEAD = 2.0;
  const segments: { state: boolean; dur: number }[] = [{ state: false, dur: LEAD }];
  codes.forEach((code, ci) => {
    const digits = [Math.floor(code / 10), code % 10];
    digits.forEach((d, di) => {
      for (let i = 0; i < d; i++) {
        segments.push({ state: true, dur: on });
        if (i < d - 1) segments.push({ state: false, dur: off });
      }
      if (di === 0) segments.push({ state: false, dur: DIGIT_GAP });
    });
    segments.push({ state: false, dur: ci === codes.length - 1 ? 2 : CODE_GAP });
  });

  let seed = 42;
  const rand = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
  const samples: [number, number][] = [];
  let t = 0;
  for (const seg of segments) {
    const end = t + seg.dur;
    while (t < end - 1e-9) {
      let b = (seg.state ? 200 : 40) + (rand() - 0.5) * noise;
      if (flicker && !seg.state && rand() < 0.02) b = 210; // single-frame glare
      samples.push([t, b]);
      t += 1 / fps;
    }
  }
  return samples;
}

function decode(samples: [number, number][]) {
  const d = new PulseDecoder();
  for (const [t, b] of samples) d.push(t, b);
  return d.finish().codes;
}

describe('PulseDecoder', () => {
  it('decodes a typical sequence', () => {
    expect(decode(synth([12, 43, 55]))).toEqual([12, 43, 55]);
  });

  it('decodes at low frame rate (15 fps)', () => {
    expect(decode(synth([21, 55], { fps: 15 }))).toEqual([21, 55]);
  });

  it('rejects single-frame glare', () => {
    expect(decode(synth([24, 51, 55], { flicker: true }))).toEqual([24, 51, 55]);
  });

  it('handles noisy signal', () => {
    expect(decode(synth([11, 64, 55], { noise: 30 }))).toEqual([11, 64, 55]);
  });
});

describe('buildReport', () => {
  it('counts repeats, drops 55, sorts lamp-on first', () => {
    const r = buildReport([12, 43, 33, 43, 55, 12, 43, 33, 55]);
    expect(r.endMarkerSeen).toBe(true);
    expect(r.noFaults).toBe(false);
    expect(r.entries.map(e => [e.code, e.count])).toEqual([[43, 3], [33, 2], [12, 2]]);
  });

  it('only 55 means no faults', () => {
    const r = buildReport([55]);
    expect(r.noFaults).toBe(true);
    expect(r.entries).toEqual([]);
  });

  it('nothing read is not "no faults"', () => {
    expect(buildReport([]).noFaults).toBe(false);
  });

  it('flags unknown codes', () => {
    const r = buildReport([99, 55]);
    expect(r.entries[0].severity).toBe('unknown');
    expect(reportToText(r, 'en')).toContain('Unknown code');
  });
});

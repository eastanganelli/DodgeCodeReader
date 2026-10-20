import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Camera, FolderOpen, Search, Play, X, ChevronRight, Trash2, Lightbulb } from 'lucide-react';
import { STRINGS, Lang, detectLang } from './i18n';
import { SettingsBar, TextSize, Theme } from './components/Settings';
import { VideoStage } from './components/VideoStage';
import { findBlinkingLight, analyzeVideo, Region } from './lib/videoAnalyzer';
import { DEFAULT_DECODER_CONFIG, DecoderSnapshot, Sample } from './lib/pulseDecoder';
import { buildReport } from './lib/report';
import { lookupCode } from './data/codes';
import { load, save, loadHistory, addHistory, clearHistory, HistoryItem } from './lib/storage';

// Results (with the chart library) loads on demand to keep the first screen light.
const Results = lazy(() => import('./components/Results').then(m => ({ default: m.Results })));

type Screen = 'home' | 'locate' | 'reading' | 'results';

export default function App() {
  // ---------- preferences ----------
  const [lang, setLangState] = useState<Lang>(() => load<Lang>('dcr.lang', detectLang()));
  const [size, setSizeState] = useState<TextSize>(() => load<TextSize>('dcr.size', 0));
  const [theme, setThemeState] = useState<Theme>(() =>
    load<Theme>('dcr.theme', window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));
  const setLang = (l: Lang) => { setLangState(l); save('dcr.lang', l); };
  const setSize = (s: TextSize) => { setSizeState(s); save('dcr.size', s); };
  const setTheme = (th: Theme) => { setThemeState(th); save('dcr.theme', th); };
  const t = STRINGS[lang];

  useEffect(() => {
    const el = document.documentElement;
    el.lang = lang;
    el.dataset.size = String(size);
    el.dataset.theme = theme;
    document.title = t.appName;
  }, [lang, size, theme, t]);

  // ---------- flow state ----------
  const [screen, setScreen] = useState<Screen>('home');
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoName, setVideoName] = useState('');
  const [aspect, setAspect] = useState(16 / 9);
  const [duration, setDuration] = useState(0);
  const [range, setRange] = useState<[number, number]>([0, 0]);
  const [region, setRegion] = useState<Region | null>(null);
  const [findState, setFindState] = useState<'idle' | 'finding' | 'found' | 'notfound'>('idle');
  const [findProgress, setFindProgress] = useState(0);

  const [autoSens, setAutoSens] = useState(true);
  const [manualThreshold, setManualThreshold] = useState(128);
  const [digitGap, setDigitGap] = useState(DEFAULT_DECODER_CONFIG.digitGap);
  const [codeGap, setCodeGap] = useState(DEFAULT_DECODER_CONFIG.codeGap);

  const [progress, setProgress] = useState(0);
  const [live, setLive] = useState<{ sample?: Sample; snap?: DecoderSnapshot }>({});
  const [result, setResult] = useState<{ codes: number[]; samples?: Sample[]; date: Date } | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>(() => loadHistory());

  const videoRef = useRef<HTMLVideoElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  // move focus to the new screen's heading for screen-reader & keyboard users
  useEffect(() => { headingRef.current?.focus(); }, [screen]);

  useEffect(() => () => { if (videoUrl) URL.revokeObjectURL(videoUrl); }, [videoUrl]);

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    abortRef.current?.abort();
    setVideoUrl(URL.createObjectURL(f));
    setVideoName(f.name);
    setRegion(null);
    setFindState('idle');
    setScreen('locate');
  };

  const runFind = useCallback(async (start: number, end: number) => {
    const v = videoRef.current;
    if (!v) return;
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    setFindState('finding');
    setFindProgress(0);
    try {
      const r = await findBlinkingLight(v, start, end, setFindProgress, ac.signal);
      if (ac.signal.aborted) return;
      setRegion(r);
      setFindState(r ? 'found' : 'notfound');
      v.currentTime = start;
    } catch {
      setFindState('notfound');
    }
  }, []);

  const onMeta = async (v: HTMLVideoElement) => {
    setAspect(v.videoWidth && v.videoHeight ? v.videoWidth / v.videoHeight : 16 / 9);
    const d = Number.isFinite(v.duration) ? v.duration : 0;
    setDuration(d);
    setRange([0, d]);
    // iOS Safari only decodes frames after playback has started once
    try { await v.play(); v.pause(); } catch { /* autoplay blocked; seeking still works elsewhere */ }
    runFind(0, d);
  };

  const startReading = async () => {
    const v = videoRef.current;
    if (!v || !region) return;
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    setScreen('reading');
    setProgress(0);
    setLive({});
    const { snapshot, samples } = await analyzeVideo(v, {
      region, start: range[0], end: range[1], signal: ac.signal,
      decoder: { autoThreshold: autoSens, manualThreshold, digitGap, codeGap },
      onProgress: (p, sample, snap) => { setProgress(p); setLive({ sample, snap }); },
    });
    if (ac.signal.aborted) return;
    const date = new Date();
    setResult({ codes: snapshot.codes, samples, date });
    setHistory(addHistory({ time: date.getTime(), codes: snapshot.codes, name: videoName }));
    setScreen('results');
  };

  const cancelReading = () => { abortRef.current?.abort(); setScreen('locate'); };

  const restart = () => {
    abortRef.current?.abort();
    setVideoUrl(null);
    setResult(null);
    setRegion(null);
    setScreen('home');
  };

  const showStage = !!videoUrl && (screen === 'locate' || screen === 'reading');
  const totalSteps = 3;
  const stepNo = screen === 'locate' ? 1 : screen === 'reading' ? 2 : 3;

  return (
    <div className="min-h-screen">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:p-3 focus:bg-surface">Skip</a>
      <header className="border-b border-line bg-surface no-print">
        <div className="max-w-3xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <button type="button" onClick={restart} className="flex items-center gap-3 text-left" aria-label={t.appName}>
            <span className="grid place-items-center w-11 h-11 rounded-xl bg-accent text-accent-ink" aria-hidden>
              <Lightbulb className="w-6 h-6" />
            </span>
            <span className="font-bold text-xl leading-tight">{t.appName}</span>
          </button>
          <SettingsBar t={t} lang={lang} setLang={setLang} size={size} setSize={setSize} theme={theme} setTheme={setTheme} />
        </div>
      </header>

      <main id="main" className="max-w-3xl mx-auto px-4 py-6 flex flex-col gap-5">
        {screen !== 'home' && screen !== 'results' && (
          <p className="text-ink-2 font-bold no-print" aria-live="polite">{t.step(stepNo, totalSteps)}</p>
        )}

        {/* ---------------- HOME ---------------- */}
        {screen === 'home' && (
          <>
            <div>
              <h1 ref={headingRef} tabIndex={-1} className="text-3xl sm:text-4xl font-bold leading-tight outline-none">{t.tagline}</h1>
            </div>

            <section className="card p-5" aria-labelledby="how-h">
              <h2 id="how-h" className="text-xl font-bold mb-3">{t.howTitle}</h2>
              <ol className="flex flex-col gap-3">
                {[t.how1, t.how2, t.how3].map((s, i) => (
                  <li key={i} className="flex gap-3 items-start">
                    <span className="grid place-items-center shrink-0 w-9 h-9 rounded-full bg-surface-2 font-bold" aria-hidden>{i + 1}</span>
                    <span className="pt-1">{s}</span>
                  </li>
                ))}
              </ol>
            </section>

            <div className="grid gap-3">
              <label className="big-choice bg-accent text-accent-ink">
                <Camera className="w-10 h-10 shrink-0" aria-hidden />
                <span className="flex-1"><span className="block text-2xl font-bold">{t.recordVideo}</span><span className="block">{t.recordHint}</span></span>
                <ChevronRight className="w-7 h-7" aria-hidden />
                <input type="file" accept="video/*" capture="environment" className="sr-only" onChange={onFile} />
              </label>
              <label className="big-choice card">
                <FolderOpen className="w-10 h-10 shrink-0" aria-hidden />
                <span className="flex-1"><span className="block text-2xl font-bold">{t.chooseVideo}</span><span className="block text-ink-2">{t.chooseHint}</span></span>
                <ChevronRight className="w-7 h-7" aria-hidden />
                <input type="file" accept="video/*" className="sr-only" onChange={onFile} />
              </label>
            </div>

            <section aria-labelledby="hist-h" className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h2 id="hist-h" className="text-xl font-bold">{t.history}</h2>
                {history.length > 0 && (
                  <button type="button" className="btn btn-ghost min-h-[2.75rem] py-1" onClick={() => setHistory(clearHistory())}>
                    <Trash2 className="w-4 h-4" aria-hidden />{t.clearHistory}
                  </button>
                )}
              </div>
              {history.length === 0 ? <p className="text-ink-2">{t.noHistory}</p> : (
                <ul className="flex flex-col gap-2">
                  {history.map(h => {
                    const r = buildReport(h.codes);
                    const faults = r.entries.filter(e => e.severity !== 'info');
                    return (
                      <li key={h.time}>
                        <button type="button" className="card w-full p-4 flex items-center gap-3 text-left hover:bg-surface-2"
                          onClick={() => { setResult({ codes: h.codes, date: new Date(h.time) }); setScreen('results'); }}>
                          <span className="flex-1 min-w-0">
                            <span className="block font-bold">{new Date(h.time).toLocaleString(lang === 'es' ? 'es-AR' : 'en-US')}</span>
                            <span className="block text-ink-2 truncate">
                              {r.noFaults ? t.noFaultsShort : `${t.codesFound(faults.length)}: ${faults.map(e => e.code).join(', ')}`}
                            </span>
                          </span>
                          <ChevronRight className="w-6 h-6 shrink-0" aria-hidden />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </>
        )}

        {/* ---------------- LOCATE (header) ---------------- */}
        {screen === 'locate' && (
          <div className="flex flex-col gap-2">
            <h1 ref={headingRef} tabIndex={-1} className="text-3xl font-bold outline-none">{t.locateTitle}</h1>
            <p className="text-lg font-bold" aria-live="polite">
              {findState === 'finding' && t.finding}
              {findState === 'found' && t.foundAsk}
              {findState === 'notfound' && !region && t.notFound}
              {findState === 'notfound' && region && t.foundAsk}
            </p>
            {findState === 'finding' && (
              <div className="progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(findProgress * 100)}>
                <div style={{ width: `${findProgress * 100}%` }} />
              </div>
            )}
          </div>
        )}

        {/* ---------------- READING (header) ---------------- */}
        {screen === 'reading' && (
          <div className="flex flex-col gap-3">
            <h1 ref={headingRef} tabIndex={-1} className="text-3xl font-bold outline-none">{t.readingTitle}</h1>
            <p className="text-ink-2">{t.readingHint}</p>
            <div className="progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress * 100)}>
              <div style={{ width: `${progress * 100}%` }} />
            </div>
            <p className="text-right font-bold tabular-nums">{Math.round(progress * 100)}%</p>
          </div>
        )}

        {/* ---------------- shared video ---------------- */}
        {videoUrl && (
          <VideoStage
            ref={videoRef}
            src={videoUrl}
            region={region}
            aspect={aspect}
            interactive={screen === 'locate' && findState !== 'finding'}
            hidden={!showStage}
            lit={screen === 'reading' && live.sample?.state === 'on'}
            label={t.tapHint}
            onRegion={r => { setRegion(r); if (findState === 'notfound' || findState === 'idle') setFindState('found'); }}
            onMeta={onMeta}
          />
        )}

        {/* ---------------- LOCATE (actions) ---------------- */}
        {screen === 'locate' && findState !== 'finding' && (
          <>
            <p className="text-ink-2">{t.tapHint}</p>
            <button type="button" className="btn btn-primary w-full text-xl min-h-[4rem]" disabled={!region} onClick={startReading}>
              <Play className="w-6 h-6" aria-hidden />{t.yesRead}
            </button>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button type="button" className="btn btn-secondary" onClick={() => runFind(range[0], range[1])}>
                <Search className="w-5 h-5" aria-hidden />{t.findAgain}
              </button>
              <button type="button" className="btn btn-ghost" onClick={restart}>{t.pickOther}</button>
            </div>

            <details className="card p-4">
              <summary className="cursor-pointer font-bold">{t.advanced}</summary>
              <div className="flex flex-col gap-5 mt-4">
                <Slider label={t.startAt} value={range[0]} min={0} max={duration} step={0.1} unit="s"
                  onChange={v => { setRange([v, Math.max(v, range[1])]); if (videoRef.current) videoRef.current.currentTime = v; }} />
                <Slider label={t.endAt} value={range[1]} min={0} max={duration} step={0.1} unit="s"
                  onChange={v => { setRange([Math.min(v, range[0]), v]); if (videoRef.current) videoRef.current.currentTime = v; }} />
                <label className="flex items-center gap-3 min-h-[2.75rem] cursor-pointer">
                  <input type="checkbox" className="w-6 h-6 accent-[var(--accent)]" checked={autoSens} onChange={e => setAutoSens(e.target.checked)} />
                  <span className="font-bold">{t.autoSens}</span>
                </label>
                {!autoSens && <Slider label={t.sensitivity} value={manualThreshold} min={0} max={255} step={1} onChange={setManualThreshold} />}
                <Slider label={t.digitGap} value={digitGap} min={0.4} max={3} step={0.1} unit="s" onChange={v => { setDigitGap(v); if (v >= codeGap) setCodeGap(+(v + 0.1).toFixed(1)); }} />
                <Slider label={t.codeGap} value={codeGap} min={0.6} max={6} step={0.1} unit="s" onChange={v => { setCodeGap(v); if (v <= digitGap) setDigitGap(+(v - 0.1).toFixed(1)); }} />
              </div>
            </details>
          </>
        )}

        {/* ---------------- READING (live) ---------------- */}
        {screen === 'reading' && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div className="card p-4 text-center">
                <p className="text-ink-2 font-bold">{t.blinks}</p>
                <p className="text-4xl font-bold tabular-nums">{live.snap?.blinks ?? 0}</p>
              </div>
              <div className="card p-4 text-center">
                <p className="text-ink-2 font-bold">{t.counting}</p>
                <p className="text-4xl font-bold tabular-nums">
                  {live.snap ? [...live.snap.pendingDigits, live.snap.currentCount || '…'].join(' – ') : '…'}
                </p>
              </div>
            </div>
            {!!live.snap?.codes.length && (
              <ul className="flex flex-wrap gap-2" aria-live="polite">
                {live.snap.codes.map((c, i) => (
                  <li key={i} className="card px-3 py-2">
                    <span className="font-bold text-xl tabular-nums">{c}</span>
                    <span className="text-ink-2 ml-2">{lookupCode(c)?.title[lang] ?? '?'}</span>
                  </li>
                ))}
              </ul>
            )}
            <button type="button" className="btn btn-secondary w-full" onClick={cancelReading}>
              <X className="w-5 h-5" aria-hidden />{t.cancel}
            </button>
          </>
        )}

        {/* ---------------- RESULTS ---------------- */}
        {screen === 'results' && result && (
          <>
            <h1 ref={headingRef} tabIndex={-1} className="sr-only">{t.resultsTitle}</h1>
            <Suspense fallback={<p>…</p>}><Results t={t} lang={lang} codes={result.codes} samples={result.samples} date={result.date} onRestart={restart} /></Suspense>
          </>
        )}
      </main>
    </div>
  );
}

function Slider({ label, value, min, max, step, unit = '', onChange }: {
  label: string; value: number; min: number; max: number; step: number; unit?: string; onChange: (v: number) => void;
}) {
  const id = useMemo(() => `s-${Math.random().toString(36).slice(2)}`, []);
  return (
    <div>
      <div className="flex justify-between font-bold">
        <label htmlFor={id}>{label}</label>
        <span className="tabular-nums">{value.toFixed(step < 1 ? 1 : 0)}{unit}</span>
      </div>
      <input id={id} type="range" min={min} max={max || 0} step={step} value={value} onChange={e => onChange(parseFloat(e.target.value))} />
    </div>
  );
}

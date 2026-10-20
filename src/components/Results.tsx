import { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Copy, HelpCircle, Info, Printer, RotateCcw, Share2, CircleAlert } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import type { Lang, Strings } from '../i18n';
import { buildReport, reportToText, ReportEntry } from '../lib/report';
import type { Sample } from '../lib/pulseDecoder';

interface Props {
  t: Strings;
  lang: Lang;
  codes: number[];
  samples?: Sample[];
  date: Date;
  onRestart: () => void;
}

function sevLabel(t: Strings, s: ReportEntry['severity']) {
  switch (s) {
    case 'on': return t.sevOn;
    case 'intermittent': return t.sevIntermittent;
    case 'none': return t.sevNone;
    case 'info': return t.sevInfo;
    default: return t.sevUnknown;
  }
}

function SevIcon({ s }: { s: ReportEntry['severity'] }) {
  const cls = 'w-5 h-5';
  if (s === 'on') return <AlertTriangle className={cls} aria-hidden />;
  if (s === 'intermittent') return <CircleAlert className={cls} aria-hidden />;
  if (s === 'unknown') return <HelpCircle className={cls} aria-hidden />;
  return <Info className={cls} aria-hidden />;
}

export function Results({ t, lang, codes, samples, date, onRestart }: Props) {
  const report = useMemo(() => buildReport(codes), [codes]);
  const text = useMemo(() => reportToText(report, lang, date), [report, lang, date]);
  const [copied, setCopied] = useState(false);
  const faults = report.entries.filter(e => e.severity !== 'info');

  const copy = async () => {
    try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* ignore */ }
  };
  const share = async () => {
    if (navigator.share) {
      try { await navigator.share({ title: t.appName, text }); return; } catch { /* cancelled */ }
    }
    copy();
  };

  const chart = useMemo(() => {
    if (!samples?.length) return [];
    const stride = Math.max(1, Math.ceil(samples.length / 1500));
    return samples.filter((_, i) => i % stride === 0).map(s => ({
      time: +s.time.toFixed(2), brightness: Math.round(s.brightness), threshold: Math.round(s.threshold),
    }));
  }, [samples]);

  return (
    <section aria-labelledby="results-h" className="flex flex-col gap-5">
      <div>
        <h2 id="results-h" className="text-3xl font-bold">{t.resultsTitle}</h2>
        <p className="text-ink-2">{date.toLocaleString(lang === 'es' ? 'es-AR' : 'en-US')}</p>
      </div>

      {report.noFaults ? (
        <div className="banner sev-ok p-5 flex gap-4 items-start" role="status">
          <CheckCircle2 className="w-10 h-10 shrink-0" aria-hidden />
          <div><p className="text-2xl font-bold">{t.noFaults}</p><p>{t.noFaultsBody}</p></div>
        </div>
      ) : report.totalRead === 0 ? (
        <div className="banner sev-unknown p-5 flex gap-4 items-start" role="status">
          <HelpCircle className="w-10 h-10 shrink-0" aria-hidden />
          <div><p className="text-2xl font-bold">{t.nothingRead}</p><p>{t.nothingReadBody}</p></div>
        </div>
      ) : (
        <p className="text-2xl font-bold" role="status">{t.activeCodes(faults.length)}</p>
      )}

      {!report.endMarkerSeen && report.totalRead > 0 && (
        <div className="banner sev-intermittent p-4 flex gap-3 items-start">
          <AlertTriangle className="w-6 h-6 shrink-0 mt-0.5" aria-hidden />
          <p>{t.noEndWarn}</p>
        </div>
      )}

      <ul className="flex flex-col gap-4" aria-label={t.activeCodes(report.entries.length)}>
        {report.entries.map(e => (
          <li key={e.code} className={`card code-card sev-${e.severity} p-5`}>
            <div className="flex items-start gap-4">
              <div className="code-num text-5xl font-bold leading-none tabular-nums min-w-[3.5rem]" aria-label={`Code ${e.code}`}>
                {e.code}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-xl font-bold leading-snug">{e.info ? e.info.title[lang] : t.unknownTitle}</h3>
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className="badge"><SevIcon s={e.severity} />{sevLabel(t, e.severity)}</span>
                  <span className="badge sev-none">{t.seen(e.count)}</span>
                </div>
              </div>
            </div>
            <details className="mt-3">
              <summary className="cursor-pointer font-bold text-ink-2 py-2">{t.details}</summary>
              <p className="text-ink-2">{e.info ? e.info.description[lang] : t.unknownBody}</p>
              {e.info && lang !== 'en' && <p className="text-ink-2 text-sm mt-2 italic" lang="en">{e.info.description.en}</p>}
            </details>
          </li>
        ))}
      </ul>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 no-print">
        <button type="button" className="btn btn-secondary" onClick={share}><Share2 className="w-5 h-5" aria-hidden />{t.share}</button>
        <button type="button" className="btn btn-secondary" onClick={copy} aria-live="polite"><Copy className="w-5 h-5" aria-hidden />{copied ? t.copied : t.copy}</button>
        <button type="button" className="btn btn-secondary" onClick={() => window.print()}><Printer className="w-5 h-5" aria-hidden />{t.print}</button>
      </div>
      <button type="button" className="btn btn-primary w-full no-print" onClick={onRestart}>
        <RotateCcw className="w-5 h-5" aria-hidden />{t.readAnother}
      </button>

      {codes.length > 0 && (
        <details className="card p-4">
          <summary className="cursor-pointer font-bold">{t.rawSequence}</summary>
          <p className="mt-2 tabular-nums text-lg">{codes.join(' · ')}</p>
        </details>
      )}

      {chart.length > 0 && (
        <details className="card p-4 no-print">
          <summary className="cursor-pointer font-bold">{t.signal}</summary>
          <div className="h-56 mt-3" aria-hidden>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chart}>
                <CartesianGrid stroke="var(--line)" vertical={false} />
                <XAxis dataKey="time" type="number" domain={['dataMin', 'dataMax']} tickFormatter={v => `${v}s`} stroke="var(--ink-2)" fontSize={12} />
                <YAxis domain={[0, 255]} stroke="var(--ink-2)" fontSize={12} width={36} />
                <Line dataKey="brightness" stroke="var(--accent)" strokeWidth={2} dot={false} isAnimationActive={false} />
                <Line dataKey="threshold" stroke="var(--red)" strokeDasharray="4 4" strokeWidth={1.5} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </details>
      )}

      <p className="text-ink-2 text-sm">{t.disclaimer}</p>
    </section>
  );
}

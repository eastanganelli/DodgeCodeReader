import { END_OF_CODES, LampBehavior, lookupCode, FaultCode } from '../data/codes';

export interface ReportEntry {
  code: number;
  count: number;
  info?: FaultCode;
  /** 'unknown' when the code is not in the reference list */
  severity: LampBehavior | 'info' | 'unknown';
}

export interface CodeReport {
  /** Active codes (end marker 55 excluded), sorted by severity then repeats */
  entries: ReportEntry[];
  /** True when the reading contained the 55 end marker */
  endMarkerSeen: boolean;
  /** True when no fault codes were found (only 55, or only informational codes) */
  noFaults: boolean;
  /** Total codes decoded, including 55 */
  totalRead: number;
}

const SEVERITY_ORDER: Record<ReportEntry['severity'], number> = {
  on: 0,
  intermittent: 1,
  none: 2,
  unknown: 3,
  info: 4,
};

export function buildReport(codes: number[]): CodeReport {
  const counts = new Map<number, number>();
  let endMarkerSeen = false;

  for (const c of codes) {
    if (c === END_OF_CODES) { endMarkerSeen = true; continue; }
    counts.set(c, (counts.get(c) ?? 0) + 1);
  }

  const entries: ReportEntry[] = [...counts.entries()].map(([code, count]) => {
    const info = lookupCode(code);
    const severity: ReportEntry['severity'] =
      !info ? 'unknown' : info.informational ? 'info' : info.lamp;
    return { code, count, info, severity };
  });

  entries.sort((a, b) =>
    SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity] ||
    b.count - a.count ||
    a.code - b.code);

  const noFaults = entries.every(e => e.severity === 'info') && (endMarkerSeen || entries.length > 0);

  return { entries, endMarkerSeen, noFaults, totalRead: codes.length };
}

export function reportToText(report: CodeReport, lang: 'en' | 'es', date = new Date()): string {
  const L = lang === 'es'
    ? { title: 'Reporte de códigos – Dodge', none: 'No se encontraron fallas.', noEnd: 'Atención: no se detectó el código 55 (fin). La lectura puede estar incompleta.', unknown: 'Código desconocido' }
    : { title: 'Dodge code report', none: 'No faults found.', noEnd: 'Note: end code 55 was not detected. Reading may be incomplete.', unknown: 'Unknown code' };
  const lines = [`${L.title} — ${date.toLocaleString(lang === 'es' ? 'es-AR' : 'en-US')}`, ''];
  if (report.noFaults) lines.push(L.none);
  for (const e of report.entries) {
    const title = e.info ? e.info.title[lang] : L.unknown;
    lines.push(`${e.code} — ${title} (×${e.count})`);
    if (e.info) lines.push(`   ${e.info.description[lang]}`);
  }
  if (!report.endMarkerSeen) lines.push('', L.noEnd);
  return lines.join('\n');
}

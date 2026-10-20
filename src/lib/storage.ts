export function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw == null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}

export function save(key: string, value: unknown) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage unavailable */ }
}

export interface HistoryItem { time: number; codes: number[]; name?: string; }

const HISTORY_KEY = 'dcr.history';
const MAX_HISTORY = 10;

export function loadHistory(): HistoryItem[] {
  const h = load<HistoryItem[]>(HISTORY_KEY, []);
  return Array.isArray(h) ? h : [];
}

export function addHistory(item: HistoryItem): HistoryItem[] {
  const next = [item, ...loadHistory()].slice(0, MAX_HISTORY);
  save(HISTORY_KEY, next);
  return next;
}

export function clearHistory(): HistoryItem[] {
  save(HISTORY_KEY, []);
  return [];
}

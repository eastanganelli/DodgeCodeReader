import { Moon, Sun } from 'lucide-react';
import type { Lang, Strings } from '../i18n';

export type Theme = 'light' | 'dark';
export type TextSize = 0 | 1 | 2;

interface Props {
  t: Strings;
  lang: Lang; setLang: (l: Lang) => void;
  size: TextSize; setSize: (s: TextSize) => void;
  theme: Theme; setTheme: (t: Theme) => void;
}

export function SettingsBar({ t, lang, setLang, size, setSize, theme, setTheme }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-2 no-print" role="toolbar" aria-label="Settings">
      <div className="seg" role="group" aria-label={t.textSize}>
        {([0, 1, 2] as TextSize[]).map(s => (
          <button key={s} type="button" aria-pressed={size === s} onClick={() => setSize(s)}
            aria-label={`${t.textSize} ${s + 1}`} title={t.textSize}>
            <span style={{ fontSize: `${0.85 + s * 0.2}rem` }}>A</span>
          </button>
        ))}
      </div>
      <div className="seg" role="group" aria-label={t.language}>
        {(['es', 'en'] as Lang[]).map(l => (
          <button key={l} type="button" aria-pressed={lang === l} onClick={() => setLang(l)} lang={l}>
            {l.toUpperCase()}
          </button>
        ))}
      </div>
      <div className="seg" role="group" aria-label={t.theme}>
        <button type="button" aria-pressed={theme === 'light'} onClick={() => setTheme('light')} aria-label={t.themeLight} title={t.themeLight}>
          <Sun className="w-5 h-5 mx-auto" aria-hidden />
        </button>
        <button type="button" aria-pressed={theme === 'dark'} onClick={() => setTheme('dark')} aria-label={t.themeDark} title={t.themeDark}>
          <Moon className="w-5 h-5 mx-auto" aria-hidden />
        </button>
      </div>
    </div>
  );
}

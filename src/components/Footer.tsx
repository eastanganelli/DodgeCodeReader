import { Github, Bug, User } from 'lucide-react';
import type { Strings } from '../i18n';
import { PROJECT } from '../project';

export function Footer({ t }: { t: Strings }) {
  return (
    <footer className="border-t border-line bg-surface mt-10 no-print">
      <div className="max-w-3xl mx-auto px-4 py-6 flex flex-col gap-4">
        <p>
          {t.madeBy}{' '}
          <a href={PROJECT.authorUrl} target="_blank" rel="noopener noreferrer" className="font-bold underline underline-offset-4">
            {PROJECT.author}
          </a>
        </p>
        <nav aria-label={t.projectLinks} className="flex flex-wrap gap-2">
          <a className="btn btn-ghost min-h-[2.75rem] py-1" href={PROJECT.repoUrl} target="_blank" rel="noopener noreferrer">
            <Github className="w-5 h-5" aria-hidden />{t.sourceCode}
          </a>
          <a className="btn btn-ghost min-h-[2.75rem] py-1" href={PROJECT.issuesUrl} target="_blank" rel="noopener noreferrer">
            <Bug className="w-5 h-5" aria-hidden />{t.reportProblem}
          </a>
          <a className="btn btn-ghost min-h-[2.75rem] py-1" href={PROJECT.authorUrl} target="_blank" rel="noopener noreferrer">
            <User className="w-5 h-5" aria-hidden />{t.aboutDev}
          </a>
        </nav>
        <p className="text-sm text-ink-2">
          {t.privacyNote} · v{PROJECT.version}
        </p>
      </div>
    </footer>
  );
}

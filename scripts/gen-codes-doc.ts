/**
 * Regenerates docs/fault-codes.md from src/data/codes.ts.
 *   npm run docs:codes
 */
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { FAULT_CODES, type LampBehavior } from '../src/data/codes';

const lamp: Record<LampBehavior, string> = { on: '`**` Lamp ON', intermittent: '`*` Intermittent', none: '—' };
const esc = (s: string) => s.replace(/\|/g, '\\|');

const rows = FAULT_CODES.map(c =>
  `| **${c.code}** | ${lamp[c.lamp]}${c.informational ? ' · info' : ''} | ${esc(c.title.en)} | ${esc(c.description.en)} | ${esc(c.title.es)} |`);

const md = `# Fault code reference

> Generated from [\`src/data/codes.ts\`](../src/data/codes.ts) by \`npm run docs:codes\`. Do not edit by hand.

Flash codes for 1990s Chrysler/Dodge SBEC engine computers (PCM), read from the check-engine lamp.

**Lamp column**

- \`**\` **Lamp ON** – the check-engine lamp lights while the engine runs if this code was recorded. Shown in red in the app.
- \`*\` **Intermittent** – the lamp will not stay lit at all times for this code. Shown in amber.
- **—** – no lamp marker in the reference list. Shown in grey.
- **info** – normal / informational, not a fault (\`12\`, \`55\`).

Code **55** marks the end of the list. If it is the only code, no faults are stored.

| Code | Lamp | Title | Description | Título (ES) |
|---:|---|---|---|---|
${rows.join('\n')}

Total: ${FAULT_CODES.length} codes.
`;

const out = resolve(import.meta.dirname, '../docs/fault-codes.md');
writeFileSync(out, md);
console.log('wrote', out);

# Developer guide

How to set up, understand, change, test and deploy Dodge Code Reader.

- [Setup](#setup)
- [Scripts](#scripts)
- [Project structure](#project-structure)
- [How it works](#how-it-works)
- [Common tasks](#common-tasks)
- [Testing](#testing)
- [Deploying](#deploying)
- [Conventions](#conventions)
- [Troubleshooting](#troubleshooting)

---

## Setup

Requirements:

- **Node.js 22** (20.19+ also works) and npm
- **ffmpeg / ffprobe** – only for the real-video pipeline test
- **Python 3 + Pillow** – only to regenerate icons

```bash
git clone https://github.com/eastanganelli/DodgeCodeReader.git
cd DodgeCodeReader
npm install
npm run dev
```

Open http://localhost:3000. The dev server listens on `0.0.0.0`, so you can open it from a
phone on the same network (`http://<your-pc-ip>:3000`).

> **HTTPS on the phone.** Browsers allow the camera, service worker and install prompt
> only on HTTPS or `localhost`. Over plain LAN IP, *Choose a video* works but *Record video*
> may fall back to the file picker, and the PWA won't install. To test those on a phone,
> deploy to GitHub Pages or use a tunnel (e.g. `cloudflared tunnel --url http://localhost:3000`).

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Vite dev server with hot reload on port 3000 |
| `npm run build` | Type-check (`tsc --noEmit`) then production build into `dist/` |
| `npm run preview` | Serve `dist/` locally (port 4173) – closest to production |
| `npm test` | All unit tests (Vitest). Pipeline test is skipped unless a video is given |
| `npm run test:video` | Only the real-video pipeline test (needs `FIXTURE_VIDEO`) |
| `npm run lint` | Type-check only |
| `npm run docs:codes` | Regenerate [`docs/fault-codes.md`](fault-codes.md) from the code table |
| `npm run icons` | Regenerate PWA icons in `public/` (Python + Pillow) |

## Project structure

```
.
├── .github/workflows/deploy-pages.yml   CI: test, build, publish to GitHub Pages
├── docs/                                documentation (this folder)
├── public/                              static files copied as-is (icons, .nojekyll)
├── scripts/
│   ├── gen-codes-doc.ts                 builds docs/fault-codes.md
│   └── make_icons.py                    builds PWA PNG icons
├── src/
│   ├── main.tsx                         React entry
│   ├── App.tsx                          screens + flow state machine
│   ├── i18n.ts                          ES / EN strings
│   ├── project.ts                       author, repo, app URL, version (from package.json)
│   ├── index.css                        theme tokens, components, print styles
│   ├── components/
│   │   ├── Settings.tsx                 text size / language / theme toolbar
│   │   ├── Footer.tsx                   author credit, GitHub / issues links, version
│   │   ├── VideoStage.tsx               <video> + tap/drag detection box
│   │   └── Results.tsx                  report cards, share/copy/print, chart (lazy-loaded)
│   ├── data/
│   │   └── codes.ts                     fault code table – single source of truth
│   └── lib/
│       ├── pulseDecoder.ts              brightness samples → blinks → codes (pure)
│       ├── report.ts                    codes → sorted report with repeat counts (pure)
│       ├── videoAnalyzer.ts             browser frame grabbing, lamp locator, analysis loop
│       ├── storage.ts                   safe localStorage wrappers, reading history
│       ├── decoder.test.ts              unit tests (synthetic signals)
│       └── pipeline.test.ts             end-to-end test on a real video via ffmpeg
├── index.html
├── vite.config.ts                       Vite + Tailwind + PWA config, BASE_PATH
└── package.json
```

**Stack:** React 19, TypeScript, Vite 6, Tailwind CSS 4, `vite-plugin-pwa` (Workbox),
Recharts (results chart only), lucide-react icons, Atkinson Hyperlegible font (bundled).
No backend. No computer-vision library: frames are read with the Canvas 2D API.

## How it works

```
video file ─► VideoStage <video>
                 │
                 ├─ findBlinkingLight()   samples 60 frames, finds highest-variance spot
                 │        └─► Region (normalized x,y,w,h)  ◄── user tap / drag overrides
                 │
                 └─ analyzeVideo()        seeks frame by frame at 30 fps
                          │  regionBrightness()  → one number per frame
                          ▼
                    PulseDecoder.push(t, brightness)
                          │  threshold → ON/OFF → debounce → gap timing
                          ▼
                    codes: number[]   e.g. [12, 43, 33, 55, 12, 43, 33, 55]
                          ▼
                    buildReport()     drop 55, count repeats, attach codes.ts info, sort
                          ▼
                    <Results>  cards · share · history (localStorage)
```

### Screens (`App.tsx`)

`screen` state: `home → locate → reading → results`. The `<video>` element stays mounted
from *locate* through *reading* (hidden otherwise) so seeking state isn't lost. Focus moves
to each screen's `<h1>` on change for screen-reader users. An `AbortController` cancels
locating/reading when the user leaves.

### Finding the lamp (`videoAnalyzer.ts → BlinkLocator`)

1. Grab 60 frames spread over the first 30 s of the selected range, scaled to 96 px wide.
2. Per pixel, accumulate mean and variance of luma.
3. 3×3 box-blur the standard-deviation map; pick the maximum. Blurring favours a solid
   blinking blob over single noisy pixels.
4. If the peak std-dev is below 12 (on 0–255) → "not found", ask the user to tap.
5. Otherwise return a box 12 % of the video width around the peak.

### Measuring brightness (`regionBrightness`)

The region is drawn into a 32×32 canvas and the **mean of the brightest 25 % of pixels**
is used. This keeps the signal strong when the lamp is small inside a larger box.

### Decoding blinks (`pulseDecoder.ts`)

Pure TypeScript, no DOM – easy to test.

1. **Adaptive threshold.** Keep a 5 s window of samples. Split at the midpoint, compute
   both cluster means and pooled std-dev. Accept the threshold only if the clusters are
   ≥ 4 σ apart (rejects compression noise when the lamp is steady). First valid value is
   used immediately, later ones are smoothed (EMA α = 0.1).
2. **Hysteresis** of 8 % of the range around the threshold.
3. **Debounce.** A state change counts only after it holds `minStateDuration` (60 ms,
   i.e. 2 frames at 30 fps). Single-frame glare is ignored. The transition is
   time-stamped at the first frame of the new state.
4. **Gap timing** (OFF time between pulses):

   | Gap | Meaning | Config |
   |---|---|---|
   | `< digitGap` (1.1 s) | next blink of the same digit | `digitGap` |
   | `digitGap … codeGap` | next digit of the same code | |
   | `≥ codeGap` (2.0 s) | new code | `codeGap` |

5. After 2 digits the code is closed automatically. `finish()` flushes any partial code
   (a lone digit `d` becomes `d0`).

All values are in `DEFAULT_DECODER_CONFIG` and can be changed from *Advanced settings*.

### Building the report (`report.ts`)

- `55` is the end marker: it sets `endMarkerSeen` and is not listed.
- Each remaining code is counted and looked up in `codes.ts`.
- Severity: `on` (`**`) → `intermittent` (`*`) → `none` → `unknown` → `info` (`12`).
  Sort by severity, then repeat count (desc), then code number.
- `noFaults` is true when only informational codes and/or `55` were read.
- `reportToText()` produces the share/copy text in the current language.

### Persistence (`storage.ts`)

`localStorage` keys, all wrapped in try/catch (private mode safe):

| Key | Value |
|---|---|
| `dcr.lang` | `"es"` \| `"en"` |
| `dcr.size` | `0` \| `1` \| `2` (18 / 21 / 24 px base) |
| `dcr.theme` | `"light"` \| `"dark"` |
| `dcr.history` | last 10 `{ time, codes, name }` |

### Theming and accessibility (`index.css`)

Colors are CSS variables on `:root` / `:root[data-theme=dark]`, exposed to Tailwind via
`@theme inline` (`bg-surface`, `text-ink-2`, …). Severity classes `.sev-on`, `.sev-intermittent`,
`.sev-none`, `.sev-info`, `.sev-unknown`, `.sev-ok` set `--c`/`--cb` used by `.badge`,
`.code-card`, `.banner`. Text size is set by `html[data-size]`. Rules to keep:

- Minimum touch target 44–48 px (`.btn` is 3.25 rem tall).
- Never encode meaning by color only: always icon + text too.
- Contrast WCAG AA in both themes.
- Respect `prefers-reduced-motion` (already global).

## Common tasks

### Add or change a fault code

1. Edit `src/data/codes.ts`. Each entry:
   ```ts
   {
     code: 43, lamp: 'on',                     // 'on' (**) | 'intermittent' (*) | 'none'
     informational: false,                     // true = normal, not a fault (e.g. 12)
     title: { en: 'Engine misfire', es: 'Falla de encendido (misfire)' },
     description: { en: '…full reference text…', es: '…' },
   }
   ```
2. `npm run docs:codes` to refresh the reference table.
3. `npm test`.

### Add a language

1. In `src/i18n.ts` add an object typed `Strings` (TypeScript will flag missing keys) and
   add it to `STRINGS`; extend `type Lang`.
2. Add `title.xx` / `description.xx` to every code in `codes.ts` (update the `FaultCode` type).
3. Add the button in `Settings.tsx` and the locale in `toLocaleString` calls (`App.tsx`,
   `Results.tsx`, `report.ts`).

### Tune detection

Change defaults in `DEFAULT_DECODER_CONFIG` (`pulseDecoder.ts`), or constants
`WINDOW_SECONDS`, `HYSTERESIS`, `SEPARATION` there; `FRAMES`, grid size and the
`minStd` in `videoAnalyzer.ts`. Always re-run the pipeline test on real recordings after.

### Regenerate icons

Edit `scripts/make_icons.py`, then `npm run icons`. `public/favicon.svg` is hand-written.

## Testing

### Unit tests

```bash
npm test          # or: npx vitest   (watch mode)
```

`decoder.test.ts` builds synthetic lamp signals (configurable fps, noise, glare) and checks:

- typical sequence, 15 fps, single-frame glare, heavy noise decode correctly
- report counts repeats, drops `55`, sorts lamp-ON first
- only `55` → no faults; nothing read → *not* "no faults"; unknown codes are flagged

### Real-video pipeline test

`pipeline.test.ts` runs the same locator, brightness and decoder code as the browser, but
decodes frames with **ffmpeg** instead of `<video>`. Use it with every new recording:

```bash
FIXTURE_VIDEO=~/videos/dakota.mp4 npm run test:video
FIXTURE_VIDEO=~/videos/dakota.mp4 EXPECT_CODES=12,43,33,55,12,43,33,55 npm run test:video
```

It prints the lamp region, the decoded sequence and the text report. With `EXPECT_CODES`
it fails if the sequence differs. Keep a small folder of reference clips with their
expected codes and run them before changing detection parameters.

### Manual checklist (before a release)

- [ ] `npm run build` passes, `npm run preview` works
- [ ] Android Chrome: record video, locate, read, share, install, works offline (airplane mode)
- [ ] iPhone Safari: choose video, read (iOS needs the play/pause unlock in `onMeta`)
- [ ] Desktop: keyboard-only run through every screen; screen reader announces steps
- [ ] All three text sizes and both themes look right at 360 px width
- [ ] Print preview of results is readable

## Deploying

### GitHub Pages (automatic)

1. Repo **Settings → Pages → Build and deployment → Source: GitHub Actions** (once).
2. Push to `main` or `master`, or run **Actions → Deploy to GitHub Pages → Run workflow**.
3. The workflow (`.github/workflows/deploy-pages.yml`) runs `npm ci`, `npm test`,
   `npm run build` with `BASE_PATH=/<repo>/`, uploads `dist/` and deploys.
4. Live at **https://eastanganelli.github.io/DodgeCodeReader/**.

A failing test stops the deploy.

### Base path

`vite.config.ts` reads `BASE_PATH`:

| Hosting | `BASE_PATH` |
|---|---|
| Project page `https://<user>.github.io/<repo>/` | `/<repo>/` (workflow default) |
| User page repo `<user>.github.io` or custom domain | `/` – edit the workflow |
| Unknown / any static host / sub-folder | unset → relative `./` |

The PWA manifest `start_url`, `scope` and the service-worker scope follow it.

### Other hosts

`npm run build` and upload `dist/` to any static host (Netlify, Cloudflare Pages, Vercel,
nginx). No server code, no rewrites needed (single page, no routes). Must be HTTPS.

### Updates and caching

The service worker uses `registerType: 'autoUpdate'`: a new deploy is downloaded in the
background and used on the next launch. If a phone keeps showing an old version, close
all app tabs/windows and reopen.

### Native store apps (optional)

Wrap `dist/` with Capacitor (`npx cap add android|ios`). No code changes needed; build
with `BASE_PATH=/`.

### Project links and version

Author, repository, issues and app URLs live in `src/project.ts` (used by the header GitHub
button, the footer and the shared report). The version shown in the footer comes from
`package.json` via the `__APP_VERSION__` define in `vite.config.ts` – bump it there on release.
If the repo moves, update `src/project.ts`, `index.html` (canonical / Open Graph tags) and
`package.json` (`homepage`, `repository`, `bugs`).

## Conventions

- **Keep logic pure.** Anything testable without a browser goes in `lib/` with no DOM
  access (`pulseDecoder.ts`, `report.ts`). DOM work stays in `videoAnalyzer.ts`/components.
- **All user-facing text in `i18n.ts`**, both languages, plain words, short sentences.
- **Codes data only in `codes.ts`.** Don't hard-code code numbers in components
  (`END_OF_CODES` exists for `55`).
- TypeScript strict-enough: `npm run lint` must pass.
- Do not add tracking or upload user videos. Everything runs on-device.

## Troubleshooting

| Symptom | Cause / fix |
|---|---|
| Blank page after deploy, 404s for `/assets/…` | Wrong `BASE_PATH`. Check the table above. |
| Old version after deploy | Service worker cache. Close all tabs and reopen, or DevTools → Application → Service workers → *Update*. |
| `Cannot find module 'node:child_process'` in `tsc` | `@types/node` missing: `npm install`. |
| Pipeline test skipped | `FIXTURE_VIDEO` not set. |
| `ffprobe: not found` | Install ffmpeg (`apt install ffmpeg`, `brew install ffmpeg`, `winget install ffmpeg`). |
| iOS: locating hangs on first frame | Safari decodes only after playback starts once – handled in `onMeta` with `play()/pause()`. If autoplay is blocked, tap **Search again**. |
| Codes merge (43 read as 7) | Recording has short gaps. Lower `digitGap`; confirm with pipeline test. |

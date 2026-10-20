import { forwardRef, useRef, useState } from 'react';
import type { Region } from '../lib/videoAnalyzer';
import { clampRegion } from '../lib/videoAnalyzer';

interface Props {
  src: string;
  region: Region | null;
  aspect: number;
  interactive: boolean;
  hidden: boolean;
  lit?: boolean;
  label: string;
  onRegion: (r: Region) => void;
  onMeta: (v: HTMLVideoElement) => void;
}

const DEFAULT_BOX = 0.12;

/** Video with a tap/drag-able detection box. Kept mounted while a video is loaded. */
export const VideoStage = forwardRef<HTMLVideoElement, Props>(function VideoStage(
  { src, region, aspect, interactive, hidden, lit, label, onRegion, onMeta }, ref,
) {
  const overlay = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; y: number; moved: boolean } | null>(null);
  const [preview, setPreview] = useState<Region | null>(null);

  const pos = (e: React.PointerEvent) => {
    const r = overlay.current!.getBoundingClientRect();
    return { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height };
  };

  const down = (e: React.PointerEvent) => {
    if (!interactive) return;
    overlay.current?.setPointerCapture(e.pointerId);
    const p = pos(e);
    drag.current = { ...p, moved: false };
  };
  const move = (e: React.PointerEvent) => {
    if (!drag.current) return;
    const p = pos(e);
    const dx = p.x - drag.current.x, dy = p.y - drag.current.y;
    if (!drag.current.moved && Math.hypot(dx, dy * (1 / aspect)) < 0.03) return;
    drag.current.moved = true;
    setPreview(clampRegion({
      x: Math.min(p.x, drag.current.x), y: Math.min(p.y, drag.current.y),
      w: Math.abs(dx), h: Math.abs(dy),
    }));
  };
  const up = (e: React.PointerEvent) => {
    if (!drag.current) return;
    const p = pos(e);
    if (drag.current.moved && preview) {
      onRegion(preview);
    } else {
      const w = DEFAULT_BOX, h = Math.min(1, DEFAULT_BOX * aspect);
      onRegion(clampRegion({ x: p.x - w / 2, y: p.y - h / 2, w, h }));
    }
    drag.current = null;
    setPreview(null);
  };

  const box = preview ?? region;

  return (
    <div className={hidden ? 'hidden' : 'card overflow-hidden p-0'}>
      <div className="relative bg-black mx-auto" style={{ aspectRatio: String(aspect), maxHeight: '60vh', maxWidth: `calc(60vh * ${aspect})` }}>
        <video
          ref={ref}
          src={src}
          className="absolute inset-0 w-full h-full"
          playsInline
          muted
          preload="auto"
          onLoadedMetadata={e => onMeta(e.currentTarget)}
        />
        <div
          ref={overlay}
          className={`absolute inset-0 ${interactive ? 'cursor-crosshair' : ''}`}
          style={{ touchAction: interactive ? 'none' : 'auto' }}
          onPointerDown={down}
          onPointerMove={move}
          onPointerUp={up}
          onPointerCancel={() => { drag.current = null; setPreview(null); }}
          role={interactive ? 'application' : undefined}
          aria-label={interactive ? label : undefined}
        >
          {box && (
            <div
              className="absolute rounded-lg pointer-events-none"
              style={{
                left: `${box.x * 100}%`, top: `${box.y * 100}%`,
                width: `${box.w * 100}%`, height: `${box.h * 100}%`,
                border: '4px solid var(--accent)',
                boxShadow: `0 0 0 9999px rgba(0,0,0,.35)${lit ? ', 0 0 24px 6px var(--accent)' : ''}`,
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
});

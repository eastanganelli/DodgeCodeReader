"""Generate PWA PNG icons (amber tile with a check-engine lamp glyph)."""
from pathlib import Path
from PIL import Image, ImageDraw

OUT = Path(__file__).resolve().parent.parent / "public"
OUT.mkdir(exist_ok=True)
AMBER, INK = (242, 183, 5, 255), (28, 26, 23, 255)


def icon(size: int, maskable: bool = False) -> Image.Image:
    s = 4  # supersample
    W = size * s
    im = Image.new("RGBA", (W, W), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    if maskable:
        d.rectangle([0, 0, W, W], fill=AMBER)
        pad = W * 0.22
    else:
        d.rounded_rectangle([0, 0, W - 1, W - 1], radius=W * 0.22, fill=AMBER)
        pad = W * 0.16
    # stylised engine block
    x0, y0, x1, y1 = pad, pad + (W - 2 * pad) * 0.2, W - pad, W - pad - (W - 2 * pad) * 0.12
    lw = int(W * 0.055)
    d.rounded_rectangle([x0 + (x1 - x0) * 0.12, y0, x1 - (x1 - x0) * 0.12, y1], radius=W * 0.04, outline=INK, width=lw)
    # top valve cover
    cx = (x0 + x1) / 2
    d.rectangle([cx - (x1 - x0) * 0.18, y0 - (y1 - y0) * 0.22, cx + (x1 - x0) * 0.18, y0], fill=INK)
    # side ports
    my = (y0 + y1) / 2
    d.rectangle([x0, my - lw * 1.2, x0 + (x1 - x0) * 0.12, my + lw * 1.2], fill=INK)
    d.rectangle([x1 - (x1 - x0) * 0.12, my - lw * 1.2, x1, my + lw * 1.2], fill=INK)
    # exclamation
    ex_w = lw * 1.1
    d.rounded_rectangle([cx - ex_w / 2, y0 + (y1 - y0) * 0.18, cx + ex_w / 2, y0 + (y1 - y0) * 0.62], radius=ex_w / 2, fill=INK)
    d.ellipse([cx - ex_w * 0.6, y0 + (y1 - y0) * 0.70, cx + ex_w * 0.6, y0 + (y1 - y0) * 0.70 + ex_w * 1.2], fill=INK)
    return im.resize((size, size), Image.LANCZOS)


icon(192).save(OUT / "pwa-192.png")
icon(512).save(OUT / "pwa-512.png")
icon(512, maskable=True).save(OUT / "pwa-512-maskable.png")
icon(180, maskable=True).convert("RGB").save(OUT / "apple-touch-icon.png")
print("icons written to", OUT)

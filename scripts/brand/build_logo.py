r"""Draw the ENT Senses logos as pure vector SVG from Della Respira (OFL).

- "ent": synthetic bold (outline stroked and merged), first "e" mirrored and
  rotated so its bar is horizontal.
- "senses": synthetic italic (skew); 1st "e" mirrored (ɘ), 2nd rotated 180° (ə).
- symbol: schwa (e rotated 180°), centred in a square.

Usage (writes the variants into OUT_DIR; variant "-a" is the one in public/brand):
    pip install fonttools skia-pathops
    curl -L -o DellaRespira-Regular.ttf "$(curl -s 'https://fonts.googleapis.com/css2?family=Della+Respira' \
        -A 'Mozilla/4.0' | grep -o 'https://[^)]*\.ttf')"
    python scripts/brand/build_logo.py OUT_DIR DellaRespira-Regular.ttf
"""
import math
import sys
from pathlib import Path

import pathops
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont

OUT = Path(sys.argv[1])
FONT = Path(sys.argv[2])
OUT.mkdir(parents=True, exist_ok=True)

font = TTFont(FONT)
gs = font.getGlyphSet()
cmap = font.getBestCmap()

BAR_ANGLE = math.degrees(math.atan2(690 - 493, 768 - 203))  # ~19.2°, the e's slanted bar
BOLD = 72        # stroke width added around "ent" outlines (font units, upm 2048)
ITALIC = 11      # degrees of slant for "senses"
X_H = 963        # height of n (flat x-height)


def mul(a, b):
    """Compose affine (xx, xy, yx, yy, dx, dy): apply b, then a."""
    a1, b1, c1, d1, e1, f1 = a
    a2, b2, c2, d2, e2, f2 = b
    return (a1 * a2 + c1 * b2, b1 * a2 + d1 * b2,
            a1 * c2 + c1 * d2, b1 * c2 + d1 * d2,
            a1 * e2 + c1 * f2 + e1, b1 * e2 + d1 * f2 + f1)


def translate(x, y):
    return (1, 0, 0, 1, x, y)


def scale(sx, sy=None):
    return (sx, 0, 0, sx if sy is None else sy, 0, 0)


def rotate(deg):
    r = math.radians(deg)
    return (math.cos(r), math.sin(r), -math.sin(r), math.cos(r), 0, 0)


def skew(deg):
    return (1, 0, math.tan(math.radians(deg)), 1, 0, 0)


def about(t, cx, cy):
    return mul(translate(cx, cy), mul(t, translate(-cx, -cy)))


def glyph(ch, t=(1, 0, 0, 1, 0, 0)):
    p = pathops.Path()
    gs[cmap[ord(ch)]].draw(TransformPen(p.getPen(), t))
    return p


def transformed(p, t):
    q = pathops.Path()
    p.draw(TransformPen(q.getPen(), t))
    return q


def embolden(p, w):
    s = pathops.Path()
    p.draw(s.getPen())
    s.stroke(w, pathops.LineCap.ROUND_CAP, pathops.LineJoin.ROUND_JOIN, 4)
    s.convertConicsToQuads()
    return pathops.op(p, s, pathops.PathOp.UNION, fix_winding=True)


def e_variant(kind):
    """'e' normal, 'mirror' (ɘ), 'schwa' (ə, rotated 180°), 'mirror-level' (ɘ with level bar)."""
    xmin, ymin, xmax, ymax = glyph("e").bounds
    cx, cy = (xmin + xmax) / 2, (ymin + ymax) / 2
    if kind == "e":
        t = (1, 0, 0, 1, 0, 0)
    elif kind == "mirror":
        t = about(scale(-1, 1), cx, cy)
    elif kind == "schwa":
        t = about(scale(-1, -1), cx, cy)
    elif kind == "mirror-level":
        t = about(mul(rotate(BAR_ANGLE), scale(-1, 1)), cx, cy)
    else:
        raise ValueError(kind)
    p = glyph("e", t)
    if kind == "mirror-level":  # put it back on the baseline / x-height after rotating
        b = p.bounds
        p = transformed(p, translate(cx - (b[0] + b[2]) / 2, -18 - b[1]))
    return p


def word(letters, *, bold=0, slant=0, tracking=0):
    """letters: list of (char, path-or-None). Returns merged path, advance."""
    out = pathops.Path()
    x = 0
    for ch, custom in letters:
        p = custom if custom is not None else glyph(ch)
        if bold:
            p = embolden(p, bold)
        if slant:
            p = transformed(p, skew(slant))
        out.addPath(transformed(p, translate(x, 0)))
        x += gs[cmap[ord(ch)]].width + bold + tracking
    out = pathops.simplify(out, fix_winding=True)
    return out, x


def fit_bold_height(p):
    """Bold grows outlines by BOLD/2 everywhere: scale back so n sits on 0..X_H."""
    k = X_H / (X_H + BOLD)
    return transformed(p, mul(scale(k), translate(0, BOLD / 2)))


def d_of(p, t):
    pen = SVGPathPen(None, ntos=lambda v: ("%.1f" % v).rstrip("0").rstrip("."))
    p.draw(TransformPen(pen, t))
    return pen.getCommands()


def svg(paths, box, *, title, pad, out, dark_aware=False, size=None):
    """paths: list of (path, transform) in font units (y up). box: (xmin, ymin, xmax, ymax)."""
    xmin, ymin, xmax, ymax = box
    W, H = xmax - xmin + 2 * pad[0], ymax - ymin + 2 * pad[1]
    k = 100 / H if size is None else size / max(W, H)  # viewBox height 100 (or `size`)
    flip = mul(scale(k, -k), translate(-xmin + pad[0], -ymax - pad[1]))
    ds = " ".join(d_of(p, mul(flip, t)) for p, t in paths)
    vw, vh = round(W * k, 2), round(H * k, 2)
    style = ""
    if dark_aware:
        style = ("<style>path{fill:#111}@media (prefers-color-scheme:dark)"
                 "{path{fill:#f5f5f5}}</style>")
    body = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {vw} {vh}" '
            f'role="img" aria-label="{title}">{style}<title>{title}</title>'
            f'<path fill="currentColor" d="{ds}"/></svg>\n')
    if not dark_aware:
        body = body.replace('fill="currentColor"', 'fill="#111"')
    (OUT / out).write_text(body)
    return vw, vh


ID = (1, 0, 0, 1, 0, 0)


def ent(e_kind):
    p, adv = word([("e", e_variant(e_kind)), ("n", None), ("t", None)], bold=BOLD)
    return fit_bold_height(p), adv * X_H / (X_H + BOLD)


def senses(e1, e2, slant=ITALIC):
    p, adv = word([("s", None), ("e", e_variant(e1)), ("n", None),
                   ("s", None), ("e", e_variant(e2)), ("s", None)], slant=slant, tracking=8)
    return p, adv


def union_bounds(*bs):
    return (min(b[0] for b in bs), min(b[1] for b in bs),
            max(b[2] for b in bs), max(b[3] for b in bs))


def build(tag, ent_e, sen_e1, sen_e2):
    E, _ = ent(ent_e)
    S, _ = senses(sen_e1, sen_e2)
    eb, sb = E.bounds, S.bounds

    # Horizontal: same x-height, one word-space apart.
    gap = 300
    t_s = translate(eb[2] + gap - sb[0], 0)
    box = union_bounds(eb, transformed(S, t_s).bounds)
    svg([(E, ID), (S, t_s)], box, title="ENT Senses", pad=(0, 0),
        out=f"entsenses-horizontal{tag}.svg")

    # Stacked: "ent" on top; "senses" scaled to the same width underneath.
    k = (eb[2] - eb[0]) / (sb[2] - sb[0])
    line_gap = 170
    t_s2 = mul(translate(eb[0], eb[1] - line_gap - sb[3] * k), mul(scale(k), translate(-sb[0], 0)))
    box2 = union_bounds(eb, transformed(S, t_s2).bounds)
    svg([(E, ID), (S, t_s2)], box2, title="ENT Senses", pad=(0, 0),
        out=f"entsenses-vertical{tag}.svg")


VARIANTS = {
    "-a": ("mirror-level", "mirror", "schwa"),   # ɘnt (bar level) · sɘnsəs
    "-b": ("e", "mirror", "schwa"),              # ent · sɘnsəs
    "-c": ("mirror-level", "schwa", "schwa"),    # ɘnt · sənsəs
}
for tag, v in VARIANTS.items():
    build(tag, *v)


def symbol(bold, out, dark_aware=False, pad_ratio=0.16):
    p = e_variant("schwa")
    if bold:
        p = embolden(p, bold)
    b = p.bounds
    side = max(b[2] - b[0], b[3] - b[1])
    pad = side * pad_ratio
    cx, cy = (b[0] + b[2]) / 2, (b[1] + b[3]) / 2
    box = (cx - side / 2, cy - side / 2, cx + side / 2, cy + side / 2)
    svg([(p, ID)], box, title="ENT Senses", pad=(pad, pad), out=out, dark_aware=dark_aware, size=100)


symbol(BOLD, "entsenses-symbol.svg", dark_aware=True)
symbol(BOLD, "entsenses-symbol-plain.svg", pad_ratio=0.0)
symbol(0, "entsenses-symbol-regular.svg", dark_aware=True)
print("ok", sorted(x.name for x in OUT.iterdir()))

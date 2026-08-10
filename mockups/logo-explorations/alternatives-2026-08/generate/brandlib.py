"""Geometry + type helpers for the SteerLens logo exploration."""

import math, os, struct, zlib, subprocess

from paths import TMP

INK = "#041c38"
PAPER = "#f7f5f3"
OCEAN = "#044a88"

# ---------------------------------------------------------------- geometry ---


def P(r, deg):
    a = math.radians(deg)
    return (r * math.cos(a), r * math.sin(a))


def f(v):
    return f"{v:.2f}".rstrip("0").rstrip(".")


def pt(p):
    return f"{f(p[0])} {f(p[1])}"


def arc(r, to, large=0, sweep=1):
    return f"A {f(r)} {f(r)} 0 {large} {sweep} {pt(to)}"


def circle_path(cx, cy, r, ccw=False):
    s = 0 if ccw else 1
    return (
        f"M {f(cx - r)} {f(cy)} "
        f"A {f(r)} {f(r)} 0 1 {s} {f(cx + r)} {f(cy)} "
        f"A {f(r)} {f(r)} 0 1 {s} {f(cx - r)} {f(cy)} Z"
    )


def rounded_rect(x, y, w, h, r):
    r = min(r, w / 2, h / 2)
    return (
        f"M {f(x + r)} {f(y)} H {f(x + w - r)} A {f(r)} {f(r)} 0 0 1 {f(x + w)} {f(y + r)} "
        f"V {f(y + h - r)} A {f(r)} {f(r)} 0 0 1 {f(x + w - r)} {f(y + h)} "
        f"H {f(x + r)} A {f(r)} {f(r)} 0 0 1 {f(x)} {f(y + h - r)} "
        f"V {f(y + r)} A {f(r)} {f(r)} 0 0 1 {f(x + r)} {f(y)} Z"
    )


def annulus_sector(ro, ri, a0, a1):
    """Ring segment between radii ri..ro spanning a0..a1 degrees (clockwise on screen)."""
    large = 1 if (a1 - a0) > 180 else 0
    return (
        f"M {pt(P(ro, a0))} {arc(ro, P(ro, a1), large, 1)} "
        f"L {pt(P(ri, a1))} {arc(ri, P(ri, a0), large, 0)} Z"
    )


def offset_polyline(points, hw):
    """Flatten a polyline of given half-width into a filled polygon (miter joins, butt caps)."""

    def norm(v):
        m = math.hypot(*v)
        return (v[0] / m, v[1] / m)

    segs = []
    for a, b in zip(points, points[1:]):
        d = norm((b[0] - a[0], b[1] - a[1]))
        segs.append((a, b, d, (-d[1], d[0])))

    def side(sign):
        out = []
        for i, (a, b, d, n) in enumerate(segs):
            oa = (a[0] + sign * n[0] * hw, a[1] + sign * n[1] * hw)
            ob = (b[0] + sign * n[0] * hw, b[1] + sign * n[1] * hw)
            if i == 0:
                out.append(oa)
            else:
                pa, pd = out[-1], segs[i - 1][2]
                den = pd[0] * d[1] - pd[1] * d[0]
                if abs(den) > 1e-9:
                    t = ((oa[0] - pa[0]) * d[1] - (oa[1] - pa[1]) * d[0]) / den
                    out[-1] = (pa[0] + pd[0] * t, pa[1] + pd[1] * t)
                else:
                    out.append(oa)
            out.append(ob)
        return out

    left = side(1)
    right = side(-1)[::-1]
    ring = left + right
    return "M " + " L ".join(pt(p) for p in ring) + " Z"


def band_in_disc(y0, y1, cx, cy, r):
    """Horizontal band y0..y1 intersected with a disc. Band must sit inside the disc's y-range."""
    if y1 <= cy - r or y0 >= cy + r:
        return ""
    y0, y1 = max(y0, cy - r + 0.01), min(y1, cy + r - 0.01)

    def w(y):
        return math.sqrt(max(r * r - (y - cy) ** 2, 0))

    return (
        f"M {f(cx + w(y0))} {f(y0)} {arc(r, (cx + w(y1), y1), 0, 1)} "
        f"L {f(cx - w(y1))} {f(y1)} {arc(r, (cx - w(y0), y0), 0, 1)} Z"
    )


def band_outside_disc(y0, y1, xl, xr, cx, cy, r):
    """Horizontal band xl..xr / y0..y1 with a circular bite taken out of it."""
    if y1 <= cy - r or y0 >= cy + r:
        return f"M {f(xl)} {f(y0)} H {f(xr)} V {f(y1)} H {f(xl)} Z"
    yy0, yy1 = max(y0, cy - r + 0.01), min(y1, cy + r - 0.01)

    def w(y):
        return math.sqrt(max(r * r - (y - cy) ** 2, 0))

    out = []
    if cx - w(yy0) > xl or cx - w(yy1) > xl:
        out.append(
            f"M {f(xl)} {f(yy0)} L {f(cx - w(yy0))} {f(yy0)} "
            f"{arc(r, (cx - w(yy1), yy1), 0, 0)} L {f(xl)} {f(yy1)} Z"
        )
    if cx + w(yy0) < xr or cx + w(yy1) < xr:
        out.append(
            f"M {f(cx + w(yy0))} {f(yy0)} {arc(r, (cx + w(yy1), yy1), 0, 1)} "
            f"L {f(xr)} {f(yy1)} L {f(xr)} {f(yy0)} Z"
        )
    return " ".join(out)


# -------------------------------------------------------------------- type ---

_FONT_CACHE = {}


def wordmark_path(text, font_path, size, axes, tracking=0.0):
    """Shape `text` with HarfBuzz and return (svg path data, advance width, cap height)."""
    import uharfbuzz as hb
    from fontTools.ttLib import TTFont
    from fontTools.varLib import instancer
    from fontTools.pens.svgPathPen import SVGPathPen
    from fontTools.pens.transformPen import TransformPen
    from fontTools.misc.transform import Transform

    key = (font_path, tuple(sorted(axes.items())))
    if key not in _FONT_CACHE:
        tt = TTFont(font_path)
        tt = instancer.instantiateVariableFont(tt, axes, updateFontNames=False)
        out = os.path.join(TMP, f"inst_{abs(hash(key))}.ttf")
        tt.save(out)
        _FONT_CACHE[key] = (tt, out)
    tt, inst_path = _FONT_CACHE[key]

    upem = tt["head"].unitsPerEm
    cap = getattr(tt["OS/2"], "sCapHeight", None) or int(upem * 0.7)
    scale = size / upem

    blob = hb.Blob.from_file_path(inst_path)
    face = hb.Face(blob)
    font = hb.Font(face)
    buf = hb.Buffer()
    buf.add_str(text)
    buf.guess_segment_properties()
    hb.shape(font, buf)

    from fontTools.pens.boundsPen import BoundsPen

    glyph_order = tt.getGlyphOrder()
    glyphset = tt.getGlyphSet()
    d = []
    x = 0.0
    bounds = BoundsPen(glyphset)
    for info, pos in zip(buf.glyph_infos, buf.glyph_positions):
        name = glyph_order[info.codepoint]
        tf = Transform(scale, 0, 0, -scale, (x + pos.x_offset) * scale, 0)
        pen = SVGPathPen(glyphset, ntos=lambda v: f"{v:.2f}")
        glyphset[name].draw(TransformPen(pen, tf))
        seg = pen.getCommands()
        if seg:
            d.append(seg)
        glyphset[name].draw(TransformPen(bounds, tf))
        x += pos.x_advance + tracking * upem
    return {
        "d": " ".join(d),
        "advance": x * scale,
        "cap": cap * scale,
        "bbox": bounds.bounds,
    }


# ------------------------------------------------------------------ raster ---


def render(svg_path, png_path, w=None, h=None, background=None, env=None):
    cmd = ["rsvg-convert", svg_path, "-o", png_path]
    if w:
        cmd += ["-w", str(int(w))]
    if h:
        cmd += ["-h", str(int(h))]
    if background:
        cmd += ["-b", background]
    subprocess.run(cmd, check=True, env={**os.environ, **(env or {})} if env else None)


def load_rgba(path):
    data = open(path, "rb").read()
    pos, idat, w, h, ct = 8, b"", None, None, None
    while pos < len(data):
        ln = struct.unpack(">I", data[pos : pos + 4])[0]
        typ = data[pos + 4 : pos + 8]
        chunk = data[pos + 8 : pos + 8 + ln]
        pos += 12 + ln
        if typ == b"IHDR":
            w, h, _bd, ct = struct.unpack(">IIBB", chunk[:10])
        elif typ == b"IDAT":
            idat += chunk
        elif typ == b"IEND":
            break
    raw = zlib.decompress(idat)
    nch = {0: 1, 2: 3, 3: 1, 4: 2, 6: 4}[ct]
    stride = w * nch
    out = bytearray(w * h * nch)
    prev = bytearray(stride)
    p = 0
    for y in range(h):
        fl = raw[p]
        p += 1
        line = bytearray(raw[p : p + stride])
        p += stride
        if fl:
            for i in range(stride):
                a = line[i - nch] if i >= nch else 0
                b = prev[i]
                c = prev[i - nch] if i >= nch else 0
                if fl == 1:
                    line[i] = (line[i] + a) & 255
                elif fl == 2:
                    line[i] = (line[i] + b) & 255
                elif fl == 3:
                    line[i] = (line[i] + ((a + b) >> 1)) & 255
                else:
                    pa, pb, pc = abs(b - c), abs(a - c), abs(a + b - 2 * c)
                    pr = a if (pa <= pb and pa <= pc) else (b if pb <= pc else c)
                    line[i] = (line[i] + pr) & 255
        out[y * stride : (y + 1) * stride] = line
        prev = line
    if nch == 4:
        return w, h, bytes(out)
    rgba = bytearray(w * h * 4)
    for i in range(w * h):
        if nch == 3:
            rgba[i * 4 : i * 4 + 3] = out[i * 3 : i * 3 + 3]
            rgba[i * 4 + 3] = 255
        elif nch == 1:
            v = out[i]
            rgba[i * 4 : i * 4 + 4] = bytes((v, v, v, 255))
        else:
            v, a = out[i * 2], out[i * 2 + 1]
            rgba[i * 4 : i * 4 + 4] = bytes((v, v, v, a))
    return w, h, bytes(rgba)


def save_rgba(path, w, h, px):
    raw = b"".join(b"\x00" + px[y * w * 4 : (y + 1) * w * 4] for y in range(h))

    def chunk(typ, data):
        return (
            struct.pack(">I", len(data))
            + typ
            + data
            + struct.pack(">I", zlib.crc32(typ + data) & 0xFFFFFFFF)
        )

    png = (
        b"\x89PNG\r\n\x1a\n"
        + chunk(b"IHDR", struct.pack(">IIBBBBB", w, h, 8, 6, 0, 0, 0))
        + chunk(b"IDAT", zlib.compress(raw, 9))
        + chunk(b"IEND", b"")
    )
    open(path, "wb").write(png)


def nearest_upscale(src, dst, factor):
    w, h, px = load_rgba(src)
    W, H = w * factor, h * factor
    out = bytearray(W * H * 4)
    for y in range(H):
        sy = y // factor
        for x in range(W):
            sx = x // factor
            i = (sy * w + sx) * 4
            o = (y * W + x) * 4
            out[o : o + 4] = px[i : i + 4]
    save_rgba(dst, W, H, bytes(out))
    return W, H


def ink_bbox(path):
    w, h, px = load_rgba(path)
    minx, miny, maxx, maxy, total = w, h, -1, -1, 0
    for y in range(h):
        for x in range(w):
            if px[(y * w + x) * 4 + 3] > 16:
                total += 1
                minx, maxx = min(minx, x), max(maxx, x)
                miny, maxy = min(miny, y), max(maxy, y)
    return minx, miny, maxx, maxy, w, h, total


def data_uri(path):
    import base64

    return "data:image/png;base64," + base64.b64encode(open(path, "rb").read()).decode()

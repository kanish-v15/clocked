"""Draws Clocked's app icon (Sarge's three yellow stripes on ink) as PNG files, using only the Python standard library."""
import struct
import zlib
from pathlib import Path

INK = (13, 15, 26)
SUN = (255, 210, 63)
OUT = Path(__file__).resolve().parent.parent / "public" / "icons"

# Three chevrons in a 24-unit box, the same shape as the stripes icon in the prototype.
CHEVRONS = [((5, 5), (12, 9), (19, 5)), ((5, 10.5), (12, 14.5), (19, 10.5)), ((5, 16), (12, 20), (19, 16))]
STROKE = 2.3  # in the same 24-unit box


def dist_to_segment(px, py, ax, ay, bx, by):
    dx, dy = bx - ax, by - ay
    t = max(0.0, min(1.0, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)))
    cx, cy = ax + t * dx, ay + t * dy
    return ((px - cx) ** 2 + (py - cy) ** 2) ** 0.5


def coverage(u, v):
    # Distance from the pixel to the nearest stripe. Round caps come free from the segment distance.
    d = min(dist_to_segment(u, v, *a, *b) for c in CHEVRONS for a, b in ((c[0], c[1]), (c[1], c[2])))
    return d


def draw(size):
    # The stripes fill the middle 62% of the icon, so iPhone's rounded mask never clips them.
    scale = 24 / (size * 0.62)
    offset = (size - size * 0.62) / 2
    half = STROKE / 2
    aa = scale  # one pixel of soft edge, in box units
    rows = []
    for y in range(size):
        row = bytearray([0])
        for x in range(size):
            u = (x + 0.5 - offset) * scale
            v = (y + 0.5 - offset) * scale + 0.0
            d = coverage(u, v)
            a = 1.0 if d <= half - aa / 2 else 0.0 if d >= half + aa / 2 else (half + aa / 2 - d) / aa
            row += bytes(round(INK[i] + (SUN[i] - INK[i]) * a) for i in range(3))
        rows.append(bytes(row))
    raw = b"".join(rows)

    def chunk(tag, data):
        return struct.pack(">I", len(data)) + tag + data + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)

    png = b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", struct.pack(">IIBBBBB", size, size, 8, 2, 0, 0, 0)) + chunk(b"IDAT", zlib.compress(raw, 9)) + chunk(b"IEND", b"")
    return png


if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    for size in (180, 192, 512):
        (OUT / f"icon-{size}.png").write_bytes(draw(size))
        print(f"wrote public/icons/icon-{size}.png")

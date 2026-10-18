"""Draws the app's icon as a PNG for the iPhone's home screen (apple-touch-icon, 180x180): Safari does not take an SVG
there. The same drawing as the SVG favicon in index.html: a cream card, tilted, with a black club on the bar's green.
Run once after changing the drawing; the PNG is committed in public/ and the build copies it next to the page.
    python3 scripts/make_icons.py"""
from PIL import Image, ImageDraw

S, K = 180, 4                      # drawn 4x larger and scaled down, for smooth edges
im = Image.new('RGB', (S * K, S * K), '#14532d')
card = Image.new('RGBA', (S * K, S * K), (0, 0, 0, 0))
d = ImageDraw.Draw(card)
x0, y0, x1, y1 = 52 * K, 28 * K, 128 * K, 152 * K
d.rounded_rectangle((x0, y0, x1, y1), radius=12 * K, fill='#fbf6ea', outline='#3b2a1a', width=4 * K)
cx, cy, r = 90 * K, 84 * K, 15 * K                 # the club: three leaves and a stem
for dx, dy in ((0, -16), (-15, 6), (15, 6)):
    d.ellipse((cx + dx * K - r, cy + dy * K - r, cx + dx * K + r, cy + dy * K + r), fill='#1b1b1b')
d.polygon([(cx - 4 * K, cy), (cx + 4 * K, cy), (cx + 12 * K, cy + 34 * K), (cx - 12 * K, cy + 34 * K)], fill='#1b1b1b')
d.ellipse((60 * K, 36 * K, 72 * K, 48 * K), fill='#c62828')        # a red pip in the corner
card = card.rotate(-8, resample=Image.BICUBIC, center=(90 * K, 90 * K))
im.paste(card, (0, 0), card)
im.resize((S, S), Image.LANCZOS).save('public/apple-touch-icon.png', optimize=True)
print('public/apple-touch-icon.png', S, 'x', S)

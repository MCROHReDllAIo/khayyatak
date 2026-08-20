"""Extract Khayyatak logo as transparent PNG from cream-background artwork."""
from pathlib import Path
from PIL import Image

SRC = Path(
    r"C:\Users\omani\.cursor\projects\d-Smart-Tailor-AI\assets"
    r"\c__Users_omani_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images"
    r"_ChatGPT_Image_Aug_21__2026__02_54_42_AM-2d81ee0b-90b0-4f02-b1b8-f2aaff09ed10.png"
)
OUT = Path(r"D:\Smart Tailor AI\public\brand\khayyatak-logo.png")

img = Image.open(SRC).convert("RGBA")
w, h = img.size
px = img.load()
print("source", w, h)

# Sample background (cream)
samples = [px[10, 10], px[w - 10, 10], px[10, h - 10], px[w // 2, 20]]
print("bg samples", samples)

out = Image.new("RGBA", (w, h), (0, 0, 0, 0))
opx = out.load()

for y in range(h):
    for x in range(w):
        r, g, b, a = px[x, y]
        lum = 0.2126 * r + 0.7152 * g + 0.0722 * b

        # Cream / near-white paper → transparent
        if lum >= 200:
            continue
        # Soft cream midtones near bg
        if lum >= 170 and min(r, g, b) > 150:
            continue

        # Keep dark artwork with anti-aliased alpha
        if lum <= 90:
            alpha = 255
        elif lum < 170:
            alpha = int(255 * (170 - lum) / 80)
        else:
            continue

        if alpha < 12:
            continue

        # Preserve original dark ink color (don't force navy — keeps logo authentic)
        opx[x, y] = (r, g, b, alpha)

bbox = out.getbbox()
if not bbox:
    raise SystemExit("No logo pixels found")

pad = 40
cropped = out.crop(
    (
        max(0, bbox[0] - pad),
        max(0, bbox[1] - pad),
        min(w, bbox[2] + pad),
        min(h, bbox[3] + pad),
    )
)

OUT.parent.mkdir(parents=True, exist_ok=True)
cropped.save(OUT, "PNG", optimize=True)
print("saved", OUT, cropped.size, cropped.mode)
p = cropped.load()
cw, ch = cropped.size
print("corner", p[2, 2], "center", p[cw // 2, ch // 2])

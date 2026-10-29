#!/usr/bin/env python3
"""Cut clean, text-free reference frames out of the storyboard collage.

Every crop sits inside the cream gutters of the storyboard and avoids the
scene headings, production notes and the "YOUR LOGO HERE" card, so nothing
but photography is ever fed to Higgsfield.

Usage:
    python3 tools/extract_reference_frames.py            # from campaigns/silk-scarf-nyc
"""
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parent.parent
STORYBOARD = ROOT / "source" / "storyboard.jpg"
PRODUCT = ROOT / "source" / "scarf-product.jpg"
OUT = ROOT / "reference-frames"

UPSCALE = 3  # storyboard panels are ~200-480 px; uploaders prefer >= 1000 px

# id: (left, top, right, bottom) in storyboard pixels (1024 x 1536 source).
# Gutter rows: 82-84, 401-404, 694-697, 982-985, 1244-1246.
PANELS = {
    "P01_S1_model1_walk_wide":     (300, 86, 700, 400),    # right of the Scene 1 notes
    "P02_S1_model1_portrait":      (702, 86, 896, 400),
    "P03_S1_scarf_knot_detail":    (901, 86, 1024, 400),
    "P04_S2_silk_flow_macro":      (0, 406, 395, 693),
    "P05_S2_model1_breeze":        (400, 406, 734, 693),
    "P06_S3_model2_cafe_medium":   (256, 699, 735, 981),
    "P07_S3_model2_hands_knot":    (738, 699, 1024, 846),
    "P08_S3_border_fabric_detail": (738, 851, 1024, 981),
    "P09_S4_model3_medium_cu":     (0, 987, 376, 1243),
    "P10_S4_model3_reflection":    (380, 987, 683, 1243),
    "P11_S5_model1_walk_past":     (256, 1248, 588, 1536),
    "P12_S5_model1_scarf_closeup": (592, 1248, 818, 1536),
}

# Product flat lay: tight square around the scarf with a small white margin.
PRODUCT_BOX = (62, 189, 506, 654)


def enlarge(img: Image.Image, factor: int) -> Image.Image:
    big = img.resize((img.width * factor, img.height * factor), Image.LANCZOS)
    return big.filter(ImageFilter.UnsharpMask(radius=1.4, percent=55, threshold=2))


def contact_sheet(items, path: Path) -> None:
    thumb_h, pad, label_h = 300, 16, 34
    thumbs = []
    for name, img in items:
        w = round(img.width * thumb_h / img.height)
        thumbs.append((name, img.resize((w, thumb_h), Image.LANCZOS)))
    per_row = 4
    rows = [thumbs[i:i + per_row] for i in range(0, len(thumbs), per_row)]
    width = max(sum(t.width for _, t in r) + pad * (len(r) + 1) for r in rows)
    height = len(rows) * (thumb_h + label_h + pad) + pad
    sheet = Image.new("RGB", (width, height), (28, 22, 18))
    draw = ImageDraw.Draw(sheet)
    font = ImageFont.load_default(size=15)
    y = pad
    for r in rows:
        x = pad
        for name, t in r:
            sheet.paste(t, (x, y))
            draw.text((x, y + thumb_h + 8), name, fill=(232, 220, 200), font=font)
            x += t.width + pad
        y += thumb_h + label_h + pad
    sheet.save(path, quality=90)


def main() -> None:
    OUT.mkdir(exist_ok=True)
    board = Image.open(STORYBOARD).convert("RGB")
    sheet_items = []
    for name, box in PANELS.items():
        crop = board.crop(box)
        enlarge(crop, UPSCALE).save(OUT / f"{name}.jpg", quality=95, subsampling=0)
        sheet_items.append((name, crop))
        print(f"{name}: {crop.width}x{crop.height} -> {crop.width * UPSCALE}x{crop.height * UPSCALE}")

    product = Image.open(PRODUCT).convert("RGB").crop(PRODUCT_BOX)
    product.save(OUT / "P00_PRODUCT_scarf_flatlay.jpg", quality=95, subsampling=0)
    sheet_items.insert(0, ("P00_PRODUCT_scarf_flatlay", product))
    print(f"P00_PRODUCT_scarf_flatlay: {product.width}x{product.height}")

    contact_sheet(sheet_items, OUT / "_contact_sheet.jpg")


if __name__ == "__main__":
    main()

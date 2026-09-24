"""Comprime fotos de stock para caber en el deploy de Vercel Hobby (100 MB)."""
from __future__ import annotations

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
STOCK = ROOT / "public" / "cars" / "stock"
MAX_EDGE = 1400
QUALITY = 72


def main() -> None:
    files = [p for p in STOCK.rglob("*") if p.suffix.lower() in {".jpg", ".jpeg", ".png", ".webp"}]
    before = sum(p.stat().st_size for p in files)
    changed = 0
    for src in files:
        with Image.open(src) as im:
            rgb = im.convert("RGB")
            rgb.thumbnail((MAX_EDGE, MAX_EDGE))
            dest = src.with_suffix(".jpg")
            rgb.save(dest, "JPEG", quality=QUALITY, optimize=True)
        if dest != src and src.exists():
            src.unlink()
        changed += 1
    after_files = [p for p in STOCK.rglob("*.jpg")]
    after = sum(p.stat().st_size for p in after_files)
    print(
        {
            "files": changed,
            "beforeMB": round(before / 1_000_000, 1),
            "afterMB": round(after / 1_000_000, 1),
        }
    )


if __name__ == "__main__":
    main()

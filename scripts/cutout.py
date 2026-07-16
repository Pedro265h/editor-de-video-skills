#!/usr/bin/env python3
"""Quita el fondo de una imagen (recorte) -> PNG transparente, con rembg.
Uso: python3 scripts/cutout.py <input> <output>
"""
import sys
from rembg import remove
from PIL import Image


def main() -> None:
    if len(sys.argv) != 3:
        print("uso: cutout.py <input> <output>", file=sys.stderr)
        sys.exit(1)
    src, dst = sys.argv[1], sys.argv[2]
    img = Image.open(src).convert("RGBA")
    # alpha matting = bordes más limpios en ilustraciones con contorno
    out = remove(
        img,
        alpha_matting=True,
        alpha_matting_foreground_threshold=250,
        alpha_matting_background_threshold=15,
        alpha_matting_erode_size=3,
    )
    # Recorta al contenido (bbox del alpha) para tamaño consistente entre escenas
    bbox = out.getbbox()
    if bbox:
        out = out.crop(bbox)
    out.save(dst)
    print(f"OK {dst} {out.size}")


if __name__ == "__main__":
    main()

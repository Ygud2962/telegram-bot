from __future__ import annotations

import json
import math
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "frontend" / "assets" / "daemon"
SIZE = 512
SCALE = 3
CANVAS = SIZE * SCALE

MOODS = ("idle", "alert", "happy", "hungry", "sad", "levelup")
PALETTES = [
    ("#64d2ff", "#007aff", "#00ff84"),
    ("#5ac8fa", "#00c7be", "#ffee66"),
    ("#7dd3fc", "#3b82f6", "#34c759"),
    ("#ff9f0a", "#ff453a", "#ffd60a"),
    ("#bf5af2", "#64d2ff", "#ffffff"),
    ("#ff6b35", "#ff375f", "#ffd60a"),
    ("#34c759", "#0a84ff", "#ffee66"),
    ("#00ff84", "#bf5af2", "#64d2ff"),
    ("#ffd60a", "#ff9f0a", "#64d2ff"),
    ("#ffffff", "#64d2ff", "#ffd60a"),
]

NAMES = [
    "spark-core",
    "pixel-worm",
    "ids-wolf",
    "firewall-lynx",
    "scanner-owl",
    "proxy-fox",
    "soc-griffin",
    "quantum-dragon",
    "zero-sentinel",
    "hologram-dragon",
]


def hex_to_rgba(value: str, alpha: int = 255) -> tuple[int, int, int, int]:
    value = value.lstrip("#")
    return int(value[0:2], 16), int(value[2:4], 16), int(value[4:6], 16), alpha


def p(value: float) -> int:
    return int(round(value * SCALE))


def pts(points: list[tuple[float, float]]) -> list[tuple[int, int]]:
    return [(p(x), p(y)) for x, y in points]


def ellipse_box(cx: float, cy: float, rx: float, ry: float) -> tuple[int, int, int, int]:
    return p(cx - rx), p(cy - ry), p(cx + rx), p(cy + ry)


def add_blur(base: Image.Image, layer: Image.Image, radius: float) -> None:
    base.alpha_composite(layer.filter(ImageFilter.GaussianBlur(p(radius))))


def draw_soft_ellipse(
    base: Image.Image,
    cx: float,
    cy: float,
    rx: float,
    ry: float,
    color: tuple[int, int, int, int],
    blur: float,
) -> None:
    layer = Image.new("RGBA", (CANVAS, CANVAS), (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)
    draw.ellipse(ellipse_box(cx, cy, rx, ry), fill=color)
    add_blur(base, layer, blur)


def draw_line_glow(
    base: Image.Image,
    points: list[tuple[float, float]],
    color: tuple[int, int, int, int],
    width: float,
    blur: float,
) -> None:
    layer = Image.new("RGBA", (CANVAS, CANVAS), (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)
    draw.line(pts(points), fill=color, width=p(width), joint="curve")
    add_blur(base, layer, blur)
    ImageDraw.Draw(base).line(pts(points), fill=color, width=p(max(1, width * 0.45)), joint="curve")


def draw_body(
    base: Image.Image,
    draw: ImageDraw.ImageDraw,
    level: int,
    primary: str,
    secondary: str,
    accent: str,
    mood: str,
) -> None:
    primary_rgba = hex_to_rgba(primary, 235)
    secondary_rgba = hex_to_rgba(secondary, 210)
    accent_rgba = hex_to_rgba(accent, 245)
    dark = (7, 12, 23, 242)
    plate = (*hex_to_rgba(secondary, 135)[:3], 150)
    hungry_dim = mood in {"hungry", "sad"}
    eye = {
        "alert": (255, 69, 58, 255),
        "hungry": (255, 214, 10, 235),
        "sad": (100, 210, 255, 210),
        "levelup": (255, 214, 10, 255),
        "happy": (0, 255, 132, 255),
    }.get(mood, accent_rgba)
    if hungry_dim:
        dark = (15, 18, 28, 220)
        primary_rgba = (*primary_rgba[:3], 180)
        secondary_rgba = (*secondary_rgba[:3], 155)

    # Tail and wings behind the body.
    if level >= 6:
        tail = pts([(326, 300), (423, 288), (432, 202), (357, 192), (412, 258), (324, 260)])
        draw.polygon(tail, fill=(8, 13, 24, 225), outline=secondary_rgba)
        draw.line(pts([(344, 272), (392, 254), (380, 220)]), fill=accent_rgba, width=p(4))

    if level >= 5:
        left_wing = pts([(205, 236), (92, 136), (56, 246), (120, 350), (146, 281)])
        right_wing = pts([(307, 236), (420, 136), (456, 246), (392, 350), (366, 281)])
        draw.polygon(left_wing, fill=(9, 14, 26, 222), outline=primary_rgba)
        draw.polygon(right_wing, fill=(9, 14, 26, 222), outline=primary_rgba)
        draw.line(pts([(112, 171), (144, 276), (78, 249)]), fill=(*hex_to_rgba(primary, 190)[:3], 190), width=p(4))
        draw.line(pts([(400, 171), (368, 276), (434, 249)]), fill=(*hex_to_rgba(primary, 190)[:3], 190), width=p(4))

    if level >= 2:
        for cx, cy, radius in [(190, 336, 56), (256, 354, 68), (322, 336, 56)]:
            draw.ellipse(ellipse_box(cx, cy, radius, radius * 0.82), fill=(7, 12, 23, 232), outline=primary_rgba, width=p(4))
            draw.ellipse(ellipse_box(cx, cy - 6, radius * 0.48, radius * 0.34), fill=(*hex_to_rgba(secondary, 95)[:3], 95))

    # Main torso.
    draw.ellipse(ellipse_box(256, 295, 92, 116), fill=dark, outline=primary_rgba, width=p(5))
    draw.ellipse(ellipse_box(256, 298, 56, 74), fill=(*hex_to_rgba(secondary, 96)[:3], 96))

    if level >= 4:
        armor = pts([(184, 274), (220, 220), (292, 220), (328, 274), (306, 354), (256, 378), (206, 354)])
        draw.polygon(armor, fill=plate, outline=(255, 255, 255, 92))
        draw.line(pts([(214, 277), (298, 277), (286, 336), (226, 336), (214, 277)]), fill=(*hex_to_rgba(accent, 160)[:3], 160), width=p(3))

    if level >= 3:
        draw.polygon(pts([(185, 382), (132, 452), (224, 432)]), fill=(8, 13, 23, 232), outline=primary_rgba)
        draw.polygon(pts([(327, 382), (380, 452), (288, 432)]), fill=(8, 13, 23, 232), outline=primary_rgba)
        if level >= 7:
            draw.polygon(pts([(132, 452), (104, 492), (168, 462)]), fill=accent_rgba)
            draw.polygon(pts([(380, 452), (408, 492), (344, 462)]), fill=accent_rgba)

    if level >= 8:
        draw.polygon(pts([(206, 143), (169, 42), (244, 111)]), fill=accent_rgba, outline=primary_rgba)
        draw.polygon(pts([(306, 143), (343, 42), (268, 111)]), fill=accent_rgba, outline=primary_rgba)

    if level >= 3:
        draw.polygon(pts([(203, 151), (112, 82), (142, 206)]), fill=(8, 13, 23, 230), outline=primary_rgba)
        draw.polygon(pts([(309, 151), (400, 82), (370, 206)]), fill=(8, 13, 23, 230), outline=primary_rgba)

    # Head and face.
    draw.ellipse(ellipse_box(256, 188, 111, 116), fill=dark, outline=primary_rgba, width=p(6))
    draw.ellipse(ellipse_box(256, 190, 72, 76), fill=(255, 255, 255, 26), outline=(255, 255, 255, 66), width=p(2))
    draw.ellipse(ellipse_box(256, 190, 58, 58), fill=(*hex_to_rgba(secondary, 100)[:3], 100))

    if level >= 2:
        draw_line_glow(base, [(218, 112), (188, 54), (152, 34)], accent_rgba, 3, 4)
        draw_line_glow(base, [(294, 112), (324, 54), (360, 34)], accent_rgba, 3, 4)
        draw.ellipse(ellipse_box(152, 34, 11, 11), fill=accent_rgba)
        draw.ellipse(ellipse_box(360, 34, 11, 11), fill=accent_rgba)

    # Eyes.
    eye_rx = 14 if level >= 8 else 11
    draw.ellipse(ellipse_box(226, 188, eye_rx, eye_rx), fill=eye)
    draw.ellipse(ellipse_box(286, 188, eye_rx, eye_rx), fill=eye)
    draw.ellipse(ellipse_box(222, 184, 4, 4), fill=(255, 255, 255, 210))
    draw.ellipse(ellipse_box(282, 184, 4, 4), fill=(255, 255, 255, 210))

    # Mouth by mood.
    if mood in {"happy", "levelup"}:
        draw.arc((p(225), p(202), p(287), p(253)), 12, 168, fill=eye, width=p(5))
    elif mood in {"hungry", "sad"}:
        draw.arc((p(225), p(222), p(287), p(272)), 192, 348, fill=eye, width=p(5))
    elif mood == "alert":
        draw.line(pts([(229, 230), (283, 230)]), fill=eye, width=p(5))
    else:
        draw.arc((p(229), p(208), p(283), p(252)), 24, 156, fill=eye, width=p(4))

    core_radius = 18 + min(15, level * 2)
    core_color = (255, 214, 10, 255) if mood == "levelup" else accent_rgba
    draw.ellipse(ellipse_box(256, 322, core_radius, core_radius), fill=core_color)
    draw.ellipse(ellipse_box(256, 322, core_radius * 0.42, core_radius * 0.42), fill=(255, 255, 255, 160))

    # Circuit details.
    for offset in (-32, 32):
        draw.line(pts([(256 + offset, 254), (256 + offset, 292), (256 + offset / 2, 306)]), fill=(*hex_to_rgba(primary, 155)[:3], 155), width=p(3))

    if level >= 9:
        draw.ellipse(ellipse_box(256, 74, 98, 27), outline=accent_rgba, width=p(8))

    if level >= 10:
        for points in [
            [(92, 78), (142, 38), (168, 112)],
            [(412, 84), (362, 42), (334, 118)],
            [(112, 404), (156, 462), (82, 476)],
        ]:
            draw.polygon(pts(points), fill=(255, 255, 255, 58), outline=primary_rgba)
        draw.arc((p(92), p(400), p(420), p(524)), 198, 342, fill=accent_rgba, width=p(4))


def generate(level: int, mood: str) -> Image.Image:
    primary, secondary, accent = PALETTES[level - 1]
    if mood == "alert":
        accent = "#ff453a"
    elif mood == "levelup":
        accent = "#ffd60a"
    elif mood == "hungry":
        accent = "#ffee66"
    elif mood == "sad":
        accent = "#64d2ff"

    img = Image.new("RGBA", (CANVAS, CANVAS), (0, 0, 0, 0))

    # Painted glow and soft base.
    draw_soft_ellipse(img, 256, 246, 178 + level * 7, 198 + level * 4, (*hex_to_rgba(primary, 80)[:3], 80), 34)
    draw_soft_ellipse(img, 256, 346, 126, 44, (0, 0, 0, 82), 18)
    if mood in {"happy", "levelup"}:
        draw_soft_ellipse(img, 256, 250, 230, 230, (*hex_to_rgba(accent, 94)[:3], 94), 42)
    if mood == "alert":
        draw_soft_ellipse(img, 256, 220, 210, 178, (255, 69, 58, 72), 38)
    if mood == "hungry":
        draw_soft_ellipse(img, 256, 305, 175, 125, (255, 214, 10, 44), 34)

    draw = ImageDraw.Draw(img)
    draw_body(img, draw, level, primary, secondary, accent, mood)

    # Top highlights and light scratches make it feel less like flat vector art.
    overlay = Image.new("RGBA", (CANVAS, CANVAS), (0, 0, 0, 0))
    od = ImageDraw.Draw(overlay)
    for i in range(18):
        angle = (i * 31 + level * 13) % 360
        radius = 72 + (i % 5) * 22
        x = 256 + math.cos(math.radians(angle)) * radius
        y = 260 + math.sin(math.radians(angle)) * radius * 0.74
        od.ellipse(ellipse_box(x, y, 2.2, 2.2), fill=(255, 255, 255, 42))
    img.alpha_composite(overlay.filter(ImageFilter.GaussianBlur(p(0.35))))

    return img.resize((SIZE, SIZE), Image.Resampling.LANCZOS)


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    manifest = {"style": "original raster cyber-anime daemon", "levels": []}
    for level in range(1, 11):
        folder = OUT / f"level-{level:02d}"
        folder.mkdir(parents=True, exist_ok=True)
        manifest["levels"].append({"level": level, "name": NAMES[level - 1], "moods": list(MOODS)})
        for mood in MOODS:
            image = generate(level, mood)
            image.save(folder / f"{mood}.png", optimize=True)
    (OUT / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Generated {10 * len(MOODS)} daemon PNG assets in {OUT}")


if __name__ == "__main__":
    main()

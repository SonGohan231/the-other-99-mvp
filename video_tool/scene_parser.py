"""Parse Polish script TXT files into timed scenes."""
import re
import os
import json


SECTION_TITLES = {
    "01": "MASZ PRAWO DO LECZENIA.\nNIE MASZ PRAWA DO CZASU",
    "02": "KOLEJKA",
    "03": "PRYWATNIE",
    "04": "SYSTEM",
    "05": "REHABILITACJA",
    "06": "NAPRAWA",
}

# Words per second estimate for Polish documentary narration (slow, deliberate)
WPS = 2.3


def _sentences_from_block(block: str) -> list[str]:
    """Split a paragraph block into sentences."""
    block = block.strip()
    if not block:
        return []
    parts = re.split(r'(?<=[.!?…])\s+', block)
    return [p.strip() for p in parts if p.strip()]


def _word_count(text: str) -> int:
    return len(text.split())


def _duration_estimate(text: str) -> float:
    return _word_count(text) / WPS


def _merge_fragments(fragments: list[str], min_sec=8.0, max_sec=18.0) -> list[str]:
    """Merge short fragments so each scene is between min_sec and max_sec."""
    scenes = []
    buf = ""
    for frag in fragments:
        candidate = (buf + " " + frag).strip() if buf else frag
        if _duration_estimate(candidate) > max_sec and buf:
            scenes.append(buf.strip())
            buf = frag
        else:
            buf = candidate
            if _duration_estimate(buf) >= min_sec:
                scenes.append(buf.strip())
                buf = ""
    if buf.strip():
        scenes.append(buf.strip())
    return scenes


def parse_script_file(filepath: str, part_index: int) -> list[dict]:
    """Return list of scene dicts from a script file."""
    with open(filepath, encoding="utf-8") as f:
        raw = f.read()

    part_id = os.path.basename(filepath)[:2]

    # Split into paragraph blocks
    blocks = [b.strip() for b in re.split(r'\n{2,}', raw) if b.strip()]

    # Flatten into sentence fragments
    fragments = []
    for block in blocks:
        fragments.extend(_sentences_from_block(block))

    # Merge into properly sized scenes
    scene_texts = _merge_fragments(fragments)

    scenes = []
    for i, text in enumerate(scene_texts):
        scene_num = f"{part_index:02d}_{i+1:03d}"
        scenes.append({
            "scene_id": scene_num,
            "part": part_index,
            "part_id": part_id,
            "text": text,
            "duration_estimate": round(_duration_estimate(text), 1),
            "word_count": _word_count(text),
        })
    return scenes


def parse_all_scripts(scripts_dir: str) -> list[dict]:
    files = sorted([
        f for f in os.listdir(scripts_dir)
        if f.endswith(".txt") and f[0].isdigit()
    ])
    all_scenes = []
    for idx, fname in enumerate(files, start=1):
        path = os.path.join(scripts_dir, fname)
        scenes = parse_script_file(path, idx)
        # Insert section title card before each part
        part_id = fname[:2]
        title = SECTION_TITLES.get(part_id, f"CZĘŚĆ {idx}")
        all_scenes.append({
            "scene_id": f"{idx:02d}_000_title",
            "part": idx,
            "part_id": part_id,
            "text": title,
            "duration_estimate": 3.0,
            "word_count": 0,
            "is_title_card": True,
        })
        all_scenes.extend(scenes)
    return all_scenes


if __name__ == "__main__":
    import sys
    scripts_dir = sys.argv[1] if len(sys.argv) > 1 else "scripts"
    scenes = parse_all_scripts(scripts_dir)
    print(f"Parsed {len(scenes)} scenes")
    for s in scenes[:5]:
        print(json.dumps(s, ensure_ascii=False, indent=2))

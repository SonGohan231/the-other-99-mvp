#!/usr/bin/env python3
"""
make_video.py — Polish Documentary Essay Video Generator
Usage: python make_video.py [--test-part 1] [--skip-download] [--no-lower-thirds]

Environment variables:
  PEXELS_API_KEY   — Pexels video API key
  PIXABAY_API_KEY  — Pixabay video API key
"""
import os
import sys
import json
import argparse
import subprocess
import time

# ── Paths ──────────────────────────────────────────────────────────────────────
BASE_DIR    = os.path.dirname(os.path.abspath(__file__))
SCRIPTS_DIR = os.path.join(BASE_DIR, "scripts")
ASSETS_DIR  = os.path.join(BASE_DIR, "assets", "stock")
OUTPUT_DIR  = os.path.join(BASE_DIR, "output")
DOWNLOADS_DIR = os.path.join(BASE_DIR, "downloads")

VOICEOVER_COMBINED = os.path.join(SCRIPTS_DIR, "voiceover_combined.mp3")
FINAL_VIDEO_ASSEMBLY = os.path.join(OUTPUT_DIR, "final_video_assembly.mp4")
FINAL_VIDEO          = os.path.join(OUTPUT_DIR, "final_video.mp4")

os.makedirs(OUTPUT_DIR, exist_ok=True)
os.makedirs(DOWNLOADS_DIR, exist_ok=True)
os.makedirs(ASSETS_DIR, exist_ok=True)

# ── API keys from env ──────────────────────────────────────────────────────────
# Set here as defaults if not already in environment
if not os.environ.get("PEXELS_API_KEY"):
    os.environ["PEXELS_API_KEY"] = "oBAuXb1LDHTISZCAdL8f7SkQrQsF2rZzwuZ8vYyuC05clZIxZI8eYzhK"
if not os.environ.get("PIXABAY_API_KEY"):
    os.environ["PIXABAY_API_KEY"] = "56292248-466306b347e73b1619f174eb8"


def banner(msg: str):
    print(f"\n{'─'*60}")
    print(f"  {msg}")
    print('─'*60)


def check_ffmpeg():
    try:
        subprocess.run(["ffmpeg", "-version"], capture_output=True, check=True)
    except (subprocess.CalledProcessError, FileNotFoundError):
        print("ERROR: ffmpeg not found. Install it: sudo apt install ffmpeg")
        sys.exit(1)


def parse_args():
    p = argparse.ArgumentParser(description="Polish documentary video generator")
    p.add_argument("--test-part", type=int, default=0,
                   help="Only process part N (1-6) for testing")
    p.add_argument("--skip-download", action="store_true",
                   help="Skip stock search/download, use cached or fallback")
    p.add_argument("--no-lower-thirds", action="store_true",
                   help="Disable lower-third text overlays")
    p.add_argument("--max-scenes", type=int, default=0,
                   help="Limit total scenes (for quick test)")
    return p.parse_args()


def main():
    args = parse_args()
    check_ffmpeg()

    # ── STEP 1: Parse scripts ──────────────────────────────────────────────────
    banner("STEP 1: Parsing scripts")
    from scene_parser import parse_all_scripts
    scenes = parse_all_scripts(SCRIPTS_DIR)

    if args.test_part:
        scenes = [s for s in scenes if s["part"] == args.test_part
                  or (s.get("is_title_card") and s["part"] == args.test_part)]
        print(f"  Test mode: part {args.test_part} → {len(scenes)} scenes")

    if args.max_scenes:
        title_scenes = [s for s in scenes if s.get("is_title_card")]
        content_scenes = [s for s in scenes if not s.get("is_title_card")][:args.max_scenes]
        scenes = sorted(title_scenes + content_scenes, key=lambda s: s["scene_id"])

    print(f"  Total scenes: {len(scenes)}")

    # ── STEP 2: Build storyboard ───────────────────────────────────────────────
    banner("STEP 2: Building storyboard")
    from storyboard import build_storyboard
    scenes = build_storyboard(scenes)

    # ── STEP 3: Audio timing ───────────────────────────────────────────────────
    banner("STEP 3: Audio timing")
    from audio_handler import concatenate_voiceovers, get_part_durations, assign_scene_durations

    part_durations = get_part_durations(SCRIPTS_DIR)
    if part_durations:
        print(f"  Found voiceover parts: {sorted(part_durations.keys())}")
        total_audio = sum(part_durations.values())
        print(f"  Total audio: {total_audio:.1f}s ({total_audio/60:.1f}min)")

        if args.test_part:
            part_durations_filtered = {k: v for k, v in part_durations.items() if k == args.test_part}
        else:
            part_durations_filtered = part_durations

        scenes = assign_scene_durations(scenes, part_durations_filtered)

        # Concatenate voiceovers
        if not os.path.exists(VOICEOVER_COMBINED) or os.path.getsize(VOICEOVER_COMBINED) < 1000:
            print("  Concatenating voiceover parts…")
            concat_dur = concatenate_voiceovers(SCRIPTS_DIR, VOICEOVER_COMBINED)
            print(f"  Combined voiceover: {concat_dur:.1f}s")
        else:
            print(f"  Using cached combined voiceover")
    else:
        print("  No voiceover files found, using estimated durations")

    # Save storyboard early for inspection
    storyboard_json = os.path.join(OUTPUT_DIR, "storyboard.json")
    with open(storyboard_json, "w", encoding="utf-8") as f:
        json.dump(scenes, f, ensure_ascii=False, indent=2)
    print(f"  Saved storyboard preview: {storyboard_json}")

    # ── STEP 4: Stock search ───────────────────────────────────────────────────
    stock_results: dict = {}
    if not args.skip_download:
        banner("STEP 4: Stock video search")
        from stock_search import search_bulk
        stock_results = search_bulk(scenes, delay=0.5)
        found = sum(1 for v in stock_results.values() if v is not None)
        print(f"  Found stock for {found}/{len(scenes)} scenes")
    else:
        banner("STEP 4: Skipping stock search (--skip-download)")
        stock_results = {s["scene_id"]: None for s in scenes}

    # ── STEP 5: Download clips ─────────────────────────────────────────────────
    local_clips: dict = {}
    if not args.skip_download:
        banner("STEP 5: Downloading clips")
        from downloader import download_bulk
        local_clips = download_bulk(stock_results)
        downloaded = sum(1 for v in local_clips.values() if v is not None)
        print(f"  Downloaded {downloaded}/{len(scenes)} clips")
    else:
        banner("STEP 5: Skipping download (--skip-download)")
        local_clips = {s["scene_id"]: None for s in scenes}

    # ── STEP 6: Process clips ──────────────────────────────────────────────────
    banner("STEP 6: Processing clips (FFmpeg)")
    from clip_processor import process_bulk
    processed_clips = process_bulk(scenes, local_clips, ASSETS_DIR)
    print(f"  Processed {len(processed_clips)} clips")

    # ── STEP 7: Assemble video ─────────────────────────────────────────────────
    banner("STEP 7: Assembling video")
    from assembler import assemble_video
    ok = assemble_video(
        scenes,
        processed_clips,
        FINAL_VIDEO_ASSEMBLY,
        add_lower_thirds=not args.no_lower_thirds,
    )
    if not ok:
        print("ERROR: Assembly failed")
        sys.exit(1)

    # ── STEP 8: Mux audio ─────────────────────────────────────────────────────
    banner("STEP 8: Muxing audio")
    # assemble_video writes a _silent.mp4 suffixed file
    silent_path = FINAL_VIDEO_ASSEMBLY.replace(".mp4", "_silent.mp4")

    if os.path.exists(VOICEOVER_COMBINED) and os.path.getsize(VOICEOVER_COMBINED) > 1000:
        from audio_handler import mux_audio_video
        print(f"  Muxing with voiceover: {VOICEOVER_COMBINED}")
        ok = mux_audio_video(silent_path, VOICEOVER_COMBINED, FINAL_VIDEO)
        if not ok:
            print("  Mux failed, copying silent video as output")
            import shutil
            shutil.copy(silent_path, FINAL_VIDEO)
    else:
        import shutil
        print("  No voiceover, copying silent video")
        shutil.copy(silent_path, FINAL_VIDEO)

    # ── STEP 9: Export storyboard + credits ───────────────────────────────────
    banner("STEP 9: Exporting storyboard & credits")
    from exporter import export_storyboard
    export_storyboard(scenes, OUTPUT_DIR, stock_results)

    # ── DONE ──────────────────────────────────────────────────────────────────
    banner("DONE")
    if os.path.exists(FINAL_VIDEO):
        size_mb = os.path.getsize(FINAL_VIDEO) / 1_048_576
        print(f"  Final video : {FINAL_VIDEO}")
        print(f"  Size        : {size_mb:.1f} MB")
    print(f"  Storyboard  : {os.path.join(OUTPUT_DIR, 'storyboard.csv')}")
    print(f"  Credits     : {os.path.join(OUTPUT_DIR, 'credits.txt')}")
    print()
    print(f"  To play: vlc {FINAL_VIDEO}")


if __name__ == "__main__":
    main()

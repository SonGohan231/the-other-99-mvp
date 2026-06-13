"""
Handle voiceover audio: concatenate per-part MP3s, measure total duration,
and compute per-scene audio timing based on text proportions.
"""
import os
import subprocess
import json


def _probe_duration(path: str) -> float:
    try:
        r = subprocess.run(
            ["ffprobe", "-v", "quiet", "-show_entries", "format=duration",
             "-of", "csv=p=0", path],
            capture_output=True, text=True, timeout=15
        )
        return float(r.stdout.strip() or 0)
    except Exception:
        return 0.0


def concatenate_voiceovers(scripts_dir: str, output_path: str) -> float:
    """
    Find per-part voiceover files (01_voiceover.mp3 … 06_voiceover.mp3),
    concatenate them into a single MP3, return total duration.
    """
    parts = sorted([
        os.path.join(scripts_dir, f)
        for f in os.listdir(scripts_dir)
        if f.endswith("_voiceover.mp3")
    ])
    if not parts:
        return 0.0

    if len(parts) == 1:
        import shutil
        shutil.copy(parts[0], output_path)
        return _probe_duration(output_path)

    # Build concat list file
    list_file = output_path + ".list.txt"
    with open(list_file, "w") as f:
        for p in parts:
            f.write(f"file '{p}'\n")

    result = subprocess.run(
        [
            "ffmpeg", "-y",
            "-f", "concat", "-safe", "0",
            "-i", list_file,
            "-c", "copy",
            output_path
        ],
        capture_output=True, text=True, timeout=120
    )
    os.remove(list_file)
    if result.returncode != 0:
        print(f"  Audio concat error: {result.stderr[-300:]}")
        return 0.0

    return _probe_duration(output_path)


def get_part_durations(scripts_dir: str) -> dict[int, float]:
    """Return {part_index: duration_seconds} for each voiceover file."""
    durations = {}
    for f in sorted(os.listdir(scripts_dir)):
        if f.endswith("_voiceover.mp3") and f[0].isdigit():
            part = int(f.split("_")[0])
            path = os.path.join(scripts_dir, f)
            durations[part] = _probe_duration(path)
    return durations


def assign_scene_durations(scenes: list[dict], part_durations: dict[int, float]) -> list[dict]:
    """
    Redistribute scene durations so they sum exactly to the voiceover
    duration for each part (proportional to word count).
    Title cards get a fixed 3.0s gap (not drawn from voiceover budget).
    """
    from collections import defaultdict

    # Group non-title scenes by part
    part_scenes: dict[int, list[dict]] = defaultdict(list)
    for scene in scenes:
        if not scene.get("is_title_card"):
            part_scenes[scene["part"]].append(scene)

    for part, part_scene_list in part_scenes.items():
        total_audio = part_durations.get(part, 0.0)
        if total_audio <= 0:
            continue

        # Subtract title card duration from audio budget (shown as visual gap)
        total_words = sum(s["word_count"] for s in part_scene_list)
        if total_words == 0:
            continue

        for scene in part_scene_list:
            proportion = scene["word_count"] / total_words
            scene["duration_audio"] = round(proportion * total_audio, 2)
            scene["duration_estimate"] = scene["duration_audio"]

    return scenes


def mux_audio_video(video_path: str, audio_path: str, output_path: str) -> bool:
    """Mux final video with voiceover audio, matching video to audio duration."""
    audio_dur = _probe_duration(audio_path)
    if audio_dur <= 0:
        return False

    result = subprocess.run(
        [
            "ffmpeg", "-y",
            "-i", video_path,
            "-i", audio_path,
            "-c:v", "copy",
            "-c:a", "aac", "-b:a", "192k",
            "-shortest",
            "-map", "0:v:0", "-map", "1:a:0",
            output_path
        ],
        capture_output=True, text=True, timeout=600
    )
    if result.returncode != 0:
        print(f"  Mux error: {result.stderr[-400:]}")
        return False
    return True

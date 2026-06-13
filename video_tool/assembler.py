"""
Concatenate processed clips into a single video using FFmpeg concat demuxer.
Optionally adds lower-third text overlays.
"""
import os
import subprocess
import tempfile


W, H = 1920, 1080
FPS = 30


def _run(cmd: list[str], label: str = "") -> bool:
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=3600)
        if result.returncode != 0:
            print(f"  FFmpeg error [{label}]: {result.stderr[-500:]}")
            return False
        return True
    except subprocess.TimeoutExpired:
        print(f"  FFmpeg timeout [{label}]")
        return False


def add_lower_third(clip_path: str, text: str, duration: float, out_path: str) -> bool:
    """Burn lower-third subtitle text onto a clip."""
    # Truncate to ~70 chars to avoid overflow
    display = text[:70] + ("…" if len(text) > 70 else "")
    safe = display.replace("'", "").replace(":", r"\:").replace("\\", "")

    # Lower third: white text on semi-transparent black bar
    # Using drawbox + drawtext
    bar_y = H - 130
    vf = (
        f"drawbox=x=0:y={bar_y}:w={W}:h=100:color=black@0.6:t=fill,"
        f"drawtext=fontsize=34:fontcolor=white:x=60:y={bar_y+32}"
        f":text='{safe}'"
        f":fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
        f":alpha='if(lt(t\\,0.3)\\,t/0.3\\,if(lt(t\\,{duration-0.3:.1f})\\,1\\,({duration:.1f}-t)/0.3))'"
    )
    cmd = [
        "ffmpeg", "-y",
        "-i", clip_path,
        "-vf", vf,
        "-c:v", "libx264", "-preset", "fast", "-crf", "20",
        "-t", str(duration), "-an",
        "-pix_fmt", "yuv420p",
        out_path
    ]
    return _run(cmd, "lower_third")


def assemble_video(
    scenes: list[dict],
    processed_clips: dict[str, str],
    output_path: str,
    add_lower_thirds: bool = True,
) -> bool:
    """
    Concatenate all processed clips in order.
    Apply lower-thirds for flagged scenes.
    Returns True on success.
    """
    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    # Build list of final clips in order
    clip_list = []
    lt_dir = os.path.join(os.path.dirname(output_path), "lower_thirds")
    if add_lower_thirds:
        os.makedirs(lt_dir, exist_ok=True)

    for scene in scenes:
        scene_id = scene["scene_id"]
        clip_path = processed_clips.get(scene_id)

        if not clip_path or not os.path.exists(clip_path):
            print(f"  WARNING: Missing clip for {scene_id}, skipping")
            continue

        duration = scene.get("duration_estimate", 8.0)

        # Apply lower-third if flagged
        if add_lower_thirds and scene.get("lower_third") and not scene.get("is_title_card"):
            lt_path = os.path.join(lt_dir, f"{scene_id}_lt.mp4")
            lt_text = scene.get("lower_third_text", scene.get("text", ""))[:100]
            if not os.path.exists(lt_path) or os.path.getsize(lt_path) < 1000:
                ok = add_lower_third(clip_path, lt_text, duration, lt_path)
                if ok:
                    clip_path = lt_path

        clip_list.append((scene_id, clip_path, duration))

    if not clip_list:
        print("ERROR: No clips to assemble")
        return False

    print(f"  Assembling {len(clip_list)} clips…")

    # Write concat list
    concat_file = output_path + ".concat.txt"
    with open(concat_file, "w") as f:
        for sid, path, dur in clip_list:
            abs_path = os.path.abspath(path)
            f.write(f"file '{abs_path}'\n")
            f.write(f"duration {dur:.4f}\n")

    base = output_path[:-4] if output_path.endswith(".mp4") else output_path
    silent_out = base + "_silent.mp4"
    cmd = [
        "ffmpeg", "-y",
        "-f", "concat", "-safe", "0",
        "-i", concat_file,
        "-c:v", "libx264", "-preset", "fast", "-crf", "20",
        "-r", str(FPS),
        "-pix_fmt", "yuv420p",
        "-an",
        silent_out
    ]
    ok = _run(cmd, "assemble")
    try:
        os.remove(concat_file)
    except Exception:
        pass

    if ok and os.path.exists(silent_out):
        print(f"  Silent video: {silent_out}")
        return True
    return False

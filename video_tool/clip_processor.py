"""
Normalize clips and apply documentary visual treatment using FFmpeg.
All output clips: 1920x1080, 30fps, H.264, muted audio, documentary look.
"""
import os
import subprocess
import random
import hashlib


PROCESSED_DIR = os.path.join(os.path.dirname(__file__), "downloads", "processed")
W, H = 1920, 1080
FPS = 30

# Fallback solid color clips for title cards / missing footage
FALLBACK_COLOR = "0x0a0a0f"  # near-black blue-grey


def _proc_path(source: str, scene_id: str, duration: float) -> str:
    os.makedirs(PROCESSED_DIR, exist_ok=True)
    h = hashlib.md5(f"{source}{scene_id}{duration:.1f}".encode()).hexdigest()[:12]
    return os.path.join(PROCESSED_DIR, f"{scene_id}_{h}.mp4")


def _run(cmd: list[str], label: str = "") -> bool:
    try:
        result = subprocess.run(
            cmd, capture_output=True, text=True, timeout=120
        )
        if result.returncode != 0:
            print(f"    FFmpeg error [{label}]: {result.stderr[-300:]}")
            return False
        return True
    except subprocess.TimeoutExpired:
        print(f"    FFmpeg timeout [{label}]")
        return False
    except Exception as e:
        print(f"    FFmpeg exception [{label}]: {e}")
        return False


def _slow_zoom_filter(duration: float, direction: str = "in") -> str:
    """Generate zoompan filter for subtle slow zoom."""
    zoom_start = 1.0
    zoom_end = 1.08 if direction == "in" else 1.0
    zoom_start_val = 1.0 if direction == "in" else 1.08
    total_frames = int(duration * FPS)
    # zoompan: z='zoom+0.0002', d=total_frames, s=1920x1080
    z_expr = f"zoom+{(zoom_end - zoom_start_val) / total_frames:.6f}"
    return (
        f"zoompan=z='{z_expr}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)'"
        f":d={total_frames}:s={W}x{H}:fps={FPS}"
    )


def _documentary_vf(duration: float, zoom_direction: str = "in", use_zoom: bool = True) -> str:
    """Build FFmpeg -vf filter chain for documentary look."""
    filters = []

    # 1. Scale and crop to 1920x1080
    filters.append(f"scale={W}:{H}:force_original_aspect_ratio=increase")
    filters.append(f"crop={W}:{H}")

    # 2. Optional slow zoom (skip for very short clips to avoid artifacts)
    if use_zoom and duration >= 5.0:
        filters.append(_slow_zoom_filter(duration, zoom_direction))

    # 3. Desaturation + contrast (cold documentary look)
    # eq: contrast=1.08, brightness=-0.04, saturation=0.65
    filters.append("eq=contrast=1.08:brightness=-0.04:saturation=0.65")

    # 4. Dark vignette overlay via curves
    filters.append("curves=r='0/0 0.5/0.42 1/0.88':g='0/0 0.5/0.45 1/0.90':b='0/0 0.5/0.48 1/0.95'")

    # 5. Subtle grain via noise
    filters.append("noise=alls=8:allf=t+u")

    return ",".join(filters)


def make_color_clip(duration: float, scene_id: str, color: str = FALLBACK_COLOR) -> str:
    """Generate a solid color fallback clip."""
    out = _proc_path("color", scene_id, duration)
    if os.path.exists(out) and os.path.getsize(out) > 1000:
        return out
    cmd = [
        "ffmpeg", "-y",
        "-f", "lavfi",
        "-i", f"color=c={color}:s={W}x{H}:r={FPS}:d={duration}",
        "-c:v", "libx264", "-preset", "fast", "-crf", "23",
        "-t", str(duration), "-an",
        "-pix_fmt", "yuv420p",
        out
    ]
    _run(cmd, f"color_clip_{scene_id}")
    return out


def process_clip(
    source_path: str,
    scene_id: str,
    duration: float,
    zoom_direction: str = "in",
    use_zoom: bool = True,
) -> str | None:
    """
    Process a source video clip:
    - trim/loop to `duration`
    - apply documentary filters
    - output normalized MP4
    Returns output path or None.
    """
    if not source_path or not os.path.exists(source_path):
        return None

    out = _proc_path(source_path, scene_id, duration)
    if os.path.exists(out) and os.path.getsize(out) > 10_000:
        return out

    # Get source duration
    try:
        probe = subprocess.run(
            ["ffprobe", "-v", "quiet", "-show_entries", "format=duration",
             "-of", "csv=p=0", source_path],
            capture_output=True, text=True, timeout=15
        )
        src_duration = float(probe.stdout.strip() or 0)
    except Exception:
        src_duration = 0

    if src_duration <= 0:
        return None

    vf = _documentary_vf(duration, zoom_direction, use_zoom)

    if src_duration >= duration:
        # Trim from a random start point (leave room at end)
        max_start = max(0.0, src_duration - duration - 0.5)
        start = random.uniform(0, max_start) if max_start > 0.5 else 0.0
        cmd = [
            "ffmpeg", "-y",
            "-ss", f"{start:.2f}",
            "-i", source_path,
            "-t", f"{duration:.2f}",
            "-vf", vf,
            "-r", str(FPS),
            "-c:v", "libx264", "-preset", "fast", "-crf", "23",
            "-an", "-pix_fmt", "yuv420p",
            out
        ]
    else:
        # Loop source to fill duration
        loops = int(duration / src_duration) + 2
        cmd = [
            "ffmpeg", "-y",
            "-stream_loop", str(loops),
            "-i", source_path,
            "-t", f"{duration:.2f}",
            "-vf", vf,
            "-r", str(FPS),
            "-c:v", "libx264", "-preset", "fast", "-crf", "23",
            "-an", "-pix_fmt", "yuv420p",
            out
        ]

    ok = _run(cmd, scene_id)
    if ok and os.path.exists(out) and os.path.getsize(out) > 10_000:
        return out
    return None


def make_title_card(text: str, scene_id: str, duration: float = 3.0) -> str:
    """Create a dark title card with white text using FFmpeg drawtext."""
    out = _proc_path("title", scene_id, duration)
    if os.path.exists(out) and os.path.getsize(out) > 1000:
        return out

    color_base = make_color_clip(duration, scene_id + "_base", "0x080810")

    lines = text.split("\n")
    n = len(lines)
    font = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"

    vf_parts = []
    for i, line in enumerate(lines):
        # Sanitize: remove chars that break FFmpeg drawtext
        safe = line.replace("'", "").replace(":", r"\:").replace("\\", "").replace(",", r"\,")
        y_pos = "(h/2-" + str(n * 44) + ")+" + str(i * 88)
        alpha = (
            "if(lt(t\\,0.4)\\,t/0.4\\,"
            "if(lt(t\\," + f"{duration - 0.4:.1f}" + ")\\,1\\,"
            "(" + f"{duration:.1f}" + "-t)/0.4))"
        )
        vf_parts.append(
            f"drawtext=fontsize=60:fontcolor=white@1.0"
            f":x=(w-tw)/2:y={y_pos}"
            f":text='{safe}'"
            f":fontfile={font}"
            f":alpha='{alpha}'"
        )

    vf = ",".join(vf_parts) if vf_parts else "null"

    cmd = [
        "ffmpeg", "-y",
        "-i", color_base,
        "-vf", vf,
        "-c:v", "libx264", "-preset", "fast", "-crf", "18",
        "-t", str(duration), "-an",
        "-pix_fmt", "yuv420p",
        out,
    ]
    ok = _run(cmd, f"title_card_{scene_id}")
    if ok and os.path.exists(out) and os.path.getsize(out) > 1000:
        return out
    return color_base


def process_bulk(
    scenes: list[dict],
    local_clips: dict[str, str | None],
    assets_dir: str,
) -> dict[str, str]:
    """
    Process all scenes → return mapping scene_id → processed_clip_path.
    Falls back to local assets then solid color.
    """
    local_assets = []
    if os.path.isdir(assets_dir):
        local_assets = [
            os.path.join(assets_dir, f)
            for f in os.listdir(assets_dir)
            if f.lower().endswith((".mp4", ".mov", ".avi", ".mkv"))
        ]

    zoom_dirs = ["in", "out", "in", "in", "out", "in"]
    processed: dict[str, str] = {}

    for i, scene in enumerate(scenes):
        scene_id = scene["scene_id"]
        duration = max(scene.get("duration_estimate", 8.0), 2.0)

        if scene.get("is_title_card"):
            print(f"  Title card: {scene_id}")
            path = make_title_card(scene["text"], scene_id, 3.0)
            processed[scene_id] = path
            continue

        zoom = zoom_dirs[i % len(zoom_dirs)]
        source = local_clips.get(scene_id)

        if source and os.path.exists(source):
            print(f"  Processing {scene_id} ({duration:.1f}s) from download…")
            out = process_clip(source, scene_id, duration, zoom)
            if out:
                processed[scene_id] = out
                continue

        # Fallback: use local assets
        if local_assets:
            asset = local_assets[scene.get("fallback_index", i) % len(local_assets)]
            print(f"  Processing {scene_id} ({duration:.1f}s) from local asset…")
            out = process_clip(asset, scene_id + "_local", duration, zoom)
            if out:
                processed[scene_id] = out
                continue

        # Last resort: solid color
        print(f"  Fallback color clip for {scene_id}")
        processed[scene_id] = make_color_clip(duration, scene_id)

    return processed

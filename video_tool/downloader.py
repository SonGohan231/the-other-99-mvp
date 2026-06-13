"""Download stock video clips to /downloads."""
import os
import time
import hashlib
import requests


DOWNLOADS_DIR = os.path.join(os.path.dirname(__file__), "downloads")


def _cache_path(url: str, ext: str = ".mp4") -> str:
    h = hashlib.md5(url.encode()).hexdigest()[:16]
    return os.path.join(DOWNLOADS_DIR, f"{h}{ext}")


def download_clip(url: str, retries: int = 3) -> str | None:
    """Download URL to downloads/. Return local path or None on failure."""
    os.makedirs(DOWNLOADS_DIR, exist_ok=True)
    dest = _cache_path(url)
    if os.path.exists(dest) and os.path.getsize(dest) > 10_000:
        return dest

    for attempt in range(retries):
        try:
            headers = {"User-Agent": "Mozilla/5.0"}
            r = requests.get(url, headers=headers, stream=True, timeout=30)
            r.raise_for_status()
            tmp = dest + ".tmp"
            with open(tmp, "wb") as f:
                for chunk in r.iter_content(chunk_size=65536):
                    f.write(chunk)
            os.replace(tmp, dest)
            return dest
        except Exception as e:
            wait = 2 ** attempt
            print(f"    Download attempt {attempt+1} failed: {e}. Retrying in {wait}s…")
            time.sleep(wait)
    return None


def download_bulk(scene_stock: dict[str, dict | None]) -> dict[str, str | None]:
    """Download all clips. Returns mapping scene_id → local_path or None."""
    local: dict[str, str | None] = {}
    seen_urls: dict[str, str] = {}  # url → path (dedup)
    for scene_id, stock in scene_stock.items():
        if stock is None:
            local[scene_id] = None
            continue
        url = stock["url"]
        if url in seen_urls:
            local[scene_id] = seen_urls[url]
            continue
        print(f"  Downloading {scene_id}: {url[:80]}…")
        path = download_clip(url)
        seen_urls[url] = path
        local[scene_id] = path
        if path:
            size_mb = os.path.getsize(path) / 1_048_576
            print(f"    → {os.path.basename(path)} ({size_mb:.1f} MB)")
        else:
            print(f"    → FAILED, will use fallback")
    return local

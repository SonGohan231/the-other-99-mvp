"""Stock video search: Pexels + Pixabay with fallback to local assets."""
import os
import time
import random
import requests


PEXELS_API_KEY = os.environ.get("PEXELS_API_KEY", "")
PIXABAY_API_KEY = os.environ.get("PIXABAY_API_KEY", "")

PEXELS_SEARCH_URL = "https://api.pexels.com/videos/search"
PIXABAY_SEARCH_URL = "https://pixabay.com/api/videos/"

# Minimum video duration to accept (seconds)
MIN_VIDEO_DURATION = 5
# Prefer videos at or above this duration
PREFER_MIN_DURATION = 8

# Orientation filter
ORIENTATION = "landscape"


def _pexels_search(query: str, per_page: int = 5) -> list[dict]:
    if not PEXELS_API_KEY:
        return []
    headers = {"Authorization": PEXELS_API_KEY}
    params = {
        "query": query,
        "per_page": per_page,
        "orientation": ORIENTATION,
        "size": "medium",
    }
    try:
        r = requests.get(PEXELS_SEARCH_URL, headers=headers, params=params, timeout=10)
        r.raise_for_status()
        data = r.json()
        results = []
        for v in data.get("videos", []):
            duration = v.get("duration", 0)
            if duration < MIN_VIDEO_DURATION:
                continue
            # Pick best file: prefer HD (1920x1080) or largest
            files = sorted(v.get("video_files", []),
                           key=lambda f: f.get("width", 0) * f.get("height", 0),
                           reverse=True)
            # prefer mp4 landscape
            mp4s = [f for f in files if f.get("file_type") == "video/mp4"
                    and f.get("width", 0) >= f.get("height", 0)]
            if not mp4s:
                mp4s = [f for f in files if f.get("file_type") == "video/mp4"]
            if not mp4s:
                continue
            chosen = mp4s[0]
            results.append({
                "source": "pexels",
                "id": str(v["id"]),
                "url": chosen["link"],
                "duration": duration,
                "width": chosen.get("width", 0),
                "height": chosen.get("height", 0),
                "page_url": v.get("url", ""),
                "photographer": v.get("user", {}).get("name", "Pexels"),
                "query": query,
            })
        return results
    except Exception as e:
        print(f"  [pexels] error for '{query}': {e}")
        return []


def _pixabay_search(query: str, per_page: int = 5) -> list[dict]:
    if not PIXABAY_API_KEY:
        return []
    params = {
        "key": PIXABAY_API_KEY,
        "q": query,
        "video_type": "film",
        "orientation": ORIENTATION,
        "per_page": per_page,
        "safesearch": "true",
    }
    try:
        r = requests.get(PIXABAY_SEARCH_URL, params=params, timeout=10)
        r.raise_for_status()
        data = r.json()
        results = []
        for hit in data.get("hits", []):
            duration = hit.get("duration", 0)
            if duration < MIN_VIDEO_DURATION:
                continue
            videos = hit.get("videos", {})
            # prefer large > medium > small
            for quality in ("large", "medium", "small"):
                v = videos.get(quality, {})
                url = v.get("url", "")
                w = v.get("width", 0)
                h = v.get("height", 0)
                if url and w >= h:  # landscape
                    results.append({
                        "source": "pixabay",
                        "id": str(hit["id"]),
                        "url": url,
                        "duration": duration,
                        "width": w,
                        "height": h,
                        "page_url": hit.get("pageURL", ""),
                        "photographer": hit.get("user", "Pixabay"),
                        "query": query,
                    })
                    break
        return results
    except Exception as e:
        print(f"  [pixabay] error for '{query}': {e}")
        return []


def _score(result: dict) -> float:
    """Higher is better: prefer duration near 12s, prefer 1920-wide."""
    dur = result["duration"]
    dur_score = 1.0 - abs(dur - 12) / 60.0
    res_score = min(result["width"] / 1920.0, 1.0)
    return dur_score * 0.6 + res_score * 0.4


def search_stock(query: str, fallback_query: str = "", per_page: int = 5) -> dict | None:
    """Search Pexels then Pixabay, return best result or None."""
    queries_to_try = [query]
    if fallback_query and fallback_query != query:
        queries_to_try.append(fallback_query)

    for q in queries_to_try:
        results: list[dict] = []
        results.extend(_pexels_search(q, per_page))
        if len(results) < 3:
            results.extend(_pixabay_search(q, per_page))

        # Filter duration
        good = [r for r in results if r["duration"] >= PREFER_MIN_DURATION]
        pool = good if good else results

        if pool:
            # Sort by score
            pool.sort(key=_score, reverse=True)
            return pool[0]

        time.sleep(0.3)

    return None


def search_bulk(scenes: list[dict], delay: float = 0.4) -> dict[str, dict | None]:
    """
    Search stock for all unique queries in scenes.
    Returns mapping scene_id → result dict or None.
    """
    results: dict[str, dict | None] = {}
    # Deduplicate queries to save API calls
    query_cache: dict[str, dict | None] = {}

    for scene in scenes:
        if scene.get("is_title_card"):
            # Use a standard query for title cards
            q = "empty hospital corridor dark"
            fq = "clinic hallway night"
        else:
            q = scene.get("stock_query", "")
            fq = scene.get("fallback_query", "")

        cache_key = q
        if cache_key not in query_cache:
            print(f"  Searching: '{q}'")
            result = search_stock(q, fq, per_page=5)
            query_cache[cache_key] = result
            time.sleep(delay)

        results[scene["scene_id"]] = query_cache[cache_key]

    return results

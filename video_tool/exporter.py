"""Export storyboard CSV, JSON, and credits.txt."""
import csv
import json
import os


def export_storyboard(scenes: list[dict], output_dir: str, stock_results: dict[str, dict | None]):
    os.makedirs(output_dir, exist_ok=True)

    # Enrich scenes with stock source info
    rows = []
    for scene in scenes:
        sid = scene["scene_id"]
        stock = stock_results.get(sid)
        row = dict(scene)
        row["stock_source"] = stock["source"] if stock else "none"
        row["stock_url"] = stock["page_url"] if stock else ""
        row["stock_photographer"] = stock["photographer"] if stock else ""
        row["stock_video_url"] = stock["url"] if stock else ""
        rows.append(row)

    csv_path = os.path.join(output_dir, "storyboard.csv")
    json_path = os.path.join(output_dir, "storyboard.json")
    credits_path = os.path.join(output_dir, "credits.txt")

    # CSV
    if rows:
        fieldnames = [
            "scene_id", "part", "text_preview", "duration_estimate",
            "emotion", "stock_query", "fallback_query",
            "lower_third", "lower_third_text",
            "stock_source", "stock_photographer", "stock_url", "stock_video_url",
            "is_title_card", "word_count",
        ]
        with open(csv_path, "w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames, extrasaction="ignore")
            writer.writeheader()
            writer.writerows(rows)
        print(f"  Storyboard CSV: {csv_path}")

    # JSON (full)
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(rows, f, ensure_ascii=False, indent=2)
    print(f"  Storyboard JSON: {json_path}")

    # Credits
    seen = set()
    lines = [
        "CREDITS – Stock Video Sources",
        "=" * 50,
        "",
    ]
    for row in rows:
        url = row.get("stock_url", "")
        if url and url not in seen:
            seen.add(url)
            src = row.get("stock_source", "").upper()
            photographer = row.get("stock_photographer", "")
            lines.append(f"[{src}] {photographer}")
            lines.append(f"  {url}")
            lines.append("")

    if not seen:
        lines.append("No external stock was used (fallback only).")

    lines += [
        "",
        "License notes:",
        "- Pexels: Free to use, no attribution required (but appreciated).",
        "  https://www.pexels.com/license/",
        "- Pixabay: Free to use under Pixabay License.",
        "  https://pixabay.com/service/license-summary/",
    ]

    with open(credits_path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))
    print(f"  Credits: {credits_path}")

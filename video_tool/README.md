# Polish Documentary Video Generator

Automated pipeline: Polish TXT scripts + voiceover MP3s → 16:9 documentary MP4.

## Requirements

- Python 3.11+
- FFmpeg (installed system-wide)
- Pexels and/or Pixabay API keys (free)

## Setup

```bash
cd video_tool
pip install -r requirements.txt
```

FFmpeg (Ubuntu/Debian):
```bash
sudo apt install ffmpeg
```

## File structure

```
video_tool/
├── scripts/                  ← Put TXT and MP3 files here
│   ├── 01_intro_i_marek.txt
│   ├── 02_kolejka_pieniadze_szpitale.txt
│   ├── 03_prywatnie_i_blad_lekarski.txt
│   ├── 04_mlody_lekarz_i_plot_twist.txt
│   ├── 05_rehabilitacja_nfz_co_dziala.txt
│   ├── 06_pacjent_koordynator_naprawa_zakonczenie.txt
│   ├── 01_voiceover.mp3      ← per-part voiceovers (optional)
│   └── ...
├── assets/stock/             ← Local fallback video clips (.mp4)
├── downloads/                ← Auto-downloaded stock clips (auto-created)
├── output/                   ← Final outputs (auto-created)
│   ├── final_video.mp4       ← THE FINAL VIDEO
│   ├── storyboard.csv
│   ├── storyboard.json
│   └── credits.txt
├── make_video.py             ← Main entry point
└── requirements.txt
```

## Run

### Full pipeline (all 6 parts):
```bash
python make_video.py
```

### Test on one part first (fast):
```bash
python make_video.py --test-part 1
```

### Skip stock download (use fallback only):
```bash
python make_video.py --skip-download
```

### Quick test (first 10 scenes):
```bash
python make_video.py --test-part 1 --max-scenes 10
```

### No lower-third text:
```bash
python make_video.py --no-lower-thirds
```

## API keys

API keys are embedded in `make_video.py`. You can also set them as environment variables:

```bash
export PEXELS_API_KEY="your_key"
export PIXABAY_API_KEY="your_key"
python make_video.py
```

## Output

After running, find:
- `output/final_video.mp4` — final documentary video
- `output/storyboard.csv` — scene-by-scene breakdown with stock sources
- `output/storyboard.json` — same in JSON
- `output/credits.txt` — stock video attribution links

## Visual style

- 1920×1080, 30fps, H.264
- Desaturated, slightly dark, cold look
- Subtle film grain
- Slow zoom/pan on clips
- Section title cards between parts
- Lower-third text on rhetorically strong lines
- Voiceover audio matched to video length

## Fallback behavior

If a stock clip fails to download:
1. Tries fallback search query
2. Uses local `.mp4` from `assets/stock/` with different crop/zoom
3. Uses near-black solid color clip

## Adding your own local stock

Drop any `.mp4` files into `assets/stock/`. They will be used as fallbacks
when API downloads fail or when running with `--skip-download`.

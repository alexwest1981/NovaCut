# 🎬 NovaCut

> A sleek, modern CapCut-style video editor for Linux with an extensible community filter marketplace.

[🇸🇪 Svenska](README.sv.md)

NovaCut is designed to bridge the gap in the Linux video editing landscape: offering the snappy, intuitive workflow of mobile/desktop editors like CapCut, while leveraging the full power of native Wayland, multi-track timelines, real-time shaders, and an open marketplace architecture for community-created plugins.

---

## ✨ Features

- 🎞️ **Multi-Track Magnetic Timeline**
  - Dedicated lanes for **Main Video**, **Overlay / Picture-in-Picture**, **Text Layers**, **Adjustment / Effect Layers**, and **Audio**.
  - Interactive trimming handles on both clip edges.
  - One-key razor cut / split tool (<kbd>S</kbd> or <kbd>Ctrl+B</kbd>).
  - Magnetic snapping to clips and playhead (<kbd>N</kbd> toggle).
  - Timeline zoom (<kbd>Ctrl+Scroll</kbd> or slider).

- 🎨 **Real-Time Composition & Canvas Preview**
  - Live 60 FPS playback with synchronized multi-track audio.
  - Multi-aspect ratio switcher:
    - **16:9** (Widescreen / YouTube)
    - **9:16** (Vertical / TikTok / Shorts / Reels)
    - **1:1** (Square / Instagram)
    - **4:5** (Portrait)
  - Procedural backdrop generator for testing without external media.

- 🛒 **Extensible Community Marketplace & Plugin Engine**
  - Declarative plugin manifests (`manifest.json`) defining customizable parameter sliders and shader formulas.
  - Built-in filter presets out-of-the-box:
    - **Cyberpunk Neon**: High-contrast electric cyan and magenta tint.
    - **80s Retro VHS**: Analog CRT scanlines, tracking jitter, and color bleed.
    - **Cinematic Golden Hour**: Kodak-style warm LUT, golden bloom, subtle vignette.
    - **Film Noir**: High-contrast dramatic black and white.
  - **In-App Filter Creator**: Built-in developer modal allowing creators to write custom CSS/WebGL filters, specify UI sliders, and export shareable plugin packages.

- 🔤 **Text & Typography Studio**
  - Rich text overlays with customizable fonts, sizes, colors, background boxes, outlines, and shadows.
  - Preset styles (Neon Cyber, Minimalist Film, Trending Banner, Subtitles).

- ⚡ **Linux & Wayland Native**
  - Runs natively on Wayland (`--ozone-platform=wayland`) with zero XWayland overhead.
  - Hardware video decoding via VA-API / Linux GL.
  - Fast rendering and export pipeline supporting hardware acceleration (NVIDIA NVENC).

---

## 🚀 Getting Started

### Launching the Application
- **Application Launcher (Walker / Rofi / Super key)**:
  Search for **NovaCut**.
- **Terminal**:
  ```bash
  NovaCut
  ```

### Running from Source
```bash
git clone https://github.com/alexwest1981/NovaCut.git
cd NovaCut

npm install
npm start

npm test          # unit tests, no display and no Electron runtime needed
```

### Project Layout

| Path | What lives there |
|---|---|
| `src/main.js` | Electron main process: window, IPC handlers, ffmpeg/ffprobe calls, export |
| `src/preload.js` | The only bridge between the renderer and Node (contextIsolation is on) |
| `src/transcript.js` | Pure caption helpers (whisper args, timestamps, file URLs) — kept free of electron/fs so `test/` can run them |
| `src/publisher-service.js` | YouTube upload flow used by the publish panel |
| `src/js/*.js` | Renderer modules: timeline, inspector, engine, transitions, marketplace, exporter … |
| `src/styles/*.css` | Timeline, marketplace and editor theming |
| `plugins/*/manifest.json` | Declarative marketplace presets shipped with the app |
| `test/*.test.js` | `node:test` suites, run by `npm test` and by CI |

`ffmpeg`/`ffprobe` come from the system (in the Flatpak, from the freedesktop
runtime) — nothing media-related is bundled. Captions need a `whisper.cpp` build
and a GGML model; neither ships in this repository (a linked binary without its
shared libraries cannot run elsewhere, so it is gitignored rather than committed).
The captions dialog checks both when it opens and names what is missing.

```bash
sudo pacman -S whisper-cpp        # gives whisper-cli on PATH; picked up as-is
#   or: build whisper.cpp yourself and put the result at bin/whisper-cli

mkdir -p models                   # a model, in models/ next to the repo
curl -L -o models/ggml-base.bin \
  https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.bin
```

The binary is looked up in `bin/whisper-cli`, `~/.local/bin`, `/usr/local/bin`,
`/usr/bin` and `PATH`, in that order. The dialog lists every model it finds in
`models/` and runs the one you pick; leaving it on *Bästa tillgängliga* means
`base` when it is there, otherwise the first of `small` → `medium` →
`large-v3` → `large-v3-turbo` → `tiny`. English-only models (`.en.`) are marked
and never auto-selected for anything but English, since they cannot transcribe
Swedish at all. `base` is the sensible default: it runs 11× realtime on CPU and
35× on the RTX 3060 Ti, while `tiny` repeats itself on Swedish and `small` was no
better on sung vocals for ten times the time. The app extracts 16 kHz mono audio
with ffmpeg, so any format the editor can play can be transcribed.

### What leaves the machine

Everything below is the app talking to something; nothing else does, and all of
it is off until you use the feature.

| Destination | When | What is sent |
|---|---|---|
| `image.pollinations.ai` | When you press Generate in the AI image panel (`ai:generateImage`) | Your prompt text. No API key, no account. |
| `www.googleapis.com` (YouTube) | If you connect a channel and upload | The video and its metadata, with the OAuth token you granted. |
| `freesound.org` | When you search or download in the audio panel, once you have added your own API key (`marketplace:saveFreesoundConfig`) | The search terms; downloads are stored under the app's userData. |

**Fonts.** Both sets ship with the app and nothing is requested over the
network: the *interface* font (Geist + Geist Mono, OFL-1.1) and the sixteen
caption/title families the Text Studio offers, latin subsets, 21 files and
391 kB in total. `tools/bundle-fonts.py` fetches and regenerates them (and its
`--check` fails the tests if a family in the list has no file); their licences
are listed in `src/assets/fonts/templates/LICENSES.md`.

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| <kbd>Space</kbd> | Play / Pause playback |
| <kbd>S</kbd> or <kbd>Ctrl+B</kbd> | **Split selected clip at playhead** |
| <kbd>Delete</kbd> / <kbd>Backspace</kbd> | **Delete selected clip** |
| <kbd>←</kbd> / <kbd>→</kbd> | Step one frame backward / forward |
| <kbd>N</kbd> | Toggle timeline snapping |
| <kbd>Escape</kbd> | Deselect clip / close modal |

---

## 🧩 Creating a Marketplace Filter Plugin

Create a folder in `plugins/my-filter/` with a `manifest.json`:

```json
{
  "id": "my-filter",
  "name": "Dreamy Pastel",
  "version": "1.0.0",
  "author": "Creator",
  "category": "filter",
  "description": "Soft pastel dream look with subtle blur",
  "previewColor": "#ec4899",
  "cssFilter": "contrast(105%) saturate(140%) brightness(105%)",
  "params": [
    { "id": "intensity", "label": "Dream Intensity", "type": "slider", "min": 0, "max": 2, "default": 1.0 }
  ]
}
```

NovaCut automatically parses `manifest.json` and dynamically generates native inspector controls for your parameters!

---

## 📜 License

MIT License. Crafted with ❤️ for Linux creators.

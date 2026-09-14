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
```

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

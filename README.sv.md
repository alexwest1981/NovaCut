# 🎬 NovaCut

> En modern videoredigerare i CapCut-stil för Linux med en inbyggd marknadsplats för filter och effekter.

[🇬🇧 English version](README.md)

NovaCut är utvecklad för att fylla tomrummet bland Linux-videoredigerare: snabbt, intuitivt arbetsflöde som CapCut kombinerat med native Wayland-stöd, flerspårig tidslinje, realtidsshaders och en öppen marknadsplatsarkitektur för community-skapade plugins.

---

## ✨ Funktioner

- 🎞️ **Flerspårig tidslinje (Multi-Track)**
  - Dedikerade spår för **Huvudvideo**, **Overlay (PIP)**, **Textlager**, **Filter / Justeringslager** och **Ljud**.
  - Interaktiva trim-handtag på klippens kanter.
  - Snabbt klippverktyg med <kbd>S</kbd> eller <kbd>Ctrl+B</kbd>.
  - Magnetisk snapping till andra klipp och spelhuvud (<kbd>N</kbd>).
  - Tidslinjezoom med reglage eller scroll.

- 🎨 **Realtidskomposition & Förhandsgranskning**
  - Jämn 60 FPS uppspelning med synkat flerspårsljud.
  - Bildförhållandeväljare:
    - **16:9** (Widescreen / YouTube)
    - **9:16** (Vertikal / TikTok / Shorts / Reels)
    - **1:1** (Kvadratisk / Instagram)
    - **4:5** (Porträtt)
  - Inbyggd procedurgenerator som gör att du kan testa direkt utan externa videofiler.

- 🛒 **Community Marketplace & Pluginsystem**
  - Deklarativa plugin-manifest (`manifest.json`) som definierar reglage och shaderformler.
  - Förinstallerade filter:
    - **Cyberpunk Neon**: Skarp kontrast, cyan & magenta.
    - **80s Retro VHS**: Analoga scanlines, brus och färgläckage.
    - **Cinematic Golden Hour**: Varm filmisk Kodak-ton och mjuk vinjett.
    - **Film Noir**: Dramatisk svartvit filmestetik.
  - **Inbyggt Creator Mode**: Skapa egna filter direkt i appen med realtidsförhandsvisning och spara för delning.

- 🔤 **Text & Typografi**
  - Textlager med valbara typsnitt, storlekar, färger, bakgrundsboxar, konturer och skuggor.
  - Färdiga stilar (Neon Cyber, Minimalist Film, Banner, Undertexter).

- ⚡ **Byggd för Linux & Wayland**
  - Körs native på Wayland (`--ozone-platform=wayland`).
  - Hårdvaruavkodning via VA-API / Linux GL.
  - Snabb exportmotor med stöd för hårdvaruacceleration (NVIDIA NVENC).

---

## 🚀 Kom igång

### Starta appen
- **Från programmenyn (Walker / Rofi / Super-tangenten)**:
  Sök efter **NovaCut**.
- **Från terminalen**:
  ```bash
  NovaCut
  ```

---

## ⌨️ Tangentbordskommandon

| Kommando | Åtgärd |
|---|---|
| <kbd>Mellanslag</kbd> | Spela / Pausa |
| <kbd>S</kbd> eller <kbd>Ctrl+B</kbd> | **Klipp / Dela markerat klipp vid spelhuvudet** |
| <kbd>Delete</kbd> / <kbd>Backspace</kbd> | **Ta bort markerat klipp** |
| <kbd>←</kbd> / <kbd>→</kbd> | Stega en bildruta bakåt / framåt |
| <kbd>N</kbd> | Växla magnetisk snapping av/på |
| <kbd>Escape</kbd> | Avmarkera klipp / stäng modaler |

---

## 📜 Licens

MIT License.

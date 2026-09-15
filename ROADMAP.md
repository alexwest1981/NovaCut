# 🗺️ NovaCut – Officiell Roadmap

Detta dokument beskriver sprintplanen för **NovaCut**, en modern, blixtsnabb och öppen videoeditor för Linux med CapCut-liknande arbetsflöden optimerade för content creators (TikTok, YouTube Shorts, Reels och YouTube).

---

## 🏁 Sprintöversikt & Status

| Sprint | Fokusområde | Status | Nyckelleveranser |
| :--- | :--- | :---: | :--- |
| **Sprint 1** | **WYSIWYG & Canvasinteraktion** | ✅ Klar | Interaktiv drag-and-drop på canvas, 9 snabbpositioner, magnetiska stödlinjer (snapping), säkra zoner för TikTok/Shorts. |
| **Sprint 2** | **Välkomsthub & Projekthantering** | ✅ Klar | CapCut-liknande projektöversikt vid appstart, sparade projekt, bildförhållanden (16:9, 9:16, 1:1, 4:5), öppna från disk. |
| **Sprint 3** | **Dynamisk Upplösning & Widescreen** | ✅ Klar | Flexibla resizable splitters, monitor zoom (Fit, 50-200%), dynamisk tidslinjebredd, 21:9 Ultrawide och 4:3-stöd. |
| **Sprint 4** | **Snabbredigering & Ripple Editing** | ✅ Klar | Ripple Delete (`Shift+Delete`), `Q`/`W`-snabbtrimning vid spelhuvud, automatisk luckstängning (Close Gaps). |
| **Sprint 5** | **Keyframing (Animation & Rörelse)** | ✅ Klar | Diamantknappar för keyframes på skala, position, rotation, opacitet med mjuk interpolation. |
| **Sprint 6** | **Speed Ramping & Hastighetskurvor** | ✅ Klar | Kurvbaserad hastighet (0.1x–10x), kurvmallar (Flash, Montage, Bullet-time, Hero, Custom), visuell kurveditor. |
| **Sprint 7** | **Ljudredigering & Auto-Ducking** | ✅ Klar | Fade In/Out-handtag på ljudklipp, automatisk volymsänkning av musik vid tal (auto-ducking). |
| **Sprint 8** | **Auto-Captions & Virala Undertexter** | ✅ Klar | Automatisk textgenerering och animerade ordstilar (Hormozi, Pop, Karaoke highlight). |
| **Sprint 9** | **Export Presets för Sociala Medier** | ✅ Klar | 1-klicks export med optimerade NVENC/VAAPI-profiler för TikTok, Reels, Shorts och 4K, live GPU-detektering och MP4-transkodning. |
| **Sprint 10** | **Video Transitions & Visuella FX** | ✅ Klar | Övergångar mellan klipp (Zoom In/Out, Whip Pan, Dissolve, Glitch, Dip to Black) och live videoeffekter (VHS Retro, Camera Shake, RGB Split, 35mm Grain). |
| **Sprint 11** | **Color Grading & Maskering** | ✅ Klar | Färgkorrigering (Temperatur, Tint, Mättnad, Kontrast, Vignette, LUTs) och Maskering (Cirkel/Facecam, Rektangel, Linjär, Spegel, Invertera). |
| **Sprint 12** | **Chroma Key & Green Screen** | 🚀 Nästa sprint | Färgpipett för grön/blåskärm, tolerans/similarity, spill suppression och transparent kompositering över bakgrundsspår. |

---

## 🛠️ Detaljerade Sprintmål

### Sprint 4: Snabbredigering & Ripple Editing (Aktuell sprint)
* **Q-Trim (Ripple Start):** Tryck på `Q` för att trimma bort allt från klippets start fram till spelhuvudet och dra ihop tidslinjen direkt utan tomrum.
* **W-Trim (Ripple End):** Tryck på `W` för att trimma bort allt från spelhuvudet fram till klippets slut och dra ihop efterföljande klipp.
* **Ripple Delete (`Shift+Delete`):** Ta bort markerat klipp och förskjut alla efterföljande klipp åt vänster så att ingen tom lucka uppstår.
* **Stäng Tomrum (Close Gaps):** 1-klicks-knapp i tidslinjens verktygsfält för att automatiskt eliminera alla tomma mellanrum på spåret.

### Sprint 5: Keyframing
* Diamantformade knappar bredvid Skala, Position, Rotation och Opacitet i Inspektorn.
* Visuella keyframe-diamanter direkt på klippet i tidslinjen.
* Linjär och mjuk Bezier-interpolering mellan nyckelbildrutor i uppspelningsmotorn.

### Sprint 6: Speed Ramping
* Visuell kurveditor i Inspektorn för videoklipp.
* Förinställningar: "Flash In", "Montage Hook", "Slow Down".

### Sprint 7: Ljud & Auto-Ducking
* Kurvhandtag på ljudklipp för mjuka övertoningar (Fade In / Fade Out).
* Intelligent Auto-ducking: bakgrundsmusik sänks automatiskt med t.ex. -12dB när tal spelas på videospåret.

### Sprint 8: Auto-Captions
* Integrering av offline Whisper-transkribering.
* Ord-för-ord synkning och TikTok-typografi.

### Sprint 9: 1-klicks Export & NVENC Hårdvaruacceleration
* **Sociala Medier-Presets:** Snabbknappar för TikTok & Reels (1080×1920 60fps), YouTube Shorts, YouTube 4K Ultra HD (HEVC), YouTube 1080p, Instagram Kvadrat (1:1) och Anpassad profil.
* **Hårdvaruacceleration (NVIDIA NVENC):** Automatisk GPU-detektering (`lspci` & `ffmpeg`), realtidsindikator och blixtsnabb `h264_nvenc` samt `hevc_nvenc`-transkodning direkt till MP4 med AAC-ljud och `faststart` för sociala medier.
* **Web Audio Export:** Full mixning av tidslinjens ljudspår under export.

### Sprint 10: Video Transitions & Visuella FX
* **Klippövergångar (Transitions):** Cross Dissolve, Dip to Black, Flash/Vit Blixt, Zoom In, Zoom Out, Whip Pan Vänster, Whip Pan Höger och Cyber Glitch.
* **Tidslinjeinteraktion & Drag-and-Drop:** Visuella övergångsbrickor (`clip-transition-badge`) på klippändar, drag-and-drop direkt från biblioteket till klipp, samt snabbknappar ("Alla Klipp", "+ Markerad").
* **Inspektorkontroll:** Interaktiva dropdowns för In/Ut-övergångar med millisekunds-exakta sliders för varaktighet.
* **Live Visuella FX:** VHS Retro '95 OSD, Handheld Camera Shake, RGB Split Glitch, 35mm Film Grain, Gyllene Bokeh, Filmiskt Regn.

### Sprint 11: Color Grading & Maskering
* **Färgkorrigering:** Temperatur (varm/kall fototoning), Tint (grön/magenta), Mättnad, Kontrast, Exponering och Vignette.
* **Film-LUTs & Snabbstilar:** Naturlig, Teal & Orange, Warm Sunset, Cyberpunk, Noir B&W och Vintage 35mm.
* **Video Masking:** Cirkelmask (perfekt för Facecam / Reaktionsvideos), Rektangulär mask (Crop / Split screen), Linjär mask (Wipe), Spegelmask samt Invertera mask.
* **Interaktiv Mask-Gizmo:** Cyan-streckad kontur på canvasen som visar maskens exakta position och storlek.

### Sprint 12: Chroma Key & Green Screen
* **Grönskärms-Chroma Key:** Pipettverktyg (`startColorPicker`) för att sampla färg direkt från canvas med muspekaren.
* **Färgkontroller & Algoritmer:** Euklidisk RGB-färgavståndsmätning, ställbar tolerans (Similarity), kantmjukhet (Smoothness/Alpha Falloff) och spilldämpning (Spill Suppression för grön/blå reflektion på kläder och hud).
* **Transparent Kompositering:** Högpresterande offscreen pixel-processing med `willReadFrequently` och realtidsklippning mot underliggande spår.

### Sprint 13: Text Animationer & Kinetic Typography
* **Text Motion Presets:** In/Loop-animationer för text och undertexter:
  - ⌨️ **Skrivmaskin (Typewriter):** Tecken för tecken med animerad blinkande markör.
  - ⚡ **Pop & Bounce In:** Elastisk bounce-in med dämpning.
  - ⬆️ **Slide Up & Fade:** Mjuk glidning uppåt med kubisk ease-out.
  - 🔄 **3D Flip In:** Vertikal 3D-rotation på textblocket.
  - 💓 **Zoom Pulse (Loop):** Rytmisk subtil hjärtslagspuls.
  - 🌟 **Neon Glow Pulse (Loop):** Dynamiskt pulserande neon-skuggskimmer.
  - 👾 **Cyber Glitch (Loop):** Periodisk mikrojitter och kromatisk färgseparation.
* **1-Klicks Stilförinställningar:** TikTok Viral (Gul Impact med svart outline), Cyber Neon, Filmisk Serif, Breaking News (Röd badge), Hacker Terminal och Minimal.
* **Typografi, Skugga & Glow:** Konturtjocklek (1-24px), Skugga & Neon Glow med anpassningsbar färg och blurradie (0-50px).
* **Batch-tillämpning:** Applicera stil och animationer på samtliga text- och undertextklipp med ett klick.

### Sprint 14: Picture-in-Picture (PiP) & Multi-Track Reaktionslayouter (Kommande sprint)
* **Reaktions- & Gaminglayouter:** 1-klicks förinställningar för Facecam (cirkel/rektangel i hörnet), Split Screen 50/50 (vertikal & horisontell) och Grid Collage.
* **Smart Spårhantering:** Automatisk placering och skalning av spår V1/V2/V3 med synkroniserad uppspelning.

### Sprint 15: Ljud- och Memebibliotek (SFX & Stickers)
* **Inbyggt Ljudeffektbibliotek (SFX):** Whoosh, Pop, Ding, Kamera-klick, Glitch, Cinematic Boom, Vine Boom.
* **Meme Overlays & Stickers:** Samling av animerade stickers och transparenter för virala klipp.



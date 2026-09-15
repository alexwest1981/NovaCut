# 🗺️ NovaCut – Modulär Utvecklingsfärdplan (Sprint Roadmap)

Denna roadmap bryter ner NovaCuts utveckling i **fokuserade, lätthanterliga mikro-sprintar**. Varje sprint är fristående, testbar och tillför direkt värde för content creators på Linux.

---

## Översikt över Sprintar

```
[Fas 1: Kreatörens Verktygslåda]
  Sprint 1: Ljudeffektsbibliotek (SFX Pack) för snabba klipp
  Sprint 2: 1-klicks Export-profiler (TikTok, Shorts, Reels, YouTube)
  Sprint 3: Textanimationer (In/Out Motion Presets)

[Fas 2: Snabbklippning & Flöde]
  Sprint 4: Snabbredigering (Ripple Delete, Q/W Trim, Magnetisk tidslinje)
  Sprint 5: Keyframing V1 (Dynamiska zoomar & Ken Burns-panorering)
  Sprint 6: Smart Ljud-ducking (Automatisk sänkning av musik vid tal)

[Fas 3: Avancerade Virala Effekter]
  Sprint 7: Klippövergångar (Transitions: Zoom Blur, Glitch, Whip Pan)
  Sprint 8: Hastighetskurvor & Speed Ramping (Velocity Edits)
  Sprint 9: Auto-Captions V1 (Lokal Whisper AI tal-till-text)
```

---

## 🚀 Fas 1: Kreatörens Verktygslåda (Grunden för Retention)

### 🔊 Sprint 1: Ljudeffektsbibliotek (SFX Pack) för Social Media
* **Mål:** Ge kreatörer omedelbar tillgång till de viktigaste ljudeffekterna som används i 99% av alla virala klipp.
* **Funktioner:**
  - Inbyggt bibliotek med royaltyfria CC0-ljudeffekter:
    - *Whoosh / Swish* (för text- & bildbyten)
    - *Pop / Bubble* (när text dyker upp)
    - *Camera Shutter* (skärmdump/ögonblick)
    - *Bell / Ding* (notis, tips, poäng)
    - *Record Scratch* (komisk paus)
    - *Glitch / Static* (klippbyte/effekt)
    - *Bass Drop / Impact* (dramatisk hook)
  - Förhandslyssning i fliken **Ljud** med play/pause-knapp före placering.
  - 1-klicks-placering direkt vid tidslinjens markör på ljudspåret.
  - Inkluderar även CapCut Pro Studio GUI (Monitor-bar, säkra zoner, spårlåsning & muting, neon laser-spelhuvud).
* **Status:** ✅ *Slutförd (Sprint 1)*

---

### 📱 Sprint 2: 1-klicks Export-profiler (TikTok, Reels, Shorts, YouTube)
* **Mål:** Ta bort all teknisk friktion vid export så användaren slipper gissa bitrates, codecs och pixelformat.
* **Funktioner:**
  - Färdiga snabbprofiler i Export-modalen:
    - 📱 **TikTok / Reels / Shorts:** 1080×1920 (9:16), 60 FPS, optimerad H.264 VBR för mobilkomprimering.
    - 📺 **YouTube Widescreen:** 1920×1080 (16:9), 60 FPS, hög bitrate.
    - ⚡ **Instagram Post / Kvadrat:** 1080×1080 (1:1), 30 FPS.
    - 🎬 **YouTube 4K Master:** 3840×2160, maximal kvalitet via NVENC/VAAPI.
  - Beräknad filstorlek och framstegsindikator med återstående tid under rendering.
  - "Öppna målmapp"-knapp efter lyckad export.
* **Status:** 📋 Planerad

---

### ✨ Sprint 3: Textanimationer & Motion Presets (In / Out)
* **Mål:** Få text och titlar att röra sig dynamiskt istället för att bara dyka upp plötsligt.
* **Funktioner:**
  - Animationsval i Inspektorn för textklipp:
    - **In-animationer:** *Pop Up (Zoom in)*, *Slide Up (glid upp)*, *Fade In*, *Typewriter (skrivmaskin)*, *Bounce*.
    - **Ut-animationer:** *Fade Out*, *Slide Down*, *Zoom Out*.
  - Reglage för animationens längd (0.1s – 1.0s).
  - Canvas-rendering i realtid med 60 FPS.
* **Status:** 📋 Planerad

---

## ⚡ Fas 2: Snabbklippning & Flöde

### ✂️ Sprint 4: Snabbredigering (Ripple Delete, Q/W Trim, Snapping)
* **Mål:** Höja klipphastigheten 3x vid grovklippning av råmaterial.
* **Funktioner:**
  - `Q` = Trimma klippets början fram till spelhuvudet (Top-trim).
  - `W` = Trimma klippets slut bak till spelhuvudet (Tail-trim).
  - `Shift + Delete` / `Ripple Delete` = Radera markerat klipp och flytta alla efterföljande klipp bakåt för att sluta gapet automatiskt.
  - Magnetiskt snäppläge (`N`) som låser klipp mot varandras kanter och mot spelhuvudet.
* **Status:** 📋 Planerad

---

### 🎯 Sprint 5: Keyframing V1 (Dynamiska zoomar & Ken Burns)
* **Mål:** Skapa "punch-in zooms" på ansikten/reaktioner för att hålla tittarens uppmärksamhet.
* **Funktioner:**
  - Diamantknapp (◆) bredvid *Skala* och *Position X/Y* i Inspektorn för att sätta keyframes.
  - Visuella keyframe-punkter direkt på klippet i tidslinjen.
  - Mjuk linjär/ease-in-out-interpolering under uppspelning och export.
* **Status:** 📋 Planerad

---

### 🎙️ Sprint 6: Smart Ljud-ducking (Auto-Ducking)
* **Mål:** Bakgrundsmusiken ska automatiskt dämpas när någon pratar.
* **Funktioner:**
  - Knapp i ljudinspektorn: "Aktivera Auto-Ducking mot videospår".
  - Inställning för dämpningsnivå (-10 dB till -24 dB) och återgångstid (fade release).
* **Status:** 📋 Planerad

---

## 🔮 Fas 3: Avancerade Virala Effekter

### 🌀 Sprint 7: Klippövergångar (Transitions: Zoom Blur, Glitch, Whip Pan)
* **Mål:** Sömlösa och energiska övergångar mellan två angränsande videoklipp.
* **Funktioner:**
  - Dra övergång från Marketplace/flik och släpp direkt i skarven mellan två klipp.
  - Shader-övergångar: *Cross Dissolve*, *Whip Pan*, *Zoom Blur*, *Glitch*, *Flash White*.
* **Status:** 📋 Planerad

---

### 🏎️ Sprint 8: Hastighetskurvor & Speed Ramping (Velocity Edits)
* **Mål:** Snabba accelerationer som slår över i slow-motion (CapCut velocity style).
* **Funktioner:**
  - Visuell Bezier-kurva i Inspektorn med förinställningar (*Montage*, *Bullet Time*, *Jump Cut*).
  - Variabel FPS-avkodning och återgivning på tidslinjen.
* **Status:** 📋 Planerad

---

### 💬 Sprint 9: Auto-Captions V1 (Lokal Whisper AI)
* **Mål:** Automatisk undertextning med dynamisk ordmarkering utan molnkostnader.
* **Funktioner:**
  - Extrahera ljud till WAV och skicka till lokal `whisper.cpp`-backend.
  - Automatisk generering av tidsatta textklipp på textspåret.
  - Stilval: "Hormozi" (gult/grönt aktivt ord), "Karaoke", "Minimal Box".
* **Status:** 📋 Planerad

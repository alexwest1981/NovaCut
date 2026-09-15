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
| **Sprint 12** | **Chroma Key & Green Screen** | ✅ Klar | Färgpipett för grön/blåskärm, tolerans/similarity, spill suppression och transparent kompositering över bakgrundsspår. |
| **Sprint 13** | **Kinetic Typography & Text Animationer** | ✅ Klar | Typewriter, Pop & Bounce, Slide Up, 3D Flip, Zoom Pulse, Neon Glow, Cyber Glitch, stilar och 1-klicks presets. |
| **Sprint 14** | **Picture-in-Picture & Reaktionslayouter** | ✅ Klar | Gaming Facecam (Nere Höger), Reaction Bubble, TikTok Split 50/50, V1+V2 automatisk layout, ramar och kastskuggor. |
| **Sprint 15** | **SFX-bibliotek & Meme Stickers Engine** | ✅ Klar | 14 Web Audio SFX (Vine Boom, Whoosh, Impact m.fl.) och 10 vektoranimerade stickers (REC, Subscribe, Arrow, WOW!). |
| **Sprint 16** | **Beat Detection & Auto-Cut till Takten** | ✅ Klar | Transient- och energianalys, gyllene beat markers, magnetisk beat snapping och 1-klicks Velocity Montage Cut. |
| **Sprint 17** | **Projektmallar & Viral Format Wizard** | ✅ Klar | 1-klicks mallar (TikTok Hook, Gaming, Podcast, Cinematic 4K, Dual Split), configurator wizard och procedurgenererade mönster. |
| **Sprint 18** | **Lokal Render Queue & Bakgrundsrendering** | 🚀 Nästa sprint | Flera samtidiga/köade exporter i bakgrunden utan att blockera redigeringen, batch-export och förloppsövervakning. |

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

### Sprint 8: True Whisper AI Auto-Captions & Virala Undertexter
* **Offline Whisper AI Transkribering (`bin/whisper-cli`):**
  - Högpresterande, fristående Whisper C++ CPU-binär med AVX2/FMA-stöd för Linux (0 externa biblioteksberoenden).
  - Flerspråkig GGML-modell (`ggml-tiny.bin`, 75MB) med stöd för svenska, engelska och automatisk språkdetektering.
  - Automatisk extrahering av 16kHz mono WAV från videoklipp och blixtsnabb tal-till-text på under 1 sekund.
* **Ord-för-ord Tidsstämplar & Tidslinjeplacering:**
  - Exakta tidsstämplar per segment och ord direkt från Whisper JSON-output.
  - Genererar klipp på undertextspåret med exakt synkronisering mot talarens röst.
* **Virala TikTok-stilar:**
  - Hormozi Pop (gul/vit med svart ram), Karaoke Highlight (aktivt ord lyser upp), Minimalistisk Sans, Neon Cyan och Cyberpunk Glow.

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

### Sprint 14: Picture-in-Picture (PiP) & Multi-Track Reaktionslayouter
* **PiP- & Reaktionsförinställningar:**
  - 🎮 **Gaming Facecam (Nere Höger):** Skalad till 0.32x med 16px rundade hörn, accentram och mjuk kastskugga.
  - 🎙️ **Facecam (Uppe Höger):** Perfekt hörnposition för vloggar och handledningar.
  - ⚪ **Reaction Bubble (Cirkel-PiP):** Cirkulärt maskerad facecam med 5px ram.
  - 📱 **TikTok Split (Topp 50% / Botten 50%):** Automatisk placering och centrerad beskärning för TikTok/Shorts 9:16 reaktionsklipp.
  - ⛶ **Fullskärmsåterställning:** 1-klick för att nollställa till standard 100% video.
* **Dubbelspårs Smart Layout:** 1-klicks knapp ("⚡ Synka V1 + V2 till TikTok Split") som automatiskt placerar V2 (Overlay) i övre halvan och V1 (Huvudvideo) i undre halvan.
* **Kantlinjer & Skuggor:** Ställbar ramtjocklek (1-20px), hörnradie (0-100px) samt kastskugga som lyfter fram facecamen över bakgrundsvideon.

### Sprint 15: Ljud- och Memebibliotek (SFX & Stickers)
* **Utökat Ljudeffektbibliotek (SFX):**
  - Syntetisering i realtid med Web Audio API (100% offline, noll disk-bloat, kristallklart 44.1kHz 16-bit WAV).
  - Ljudeffekter: 🗿 **Vine Boom** (massiv mättad sub-bas), 💨 **Whoosh Swift & Whip Fast**, 🫧 **Pop Bubble**, 🔔 **Ding Chime**, 📸 **Camera Shutter**, 💿 **Vinyl Scratch**, ⚡ **Glitch Zap**, 💥 **Cinematic Sub Impact**, 🥁 **Tension Riser**, 🖱️ **UI Click**, ⌨️ **Mechanical Key**, 🔫 **Sci-Fi Laser**, 🎺 **Tada Fanfare**, ❌ **Fail Buzzer**.
  - Förhandslyssning med play/stop-indikator och 1-klicks infogning på ljudspåret vid spelhuvudet.
* **Meme Overlays & Vektor-Stickers Engine (`NovaCutStickers`):**
  - Dedikerad sidoflik "🎭 Stickers" med kategorifiltrering (Memes, UI, Reaktioner, Pilar & Varningar).
  - 10 procedurgenererade vektorstickers med realtidsanimering:
    - 🔴 **REC Indikator:** Blinkande röd linsdiod och löpande tidskod.
    - 🔔 **Subscribe & Bell:** Röd YouTube-knapp med svängande guldklocka.
    - 🎯 **Uppmärksamhetspil:** Fet kurvad röd pil med vit kant.
    - 💥 **WOW! Comic Burst:** 16-uddig stjärnexplosion i serietidningsstil.
    - ⬛ **CENSORED Balk:** Klassisk censurbalk med fet vit monospace-text.
    - 🕶️ **Thug Life Solglasögon:** 8-bitars pixlade solglasögon med glansreflektioner.
    - 🔥 **Lit Fire Flame:** Levande flerlagers glödande eldflamma.
    - ⚠️ **Varningstriangel:** Gul varselskylt med utropstecken.
    - 👑 **Gyllene Krona:** Kunglig krona med cyan och röda ädelstenar.
    - 🔴 **LIVE Sändning:** LIVE-banner med pulserande radiovågor.
  - Full interaktivitet på canvas: skalbar, roterbar, flyttbar med muspekaren och keyframing!

### Sprint 16: Beat Detection & Automatisk Klippning
* **Rytm- och Taktdetektering (`NovaCutBeats`):**
  - Offline ljudanalys via Web Audio API med blockvis energiberäkning och glidande medelvärdesvarians ($E > c \cdot \langle E \rangle$).
  - Justerbar känslighet (`Hög`, `Medium`, `Låg`) med automatisk fallback till musikalisk taktmatris (t.ex. 120/128 BPM) om ljudspår saknas eller inte kan avkodas.
* **Gyllene Taktmarkörer på Linjalen:**
  - Bärnstensfärgade diamantmarkörer direkt på tidslinjens linjal med subtila vertikala hjälplinjer.
* **Magnetisk Beat Snapping:**
  - När klipp eller spelhuvud dras på tidslinjen snäpper de magnetiskt mot varje detekterat taktslag.
* **⚡ Auto-Cut till Takten (Montage Velocity Cut):**
  - 1-klicks knapp i tidslinjens verktygsfält som automatiskt klyver markerat videoklipp (`splitClipAtTime`) vid varje beat och applicerar rytmisk alternerande mikrozoom (+8% varannan sektion) för den virala CapCut/TikTok montage-känslan!

### Sprint 17: Projektmallar & Viral Format Wizard
* **1-Klicks Formatmallar (`NovaCutTemplates`):**
  - ⚡ **TikTok Viral Hook (9:16):** Animerad gul Hormozi-hook ("SLUTA SCROLLA! 🛑"), Pop & Bounce-animation, Vine Boom SFX, energifyllda radiala hastighetslinjer och 128 BPM gyllene beat snapping.
  - 🎮 **Gaming Reaction / Facecam (16:9 & 9:16):** Dubbelspårslayout med fullskärms gameplay (V1, sci-fi HUD crosshairs) + Facecam (V2, cirkelmask, neon grön ram, kastskugga, animerade ljudstaplar) och "🔴 LIVE"-märke.
  - 🎙️ **Podcast Highlight (9:16 & 1:1):** Talk-layout med dynamiskt ljudspektrum, avsnittsbanner överst, tvåstegs karaoke-highlight undertexter och studiovärme.
  - 🎬 **Cinematic YouTube 4K (16:9):** Widescreen letterbox med anamorfiskt horisontblänk, Teal & Orange color grade, 35mm filmkorn, elegant serif-titel och Cinematic Sub Impact.
  - 📱 **TikTok Dual Split (50/50, 9:16):** Synkad 50/50-delning för duetter, jämförelser och debatter med reaktionspil och CTA-fråga.
* **Viral Format Wizard (`#formatWizardModal`):**
  - Interaktiv modal för att välja mall och skräddarsy rubrik, underrubrik, kreatörstag, bildförhållande (9:16, 16:9, 1:1), färgprofil samt valbara ljudeffekter (SFX) och beat markers.
* **Välkomsthubb & Snabbstart:**
  - Dedikerat mallgalleri i startfönstret med kategorifiltrering (`Alla`, `9:16 TikTok`, `Gaming`, `Podcast`, `16:9 YouTube`) och direktknapparna `⚡ Blixtstart` samt `🎨 Anpassa`.
  - Snabbknapp i programmets huvudmeny (`⚡ Mallar & Wizard`) för att när som helst starta en ny layout.
* **Realtidsanimerade Demo-Mönster i Uppspelningsmotorn:**
  - Motorn (`renderProceduralDemo`) ritar procedurgenererade, 60fps-animerade mönster (`viral`, `gameplay`, `facecam`, `podcast`, `cinematic`) så att mallarna ser proffsiga ut och rör sig direkt innan externa mediefiler importerats.

### Extra Feature: AI Visuals & Musikvideo Visualizers (`NovaCutVisuals`)
* **Zero-Config AI Bildgenerator för Musikvideos:**
  - Direkt bildgenerering via Pollinations.ai / Flux utan behov av API-nycklar, konton eller komplicerad setup.
  - Förkonfigurerade musikvideo-stilar: *Synthwave Neon*, *Lo-Fi Chill Anime*, *Dark Techno Rave*, *Deep Space Nebula*, *Psychedelic Fractal*, *Tokyo Neon Rain*.
  - Stöd för formaten 16:9, 9:16 och 1:1.
  - Automatisk dynamisk rörelse: Ken Burns (mjuk inzoomning via keyframes), Rhythmic Beat Pulse och 35mm filmkorn.
* **60fps Ljudreaktiva Musikvisualizers:**
  - Procedurrenderade visualizers direkt i uppspelningsmotorn:
    - 💥 **Trap Nation Ring:** Pulserande partikelring som expanderar i takt med bastrumman.
    - 🌆 **Outrun Synthwave Road:** Retrorutnät med animerade neonberg och synthwave-sol.
    - 📊 **Frequency Bars:** Glödande neon-equalizer med flerfärgade spektrumstaplar.
    - 🌀 **Hypnotic Cosmic Portal:** Roterande hypnotisk tunnel och koncentriska energivågor.
  - Kan kombineras sömlöst med AI-bakgrunder, undertexter, övergångar och ljudeffekter.

### Sprint 18: Lokal Render Queue & Bakgrundsrendering (Kommande sprint)
* **Bakgrunds-rendering & Köhantering:** Flera exporter kan köas upp och köras i bakgrunden utan att blockera redigeringen på tidslinjen.
* **Render Queue UI:** Dedikerad panel / modal med progress bars, beräknad återstående tid (ETA), paus/avbryt och direktlänk till exporterad fil.

### Sprint 19: AI Smart Cut & Tystnadsborttagning
* **Silence Removal:** Automatisk detektering av pauser och tystnad i röstspår med tröskelvärden och 1-klicks borttagning.




/**
 * NovaCut - Marketplace & Plugin System
 */
class NovaCutMarketplace {
    constructor(timeline, engine) {
        this.timeline = timeline;
        this.engine = engine;

        this.plugins = [];
        this.activeCategory = 'all';
        this.searchQuery = '';
        this.onlineAssets = window.NOVACUT_ONLINE_ASSETS || [];
        this.currentAudioPreview = null;
        this.currentPlayingCardId = null;
        this.freesoundResults = [];
        this.isSearchingFreesound = false;
        this.activeVideoPreviewAsset = null;

        this.listEl = document.getElementById('marketplaceList');
        this.effectsGrid = document.getElementById('effectsGrid');

        this.init();
    }

    async init() {
        if (!this.onlineAssets || this.onlineAssets.length === 0) {
            this.onlineAssets = window.NOVACUT_ONLINE_ASSETS || [];
        }
        await this.loadInstalledPlugins();
        this.setupEventListeners();
        this.renderMarketplace();
        this.renderEffectsTab();
    }

    async loadInstalledPlugins() {
        if (window.novaCut && typeof window.novaCut.loadPlugins === 'function') {
            try {
                this.plugins = await window.novaCut.loadPlugins();
            } catch (err) {
                console.warn('Could not load plugins via IPC, using defaults:', err);
                this.plugins = this.getDefaultPlugins();
            }
        } else {
            this.plugins = this.getDefaultPlugins();
        }
    }

    getDefaultPlugins() {
        return [
            // ==========================================
            // 🎥 25 LIVE OVERLAYS & PROCEDURAL FX
            // ==========================================
            {
                id: 'vhs-retro',
                name: "80s Retro VHS Cam",
                version: '1.2.0',
                author: 'NovaCut Team',
                category: 'overlay',
                description: 'Analog videobandkänsla med scanlines, tidsstämpel och bandbrus.',
                previewColor: '#ff007f',
                cssFilter: 'contrast(115%) saturate(125%) sepia(20%)',
                overlayType: 'vhs-retro',
                params: [
                    { id: 'noise', label: 'Scanline Täthet', type: 'slider', min: 0, max: 1, step: 0.05, default: 0.6 }
                ]
            },
            {
                id: 'vhs-damage',
                name: 'VCR Tracking & Glitch',
                version: '1.0.0',
                author: 'NovaCut Team',
                category: 'overlay',
                description: 'Kraftigt analogt spårningsfel, brusband och bildflimmer.',
                previewColor: '#f43f5e',
                cssFilter: 'contrast(120%) hue-rotate(10deg)',
                overlayType: 'vhs-damage',
                params: [
                    { id: 'intensity', label: 'Störningsnivå', type: 'slider', min: 0.2, max: 2.0, step: 0.1, default: 1.0 }
                ]
            },
            {
                id: 'camera-shake',
                name: 'Handheld Kamera Skak',
                version: '1.0.0',
                author: 'NovaCut Team',
                category: 'overlay',
                description: 'Organiskt handhållet kameraskak för dokumentär och actionkänsla.',
                previewColor: '#eab308',
                overlayType: 'camera-shake',
                params: [
                    { id: 'intensity', label: 'Skak-intensitet', type: 'slider', min: 0.2, max: 3.0, step: 0.1, default: 1.0 }
                ]
            },
            {
                id: 'beat-shake',
                name: 'Beat-Skak & Bas-Bump',
                version: '1.0.0',
                author: 'NovaCut Team',
                category: 'overlay',
                description: 'Intensiv beat-skakning synkroniserad för bastrummor och drops.',
                previewColor: '#ef4444',
                cssFilter: 'contrast(110%)',
                overlayType: 'beat-shake',
                params: [
                    { id: 'intensity', label: 'Kraft', type: 'slider', min: 0.5, max: 2.5, step: 0.1, default: 1.2 }
                ]
            },
            {
                id: 'rgb-split',
                name: 'RGB Chromatic Glitch',
                version: '1.1.0',
                author: 'NovaCut Team',
                category: 'overlay',
                description: 'Separerade färgkanaler (kromatisk aberration) med cyberkänsla.',
                previewColor: '#06b6d4',
                cssFilter: 'hue-rotate(15deg) contrast(110%)',
                overlayType: 'rgb-split',
                params: [
                    { id: 'offset', label: 'Separationsavstånd', type: 'slider', min: 2, max: 24, step: 1, default: 8 }
                ]
            },
            {
                id: 'film-grain',
                name: '35mm Analogt Filmkorn',
                version: '1.2.0',
                author: 'NovaCut Team',
                category: 'overlay',
                description: 'Fotokemiskt analogt filmkorn för äkta 35mm biokänsla.',
                previewColor: '#78716c',
                cssFilter: 'sepia(10%) contrast(108%)',
                overlayType: 'film-grain',
                params: [
                    { id: 'count', label: 'Korntäthet', type: 'slider', min: 50, max: 400, step: 20, default: 220 }
                ]
            },
            {
                id: 'film-dust',
                name: '16mm Filmdamm & Repor',
                version: '1.1.0',
                author: 'NovaCut Team',
                category: 'overlay',
                description: 'Autentiska dammpartiklar, hårstrån och analoga filmrepor.',
                previewColor: '#a1a1aa',
                cssFilter: 'sepia(18%)',
                overlayType: 'dust-scratches',
                params: [
                    { id: 'count', label: 'Partikeltäthet', type: 'slider', min: 15, max: 120, step: 5, default: 50 }
                ]
            },
            {
                id: 'vignette-cinematic',
                name: 'Filmisk Mjuk Vinjett',
                version: '1.0.0',
                author: 'NovaCut Team',
                category: 'overlay',
                description: 'Mjuka mörka kanter som drar fokus mot mitten av bilden.',
                previewColor: '#27272a',
                overlayType: 'vignette',
                params: [
                    { id: 'contrast', label: 'Fokus', type: 'slider', min: 50, max: 150, step: 5, default: 100 }
                ]
            },
            {
                id: 'vignette-warm',
                name: 'Gyllene Vintage Vinjett',
                version: '1.0.0',
                author: 'NovaCut Team',
                category: 'overlay',
                description: 'Varm bärnstensfärgad vinjett i 70-talsstil.',
                previewColor: '#b45309',
                cssFilter: 'sepia(25%) contrast(110%)',
                overlayType: 'vignette-warm',
                params: [
                    { id: 'warmth', label: 'Gyllene ton', type: 'slider', min: 10, max: 60, step: 2, default: 35 }
                ]
            },
            {
                id: 'rain-storm',
                name: 'Filmiskt Regn & Storm',
                version: '1.2.0',
                author: 'NovaCut Team',
                category: 'overlay',
                description: 'Cinematiska regndroppar med vind, vattentjocklek och vinkel.',
                previewColor: '#38bdf8',
                overlayType: 'rain',
                params: [
                    { id: 'count', label: 'Antal droppar', type: 'slider', min: 30, max: 350, step: 10, default: 140 },
                    { id: 'speed', label: 'Hastighet', type: 'slider', min: 0.3, max: 2.5, step: 0.1, default: 1.0 },
                    { id: 'wind', label: 'Vind / Vinkel', type: 'slider', min: -1.0, max: 1.0, step: 0.1, default: -0.25 }
                ]
            },
            {
                id: 'snow-blizzard',
                name: 'Atmosfäriskt Snöfall',
                version: '1.1.0',
                author: 'NovaCut Team',
                category: 'overlay',
                description: 'Mjuka snöflingor med realistiskt fall och horisontell svajning.',
                previewColor: '#e0f2fe',
                overlayType: 'snow',
                params: [
                    { id: 'count', label: 'Antal flingor', type: 'slider', min: 20, max: 250, step: 10, default: 90 },
                    { id: 'speed', label: 'Fallhastighet', type: 'slider', min: 0.3, max: 2.5, step: 0.1, default: 1.0 }
                ]
            },
            {
                id: 'bokeh-glow',
                name: 'Gyllene Bokeh Ljus',
                version: '1.2.0',
                author: 'NovaCut Team',
                category: 'overlay',
                description: 'Mjuka svävande ljusbubblor med gyllene gloria och lyster.',
                previewColor: '#fbbf24',
                overlayType: 'bokeh',
                params: [
                    { id: 'count', label: 'Antal bubblor', type: 'slider', min: 10, max: 60, step: 2, default: 28 },
                    { id: 'size', label: 'Bubbeldiameter', type: 'slider', min: 25, max: 120, step: 5, default: 55 },
                    { id: 'color', label: 'Färgton', type: 'color', default: '#ffcc33' }
                ]
            },
            {
                id: 'light-leaks',
                name: 'Organiska Ljusläckor',
                version: '1.0.0',
                author: 'NovaCut Team',
                category: 'overlay',
                description: 'Mjuka solreflexer och ljusslöjor som rör sig i bildens kanter.',
                previewColor: '#f97316',
                overlayType: 'light-leaks',
                params: [
                    { id: 'speed', label: 'Rörelsehastighet', type: 'slider', min: 0.2, max: 2.0, step: 0.1, default: 0.7 }
                ]
            },
            {
                id: 'anamorphic-flare',
                name: 'Anamorphic Blue Flare',
                version: '1.0.0',
                author: 'NovaCut Team',
                category: 'overlay',
                description: 'Klassisk horisontell Hollywood sci-fi linsöverstrålning i blått.',
                previewColor: '#38bdf8',
                overlayType: 'anamorphic-flare',
                params: [
                    { id: 'brightness', label: 'Ljusstyrka', type: 'slider', min: 50, max: 150, step: 5, default: 100 }
                ]
            },
            {
                id: 'prism-rainbow',
                name: 'Prismatiska Regnbågsljus',
                version: '1.0.0',
                author: 'NovaCut Team',
                category: 'overlay',
                description: 'Spektrala regnbågsljusbrytningar genom optiskt glas.',
                previewColor: '#a855f7',
                overlayType: 'prism-rainbow',
                params: [
                    { id: 'speed', label: 'Rotation', type: 'slider', min: 0.2, max: 1.5, step: 0.1, default: 0.5 }
                ]
            },
            {
                id: 'laser-grid',
                name: '80s Synthwave Grid',
                version: '1.0.0',
                author: 'NovaCut Team',
                category: 'overlay',
                description: 'Lysande cyan/magenta perspektiv-rutnät i botten av bilden.',
                previewColor: '#06b6d4',
                cssFilter: 'contrast(120%)',
                overlayType: 'laser-grid',
                params: [
                    { id: 'intensity', label: 'Glow', type: 'slider', min: 0.5, max: 2.0, step: 0.1, default: 1.0 }
                ]
            },
            {
                id: 'crt-monitor',
                name: 'Retro CRT Monitor',
                version: '1.0.0',
                author: 'NovaCut Team',
                category: 'overlay',
                description: 'Böjd bildrörs-effekt med fosforlinjer och hörnvinjett.',
                previewColor: '#10b981',
                overlayType: 'crt-monitor',
                params: [
                    { id: 'scanlines', label: 'Scanline-djup', type: 'slider', min: 0.3, max: 1.5, step: 0.1, default: 1.0 }
                ]
            },
            {
                id: 'halftone-dots',
                name: 'Pop Art Halftone Raster',
                version: '1.0.0',
                author: 'NovaCut Team',
                category: 'overlay',
                description: 'Serietidnings- och tidningstrycksraster med mikroprickar.',
                previewColor: '#f59e0b',
                cssFilter: 'contrast(125%)',
                overlayType: 'halftone-dots',
                params: [
                    { id: 'size', label: 'Rasterstorlek', type: 'slider', min: 8, max: 28, step: 2, default: 14 }
                ]
            },
            {
                id: 'fog-mist',
                name: 'Filmiskt Dimlager & Rök',
                version: '1.0.0',
                author: 'NovaCut Team',
                category: 'overlay',
                description: 'Rullande stämningsfull morgondimma och mjuk rök i förgrunden.',
                previewColor: '#cbd5e1',
                overlayType: 'fog-mist',
                params: [
                    { id: 'speed', label: 'Vindhastighet', type: 'slider', min: 0.2, max: 1.5, step: 0.1, default: 0.5 }
                ]
            },
            {
                id: 'fire-embers',
                name: 'Glödande Gnistor & Aska',
                version: '1.0.0',
                author: 'NovaCut Team',
                category: 'overlay',
                description: 'Uppåtstigande glödande eldpartiklar och flammande aska.',
                previewColor: '#ea580c',
                cssFilter: 'contrast(115%) saturate(120%)',
                overlayType: 'fire-embers',
                params: [
                    { id: 'count', label: 'Antal gnistor', type: 'slider', min: 20, max: 150, step: 5, default: 55 }
                ]
            },
            {
                id: 'night-vision',
                name: 'Militär Night Vision',
                version: '1.0.0',
                author: 'NovaCut Team',
                category: 'overlay',
                description: 'Grön monokrom mörkerkikare med sikte och sensorsbrus.',
                previewColor: '#22c55e',
                cssFilter: 'hue-rotate(90deg) saturate(180%) contrast(140%)',
                overlayType: 'night-vision',
                params: [
                    { id: 'noise', label: 'Sensorbrus', type: 'slider', min: 0.5, max: 2.0, step: 0.1, default: 1.0 }
                ]
            },
            {
                id: 'thermal-vision',
                name: 'Termisk Värmekamera',
                version: '1.0.0',
                author: 'NovaCut Team',
                category: 'overlay',
                description: 'Infraröd värmekamera med Predator-färgskala i magenta och gult.',
                previewColor: '#ec4899',
                cssFilter: 'invert(100%) hue-rotate(180deg) saturate(200%)',
                overlayType: 'thermal-vision',
                params: [
                    { id: 'contrast', label: 'Värmekontrast', type: 'slider', min: 100, max: 220, step: 10, default: 150 }
                ]
            },
            {
                id: 'matrix-rain',
                name: 'Matrix Digital Kodkaskad',
                version: '1.0.0',
                author: 'NovaCut Team',
                category: 'overlay',
                description: 'Klassiskt grönt digitalt regn med fallande cybertecken.',
                previewColor: '#4ade80',
                cssFilter: 'contrast(130%) hue-rotate(80deg)',
                overlayType: 'matrix-rain',
                params: [
                    { id: 'speed', label: 'Fallhastighet', type: 'slider', min: 0.5, max: 2.5, step: 0.1, default: 1.0 }
                ]
            },
            {
                id: 'underwater',
                name: 'Undervattens-Krusningar',
                version: '1.0.0',
                author: 'NovaCut Team',
                category: 'overlay',
                description: 'Solljuskaustik och skimrande vattenytor som reflekteras.',
                previewColor: '#0284c7',
                cssFilter: 'hue-rotate(180deg) saturate(130%)',
                overlayType: 'underwater',
                params: [
                    { id: 'speed', label: 'Våghastighet', type: 'slider', min: 0.5, max: 2.5, step: 0.1, default: 1.2 }
                ]
            },
            {
                id: 'strobe-party',
                name: 'Rave Strobe & Color Pulse',
                version: '1.0.0',
                author: 'NovaCut Team',
                category: 'overlay',
                description: 'Snabba färgstarka stroboskopblixtar i takt med musiken.',
                previewColor: '#d946ef',
                cssFilter: 'contrast(125%)',
                overlayType: 'strobe-party',
                params: [
                    { id: 'tempo', label: 'Blixtfrekvens', type: 'slider', min: 1, max: 12, step: 1, default: 6 }
                ]
            },

            // ==========================================
            // 🎨 25 CINEMA LUTS & FÄRGGRADERINGSFILTER
            // ==========================================
            {
                id: 'lut-teal-orange',
                name: 'Teal & Orange Blockbuster',
                version: '1.0.0',
                author: 'NovaCut Cinema',
                category: 'filter',
                description: 'Hollywoods mest populära action-look med varma hudtoner och kalla skuggor.',
                previewColor: '#0284c7',
                cssFilter: 'contrast(125%) saturate(135%) hue-rotate(-15deg) sepia(15%)',
                params: [
                    { id: 'contrast', label: 'Kontrast', type: 'slider', min: 90, max: 160, step: 5, default: 125 }
                ]
            },
            {
                id: 'lut-kodak-portra',
                name: 'Kodak Portra 400',
                version: '1.0.0',
                author: 'NovaCut Cinema',
                category: 'filter',
                description: 'Klassisk analog porträttfilm med mjuka hudtoner och subtil värme.',
                previewColor: '#f59e0b',
                cssFilter: 'contrast(106%) saturate(112%) sepia(12%) brightness(103%)',
                params: [
                    { id: 'warmth', label: 'Värme', type: 'slider', min: 0, max: 30, step: 1, default: 12 }
                ]
            },
            {
                id: 'lut-fuji-velvia',
                name: 'Fuji Velvia 50',
                version: '1.0.0',
                author: 'NovaCut Cinema',
                category: 'filter',
                description: 'Extrem färgmättnad, djup himmel och fyllig natur för landskap.',
                previewColor: '#10b981',
                cssFilter: 'contrast(130%) saturate(155%) brightness(98%)',
                params: [
                    { id: 'saturation', label: 'Mättnad', type: 'slider', min: 100, max: 200, step: 5, default: 155 }
                ]
            },
            {
                id: 'cinematic-warm',
                name: 'Cinematic Golden Hour',
                version: '1.0.0',
                author: 'NovaCut Cinema',
                category: 'filter',
                description: 'Varma gyllene solnedgångstoner med Kodak-inspirerad lyster.',
                previewColor: '#ffaa00',
                cssFilter: 'contrast(110%) saturate(120%) sepia(18%) hue-rotate(-10deg)',
                params: [
                    { id: 'warmth', label: 'Värme', type: 'slider', min: 0, max: 40, step: 1, default: 18 }
                ]
            },
            {
                id: 'cyberpunk-neon',
                name: 'Cyberpunk Neon Tokyo',
                version: '1.0.0',
                author: 'NovaCut Cinema',
                category: 'filter',
                description: 'Elektrisk cyan & magenta neon-tint med ökad kontrast och glow.',
                previewColor: '#00f0ff',
                cssFilter: 'contrast(140%) saturate(160%) hue-rotate(180deg)',
                params: [
                    { id: 'contrast', label: 'Kontrast', type: 'slider', min: 100, max: 180, step: 5, default: 140 }
                ]
            },
            {
                id: 'noir-bw',
                name: 'Film Noir High-Contrast B&W',
                version: '1.0.0',
                author: 'NovaCut Cinema',
                category: 'filter',
                description: 'Dramatisk svartvit filmestetik med skarp kontrast och djup svärta.',
                previewColor: '#52525b',
                cssFilter: 'grayscale(100%) contrast(165%) brightness(95%)',
                params: [
                    { id: 'contrast', label: 'Kontrast', type: 'slider', min: 100, max: 200, step: 5, default: 165 }
                ]
            },
            {
                id: 'lut-silver-gelatin',
                name: 'Silver Gelatin Fine Art',
                version: '1.0.0',
                author: 'NovaCut Cinema',
                category: 'filter',
                description: 'Mjuk, finkänslig monokrom galleriton med silvriga högdagrar.',
                previewColor: '#a1a1aa',
                cssFilter: 'grayscale(100%) contrast(120%) sepia(8%)',
                params: [
                    { id: 'contrast', label: 'Kontrast', type: 'slider', min: 90, max: 150, step: 5, default: 120 }
                ]
            },
            {
                id: 'lut-matrix-green',
                name: 'Matrix Cyber Green',
                version: '1.0.0',
                author: 'NovaCut Cinema',
                category: 'filter',
                description: 'Klassisk grön digital sci-fi-tint inspirerad av Matrix.',
                previewColor: '#22c55e',
                cssFilter: 'contrast(130%) hue-rotate(85deg) saturate(140%)',
                params: [
                    { id: 'greenTint', label: 'Grönt Djup', type: 'slider', min: 50, max: 120, step: 5, default: 85 }
                ]
            },
            {
                id: 'lut-nordic-cold',
                name: 'Nordic Noir Cold',
                version: '1.0.0',
                author: 'NovaCut Cinema',
                category: 'filter',
                description: 'Kalla skandinaviska blå toner och melankolisk krispighet.',
                previewColor: '#38bdf8',
                cssFilter: 'contrast(115%) saturate(85%) hue-rotate(190deg) brightness(98%)',
                params: [
                    { id: 'coolness', label: 'Blå Kyla', type: 'slider', min: 150, max: 220, step: 5, default: 190 }
                ]
            },
            {
                id: 'lut-vintage-70s',
                name: 'Vintage 70s Super 8',
                version: '1.0.0',
                author: 'NovaCut Cinema',
                category: 'filter',
                description: 'Bärnstensgula toner, mättade röda färger och analog nostalgi.',
                previewColor: '#d97706',
                cssFilter: 'sepia(45%) contrast(115%) saturate(110%) brightness(105%)',
                params: [
                    { id: 'sepia', label: 'Sepianivå', type: 'slider', min: 20, max: 70, step: 2, default: 45 }
                ]
            },
            {
                id: 'lut-bleach-bypass',
                name: 'Bleach Bypass (Silver look)',
                version: '1.0.0',
                author: 'NovaCut Cinema',
                category: 'filter',
                description: 'Silveraktig hård kontrast och dämpad färgmättnad (Saving Private Ryan).',
                previewColor: '#94a3b8',
                cssFilter: 'contrast(150%) saturate(55%) brightness(102%)',
                params: [
                    { id: 'contrast', label: 'Hårdhet', type: 'slider', min: 120, max: 180, step: 5, default: 150 }
                ]
            },
            {
                id: 'lut-wes-anderson',
                name: 'Wes Anderson Pastel',
                version: '1.0.0',
                author: 'NovaCut Cinema',
                category: 'filter',
                description: 'Sagoskimrande gula och rosa pastellfärger med mjuk kontrast.',
                previewColor: '#f472b6',
                cssFilter: 'contrast(95%) saturate(130%) sepia(18%) brightness(112%)',
                params: [
                    { id: 'pastel', label: 'Ljusstyrka', type: 'slider', min: 95, max: 130, step: 2, default: 112 }
                ]
            },
            {
                id: 'lut-technicolor',
                name: 'Technicolor 3-Strip Classic',
                version: '1.0.0',
                author: 'NovaCut Cinema',
                category: 'filter',
                description: 'Gyllene Hollywoods guldålder med hyperlevande primärfärger.',
                previewColor: '#ef4444',
                cssFilter: 'contrast(135%) saturate(160%) brightness(97%)',
                params: [
                    { id: 'saturation', label: 'Färgprakt', type: 'slider', min: 120, max: 200, step: 5, default: 160 }
                ]
            },
            {
                id: 'lut-anime-sky',
                name: 'Anime Radiant Sky (Shinkai)',
                version: '1.0.0',
                author: 'NovaCut Cinema',
                category: 'filter',
                description: 'Lysande himmelsblått och livfulla klara färger inspirerade av japansk anime.',
                previewColor: '#60a5fa',
                cssFilter: 'contrast(112%) saturate(145%) brightness(108%)',
                params: [
                    { id: 'vibrance', label: 'Lyster', type: 'slider', min: 110, max: 180, step: 5, default: 145 }
                ]
            },
            {
                id: 'lut-moonlight',
                name: 'Deep Moonlight (Day-for-Night)',
                version: '1.0.0',
                author: 'NovaCut Cinema',
                category: 'filter',
                description: 'Mörkblå nattkänsla som förvandlar dagsljus till filmisk månskensnatt.',
                previewColor: '#1e3a8a',
                cssFilter: 'hue-rotate(210deg) saturate(110%) brightness(88%) contrast(120%)',
                params: [
                    { id: 'darkness', label: 'Mörker', type: 'slider', min: 70, max: 100, step: 2, default: 88 }
                ]
            },
            {
                id: 'lut-california-sunset',
                name: 'California Sunset',
                version: '1.0.0',
                author: 'NovaCut Cinema',
                category: 'filter',
                description: 'Glödande aprikos- och persikotoner med stilla sommarvärme.',
                previewColor: '#fb923c',
                cssFilter: 'sepia(30%) saturate(140%) contrast(115%) hue-rotate(-15deg)',
                params: [
                    { id: 'glow', label: 'Solglöd', type: 'slider', min: 15, max: 45, step: 2, default: 30 }
                ]
            },
            {
                id: 'lut-polaroid-90s',
                name: 'Faded 90s Polaroid',
                version: '1.0.0',
                author: 'NovaCut Cinema',
                category: 'filter',
                description: 'Matta lyfta skuggor, dämpade toner och vintage snapshot-känsla.',
                previewColor: '#e2e8f0',
                cssFilter: 'contrast(90%) brightness(115%) saturate(85%) sepia(15%)',
                params: [
                    { id: 'fade', label: 'Matt skugga', type: 'slider', min: 75, max: 105, step: 2, default: 90 }
                ]
            },
            {
                id: 'lut-horror-cold',
                name: 'Horror Asylum Cold',
                version: '1.0.0',
                author: 'NovaCut Cinema',
                category: 'filter',
                description: 'Kall, ödslig och avmättad spänningskänsla för skräck och thriller.',
                previewColor: '#475569',
                cssFilter: 'saturate(40%) contrast(140%) brightness(90%) hue-rotate(170deg)',
                params: [
                    { id: 'desat', label: 'Bleknad', type: 'slider', min: 20, max: 70, step: 5, default: 40 }
                ]
            },
            {
                id: 'lut-coffee-cream',
                name: 'Kaffe & Grädde Vintage',
                version: '1.0.0',
                author: 'NovaCut Cinema',
                category: 'filter',
                description: 'Mjuka varma bruna toner med behaglig kaffetonad kontrast.',
                previewColor: '#78350f',
                cssFilter: 'sepia(35%) contrast(108%) saturate(95%) brightness(106%)',
                params: [
                    { id: 'warmth', label: 'Kaffeton', type: 'slider', min: 20, max: 55, step: 2, default: 35 }
                ]
            },
            {
                id: 'lut-vaporwave',
                name: 'Vaporwave Dream',
                version: '1.0.0',
                author: 'NovaCut Cinema',
                category: 'filter',
                description: 'Pastellrosa, lila och turkosa toner i drömsk 90s estetik.',
                previewColor: '#c084fc',
                cssFilter: 'hue-rotate(280deg) saturate(165%) contrast(120%)',
                params: [
                    { id: 'hue', label: 'Färgskiftning', type: 'slider', min: 240, max: 320, step: 5, default: 280 }
                ]
            },
            {
                id: 'lut-infrared',
                name: 'Infrared Surreal Dream',
                version: '1.0.0',
                author: 'NovaCut Cinema',
                category: 'filter',
                description: 'Surrealistisk infraröd fotografering med vita löv och dramatisk himmel.',
                previewColor: '#f43f5e',
                cssFilter: 'invert(85%) hue-rotate(180deg) contrast(120%)',
                params: [
                    { id: 'invert', label: 'Infraröd styrka', type: 'slider', min: 60, max: 95, step: 2, default: 85 }
                ]
            },
            {
                id: 'lut-cross-process',
                name: 'Cross-Process Lomo',
                version: '1.0.0',
                author: 'NovaCut Cinema',
                category: 'filter',
                description: 'Kemiskt framkallningsskifte i diafilm med färgskiftningar i cyan och gult.',
                previewColor: '#84cc16',
                cssFilter: 'contrast(140%) saturate(145%) hue-rotate(35deg)',
                params: [
                    { id: 'contrast', label: 'Skärpa & Kontrast', type: 'slider', min: 110, max: 170, step: 5, default: 140 }
                ]
            },
            {
                id: 'lut-gothic-crimson',
                name: 'Gothic Crimson Ruby',
                version: '1.0.0',
                author: 'NovaCut Cinema',
                category: 'filter',
                description: 'Djup rubinröd accentuering med mörka vinröda skuggor.',
                previewColor: '#881337',
                cssFilter: 'contrast(135%) saturate(120%) hue-rotate(320deg) brightness(92%)',
                params: [
                    { id: 'ruby', label: 'Rubinton', type: 'slider', min: 290, max: 350, step: 5, default: 320 }
                ]
            },
            {
                id: 'lut-clean-commercial',
                name: 'Clean Commercial Modern',
                version: '1.0.0',
                author: 'NovaCut Cinema',
                category: 'filter',
                description: 'Krispig neutral vitbalans och premiumglans för reklam och vlogs.',
                previewColor: '#f8fafc',
                cssFilter: 'contrast(108%) brightness(108%) saturate(115%)',
                params: [
                    { id: 'clarity', label: 'Krispighet', type: 'slider', min: 100, max: 130, step: 2, default: 108 }
                ]
            },
            {
                id: 'lut-emerald-forest',
                name: 'Emerald Forest Deep Green',
                version: '1.0.0',
                author: 'NovaCut Cinema',
                category: 'filter',
                description: 'Djupa mossgröna toner och gyllene solreflexer för natur och skog.',
                previewColor: '#059669',
                cssFilter: 'contrast(120%) saturate(125%) hue-rotate(55deg)',
                params: [
                    { id: 'green', label: 'Smaragdton', type: 'slider', min: 30, max: 80, step: 5, default: 55 }
                ]
            }
        ];
    }

    renderMarketplace() {
        if (!this.listEl) return;
        this.listEl.innerHTML = '';

        // 1. If Typsnitt category is selected, show the DaFont Import Banner at the top
        if (this.activeCategory === 'font') {
            const importBanner = document.createElement('div');
            importBanner.className = 'create-filter-banner';
            importBanner.style.background = 'linear-gradient(135deg, rgba(56, 189, 248, 0.15), rgba(14, 165, 233, 0.05))';
            importBanner.style.border = '1px dashed #38bdf8';
            importBanner.style.cursor = 'pointer';
            importBanner.innerHTML = `
                <h4 style="color: #38bdf8; display: flex; align-items: center; gap: 8px;">
                    <span>📂</span> <span>Importera Eget Typsnitt (.ttf / .otf / .woff2)</span>
                </h4>
                <p style="margin-top: 4px; line-height: 1.4;">
                    Har du hämtat typsnitt från <strong>DaFont</strong> eller har lokala fonter på datorn? Klicka här för att importera dem direkt till NovaCut.
                </p>
                <div style="margin-top: 8px;">
                    <button class="btn-primary" style="background: #0284c7; padding: 6px 14px; font-size: 11px;">+ Välj fontfil från datorn</button>
                </div>
            `;
            importBanner.addEventListener('click', async () => {
                if (window.fontManager) {
                    const res = await window.fontManager.importCustomFont();
                    if (res) {
                        const sel = this.timeline.getSelectedClip ? this.timeline.getSelectedClip() : null;
                        if (sel && sel.trackId === 'text') {
                            sel.fontFamily = res.fontFamily;
                            if (window.inspector) window.inspector.update(sel);
                            this.engine.render();
                        }
                        this.renderMarketplace();
                    }
                }
            });
            this.listEl.appendChild(importBanner);
        }

        // 2. Filter Online Assets (Curated Library + Freesound results)
        const isOnlineCat = ['all', 'online-sfx', 'online-vfx', 'online-music', 'overlay', 'transition'].includes(this.activeCategory);
        let filteredOnlineAssets = [];
        if (isOnlineCat) {
            const combined = [...(this.freesoundResults || []), ...(this.onlineAssets || [])];
            filteredOnlineAssets = combined.filter(asset => {
                let matchesCat = this.activeCategory === 'all';
                if (this.activeCategory === 'online-vfx' || this.activeCategory === 'overlay') {
                    matchesCat = asset.category === 'online-vfx' || asset.category === 'overlay';
                } else if (this.activeCategory === 'transition') {
                    matchesCat = asset.category === 'transition';
                } else {
                    matchesCat = asset.category === this.activeCategory;
                }

                const q = this.searchQuery;
                const matchesSearch = !q || 
                    asset.name.toLowerCase().includes(q) || 
                    (asset.description && asset.description.toLowerCase().includes(q)) ||
                    (asset.tags && asset.tags.some(t => t.toLowerCase().includes(q)));
                return matchesCat && matchesSearch;
            });
        }

        // 3. Filter Plugins (Filters & Procedural Live Overlays)
        let filteredPlugins = [];
        if (!['font', 'online-sfx', 'online-music'].includes(this.activeCategory)) {
            filteredPlugins = this.plugins.filter(p => {
                let matchesCat = this.activeCategory === 'all';
                if (this.activeCategory === 'overlay' || this.activeCategory === 'online-vfx') {
                    matchesCat = p.category === 'overlay';
                } else if (this.activeCategory === 'filter') {
                    matchesCat = p.category === 'filter';
                } else {
                    matchesCat = this.activeCategory === 'all' || p.category === this.activeCategory;
                }

                const matchesSearch = !this.searchQuery || 
                    p.name.toLowerCase().includes(this.searchQuery) || 
                    p.description.toLowerCase().includes(this.searchQuery);
                return matchesCat && matchesSearch;
            });
        }

        // 4. Filter Built-in Transitions (124+ Transitions from library)
        let filteredTransitions = [];
        if (['transition', 'all'].includes(this.activeCategory) && window.transitions && window.transitions.library) {
            const q = this.searchQuery;
            filteredTransitions = window.transitions.library.filter(t => {
                return !q || t.name.toLowerCase().includes(q) || (t.description && t.description.toLowerCase().includes(q));
            });
        }

        // 5. Filter Fonts (Curated Google Fonts + Custom Fonts)
        let filteredFonts = [];
        if (['font', 'all'].includes(this.activeCategory) && window.fontManager) {
            const curated = window.fontManager.getCuratedFonts();
            const custom = window.fontManager.getCustomFonts();

            const allFonts = [
                ...custom.map(f => ({ ...f, isCustom: true, category: 'Eget Importerat', description: `Importerad typsnittsfil: ${f.fileName}`, sample: f.fontName })),
                ...curated.map(f => ({ ...f, isGoogle: true }))
            ];

            filteredFonts = allFonts.filter(f => {
                if (!this.searchQuery) return true;
                const q = this.searchQuery;
                return (f.name && f.name.toLowerCase().includes(q)) ||
                       (f.fontName && f.fontName.toLowerCase().includes(q)) ||
                       (f.category && f.category.toLowerCase().includes(q)) ||
                       (f.description && f.description.toLowerCase().includes(q)) ||
                       (f.tags && f.tags.some(t => t.toLowerCase().includes(q)));
            });
        }

        if (filteredOnlineAssets.length === 0 && filteredPlugins.length === 0 && filteredFonts.length === 0 && filteredTransitions.length === 0) {
            const emptyMsg = document.createElement('div');
            emptyMsg.style.color = 'var(--text-muted)';
            emptyMsg.style.textAlign = 'center';
            emptyMsg.style.padding = '30px 16px';
            emptyMsg.style.fontSize = '12px';
            emptyMsg.innerHTML = `
                <div style="font-size: 24px; margin-bottom: 8px;">🔍</div>
                <div>Inga resurser matchade "${this.searchQuery}".</div>
                <div style="margin-top: 6px; font-size: 11px; color: var(--text-secondary);">Testa att söka på Freesound.org eller välja en annan kategori ovan.</div>
            `;
            this.listEl.appendChild(emptyMsg);
            return;
        }

        // 5. Render Online Assets (SFX, VFX Overlays, Music, Freesound)
        filteredOnlineAssets.forEach(asset => {
            const card = document.createElement('div');
            card.className = 'online-asset-card';
            
            let bannerClass = 'banner-sfx';
            let icon = '💥';
            let catName = 'Gratis SFX';
            if (asset.category === 'online-vfx') {
                bannerClass = 'banner-vfx';
                icon = '🎬';
                catName = 'Video Overlay';
            } else if (asset.category === 'online-music') {
                bannerClass = 'banner-music';
                icon = '🎵';
                catName = 'Royalty-fri Musik';
            } else if (asset.category === 'transition') {
                bannerClass = 'banner-transition';
                icon = '⧗';
                catName = 'Övergångspaket';
            }

            const isAudio = asset.category === 'online-sfx' || asset.category === 'online-music';
            const durationStr = asset.duration ? (typeof asset.duration === 'number' ? asset.duration.toFixed(1) + 's' : asset.duration) : 'Loop';

            card.innerHTML = `
                <div class="online-asset-banner ${bannerClass}">
                    <div class="asset-badge">
                        <span>${icon}</span>
                        <span>${catName}</span>
                    </div>
                    <span class="asset-duration-tag">${durationStr}</span>
                </div>
                <div class="online-asset-info">
                    <div class="online-asset-title-row">
                        <span class="online-asset-name" title="${asset.name}">${asset.name}</span>
                        <span class="online-asset-source">${asset.source || 'Webb'} • ${asset.license || 'CC0'}</span>
                    </div>
                    <div class="online-asset-desc">${asset.description || 'Royalty-fri resurs klar att användas i dina projekt.'}</div>
                    <div class="online-asset-actions">
                        ${isAudio ? `
                            <button class="btn-preview-audio" data-preview-id="${asset.id}">
                                <span>▶</span> <span>Provlyssna</span>
                            </button>
                        ` : `
                            <button class="btn-preview-audio btn-preview-video" data-video-id="${asset.id}">
                                <span>👁️</span> <span>Förhandsgranska</span>
                            </button>
                        `}
                        <button class="btn-import-asset" data-import-id="${asset.id}">
                            <span>📥</span> <span>Hämta & Använd</span>
                        </button>
                    </div>
                </div>
            `;

            // Audio preview listener
            const previewBtn = card.querySelector(`[data-preview-id="${asset.id}"]`);
            if (previewBtn) {
                previewBtn.addEventListener('click', () => {
                    this.toggleAudioPreview(asset, previewBtn);
                });
            }

            // Video preview listener
            const videoPreviewBtn = card.querySelector(`[data-video-id="${asset.id}"]`);
            if (videoPreviewBtn) {
                videoPreviewBtn.addEventListener('click', () => {
                    this.openVideoPreview(asset);
                });
            }

            // Download & Import listener
            const importBtn = card.querySelector(`[data-import-id="${asset.id}"]`);
            if (importBtn) {
                importBtn.addEventListener('click', () => {
                    this.downloadAndImportOnlineAsset(asset, importBtn);
                });
            }

            this.listEl.appendChild(card);
        });

        // 6. Render Font Cards
        filteredFonts.forEach(font => {
            const selectedClip = this.timeline.getSelectedClip ? this.timeline.getSelectedClip() : 
                (this.timeline.clips.find(c => c.id === this.timeline.selectedClipId));
            const hasSelectedText = selectedClip && selectedClip.trackId === 'text';

            const card = document.createElement('div');
            card.className = 'plugin-card';
            card.innerHTML = `
                <div class="plugin-banner" style="background: #090a10; padding: 16px 14px; min-height: 84px; display: flex; flex-direction: column; justify-content: center; border-bottom: 1px solid var(--border-color); overflow: hidden;">
                    <div style="font-family: ${font.fontFamily}; font-size: 24px; color: #ffffff; line-height: 1.2; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                        ${font.sample}
                    </div>
                    <div style="display: flex; align-items: center; gap: 8px; margin-top: 8px;">
                        <span class="plugin-category-badge" style="background: ${font.isCustom ? '#8b5cf6' : '#0284c7'}; color: white;">
                            ${font.isCustom ? 'Eget Typsnitt' : 'Google Fonts'}
                        </span>
                        <span style="font-size: 10px; color: var(--accent);">✔ ${font.isCustom ? 'Lokalt installerad' : 'OFL Fri kommersiell licens'}</span>
                    </div>
                </div>
                <div class="plugin-info">
                    <div class="plugin-title-row">
                        <span class="plugin-name">${font.name || font.fontName}</span>
                        <span style="font-size: 11px; color: var(--text-muted);">${font.category}</span>
                    </div>
                    <p class="plugin-desc">${font.description}</p>
                    <div class="plugin-actions" style="margin-top: 8px; display: flex; gap: 8px; justify-content: flex-end; align-items: center;">
                        ${hasSelectedText ? `<button class="tool-btn btn-apply-font" style="font-size: 11px; padding: 5px 10px; color: var(--accent);">✏️ Ändra markerad text</button>` : ''}
                        <button class="btn-add-effect btn-create-font-clip" style="background: var(--accent); color: #000; font-size: 11px; padding: 5px 12px;">+ Skapa Textklipp</button>
                    </div>
                </div>
            `;

            const btnApply = card.querySelector('.btn-apply-font');
            if (btnApply) {
                btnApply.addEventListener('click', () => {
                    const sel = this.timeline.getSelectedClip ? this.timeline.getSelectedClip() : 
                        (this.timeline.clips.find(c => c.id === this.timeline.selectedClipId));
                    if (sel && sel.trackId === 'text') {
                        sel.fontFamily = font.fontFamily;
                        if (window.inspector) window.inspector.update(sel);
                        this.engine.render();
                    }
                });
            }

            const btnCreate = card.querySelector('.btn-create-font-clip');
            if (btnCreate) {
                btnCreate.addEventListener('click', () => {
                    const clip = this.timeline.addClip({
                        trackId: 'text',
                        title: font.name || font.fontName,
                        type: 'text',
                        text: font.sample,
                        fontFamily: font.fontFamily,
                        fontSize: 64,
                        startTime: this.engine.currentTime,
                        duration: 4.0,
                        color: '#ffffff'
                    });
                    if (window.inspector) window.inspector.update(clip);
                });
            }

            this.listEl.appendChild(card);
        });

        // 7. Render Plugin Cards (Filters, Overlays)
        filteredPlugins.forEach(plugin => {
            const card = document.createElement('div');
            card.className = 'plugin-card';
            card.innerHTML = `
                <div class="plugin-banner" style="background: linear-gradient(135deg, ${plugin.previewColor || '#3b82f6'} 0%, #0c0d12 100%);">
                    <span class="plugin-category-badge">${plugin.category}</span>
                    <span style="font-size: 11px; opacity: 0.8;">v${plugin.version || '1.0'}</span>
                </div>
                <div class="plugin-info">
                    <div class="plugin-title-row">
                        <span class="plugin-name">${plugin.name}</span>
                    </div>
                    <span class="plugin-author">Av ${plugin.author || 'Community'}</span>
                    <p class="plugin-desc">${plugin.description}</p>
                    <div class="plugin-actions">
                        <span style="font-size: 10px; color: var(--accent);">✔ Community Verified</span>
                        <button class="btn-add-effect" data-id="${plugin.id}">+ Använd i Projekt</button>
                    </div>
                </div>
            `;

            card.querySelector('.btn-add-effect').addEventListener('click', () => {
                this.addPluginToTimeline(plugin);
            });

            this.listEl.appendChild(card);
        });

        // 8. Render Transition Cards (124+ Transitions from library)
        const displayTransitions = (this.activeCategory === 'all' && !this.searchQuery)
            ? filteredTransitions.slice(0, 16)
            : filteredTransitions;

        if (this.activeCategory === 'all' && !this.searchQuery && filteredTransitions.length > 16) {
            const transNotice = document.createElement('div');
            transNotice.style.display = 'flex';
            transNotice.style.alignItems = 'center';
            transNotice.style.justifyContent = 'space-between';
            transNotice.style.padding = '8px 12px';
            transNotice.style.background = 'rgba(99, 102, 241, 0.12)';
            transNotice.style.border = '1px solid rgba(99, 102, 241, 0.3)';
            transNotice.style.borderRadius = '8px';
            transNotice.style.marginBottom = '8px';
            transNotice.innerHTML = `
                <span style="font-size: 11px; color: #c7d2fe;">⧗ Visar 16 av ${filteredTransitions.length} övergångar</span>
                <button class="btn-xs" style="background: #4f46e5; color: white; border: none; border-radius: 4px; padding: 4px 10px; font-size: 10px; cursor: pointer; font-weight: 600;">Visa alla 124+ övergångar</button>
            `;
            transNotice.querySelector('button').addEventListener('click', () => {
                const chip = document.querySelector('#tab-marketplace .chip[data-cat="transition"]');
                if (chip) chip.click();
            });
            this.listEl.appendChild(transNotice);
        }

        displayTransitions.forEach(trans => {
            const card = document.createElement('div');
            card.className = 'plugin-card transition-market-card';
            card.innerHTML = `
                <div class="plugin-banner" style="background: linear-gradient(135deg, #4f46e5 0%, #1e1b4b 100%); display: flex; align-items: center; justify-content: space-between; padding: 12px 14px;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span style="font-size: 22px;">${trans.icon || '⧗'}</span>
                        <span class="plugin-category-badge" style="background: rgba(99, 102, 241, 0.35); border: 1px solid #6366f1; color: #e0e7ff;">
                            ⧗ ${trans.category ? trans.category.toUpperCase() : 'TRANSITION'}
                        </span>
                    </div>
                    <span style="font-size: 11px; color: #a5b4fc; font-weight: 500;">${trans.defaultDuration || 0.5}s</span>
                </div>
                <div class="plugin-info">
                    <div class="plugin-title-row">
                        <span class="plugin-name">${trans.name}</span>
                        <span style="font-size: 10px; color: var(--accent);">✔ Inbyggd Pro</span>
                    </div>
                    <p class="plugin-desc">${trans.description || 'Högkvalitativ klippövergång klar att användas.'}</p>
                    <div class="plugin-actions" style="margin-top: 8px; display: flex; gap: 6px; justify-content: flex-end; align-items: center;">
                        <button class="btn-primary btn-apply-trans-market" style="font-size: 11px; padding: 5px 12px; background: var(--accent); color: #000;">+ Använd på Klipp</button>
                    </div>
                </div>
            `;

            card.querySelector('.btn-apply-trans-market').addEventListener('click', () => {
                const selId = this.timeline?.selectedClipId;
                if (window.transitions) {
                    if (selId) {
                        window.transitions.applyTransitionToClip(selId, trans.id);
                    } else {
                        const firstVideo = this.timeline?.clips.find(c => c.trackId === 'video' || c.trackId === 'overlay');
                        if (firstVideo) {
                            window.transitions.applyTransitionToClip(firstVideo.id, trans.id);
                        } else if (window.novaCutToast) {
                            window.novaCutToast(`✨ Valde "${trans.name}"! Markera ett videoklipp i tidslinjen.`);
                        }
                    }
                }
            });

            this.listEl.appendChild(card);
        });
    }

    renderEffectsTab(category = 'all', searchQuery = '') {
        if (!this.effectsGrid) return;
        this.effectsGrid.innerHTML = '';

        let filtered = this.plugins;
        if (category !== 'all') {
            filtered = filtered.filter(p => p.category === category);
        }
        if (searchQuery) {
            const q = searchQuery.toLowerCase().trim();
            filtered = filtered.filter(p => p.name.toLowerCase().includes(q) || (p.description && p.description.toLowerCase().includes(q)));
        }

        if (filtered.length === 0) {
            this.effectsGrid.innerHTML = `<div style="text-align: center; color: var(--text-muted); padding: 20px; font-size: 12px;">Inga effekter matchade "${searchQuery}"</div>`;
            return;
        }

        filtered.forEach(plugin => {
            const item = document.createElement('div');
            item.className = 'plugin-card';
            item.style.marginBottom = '6px';
            const isOverlay = plugin.category === 'overlay';
            const catLabel = isOverlay ? '🎥 Live FX Overlay' : '🎨 Cinema LUT Filter';

            item.innerHTML = `
                <div style="padding: 10px 14px; display: flex; align-items: center; justify-content: space-between; gap: 10px;">
                    <div style="display: flex; align-items: center; gap: 12px; flex: 1; min-width: 0;">
                        <div style="width: 14px; height: 14px; border-radius: 4px; background: ${plugin.previewColor || '#ec4899'}; flex-shrink: 0; box-shadow: 0 0 8px ${plugin.previewColor || '#ec4899'}44;"></div>
                        <div style="min-width: 0; flex: 1;">
                            <div style="display: flex; align-items: center; gap: 6px;">
                                <span style="font-weight: 600; font-size: 12px; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${plugin.name}</span>
                                <span style="font-size: 9px; padding: 2px 5px; border-radius: 3px; background: ${isOverlay ? 'rgba(56, 189, 248, 0.15)' : 'rgba(244, 63, 94, 0.15)'}; color: ${isOverlay ? '#38bdf8' : '#fb7185'}; white-space: nowrap;">${catLabel}</span>
                            </div>
                            <div style="font-size: 11px; color: var(--text-muted); margin-top: 2px; line-height: 1.3; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;">${plugin.description}</div>
                        </div>
                    </div>
                    <button class="btn-primary btn-add-fx" style="font-size: 11px; padding: 5px 10px; border-radius: 4px; flex-shrink: 0; justify-content: center; height: auto;" title="Lägg till effektlager">+ Lägg till</button>
                </div>
            `;
            item.querySelector('.btn-add-fx').addEventListener('click', () => {
                this.addPluginToTimeline(plugin);
            });
            this.effectsGrid.appendChild(item);
        });
    }

    addPluginToTimeline(plugin) {
        const defaultParams = {};
        if (plugin.params) {
            plugin.params.forEach(p => { defaultParams[p.id] = p.default; });
        }

        const playheadTime = this.engine.currentTime;

        const clip = this.timeline.addClip({
            trackId: 'effect',
            title: plugin.name,
            type: 'effect',
            startTime: playheadTime,
            duration: 4.0,
            cssFilter: plugin.cssFilter,
            overlayType: plugin.overlayType,
            pluginId: plugin.id,
            manifest: plugin,
            params: defaultParams
        });

        // Switch to inspector
        if (window.inspector) {
            window.inspector.update(clip);
        }

        if (this.engine) {
            this.engine.render();
        }

        if (window.novaCutToast) {
            window.novaCutToast(`🪄 "${plugin.name}" tillagd på effektspåret vid ${playheadTime.toFixed(1)}s!`);
        }
    }

    // =========================================================================
    // Online Asset Hub & Audio/Video Preview Helpers
    // =========================================================================

    toggleAudioPreview(asset, btnElement) {
        if (this.currentAudioPreview && this.currentPlayingCardId === asset.id) {
            this.stopAudioPreview();
            return;
        }

        this.stopAudioPreview();

        if (!asset.previewUrl) {
            if (window.novaCutToast) window.novaCutToast('Ingen ljudförhandsgranskning tillgänglig.');
            return;
        }

        const audio = new Audio(asset.previewUrl);
        this.currentAudioPreview = audio;
        this.currentPlayingCardId = asset.id;
        
        btnElement.classList.add('playing');
        btnElement.innerHTML = `<span>${ncIcon('pause')}</span> <span>Stoppa</span>`;

        audio.play().catch(e => {
            console.warn('Audio preview play failed:', e);
            this.stopAudioPreview();
        });

        audio.addEventListener('ended', () => {
            this.stopAudioPreview();
        });

        audio.addEventListener('error', () => {
            this.stopAudioPreview();
            if (window.novaCutToast) window.novaCutToast('Kunde inte läsa förhandsgranskningsljud.');
        });
    }

    stopAudioPreview() {
        if (this.currentAudioPreview) {
            try { this.currentAudioPreview.pause(); } catch (_) {}
            this.currentAudioPreview = null;
        }
        if (this.currentPlayingCardId && this.listEl) {
            const btn = this.listEl.querySelector(`[data-preview-id="${this.currentPlayingCardId}"]`);
            if (btn) {
                btn.classList.remove('playing');
                btn.innerHTML = `<span>${ncIcon('play', { solid: true })}</span> <span>Provlyssna</span>`;
            }
        }
        this.currentPlayingCardId = null;
    }

    openVideoPreview(asset) {
        this.activeVideoPreviewAsset = asset;
        const modal = document.getElementById('videoPreviewModal');
        const player = document.getElementById('videoPreviewPlayer');
        const title = document.getElementById('videoPreviewModalTitle');
        const desc = document.getElementById('videoPreviewDesc');

        if (title) title.textContent = asset.name;
        if (desc) desc.textContent = `${asset.description || ''} • Källa: ${asset.source || 'Webb'} (${asset.license || 'CC0'})`;
        if (player) {
            player.src = asset.previewUrl;
            player.currentTime = 0;
            player.play().catch(() => {});
        }
        if (modal) modal.classList.add('active');
    }

    async downloadAndImportOnlineAsset(asset, btnElement) {
        if (asset.category === 'transition') {
            if (btnElement) {
                btnElement.classList.add('installed');
                btnElement.innerHTML = `<span>✔</span> <span>Aktiverad!</span>`;
                setTimeout(() => {
                    btnElement.innerHTML = `<span>+</span> <span>Använd</span>`;
                }, 2500);
            }
            const selId = this.timeline?.selectedClipId;
            let appliedTrans = 'dissolve';
            if (asset.id.includes('whip') || asset.id.includes('zoom')) appliedTrans = 'whip_left';
            else if (asset.id.includes('glitch') || asset.id.includes('cyber')) appliedTrans = 'glitch_rgb';
            else if (asset.id.includes('film') || asset.id.includes('burn')) appliedTrans = 'film_burn';
            else if (asset.id.includes('3d') || asset.id.includes('cube')) appliedTrans = 'cube_spin';
            else if (asset.id.includes('soft') || asset.id.includes('blur')) appliedTrans = 'blur_fade';

            if (window.transitions) {
                if (selId) {
                    window.transitions.applyTransitionToClip(selId, appliedTrans);
                } else {
                    const firstVideo = this.timeline?.clips.find(c => c.trackId === 'video' || c.trackId === 'overlay');
                    if (firstVideo) window.transitions.applyTransitionToClip(firstVideo.id, appliedTrans);
                }
            }

            if (window.novaCutToast) {
                window.novaCutToast(`🎉 ${asset.name} är tillgängligt! Övergång tillagd på klippet.`);
            }
            return;
        }

        if (!window.novaCut || typeof window.novaCut.downloadOnlineAsset !== 'function') {
            alert('Nedladdning från Online Hub är endast tillgänglig i NovaCut-appen.');
            return;
        }

        const originalText = btnElement ? btnElement.innerHTML : '';
        if (btnElement) {
            btnElement.disabled = true;
            btnElement.innerHTML = `<span>⏳</span> <span>Hämtar...</span>`;
        }

        try {
            const res = await window.novaCut.downloadOnlineAsset({
                url: asset.downloadUrl,
                filename: asset.downloadFileName || `${asset.id}.mp4`,
                type: asset.category === 'online-vfx' ? 'video' : 'audio'
            });

            if (!res.success) {
                throw new Error(res.error || 'Okänt nedladdningsfel');
            }

            // 1. Add file to project media library
            if (typeof window.handleImportedFile === 'function') {
                window.handleImportedFile({
                    path: res.filePath,
                    name: asset.name,
                    type: res.type,
                    size: 0
                });
            }

            // 2. Add clip to timeline at current playhead
            const trackId = asset.defaultTrack || (asset.category === 'online-vfx' ? 'overlay' : 'audio');
            const clip = this.timeline.addClip({
                mediaId: `media-${Date.now()}`,
                filePath: res.filePath,
                title: asset.name,
                type: res.type,
                trackId: trackId,
                startTime: this.engine.currentTime || 0,
                duration: asset.duration || (res.type === 'audio' ? 4.0 : 8.0),
                blendMode: asset.blendMode || 'normal'
            });

            if (this.engine) this.engine.render();

            if (btnElement) {
                btnElement.disabled = false;
                btnElement.classList.add('installed');
                btnElement.innerHTML = `<span>✔</span> <span>Tillagd!</span>`;
                setTimeout(() => {
                    btnElement.innerHTML = `<span>+</span> <span>Lägg till</span>`;
                }, 3000);
            }

            if (window.novaCutToast) {
                window.novaCutToast(`🎉 "${asset.name}" hämtades & placerades på tidslinjen vid ${this.engine.currentTime.toFixed(1)}s!`);
            }
        } catch (err) {
            console.error('[Marketplace Download] Error:', err);
            if (btnElement) {
                btnElement.disabled = false;
                btnElement.innerHTML = originalText || `<span>📥</span> <span>Försök igen</span>`;
            }
            alert(`Kunde inte ladda ner resurs: ${err.message}`);
        }
    }

    async performFreesoundSearch(query) {
        if (!window.novaCut || typeof window.novaCut.searchFreesound !== 'function') return;

        const liveBar = document.getElementById('freesoundLiveSearchBar');
        const triggerBtn = document.getElementById('btnTriggerFreesoundSearch');
        if (triggerBtn) triggerBtn.textContent = 'Söker...';

        try {
            const res = await window.novaCut.searchFreesound({ query, pageSize: 20 });
            if (res.requiresApiKey) {
                const proceed = confirm('Freesound.org kräver en gratis API-nyckel för obegränsad live-sökning bland 550 000+ ljud.\n\nVill du ange din gratisnyckel nu?');
                if (proceed) {
                    this.openFreesoundConfigModal();
                }
                return;
            }

            if (!res.success) {
                alert(`Freesound sökfel: ${res.error}`);
                return;
            }

            this.freesoundResults = res.results || [];
            if (window.novaCutToast) {
                window.novaCutToast(`🌐 Hittade ${this.freesoundResults.length} ljud på Freesound.org!`);
            }

            this.activeCategory = 'online-sfx';
            document.querySelectorAll('#tab-marketplace .category-chips .chip').forEach(c => {
                c.classList.toggle('active', c.dataset.cat === 'online-sfx');
            });

            this.renderMarketplace();
        } catch (err) {
            alert(`Sökfel: ${err.message}`);
        } finally {
            if (triggerBtn) triggerBtn.textContent = 'Sök Freesound';
        }
    }

    async openFreesoundConfigModal() {
        const modal = document.getElementById('freesoundConfigModal');
        const input = document.getElementById('freesoundApiKeyInput');
        if (modal) {
            if (window.novaCut && typeof window.novaCut.getFreesoundConfig === 'function') {
                const cfg = await window.novaCut.getFreesoundConfig();
                if (input) input.value = cfg.apiKey || '';
            }
            modal.classList.add('active');
        }
    }

    setupEventListeners() {
        // Search
        const searchInput = document.getElementById('marketplaceSearch');
        const freesoundLiveBar = document.getElementById('freesoundLiveSearchBar');
        const freesoundLabel = document.getElementById('freesoundSearchLabel');

        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchQuery = e.target.value.toLowerCase().trim();
                
                if (freesoundLiveBar) {
                    if (this.searchQuery.length >= 2 || this.activeCategory === 'online-sfx') {
                        freesoundLiveBar.style.display = 'block';
                        if (freesoundLabel) {
                            freesoundLabel.textContent = `🌐 Sök "${this.searchQuery || 'ljud'}" på Freesound.org:`;
                        }
                    } else {
                        freesoundLiveBar.style.display = 'none';
                    }
                }

                this.renderMarketplace();
            });
        }

        // Trigger Freesound Live Search button
        const btnTriggerFreesound = document.getElementById('btnTriggerFreesoundSearch');
        if (btnTriggerFreesound) {
            btnTriggerFreesound.addEventListener('click', () => {
                const q = this.searchQuery || 'whoosh';
                this.performFreesoundSearch(q);
            });
        }

        // Freesound Config Modal button
        const btnFreesoundConfig = document.getElementById('btnFreesoundConfig');
        if (btnFreesoundConfig) {
            btnFreesoundConfig.addEventListener('click', () => this.openFreesoundConfigModal());
        }

        // Save Freesound API Key
        const btnSaveFreesoundKey = document.getElementById('btnSaveFreesoundApiKey');
        if (btnSaveFreesoundKey) {
            btnSaveFreesoundKey.addEventListener('click', async () => {
                const input = document.getElementById('freesoundApiKeyInput');
                const key = input ? input.value.trim() : '';
                if (window.novaCut && typeof window.novaCut.saveFreesoundConfig === 'function') {
                    await window.novaCut.saveFreesoundConfig({ apiKey: key });
                }
                const modal = document.getElementById('freesoundConfigModal');
                if (modal) modal.classList.remove('active');
                if (window.novaCutToast) window.novaCutToast('✅ Freesound API-nyckel sparades!');
                if (this.searchQuery) {
                    this.performFreesoundSearch(this.searchQuery);
                }
            });
        }

        // Explore Online Hub Banner
        const btnExploreOnlineHub = document.getElementById('btnExploreOnlineHub');
        if (btnExploreOnlineHub) {
            btnExploreOnlineHub.addEventListener('click', () => {
                this.activeCategory = 'online-sfx';
                document.querySelectorAll('#tab-marketplace .category-chips .chip').forEach(c => {
                    c.classList.toggle('active', c.dataset.cat === 'online-sfx');
                });
                if (freesoundLiveBar) freesoundLiveBar.style.display = 'block';
                this.renderMarketplace();
            });
        }

        // Import from Video Preview Modal
        const btnImportVideo = document.getElementById('btnImportFromVideoPreview');
        if (btnImportVideo) {
            btnImportVideo.addEventListener('click', () => {
                if (this.activeVideoPreviewAsset) {
                    this.downloadAndImportOnlineAsset(this.activeVideoPreviewAsset, btnImportVideo);
                    const modal = document.getElementById('videoPreviewModal');
                    if (modal) modal.classList.remove('active');
                }
            });
        }

        // Marketplace Category Chips
        document.querySelectorAll('#tab-marketplace .category-chips .chip').forEach(chip => {
            chip.addEventListener('click', () => {
                document.querySelectorAll('#tab-marketplace .category-chips .chip').forEach(c => c.classList.remove('active'));
                chip.classList.add('active');
                this.activeCategory = chip.dataset.cat;

                if (freesoundLiveBar) {
                    if (this.activeCategory === 'online-sfx' || (this.searchQuery && this.searchQuery.length >= 2)) {
                        freesoundLiveBar.style.display = 'block';
                    } else {
                        freesoundLiveBar.style.display = 'none';
                    }
                }

                this.renderMarketplace();
            });
        });

        // Effects Tab Filter Chips & Search
        const fxSearchInput = document.getElementById('effectsSearchInput');
        let activeFxCategory = 'all';
        let activeFxQuery = '';

        if (fxSearchInput) {
            fxSearchInput.addEventListener('input', (e) => {
                activeFxQuery = e.target.value;
                this.renderEffectsTab(activeFxCategory, activeFxQuery);
            });
        }

        document.querySelectorAll('.fx-cat-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                document.querySelectorAll('.fx-cat-chip').forEach(c => c.classList.remove('active'));
                chip.classList.add('active');
                activeFxCategory = chip.getAttribute('data-cat') || 'all';
                this.renderEffectsTab(activeFxCategory, activeFxQuery);
            });
        });

        // Open Create Plugin Modal
        const btnOpen = document.getElementById('btnOpenCreatePluginModal');
        const modal = document.getElementById('createPluginModal');
        if (btnOpen && modal) {
            btnOpen.addEventListener('click', () => {
                modal.classList.add('active');
            });
        }

        // Save New Plugin
        const btnSave = document.getElementById('btnSaveNewPlugin');
        if (btnSave) {
            btnSave.addEventListener('click', async () => {
                const name = document.getElementById('devPluginName').value.trim() || 'Mitt Filter';
                const author = document.getElementById('devPluginAuthor').value.trim() || 'Alex';
                const desc = document.getElementById('devPluginDesc').value.trim() || 'Eget skapat filter i NovaCut.';
                const filterStr = document.getElementById('devPluginFilter').value.trim() || 'contrast(120%)';
                const color = document.getElementById('devPluginColor').value;

                const newPlugin = {
                    id: `custom-${Date.now()}`,
                    name: name,
                    version: '1.0.0',
                    author: author,
                    category: 'filter',
                    description: desc,
                    previewColor: color,
                    cssFilter: filterStr,
                    params: [
                        { id: 'intensity', label: 'Intensitet', type: 'slider', min: 0, max: 2, step: 0.1, default: 1.0 }
                    ]
                };

                if (window.novaCut && typeof window.novaCut.savePlugin === 'function') {
                    await window.novaCut.savePlugin(newPlugin);
                }

                this.plugins.unshift(newPlugin);
                this.renderMarketplace();
                this.renderEffectsTab();

                modal.classList.remove('active');
            });
        }
    }
}

window.NovaCutMarketplace = NovaCutMarketplace;

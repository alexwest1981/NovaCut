/**
 * NovaCut - Video Transitions & Visual FX Engine (Sprint 10)
 * CapCut-style transitions, drag-and-drop, and live procedural shaders/effects.
 */
class NovaCutTransitions {
    constructor(engine, timeline) {
        this.engine = engine;
        this.timeline = timeline;

        this.gridEl = document.getElementById('transitionsGrid');
        this.selectedTransitionId = 'dissolve';
        this.draggedTransitionId = null;

        this.library = [
            // 1. Mjuka & Toningar (soft - 8 st)
            { id: 'dissolve', name: 'Cross Dissolve', category: 'soft', icon: '⧗', description: 'Klassisk mjuk övertoning mellan klipp.', defaultDuration: 0.5 },
            { id: 'dip_black', name: 'Dip to Black', category: 'soft', icon: '🌑', description: 'Dämpar mjukt till svart och tonar upp.', defaultDuration: 0.6 },
            { id: 'dip_white', name: 'Vit Blixt / Flash', category: 'soft', icon: '⚡', description: 'Intensiv vit ljusblixt för snabba beats.', defaultDuration: 0.35 },
            { id: 'dip_color', name: 'Amber Dip', category: 'soft', icon: '🌅', description: 'Varm bärnstenstoning mellan scener.', defaultDuration: 0.5 },
            { id: 'blur_fade', name: 'Gaussian Blur Fade', category: 'soft', icon: '🌫️', description: 'Mjuk upptoning via optisk linsoskärpa.', defaultDuration: 0.55 },
            { id: 'fade_sepia', name: 'Vintage Sepia Fade', category: 'soft', icon: '📜', description: 'Nostalgisk tonad övergång.', defaultDuration: 0.5 },
            { id: 'soft_glow', name: 'Dreamy Glow Fade', category: 'soft', icon: '✨', description: 'Drömsk glödande övertoning.', defaultDuration: 0.6 },
            { id: 'lens_blur', name: 'Bokeh Focus Pull', category: 'soft', icon: '🔮', description: 'Kamerans fokus dras ur och in igen.', defaultDuration: 0.5 },

            // 2. Rörelse & Svep (motion - 10 st)
            { id: 'slide_left', name: 'Svep Vänster', category: 'motion', icon: '👈', description: 'Glider in från höger mot vänster.', defaultDuration: 0.45 },
            { id: 'slide_right', name: 'Svep Höger', category: 'motion', icon: '👉', description: 'Glider in från vänster mot höger.', defaultDuration: 0.45 },
            { id: 'slide_up', name: 'Svep Uppåt', category: 'motion', icon: '👆', description: 'Glider in underifrån och uppåt.', defaultDuration: 0.45 },
            { id: 'slide_down', name: 'Svep Nedåt', category: 'motion', icon: '👇', description: 'Glider in uppifrån och nedåt.', defaultDuration: 0.45 },
            { id: 'whip_left', name: 'Whip Pan Vänster', category: 'motion', icon: '💨', description: 'Blixtsnabbt kamerasvep med fartkänsla.', defaultDuration: 0.35 },
            { id: 'whip_right', name: 'Whip Pan Höger', category: 'motion', icon: '🌪️', description: 'Snabbt kamerasvep åt höger.', defaultDuration: 0.35 },
            { id: 'whip_up', name: 'Whip Pan Upp', category: 'motion', icon: '🚀', description: 'Vertikal whip pan uppåt.', defaultDuration: 0.35 },
            { id: 'whip_down', name: 'Whip Pan Ner', category: 'motion', icon: '⚡', description: 'Vertikal whip pan nedåt.', defaultDuration: 0.35 },
            { id: 'smooth_push_left', name: 'Push Vänster', category: 'motion', icon: '◀️', description: 'Mjuk elastisk knuff åt vänster.', defaultDuration: 0.5 },
            { id: 'smooth_push_right', name: 'Push Höger', category: 'motion', icon: '▶️', description: 'Mjuk elastisk knuff åt höger.', defaultDuration: 0.5 },

            // 3. Zoom & Skala (zoom - 8 st)
            { id: 'zoom_in', name: 'Super Zoom In', category: 'zoom', icon: '🔍', description: 'Suger in blicken med dynamisk inzoomning.', defaultDuration: 0.5 },
            { id: 'zoom_out', name: 'Filmisk Zoom Ut', category: 'zoom', icon: '🔎', description: 'Filmisk utzoomning för scenövergångar.', defaultDuration: 0.5 },
            { id: 'spin_zoom_cw', name: 'Virvel Medsols', category: 'zoom', icon: '🔄', description: '360° virvelzoom medurs.', defaultDuration: 0.55 },
            { id: 'spin_zoom_ccw', name: 'Virvel Motsols', category: 'zoom', icon: '🔃', description: '360° virvelzoom moturs.', defaultDuration: 0.55 },
            { id: 'bounce_zoom', name: 'Bounce Zoom', category: 'zoom', icon: '🏀', description: 'Dynamisk studsande zoom.', defaultDuration: 0.45 },
            { id: 'elastic_zoom', name: 'Snap Zoom / Beat', category: 'zoom', icon: '🎯', description: 'Snabb beat-zoom som snappar till.', defaultDuration: 0.3 },
            { id: 'swirl_zoom', name: 'Vortex Swirl', category: 'zoom', icon: '🌀', description: 'Vridande centrifugal vortex.', defaultDuration: 0.5 },
            { id: 'cross_zoom', name: 'Dubbel Korszoom', category: 'zoom', icon: '✖️', description: 'Övergående optisk korszoom.', defaultDuration: 0.45 },

            // 4. Glitch & Cyber (glitch - 8 st)
            { id: 'glitch', name: 'Cyber Glitch', category: 'glitch', icon: '👾', description: 'Digital glitch, RGB-skifte och bildhopp.', defaultDuration: 0.4 },
            { id: 'rgb_split_trans', name: 'RGB Chromatic Shift', category: 'glitch', icon: '🌈', description: 'Separerade färgkanaler vid klippet.', defaultDuration: 0.35 },
            { id: 'scanline_glitch', name: 'CRT Katodstråle', category: 'glitch', icon: '📺', description: 'Analog TV-linjerullning och brus.', defaultDuration: 0.4 },
            { id: 'pixelate_trans', name: '8-Bit Mosaik', category: 'glitch', icon: '🧱', description: 'Pixelering som löser upp bildrutan.', defaultDuration: 0.45 },
            { id: 'tv_noise', name: 'TV Static Burst', category: 'glitch', icon: '📻', description: 'Snabb snö- och brusblixt mellan klipp.', defaultDuration: 0.3 },
            { id: 'vcr_distortion', name: 'VCR Bandsträckning', category: 'glitch', icon: '📼', description: 'Analog bandskada och skevning.', defaultDuration: 0.45 },
            { id: 'datamosh', name: 'Datamosh Tear', category: 'glitch', icon: '💽', description: 'Komprimeringsglitch med rörelseartefakt.', defaultDuration: 0.4 },
            { id: 'cyber_matrix', name: 'Matrix Drop', category: 'glitch', icon: '🟩', description: 'Digital kodpuls mellan scener.', defaultDuration: 0.35 },

            // 5. Ljus & Blixtar (light - 8 st)
            { id: 'light_leak_warm', name: 'Gyllene Ljusläcka', category: 'light', icon: '☀️', description: 'Varm analog ljusslöja.', defaultDuration: 0.5 },
            { id: 'light_leak_cool', name: 'Cyan Sci-Fi Ljus', category: 'light', icon: '💎', description: 'Kall futuristisk ljusläcka.', defaultDuration: 0.5 },
            { id: 'film_burn', name: '16mm Film Burn', category: 'light', icon: '🔥', description: 'Brinnande celluloid och rödorange ljus.', defaultDuration: 0.45 },
            { id: 'anamorphic_flare', name: 'Anamorphic Streak', category: 'light', icon: '🔦', description: 'Horisontell blå Hollywood-linsflare.', defaultDuration: 0.4 },
            { id: 'sun_burst', name: 'Solblixt / Burst', category: 'light', icon: '🔆', description: 'Intensiv strålande solreflex.', defaultDuration: 0.4 },
            { id: 'glow_flash', name: 'Hyper Glow Flash', category: 'light', icon: '💥', description: 'Överexponerat mjukt glödande vitt ljus.', defaultDuration: 0.35 },
            { id: 'strobe_flash', name: 'Strobe Beat Flash', category: 'light', icon: '⚡', description: 'Snabba rytmiska ljuspulser.', defaultDuration: 0.3 },
            { id: 'neon_pulse', name: 'Neon Ljuspuls', category: 'light', icon: '🟣', description: 'Elektrisk magenta & violett lyster.', defaultDuration: 0.4 },

            // 6. Formklipp & Wipes (wipe - 8 st)
            { id: 'wipe_left', name: 'Wipe Vänster', category: 'wipe', icon: '⬅️', description: 'Linjär överstrykning åt vänster.', defaultDuration: 0.5 },
            { id: 'wipe_right', name: 'Wipe Höger', category: 'wipe', icon: '➡️', description: 'Linjär överstrykning åt höger.', defaultDuration: 0.5 },
            { id: 'wipe_up', name: 'Wipe Uppåt', category: 'wipe', icon: '⬆️', description: 'Vertikal överstrykning uppåt.', defaultDuration: 0.5 },
            { id: 'wipe_down', name: 'Wipe Nedåt', category: 'wipe', icon: '⬇️', description: 'Vertikal överstrykning nedåt.', defaultDuration: 0.5 },
            { id: 'circle_wipe_in', name: 'Iris Cirkel In', category: 'wipe', icon: '🔘', description: 'Klassisk cirkel som öppnar nästa scen.', defaultDuration: 0.55 },
            { id: 'circle_wipe_out', name: 'Iris Cirkel Ut', category: 'wipe', icon: '⭕', description: 'Cirkel som sluter sig mot centrum.', defaultDuration: 0.55 },
            { id: 'diamond_wipe', name: 'Diamant Wipe', category: 'wipe', icon: '🔶', description: 'Rombruta som expanderar från mitten.', defaultDuration: 0.5 },
            { id: 'split_doors', name: 'Skjutdörrar / Split', category: 'wipe', icon: '🚪', description: 'Bilden öppnas på mitten som hissdörrar.', defaultDuration: 0.55 }
        ];

        this.init();
    }

    init() {
        this.renderGrid('all');
        this.setupEventListeners();
        this.setupLiveFxCards();
    }

    renderGrid(category = 'all') {
        if (!this.gridEl) return;
        this.gridEl.innerHTML = '';

        const filtered = category === 'all'
            ? this.library
            : this.library.filter(t => t.category === category);

        filtered.forEach(trans => {
            const card = document.createElement('div');
            card.className = `transition-card ${trans.id === this.selectedTransitionId ? 'active' : ''}`;
            card.setAttribute('data-id', trans.id);
            card.setAttribute('draggable', 'true');
            card.title = `Dra till tidslinjen eller klicka för att välja "${trans.name}"`;

            card.innerHTML = `
                <div class="card-icon">${trans.icon}</div>
                <div class="card-title">${trans.name}</div>
                <div class="card-desc">${trans.description}</div>
            `;

            card.addEventListener('click', () => {
                this.selectTransition(trans.id);
            });

            // Drag and drop onto timeline
            card.addEventListener('dragstart', (e) => {
                this.draggedTransitionId = trans.id;
                e.dataTransfer.setData('text/plain', trans.id);
                e.dataTransfer.setData('novacut/transition', trans.id);
                e.dataTransfer.effectAllowed = 'copy';
            });

            card.addEventListener('dragend', () => {
                this.draggedTransitionId = null;
            });

            this.gridEl.appendChild(card);
        });
    }

    selectTransition(transId) {
        this.selectedTransitionId = transId;
        if (this.gridEl) {
            this.gridEl.querySelectorAll('.transition-card').forEach(c => {
                c.classList.toggle('active', c.getAttribute('data-id') === transId);
            });
        }
    }

    setupEventListeners() {
        // Category Chips
        const chips = document.querySelectorAll('.transition-chip');
        chips.forEach(chip => {
            chip.addEventListener('click', () => {
                chips.forEach(c => c.classList.remove('active'));
                chip.classList.add('active');
                const cat = chip.getAttribute('data-cat') || 'all';
                this.renderGrid(cat);
            });
        });

        // Apply to Selected Clip Button
        const btnSelected = document.getElementById('btnApplyTransitionSelected');
        if (btnSelected) {
            btnSelected.addEventListener('click', () => {
                const selId = this.timeline?.selectedClipId;
                if (!selId) {
                    if (window.novaCutToast) {
                        window.novaCutToast('⚠️ Markera ett videoklipp i tidslinjen först');
                    } else {
                        alert('Markera ett videoklipp i tidslinjen först');
                    }
                    return;
                }
                const clip = this.timeline.clips.find(c => c.id === selId);
                if (clip) {
                    this.applyTransitionToClip(clip, this.selectedTransitionId, null, 'both');
                    const transObj = this.library.find(t => t.id === this.selectedTransitionId);
                    if (window.novaCutToast) {
                        window.novaCutToast(`✨ "${transObj?.name || 'Övergång'}" tillagd på "${clip.title}"!`);
                    }
                }
            });
        }

        // Apply to ALL Clips Button
        const btnAll = document.getElementById('btnApplyTransitionAll');
        if (btnAll) {
            btnAll.addEventListener('click', () => {
                this.applyTransitionToAllClips(this.selectedTransitionId);
            });
        }
    }

    setupLiveFxCards() {
        const liveFxCards = document.querySelectorAll('.live-fx-card');
        liveFxCards.forEach(card => {
            card.addEventListener('click', () => {
                const fxType = card.getAttribute('data-fx');
                this.addLiveFxToTimeline(fxType);
            });
        });
    }

    addLiveFxToTimeline(fxType) {
        if (!this.timeline) return;

        const playheadTime = this.engine ? this.engine.currentTime : 0;
        let title = 'Effekt';
        let overlayType = fxType;
        let cssFilter = 'none';
        let params = { intensity: 1.0, speed: 1.0 };

        const fxPresets = {
            'vhs-retro': { title: "📼 VHS Retro '95", filter: 'contrast(115%) saturate(125%)' },
            'vhs-damage': { title: '📺 VCR Tracking & Brus', filter: 'contrast(120%) hue-rotate(10deg)' },
            'camera-shake': { title: '📳 Kamera Skak', filter: 'none' },
            'beat-shake': { title: '🥁 Beat-Skak & Bas', filter: 'contrast(110%)' },
            'rgb-split': { title: '👾 RGB Split', filter: 'hue-rotate(15deg) contrast(110%)' },
            'film-grain': { title: '🎞️ 35mm Filmkorn', filter: 'sepia(12%) contrast(108%)' },
            'dust-scratches': { title: '📽️ 16mm Filmdamm & Repor', filter: 'sepia(20%)' },
            'bokeh': { title: '✨ Gyllene Bokeh', filter: 'none' },
            'rain': { title: '🌧️ Filmiskt Regn', filter: 'none' },
            'snow': { title: '❄️ Mjukt Snöfall', filter: 'none' },
            'vignette': { title: '🌑 Filmisk Vinjett', filter: 'contrast(105%)' },
            'vignette-warm': { title: '🌅 Varm Vintage Vinjett', filter: 'sepia(25%) contrast(110%)' },
            'light-leaks': { title: '💡 Ljusläckor', filter: 'contrast(105%)' },
            'anamorphic-flare': { title: '🔦 Anamorphic Flare', filter: 'contrast(115%)' },
            'prism-rainbow': { title: '🌈 Prismatisk Regnbåge', filter: 'saturate(120%)' },
            'laser-grid': { title: '🌐 Synthwave Grid', filter: 'contrast(120%)' },
            'crt-monitor': { title: '🖥️ CRT Monitor', filter: 'contrast(115%) brightness(105%)' },
            'halftone-dots': { title: '📰 Pop Art Halftone', filter: 'contrast(130%)' },
            'fog-mist': { title: '🌫️ Morgondimma & Rök', filter: 'none' },
            'fire-embers': { title: '🔥 Glödande Gnistor', filter: 'contrast(115%) saturate(120%)' },
            'night-vision': { title: '🟢 Night Vision', filter: 'hue-rotate(90deg) saturate(180%) contrast(140%)' },
            'thermal-vision': { title: '🌡️ Termisk Kamera', filter: 'invert(100%) hue-rotate(180deg) saturate(200%)' },
            'matrix-rain': { title: '🟩 Matrix Kodkaskad', filter: 'contrast(130%) hue-rotate(80deg)' },
            'underwater': { title: '🌊 Undervattens-Krusningar', filter: 'hue-rotate(180deg) saturate(130%)' },
            'strobe-party': { title: '⚡ Rave Strobe & Pulse', filter: 'contrast(130%)' }
        };

        if (fxPresets[fxType]) {
            title = fxPresets[fxType].title;
            cssFilter = fxPresets[fxType].filter;
        }

        const newClip = this.timeline.addClip({
            trackId: 'effect',
            title: title,
            type: 'effect',
            startTime: playheadTime,
            duration: 4.0,
            overlayType: overlayType,
            cssFilter: cssFilter,
            params: params
        });

        if (this.engine) this.engine.render();

        if (window.novaCutToast) {
            window.novaCutToast(`🪄 "${title}" tillagd på tidslinjen vid ${playheadTime.toFixed(1)}s!`);
        }
    }

    applyTransitionToClip(clip, transId, duration = null, direction = 'both') {
        const transDef = this.library.find(t => t.id === transId);
        if (!transDef) return;

        const dur = duration !== null ? duration : transDef.defaultDuration;

        if (direction === 'in' || direction === 'both') {
            clip.transitionIn = {
                type: transId,
                name: transDef.name,
                duration: dur
            };
        }

        if (direction === 'out' || direction === 'both') {
            clip.transitionOut = {
                type: transId,
                name: transDef.name,
                duration: dur
            };
        }

        // Re-render DOM and frame
        if (this.timeline) {
            this.timeline.renderClipDOM(clip);
            if (this.timeline.selectedClipId === clip.id && window.inspector) {
                window.inspector.render(clip);
            }
        }
        if (this.engine) {
            this.engine.render();
        }
    }

    applyTransitionToAllClips(transId) {
        if (!this.timeline || !this.timeline.clips) return;

        const transDef = this.library.find(t => t.id === transId);
        if (!transDef) return;

        const targetClips = this.timeline.clips.filter(c => c.trackId === 'video' || c.trackId === 'overlay');
        if (targetClips.length === 0) {
            if (window.novaCutToast) {
                window.novaCutToast('⚠️ Inga videoklipp på tidslinjen');
            }
            return;
        }

        targetClips.forEach(clip => {
            clip.transitionIn = {
                type: transId,
                name: transDef.name,
                duration: transDef.defaultDuration
            };
            clip.transitionOut = {
                type: transId,
                name: transDef.name,
                duration: transDef.defaultDuration
            };
            this.timeline.renderClipDOM(clip);
        });

        if (window.inspector && this.timeline.selectedClipId) {
            const sel = this.timeline.clips.find(c => c.id === this.timeline.selectedClipId);
            if (sel) window.inspector.render(sel);
        }

        if (this.engine) this.engine.render();

        if (window.novaCutToast) {
            window.novaCutToast(`⚡ "${transDef.name}" tillämpad på alla ${targetClips.length} klipp!`);
        }
    }
}

window.NovaCutTransitions = NovaCutTransitions;

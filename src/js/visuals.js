/**
 * NovaCut - AI Visuals & Real-Audio-Reactive Music Video Engine
 * Zero-config AI Image Generation & Real-Audio Spectrum Visualizers (Trap Nation, Equalizer, Lasers & Customizer)
 */
class NovaCutVisuals {
    constructor(timeline, engine) {
        this.timeline = timeline;
        this.engine = engine;

        this.selectedRatio = '16:9';
        this.selectedMotion = 'ken-burns';
        this.isGenerating = false;
        this.history = [];

        this.stylePresets = [
            {
                id: 'synthwave',
                name: '🌌 Synthwave Neon',
                prompt: 'Retro 80s synthwave neon grid sunset, glowing magenta lasers, chrome mountains, dark night sky, music video aesthetics, 4k resolution',
                gradient: 'linear-gradient(135deg, #ec4899, #8b5cf6, #3b82f6)'
            },
            {
                id: 'lofi',
                name: '🎧 Lo-Fi Chill Anime',
                prompt: 'Cozy anime bedroom aesthetic, gentle rain on window, lo-fi warm lamp lighting, vinyl player, peaceful night, Makoto Shinkai style, cinematic anime wallpaper',
                gradient: 'linear-gradient(135deg, #d97706, #b45309, #451a03)'
            },
            {
                id: 'techno',
                name: '⚡ Dark Techno Rave',
                prompt: 'Dark underground industrial warehouse rave, strobe lasers, volumetric smoke, cyberpunk DJ stage, high contrast strobe lighting, dark techno aesthetics',
                gradient: 'linear-gradient(135deg, #18181b, #27272a, #00d482)'
            },
            {
                id: 'space',
                name: '🛸 Deep Space Nebula',
                prompt: 'Cinematic cosmic nebula, sparkling stars, vibrant violet and cyan galaxies, glowing interstellar dust, 4k ultra hd space visualizer wallpaper',
                gradient: 'linear-gradient(135deg, #3b82f6, #6366f1, #a855f7)'
            },
            {
                id: 'psychedelic',
                name: '🌀 Psychedelic Fractal',
                prompt: 'Hypnotic kaleidoscope sacred geometry, glowing iridescent mandalas, psychedelic fractal tunnel, vibrant neon colors, Alex Grey visionary art style',
                gradient: 'linear-gradient(135deg, #10b981, #06b6d4, #f43f5e)'
            },
            {
                id: 'tokyo',
                name: '🏙️ Tokyo Neon Rain',
                prompt: 'Cinematic Tokyo street at night in rain, glowing neon signs, wet asphalt reflections, moody cyberpunk atmosphere, cinematic bokeh, 4k',
                gradient: 'linear-gradient(135deg, #0284c7, #0f172a, #ec4899)'
            }
        ];

        this.reactivePresets = [
            {
                id: 'trap-nation',
                name: '💥 Trap Nation Classic Ring',
                desc: 'Reell basreaktiv ring med partikelexplosioner och 64 spektrumtaggar',
                pattern: 'reactive-circle',
                icon: '💥',
                color1: '#00d482',
                color2: '#38bdf8'
            },
            {
                id: 'equalizer-neon',
                name: '📊 Neon City Spektrumstaplar',
                desc: '64 frekvensstaplar från djupaste bas till diskant med svävande toppmärken',
                pattern: 'reactive-equalizer',
                icon: '📊',
                color1: '#f43f5e',
                color2: '#00d482'
            },
            {
                id: 'mirrored-spectrum',
                name: '〰️ Dubbelsidigt Stereo-Spektrum',
                desc: 'Modern Soundcloud/YouTube-stil med speglade staplar från mitten',
                pattern: 'reactive-mirrored',
                icon: '〰️',
                color1: '#8b5cf6',
                color2: '#ec4899'
            },
            {
                id: 'oscilloscope-laser',
                name: '⚡ Oscilloscope Ljudvåg',
                desc: 'Elektrisk neon-laserlinje som ritar ut musiken i realtid',
                pattern: 'reactive-waveform',
                icon: '⚡',
                color1: '#00f2fe',
                color2: '#4facfe'
            },
            {
                id: 'portal-tunnel',
                name: '🌀 Kosmisk Hypnotunnel',
                desc: 'Koncentriska månghörningar som expanderar och roterar i takt med energin',
                pattern: 'reactive-portal',
                icon: '🌀',
                color1: '#a855f7',
                color2: '#06b6d4'
            },
            {
                id: 'outrun-synthwave',
                name: '🌆 Outrun 80s Väg & Sol',
                desc: '3D-perspektiv rutnät och glödande neonsol som pumpar till basen',
                pattern: 'reactive-synthwave',
                icon: '🌆',
                color1: '#f59e0b',
                color2: '#ec4899'
            },
            {
                id: 'vinyl-turntable',
                name: '💿 Lo-Fi Vinylspelare',
                desc: 'Snurrande vinylskiva med pulserande ljudspår och studsande tonarm',
                pattern: 'reactive-vinyl',
                icon: '💿',
                color1: '#d97706',
                color2: '#18181b'
            },
            {
                id: 'galaxy-stars',
                name: '🌌 Galax Stjärnfält 3D',
                desc: 'Stjärnor i 3D-rymd som skjuter framåt i överljudsfart vid basdrop',
                pattern: 'reactive-stars',
                icon: '🌌',
                color1: '#ffffff',
                color2: '#38bdf8'
            },
            {
                id: 'heartbeat-ekg',
                name: '💓 EKG / Pulsmonitor',
                desc: 'Medicinsk hjärtkurva som reagerar och skjuter spikar på bastrumman',
                pattern: 'reactive-heartbeat',
                icon: '💓',
                color1: '#ef4444',
                color2: '#fecaca'
            },
            {
                id: 'fire-reactive',
                name: '🔥 Ljudreaktiva Flammor',
                desc: 'Glödande eldtungor som dansar och flammar upp till låtens energi',
                pattern: 'reactive-fire',
                icon: '🔥',
                color1: '#ea580c',
                color2: '#fef08a'
            },
            {
                id: 'matrix-code',
                name: '🟩 Matrix Digitalt Regn',
                desc: 'Gröna kodtecken som forsar nedåt och blixtrar vid tunga beats',
                pattern: 'reactive-matrix',
                icon: '🟩',
                color1: '#22c55e',
                color2: '#14532d'
            },
            {
                id: 'bass-strobe',
                name: '⚡ Bass Drop Strobe Flash',
                desc: 'Klubbblixtar och pulserande kantvinjett som triggas på bastrumman',
                pattern: 'reactive-bass-flash',
                icon: '⚡',
                color1: '#ffffff',
                color2: '#ff0055'
            },
            {
                id: 'circular-liquid',
                name: '🌊 Flytande Vattenring',
                desc: 'Organisk flytande vätskedropp-ring som vågar till harmonierna',
                pattern: 'reactive-circular-wave',
                icon: '🌊',
                color1: '#0284c7',
                color2: '#38bdf8'
            },
            {
                id: 'dual-trap-rings',
                name: '⭕ Dubbla Trap Rings',
                desc: 'Två kontraroterande spektrumhjul med överlappande frekvensspikar',
                pattern: 'reactive-dual-rings',
                icon: '⭕',
                color1: '#ec4899',
                color2: '#8b5cf6'
            },
            {
                id: 'led-dot-matrix',
                name: '🟢 LED Dot Matrix Spektrum',
                desc: 'Retrostil med diskreta lysdioder som hoppar i 40 kolumner',
                pattern: 'reactive-frequency-dots',
                icon: '🟢',
                color1: '#10b981',
                color2: '#f59e0b'
            },
            {
                id: 'cyber-wireframe',
                name: '🧊 Wireframe Hexagon Tunnel',
                desc: 'Futuristisk cyber-tunnel med pulserande neon-grid',
                pattern: 'reactive-cyber-tunnel',
                icon: '🧊',
                color1: '#06b6d4',
                color2: '#f43f5e'
            }
        ];

        this.init();
    }

    init() {
        this.setupUI();
    }

    setupUI() {
        const promptInput = document.getElementById('aiVisualPrompt');
        const btnGenerate = document.getElementById('btnGenerateAiVisual');
        const chipsContainer = document.getElementById('aiStyleChips');
        const ratioChips = document.querySelectorAll('.ai-ratio-chip');
        const motionSelect = document.getElementById('aiMotionSelect');
        const reactiveContainer = document.getElementById('reactiveVisualsList');

        // Setup Style Prompt Chips
        if (chipsContainer) {
            chipsContainer.innerHTML = '';
            this.stylePresets.forEach((p, idx) => {
                const chip = document.createElement('button');
                chip.className = `ai-style-chip ${idx === 0 ? 'active' : ''}`;
                chip.textContent = p.name;
                chip.addEventListener('click', () => {
                    document.querySelectorAll('.ai-style-chip').forEach(c => c.classList.remove('active'));
                    chip.classList.add('active');
                    if (promptInput) promptInput.value = p.prompt;
                });
                chipsContainer.appendChild(chip);
            });
            if (promptInput && !promptInput.value) {
                promptInput.value = this.stylePresets[0].prompt;
            }
        }

        // Setup Ratio Chips
        ratioChips.forEach(chip => {
            chip.addEventListener('click', () => {
                ratioChips.forEach(c => c.classList.remove('active'));
                chip.classList.add('active');
                this.selectedRatio = chip.dataset.ratio || '16:9';
            });
        });

        // Setup Motion Select
        if (motionSelect) {
            motionSelect.addEventListener('change', (e) => {
                this.selectedMotion = e.target.value;
            });
        }

        // Setup Generate Button
        if (btnGenerate) {
            btnGenerate.addEventListener('click', () => {
                const prompt = promptInput ? promptInput.value.trim() : '';
                if (!prompt) {
                    alert('Ange en prompt för att generera musikvideo-visuals.');
                    return;
                }
                this.generateAiVisual(prompt);
            });
        }

        // Setup Audio-Reactive Visualizers List
        if (reactiveContainer) {
            reactiveContainer.innerHTML = '';

            // Visualizer Customizer Card
            const builderCard = document.createElement('div');
            builderCard.className = 'visualizer-builder-card';
            builderCard.style.background = 'linear-gradient(135deg, rgba(20, 25, 45, 0.85), rgba(10, 15, 30, 0.95))';
            builderCard.style.border = '1px solid rgba(56, 189, 248, 0.35)';
            builderCard.style.borderRadius = '8px';
            builderCard.style.padding = '12px';
            builderCard.style.marginBottom = '12px';

            builderCard.innerHTML = `
                <div style="font-size: 12px; font-weight: 800; color: #38bdf8; display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
                    <span>🛠️ Skapa Egen Visualizer (Customizer)</span>
                    <span style="font-size: 9px; background: rgba(56, 189, 248, 0.2); color: #38bdf8; padding: 2px 6px; border-radius: 4px;">Live FFT</span>
                </div>
                <div style="display: flex; flex-direction: column; gap: 8px; font-size: 11px;">
                    <div>
                        <label style="color: var(--text-muted); display: block; margin-bottom: 2px;">Välj Visualizer-stil</label>
                        <select id="customVizPattern" class="select-compact" style="width: 100%; padding: 5px;">
                            <option value="reactive-circle" selected>💥 Trap Nation Basring</option>
                            <option value="reactive-equalizer">📊 Frekvensstaplar (Equalizer)</option>
                            <option value="reactive-mirrored">〰️ Dubbelsidigt Stereospektrum</option>
                            <option value="reactive-waveform">⚡ Oscilloscope Laserlinje</option>
                            <option value="reactive-portal">🌀 Hypnotisk Kosmisk Tunnel</option>
                            <option value="reactive-stars">🌌 3D Galax Stjärnfält</option>
                            <option value="reactive-vinyl">💿 Snurrande Lo-Fi Vinylskiva</option>
                            <option value="reactive-heartbeat">💓 EKG / Pulskurva</option>
                            <option value="reactive-fire">🔥 Dansande Ljudflammor</option>
                            <option value="reactive-matrix">🟩 Matrix Digitalt Kodregn</option>
                            <option value="reactive-circular-wave">🌊 Flytande Vattenring</option>
                            <option value="reactive-dual-rings">⭕ Dubbla Kontraroterande Ringar</option>
                        </select>
                    </div>
                    <div style="display: flex; gap: 8px;">
                        <div style="flex: 1;">
                            <label style="color: var(--text-muted); display: block; margin-bottom: 2px;">Primärfärg</label>
                            <input type="color" id="customVizColor1" value="#00d482" style="width: 100%; height: 28px; border: none; border-radius: 4px; cursor: pointer; background: transparent;">
                        </div>
                        <div style="flex: 1;">
                            <label style="color: var(--text-muted); display: block; margin-bottom: 2px;">Sekundärfärg</label>
                            <input type="color" id="customVizColor2" value="#38bdf8" style="width: 100%; height: 28px; border: none; border-radius: 4px; cursor: pointer; background: transparent;">
                        </div>
                    </div>
                    <div style="display: flex; gap: 8px;">
                        <div style="flex: 1;">
                            <label style="color: var(--text-muted); display: block; margin-bottom: 2px;">Bas & Boost</label>
                            <select id="customVizSensitivity" class="select-compact" style="width: 100%; padding: 4px;">
                                <option value="0.8">Subtil (0.8x)</option>
                                <option value="1.2" selected>Normal (1.2x)</option>
                                <option value="1.8">Tung Bas (1.8x)</option>
                                <option value="2.5">Extrem Drop (2.5x)</option>
                            </select>
                        </div>
                        <div style="flex: 1;">
                            <label style="color: var(--text-muted); display: block; margin-bottom: 2px;">Stapelantal</label>
                            <select id="customVizBars" class="select-compact" style="width: 100%; padding: 4px;">
                                <option value="32">32 staplar</option>
                                <option value="64" selected>64 staplar</option>
                                <option value="128">128 staplar (Hög DPI)</option>
                            </select>
                        </div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 6px; margin-top: 2px;">
                        <input type="checkbox" id="customVizTrans" checked style="cursor: pointer;">
                        <label for="customVizTrans" style="color: #cbd5e1; cursor: pointer;">Transparent bakgrund (läggs över bild/video)</label>
                    </div>
                    <button id="btnCreateCustomViz" class="btn-primary" style="margin-top: 6px; width: 100%; justify-content: center; padding: 7px; font-weight: 700;">
                        <span>${ncIcon('sparkles')} Skapa & Lägg till på Tidslinjen</span>
                    </button>
                </div>
            `;

            builderCard.querySelector('#btnCreateCustomViz').addEventListener('click', () => {
                const pattern = builderCard.querySelector('#customVizPattern').value;
                const color1 = builderCard.querySelector('#customVizColor1').value;
                const color2 = builderCard.querySelector('#customVizColor2').value;
                const sensitivity = parseFloat(builderCard.querySelector('#customVizSensitivity').value) || 1.2;
                const numBars = parseInt(builderCard.querySelector('#customVizBars').value) || 64;
                const transparentBg = builderCard.querySelector('#customVizTrans').checked;

                const nameText = builderCard.querySelector('#customVizPattern').selectedOptions[0].textContent;

                this.addReactiveVisualizer({
                    name: `Custom: ${nameText}`,
                    pattern: pattern,
                    color1: color1,
                    color2: color2,
                    sensitivity: sensitivity,
                    numBars: numBars,
                    transparentBg: transparentBg
                });
            });

            reactiveContainer.appendChild(builderCard);

            // Pre-made Visualizers List
            this.reactivePresets.forEach(preset => {
                const card = document.createElement('div');
                card.className = 'plugin-card';
                card.style.display = 'flex';
                card.style.alignItems = 'center';
                card.style.justifyContent = 'space-between';
                card.style.padding = '10px 12px';
                card.style.gap = '10px';
                card.style.marginBottom = '6px';

                card.innerHTML = `
                    <div style="display: flex; align-items: center; gap: 10px; overflow: hidden;">
                        <span style="font-size: 22px; flex-shrink: 0;">${preset.icon}</span>
                        <div style="overflow: hidden;">
                            <div style="font-weight: 700; font-size: 11px; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${preset.name}</div>
                            <div style="font-size: 10px; color: var(--text-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                                ${preset.desc}
                            </div>
                        </div>
                    </div>
                    <button class="btn-primary btn-sm" style="padding: 4px 8px; font-size: 10px; flex-shrink: 0;">
                        + Använd
                    </button>
                `;

                card.querySelector('button').addEventListener('click', () => {
                    this.addReactiveVisualizer(preset);
                });

                reactiveContainer.appendChild(card);
            });
        }
    }

    async generateAiVisual(prompt) {
        if (this.isGenerating) return;
        this.isGenerating = true;

        const btn = document.getElementById('btnGenerateAiVisual');
        const origHtml = btn ? btn.innerHTML : '';
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<span>⏳ Genererar AI Visual (1-2s)...</span>';
        }

        let w = 1280;
        let h = 720;
        if (this.selectedRatio === '9:16') {
            w = 720;
            h = 1280;
        } else if (this.selectedRatio === '1:1') {
            w = 1080;
            h = 1080;
        }

        try {
            let result = null;
            if (window.novaCut && typeof window.novaCut.generateAiImage === 'function') {
                result = await window.novaCut.generateAiImage({
                    prompt: prompt,
                    width: w,
                    height: h,
                    seed: Math.floor(Math.random() * 1000000)
                });
            } else {
                throw new Error('IPC handler för AI bildgenerering ej tillgänglig');
            }

            if (!result || !result.success || !result.filePath) {
                throw new Error(result?.error || 'Kunde inte hämta genererad bild.');
            }

            await this.placeAiVisualOnTimeline(result.filePath, prompt);

            if (window.projectManager && typeof window.projectManager.showToast === 'function') {
                window.projectManager.showToast(` AI Visual för "${prompt.slice(0, 20)}..." placerad på tidslinjen!`);
            }
        } catch (err) {
            console.error('[NovaCut Visuals] Error:', err);
            alert(`Kunde inte generera AI-bild: ${err.message}`);
        } finally {
            this.isGenerating = false;
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = origHtml;
            }
        }
    }

    async placeAiVisualOnTimeline(filePath, prompt) {
        const mediaId = `ai-img-${Date.now()}`;
        const img = new Image();
        img.src = filePath;

        await new Promise((resolve) => {
            img.onload = resolve;
            img.onerror = resolve;
        });

        if (this.engine && this.engine.mediaElements) {
            this.engine.mediaElements.set(mediaId, img);
        }

        const duration = 8.0;
        const startTime = this.engine.currentTime;

        const clip = {
            mediaId: mediaId,
            filePath: filePath,
            mediaName: `AI: ${prompt.slice(0, 20)}`,
            title: `AI: ${prompt.slice(0, 20)}`,
            type: 'image',
            trackId: 'video',
            startTime: startTime,
            duration: duration,
            scale: 1.0,
            opacity: 1.0,
            isAiVisual: true
        };

        if (typeof window.handleImportedFile === 'function') {
            window.handleImportedFile({
                mediaId: mediaId,
                path: filePath,
                name: `AI: ${prompt.slice(0, 20)}`,
                type: 'image',
                duration: duration
            });
        }

        if (this.selectedMotion === 'ken-burns') {
            clip.keyframes = {
                scale: [
                    { time: 0, value: 1.0 },
                    { time: duration, value: 1.15 }
                ]
            };
        } else if (this.selectedMotion === 'beat-zoom') {
            clip.keyframes = {
                scale: [
                    { time: 0, value: 1.0 },
                    { time: 2.0, value: 1.08 },
                    { time: 4.0, value: 1.0 },
                    { time: 6.0, value: 1.12 },
                    { time: duration, value: 1.0 }
                ]
            };
        }

        this.timeline.addClip(clip);

        if (this.selectedMotion === 'grain') {
            this.timeline.addClip({
                trackId: 'effect',
                title: '35mm Film Grain',
                type: 'effect',
                startTime: startTime,
                duration: duration,
                overlayType: 'film_grain'
            });
        }

        this.timeline.recalculateProjectDuration();
        this.timeline.renderAllClips();
        this.timeline.selectClip(clip.id);
        this.engine.render();
    }

    addReactiveVisualizer(preset) {
        const startTime = this.engine.currentTime;

        // Auto-match duration of timeline audio clip if present
        const audioClip = this.timeline.clips.find(c => c.type === 'audio' || c.trackId === 'audio');
        const duration = (audioClip && audioClip.duration) ? Math.max(8.0, (audioClip.duration - startTime)) : 15.0;

        // Check if there is already a background video/image on the timeline
        const hasExistingMedia = this.timeline.clips.some(c => c.type === 'video' || c.type === 'image' || c.trackId === 'video');

        let targetTrackId = 'overlay';
        const availableOverlay = this.timeline.tracks.find(t => t.id === 'overlay' || (t.type === 'video' && t.id !== 'video'));
        if (availableOverlay) {
            targetTrackId = availableOverlay.id;
        } else if (hasExistingMedia && !this.timeline.tracks.some(t => t.id === 'overlay')) {
            const newTrk = this.timeline.addTrack('video', 'Overlay Visual');
            targetTrackId = newTrk.id;
        } else if (!hasExistingMedia) {
            targetTrackId = this.timeline.tracks.find(t => t.type === 'video')?.id || 'video';
        }

        const clip = {
            title: preset.name,
            type: 'video',
            trackId: targetTrackId,
            startTime: startTime,
            duration: duration,
            demoPattern: preset.pattern,
            transparentBg: preset.transparentBg !== undefined ? preset.transparentBg : true,
            blendMode: 'source-over',
            scale: 1.0,
            opacity: 1.0,
            color1: preset.color1 || '#00d482',
            color2: preset.color2 || '#38bdf8',
            sensitivity: preset.sensitivity || 1.2,
            numBars: preset.numBars || 64
        };

        this.timeline.addClip(clip);
        this.timeline.recalculateProjectDuration();
        this.timeline.renderAllClips();
        this.timeline.selectClip(clip.id);
        this.engine.render();

        if (window.projectManager && typeof window.projectManager.showToast === 'function') {
            window.projectManager.showToast(` Ljudreaktiv visual "${preset.name}" tillagd!`);
        }
    }
}

window.NovaCutVisuals = NovaCutVisuals;

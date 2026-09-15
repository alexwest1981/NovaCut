/**
 * NovaCut - AI Visuals & Audio-Reactive Music Video Engine
 * Zero-config AI Image Generation (Pollinations) & Realtime Audio-Reactive Visualizers
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
                name: '💥 Trap Nation Ring',
                desc: 'Cirkulär spektrumring med pulserande partiklar som exploderar på bastrumman',
                pattern: 'reactive-circle',
                icon: '💥'
            },
            {
                id: 'outrun',
                name: '🌆 Outrun Synthwave Road',
                desc: '3D-perspektiv rutnät och glödande neonberg som studsar till musiken',
                pattern: 'reactive-synthwave',
                icon: '🌆'
            },
            {
                id: 'equalizer',
                name: '📊 Frequency Bars',
                desc: 'Glödande neon-equalizer med flerfärgade spektrumstaplar i 60fps',
                pattern: 'reactive-equalizer',
                icon: '📊'
            },
            {
                id: 'portal',
                name: '🌀 Hypnotic Cosmic Portal',
                desc: 'Roterande hypnotisk tunnel och koncentriska energivågor',
                pattern: 'reactive-portal',
                icon: '🌀'
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
            // Initial value
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
                    alert('Skriv en prompt eller välj en stil ovan först.');
                    return;
                }
                this.generateAiVisual(prompt);
            });
        }

        // Setup Audio-Reactive Visualizers List
        if (reactiveContainer) {
            reactiveContainer.innerHTML = '';
            this.reactivePresets.forEach(preset => {
                const card = document.createElement('div');
                card.className = 'plugin-card';
                card.style.display = 'flex';
                card.style.alignItems = 'center';
                card.style.justifyContent = 'space-between';
                card.style.padding = '10px 14px';
                card.style.gap = '10px';

                card.innerHTML = `
                    <div style="display: flex; align-items: center; gap: 10px; overflow: hidden;">
                        <span style="font-size: 24px;">${preset.icon}</span>
                        <div style="overflow: hidden;">
                            <div style="font-weight: 700; font-size: 12px; color: #fff;">${preset.name}</div>
                            <div style="font-size: 10px; color: var(--text-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                                ${preset.desc}
                            </div>
                        </div>
                    </div>
                    <button class="btn-primary btn-sm" style="padding: 5px 10px; font-size: 11px; flex-shrink: 0;">
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

            // Successfully downloaded image
            await this.placeAiVisualOnTimeline(result.filePath, prompt);

            if (window.projectManager && typeof window.projectManager.showToast === 'function') {
                window.projectManager.showToast(`✨ AI Visual för "${prompt.slice(0, 20)}..." placerad på tidslinjen!`);
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
            title: `AI: ${prompt.slice(0, 20)}`,
            type: 'video',
            trackId: 'video',
            startTime: startTime,
            duration: duration,
            scale: 1.0,
            opacity: 1.0
        };

        // Motion Effects
        if (this.selectedMotion === 'ken-burns') {
            // Smooth slow zoom keyframing
            clip.keyframes = {
                scale: [
                    { time: 0, value: 1.0 },
                    { time: duration, value: 1.15 }
                ]
            };
        } else if (this.selectedMotion === 'beat-zoom') {
            // Dynamic pulse keyframes
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

        // Add 35mm Film grain on effect track if selected
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
        const duration = 10.0;
        const startTime = this.engine.currentTime;

        const clip = {
            title: preset.name,
            type: 'video',
            trackId: 'video',
            startTime: startTime,
            duration: duration,
            demoPattern: preset.pattern,
            scale: 1.0,
            opacity: 1.0
        };

        this.timeline.addClip(clip);
        this.timeline.recalculateProjectDuration();
        this.timeline.renderAllClips();
        this.timeline.selectClip(clip.id);
        this.engine.render();

        if (window.projectManager && typeof window.projectManager.showToast === 'function') {
            window.projectManager.showToast(`✨ Ljudreaktiv visual "${preset.name}" tillagd! Tryck Play för att se den reagera.`);
        }
    }
}

window.NovaCutVisuals = NovaCutVisuals;

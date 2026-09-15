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
            {
                id: 'dissolve',
                name: 'Cross Dissolve',
                category: 'soft',
                icon: '⧗',
                description: 'Klassisk mjuk övertoning mellan klipp.',
                defaultDuration: 0.5
            },
            {
                id: 'dip_black',
                name: 'Dip to Black',
                category: 'soft',
                icon: '🌑',
                description: 'Dämpar mjukt till svart och tonar upp.',
                defaultDuration: 0.6
            },
            {
                id: 'dip_white',
                name: 'Flash / Vit Blixt',
                category: 'light',
                icon: '⚡',
                description: 'Intensiv vit ljusblixt för snabba beats.',
                defaultDuration: 0.35
            },
            {
                id: 'zoom_in',
                name: 'Zoom In',
                category: 'motion',
                icon: '🔍',
                description: 'Suger in blicken med dynamisk inzoomning.',
                defaultDuration: 0.5
            },
            {
                id: 'zoom_out',
                name: 'Zoom Out',
                category: 'motion',
                icon: '🔎',
                description: 'Filmisk utzoomning för scenövergångar.',
                defaultDuration: 0.5
            },
            {
                id: 'slide_left',
                name: 'Whip Pan Vänster',
                category: 'motion',
                icon: '👈',
                description: 'Snabbt kamerasvep åt vänster.',
                defaultDuration: 0.45
            },
            {
                id: 'slide_right',
                name: 'Whip Pan Höger',
                category: 'motion',
                icon: '👉',
                description: 'Snabbt kamerasvep åt höger.',
                defaultDuration: 0.45
            },
            {
                id: 'glitch',
                name: 'Cyber Glitch',
                category: 'glitch',
                icon: '👾',
                description: 'Digital glitch, RGB-skifte och bildhopp.',
                defaultDuration: 0.4
            }
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

        if (fxType === 'vhs-retro') {
            title = '📼 VHS Retro ' + '95';
            overlayType = 'vhs-retro';
            cssFilter = 'contrast(115%) saturate(125%)';
        } else if (fxType === 'camera-shake') {
            title = '📳 Kamera Skak';
            overlayType = 'camera-shake';
        } else if (fxType === 'rgb-split') {
            title = '👾 RGB Split';
            overlayType = 'rgb-split';
            cssFilter = 'hue-rotate(15deg) contrast(110%)';
        } else if (fxType === 'film-grain') {
            title = '🎞️ 35mm Filmkorn';
            overlayType = 'film-grain';
            cssFilter = 'sepia(12%) contrast(108%)';
        } else if (fxType === 'bokeh') {
            title = '✨ Gyllene Bokeh';
            overlayType = 'bokeh';
        } else if (fxType === 'rain') {
            title = '🌧️ Filmiskt Regn';
            overlayType = 'rain';
        }

        const newClip = this.timeline.addClip({
            trackId: 'effect',
            title: title,
            type: 'effect',
            startTime: playheadTime,
            duration: 4.0,
            overlayType: overlayType,
            cssFilter: cssFilter,
            params: {
                intensity: 1.0,
                speed: 1.0
            }
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

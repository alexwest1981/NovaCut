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

        this.listEl = document.getElementById('marketplaceList');
        this.effectsGrid = document.getElementById('effectsGrid');

        this.init();
    }

    async init() {
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
            {
                id: 'cyberpunk-neon',
                name: 'Cyberpunk Neon',
                version: '1.0.0',
                author: 'NovaCut Team',
                category: 'filter',
                description: 'Elektrisk cyan & magenta neon-tint med ökad kontrast och glow.',
                previewColor: '#00f0ff',
                cssFilter: 'contrast(140%) saturate(160%) hue-rotate(180deg)',
                params: [
                    { id: 'intensity', label: 'Glow Intensity', type: 'slider', min: 0, max: 2, step: 0.1, default: 1.2 },
                    { id: 'contrast', label: 'Kontrast', type: 'slider', min: 80, max: 200, step: 5, default: 140 }
                ]
            },
            {
                id: 'vhs-retro',
                name: '80s Retro VHS',
                version: '1.0.0',
                author: 'NovaCut Team',
                category: 'overlay',
                description: 'Analog videobandkänsla med scanlines och bandbrus.',
                previewColor: '#ff007f',
                cssFilter: 'contrast(115%) saturate(125%) sepia(20%)',
                overlayType: 'vhs-scanlines',
                params: [
                    { id: 'noise', label: 'Scanline Density', type: 'slider', min: 0, max: 1, step: 0.05, default: 0.6 }
                ]
            },
            {
                id: 'cinematic-warm',
                name: 'Cinematic Golden Hour',
                version: '1.0.0',
                author: 'NovaCut Team',
                category: 'filter',
                description: 'Varma gyllene toner och klassisk vinjett i Kodak-stil.',
                previewColor: '#ffaa00',
                cssFilter: 'contrast(110%) saturate(120%) sepia(18%) hue-rotate(-10deg)',
                overlayType: 'vignette',
                params: [
                    { id: 'warmth', label: 'Värme', type: 'slider', min: 0, max: 50, step: 1, default: 18 },
                    { id: 'contrast', label: 'Kontrast', type: 'slider', min: 90, max: 160, step: 5, default: 110 }
                ]
            },
            {
                id: 'noir-bw',
                name: 'Noir Film Black & White',
                version: '1.0.0',
                author: 'NovaCut Community',
                category: 'filter',
                description: 'Dramatisk svartvit filmestetik med skarp kontrast och djup svärta.',
                previewColor: '#71717a',
                cssFilter: 'grayscale(100%) contrast(150%)',
                params: [
                    { id: 'contrast', label: 'Kontrast', type: 'slider', min: 100, max: 200, step: 5, default: 150 }
                ]
            }
        ];
    }

    renderMarketplace() {
        if (!this.listEl) return;
        this.listEl.innerHTML = '';

        const filtered = this.plugins.filter(p => {
            const matchesCat = this.activeCategory === 'all' || p.category === this.activeCategory;
            const matchesSearch = !this.searchQuery || 
                p.name.toLowerCase().includes(this.searchQuery) || 
                p.description.toLowerCase().includes(this.searchQuery);
            return matchesCat && matchesSearch;
        });

        if (filtered.length === 0) {
            this.listEl.innerHTML = `
                <div style="color: var(--text-muted); text-align: center; padding: 20px;">
                    Inga plugins matchade din sökning.
                </div>
            `;
            return;
        }

        filtered.forEach(plugin => {
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
    }

    renderEffectsTab() {
        if (!this.effectsGrid) return;
        this.effectsGrid.innerHTML = '';

        this.plugins.forEach(plugin => {
            const item = document.createElement('div');
            item.className = 'plugin-card';
            item.innerHTML = `
                <div style="padding: 10px 14px; display: flex; align-items: center; justify-content: space-between;">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <div style="width: 12px; height: 12px; border-radius: 50%; background: ${plugin.previewColor || '#ec4899'};"></div>
                        <div>
                            <div style="font-weight: 600; font-size: 12px;">${plugin.name}</div>
                            <div style="font-size: 10px; color: var(--text-muted);">${plugin.category}</div>
                        </div>
                    </div>
                    <button class="btn-icon" title="Lägg till effektlager" style="color: var(--accent); font-size: 16px;">+</button>
                </div>
            `;
            item.querySelector('button').addEventListener('click', () => {
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
    }

    setupEventListeners() {
        // Search
        const searchInput = document.getElementById('marketplaceSearch');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchQuery = e.target.value.toLowerCase().trim();
                this.renderMarketplace();
            });
        }

        // Category Chips
        document.querySelectorAll('.category-chips .chip').forEach(chip => {
            chip.addEventListener('click', () => {
                document.querySelectorAll('.category-chips .chip').forEach(c => c.classList.remove('active'));
                chip.classList.add('active');
                this.activeCategory = chip.dataset.cat;
                this.renderMarketplace();
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

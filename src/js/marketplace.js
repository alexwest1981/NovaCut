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
            },
            {
                id: 'rain-storm',
                name: 'Regn & Storm (Rain)',
                version: '1.1.0',
                author: 'NovaCut Team',
                category: 'overlay',
                description: 'Cinematiska regndroppar med anpassningsbar vind, fallhastighet och vattentjocklek.',
                previewColor: '#38bdf8',
                overlayType: 'rain',
                params: [
                    { id: 'count', label: 'Antal droppar', type: 'slider', min: 30, max: 400, step: 10, default: 160 },
                    { id: 'speed', label: 'Hastighet', type: 'slider', min: 0.2, max: 2.5, step: 0.1, default: 1.0 },
                    { id: 'wind', label: 'Vind / Vinkel', type: 'slider', min: -1.0, max: 1.0, step: 0.1, default: -0.25 },
                    { id: 'length', label: 'Dropplängd', type: 'slider', min: 15, max: 80, step: 5, default: 40 },
                    { id: 'thickness', label: 'Linjebredd', type: 'slider', min: 1.0, max: 4.0, step: 0.5, default: 1.8 }
                ]
            },
            {
                id: 'bokeh-glow',
                name: 'Gyllene Bokeh (Bokeh Glow)',
                version: '1.1.0',
                author: 'NovaCut Team',
                category: 'overlay',
                description: 'Mjuka svävande ljusbubblor med gyllene gloria och subtil parallaxrörelse.',
                previewColor: '#fbbf24',
                overlayType: 'bokeh',
                params: [
                    { id: 'count', label: 'Antal bubblor', type: 'slider', min: 10, max: 60, step: 2, default: 26 },
                    { id: 'size', label: 'Bubbeldiameter', type: 'slider', min: 25, max: 120, step: 5, default: 55 },
                    { id: 'speed', label: 'Svävhastighet', type: 'slider', min: 0.1, max: 2.0, step: 0.1, default: 0.6 },
                    { id: 'color', label: 'Färgton', type: 'color', default: '#ffcc33' }
                ]
            },
            {
                id: 'snow-blizzard',
                name: 'Snöfall (Snow)',
                version: '1.0.0',
                author: 'NovaCut Team',
                category: 'overlay',
                description: 'Atmosfäriska snöflingor med realistiskt fall och mjuk horisontell svajning.',
                previewColor: '#e0f2fe',
                overlayType: 'snow',
                params: [
                    { id: 'count', label: 'Antal flingor', type: 'slider', min: 20, max: 250, step: 10, default: 90 },
                    { id: 'speed', label: 'Fallhastighet', type: 'slider', min: 0.3, max: 2.5, step: 0.1, default: 1.0 }
                ]
            },
            {
                id: 'film-dust',
                name: 'Filmdamm & Repor (Dust & Scratches)',
                version: '1.0.0',
                author: 'NovaCut Team',
                category: 'overlay',
                description: 'Autentiska 12 FPS dammpartiklar och analoga filmrepor för 16mm/35mm känsla.',
                previewColor: '#a1a1aa',
                overlayType: 'dust-scratches',
                params: [
                    { id: 'count', label: 'Partikeltäthet', type: 'slider', min: 15, max: 120, step: 5, default: 45 }
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

        // 2. Filter Plugins
        let filteredPlugins = [];
        if (this.activeCategory !== 'font') {
            filteredPlugins = this.plugins.filter(p => {
                const matchesCat = this.activeCategory === 'all' || p.category === this.activeCategory;
                const matchesSearch = !this.searchQuery || 
                    p.name.toLowerCase().includes(this.searchQuery) || 
                    p.description.toLowerCase().includes(this.searchQuery);
                return matchesCat && matchesSearch;
            });
        }

        // 3. Filter Fonts (Curated Google Fonts + Custom Fonts)
        let filteredFonts = [];
        if ((this.activeCategory === 'font' || this.activeCategory === 'all') && window.fontManager) {
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

        if (filteredPlugins.length === 0 && filteredFonts.length === 0) {
            const emptyMsg = document.createElement('div');
            emptyMsg.style.color = 'var(--text-muted)';
            emptyMsg.style.textAlign = 'center';
            emptyMsg.style.padding = '24px';
            emptyMsg.style.fontSize = '12px';
            emptyMsg.textContent = 'Inga resurser matchade din sökning.';
            this.listEl.appendChild(emptyMsg);
            return;
        }

        // 4. Render Font Cards
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

        // 5. Render Plugin Cards (Filters, Overlays)
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

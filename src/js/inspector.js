/**
 * NovaCut - Inspector & Property Panel Controller
 */
class NovaCutInspector {
    constructor(engine, timeline) {
        this.engine = engine;
        this.timeline = timeline;

        this.titleEl = document.getElementById('inspectorTitle');
        this.badgeEl = document.getElementById('inspectorBadge');
        this.bodyEl = document.getElementById('inspectorBody');
    }

    update(clip) {
        if (!clip) {
            this.renderEmptyState();
            return;
        }

        this.titleEl.textContent = clip.title;
        this.badgeEl.textContent = clip.type.toUpperCase();

        if (clip.type === 'video' || clip.type === 'overlay' || clip.type === 'image') {
            this.renderMediaProperties(clip);
        } else if (clip.type === 'text') {
            this.renderTextProperties(clip);
        } else if (clip.type === 'effect') {
            this.renderEffectProperties(clip);
        } else if (clip.type === 'audio') {
            this.renderAudioProperties(clip);
        }
    }

    renderEmptyState() {
        this.titleEl.textContent = 'Projektinställningar';
        this.badgeEl.textContent = 'PROJEKT';
        this.bodyEl.innerHTML = `
            <div class="inspector-section">
                <div class="section-title">Projektöversikt</div>
                <div class="param-row">
                    <span class="param-label">Bildförhållande</span>
                    <span style="font-weight: 600;">${this.engine.aspectRatio}</span>
                </div>
                <div class="param-row">
                    <span class="param-label">Upplösning</span>
                    <span style="font-family: var(--font-mono); font-size: 11px;">${this.engine.canvas.width} × ${this.engine.canvas.height}</span>
                </div>
                <div class="param-row">
                    <span class="param-label">Längd</span>
                    <span style="font-family: var(--font-mono); font-size: 11px;">${this.engine.duration.toFixed(1)}s</span>
                </div>
                <div class="param-row">
                    <span class="param-label">Antal Klipp</span>
                    <span style="font-weight: 600;">${this.timeline.clips.length}</span>
                </div>
            </div>
            <div style="color: var(--text-muted); text-align: center; margin-top: 30px; font-size: 11px;">
                💡 Klicka på ett klipp på tidslinjen för att redigera skala, färg, filter eller text.
            </div>
        `;
    }

    renderMediaProperties(clip) {
        this.bodyEl.innerHTML = `
            <div class="inspector-section">
                <div class="section-title">Transformering</div>
                
                <div class="param-row">
                    <span class="param-label">Skala (Zoom)</span>
                    <div class="param-input-group">
                        <input type="range" class="slider-input" id="propScale" min="0.2" max="3.0" step="0.05" value="${clip.scale || 1.0}">
                        <span class="num-display" id="valScale">${(clip.scale || 1.0).toFixed(2)}x</span>
                    </div>
                </div>

                <div class="param-row">
                    <div style="display: flex; align-items: center; gap: 6px;">
                        <span class="param-label">Position X</span>
                        <button class="btn-reset-pos" id="btnResetMediaPosX" title="Centrera X (0)">0</button>
                    </div>
                    <div class="param-input-group">
                        <input type="range" class="slider-input" id="propPosX" min="-960" max="960" step="5" value="${clip.posX || 0}">
                        <span class="num-display" id="valPosX">${clip.posX || 0}</span>
                    </div>
                </div>

                <div class="param-row">
                    <div style="display: flex; align-items: center; gap: 6px;">
                        <span class="param-label">Position Y</span>
                        <button class="btn-reset-pos" id="btnResetMediaPosY" title="Centrera Y (0)">0</button>
                    </div>
                    <div class="param-input-group">
                        <input type="range" class="slider-input" id="propPosY" min="-540" max="540" step="5" value="${clip.posY || 0}">
                        <span class="num-display" id="valPosY">${clip.posY || 0}</span>
                    </div>
                </div>

                <div class="param-row">
                    <span class="param-label">Rotation</span>
                    <div class="param-input-group">
                        <input type="range" class="slider-input" id="propRotation" min="-180" max="180" step="1" value="${clip.rotation || 0}">
                        <span class="num-display" id="valRotation">${clip.rotation || 0}°</span>
                    </div>
                </div>

                <div class="param-row">
                    <span class="param-label">Opacitet</span>
                    <div class="param-input-group">
                        <input type="range" class="slider-input" id="propOpacity" min="0" max="1" step="0.05" value="${clip.opacity !== undefined ? clip.opacity : 1.0}">
                        <span class="num-display" id="valOpacity">${Math.round((clip.opacity !== undefined ? clip.opacity : 1.0) * 100)}%</span>
                    </div>
                </div>
            </div>

            <div class="inspector-section">
                <div class="section-title">Uppspelning</div>
                <div class="param-row">
                    <span class="param-label">Hastighet</span>
                    <select id="propSpeed" class="select-compact">
                        <option value="0.5" ${clip.speed === 0.5 ? 'selected' : ''}>0.5x (Slow-mo)</option>
                        <option value="1.0" ${!clip.speed || clip.speed === 1.0 ? 'selected' : ''}>1.0x (Normal)</option>
                        <option value="1.5" ${clip.speed === 1.5 ? 'selected' : ''}>1.5x (Snabb)</option>
                        <option value="2.0" ${clip.speed === 2.0 ? 'selected' : ''}>2.0x (Dubbel)</option>
                    </select>
                </div>
            </div>
        `;

        this.bindInput('propScale', 'valScale', (v) => { clip.scale = parseFloat(v); return `${parseFloat(v).toFixed(2)}x`; });
        this.bindInput('propPosX', 'valPosX', (v) => { clip.posX = parseInt(v); return v; });
        this.bindInput('propPosY', 'valPosY', (v) => { clip.posY = parseInt(v); return v; });
        this.bindInput('propRotation', 'valRotation', (v) => { clip.rotation = parseInt(v); return `${v}°`; });
        this.bindInput('propOpacity', 'valOpacity', (v) => { clip.opacity = parseFloat(v); return `${Math.round(parseFloat(v)*100)}%`; });

        const btnResetMediaX = document.getElementById('btnResetMediaPosX');
        if (btnResetMediaX) {
            btnResetMediaX.addEventListener('click', () => {
                clip.posX = 0;
                this.updatePositionInputs(clip.posX, clip.posY || 0);
                this.engine.render();
            });
        }
        const btnResetMediaY = document.getElementById('btnResetMediaPosY');
        if (btnResetMediaY) {
            btnResetMediaY.addEventListener('click', () => {
                clip.posY = 0;
                this.updatePositionInputs(clip.posX || 0, clip.posY);
                this.engine.render();
            });
        }

        document.getElementById('propSpeed').addEventListener('change', (e) => {
            clip.speed = parseFloat(e.target.value);
            this.engine.render();
        });
    }

    renderTextProperties(clip) {
        let fontOptionsHTML = `
            <optgroup label="⚡ Standard">
                <option value="sans-serif" ${(!clip.fontFamily || clip.fontFamily === 'sans-serif') ? 'selected' : ''}>Modern Sans-serif</option>
                <option value="Impact, sans-serif" ${clip.fontFamily?.includes('Impact') ? 'selected' : ''}>Impact (Meme/Bold)</option>
                <option value="'JetBrains Mono', monospace" ${clip.fontFamily?.includes('Mono') ? 'selected' : ''}>Monospace / Tech</option>
                <option value="Georgia, serif" ${clip.fontFamily?.includes('Georgia') ? 'selected' : ''}>Klassisk Serif</option>
            </optgroup>
        `;

        if (window.fontManager) {
            const curated = window.fontManager.getCuratedFonts();
            fontOptionsHTML += `<optgroup label="🌟 Google Fonts (Kurerade)">`;
            curated.forEach(f => {
                const isSel = clip.fontFamily === f.fontFamily || clip.fontFamily === f.name;
                fontOptionsHTML += `<option value="${f.fontFamily}" ${isSel ? 'selected' : ''}>${f.name} (${f.category})</option>`;
            });
            fontOptionsHTML += `</optgroup>`;

            const custom = window.fontManager.getCustomFonts();
            if (custom.length > 0) {
                fontOptionsHTML += `<optgroup label="📁 Importerade (DaFont m.fl.)">`;
                custom.forEach(f => {
                    const isSel = clip.fontFamily === f.fontFamily;
                    fontOptionsHTML += `<option value="${f.fontFamily}" ${isSel ? 'selected' : ''}>${f.fontName}</option>`;
                });
                fontOptionsHTML += `</optgroup>`;
            }
        }

        this.bodyEl.innerHTML = `
            <div class="inspector-section">
                <div class="section-title">Textinnehåll</div>
                <textarea id="propTextContent" class="form-textarea" style="width: 100%; min-height: 50px;">${clip.text || ''}</textarea>
            </div>

            <div class="inspector-section">
                <div class="section-title">Typografi & Stil</div>
                
                <div class="param-row">
                    <div style="display: flex; align-items: center; gap: 6px;">
                        <span class="param-label">Teckensnitt</span>
                        <button class="btn-reset-pos" id="btnImportCustomFontInspector" title="Importera typsnittsfil (.ttf / .otf från t.ex. DaFont)">📂 +</button>
                    </div>
                    <select id="propFontFamily" class="select-compact" style="max-width: 170px;">
                        ${fontOptionsHTML}
                    </select>
                </div>

                <div class="param-row">
                    <span class="param-label">Storlek</span>
                    <div class="param-input-group">
                        <input type="range" class="slider-input" id="propFontSize" min="20" max="180" step="2" value="${clip.fontSize || 64}">
                        <span class="num-display" id="valFontSize">${clip.fontSize || 64}px</span>
                    </div>
                </div>

                <div class="param-row">
                    <span class="param-label">Textfärg</span>
                    <input type="color" class="color-picker" id="propTextColor" value="${clip.color || '#ffffff'}">
                </div>

                <div class="param-row">
                    <span class="param-label">Bakgrundsbox</span>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <input type="checkbox" id="propHasBg" ${clip.bgColor ? 'checked' : ''}>
                        <input type="color" class="color-picker" id="propBgColor" value="${clip.bgColor || '#000000'}">
                    </div>
                </div>

                <div class="param-row">
                    <span class="param-label">Konturlinje (Outline)</span>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <input type="checkbox" id="propHasOutline" ${clip.outlineColor ? 'checked' : ''}>
                        <input type="color" class="color-picker" id="propOutlineColor" value="${clip.outlineColor || '#000000'}">
                    </div>
                </div>
            </div>

            <div class="inspector-section">
                <div class="section-title" style="display: flex; justify-content: space-between; align-items: center;">
                    <span>Position & Justering</span>
                    <span style="font-size: 10px; color: var(--accent); font-weight: normal; text-transform: none;">✋ Dra direkt i videon</span>
                </div>

                <div style="font-size: 11px; color: var(--text-muted); margin-bottom: 2px;">Snabbplacering:</div>
                <div class="quick-pos-grid">
                    <button class="btn-pos-preset" data-pos="top-left" title="Uppe Vänster">↖</button>
                    <button class="btn-pos-preset" data-pos="top-center" title="Uppe Mitten">⬆</button>
                    <button class="btn-pos-preset" data-pos="top-right" title="Uppe Höger">↗</button>
                    <button class="btn-pos-preset" data-pos="mid-left" title="Mitten Vänster">⬅</button>
                    <button class="btn-pos-preset" data-pos="mid-center" title="Mitten Centrerad">⏺</button>
                    <button class="btn-pos-preset" data-pos="mid-right" title="Mitten Höger">➡</button>
                    <button class="btn-pos-preset" data-pos="bottom-left" title="Nere Vänster">↙</button>
                    <button class="btn-pos-preset" data-pos="bottom-center" title="Nere Mitten">⬇</button>
                    <button class="btn-pos-preset" data-pos="bottom-right" title="Nere Höger">↘</button>
                </div>

                <button id="btnPresetSubtitle" class="btn-pos-preset" style="width: 100%; justify-content: center; font-size: 11px; padding: 7px 10px; gap: 6px;">
                    <span>💬</span> <span>Placera som undertext (Lower-Third)</span>
                </button>

                <div class="param-row" style="margin-top: 4px;">
                    <span class="param-label">Justering</span>
                    <div class="btn-align-group">
                        <button class="btn-align-item ${clip.align === 'left' ? 'active' : ''}" data-align="left" title="Vänsterjusterat">⯇ Vänster</button>
                        <button class="btn-align-item ${(!clip.align || clip.align === 'center') ? 'active' : ''}" data-align="center" title="Centrerat">Centrerat</button>
                        <button class="btn-align-item ${clip.align === 'right' ? 'active' : ''}" data-align="right" title="Högerjusterat">Höger ⯈</button>
                    </div>
                </div>

                <div class="param-row">
                    <div style="display: flex; align-items: center; gap: 6px;">
                        <span class="param-label">Position X</span>
                        <button class="btn-reset-pos" id="btnResetPosX" title="Centrera X (0)">0</button>
                    </div>
                    <div class="param-input-group">
                        <input type="range" class="slider-input" id="propPosX" min="-960" max="960" step="5" value="${clip.posX || 0}">
                        <span class="num-display" id="valPosX">${clip.posX || 0}</span>
                    </div>
                </div>

                <div class="param-row">
                    <div style="display: flex; align-items: center; gap: 6px;">
                        <span class="param-label">Position Y</span>
                        <button class="btn-reset-pos" id="btnResetPosY" title="Centrera Y (0)">0</button>
                    </div>
                    <div class="param-input-group">
                        <input type="range" class="slider-input" id="propPosY" min="-540" max="540" step="5" value="${clip.posY || 0}">
                        <span class="num-display" id="valPosY">${clip.posY || 0}</span>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('propTextContent').addEventListener('input', (e) => {
            clip.text = e.target.value;
            clip.title = e.target.value.slice(0, 16) || 'Text';
            this.timeline.renderClipDOM(clip);
            this.engine.render();
        });

        document.getElementById('propFontFamily').addEventListener('change', (e) => {
            clip.fontFamily = e.target.value;
            this.engine.render();
        });

        const btnImportFont = document.getElementById('btnImportCustomFontInspector');
        if (btnImportFont) {
            btnImportFont.addEventListener('click', async () => {
                if (window.fontManager) {
                    const res = await window.fontManager.importCustomFont();
                    if (res && res.fontFamily) {
                        clip.fontFamily = res.fontFamily;
                        this.update(clip);
                        this.engine.render();
                    }
                }
            });
        }

        this.bindInput('propFontSize', 'valFontSize', (v) => { clip.fontSize = parseInt(v); return `${v}px`; });
        this.bindInput('propPosX', 'valPosX', (v) => { clip.posX = parseInt(v); return v; });
        this.bindInput('propPosY', 'valPosY', (v) => { clip.posY = parseInt(v); return v; });

        const posMap = {
            'top-left': { posX: -550, posY: -380, align: 'left' },
            'top-center': { posX: 0, posY: -380, align: 'center' },
            'top-right': { posX: 550, posY: -380, align: 'right' },
            'mid-left': { posX: -550, posY: 0, align: 'left' },
            'mid-center': { posX: 0, posY: 0, align: 'center' },
            'mid-right': { posX: 550, posY: 0, align: 'right' },
            'bottom-left': { posX: -550, posY: 380, align: 'left' },
            'bottom-center': { posX: 0, posY: 380, align: 'center' },
            'bottom-right': { posX: 550, posY: 380, align: 'right' }
        };

        this.bodyEl.querySelectorAll('.btn-pos-preset').forEach(btn => {
            if (!btn.dataset.pos) return;
            btn.addEventListener('click', () => {
                const target = posMap[btn.dataset.pos];
                if (target) {
                    clip.posX = target.posX;
                    clip.posY = target.posY;
                    clip.align = target.align;
                    this.updatePositionInputs(clip.posX, clip.posY);
                    this.bodyEl.querySelectorAll('.btn-align-item').forEach(b => {
                        b.classList.toggle('active', b.dataset.align === clip.align);
                    });
                    this.engine.render();
                }
            });
        });

        const btnSub = document.getElementById('btnPresetSubtitle');
        if (btnSub) {
            btnSub.addEventListener('click', () => {
                clip.posX = 0;
                clip.posY = 380;
                clip.align = 'center';
                this.updatePositionInputs(clip.posX, clip.posY);
                this.bodyEl.querySelectorAll('.btn-align-item').forEach(b => {
                    b.classList.toggle('active', b.dataset.align === 'center');
                });
                this.engine.render();
            });
        }

        this.bodyEl.querySelectorAll('.btn-align-item').forEach(btn => {
            btn.addEventListener('click', () => {
                this.bodyEl.querySelectorAll('.btn-align-item').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                clip.align = btn.dataset.align;
                this.engine.render();
            });
        });

        const btnResetX = document.getElementById('btnResetPosX');
        if (btnResetX) {
            btnResetX.addEventListener('click', () => {
                clip.posX = 0;
                this.updatePositionInputs(clip.posX, clip.posY || 0);
                this.engine.render();
            });
        }

        const btnResetY = document.getElementById('btnResetPosY');
        if (btnResetY) {
            btnResetY.addEventListener('click', () => {
                clip.posY = 0;
                this.updatePositionInputs(clip.posX || 0, clip.posY);
                this.engine.render();
            });
        }

        document.getElementById('propTextColor').addEventListener('input', (e) => {
            clip.color = e.target.value;
            this.engine.render();
        });

        const hasBg = document.getElementById('propHasBg');
        const bgColor = document.getElementById('propBgColor');
        hasBg.addEventListener('change', () => {
            clip.bgColor = hasBg.checked ? bgColor.value : null;
            this.engine.render();
        });
        bgColor.addEventListener('input', () => {
            if (hasBg.checked) {
                clip.bgColor = bgColor.value;
                this.engine.render();
            }
        });

        const hasOutline = document.getElementById('propHasOutline');
        const outlineColor = document.getElementById('propOutlineColor');
        hasOutline.addEventListener('change', () => {
            clip.outlineColor = hasOutline.checked ? outlineColor.value : null;
            this.engine.render();
        });
        outlineColor.addEventListener('input', () => {
            if (hasOutline.checked) {
                clip.outlineColor = outlineColor.value;
                this.engine.render();
            }
        });
    }

    renderEffectProperties(clip) {
        let paramsHTML = '';
        
        if (clip.manifest && clip.manifest.params) {
            clip.manifest.params.forEach(p => {
                const currentVal = clip.params[p.id] !== undefined ? clip.params[p.id] : p.default;
                paramsHTML += `
                    <div class="param-row">
                        <span class="param-label">${p.label || p.name}</span>
                        ${p.type === 'slider' ? `
                            <div class="param-input-group">
                                <input type="range" class="slider-input effect-param-slider" data-param="${p.id}" min="${p.min}" max="${p.max}" step="${p.step || 1}" value="${currentVal}">
                                <span class="num-display" id="val-param-${p.id}">${currentVal}</span>
                            </div>
                        ` : p.type === 'color' ? `
                            <input type="color" class="color-picker effect-param-color" data-param="${p.id}" value="${currentVal}">
                        ` : ''}
                    </div>
                `;
            });
        }

        this.bodyEl.innerHTML = `
            <div class="inspector-section">
                <div class="section-title">Filter / Plugin-Info</div>
                <p style="font-size: 11px; color: var(--text-secondary); line-height: 1.4;">
                    ${clip.manifest?.description || 'Effektlager som påverkar alla videospår under.'}
                </p>
            </div>

            <div class="inspector-section">
                <div class="section-title">Effektreglage</div>
                ${paramsHTML || '<p style="color: var(--text-muted); font-size: 11px;">Standardinställningar aktiva.</p>'}
            </div>
        `;

        // Bind dynamic sliders
        this.bodyEl.querySelectorAll('.effect-param-slider').forEach(slider => {
            const paramId = slider.dataset.param;
            slider.addEventListener('input', (e) => {
                const val = parseFloat(e.target.value);
                clip.params[paramId] = val;
                const disp = document.getElementById(`val-param-${paramId}`);
                if (disp) disp.textContent = val;

                // Re-evaluate CSS filter dynamically if supported
                if (clip.manifest?.cssFilter) {
                    let f = clip.manifest.cssFilter;
                    if (clip.params.contrast) f = f.replace(/contrast\(\d+%\)/, `contrast(${clip.params.contrast}%)`);
                    if (clip.params.warmth) f = f.replace(/sepia\(\d+%\)/, `sepia(${clip.params.warmth}%)`);
                    clip.cssFilter = f;
                }

                this.engine.render();
            });
        });

        this.bodyEl.querySelectorAll('.effect-param-color').forEach(picker => {
            const paramId = picker.dataset.param;
            picker.addEventListener('input', (e) => {
                clip.params[paramId] = e.target.value;
                this.engine.render();
            });
        });
    }

    renderAudioProperties(clip) {
        this.bodyEl.innerHTML = `
            <div class="inspector-section">
                <div class="section-title">Ljudstyrka & Mix</div>
                <div class="param-row">
                    <span class="param-label">Volym</span>
                    <div class="param-input-group">
                        <input type="range" class="slider-input" id="propAudioVol" min="0" max="2.0" step="0.05" value="${clip.volume !== undefined ? clip.volume : 1.0}">
                        <span class="num-display" id="valAudioVol">${Math.round((clip.volume !== undefined ? clip.volume : 1.0) * 100)}%</span>
                    </div>
                </div>
            </div>
        `;

        this.bindInput('propAudioVol', 'valAudioVol', (v) => { clip.volume = parseFloat(v); return `${Math.round(parseFloat(v)*100)}%`; });
    }

    updatePositionInputs(posX, posY) {
        const slX = document.getElementById('propPosX');
        const valX = document.getElementById('valPosX');
        const slY = document.getElementById('propPosY');
        const valY = document.getElementById('valPosY');
        if (slX) slX.value = posX;
        if (valX) valX.textContent = posX;
        if (slY) slY.value = posY;
        if (valY) valY.textContent = posY;
    }

    bindInput(inputId, displayId, updateFn) {
        const input = document.getElementById(inputId);
        const display = document.getElementById(displayId);
        if (!input) return;

        input.addEventListener('input', (e) => {
            const res = updateFn(e.target.value);
            if (display) display.textContent = res;
            this.engine.render();
        });
    }
}

window.NovaCutInspector = NovaCutInspector;

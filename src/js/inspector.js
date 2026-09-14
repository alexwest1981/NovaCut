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
                    <span class="param-label">Position X</span>
                    <div class="param-input-group">
                        <input type="range" class="slider-input" id="propPosX" min="-800" max="800" step="5" value="${clip.posX || 0}">
                        <span class="num-display" id="valPosX">${clip.posX || 0}</span>
                    </div>
                </div>

                <div class="param-row">
                    <span class="param-label">Position Y</span>
                    <div class="param-input-group">
                        <input type="range" class="slider-input" id="propPosY" min="-600" max="600" step="5" value="${clip.posY || 0}">
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

        document.getElementById('propSpeed').addEventListener('change', (e) => {
            clip.speed = parseFloat(e.target.value);
            this.engine.render();
        });
    }

    renderTextProperties(clip) {
        this.bodyEl.innerHTML = `
            <div class="inspector-section">
                <div class="section-title">Textinnehåll</div>
                <textarea id="propTextContent" class="form-textarea" style="width: 100%; min-height: 50px;">${clip.text || ''}</textarea>
            </div>

            <div class="inspector-section">
                <div class="section-title">Typografi & Stil</div>
                
                <div class="param-row">
                    <span class="param-label">Teckensnitt</span>
                    <select id="propFontFamily" class="select-compact">
                        <option value="sans-serif" ${clip.fontFamily === 'sans-serif' ? 'selected' : ''}>Modern Sans-serif</option>
                        <option value="Impact" ${clip.fontFamily === 'Impact' ? 'selected' : ''}>Impact (Meme/Bold)</option>
                        <option value="'JetBrains Mono', monospace" ${clip.fontFamily?.includes('Mono') ? 'selected' : ''}>Monospace / Tech</option>
                        <option value="Georgia, serif" ${clip.fontFamily === 'Georgia, serif' ? 'selected' : ''}>Klassisk Serif</option>
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
                <div class="section-title">Position</div>
                <div class="param-row">
                    <span class="param-label">Position Y</span>
                    <div class="param-input-group">
                        <input type="range" class="slider-input" id="propPosY" min="-500" max="500" step="10" value="${clip.posY || 0}">
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

        this.bindInput('propFontSize', 'valFontSize', (v) => { clip.fontSize = parseInt(v); return `${v}px`; });
        this.bindInput('propPosY', 'valPosY', (v) => { clip.posY = parseInt(v); return v; });

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

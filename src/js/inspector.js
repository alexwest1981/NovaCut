/**
 * NovaCut - Inspector & Property Panel Controller
 */
const SPEED_PRESETS = {
    'montage': {
        name: 'Montage',
        points: [
            { pos: 0.0, speed: 2.5 },
            { pos: 0.2, speed: 0.4 },
            { pos: 0.5, speed: 0.3 },
            { pos: 0.8, speed: 2.0 },
            { pos: 1.0, speed: 1.0 }
        ]
    },
    'bullet-time': {
        name: 'Bullet',
        points: [
            { pos: 0.0, speed: 1.0 },
            { pos: 0.3, speed: 0.2 },
            { pos: 0.7, speed: 0.2 },
            { pos: 0.85, speed: 1.0 },
            { pos: 1.0, speed: 1.0 }
        ]
    },
    'flash-in': {
        name: 'Flash In',
        points: [
            { pos: 0.0, speed: 4.0 },
            { pos: 0.25, speed: 2.0 },
            { pos: 0.5, speed: 1.0 },
            { pos: 0.75, speed: 1.0 },
            { pos: 1.0, speed: 1.0 }
        ]
    },
    'flash-out': {
        name: 'Flash Out',
        points: [
            { pos: 0.0, speed: 1.0 },
            { pos: 0.5, speed: 1.0 },
            { pos: 0.75, speed: 2.5 },
            { pos: 0.9, speed: 4.5 },
            { pos: 1.0, speed: 5.0 }
        ]
    },
    'hero': {
        name: 'Hero',
        points: [
            { pos: 0.0, speed: 0.5 },
            { pos: 0.3, speed: 0.3 },
            { pos: 0.45, speed: 3.0 },
            { pos: 0.7, speed: 1.2 },
            { pos: 1.0, speed: 1.0 }
        ]
    },
    'custom': {
        name: 'Anpassad',
        points: [
            { pos: 0.0, speed: 1.0 },
            { pos: 0.25, speed: 1.5 },
            { pos: 0.5, speed: 0.5 },
            { pos: 0.75, speed: 2.0 },
            { pos: 1.0, speed: 1.0 }
        ]
    }
};

class NovaCutInspector {
    constructor(engine, timeline) {
        this.engine = engine;
        this.timeline = timeline;

        this.titleEl = document.getElementById('inspectorTitle');
        this.badgeEl = document.getElementById('inspectorBadge');
        this.bodyEl = document.getElementById('inspectorBody');
    }

    update(clip) {
        this.currentClip = clip;
        this.activeKeyframeControls = [];
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
                <div class="section-title">Transformering & Keyframing</div>
                
                <div class="param-row">
                    <div class="param-label-row">
                        <span class="param-label">Skala (Zoom)</span>
                        <div class="keyframe-group">
                            <button class="btn-kf-nav" id="btnKfPrev_scale" title="Föregående keyframe">◂</button>
                            <button class="btn-keyframe" id="btnKf_scale" title="Lägg till/ta bort keyframe för Skala">◇</button>
                            <button class="btn-kf-nav" id="btnKfNext_scale" title="Nästa keyframe">▸</button>
                        </div>
                    </div>
                    <div class="param-input-group">
                        <input type="range" class="slider-input" id="propScale" min="0.2" max="3.0" step="0.05" value="${clip.scale || 1.0}">
                        <span class="num-display" id="valScale">${(clip.scale || 1.0).toFixed(2)}x</span>
                    </div>
                </div>

                <div class="param-row">
                    <div class="param-label-row">
                        <div style="display: flex; align-items: center; gap: 6px;">
                            <span class="param-label">Position X</span>
                            <button class="btn-reset-pos" id="btnResetMediaPosX" title="Centrera X (0)">0</button>
                        </div>
                        <div class="keyframe-group">
                            <button class="btn-kf-nav" id="btnKfPrev_posX" title="Föregående keyframe">◂</button>
                            <button class="btn-keyframe" id="btnKf_posX" title="Lägg till/ta bort keyframe för X">◇</button>
                            <button class="btn-kf-nav" id="btnKfNext_posX" title="Nästa keyframe">▸</button>
                        </div>
                    </div>
                    <div class="param-input-group">
                        <input type="range" class="slider-input" id="propPosX" min="-960" max="960" step="5" value="${clip.posX || 0}">
                        <span class="num-display" id="valPosX">${clip.posX || 0}</span>
                    </div>
                </div>

                <div class="param-row">
                    <div class="param-label-row">
                        <div style="display: flex; align-items: center; gap: 6px;">
                            <span class="param-label">Position Y</span>
                            <button class="btn-reset-pos" id="btnResetMediaPosY" title="Centrera Y (0)">0</button>
                        </div>
                        <div class="keyframe-group">
                            <button class="btn-kf-nav" id="btnKfPrev_posY" title="Föregående keyframe">◂</button>
                            <button class="btn-keyframe" id="btnKf_posY" title="Lägg till/ta bort keyframe för Y">◇</button>
                            <button class="btn-kf-nav" id="btnKfNext_posY" title="Nästa keyframe">▸</button>
                        </div>
                    </div>
                    <div class="param-input-group">
                        <input type="range" class="slider-input" id="propPosY" min="-540" max="540" step="5" value="${clip.posY || 0}">
                        <span class="num-display" id="valPosY">${clip.posY || 0}</span>
                    </div>
                </div>

                <div class="param-row">
                    <div class="param-label-row">
                        <span class="param-label">Rotation</span>
                        <div class="keyframe-group">
                            <button class="btn-kf-nav" id="btnKfPrev_rotation" title="Föregående keyframe">◂</button>
                            <button class="btn-keyframe" id="btnKf_rotation" title="Lägg till/ta bort keyframe för Rotation">◇</button>
                            <button class="btn-kf-nav" id="btnKfNext_rotation" title="Nästa keyframe">▸</button>
                        </div>
                    </div>
                    <div class="param-input-group">
                        <input type="range" class="slider-input" id="propRotation" min="-180" max="180" step="1" value="${clip.rotation || 0}">
                        <span class="num-display" id="valRotation">${clip.rotation || 0}°</span>
                    </div>
                </div>

                <div class="param-row">
                    <div class="param-label-row">
                        <span class="param-label">Opacitet</span>
                        <div class="keyframe-group">
                            <button class="btn-kf-nav" id="btnKfPrev_opacity" title="Föregående keyframe">◂</button>
                            <button class="btn-keyframe" id="btnKf_opacity" title="Lägg till/ta bort keyframe för Opacitet">◇</button>
                            <button class="btn-kf-nav" id="btnKfNext_opacity" title="Nästa keyframe">▸</button>
                        </div>
                    </div>
                    <div class="param-input-group">
                        <input type="range" class="slider-input" id="propOpacity" min="0" max="1" step="0.05" value="${clip.opacity !== undefined ? clip.opacity : 1.0}">
                        <span class="num-display" id="valOpacity">${Math.round((clip.opacity !== undefined ? clip.opacity : 1.0) * 100)}%</span>
                    </div>
                </div>
            </div>

            <div class="inspector-section">
                <div class="section-title">Uppspelning & Hastighetskurvor</div>
                
                <div class="speed-mode-tabs">
                    <button class="speed-mode-tab ${!clip.speedCurve ? 'active' : ''}" id="tabSpeedNormal">Konstant</button>
                    <button class="speed-mode-tab ${clip.speedCurve ? 'active' : ''}" id="tabSpeedCurve">Kurva (Speed Ramp)</button>
                </div>

                <!-- Konstant Hastighet -->
                <div id="sectionSpeedNormal" style="${clip.speedCurve ? 'display: none;' : 'display: block;'}">
                    <div class="param-row">
                        <span class="param-label">Hastighet</span>
                        <div class="param-input-group">
                            <input type="range" class="slider-input" id="propSpeedSlider" min="0.1" max="10.0" step="0.1" value="${clip.speed || 1.0}">
                            <span class="num-display" id="valSpeed">${(clip.speed || 1.0).toFixed(1)}x</span>
                        </div>
                    </div>
                    <div class="speed-quick-pills">
                        <button class="btn-speed-pill ${clip.speed === 0.2 ? 'active' : ''}" data-speed="0.2">0.2x</button>
                        <button class="btn-speed-pill ${clip.speed === 0.5 ? 'active' : ''}" data-speed="0.5">0.5x</button>
                        <button class="btn-speed-pill ${(!clip.speed || clip.speed === 1.0) ? 'active' : ''}" data-speed="1.0">1.0x</button>
                        <button class="btn-speed-pill ${clip.speed === 2.0 ? 'active' : ''}" data-speed="2.0">2.0x</button>
                        <button class="btn-speed-pill ${clip.speed === 5.0 ? 'active' : ''}" data-speed="5.0">5.0x</button>
                    </div>
                </div>

                <!-- Hastighetskurva -->
                <div id="sectionSpeedCurve" style="${clip.speedCurve ? 'display: block;' : 'display: none;'}">
                    <div class="speed-curve-presets">
                        <div class="speed-curve-card ${clip.speedCurveKey === 'montage' ? 'active' : ''}" data-preset="montage" title="Montage: Snabb start, extrem slow-mo i mitten, snabb avslutning">
                            <span class="card-icon">⚡</span>
                            <span class="card-title">Montage</span>
                        </div>
                        <div class="speed-curve-card ${clip.speedCurveKey === 'bullet-time' ? 'active' : ''}" data-preset="bullet-time" title="Bullet-Time: Matrix-liknande inbromsning till ultrarapid">
                            <span class="card-icon">🎯</span>
                            <span class="card-title">Bullet</span>
                        </div>
                        <div class="speed-curve-card ${clip.speedCurveKey === 'flash-in' ? 'active' : ''}" data-preset="flash-in" title="Flash In: Blixtsnabb start som planar ut">
                            <span class="card-icon">🚀</span>
                            <span class="card-title">Flash In</span>
                        </div>
                        <div class="speed-curve-card ${clip.speedCurveKey === 'flash-out' ? 'active' : ''}" data-preset="flash-out" title="Flash Out: Accelererar explosivt i slutet">
                            <span class="card-icon">💥</span>
                            <span class="card-title">Flash Out</span>
                        </div>
                        <div class="speed-curve-card ${clip.speedCurveKey === 'hero' ? 'active' : ''}" data-preset="hero" title="Hero Impact: Slow-mo uppbyggnad och snabb smäll">
                            <span class="card-icon">🦸</span>
                            <span class="card-title">Hero</span>
                        </div>
                        <div class="speed-curve-card ${clip.speedCurveKey === 'custom' ? 'active' : ''}" data-preset="custom" title="Anpassad: Skapa din egen kurva med dragbara punkter">
                            <span class="card-icon">✏️</span>
                            <span class="card-title">Anpassad</span>
                        </div>
                    </div>

                    <div class="speed-curve-canvas-wrap" id="speedCurveWrap">
                        <canvas class="speed-curve-canvas" id="speedCurveCanvas" width="280" height="125"></canvas>
                    </div>

                    <div class="speed-info-bar">
                        <span id="speedCurveStatus">Dra punkter för att ändra fart</span>
                        <span class="highlight" id="speedCurveVal">1.0x</span>
                    </div>
                </div>

                <div class="param-row" style="margin-top: 6px;">
                    <span class="param-label" style="font-size: 11px;">Tonhöjdskorrigering</span>
                    <label style="display: flex; align-items: center; gap: 6px; font-size: 11px; cursor: pointer;">
                        <input type="checkbox" id="propPreservesPitch" ${clip.preservesPitch !== false ? 'checked' : ''}>
                        <span style="color: var(--text-muted);">Behåll tonhöjd</span>
                    </label>
                </div>
            </div>
        `;

        this.bindKeyframeControl(clip, 'scale', 'propScale', 'valScale', (v) => `${v.toFixed(2)}x`);
        this.bindKeyframeControl(clip, 'posX', 'propPosX', 'valPosX', (v) => Math.round(v));
        this.bindKeyframeControl(clip, 'posY', 'propPosY', 'valPosY', (v) => Math.round(v));
        this.bindKeyframeControl(clip, 'rotation', 'propRotation', 'valRotation', (v) => `${Math.round(v)}°`);
        this.bindKeyframeControl(clip, 'opacity', 'propOpacity', 'valOpacity', (v) => `${Math.round(v * 100)}%`);

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

        this.bindSpeedControls(clip);
        this.syncSlidersToCurrentTime();
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
                    <div class="param-label-row">
                        <div style="display: flex; align-items: center; gap: 6px;">
                            <span class="param-label">Position X</span>
                            <button class="btn-reset-pos" id="btnResetPosX" title="Centrera X (0)">0</button>
                        </div>
                        <div class="keyframe-group">
                            <button class="btn-kf-nav" id="btnKfPrev_posX" title="Föregående keyframe">◂</button>
                            <button class="btn-keyframe" id="btnKf_posX" title="Lägg till/ta bort keyframe för X">◇</button>
                            <button class="btn-kf-nav" id="btnKfNext_posX" title="Nästa keyframe">▸</button>
                        </div>
                    </div>
                    <div class="param-input-group">
                        <input type="range" class="slider-input" id="propPosX" min="-960" max="960" step="5" value="${clip.posX || 0}">
                        <span class="num-display" id="valPosX">${clip.posX || 0}</span>
                    </div>
                </div>

                <div class="param-row">
                    <div class="param-label-row">
                        <div style="display: flex; align-items: center; gap: 6px;">
                            <span class="param-label">Position Y</span>
                            <button class="btn-reset-pos" id="btnResetPosY" title="Centrera Y (0)">0</button>
                        </div>
                        <div class="keyframe-group">
                            <button class="btn-kf-nav" id="btnKfPrev_posY" title="Föregående keyframe">◂</button>
                            <button class="btn-keyframe" id="btnKf_posY" title="Lägg till/ta bort keyframe för Y">◇</button>
                            <button class="btn-kf-nav" id="btnKfNext_posY" title="Nästa keyframe">▸</button>
                        </div>
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
        this.bindKeyframeControl(clip, 'posX', 'propPosX', 'valPosX', (v) => Math.round(v));
        this.bindKeyframeControl(clip, 'posY', 'propPosY', 'valPosY', (v) => Math.round(v));

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

        this.syncSlidersToCurrentTime();
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

            <div class="inspector-section">
                <div class="section-title">Uppspelning</div>
                <div class="param-row">
                    <span class="param-label">Hastighet</span>
                    <div class="param-input-group">
                        <input type="range" class="slider-input" id="propAudioSpeed" min="0.2" max="3.0" step="0.05" value="${clip.speed || 1.0}">
                        <span class="num-display" id="valAudioSpeed">${(clip.speed || 1.0).toFixed(2)}x</span>
                    </div>
                </div>
                <div class="param-row">
                    <span class="param-label">Tonhöjd</span>
                    <label style="display: flex; align-items: center; gap: 6px; font-size: 11px; cursor: pointer;">
                        <input type="checkbox" id="propAudioPreservesPitch" ${clip.preservesPitch !== false ? 'checked' : ''}>
                        <span style="color: var(--text-muted);">Behåll tonhöjd</span>
                    </label>
                </div>
            </div>
        `;

        this.bindInput('propAudioVol', 'valAudioVol', (v) => { clip.volume = parseFloat(v); return `${Math.round(parseFloat(v)*100)}%`; });
        this.bindInput('propAudioSpeed', 'valAudioSpeed', (v) => { 
            clip.speed = parseFloat(v); 
            this.timeline.renderClipDOM(clip);
            return `${parseFloat(v).toFixed(2)}x`; 
        });
        const chk = document.getElementById('propAudioPreservesPitch');
        if (chk) {
            chk.addEventListener('change', () => { clip.preservesPitch = chk.checked; });
        }
    }

    updatePositionInputs(posX, posY) {
        const slX = document.getElementById('propPosX');
        const valX = document.getElementById('valPosX');
        const slY = document.getElementById('propPosY');
        const valY = document.getElementById('valPosY');
        if (slX) slX.value = posX;
        if (valX) valX.textContent = Math.round(posX);
        if (slY) slY.value = posY;
        if (valY) valY.textContent = Math.round(posY);

        // If current clip has keyframes for posX or posY, update or add keyframe on canvas drag
        if (this.currentClip && this.currentClip.keyframes && (this.currentClip.keyframes.posX || this.currentClip.keyframes.posY)) {
            const localTime = Math.round(Math.max(0, Math.min(this.currentClip.duration, this.engine.currentTime - this.currentClip.startTime)) * 100) / 100;
            if (this.currentClip.keyframes.posX) {
                const kfX = this.currentClip.keyframes.posX.find(k => Math.abs(k.time - localTime) < 0.08);
                if (kfX) kfX.value = posX;
                else {
                    this.currentClip.keyframes.posX.push({ time: localTime, value: posX });
                    this.currentClip.keyframes.posX.sort((a, b) => a.time - b.time);
                }
            }
            if (this.currentClip.keyframes.posY) {
                const kfY = this.currentClip.keyframes.posY.find(k => Math.abs(k.time - localTime) < 0.08);
                if (kfY) kfY.value = posY;
                else {
                    this.currentClip.keyframes.posY.push({ time: localTime, value: posY });
                    this.currentClip.keyframes.posY.sort((a, b) => a.time - b.time);
                }
            }
            this.timeline.renderClipDOM(this.currentClip);
            this.syncSlidersToCurrentTime();
        }
    }

    bindKeyframeControl(clip, propName, inputId, valId, formatter) {
        const input = document.getElementById(inputId);
        const valDisp = document.getElementById(valId);
        const btnKf = document.getElementById(`btnKf_${propName}`);
        const btnPrev = document.getElementById(`btnKfPrev_${propName}`);
        const btnNext = document.getElementById(`btnKfNext_${propName}`);

        if (!input) return;

        if (!this.activeKeyframeControls) {
            this.activeKeyframeControls = [];
        }
        this.activeKeyframeControls.push({ clip, propName, inputId, valId, formatter });

        const getLocalTime = () => {
            return Math.max(0, Math.min(clip.duration, this.engine.currentTime - clip.startTime));
        };

        // Slider input event (dragging or changing slider)
        input.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            clip[propName] = val;
            if (valDisp) valDisp.textContent = formatter ? formatter(val) : val;

            const localTime = getLocalTime();
            if (clip.keyframes && clip.keyframes[propName] && clip.keyframes[propName].length > 0) {
                const existing = clip.keyframes[propName].find(k => Math.abs(k.time - localTime) < 0.08);
                if (existing) {
                    existing.value = val;
                } else {
                    clip.keyframes[propName].push({ time: Math.round(localTime * 100) / 100, value: val });
                    clip.keyframes[propName].sort((a, b) => a.time - b.time);
                }
                this.timeline.renderClipDOM(clip);
            }

            this.syncSlidersToCurrentTime();
            this.engine.render();
        });

        // Diamond button: Toggle keyframe
        if (btnKf) {
            btnKf.addEventListener('click', (e) => {
                e.stopPropagation();
                const localTime = Math.round(getLocalTime() * 100) / 100;
                clip.keyframes = clip.keyframes || {};
                clip.keyframes[propName] = clip.keyframes[propName] || [];

                const existingIdx = clip.keyframes[propName].findIndex(k => Math.abs(k.time - localTime) < 0.08);
                if (existingIdx !== -1) {
                    clip.keyframes[propName].splice(existingIdx, 1);
                    if (clip.keyframes[propName].length === 0) {
                        delete clip.keyframes[propName];
                    }
                    if (Object.keys(clip.keyframes).length === 0) {
                        delete clip.keyframes;
                    }
                } else {
                    const currentVal = parseFloat(input.value);
                    clip.keyframes[propName].push({ time: localTime, value: currentVal });
                    clip.keyframes[propName].sort((a, b) => a.time - b.time);
                }

                this.timeline.renderClipDOM(clip);
                this.syncSlidersToCurrentTime();
                this.engine.render();
            });
        }

        // Previous keyframe nav
        if (btnPrev) {
            btnPrev.addEventListener('click', (e) => {
                e.stopPropagation();
                const localTime = getLocalTime();
                const kfs = (clip.keyframes && clip.keyframes[propName]) || [];
                const prevKf = [...kfs].reverse().find(k => k.time < localTime - 0.08);
                if (prevKf) {
                    this.engine.seek(clip.startTime + prevKf.time);
                }
            });
        }

        // Next keyframe nav
        if (btnNext) {
            btnNext.addEventListener('click', (e) => {
                e.stopPropagation();
                const localTime = getLocalTime();
                const kfs = (clip.keyframes && clip.keyframes[propName]) || [];
                const nextKf = kfs.find(k => k.time > localTime + 0.08);
                if (nextKf) {
                    this.engine.seek(clip.startTime + nextKf.time);
                }
            });
        }
    }

    syncSlidersToCurrentTime() {
        if (!this.currentClip || !this.activeKeyframeControls || this.activeKeyframeControls.length === 0) return;

        const clip = this.currentClip;
        const localTime = Math.max(0, Math.min(clip.duration, this.engine.currentTime - clip.startTime));

        this.activeKeyframeControls.forEach(ctrl => {
            if (ctrl.clip !== clip) return;
            const { propName, inputId, valId, formatter } = ctrl;
            const input = document.getElementById(inputId);
            const valDisp = document.getElementById(valId);
            const btnKf = document.getElementById(`btnKf_${propName}`);
            const btnPrev = document.getElementById(`btnKfPrev_${propName}`);
            const btnNext = document.getElementById(`btnKfNext_${propName}`);

            if (!input) return;

            const kfs = (clip.keyframes && clip.keyframes[propName]) || [];
            const activeKf = kfs.find(k => Math.abs(k.time - localTime) < 0.08);

            // Interpolated value
            const currentVal = this.engine.getInterpolatedProperty(clip, propName, clip[propName] !== undefined ? clip[propName] : parseFloat(input.value));

            // Only update input if user is not actively interacting with it
            if (document.activeElement !== input) {
                input.value = currentVal;
                if (valDisp) {
                    valDisp.textContent = formatter ? formatter(currentVal) : Math.round(currentVal);
                }
            }

            if (btnKf) {
                if (activeKf) {
                    btnKf.textContent = '◆';
                    btnKf.classList.add('active');
                    btnKf.title = `Ta bort keyframe vid ${localTime.toFixed(2)}s`;
                } else {
                    btnKf.textContent = '◇';
                    btnKf.classList.remove('active');
                    btnKf.title = `Lägg till keyframe vid ${localTime.toFixed(2)}s`;
                }
            }

            if (btnPrev) {
                const prevKf = [...kfs].reverse().find(k => k.time < localTime - 0.08);
                btnPrev.disabled = !prevKf;
            }
            if (btnNext) {
                const nextKf = kfs.find(k => k.time > localTime + 0.08);
                btnNext.disabled = !nextKf;
            }
        });
    }

    bindSpeedControls(clip) {
        const tabNormal = document.getElementById('tabSpeedNormal');
        const tabCurve = document.getElementById('tabSpeedCurve');
        const secNormal = document.getElementById('sectionSpeedNormal');
        const secCurve = document.getElementById('sectionSpeedCurve');
        const slider = document.getElementById('propSpeedSlider');
        const valDisp = document.getElementById('valSpeed');
        const chkPitch = document.getElementById('propPreservesPitch');

        if (chkPitch) {
            chkPitch.addEventListener('change', () => {
                clip.preservesPitch = chkPitch.checked;
            });
        }

        if (tabNormal && tabCurve) {
            tabNormal.addEventListener('click', () => {
                delete clip.speedCurve;
                delete clip.speedCurveKey;
                delete clip.speedCurveName;
                tabNormal.classList.add('active');
                tabCurve.classList.remove('active');
                if (secNormal) secNormal.style.display = 'block';
                if (secCurve) secCurve.style.display = 'none';
                this.timeline.renderClipDOM(clip);
                this.engine.render();
            });

            tabCurve.addEventListener('click', () => {
                tabCurve.classList.add('active');
                tabNormal.classList.remove('active');
                if (secNormal) secNormal.style.display = 'none';
                if (secCurve) secCurve.style.display = 'block';

                if (!clip.speedCurve) {
                    clip.speedCurveKey = 'montage';
                    clip.speedCurveName = 'Montage';
                    clip.speedCurve = { points: JSON.parse(JSON.stringify(SPEED_PRESETS['montage'].points)) };
                }
                this.initSpeedCurveEditor(clip);
                this.timeline.renderClipDOM(clip);
                this.engine.render();
            });
        }

        if (slider) {
            slider.addEventListener('input', (e) => {
                const s = parseFloat(e.target.value);
                clip.speed = s;
                if (valDisp) valDisp.textContent = `${s.toFixed(1)}x`;
                document.querySelectorAll('.btn-speed-pill').forEach(b => {
                    b.classList.toggle('active', Math.abs(parseFloat(b.dataset.speed) - s) < 0.05);
                });
                this.timeline.renderClipDOM(clip);
                this.engine.render();
            });
        }

        document.querySelectorAll('.btn-speed-pill').forEach(btn => {
            btn.addEventListener('click', () => {
                const s = parseFloat(btn.dataset.speed);
                clip.speed = s;
                if (slider) slider.value = s;
                if (valDisp) valDisp.textContent = `${s.toFixed(1)}x`;
                document.querySelectorAll('.btn-speed-pill').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.timeline.renderClipDOM(clip);
                this.engine.render();
            });
        });

        // Preset cards
        document.querySelectorAll('.speed-curve-card').forEach(card => {
            card.addEventListener('click', () => {
                const key = card.dataset.preset;
                const preset = SPEED_PRESETS[key];
                if (!preset) return;

                clip.speedCurveKey = key;
                clip.speedCurveName = preset.name;
                clip.speedCurve = { points: JSON.parse(JSON.stringify(preset.points)) };

                document.querySelectorAll('.speed-curve-card').forEach(c => c.classList.remove('active'));
                card.classList.add('active');

                this.drawSpeedCurveCanvas(clip);
                this.timeline.renderClipDOM(clip);
                this.engine.render();
            });
        });

        if (clip.speedCurve) {
            this.initSpeedCurveEditor(clip);
        }
    }

    initSpeedCurveEditor(clip) {
        const canvas = document.getElementById('speedCurveCanvas');
        if (!canvas) return;

        this.speedCurveClip = clip;
        this.draggedPointIdx = -1;

        const getCoords = (e) => {
            const rect = canvas.getBoundingClientRect();
            return {
                x: Math.max(0, Math.min(rect.width, e.clientX - rect.left)),
                y: Math.max(0, Math.min(rect.height, e.clientY - rect.top)),
                width: rect.width,
                height: rect.height
            };
        };

        const minSpeed = 0.1;
        const maxSpeed = 6.0;

        canvas.onmousedown = (e) => {
            const { x, y, width, height } = getCoords(e);
            const pts = clip.speedCurve.points;
            let closest = -1;
            let minDist = 18;

            pts.forEach((p, idx) => {
                const px = p.pos * width;
                const py = height - ((p.speed - minSpeed) / (maxSpeed - minSpeed)) * height;
                const dist = Math.hypot(x - px, y - py);
                if (dist < minDist) {
                    minDist = dist;
                    closest = idx;
                }
            });

            if (closest !== -1) {
                this.draggedPointIdx = closest;
                const status = document.getElementById('speedCurveStatus');
                const valEl = document.getElementById('speedCurveVal');
                if (status) status.textContent = `Punkt ${closest + 1}/${pts.length}`;
                if (valEl) valEl.textContent = `${pts[closest].speed.toFixed(2)}x`;
            }
        };

        window.addEventListener('mousemove', (e) => {
            if (this.draggedPointIdx === -1 || !this.speedCurveClip || this.speedCurveClip !== clip) return;
            const { x, y, width, height } = getCoords(e);
            const pts = clip.speedCurve.points;
            const idx = this.draggedPointIdx;

            // Speed from Y
            const speedFraction = Math.max(0, Math.min(1, 1 - (y / height)));
            const newSpeed = Math.round((minSpeed + speedFraction * (maxSpeed - minSpeed)) * 20) / 20;
            pts[idx].speed = Math.max(minSpeed, Math.min(maxSpeed, newSpeed));

            // Position from X (first and last points remain at 0.0 and 1.0)
            if (idx > 0 && idx < pts.length - 1) {
                const minPos = pts[idx - 1].pos + 0.04;
                const maxPos = pts[idx + 1].pos - 0.04;
                const newPos = Math.max(minPos, Math.min(maxPos, x / width));
                pts[idx].pos = Math.round(newPos * 100) / 100;
            }

            clip.speedCurveKey = 'custom';
            document.querySelectorAll('.speed-curve-card').forEach(c => {
                c.classList.toggle('active', c.dataset.preset === 'custom');
            });

            const status = document.getElementById('speedCurveStatus');
            const valEl = document.getElementById('speedCurveVal');
            if (status) status.textContent = `Punkt ${idx + 1}: ${(pts[idx].pos * clip.duration).toFixed(1)}s`;
            if (valEl) valEl.textContent = `${pts[idx].speed.toFixed(2)}x`;

            this.drawSpeedCurveCanvas(clip);
            this.engine.render();
        });

        window.addEventListener('mouseup', () => {
            if (this.draggedPointIdx !== -1) {
                this.draggedPointIdx = -1;
                this.timeline.renderClipDOM(clip);
            }
        });

        canvas.ondblclick = (e) => {
            const { x, y, width, height } = getCoords(e);
            const pts = clip.speedCurve.points;
            const clickPos = x / width;
            const speedFraction = Math.max(0, Math.min(1, 1 - (y / height)));
            const clickSpeed = Math.round((minSpeed + speedFraction * (maxSpeed - minSpeed)) * 10) / 10;

            // Check if double-clicked existing interior point to remove it
            let removeIdx = -1;
            pts.forEach((p, idx) => {
                if (idx > 0 && idx < pts.length - 1) {
                    const px = p.pos * width;
                    const py = height - ((p.speed - minSpeed) / (maxSpeed - minSpeed)) * height;
                    if (Math.hypot(x - px, y - py) < 14) {
                        removeIdx = idx;
                    }
                }
            });

            if (removeIdx !== -1) {
                pts.splice(removeIdx, 1);
            } else {
                pts.push({ pos: Math.round(clickPos * 100) / 100, speed: clickSpeed });
                pts.sort((a, b) => a.pos - b.pos);
            }

            clip.speedCurveKey = 'custom';
            document.querySelectorAll('.speed-curve-card').forEach(c => {
                c.classList.toggle('active', c.dataset.preset === 'custom');
            });

            this.drawSpeedCurveCanvas(clip);
            this.timeline.renderClipDOM(clip);
            this.engine.render();
        };

        this.drawSpeedCurveCanvas(clip);
    }

    drawSpeedCurveCanvas(clip) {
        const canvas = document.getElementById('speedCurveCanvas');
        if (!canvas || !clip || !clip.speedCurve) return;

        const ctx = canvas.getContext('2d');
        const rect = canvas.getBoundingClientRect();
        const width = rect.width || 280;
        const height = rect.height || 125;

        canvas.width = width * (window.devicePixelRatio || 1);
        canvas.height = height * (window.devicePixelRatio || 1);
        ctx.resetTransform();
        ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);

        ctx.clearRect(0, 0, width, height);

        const minSpeed = 0.1;
        const maxSpeed = 6.0;
        const getY = (s) => height - ((s - minSpeed) / (maxSpeed - minSpeed)) * height;

        // Background grid lines
        const gridSpeeds = [0.5, 1.0, 2.0, 4.0];
        gridSpeeds.forEach(s => {
            const gy = getY(s);
            ctx.beginPath();
            ctx.moveTo(0, gy);
            ctx.lineTo(width, gy);
            if (s === 1.0) {
                ctx.strokeStyle = 'rgba(0, 212, 130, 0.4)';
                ctx.lineWidth = 1.2;
                ctx.setLineDash([4, 4]);
            } else {
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
                ctx.lineWidth = 1;
                ctx.setLineDash([2, 4]);
            }
            ctx.stroke();
            ctx.setLineDash([]);

            // Label
            ctx.fillStyle = (s === 1.0) ? '#00d482' : 'rgba(255, 255, 255, 0.35)';
            ctx.font = '9px monospace';
            ctx.textAlign = 'left';
            ctx.fillText(`${s.toFixed(1)}x`, 6, gy - 3);
        });

        const pts = clip.speedCurve.points;
        if (!pts || pts.length < 2) return;

        // Evaluate smooth curve points
        const steps = 80;
        const curvePoints = [];
        for (let i = 0; i <= steps; i++) {
            const u = i / steps;
            const s = this.engine.getClipInstantaneousSpeed(clip, u * clip.duration);
            curvePoints.push({ x: u * width, y: getY(s) });
        }

        // Fill area under curve
        const grad = ctx.createLinearGradient(0, 0, 0, height);
        grad.addColorStop(0, 'rgba(0, 212, 130, 0.3)');
        grad.addColorStop(1, 'rgba(0, 212, 130, 0.02)');
        ctx.beginPath();
        ctx.moveTo(curvePoints[0].x, height);
        curvePoints.forEach(p => ctx.lineTo(p.x, p.y));
        ctx.lineTo(curvePoints[curvePoints.length - 1].x, height);
        ctx.closePath();
        ctx.fillStyle = grad;
        ctx.fill();

        // Stroke curve
        ctx.beginPath();
        ctx.moveTo(curvePoints[0].x, curvePoints[0].y);
        for (let i = 1; i < curvePoints.length; i++) {
            ctx.lineTo(curvePoints[i].x, curvePoints[i].y);
        }
        ctx.strokeStyle = '#00d482';
        ctx.lineWidth = 2.5;
        ctx.shadowColor = 'rgba(0, 212, 130, 0.6)';
        ctx.shadowBlur = 6;
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Draw points
        pts.forEach((p, idx) => {
            const px = p.pos * width;
            const py = getY(p.speed);

            ctx.beginPath();
            ctx.arc(px, py, 6, 0, Math.PI * 2);
            ctx.fillStyle = '#ffffff';
            ctx.fill();
            ctx.strokeStyle = (this.draggedPointIdx === idx) ? '#00e5ff' : '#00d482';
            ctx.lineWidth = 2.5;
            ctx.stroke();

            if (this.draggedPointIdx === idx) {
                ctx.beginPath();
                ctx.arc(px, py, 10, 0, Math.PI * 2);
                ctx.strokeStyle = 'rgba(0, 229, 255, 0.5)';
                ctx.lineWidth = 1.5;
                ctx.stroke();
            }
        });

        // Vertical playhead line if active
        if (this.engine.currentTime >= clip.startTime && this.engine.currentTime <= (clip.startTime + clip.duration)) {
            const localTime = this.engine.currentTime - clip.startTime;
            const u = Math.max(0, Math.min(1.0, localTime / clip.duration));
            const phX = u * width;
            const currentSpeed = this.engine.getClipInstantaneousSpeed(clip, localTime);
            const phY = getY(currentSpeed);

            ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
            ctx.lineWidth = 1.5;
            ctx.setLineDash([3, 2]);
            ctx.beginPath();
            ctx.moveTo(phX, 0);
            ctx.lineTo(phX, height);
            ctx.stroke();
            ctx.setLineDash([]);

            // Animated glowing playhead dot on curve
            ctx.beginPath();
            ctx.arc(phX, phY, 4.5, 0, Math.PI * 2);
            ctx.fillStyle = '#ffffff';
            ctx.fill();
            ctx.shadowColor = '#00e5ff';
            ctx.shadowBlur = 8;
            ctx.stroke();
            ctx.shadowBlur = 0;

            const valEl = document.getElementById('speedCurveVal');
            if (valEl && this.draggedPointIdx === -1) {
                valEl.textContent = `${currentSpeed.toFixed(2)}x`;
            }
        }
    }

    updateSpeedCurvePlayhead() {
        if (!this.speedCurveClip || !this.speedCurveClip.speedCurve) return;
        const canvas = document.getElementById('speedCurveCanvas');
        if (canvas && this.draggedPointIdx === -1) {
            this.drawSpeedCurveCanvas(this.speedCurveClip);
        }
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

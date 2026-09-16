/**
 * NovaCut In-App Color Picker Popover
 * Replaces native Chromium <input type="color"> popup on Wayland/Linux
 * which otherwise overflows off-screen and gets clipped.
 * 
 * Features:
 * - 100% viewport-safe positioning (opens anchored to the left of inspector)
 * - 2D Saturation/Value canvas gradient picker
 * - Rainbow Hue slider (0-360 deg)
 * - HEX code live editor with instant copy/paste
 * - Eyedropper / Pipett tool (using native Chromium EyeDropper API)
 * - Curated video creator palette swatches
 * - Recent colors memory (localStorage)
 * - Dispatches 'input' and 'change' events for live preview
 */

class NovaCutColorPicker {
    constructor() {
        this.isOpen = false;
        this.targetInput = null;
        this.hue = 160;       // 0 - 360
        this.sat = 1.0;       // 0 - 1
        this.val = 0.83;      // 0 - 1
        this.currentHex = '#00d482';
        this.recentColors = this.loadRecentColors();

        this.initDOM();
        this.attachGlobalInterception();
    }

    loadRecentColors() {
        try {
            const saved = localStorage.getItem('novacut_recent_colors');
            if (saved) return JSON.parse(saved);
        } catch (_) {}
        return ['#ffffff', '#000000', '#00d482', '#00f2fe', '#ffd000'];
    }

    saveRecentColor(hex) {
        if (!hex || !hex.startsWith('#')) return;
        hex = hex.toLowerCase();
        this.recentColors = [hex, ...this.recentColors.filter(c => c !== hex)].slice(0, 7);
        try {
            localStorage.setItem('novacut_recent_colors', JSON.stringify(this.recentColors));
        } catch (_) {}
        this.renderRecentSwatches();
    }

    initDOM() {
        this.popover = document.createElement('div');
        this.popover.id = 'novacutColorPickerPop';
        this.popover.className = 'nc-color-popover';
        this.popover.style.display = 'none';

        this.popover.innerHTML = `
            <div class="nc-cp-header">
                <span class="nc-cp-title">🎨 Färgväljare</span>
                <div class="nc-cp-header-actions">
                    <button class="nc-cp-eyedropper-btn" id="ncCpEyedropper" title="Pipett: Klicka för att hämta färg från skärmen">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="m2 22 1-1h3l9-9"/>
                            <path d="M3 21v-3l9-9"/>
                            <path d="m15 6 3.4-3.4a2.1 2.1 0 1 1 3 3L18 9l.4.4a2.1 2.1 0 1 1-3 3l-3.8-3.8a2.1 2.1 0 1 1 3-3l.4.4Z"/>
                        </svg>
                    </button>
                    <button class="nc-cp-close-btn" id="ncCpClose" title="Stäng">✕</button>
                </div>
            </div>

            <!-- 2D Saturation / Value Gradient Canvas -->
            <div class="nc-cp-canvas-wrapper">
                <canvas class="nc-cp-canvas" id="ncCpCanvas" width="240" height="130"></canvas>
                <div class="nc-cp-handle" id="ncCpHandle"></div>
            </div>

            <!-- Hue Rainbow Slider -->
            <div class="nc-cp-hue-wrapper">
                <input type="range" class="nc-cp-hue-slider" id="ncCpHue" min="0" max="360" step="1" value="160">
            </div>

            <!-- Hex & Preview Row -->
            <div class="nc-cp-controls-row">
                <div class="nc-cp-swatch" id="ncCpPreviewSwatch" style="background: #00d482;"></div>
                <div class="nc-cp-hex-box">
                    <span class="nc-cp-hex-prefix">#</span>
                    <input type="text" class="nc-cp-hex-input" id="ncCpHexInput" value="00d482" maxlength="6" spellcheck="false">
                </div>
            </div>

            <!-- Quick Swatches (Curated Creator Palettes) -->
            <div class="nc-cp-swatches-section">
                <div class="nc-cp-swatches-label">Snabbfärger</div>
                <div class="nc-cp-swatches-grid" id="ncCpPresetGrid">
                    <button class="nc-cp-swatch-btn" data-color="#ffffff" style="background: #ffffff;" title="Vit"></button>
                    <button class="nc-cp-swatch-btn" data-color="#000000" style="background: #000000;" title="Svart"></button>
                    <button class="nc-cp-swatch-btn" data-color="#00d482" style="background: #00d482;" title="NovaCut Grön"></button>
                    <button class="nc-cp-swatch-btn" data-color="#00f2fe" style="background: #00f2fe;" title="Neon Cyan"></button>
                    <button class="nc-cp-swatch-btn" data-color="#38bdf8" style="background: #38bdf8;" title="Himmelsblå"></button>
                    <button class="nc-cp-swatch-btn" data-color="#8b5cf6" style="background: #8b5cf6;" title="Lila"></button>
                    <button class="nc-cp-swatch-btn" data-color="#ff007f" style="background: #ff007f;" title="Neon Rosa"></button>
                    <button class="nc-cp-swatch-btn" data-color="#ef4444" style="background: #ef4444;" title="Röd"></button>
                    <button class="nc-cp-swatch-btn" data-color="#f97316" style="background: #f97316;" title="Orange"></button>
                    <button class="nc-cp-swatch-btn" data-color="#ffd000" style="background: #ffd000;" title="Hormozi Gul"></button>
                </div>
            </div>

            <!-- Recent Colors -->
            <div class="nc-cp-swatches-section">
                <div class="nc-cp-swatches-label">Senaste</div>
                <div class="nc-cp-swatches-grid" id="ncCpRecentGrid"></div>
            </div>
        `;

        document.body.appendChild(this.popover);

        // Bind DOM elements
        this.canvas = this.popover.querySelector('#ncCpCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.handle = this.popover.querySelector('#ncCpHandle');
        this.hueSlider = this.popover.querySelector('#ncCpHue');
        this.previewSwatch = this.popover.querySelector('#ncCpPreviewSwatch');
        this.hexInput = this.popover.querySelector('#ncCpHexInput');
        this.eyedropperBtn = this.popover.querySelector('#ncCpEyedropper');
        this.closeBtn = this.popover.querySelector('#ncCpClose');
        this.recentGrid = this.popover.querySelector('#ncCpRecentGrid');

        this.renderRecentSwatches();
        this.bindEvents();
    }

    bindEvents() {
        // Close button
        this.closeBtn.addEventListener('click', () => this.close());

        // Eyedropper API
        if (window.EyeDropper) {
            this.eyedropperBtn.addEventListener('click', async () => {
                try {
                    const eyeDropper = new window.EyeDropper();
                    const result = await eyeDropper.open();
                    if (result && result.sRGBHex) {
                        this.setColorFromHex(result.sRGBHex, true);
                    }
                } catch (err) {
                    // User canceled or unsupported
                }
            });
        } else {
            this.eyedropperBtn.style.display = 'none';
        }

        // Hue Slider
        this.hueSlider.addEventListener('input', (e) => {
            this.hue = parseFloat(e.target.value);
            this.drawSatValCanvas();
            this.updateColorFromHSV(true);
        });

        // 2D Canvas Dragging
        let isDraggingCanvas = false;
        const handleCanvasPointer = (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
            const y = Math.max(0, Math.min(rect.height, e.clientY - rect.top));

            this.sat = x / rect.width;
            this.val = 1 - (y / rect.height);
            this.updateHandlePosition(x, y);
            this.updateColorFromHSV(true);
        };

        this.canvas.addEventListener('mousedown', (e) => {
            isDraggingCanvas = true;
            handleCanvasPointer(e);
        });

        window.addEventListener('mousemove', (e) => {
            if (isDraggingCanvas) {
                handleCanvasPointer(e);
            }
        });

        window.addEventListener('mouseup', () => {
            if (isDraggingCanvas) {
                isDraggingCanvas = false;
                this.saveRecentColor(this.currentHex);
            }
        });

        // Hex Code Input
        this.hexInput.addEventListener('input', (e) => {
            let val = e.target.value.replace(/[^0-9a-fA-F]/g, '');
            if (val.length === 3 || val.length === 6) {
                const hex = '#' + (val.length === 3 ? val.split('').map(c => c + c).join('') : val);
                this.setColorFromHex(hex, true, false);
            }
        });

        this.hexInput.addEventListener('change', () => {
            this.saveRecentColor(this.currentHex);
        });

        // Preset Swatches
        this.popover.addEventListener('click', (e) => {
            const btn = e.target.closest('.nc-cp-swatch-btn');
            if (btn && btn.dataset.color) {
                this.setColorFromHex(btn.dataset.color, true);
                this.saveRecentColor(btn.dataset.color);
            }
        });

        // Close on Escape or click outside
        window.addEventListener('keydown', (e) => {
            if (this.isOpen && e.key === 'Escape') {
                this.close();
            }
        });

        document.addEventListener('pointerdown', (e) => {
            if (!this.isOpen) return;
            if (this.popover.contains(e.target)) return;
            if (this.targetInput && (this.targetInput === e.target || this.targetInput.contains(e.target))) return;
            this.close();
        });
    }

    renderRecentSwatches() {
        if (!this.recentGrid) return;
        this.recentGrid.innerHTML = '';
        this.recentColors.forEach(color => {
            const btn = document.createElement('button');
            btn.className = 'nc-cp-swatch-btn';
            btn.dataset.color = color;
            btn.style.backgroundColor = color;
            btn.title = color;
            this.recentGrid.appendChild(btn);
        });
    }

    attachGlobalInterception() {
        // Intercept clicks on any color picker input in the entire app
        document.addEventListener('click', (e) => {
            const target = e.target;
            const isColorInput = target.matches('input[type="color"], .color-picker, [data-color-picker]');
            if (isColorInput) {
                e.preventDefault();
                e.stopPropagation();
                this.open(target);
            }
        }, true);
    }

    open(targetInput) {
        this.targetInput = targetInput;
        this.isOpen = true;

        // Position Popover safely inside the viewport
        const rect = targetInput.getBoundingClientRect();
        const popWidth = 264;
        const popHeight = 350;

        // Anchor to the LEFT of target element so it never clips off-screen right!
        let left = rect.left - popWidth - 10;
        if (left < 10) {
            // If near the left edge of the screen, show to the right
            left = rect.right + 10;
        }

        let top = rect.top - 30;
        if (top + popHeight > window.innerHeight - 10) {
            top = window.innerHeight - popHeight - 10;
        }
        if (top < 10) top = 10;

        this.popover.style.left = `${Math.round(left)}px`;
        this.popover.style.top = `${Math.round(top)}px`;
        this.popover.style.display = 'block';

        // Read initial color
        const initHex = targetInput.value || '#ffffff';
        this.setColorFromHex(initHex, false);
    }

    close() {
        if (!this.isOpen) return;
        this.isOpen = false;
        this.popover.style.display = 'none';
        if (this.currentHex) {
            this.saveRecentColor(this.currentHex);
        }
        this.targetInput = null;
    }

    drawSatValCanvas() {
        const { ctx, canvas } = this;
        const w = canvas.width;
        const h = canvas.height;

        // 1. Base pure hue fill
        ctx.fillStyle = `hsl(${this.hue}, 100%, 50%)`;
        ctx.fillRect(0, 0, w, h);

        // 2. Horizontal gradient: white -> transparent
        const gradWhite = ctx.createLinearGradient(0, 0, w, 0);
        gradWhite.addColorStop(0, '#ffffff');
        gradWhite.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = gradWhite;
        ctx.fillRect(0, 0, w, h);

        // 3. Vertical gradient: transparent -> black
        const gradBlack = ctx.createLinearGradient(0, 0, 0, h);
        gradBlack.addColorStop(0, 'rgba(0, 0, 0, 0)');
        gradBlack.addColorStop(1, '#000000');
        ctx.fillStyle = gradBlack;
        ctx.fillRect(0, 0, w, h);
    }

    updateHandlePosition(x, y) {
        this.handle.style.left = `${Math.round(x)}px`;
        this.handle.style.top = `${Math.round(y)}px`;
    }

    updateColorFromHSV(dispatchEvents = true) {
        const rgb = this.hsvToRgb(this.hue, this.sat, this.val);
        const hex = this.rgbToHex(rgb.r, rgb.g, rgb.b);
        this.currentHex = hex;

        // Update UI
        this.previewSwatch.style.backgroundColor = hex;
        this.hexInput.value = hex.replace('#', '').toUpperCase();

        if (this.targetInput) {
            this.targetInput.value = hex;
            if (dispatchEvents) {
                this.targetInput.dispatchEvent(new Event('input', { bubbles: true }));
                this.targetInput.dispatchEvent(new Event('change', { bubbles: true }));
            }
        }
    }

    setColorFromHex(hex, dispatchEvents = true, updateHexInput = true) {
        if (!hex || typeof hex !== 'string') return;
        if (!hex.startsWith('#')) hex = '#' + hex;
        if (hex.length === 4) {
            hex = '#' + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3];
        }
        if (hex.length !== 7) return;

        this.currentHex = hex.toLowerCase();
        const rgb = this.hexToRgb(hex);
        if (!rgb) return;

        const hsv = this.rgbToHsv(rgb.r, rgb.g, rgb.b);
        this.hue = hsv.h;
        this.sat = hsv.s;
        this.val = hsv.v;

        this.hueSlider.value = Math.round(this.hue);
        this.drawSatValCanvas();

        const canvasRect = this.canvas.getBoundingClientRect();
        const x = this.sat * (canvasRect.width || 240);
        const y = (1 - this.val) * (canvasRect.height || 130);
        this.updateHandlePosition(x, y);

        this.previewSwatch.style.backgroundColor = hex;
        if (updateHexInput) {
            this.hexInput.value = hex.replace('#', '').toUpperCase();
        }

        if (this.targetInput) {
            this.targetInput.value = hex;
            if (dispatchEvents) {
                this.targetInput.dispatchEvent(new Event('input', { bubbles: true }));
                this.targetInput.dispatchEvent(new Event('change', { bubbles: true }));
            }
        }
    }

    // Color conversion math
    hsvToRgb(h, s, v) {
        const c = v * s;
        const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
        const m = v - c;
        let r = 0, g = 0, b = 0;

        if (h >= 0 && h < 60) { r = c; g = x; b = 0; }
        else if (h >= 60 && h < 120) { r = x; g = c; b = 0; }
        else if (h >= 120 && h < 180) { r = 0; g = c; b = x; }
        else if (h >= 180 && h < 240) { r = 0; g = x; b = c; }
        else if (h >= 240 && h < 300) { r = x; g = 0; b = c; }
        else if (h >= 300 && h <= 360) { r = c; g = 0; b = x; }

        return {
            r: Math.round((r + m) * 255),
            g: Math.round((g + m) * 255),
            b: Math.round((b + m) * 255)
        };
    }

    rgbToHsv(r, g, b) {
        r /= 255; g /= 255; b /= 255;
        const max = Math.max(r, g, b), min = Math.min(r, g, b);
        let h = 0, s = 0, v = max;
        const d = max - min;
        s = max === 0 ? 0 : d / max;

        if (max !== min) {
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }
        return { h: h * 360, s, v };
    }

    hexToRgb(hex) {
        const res = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return res ? {
            r: parseInt(res[1], 16),
            g: parseInt(res[2], 16),
            b: parseInt(res[3], 16)
        } : null;
    }

    rgbToHex(r, g, b) {
        const toHex = (n) => {
            const h = Math.max(0, Math.min(255, n)).toString(16);
            return h.length === 1 ? '0' + h : h;
        };
        return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    }
}

// Instantiate on load
window.novaCutColorPicker = new NovaCutColorPicker();

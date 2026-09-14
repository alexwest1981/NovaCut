/**
 * NovaCut - Composition & Real-time Playback Engine
 */
class NovaCutEngine {
    constructor() {
        this.canvas = document.getElementById('previewCanvas');
        this.ctx = this.canvas.getContext('2d');

        this.currentTime = 0; // In seconds
        this.duration = 10;   // In seconds
        this.isPlaying = false;
        this.isLooping = true;
        this.fps = 30;
        this.aspectRatio = '16:9';

        this.masterVolume = 1.0;
        this.playbackRate = 1.0;

        this.lastFrameTime = null;
        this.animationFrameId = null;

        // Media elements cache
        this.mediaElements = new Map(); // id -> HTMLVideoElement / HTMLImageElement / HTMLAudioElement

        // Setup resize handling
        this.updateCanvasDimensions();
    }

    setAspectRatio(ratio) {
        this.aspectRatio = ratio;
        this.updateCanvasDimensions();
        this.render();
    }

    updateCanvasDimensions() {
        if (this.aspectRatio === '16:9') {
            this.canvas.width = 1920;
            this.canvas.height = 1080;
        } else if (this.aspectRatio === '9:16') {
            this.canvas.width = 1080;
            this.canvas.height = 1920;
        } else if (this.aspectRatio === '1:1') {
            this.canvas.width = 1080;
            this.canvas.height = 1080;
        } else if (this.aspectRatio === '4:5') {
            this.canvas.width = 1080;
            this.canvas.height = 1350;
        }
    }

    play() {
        if (this.isPlaying) return;
        this.isPlaying = true;
        this.lastFrameTime = performance.now();
        this.loop();
        document.getElementById('btnPlayPause').textContent = '⏸';
    }

    pause() {
        if (!this.isPlaying) return;
        this.isPlaying = false;
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        document.getElementById('btnPlayPause').textContent = '▶';

        // Pause all audio/video elements
        this.mediaElements.forEach(el => {
            if (el && typeof el.pause === 'function') {
                el.pause();
            }
        });
    }

    togglePlay() {
        if (this.isPlaying) this.pause();
        else this.play();
    }

    seek(time) {
        this.currentTime = Math.max(0, Math.min(this.duration, time));
        this.render();
        if (window.timeline) {
            window.timeline.updatePlayheadPosition();
        }
    }

    stepFrame(deltaFrames) {
        this.pause();
        const frameTime = 1 / this.fps;
        this.seek(this.currentTime + (deltaFrames * frameTime));
    }

    loop() {
        if (!this.isPlaying) return;

        const now = performance.now();
        const delta = (now - this.lastFrameTime) / 1000;
        this.lastFrameTime = now;

        this.currentTime += delta * this.playbackRate;

        if (this.currentTime >= this.duration) {
            if (this.isLooping) {
                this.currentTime = 0;
            } else {
                this.currentTime = this.duration;
                this.pause();
                this.render();
                return;
            }
        }

        this.render();

        if (window.timeline) {
            window.timeline.updatePlayheadPosition();
        }

        this.animationFrameId = requestAnimationFrame(() => this.loop());
    }

    // Main Canvas Render Pipeline
    render() {
        const { ctx, canvas } = this;
        const width = canvas.width;
        const height = canvas.height;

        // Reset canvas transformation & filters
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.filter = 'none';
        ctx.clearRect(0, 0, width, height);

        // 1. Background Fill (Studio dark)
        ctx.fillStyle = '#0a0a0f';
        ctx.fillRect(0, 0, width, height);

        if (!window.timeline) {
            ctx.restore();
            return;
        }

        const activeClips = window.timeline.getActiveClipsAt(this.currentTime);

        // 2. Global Effect Layers (Active clips on effect track)
        const effectClips = activeClips.filter(c => c.trackId === 'effect');
        let combinedFilter = 'none';
        let customOverlays = [];

        if (effectClips.length > 0) {
            const filters = [];
            effectClips.forEach(eff => {
                if (eff.cssFilter) filters.push(eff.cssFilter);
                if (eff.overlayType) customOverlays.push({ type: eff.overlayType, params: eff.params });
            });
            if (filters.length > 0) {
                combinedFilter = filters.join(' ');
            }
        }

        // Apply active filter chain to video/image rendering
        ctx.filter = combinedFilter;

        // 3. Render Main Video Track & Overlay Track
        const videoClips = activeClips.filter(c => c.trackId === 'video' || c.trackId === 'overlay');
        
        // Sort: main video first, overlay on top
        videoClips.sort((a, b) => (a.trackId === 'video' ? -1 : 1));

        if (videoClips.length === 0 && activeClips.filter(c => c.trackId === 'text').length === 0) {
            // Render friendly placeholder when project is empty
            this.renderEmptyPlaceholder();
        }

        videoClips.forEach(clip => {
            this.renderMediaClip(clip, width, height);
        });

        // 4. Render Custom Overlay Effects (e.g. VHS scanlines, Vignette)
        customOverlays.forEach(ov => {
            this.renderSpecialOverlay(ov.type, ov.params, width, height);
        });

        // Reset filter for sharp text rendering
        ctx.filter = 'none';

        // 5. Render Text Layers
        const textClips = activeClips.filter(c => c.trackId === 'text');
        textClips.forEach(clip => {
            this.renderTextClip(clip, width, height);
        });

        ctx.restore();

        // 6. Handle Audio Playback Sync
        this.syncAudioTracks(activeClips);

        // 7. Update Timecode UI
        this.updateTimecodeUI();
    }

    renderMediaClip(clip, width, height) {
        const { ctx } = this;
        let mediaEl = this.mediaElements.get(clip.mediaId);

        ctx.save();

        const posX = (clip.posX || 0) + width / 2;
        const posY = (clip.posY || 0) + height / 2;
        const scale = clip.scale || 1.0;
        const opacity = clip.opacity !== undefined ? clip.opacity : 1.0;
        const rotation = (clip.rotation || 0) * Math.PI / 180;

        ctx.translate(posX, posY);
        ctx.rotate(rotation);
        ctx.scale(scale, scale);
        ctx.globalAlpha = opacity;

        if (clip.blendMode) {
            ctx.globalCompositeOperation = clip.blendMode;
        }

        if (mediaEl && mediaEl.tagName === 'VIDEO') {
            const clipRelativeTime = (this.currentTime - clip.startTime) * (clip.speed || 1) + (clip.sourceOffset || 0);
            
            if (this.isPlaying) {
                if (mediaEl.paused) mediaEl.play().catch(() => {});
                // Keep video synced within 0.15s tolerance
                if (Math.abs(mediaEl.currentTime - clipRelativeTime) > 0.15) {
                    mediaEl.currentTime = clipRelativeTime;
                }
            } else {
                if (!mediaEl.paused) mediaEl.pause();
                if (Math.abs(mediaEl.currentTime - clipRelativeTime) > 0.05) {
                    mediaEl.currentTime = clipRelativeTime;
                }
            }

            const vw = mediaEl.videoWidth || 1920;
            const vh = mediaEl.videoHeight || 1080;
            const aspect = vw / vh;
            let drawW = width;
            let drawH = width / aspect;
            if (drawH < height) {
                drawH = height;
                drawW = height * aspect;
            }

            ctx.drawImage(mediaEl, -drawW / 2, -drawH / 2, drawW, drawH);

        } else if (mediaEl && mediaEl.tagName === 'IMG') {
            const iw = mediaEl.naturalWidth || width;
            const ih = mediaEl.naturalHeight || height;
            ctx.drawImage(mediaEl, -iw / 2, -ih / 2, iw, ih);
        } else {
            // Generated Demo Pattern (e.g. Cyberpunk Grid & Moving Orb)
            this.renderProceduralDemo(clip, width, height);
        }

        ctx.restore();
    }

    renderProceduralDemo(clip, width, height) {
        const { ctx } = this;
        const w = width;
        const h = height;

        // Gradient background
        const grad = ctx.createLinearGradient(-w/2, -h/2, w/2, h/2);
        grad.addColorStop(0, '#111827');
        grad.addColorStop(0.5, '#1e1b4b');
        grad.addColorStop(1, '#0f172a');
        ctx.fillStyle = grad;
        ctx.fillRect(-w/2, -h/2, w, h);

        // Animated neon orb
        const t = this.currentTime;
        const orbX = Math.sin(t * 2) * (w * 0.25);
        const orbY = Math.cos(t * 2) * (h * 0.2);

        const radial = ctx.createRadialGradient(orbX, orbY, 10, orbX, orbY, 180);
        radial.addColorStop(0, '#00d482');
        radial.addColorStop(0.5, 'rgba(59, 130, 246, 0.4)');
        radial.addColorStop(1, 'transparent');
        ctx.fillStyle = radial;
        ctx.fillRect(-w/2, -h/2, w, h);

        // Grid lines
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.lineWidth = 2;
        const step = 80;
        for (let x = -w/2; x <= w/2; x += step) {
            ctx.beginPath();
            ctx.moveTo(x, -h/2);
            ctx.lineTo(x, h/2);
            ctx.stroke();
        }
        for (let y = -h/2; y <= h/2; y += step) {
            ctx.beginPath();
            ctx.moveTo(-w/2, y);
            ctx.lineTo(w/2, y);
            ctx.stroke();
        }
    }

    renderTextClip(clip, width, height) {
        const { ctx } = this;
        ctx.save();

        const x = (clip.posX || 0) + width / 2;
        const y = (clip.posY || 0) + height / 2;
        const fontSize = clip.fontSize || 64;
        const fontFamily = clip.fontFamily || 'sans-serif';
        const fontWeight = clip.bold ? 'bold ' : '600 ';
        const fontStyle = clip.italic ? 'italic ' : '';

        ctx.font = `${fontStyle}${fontWeight}${fontSize}px ${fontFamily}`;
        ctx.textAlign = clip.align || 'center';
        ctx.textBaseline = 'middle';

        // Background box if defined
        if (clip.bgColor) {
            const metrics = ctx.measureText(clip.text || 'NovaCut');
            const padX = 20;
            const padY = 12;
            const boxW = metrics.width + padX * 2;
            const boxH = fontSize + padY * 2;
            ctx.fillStyle = clip.bgColor;
            ctx.beginPath();
            ctx.roundRect(x - boxW / 2, y - boxH / 2, boxW, boxH, 8);
            ctx.fill();
        }

        // Text Outline / Shadow
        if (clip.outlineColor) {
            ctx.strokeStyle = clip.outlineColor;
            ctx.lineWidth = clip.outlineWidth || 6;
            ctx.strokeText(clip.text || 'NovaCut', x, y);
        } else {
            ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
            ctx.shadowBlur = 12;
            ctx.shadowOffsetX = 2;
            ctx.shadowOffsetY = 4;
        }

        ctx.fillStyle = clip.color || '#ffffff';
        ctx.fillText(clip.text || 'NovaCut', x, y);

        ctx.restore();
    }

    renderSpecialOverlay(type, params, width, height) {
        const { ctx } = this;
        ctx.save();

        if (type === 'vhs-scanlines') {
            // Horizontal analog scanlines
            ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
            for (let y = 0; y < height; y += 4) {
                ctx.fillRect(0, y, width, 1.5);
            }
            // VHS static jitter line
            const jitterY = (Math.sin(this.currentTime * 10) * 0.5 + 0.5) * height;
            ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
            ctx.fillRect(0, jitterY, width, 12);

        } else if (type === 'vignette') {
            // Radial dark edges
            const rad = Math.max(width, height) * 0.7;
            const vignette = ctx.createRadialGradient(width/2, height/2, rad * 0.4, width/2, height/2, rad);
            vignette.addColorStop(0, 'transparent');
            vignette.addColorStop(1, 'rgba(0, 0, 0, 0.65)');
            ctx.fillStyle = vignette;
            ctx.fillRect(0, 0, width, height);
        }

        ctx.restore();
    }

    renderEmptyPlaceholder() {
        const { ctx, canvas } = this;
        ctx.fillStyle = '#10121a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = '#5f6377';
        ctx.font = '500 24px -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('⚡ Importera media eller dra ett klipp till tidslinjen', canvas.width / 2, canvas.height / 2);
    }

    syncAudioTracks(activeClips) {
        const audioClips = activeClips.filter(c => c.trackId === 'audio');
        audioClips.forEach(clip => {
            const el = this.mediaElements.get(clip.mediaId);
            if (el && typeof el.play === 'function') {
                el.volume = (clip.volume !== undefined ? clip.volume : 1.0) * this.masterVolume;
                const clipRelativeTime = (this.currentTime - clip.startTime) + (clip.sourceOffset || 0);

                if (this.isPlaying) {
                    if (el.paused) el.play().catch(() => {});
                    if (Math.abs(el.currentTime - clipRelativeTime) > 0.15) {
                        el.currentTime = clipRelativeTime;
                    }
                } else {
                    if (!el.paused) el.pause();
                    if (Math.abs(el.currentTime - clipRelativeTime) > 0.05) {
                        el.currentTime = clipRelativeTime;
                    }
                }
            }
        });
    }

    updateTimecodeUI() {
        const currentEl = document.getElementById('currentTimecode');
        const totalEl = document.getElementById('totalTimecode');
        if (currentEl) currentEl.textContent = this.formatTimecode(this.currentTime);
        if (totalEl) totalEl.textContent = this.formatTimecode(this.duration);
    }

    formatTimecode(seconds) {
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        const f = Math.floor((seconds % 1) * 100);
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${f.toString().padStart(2, '0')}`;
    }
}

window.NovaCutEngine = NovaCutEngine;

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
        this.showSafeZone = false;
        this.canvasSnapping = true;
        this.activeSnapGuides = [];

        this.masterVolume = 1.0;
        this.playbackRate = 1.0;

        this.lastFrameTime = null;
        this.animationFrameId = null;

        // Media elements cache
        this.mediaElements = new Map(); // id -> HTMLVideoElement / HTMLImageElement / HTMLAudioElement

        // Setup resize handling
        this.updateCanvasDimensions();
        this.initCanvasInteractions();
    }

    setAspectRatio(ratio) {
        this.aspectRatio = ratio;
        const select = document.getElementById('aspectRatioSelect');
        if (select && select.value !== ratio) select.value = ratio;
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
        } else if (this.aspectRatio === '21:9') {
            this.canvas.width = 2560;
            this.canvas.height = 1080;
        } else if (this.aspectRatio === '4:3') {
            this.canvas.width = 1440;
            this.canvas.height = 1080;
        }

        const resEl = document.getElementById('monitorResolution');
        if (resEl) {
            resEl.textContent = `${this.canvas.width}×${this.canvas.height} • ${this.fps} FPS`;
        }
        const pillEl = document.getElementById('monitorAspectPill');
        if (pillEl) {
            const labels = {
                '16:9': '16:9 Widescreen',
                '9:16': '9:16 TikTok / Reel',
                '1:1': '1:1 Kvadrat',
                '4:5': '4:5 Porträtt',
                '21:9': '21:9 Ultrawide',
                '4:3': '4:3 Klassisk TV'
            };
            pillEl.textContent = labels[this.aspectRatio] || this.aspectRatio;
        }
    }

    setMonitorZoom(zoomValue) {
        this.monitorZoom = zoomValue;
        const container = document.querySelector('.canvas-container');
        if (!this.canvas) return;

        if (zoomValue === 'fit') {
            this.canvas.style.maxWidth = '100%';
            this.canvas.style.maxHeight = '100%';
            this.canvas.style.width = 'auto';
            this.canvas.style.height = 'auto';
            if (container) container.style.overflow = 'hidden';
        } else {
            const factor = parseFloat(zoomValue) / 100;
            const targetW = Math.round(this.canvas.width * factor);
            const targetH = Math.round(this.canvas.height * factor);
            this.canvas.style.maxWidth = 'none';
            this.canvas.style.maxHeight = 'none';
            this.canvas.style.width = `${targetW}px`;
            this.canvas.style.height = `${targetH}px`;
            if (container) container.style.overflow = 'auto';
        }
        this.render();
    }

    toggleSafeZone() {
        this.showSafeZone = !this.showSafeZone;
        const btn = document.getElementById('btnToggleSafeZone');
        if (btn) {
            btn.classList.toggle('active', this.showSafeZone);
        }
        this.render();
    }

    toggleCanvasSnapping() {
        this.canvasSnapping = !this.canvasSnapping;
        const btn = document.getElementById('btnToggleCanvasSnap');
        if (btn) {
            btn.classList.toggle('active', this.canvasSnapping);
            btn.textContent = this.canvasSnapping ? '🧲 Snappa text' : '🧲 Snapping: Av';
        }
        this.render();
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

        const trackStates = window.timeline?.trackStates || {
            text: { visible: true, locked: false },
            effect: { visible: true, locked: false },
            overlay: { visible: true, locked: false },
            video: { visible: true, locked: false },
            audio: { muted: false, locked: false }
        };

        const activeClips = window.timeline.getActiveClipsAt(this.currentTime);

        // 2. Global Effect Layers (Active clips on effect track)
        const effectClips = (trackStates.effect?.visible !== false)
            ? activeClips.filter(c => c.trackId === 'effect')
            : [];
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
        const videoClips = activeClips.filter(c => {
            if (c.trackId === 'video' && trackStates.video?.visible !== false) return true;
            if (c.trackId === 'overlay' && trackStates.overlay?.visible !== false) return true;
            return false;
        });
        
        // Sort: main video first, overlay on top
        videoClips.sort((a, b) => (a.trackId === 'video' ? -1 : 1));

        const isTextVisible = trackStates.text?.visible !== false;
        const visibleTextClips = isTextVisible ? activeClips.filter(c => c.trackId === 'text') : [];

        if (videoClips.length === 0 && visibleTextClips.length === 0) {
            // Render friendly placeholder when project is empty
            this.renderEmptyPlaceholder();
        }

        videoClips.forEach(clip => {
            this.renderMediaClip(clip, width, height);
        });

        // 4. Render Custom Overlay Effects (e.g. VHS scanlines, Vignette)
        if (trackStates.effect?.visible !== false) {
            customOverlays.forEach(ov => {
                this.renderSpecialOverlay(ov.type, ov.params, width, height);
            });
        }

        // Reset filter for sharp text rendering
        ctx.filter = 'none';

        // 5. Render Text Layers
        if (isTextVisible) {
            visibleTextClips.forEach(clip => {
                this.renderTextClip(clip, width, height);
            });
        }

        // 6. Interactive Selection Gizmo & Snap Guidelines
        if (window.timeline && window.timeline.selectedClipId) {
            const selClip = window.timeline.clips.find(c => c.id === window.timeline.selectedClipId);
            if (selClip && (selClip.trackId === 'text' || selClip.trackId === 'overlay' || selClip.trackId === 'video')) {
                const isTrackVisible = trackStates[selClip.trackId]?.visible !== false;
                const isActive = activeClips.some(c => c.id === selClip.id);
                if (isActive && isTrackVisible) {
                    this.renderSelectionGizmo(selClip, width, height);
                }
            }
        }

        // 7. Safe Zones Overlay (TikTok / Reels / Action & Title Safe)
        if (this.showSafeZone) {
            this.renderSafeZones(width, height);
        }

        ctx.restore();

        // 6. Handle Audio Playback Sync
        this.syncAudioTracks(activeClips);

        // 7. Update Timecode UI
        this.updateTimecodeUI();
    }

    getInterpolatedProperty(clip, propName, fallback = 0) {
        if (!clip) return fallback;
        if (!clip.keyframes || !clip.keyframes[propName] || clip.keyframes[propName].length === 0) {
            return clip[propName] !== undefined ? clip[propName] : fallback;
        }

        const kfs = clip.keyframes[propName];
        const localTime = Math.max(0, Math.min(clip.duration, this.currentTime - clip.startTime));

        if (kfs.length === 1) {
            return kfs[0].value;
        }

        kfs.sort((a, b) => a.time - b.time);

        if (localTime <= kfs[0].time) {
            return kfs[0].value;
        }
        if (localTime >= kfs[kfs.length - 1].time) {
            return kfs[kfs.length - 1].value;
        }

        for (let i = 0; i < kfs.length - 1; i++) {
            const k1 = kfs[i];
            const k2 = kfs[i + 1];
            if (localTime >= k1.time && localTime <= k2.time) {
                const span = k2.time - k1.time;
                if (span <= 0.0001) return k1.value;
                const t = (localTime - k1.time) / span;
                // Cosine smooth easing for silky animations
                const easeT = 0.5 - 0.5 * Math.cos(t * Math.PI);
                return k1.value + (k2.value - k1.value) * easeT;
            }
        }

        return clip[propName] !== undefined ? clip[propName] : fallback;
    }

    getClipInstantaneousSpeed(clip, localTime) {
        if (!clip) return 1.0;
        if (!clip.speedCurve || !clip.speedCurve.points || clip.speedCurve.points.length < 2) {
            return clip.speed || 1.0;
        }

        const duration = Math.max(0.01, clip.duration);
        const u = Math.max(0, Math.min(1.0, localTime / duration));
        const pts = clip.speedCurve.points;

        if (u <= pts[0].pos) return pts[0].speed;
        if (u >= pts[pts.length - 1].pos) return pts[pts.length - 1].speed;

        for (let i = 0; i < pts.length - 1; i++) {
            const p1 = pts[i];
            const p2 = pts[i + 1];
            if (u >= p1.pos && u <= p2.pos) {
                const span = p2.pos - p1.pos;
                if (span <= 0.0001) return p1.speed;
                const x = (u - p1.pos) / span;
                const easeX = 0.5 - 0.5 * Math.cos(x * Math.PI);
                return p1.speed + (p2.speed - p1.speed) * easeX;
            }
        }

        return clip.speed || 1.0;
    }

    getClipSourceTime(clip, localTime) {
        if (!clip) return 0;
        const sourceOffset = clip.sourceOffset || 0;
        if (!clip.speedCurve || !clip.speedCurve.points || clip.speedCurve.points.length < 2) {
            return localTime * (clip.speed || 1.0) + sourceOffset;
        }

        const duration = Math.max(0.01, clip.duration);
        const u = Math.max(0, Math.min(1.0, localTime / duration));
        const pts = clip.speedCurve.points;

        let integral = 0;
        for (let i = 0; i < pts.length - 1; i++) {
            const p1 = pts[i];
            const p2 = pts[i + 1];
            const span = p2.pos - p1.pos;
            if (span <= 0.0001) continue;

            if (u >= p2.pos) {
                integral += span * ((p1.speed + p2.speed) / 2);
            } else if (u > p1.pos) {
                const x = (u - p1.pos) / span;
                const term = p1.speed * x + (p2.speed - p1.speed) * (0.5 * x - (0.5 / Math.PI) * Math.sin(Math.PI * x));
                integral += span * term;
                break;
            } else {
                break;
            }
        }

        if (u < pts[0].pos) {
            integral = u * pts[0].speed;
        } else if (u > pts[pts.length - 1].pos) {
            integral += (u - pts[pts.length - 1].pos) * pts[pts.length - 1].speed;
        }

        return (integral * duration) + sourceOffset;
    }

    renderMediaClip(clip, width, height) {
        const { ctx } = this;
        let mediaEl = this.mediaElements.get(clip.mediaId);

        ctx.save();

        const propPosX = this.getInterpolatedProperty(clip, 'posX', 0);
        const propPosY = this.getInterpolatedProperty(clip, 'posY', 0);
        let scale = this.getInterpolatedProperty(clip, 'scale', 1.0);
        let opacity = this.getInterpolatedProperty(clip, 'opacity', 1.0);
        const rotDeg = this.getInterpolatedProperty(clip, 'rotation', 0);

        let shiftX = 0;
        let shiftY = 0;
        let overlayColor = null;
        let overlayAlpha = 0;
        let glitchActive = false;

        const localTime = Math.max(0, Math.min(clip.duration, this.currentTime - clip.startTime));

        // Transition IN calculation
        if (clip.transitionIn && clip.transitionIn.type && clip.transitionIn.type !== 'none') {
            const dur = Math.max(0.1, clip.transitionIn.duration || 0.5);
            if (localTime < dur) {
                const rawP = Math.max(0, Math.min(1, localTime / dur));
                const p = rawP * rawP * (3 - 2 * rawP); // smoothstep
                const type = clip.transitionIn.type;

                if (type === 'dissolve') {
                    opacity *= p;
                } else if (type === 'dip_black') {
                    overlayColor = '#000000';
                    overlayAlpha = Math.max(overlayAlpha, 1 - p);
                } else if (type === 'dip_white' || type === 'flash') {
                    overlayColor = '#ffffff';
                    overlayAlpha = Math.max(overlayAlpha, (1 - p) * 0.95);
                } else if (type === 'zoom_in') {
                    scale *= (0.65 + 0.35 * p);
                    opacity *= p;
                } else if (type === 'zoom_out') {
                    scale *= (1.35 - 0.35 * p);
                    opacity *= p;
                } else if (type === 'slide_left') {
                    shiftX += width * (1 - p);
                } else if (type === 'slide_right') {
                    shiftX -= width * (1 - p);
                } else if (type === 'glitch') {
                    shiftX += (Math.random() - 0.5) * 35 * (1 - p);
                    shiftY += (Math.random() - 0.5) * 15 * (1 - p);
                    opacity *= (0.6 + 0.4 * p);
                    glitchActive = true;
                }
            }
        }

        // Transition OUT calculation
        if (clip.transitionOut && clip.transitionOut.type && clip.transitionOut.type !== 'none') {
            const dur = Math.max(0.1, clip.transitionOut.duration || 0.5);
            const timeLeft = clip.duration - localTime;
            if (timeLeft < dur) {
                const rawP = Math.max(0, Math.min(1, timeLeft / dur));
                const p = rawP * rawP * (3 - 2 * rawP); // smoothstep
                const type = clip.transitionOut.type;

                if (type === 'dissolve') {
                    opacity *= p;
                } else if (type === 'dip_black') {
                    overlayColor = '#000000';
                    overlayAlpha = Math.max(overlayAlpha, 1 - p);
                } else if (type === 'dip_white' || type === 'flash') {
                    overlayColor = '#ffffff';
                    overlayAlpha = Math.max(overlayAlpha, (1 - p) * 0.95);
                } else if (type === 'zoom_in') {
                    scale *= (1.35 - 0.35 * p);
                    opacity *= p;
                } else if (type === 'zoom_out') {
                    scale *= (0.65 + 0.35 * p);
                    opacity *= p;
                } else if (type === 'slide_left') {
                    shiftX -= width * (1 - p);
                } else if (type === 'slide_right') {
                    shiftX += width * (1 - p);
                } else if (type === 'glitch') {
                    shiftX += (Math.random() - 0.5) * 35 * (1 - p);
                    shiftY += (Math.random() - 0.5) * 15 * (1 - p);
                    opacity *= (0.6 + 0.4 * p);
                    glitchActive = true;
                }
            }
        }

        const posX = propPosX + shiftX + width / 2;
        const posY = propPosY + shiftY + height / 2;
        const rotation = rotDeg * Math.PI / 180;

        ctx.translate(posX, posY);
        ctx.rotate(rotation);
        ctx.scale(scale, scale);
        ctx.globalAlpha = opacity;

        if (clip.blendMode) {
            ctx.globalCompositeOperation = clip.blendMode;
        }

        const clipRelativeTime = this.getClipSourceTime(clip, localTime);
        const currentSpeed = this.getClipInstantaneousSpeed(clip, localTime);

        let drawW = width;
        let drawH = height;

        // Clip Color Grading Filter
        const clipColorFilter = this.getClipColorFilter(clip);
        if (clipColorFilter) {
            ctx.filter = (ctx.filter && ctx.filter !== 'none') ? `${ctx.filter} ${clipColorFilter}` : clipColorFilter;
        }

        // Video Masking (Circle / Rectangle / Linear / Mirror)
        const hasMask = clip.mask && clip.mask.type && clip.mask.type !== 'none';
        if (hasMask) {
            ctx.save();
            this.applyClipMask(ctx, clip.mask, width, height);
        }

        if (mediaEl && mediaEl.tagName === 'VIDEO') {
            const isVideoMuted = window.timeline?.trackStates?.[clip.trackId]?.muted || false;
            mediaEl.volume = isVideoMuted ? 0 : Math.min(1.0, this.getClipAudioVolume(clip, localTime, []));
            mediaEl.preservesPitch = clip.preservesPitch !== false;
            mediaEl.playbackRate = Math.max(0.1, Math.min(16, currentSpeed));
            
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
            drawW = width;
            drawH = width / aspect;
            if (drawH < height) {
                drawH = height;
                drawW = height * aspect;
            }

            if (clip.borderRadius && !hasMask) {
                ctx.save();
                ctx.beginPath();
                ctx.roundRect(-drawW / 2, -drawH / 2, drawW, drawH, clip.borderRadius);
                ctx.clip();
            }

            if (clip.chromaKey && clip.chromaKey.enabled) {
                const chromaCanvas = this.processChromaKey(mediaEl, drawW, drawH, clip.chromaKey);
                ctx.drawImage(chromaCanvas, -drawW / 2, -drawH / 2, drawW, drawH);
            } else {
                ctx.drawImage(mediaEl, -drawW / 2, -drawH / 2, drawW, drawH);
            }

            if (clip.borderRadius && !hasMask) {
                ctx.restore();
            }

        } else if (mediaEl && mediaEl.tagName === 'IMG') {
            drawW = mediaEl.naturalWidth || width;
            drawH = mediaEl.naturalHeight || height;

            if (clip.borderRadius && !hasMask) {
                ctx.save();
                ctx.beginPath();
                ctx.roundRect(-drawW / 2, -drawH / 2, drawW, drawH, clip.borderRadius);
                ctx.clip();
            }

            if (clip.chromaKey && clip.chromaKey.enabled) {
                const chromaCanvas = this.processChromaKey(mediaEl, drawW, drawH, clip.chromaKey);
                ctx.drawImage(chromaCanvas, -drawW / 2, -drawH / 2, drawW, drawH);
            } else {
                ctx.drawImage(mediaEl, -drawW / 2, -drawH / 2, drawW, drawH);
            }

            if (clip.borderRadius && !hasMask) {
                ctx.restore();
            }
        } else if (clip.isSticker && window.stickersManager) {
            drawW = clip.stickerWidth || 240;
            drawH = clip.stickerHeight || 160;
            window.stickersManager.renderSticker(ctx, clip.stickerId, drawW, drawH, localTime);
        } else {
            // Generated Demo Pattern (e.g. Cyberpunk Grid & Moving Orb)
            this.renderProceduralDemo(clip, width, height);
        }

        // Close Mask Clip Path
        if (hasMask) {
            ctx.restore();
        }

        // PiP Border & Drop Shadow (Gaming Facecam frame)
        if (clip.borderWidth || clip.pipShadow) {
            ctx.save();
            ctx.strokeStyle = clip.borderWidth ? (clip.borderColor || '#00d482') : 'rgba(0, 0, 0, 0.4)';
            ctx.lineWidth = clip.borderWidth || 1;
            if (clip.pipShadow) {
                ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
                ctx.shadowBlur = 22;
                ctx.shadowOffsetX = 4;
                ctx.shadowOffsetY = 6;
            }

            if (clip.mask && clip.mask.type === 'circle') {
                const radius = (clip.mask.size || 500) / 2;
                ctx.beginPath();
                ctx.arc(0, 0, radius, 0, Math.PI * 2);
                ctx.stroke();
            } else if (clip.mask && clip.mask.type === 'rectangle') {
                const mw = clip.mask.width || 800;
                const mh = clip.mask.height || 600;
                const round = clip.mask.roundness || 0;
                ctx.beginPath();
                ctx.roundRect(-mw / 2, -mh / 2, mw, mh, round);
                ctx.stroke();
            } else {
                const round = clip.borderRadius || 0;
                ctx.beginPath();
                ctx.roundRect(-drawW / 2, -drawH / 2, drawW, drawH, round);
                ctx.stroke();
            }
            ctx.restore();
        }

        // Color Grading Overlays (Warm/Cold Temperature, Tint, Vignette)
        this.renderClipColorGradingOverlays(ctx, clip, drawW, drawH);

        // Render transition glitch RGB chromatic shift
        if (glitchActive && mediaEl) {
            ctx.save();
            ctx.globalCompositeOperation = 'screen';
            ctx.globalAlpha = 0.5;
            ctx.drawImage(mediaEl, -drawW / 2 + 10, -drawH / 2, drawW, drawH);
            ctx.restore();
        }

        // Render transition overlay (e.g. Dip to Black / White Flash)
        if (overlayColor && overlayAlpha > 0.01) {
            ctx.save();
            ctx.fillStyle = overlayColor;
            ctx.globalAlpha = overlayAlpha;
            ctx.fillRect(-drawW / 2, -drawH / 2, drawW, drawH);
            ctx.restore();
        }

        ctx.restore();
    }

    getClipColorFilter(clip) {
        const filters = [];

        // Brightness / Exposure (-50% to +50%)
        if (clip.brightness !== undefined && clip.brightness !== 0) {
            filters.push(`brightness(${Math.round(100 + clip.brightness)}%)`);
        }
        // Contrast (50% to 200%)
        if (clip.contrast !== undefined && clip.contrast !== 100) {
            filters.push(`contrast(${Math.round(clip.contrast)}%)`);
        }
        // Saturation (0% to 200%)
        if (clip.saturation !== undefined && clip.saturation !== 100) {
            filters.push(`saturate(${Math.round(clip.saturation)}%)`);
        }
        // Custom preset filters (e.g. Noir, Vintage, Cyberpunk, Sunset)
        if (clip.colorPreset === 'noir') {
            filters.push('grayscale(100%) contrast(140%) brightness(95%)');
        } else if (clip.colorPreset === 'teal_orange') {
            filters.push('contrast(120%) saturate(115%)');
        } else if (clip.colorPreset === 'cyberpunk') {
            filters.push('hue-rotate(290deg) contrast(130%) saturate(140%)');
        } else if (clip.colorPreset === 'vintage') {
            filters.push('sepia(35%) contrast(110%) saturate(85%) brightness(105%)');
        } else if (clip.colorPreset === 'sunset') {
            filters.push('sepia(25%) saturate(135%) contrast(115%)');
        }

        return filters.length > 0 ? filters.join(' ') : '';
    }

    renderClipColorGradingOverlays(ctx, clip, drawW, drawH) {
        // Temperature (Warm / Cold)
        if (clip.temperature && Math.abs(clip.temperature) > 1) {
            ctx.save();
            ctx.globalCompositeOperation = 'color';
            if (clip.temperature > 0) {
                // Warm Golden Amber
                ctx.fillStyle = 'rgb(255, 160, 20)';
                ctx.globalAlpha = Math.min(0.45, (clip.temperature / 100) * 0.38);
            } else {
                // Cold Cyan / Blue
                ctx.fillStyle = 'rgb(30, 160, 255)';
                ctx.globalAlpha = Math.min(0.45, (Math.abs(clip.temperature) / 100) * 0.38);
            }
            ctx.fillRect(-drawW / 2, -drawH / 2, drawW, drawH);
            ctx.restore();
        }

        // Tint (Green / Magenta)
        if (clip.tint && Math.abs(clip.tint) > 1) {
            ctx.save();
            ctx.globalCompositeOperation = 'color';
            if (clip.tint > 0) {
                // Magenta
                ctx.fillStyle = 'rgb(255, 40, 180)';
                ctx.globalAlpha = Math.min(0.4, (clip.tint / 100) * 0.3);
            } else {
                // Green
                ctx.fillStyle = 'rgb(40, 255, 100)';
                ctx.globalAlpha = Math.min(0.4, (Math.abs(clip.tint) / 100) * 0.3);
            }
            ctx.fillRect(-drawW / 2, -drawH / 2, drawW, drawH);
            ctx.restore();
        }

        // Vignette
        if (clip.vignette && clip.vignette > 0) {
            ctx.save();
            const rad = Math.max(drawW, drawH) * 0.65;
            const grad = ctx.createRadialGradient(0, 0, rad * 0.3, 0, 0, rad);
            grad.addColorStop(0, 'transparent');
            grad.addColorStop(1, `rgba(0, 0, 0, ${Math.min(0.9, (clip.vignette / 100) * 0.85)})`);
            ctx.fillStyle = grad;
            ctx.fillRect(-drawW / 2, -drawH / 2, drawW, drawH);
            ctx.restore();
        }
    }

    applyClipMask(ctx, mask, drawW, drawH) {
        if (!mask || !mask.type || mask.type === 'none') return;

        const type = mask.type;
        const inverted = !!mask.inverted;

        if (type === 'circle') {
            const size = mask.size !== undefined ? mask.size : Math.min(drawW, drawH) * 0.7;
            const r = Math.max(10, size / 2);
            const cx = mask.x || 0;
            const cy = mask.y || 0;

            ctx.beginPath();
            if (inverted) {
                ctx.rect(-drawW, -drawH, drawW * 2, drawH * 2);
                ctx.arc(cx, cy, r, 0, Math.PI * 2, true);
                ctx.clip('evenodd');
            } else {
                ctx.arc(cx, cy, r, 0, Math.PI * 2);
                ctx.clip();
            }
        } else if (type === 'rectangle') {
            const mw = mask.width !== undefined ? mask.width : drawW * 0.75;
            const mh = mask.height !== undefined ? mask.height : drawH * 0.75;
            const cx = mask.x || 0;
            const cy = mask.y || 0;
            const cr = mask.roundness || 0;

            ctx.beginPath();
            if (inverted) {
                ctx.rect(-drawW, -drawH, drawW * 2, drawH * 2);
                if (typeof ctx.roundRect === 'function') {
                    ctx.roundRect(cx - mw / 2, cy - mh / 2, mw, mh, cr);
                } else {
                    ctx.rect(cx - mw / 2, cy - mh / 2, mw, mh);
                }
                ctx.clip('evenodd');
            } else {
                if (typeof ctx.roundRect === 'function') {
                    ctx.roundRect(cx - mw / 2, cy - mh / 2, mw, mh, cr);
                } else {
                    ctx.rect(cx - mw / 2, cy - mh / 2, mw, mh);
                }
                ctx.clip();
            }
        } else if (type === 'linear') {
            const angle = (mask.rotation || 0) * Math.PI / 180;
            const pos = mask.pos || 0;
            const diag = Math.sqrt(drawW * drawW + drawH * drawH);

            ctx.beginPath();
            ctx.save();
            ctx.rotate(angle);
            if (inverted) {
                ctx.rect(-diag, pos, diag * 2, diag);
            } else {
                ctx.rect(-diag, -diag + pos, diag * 2, diag);
            }
            ctx.restore();
            ctx.clip();
        } else if (type === 'mirror') {
            const size = mask.size !== undefined ? mask.size : 200;
            const half = size / 2;
            ctx.beginPath();
            if (inverted) {
                ctx.rect(-drawW, -drawH, drawW * 2, drawH - half);
                ctx.rect(-drawW, half, drawW * 2, drawH);
            } else {
                ctx.rect(-drawW, -half, drawW * 2, size);
            }
            ctx.clip();
        }
    }

    processChromaKey(sourceEl, drawW, drawH, chromaKey) {
        if (!this.chromaCanvas) {
            this.chromaCanvas = document.createElement('canvas');
            this.chromaCtx = this.chromaCanvas.getContext('2d', { willReadFrequently: true });
        }

        // Keep internal resolution efficient
        const targetW = Math.min(1280, Math.max(160, Math.round(drawW)));
        const targetH = Math.min(720, Math.max(90, Math.round(drawH)));

        if (this.chromaCanvas.width !== targetW || this.chromaCanvas.height !== targetH) {
            this.chromaCanvas.width = targetW;
            this.chromaCanvas.height = targetH;
        }

        const cctx = this.chromaCtx;
        cctx.clearRect(0, 0, targetW, targetH);
        cctx.drawImage(sourceEl, 0, 0, targetW, targetH);

        const imgData = cctx.getImageData(0, 0, targetW, targetH);
        const data = imgData.data;

        // Parse key color
        const hex = (chromaKey.color || '#00ff00').replace('#', '');
        const kr = parseInt(hex.substring(0, 2), 16) || 0;
        const kg = parseInt(hex.substring(2, 4), 16) || 255;
        const kb = parseInt(hex.substring(4, 6), 16) || 0;

        const tolerance = (chromaKey.tolerance !== undefined ? chromaKey.tolerance : 35) * 4.4;
        const smooth = Math.max(1, (chromaKey.smooth !== undefined ? chromaKey.smooth : 10) * 3.0);
        const spill = (chromaKey.spill !== undefined ? chromaKey.spill : 40) / 100;

        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];

            // Euclidean distance in RGB color space
            const dr = r - kr;
            const dg = g - kg;
            const db = b - kb;
            const dist = Math.sqrt(dr * dr + dg * dg + db * db);

            if (dist < tolerance) {
                // Keyed out (transparent)
                data[i + 3] = 0;
            } else if (dist < tolerance + smooth) {
                // Smooth falloff boundary
                const alphaFactor = (dist - tolerance) / smooth;
                data[i + 3] = Math.round(data[i + 3] * alphaFactor);
            }

            // Green / Blue spill suppression on semi-transparent and opaque pixels
            if (data[i + 3] > 0 && spill > 0) {
                if (kg > kr && kg > kb) {
                    const maxG = (r + b) / 2;
                    if (g > maxG) {
                        data[i + 1] = Math.round(g * (1 - spill) + maxG * spill);
                    }
                } else if (kb > kr && kb > kg) {
                    const maxB = (r + g) / 2;
                    if (b > maxB) {
                        data[i + 2] = Math.round(b * (1 - spill) + maxB * spill);
                    }
                }
            }
        }

        cctx.putImageData(imgData, 0, 0);
        return this.chromaCanvas;
    }

    startColorPicker(callback) {
        const prevCursor = this.canvas.style.cursor;
        this.canvas.style.cursor = 'crosshair';

        const onClick = (e) => {
            e.stopPropagation();
            e.preventDefault();
            this.canvas.removeEventListener('click', onClick, { capture: true });
            this.canvas.style.cursor = prevCursor;

            const pt = this.getCanvasCoordinates(e);
            try {
                const pixel = this.ctx.getImageData(Math.round(pt.x), Math.round(pt.y), 1, 1).data;
                const r = pixel[0].toString(16).padStart(2, '0');
                const g = pixel[1].toString(16).padStart(2, '0');
                const b = pixel[2].toString(16).padStart(2, '0');
                const hexColor = `#${r}${g}${b}`;
                if (typeof callback === 'function') callback(hexColor);
            } catch (err) {
                console.warn('[Engine] Color picker read error:', err);
            }
        };

        this.canvas.addEventListener('click', onClick, { capture: true, once: true });
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

        // Animated neon orb synced with speed-ramped time
        const localTime = Math.max(0, Math.min(clip.duration, this.currentTime - clip.startTime));
        const t = this.getClipSourceTime(clip, localTime);
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

        const propPosX = this.getInterpolatedProperty(clip, 'posX', 0);
        const propPosY = this.getInterpolatedProperty(clip, 'posY', 0);
        const scale = this.getInterpolatedProperty(clip, 'scale', 1.0);
        const opacity = this.getInterpolatedProperty(clip, 'opacity', 1.0);
        const rotDeg = this.getInterpolatedProperty(clip, 'rotation', 0);

        const x = propPosX + width / 2;
        const y = propPosY + height / 2;
        const rotation = rotDeg * Math.PI / 180;

        ctx.translate(x, y);
        ctx.rotate(rotation);
        ctx.scale(scale, scale);
        ctx.globalAlpha = opacity;

        // Text Motion Presets & In-Animations
        const animType = clip.textAnim || (clip.captionStyle === 'pop' ? 'pop' : 'none');
        const animDur = clip.textAnimDuration !== undefined ? clip.textAnimDuration : 0.8;
        const localTime = Math.max(0, Math.min(clip.duration, this.currentTime - clip.startTime));
        let displayText = clip.text || 'NovaCut';

        if (animType === 'typewriter') {
            const fullText = displayText;
            const progress = Math.min(1.0, localTime / animDur);
            const charsToShow = Math.floor(progress * fullText.length);
            const isTyping = progress < 1.0;
            const blink = Math.floor(localTime * 4) % 2 === 0;
            displayText = fullText.substring(0, charsToShow) + (isTyping && blink ? '▎' : '');
        } else if (animType === 'pop' || animType === 'bounce') {
            if (localTime < animDur) {
                const p = localTime / animDur;
                const popScale = 1.0 + Math.sin(p * Math.PI) * 0.35 * (1 - p * 0.5);
                ctx.scale(popScale, popScale);
            }
        } else if (animType === 'slide_up') {
            if (localTime < animDur) {
                const p = localTime / animDur;
                const ease = 1 - Math.pow(1 - p, 3);
                ctx.translate(0, (1 - ease) * 60);
                ctx.globalAlpha *= ease;
            }
        } else if (animType === 'flip_in') {
            if (localTime < animDur) {
                const p = localTime / animDur;
                const sY = Math.sin(p * Math.PI * 0.5);
                ctx.scale(1.0, Math.max(0.01, sY));
                ctx.globalAlpha *= Math.min(1.0, p * 2);
            }
        } else if (animType === 'zoom_pulse') {
            const pulse = 1.0 + Math.sin(localTime * 3.5) * 0.05;
            ctx.scale(pulse, pulse);
        } else if (animType === 'glitch') {
            const isGlitching = Math.sin(localTime * 14) > 0.75;
            if (isGlitching) {
                ctx.translate(Math.sin(localTime * 33) * 6, Math.cos(localTime * 45) * 3);
            }
        }

        const fontSize = clip.fontSize || 64;
        const fontFamily = clip.fontFamily || 'sans-serif';
        const fontWeight = clip.bold ? 'bold ' : '600 ';
        const fontStyle = clip.italic ? 'italic ' : '';

        ctx.font = `${fontStyle}${fontWeight}${fontSize}px ${fontFamily}`;
        ctx.textAlign = clip.align || 'center';
        ctx.textBaseline = 'middle';

        const lines = displayText.split('\n');
        const lineHeight = fontSize * 1.2;
        const totalHeight = lines.length * lineHeight;
        const startY = -(totalHeight / 2) + (lineHeight / 2);

        // Background box if defined
        if (clip.bgColor) {
            let maxW = 0;
            lines.forEach(line => {
                const w = ctx.measureText(line).width;
                if (w > maxW) maxW = w;
            });
            const padX = clip.bgPadX !== undefined ? clip.bgPadX : 24;
            const padY = clip.bgPadY !== undefined ? clip.bgPadY : 14;
            const roundness = clip.bgRoundness !== undefined ? clip.bgRoundness : 8;
            const boxW = maxW + padX * 2;
            const boxH = totalHeight + padY * 2;

            let boxX = -boxW / 2;
            if (clip.align === 'left') boxX = -padX;
            else if (clip.align === 'right') boxX = -maxW - padX;

            ctx.fillStyle = clip.bgColor;
            ctx.beginPath();
            ctx.roundRect(boxX, -boxH / 2, boxW, boxH, roundness);
            ctx.fill();
        }

        // Shadow & Glow Calculation
        const isNeonPulse = (animType === 'neon_pulse');
        const hasCustomGlow = clip.hasGlow || isNeonPulse;
        const hasCustomShadow = clip.hasShadow;

        let dynamicShadowBlur = 0;
        let dynamicShadowColor = 'transparent';

        if (isNeonPulse) {
            dynamicShadowBlur = 12 + Math.round((Math.sin(localTime * 5.0) + 1) * 14);
            dynamicShadowColor = clip.glowColor || '#00f2fe';
        } else if (hasCustomGlow) {
            dynamicShadowBlur = clip.glowBlur !== undefined ? clip.glowBlur : 22;
            dynamicShadowColor = clip.glowColor || '#00f2fe';
        } else if (hasCustomShadow) {
            dynamicShadowBlur = clip.shadowBlur !== undefined ? clip.shadowBlur : 12;
            dynamicShadowColor = clip.shadowColor || 'rgba(0, 0, 0, 0.85)';
        } else if (!clip.outlineColor) {
            dynamicShadowBlur = 12;
            dynamicShadowColor = 'rgba(0, 0, 0, 0.8)';
        }

        const outlineWidth = clip.outlineWidth !== undefined ? clip.outlineWidth : (clip.captionStyle === 'hormozi' ? 8 : 6);

        // Word-by-word viral highlight (Karaoke / Hormozi)
        const isKaraokeOrHormozi = (clip.captionStyle === 'karaoke' || clip.captionStyle === 'hormozi');

        lines.forEach((line, index) => {
            const lineY = startY + index * lineHeight;
            const words = line.trim().split(/\s+/);

            if (isKaraokeOrHormozi && words.length > 1) {
                const progress = localTime / clip.duration;
                const activeWordIdx = Math.min(words.length - 1, Math.floor(progress * words.length));

                // Measure words
                let totalWidth = 0;
                const spaceW = ctx.measureText(' ').width;
                const wordWidths = words.map(w => {
                    const mw = ctx.measureText(w).width;
                    totalWidth += mw;
                    return mw;
                });
                totalWidth += spaceW * (words.length - 1);

                let startX = -totalWidth / 2;
                if (clip.align === 'left') startX = 0;
                else if (clip.align === 'right') startX = -totalWidth;

                let curX = startX;
                words.forEach((word, wIdx) => {
                    const wWidth = wordWidths[wIdx];
                    const isActive = (wIdx === activeWordIdx);
                    const isPast = (wIdx < activeWordIdx);
                    const wordCenterX = curX + wWidth / 2;

                    ctx.save();
                    if (isActive) {
                        ctx.fillStyle = clip.highlightColor || (clip.captionStyle === 'hormozi' ? '#ffd000' : '#00d482');
                        ctx.shadowColor = clip.highlightColor || (clip.captionStyle === 'hormozi' ? '#ffd000' : '#00d482');
                        ctx.shadowBlur = 14;
                    } else if (isPast) {
                        ctx.fillStyle = clip.color || '#ffffff';
                    } else {
                        ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
                    }

                    if (clip.outlineColor) {
                        ctx.strokeStyle = clip.outlineColor;
                        ctx.lineWidth = outlineWidth;
                        ctx.strokeText(word, wordCenterX, lineY);
                    }

                    ctx.fillText(word, wordCenterX, lineY);
                    ctx.restore();

                    curX += wWidth + spaceW;
                });
            } else {
                // Standard rendering
                if (dynamicShadowBlur > 0) {
                    ctx.shadowColor = dynamicShadowColor;
                    ctx.shadowBlur = dynamicShadowBlur;
                    ctx.shadowOffsetX = (hasCustomShadow && !isNeonPulse && !hasCustomGlow) ? (clip.shadowOffsetX || 2) : 0;
                    ctx.shadowOffsetY = (hasCustomShadow && !isNeonPulse && !hasCustomGlow) ? (clip.shadowOffsetY || 4) : 0;
                } else {
                    ctx.shadowColor = 'transparent';
                    ctx.shadowBlur = 0;
                }

                if (clip.outlineColor) {
                    ctx.strokeStyle = clip.outlineColor;
                    ctx.lineWidth = outlineWidth;
                    ctx.strokeText(line, 0, lineY);
                }

                ctx.fillStyle = clip.color || '#ffffff';
                ctx.fillText(line, 0, lineY);

                // Chromatic Glitch Shift
                if (animType === 'glitch' && Math.sin(localTime * 14) > 0.75) {
                    ctx.save();
                    ctx.globalCompositeOperation = 'screen';
                    ctx.fillStyle = '#ff0055';
                    ctx.fillText(line, -4, lineY);
                    ctx.fillStyle = '#00ffff';
                    ctx.fillText(line, 4, lineY);
                    ctx.restore();
                }
            }
        });

        ctx.restore();
    }

    getTextBounds(clip, width, height) {
        const { ctx } = this;
        const propPosX = this.getInterpolatedProperty(clip, 'posX', 0);
        const propPosY = this.getInterpolatedProperty(clip, 'posY', 0);
        const scale = this.getInterpolatedProperty(clip, 'scale', 1.0);
        const x = propPosX + width / 2;
        const y = propPosY + height / 2;
        const fontSize = (clip.fontSize || 64) * scale;
        const fontFamily = clip.fontFamily || 'sans-serif';
        const fontWeight = clip.bold ? 'bold ' : '600 ';
        const fontStyle = clip.italic ? 'italic ' : '';

        ctx.save();
        ctx.font = `${fontStyle}${fontWeight}${fontSize}px ${fontFamily}`;
        const text = clip.text || 'NovaCut';
        const lines = text.split('\n');
        let maxW = 0;
        lines.forEach(line => {
            const w = ctx.measureText(line).width;
            if (w > maxW) maxW = w;
        });
        const lineHeight = fontSize * 1.2;
        const totalHeight = lines.length * lineHeight;
        const padX = 24 * scale;
        const padY = 16 * scale;
        const boxW = Math.max(50 * scale, maxW) + padX * 2;
        const boxH = Math.max(40 * scale, totalHeight) + padY * 2;
        ctx.restore();

        let left = x - boxW / 2;
        if (clip.align === 'left') {
            left = x - padX;
        } else if (clip.align === 'right') {
            left = x - maxW - padX;
        }
        const top = y - boxH / 2;

        return {
            left,
            top,
            width: boxW,
            height: boxH,
            right: left + boxW,
            bottom: top + boxH,
            centerX: left + boxW / 2,
            centerY: top + boxH / 2
        };
    }

    getClipBounds(clip) {
        if (!clip) return null;
        if (clip.trackId === 'text') {
            return this.getTextBounds(clip, this.canvas.width, this.canvas.height);
        }
        if (clip.trackId === 'overlay' || clip.trackId === 'video' || clip.trackId === 'image') {
            const propPosX = this.getInterpolatedProperty(clip, 'posX', 0);
            const propPosY = this.getInterpolatedProperty(clip, 'posY', 0);
            const scale = this.getInterpolatedProperty(clip, 'scale', 1.0);
            const x = propPosX + this.canvas.width / 2;
            const y = propPosY + this.canvas.height / 2;
            const mediaEl = this.mediaElements.get(clip.mediaId);
            const w = (clip.isSticker ? (clip.stickerWidth || 240) : (mediaEl?.videoWidth || mediaEl?.naturalWidth || 600)) * scale;
            const h = (clip.isSticker ? (clip.stickerHeight || 160) : (mediaEl?.videoHeight || mediaEl?.naturalHeight || 400)) * scale;
            return {
                left: x - w / 2,
                top: y - h / 2,
                width: w,
                height: h,
                right: x + w / 2,
                bottom: y + h / 2,
                centerX: x,
                centerY: y
            };
        }
        if (clip.trackId === 'effect') {
            const x = (clip.posX || 0) + this.canvas.width / 2;
            const y = (clip.posY || 0) + this.canvas.height / 2;
            const r = 100;
            return {
                left: x - r,
                top: y - r,
                width: r * 2,
                height: r * 2,
                right: x + r,
                bottom: y + r,
                centerX: x,
                centerY: y
            };
        }
        return null;
    }

    getCanvasCoordinates(e) {
        const rect = this.canvas.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return { x: 0, y: 0 };
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY
        };
    }

    initCanvasInteractions() {
        this.isDraggingClip = false;
        this.dragTarget = null;
        this.dragStartPos = { x: 0, y: 0 };
        this.dragClipStart = { posX: 0, posY: 0 };
        this.snappedX = false;
        this.snappedY = false;

        this.canvas.addEventListener('mousedown', (e) => {
            if (e.button !== 0) return;
            const pt = this.getCanvasCoordinates(e);

            if (!window.timeline) return;
            const activeClips = window.timeline.getActiveClipsAt(this.currentTime);

            // 1. Check currently selected clip first
            if (window.timeline.selectedClipId) {
                const sel = window.timeline.clips.find(c => c.id === window.timeline.selectedClipId);
                if (sel && activeClips.some(c => c.id === sel.id)) {
                    const b = this.getClipBounds(sel);
                    if (b && pt.x >= b.left && pt.x <= b.right && pt.y >= b.top && pt.y <= b.bottom) {
                        this.startDraggingClip(sel, pt);
                        return;
                    }
                }
            }

            // 2. Check active text clips (topmost first)
            const textClips = activeClips.filter(c => c.trackId === 'text').slice().reverse();
            for (const clip of textClips) {
                const b = this.getTextBounds(clip, this.canvas.width, this.canvas.height);
                if (pt.x >= b.left && pt.x <= b.right && pt.y >= b.top && pt.y <= b.bottom) {
                    window.timeline.selectClip(clip.id);
                    this.startDraggingClip(clip, pt);
                    return;
                }
            }

            // 3. Check active overlay clips
            const overlayClips = activeClips.filter(c => c.trackId === 'overlay').slice().reverse();
            for (const clip of overlayClips) {
                const b = this.getClipBounds(clip);
                if (b && pt.x >= b.left && pt.x <= b.right && pt.y >= b.top && pt.y <= b.bottom) {
                    window.timeline.selectClip(clip.id);
                    this.startDraggingClip(clip, pt);
                    return;
                }
            }
        });

        window.addEventListener('mousemove', (e) => {
            if (this.isDraggingClip && this.dragTarget) {
                const pt = this.getCanvasCoordinates(e);
                const dx = pt.x - this.dragStartPos.x;
                const dy = pt.y - this.dragStartPos.y;

                const rawX = this.dragClipStart.posX + dx;
                const rawY = this.dragClipStart.posY + dy;

                const snapResult = this.calculateCanvasSnapping(this.dragTarget, rawX, rawY, e.altKey);
                this.activeSnapGuides = snapResult.guides;

                this.dragTarget.posX = Math.round(snapResult.x);
                this.dragTarget.posY = Math.round(snapResult.y);

                if (window.inspector && typeof window.inspector.updatePositionInputs === 'function') {
                    window.inspector.updatePositionInputs(this.dragTarget.posX, this.dragTarget.posY);
                }

                this.render();
                return;
            }

            // Hover state cursor changes
            const rect = this.canvas.getBoundingClientRect();
            if (e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom) {
                const pt = this.getCanvasCoordinates(e);
                if (window.timeline) {
                    const activeClips = window.timeline.getActiveClipsAt(this.currentTime);
                    const isHovering = activeClips.some(c => {
                        if (c.trackId === 'text' || (window.timeline.selectedClipId === c.id && (c.trackId === 'overlay' || c.trackId === 'effect'))) {
                            const b = this.getClipBounds(c);
                            return b && pt.x >= b.left && pt.x <= b.right && pt.y >= b.top && pt.y <= b.bottom;
                        }
                        return false;
                    });
                    this.canvas.style.cursor = isHovering ? 'move' : 'default';
                }
            }
        });

        window.addEventListener('mouseup', () => {
            if (this.isDraggingClip) {
                this.isDraggingClip = false;
                this.dragTarget = null;
                this.activeSnapGuides = [];
                this.canvas.style.cursor = 'default';
                this.render();
            }
        });
    }

    startDraggingClip(clip, pt) {
        this.isDraggingClip = true;
        this.dragTarget = clip;
        this.activeSnapGuides = [];
        this.dragStartPos = { x: pt.x, y: pt.y };
        this.dragClipStart = {
            posX: clip.posX || 0,
            posY: clip.posY || 0
        };
        this.canvas.style.cursor = 'grabbing';
        this.render();
    }

    calculateCanvasSnapping(clip, targetX, targetY, isAltPressed) {
        // If snapping is turned off globally or Alt is held, allow free dragging
        if (!this.canvasSnapping || isAltPressed) {
            return { x: targetX, y: targetY, guides: [] };
        }

        // Motionleap style: Effects are ALWAYS placed with 100% freeform precision, NO SNAPPING!
        if (clip.trackId === 'effect' || clip.isEffect || clip.overlayType) {
            return { x: targetX, y: targetY, guides: [] };
        }

        const threshold = 14; // High precision snap window (~14 canvas pixels)
        let snappedX = targetX;
        let snappedY = targetY;
        const guides = [];

        // 1. Horizontal X Snap Targets
        const xTargets = [
            { val: 0, label: 'Mitten X (Centrerad)', color: '#00f2fe' },
            { val: Math.round(-this.canvas.width / 6), label: 'Tredjedel Vänster', color: 'rgba(0, 242, 254, 0.75)' },
            { val: Math.round(this.canvas.width / 6), label: 'Tredjedel Höger', color: 'rgba(0, 242, 254, 0.75)' }
        ];

        // 2. Vertical Y Snap Targets
        const yTargets = [
            { val: 0, label: 'Mitten Y (Centrerad)', color: '#00f2fe' },
            { val: 380, label: 'Undertext / Captions (+380)', color: '#00f2fe' },
            { val: -320, label: 'Topprubrik / Banner (-320)', color: '#00f2fe' },
            { val: Math.round(-this.canvas.height / 6), label: 'Tredjedel Topp', color: 'rgba(0, 242, 254, 0.75)' },
            { val: Math.round(this.canvas.height / 6), label: 'Tredjedel Botten', color: 'rgba(0, 242, 254, 0.75)' }
        ];

        // 3. Cross-Clip Alignment (Placera text på exakt samma ställe om och om igen!)
        if (window.timeline && window.timeline.clips) {
            window.timeline.clips.forEach(other => {
                if (other.id !== clip.id && other.trackId === clip.trackId) {
                    if (other.posX !== undefined) {
                        xTargets.push({
                            val: other.posX,
                            label: `Matchar "${other.title || other.text || 'Text'}" (X: ${other.posX > 0 ? '+' : ''}${other.posX})`,
                            color: '#fbbf24',
                            isCrossClip: true
                        });
                    }
                    if (other.posY !== undefined) {
                        yTargets.push({
                            val: other.posY,
                            label: `Matchar "${other.title || other.text || 'Text'}" (Y: ${other.posY > 0 ? '+' : ''}${other.posY})`,
                            color: '#fbbf24',
                            isCrossClip: true
                        });
                    }
                }
            });
        }

        // Find closest X match
        let bestDiffX = threshold + 1;
        let bestSnapX = null;
        for (const t of xTargets) {
            const diff = Math.abs(targetX - t.val);
            if (diff <= threshold && diff < bestDiffX) {
                bestDiffX = diff;
                bestSnapX = t;
            }
        }
        if (bestSnapX !== null) {
            snappedX = bestSnapX.val;
            guides.push({
                type: 'x',
                canvasPos: this.canvas.width / 2 + bestSnapX.val,
                label: bestSnapX.label,
                color: bestSnapX.color,
                isCrossClip: !!bestSnapX.isCrossClip
            });
        }

        // Find closest Y match
        let bestDiffY = threshold + 1;
        let bestSnapY = null;
        for (const t of yTargets) {
            const diff = Math.abs(targetY - t.val);
            if (diff <= threshold && diff < bestDiffY) {
                bestDiffY = diff;
                bestSnapY = t;
            }
        }
        if (bestSnapY !== null) {
            snappedY = bestSnapY.val;
            guides.push({
                type: 'y',
                canvasPos: this.canvas.height / 2 + bestSnapY.val,
                label: bestSnapY.label,
                color: bestSnapY.color,
                isCrossClip: !!bestSnapY.isCrossClip
            });
        }

        return { x: snappedX, y: snappedY, guides };
    }

    renderSelectionGizmo(clip, width, height) {
        const { ctx } = this;
        if (!clip) return;

        const bounds = this.getClipBounds(clip);
        if (!bounds) return;

        ctx.save();

        // 1. Magnetic Snapping Guidelines & Floating Badges
        if (this.activeSnapGuides && this.activeSnapGuides.length > 0) {
            this.activeSnapGuides.forEach(guide => {
                ctx.save();
                ctx.strokeStyle = guide.color || '#00f2fe';
                ctx.lineWidth = 2.0;
                ctx.setLineDash([10, 6]);
                ctx.shadowColor = guide.color || '#00f2fe';
                ctx.shadowBlur = 8;

                if (guide.type === 'x') {
                    ctx.beginPath();
                    ctx.moveTo(guide.canvasPos, 0);
                    ctx.lineTo(guide.canvasPos, height);
                    ctx.stroke();

                    // Snap indicator badge at top
                    ctx.setLineDash([]);
                    ctx.shadowBlur = 0;
                    ctx.font = 'bold 18px -apple-system, BlinkMacSystemFont, sans-serif';
                    const text = `🧲 ${guide.label}`;
                    const tw = ctx.measureText(text).width + 24;
                    const badgeX = Math.max(12, Math.min(width - tw - 12, guide.canvasPos - tw / 2));
                    ctx.fillStyle = 'rgba(11, 12, 16, 0.92)';
                    ctx.strokeStyle = guide.color || '#00f2fe';
                    ctx.lineWidth = 1.5;
                    ctx.beginPath();
                    ctx.roundRect(badgeX, 16, tw, 32, 6);
                    ctx.fill();
                    ctx.stroke();

                    ctx.fillStyle = guide.color || '#00f2fe';
                    ctx.textAlign = 'left';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(text, badgeX + 12, 32);

                } else if (guide.type === 'y') {
                    ctx.beginPath();
                    ctx.moveTo(0, guide.canvasPos);
                    ctx.lineTo(width, guide.canvasPos);
                    ctx.stroke();

                    // Snap indicator badge on left
                    ctx.setLineDash([]);
                    ctx.shadowBlur = 0;
                    ctx.font = 'bold 18px -apple-system, BlinkMacSystemFont, sans-serif';
                    const text = `🧲 ${guide.label}`;
                    const tw = ctx.measureText(text).width + 24;
                    const badgeY = Math.max(12, Math.min(height - 44, guide.canvasPos - 16));
                    ctx.fillStyle = 'rgba(11, 12, 16, 0.92)';
                    ctx.strokeStyle = guide.color || '#00f2fe';
                    ctx.lineWidth = 1.5;
                    ctx.beginPath();
                    ctx.roundRect(16, badgeY, tw, 32, 6);
                    ctx.fill();
                    ctx.stroke();

                    ctx.fillStyle = guide.color || '#00f2fe';
                    ctx.textAlign = 'left';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(text, 28, badgeY + 16);
                }

                ctx.restore();
            });
        }

        // 2. Bounding Box Outline
        ctx.setLineDash([6, 4]);
        ctx.strokeStyle = '#00d482';
        ctx.lineWidth = 2.5;
        ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
        ctx.shadowBlur = 6;

        ctx.beginPath();
        ctx.roundRect(bounds.left, bounds.top, bounds.width, bounds.height, 8);
        ctx.stroke();

        // 3. Four Corner Handles
        ctx.setLineDash([]);
        const handleRadius = 7;
        const corners = [
            { x: bounds.left, y: bounds.top },
            { x: bounds.right, y: bounds.top },
            { x: bounds.left, y: bounds.bottom },
            { x: bounds.right, y: bounds.bottom }
        ];

        corners.forEach(c => {
            ctx.fillStyle = '#ffffff';
            ctx.strokeStyle = '#00d482';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.arc(c.x, c.y, handleRadius, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        });

        // 4. Floating Position Pill (shows exact X, Y)
        const posX = clip.posX || 0;
        const posY = clip.posY || 0;
        const pillText = `X: ${posX > 0 ? '+' : ''}${posX}  Y: ${posY > 0 ? '+' : ''}${posY}`;
        ctx.font = 'bold 20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        const pillMetrics = ctx.measureText(pillText);
        const pillW = pillMetrics.width + 24;
        const pillH = 32;
        const pillX = bounds.centerX - pillW / 2;
        const pillY = bounds.top - 44 > 10 ? bounds.top - 44 : bounds.bottom + 12;

        ctx.fillStyle = 'rgba(11, 12, 16, 0.92)';
        ctx.strokeStyle = '#00d482';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(pillX, pillY, pillW, pillH, 6);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#00d482';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(pillText, bounds.centerX, pillY + pillH / 2);

        // 5. Active Video Mask Outline
        if (clip.mask && clip.mask.type && clip.mask.type !== 'none') {
            ctx.save();
            ctx.setLineDash([8, 6]);
            ctx.strokeStyle = '#00f2fe';
            ctx.lineWidth = 2.0;
            ctx.shadowColor = 'rgba(0, 242, 254, 0.75)';
            ctx.shadowBlur = 8;

            const m = clip.mask;
            const mcx = bounds.centerX + (m.x || 0);
            const mcy = bounds.centerY + (m.y || 0);

            if (m.type === 'circle') {
                const r = (m.size !== undefined ? m.size : Math.min(bounds.width, bounds.height) * 0.7) / 2;
                ctx.beginPath();
                ctx.arc(mcx, mcy, r, 0, Math.PI * 2);
                ctx.stroke();
            } else if (m.type === 'rectangle') {
                const mw = m.width !== undefined ? m.width : bounds.width * 0.75;
                const mh = m.height !== undefined ? m.height : bounds.height * 0.75;
                ctx.beginPath();
                if (typeof ctx.roundRect === 'function') {
                    ctx.roundRect(mcx - mw / 2, mcy - mh / 2, mw, mh, m.roundness || 0);
                } else {
                    ctx.rect(mcx - mw / 2, mcy - mh / 2, mw, mh);
                }
                ctx.stroke();
            } else if (m.type === 'linear') {
                const angle = (m.rotation || 0) * Math.PI / 180;
                const pos = m.pos || 0;
                ctx.beginPath();
                ctx.save();
                ctx.translate(mcx, mcy);
                ctx.rotate(angle);
                ctx.moveTo(-bounds.width, pos);
                ctx.lineTo(bounds.width, pos);
                ctx.restore();
                ctx.stroke();
            } else if (m.type === 'mirror') {
                const size = m.size !== undefined ? m.size : 200;
                const half = size / 2;
                ctx.beginPath();
                ctx.moveTo(mcx - bounds.width / 2, mcy - half);
                ctx.lineTo(mcx + bounds.width / 2, mcy - half);
                ctx.moveTo(mcx - bounds.width / 2, mcy + half);
                ctx.lineTo(mcx + bounds.width / 2, mcy + half);
                ctx.stroke();
            }
            ctx.restore();
        }

        ctx.restore();
    }

    renderSpecialOverlay(type, params = {}, width, height) {
        const { ctx } = this;
        ctx.save();

        if (type === 'vhs-retro' || type === 'vhs-scanlines') {
            // Analog scanlines
            ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
            for (let y = 0; y < height; y += 4) {
                ctx.fillRect(0, y, width, 1.5);
            }
            // Tracking noise band
            const jitterY = (Math.sin(this.currentTime * 7) * 0.5 + 0.5) * height;
            ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
            ctx.fillRect(0, jitterY, width, 14);

            // VHS On-Screen Display (OSD)
            ctx.font = '700 22px "Courier New", monospace';
            
            // Blinking red REC dot
            if (Math.floor(this.currentTime * 2) % 2 === 0) {
                ctx.fillStyle = '#ff2222';
                ctx.beginPath();
                ctx.arc(42, 42, 8, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'left';
            ctx.fillText('REC', 58, 48);

            // SP Mode top right
            ctx.textAlign = 'right';
            ctx.fillText('SP', width - 40, 48);

            // Bottom Left Channel
            ctx.textAlign = 'left';
            ctx.fillText('CH 03', 40, height - 40);

            // Bottom Right Timecode
            const mins = Math.floor(this.currentTime / 60).toString().padStart(2, '0');
            const secs = Math.floor(this.currentTime % 60).toString().padStart(2, '0');
            const frames = Math.floor((this.currentTime % 1) * 30).toString().padStart(2, '0');
            ctx.textAlign = 'right';
            ctx.fillText(`00:${mins}:${secs}:${frames}`, width - 40, height - 40);

        } else if (type === 'camera-shake') {
            // Handheld camera shake / jitter simulation
            const intensity = params.intensity || 1.0;
            const t = this.currentTime * 18;
            const shakeX = (Math.sin(t) * 8 + Math.sin(t * 2.3) * 4) * intensity;
            const shakeY = (Math.cos(t * 1.4) * 6 + Math.cos(t * 3.1) * 3) * intensity;
            ctx.save();
            ctx.globalAlpha = 0.3;
            ctx.drawImage(this.canvas, shakeX * 0.4, shakeY * 0.4);
            ctx.restore();

        } else if (type === 'rgb-split') {
            // Chromatic aberration RGB split
            const offset = (params.offset || 8);
            ctx.save();
            ctx.globalCompositeOperation = 'screen';
            ctx.globalAlpha = 0.35;
            ctx.drawImage(this.canvas, -offset, 0);
            ctx.drawImage(this.canvas, offset, 0);
            ctx.restore();

        } else if (type === 'film-grain') {
            // High-density analog 35mm film grain
            const grainCount = params.count || 240;
            const tSeed = Math.floor(this.currentTime * 24);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
            for (let i = 0; i < grainCount; i++) {
                const gx = ((i * 197.3 + tSeed * 77.1) % 1) * width;
                const gy = ((i * 311.9 + tSeed * 123.7) % 1) * height;
                const gSize = 1.5 + ((i * 13.7) % 1) * 2.2;
                ctx.fillRect(gx, gy, gSize, gSize);
            }

        } else if (type === 'vignette') {
            // Radial dark edges
            const rad = Math.max(width, height) * 0.7;
            const vignette = ctx.createRadialGradient(width/2, height/2, rad * 0.4, width/2, height/2, rad);
            vignette.addColorStop(0, 'transparent');
            vignette.addColorStop(1, 'rgba(0, 0, 0, 0.65)');
            ctx.fillStyle = vignette;
            ctx.fillRect(0, 0, width, height);

        } else if (type === 'rain') {
            // 🌧️ Cinematic Rain & Water Streaks
            const count = params.count || 140;
            const speed = (params.speed || 1.0) * 2000;
            const slant = (params.wind !== undefined ? params.wind : -0.2) * 500;
            const len = params.length || 38;

            ctx.strokeStyle = params.color || 'rgba(190, 220, 255, 0.5)';
            ctx.lineWidth = params.thickness || 2.0;
            ctx.lineCap = 'round';

            const t = this.currentTime;

            for (let i = 0; i < count; i++) {
                const seedX = ((i * 127.1 + 311.7) % 1) * width;
                const seedY = ((i * 269.5 + 183.3) % 1) * height;
                const speedMult = 0.85 + ((i * 17.3) % 0.35);

                const y = (seedY + t * speed * speedMult) % (height + 120) - 60;
                const x = (seedX + (y / height) * slant) % (width + 120) - 60;

                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(x + slant * 0.08, y + len);
                ctx.stroke();
            }

        } else if (type === 'bokeh') {
            // ✨ Golden Bokeh Orbs
            const count = params.count || 28;
            const color = params.color || '#ffcc33';
            const baseSize = params.size || 55;
            const speed = params.speed || 0.5;
            const t = this.currentTime * speed;

            for (let i = 0; i < count; i++) {
                const seedX = ((i * 92.3 + 14.1) % 1) * width;
                const seedY = ((i * 47.7 + 89.2) % 1) * height;
                const radius = baseSize * (0.6 + ((i * 13.9) % 1) * 0.9);
                const alpha = 0.18 + ((i * 7.1) % 1) * 0.28;

                // Drift upward & subtle horizontal sway
                const y = (seedY - t * 45 + height) % height;
                const x = seedX + Math.sin(t * 1.6 + i) * 40;

                const grad = ctx.createRadialGradient(x, y, radius * 0.05, x, y, radius);
                grad.addColorStop(0, color);
                grad.addColorStop(0.7, color);
                grad.addColorStop(1, 'transparent');

                ctx.fillStyle = grad;
                ctx.globalAlpha = alpha;
                ctx.beginPath();
                ctx.arc(x, y, radius, 0, Math.PI * 2);
                ctx.fill();

                // Soft outer glowing ring
                ctx.strokeStyle = color;
                ctx.lineWidth = 2.0;
                ctx.globalAlpha = alpha * 0.8;
                ctx.stroke();
            }

        } else if (type === 'snow') {
            // ❄️ Soft Snowfall
            const count = params.count || 90;
            const speed = params.speed || 1.0;
            const t = this.currentTime * speed;
            ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';

            for (let i = 0; i < count; i++) {
                const seedX = ((i * 71.9 + 53.1) % 1) * width;
                const seedY = ((i * 37.3 + 19.7) % 1) * height;
                const radius = 2.0 + ((i * 11.3) % 1) * 4.0;
                const fallSpeed = 60 + ((i * 23.7) % 1) * 110;

                const y = (seedY + t * fallSpeed) % height;
                const x = seedX + Math.sin(t * 1.2 + i * 2) * 24;

                ctx.beginPath();
                ctx.arc(x, y, radius, 0, Math.PI * 2);
                ctx.fill();
            }

        } else if (type === 'dust-scratches') {
            // 🎞️ Retro Film Dust & Micro Scratches
            const count = params.count || 50;
            const frameSeed = Math.floor(this.currentTime * 12);

            ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';

            for (let i = 0; i < count; i++) {
                const x = ((i * 133.7 + frameSeed * 91.1) % 1) * width;
                const y = ((i * 277.3 + frameSeed * 53.7) % 1) * height;

                if (i % 6 === 0) {
                    ctx.beginPath();
                    ctx.moveTo(x, Math.max(0, y - 50));
                    ctx.lineTo(x + ((i % 2) - 1), Math.min(height, y + 50));
                    ctx.stroke();
                } else {
                    const r = 1.0 + ((i * 7.7) % 1) * 2.0;
                    ctx.beginPath();
                    ctx.arc(x, y, r, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
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

    getClipAudioVolume(clip, localTime, activeClips = []) {
        let vol = (clip.volume !== undefined ? clip.volume : 1.0) * this.masterVolume;

        // Fade In
        if (clip.fadeIn && clip.fadeIn > 0) {
            if (localTime < clip.fadeIn) {
                const f = Math.max(0, Math.min(1, localTime / clip.fadeIn));
                vol *= (0.5 - 0.5 * Math.cos(f * Math.PI));
            }
        }

        // Fade Out
        if (clip.fadeOut && clip.fadeOut > 0) {
            const timeRemaining = clip.duration - localTime;
            if (timeRemaining < clip.fadeOut) {
                const f = Math.max(0, Math.min(1, timeRemaining / clip.fadeOut));
                vol *= (0.5 - 0.5 * Math.cos(f * Math.PI));
            }
        }

        // Auto-Ducking: If this is an audio clip with autoDucking enabled
        if (clip.autoDucking) {
            const otherAudioActive = activeClips.some(c => {
                if (c.id === clip.id) return false;
                if (c.trackId === 'video' || c.trackId === 'overlay') {
                    const el = this.mediaElements.get(c.mediaId);
                    const isMuted = window.timeline?.trackStates?.[c.trackId]?.muted;
                    return !isMuted && el && el.tagName === 'VIDEO' && (c.volume === undefined || c.volume > 0.05);
                }
                if (c.trackId === 'audio' && !c.autoDucking) {
                    return (c.volume === undefined || c.volume > 0.05);
                }
                return false;
            });

            if (otherAudioActive) {
                const duckAmount = clip.duckingAmount !== undefined ? clip.duckingAmount : 0.65;
                vol *= (1.0 - duckAmount);
            }
        }

        return Math.max(0, Math.min(2.0, vol));
    }

    syncAudioTracks(activeClips) {
        const isMuted = window.timeline?.trackStates?.audio?.muted || false;
        const audioClips = activeClips.filter(c => c.trackId === 'audio');
        audioClips.forEach(clip => {
            const el = this.mediaElements.get(clip.mediaId);
            if (el && typeof el.play === 'function') {
                const localTime = Math.max(0, Math.min(clip.duration, this.currentTime - clip.startTime));
                const computedVol = this.getClipAudioVolume(clip, localTime, activeClips);
                el.volume = isMuted ? 0 : Math.min(1.0, computedVol);
                const clipRelativeTime = this.getClipSourceTime(clip, localTime);
                const currentSpeed = this.getClipInstantaneousSpeed(clip, localTime);
                el.preservesPitch = clip.preservesPitch !== false;
                el.playbackRate = Math.max(0.1, Math.min(16, currentSpeed));

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

    renderSafeZones(width, height) {
        const { ctx } = this;
        ctx.save();

        if (this.aspectRatio === '9:16') {
            // TikTok / Instagram Reels / YouTube Shorts safe zones
            // Top: 14% (header, tabs, search)
            // Bottom: 22% (caption, author, sound title, comment input)
            // Right: 16% (interaction sidebar: like, comment, bookmark, share)
            // Left: 6% margin
            const topMargin = height * 0.14;
            const bottomMargin = height * 0.22;
            const rightMargin = width * 0.16;
            const leftMargin = width * 0.06;

            const safeW = width - leftMargin - rightMargin;
            const safeH = height - topMargin - bottomMargin;

            // Semi-transparent danger zone tint
            ctx.fillStyle = 'rgba(255, 0, 80, 0.08)';
            ctx.fillRect(0, 0, width, topMargin);
            ctx.fillRect(0, height - bottomMargin, width, bottomMargin);
            ctx.fillRect(width - rightMargin, topMargin, rightMargin, height - topMargin - bottomMargin);

            // Safe Zone Dashed Border (Neon Cyan)
            ctx.strokeStyle = '#00f2fe';
            ctx.lineWidth = 3;
            ctx.setLineDash([12, 8]);
            ctx.strokeRect(leftMargin, topMargin, safeW, safeH);

            // Labels
            ctx.setLineDash([]);
            ctx.fillStyle = '#00f2fe';
            ctx.font = 'bold 22px -apple-system, BlinkMacSystemFont, sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText('⊞ TIKTOK / REELS SÄKER ZON', leftMargin + 16, topMargin + 32);

            ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
            ctx.font = '16px -apple-system, BlinkMacSystemFont, sans-serif';
            ctx.fillText('Håll text & grafik här för att undvika ikoner & undertexter', leftMargin + 16, topMargin + 58);

            // UI Area hints
            ctx.fillStyle = 'rgba(255, 90, 90, 0.85)';
            ctx.font = 'bold 16px -apple-system, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('▲ APP TOPPMENY', width / 2, topMargin / 2);
            ctx.fillText('▼ UNDERTEXTER & MUSIKTITEL', width / 2, height - bottomMargin / 2);

            ctx.textAlign = 'right';
            ctx.fillText('IKONER ▶', width - 12, height / 2);

        } else {
            // Standard 16:9 / 1:1 / 4:5 Action & Title Safe Margins
            // Action Safe: 90%
            const actionInsetX = width * 0.05;
            const actionInsetY = height * 0.05;
            ctx.strokeStyle = 'rgba(0, 242, 254, 0.6)';
            ctx.lineWidth = 2;
            ctx.setLineDash([10, 6]);
            ctx.strokeRect(actionInsetX, actionInsetY, width - actionInsetX * 2, height - actionInsetY * 2);

            // Title Safe: 80%
            const titleInsetX = width * 0.10;
            const titleInsetY = height * 0.10;
            ctx.strokeStyle = 'rgba(0, 212, 130, 0.75)';
            ctx.lineWidth = 2;
            ctx.setLineDash([8, 6]);
            ctx.strokeRect(titleInsetX, titleInsetY, width - titleInsetX * 2, height - titleInsetY * 2);

            // Center Crosshair
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
            ctx.lineWidth = 1;
            ctx.setLineDash([]);
            const chSize = 30;
            ctx.beginPath();
            ctx.moveTo(width / 2 - chSize, height / 2);
            ctx.lineTo(width / 2 + chSize, height / 2);
            ctx.moveTo(width / 2, height / 2 - chSize);
            ctx.lineTo(width / 2, height / 2 + chSize);
            ctx.stroke();

            // Label
            ctx.fillStyle = '#00d482';
            ctx.font = 'bold 20px -apple-system, BlinkMacSystemFont, sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText('⊞ TITEL- OCH GRAFIKMARGINAL (80% / 90%)', titleInsetX + 16, titleInsetY + 30);
        }

        ctx.restore();
    }

    updateTimecodeUI() {
        const currentEl = document.getElementById('currentTimecode');
        const totalEl = document.getElementById('totalTimecode');
        if (currentEl) currentEl.textContent = this.formatTimecode(this.currentTime);
        if (totalEl) totalEl.textContent = this.formatTimecode(this.duration);

        if (window.inspector && typeof window.inspector.syncSlidersToCurrentTime === 'function') {
            window.inspector.syncSlidersToCurrentTime();
        }
        if (window.inspector && typeof window.inspector.updateSpeedCurvePlayhead === 'function') {
            window.inspector.updateSpeedCurvePlayhead();
        }
    }

    formatTimecode(seconds) {
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        const f = Math.floor((seconds % 1) * 100);
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${f.toString().padStart(2, '0')}`;
    }
}

window.NovaCutEngine = NovaCutEngine;

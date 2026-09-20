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
        document.getElementById('btnPlayPause').innerHTML = ncIcon('pause');
    }

    pause() {
        if (!this.isPlaying) return;
        this.isPlaying = false;
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        document.getElementById('btnPlayPause').innerHTML = ncIcon('play', { solid: true });

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
        if (window.timeline) {
            window.timeline.ensurePlayheadVisible();
        }
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
        const tracks = window.timeline.tracks || [
            { id: 'text', name: 'Text', type: 'text' },
            { id: 'effect', name: 'Effekt', type: 'effect' },
            { id: 'overlay', name: 'Overlay', type: 'video' },
            { id: 'video', name: 'Video', type: 'video' }
        ];

        // 2. Global Effect Filters (Active clips on visible effect tracks)
        let combinedFilter = 'none';
        const activeFilters = [];
        activeClips.forEach(c => {
            const trk = tracks.find(t => t.id === c.trackId);
            const isEff = c.type === 'effect' || (trk && trk.type === 'effect');
            if (isEff && trackStates[c.trackId]?.visible !== false && c.cssFilter) {
                activeFilters.push(c.cssFilter);
            }
        });
        if (activeFilters.length > 0) {
            combinedFilter = activeFilters.join(' ');
        }

        // 3. Render Visual Tracks in Bottom-to-Top NLE Order
        // Visual tracks ordered in timeline: index 0 is top (foreground), index N-1 is bottom (background).
        // Reversing gives bottom-to-top rendering order: background paints first, overlays paint on top!
        const visualTracks = tracks.filter(t => t.type !== 'audio');
        if (!this.isExporting && (!window.timeline || window.timeline.clips.length === 0)) {
            this.renderEmptyPlaceholder();
        }

        const renderOrder = [...visualTracks].reverse();

        for (const track of renderOrder) {
            if (trackStates[track.id]?.visible === false) continue;

            const clipsOnTrack = activeClips.filter(c => c.trackId === track.id);
            if (clipsOnTrack.length === 0) continue;

            if (track.type === 'text') {
                ctx.filter = 'none';
                for (const clip of clipsOnTrack) {
                    this.renderTextClip(clip, width, height);
                }
            } else if (track.type === 'effect') {
                for (const clip of clipsOnTrack) {
                    if (clip.overlayType) {
                        this.renderSpecialOverlay(clip.overlayType, clip.params, width, height);
                    }
                }
            } else {
                // Video, overlay, image, sticker, reactive visualizer
                ctx.filter = combinedFilter;
                for (const clip of clipsOnTrack) {
                    this.renderMediaClip(clip, width, height);
                }
            }
        }

        // Reset filter
        ctx.filter = 'none';

        // 6. Interactive Selection Gizmo & Snap Guidelines (hidden during export)
        if (!this.isExporting && window.timeline && window.timeline.selectedClipId) {
            const selClip = window.timeline.clips.find(c => c.id === window.timeline.selectedClipId);
            const selTrack = selClip ? tracks.find(t => t.id === selClip.trackId) : null;
            if (selClip && selTrack && selTrack.type !== 'audio') {
                const isTrackVisible = trackStates[selClip.trackId]?.visible !== false;
                const isActive = activeClips.some(c => c.id === selClip.id);
                if (isActive && isTrackVisible) {
                    this.renderSelectionGizmo(selClip, width, height);
                }
            }
        }

        // 7. Safe Zones Overlay (TikTok / Reels / Action & Title Safe, hidden during export)
        if (!this.isExporting && this.showSafeZone) {
            this.renderSafeZones(width, height);
        }

        ctx.restore();

        // 6. Handle Audio Playback Sync (skip during offline export)
        if (!this.isExporting) {
            this.syncAudioTracks(activeClips);
        }

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
                const easing = k1.easing || clip.keyframeEasing || 'smooth';
                let easeT = t;
                if (easing === 'linear') {
                    easeT = t;
                } else if (easing === 'ease-in') {
                    easeT = t * t * t;
                } else if (easing === 'ease-out') {
                    easeT = 1 - Math.pow(1 - t, 3);
                } else if (easing === 'bounce') {
                    const n1 = 7.5625, d1 = 2.75;
                    let u = t;
                    if (u < 1 / d1) easeT = n1 * u * u;
                    else if (u < 2 / d1) easeT = n1 * (u -= 1.5 / d1) * u + 0.75;
                    else if (u < 2.5 / d1) easeT = n1 * (u -= 2.25 / d1) * u + 0.9375;
                    else easeT = n1 * (u -= 2.625 / d1) * u + 0.984375;
                } else if (easing === 'back-out') {
                    const c1 = 1.70158, c3 = c1 + 1;
                    easeT = 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
                } else {
                    // Cosine smooth easing for silky animations
                    easeT = 0.5 - 0.5 * Math.cos(t * Math.PI);
                }
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

    applyTransitionMath(type, p, isIntro, width, height, state) {
        // 1. Mjuka & Toningar
        if (type === 'dissolve') {
            state.opacity *= p;
        } else if (type === 'dip_black') {
            state.overlayColor = '#000000';
            state.overlayAlpha = Math.max(state.overlayAlpha, 1 - p);
        } else if (type === 'dip_white' || type === 'flash') {
            state.overlayColor = '#ffffff';
            state.overlayAlpha = Math.max(state.overlayAlpha, (1 - p) * 0.95);
        } else if (type === 'dip_color') {
            state.overlayColor = '#ff8800';
            state.overlayAlpha = Math.max(state.overlayAlpha, (1 - p) * 0.85);
        } else if (type === 'blur_fade') {
            state.opacity *= p;
            state.blurAmount = Math.max(state.blurAmount, (1 - p) * 16);
        } else if (type === 'fade_sepia') {
            state.overlayColor = '#704214';
            state.overlayAlpha = Math.max(state.overlayAlpha, (1 - p) * 0.75);
            state.opacity *= Math.max(0.15, p);
        } else if (type === 'soft_glow') {
            state.overlayColor = '#ffeebb';
            state.overlayAlpha = Math.max(state.overlayAlpha, (1 - p) * 0.9);
            state.scale *= (1 + (1 - p) * 0.08);
        } else if (type === 'lens_blur') {
            state.opacity *= Math.max(0.1, p);
            state.blurAmount = Math.max(state.blurAmount, (1 - p) * 22);
            state.scale *= (1 + (1 - p) * 0.05);

        // 2. Rörelse & Svep
        } else if (type === 'slide_left') {
            state.shiftX += (isIntro ? width : -width) * (1 - p);
        } else if (type === 'slide_right') {
            state.shiftX += (isIntro ? -width : width) * (1 - p);
        } else if (type === 'slide_up') {
            state.shiftY += (isIntro ? height : -height) * (1 - p);
        } else if (type === 'slide_down') {
            state.shiftY += (isIntro ? -height : height) * (1 - p);
        } else if (type === 'whip_left') {
            state.shiftX += (isIntro ? width * 1.35 : -width * 1.35) * (1 - p);
            state.blurAmount = Math.max(state.blurAmount, (1 - p) * 8);
        } else if (type === 'whip_right') {
            state.shiftX += (isIntro ? -width * 1.35 : width * 1.35) * (1 - p);
            state.blurAmount = Math.max(state.blurAmount, (1 - p) * 8);
        } else if (type === 'whip_up') {
            state.shiftY += (isIntro ? height * 1.35 : -height * 1.35) * (1 - p);
            state.blurAmount = Math.max(state.blurAmount, (1 - p) * 8);
        } else if (type === 'whip_down') {
            state.shiftY += (isIntro ? -height * 1.35 : height * 1.35) * (1 - p);
            state.blurAmount = Math.max(state.blurAmount, (1 - p) * 8);
        } else if (type === 'smooth_push_left') {
            state.shiftX += (isIntro ? width : -width) * (1 - p) * 0.85;
            state.opacity *= (0.3 + 0.7 * p);
        } else if (type === 'smooth_push_right') {
            state.shiftX += (isIntro ? -width : width) * (1 - p) * 0.85;
            state.opacity *= (0.3 + 0.7 * p);

        // 3. Zoom & Skala
        } else if (type === 'zoom_in') {
            state.scale *= isIntro ? (0.65 + 0.35 * p) : (1.35 - 0.35 * p);
            state.opacity *= p;
        } else if (type === 'zoom_out') {
            state.scale *= isIntro ? (1.35 - 0.35 * p) : (0.65 + 0.35 * p);
            state.opacity *= p;
        } else if (type === 'spin_zoom_cw') {
            state.scale *= (0.5 + 0.5 * p);
            state.rotDeg += (isIntro ? (1 - p) * 180 : -(1 - p) * 180);
            state.opacity *= p;
        } else if (type === 'spin_zoom_ccw') {
            state.scale *= (0.5 + 0.5 * p);
            state.rotDeg -= (isIntro ? (1 - p) * 180 : -(1 - p) * 180);
            state.opacity *= p;
        } else if (type === 'bounce_zoom') {
            const b = Math.sin(p * Math.PI * 0.5);
            state.scale *= (0.4 + 0.6 * b);
            state.opacity *= p;
        } else if (type === 'elastic_zoom') {
            state.scale *= Math.max(0.2, (0.4 + 0.6 * p));
            state.opacity *= Math.max(0, Math.min(1, p * 1.5));
        } else if (type === 'swirl_zoom') {
            state.scale *= (0.4 + 0.6 * p);
            state.rotDeg += (1 - p) * 90;
            state.opacity *= p;
        } else if (type === 'cross_zoom') {
            state.scale *= isIntro ? (0.4 + 0.6 * p) : (1.0 + (1 - p) * 0.6);
            state.blurAmount = Math.max(state.blurAmount, (1 - p) * 10);
            state.opacity *= p;

        // 4. Glitch & Cyber
        } else if (type === 'glitch') {
            state.shiftX += (Math.random() - 0.5) * 35 * (1 - p);
            state.shiftY += (Math.random() - 0.5) * 15 * (1 - p);
            state.opacity *= (0.6 + 0.4 * p);
            state.glitchActive = true;
        } else if (type === 'rgb_split_trans') {
            state.glitchActive = true;
            state.shiftX += (Math.sin(p * 20) * 12) * (1 - p);
            state.opacity *= Math.max(0.4, p);
        } else if (type === 'scanline_glitch') {
            state.shiftX += (Math.sin(p * 40) * 15) * (1 - p);
            state.overlayColor = '#00ffff';
            state.overlayAlpha = (1 - p) * 0.35;
            state.glitchActive = true;
        } else if (type === 'pixelate_trans') {
            state.opacity *= p;
            state.blurAmount = Math.max(state.blurAmount, (1 - p) * 14);
        } else if (type === 'tv_noise') {
            state.overlayColor = (Math.random() > 0.5 ? '#ffffff' : '#000000');
            state.overlayAlpha = (1 - p) * 0.7;
            state.glitchActive = true;
        } else if (type === 'vcr_distortion') {
            state.shiftX += (Math.sin(p * 15) * 25) * (1 - p);
            state.overlayColor = '#ff0055';
            state.overlayAlpha = (1 - p) * 0.25;
        } else if (type === 'datamosh') {
            state.shiftX += (Math.floor((1 - p) * 5) % 2 === 0 ? 20 : -20) * (1 - p);
            state.glitchActive = true;
            state.opacity *= (0.5 + 0.5 * p);
        } else if (type === 'cyber_matrix') {
            state.overlayColor = '#00ff66';
            state.overlayAlpha = (1 - p) * 0.5;
            state.glitchActive = true;

        // 5. Ljus & Blixtar
        } else if (type === 'light_leak_warm') {
            state.overlayColor = '#ffaa33';
            state.overlayAlpha = (1 - p) * 0.85;
            state.scale *= (1 + (1 - p) * 0.05);
        } else if (type === 'light_leak_cool') {
            state.overlayColor = '#00e5ff';
            state.overlayAlpha = (1 - p) * 0.85;
        } else if (type === 'film_burn') {
            state.overlayColor = '#ff3300';
            state.overlayAlpha = (1 - p) * 0.9;
            state.scale *= (1 + (1 - p) * 0.08);
        } else if (type === 'anamorphic_flare') {
            state.overlayColor = '#0088ff';
            state.overlayAlpha = (1 - p) * 0.8;
        } else if (type === 'sun_burst') {
            state.overlayColor = '#fff5cc';
            state.overlayAlpha = (1 - p) * 0.95;
            state.scale *= (1 + (1 - p) * 0.06);
        } else if (type === 'glow_flash') {
            state.overlayColor = '#ffffff';
            state.overlayAlpha = (1 - p) * 0.98;
            state.blurAmount = (1 - p) * 8;
        } else if (type === 'strobe_flash') {
            state.overlayColor = '#ffffff';
            state.overlayAlpha = (Math.floor(p * 10) % 2 === 0) ? (1 - p) * 0.9 : 0;
        } else if (type === 'neon_pulse') {
            state.overlayColor = '#d946ef';
            state.overlayAlpha = (1 - p) * 0.75;

        // 3D & Rotations
        } else if (type.startsWith('cube_') || type.includes('flip') || type.includes('3d') || type.includes('door') || type.includes('page') || type.includes('fold') || type.includes('cylinder') || type.includes('plate') || type.includes('spin') || type.includes('sphere') || type.includes('prism')) {
            state.scale *= isIntro ? (0.65 + 0.35 * p) : (1.0 - (1 - p) * 0.35);
            if (type.includes('left') || type.includes('horiz')) state.shiftX += (isIntro ? width * 0.5 : -width * 0.5) * (1 - p);
            else if (type.includes('right')) state.shiftX += (isIntro ? -width * 0.5 : width * 0.5) * (1 - p);
            else if (type.includes('up') || type.includes('vert')) state.shiftY += (isIntro ? height * 0.5 : -height * 0.5) * (1 - p);
            else if (type.includes('down')) state.shiftY += (isIntro ? -height * 0.5 : height * 0.5) * (1 - p);
            if (type.includes('flip') || type.includes('spin') || type.includes('card') || type.includes('plate') || type.includes('hex')) {
                state.rotDeg += (isIntro ? (1 - p) * 90 : -(1 - p) * 90);
            }
            state.opacity *= p;

        // 6. Formklipp & Wipes
        } else if (type.includes('wipe') || type.includes('split') || type.includes('curtain') || type.includes('blind') || type.includes('clock') || type.includes('checker') || type.includes('strip')) {
            state.wipeType = type;
            state.wipeP = p;
        } else {
            // General graceful fallback for any other transitions
            state.opacity *= p;
        }
    }

    renderMediaClip(clip, width, height) {
        const { ctx } = this;
        let mediaEl = this.mediaElements.get(clip.mediaId);
        const isImgFile = clip.type === 'image' || clip.isAiVisual || (clip.filePath && clip.filePath.match(/\.(png|jpg|jpeg|webp|gif|svg|bmp)$/i));
        if (!mediaEl && clip.filePath) {
            if (isImgFile) {
                mediaEl = new Image();
                mediaEl.src = clip.filePath;
                mediaEl.onload = () => { if (this.render) this.render(); };
                if (clip.mediaId) this.mediaElements.set(clip.mediaId, mediaEl);
            } else if (clip.type === 'video') {
                mediaEl = document.createElement('video');
                mediaEl.src = clip.filePath;
                mediaEl.preload = 'auto';
                mediaEl.muted = true;
                if (clip.mediaId) this.mediaElements.set(clip.mediaId, mediaEl);
            }
        }

        ctx.save();

        const propPosX = this.getInterpolatedProperty(clip, 'posX', 0);
        const propPosY = this.getInterpolatedProperty(clip, 'posY', 0);
        let scale = this.getInterpolatedProperty(clip, 'scale', 1.0);
        let opacity = this.getInterpolatedProperty(clip, 'opacity', 1.0);
        let rotDeg = this.getInterpolatedProperty(clip, 'rotation', 0);

        const transState = {
            opacity,
            scale,
            shiftX: 0,
            shiftY: 0,
            rotDeg,
            overlayColor: null,
            overlayAlpha: 0,
            glitchActive: false,
            blurAmount: 0,
            wipeType: null,
            wipeP: 1
        };

        const localTime = Math.max(0, Math.min(clip.duration, this.currentTime - clip.startTime));

        // Transition IN calculation
        if (clip.transitionIn && clip.transitionIn.type && clip.transitionIn.type !== 'none') {
            const dur = Math.max(0.1, clip.transitionIn.duration || 0.5);
            if (localTime < dur) {
                const rawP = Math.max(0, Math.min(1, localTime / dur));
                const p = rawP * rawP * (3 - 2 * rawP); // smoothstep
                this.applyTransitionMath(clip.transitionIn.type, p, true, width, height, transState);
            }
        }

        // Transition OUT calculation
        if (clip.transitionOut && clip.transitionOut.type && clip.transitionOut.type !== 'none') {
            const dur = Math.max(0.1, clip.transitionOut.duration || 0.5);
            const timeLeft = clip.duration - localTime;
            if (timeLeft < dur) {
                const rawP = Math.max(0, Math.min(1, timeLeft / dur));
                const p = rawP * rawP * (3 - 2 * rawP); // smoothstep
                this.applyTransitionMath(clip.transitionOut.type, p, false, width, height, transState);
            }
        }

        opacity = transState.opacity;
        scale = transState.scale;
        rotDeg = transState.rotDeg;
        const shiftX = transState.shiftX;
        const shiftY = transState.shiftY;
        const overlayColor = transState.overlayColor;
        const overlayAlpha = transState.overlayAlpha;
        const glitchActive = transState.glitchActive;

        // --- Dynamic Camera Motion (Shake & Zoom Bounce) ---
        let shakeOffsetX = 0;
        let shakeOffsetY = 0;
        let shakeRot = 0;
        let vfxScaleMult = 1.0;

        if (clip.vfx?.shake?.enabled) {
            const sh = clip.vfx.shake;
            const mode = sh.mode || 'handheld';
            const intensity = sh.intensity !== undefined ? sh.intensity : 40;
            const t = localTime * (sh.speed || 1.0);

            if (mode === 'action') {
                shakeOffsetX = (Math.sin(t * 29.3) * 0.7 + Math.sin(t * 43.1) * 0.3) * (intensity * 0.45);
                shakeOffsetY = (Math.cos(t * 31.7) * 0.7 + Math.cos(t * 47.9) * 0.3) * (intensity * 0.45);
                shakeRot = Math.sin(t * 23.4) * (intensity * 0.025);
            } else if (mode === 'bass_drop') {
                const beatP = (localTime % 0.5) / 0.5;
                const decay = Math.exp(-beatP * 6.5);
                shakeOffsetX = Math.sin(localTime * 48.0) * decay * (intensity * 0.7);
                shakeOffsetY = Math.cos(localTime * 38.0) * decay * (intensity * 0.7);
                shakeRot = Math.sin(localTime * 30.0) * decay * (intensity * 0.03);
            } else { // 'handheld'
                shakeOffsetX = (Math.sin(t * 7.3) * 0.6 + Math.sin(t * 13.7) * 0.4) * (intensity * 0.28);
                shakeOffsetY = (Math.cos(t * 8.9) * 0.6 + Math.cos(t * 11.2) * 0.4) * (intensity * 0.28);
                shakeRot = Math.sin(t * 5.1) * (intensity * 0.012);
            }

            // Auto-scale buffer to avoid black border reveal during shake
            vfxScaleMult *= (1.0 + (intensity / 100) * 0.08);
        }

        if (clip.vfx?.zoomBounce?.enabled) {
            const zb = clip.vfx.zoomBounce;
            const freq = zb.freq === 'fast' ? 3.5 : (zb.freq === 'slow' ? 1.0 : 2.0);
            const intensity = zb.intensity !== undefined ? zb.intensity : 35;
            const p = (Math.sin(localTime * Math.PI * 2 * freq) + 1) * 0.5;
            const bounceAdd = Math.pow(p, 2.5) * (intensity / 100) * 0.22;
            vfxScaleMult *= (1.0 + bounceAdd);
        }

        scale *= vfxScaleMult;
        rotDeg += shakeRot;

        const posX = propPosX + shiftX + shakeOffsetX + width / 2;
        const posY = propPosY + shiftY + shakeOffsetY + height / 2;
        const rotation = rotDeg * Math.PI / 180;

        ctx.translate(posX, posY);
        ctx.rotate(rotation);
        ctx.scale(scale, scale);
        ctx.globalAlpha = Math.max(0, Math.min(1, opacity));

        if (clip.blendMode) {
            ctx.globalCompositeOperation = clip.blendMode;
        }

        const clipRelativeTime = this.getClipSourceTime(clip, localTime);
        const currentSpeed = this.getClipInstantaneousSpeed(clip, localTime);

        let drawW = width;
        let drawH = height;

        // Clip Color Grading Filter & Transition Blur
        const clipColorFilter = this.getClipColorFilter(clip);
        let finalFilter = clipColorFilter || '';
        if (transState.blurAmount > 0) {
            finalFilter = (finalFilter ? `${finalFilter} ` : '') + `blur(${Math.round(transState.blurAmount)}px)`;
        }
        if (finalFilter) {
            ctx.filter = (ctx.filter && ctx.filter !== 'none') ? `${ctx.filter} ${finalFilter}` : finalFilter;
        }

        // Shape Wipe Clipping
        let hasWipeClip = false;
        if (transState.wipeType) {
            ctx.save();
            ctx.beginPath();
            const wp = transState.wipeP;
            if (transState.wipeType === 'wipe_left') {
                const curW = width * wp;
                ctx.rect(width / 2 - curW, -height / 2, curW, height);
            } else if (transState.wipeType === 'wipe_right') {
                const curW = width * wp;
                ctx.rect(-width / 2, -height / 2, curW, height);
            } else if (transState.wipeType === 'wipe_up') {
                const curH = height * wp;
                ctx.rect(-width / 2, height / 2 - curH, width, curH);
            } else if (transState.wipeType === 'wipe_down') {
                const curH = height * wp;
                ctx.rect(-width / 2, -height / 2, width, curH);
            } else if (transState.wipeType.includes('circle') || transState.wipeType.includes('iris') || transState.wipeType.includes('radial')) {
                const rad = Math.hypot(width, height) * 0.75 * wp;
                ctx.arc(0, 0, rad, 0, Math.PI * 2);
            } else if (transState.wipeType === 'diamond_wipe') {
                const size = Math.hypot(width, height) * 0.85 * wp;
                ctx.moveTo(0, -size);
                ctx.lineTo(size, 0);
                ctx.lineTo(0, size);
                ctx.lineTo(-size, 0);
                ctx.closePath();
            } else if (transState.wipeType === 'heart_wipe') {
                const s = (Math.min(width, height) * 0.9 * wp) / 100;
                ctx.moveTo(0, s * -20);
                ctx.bezierCurveTo(s * -50, s * -70, s * -100, s * -20, 0, s * 60);
                ctx.bezierCurveTo(s * 100, s * -20, s * 50, s * -70, 0, s * -20);
            } else if (transState.wipeType === 'star_wipe') {
                const outerR = Math.hypot(width, height) * 0.8 * wp;
                const innerR = outerR * 0.45;
                for (let i = 0; i < 10; i++) {
                    const r = (i % 2 === 0) ? outerR : innerR;
                    const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
                    if (i === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
                    else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
                }
                ctx.closePath();
            } else if (transState.wipeType === 'split_doors' || transState.wipeType.includes('curtain')) {
                const openW = (width / 2) * wp;
                ctx.rect(-width / 2, -height / 2, openW, height);
                ctx.rect(width / 2 - openW, -height / 2, openW, height);
            } else {
                const curW = width * wp;
                const curH = height * wp;
                ctx.rect(-curW / 2, -curH / 2, curW, curH);
            }
            ctx.clip();
            hasWipeClip = true;
        }

        // Video Masking (Circle / Rectangle / Linear / Mirror) with optional Feather
        const hasMask = clip.mask && clip.mask.type && clip.mask.type !== 'none';
        const maskFeather = (hasMask && clip.mask.feather > 0) ? Math.min(100, Math.max(1, clip.mask.feather)) : 0;

        let targetCtx = ctx;
        let featherBufW = 0, featherBufH = 0;

        if (hasMask) {
            if (maskFeather > 0) {
                // Buffer dimensions covering potential aspect-ratio scaling
                let maxW = width;
                let maxH = height;
                if (mediaEl) {
                    const mw = mediaEl.videoWidth || mediaEl.naturalWidth || width;
                    const mh = mediaEl.videoHeight || mediaEl.naturalHeight || height;
                    if (mw > 0 && mh > 0) {
                        const aspect = mw / mh;
                        const fitMode = clip.fitMode || 'cover';
                        if (fitMode === 'cover' || fitMode === 'blur-bg') {
                            maxW = Math.max(width, height * aspect);
                            maxH = Math.max(height, width / aspect);
                        }
                    }
                }
                featherBufW = Math.min(2560, Math.max(160, Math.ceil(maxW)));
                featherBufH = Math.min(2560, Math.max(90, Math.ceil(maxH)));

                if (!this.featherCanvas) {
                    this.featherCanvas = document.createElement('canvas');
                    this.featherCtx = this.featherCanvas.getContext('2d');
                    this.featherMaskCanvas = document.createElement('canvas');
                    this.featherMaskCtx = this.featherMaskCanvas.getContext('2d');
                    this.featherShapeCanvas = document.createElement('canvas');
                    this.featherShapeCtx = this.featherShapeCanvas.getContext('2d');
                }
                if (this.featherCanvas.width !== featherBufW || this.featherCanvas.height !== featherBufH) {
                    this.featherCanvas.width = featherBufW;
                    this.featherCanvas.height = featherBufH;
                    this.featherMaskCanvas.width = featherBufW;
                    this.featherMaskCtx.width = featherBufW;
                    this.featherShapeCanvas.width = featherBufW;
                    this.featherShapeCtx.width = featherBufW;
                }
                targetCtx = this.featherCtx;
                targetCtx.clearRect(0, 0, featherBufW, featherBufH);
                targetCtx.save();
                targetCtx.translate(featherBufW / 2, featherBufH / 2);
            } else {
                ctx.save();
                this.applyClipMask(ctx, clip.mask, width, height);
            }
        }

        if (mediaEl && mediaEl.tagName === 'VIDEO') {
            const isVideoMuted = window.timeline?.trackStates?.[clip.trackId]?.muted || false;
            mediaEl.volume = isVideoMuted ? 0 : Math.min(1.0, this.getClipAudioVolume(clip, localTime, []));
            mediaEl.preservesPitch = clip.preservesPitch !== false;
            mediaEl.playbackRate = Math.max(0.1, Math.min(16, currentSpeed));
            
            // A clip dragged longer than its media keeps going: loop the source
            // instead of freezing on its last frame.
            const sourceTime = window.NovaCutFit.loopedTime(clipRelativeTime, mediaEl.duration);

            if (this.isPlaying) {
                if (mediaEl.paused) mediaEl.play().catch(() => {});
                // Keep video synced within 0.15s tolerance
                if (Math.abs(mediaEl.currentTime - sourceTime) > 0.15) {
                    mediaEl.currentTime = sourceTime;
                }
            } else {
                if (!mediaEl.paused) mediaEl.pause();
                if (Math.abs(mediaEl.currentTime - sourceTime) > 0.05) {
                    mediaEl.currentTime = sourceTime;
                }
            }

            const vw = mediaEl.videoWidth || 1920;
            const vh = mediaEl.videoHeight || 1080;
            const fitMode = clip.fitMode || 'cover';

            let renderSource = mediaEl;
            if (clip.cinemagraph && clip.cinemagraph.enabled && window.motionleapEngine) {
                const cinCanvas = window.motionleapEngine.renderFrame(mediaEl, clip.cinemagraph, localTime, width, height);
                if (cinCanvas) renderSource = cinCanvas;
            }

            if (fitMode === 'blur-bg') {
                const plate = window.NovaCutFit.fitRect(vw, vh, width, height, 'cover');
                targetCtx.save();
                targetCtx.filter = 'blur(28px) brightness(0.65)';
                targetCtx.drawImage(renderSource, -plate.width / 2, -plate.height / 2, plate.width, plate.height);
                targetCtx.restore();
            }
            const fit = window.NovaCutFit.fitRect(vw, vh, width, height, fitMode);
            drawW = fit.width;
            drawH = fit.height;

            if (clip.borderRadius && !hasMask) {
                targetCtx.save();
                targetCtx.beginPath();
                targetCtx.roundRect(-drawW / 2, -drawH / 2, drawW, drawH, clip.borderRadius);
                targetCtx.clip();
            }

            // Apply Smart Auto Cutout
            if (clip.autoCutout && clip.autoCutout.enabled) {
                renderSource = this.processAutoCutout(renderSource, drawW, drawH, clip.autoCutout);
            }

            // Apply Chroma Key (Green Screen)
            if (clip.chromaKey && clip.chromaKey.enabled) {
                renderSource = this.processChromaKey(renderSource, drawW, drawH, clip.chromaKey);
            }

            targetCtx.drawImage(renderSource, -drawW / 2, -drawH / 2, drawW, drawH);

            if (clip.borderRadius && !hasMask) {
                targetCtx.restore();
            }

        } else if (mediaEl && mediaEl.tagName === 'IMG') {
            if (!mediaEl.complete) {
                mediaEl.onload = () => this.render();
            }

            const iw = mediaEl.naturalWidth || width;
            const ih = mediaEl.naturalHeight || height;
            const fitMode = clip.fitMode || 'cover';

            let renderSource = mediaEl;
            if (clip.cinemagraph && clip.cinemagraph.enabled && window.motionleapEngine) {
                const cinCanvas = window.motionleapEngine.renderFrame(mediaEl, clip.cinemagraph, localTime, width, height);
                if (cinCanvas) renderSource = cinCanvas;
            }

            if (fitMode === 'blur-bg') {
                const plate = window.NovaCutFit.fitRect(iw, ih, width, height, 'cover');
                targetCtx.save();
                targetCtx.filter = 'blur(28px) brightness(0.65)';
                targetCtx.drawImage(renderSource, -plate.width / 2, -plate.height / 2, plate.width, plate.height);
                targetCtx.restore();
            }
            const fit = window.NovaCutFit.fitRect(iw, ih, width, height, fitMode);
            drawW = fit.width;
            drawH = fit.height;

            if (clip.borderRadius && !hasMask) {
                targetCtx.save();
                targetCtx.beginPath();
                targetCtx.roundRect(-drawW / 2, -drawH / 2, drawW, drawH, clip.borderRadius);
                targetCtx.clip();
            }

            // Apply Smart Auto Cutout
            if (clip.autoCutout && clip.autoCutout.enabled) {
                renderSource = this.processAutoCutout(renderSource, drawW, drawH, clip.autoCutout);
            }

            // Apply Chroma Key (Green Screen)
            if (clip.chromaKey && clip.chromaKey.enabled) {
                renderSource = this.processChromaKey(renderSource, drawW, drawH, clip.chromaKey);
            }

            targetCtx.drawImage(renderSource, -drawW / 2, -drawH / 2, drawW, drawH);

            if (clip.borderRadius && !hasMask) {
                targetCtx.restore();
            }
        } else if (clip.isSticker && window.stickersManager) {
            drawW = clip.stickerWidth || 240;
            drawH = clip.stickerHeight || 160;
            window.stickersManager.renderSticker(targetCtx, clip.stickerId, drawW, drawH, localTime);
        } else {
            // Generated Demo Pattern (e.g. Cyberpunk Grid & Moving Orb)
            this.renderProceduralDemo(clip, width, height, targetCtx);
        }

        // Finalize Mask Clipping / Feathering
        if (hasMask) {
            if (maskFeather > 0) {
                targetCtx.restore();
                this.applyFeatheredMask(this.featherCanvas, this.featherCtx, clip.mask, featherBufW, featherBufH, maskFeather, width, height);
                ctx.drawImage(this.featherCanvas, -featherBufW / 2, -featherBufH / 2, featherBufW, featherBufH);
            } else {
                ctx.restore();
            }
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
                const radius = (clip.mask.size !== undefined ? clip.mask.size : Math.min(width, height) * 0.7) / 2;
                ctx.beginPath();
                ctx.arc(clip.mask.x || 0, clip.mask.y || 0, radius, 0, Math.PI * 2);
                ctx.stroke();
            } else if (clip.mask && clip.mask.type === 'rectangle') {
                const mw = clip.mask.width !== undefined ? clip.mask.width : width * 0.75;
                const mh = clip.mask.height !== undefined ? clip.mask.height : height * 0.75;
                const round = clip.mask.roundness || 0;
                const cx = clip.mask.x || 0;
                const cy = clip.mask.y || 0;
                ctx.beginPath();
                if (typeof ctx.roundRect === 'function') {
                    ctx.roundRect(cx - mw / 2, cy - mh / 2, mw, mh, round);
                } else {
                    ctx.rect(cx - mw / 2, cy - mh / 2, mw, mh);
                }
                ctx.stroke();
            } else {
                const round = clip.borderRadius || 0;
                ctx.beginPath();
                if (typeof ctx.roundRect === 'function') {
                    ctx.roundRect(-drawW / 2, -drawH / 2, drawW, drawH, round);
                } else {
                    ctx.rect(-drawW / 2, -drawH / 2, drawW, drawH);
                }
                ctx.stroke();
            }
            ctx.restore();
        }

        if (hasWipeClip) {
            ctx.restore();
        }

        // Color Grading Overlays (Warm/Cold Temperature, Tint, Vignette)
        this.renderClipColorGradingOverlays(ctx, clip, drawW, drawH);

        // Viral VFX Overlays (RGB Split, Film Grain, VHS, Light Leak)
        if (clip.vfx) {
            this.renderClipViralVFXOverlays(ctx, clip, drawW, drawH, mediaEl, localTime);
        }

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
        // Custom preset filters (e.g. Noir, Vintage, Cyberpunk, Sunset, Anime, Matrix, Kodak, Moody)
        if (clip.colorPreset === 'noir') {
            filters.push('grayscale(100%) contrast(140%) brightness(95%)');
        } else if (clip.colorPreset === 'teal_orange') {
            filters.push('contrast(125%) saturate(120%)');
        } else if (clip.colorPreset === 'cyberpunk') {
            filters.push('hue-rotate(290deg) contrast(135%) saturate(145%)');
        } else if (clip.colorPreset === 'vintage') {
            filters.push('sepia(35%) contrast(110%) saturate(85%) brightness(105%)');
        } else if (clip.colorPreset === 'sunset') {
            filters.push('sepia(25%) saturate(135%) contrast(115%)');
        } else if (clip.colorPreset === 'anime') {
            filters.push('saturate(165%) contrast(118%) brightness(106%)');
        } else if (clip.colorPreset === 'matrix') {
            filters.push('hue-rotate(65deg) saturate(90%) contrast(135%) brightness(90%)');
        } else if (clip.colorPreset === 'kodak') {
            filters.push('sepia(18%) contrast(114%) saturate(125%) brightness(102%)');
        } else if (clip.colorPreset === 'moody') {
            filters.push('saturate(70%) contrast(145%) brightness(92%)');
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

    renderClipViralVFXOverlays(ctx, clip, drawW, drawH, mediaEl, localTime) {
        if (!clip.vfx) return;

        // 1. RGB Split / Chromatic Aberration Twitch
        if (clip.vfx.rgbSplit && clip.vfx.rgbSplit.enabled && mediaEl) {
            const amount = (clip.vfx.rgbSplit.amount !== undefined ? clip.vfx.rgbSplit.amount : 14);
            const twitch = Math.sin(localTime * 28.0) > 0.85 ? 1.6 : 1.0;
            const shift = amount * twitch;

            ctx.save();
            ctx.globalCompositeOperation = 'screen';
            ctx.globalAlpha = 0.48;

            // Red channel shift right
            ctx.drawImage(mediaEl, -drawW / 2 + shift, -drawH / 2, drawW, drawH);
            ctx.fillStyle = 'rgba(255, 20, 60, 0.32)';
            ctx.fillRect(-drawW / 2 + shift, -drawH / 2, drawW, drawH);

            // Blue channel shift left
            ctx.drawImage(mediaEl, -drawW / 2 - shift, -drawH / 2, drawW, drawH);
            ctx.fillStyle = 'rgba(20, 180, 255, 0.32)';
            ctx.fillRect(-drawW / 2 - shift, -drawH / 2, drawW, drawH);

            ctx.restore();
        }

        // 2. Analog 35mm Film Grain
        if (clip.vfx.filmGrain && clip.vfx.filmGrain.enabled) {
            const amount = clip.vfx.filmGrain.amount !== undefined ? clip.vfx.filmGrain.amount : 45;
            this.renderFilmGrain(ctx, drawW, drawH, amount, localTime);
        }

        // 3. VHS & Retro CRT
        if (clip.vfx.vhs && clip.vfx.vhs.enabled) {
            const intensity = clip.vfx.vhs.intensity !== undefined ? clip.vfx.vhs.intensity : 50;
            this.renderVhsOverlay(ctx, drawW, drawH, intensity, clip.vfx.vhs.osd !== false, localTime);
        }

        // 4. Cinematic Light Leak
        if (clip.vfx.lightLeak && clip.vfx.lightLeak.enabled) {
            const amount = clip.vfx.lightLeak.amount !== undefined ? clip.vfx.lightLeak.amount : 50;
            const tone = clip.vfx.lightLeak.tone || 'amber';
            this.renderLightLeakOverlay(ctx, drawW, drawH, amount, tone, localTime);
        }
    }

    renderFilmGrain(ctx, drawW, drawH, amount, localTime) {
        if (!this.grainCanvas) {
            this.grainCanvas = document.createElement('canvas');
            this.grainCanvas.width = 256;
            this.grainCanvas.height = 256;
            this.grainCtx = this.grainCanvas.getContext('2d');
            const imgData = this.grainCtx.createImageData(256, 256);
            const d = imgData.data;
            for (let i = 0; i < d.length; i += 4) {
                const val = Math.random() * 255;
                d[i] = val;
                d[i + 1] = val;
                d[i + 2] = val;
                d[i + 3] = 255;
            }
            this.grainCtx.putImageData(imgData, 0, 0);
            this.grainPattern = ctx.createPattern(this.grainCanvas, 'repeat');
        }

        ctx.save();
        ctx.globalCompositeOperation = 'overlay';
        ctx.globalAlpha = Math.min(0.55, (amount / 100) * 0.45);

        // Shift origin based on 24fps film flutter
        const seed = Math.floor(localTime * 24);
        const ox = (seed * 97) % 256;
        const oy = (seed * 131) % 256;
        ctx.translate(ox, oy);

        if (this.grainPattern) {
            ctx.fillStyle = this.grainPattern;
            ctx.fillRect(-drawW / 2 - ox, -drawH / 2 - oy, drawW, drawH);
        }
        ctx.restore();
    }

    renderVhsOverlay(ctx, drawW, drawH, intensity, showOsd, localTime) {
        ctx.save();

        // 1. CRT Scanlines
        ctx.fillStyle = 'rgba(0, 0, 0, ' + Math.min(0.35, (intensity / 100) * 0.28) + ')';
        for (let y = -drawH / 2; y < drawH / 2; y += 4) {
            ctx.fillRect(-drawW / 2, y, drawW, 1.5);
        }

        // 2. Tracking glitch band
        const trackY = ((-drawH / 2) + ((localTime * 90) % (drawH * 1.6))) - 100;
        ctx.fillStyle = 'rgba(255, 255, 255, ' + Math.min(0.18, (intensity / 100) * 0.12) + ')';
        ctx.fillRect(-drawW / 2, trackY, drawW, 26);

        // 3. VHS OSD
        if (showOsd) {
            ctx.font = 'bold 16px "Courier New", monospace';
            ctx.fillStyle = 'rgba(80, 255, 120, 0.85)';
            ctx.shadowColor = 'rgba(80, 255, 120, 0.7)';
            ctx.shadowBlur = 6;
            ctx.fillText('PLAY  ▶  SP', -drawW / 2 + 24, -drawH / 2 + 36);

            // Blinking colon for time
            const blink = Math.floor(localTime * 2) % 2 === 0 ? ':' : ' ';
            ctx.fillText(`1998-09-16  21${blink}28`, -drawW / 2 + 24, drawH / 2 - 24);
        }

        ctx.restore();
    }

    renderLightLeakOverlay(ctx, drawW, drawH, amount, tone, localTime) {
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        const alpha = Math.min(0.85, (amount / 100) * 0.7);

        const angle = localTime * 0.6;
        const cx = Math.sin(angle) * (drawW * 0.4);
        const cy = -drawH * 0.35 + Math.cos(angle * 0.8) * 60;
        const rad = Math.max(drawW, drawH) * 0.75;

        const grad = ctx.createRadialGradient(cx, cy, 15, cx, cy, rad);

        if (tone === 'cyan') {
            grad.addColorStop(0, `rgba(30, 200, 255, ${alpha})`);
            grad.addColorStop(0.4, `rgba(40, 120, 255, ${alpha * 0.6})`);
            grad.addColorStop(0.8, `rgba(100, 50, 220, ${alpha * 0.2})`);
        } else if (tone === 'neon') {
            grad.addColorStop(0, `rgba(255, 40, 180, ${alpha})`);
            grad.addColorStop(0.4, `rgba(180, 40, 255, ${alpha * 0.6})`);
            grad.addColorStop(0.8, `rgba(40, 200, 255, ${alpha * 0.2})`);
        } else { // amber / sunset
            grad.addColorStop(0, `rgba(255, 190, 60, ${alpha})`);
            grad.addColorStop(0.4, `rgba(255, 90, 40, ${alpha * 0.6})`);
            grad.addColorStop(0.8, `rgba(240, 40, 90, ${alpha * 0.2})`);
        }
        grad.addColorStop(1, 'transparent');

        ctx.fillStyle = grad;
        ctx.fillRect(-drawW / 2, -drawH / 2, drawW, drawH);
        ctx.restore();
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

    drawMaskShapePath(sctx, mask, w, h) {
        sctx.beginPath();
        const type = mask.type;
        if (type === 'circle') {
            const size = mask.size !== undefined ? mask.size : Math.min(w, h) * 0.7;
            const r = Math.max(5, size / 2);
            const cx = mask.x || 0;
            const cy = mask.y || 0;
            sctx.arc(cx, cy, r, 0, Math.PI * 2);
        } else if (type === 'rectangle') {
            const mw = mask.width !== undefined ? mask.width : w * 0.75;
            const mh = mask.height !== undefined ? mask.height : h * 0.75;
            const cx = mask.x || 0;
            const cy = mask.y || 0;
            const cr = mask.roundness || 0;
            if (typeof sctx.roundRect === 'function') {
                sctx.roundRect(cx - mw / 2, cy - mh / 2, mw, mh, cr);
            } else {
                sctx.rect(cx - mw / 2, cy - mh / 2, mw, mh);
            }
        } else if (type === 'linear') {
            const angle = (mask.rotation || 0) * Math.PI / 180;
            const pos = mask.pos || 0;
            const diag = Math.sqrt(w * w + h * h) * 1.5;
            sctx.save();
            sctx.rotate(angle);
            sctx.rect(-diag, -diag + pos, diag * 2, diag);
            sctx.restore();
        } else if (type === 'mirror') {
            const size = mask.size !== undefined ? mask.size : 200;
            const half = size / 2;
            sctx.rect(-w, -half, w * 2, size);
        }
    }

    applyFeatheredMask(bufferCanvas, bufferCtx, mask, bufW, bufH, feather, width, height) {
        const sctx = this.featherShapeCtx;
        const mctx = this.featherMaskCtx;
        sctx.clearRect(0, 0, bufW, bufH);
        mctx.clearRect(0, 0, bufW, bufH);

        sctx.save();
        sctx.translate(bufW / 2, bufH / 2);

        if (mask.inverted) {
            // Fill canvas with white with padding so blurring outer edges doesn't lose opacity
            sctx.fillStyle = '#ffffff';
            sctx.fillRect(-bufW / 2 - feather * 2, -bufH / 2 - feather * 2, bufW + feather * 4, bufH + feather * 4);
            sctx.globalCompositeOperation = 'destination-out';
            this.drawMaskShapePath(sctx, mask, width, height);
            sctx.fill();
            sctx.globalCompositeOperation = 'source-over';
        } else {
            sctx.fillStyle = '#ffffff';
            this.drawMaskShapePath(sctx, mask, width, height);
            sctx.fill();
        }
        sctx.restore();

        // Apply blur filter to generate soft alpha edge
        mctx.filter = `blur(${feather}px)`;
        mctx.drawImage(this.featherShapeCanvas, 0, 0);
        mctx.filter = 'none';

        // Composite blurred alpha mask into media buffer
        bufferCtx.save();
        bufferCtx.globalCompositeOperation = 'destination-in';
        bufferCtx.drawImage(this.featherMaskCanvas, 0, 0);
        bufferCtx.restore();
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

    processAutoCutout(sourceEl, drawW, drawH, autoCutout) {
        if (!this.cutoutCanvas) {
            this.cutoutCanvas = document.createElement('canvas');
            this.cutoutCtx = this.cutoutCanvas.getContext('2d', { willReadFrequently: true });
        }

        const targetW = Math.min(1280, Math.max(160, Math.round(drawW)));
        const targetH = Math.min(720, Math.max(90, Math.round(drawH)));

        if (this.cutoutCanvas.width !== targetW || this.cutoutCanvas.height !== targetH) {
            this.cutoutCanvas.width = targetW;
            this.cutoutCanvas.height = targetH;
        }

        const cctx = this.cutoutCtx;
        cctx.clearRect(0, 0, targetW, targetH);
        cctx.drawImage(sourceEl, 0, 0, targetW, targetH);

        const imgData = cctx.getImageData(0, 0, targetW, targetH);
        const data = imgData.data;

        const mode = autoCutout.mode || 'auto-subject';
        const sensitivity = autoCutout.sensitivity !== undefined ? autoCutout.sensitivity : 40;
        const smoothness = autoCutout.smoothness !== undefined ? autoCutout.smoothness : 15;

        if (mode === 'luma-dark') {
            // Cut out black / dark background (VFX fire, smoke, sparks, explosions)
            const threshold = (sensitivity / 100) * 128;
            const softRange = Math.max(1, smoothness * 1.5);

            for (let i = 0; i < data.length; i += 4) {
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];
                const luma = 0.299 * r + 0.587 * g + 0.114 * b;

                if (luma <= threshold) {
                    data[i + 3] = 0;
                } else if (luma < threshold + softRange) {
                    const f = (luma - threshold) / softRange;
                    data[i + 3] = Math.round(data[i + 3] * f);
                }
            }
        } else if (mode === 'luma-bright') {
            // Cut out white / bright background (logos, signatures, sketches)
            const threshold = 255 - ((sensitivity / 100) * 128);
            const softRange = Math.max(1, smoothness * 1.5);

            for (let i = 0; i < data.length; i += 4) {
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];
                const luma = 0.299 * r + 0.587 * g + 0.114 * b;

                if (luma >= threshold) {
                    data[i + 3] = 0;
                } else if (luma > threshold - softRange) {
                    const f = (threshold - luma) / softRange;
                    data[i + 3] = Math.round(data[i + 3] * f);
                }
            }
        } else {
            // 'auto-subject': Border perimeter sampling & bilinear background estimation
            let topR = 0, topG = 0, topB = 0, topCount = 0;
            let btmR = 0, btmG = 0, btmB = 0, btmCount = 0;
            let lftR = 0, lftG = 0, lftB = 0, lftCount = 0;
            let rgtR = 0, rgtG = 0, rgtB = 0, rgtCount = 0;
            const step = 4;

            // Sample top and bottom borders
            for (let x = 0; x < targetW; x += step) {
                for (let y = 0; y < 2; y++) {
                    const idx = (y * targetW + x) * 4;
                    topR += data[idx];
                    topG += data[idx + 1];
                    topB += data[idx + 2];
                    topCount++;
                }
                for (let y = targetH - 2; y < targetH; y++) {
                    const idx = (y * targetW + x) * 4;
                    btmR += data[idx];
                    btmG += data[idx + 1];
                    btmB += data[idx + 2];
                    btmCount++;
                }
            }
            // Sample left and right borders
            for (let y = 0; y < targetH; y += step) {
                for (let x = 0; x < 2; x++) {
                    const idx = (y * targetW + x) * 4;
                    lftR += data[idx];
                    lftG += data[idx + 1];
                    lftB += data[idx + 2];
                    lftCount++;
                }
                for (let x = targetW - 2; x < targetW; x++) {
                    const idx = (y * targetW + x) * 4;
                    rgtR += data[idx];
                    rgtG += data[idx + 1];
                    rgtB += data[idx + 2];
                    rgtCount++;
                }
            }

            const avgTopR = topCount > 0 ? topR / topCount : 0;
            const avgTopG = topCount > 0 ? topG / topCount : 0;
            const avgTopB = topCount > 0 ? topB / topCount : 0;

            const avgBtmR = btmCount > 0 ? btmR / btmCount : 0;
            const avgBtmG = btmCount > 0 ? btmG / btmCount : 0;
            const avgBtmB = btmCount > 0 ? btmB / btmCount : 0;

            const avgLftR = lftCount > 0 ? lftR / lftCount : 0;
            const avgLftG = lftCount > 0 ? lftG / lftCount : 0;
            const avgLftB = lftCount > 0 ? lftB / lftCount : 0;

            const avgRgtR = rgtCount > 0 ? rgtR / rgtCount : 0;
            const avgRgtG = rgtCount > 0 ? rgtG / rgtCount : 0;
            const avgRgtB = rgtCount > 0 ? rgtB / rgtCount : 0;

            const meanBgR = (avgTopR + avgBtmR + avgLftR + avgRgtR) / 4;
            const meanBgG = (avgTopG + avgBtmG + avgLftG + avgRgtG) / 4;
            const meanBgB = (avgTopB + avgBtmB + avgLftB + avgRgtB) / 4;

            const colLftRgtR = new Float32Array(targetW);
            const colLftRgtG = new Float32Array(targetW);
            const colLftRgtB = new Float32Array(targetW);
            for (let x = 0; x < targetW; x++) {
                const tx = x / targetW;
                colLftRgtR[x] = (1 - tx) * avgLftR + tx * avgRgtR;
                colLftRgtG[x] = (1 - tx) * avgLftG + tx * avgRgtG;
                colLftRgtB[x] = (1 - tx) * avgLftB + tx * avgRgtB;
            }

            const tolerance = (sensitivity / 100) * 140 + 8;
            const smooth = Math.max(2, smoothness * 2.0);

            for (let y = 0; y < targetH; y++) {
                const ty = y / targetH;
                const rowTopBtmR = (1 - ty) * avgTopR + ty * avgBtmR;
                const rowTopBtmG = (1 - ty) * avgTopG + ty * avgBtmG;
                const rowTopBtmB = (1 - ty) * avgTopB + ty * avgBtmB;

                for (let x = 0; x < targetW; x++) {
                    const expectedR = (rowTopBtmR + colLftRgtR[x]) * 0.5;
                    const expectedG = (rowTopBtmG + colLftRgtG[x]) * 0.5;
                    const expectedB = (rowTopBtmB + colLftRgtB[x]) * 0.5;

                    const i = (y * targetW + x) * 4;
                    const r = data[i];
                    const g = data[i + 1];
                    const b = data[i + 2];

                    // Delta to predicted background
                    const dr = r - expectedR;
                    const dg = g - expectedG;
                    const db = b - expectedB;
                    const distBi = Math.sqrt(dr * dr + dg * dg + db * db);

                    // Delta to mean background
                    const dmr = r - meanBgR;
                    const dmg = g - meanBgG;
                    const dmb = b - meanBgB;
                    const distMean = Math.sqrt(dmr * dmr + dmg * dmg + dmb * dmb);

                    const dist = Math.min(distBi, distMean);

                    if (dist <= tolerance) {
                        data[i + 3] = 0;
                    } else if (dist < tolerance + smooth) {
                        const factor = (dist - tolerance) / smooth;
                        data[i + 3] = Math.round(data[i + 3] * factor);
                    }
                }
            }
        }

        cctx.putImageData(imgData, 0, 0);
        return this.cutoutCanvas;
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
                console.warn('Failed to pick color:', err);
            }
        };

        this.canvas.addEventListener('click', onClick, { capture: true, once: true });
    }

    getAudioReactiveData(t) {
        if (window.audioAnalyzer && typeof window.audioAnalyzer.getReactiveData === 'function') {
            return window.audioAnalyzer.getReactiveData(t);
        }
        const beatEnergy = Math.abs(Math.sin(t * 7.5)) * 0.7 + Math.abs(Math.cos(t * 3.75)) * 0.3;
        const spectrum = new Float32Array(64);
        for (let i = 0; i < 64; i++) {
            spectrum[i] = Math.abs(Math.sin(t * 6 + i * 0.65)) * Math.abs(Math.cos(t * 3 - i * 0.3));
        }
        return {
            bass: beatEnergy,
            mid: Math.abs(Math.sin(t * 4)),
            treble: Math.abs(Math.cos(t * 8)),
            overall: (beatEnergy + 0.5) / 1.5,
            spectrum,
            isBeat: beatEnergy > 0.85
        };
    }

    getTimelineAudioTitle() {
        if (!window.timeline || !window.timeline.clips) return 'Lo-Fi Track';
        const audioClip = window.timeline.clips.find(c => c.trackId === 'audio' || c.type === 'audio');
        if (!audioClip) return 'Lo-Fi Track';
        let name = audioClip.title || audioClip.name || 'Lo-Fi Track';
        name = name.replace(/\.(mp3|wav|ogg|flac|m4a|aac)$/i, '');
        name = name.replace(/^[🎵🎶🎧\s]+/, '').trim();
        return name || 'Lo-Fi Track';
    }

    renderProceduralDemo(clip, width, height, targetCtx = null) {
        const ctx = targetCtx || this.ctx;
        const w = width;
        const h = height;
        const localTime = Math.max(0, Math.min(clip.duration, this.currentTime - clip.startTime));
        const t = this.getClipSourceTime(clip, localTime);
        const pattern = clip.demoPattern || 'neon';

        if (pattern === 'gameplay') {
            // Sci-Fi / Tactical FPS Gameplay Simulation
            const grad = ctx.createLinearGradient(-w/2, -h/2, w/2, h/2);
            grad.addColorStop(0, '#060c18');
            grad.addColorStop(0.6, '#0d1b2a');
            grad.addColorStop(1, '#050a14');
            ctx.fillStyle = grad;
            ctx.fillRect(-w/2, -h/2, w, h);

            // Tech Hex / Grid Floor
            ctx.strokeStyle = 'rgba(0, 212, 130, 0.08)';
            ctx.lineWidth = 1.5;
            const step = 60;
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

            // Animated Aim Reticle / Crosshairs
            const targetX = Math.sin(t * 1.8) * (w * 0.18);
            const targetY = Math.cos(t * 2.3) * (h * 0.14);

            ctx.save();
            ctx.translate(targetX, targetY);
            ctx.strokeStyle = '#00d482';
            ctx.lineWidth = 2;

            // Reticle circle
            ctx.beginPath();
            ctx.arc(0, 0, 36, 0, Math.PI * 2);
            ctx.stroke();

            // Crosshair ticks
            ctx.beginPath();
            ctx.moveTo(-48, 0); ctx.lineTo(-24, 0);
            ctx.moveTo(24, 0); ctx.lineTo(48, 0);
            ctx.moveTo(0, -48); ctx.lineTo(0, -24);
            ctx.moveTo(0, 24); ctx.lineTo(0, 48);
            ctx.stroke();

            // Center dot
            ctx.fillStyle = '#ff3366';
            ctx.beginPath();
            ctx.arc(0, 0, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

            // HUD Elements: Mini Radar (Top Right)
            const radarX = w/2 - 80;
            const radarY = -h/2 + 80;
            ctx.strokeStyle = 'rgba(0, 212, 130, 0.4)';
            ctx.fillStyle = 'rgba(0, 30, 20, 0.6)';
            ctx.beginPath();
            ctx.arc(radarX, radarY, 44, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Radar Sweep line
            const sweepAngle = (t * 3.5) % (Math.PI * 2);
            ctx.beginPath();
            ctx.moveTo(radarX, radarY);
            ctx.lineTo(radarX + Math.cos(sweepAngle) * 44, radarY + Math.sin(sweepAngle) * 44);
            ctx.stroke();

            // HUD Elements: Health & Shield Bars (Bottom Left)
            const hudX = -w/2 + 30;
            const hudY = h/2 - 50;
            ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
            ctx.fillRect(hudX, hudY, 160, 16);
            ctx.fillStyle = '#00d482';
            const healthW = 110 + Math.sin(t * 4) * 20;
            ctx.fillRect(hudX + 2, hudY + 2, healthW, 12);

            ctx.fillStyle = '#ffffff';
            ctx.font = '10px monospace';
            ctx.fillText('HP 100 • 60 FPS', hudX, hudY - 6);

        } else if (pattern === 'facecam') {
            // Streamer Facecam / Webcam simulation
            const grad = ctx.createRadialGradient(0, 0, 20, 0, 0, w * 0.55);
            grad.addColorStop(0, '#2e1065');
            grad.addColorStop(0.6, '#180d2d');
            grad.addColorStop(1, '#0b0617');
            ctx.fillStyle = grad;
            ctx.fillRect(-w/2, -h/2, w, h);

            // Stylized Streamer Avatar Silhouette
            ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
            ctx.beginPath();
            // Head
            ctx.arc(0, -20, 48, 0, Math.PI * 2);
            ctx.fill();
            // Shoulders
            ctx.beginPath();
            ctx.arc(0, 100, 90, Math.PI, 0);
            ctx.fill();

            // Headphones band & earcups
            ctx.strokeStyle = '#00d482';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(0, -26, 54, Math.PI * 0.85, Math.PI * 2.15);
            ctx.stroke();
            ctx.fillStyle = '#00d482';
            ctx.fillRect(-58, -35, 10, 22);
            ctx.fillRect(48, -35, 10, 22);

            // Dynamic Audio Equalizer Bars at bottom of facecam
            const bars = 10;
            const barW = 8;
            const spacing = 4;
            const totalBarsW = bars * (barW + spacing);
            const startX = -totalBarsW / 2;
            const baseY = h/2 - 24;

            for (let i = 0; i < bars; i++) {
                const barH = 6 + Math.abs(Math.sin(t * 8 + i * 0.8)) * 26;
                ctx.fillStyle = (i % 2 === 0) ? '#00d482' : '#38bdf8';
                ctx.fillRect(startX + i * (barW + spacing), baseY - barH, barW, barH);
            }

            // Status Badge
            ctx.fillStyle = 'rgba(239, 68, 68, 0.9)';
            ctx.beginPath();
            ctx.roundRect(-w/2 + 14, -h/2 + 14, 52, 18, 4);
            ctx.fill();
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 9px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('🔴 LIVE', -w/2 + 40, -h/2 + 26);

        } else if (pattern === 'podcast') {
            // Warm Studio Acoustic Panels & Spectrum Equalizer
            const grad = ctx.createLinearGradient(-w/2, -h/2, w/2, h/2);
            grad.addColorStop(0, '#1c100b');
            grad.addColorStop(0.5, '#2e1810');
            grad.addColorStop(1, '#130b07');
            ctx.fillStyle = grad;
            ctx.fillRect(-w/2, -h/2, w, h);

            // Central Pulsing Soundwave Visualizer (28 spectrum bars)
            const numBars = 28;
            const barW = Math.max(3, w * 0.015);
            const gap = barW * 0.6;
            const totalW = numBars * (barW + gap);
            const startX = -totalW / 2;

            for (let i = 0; i < numBars; i++) {
                const harmonic = Math.sin(t * 6 + i * 0.45) * Math.cos(t * 3 - i * 0.2);
                const heightMult = 18 + Math.abs(harmonic) * (h * 0.22);
                const x = startX + i * (barW + gap);

                const barGrad = ctx.createLinearGradient(0, -heightMult, 0, heightMult);
                barGrad.addColorStop(0, '#f59e0b');
                barGrad.addColorStop(0.5, '#ef4444');
                barGrad.addColorStop(1, '#b45309');
                ctx.fillStyle = barGrad;

                ctx.beginPath();
                ctx.roundRect(x, -heightMult, barW, heightMult * 2, barW/2);
                ctx.fill();
            }

            // Warm Studio Bokeh particles
            ctx.fillStyle = 'rgba(245, 158, 11, 0.12)';
            for (let p = 0; p < 8; p++) {
                const bx = Math.sin(t * 0.5 + p) * (w * 0.35);
                const by = Math.cos(t * 0.7 + p * 1.5) * (h * 0.3);
                ctx.beginPath();
                ctx.arc(bx, by, 30 + p * 6, 0, Math.PI * 2);
                ctx.fill();
            }

        } else if (pattern === 'cinematic') {
            // Cinematic Anamorphic Twilight / Horizon
            const grad = ctx.createLinearGradient(0, -h/2, 0, h/2);
            grad.addColorStop(0, '#090d16');
            grad.addColorStop(0.4, '#1e293b');
            grad.addColorStop(0.65, '#3b1c14');
            grad.addColorStop(0.85, '#1e110d');
            grad.addColorStop(1, '#07090e');
            ctx.fillStyle = grad;
            ctx.fillRect(-w/2, -h/2, w, h);

            // Anamorphic Horizontal Flare streak
            const flareY = Math.sin(t * 0.4) * (h * 0.08);
            const flareGrad = ctx.createLinearGradient(-w/2, flareY, w/2, flareY);
            flareGrad.addColorStop(0, 'transparent');
            flareGrad.addColorStop(0.3, 'rgba(56, 189, 248, 0.15)');
            flareGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.65)');
            flareGrad.addColorStop(0.7, 'rgba(249, 115, 22, 0.25)');
            flareGrad.addColorStop(1, 'transparent');

            ctx.fillStyle = flareGrad;
            ctx.fillRect(-w/2, flareY - 4, w, 8);

            // Soft glowing horizon orb
            const orbGrad = ctx.createRadialGradient(0, flareY, 5, 0, flareY, 140);
            orbGrad.addColorStop(0, 'rgba(255, 255, 255, 0.35)');
            orbGrad.addColorStop(0.4, 'rgba(249, 115, 22, 0.2)');
            orbGrad.addColorStop(1, 'transparent');
            ctx.fillStyle = orbGrad;
            ctx.fillRect(-w/2, -h/2, w, h);

        } else if (pattern === 'viral') {
            // High-Energy Viral Gradient & Pulsing Radial Bursts
            const beatPulse = Math.abs(Math.sin(t * 8));
            const grad = ctx.createRadialGradient(0, 0, 10, 0, 0, w * (0.6 + beatPulse * 0.1));
            grad.addColorStop(0, '#ef4444');
            grad.addColorStop(0.4, '#8b5cf6');
            grad.addColorStop(0.8, '#1e1b4b');
            grad.addColorStop(1, '#09090b');
            ctx.fillStyle = grad;
            ctx.fillRect(-w/2, -h/2, w, h);

            // Dynamic Radial Speed Lines
            ctx.save();
            ctx.rotate(t * 0.2);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.09)';
            ctx.lineWidth = 3;
            const rays = 16;
            for (let r = 0; r < rays; r++) {
                const angle = (r / rays) * Math.PI * 2;
                ctx.beginPath();
                ctx.moveTo(Math.cos(angle) * 60, Math.sin(angle) * 60);
                ctx.lineTo(Math.cos(angle) * w, Math.sin(angle) * w);
                ctx.stroke();
            }
            ctx.restore();

            // Concentric shockwave ring
            const ringRadius = ((t * 220) % (w * 0.55));
            ctx.strokeStyle = `rgba(255, 230, 0, ${Math.max(0, 0.5 - ringRadius / (w * 0.55))})`;
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(0, 0, ringRadius, 0, Math.PI * 2);
            ctx.stroke();

        } else if (pattern.startsWith('reactive-')) {
            // Real Audio Spectrum & Frequency Data
            const audio = this.getAudioReactiveData(this.currentTime);
            const sensitivity = clip.sensitivity || 1.0;
            const bass = Math.min(1.0, (audio.bass || 0) * sensitivity);
            const mid = Math.min(1.0, (audio.mid || 0) * sensitivity);
            const treble = Math.min(1.0, (audio.treble || 0) * sensitivity);
            const overall = Math.min(1.0, (audio.overall || 0) * sensitivity);
            const spectrum = audio.spectrum || new Float32Array(64);
            const isBeat = audio.isBeat || (bass > 0.65);
            const primaryColor = clip.color1 || '#00d482';
            const secondaryColor = clip.color2 || '#38bdf8';
            const userBars = clip.numBars || 64;
            const minDim = Math.min(w, h);

            if (!clip.transparentBg) {
                const bgGrad = ctx.createRadialGradient(0, 0, 10, 0, 0, w * 0.6);
                bgGrad.addColorStop(0, '#0a0818');
                bgGrad.addColorStop(0.7, '#04030a');
                bgGrad.addColorStop(1, '#000000');
                ctx.fillStyle = bgGrad;
                ctx.fillRect(-w/2, -h/2, w, h);
            }

            if (pattern === 'reactive-circle') {
                // 1. Trap Nation / Monstercat Circular Visualizer
                const baseRadius = minDim * 0.16 + bass * 25;
                const coreGrad = ctx.createRadialGradient(0, 0, baseRadius * 0.2, 0, 0, baseRadius * 1.2);
                coreGrad.addColorStop(0, primaryColor);
                coreGrad.addColorStop(0.6, secondaryColor);
                coreGrad.addColorStop(1, 'transparent');
                ctx.fillStyle = coreGrad;
                ctx.beginPath();
                ctx.arc(0, 0, baseRadius * (1.1 + bass * 0.25), 0, Math.PI * 2);
                ctx.fill();

                ctx.save();
                ctx.rotate(t * 0.25);
                for (let i = 0; i < userBars; i++) {
                    const angle = (i / userBars) * Math.PI * 2;
                    const specIdx = Math.floor((i / userBars) * 64);
                    const freqVal = spectrum[specIdx] || (Math.abs(Math.sin(t * 6 + i * 0.5)) * 0.4);
                    const barLen = 10 + freqVal * (minDim * 0.22 + bass * 40);

                    const x1 = Math.cos(angle) * baseRadius;
                    const y1 = Math.sin(angle) * baseRadius;
                    const x2 = Math.cos(angle) * (baseRadius + barLen);
                    const y2 = Math.sin(angle) * (baseRadius + barLen);

                    ctx.strokeStyle = (i % 2 === 0) ? primaryColor : secondaryColor;
                    ctx.lineWidth = Math.max(2, (2 * Math.PI * baseRadius) / (userBars * 1.6));
                    ctx.lineCap = 'round';
                    ctx.beginPath();
                    ctx.moveTo(x1, y1);
                    ctx.lineTo(x2, y2);
                    ctx.stroke();
                }
                ctx.restore();

                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 2.5;
                ctx.beginPath();
                ctx.arc(0, 0, baseRadius, 0, Math.PI * 2);
                ctx.stroke();

                for (let p = 0; p < 20; p++) {
                    const pAngle = (p * 0.314 + t * 0.6) % (Math.PI * 2);
                    const pDist = baseRadius + 20 + ((t * 110 + p * 35) % (minDim * 0.32));
                    ctx.fillStyle = (p % 2 === 0) ? primaryColor : secondaryColor;
                    ctx.beginPath();
                    ctx.arc(Math.cos(pAngle) * pDist, Math.sin(pAngle) * pDist, 2 + bass * 2, 0, Math.PI * 2);
                    ctx.fill();
                }

            } else if (pattern === 'reactive-equalizer') {
                // 2. Neon City Spectrum Equalizer Bars
                const barCount = Math.min(userBars, 64);
                const totalW = w * 0.88;
                const barW = totalW / barCount;
                const actualW = Math.max(2, barW - 3);
                const startX = -totalW / 2;
                const baseY = h * 0.28;

                for (let i = 0; i < barCount; i++) {
                    const x = startX + i * barW;
                    const specIdx = Math.floor((i / barCount) * 64);
                    const freq = spectrum[specIdx] || 0.1;
                    const barH = 10 + freq * (h * 0.58) * (1 + bass * 0.3);

                    const barGrad = ctx.createLinearGradient(0, baseY - barH, 0, baseY);
                    barGrad.addColorStop(0, primaryColor);
                    barGrad.addColorStop(0.5, secondaryColor);
                    barGrad.addColorStop(1, '#1e1b4b');
                    ctx.fillStyle = barGrad;

                    ctx.beginPath();
                    ctx.roundRect(x, baseY - barH, actualW, barH, 3);
                    ctx.fill();

                    const peakY = baseY - barH - 5;
                    ctx.fillStyle = '#ffffff';
                    ctx.fillRect(x, peakY, actualW, 2.5);
                }

            } else if (pattern === 'reactive-mirrored') {
                // 3. Modern Mirrored Stereo Spectrum (Top & Bottom)
                const barCount = Math.min(userBars, 56);
                const totalW = w * 0.85;
                const barW = totalW / barCount;
                const actualW = Math.max(2, barW - 4);
                const startX = -totalW / 2;
                const midY = 0;

                for (let i = 0; i < barCount; i++) {
                    const x = startX + i * barW;
                    const specIdx = Math.floor(Math.abs(i - barCount / 2) / (barCount / 2) * 63);
                    const freq = spectrum[specIdx] || 0.1;
                    const halfH = 8 + freq * (h * 0.32) * (1 + bass * 0.4);

                    const grad = ctx.createLinearGradient(0, -halfH, 0, halfH);
                    grad.addColorStop(0, primaryColor);
                    grad.addColorStop(0.5, '#ffffff');
                    grad.addColorStop(1, secondaryColor);
                    ctx.fillStyle = grad;

                    ctx.beginPath();
                    ctx.roundRect(x, -halfH, actualW, halfH * 2, actualW / 2);
                    ctx.fill();
                }

                ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(-w/2, midY);
                ctx.lineTo(w/2, midY);
                ctx.stroke();

            } else if (pattern === 'reactive-waveform') {
                // 4. Electric Oscilloscope Laser Waveform
                ctx.save();
                ctx.shadowBlur = 15;
                ctx.shadowColor = primaryColor;
                ctx.strokeStyle = primaryColor;
                ctx.lineWidth = 3 + bass * 3;

                ctx.beginPath();
                const points = 120;
                for (let i = 0; i < points; i++) {
                    const x = -w/2 + (i / (points - 1)) * w;
                    const specIdx = Math.floor((i / points) * 64);
                    const freqVal = spectrum[specIdx] || 0.1;
                    const carrier = Math.sin(i * 0.2 + t * 6) * Math.cos(i * 0.08 - t * 3);
                    const y = carrier * (minDim * 0.18) * (freqVal * 2.5 + bass * 0.6);

                    if (i === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                ctx.stroke();

                ctx.shadowBlur = 0;
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 1.5;
                ctx.stroke();
                ctx.restore();

            } else if (pattern === 'reactive-portal') {
                // 5. Hypnotic Cosmic Tunnel / Portal
                const layers = 9;
                const maxR = minDim * 0.48;
                for (let l = 0; l < layers; l++) {
                    const progress = ((l + (t * 0.7) % 1) / layers);
                    const r = maxR * progress * (1 + bass * 0.18);
                    const rot = (l % 2 === 0 ? 1 : -1) * (t * 0.4 + l * 0.15);

                    ctx.save();
                    ctx.rotate(rot);
                    const color = l % 2 === 0 ? primaryColor : secondaryColor;
                    ctx.strokeStyle = color;
                    ctx.lineWidth = 2 + (1 - progress) * 3;

                    const points = 6;
                    ctx.beginPath();
                    for (let p = 0; p < points; p++) {
                        const angle = (p / points) * Math.PI * 2;
                        const px = Math.cos(angle) * r;
                        const py = Math.sin(angle) * r;
                        if (p === 0) ctx.moveTo(px, py);
                        else ctx.lineTo(px, py);
                    }
                    ctx.closePath();
                    ctx.stroke();
                    ctx.restore();
                }

            } else if (pattern === 'reactive-synthwave') {
                // 6. Outrun 80s Synthwave Sun & Mountains
                const skyGrad = ctx.createLinearGradient(0, -h/2, 0, 0);
                skyGrad.addColorStop(0, '#0a0518');
                skyGrad.addColorStop(0.5, '#2e0854');
                skyGrad.addColorStop(1, '#f43f5e');
                ctx.fillStyle = skyGrad;
                ctx.fillRect(-w/2, -h/2, w, h/2);

                const sunRadius = minDim * 0.18 * (1 + bass * 0.15);
                const sunY = -h * 0.08;
                const sunGrad = ctx.createLinearGradient(0, sunY - sunRadius, 0, sunY + sunRadius);
                sunGrad.addColorStop(0, '#fef08a');
                sunGrad.addColorStop(0.5, '#f59e0b');
                sunGrad.addColorStop(1, '#ec4899');
                ctx.fillStyle = sunGrad;
                ctx.beginPath();
                ctx.arc(0, sunY, sunRadius, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = '#0a0518';
                for (let s = 1; s <= 6; s++) {
                    const stripeY = sunY + (s * (sunRadius / 6));
                    ctx.fillRect(-sunRadius, stripeY, sunRadius * 2, s * 2.2);
                }

                const beatBounce = bass * 25;
                ctx.fillStyle = '#1e0836';
                ctx.beginPath();
                ctx.moveTo(-w/2, 0);
                ctx.lineTo(-w * 0.25, -45 - beatBounce);
                ctx.lineTo(-w * 0.05, 0);
                ctx.lineTo(w * 0.18, -60 - beatBounce * 1.4);
                ctx.lineTo(w * 0.38, -25);
                ctx.lineTo(w/2, 0);
                ctx.lineTo(w/2, h/2);
                ctx.lineTo(-w/2, h/2);
                ctx.fill();

                const floorGrad = ctx.createLinearGradient(0, 0, 0, h/2);
                floorGrad.addColorStop(0, '#030208');
                floorGrad.addColorStop(1, '#110426');
                ctx.fillStyle = floorGrad;
                ctx.fillRect(-w/2, 0, w, h/2);

                ctx.strokeStyle = primaryColor;
                ctx.lineWidth = 1.5;
                const numGridV = 16;
                for (let i = -numGridV/2; i <= numGridV/2; i++) {
                    ctx.beginPath();
                    ctx.moveTo(0, 0);
                    ctx.lineTo(i * (w / (numGridV * 0.4)), h/2);
                    ctx.stroke();
                }

                const floorOffset = (t * 140 * (1 + bass * 0.8)) % 35;
                for (let y = 0; y < h/2; y += 35) {
                    const actualY = Math.pow((y + floorOffset) / (h/2), 2) * (h/2);
                    if (actualY <= h/2) {
                        ctx.strokeStyle = secondaryColor;
                        ctx.beginPath();
                        ctx.moveTo(-w/2, actualY);
                        ctx.lineTo(w/2, actualY);
                        ctx.stroke();
                    }
                }

            } else if (pattern === 'reactive-vinyl') {
                // 7. Photorealistic Lo-Fi Vinyl Turntable Disc
                const discR = Math.min(w, h) * 0.38 * (1 + bass * 0.03);
                const rotSpeed = clip.vinylSpeed !== undefined ? clip.vinylSpeed : 2.2;
                const rotAngle = t * rotSpeed;
                const projTitle = document.getElementById('projectTitle')?.value?.trim() || (window.projectManager?.currentProject?.title) || (window.timeline?.title);
                const songTitle = clip.vinylTitle || (projTitle && projTitle !== 'Nytt Projekt' ? projTitle : this.getTimelineAudioTitle());

                // 1. Vinyl Drop Shadow
                ctx.save();
                ctx.shadowColor = 'rgba(0, 0, 0, 0.65)';
                ctx.shadowBlur = 35;
                ctx.shadowOffsetY = 12;
                ctx.beginPath();
                ctx.arc(0, 0, discR, 0, Math.PI * 2);
                ctx.fillStyle = '#0a0d14';
                ctx.fill();
                ctx.restore();

                // 2. Main Vinyl Disc Body
                const discGrad = ctx.createRadialGradient(0, 0, discR * 0.1, 0, 0, discR);
                discGrad.addColorStop(0.0, '#1c1e24');
                discGrad.addColorStop(0.3, '#101216');
                discGrad.addColorStop(0.85, '#0c0d11');
                discGrad.addColorStop(0.98, '#181b22');
                discGrad.addColorStop(1.0, '#050608');
                ctx.fillStyle = discGrad;
                ctx.beginPath();
                ctx.arc(0, 0, discR, 0, Math.PI * 2);
                ctx.fill();

                // 3. Rotating Grooves & Sound Track Bands
                ctx.save();
                ctx.rotate(rotAngle);

                // Distinct track bands (Outer edge lead-in, 3 musical tracks, lead-out groove)
                const trackBands = [
                    { min: 0.94, max: 0.98, step: 2.5, alpha: 0.07 },
                    { min: 0.76, max: 0.93, step: 3.5, alpha: 0.12 },
                    { min: 0.58, max: 0.74, step: 3.0, alpha: 0.14 },
                    { min: 0.39, max: 0.56, step: 3.0, alpha: 0.10 },
                ];

                trackBands.forEach(band => {
                    ctx.beginPath();
                    for (let normR = band.min; normR <= band.max; normR += (band.step / discR)) {
                        const r = normR * discR;
                        ctx.arc(0, 0, r, 0, Math.PI * 2);
                    }
                    ctx.strokeStyle = `rgba(255, 255, 255, ${band.alpha})`;
                    ctx.lineWidth = 0.8;
                    ctx.stroke();
                });

                // Run-out dead wax etched matrix code (optional, disabled by default to keep vinyl 100% clean)
                if (clip.showRunoutText === true) {
                    ctx.save();
                    ctx.font = '600 10px monospace';
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    const shortTitle = (songTitle.length > 20 ? songTitle.slice(0, 18) + '..' : songTitle).toUpperCase();
                    ctx.fillText(`★ NOVACUT LO-FI • ${shortTitle} • 33-RPM ★`, 0, -discR * 0.36);
                    ctx.restore();
                }

                // 4. Center Paper Label (Sticker)
                const labelR = discR * 0.33;
                ctx.save();
                ctx.beginPath();
                ctx.arc(0, 0, labelR, 0, Math.PI * 2);
                ctx.clip();

                let drawnCustomImage = false;
                if (clip.vinylCoverUrl) {
                    let coverImg = this._vinylCoverCache?.get(clip.vinylCoverUrl);
                    if (!coverImg) {
                        this._vinylCoverCache = this._vinylCoverCache || new Map();
                        coverImg = new Image();
                        coverImg.src = clip.vinylCoverUrl;
                        coverImg.onload = () => this.render();
                        this._vinylCoverCache.set(clip.vinylCoverUrl, coverImg);
                    }
                    if (coverImg.complete && coverImg.naturalWidth > 0) {
                        ctx.drawImage(coverImg, -labelR, -labelR, labelR * 2, labelR * 2);
                        const imgVignette = ctx.createRadialGradient(0, 0, labelR * 0.6, 0, 0, labelR);
                        imgVignette.addColorStop(0, 'rgba(0,0,0,0)');
                        imgVignette.addColorStop(1, 'rgba(0,0,0,0.35)');
                        ctx.fillStyle = imgVignette;
                        ctx.fill();
                        drawnCustomImage = true;
                    }
                }

                if (!drawnCustomImage) {
                    const isVintage = clip.vinylLabelStyle === 'vintage';
                    if (!isVintage) {
                        // Clean, Bold, High-Readability Project Title Center Label (User requested: Enbart namnet på projektet, stort och läsbart!)
                        const labelColor = clip.color1 || '#dc2626';
                        const labelSecColor = clip.color2 || '#fef2f2';

                        const labelGrad = ctx.createRadialGradient(0, 0, labelR * 0.1, 0, 0, labelR);
                        labelGrad.addColorStop(0, labelSecColor);
                        labelGrad.addColorStop(0.3, labelSecColor);
                        labelGrad.addColorStop(0.35, labelColor);
                        labelGrad.addColorStop(0.95, labelColor);
                        labelGrad.addColorStop(1.0, '#450a0a');
                        ctx.fillStyle = labelGrad;
                        ctx.fill();

                        // Crisp gold/contrast border ring
                        ctx.strokeStyle = '#f59e0b';
                        ctx.lineWidth = 2.5;
                        ctx.beginPath();
                        ctx.arc(0, 0, labelR * 0.93, 0, Math.PI * 2);
                        ctx.stroke();

                        // Inner subtle dashed ring
                        ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
                        ctx.lineWidth = 1;
                        ctx.setLineDash([4, 4]);
                        ctx.beginPath();
                        ctx.arc(0, 0, labelR * 0.85, 0, Math.PI * 2);
                        ctx.stroke();
                        ctx.setLineDash([]);

                        // Display Title: ENBART namnet på projektet, stort, klart och tydligt!
                        ctx.save();
                        const cleanTitle = (songTitle || 'NOVACUT').trim().toUpperCase();
                        let fontSize = Math.floor(labelR * 0.30);
                        if (cleanTitle.length <= 6) fontSize = Math.floor(labelR * 0.38);
                        else if (cleanTitle.length <= 10) fontSize = Math.floor(labelR * 0.30);
                        else if (cleanTitle.length <= 16) fontSize = Math.floor(labelR * 0.23);
                        else fontSize = Math.floor(labelR * 0.18);
                        fontSize = Math.max(16, Math.min(46, fontSize));

                        ctx.fillStyle = '#ffffff';
                        ctx.font = `900 ${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
                        ctx.shadowBlur = 8;
                        ctx.shadowOffsetY = 2;
                        ctx.fillText(cleanTitle, 0, 0);
                        ctx.restore();
                    } else {
                        // Vintage Vinyl Record Label Design
                        const labelColor = clip.color1 || '#dc2626';
                        const labelSecColor = clip.color2 || '#fef3c7';

                        const labelGrad = ctx.createRadialGradient(0, 0, labelR * 0.2, 0, 0, labelR);
                        labelGrad.addColorStop(0, labelSecColor);
                        labelGrad.addColorStop(0.55, labelSecColor);
                        labelGrad.addColorStop(0.56, labelColor);
                        labelGrad.addColorStop(0.98, labelColor);
                        labelGrad.addColorStop(1.0, '#7f1d1d');
                        ctx.fillStyle = labelGrad;
                        ctx.fill();

                        // Outer golden ring on paper
                        ctx.strokeStyle = '#d97706';
                        ctx.lineWidth = 2;
                        ctx.beginPath();
                        ctx.arc(0, 0, labelR * 0.92, 0, Math.PI * 2);
                        ctx.stroke();

                        // Top curved / upper badge: "STEREO • 33 ⅓ RPM"
                        ctx.fillStyle = '#ffffff';
                        ctx.font = 'bold 10px -apple-system, BlinkMacSystemFont, sans-serif';
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.shadowColor = 'rgba(0,0,0,0.7)';
                        ctx.shadowBlur = 3;
                        ctx.fillText('★ 33 ⅓ RPM • STEREO ★', 0, -labelR * 0.72);
                        ctx.shadowBlur = 0;

                        // Middle Song Title
                        ctx.fillStyle = '#111827';
                        ctx.font = '900 13px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
                        const displayTitle = (songTitle.length > 16 ? songTitle.slice(0, 14) + '..' : songTitle).toUpperCase();
                        ctx.fillText(displayTitle, 0, -labelR * 0.26);

                        // Subtitle / Artist / Side A
                        ctx.fillStyle = '#4b5563';
                        ctx.font = 'bold 9px -apple-system, BlinkMacSystemFont, sans-serif';
                        ctx.fillText('SIDE A • LO-FI BEATS', 0, -labelR * 0.12);

                        // Lower Badge
                        ctx.fillStyle = '#ffffff';
                        ctx.font = 'bold 9px -apple-system, BlinkMacSystemFont, sans-serif';
                        ctx.fillText('HIGH FIDELITY', 0, labelR * 0.72);
                    }
                }

                ctx.restore(); // End of label clip

                // Spindle hole (center brass grommet & dark hole)
                // When an image (like Pedro or cover art) or clean title is shown, skip hole by default unless specifically checked!
                const drawCenterHole = clip.showCenterHole === true || (!drawnCustomImage && clip.vinylLabelStyle === 'vintage');
                if (drawCenterHole) {
                    const holeR = labelR * 0.12;
                    const brassGrad = ctx.createRadialGradient(0, 0, holeR * 0.7, 0, 0, holeR * 1.3);
                    brassGrad.addColorStop(0, '#78716c');
                    brassGrad.addColorStop(0.5, '#e7e5e4');
                    brassGrad.addColorStop(1, '#44403c');
                    ctx.fillStyle = brassGrad;
                    ctx.beginPath();
                    ctx.arc(0, 0, holeR * 1.3, 0, Math.PI * 2);
                    ctx.fill();

                    ctx.fillStyle = '#030712';
                    ctx.beginPath();
                    ctx.arc(0, 0, holeR * 0.85, 0, Math.PI * 2);
                    ctx.fill();
                }

                ctx.restore(); // End of rotating disc space

                // 5. Dynamic Anisotropic Specular Light Sheen (The iconic Vinyl Hourglass / Butterfly Reflection!)
                if (typeof ctx.createConicGradient === 'function') {
                    ctx.save();
                    const lightAngle = -Math.PI / 4 + Math.sin(t * 0.8) * 0.08;
                    const sheen = ctx.createConicGradient(lightAngle, 0, 0);

                    const hiAlpha = 0.26 + bass * 0.12;
                    const midAlpha = 0.06;
                    sheen.addColorStop(0.00, `rgba(255, 255, 255, ${hiAlpha})`);
                    sheen.addColorStop(0.08, `rgba(255, 255, 255, ${midAlpha})`);
                    sheen.addColorStop(0.20, 'rgba(0, 0, 0, 0.4)');
                    sheen.addColorStop(0.25, 'rgba(255, 255, 255, 0.03)');
                    sheen.addColorStop(0.30, 'rgba(0, 0, 0, 0.4)');
                    sheen.addColorStop(0.42, `rgba(255, 255, 255, ${midAlpha})`);
                    sheen.addColorStop(0.50, `rgba(255, 255, 255, ${hiAlpha})`);
                    sheen.addColorStop(0.58, `rgba(255, 255, 255, ${midAlpha})`);
                    sheen.addColorStop(0.70, 'rgba(0, 0, 0, 0.4)');
                    sheen.addColorStop(0.75, 'rgba(255, 255, 255, 0.03)');
                    sheen.addColorStop(0.80, 'rgba(0, 0, 0, 0.4)');
                    sheen.addColorStop(0.92, `rgba(255, 255, 255, ${midAlpha})`);
                    sheen.addColorStop(1.00, `rgba(255, 255, 255, ${hiAlpha})`);

                    ctx.globalCompositeOperation = 'screen';
                    ctx.fillStyle = sheen;
                    ctx.beginPath();
                    ctx.arc(0, 0, discR * 0.98, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();
                }

                // 6. Turntable Tonearm with Stylus Needle
                if (clip.showTonearm !== false) {
                    ctx.save();
                    const armPivotX = discR * 1.05;
                    const armPivotY = -discR * 0.95;
                    const needleTargetX = discR * 0.65 + Math.sin(t * 0.5) * 4;
                    const needleTargetY = -discR * 0.15 + (bass * 3);

                    // Pivot base / counterweight
                    ctx.fillStyle = '#374151';
                    ctx.beginPath();
                    ctx.arc(armPivotX, armPivotY, 24, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.strokeStyle = '#4b5563';
                    ctx.lineWidth = 2.5;
                    ctx.stroke();

                    ctx.fillStyle = '#9ca3af';
                    ctx.beginPath();
                    ctx.arc(armPivotX, armPivotY, 12, 0, Math.PI * 2);
                    ctx.fill();

                    // Curved metallic tonearm pipe
                    ctx.strokeStyle = '#e5e7eb';
                    ctx.lineWidth = 5;
                    ctx.lineCap = 'round';
                    ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
                    ctx.shadowBlur = 8;
                    ctx.shadowOffsetY = 5;

                    ctx.beginPath();
                    ctx.moveTo(armPivotX, armPivotY);
                    const elbowX = armPivotX - (armPivotX - needleTargetX) * 0.35;
                    const elbowY = armPivotY + (needleTargetY - armPivotY) * 0.65;
                    ctx.quadraticCurveTo(elbowX, elbowY - 20, needleTargetX, needleTargetY);
                    ctx.stroke();

                    // Headshell / Cartridge
                    ctx.save();
                    ctx.translate(needleTargetX, needleTargetY);
                    const armAngle = Math.atan2(needleTargetY - elbowY, needleTargetX - elbowX);
                    ctx.rotate(armAngle);

                    ctx.fillStyle = '#1f2937';
                    ctx.strokeStyle = '#00d482';
                    ctx.lineWidth = 1.5;
                    ctx.beginPath();
                    ctx.roundRect(-14, -6, 28, 12, 3);
                    ctx.fill();
                    ctx.stroke();

                    // Stylus glowing tip indicator
                    ctx.fillStyle = '#00f2fe';
                    ctx.shadowColor = '#00f2fe';
                    ctx.shadowBlur = 6;
                    ctx.beginPath();
                    ctx.arc(12, 0, 2.5, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();

                    ctx.restore();
                }

            } else if (pattern === 'reactive-stars') {
                // 8. 3D Galaxy Starfield Hyperspace Warp
                const speed = 1.0 + bass * 4.0;
                const starCount = 100;
                for (let i = 0; i < starCount; i++) {
                    const seed = (i * 997 + Math.floor(t * 30 * speed)) % 1000;
                    const angle = (i / starCount) * Math.PI * 2;
                    const dist = (seed / 1000) * (minDim * 0.6);
                    const streak = isBeat ? (10 + bass * 25) : 3;

                    const x = Math.cos(angle) * dist;
                    const y = Math.sin(angle) * dist;
                    const x2 = Math.cos(angle) * (dist + streak);
                    const y2 = Math.sin(angle) * (dist + streak);

                    ctx.strokeStyle = (i % 3 === 0) ? primaryColor : ((i % 3 === 1) ? secondaryColor : '#ffffff');
                    ctx.lineWidth = 1.5 + bass;
                    ctx.beginPath();
                    ctx.moveTo(x, y);
                    ctx.lineTo(x2, y2);
                    ctx.stroke();
                }

            } else if (pattern === 'reactive-heartbeat') {
                // 9. Medical EKG / Pulse Monitor
                ctx.strokeStyle = 'rgba(239, 68, 68, 0.15)';
                ctx.lineWidth = 1;
                const gridStep = 40;
                for (let x = -w/2; x <= w/2; x += gridStep) {
                    ctx.beginPath(); ctx.moveTo(x, -h/2); ctx.lineTo(x, h/2); ctx.stroke();
                }
                for (let y = -h/2; y <= h/2; y += gridStep) {
                    ctx.beginPath(); ctx.moveTo(-w/2, y); ctx.lineTo(w/2, y); ctx.stroke();
                }

                ctx.save();
                ctx.shadowBlur = 12;
                ctx.shadowColor = primaryColor;
                ctx.strokeStyle = primaryColor;
                ctx.lineWidth = 3;

                ctx.beginPath();
                const totalPts = 100;
                const sweepX = ((t * 180) % w) - w/2;
                for (let i = 0; i < totalPts; i++) {
                    const x = -w/2 + (i / totalPts) * w;
                    let y = 0;
                    const distFromSweep = Math.abs(x - sweepX);
                    if (distFromSweep < 40) {
                        const spike = (isBeat ? -1 : 1) * (distFromSweep < 20 ? (minDim * 0.3 * (0.5 + bass * 0.8)) : -(minDim * 0.15));
                        y = spike * Math.sin(distFromSweep * 0.1);
                    }
                    if (i === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                ctx.stroke();
                ctx.restore();

                ctx.fillStyle = primaryColor;
                ctx.font = 'bold 13px monospace';
                ctx.fillText(`PULSE: ${isBeat ? '138 BPM 💥' : '128 BPM'}`, -w/2 + 25, -h/2 + 35);

            } else if (pattern === 'reactive-fire') {
                // 10. Audio-Reactive Flame Tongues
                const flameCount = 36;
                const flameW = w / flameCount;
                const startX = -w/2;
                const baseY = h/2;

                for (let i = 0; i < flameCount; i++) {
                    const x = startX + i * flameW;
                    const specIdx = Math.floor((i / flameCount) * 20); // Lows & mids
                    const freq = spectrum[specIdx] || 0.1;
                    const flameH = (minDim * 0.2) + freq * (minDim * 0.5) * (1 + bass * 0.6);

                    const flameGrad = ctx.createLinearGradient(0, baseY, 0, baseY - flameH);
                    flameGrad.addColorStop(0, primaryColor);
                    flameGrad.addColorStop(0.5, secondaryColor);
                    flameGrad.addColorStop(1, '#ffffff');
                    ctx.fillStyle = flameGrad;

                    ctx.beginPath();
                    ctx.moveTo(x - flameW * 0.5, baseY);
                    ctx.quadraticCurveTo(x, baseY - flameH * 1.2, x + flameW * 0.5, baseY);
                    ctx.fill();
                }

            } else if (pattern === 'reactive-matrix') {
                // 11. Matrix Digital Rain
                const cols = 28;
                const colW = w / cols;
                ctx.fillStyle = primaryColor;
                ctx.font = 'bold 12px monospace';

                for (let c = 0; c < cols; c++) {
                    const specIdx = Math.floor((c / cols) * 64);
                    const speed = 1.0 + (spectrum[specIdx] || 0.1) * 3.0 + bass * 2.0;
                    const colY = ((t * 80 * speed + c * 47) % (h * 1.2)) - h * 0.6;
                    const x = -w/2 + c * colW;

                    for (let r = 0; r < 8; r++) {
                        const y = colY - r * 16;
                        if (y > -h/2 && y < h/2) {
                            ctx.fillStyle = r === 0 ? '#ffffff' : primaryColor;
                            ctx.globalAlpha = Math.max(0.15, 1 - r * 0.12);
                            const charCode = 65 + ((c * 17 + r * 5 + Math.floor(t * 10)) % 26);
                            ctx.fillText(String.fromCharCode(charCode), x, y);
                        }
                    }
                }
                ctx.globalAlpha = 1.0;

            } else if (pattern === 'reactive-bass-flash') {
                // 12. Bass Drop Strobe Flash & Shockwaves
                if (isBeat) {
                    ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(0.85, 0.3 + bass * 0.5)})`;
                    ctx.fillRect(-w/2, -h/2, w, h);
                }

                const ringR = ((t * 300 * (1 + bass)) % (minDim * 0.7));
                ctx.strokeStyle = primaryColor;
                ctx.lineWidth = 4 + bass * 4;
                ctx.beginPath();
                ctx.arc(0, 0, ringR, 0, Math.PI * 2);
                ctx.stroke();

                ctx.fillStyle = secondaryColor;
                ctx.beginPath();
                ctx.arc(0, 0, minDim * 0.12 * (1 + bass * 0.3), 0, Math.PI * 2);
                ctx.fill();

            } else if (pattern === 'reactive-circular-wave') {
                // 13. Organic Liquid Ripple Ring
                const baseR = minDim * 0.22;
                ctx.save();
                ctx.strokeStyle = primaryColor;
                ctx.fillStyle = `rgba(${primaryColor.startsWith('#') ? '0, 212, 130' : '56, 189, 248'}, 0.2)`;
                ctx.lineWidth = 3 + bass * 2;

                const verts = 72;
                ctx.beginPath();
                for (let v = 0; v <= verts; v++) {
                    const angle = (v / verts) * Math.PI * 2;
                    const specIdx = Math.floor((v % verts / verts) * 64);
                    const waveVal = (spectrum[specIdx] || 0.1) * (minDim * 0.12) * (1 + bass * 0.5);
                    const curR = baseR + waveVal;
                    const vx = Math.cos(angle) * curR;
                    const vy = Math.sin(angle) * curR;
                    if (v === 0) ctx.moveTo(vx, vy);
                    else ctx.lineTo(vx, vy);
                }
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
                ctx.restore();

            } else if (pattern === 'reactive-dual-rings') {
                // 14. Dual Counter-Rotating Trap Rings
                const rInner = minDim * 0.14 + bass * 15;
                const rOuter = minDim * 0.28 + mid * 18;

                ctx.save();
                ctx.rotate(t * 0.4);
                ctx.strokeStyle = primaryColor;
                ctx.lineWidth = 2.5;
                const bars1 = 36;
                for (let i = 0; i < bars1; i++) {
                    const a = (i / bars1) * Math.PI * 2;
                    const specIdx = Math.floor((i / bars1) * 24);
                    const len = (spectrum[specIdx] || 0) * (minDim * 0.12);
                    ctx.beginPath();
                    ctx.moveTo(Math.cos(a) * rInner, Math.sin(a) * rInner);
                    ctx.lineTo(Math.cos(a) * (rInner + len), Math.sin(a) * (rInner + len));
                    ctx.stroke();
                }
                ctx.restore();

                ctx.save();
                ctx.rotate(-t * 0.3);
                ctx.strokeStyle = secondaryColor;
                ctx.lineWidth = 2.5;
                const bars2 = 48;
                for (let i = 0; i < bars2; i++) {
                    const a = (i / bars2) * Math.PI * 2;
                    const specIdx = 24 + Math.floor((i / bars2) * 38);
                    const len = (spectrum[specIdx] || 0) * (minDim * 0.15);
                    ctx.beginPath();
                    ctx.moveTo(Math.cos(a) * rOuter, Math.sin(a) * rOuter);
                    ctx.lineTo(Math.cos(a) * (rOuter + len), Math.sin(a) * (rOuter + len));
                    ctx.stroke();
                }
                ctx.restore();

            } else if (pattern === 'reactive-frequency-dots') {
                // 15. LED Dot Matrix Spectrum (VU-Meter Style)
                const cols = 32;
                const rows = 16;
                const totalW = w * 0.84;
                const totalH = h * 0.55;
                const dotW = totalW / cols;
                const dotH = totalH / rows;
                const dotR = Math.min(dotW, dotH) * 0.38;
                const startX = -totalW / 2;
                const startY = h * 0.25;

                for (let c = 0; c < cols; c++) {
                    const specIdx = Math.floor((c / cols) * 64);
                    const activeRows = Math.floor((spectrum[specIdx] || 0.05) * rows * (1 + bass * 0.4));
                    for (let r = 0; r < rows; r++) {
                        const cx = startX + c * dotW + dotW / 2;
                        const cy = startY - r * dotH;
                        const isLit = r <= activeRows;

                        let dotColor = '#10b981'; // Green
                        if (r > rows * 0.75) dotColor = '#ef4444'; // Red
                        else if (r > rows * 0.5) dotColor = '#f59e0b'; // Amber

                        ctx.fillStyle = isLit ? dotColor : '#18181b';
                        ctx.beginPath();
                        ctx.arc(cx, cy, dotR, 0, Math.PI * 2);
                        ctx.fill();
                    }
                }

            } else if (pattern === 'reactive-cyber-tunnel') {
                // 16. Wireframe Hexagon Cyber Tunnel
                const hexRings = 7;
                const maxHex = minDim * 0.5;
                for (let r = 0; r < hexRings; r++) {
                    const progress = ((r + (t * 0.8) % 1) / hexRings);
                    const curSize = maxHex * progress * (1 + bass * 0.25);
                    const rot = t * 0.3 + r * 0.1;

                    ctx.save();
                    ctx.rotate(rot);
                    ctx.strokeStyle = r % 2 === 0 ? primaryColor : secondaryColor;
                    ctx.lineWidth = 1.5 + (1 - progress) * 3;

                    ctx.beginPath();
                    for (let p = 0; p < 6; p++) {
                        const a = (p / 6) * Math.PI * 2;
                        const px = Math.cos(a) * curSize;
                        const py = Math.sin(a) * curSize;
                        if (p === 0) ctx.moveTo(px, py);
                        else ctx.lineTo(px, py);
                    }
                    ctx.closePath();
                    ctx.stroke();
                    ctx.restore();
                }
            }

        } else {
            // Default Neon Orb & Grid
            const grad = ctx.createLinearGradient(-w/2, -h/2, w/2, h/2);
            grad.addColorStop(0, '#111827');
            grad.addColorStop(0.5, '#1e1b4b');
            grad.addColorStop(1, '#0f172a');
            ctx.fillStyle = grad;
            ctx.fillRect(-w/2, -h/2, w, h);

            const orbX = Math.sin(t * 2) * (w * 0.25);
            const orbY = Math.cos(t * 2) * (h * 0.2);
            const radial = ctx.createRadialGradient(orbX, orbY, 10, orbX, orbY, 180);
            radial.addColorStop(0, '#00d482');
            radial.addColorStop(0.5, 'rgba(59, 130, 246, 0.4)');
            radial.addColorStop(1, 'transparent');
            ctx.fillStyle = radial;
            ctx.fillRect(-w/2, -h/2, w, h);

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
            let w = clip.isSticker ? (clip.stickerWidth || 240) : 600;
            let h = clip.isSticker ? (clip.stickerHeight || 160) : 400;
            if (!clip.isSticker) {
                // The box has to match what is actually painted: a cover-fitted
                // clip paints the whole frame, not its 1280x720 source, so the
                // visible overlay outside the old box was unclickable.
                const srcW = mediaEl?.videoWidth || mediaEl?.naturalWidth || this.canvas.width;
                const srcH = mediaEl?.videoHeight || mediaEl?.naturalHeight || this.canvas.height;
                const fit = window.NovaCutFit.fitRect(srcW, srcH, this.canvas.width, this.canvas.height, clip.fitMode || 'cover');
                w = fit.width;
                h = fit.height;
            }
            w *= scale;
            h *= scale;
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
        this.isResizingClip = false;
        this.resizeTarget = null;
        this.resizeStart = { scale: 1, distance: 1 };

        this.canvas.addEventListener('mousedown', (e) => {
            if (e.button !== 0) return;
            const pt = this.getCanvasCoordinates(e);

            if (!window.timeline) return;

            // 0. Motionleap Flow & Freeze Drawing Interception
            if (window.motionleapEngine && window.motionleapEngine.activeClipId) {
                const sel = window.timeline.clips.find(c => c.id === window.motionleapEngine.activeClipId);
                if (sel) {
                    const normX = Math.max(0, Math.min(1, pt.x / this.canvas.width));
                    const normY = Math.max(0, Math.min(1, pt.y / this.canvas.height));
                    window.motionleapEngine.handleMouseDown(sel, normX, normY);
                    return;
                }
            }

            const activeClips = window.timeline.getActiveClipsAt(this.currentTime);

            // 0. Corner handles of the selected clip resize it
            if (window.timeline.selectedClipId) {
                const sel = window.timeline.clips.find(c => c.id === window.timeline.selectedClipId);
                if (sel && activeClips.some(c => c.id === sel.id)) {
                    const selBounds = this.getClipBounds(sel);
                    if (selBounds && this.hitResizeHandle(selBounds, pt)) {
                        this.startResizingClip(sel, pt, selBounds);
                        return;
                    }
                }
            }

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
            if (window.motionleapEngine && window.motionleapEngine.activeClipId) {
                const sel = window.timeline?.clips.find(c => c.id === window.motionleapEngine.activeClipId);
                if (sel) {
                    const pt = this.getCanvasCoordinates(e);
                    const normX = Math.max(0, Math.min(1, pt.x / this.canvas.width));
                    const normY = Math.max(0, Math.min(1, pt.y / this.canvas.height));
                    window.motionleapEngine.handleMouseMove(sel, normX, normY);
                    if (window.motionleapEngine.isDrawing) return;
                }
            }

            if (this.isResizingClip && this.resizeTarget) {
                const pt = this.getCanvasCoordinates(e);
                const b = this.getClipBounds(this.resizeTarget);
                const centerX = b ? b.centerX : this.canvas.width / 2;
                const centerY = b ? b.centerY : this.canvas.height / 2;
                const distance = Math.hypot(pt.x - centerX, pt.y - centerY);
                this.resizeTarget.scale = Number(window.NovaCutFit
                    .resizedScale(this.resizeStart.scale, this.resizeStart.distance, distance)
                    .toFixed(2));
                const slider = document.getElementById('propScale');
                const label = document.getElementById('valScale');
                if (slider) slider.value = this.resizeTarget.scale;
                if (label) label.textContent = `${this.resizeTarget.scale.toFixed(2)}x`;
                this.render();
                return;
            }

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
                if (window.motionleapEngine && window.motionleapEngine.activeClipId) {
                    this.canvas.style.cursor = 'crosshair';
                    return;
                }
                const pt = this.getCanvasCoordinates(e);
                if (window.timeline) {
                    const activeClips = window.timeline.getActiveClipsAt(this.currentTime);
                    const selected = window.timeline.clips.find(c => c.id === window.timeline.selectedClipId);
                    const selBounds = selected && activeClips.some(c => c.id === selected.id)
                        ? this.getClipBounds(selected)
                        : null;
                    if (selBounds && this.hitResizeHandle(selBounds, pt)) {
                        const nearCorner = (pt.x < selBounds.centerX) === (pt.y < selBounds.centerY);
                        this.canvas.style.cursor = nearCorner ? 'nwse-resize' : 'nesw-resize';
                        return;
                    }
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
            if (window.motionleapEngine && window.motionleapEngine.activeClipId) {
                const sel = window.timeline?.clips.find(c => c.id === window.motionleapEngine.activeClipId);
                if (sel && window.motionleapEngine.isDrawing) {
                    window.motionleapEngine.handleMouseUp(sel);
                    return;
                }
            }

            if (this.isResizingClip) {
                this.isResizingClip = false;
                this.resizeTarget = null;
                this.canvas.style.cursor = 'default';
                this.render();
                return;
            }

            if (this.isDraggingClip) {
                this.isDraggingClip = false;
                this.dragTarget = null;
                this.activeSnapGuides = [];
                this.canvas.style.cursor = 'default';
                this.render();
            }
        });
    }

    /** Is pt (canvas pixels) on one of the four corner handles of bounds? */
    hitResizeHandle(bounds, pt, radius = 16) {
        const corners = [
            { x: bounds.left, y: bounds.top },
            { x: bounds.right, y: bounds.top },
            { x: bounds.left, y: bounds.bottom },
            { x: bounds.right, y: bounds.bottom }
        ];
        return corners.some(c => Math.hypot(pt.x - c.x, pt.y - c.y) <= radius);
    }

    startResizingClip(clip, pt, bounds) {
        this.isResizingClip = true;
        this.resizeTarget = clip;
        this.resizeStart = {
            scale: clip.scale || 1.0,
            distance: Math.max(1, Math.hypot(pt.x - bounds.centerX, pt.y - bounds.centerY))
        };
        this.activeSnapGuides = [];
        this.canvas.style.cursor = 'nwse-resize';
        this.render();
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

        // If Motionleap Cinemagraph editing is active on this clip:
        // Do NOT draw the green selection box or position pill!
        // Render ONLY the Motionleap flow paths, anchors, and freeze brush gizmo.
        if (window.motionleapEngine && window.motionleapEngine.activeClipId === clip.id) {
            window.motionleapEngine.renderOverlayGizmo(ctx, width, height);
            return;
        }

        // For full-screen background video/image:
        // Don't show bounding box clutter unless user is actively dragging it
        if (clip.trackId === 'video' && !this.isDraggingClip) {
            return;
        }

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

        } else if (type === 'vhs-damage') {
            // 📺 Analog VCR Tracking Noise & Band Distortions
            const t = this.currentTime;
            const noiseY = (Math.sin(t * 11) * 0.5 + 0.5) * height;
            ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
            ctx.fillRect(0, noiseY, width, 22);
            ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
            ctx.fillRect(0, (noiseY + 28) % height, width, 14);

            // Jitter scanlines
            for (let y = 0; y < height; y += 8) {
                if ((y + Math.floor(t * 30)) % 16 === 0) {
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
                    ctx.fillRect(0, y, width, 2);
                }
            }
        } else if (type === 'beat-shake') {
            // 🥁 Bass Drum / Beat Pulse Shake
            const t = this.currentTime * 24;
            const intensity = params.intensity || 1.0;
            const shake = Math.sin(t) * Math.exp(-((t % 6) / 2)) * 18 * intensity;
            ctx.save();
            ctx.globalAlpha = 0.35;
            ctx.drawImage(this.canvas, shake, 0);
            ctx.restore();
        } else if (type === 'vignette-warm') {
            // 🌅 Amber Golden Hour Vignette
            const rad = Math.max(width, height) * 0.72;
            const vignette = ctx.createRadialGradient(width/2, height/2, rad * 0.35, width/2, height/2, rad);
            vignette.addColorStop(0, 'transparent');
            vignette.addColorStop(0.7, 'rgba(180, 80, 10, 0.35)');
            vignette.addColorStop(1, 'rgba(40, 15, 0, 0.85)');
            ctx.fillStyle = vignette;
            ctx.fillRect(0, 0, width, height);
        } else if (type === 'light-leaks') {
            // 💡 Dynamic Organic Light Leaks
            const t = this.currentTime * 0.7;
            const leakX = width * (0.2 + Math.sin(t) * 0.25);
            const leakY = height * (0.2 + Math.cos(t * 0.8) * 0.2);
            const rad = Math.max(width, height) * 0.65;
            const grad = ctx.createRadialGradient(leakX, leakY, 20, leakX, leakY, rad);
            grad.addColorStop(0, 'rgba(255, 170, 40, 0.65)');
            grad.addColorStop(0.5, 'rgba(255, 70, 20, 0.3)');
            grad.addColorStop(1, 'transparent');
            ctx.save();
            ctx.globalCompositeOperation = 'screen';
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, width, height);
            ctx.restore();
        } else if (type === 'anamorphic-flare') {
            // 🔦 Horizontal Blue Anamorphic Flare
            const t = this.currentTime * 0.5;
            const flareY = height * (0.45 + Math.sin(t) * 0.15);
            ctx.save();
            ctx.globalCompositeOperation = 'screen';
            const grad = ctx.createLinearGradient(0, flareY - 30, 0, flareY + 30);
            grad.addColorStop(0, 'transparent');
            grad.addColorStop(0.5, 'rgba(0, 190, 255, 0.85)');
            grad.addColorStop(1, 'transparent');
            ctx.fillStyle = grad;
            ctx.fillRect(0, flareY - 30, width, 60);

            // Center hot star
            const star = ctx.createRadialGradient(width * 0.5, flareY, 5, width * 0.5, flareY, 140);
            star.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
            star.addColorStop(0.4, 'rgba(0, 220, 255, 0.5)');
            star.addColorStop(1, 'transparent');
            ctx.fillStyle = star;
            ctx.fillRect(0, flareY - 140, width, 280);
            ctx.restore();
        } else if (type === 'prism-rainbow') {
            // 🌈 Prism Glass Spectral Rainbow
            const t = this.currentTime * 0.4;
            ctx.save();
            ctx.globalCompositeOperation = 'screen';
            ctx.translate(width * 0.3, height * 0.3);
            ctx.rotate(0.3 + Math.sin(t) * 0.1);
            const rainbow = ctx.createLinearGradient(0, 0, width * 0.6, 0);
            rainbow.addColorStop(0, 'rgba(255, 0, 60, 0.35)');
            rainbow.addColorStop(0.2, 'rgba(255, 140, 0, 0.35)');
            rainbow.addColorStop(0.4, 'rgba(255, 240, 0, 0.35)');
            rainbow.addColorStop(0.6, 'rgba(0, 255, 120, 0.35)');
            rainbow.addColorStop(0.8, 'rgba(0, 180, 255, 0.35)');
            rainbow.addColorStop(1, 'rgba(180, 0, 255, 0.35)');
            ctx.fillStyle = rainbow;
            ctx.fillRect(-width * 0.5, -height * 0.5, width * 1.5, 90);
            ctx.restore();
        } else if (type === 'laser-grid') {
            // 🌐 80s Cyberpunk Perspective Grid
            ctx.save();
            ctx.strokeStyle = 'rgba(0, 240, 255, 0.45)';
            ctx.lineWidth = 1.5;
            const horizonY = height * 0.68;
            for (let i = 0; i < 14; i++) {
                const y = horizonY + Math.pow(i / 13, 2.2) * (height - horizonY);
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(width, y);
                ctx.stroke();
            }
            const vanishingX = width * 0.5;
            for (let x = -width * 0.5; x <= width * 1.5; x += width * 0.12) {
                ctx.beginPath();
                ctx.moveTo(vanishingX, horizonY);
                ctx.lineTo(x, height);
                ctx.stroke();
            }
            ctx.restore();
        } else if (type === 'crt-monitor') {
            // 🖥️ Retro CRT Monitor Curve & Phosphor
            ctx.fillStyle = 'rgba(0, 0, 0, 0.18)';
            for (let y = 0; y < height; y += 3) {
                ctx.fillRect(0, y, width, 1.2);
            }
            const crtGrad = ctx.createRadialGradient(width/2, height/2, width * 0.4, width/2, height/2, width * 0.85);
            crtGrad.addColorStop(0, 'transparent');
            crtGrad.addColorStop(1, 'rgba(0, 0, 0, 0.75)');
            ctx.fillStyle = crtGrad;
            ctx.fillRect(0, 0, width, height);
        } else if (type === 'halftone-dots') {
            // 📰 Pop Art Halftone Dots
            ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
            const spacing = 14;
            for (let x = spacing/2; x < width; x += spacing) {
                for (let y = spacing/2; y < height; y += spacing) {
                    ctx.beginPath();
                    ctx.arc(x, y, 2.5, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        } else if (type === 'fog-mist') {
            // 🌫️ Rolling Cinematic Fog & Mist
            const t = this.currentTime * 0.3;
            ctx.save();
            ctx.globalAlpha = 0.28;
            for (let i = 0; i < 4; i++) {
                const fx = ((i * 0.35 + t * 0.1) % 1.4 - 0.2) * width;
                const fy = height * (0.6 + i * 0.1);
                const grad = ctx.createRadialGradient(fx, fy, 20, fx, fy, width * 0.5);
                grad.addColorStop(0, 'rgba(230, 240, 255, 0.6)');
                grad.addColorStop(0.7, 'rgba(200, 220, 245, 0.2)');
                grad.addColorStop(1, 'transparent');
                ctx.fillStyle = grad;
                ctx.fillRect(0, height * 0.3, width, height * 0.7);
            }
            ctx.restore();
        } else if (type === 'fire-embers') {
            // 🔥 Rising Glowing Fire Embers
            const count = params.count || 55;
            const t = this.currentTime;
            ctx.save();
            ctx.globalCompositeOperation = 'screen';
            for (let i = 0; i < count; i++) {
                const seedX = ((i * 73.1 + 19.3) % 1) * width;
                const seedY = ((i * 41.7 + 83.2) % 1) * height;
                const speed = 70 + ((i * 29.1) % 1) * 120;
                const y = (seedY - t * speed + height) % height;
                const x = seedX + Math.sin(t * 3.0 + i) * 20;
                const r = 2.0 + ((i * 9.7) % 1) * 3.5;
                const col = (i % 3 === 0) ? 'rgba(255, 90, 0, 0.85)' : (i % 3 === 1 ? 'rgba(255, 180, 0, 0.9)' : 'rgba(255, 30, 0, 0.8)');
                ctx.fillStyle = col;
                ctx.beginPath();
                ctx.arc(x, y, r, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
        } else if (type === 'night-vision') {
            // 🟢 Military Green Phosphor Night Vision
            const rad = Math.min(width, height) * 0.48;
            ctx.save();
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.9)';
            ctx.lineWidth = Math.max(width, height) * 0.5;
            ctx.beginPath();
            ctx.arc(width / 2, height / 2, rad + ctx.lineWidth / 2, 0, Math.PI * 2);
            ctx.stroke();

            // Reticle crosshair
            ctx.strokeStyle = 'rgba(50, 255, 100, 0.5)';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(width / 2 - 25, height / 2);
            ctx.lineTo(width / 2 + 25, height / 2);
            ctx.moveTo(width / 2, height / 2 - 25);
            ctx.lineTo(width / 2, height / 2 + 25);
            ctx.stroke();
            ctx.restore();
        } else if (type === 'thermal-vision') {
            // 🌡️ Predator Thermal Overlay
            ctx.save();
            ctx.globalCompositeOperation = 'color-dodge';
            ctx.fillStyle = 'rgba(255, 0, 120, 0.25)';
            ctx.fillRect(0, 0, width, height);
            ctx.restore();
        } else if (type === 'matrix-rain') {
            // 🟩 Matrix Code Rain
            const t = this.currentTime;
            ctx.fillStyle = 'rgba(0, 255, 70, 0.85)';
            ctx.font = '700 14px monospace';
            const cols = 26;
            const colWidth = width / cols;
            const chars = '0123456789ABCDEF$#@*';
            for (let c = 0; c < cols; c++) {
                const speed = 180 + ((c * 37.1) % 1) * 220;
                const headY = (t * speed + c * 80) % (height + 200) - 100;
                const ch = chars[Math.floor((t * 10 + c) % chars.length)];
                ctx.fillText(ch, c * colWidth + 4, headY);
                ctx.fillStyle = 'rgba(0, 255, 70, 0.35)';
                for (let trail = 1; trail < 8; trail++) {
                    const trailY = headY - trail * 18;
                    if (trailY > 0 && trailY < height) {
                        ctx.fillText(chars[(c + trail) % chars.length], c * colWidth + 4, trailY);
                    }
                }
                ctx.fillStyle = 'rgba(0, 255, 70, 0.85)';
            }
        } else if (type === 'underwater') {
            // 🌊 Underwater Caustic Ripples
            const t = this.currentTime * 1.5;
            ctx.save();
            ctx.globalCompositeOperation = 'screen';
            ctx.strokeStyle = 'rgba(100, 220, 255, 0.35)';
            ctx.lineWidth = 3.0;
            for (let i = 0; i < 6; i++) {
                ctx.beginPath();
                for (let x = 0; x < width; x += 40) {
                    const y = height * (0.2 + i * 0.14) + Math.sin(x * 0.02 + t + i) * 25 + Math.cos(x * 0.04 - t) * 15;
                    if (x === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                ctx.stroke();
            }
            ctx.restore();
        } else if (type === 'strobe-party') {
            // ⚡ Rave Strobe & Color Pulse
            const t = this.currentTime;
            const flash = Math.floor(t * 8) % 2 === 0;
            if (flash) {
                ctx.save();
                ctx.globalCompositeOperation = 'screen';
                const colors = ['rgba(255, 255, 255, 0.4)', 'rgba(255, 0, 150, 0.3)', 'rgba(0, 255, 255, 0.3)'];
                ctx.fillStyle = colors[Math.floor(t * 4) % colors.length];
                ctx.fillRect(0, 0, width, height);
                ctx.restore();
            }
        }

        ctx.restore();
    }

    renderEmptyPlaceholder() {
        const { ctx, canvas } = this;
        ctx.fillStyle = '#0a0a0f';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        if (this.isExporting) return;

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
        const tracks = window.timeline?.tracks || [];
        const trackStates = window.timeline?.trackStates || {};

        const audioClips = activeClips.filter(c => {
            const trk = tracks.find(t => t.id === c.trackId);
            return c.type === 'audio' || (trk && trk.type === 'audio');
        });

        const activeAudioMediaIds = new Set();

        audioClips.forEach(clip => {
            const isMuted = trackStates[clip.trackId]?.muted || false;
            let el = this.mediaElements.get(clip.mediaId);
            if (!el && clip.filePath) {
                const src = clip.filePath.startsWith('file://') ? clip.filePath : `file://${clip.filePath}`;
                el = new Audio(src);
                el.preload = 'auto';
                if (clip.mediaId) this.mediaElements.set(clip.mediaId, el);
                const cache = document.getElementById('mediaCache');
                if (cache) cache.appendChild(el);
            }

            if (el && typeof el.play === 'function') {
                if (clip.mediaId) activeAudioMediaIds.add(clip.mediaId);
                const localTime = Math.max(0, Math.min(clip.duration, this.currentTime - clip.startTime));
                const computedVol = this.getClipAudioVolume(clip, localTime, activeClips);
                el.volume = isMuted ? 0 : Math.min(1.0, Math.max(0, computedVol));
                const clipRelativeTime = this.getClipSourceTime(clip, localTime);
                const currentSpeed = this.getClipInstantaneousSpeed(clip, localTime);
                el.preservesPitch = clip.preservesPitch !== false;
                el.playbackRate = Math.max(0.1, Math.min(16, currentSpeed));
                // audio trimmed past its own end loops too, rather than going silent
                const audioSourceTime = window.NovaCutFit.loopedTime(clipRelativeTime, el.duration);

                if (this.isPlaying) {
                    if (el.paused) el.play().catch(() => {});
                    if (Math.abs(el.currentTime - audioSourceTime) > 0.15) {
                        el.currentTime = audioSourceTime;
                    }
                } else {
                    if (!el.paused) el.pause();
                    if (Math.abs(el.currentTime - audioSourceTime) > 0.05) {
                        el.currentTime = audioSourceTime;
                    }
                }
            }
        });

        // Pause any audio elements not currently active or if playback is stopped
        this.mediaElements.forEach((el, mediaId) => {
            if (el && typeof el.pause === 'function' && el.tagName === 'AUDIO') {
                if (!this.isPlaying || !activeAudioMediaIds.has(mediaId)) {
                    if (!el.paused) {
                        el.pause();
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

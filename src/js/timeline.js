/**
 * NovaCut - Multi-Track Timeline System
 */
class NovaCutTimeline {
    constructor(engine) {
        this.engine = engine;

        this.pixelsPerSecond = 60; // 60px = 1 second
        this.snapThreshold = 8;    // in pixels
        this.snappingEnabled = true;
        this.followPlayhead = true;

        this.clips = [];
        this.selectedClipId = null;
        this.beatMarkers = [];

        this.tracks = [
            { id: 'text', name: 'Text 1', type: 'text' },
            { id: 'effect', name: 'Effektlager', type: 'effect' },
            { id: 'overlay', name: 'Overlay Video', type: 'overlay' },
            { id: 'video', name: 'Huvudvideo', type: 'video' },
            { id: 'audio', name: 'Ljudspår', type: 'audio' }
        ];

        this.trackStates = {
            text: { visible: true, locked: false },
            effect: { visible: true, locked: false },
            overlay: { visible: true, locked: false },
            video: { visible: true, locked: false },
            audio: { muted: false, locked: false }
        };

        this.viewport = document.getElementById('timelineViewport');
        this.canvasContainer = document.getElementById('timelineCanvas');
        this.rulerCanvas = document.getElementById('rulerCanvas');
        this.timeRuler = document.getElementById('timeRuler');
        this.playheadScrubber = document.getElementById('playheadScrubber');
        this.playheadHandle = document.getElementById('playheadHandle');

        // Dragging & trimming state
        this.activeDrag = null; // { type: 'move'|'trim-left'|'trim-right'|'scrub', clipId, startX, originalStart, originalDuration }

        // Waveform & filmstrip caches
        this.filmstripThumbCache = new Map();
        this.frameExtractionQueue = [];
        this.isExtractingFrame = false;

        this.initRuler();
        this.setupEvents();
        this.initTracks();

        // Responsive resize handling
        window.addEventListener('resize', () => {
            this.updateTimelineWidth();
            this.drawRuler();
            this.updatePlayheadPosition();
        });
    }

    initRuler() {
        this.updateTimelineWidth();
        this.drawRuler();
    }

    setZoom(pps) {
        this.pixelsPerSecond = Math.max(20, Math.min(300, pps));
        this.updateTimelineWidth();
        this.renderAllClips();
        this.drawRuler();
        this.updatePlayheadPosition();
    }

    updateTimelineWidth() {
        const viewportW = this.viewport ? this.viewport.clientWidth : 2000;
        const durationW = (this.engine.duration + 8) * this.pixelsPerSecond;
        const width = Math.max(viewportW, durationW, 1400);
        this.canvasContainer.style.minWidth = `${width}px`;
        this.canvasContainer.style.width = `${width}px`;
        this.rulerCanvas.width = width;
    }

    drawRuler() {
        const ctx = this.rulerCanvas.getContext('2d');
        const width = this.rulerCanvas.width;
        const height = this.rulerCanvas.height;
        const pps = this.pixelsPerSecond;

        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = '#161822';
        ctx.fillRect(0, 0, width, height);

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.fillStyle = '#9499ad';
        ctx.font = '10px "JetBrains Mono", monospace';

        const totalSeconds = Math.ceil(width / pps);

        for (let sec = 0; sec <= totalSeconds; sec++) {
            const x = sec * pps;

            // Main second line
            ctx.beginPath();
            ctx.moveTo(x, 10);
            ctx.lineTo(x, height);
            ctx.stroke();

            // Time label (e.g. 00:05)
            const m = Math.floor(sec / 60);
            const s = sec % 60;
            const timeStr = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
            ctx.fillText(timeStr, x + 4, 18);

            // Sub-second tick marks
            const subSteps = 4;
            for (let sub = 1; sub < subSteps; sub++) {
                const subX = x + (sub * (pps / subSteps));
                ctx.beginPath();
                ctx.moveTo(subX, 18);
                ctx.lineTo(subX, height);
                ctx.stroke();
            }
        }

        // Draw Beat Markers on Ruler
        if (this.beatMarkers && this.beatMarkers.length > 0) {
            ctx.save();
            this.beatMarkers.forEach(sec => {
                const x = sec * pps;
                if (x >= 0 && x <= width) {
                    // Amber diamond marker
                    ctx.fillStyle = '#ffcc00';
                    ctx.beginPath();
                    ctx.moveTo(x, 2);
                    ctx.lineTo(x + 4, 7);
                    ctx.lineTo(x, 12);
                    ctx.lineTo(x - 4, 7);
                    ctx.closePath();
                    ctx.fill();

                    // Vertical guide line
                    ctx.strokeStyle = 'rgba(255, 204, 0, 0.45)';
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(x, 12);
                    ctx.lineTo(x, height);
                    ctx.stroke();
                }
            });
            ctx.restore();
        }
    }

    addClip(clipData) {
        const clip = {
            id: clipData.id || `clip-${Date.now()}-${Math.floor(Math.random()*1000)}`,
            trackId: clipData.trackId || 'video',
            mediaId: clipData.mediaId || null,
            filePath: clipData.filePath || null,
            mediaName: clipData.mediaName || clipData.title || null,
            title: clipData.title || 'Nytt Klipp',
            type: clipData.type || 'video',
            startTime: clipData.startTime !== undefined ? clipData.startTime : 0,
            duration: clipData.duration || 4.0,
            sourceOffset: clipData.sourceOffset || 0,
            // Visual & transform properties
            posX: clipData.posX || 0,
            posY: clipData.posY || 0,
            scale: clipData.scale || 1.0,
            opacity: clipData.opacity !== undefined ? clipData.opacity : 1.0,
            rotation: clipData.rotation || 0,
            speed: clipData.speed || 1.0,
            blendMode: clipData.blendMode || 'source-over',
            // Text specific
            text: clipData.text || 'NovaCut Text',
            fontSize: clipData.fontSize || 64,
            fontFamily: clipData.fontFamily || 'sans-serif',
            color: clipData.color || '#ffffff',
            bgColor: clipData.bgColor || null,
            outlineColor: clipData.outlineColor || null,
            outlineWidth: clipData.outlineWidth || 4,
            bold: clipData.bold || false,
            italic: clipData.italic || false,
            align: clipData.align || 'center',
            // Filter / Effect specific
            cssFilter: clipData.cssFilter || null,
            overlayType: clipData.overlayType || null,
            pluginId: clipData.pluginId || null,
            params: clipData.params || {},
            // Audio specific
            volume: clipData.volume !== undefined ? clipData.volume : 1.0,
            fadeIn: clipData.fadeIn || 0,
            fadeOut: clipData.fadeOut || 0,
            // Keyframes and transitions
            keyframes: clipData.keyframes || null,
            transitionIn: clipData.transitionIn || null,
            transitionOut: clipData.transitionOut || null,
            mask: clipData.mask || null,
            chromaKey: clipData.chromaKey || null,
            demoPattern: clipData.demoPattern || null,
            ...clipData
        };

        this.clips.push(clip);
        this.recalculateProjectDuration();
        this.renderClipDOM(clip);
        this.selectClip(clip.id);
        this.engine.render();

        return clip;
    }

    recalculateProjectDuration() {
        let maxTime = 10.0;
        this.clips.forEach(c => {
            const end = c.startTime + c.duration;
            if (end > maxTime) maxTime = end;
        });
        this.engine.duration = maxTime + 2.0;
        this.updateTimelineWidth();
        this.drawRuler();
    }

    renderAllClips() {
        // Clear all lane DOM clips
        document.querySelectorAll('.timeline-clip').forEach(el => el.remove());
        this.clips.forEach(clip => this.renderClipDOM(clip));
    }

    renderClipDOM(clip) {
        let lane = document.getElementById(`lane-${clip.trackId}`);
        if (!lane) {
            const compat = this.tracks.find(t => this.isClipCompatibleWithTrack(clip, t));
            if (compat) {
                clip.trackId = compat.id;
                lane = document.getElementById(`lane-${clip.trackId}`);
            }
        }
        if (!lane) return;

        let el = document.getElementById(`dom-${clip.id}`);
        if (!el) {
            el = document.createElement('div');
            el.id = `dom-${clip.id}`;
            el.className = `timeline-clip type-${clip.type}`;
            if (this.selectedClipId === clip.id) el.classList.add('selected');

            // Left trim handle
            const handleL = document.createElement('div');
            handleL.className = 'trim-handle left';
            handleL.title = 'Trimma början';
            el.appendChild(handleL);

            // Content
            const content = document.createElement('div');
            content.className = 'clip-content';
            const titleSpan = document.createElement('span');
            titleSpan.className = 'clip-title';
            titleSpan.textContent = clip.title;
            const durSpan = document.createElement('span');
            durSpan.className = 'clip-duration';
            durSpan.textContent = `${clip.duration.toFixed(1)}s`;
            content.appendChild(titleSpan);
            content.appendChild(durSpan);
            el.appendChild(content);

            // Right trim handle
            const handleR = document.createElement('div');
            handleR.className = 'trim-handle right';
            handleR.title = 'Trimma slutet';
            el.appendChild(handleR);

            lane.appendChild(el);
        }

        // Position & width
        const left = clip.startTime * this.pixelsPerSecond;
        const width = clip.duration * this.pixelsPerSecond;
        el.style.left = `${left}px`;
        el.style.width = `${Math.max(16, width)}px`;

        const durSpan = el.querySelector('.clip-duration');
        if (durSpan) durSpan.textContent = `${clip.duration.toFixed(1)}s`;

        // Speed badge on clip
        let speedBadge = el.querySelector('.clip-speed-badge');
        if (clip.speedCurve) {
            if (!speedBadge) {
                speedBadge = document.createElement('span');
                speedBadge.className = 'clip-speed-badge';
                el.querySelector('.clip-content')?.appendChild(speedBadge);
            }
            speedBadge.textContent = `⚡ ${clip.speedCurveName || 'Ramp'}`;
            speedBadge.style.display = 'inline-block';
        } else if (clip.speed && clip.speed !== 1.0) {
            if (!speedBadge) {
                speedBadge = document.createElement('span');
                speedBadge.className = 'clip-speed-badge';
                el.querySelector('.clip-content')?.appendChild(speedBadge);
            }
            speedBadge.textContent = `${clip.speed}x`;
            speedBadge.style.display = 'inline-block';
        } else if (speedBadge) {
            speedBadge.style.display = 'none';
        }

        // Ducking badge on clip
        let duckBadge = el.querySelector('.clip-duck-badge');
        if (clip.autoDucking) {
            if (!duckBadge) {
                duckBadge = document.createElement('span');
                duckBadge.className = 'clip-speed-badge clip-duck-badge';
                duckBadge.style.background = 'rgba(255, 170, 0, 0.25)';
                duckBadge.style.color = '#ffb703';
                duckBadge.style.borderColor = 'rgba(255, 183, 3, 0.4)';
                el.querySelector('.clip-content')?.appendChild(duckBadge);
            }
            duckBadge.textContent = '🦆 Ducking';
            duckBadge.style.display = 'inline-block';
        } else if (duckBadge) {
            duckBadge.style.display = 'none';
        }

        // Video filmstrip visual preview
        if (clip.type === 'video' || clip.trackId === 'video' || clip.trackId === 'overlay') {
            this.renderVideoFilmstrip(clip, el);
        }

        // Audio waveform visual representation
        if (clip.type === 'audio' || clip.trackId === 'audio') {
            this.renderAudioWaveform(clip, el);
        }

        // Fade In / Fade Out visual overlay
        let fadeLayer = el.querySelector('.clip-fade-layer');
        if (!fadeLayer) {
            fadeLayer = document.createElement('div');
            fadeLayer.className = 'clip-fade-layer';
            el.appendChild(fadeLayer);
        }

        const fadeInPct = clip.fadeIn ? Math.min(50, (clip.fadeIn / clip.duration) * 100) : 0;
        const fadeOutPct = clip.fadeOut ? Math.min(50, (clip.fadeOut / clip.duration) * 100) : 0;

        fadeLayer.innerHTML = `
            ${fadeInPct > 0 ? `<div class="clip-fade-in-shape" style="width: ${fadeInPct}%;"></div>` : ''}
            ${fadeOutPct > 0 ? `<div class="clip-fade-out-shape" style="width: ${fadeOutPct}%;"></div>` : ''}
        `;

        if (clip.type === 'audio' || clip.type === 'video' || clip.trackId === 'audio' || clip.trackId === 'video') {
            let handleIn = el.querySelector('.fade-handle.fade-in-handle');
            if (!handleIn) {
                handleIn = document.createElement('div');
                handleIn.className = 'fade-handle fade-in-handle';
                handleIn.title = 'Dra för att justera Tona In (Fade In)';
                el.appendChild(handleIn);
                this.bindFadeHandle(handleIn, clip, 'in');
            }
            let handleOut = el.querySelector('.fade-handle.fade-out-handle');
            if (!handleOut) {
                handleOut = document.createElement('div');
                handleOut.className = 'fade-handle fade-out-handle';
                handleOut.title = 'Dra för att justera Tona Ut (Fade Out)';
                el.appendChild(handleOut);
                this.bindFadeHandle(handleOut, clip, 'out');
            }
        }

        // Keyframes visual layer on timeline
        let kfLayer = el.querySelector('.clip-keyframes-layer');
        if (!kfLayer) {
            kfLayer = document.createElement('div');
            kfLayer.className = 'clip-keyframes-layer';
            el.appendChild(kfLayer);
        }
        kfLayer.innerHTML = '';

        if (clip.keyframes) {
            const allTimes = new Set();
            Object.values(clip.keyframes).forEach(kfs => {
                if (Array.isArray(kfs)) {
                    kfs.forEach(k => allTimes.add(Math.round(k.time * 100) / 100));
                }
            });

            Array.from(allTimes).sort((a, b) => a - b).forEach(time => {
                const marker = document.createElement('div');
                marker.className = 'clip-keyframe-marker';
                const pct = Math.max(0, Math.min(100, (time / clip.duration) * 100));
                marker.style.left = `${pct}%`;
                marker.title = `Keyframe vid ${time.toFixed(2)}s (Klicka för att hoppa hit)`;
                marker.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.engine.seek(clip.startTime + time);
                    this.selectClip(clip.id);
                });
                kfLayer.appendChild(marker);
            });
        }

        // Transitions visual layer on timeline
        let transLayer = el.querySelector('.clip-transitions-layer');
        if (!transLayer) {
            transLayer = document.createElement('div');
            transLayer.className = 'clip-transitions-layer';
            el.appendChild(transLayer);
        }
        transLayer.innerHTML = '';

        if (clip.transitionIn && clip.transitionIn.type && clip.transitionIn.type !== 'none') {
            const inBadge = document.createElement('div');
            inBadge.className = 'clip-transition-badge transition-in-badge';
            const inPct = Math.min(45, (clip.transitionIn.duration / clip.duration) * 100);
            inBadge.style.width = `${Math.max(22, inPct)}%`;
            inBadge.innerHTML = `<span>⧗</span> ${clip.transitionIn.name || 'In'}`;
            inBadge.title = `Övergång In: ${clip.transitionIn.name} (${clip.transitionIn.duration}s)`;
            inBadge.addEventListener('click', (e) => {
                e.stopPropagation();
                this.selectClip(clip.id);
            });
            transLayer.appendChild(inBadge);
        }

        if (clip.transitionOut && clip.transitionOut.type && clip.transitionOut.type !== 'none') {
            const outBadge = document.createElement('div');
            outBadge.className = 'clip-transition-badge transition-out-badge';
            const outPct = Math.min(45, (clip.transitionOut.duration / clip.duration) * 100);
            outBadge.style.width = `${Math.max(22, outPct)}%`;
            outBadge.innerHTML = `${clip.transitionOut.name || 'Ut'} <span>⧗</span>`;
            outBadge.title = `Övergång Ut: ${clip.transitionOut.name} (${clip.transitionOut.duration}s)`;
            outBadge.addEventListener('click', (e) => {
                e.stopPropagation();
                this.selectClip(clip.id);
            });
            transLayer.appendChild(outBadge);
        }

        // Bind transition drag-and-drop on clip
        if (!el._transDropBound) {
            el._transDropBound = true;
            el.addEventListener('dragover', (e) => {
                if (e.dataTransfer && Array.from(e.dataTransfer.types).includes('novacut/transition')) {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'copy';
                }
            });
            el.addEventListener('drop', (e) => {
                const transId = e.dataTransfer ? e.dataTransfer.getData('novacut/transition') : null;
                if (transId && window.transitions) {
                    e.preventDefault();
                    e.stopPropagation();
                    const rect = el.getBoundingClientRect();
                    const dropX = e.clientX - rect.left;
                    const direction = dropX < rect.width / 2 ? 'in' : 'out';
                    window.transitions.applyTransitionToClip(clip, transId, null, direction);
                    const sideLabel = direction === 'in' ? 'början' : 'slutet';
                    if (window.novaCutToast) {
                        window.novaCutToast(`⧗ Övergång tillagd i ${sideLabel} av "${clip.title}"!`);
                    }
                }
            });
        }
    }

    renderAudioWaveform(clip, el) {
        let wf = el.querySelector('.clip-waveform');
        if (!wf) {
            wf = document.createElement('div');
            wf.className = 'clip-waveform';
            el.appendChild(wf);
        }

        let canvas = wf.querySelector('.clip-waveform-canvas');
        if (!canvas) {
            canvas = document.createElement('canvas');
            canvas.className = 'clip-waveform-canvas';
            wf.innerHTML = '';
            wf.appendChild(canvas);
        }

        const width = Math.max(16, Math.round(clip.duration * this.pixelsPerSecond));
        const height = 44;

        if (canvas.width !== width || canvas.height !== height) {
            canvas.width = width;
            canvas.height = height;
        }

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const cacheKey = clip.filePath || clip.mediaId || clip.title;
        let audioData = window.audioAnalyzer?.bufferCache?.get(cacheKey);

        if (!audioData && window.audioAnalyzer) {
            window.audioAnalyzer.preloadClipAudio(clip).then(data => {
                if (data && document.getElementById(`dom-${clip.id}`)) {
                    this.renderAudioWaveform(clip, el);
                }
            }).catch(() => {});
        }

        ctx.clearRect(0, 0, width, height);

        if (!audioData || !audioData.channelData) {
            // Rhythmic placeholder bars while loading
            ctx.fillStyle = 'rgba(52, 211, 153, 0.45)';
            const mid = height / 2;
            for (let x = 4; x < width - 4; x += 4) {
                const amp = (Math.sin(x * 0.08) * 0.45 + Math.cos(x * 0.17) * 0.35) * (height * 0.32);
                const barH = Math.max(3, Math.abs(amp));
                ctx.fillRect(x, mid - barH / 2, 2, barH);
            }
            return;
        }

        const { channelData, sampleRate } = audioData;
        const clipOffset = Math.max(0, clip.sourceOffset || 0);
        const clipDur = clip.duration;

        const midY = height / 2;
        const grad = ctx.createLinearGradient(0, 0, 0, height);
        grad.addColorStop(0, '#34d399');
        grad.addColorStop(0.5, '#6ee7b7');
        grad.addColorStop(1, '#059669');
        ctx.fillStyle = grad;

        const samplesPerPixel = (clipDur * sampleRate) / width;
        const startSample = Math.floor(clipOffset * sampleRate);

        for (let x = 0; x < width; x += 2) {
            const s0 = Math.min(channelData.length - 1, Math.max(0, startSample + Math.floor(x * samplesPerPixel)));
            const s1 = Math.min(channelData.length, Math.max(s0 + 1, startSample + Math.floor((x + 2) * samplesPerPixel)));

            let maxVal = 0;
            const step = Math.max(1, Math.floor((s1 - s0) / 12));
            for (let s = s0; s < s1; s += step) {
                const val = Math.abs(channelData[s]);
                if (val > maxVal) maxVal = val;
            }

            const normalized = Math.min(1.0, Math.pow(maxVal, 0.72) * 1.35);
            const barH = Math.max(2, Math.round(normalized * (height - 6)));

            ctx.fillRect(x, midY - barH / 2, 1.5, barH);
        }
    }

    renderVideoFilmstrip(clip, el) {
        let strip = el.querySelector('.clip-filmstrip');
        if (!strip) {
            strip = document.createElement('div');
            strip.className = 'clip-filmstrip';
            el.insertBefore(strip, el.firstChild);
        }

        const width = Math.max(16, Math.round(clip.duration * this.pixelsPerSecond));
        const frameW = 68;
        const numFrames = Math.max(1, Math.min(25, Math.ceil(width / frameW)));

        if (!this.filmstripThumbCache) {
            this.filmstripThumbCache = new Map();
        }

        let currentFrames = strip.querySelectorAll('.clip-filmstrip-frame');
        if (currentFrames.length !== numFrames) {
            strip.innerHTML = '';
            for (let i = 0; i < numFrames; i++) {
                const c = document.createElement('canvas');
                c.className = 'clip-filmstrip-frame';
                c.width = 68;
                c.height = 44;
                strip.appendChild(c);
            }
            currentFrames = strip.querySelectorAll('.clip-filmstrip-frame');
        }

        const videoEl = this.engine.mediaElements?.get(clip.mediaId);
        const filePath = clip.filePath || videoEl?.src;
        if (!filePath) return;

        const sourceOffset = clip.sourceOffset || 0;
        const duration = clip.duration;

        currentFrames.forEach((c, i) => {
            const frameTime = sourceOffset + (i / Math.max(1, numFrames - 1)) * duration;
            const roundedTime = Math.round(frameTime * 2) / 2;
            const cacheKey = `${filePath}@${roundedTime}`;

            const ctx = c.getContext('2d');
            if (!ctx) return;

            if (this.filmstripThumbCache.has(cacheKey)) {
                const img = this.filmstripThumbCache.get(cacheKey);
                ctx.drawImage(img, 0, 0, c.width, c.height);
            } else {
                if (videoEl && videoEl.readyState >= 2 && Math.abs(videoEl.currentTime - frameTime) < 0.25) {
                    ctx.drawImage(videoEl, 0, 0, c.width, c.height);
                    createImageBitmap(c).then(bmp => {
                        this.filmstripThumbCache.set(cacheKey, bmp);
                    }).catch(() => {});
                } else {
                    ctx.fillStyle = '#141721';
                    ctx.fillRect(0, 0, c.width, c.height);
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
                    ctx.fillRect(2, 2, c.width - 4, c.height - 4);

                    this.enqueueFrameExtraction(filePath, roundedTime, (capturedBmp) => {
                        this.filmstripThumbCache.set(cacheKey, capturedBmp);
                        if (c.parentNode) {
                            ctx.drawImage(capturedBmp, 0, 0, c.width, c.height);
                        }
                    });
                }
            }
        });
    }

    enqueueFrameExtraction(filePath, time, callback) {
        if (!this.frameExtractionQueue) this.frameExtractionQueue = [];
        this.frameExtractionQueue.push({ filePath, time, callback });
        this.processExtractionQueue();
    }

    processExtractionQueue() {
        if (this.isExtractingFrame || !this.frameExtractionQueue || this.frameExtractionQueue.length === 0) return;
        this.isExtractingFrame = true;

        const task = this.frameExtractionQueue.shift();
        if (!this.offscreenExtractor) {
            this.offscreenExtractor = document.createElement('video');
            this.offscreenExtractor.muted = true;
            this.offscreenExtractor.preload = 'auto';
        }

        const v = this.offscreenExtractor;
        const cleanUrl = task.filePath.startsWith('file://') ? task.filePath : (task.filePath.startsWith('/') ? `file://${task.filePath}` : task.filePath);

        let timeoutId = setTimeout(() => {
            this.isExtractingFrame = false;
            this.processExtractionQueue();
        }, 1200);

        const onSeeked = async () => {
            v.removeEventListener('seeked', onSeeked);
            clearTimeout(timeoutId);
            try {
                const offCanvas = document.createElement('canvas');
                offCanvas.width = 68;
                offCanvas.height = 44;
                const octx = offCanvas.getContext('2d');
                octx.drawImage(v, 0, 0, 68, 44);
                const bmp = await createImageBitmap(offCanvas);
                task.callback(bmp);
            } catch (err) {
                // Ignore extraction error
            } finally {
                this.isExtractingFrame = false;
                this.processExtractionQueue();
            }
        };

        v.addEventListener('seeked', onSeeked, { once: true });

        if (v.src !== cleanUrl) {
            v.src = cleanUrl;
            v.onloadedmetadata = () => {
                v.currentTime = Math.min(v.duration || 10, Math.max(0, task.time));
            };
        } else {
            v.currentTime = Math.min(v.duration || 10, Math.max(0, task.time));
        }
    }

    async removeSilencesFromClip(clip, options = {}) {
        if (!clip) {
            clip = this.clips.find(c => c.id === this.selectedClipId) ||
                   this.clips.find(c => c.trackId === 'audio') ||
                   this.clips.find(c => c.trackId === 'video');
        }

        if (!clip) {
            if (window.novaCutToast) window.novaCutToast('⚠️ Markera ett ljud- eller videoklipp först!');
            return;
        }

        const thresholdRMS = options.threshold || 0.018; // Approx -35 dB
        const minSilenceDur = options.minSilenceDur || 0.35; // Seconds
        const padding = options.padding || 0.08; // 80ms breathing room around words

        let audioData = null;
        if (window.audioAnalyzer) {
            audioData = await window.audioAnalyzer.preloadClipAudio(clip);
        }

        if (!audioData || !audioData.channelData) {
            if (window.novaCutToast) window.novaCutToast('⚠️ Kunde inte analysera ljudet i detta klipp.');
            return;
        }

        const { channelData, sampleRate } = audioData;
        const sourceOffset = Math.max(0, clip.sourceOffset || 0);
        const clipDuration = clip.duration;

        // Analyze RMS in 30ms windows
        const windowSamples = Math.floor(sampleRate * 0.03);
        const startSample = Math.floor(sourceOffset * sampleRate);
        const totalSamples = Math.floor(clipDuration * sampleRate);
        const numWindows = Math.floor(totalSamples / windowSamples);

        const silentWindows = new Uint8Array(numWindows);
        for (let i = 0; i < numWindows; i++) {
            const sStart = startSample + i * windowSamples;
            const sEnd = Math.min(channelData.length, sStart + windowSamples);
            let sumSq = 0;
            const count = sEnd - sStart;
            for (let s = sStart; s < sEnd; s += 2) {
                const val = channelData[s];
                sumSq += val * val;
            }
            const rms = Math.sqrt((sumSq * 2) / count);
            if (rms < thresholdRMS) {
                silentWindows[i] = 1;
            }
        }

        // Find silence intervals >= minSilenceDur
        const minSilenceWindows = Math.round(minSilenceDur / 0.03);
        const silences = [];
        let curSilenceStart = -1;

        for (let i = 0; i < numWindows; i++) {
            if (silentWindows[i] === 1) {
                if (curSilenceStart === -1) curSilenceStart = i;
            } else {
                if (curSilenceStart !== -1) {
                    if ((i - curSilenceStart) >= minSilenceWindows) {
                        silences.push({
                            start: curSilenceStart * 0.03,
                            end: i * 0.03
                        });
                    }
                    curSilenceStart = -1;
                }
            }
        }
        if (curSilenceStart !== -1 && (numWindows - curSilenceStart) >= minSilenceWindows) {
            silences.push({
                start: curSilenceStart * 0.03,
                end: numWindows * 0.03
            });
        }

        if (silences.length === 0) {
            if (window.novaCutToast) window.novaCutToast('✨ Inga tysta pauser hittades i klippet! Talet är redan sammanhängande.');
            return;
        }

        // Invert silences into speech segments with safe padding
        const speechSegments = [];
        let prevTime = 0;

        silences.forEach(s => {
            const segStart = prevTime;
            const segEnd = Math.max(segStart, s.start - padding);
            if (segEnd - segStart > 0.1) {
                speechSegments.push({
                    start: sourceOffset + segStart,
                    end: sourceOffset + segEnd
                });
            }
            prevTime = Math.min(clipDuration, s.end + padding);
        });

        if (prevTime < clipDuration - 0.1) {
            speechSegments.push({
                start: sourceOffset + prevTime,
                end: sourceOffset + clipDuration
            });
        }

        if (speechSegments.length === 0) {
            if (window.novaCutToast) window.novaCutToast('⚠️ Hela klippet verkar vara tyst.');
            return;
        }

        const totalSaved = clipDuration - speechSegments.reduce((sum, s) => sum + (s.end - s.start), 0);

        // Confirmation dialog
        const confirmed = confirm(
            `⚡ Smart Silence Remover (Auto Jump-Cut)\n\n` +
            `Hittade ${silences.length} tysta pauser i klippet "${clip.title}".\n` +
            `Total tystnad som kan klippas bort: ${totalSaved.toFixed(1)} sekunder!\n\n` +
            `Vill du klippa bort tystnaderna och sammanfoga talet automatiskt?`
        );

        if (!confirmed) return;

        const origIndex = this.clips.indexOf(clip);
        if (origIndex === -1) return;

        this.clips.splice(origIndex, 1);
        const domEl = document.getElementById(`dom-${clip.id}`);
        if (domEl) domEl.remove();

        let curTimelineTime = clip.startTime;
        const createdClips = [];

        speechSegments.forEach((seg, idx) => {
            const segDur = seg.end - seg.start;
            const newClip = {
                ...clip,
                id: `clip-${Date.now()}-${Math.floor(Math.random() * 10000)}-${idx}`,
                sourceOffset: seg.start,
                duration: segDur,
                startTime: curTimelineTime,
                title: `${clip.title} (Del ${idx + 1})`
            };
            this.clips.push(newClip);
            createdClips.push(newClip);
            curTimelineTime += segDur;
        });

        // Ripple shift subsequent clips on this track by totalSaved
        this.clips.forEach(c => {
            if (c.trackId === clip.trackId && c.startTime > clip.startTime && !createdClips.includes(c)) {
                c.startTime = Math.max(0, c.startTime - totalSaved);
            }
        });

        this.recalculateProjectDuration();
        this.renderClips();
        if (createdClips.length > 0) {
            this.selectClip(createdClips[0].id);
        }
        this.engine.render();

        if (window.novaCutToast) {
            window.novaCutToast(`⚡ ${silences.length} tystnader klipptes bort (-${totalSaved.toFixed(1)}s sparat)!`);
        }
    }

    bindFadeHandle(handle, clip, direction) {
        handle.addEventListener('mousedown', (e) => {
            e.stopPropagation();
            const startX = e.clientX;
            const startFade = (direction === 'in') ? (clip.fadeIn || 0) : (clip.fadeOut || 0);

            const onMouseMove = (moveEvent) => {
                const deltaX = moveEvent.clientX - startX;
                const deltaSec = (deltaX / this.pixelsPerSecond) * (direction === 'in' ? 1 : -1);
                const maxFade = Math.max(0.5, clip.duration / 2);
                const newFade = Math.max(0, Math.min(maxFade, Math.round((startFade + deltaSec) * 10) / 10));

                if (direction === 'in') {
                    clip.fadeIn = newFade;
                } else {
                    clip.fadeOut = newFade;
                }

                this.renderClipDOM(clip);
                if (window.inspector && window.inspector.currentClip?.id === clip.id) {
                    window.inspector.updateAudioFadeInputs(clip);
                }
                this.engine.render();
            };

            const onMouseUp = () => {
                window.removeEventListener('mousemove', onMouseMove);
                window.removeEventListener('mouseup', onMouseUp);
            };

            window.addEventListener('mousemove', onMouseMove);
            window.addEventListener('mouseup', onMouseUp);
        });
    }

    selectClip(clipId) {
        this.selectedClipId = clipId;
        document.querySelectorAll('.timeline-clip').forEach(el => {
            el.classList.toggle('selected', el.id === `dom-${clipId}`);
        });

        const clip = this.clips.find(c => c.id === clipId);
        if (window.inspector) {
            window.inspector.update(clip);
        }
        if (this.engine) {
            this.engine.render();
        }
    }

    getSelectedClip() {
        if (!this.selectedClipId) return null;
        return this.clips.find(c => c.id === this.selectedClipId) || null;
    }

    deselectAll() {
        this.selectedClipId = null;
        document.querySelectorAll('.timeline-clip').forEach(el => el.classList.remove('selected'));
        if (window.inspector) {
            window.inspector.update(null);
        }
        if (this.engine) {
            this.engine.render();
        }
    }

    splitSelectedClip() {
        if (!this.selectedClipId) return;
        const clip = this.clips.find(c => c.id === this.selectedClipId);
        if (!clip) return;
        if (this.trackStates[clip.trackId]?.locked) return; // Locked track cannot be split

        const playheadTime = this.engine.currentTime;
        const clipEnd = clip.startTime + clip.duration;

        // Ensure playhead is strictly inside clip
        if (playheadTime <= clip.startTime + 0.1 || playheadTime >= clipEnd - 0.1) {
            return;
        }

        const firstDuration = playheadTime - clip.startTime;
        const secondDuration = clip.duration - firstDuration;

        // Shorten first clip
        clip.duration = firstDuration;
        this.renderClipDOM(clip);

        // Create second clip
        const secondClip = {
            ...JSON.parse(JSON.stringify(clip)),
            id: `clip-${Date.now()}`,
            startTime: playheadTime,
            duration: secondDuration,
            sourceOffset: (clip.sourceOffset || 0) + firstDuration,
            title: `${clip.title} (del 2)`
        };

        this.clips.push(secondClip);
        this.renderClipDOM(secondClip);
        this.selectClip(secondClip.id);
        this.engine.render();
    }

    splitClipAtTime(clipId, splitTime) {
        const clip = this.clips.find(c => c.id === clipId);
        if (!clip) return null;
        if (this.trackStates[clip.trackId]?.locked) return null;

        const clipEnd = clip.startTime + clip.duration;
        if (splitTime <= clip.startTime + 0.1 || splitTime >= clipEnd - 0.1) {
            return null;
        }

        const firstDuration = splitTime - clip.startTime;
        const secondDuration = clip.duration - firstDuration;

        clip.duration = firstDuration;
        this.renderClipDOM(clip);

        const secondClip = {
            ...JSON.parse(JSON.stringify(clip)),
            id: `clip-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            startTime: splitTime,
            duration: secondDuration,
            sourceOffset: (clip.sourceOffset || 0) + firstDuration,
            title: `${clip.title}`
        };

        this.clips.push(secondClip);
        this.renderClipDOM(secondClip);
        return secondClip;
    }

    autoCutClipToBeats(clipId, applyVelocityZoom = true) {
        const currentClip = this.clips.find(c => c.id === clipId);
        if (!currentClip) return 0;
        if (!this.beatMarkers || this.beatMarkers.length === 0) return 0;

        const clipStart = currentClip.startTime;
        const clipEnd = clipStart + currentClip.duration;
        const beats = this.beatMarkers
            .filter(b => b > clipStart + 0.15 && b < clipEnd - 0.15)
            .sort((a, b) => a - b);

        if (beats.length === 0) return 0;

        let cutCount = 0;
        const trackClips = [currentClip];

        for (const beatTime of beats) {
            const target = this.clips.find(c => c.trackId === currentClip.trackId && beatTime > c.startTime + 0.1 && beatTime < c.startTime + c.duration - 0.1);
            if (target) {
                const newClip = this.splitClipAtTime(target.id, beatTime);
                if (newClip) {
                    trackClips.push(newClip);
                    cutCount++;
                }
            }
        }

        if (applyVelocityZoom) {
            trackClips.forEach((c, idx) => {
                if (idx % 2 === 1) {
                    c.scale = (c.scale || 1.0) * 1.08;
                }
            });
        }

        this.engine.render();
        return cutCount;
    }

    deleteSelectedClip() {
        if (!this.selectedClipId) return;
        const index = this.clips.findIndex(c => c.id === this.selectedClipId);
        if (index === -1) return;
        const clip = this.clips[index];
        if (this.trackStates[clip.trackId]?.locked) return; // Locked track cannot be deleted

        const domEl = document.getElementById(`dom-${this.selectedClipId}`);
        if (domEl) domEl.remove();

        this.clips.splice(index, 1);
        this.selectedClipId = null;

        if (window.inspector) {
            window.inspector.update(null);
        }

        this.recalculateProjectDuration();
        this.engine.render();
    }

    /**
     * Finds target clip under playhead for quick Q/W trimming.
     */
    getTargetClipForRipple(playheadTime) {
        if (this.selectedClipId) {
            const sel = this.clips.find(c => c.id === this.selectedClipId);
            if (sel && playheadTime >= sel.startTime - 0.05 && playheadTime <= sel.startTime + sel.duration + 0.05) {
                return sel;
            }
        }
        // Check video track first, then any active track
        const onVideo = this.clips.find(c => c.trackId === 'video' && playheadTime >= c.startTime && playheadTime < (c.startTime + c.duration));
        if (onVideo) return onVideo;

        return this.clips.find(c => playheadTime >= c.startTime && playheadTime < (c.startTime + c.duration)) || null;
    }

    /**
     * Ripple Delete: Removes selected clip and shifts all subsequent clips left
     * to eliminate the gap.
     */
    rippleDeleteSelectedClip() {
        if (!this.selectedClipId) return;
        const index = this.clips.findIndex(c => c.id === this.selectedClipId);
        if (index === -1) return;
        const clip = this.clips[index];
        if (this.trackStates[clip.trackId]?.locked) return;

        const clipStart = clip.startTime;
        const clipDur = clip.duration;
        const trackId = clip.trackId;

        const domEl = document.getElementById(`dom-${this.selectedClipId}`);
        if (domEl) domEl.remove();
        this.clips.splice(index, 1);
        this.selectedClipId = null;

        // Shift subsequent clips on this track
        this.clips.forEach(c => {
            if (c.trackId === trackId && c.startTime >= clipStart) {
                c.startTime = Math.max(0, c.startTime - clipDur);
            }
        });

        if (window.inspector) {
            window.inspector.update(null);
        }

        this.renderAllClips();
        this.recalculateProjectDuration();
        this.engine.render();

        if (window.projectManager && typeof window.projectManager.showToast === 'function') {
            window.projectManager.showToast('⚡ Ripple Delete utförd (tomrum stängt)');
        }
    }

    /**
     * Q Hotkey: Ripple Trim Start
     * Trims from clip start up to playhead and shifts succeeding clips left.
     */
    rippleTrimStart() {
        const playheadTime = this.engine.currentTime;
        const clip = this.getTargetClipForRipple(playheadTime);
        if (!clip) return;
        if (this.trackStates[clip.trackId]?.locked) return;

        const clipEnd = clip.startTime + clip.duration;
        if (playheadTime <= clip.startTime + 0.05 || playheadTime >= clipEnd - 0.05) {
            return;
        }

        const delta = playheadTime - clip.startTime;
        const oldStart = clip.startTime;

        // Trim clip head
        clip.duration -= delta;
        clip.sourceOffset = (clip.sourceOffset || 0) + delta;

        // Shift subsequent clips on same track
        this.clips.forEach(c => {
            if (c.id !== clip.id && c.trackId === clip.trackId && c.startTime >= clipEnd - 0.01) {
                c.startTime = Math.max(0, c.startTime - delta);
            }
        });

        this.selectClip(clip.id);
        this.renderAllClips();
        this.recalculateProjectDuration();
        this.engine.seek(oldStart); // Set playhead at the edit seam
        this.engine.render();

        if (window.projectManager && typeof window.projectManager.showToast === 'function') {
            window.projectManager.showToast(`⇤ Trimmat start (-${delta.toFixed(1)}s, Q)`);
        }
    }

    /**
     * W Hotkey: Ripple Trim End
     * Trims from playhead to clip end and shifts succeeding clips left.
     */
    rippleTrimEnd() {
        const playheadTime = this.engine.currentTime;
        const clip = this.getTargetClipForRipple(playheadTime);
        if (!clip) return;
        if (this.trackStates[clip.trackId]?.locked) return;

        const clipEnd = clip.startTime + clip.duration;
        if (playheadTime <= clip.startTime + 0.05 || playheadTime >= clipEnd - 0.05) {
            return;
        }

        const delta = clipEnd - playheadTime;

        // Trim clip tail
        clip.duration = playheadTime - clip.startTime;

        // Shift subsequent clips on same track
        this.clips.forEach(c => {
            if (c.id !== clip.id && c.trackId === clip.trackId && c.startTime >= clipEnd - 0.01) {
                c.startTime = Math.max(0, c.startTime - delta);
            }
        });

        this.selectClip(clip.id);
        this.renderAllClips();
        this.recalculateProjectDuration();
        this.engine.seek(playheadTime);
        this.engine.render();

        if (window.projectManager && typeof window.projectManager.showToast === 'function') {
            window.projectManager.showToast(`⇥ Trimmat slut (-${delta.toFixed(1)}s, W)`);
        }
    }

    /**
     * Close all gaps on tracks
     */
    closeGaps(targetTrackId = null) {
        let movedCount = 0;
        const tracksToProcess = targetTrackId ? [targetTrackId] : this.tracks.map(t => t.id);

        tracksToProcess.forEach(tId => {
            if (this.trackStates[tId]?.locked) return;
            const trackClips = this.clips.filter(c => c.trackId === tId).sort((a, b) => a.startTime - b.startTime);
            let expectedStart = 0;

            trackClips.forEach(clip => {
                if (Math.abs(clip.startTime - expectedStart) > 0.05) {
                    clip.startTime = expectedStart;
                    movedCount++;
                }
                expectedStart = clip.startTime + clip.duration;
            });
        });

        if (movedCount > 0) {
            this.renderAllClips();
            this.recalculateProjectDuration();
            this.engine.render();
            if (window.projectManager && typeof window.projectManager.showToast === 'function') {
                window.projectManager.showToast(`🧲 ${movedCount} klipp flyttades och tomrum stängdes!`);
            }
        } else {
            if (window.projectManager && typeof window.projectManager.showToast === 'function') {
                window.projectManager.showToast('Inga tomrum hittades.');
            }
        }
    }

    updatePlayheadPosition() {
        const x = this.engine.currentTime * this.pixelsPerSecond;
        this.playheadScrubber.style.left = `${x}px`;

        // Follow Playhead when playing (auto-scroll)
        if (this.followPlayhead && this.engine.isPlaying && !this.activeDrag && this.viewport) {
            const scrollLeft = this.viewport.scrollLeft;
            const clientWidth = this.viewport.clientWidth;
            // Advance page when playhead reaches within 80px of right margin
            if (x >= scrollLeft + clientWidth - 80) {
                this.viewport.scrollLeft = Math.max(0, x - (clientWidth * 0.15));
            } else if (x < scrollLeft) {
                this.viewport.scrollLeft = Math.max(0, x - (clientWidth * 0.15));
            }
        }
    }

    ensurePlayheadVisible(paddingRatio = 0.15) {
        if (!this.viewport) return;
        const x = this.engine.currentTime * this.pixelsPerSecond;
        const scrollLeft = this.viewport.scrollLeft;
        const clientWidth = this.viewport.clientWidth;
        if (x < scrollLeft || x > scrollLeft + clientWidth - 50) {
            this.viewport.scrollLeft = Math.max(0, x - (clientWidth * paddingRatio));
        }
    }

    getActiveClipsAt(timestamp) {
        return this.clips.filter(c => timestamp >= c.startTime && timestamp < (c.startTime + c.duration));
    }

    setupEvents() {
        const { viewport, playheadHandle, timeRuler } = this;

        // Sync vertical scroll with track headers
        viewport.addEventListener('scroll', () => {
            const headers = document.getElementById('trackHeadersScrollable');
            if (headers) headers.scrollTop = viewport.scrollTop;
        });

        // Horizontal mouse wheel scrolling & Ctrl+wheel zoom
        const handleWheel = (e) => {
            // Ctrl/Cmd + Wheel = Zoom in/out
            if (e.ctrlKey || e.metaKey) {
                e.preventDefault();
                const zoomFactor = e.deltaY < 0 ? 1.15 : 0.85;
                const newPPS = Math.round(this.pixelsPerSecond * zoomFactor);
                this.setZoom(newPPS);
                const zoomSlider = document.getElementById('timelineZoomSlider');
                if (zoomSlider) zoomSlider.value = this.pixelsPerSecond;
                return;
            }

            // Alt + Wheel = allow vertical scroll if lanes overflow vertically
            if (e.altKey && viewport.scrollHeight > viewport.clientHeight) {
                return;
            }

            // Sideways horizontal scrolling:
            // Prefer deltaX if trackpad is used horizontally, otherwise use deltaY (mouse wheel)
            let scrollDelta = 0;
            if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
                scrollDelta = e.deltaX;
            } else {
                scrollDelta = e.deltaY;
            }

            if (scrollDelta !== 0) {
                e.preventDefault();
                viewport.scrollLeft += scrollDelta;
            }
        };

        viewport.addEventListener('wheel', handleWheel, { passive: false });
        timeRuler.addEventListener('wheel', handleWheel, { passive: false });
        const timelinePanelEl = document.getElementById('timelinePanel');
        if (timelinePanelEl) {
            timelinePanelEl.addEventListener('wheel', (e) => {
                if (!e.target.closest('select') && !e.target.closest('input[type="range"]')) {
                    handleWheel(e);
                }
            }, { passive: false });
        }

        // Ruler click / scrub (Fix: accurately compute click position inside scrollable viewport)
        timeRuler.addEventListener('mousedown', (e) => {
            const viewportRect = viewport.getBoundingClientRect();
            const clickX = (e.clientX - viewportRect.left) + viewport.scrollLeft;
            const targetTime = Math.max(0, Math.min(this.engine.duration, clickX / this.pixelsPerSecond));
            this.engine.seek(targetTime);

            this.activeDrag = { type: 'scrub' };
        });

        // Timeline Clip interaction (move / trim / select) & click-to-seek on lanes
        this.canvasContainer.addEventListener('mousedown', (e) => {
            const clipEl = e.target.closest('.timeline-clip');
            if (!clipEl) {
                if (!e.target.closest('.trim-handle') && !e.target.closest('.playhead-handle')) {
                    this.deselectAll();
                    // Clicking empty lane space positions playhead immediately (industry standard NLE behavior)
                    const viewportRect = viewport.getBoundingClientRect();
                    const clickX = (e.clientX - viewportRect.left) + viewport.scrollLeft;
                    const targetTime = Math.max(0, Math.min(this.engine.duration, clickX / this.pixelsPerSecond));
                    this.engine.seek(targetTime);
                    this.activeDrag = { type: 'scrub' };
                }
                return;
            }

            const clipId = clipEl.id.replace('dom-', '');
            const clip = this.clips.find(c => c.id === clipId);
            if (!clip) return;

            this.selectClip(clip.id);

            // If track is locked, prevent move or trim
            if (this.trackStates[clip.trackId]?.locked) {
                e.stopPropagation();
                return;
            }

            const handle = e.target.closest('.trim-handle');
            if (handle) {
                const isLeft = handle.classList.contains('left');
                this.activeDrag = {
                    type: isLeft ? 'trim-left' : 'trim-right',
                    clipId: clip.id,
                    startX: e.clientX,
                    originalStart: clip.startTime,
                    originalDuration: clip.duration,
                    originalOffset: clip.sourceOffset || 0
                };
            } else {
                this.activeDrag = {
                    type: 'move',
                    clipId: clip.id,
                    startX: e.clientX,
                    originalStart: clip.startTime
                };
            }

            e.stopPropagation();
        });

        // Global MouseMove for Dragging & Trimming
        window.addEventListener('mousemove', (e) => {
            if (!this.activeDrag) return;

            const { type, clipId, startX, originalStart, originalDuration, originalOffset } = this.activeDrag;
            const deltaPx = e.clientX - startX;
            const deltaTime = deltaPx / this.pixelsPerSecond;

            if (type === 'scrub') {
                const viewportRect = viewport.getBoundingClientRect();
                const clickX = (e.clientX - viewportRect.left) + viewport.scrollLeft;
                const targetTime = Math.max(0, Math.min(this.engine.duration, clickX / this.pixelsPerSecond));
                this.engine.seek(targetTime);

                // Auto-scroll when scrubbing near edges of viewport
                if (e.clientX > viewportRect.right - 50) {
                    viewport.scrollLeft += 15;
                } else if (e.clientX < viewportRect.left + 50 && viewport.scrollLeft > 0) {
                    viewport.scrollLeft = Math.max(0, viewport.scrollLeft - 15);
                }
                return;
            }

            const clip = this.clips.find(c => c.id === clipId);
            if (!clip) return;

            if (type === 'move') {
                let newStart = Math.max(0, originalStart + deltaTime);

                // Snapping to playhead or other clips
                if (this.snappingEnabled) {
                    const snapTime = this.getNearestSnapTime(newStart, clip.id);
                    if (snapTime !== null) newStart = snapTime;
                }

                clip.startTime = newStart;

                // Vertical cross-track dragging: detect hovered lane
                const elemUnderMouse = document.elementFromPoint(e.clientX, e.clientY);
                const hoveredLane = elemUnderMouse?.closest('.track-lane');
                document.querySelectorAll('.track-lane.drag-over').forEach(el => el.classList.remove('drag-over'));

                if (hoveredLane && hoveredLane.dataset.trackId) {
                    const targetTrackId = hoveredLane.dataset.trackId;
                    const targetTrack = this.tracks.find(t => t.id === targetTrackId);
                    if (targetTrack && this.isClipCompatibleWithTrack(clip, targetTrack)) {
                        hoveredLane.classList.add('drag-over');
                        if (clip.trackId !== targetTrackId) {
                            clip.trackId = targetTrackId;
                            const clipEl = document.getElementById(`dom-${clip.id}`);
                            if (clipEl) hoveredLane.appendChild(clipEl);
                        }
                    }
                }

                this.renderClipDOM(clip);
                this.recalculateProjectDuration();
                this.engine.render();

            } else if (type === 'trim-right') {
                let newDuration = Math.max(0.2, originalDuration + deltaTime);
                clip.duration = newDuration;
                this.renderClipDOM(clip);
                this.recalculateProjectDuration();
                this.engine.render();

            } else if (type === 'trim-left') {
                let newStart = originalStart + deltaTime;
                let newDuration = originalDuration - deltaTime;
                if (newDuration >= 0.2 && newStart >= 0) {
                    clip.startTime = newStart;
                    clip.duration = newDuration;
                    clip.sourceOffset = Math.max(0, originalOffset + deltaTime);
                    this.renderClipDOM(clip);
                    this.recalculateProjectDuration();
                    this.engine.render();
                }
            }
        });

        window.addEventListener('mouseup', () => {
            document.querySelectorAll('.track-lane.drag-over').forEach(el => el.classList.remove('drag-over'));
            if (this.activeDrag && this.activeDrag.type === 'move') {
                const clip = this.clips.find(c => c.id === this.activeDrag.clipId);
                if (clip) {
                    this.renderClipDOM(clip);
                    this.engine.render();
                }
            }
            this.activeDrag = null;
        });

        // Playhead Scrubber drag handle
        playheadHandle.addEventListener('mousedown', (e) => {
            this.activeDrag = { type: 'scrub' };
            e.stopPropagation();
        });
    }

    getNearestSnapTime(targetTime, ignoreClipId) {
        const thresholdSec = this.snapThreshold / this.pixelsPerSecond;
        const snapPoints = [this.engine.currentTime, 0];

        this.clips.forEach(c => {
            if (c.id !== ignoreClipId) {
                snapPoints.push(c.startTime);
                snapPoints.push(c.startTime + c.duration);
            }
        });

        if (this.beatMarkers && this.beatMarkers.length > 0) {
            snapPoints.push(...this.beatMarkers);
        }

        for (const pt of snapPoints) {
            if (Math.abs(targetTime - pt) <= thresholdSec) {
                return pt;
            }
        }
        return null;
    }

    isClipCompatibleWithTrack(clip, track) {
        if (!clip || !track) return false;
        const trackType = track.type || 'video';
        if (trackType === 'audio') {
            return clip.type === 'audio' || clip.hasAudio;
        }
        if (clip.type === 'audio') {
            return trackType === 'audio';
        }
        if (trackType === 'text') {
            return clip.type === 'text' || clip.type === 'subtitle';
        }
        if (clip.type === 'text' || clip.type === 'subtitle') {
            return trackType === 'text';
        }
        if (trackType === 'effect') {
            return clip.type === 'effect' || clip.type === 'adjustment';
        }
        if (clip.type === 'effect' || clip.type === 'adjustment') {
            return trackType === 'effect';
        }
        // Visual video / overlay tracks accept video, image, stickers, demoPattern
        return ['video', 'overlay', 'image'].includes(clip.type) || !!clip.demoPattern || !!clip.isSticker;
    }

    initTracks() {
        this.renderTracks();

        // Wire up Add Track Dropdown Menu
        const btnAddTrack = document.getElementById('btnAddTrackBtn');
        const btnQuickAdd = document.getElementById('btnQuickAddTrack');
        const addTrackMenu = document.getElementById('addTrackMenu');

        const toggleMenu = (e) => {
            e.stopPropagation();
            if (!addTrackMenu) return;
            const isHidden = addTrackMenu.style.display === 'none' || !addTrackMenu.style.display;
            addTrackMenu.style.display = isHidden ? 'flex' : 'none';
        };

        if (btnAddTrack) btnAddTrack.addEventListener('click', toggleMenu);
        if (btnQuickAdd) btnQuickAdd.addEventListener('click', toggleMenu);

        if (addTrackMenu) {
            addTrackMenu.querySelectorAll('.menu-item-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const type = btn.dataset.trackType || 'video';
                    this.addTrack(type);
                    addTrackMenu.style.display = 'none';
                });
            });

            window.addEventListener('click', (e) => {
                if (addTrackMenu.style.display !== 'none' && !addTrackMenu.contains(e.target) && e.target !== btnAddTrack && e.target !== btnQuickAdd) {
                    addTrackMenu.style.display = 'none';
                }
            });
        }
    }

    renderTracks() {
        const headersScrollable = document.getElementById('trackHeadersScrollable');
        const timelineCanvas = document.getElementById('timelineCanvas');
        const playheadScrubber = document.getElementById('playheadScrubber');

        if (!headersScrollable || !timelineCanvas) return;

        // Clear existing headers
        headersScrollable.innerHTML = '';

        // Clear existing track lanes (preserving ruler and playhead scrubber)
        const oldLanes = timelineCanvas.querySelectorAll('.track-lane');
        oldLanes.forEach(el => el.remove());

        // Render each track header & lane
        this.tracks.forEach((track, index) => {
            if (!this.trackStates[track.id]) {
                this.trackStates[track.id] = { visible: true, locked: false, muted: false };
            }
            const state = this.trackStates[track.id];

            // 1. Create Track Header
            const header = document.createElement('div');
            header.className = 'track-header';
            header.dataset.trackId = track.id;

            const badgeClass = track.type === 'overlay' ? 'overlay' : (track.type || 'video');
            let badgeText = 'VID';
            if (track.type === 'text') badgeText = 'TXT';
            else if (track.type === 'effect') badgeText = 'FX';
            else if (track.type === 'audio') badgeText = 'AUD';
            else if (track.id === 'overlay' || track.name.toLowerCase().includes('overlay')) badgeText = 'PIP';

            const isFirst = index === 0;
            const isLast = index === this.tracks.length - 1;

            header.innerHTML = `
                <div class="track-header-left">
                    <span class="track-badge ${badgeClass}">${badgeText}</span>
                    <span class="track-header-title" title="${track.name} — dubbelklicka för att byta namn">${track.name}</span>
                </div>
                <div class="track-header-actions">
                    <button class="btn-track-action track-move-up" title="Flytta lager uppåt (framåt i bild)" ${isFirst ? 'disabled style="opacity:0.3;cursor:default;"' : ''}>${ncIcon('chevron-up')}</button>
                    <button class="btn-track-action track-move-down" title="Flytta lager nedåt (bakåt i bild)" ${isLast ? 'disabled style="opacity:0.3;cursor:default;"' : ''}>${ncIcon('chevron-down')}</button>
                    ${track.type === 'audio' 
                        ? `<button class="btn-track-action track-toggle-mute ${state.muted ? 'active' : ''}" title="${state.muted ? 'Aktivera ljudspår' : 'Tysta ljudspår'}">${state.muted ? ncIcon('volume-off') : ncIcon('volume')}</button>`
                        : `<button class="btn-track-action track-toggle-vis ${!state.visible ? 'active' : ''}" title="${state.visible ? 'Dölj spår' : 'Visa spår'}">${state.visible ? ncIcon('eye') : ncIcon('eye-off')}</button>`
                    }
                    <button class="btn-track-action track-toggle-lock ${state.locked ? 'active' : ''}" title="${state.locked ? 'Lås upp spår' : 'Lås spår'}">${state.locked ? ncIcon('lock') : ncIcon('unlock')}</button>
                    <button class="btn-track-action track-delete" title="Ta bort spår">${ncIcon('close')}</button>
                </div>
            `;

            headersScrollable.appendChild(header);

            // 2. Create Track Lane
            const lane = document.createElement('div');
            lane.className = 'track-lane';
            lane.id = `lane-${track.id}`;
            lane.dataset.trackId = track.id;
            if (state.locked) lane.classList.add('locked');

            if (playheadScrubber) {
                timelineCanvas.insertBefore(lane, playheadScrubber);
            } else {
                timelineCanvas.appendChild(lane);
            }
        });

        this.setupTrackHeaderControls();
        this.renderAllClips();
        this.updatePlayheadPosition();
    }

    setupTrackHeaderControls() {
        document.querySelectorAll('.track-header').forEach(header => {
            const trackId = header.dataset.trackId;
            if (!trackId) return;

            // Move Up (▲)
            const btnUp = header.querySelector('.track-move-up');
            if (btnUp) {
                btnUp.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.moveTrack(trackId, 'up');
                });
            }

            // Move Down (▼)
            const btnDown = header.querySelector('.track-move-down');
            if (btnDown) {
                btnDown.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.moveTrack(trackId, 'down');
                });
            }

            // Visibility (👁️)
            const btnVis = header.querySelector('.track-toggle-vis');
            if (btnVis) {
                btnVis.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const state = this.trackStates[trackId];
                    if (!state) return;
                    state.visible = !state.visible;
                    btnVis.innerHTML = state.visible ? ncIcon('eye') : ncIcon('eye-off');
                    btnVis.classList.toggle('active', !state.visible);
                    btnVis.title = state.visible ? `Dölj ${trackId}` : `Visa ${trackId}`;
                    this.engine.render();
                });
            }

            // Mute (🔊)
            const btnMute = header.querySelector('.track-toggle-mute');
            if (btnMute) {
                btnMute.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const state = this.trackStates[trackId];
                    if (!state) return;
                    state.muted = !state.muted;
                    btnMute.innerHTML = state.muted ? ncIcon('volume-off') : ncIcon('volume');
                    btnMute.classList.toggle('active', state.muted);
                    btnMute.title = state.muted ? 'Aktivera ljudspår' : 'Tysta ljudspår';
                    this.engine.render();
                });
            }

            // Lock (🔒)
            const btnLock = header.querySelector('.track-toggle-lock');
            if (btnLock) {
                btnLock.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const state = this.trackStates[trackId];
                    if (!state) return;
                    state.locked = !state.locked;
                    btnLock.innerHTML = state.locked ? ncIcon('lock') : ncIcon('unlock');
                    btnLock.classList.toggle('active', state.locked);
                    btnLock.title = state.locked ? `Lås upp ${trackId}` : `Lås ${trackId}`;
                    const lane = document.getElementById(`lane-${trackId}`);
                    if (lane) {
                        lane.classList.toggle('locked', state.locked);
                    }
                });
            }

            // Delete Track (✕)
            const btnDelete = header.querySelector('.track-delete');
            if (btnDelete) {
                btnDelete.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.removeTrack(trackId);
                });
            }

            // Inline Rename on Double Click
            const titleEl = header.querySelector('.track-header-title');
            if (titleEl) {
                titleEl.addEventListener('dblclick', (e) => {
                    e.stopPropagation();
                    titleEl.contentEditable = 'true';
                    titleEl.focus();
                    try {
                        const range = document.createRange();
                        range.selectNodeContents(titleEl);
                        const sel = window.getSelection();
                        sel.removeAllRanges();
                        sel.addRange(range);
                    } catch (_) {}
                });
                titleEl.addEventListener('blur', () => {
                    titleEl.contentEditable = 'false';
                    const newName = titleEl.textContent.trim();
                    const track = this.tracks.find(t => t.id === trackId);
                    if (track && newName) {
                        track.name = newName;
                    }
                });
                titleEl.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        titleEl.blur();
                    }
                });
            }
        });
    }

    addTrack(type = 'video', customName = null) {
        const count = this.tracks.filter(t => t.type === type).length + 1;
        let defaultName = `Lager ${this.tracks.length + 1}`;
        if (type === 'video') defaultName = `Video ${count}`;
        else if (type === 'text') defaultName = `Text ${count}`;
        else if (type === 'effect') defaultName = `Effekt ${count}`;
        else if (type === 'audio') defaultName = `Ljud ${count}`;

        const name = customName || defaultName;
        const id = `track-${type}-${Date.now().toString().slice(-4)}`;

        const newTrack = { id, name, type };

        // Determine smart insertion index
        let insertIndex = 0;
        if (type === 'audio') {
            insertIndex = this.tracks.length;
        } else if (type === 'video') {
            const firstVideoIdx = this.tracks.findIndex(t => t.type === 'video');
            if (firstVideoIdx !== -1) {
                insertIndex = firstVideoIdx;
            } else {
                const firstAudioIdx = this.tracks.findIndex(t => t.type === 'audio');
                insertIndex = firstAudioIdx !== -1 ? firstAudioIdx : this.tracks.length;
            }
        } else if (type === 'effect') {
            const firstEffIdx = this.tracks.findIndex(t => t.type === 'effect');
            insertIndex = firstEffIdx !== -1 ? firstEffIdx : 1;
        } else if (type === 'text') {
            insertIndex = 0;
        }

        this.tracks.splice(insertIndex, 0, newTrack);
        this.trackStates[id] = { visible: true, locked: false, muted: false };

        this.renderTracks();
        this.engine.render();

        if (window.novaCutToast) {
            window.novaCutToast(`➕ Nytt spår "${name}" skapat!`);
        }

        return newTrack;
    }

    moveTrack(trackId, direction) {
        const idx = this.tracks.findIndex(t => t.id === trackId);
        if (idx === -1) return;

        if (direction === 'up' && idx > 0) {
            const temp = this.tracks[idx];
            this.tracks[idx] = this.tracks[idx - 1];
            this.tracks[idx - 1] = temp;
        } else if (direction === 'down' && idx < this.tracks.length - 1) {
            const temp = this.tracks[idx];
            this.tracks[idx] = this.tracks[idx + 1];
            this.tracks[idx + 1] = temp;
        } else {
            return;
        }

        this.renderTracks();
        this.engine.render();

        if (window.novaCutToast) {
            window.novaCutToast(`Lagerordning uppdaterad`);
        }
    }

    removeTrack(trackId) {
        if (this.tracks.length <= 1) {
            alert('Minst ett spår måste finnas kvar i tidslinjen.');
            return;
        }

        const track = this.tracks.find(t => t.id === trackId);
        if (!track) return;

        const trackClips = this.clips.filter(c => c.trackId === trackId);
        if (trackClips.length > 0) {
            const confirmed = confirm(`Spåret "${track.name}" innehåller ${trackClips.length} klipp.\n\nVill du ta bort spåret och alla dess klipp?`);
            if (!confirmed) return;

            this.clips = this.clips.filter(c => c.trackId !== trackId);
        }

        this.tracks = this.tracks.filter(t => t.id !== trackId);
        delete this.trackStates[trackId];

        this.renderTracks();
        this.recalculateProjectDuration();
        this.engine.render();

        if (window.novaCutToast) {
            window.novaCutToast(`Spåret "${track.name}" togs bort`);
        }
    }

    restoreTracks(tracks, trackStates) {
        if (Array.isArray(tracks) && tracks.length > 0) {
            this.tracks = tracks.map(t => ({ ...t }));
        }
        if (trackStates && typeof trackStates === 'object') {
            this.trackStates = { ...trackStates };
        }
        this.renderTracks();
    }
}

window.NovaCutTimeline = NovaCutTimeline;

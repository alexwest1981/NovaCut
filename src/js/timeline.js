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

        this.initRuler();
        this.setupEvents();
        this.setupTrackHeaderControls();

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
        const lane = document.getElementById(`lane-${clip.trackId}`);
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

        // Audio waveform visual representation
        if (clip.type === 'audio' || clip.trackId === 'audio') {
            let wf = el.querySelector('.clip-waveform');
            if (!wf) {
                wf = document.createElement('div');
                wf.className = 'clip-waveform';
                el.appendChild(wf);
            }
            wf.innerHTML = `
                <svg width="100%" height="100%" preserveAspectRatio="none" viewBox="0 0 100 40">
                    <path d="M0,20 Q5,5 10,20 T20,20 T30,10 T40,20 T50,2 T60,20 T70,8 T80,20 T90,14 T100,20" fill="none" stroke="currentColor" stroke-width="2.5" />
                    <path d="M0,20 Q5,35 10,20 T20,20 T30,30 T40,20 T50,38 T60,20 T70,32 T80,20 T90,26 T100,20" fill="none" stroke="currentColor" stroke-width="2.5" />
                </svg>
            `;
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

        // Ruler click / scrub
        timeRuler.addEventListener('mousedown', (e) => {
            const rect = timeRuler.getBoundingClientRect();
            const scrollLeft = viewport.scrollLeft;
            const clickX = e.clientX - rect.left + scrollLeft;
            const targetTime = clickX / this.pixelsPerSecond;
            this.engine.seek(targetTime);

            this.activeDrag = { type: 'scrub' };
        });

        // Timeline Clip interaction (move / trim / select)
        this.canvasContainer.addEventListener('mousedown', (e) => {
            const clipEl = e.target.closest('.timeline-clip');
            if (!clipEl) {
                if (!e.target.closest('.trim-handle') && !e.target.closest('.playhead-line')) {
                    this.deselectAll();
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
                const rect = timeRuler.getBoundingClientRect();
                const scrollLeft = viewport.scrollLeft;
                const clickX = e.clientX - rect.left + scrollLeft;
                this.engine.seek(clickX / this.pixelsPerSecond);

                // Auto-scroll when scrubbing near edges of viewport
                if (e.clientX > rect.right - 50) {
                    viewport.scrollLeft += 15;
                } else if (e.clientX < rect.left + 50 && viewport.scrollLeft > 0) {
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

    setupTrackHeaderControls() {
        document.querySelectorAll('.track-header').forEach(header => {
            const trackId = header.dataset.trackId;
            if (!trackId) return;

            const btnVis = header.querySelector('.track-toggle-vis');
            if (btnVis) {
                btnVis.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const state = this.trackStates[trackId];
                    if (!state) return;
                    state.visible = !state.visible;
                    btnVis.textContent = state.visible ? '👁️' : '🚫';
                    btnVis.classList.toggle('active', !state.visible);
                    btnVis.title = state.visible ? `Dölj ${trackId}` : `Visa ${trackId}`;
                    this.engine.render();
                });
            }

            const btnMute = header.querySelector('.track-toggle-mute');
            if (btnMute) {
                btnMute.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const state = this.trackStates[trackId];
                    if (!state) return;
                    state.muted = !state.muted;
                    btnMute.textContent = state.muted ? '🔇' : '🔊';
                    btnMute.classList.toggle('active', state.muted);
                    btnMute.title = state.muted ? 'Aktivera ljudspår' : 'Tysta ljudspår';
                    this.engine.render();
                });
            }

            const btnLock = header.querySelector('.track-toggle-lock');
            if (btnLock) {
                btnLock.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const state = this.trackStates[trackId];
                    if (!state) return;
                    state.locked = !state.locked;
                    btnLock.textContent = state.locked ? '🔒' : '🔓';
                    btnLock.classList.toggle('active', state.locked);
                    btnLock.title = state.locked ? `Lås upp ${trackId}` : `Lås ${trackId}`;
                    const lane = document.getElementById(`lane-${trackId}`);
                    if (lane) {
                        lane.classList.toggle('locked', state.locked);
                    }
                });
            }
        });
    }
}

window.NovaCutTimeline = NovaCutTimeline;

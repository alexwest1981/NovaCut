/**
 * NovaCut - Multi-Track Timeline System
 */
class NovaCutTimeline {
    constructor(engine) {
        this.engine = engine;

        this.pixelsPerSecond = 60; // 60px = 1 second
        this.snapThreshold = 8;    // in pixels
        this.snappingEnabled = true;

        this.clips = [];
        this.selectedClipId = null;

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
    }

    initRuler() {
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
        const minWidth = Math.max(2000, (this.engine.duration + 5) * this.pixelsPerSecond);
        this.canvasContainer.style.minWidth = `${minWidth}px`;
        this.rulerCanvas.width = minWidth;
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
    }

    addClip(clipData) {
        const clip = {
            id: clipData.id || `clip-${Date.now()}-${Math.floor(Math.random()*1000)}`,
            trackId: clipData.trackId || 'video',
            mediaId: clipData.mediaId || null,
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
            volume: clipData.volume !== undefined ? clipData.volume : 1.0
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

    updatePlayheadPosition() {
        const x = this.engine.currentTime * this.pixelsPerSecond;
        this.playheadScrubber.style.left = `${x}px`;
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

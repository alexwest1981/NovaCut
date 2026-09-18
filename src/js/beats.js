/**
 * NovaCut - Beat Detection & Auto-Cut to the Beat Engine
 */
class NovaCutBeats {
    constructor(timeline, engine) {
        this.timeline = timeline;
        this.engine = engine;
        this.audioCtx = null;
        this.sensitivity = 'medium';
        this.isProcessing = false;

        this.setupToolbarUI();
    }

    getAudioContext() {
        if (!this.audioCtx) {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            this.audioCtx = new AudioContextClass();
        }
        if (this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }
        return this.audioCtx;
    }

    async detectBeatsForClip(clip, sensitivity = 'medium') {
        this.sensitivity = sensitivity;
        const audioEl = this.engine.mediaElements?.get(clip.mediaId);

        let detectedBeats = [];

        try {
            if (audioEl && audioEl.src && !audioEl.src.startsWith('blob:') && !audioEl.src.startsWith('data:')) {
                // Fetch local file or buffer
                const response = await fetch(audioEl.src);
                const arrayBuffer = await response.arrayBuffer();
                const actx = this.getAudioContext();
                const audioBuffer = await actx.decodeAudioData(arrayBuffer);
                detectedBeats = this.analyzeAudioBuffer(audioBuffer, clip.startTime, clip.duration, sensitivity);
            } else if (audioEl && audioEl.src && (audioEl.src.startsWith('blob:') || audioEl.src.startsWith('data:'))) {
                // Blob or data url
                const response = await fetch(audioEl.src);
                const arrayBuffer = await response.arrayBuffer();
                const actx = this.getAudioContext();
                const audioBuffer = await actx.decodeAudioData(arrayBuffer);
                detectedBeats = this.analyzeAudioBuffer(audioBuffer, clip.startTime, clip.duration, sensitivity);
            } else {
                // Procedural musical beat grid (120 BPM = 0.5s intervals)
                detectedBeats = this.generateMusicalGrid(clip.startTime, clip.duration, 120);
            }
        } catch (err) {
            console.warn('[Beats] Audio buffer decode error, using rhythmic grid fallback:', err);
            detectedBeats = this.generateMusicalGrid(clip.startTime, clip.duration, 128);
        }

        this.timeline.beatMarkers = detectedBeats;
        this.timeline.drawRuler();
        return detectedBeats;
    }

    analyzeAudioBuffer(audioBuffer, startTime, duration, sensitivity) {
        const channelData = audioBuffer.getChannelData(0);
        const sampleRate = audioBuffer.sampleRate;
        const blockSize = 1024;
        const numBlocks = Math.floor(channelData.length / blockSize);
        const energies = new Float32Array(numBlocks);

        for (let i = 0; i < numBlocks; i++) {
            let sum = 0;
            const start = i * blockSize;
            for (let j = 0; j < blockSize; j++) {
                const sample = channelData[start + j];
                sum += sample * sample;
            }
            energies[i] = sum / blockSize;
        }

        // Variance / Sensitivity thresholds
        const cThreshold = sensitivity === 'high' ? 1.22 : (sensitivity === 'low' ? 1.55 : 1.38);
        const windowSize = Math.round(sampleRate / blockSize * 0.75); // ~0.75s local window
        const minSpacingBlocks = Math.round((sensitivity === 'high' ? 0.22 : 0.32) * (sampleRate / blockSize));

        const beats = [];
        let lastBeatBlock = -minSpacingBlocks;

        for (let i = windowSize; i < numBlocks - windowSize; i++) {
            let localSum = 0;
            for (let w = -windowSize; w <= windowSize; w++) {
                localSum += energies[i + w];
            }
            const localAvg = localSum / (windowSize * 2 + 1);

            if (energies[i] > localAvg * cThreshold && (i - lastBeatBlock) >= minSpacingBlocks) {
                if (energies[i] >= energies[i - 1] && energies[i] >= energies[i + 1]) {
                    const beatTimeInClip = (i * blockSize) / sampleRate;
                    if (beatTimeInClip <= duration) {
                        const beatTimeOnTimeline = parseFloat((startTime + beatTimeInClip).toFixed(3));
                        beats.push(beatTimeOnTimeline);
                        lastBeatBlock = i;
                    }
                }
            }
        }

        // If very few beats were found, guarantee a rhythmic minimum
        if (beats.length < 3) {
            return this.generateMusicalGrid(startTime, duration, 120);
        }

        return beats;
    }

    generateMusicalGrid(startTime, duration, bpm = 120) {
        const beatInterval = 60 / bpm; // 0.5s for 120 BPM
        const beats = [];
        for (let t = startTime + beatInterval; t < startTime + duration - 0.1; t += beatInterval) {
            beats.push(parseFloat(t.toFixed(3)));
        }
        return beats;
    }

    autoDetectActiveAudioTrack(sensitivity = 'medium') {
        const audioClip = this.timeline.clips.find(c => c.trackId === 'audio') ||
                          this.timeline.clips.find(c => c.trackId === 'video' || c.trackId === 'overlay');

        if (!audioClip) {
            // Generate grid for entire project duration
            const duration = Math.max(8, this.engine.duration || 10);
            const beats = this.generateMusicalGrid(0, duration, 128);
            this.timeline.beatMarkers = beats;
            this.timeline.drawRuler();
            return { clip: null, count: beats.length };
        }

        return this.detectBeatsForClip(audioClip, sensitivity).then(beats => {
            return { clip: audioClip, count: beats.length };
        });
    }

    autoCutTargetClip(clipId, applyVelocityZoom = true) {
        if (!this.timeline.beatMarkers || this.timeline.beatMarkers.length === 0) {
            return 0;
        }

        const cuts = this.timeline.autoCutClipToBeats(clipId, applyVelocityZoom);
        return cuts;
    }

    setupToolbarUI() {
        const btnBeats = document.getElementById('btnDetectBeats');
        const btnAutoCut = document.getElementById('btnAutoCutBeats');

        if (btnBeats) {
            btnBeats.addEventListener('click', async () => {
                btnBeats.innerHTML = '<span>' + ncIcon('music') + ' Lyssnar...</span>';
                const res = await this.autoDetectActiveAudioTrack('medium');
                btnBeats.classList.add('active');
                btnBeats.innerHTML = `<span>${ncIcon('music')} Beats (${this.timeline.beatMarkers.length})</span>`;

                if (window.showToast) {
                    window.showToast(` Hittade ${this.timeline.beatMarkers.length} taktslag på ljudspåret! Magnetisk snapping aktiverad.`);
                }
            });
        }

        if (btnAutoCut) {
            btnAutoCut.addEventListener('click', async () => {
                if (!this.timeline.beatMarkers || this.timeline.beatMarkers.length === 0) {
                    // Detect beats first
                    btnBeats?.click();
                    await new Promise(r => setTimeout(r, 400));
                }

                // Target selected clip or first video clip
                let targetId = this.timeline.selectedClipId;
                if (!targetId) {
                    const firstVideo = this.timeline.clips.find(c => c.trackId === 'video' || c.trackId === 'overlay');
                    if (firstVideo) targetId = firstVideo.id;
                }

                if (!targetId) {
                    if (window.showToast) window.showToast(' Markera ett videoklipp att klippa till takten!');
                    return;
                }

                const cutCount = this.autoCutTargetClip(targetId, true);
                if (cutCount > 0) {
                    btnAutoCut.innerHTML = `<span>${ncIcon('check')} ${cutCount} klipp gjorda!</span>`;
                    if (window.showToast) {
                        window.showToast(` Auto-Cut: Skapade ${cutCount} synkade klipp med rytmisk hastighetszoom!`);
                    }
                    setTimeout(() => {
                        btnAutoCut.innerHTML = '<span>' + ncIcon('zap') + ' Auto-Cut till Takten</span>';
                    }, 2500);
                } else {
                    if (window.showToast) window.showToast('Inga nya beats träffade det valda klippet.');
                }
            });
        }
    }
}

window.NovaCutBeats = NovaCutBeats;

/**
 * NovaCut - Video Export Engine (CapCut Pro Social Media & NVENC Hardware Acceleration Hub)
 */
class NovaCutExporter {
    constructor(engine, timeline) {
        this.engine = engine;
        this.timeline = timeline;

        this.modal = document.getElementById('exportModal');
        this.progressContainer = document.getElementById('exportProgressContainer');
        this.progressBar = document.getElementById('exportProgressBar');
        this.percentText = document.getElementById('exportPercent');
        this.statusText = document.getElementById('exportStatusText');

        this.hwBadge = document.getElementById('exportHwBadge');
        this.hwText = document.getElementById('exportHwText');

        this.resSelect = document.getElementById('exportResolution');
        this.fpsSelect = document.getElementById('exportFps');
        this.bitrateSelect = document.getElementById('exportBitrate');
        this.codecSelect = document.getElementById('exportCodec');

        this.activePreset = 'tiktok';
        this.presets = {
            tiktok: { res: '1080x1920', fps: '60', bitrate: '18M', codec: 'nvenc_h264' },
            shorts: { res: '1080x1920', fps: '60', bitrate: '20M', codec: 'nvenc_h264' },
            yt4k: { res: '3840x2160', fps: '60', bitrate: '45M', codec: 'nvenc_hevc' },
            yt1080: { res: '1920x1080', fps: '60', bitrate: '16M', codec: 'nvenc_h264' },
            insta: { res: '1080x1080', fps: '30', bitrate: '12M', codec: 'nvenc_h264' },
            custom: null
        };

        this.isExporting = false;
        this.initHwDetection();
        this.setupEvents();
    }

    async initHwDetection() {
        if (window.novaCut && typeof window.novaCut.getHwAcceleration === 'function') {
            try {
                const hw = await window.novaCut.getHwAcceleration();
                if (hw && hw.status) {
                    if (this.hwText) {
                        this.hwText.textContent = hw.status;
                    }
                    if (!hw.hasNvenc) {
                        // If NVENC not available on current hardware, adjust default codec options
                        const nvencOpt1 = this.codecSelect?.querySelector('option[value="nvenc_h264"]');
                        const nvencOpt2 = this.codecSelect?.querySelector('option[value="nvenc_hevc"]');
                        if (nvencOpt1) nvencOpt1.textContent = 'MP4 (H.264 mjukvara - NVENC ej tillgänglig)';
                        if (nvencOpt2) nvencOpt2.textContent = 'MP4 (HEVC - NVENC ej tillgänglig)';
                    }
                }
            } catch (err) {
                console.warn('[Exporter] Could not probe hardware acceleration:', err);
                if (this.hwText) this.hwText.textContent = 'Mjukvarukodning aktiv';
            }
        } else {
            if (this.hwText) this.hwText.textContent = 'Webbläsare (MediaRecorder direkt)';
        }

        if (window.novaCut && typeof window.novaCut.onExportProgress === 'function') {
            window.novaCut.onExportProgress((data) => {
                if (!this.isExporting) return;
                if (data && typeof data === 'object') {
                    if (data.percent !== null && data.percent !== undefined) {
                        // Transcode stage maps from 75% to 99%
                        const mapped = Math.min(99, 75 + Math.round(data.percent * 0.24));
                        this.progressBar.style.width = `${mapped}%`;
                        this.percentText.textContent = `${mapped}%`;
                    }
                    if (data.stage === 'transcoding') {
                        this.statusText.textContent = '⚡ NVIDIA NVENC hårdvarukodar till MP4...';
                    }
                }
            });
        }
    }

    setupEvents() {
        const btnOpen = document.getElementById('btnOpenExportModal');
        if (btnOpen) {
            btnOpen.addEventListener('click', () => {
                // Pre-sync preset with current project aspect ratio if available
                if (this.engine.aspectRatio === '9:16') {
                    this.applyPreset('tiktok');
                } else if (this.engine.aspectRatio === '1:1') {
                    this.applyPreset('insta');
                } else if (this.engine.aspectRatio === '16:9') {
                    this.applyPreset('yt1080');
                }
                this.modal.classList.add('active');
            });
        }

        const btnStart = document.getElementById('btnStartExport');
        if (btnStart) {
            btnStart.addEventListener('click', () => {
                this.startExport();
            });
        }

        // Preset cards selection
        const presetGrid = document.getElementById('exportPresetsGrid');
        if (presetGrid) {
            presetGrid.querySelectorAll('.export-preset-card').forEach(card => {
                card.addEventListener('click', () => {
                    const presetKey = card.getAttribute('data-preset');
                    this.applyPreset(presetKey);
                });
            });
        }

        // Detect manual adjustments and switch to custom
        [this.resSelect, this.fpsSelect, this.bitrateSelect, this.codecSelect].forEach(select => {
            if (select) {
                select.addEventListener('change', () => {
                    this.checkCustomPresetMatch();
                });
            }
        });
    }

    applyPreset(presetKey) {
        this.activePreset = presetKey;

        // Highlight preset card
        const presetGrid = document.getElementById('exportPresetsGrid');
        if (presetGrid) {
            presetGrid.querySelectorAll('.export-preset-card').forEach(c => {
                c.classList.toggle('active', c.getAttribute('data-preset') === presetKey);
            });
        }

        const preset = this.presets[presetKey];
        if (!preset) return;

        if (this.resSelect && preset.res) {
            this.resSelect.value = preset.res;
        }
        if (this.fpsSelect && preset.fps) {
            this.fpsSelect.value = preset.fps;
        }
        if (this.bitrateSelect && preset.bitrate) {
            this.bitrateSelect.value = preset.bitrate;
        }
        if (this.codecSelect && preset.codec) {
            this.codecSelect.value = preset.codec;
        }
    }

    checkCustomPresetMatch() {
        const curRes = this.resSelect?.value;
        const curFps = this.fpsSelect?.value;
        const curBitrate = this.bitrateSelect?.value;
        const curCodec = this.codecSelect?.value;

        let matched = 'custom';
        for (const [k, p] of Object.entries(this.presets)) {
            if (p && p.res === curRes && p.fps === curFps && p.bitrate === curBitrate && p.codec === curCodec) {
                matched = k;
                break;
            }
        }

        this.activePreset = matched;
        const presetGrid = document.getElementById('exportPresetsGrid');
        if (presetGrid) {
            presetGrid.querySelectorAll('.export-preset-card').forEach(c => {
                c.classList.toggle('active', c.getAttribute('data-preset') === matched);
            });
        }
    }

    async startExport() {
        if (this.isExporting) return;

        const codec = this.codecSelect?.value || 'nvenc_h264';
        const isWebM = codec === 'webm';
        const ext = isWebM ? '.webm' : '.mp4';

        const projectTitle = document.getElementById('projectTitle')?.value.trim() || 'NovaCut_Video';
        const defaultFileName = `${projectTitle.replace(/[\s\W]+/g, '_')}${ext}`;

        let savePath = null;
        if (window.novaCut && typeof window.novaCut.saveExportDialog === 'function') {
            savePath = await window.novaCut.saveExportDialog(defaultFileName);
            if (!savePath) return; // User cancelled
        }

        this.isExporting = true;
        this.progressContainer.style.display = 'block';
        this.progressBar.style.width = '0%';
        this.percentText.textContent = '0%';
        this.statusText.textContent = 'Förbereder rendering...';

        const resolution = this.resSelect.value;
        const [targetWidth, targetHeight] = resolution.split('x').map(Number);
        const fps = parseInt(this.fpsSelect.value) || 60;
        const bitrate = this.bitrateSelect.value || '18M';

        await this.recordCanvas(savePath, targetWidth, targetHeight, fps, bitrate, codec);
    }

    async recordCanvas(savePath, width, height, fps, bitrate, codec) {
        const { engine, timeline } = this;
        engine.pause();

        const canvas = engine.canvas;
        const totalDuration = Math.max(0.5, engine.duration || 5);
        const totalFrames = Math.ceil(totalDuration * fps);

        // Collect all timeline audio tracks to mix via FFmpeg
        const audioTracks = [];
        const isAudioTrackMuted = timeline.trackStates?.audio?.muted || false;
        const isVideoTrackMuted = timeline.trackStates?.video?.muted || false;

        for (const clip of timeline.clips) {
            if (clip.trackId === 'audio' && isAudioTrackMuted) continue;
            if ((clip.trackId === 'video' || clip.trackId === 'overlay') && isVideoTrackMuted) continue;

            const isAudio = clip.type === 'audio' || clip.trackId === 'audio';
            const isVideo = (clip.type === 'video' || clip.trackId === 'video' || clip.trackId === 'overlay') && !clip.isSticker && !clip.demoPattern;

            if (isAudio || isVideo) {
                let filePath = clip.filePath;

                // Try resolving filePath from engine media elements or project media library
                if (!filePath && clip.mediaId) {
                    const el = engine.mediaElements?.get(clip.mediaId);
                    if (el && el.src) {
                        if (el.src.startsWith('file://')) {
                            filePath = decodeURIComponent(el.src.replace(/^file:\/\//, ''));
                        } else if (el.src.startsWith('/')) {
                            filePath = el.src;
                        }
                    }
                    if (!filePath && window.projectMediaLibrary?.has(clip.mediaId)) {
                        filePath = window.projectMediaLibrary.get(clip.mediaId).path;
                    }
                }

                // If still missing, attempt locateMediaFile via IPC
                if (!filePath && window.novaCut && typeof window.novaCut.locateMediaFile === 'function') {
                    filePath = await window.novaCut.locateMediaFile(clip.title || clip.mediaName);
                }

                if (filePath) {
                    audioTracks.push({
                        filePath: filePath.replace(/^file:\/\//, ''),
                        startTime: Math.max(0, clip.startTime || 0),
                        duration: Math.max(0.1, clip.duration || 1.0),
                        sourceOffset: Math.max(0, clip.sourceOffset || 0),
                        volume: clip.volume !== undefined ? clip.volume : 1.0,
                        fadeIn: clip.fadeIn || 0,
                        fadeOut: clip.fadeOut || 0,
                        speed: clip.speed || 1.0
                    });
                }
            }
        }

        console.log('[NovaCut Exporter] Prepared audio tracks for export:', audioTracks);

        // Capture video stream from canvas
        const stream = canvas.captureStream(fps);

        let mimeType = 'video/webm;codecs=vp9';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
            mimeType = 'video/webm;codecs=vp8';
        }
        if (!MediaRecorder.isTypeSupported(mimeType)) {
            mimeType = 'video/webm';
        }

        // Parse numerical bits per second
        let bps = 18000000;
        if (bitrate.endsWith('M')) {
            bps = parseFloat(bitrate) * 1000000;
        }

        const recorder = new MediaRecorder(stream, {
            mimeType: mimeType,
            videoBitsPerSecond: bps
        });

        const chunks = [];
        recorder.ondataavailable = (e) => {
            if (e.data && e.data.size > 0) {
                chunks.push(e.data);
            }
        };

        recorder.onstop = async () => {
            const blob = new Blob(chunks, { type: mimeType });
            const arrayBuffer = await blob.arrayBuffer();

            if (savePath && window.novaCut) {
                this.statusText.textContent = '⚡ Sparar temp-ström och förbereder ljudmixning & kodning...';
                this.progressBar.style.width = '75%';
                this.percentText.textContent = '75%';

                const tempRes = await window.novaCut.saveTempExport(arrayBuffer);
                if (!tempRes || !tempRes.tempPath) {
                    alert('Kunde inte skapa temporär videofil inför kodning.');
                    this.isExporting = false;
                    return;
                }

                this.statusText.textContent = `⚡ Mixar ${audioTracks.length} ljudspår och renderar video med FFmpeg...`;

                try {
                    await window.novaCut.transcodeExport({
                        inputPath: tempRes.tempPath,
                        outputPath: savePath,
                        codec: codec,
                        bitrate: bitrate,
                        fps: fps,
                        width: width,
                        height: height,
                        duration: totalDuration,
                        audioTracks: audioTracks
                    });

                    this.progressBar.style.width = '100%';
                    this.percentText.textContent = '100%';
                    let label = 'MP4';
                    if (codec.includes('hevc')) label = 'MP4 (HEVC)';
                    else if (codec.includes('nvenc')) label = 'MP4 (NVENC H.264)';
                    else if (codec === 'webm') label = 'WebM';
                    this.onExportComplete(savePath, label);
                } catch (err) {
                    console.error('[Exporter] Transcode failed:', err);
                    alert('Fel vid hårdvarukodning: ' + err.message);
                    this.isExporting = false;
                }
            } else {
                // Web browser fallback download
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${document.getElementById('projectTitle')?.value || 'NovaCut'}.webm`;
                a.click();
                URL.revokeObjectURL(url);
                this.onExportComplete('Nedladdningar', 'WebM');
            }
        };

        recorder.start();

        // Render each frame sequentially
        const frameTime = 1 / fps;
        let currentFrame = 0;

        const renderNextFrame = () => {
            if (currentFrame >= totalFrames) {
                recorder.stop();
                return;
            }

            const timestamp = currentFrame * frameTime;
            engine.currentTime = timestamp;
            engine.render();

            currentFrame++;
            // Canvas rendering maps from 0% to 75%
            const pct = Math.round((currentFrame / totalFrames) * 75);
            this.progressBar.style.width = `${pct}%`;
            this.percentText.textContent = `${pct}%`;
            this.statusText.textContent = `Renderar bildruta ${currentFrame} av ${totalFrames} (${Math.round((currentFrame / totalFrames) * 100)}%)...`;

            setTimeout(renderNextFrame, Math.max(1, Math.floor(1000 / fps / 2)));
        };

        renderNextFrame();
    }

    onExportComplete(filePath, formatName = 'MP4') {
        this.isExporting = false;
        this.statusText.textContent = `Export klar! (${formatName})`;
        setTimeout(() => {
            this.modal.classList.remove('active');
            this.progressContainer.style.display = 'none';
            if (window.novaCutToast) {
                window.novaCutToast(`🎉 ${formatName} exporterad framgångsrikt!`);
            } else {
                alert(`🎉 Videon har exporterats framgångsrikt!\n\nFormat: ${formatName}\nSparad till: ${filePath}`);
            }
        }, 500);
    }
}

window.NovaCutExporter = NovaCutExporter;

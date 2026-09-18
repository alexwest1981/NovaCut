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
                this.cancelRequested = false;
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

        const btnClose = this.modal?.querySelector('.close-modal-btn');
        if (btnClose) {
            btnClose.addEventListener('click', () => {
                if (this.isExporting) {
                    if (confirm('Vill du avbryta pågående export?')) {
                        this.cancelRequested = true;
                    }
                } else {
                    this.modal.classList.remove('active');
                }
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

        const initialScrubTime = engine.currentTime || 0;
        const canvas = engine.canvas;

        // Calculate exact duration based on active clips (without empty padding)
        const maxClipEnd = timeline.clips.reduce((max, c) => Math.max(max, (c.startTime || 0) + (c.duration || 0)), 0);
        const totalDuration = Math.max(0.5, maxClipEnd > 0 ? maxClipEnd : (engine.duration || 5));
        const totalFrames = Math.ceil(totalDuration * fps);

        // Collect all timeline audio tracks to mix via FFmpeg
        const audioTracks = [];
        const isAudioTrackMuted = timeline.trackStates?.audio?.muted || false;
        const isVideoTrackMuted = timeline.trackStates?.video?.muted || false;

        for (const clip of timeline.clips) {
            if (clip.trackId === 'audio' && isAudioTrackMuted) continue;
            if ((clip.trackId === 'video' || clip.trackId === 'overlay') && isVideoTrackMuted) continue;

            // Explicitly exclude non-audio elements (images, subtitles, text, adjustment, visualizers, stickers)
            if (clip.type === 'image' || clip.type === 'text' || clip.type === 'subtitle' || 
                clip.type === 'adjustment' || clip.isSticker || clip.demoPattern) {
                continue;
            }

            const isAudio = clip.type === 'audio' || clip.trackId === 'audio';
            const isVideo = clip.type === 'video';

            if (!isAudio && !isVideo) continue;

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
                const clean = filePath.replace(/^file:\/\//, '');
                // Strictly exclude image files from audio stream mixing
                if (/\.(png|jpe?g|webp|gif|bmp|svg|avif|tiff?)$/i.test(clean)) {
                    continue;
                }

                audioTracks.push({
                    filePath: clean,
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

        console.log('[NovaCut Exporter] Prepared audio tracks for export:', audioTracks);

        // --- DIRECT STREAMING PIPE TO FFMPEG (1:1 Frame-Accurate Precision) ---
        if (savePath && window.novaCut && typeof window.novaCut.exportStartPipe === 'function') {
            engine.isExporting = true;
            this.cancelRequested = false;
            const prevSelectedClip = timeline?.selectedClipId;
            if (timeline) timeline.selectedClipId = null;

            let sessionId = null;
            try {
                this.statusText.textContent = '⚡ Initierar FFmpeg bildruts-ström & hårdvarukodare...';
                this.progressBar.style.width = '2%';
                this.percentText.textContent = '2%';

                const startRes = await window.novaCut.exportStartPipe({
                    outputPath: savePath,
                    codec: codec,
                    bitrate: bitrate,
                    fps: fps,
                    width: width,
                    height: height,
                    duration: totalDuration,
                    audioTracks: audioTracks
                });

                if (!startRes || !startRes.sessionId) {
                    throw new Error(startRes?.error || 'Kunde inte starta FFmpeg-kodning.');
                }
                sessionId = startRes.sessionId;

                const frameTime = 1 / fps;
                for (let currentFrame = 0; currentFrame < totalFrames; currentFrame++) {
                    if (this.cancelRequested) {
                        break;
                    }

                    const timestamp = currentFrame * frameTime;
                    engine.currentTime = timestamp;
                    engine.render();

                    // Convert current rendered frame directly to JPEG blob
                    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.92));
                    const arrayBuffer = await blob.arrayBuffer();

                    // Pipe directly into FFmpeg stdin
                    await window.novaCut.exportPushFrame(sessionId, arrayBuffer);

                    // Update UI progress
                    const pct = Math.min(99, Math.round(((currentFrame + 1) / totalFrames) * 100));
                    this.progressBar.style.width = `${pct}%`;
                    this.percentText.textContent = `${pct}%`;
                    this.statusText.textContent = `⚡ Renderar & hårdvarukodar bildruta ${currentFrame + 1} av ${totalFrames} (${pct}%)...`;

                    // Minimal yield for UI update responsiveness
                    if (currentFrame % 5 === 0) {
                        await new Promise(r => setTimeout(r, 0));
                    }
                }

                if (this.cancelRequested) {
                    await window.novaCut.exportCancelPipe(sessionId);
                    this.isExporting = false;
                    engine.isExporting = false;
                    this.statusText.textContent = 'Exporten avbröts.';
                    return;
                }

                this.statusText.textContent = '⚡ Slutför videofil och sammanfogar strömmar...';
                await window.novaCut.exportFinishPipe(sessionId);

                this.progressBar.style.width = '100%';
                this.percentText.textContent = '100%';
                let label = 'MP4';
                if (codec.includes('hevc')) label = 'MP4 (HEVC)';
                else if (codec.includes('nvenc')) label = 'MP4 (NVENC H.264)';
                else if (codec === 'webm') label = 'WebM';
                this.onExportComplete(savePath, label);

            } catch (err) {
                console.error('[Exporter] Direct pipe export failed:', err);
                if (sessionId) {
                    try { await window.novaCut.exportCancelPipe(sessionId); } catch (_) {}
                }
                alert('Fel vid videoexport: ' + err.message);
                this.isExporting = false;
                engine.isExporting = false;
            } finally {
                engine.isExporting = false;
                if (timeline && prevSelectedClip) timeline.selectedClipId = prevSelectedClip;
                engine.seek(initialScrubTime || 0);
                engine.render();
            }
            return;
        }

        // Browser Fallback (MediaRecorder)
        engine.isExporting = true;
        const prevSelectedClip = timeline?.selectedClipId;
        if (timeline) timeline.selectedClipId = null;

        const stream = canvas.captureStream(0);
        const track = stream.getVideoTracks ? stream.getVideoTracks()[0] : null;

        let mimeType = 'video/webm;codecs=vp9';
        if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = 'video/webm;codecs=vp8';
        if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = 'video/webm';

        let bps = 18000000;
        if (bitrate.endsWith('M')) bps = parseFloat(bitrate) * 1000000;

        const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: bps });
        const chunks = [];
        recorder.ondataavailable = (e) => {
            if (e.data && e.data.size > 0) chunks.push(e.data);
        };

        recorder.onstop = async () => {
            engine.isExporting = false;
            if (timeline && prevSelectedClip) timeline.selectedClipId = prevSelectedClip;
            engine.seek(initialScrubTime || 0);
            engine.render();

            const blob = new Blob(chunks, { type: mimeType });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${document.getElementById('projectTitle')?.value || 'NovaCut'}.webm`;
            a.click();
            URL.revokeObjectURL(url);
            this.onExportComplete('Nedladdningar', 'WebM');
        };

        recorder.start();

        const frameTime = 1 / fps;
        let currentFrame = 0;

        const renderNextFrame = async () => {
            if (currentFrame >= totalFrames) {
                await new Promise(r => setTimeout(r, 250));
                recorder.stop();
                return;
            }

            const timestamp = currentFrame * frameTime;
            engine.currentTime = timestamp;
            engine.render();

            if (track && typeof track.requestFrame === 'function') {
                track.requestFrame();
            }

            currentFrame++;
            const pct = Math.round((currentFrame / totalFrames) * 100);
            this.progressBar.style.width = `${pct}%`;
            this.percentText.textContent = `${pct}%`;
            this.statusText.textContent = `Renderar bildruta ${currentFrame} av ${totalFrames} (${pct}%)...`;

            setTimeout(renderNextFrame, 16);
        };

        renderNextFrame();
    }

    onExportComplete(filePath, formatName = 'MP4') {
        this.isExporting = false;
        this.statusText.textContent = `Export klar! (${formatName})`;
        
        if (window.publisher && filePath) {
            window.publisher.setExportedFile(filePath);
        }

        setTimeout(() => {
            this.modal.classList.remove('active');
            this.progressContainer.style.display = 'none';
            
            if (window.novaCutToast) {
                window.novaCutToast(` ${formatName} exporterad! Öppnar Social Media Hub...`);
            }

            // Seamlessly bridge to Social Media Publishing Hub
            if (window.publisher) {
                const ratio = this.engine?.aspectRatio || '16:9';
                const defaultPlatform = ratio === '9:16' ? 'tiktok' : 'youtube';
                window.publisher.open(defaultPlatform);
            }
        }, 500);
    }
}

window.NovaCutExporter = NovaCutExporter;

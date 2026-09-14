/**
 * NovaCut - Video Export Engine (MediaRecorder & FFmpeg)
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

        this.isExporting = false;
        this.setupEvents();
    }

    setupEvents() {
        const btnOpen = document.getElementById('btnOpenExportModal');
        if (btnOpen) {
            btnOpen.addEventListener('click', () => {
                this.modal.classList.add('active');
            });
        }

        const btnStart = document.getElementById('btnStartExport');
        if (btnStart) {
            btnStart.addEventListener('click', () => {
                this.startExport();
            });
        }
    }

    async startExport() {
        if (this.isExporting) return;

        let savePath = null;
        const projectTitle = document.getElementById('projectTitle').value.trim() || 'NovaCut_Video';
        const defaultFileName = `${projectTitle.replace(/[\s\W]+/g, '_')}.mp4`;

        if (window.novaCut && typeof window.novaCut.saveExportDialog === 'function') {
            savePath = await window.novaCut.saveExportDialog(defaultFileName);
            if (!savePath) return; // User cancelled
        }

        this.isExporting = true;
        this.progressContainer.style.display = 'block';
        this.progressBar.style.width = '0%';
        this.percentText.textContent = '0%';
        this.statusText.textContent = 'Förbereder export...';

        const resolution = document.getElementById('exportResolution').value;
        const [targetWidth, targetHeight] = resolution.split('x').map(Number);
        const fps = parseInt(document.getElementById('exportFps').value) || 30;

        // Render project to MediaRecorder stream
        await this.recordCanvas(savePath, targetWidth, targetHeight, fps);
    }

    async recordCanvas(savePath, width, height, fps) {
        const { engine, timeline } = this;
        engine.pause();

        const canvas = engine.canvas;
        const totalDuration = engine.duration;
        const totalFrames = Math.ceil(totalDuration * fps);

        // Capture Stream from Canvas
        const stream = canvas.captureStream(fps);
        
        let mimeType = 'video/webm;codecs=vp9';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
            mimeType = 'video/webm';
        }

        const recorder = new MediaRecorder(stream, {
            mimeType: mimeType,
            videoBitsPerSecond: 16000000 // 16 Mbps high quality
        });

        const chunks = [];
        recorder.ondataavailable = (e) => {
            if (e.data && e.data.size > 0) {
                chunks.push(e.data);
            }
        };

        recorder.onstop = async () => {
            this.statusText.textContent = 'Sparar videofil...';
            this.progressBar.style.width = '100%';
            this.percentText.textContent = '100%';

            const blob = new Blob(chunks, { type: mimeType });

            if (savePath && window.novaCut) {
                // Save to local path via Node Buffer if in Electron
                const reader = new FileReader();
                reader.onload = () => {
                    const buffer = Buffer.from(reader.result);
                    const fs = require('fs');
                    fs.writeFileSync(savePath, buffer);
                    this.onExportComplete(savePath);
                };
                reader.readAsArrayBuffer(blob);
            } else {
                // Web download fallback
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${document.getElementById('projectTitle').value || 'NovaCut'}.webm`;
                a.click();
                URL.revokeObjectURL(url);
                this.onExportComplete('Nedladdningar');
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
            const pct = Math.round((currentFrame / totalFrames) * 100);
            this.progressBar.style.width = `${pct}%`;
            this.percentText.textContent = `${pct}%`;
            this.statusText.textContent = `Renderar bildruta ${currentFrame} av ${totalFrames}...`;

            setTimeout(renderNextFrame, 1000 / fps);
        };

        renderNextFrame();
    }

    onExportComplete(filePath) {
        this.isExporting = false;
        this.statusText.textContent = 'Export klar!';
        setTimeout(() => {
            this.modal.classList.remove('active');
            this.progressContainer.style.display = 'none';
            alert(`🎉 Videon har exporterats framgångsrikt!\n\nSparad till: ${filePath}`);
        }, 600);
    }
}

window.NovaCutExporter = NovaCutExporter;

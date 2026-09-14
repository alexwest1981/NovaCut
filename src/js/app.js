/**
 * NovaCut - Main Application Controller
 */
document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize Subsystems
    const engine = new NovaCutEngine();
    window.engine = engine;

    const timeline = new NovaCutTimeline(engine);
    window.timeline = timeline;

    const inspector = new NovaCutInspector(engine, timeline);
    window.inspector = inspector;

    const marketplace = new NovaCutMarketplace(timeline, engine);
    window.marketplace = marketplace;

    const exporter = new NovaCutExporter(engine, timeline);
    window.exporter = exporter;

    // 2. Setup Top Bar & Transport Controls
    document.getElementById('btnPlayPause').addEventListener('click', () => engine.togglePlay());
    document.getElementById('btnPrevFrame').addEventListener('click', () => engine.stepFrame(-1));
    document.getElementById('btnNextFrame').addEventListener('click', () => engine.stepFrame(1));
    document.getElementById('btnLoop').addEventListener('click', (e) => {
        engine.isLooping = !engine.isLooping;
        e.currentTarget.style.color = engine.isLooping ? 'var(--accent)' : 'var(--text-secondary)';
    });

    const masterVolSlider = document.getElementById('masterVolumeSlider');
    if (masterVolSlider) {
        masterVolSlider.addEventListener('input', (e) => {
            engine.masterVolume = parseFloat(e.target.value);
            engine.render();
        });
    }

    const aspectSelect = document.getElementById('aspectRatioSelect');
    if (aspectSelect) {
        aspectSelect.addEventListener('change', (e) => {
            engine.setAspectRatio(e.target.value);
        });
    }

    // 3. Setup Timeline Controls
    document.getElementById('btnSplitClip').addEventListener('click', () => timeline.splitSelectedClip());
    document.getElementById('btnDeleteClip').addEventListener('click', () => timeline.deleteSelectedClip());

    const snapBtn = document.getElementById('btnSnappingToggle');
    if (snapBtn) {
        snapBtn.addEventListener('click', () => {
            timeline.snappingEnabled = !timeline.snappingEnabled;
            snapBtn.classList.toggle('active', timeline.snappingEnabled);
        });
    }

    const zoomSlider = document.getElementById('timelineZoomSlider');
    if (zoomSlider) {
        zoomSlider.addEventListener('input', (e) => {
            timeline.setZoom(parseFloat(e.target.value));
        });
    }

    // 4. Sidebar Tabs Switching
    document.querySelectorAll('.sidebar-tabs .tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.sidebar-tabs .tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

            btn.classList.add('active');
            const tabId = btn.dataset.tab;
            const content = document.getElementById(`tab-${tabId}`);
            if (content) content.classList.add('active');
        });
    });

    // 5. Media Import (Button & Drag/Drop)
    const btnImport = document.getElementById('btnImportMedia');
    if (btnImport) {
        btnImport.addEventListener('click', async () => {
            if (window.novaCut && typeof window.novaCut.openMedia === 'function') {
                const files = await window.novaCut.openMedia();
                if (files) {
                    files.forEach(f => handleImportedFile(f));
                }
            } else {
                // Fallback web input
                const input = document.createElement('input');
                input.type = 'file';
                input.multiple = true;
                input.accept = 'video/*,audio/*,image/*';
                input.onchange = (e) => {
                    Array.from(e.target.files).forEach(f => handleWebFile(f));
                };
                input.click();
            }
        });
    }

    const dropzone = document.getElementById('mediaDropzone');
    if (dropzone) {
        ['dragenter', 'dragover'].forEach(name => {
            dropzone.addEventListener(name, (e) => { e.preventDefault(); dropzone.classList.add('dragover'); });
        });
        ['dragleave', 'drop'].forEach(name => {
            dropzone.addEventListener(name, (e) => { e.preventDefault(); dropzone.classList.remove('dragover'); });
        });
        dropzone.addEventListener('drop', (e) => {
            const files = Array.from(e.dataTransfer.files);
            files.forEach(f => handleWebFile(f));
        });
        dropzone.addEventListener('click', () => btnImport.click());
    }

    function getVideoTracksEndTime() {
        let maxTime = 0;
        timeline.clips.forEach(c => {
            if (c.trackId === 'video' || c.trackId === 'overlay') {
                const end = c.startTime + c.duration;
                if (end > maxTime) maxTime = end;
            }
        });
        return maxTime > 0 ? maxTime : engine.duration;
    }

    function formatDuration(sec) {
        if (!sec || isNaN(sec) || !isFinite(sec)) return '0:00';
        const m = Math.floor(sec / 60);
        const s = Math.floor(sec % 60);
        return `${m}:${s.toString().padStart(2, '0')}`;
    }

    function handleImportedFile(fileObj) {
        const mediaId = `media-${Date.now()}-${Math.floor(Math.random()*1000)}`;
        let detectedDuration = fileObj.type === 'image' ? 4.0 : 180.0;

        const mediaCard = document.createElement('div');
        mediaCard.className = 'media-card';

        let actionsHTML = '';
        if (fileObj.type === 'audio') {
            actionsHTML = `
                <div class="media-card-actions">
                    <button class="btn-card-action btn-place-all" title="Placera hela låtens längd på tidslinjen">🎵 Placera hela låten</button>
                    <button class="btn-card-action btn-fit-video" title="Anpassa låten efter videons längd">✂️ Till videoslut</button>
                </div>
            `;
        }

        mediaCard.innerHTML = `
            <div class="media-thumb">
                <span>${fileObj.type === 'video' ? '🎬' : fileObj.type === 'audio' ? '🎵' : '🖼️'}</span>
                <span class="media-badge">${fileObj.type === 'audio' ? 'LJUD' : fileObj.type.toUpperCase()}</span>
            </div>
            <div class="media-title" title="${fileObj.name}">${fileObj.name}</div>
            ${actionsHTML}
        `;

        const badge = mediaCard.querySelector('.media-badge');

        // Create DOM element for engine cache & detect real duration
        if (fileObj.type === 'video') {
            const video = document.createElement('video');
            video.src = fileObj.path;
            video.preload = 'metadata';
            video.muted = true;
            video.addEventListener('loadedmetadata', () => {
                if (video.duration && isFinite(video.duration)) {
                    detectedDuration = video.duration;
                    badge.textContent = formatDuration(video.duration);
                }
            });
            engine.mediaElements.set(mediaId, video);
            document.getElementById('mediaCache').appendChild(video);
        } else if (fileObj.type === 'image') {
            const img = new Image();
            img.src = fileObj.path;
            engine.mediaElements.set(mediaId, img);
        } else if (fileObj.type === 'audio') {
            const audio = new Audio(fileObj.path);
            audio.preload = 'metadata';
            audio.addEventListener('loadedmetadata', () => {
                if (audio.duration && isFinite(audio.duration)) {
                    detectedDuration = audio.duration;
                    badge.textContent = formatDuration(audio.duration);
                    const btnAll = mediaCard.querySelector('.btn-place-all');
                    if (btnAll) {
                        btnAll.textContent = `🎵 Hela låten (${formatDuration(audio.duration)})`;
                    }
                }
            });
            engine.mediaElements.set(mediaId, audio);
            document.getElementById('mediaCache').appendChild(audio);
        }

        const placeAudio = (fitToVideo = false) => {
            const startTime = engine.currentTime;
            let duration = detectedDuration;
            if (fitToVideo) {
                const videoEnd = getVideoTracksEndTime();
                duration = Math.max(1.0, videoEnd - startTime);
            }
            timeline.addClip({
                mediaId: mediaId,
                title: fileObj.name,
                type: 'audio',
                trackId: 'audio',
                startTime: startTime,
                duration: duration
            });
        };

        if (fileObj.type === 'audio') {
            const btnPlaceAll = mediaCard.querySelector('.btn-place-all');
            const btnFit = mediaCard.querySelector('.btn-fit-video');
            if (btnPlaceAll) {
                btnPlaceAll.addEventListener('click', (e) => {
                    e.stopPropagation();
                    placeAudio(false);
                });
            }
            if (btnFit) {
                btnFit.addEventListener('click', (e) => {
                    e.stopPropagation();
                    placeAudio(true);
                });
            }
            mediaCard.addEventListener('click', () => {
                placeAudio(false);
            });
        } else {
            mediaCard.addEventListener('click', () => {
                timeline.addClip({
                    mediaId: mediaId,
                    title: fileObj.name,
                    type: fileObj.type,
                    trackId: fileObj.type === 'overlay' ? 'overlay' : 'video',
                    startTime: engine.currentTime,
                    duration: detectedDuration || (fileObj.type === 'image' ? 4.0 : 6.0)
                });
            });
        }

        document.getElementById('mediaGrid').appendChild(mediaCard);
    }

    function handleWebFile(file) {
        const url = URL.createObjectURL(file);
        let type = 'video';
        if (file.type.startsWith('audio/')) type = 'audio';
        if (file.type.startsWith('image/')) type = 'image';

        handleImportedFile({
            path: url,
            name: file.name,
            type: type,
            size: file.size
        });
    }

    // 6. Text Templates
    document.getElementById('btnAddDefaultText').addEventListener('click', () => {
        timeline.addClip({
            trackId: 'text',
            title: 'Min Rubrik',
            type: 'text',
            text: 'NovaCut - Video Editor',
            startTime: engine.currentTime,
            duration: 4.0,
            fontSize: 72,
            color: '#00d482'
        });
    });

    const textPresets = [
        { name: 'Neon Cyber', text: 'NEON DREAMS', color: '#00f0ff', outlineColor: '#ff007f', outlineWidth: 6, font: 'Impact' },
        { name: 'Cinematic Minimal', text: 'A FILM BY ALEX', color: '#ffffff', font: 'Georgia, serif', fontSize: 48 },
        { name: 'Bold Banner', text: 'TRENDING NOW', color: '#000000', bgColor: '#f59e0b', font: 'Impact' },
        { name: 'Subtitles / Captions', text: 'Här är en snygg undertext...', color: '#ffffff', bgColor: 'rgba(0,0,0,0.7)', fontSize: 42 }
    ];

    const textPresetsGrid = document.getElementById('textPresetsGrid');
    if (textPresetsGrid) {
        textPresets.forEach(preset => {
            const btn = document.createElement('div');
            btn.className = 'media-card';
            btn.style.padding = '12px 8px';
            btn.style.textAlign = 'center';
            btn.innerHTML = `
                <div style="font-weight: 700; font-size: 13px; color: ${preset.color}; background: ${preset.bgColor || 'transparent'}; padding: 4px; border-radius: 4px;">
                    ${preset.text}
                </div>
                <div style="font-size: 10px; color: var(--text-muted); margin-top: 6px;">${preset.name}</div>
            `;
            btn.addEventListener('click', () => {
                timeline.addClip({
                    trackId: 'text',
                    title: preset.name,
                    type: 'text',
                    text: preset.text,
                    startTime: engine.currentTime,
                    duration: 4.0,
                    fontSize: preset.fontSize || 64,
                    fontFamily: preset.font || 'sans-serif',
                    color: preset.color,
                    bgColor: preset.bgColor || null,
                    outlineColor: preset.outlineColor || null,
                    outlineWidth: preset.outlineWidth || 4
                });
            });
            textPresetsGrid.appendChild(btn);
        });
    }

    // 7. Audio Tab & Presets
    const btnAudioOnly = document.getElementById('btnImportAudioOnly');
    if (btnAudioOnly && btnImport) {
        btnAudioOnly.addEventListener('click', () => btnImport.click());
    }

    const audioPresets = [
        { name: 'Synthwave Neon Drive', artist: 'Nova Beats', duration: 165 },
        { name: 'Lo-Fi Sunset Chill', artist: 'Cafe Chillout', duration: 192 },
        { name: 'Cinematic Ambient Pulse', artist: 'Epic Sounds', duration: 110 }
    ];

    const audioListEl = document.getElementById('audioPresetsList');
    if (audioListEl) {
        audioPresets.forEach(preset => {
            const item = document.createElement('div');
            item.className = 'plugin-card';
            item.innerHTML = `
                <div style="padding: 10px 14px; display: flex; flex-direction: column; gap: 8px;">
                    <div style="display: flex; align-items: center; justify-content: space-between;">
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <span style="font-size: 18px;">🎵</span>
                            <div>
                                <div style="font-weight: 600; font-size: 12px;">${preset.name}</div>
                                <div style="font-size: 10px; color: var(--text-muted);">${preset.artist}</div>
                            </div>
                        </div>
                        <span class="media-badge" style="background: var(--bg-surface);">${formatDuration(preset.duration)}</span>
                    </div>
                    <div style="display: flex; gap: 6px; margin-top: 2px;">
                        <button class="btn-card-action btn-place-all" style="flex: 1;">🎵 Placera hela låten (${formatDuration(preset.duration)})</button>
                        <button class="btn-card-action btn-fit-video">✂️ Till videoslut</button>
                    </div>
                </div>
            `;

            item.querySelector('.btn-place-all').addEventListener('click', () => {
                timeline.addClip({
                    trackId: 'audio',
                    title: preset.name,
                    type: 'audio',
                    startTime: engine.currentTime,
                    duration: preset.duration // Placerar hela låtens fulla längd!
                });
            });

            item.querySelector('.btn-fit-video').addEventListener('click', () => {
                const videoEnd = getVideoTracksEndTime();
                const dur = Math.max(1.0, videoEnd - engine.currentTime);
                timeline.addClip({
                    trackId: 'audio',
                    title: preset.name,
                    type: 'audio',
                    startTime: engine.currentTime,
                    duration: dur
                });
            });

            audioListEl.appendChild(item);
        });
    }

    // 8. Modals close handling
    document.querySelectorAll('.close-modal-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.target.closest('.modal-overlay').classList.remove('active');
        });
    });

    // 8. Global Keyboard Shortcuts
    window.addEventListener('keydown', (e) => {
        const isInput = document.activeElement && (
            document.activeElement.tagName === 'INPUT' ||
            document.activeElement.tagName === 'TEXTAREA' ||
            document.activeElement.isContentEditable
        );

        if (e.key === 'Escape') {
            document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('active'));
            if (!isInput) timeline.selectClip(null);
            return;
        }

        if (isInput) return;

        if (e.code === 'Space') {
            e.preventDefault();
            engine.togglePlay();
        } else if (e.key.toLowerCase() === 's' || (e.ctrlKey && e.key.toLowerCase() === 'b')) {
            e.preventDefault();
            timeline.splitSelectedClip();
        } else if (e.key === 'Delete' || e.key === 'Backspace') {
            e.preventDefault();
            timeline.deleteSelectedClip();
        } else if (e.key === 'ArrowLeft') {
            e.preventDefault();
            engine.stepFrame(-1);
        } else if (e.key === 'ArrowRight') {
            e.preventDefault();
            engine.stepFrame(1);
        } else if (e.key.toLowerCase() === 'n') {
            e.preventDefault();
            snapBtn.click();
        }
    });

    // 9. Load Default Starter Project (Sample Video + Text + Cyberpunk Filter)
    timeline.addClip({
        trackId: 'video',
        title: 'Syntetisk Bakgrundsvideo',
        type: 'video',
        startTime: 0,
        duration: 8.0,
        scale: 1.0
    });

    timeline.addClip({
        trackId: 'text',
        title: 'NovaCut Välkommen',
        type: 'text',
        text: 'NovaCut Video Editor',
        startTime: 1.0,
        duration: 5.0,
        fontSize: 72,
        color: '#00d482'
    });

    timeline.addClip({
        trackId: 'effect',
        title: 'Cyberpunk Neon',
        type: 'effect',
        startTime: 2.0,
        duration: 4.5,
        cssFilter: 'contrast(130%) saturate(150%) hue-rotate(160deg)',
        params: { intensity: 1.2 }
    });

    // Initial render
    engine.render();
});

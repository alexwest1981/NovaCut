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

    const sfxManager = new NovaCutSFX(timeline, engine);
    window.sfxManager = sfxManager;

    const transitions = new NovaCutTransitions(engine, timeline);
    window.transitions = transitions;

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

    // Monitor Bar Tools
    const btnCanvasSnap = document.getElementById('btnToggleCanvasSnap');
    if (btnCanvasSnap) {
        btnCanvasSnap.addEventListener('click', () => engine.toggleCanvasSnapping());
    }

    const btnSafeZone = document.getElementById('btnToggleSafeZone');
    if (btnSafeZone) {
        btnSafeZone.addEventListener('click', () => engine.toggleSafeZone());
    }

    const monitorZoomSelect = document.getElementById('monitorZoomSelect');
    if (monitorZoomSelect) {
        monitorZoomSelect.addEventListener('change', (e) => {
            engine.setMonitorZoom(e.target.value);
        });
    }

    const btnFitCanvas = document.getElementById('btnFitCanvas');
    if (btnFitCanvas) {
        btnFitCanvas.addEventListener('click', () => {
            if (monitorZoomSelect) monitorZoomSelect.value = 'fit';
            engine.setMonitorZoom('fit');
            const container = document.querySelector('.canvas-container');
            if (container) {
                container.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
            }
            engine.render();
        });
    }

    // Toggle Left Pane (Media Drawer)
    const btnToggleLeft = document.getElementById('btnToggleLeftPane');
    const leftPane = document.getElementById('leftPane');
    if (btnToggleLeft && leftPane) {
        btnToggleLeft.addEventListener('click', () => {
            leftPane.classList.toggle('collapsed');
            btnToggleLeft.classList.toggle('active', !leftPane.classList.contains('collapsed'));
            timeline.updateTimelineWidth();
            timeline.drawRuler();
            engine.render();
        });
    }

    // Toggle Right Pane (Inspector)
    const btnToggleRight = document.getElementById('btnToggleRightPane');
    const rightPane = document.getElementById('inspectorPane');
    if (btnToggleRight && rightPane) {
        btnToggleRight.addEventListener('click', () => {
            rightPane.classList.toggle('collapsed');
            btnToggleRight.classList.toggle('active', !rightPane.classList.contains('collapsed'));
            timeline.updateTimelineWidth();
            timeline.drawRuler();
            engine.render();
        });
    }

    // 3. Setup Timeline Controls
    document.getElementById('btnSplitClip').addEventListener('click', () => timeline.splitSelectedClip());
    document.getElementById('btnDeleteClip').addEventListener('click', () => timeline.deleteSelectedClip());

    const btnTrimStartQ = document.getElementById('btnTrimStartQ');
    if (btnTrimStartQ) {
        btnTrimStartQ.addEventListener('click', () => timeline.rippleTrimStart());
    }

    const btnTrimEndW = document.getElementById('btnTrimEndW');
    if (btnTrimEndW) {
        btnTrimEndW.addEventListener('click', () => timeline.rippleTrimEnd());
    }

    const btnRippleDelete = document.getElementById('btnRippleDelete');
    if (btnRippleDelete) {
        btnRippleDelete.addEventListener('click', () => timeline.rippleDeleteSelectedClip());
    }

    const btnCloseGaps = document.getElementById('btnCloseGaps');
    if (btnCloseGaps) {
        btnCloseGaps.addEventListener('click', () => timeline.closeGaps());
    }

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
        { name: 'Neon Cyber', text: 'NEON DREAMS', color: '#00f0ff', outlineColor: '#ff007f', outlineWidth: 6, font: 'Impact', posY: -80 },
        { name: 'Cinematic Minimal', text: 'A FILM BY ALEX', color: '#ffffff', font: 'Georgia, serif', fontSize: 48, posY: 0 },
        { name: 'Bold Banner', text: 'TRENDING NOW', color: '#000000', bgColor: '#f59e0b', font: 'Impact', posY: -320 },
        { name: 'Subtitles / Captions', text: 'Här är en snygg undertext...', color: '#ffffff', bgColor: 'rgba(0,0,0,0.7)', fontSize: 42, posY: 380 }
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
                    outlineWidth: preset.outlineWidth || 4,
                    posX: preset.posX || 0,
                    posY: preset.posY || 0
                });
            });
            textPresetsGrid.appendChild(btn);
        });
    }

    // Auto-Captions Controller (Sprint 8)
    const btnOpenCaptions = document.getElementById('btnOpenAutoCaptions');
    const captionsModal = document.getElementById('autoCaptionsModal');
    const btnCloseCaptions = document.getElementById('btnCloseAutoCaptionsModal');
    const btnCancelCaptions = document.getElementById('btnCancelAutoCaptions');
    const sourceSelect = document.getElementById('captionSourceSelect');
    const customScriptBox = document.getElementById('customScriptBox');
    const btnGenerateCaptions = document.getElementById('btnGenerateAutoCaptions');

    if (btnOpenCaptions && captionsModal) {
        btnOpenCaptions.addEventListener('click', () => {
            captionsModal.classList.add('active');
        });

        const closeCaptionsModal = () => {
            captionsModal.classList.remove('active');
        };

        if (btnCloseCaptions) btnCloseCaptions.addEventListener('click', closeCaptionsModal);
        if (btnCancelCaptions) btnCancelCaptions.addEventListener('click', closeCaptionsModal);

        if (sourceSelect && customScriptBox) {
            sourceSelect.addEventListener('change', () => {
                customScriptBox.style.display = (sourceSelect.value === 'manual-script') ? 'block' : 'none';
            });
        }

        // Style selection
        document.querySelectorAll('.caption-style-card').forEach(card => {
            card.addEventListener('click', () => {
                document.querySelectorAll('.caption-style-card').forEach(c => c.classList.remove('active'));
                card.classList.add('active');
            });
        });

        const demoScripts = {
            'demo-hook': [
                "Det här enkla tricket",
                "förändrade hur jag skapar videos",
                "för alltid.",
                "De flesta gör misstaget",
                "att använda tråkiga typsnitt,",
                "men med dynamiska färger",
                "och rörliga effekter",
                "stannar tittarna kvar.",
                "Prova själv i NovaCut idag!"
            ],
            'demo-story': [
                "Vänta till slutet",
                "för att se vad som",
                "faktiskt hände.",
                "Vi startade projektet",
                "klockan tre på natten,",
                "och ingen trodde",
                "att det skulle bli klart.",
                "Men resultatet chockade",
                "precis alla som såg det!"
            ],
            'demo-tech': [
                "The secret to viral videos",
                "is fast cuts and animated captions.",
                "People watch with the sound off",
                "more than fifty percent of the time.",
                "Captions keep viewers hooked",
                "from the very first second."
            ]
        };

        if (btnGenerateCaptions) {
            btnGenerateCaptions.addEventListener('click', () => {
                const source = sourceSelect ? sourceSelect.value : 'demo-hook';
                const activeCard = document.querySelector('.caption-style-card.active');
                const chosenStyle = activeCard ? activeCard.dataset.style : 'hormozi';
                const wordsPerClip = document.getElementById('captionWordsPerClip')?.value || 'short';
                const positionMode = document.getElementById('captionPositionSelect')?.value || 'lower-third';

                let phrases = [];
                if (source === 'manual-script') {
                    const customText = document.getElementById('customScriptText')?.value || '';
                    if (customText.trim()) {
                        const words = customText.trim().split(/\s+/);
                        const chunkSize = (wordsPerClip === 'single') ? 2 : (wordsPerClip === 'short') ? 4 : 6;
                        for (let i = 0; i < words.length; i += chunkSize) {
                            phrases.push(words.slice(i, i + chunkSize).join(' '));
                        }
                    }
                } else if (demoScripts[source]) {
                    phrases = demoScripts[source];
                } else {
                    phrases = demoScripts['demo-hook'];
                }

                if (phrases.length === 0) {
                    phrases = demoScripts['demo-hook'];
                }

                // Style presets
                const styleConfig = {
                    hormozi: {
                        captionStyle: 'hormozi',
                        fontSize: 72,
                        fontFamily: 'Impact, sans-serif',
                        bold: true,
                        color: '#ffffff',
                        highlightColor: '#ffd000',
                        outlineColor: '#000000',
                        outlineWidth: 8
                    },
                    karaoke: {
                        captionStyle: 'karaoke',
                        fontSize: 60,
                        fontFamily: 'sans-serif',
                        bold: true,
                        color: '#ffffff',
                        highlightColor: '#00d482',
                        outlineColor: '#000000',
                        outlineWidth: 6
                    },
                    pop: {
                        captionStyle: 'pop',
                        fontSize: 64,
                        fontFamily: "'JetBrains Mono', monospace",
                        bold: true,
                        color: '#00f2fe',
                        outlineColor: '#000000',
                        outlineWidth: 6
                    },
                    minimal: {
                        captionStyle: 'minimal',
                        fontSize: 48,
                        fontFamily: 'sans-serif',
                        bold: false,
                        color: '#ffffff',
                        bgColor: 'rgba(0, 0, 0, 0.72)',
                        outlineColor: null
                    }
                };

                const currentStyle = styleConfig[chosenStyle] || styleConfig.hormozi;
                const posY = (positionMode === 'center') ? 0 : 340;

                // Remove existing text clips to prevent overlap
                const existingTextClips = timeline.clips.filter(c => c.trackId === 'text');
                existingTextClips.forEach(c => timeline.removeClip(c.id));

                let curTime = 0.0;
                let firstClipId = null;

                phrases.forEach((phrase, idx) => {
                    const wordCount = phrase.split(/\s+/).length;
                    const dur = Math.max(1.2, Math.min(3.5, wordCount * 0.38));

                    const clip = {
                        trackId: 'text',
                        title: phrase.slice(0, 16),
                        type: 'text',
                        text: phrase,
                        startTime: curTime,
                        duration: dur,
                        fontSize: currentStyle.fontSize,
                        fontFamily: currentStyle.fontFamily,
                        bold: currentStyle.bold,
                        color: currentStyle.color,
                        bgColor: currentStyle.bgColor || null,
                        outlineColor: currentStyle.outlineColor || null,
                        outlineWidth: currentStyle.outlineWidth || 6,
                        captionStyle: currentStyle.captionStyle,
                        highlightColor: currentStyle.highlightColor || null,
                        posX: 0,
                        posY: posY
                    };

                    timeline.addClip(clip);
                    if (idx === 0) firstClipId = clip.id;
                    curTime += dur;
                });

                closeCaptionsModal();
                engine.seek(0);
                if (firstClipId) {
                    timeline.selectClip(firstClipId);
                }
                engine.render();
            });
        }
    }

    // 7. Audio Tab & Presets
    const btnAudioOnly = document.getElementById('btnImportAudioOnly');
    if (btnAudioOnly && btnImport) {
        btnAudioOnly.addEventListener('click', () => btnImport.click());
    }

    // Audio Sub-tabs (SFX vs Musik)
    const subTabSfx = document.getElementById('subTabSfx');
    const subTabMusic = document.getElementById('subTabMusic');
    const audioViewSfx = document.getElementById('audioViewSfx');
    const audioViewMusic = document.getElementById('audioViewMusic');

    if (subTabSfx && subTabMusic && audioViewSfx && audioViewMusic) {
        subTabSfx.addEventListener('click', () => {
            subTabSfx.classList.add('active');
            subTabMusic.classList.remove('active');
            audioViewSfx.style.display = 'block';
            audioViewMusic.style.display = 'none';
        });

        subTabMusic.addEventListener('click', () => {
            subTabMusic.classList.add('active');
            subTabSfx.classList.remove('active');
            audioViewMusic.style.display = 'block';
            audioViewSfx.style.display = 'none';
        });
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
        } else if (e.key.toLowerCase() === 'q') {
            e.preventDefault();
            timeline.rippleTrimStart();
        } else if (e.key.toLowerCase() === 'w') {
            e.preventDefault();
            timeline.rippleTrimEnd();
        } else if (e.shiftKey && (e.key === 'Delete' || e.key === 'Backspace')) {
            e.preventDefault();
            timeline.rippleDeleteSelectedClip();
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

    // 9. Initialize Project Hub & Welcome Screen
    const projectManager = new NovaCutProjects(engine, timeline);
    window.projectManager = projectManager;

    // 10. Setup Interactive Responsive Panel Resizers
    setupLayoutResizers(engine, timeline);

    // Always start application with the Welcome Screen & Project List
    projectManager.showWelcome();

    // Initial render
    engine.render();
});

/**
 * Interactive Panel Resizers (Splitters) for dynamic resolution management
 */
function setupLayoutResizers(engine, timeline) {
    const leftPane = document.getElementById('leftPane');
    const rightPane = document.getElementById('inspectorPane');
    const timelinePanel = document.getElementById('timelinePanel');

    const resizerLeft = document.getElementById('resizerLeft');
    const resizerRight = document.getElementById('resizerRight');
    const resizerTimeline = document.getElementById('resizerTimeline');

    // Restore saved custom dimensions if valid
    const savedLeft = localStorage.getItem('novacut_layout_left');
    if (savedLeft && leftPane) {
        const val = parseInt(savedLeft, 10);
        if (val >= 200 && val <= window.innerWidth * 0.5) leftPane.style.width = `${val}px`;
    }

    const savedRight = localStorage.getItem('novacut_layout_right');
    if (savedRight && rightPane) {
        const val = parseInt(savedRight, 10);
        if (val >= 180 && val <= window.innerWidth * 0.45) rightPane.style.width = `${val}px`;
    }

    const savedTimeline = localStorage.getItem('novacut_layout_timeline');
    if (savedTimeline && timelinePanel) {
        const val = parseInt(savedTimeline, 10);
        if (val >= 140 && val <= window.innerHeight * 0.7) timelinePanel.style.height = `${val}px`;
    }

    // Left Pane Resizer (horizontal)
    if (resizerLeft && leftPane) {
        let isDragging = false;
        let startX = 0;
        let startW = 0;

        resizerLeft.addEventListener('mousedown', (e) => {
            isDragging = true;
            startX = e.clientX;
            startW = leftPane.getBoundingClientRect().width;
            resizerLeft.classList.add('dragging');
            document.body.style.cursor = 'col-resize';
            e.preventDefault();
        });

        window.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            const delta = e.clientX - startX;
            const newW = Math.max(200, Math.min(window.innerWidth * 0.5, startW + delta));
            leftPane.style.width = `${newW}px`;
            timeline.updateTimelineWidth();
            engine.render();
        });

        window.addEventListener('mouseup', () => {
            if (!isDragging) return;
            isDragging = false;
            resizerLeft.classList.remove('dragging');
            document.body.style.cursor = '';
            localStorage.setItem('novacut_layout_left', Math.round(leftPane.getBoundingClientRect().width));
            timeline.updateTimelineWidth();
            timeline.drawRuler();
            engine.render();
        });

        resizerLeft.addEventListener('dblclick', () => {
            leftPane.style.width = '';
            localStorage.removeItem('novacut_layout_left');
            timeline.updateTimelineWidth();
            timeline.drawRuler();
            engine.render();
        });
    }

    // Right Pane Resizer (horizontal)
    if (resizerRight && rightPane) {
        let isDragging = false;
        let startX = 0;
        let startW = 0;

        resizerRight.addEventListener('mousedown', (e) => {
            isDragging = true;
            startX = e.clientX;
            startW = rightPane.getBoundingClientRect().width;
            resizerRight.classList.add('dragging');
            document.body.style.cursor = 'col-resize';
            e.preventDefault();
        });

        window.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            const delta = startX - e.clientX;
            const newW = Math.max(180, Math.min(window.innerWidth * 0.45, startW + delta));
            rightPane.style.width = `${newW}px`;
            timeline.updateTimelineWidth();
            engine.render();
        });

        window.addEventListener('mouseup', () => {
            if (!isDragging) return;
            isDragging = false;
            resizerRight.classList.remove('dragging');
            document.body.style.cursor = '';
            localStorage.setItem('novacut_layout_right', Math.round(rightPane.getBoundingClientRect().width));
            timeline.updateTimelineWidth();
            timeline.drawRuler();
            engine.render();
        });

        resizerRight.addEventListener('dblclick', () => {
            rightPane.style.width = '';
            localStorage.removeItem('novacut_layout_right');
            timeline.updateTimelineWidth();
            timeline.drawRuler();
            engine.render();
        });
    }

    // Timeline Vertical Resizer (vertical)
    if (resizerTimeline && timelinePanel) {
        let isDragging = false;
        let startY = 0;
        let startH = 0;

        resizerTimeline.addEventListener('mousedown', (e) => {
            isDragging = true;
            startY = e.clientY;
            startH = timelinePanel.getBoundingClientRect().height;
            resizerTimeline.classList.add('dragging');
            document.body.style.cursor = 'row-resize';
            e.preventDefault();
        });

        window.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            const delta = startY - e.clientY;
            const newH = Math.max(140, Math.min(window.innerHeight * 0.7, startH + delta));
            timelinePanel.style.height = `${newH}px`;
            engine.render();
        });

        window.addEventListener('mouseup', () => {
            if (!isDragging) return;
            isDragging = false;
            resizerTimeline.classList.remove('dragging');
            document.body.style.cursor = '';
            localStorage.setItem('novacut_layout_timeline', Math.round(timelinePanel.getBoundingClientRect().height));
            timeline.updateTimelineWidth();
            timeline.drawRuler();
            engine.render();
        });

        resizerTimeline.addEventListener('dblclick', () => {
            timelinePanel.style.height = '';
            localStorage.removeItem('novacut_layout_timeline');
            timeline.updateTimelineWidth();
            timeline.drawRuler();
            engine.render();
        });
    }
}

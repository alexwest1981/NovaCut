/**
 * NovaCut - Main Application Controller
 */
document.addEventListener('DOMContentLoaded', () => {
    // Global Toast Notification Helper
    window.novaCutToast = function(message) {
        let toast = document.getElementById('novaCutGlobalToast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'novaCutGlobalToast';
            toast.className = 'novacut-toast';
            document.body.appendChild(toast);
        }
        toast.textContent = message;
        toast.classList.add('visible');
        clearTimeout(toast._timer);
        toast._timer = setTimeout(() => {
            toast.classList.remove('visible');
        }, 2800);
    };
    window.showToast = window.novaCutToast;

    // 1. Initialize Subsystems
    const engine = new NovaCutEngine();
    window.engine = engine;

    const timeline = new NovaCutTimeline(engine);
    window.timeline = timeline;

    const inspector = new NovaCutInspector(engine, timeline);
    window.inspector = inspector;

    const transitions = new NovaCutTransitions(engine, timeline);
    window.transitions = transitions;

    const marketplace = new NovaCutMarketplace(timeline, engine);
    window.marketplace = marketplace;

    const exporter = new NovaCutExporter(engine, timeline);
    window.exporter = exporter;

    const publisher = new NovaCutPublisher(engine, timeline);
    window.publisher = publisher;

    const sfxManager = new NovaCutSFX(timeline, engine);
    window.sfxManager = sfxManager;

    const stickersManager = new NovaCutStickers(timeline, engine);
    window.stickersManager = stickersManager;

    const beatsManager = new NovaCutBeats(timeline, engine);
    window.beatsManager = beatsManager;

    const audioAnalyzer = new NovaCutAudioAnalyzer(engine, timeline);
    window.audioAnalyzer = audioAnalyzer;

    const motionleap = new NovaCutMotionleap(engine, timeline);
    window.motionleap = motionleap;
    window.motionleapEngine = motionleap;

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

    // Fullscreen Preview System
    const previewArea = document.querySelector('.preview-area');
    const previewCanvas = document.getElementById('previewCanvas');
    const btnFullscreenMonitor = document.getElementById('btnFullscreenMonitor');
    const btnFullscreenTransport = document.getElementById('btnFullscreenTransport');

    let isFullscreenPreview = false;
    let fullscreenIdleTimer = null;

    let exitBadge = previewArea?.querySelector('.fullscreen-exit-badge');
    if (!exitBadge && previewArea) {
        exitBadge = document.createElement('div');
        exitBadge.className = 'fullscreen-exit-badge';
        exitBadge.innerHTML = `<span>${ncIcon("close")}</span> Lämna helskärm (Esc)`;
        exitBadge.addEventListener('click', () => toggleFullscreenPreview(false));
        previewArea.appendChild(exitBadge);
    }

    const toggleFullscreenPreview = (forceState) => {
        if (!previewArea) return;
        isFullscreenPreview = typeof forceState === 'boolean' ? forceState : !isFullscreenPreview;

        if (isFullscreenPreview) {
            previewArea.classList.add('fullscreen-preview');
            if (btnFullscreenMonitor) btnFullscreenMonitor.classList.add('active');
            if (btnFullscreenTransport) btnFullscreenTransport.classList.add('active');

            if (!document.fullscreenElement && previewArea.requestFullscreen) {
                previewArea.requestFullscreen().catch(() => {});
            }
        } else {
            previewArea.classList.remove('fullscreen-preview');
            const controls = previewArea.querySelector('.preview-controls');
            if (controls) controls.classList.remove('idle-hidden');
            if (btnFullscreenMonitor) btnFullscreenMonitor.classList.remove('active');
            if (btnFullscreenTransport) btnFullscreenTransport.classList.remove('active');

            if (document.fullscreenElement && document.exitFullscreen) {
                document.exitFullscreen().catch(() => {});
            }
        }

        engine.render();
    };
    window.toggleFullscreenPreview = toggleFullscreenPreview;

    if (btnFullscreenMonitor) {
        btnFullscreenMonitor.addEventListener('click', () => toggleFullscreenPreview());
    }
    if (btnFullscreenTransport) {
        btnFullscreenTransport.addEventListener('click', () => toggleFullscreenPreview());
    }

    if (previewCanvas) {
        previewCanvas.addEventListener('dblclick', () => toggleFullscreenPreview());
    }

    if (previewArea) {
        previewArea.addEventListener('mousemove', () => {
            if (!isFullscreenPreview) return;
            const controls = previewArea.querySelector('.preview-controls');
            if (!controls) return;

            controls.classList.remove('idle-hidden');
            clearTimeout(fullscreenIdleTimer);

            if (engine.isPlaying) {
                fullscreenIdleTimer = setTimeout(() => {
                    if (isFullscreenPreview && engine.isPlaying) {
                        controls.classList.add('idle-hidden');
                    }
                }, 2500);
            }
        });
    }

    document.addEventListener('fullscreenchange', () => {
        if (!document.fullscreenElement && isFullscreenPreview) {
            toggleFullscreenPreview(false);
        }
    });

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

    const btnRemoveSilence = document.getElementById('btnRemoveSilence');
    if (btnRemoveSilence) {
        btnRemoveSilence.addEventListener('click', () => {
            timeline.removeSilencesFromClip();
        });
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

    const followBtn = document.getElementById('btnFollowPlayhead');
    if (followBtn) {
        followBtn.addEventListener('click', () => {
            timeline.followPlayhead = !timeline.followPlayhead;
            followBtn.classList.toggle('active', timeline.followPlayhead);
            if (timeline.followPlayhead) {
                timeline.ensurePlayheadVisible();
            }
            if (window.projectManager && typeof window.projectManager.showToast === 'function') {
                window.projectManager.showToast(timeline.followPlayhead ? '🎯 Tidslinjen följer nu spelhuvudet' : '⏸️ Följ spelhuvud inaktiverat');
            }
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

            // Re-render dynamically populated tabs when opened
            if (tabId === 'transitions' && window.transitions) {
                window.transitions.renderGrid(window.transitions.activeCategory || 'all');
            }
            if (tabId === 'marketplace' && window.marketplace) {
                window.marketplace.renderMarketplace();
            }
            if (tabId === 'effects' && window.marketplace) {
                window.marketplace.renderEffectsTab();
            }
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

    if (!window.projectMediaLibrary) {
        window.projectMediaLibrary = new Map();
    }

    function handleImportedFile(fileObj) {
        if (fileObj.path && fileObj.path.match(/\.(png|jpg|jpeg|webp|gif|svg|bmp)$/i)) {
            fileObj.type = 'image';
        } else if (fileObj.path && fileObj.path.match(/\.(mp3|wav|ogg|flac|m4a|aac)$/i)) {
            fileObj.type = 'audio';
        }

        const mediaId = fileObj.mediaId || `media-${Date.now()}-${Math.floor(Math.random()*1000)}`;
        let detectedDuration = fileObj.duration || (fileObj.type === 'image' ? 4.0 : 180.0);

        // Track in media library
        window.projectMediaLibrary.set(mediaId, {
            id: mediaId,
            mediaId: mediaId,
            name: fileObj.name,
            path: fileObj.path,
            type: fileObj.type,
            size: fileObj.size || 0,
            duration: detectedDuration
        });

        const mediaCard = document.createElement('div');
        mediaCard.className = 'media-card';

        let actionsHTML = '';
        if (fileObj.type === 'audio') {
            actionsHTML = `
                <div class="media-card-actions">
                    <button class="btn-card-action btn-place-all" title="Placera hela låtens längd på tidslinjen">${ncIcon('music')} Placera hela låten</button>
                    <button class="btn-card-action btn-fit-video" title="Anpassa låten efter videons längd">${ncIcon('scissors')} Till videoslut</button>
                </div>
            `;
        }

        mediaCard.innerHTML = `
            <div class="media-thumb">
                <span>${fileObj.type === 'video' ? ncIcon('film') : fileObj.type === 'audio' ? ncIcon('music') : ncIcon('film')}</span>
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
                    const item = window.projectMediaLibrary.get(mediaId);
                    if (item) item.duration = video.duration;
                    badge.textContent = formatDuration(video.duration);
                }
            });
            engine.mediaElements.set(mediaId, video);
            const cache = document.getElementById('mediaCache');
            if (cache) cache.appendChild(video);
        } else if (fileObj.type === 'image') {
            const img = new Image();
            img.src = fileObj.path;
            img.onload = () => {
                if (engine.render) engine.render();
            };
            engine.mediaElements.set(mediaId, img);
        } else if (fileObj.type === 'audio') {
            const audio = new Audio(fileObj.path);
            audio.preload = 'metadata';
            audio.addEventListener('loadedmetadata', () => {
                if (audio.duration && isFinite(audio.duration)) {
                    detectedDuration = audio.duration;
                    const item = window.projectMediaLibrary.get(mediaId);
                    if (item) item.duration = audio.duration;
                    badge.textContent = formatDuration(audio.duration);
                    const btnAll = mediaCard.querySelector('.btn-place-all');
                    if (btnAll) {
                        btnAll.textContent = `${ncIcon('music')} Hela låten (${formatDuration(audio.duration)})`;
                    }
                }
            });
            engine.mediaElements.set(mediaId, audio);
            const cache = document.getElementById('mediaCache');
            if (cache) cache.appendChild(audio);
        }

        const placeCoverAsBackground = (coverPath, title) => {
            if (!coverPath) return;
            const coverMediaId = `cover-${Date.now()}-${Math.floor(Math.random()*1000)}`;
            const dur = detectedDuration || 180;
            timeline.addClip({
                mediaId: coverMediaId,
                filePath: coverPath,
                title: `Bakgrund: ${title || fileObj.name}`,
                type: 'image',
                trackId: 'video',
                startTime: 0,
                duration: dur,
                scale: 1.0,
                opacity: 1.0
            });
            engine.render();
            if (window.novaCutToast) {
                window.novaCutToast(' Omslagsbild lades till som bakgrund på tidslinjen!');
            }
        };

        const placeAudio = (fitToVideo = false) => {
            const startTime = engine.currentTime;
            let duration = detectedDuration;
            if (fitToVideo) {
                const videoEnd = getVideoTracksEndTime();
                duration = Math.max(1.0, videoEnd - startTime);
            }
            timeline.addClip({
                mediaId: mediaId,
                filePath: fileObj.path,
                title: fileObj.name,
                type: 'audio',
                trackId: 'audio',
                startTime: startTime,
                duration: duration
            });

            // If video track is currently completely empty and this audio has an embedded cover:
            const videoClips = timeline.clips.filter(c => c.trackId === 'video');
            if (videoClips.length === 0 && fileObj.coverPath) {
                placeCoverAsBackground(fileObj.coverPath, fileObj.name);
            }
        };

        // Extract embedded album art cover from audio files (MP3, FLAC, M4A)
        if (fileObj.type === 'audio' && fileObj.path && window.novaCut?.extractAudioMetadata) {
            window.novaCut.extractAudioMetadata(fileObj.path).then(meta => {
                if (meta && meta.success && meta.hasCover && meta.coverPath) {
                    fileObj.coverPath = meta.coverPath;
                    fileObj.coverUrl = meta.coverUrl;
                    fileObj.lyrics = meta.lyrics;

                    // Update media thumbnail with actual album cover art!
                    const thumbEl = mediaCard.querySelector('.media-thumb');
                    if (thumbEl) {
                        thumbEl.innerHTML = `
                            <img src="${meta.coverUrl}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 4px;" alt="Omslag">
                            <span class="media-badge">LJUD</span>
                        `;
                    }

                    // Show "🖼️ Som bakgrund" action button in media card
                    const actionsEl = mediaCard.querySelector('.media-card-actions');
                    if (actionsEl && !actionsEl.querySelector('.btn-set-cover-bg')) {
                        const btnSetBg = document.createElement('button');
                        btnSetBg.className = 'btn-card-action btn-set-cover-bg';
                        btnSetBg.title = 'Placera låtens omslag som bakgrundsbild på tidslinjen';
                        btnSetBg.textContent = '🖼️ Som bakgrund';
                        btnSetBg.addEventListener('click', (e) => {
                            e.stopPropagation();
                            placeCoverAsBackground(meta.coverPath, meta.title);
                        });
                        actionsEl.appendChild(btnSetBg);
                    }

                    // Register cover image as separate asset in media library if not already present
                    const coverItemName = `Omslag: ${meta.title || fileObj.name}`;
                    const alreadyExists = Array.from(window.projectMediaLibrary.values()).some(it => it.path === meta.coverPath);
                    if (!alreadyExists) {
                        handleImportedFile({
                            path: meta.coverPath,
                            name: coverItemName,
                            type: 'image',
                            size: 0,
                            duration: detectedDuration || 180
                        });
                    }

                    // If a reactive-vinyl clip exists on timeline without custom cover, automatically use this cover!
                    timeline.clips.forEach(c => {
                        if (c.demoPattern === 'reactive-vinyl' && !c.vinylCoverUrl) {
                            c.vinylCoverUrl = meta.coverUrl;
                            engine.render();
                        }
                    });

                    if (window.novaCutToast) {
                        window.novaCutToast(` Hittade albumomslag för "${meta.title || fileObj.name}"!`);
                    }
                }
            }).catch(err => {
                console.warn('[NovaCut Audio Metadata] Extraction error:', err);
            });
        }

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
                    filePath: fileObj.path,
                    title: fileObj.name,
                    type: fileObj.type,
                    trackId: fileObj.type === 'overlay' ? 'overlay' : 'video',
                    startTime: engine.currentTime,
                    duration: detectedDuration || (fileObj.type === 'image' ? 4.0 : 6.0)
                });
            });
        }

        const grid = document.getElementById('mediaGrid');
        if (grid) grid.appendChild(mediaCard);
    }

    window.handleImportedFile = handleImportedFile;

    function handleWebFile(file) {
        const actualPath = file.path || (window.URL && URL.createObjectURL(file));
        let type = 'video';
        if (file.type.startsWith('audio/') || (file.name && file.name.match(/\.(mp3|wav|aac|ogg|flac|m4a)$/i))) type = 'audio';
        if (file.type.startsWith('image/') || (file.name && file.name.match(/\.(png|jpg|jpeg|gif|webp|bmp|svg)$/i))) type = 'image';

        handleImportedFile({
            path: actualPath,
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

    // Auto-Captions Controller (Sprint 8 & Whisper AI Upgrade)
    const btnOpenCaptions = document.getElementById('btnOpenAutoCaptions');
    const captionsModal = document.getElementById('autoCaptionsModal');
    const btnCloseCaptions = document.getElementById('btnCloseAutoCaptionsModal');
    const btnCancelCaptions = document.getElementById('btnCancelAutoCaptions');
    const sourceSelect = document.getElementById('captionSourceSelect');
    const customScriptBox = document.getElementById('customScriptBox');
    const whisperConfigBox = document.getElementById('whisperConfigBox');
    const whisperClipSelect = document.getElementById('whisperClipSelect');
    const whisperLangSelect = document.getElementById('whisperLangSelect');
    const btnGenerateCaptions = document.getElementById('btnGenerateAutoCaptions');

    if (btnOpenCaptions && captionsModal) {
        const populateWhisperClips = () => {
            if (!whisperClipSelect) return;
            whisperClipSelect.innerHTML = '';

            // Filter ONLY clips that actually contain audio tracks (never images, visualizers, or stickers)
            const audioEligibleClips = timeline.clips.filter(c => {
                if (c.trackId === 'text') return false;
                if (c.isSticker) return false;
                if (c.demoPattern || c.pattern) return false; // procedural visualizer
                if (c.type === 'image' || c.isAiVisual) return false;
                if (c.filePath && c.filePath.match(/\.(png|jpg|jpeg|webp|gif|svg|bmp)$/i)) return false;
                return (c.trackId === 'audio' || c.type === 'audio' || c.isSfx || c.trackId === 'video');
            });

            if (audioEligibleClips.length === 0) {
                const opt = document.createElement('option');
                opt.value = '';
                opt.textContent = '(Inga ljud- eller videoklipp på tidslinjen än - lägg till en låt)';
                whisperClipSelect.appendChild(opt);
                return;
            }

            // Prioritize audio clips (songs/vocals) first
            audioEligibleClips.sort((a, b) => {
                const aIsAudio = (a.trackId === 'audio' || a.type === 'audio') ? 0 : 1;
                const bIsAudio = (b.trackId === 'audio' || b.type === 'audio') ? 0 : 1;
                return aIsAudio - bIsAudio;
            });

            // Determine default selection: prefer selected clip if eligible, otherwise first audio clip
            let selectedClipId = null;
            const curSelected = timeline.clips.find(c => c.id === timeline.selectedClipId);
            if (curSelected && audioEligibleClips.some(c => c.id === curSelected.id)) {
                selectedClipId = curSelected.id;
            } else {
                const firstAudio = audioEligibleClips.find(c => c.trackId === 'audio' || c.type === 'audio');
                selectedClipId = firstAudio ? firstAudio.id : audioEligibleClips[0].id;
            }

            audioEligibleClips.forEach(c => {
                const opt = document.createElement('option');
                opt.value = c.id;
                opt.selected = (c.id === selectedClipId);
                const isAudio = (c.trackId === 'audio' || c.type === 'audio');
                const prefix = isAudio ? 'Låt/Ljud: ' : 'Video: ';
                opt.textContent = `${prefix}${c.title || 'Klipp'} (${c.duration.toFixed(1)}s)`;
                whisperClipSelect.appendChild(opt);
            });
        };

        btnOpenCaptions.addEventListener('click', () => {
            populateWhisperClips();
            captionsModal.classList.add('active');
        });

        const closeCaptionsModal = () => {
            captionsModal.classList.remove('active');
        };

        if (btnCloseCaptions) btnCloseCaptions.addEventListener('click', closeCaptionsModal);
        if (btnCancelCaptions) btnCancelCaptions.addEventListener('click', closeCaptionsModal);

        if (sourceSelect) {
            sourceSelect.addEventListener('change', () => {
                const val = sourceSelect.value;
                if (whisperConfigBox) whisperConfigBox.style.display = (val === 'whisper-auto') ? 'block' : 'none';
                if (customScriptBox) customScriptBox.style.display = (val === 'manual-script') ? 'block' : 'none';
                if (val === 'whisper-auto') populateWhisperClips();
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
            btnGenerateCaptions.addEventListener('click', async () => {
                const source = sourceSelect ? sourceSelect.value : 'whisper-auto';
                const activeCard = document.querySelector('.caption-style-card.active');
                const chosenStyle = activeCard ? activeCard.dataset.style : 'hormozi';
                const wordsPerClip = document.getElementById('captionWordsPerClip')?.value || 'short';
                const positionMode = document.getElementById('captionPositionSelect')?.value || 'lower-third';

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

                // Handle Whisper Auto Mode
                if (source === 'whisper-auto') {
                    const chosenClipId = whisperClipSelect?.value;
                    let targetClip = timeline.clips.find(c => c.id === chosenClipId);

                    // If chosen clip is invalid or an image/visualizer, fallback to real audio clip
                    if (!targetClip || targetClip.type === 'image' || targetClip.isAiVisual || targetClip.isSticker || targetClip.demoPattern || (targetClip.filePath && targetClip.filePath.match(/\.(png|jpg|jpeg|webp|gif|svg|bmp)$/i))) {
                        targetClip = timeline.clips.find(c => c.trackId === 'audio' || c.type === 'audio') ||
                                     timeline.clips.find(c => c.trackId === 'video' && c.type !== 'image' && !c.isAiVisual);
                    }

                    if (!targetClip) {
                        alert('Ingen ljud- eller videofil hittades på tidslinjen att lyssna av.\n\nImportera eller lägg till din låt (MP3/WAV) på tidslinjen först.');
                        return;
                    }

                    if (targetClip.type === 'image' || targetClip.isAiVisual || targetClip.isSticker || (targetClip.filePath && targetClip.filePath.match(/\.(png|jpg|jpeg|webp|gif|svg|bmp)$/i))) {
                        alert(`Det valda klippet ("${targetClip.title || 'Klipp'}") är en bild och saknar ljudspår.\n\nVälj din musikfil i rullistan ("Välj Klipp / Ljudkälla") för att generera undertexter.`);
                        return;
                    }

                    const mediaEl = engine.mediaElements.get(targetClip.mediaId);
                    const mediaSrc = targetClip.filePath || (mediaEl ? mediaEl.src : null);

                    if (!mediaSrc && !targetClip.isSfx) {
                        alert('Klippet har ingen kopplad mediefil på disk (t.ex. procedurgenererat testklipp).\n\nVälj ditt musik- eller videospår för att köra Whisper-taligenkänning.');
                        return;
                    }

                    const origBtnText = btnGenerateCaptions.innerHTML;
                    btnGenerateCaptions.disabled = true;
                    btnGenerateCaptions.innerHTML = `<span>${ncIcon('music')} Whisper lyssnar av tal i videon...</span>`;

                    try {
                        const lang = whisperLangSelect?.value || 'auto';
                        let res = null;

                        if (window.novaCut && typeof window.novaCut.transcribeAudio === 'function') {
                            res = await window.novaCut.transcribeAudio({
                                filePath: mediaSrc,
                                language: lang,
                                maxLen: (wordsPerClip === 'single') ? 14 : (wordsPerClip === 'short') ? 28 : 50
                            });
                        }

                        if (!res || !res.success || !res.segments || res.segments.length === 0) {
                            console.warn('Whisper result:', res);
                            alert(`Whisper kunde inte identifiera något tydligt tal i klippet (${res?.error || 'Inga röstsegment detekterades'}).`);
                            btnGenerateCaptions.disabled = false;
                            btnGenerateCaptions.innerHTML = origBtnText;
                            return;
                        }

                        // Remove existing text clips
                        const existingTextClips = timeline.clips.filter(c => c.trackId === 'text');
                        existingTextClips.forEach(c => timeline.removeClip(c.id));

                        let firstClipId = null;
                        res.segments.forEach((seg, idx) => {
                            const clip = {
                                trackId: 'text',
                                title: seg.text.slice(0, 16),
                                type: 'text',
                                text: seg.text,
                                startTime: targetClip.startTime + seg.startTime,
                                duration: seg.duration,
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
                        });

                        closeCaptionsModal();
                        engine.seek(targetClip.startTime);
                        if (firstClipId) timeline.selectClip(firstClipId);
                        engine.render();

                        if (window.projectManager && typeof window.projectManager.showToast === 'function') {
                            window.projectManager.showToast(` ${res.segments.length} undertexter skapades med Whisper AI (${res.language?.toUpperCase() || 'AUTO'})!`);
                        }
                    } catch (err) {
                        console.error('Whisper transcription error:', err);
                        alert(`Fel vid taligenkänning: ${err.message}`);
                    } finally {
                        btnGenerateCaptions.disabled = false;
                        btnGenerateCaptions.innerHTML = origBtnText;
                    }
                    return;
                }

                // Fallback / Script Mode
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
                            <span style="font-size: 18px;">${ncIcon('music')}</span>
                            <div>
                                <div style="font-weight: 600; font-size: 12px;">${preset.name}</div>
                                <div style="font-size: 10px; color: var(--text-muted);">${preset.artist}</div>
                            </div>
                        </div>
                        <span class="media-badge" style="background: var(--bg-surface);">${formatDuration(preset.duration)}</span>
                    </div>
                    <div style="display: flex; gap: 6px; margin-top: 2px;">
                        <button class="btn-card-action btn-place-all" style="flex: 1;">${ncIcon('music')} Placera hela låten (${formatDuration(preset.duration)})</button>
                        <button class="btn-card-action btn-fit-video">${ncIcon('scissors')} Till videoslut</button>
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
            if (isFullscreenPreview) {
                toggleFullscreenPreview(false);
                return;
            }
            document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('active'));
            if (!isInput) timeline.selectClip(null);
            return;
        }

        if (e.key === 'F11' || (e.shiftKey && e.key.toLowerCase() === 'f' && !isInput)) {
            e.preventDefault();
            toggleFullscreenPreview();
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
            const delta = e.shiftKey ? -10 : -1;
            engine.stepFrame(delta);
        } else if (e.key === 'ArrowRight') {
            e.preventDefault();
            const delta = e.shiftKey ? 10 : 1;
            engine.stepFrame(delta);
        } else if (e.key === 'Home') {
            e.preventDefault();
            engine.seek(0);
            if (timeline) timeline.ensurePlayheadVisible(0);
        } else if (e.key === 'End') {
            e.preventDefault();
            engine.seek(engine.duration);
            if (timeline) timeline.ensurePlayheadVisible(0.8);
        } else if (e.key.toLowerCase() === 'j' && !e.ctrlKey && !e.metaKey && !e.altKey) {
            // J: Rewind / Step back
            e.preventDefault();
            if (engine.isPlaying) {
                engine.playbackRate = Math.max(-4, engine.playbackRate - 1);
            } else {
                engine.stepFrame(-5);
            }
        } else if (e.key.toLowerCase() === 'k' && !e.ctrlKey && !e.metaKey && !e.altKey) {
            // K: Pause
            e.preventDefault();
            engine.pause();
        } else if (e.key.toLowerCase() === 'l' && !e.ctrlKey && !e.metaKey && !e.altKey) {
            // L: Play / Fast forward
            e.preventDefault();
            if (!engine.isPlaying) {
                engine.play();
            } else {
                engine.playbackRate = Math.min(4, engine.playbackRate + 1);
            }
        } else if (e.key.toLowerCase() === 'n') {
            e.preventDefault();
            snapBtn.click();
        } else if (e.key.toLowerCase() === 'f') {
            e.preventDefault();
            const followBtn = document.getElementById('btnFollowPlayhead');
            if (followBtn) followBtn.click();
        }
    });

    // 9. Initialize Project Hub & Welcome Screen
    const projectManager = new NovaCutProjects(engine, timeline);
    window.projectManager = projectManager;

    // 10. Initialize Format Templates & Viral Wizard
    const templatesManager = new NovaCutTemplates(engine, timeline, projectManager);
    window.templatesManager = templatesManager;

    // 11. Initialize AI Visuals & Audio-Reactive Music Video Engine
    const visualsManager = new NovaCutVisuals(timeline, engine);
    window.visualsManager = visualsManager;

    // 12. Setup Interactive Responsive Panel Resizers
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

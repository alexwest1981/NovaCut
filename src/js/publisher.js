/**
 * NovaCut - Social Media Publishing Hub (TikTok, YouTube, Facebook)
 * Hybrid 1-Click Studio Bridge & Direct YouTube Resumable API Uploader
 */
class NovaCutPublisher {
    constructor(engine, timeline) {
        this.engine = engine;
        this.timeline = timeline;
        this.currentPlatform = 'tiktok';
        this.exportedFilePath = null;
        this.youtubeConnected = false;
        this.youtubeChannelTitle = '';
        this.youtubeChannelThumb = null;
        this.isUploading = false;

        this.platformTags = {
            tiktok: ['#fyp', '#foryou', '#viral', '#trending', '#creators', '#novacut', '#foryoupage', '#videoedit'],
            youtube: ['#Shorts', '#YouTubeShorts', '#viral', '#trending', '#video', '#contentcreator', '#novacut'],
            facebook: ['#Reels', '#FacebookReels', '#viral', '#trending', '#video', '#facebookcreator', '#novacut']
        };

        this.initElements();
        this.initEvents();
        this.checkYoutubeAuth();
    }

    initElements() {
        this.modal = document.getElementById('publishModal');
        this.btnOpenModal = document.getElementById('btnOpenPublishModal');
        this.btnCloseModal = document.getElementById('btnClosePublishModal');
        
        // File selection elements
        this.filePathDisplay = document.getElementById('publishFilePath');
        this.btnPickFile = document.getElementById('btnPickPublishFile');
        this.btnRevealFile = document.getElementById('btnRevealPublishFile');
        
        // Form elements
        this.inputTitle = document.getElementById('publishTitle');
        this.inputDescription = document.getElementById('publishDescription');
        this.hashtagsContainer = document.getElementById('publishHashtagsContainer');
        this.customTagInput = document.getElementById('publishCustomTagInput');
        this.btnAddCustomTag = document.getElementById('btnAddPublishCustomTag');
        
        // Platform tabs
        this.platformTabs = document.querySelectorAll('.publish-tab-btn');
        this.studioBridgeAction = document.getElementById('publishStudioBridgeAction');
        this.youtubeDirectSection = document.getElementById('publishYoutubeDirectSection');
        
        // YouTube API elements
        this.ytAuthStatusCard = document.getElementById('ytAuthStatusCard');
        this.ytChannelAvatar = document.getElementById('ytChannelAvatar');
        this.ytChannelName = document.getElementById('ytChannelName');
        this.btnYtConnect = document.getElementById('btnYtConnect');
        this.btnYtDisconnect = document.getElementById('btnYtDisconnect');
        this.btnYtConfig = document.getElementById('btnYtConfig');
        this.ytPrivacySelect = document.getElementById('ytPrivacySelect');
        this.ytCategorySelect = document.getElementById('ytCategorySelect');
        this.btnDirectYtUpload = document.getElementById('btnDirectYtUpload');
        
        // Progress & Success
        this.uploadProgressContainer = document.getElementById('ytUploadProgressContainer');
        this.uploadProgressBar = document.getElementById('ytUploadProgressBar');
        this.uploadProgressText = document.getElementById('ytUploadProgressText');
        this.uploadPercentText = document.getElementById('ytUploadPercentText');
        this.uploadSuccessBox = document.getElementById('ytUploadSuccessBox');
        this.uploadSuccessLink = document.getElementById('ytUploadSuccessLink');
        this.btnCopyYtLink = document.getElementById('btnCopyYtLink');
        
        // 1-Click Studio Bridge Launch Button
        this.btnLaunchStudioBridge = document.getElementById('btnLaunchStudioBridge');
        this.studioBridgeTitle = document.getElementById('studioBridgeTitle');
        this.studioBridgeDesc = document.getElementById('studioBridgeDesc');
    }

    initEvents() {
        if (this.btnOpenModal) {
            this.btnOpenModal.addEventListener('click', () => this.open());
        }

        if (this.btnCloseModal) {
            this.btnCloseModal.addEventListener('click', () => this.close());
        }

        if (this.modal) {
            this.modal.addEventListener('click', (e) => {
                if (e.target === this.modal) this.close();
            });
        }

        // Platform tab switching
        this.platformTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const platform = tab.getAttribute('data-platform');
                this.setPlatform(platform);
            });
        });

        // File pick & reveal
        if (this.btnPickFile) {
            this.btnPickFile.addEventListener('click', () => this.chooseVideoFile());
        }

        if (this.btnRevealFile) {
            this.btnRevealFile.addEventListener('click', () => {
                if (this.exportedFilePath && window.novaCut) {
                    window.novaCut.publishShowInFolder(this.exportedFilePath);
                } else {
                    this.notify('Välj eller exportera en videofil först.');
                }
            });
        }

        // Hashtag adding
        if (this.btnAddCustomTag && this.customTagInput) {
            const addTag = () => {
                let tag = this.customTagInput.value.trim();
                if (!tag) return;
                if (!tag.startsWith('#')) tag = `#${tag}`;
                this.addHashtagToDescription(tag);
                this.customTagInput.value = '';
            };
            this.btnAddCustomTag.addEventListener('click', addTag);
            this.customTagInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    addTag();
                }
            });
        }

        // 1-Click Creator Studio Bridge
        if (this.btnLaunchStudioBridge) {
            this.btnLaunchStudioBridge.addEventListener('click', () => this.launchStudioBridge());
        }

        // YouTube OAuth & Upload Events
        if (this.btnYtConnect) {
            this.btnYtConnect.addEventListener('click', () => this.connectYoutube());
        }

        if (this.btnYtDisconnect) {
            this.btnYtDisconnect.addEventListener('click', () => this.disconnectYoutube());
        }

        if (this.btnYtConfig) {
            this.btnYtConfig.addEventListener('click', () => this.promptYoutubeConfig());
        }

        if (this.btnDirectYtUpload) {
            this.btnDirectYtUpload.addEventListener('click', () => this.uploadDirectToYoutube());
        }

        if (this.btnCopyYtLink) {
            this.btnCopyYtLink.addEventListener('click', () => {
                const url = this.uploadSuccessLink?.href || this.uploadSuccessLink?.textContent;
                if (url) {
                    navigator.clipboard.writeText(url);
                    this.notify('📋 YouTube-länk kopierad till urklipp!');
                }
            });
        }

        // Listen for upload progress from IPC
        if (window.novaCut && typeof window.novaCut.onYoutubeUploadProgress === 'function') {
            window.novaCut.onYoutubeUploadProgress((data) => {
                this.handleUploadProgress(data);
            });
        }
    }

    setExportedFile(filePath) {
        if (!filePath) return;
        this.exportedFilePath = filePath;
        
        if (this.filePathDisplay) {
            const fileName = filePath.split(/[\\/]/).pop();
            this.filePathDisplay.textContent = fileName;
            this.filePathDisplay.title = filePath;
        }

        // Auto-populate title if empty or default
        const projectTitle = document.getElementById('projectTitle')?.value?.trim();
        if (this.inputTitle && (!this.inputTitle.value || this.inputTitle.value === 'Mitt Projekt' || this.inputTitle.value === 'NovaCut Video')) {
            this.inputTitle.value = projectTitle && projectTitle !== 'Mitt Projekt' ? projectTitle : 'NovaCut Video';
        }

        this.updatePlatformUI();
    }

    open(defaultPlatform = null) {
        if (!this.modal) return;
        
        if (defaultPlatform) {
            this.currentPlatform = defaultPlatform;
        }

        // Synchronize title with current active project if empty
        const projectTitle = document.getElementById('projectTitle')?.value?.trim();
        if (this.inputTitle && !this.inputTitle.value) {
            this.inputTitle.value = projectTitle || 'NovaCut Video';
        }

        this.updatePlatformUI();
        this.checkYoutubeAuth();
        this.modal.classList.add('active');
    }

    close() {
        if (this.modal) {
            this.modal.classList.remove('active');
        }
    }

    setPlatform(platform) {
        this.currentPlatform = platform;
        this.platformTabs.forEach(tab => {
            tab.classList.toggle('active', tab.getAttribute('data-platform') === platform);
        });
        this.updatePlatformUI();
    }

    updatePlatformUI() {
        const platform = this.currentPlatform;

        // Render Hashtag suggestions for this platform
        this.renderHashtags();

        // Detect if aspect ratio is 9:16 vertical
        const aspectRatio = this.engine?.aspectRatio || '16:9';
        const isVertical = aspectRatio === '9:16';

        if (platform === 'tiktok') {
            if (this.studioBridgeTitle) this.studioBridgeTitle.textContent = '🚀 TikTok Creator Studio (1-Klick)';
            if (this.studioBridgeDesc) {
                this.studioBridgeDesc.textContent = 'Kopierar din bildtext & taggar till urklipp, öppnar filens mapp på datorn och öppnar TikTok Upload i webbläsaren.';
            }
            if (this.youtubeDirectSection) this.youtubeDirectSection.style.display = 'none';
            if (this.studioBridgeAction) this.studioBridgeAction.style.display = 'block';
        } else if (platform === 'youtube') {
            const isShorts = isVertical || (this.engine?.duration && this.engine.duration <= 180);
            const label = isShorts ? 'YouTube Shorts' : 'YouTube Video (Widescreen)';
            
            if (this.studioBridgeTitle) this.studioBridgeTitle.textContent = `🔴 ${label} Studio (1-Klick)`;
            if (this.studioBridgeDesc) {
                this.studioBridgeDesc.textContent = 'Kopierar titel, beskrivning & taggar, markerar filen och öppnar YouTube Studio Upload i webbläsaren.';
            }
            if (this.youtubeDirectSection) this.youtubeDirectSection.style.display = 'block';
            if (this.studioBridgeAction) this.studioBridgeAction.style.display = 'block';
        } else if (platform === 'facebook') {
            if (this.studioBridgeTitle) this.studioBridgeTitle.textContent = '🔵 Facebook Reels & Video Studio (1-Klick)';
            if (this.studioBridgeDesc) {
                this.studioBridgeDesc.textContent = 'Kopierar bildtext & taggar, markerar filen på datorn och öppnar Facebook Reels Studio i webbläsaren.';
            }
            if (this.youtubeDirectSection) this.youtubeDirectSection.style.display = 'none';
            if (this.studioBridgeAction) this.studioBridgeAction.style.display = 'block';
        }
    }

    renderHashtags() {
        if (!this.hashtagsContainer) return;
        this.hashtagsContainer.innerHTML = '';

        const tags = this.platformTags[this.currentPlatform] || this.platformTags.tiktok;
        
        // Add project title keywords if relevant
        const projectTitle = document.getElementById('projectTitle')?.value?.trim();
        if (projectTitle && projectTitle !== 'Mitt Projekt' && projectTitle.length > 2) {
            const safeWord = `#${projectTitle.replace(/[\s\W]+/g, '')}`;
            if (!tags.includes(safeWord)) {
                tags.unshift(safeWord);
            }
        }

        tags.forEach(tag => {
            const chip = document.createElement('div');
            chip.className = 'publish-tag-chip';
            chip.textContent = tag;
            chip.title = 'Klicka för att lägga till i beskrivningen';
            chip.addEventListener('click', () => {
                this.addHashtagToDescription(tag);
            });
            this.hashtagsContainer.appendChild(chip);
        });
    }

    addHashtagToDescription(tag) {
        if (!this.inputDescription) return;
        const currentText = this.inputDescription.value.trim();
        if (currentText.includes(tag)) {
            this.notify(`Taggen ${tag} finns redan i texten.`);
            return;
        }
        this.inputDescription.value = currentText ? `${currentText} ${tag}` : tag;
        this.notify(`Lade till ${tag}`);
    }

    async chooseVideoFile() {
        if (!window.novaCut || typeof window.novaCut.openMedia !== 'function') return;
        const result = await window.novaCut.openMedia();
        if (result && result.filePaths && result.filePaths.length > 0) {
            const chosen = result.filePaths[0];
            this.setExportedFile(chosen);
            this.notify('🎬 Videofil vald för publicering!');
        }
    }

    async launchStudioBridge() {
        if (!this.exportedFilePath) {
            this.notify('⚠️ Välj eller exportera en video först!');
            return;
        }

        const title = this.inputTitle?.value?.trim() || 'NovaCut Video';
        let desc = this.inputDescription?.value?.trim() || '';

        // Prepend #Shorts to YouTube Shorts if not present
        if (this.currentPlatform === 'youtube') {
            const isVertical = this.engine?.aspectRatio === '9:16';
            if (isVertical && !desc.includes('#Shorts') && !title.includes('#Shorts')) {
                desc = `${desc}\n\n#Shorts #YouTubeShorts`.trim();
            }
        }

        const fullClipboardText = `${title}\n\n${desc}`.trim();

        // 1. Copy formatted text to system clipboard
        try {
            await navigator.clipboard.writeText(fullClipboardText);
        } catch (err) {
            console.warn('Clipboard write failed:', err);
        }

        // 2. Reveal file highlighted in Linux file manager
        if (window.novaCut && typeof window.novaCut.publishShowInFolder === 'function') {
            await window.novaCut.publishShowInFolder(this.exportedFilePath);
        }

        // 3. Open platform Creator Studio URL in default web browser
        if (window.novaCut && typeof window.novaCut.publishOpenStudio === 'function') {
            await window.novaCut.publishOpenStudio(this.currentPlatform);
        }

        const platformName = this.currentPlatform.toUpperCase();
        this.notify(`📋 Text & taggar kopierade! Mappen är öppnad – dra filen direkt till ${platformName} i webbläsaren! 🚀`);
    }

    // =========================================================================
    // YouTube Direct API Integration
    // =========================================================================

    async checkYoutubeAuth() {
        if (!window.novaCut || typeof window.novaCut.publishYoutubeAuthStatus !== 'function') return;
        
        try {
            const status = await window.novaCut.publishYoutubeAuthStatus();
            this.youtubeConnected = !!status.connected;

            if (this.ytAuthStatusCard) {
                if (this.youtubeConnected) {
                    this.ytAuthStatusCard.classList.add('connected');
                    if (this.ytChannelName) this.ytChannelName.textContent = status.channelTitle || 'Ansluten YouTube-kanal';
                    if (this.ytChannelAvatar && status.channelThumb) {
                        this.ytChannelAvatar.src = status.channelThumb;
                        this.ytChannelAvatar.style.display = 'block';
                    }
                    if (this.btnYtConnect) this.btnYtConnect.style.display = 'none';
                    if (this.btnYtDisconnect) this.btnYtDisconnect.style.display = 'inline-flex';
                    if (this.btnDirectYtUpload) this.btnDirectYtUpload.disabled = false;
                } else {
                    this.ytAuthStatusCard.classList.remove('connected');
                    if (this.ytChannelName) this.ytChannelName.textContent = 'Inget YouTube-konto anslutet';
                    if (this.ytChannelAvatar) this.ytChannelAvatar.style.display = 'none';
                    if (this.btnYtConnect) this.btnYtConnect.style.display = 'inline-flex';
                    if (this.btnYtDisconnect) this.btnYtDisconnect.style.display = 'none';
                    if (this.btnDirectYtUpload) this.btnDirectYtUpload.disabled = true;
                }
            }
        } catch (err) {
            console.warn('Error checking YouTube auth:', err);
        }
    }

    async promptYoutubeConfig() {
        if (!window.novaCut) return;
        const currentCfg = await window.novaCut.publishYoutubeGetConfig();
        const clientId = prompt('Ange Google Cloud OAuth 2.0 Client ID:\n(Skapa ett kostnadsfritt OAuth-ID på console.cloud.google.com med Redirect URI: http://127.0.0.1:58421/oauth2callback)', currentCfg.clientId || '');
        if (clientId === null) return;
        const clientSecret = prompt('Ange Google Cloud OAuth 2.0 Client Secret:', currentCfg.clientSecret || '');
        if (clientSecret === null) return;

        await window.novaCut.publishYoutubeSaveConfig({
            clientId: clientId.trim(),
            clientSecret: clientSecret.trim()
        });
        this.notify('✅ YouTube API-konfiguration sparad!');
        this.checkYoutubeAuth();
    }

    async connectYoutube() {
        if (!window.novaCut) return;
        this.notify('🌐 Öppnar Google Login i webbläsaren...');
        
        try {
            const res = await window.novaCut.publishYoutubeLogin();
            if (res.requiresConfig) {
                const proceed = confirm('Du behöver ange ditt Google Cloud OAuth Client ID & Secret för direkt uppladdning.\n\nVill du konfigurera det nu?');
                if (proceed) {
                    await this.promptYoutubeConfig();
                    // Retry login
                    await this.connectYoutube();
                }
                return;
            }

            if (res.success) {
                this.notify(`🎉 Ansluten till YouTube som "${res.channelTitle}"!`);
                await this.checkYoutubeAuth();
            } else {
                alert(`Inloggning misslyckades: ${res.error}`);
            }
        } catch (err) {
            alert(`Fel vid inloggning: ${err.message}`);
        }
    }

    async disconnectYoutube() {
        if (!window.novaCut) return;
        const ok = confirm('Är du säker på att du vill koppla bort ditt YouTube-konto från NovaCut?');
        if (!ok) return;

        await window.novaCut.publishYoutubeLogout();
        this.notify('YouTube-kontot kopplades bort.');
        await this.checkYoutubeAuth();
    }

    async uploadDirectToYoutube() {
        if (!this.exportedFilePath) {
            this.notify('⚠️ Välj eller exportera en videofil först.');
            return;
        }

        if (!this.youtubeConnected) {
            this.notify('⚠️ Anslut ett YouTube-konto först.');
            return;
        }

        if (this.isUploading) return;

        const title = this.inputTitle?.value?.trim() || 'NovaCut Video';
        let desc = this.inputDescription?.value?.trim() || '';
        
        // Auto-add #Shorts tag if vertical
        if (this.engine?.aspectRatio === '9:16' && !desc.includes('#Shorts')) {
            desc = `${desc}\n\n#Shorts #YouTubeShorts`.trim();
        }

        const tags = (desc.match(/#[a-zA-Z0-9_]+/g) || []).map(t => t.replace('#', ''));
        if (!tags.includes('NovaCut')) tags.push('NovaCut');

        const privacyStatus = this.ytPrivacySelect?.value || 'public';
        const categoryId = this.ytCategorySelect?.value || '22';

        this.isUploading = true;
        if (this.btnDirectYtUpload) this.btnDirectYtUpload.disabled = true;
        if (this.uploadProgressContainer) this.uploadProgressContainer.style.display = 'block';
        if (this.uploadSuccessBox) this.uploadSuccessBox.style.display = 'none';

        try {
            const res = await window.novaCut.publishYoutubeUpload({
                filePath: this.exportedFilePath,
                metadata: {
                    title,
                    description: desc,
                    tags,
                    privacyStatus,
                    categoryId
                }
            });

            if (res.success) {
                if (this.uploadSuccessBox) {
                    this.uploadSuccessBox.style.display = 'block';
                    if (this.uploadSuccessLink) {
                        this.uploadSuccessLink.href = res.videoUrl;
                        this.uploadSuccessLink.textContent = res.videoUrl;
                    }
                }
                this.notify('🎉 Videon har publicerats till YouTube!');
            } else {
                alert(`Uppladdningsfel: ${res.error}`);
            }
        } catch (err) {
            alert(`Kunde inte ladda upp video: ${err.message}`);
        } finally {
            this.isUploading = false;
            if (this.btnDirectYtUpload) this.btnDirectYtUpload.disabled = false;
        }
    }

    handleUploadProgress(data) {
        if (!this.uploadProgressContainer) return;
        const pct = data.percent || 0;
        if (this.uploadProgressBar) this.uploadProgressBar.style.width = `${pct}%`;
        if (this.uploadPercentText) this.uploadPercentText.textContent = `${pct}%`;
        if (this.uploadProgressText) this.uploadProgressText.textContent = data.message || `Laddar upp (${pct}%)...`;
    }

    notify(message) {
        if (window.novaCutToast) {
            window.novaCutToast(message);
        } else {
            console.log('[NovaCut Publisher]', message);
        }
    }
}

window.NovaCutPublisher = NovaCutPublisher;

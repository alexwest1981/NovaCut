/**
 * NovaCut - Project Templates & Viral Format Wizard (Sprint 17)
 * 1-click format templates and customizable wizard for TikTok, Reels, Gaming, Podcasts & Cinematic 4K.
 */
class NovaCutTemplates {
    constructor(engine, timeline, projectManager) {
        this.engine = engine;
        this.timeline = timeline;
        this.projectManager = projectManager;

        this.selectedTemplateId = 'tiktok-viral-hook';
        this.activeCategory = 'all';

        this.templates = [
            {
                id: 'tiktok-viral-hook',
                name: '⚡ TikTok Viral Hook',
                category: 'tiktok',
                ratio: '9:16',
                duration: 6.0,
                badge: '9:16 TikTok / Reels',
                tagline: 'Super-hook med animerad Hormozi-text, Vine Boom sub-bas & taktdelning',
                description: 'Optimerad för maximal retention på TikTok, YouTube Shorts och Instagram Reels. Inkluderar stor gul rubrik med Pop-animation, snabb inzoomning, Vine Boom SFX och 128 BPM taktmarkörer.',
                icon: 'zap',
                previewGradient: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 50%, #8b5cf6 100%)',
                defaultHeadline: 'SLUTA SCROLLA! 🛑',
                defaultSubtitle: '3 misstag du gör varje dag',
                defaultHandle: '@creator',
                defaultColorStyle: 'cyberpunk',
                hasSfx: true,
                hasBeats: true,
                sfxId: 'vine-boom',
                demoPattern: 'viral'
            },
            {
                id: 'gaming-reaction',
                name: '🎮 Gaming Reaction & Facecam',
                category: 'gaming',
                ratio: '16:9',
                duration: 10.0,
                badge: '16:9 / 9:16 Gaming',
                tagline: 'Gameplay (V1) + Facecam (V2) med cirkelmask, accentram & LIVE-badge',
                description: 'Komplett dubbelspårslayout för Twitch- och YouTube-gamers. Facecam-overlay med cirkulär/rund mask, lysande cyan/grön ram, mjuk skugga och LIVE-streamer-märke.',
                icon: 'gamepad',
                previewGradient: 'linear-gradient(135deg, #00d482 0%, #0284c7 50%, #1e1b4b 100%)',
                defaultHeadline: 'IMPOSSIBLE CLUTCH! 🔥',
                defaultSubtitle: 'Kolla vad som händer vid slutet...',
                defaultHandle: '🔴 LIVE • @ProGamer',
                defaultColorStyle: 'neon',
                hasSfx: true,
                hasBeats: true,
                sfxId: 'click',
                demoPattern: 'gameplay'
            },
            {
                id: 'podcast-highlight',
                name: '🎙️ Podcast Highlight',
                category: 'podcast',
                ratio: '9:16',
                duration: 8.0,
                badge: '9:16 / 1:1 Talk',
                tagline: 'Ljudspektrum, avsnittsbanner & ord-för-ord karaoke-undertexter',
                description: 'Perfekt för virala intervjuer och samtal. Innehåller animerade ljudvågor, avsnittstitel överst, tvådelad karaoke-undertextstil med gul highlight och studiovärme.',
                icon: 'mic',
                previewGradient: 'linear-gradient(135deg, #d97706 0%, #b45309 60%, #78350f 100%)',
                defaultHeadline: 'PODCAST #42 • INSIKTEN',
                defaultSubtitle: 'Konsistens slår alltid ren talang.',
                defaultHandle: '@podcast_official',
                defaultColorStyle: 'warm',
                hasSfx: true,
                hasBeats: false,
                sfxId: 'ding',
                demoPattern: 'podcast'
            },
            {
                id: 'cinematic-youtube-4k',
                name: '🎬 Cinematic YouTube 4K',
                category: 'youtube',
                ratio: '16:9',
                duration: 8.0,
                badge: '16:9 YouTube 4K',
                tagline: 'Letterbox, Teal & Orange color grade, 35mm filmkorn & episk sub-bas',
                description: 'Filmisk widescreen-estetik för vloggar och filmproduktioner. Inkluderar 35mm filmkorn, Teal & Orange färgtoning, stilren serif-titel med mjuk inzoomning och Cinematic Sub Impact.',
                icon: 'film',
                previewGradient: 'linear-gradient(135deg, #0891b2 0%, #0f172a 60%, #ea580c 100%)',
                defaultHeadline: 'THE JOURNEY BEGINS',
                defaultSubtitle: 'En resa genom det okända',
                defaultHandle: '4K ULTRA HD',
                defaultColorStyle: 'teal-orange',
                hasSfx: true,
                hasBeats: false,
                sfxId: 'impact',
                demoPattern: 'cinematic'
            },
            {
                id: 'tiktok-split-duet',
                name: '📱 TikTok Dual Split (50/50)',
                category: 'tiktok',
                ratio: '9:16',
                duration: 7.0,
                badge: '9:16 Duett / Split',
                tagline: '50/50 delad skärm för reaktioner, duetter, debatter och jämförelser',
                description: 'Övre och undre halva synkade för reaktionsvideos och TikTok-duetter. Inkluderar uppmärksamhetspil, tydlig avdelningslinje och CTA-fråga för maximalt engagemang i kommentarsfältet.',
                icon: 'device',
                previewGradient: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 50%, #3b82f6 100%)',
                defaultHeadline: 'VEM HAR RÄTT? 👇',
                defaultSubtitle: 'Kommentera din åsikt nedan!',
                defaultHandle: '@duet_central',
                defaultColorStyle: 'natural',
                hasSfx: true,
                hasBeats: true,
                sfxId: 'whoosh-fast',
                demoPattern: 'viral'
            }
        ];

        this.init();
    }

    init() {
        this.setupUI();
        this.renderWelcomeTemplates();
    }

    setupUI() {
        // Top Header Templates button
        const btnHeader = document.getElementById('btnOpenTemplatesHeader');
        if (btnHeader) {
            btnHeader.addEventListener('click', () => this.openWizard(this.selectedTemplateId));
        }

        // Welcome screen button
        const btnWelcomeTpl = document.getElementById('btnWelcomeTemplates');
        if (btnWelcomeTpl) {
            btnWelcomeTpl.addEventListener('click', () => {
                this.openWizard(this.selectedTemplateId);
            });
        }

        // Wizard Modal Close buttons
        const btnCloseWizard = document.getElementById('btnCloseWizardModal');
        if (btnCloseWizard) {
            btnCloseWizard.addEventListener('click', () => this.closeWizard());
        }
        const btnCancelWizard = document.getElementById('btnCancelWizard');
        if (btnCancelWizard) {
            btnCancelWizard.addEventListener('click', () => this.closeWizard());
        }

        // Wizard Apply button
        const btnApply = document.getElementById('btnApplyWizardTemplate');
        if (btnApply) {
            btnApply.addEventListener('click', () => this.handleWizardSubmit());
        }

        // Setup ratio chips in wizard
        document.querySelectorAll('.wizard-ratio-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                document.querySelectorAll('.wizard-ratio-chip').forEach(c => c.classList.remove('active'));
                chip.classList.add('active');
            });
        });

        // Setup filter chips in welcome hub
        document.querySelectorAll('.welcome-template-filter-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                document.querySelectorAll('.welcome-template-filter-chip').forEach(c => c.classList.remove('active'));
                chip.classList.add('active');
                this.activeCategory = chip.dataset.category || 'all';
                this.renderWelcomeTemplates();
            });
        });
    }

    renderWelcomeTemplates() {
        const container = document.getElementById('welcomeTemplatesGrid');
        if (!container) return;

        container.innerHTML = '';

        const filtered = this.templates.filter(t => {
            return this.activeCategory === 'all' || t.category === this.activeCategory;
        });

        filtered.forEach(tpl => {
            const card = document.createElement('div');
            card.className = 'template-welcome-card';
            card.dataset.id = tpl.id;

            card.innerHTML = `
                <div class="template-thumb" style="background: ${tpl.previewGradient};">
                    <span class="template-thumb-icon">${ncIcon(tpl.icon)}</span>
                    <span class="template-thumb-ratio">${tpl.badge}</span>
                </div>
                <div class="template-info">
                    <div class="template-card-header">
                        <span class="template-name">${tpl.name}</span>
                    </div>
                    <div class="template-tagline">${tpl.tagline}</div>
                    <div class="template-meta-pills">
                        <span>${ncIcon('clock')} ${tpl.duration.toFixed(0)}s</span>
                        ${tpl.hasSfx ? '<span>' + ncIcon('volume') + ' SFX</span>' : ''}
                        ${tpl.hasBeats ? '<span>' + ncIcon('music') + ' Beats</span>' : ''}
                    </div>
                    <div class="template-card-btns">
                        <button class="btn-template-instant" data-id="${tpl.id}" title="Skapa direkt med standardvärden">
                            ${ncIcon('zap')} Blixtstart
                        </button>
                        <button class="btn-template-customize" data-id="${tpl.id}" title="Öppna Wizard och anpassa text/layout">
                            ${ncIcon('palette')} Anpassa
                        </button>
                    </div>
                </div>
            `;

            // Instant 1-click start
            card.querySelector('.btn-template-instant').addEventListener('click', (e) => {
                e.stopPropagation();
                this.applyTemplate(tpl.id);
            });

            // Customize in wizard
            card.querySelector('.btn-template-customize').addEventListener('click', (e) => {
                e.stopPropagation();
                this.openWizard(tpl.id);
            });

            // Card click also opens wizard
            card.addEventListener('click', () => {
                this.openWizard(tpl.id);
            });

            container.appendChild(card);
        });
    }

    openWizard(templateId = 'tiktok-viral-hook') {
        const tpl = this.templates.find(t => t.id === templateId) || this.templates[0];
        this.selectedTemplateId = tpl.id;

        const modal = document.getElementById('formatWizardModal');
        if (!modal) return;

        // Render template selection list in wizard left pane
        this.renderWizardTemplateList();

        // Populate fields with template defaults
        const nameInput = document.getElementById('wizardProjectName');
        if (nameInput) nameInput.value = `${tpl.name.replace(/[^\w\s\u00C0-\u017F-]/g, '').trim()}`;

        const headlineInput = document.getElementById('wizardHeadline');
        if (headlineInput) headlineInput.value = tpl.defaultHeadline;

        const subInput = document.getElementById('wizardSubtitle');
        if (subInput) subInput.value = tpl.defaultSubtitle;

        const handleInput = document.getElementById('wizardHandle');
        if (handleInput) handleInput.value = tpl.defaultHandle;

        const sfxCheck = document.getElementById('wizardIncludeSfx');
        if (sfxCheck) sfxCheck.checked = tpl.hasSfx;

        const beatsCheck = document.getElementById('wizardIncludeBeats');
        if (beatsCheck) beatsCheck.checked = tpl.hasBeats;

        const colorSelect = document.getElementById('wizardColorStyle');
        if (colorSelect) colorSelect.value = tpl.defaultColorStyle;

        // Set ratio chip
        document.querySelectorAll('.wizard-ratio-chip').forEach(chip => {
            chip.classList.toggle('active', chip.dataset.ratio === tpl.ratio);
        });

        // Update preview hero
        this.updateWizardPreview(tpl);

        modal.classList.add('active');
    }

    closeWizard() {
        const modal = document.getElementById('formatWizardModal');
        if (modal) modal.classList.remove('active');
    }

    renderWizardTemplateList() {
        const listEl = document.getElementById('wizardTemplateList');
        if (!listEl) return;
        listEl.innerHTML = '';

        this.templates.forEach(tpl => {
            const item = document.createElement('div');
            item.className = `wizard-list-item ${tpl.id === this.selectedTemplateId ? 'active' : ''}`;
            item.dataset.id = tpl.id;
            item.innerHTML = `
                <div class="wizard-item-icon" style="background: ${tpl.previewGradient};">${ncIcon(tpl.icon)}</div>
                <div class="wizard-item-details">
                    <div class="wizard-item-name">${tpl.name}</div>
                    <div class="wizard-item-ratio">${tpl.badge}</div>
                </div>
            `;

            item.addEventListener('click', () => {
                this.selectedTemplateId = tpl.id;
                this.openWizard(tpl.id);
            });

            listEl.appendChild(item);
        });
    }

    updateWizardPreview(tpl) {
        const banner = document.getElementById('wizardPreviewBanner');
        if (banner) {
            banner.style.background = tpl.previewGradient;
        }

        const titleEl = document.getElementById('wizardPreviewTitle');
        if (titleEl) titleEl.textContent = tpl.name;

        const descEl = document.getElementById('wizardPreviewDesc');
        if (descEl) descEl.textContent = tpl.description;
    }

    handleWizardSubmit() {
        const tpl = this.templates.find(t => t.id === this.selectedTemplateId) || this.templates[0];

        const nameInput = document.getElementById('wizardProjectName');
        const headlineInput = document.getElementById('wizardHeadline');
        const subInput = document.getElementById('wizardSubtitle');
        const handleInput = document.getElementById('wizardHandle');
        const sfxCheck = document.getElementById('wizardIncludeSfx');
        const beatsCheck = document.getElementById('wizardIncludeBeats');
        const colorSelect = document.getElementById('wizardColorStyle');
        const activeChip = document.querySelector('.wizard-ratio-chip.active');

        const customOptions = {
            projectTitle: nameInput ? nameInput.value.trim() : tpl.name,
            headline: headlineInput ? headlineInput.value.trim() : tpl.defaultHeadline,
            subtitle: subInput ? subInput.value.trim() : tpl.defaultSubtitle,
            handle: handleInput ? handleInput.value.trim() : tpl.defaultHandle,
            ratio: activeChip ? activeChip.dataset.ratio : tpl.ratio,
            includeSfx: sfxCheck ? sfxCheck.checked : tpl.hasSfx,
            includeBeats: beatsCheck ? beatsCheck.checked : tpl.hasBeats,
            colorStyle: colorSelect ? colorSelect.value : tpl.defaultColorStyle
        };

        this.closeWizard();
        this.applyTemplate(tpl.id, customOptions);
    }

    async applyTemplate(templateId, customOptions = {}) {
        const tpl = this.templates.find(t => t.id === templateId) || this.templates[0];

        const ratio = customOptions.ratio || tpl.ratio;
        const projectTitle = customOptions.projectTitle || tpl.name;
        const headline = customOptions.headline || tpl.defaultHeadline;
        const subtitle = customOptions.subtitle || tpl.defaultSubtitle;
        const handle = customOptions.handle || tpl.defaultHandle;
        const includeSfx = customOptions.includeSfx !== undefined ? customOptions.includeSfx : tpl.hasSfx;
        const includeBeats = customOptions.includeBeats !== undefined ? customOptions.includeBeats : tpl.hasBeats;
        const colorStyle = customOptions.colorStyle || tpl.defaultColorStyle;

        // 1. Set project title
        const titleEl = document.getElementById('projectTitle');
        if (titleEl) titleEl.value = projectTitle;

        // 2. Set engine aspect ratio
        this.engine.setAspectRatio(ratio);
        const aspectSelect = document.getElementById('aspectRatioSelect');
        if (aspectSelect) aspectSelect.value = ratio;

        // 3. Clear existing timeline clips
        this.timeline.deselectAll();
        document.querySelectorAll('.timeline-clip').forEach(el => el.remove());
        this.timeline.clips = [];

        // 4. Generate clips based on template type
        const newClips = [];

        if (tpl.id === 'tiktok-viral-hook') {
            // Main video background (fast energy)
            newClips.push({
                trackId: 'video',
                title: 'Viral Hook Bakgrund',
                type: 'video',
                startTime: 0,
                duration: 6.0,
                scale: 1.05,
                demoPattern: 'viral',
                colorFilterPreset: colorStyle
            });

            // Effect: Cyber / Glitch intro flash
            newClips.push({
                trackId: 'effect',
                title: 'RGB Glitch Hook',
                type: 'effect',
                startTime: 0,
                duration: 0.6,
                overlayType: 'rgb_split',
                params: { shift: 8 }
            });

            // Text 1: Viral yellow Hormozi headline with pop animation
            newClips.push({
                trackId: 'text',
                title: 'Hook Rubrik (Hormozi)',
                type: 'text',
                text: headline,
                startTime: 0,
                duration: 2.5,
                fontSize: ratio === '9:16' ? 76 : 84,
                fontFamily: 'Impact, sans-serif',
                color: '#ffe600',
                outlineColor: '#000000',
                outlineWidth: 8,
                bold: true,
                align: 'center',
                posY: -140,
                textAnim: 'pop',
                textAnimDuration: 0.6,
                hasShadow: true
            });

            // Text 2: Subtitle with slide-up animation
            newClips.push({
                trackId: 'text',
                title: 'Underrubrik (Slide Up)',
                type: 'text',
                text: subtitle,
                startTime: 2.2,
                duration: 3.8,
                fontSize: ratio === '9:16' ? 52 : 58,
                fontFamily: 'Inter, sans-serif',
                color: '#ffffff',
                outlineColor: '#000000',
                outlineWidth: 5,
                bold: true,
                align: 'center',
                posY: -80,
                textAnim: 'slide_up',
                textAnimDuration: 0.8
            });

            // Overlay: REC indicator sticker at top
            newClips.push({
                trackId: 'overlay',
                title: 'REC Indikator',
                type: 'video',
                isSticker: true,
                stickerId: 'rec',
                startTime: 0,
                duration: 6.0,
                posX: ratio === '9:16' ? -180 : -320,
                posY: ratio === '9:16' ? -380 : -220,
                scale: 0.85
            });

            // Overlay 2: Attention Arrow sticker at 2.4s
            newClips.push({
                trackId: 'overlay',
                title: '🎯 Uppmärksamhetspil',
                type: 'video',
                isSticker: true,
                stickerId: 'arrow',
                startTime: 2.4,
                duration: 3.6,
                posX: 120,
                posY: 40,
                scale: 0.9
            });

        } else if (tpl.id === 'gaming-reaction') {
            // Main video: Gameplay footage
            newClips.push({
                trackId: 'video',
                title: 'Gameplay Bakgrund (V1)',
                type: 'video',
                startTime: 0,
                duration: 10.0,
                scale: 1.0,
                demoPattern: 'gameplay',
                colorFilterPreset: colorStyle
            });

            // Overlay: Facecam reaction (V2) with circular mask, neon cyan/green border & shadow
            const isPortrait = (ratio === '9:16');
            newClips.push({
                trackId: 'overlay',
                title: 'Facecam Streamer (V2)',
                type: 'video',
                startTime: 0,
                duration: 10.0,
                demoPattern: 'facecam',
                scale: isPortrait ? 0.72 : 0.36,
                posX: isPortrait ? 0 : 340,
                posY: isPortrait ? -280 : 180,
                borderWidth: 4,
                borderColor: '#00d482',
                pipShadow: true,
                mask: {
                    type: isPortrait ? 'rectangle' : 'circle',
                    size: 420,
                    width: 700,
                    height: 520,
                    roundness: 24
                }
            });

            // Text 1: Live gamer tag badge
            newClips.push({
                trackId: 'text',
                title: 'Streamer Live Badge',
                type: 'text',
                text: handle,
                startTime: 0,
                duration: 10.0,
                fontSize: 36,
                fontFamily: 'Inter, sans-serif',
                color: '#ffffff',
                bgColor: 'rgba(0, 0, 0, 0.75)',
                bgPadX: 18,
                bgPadY: 8,
                bgRoundness: 8,
                bold: true,
                align: 'center',
                posY: isPortrait ? -80 : 250,
                posX: isPortrait ? 0 : 340
            });

            // Text 2: Clutch hook title
            newClips.push({
                trackId: 'text',
                title: 'Clutch Rubrik',
                type: 'text',
                text: headline,
                startTime: 0.5,
                duration: 4.5,
                fontSize: 64,
                fontFamily: 'Impact, sans-serif',
                color: '#ff3366',
                outlineColor: '#000000',
                outlineWidth: 6,
                bold: true,
                align: 'center',
                posY: isPortrait ? 120 : -200,
                textAnim: 'pop',
                textAnimDuration: 0.5
            });

            // Sticker: YouTube Subscribe & Bell at 5.0s
            newClips.push({
                trackId: 'overlay',
                title: 'Subscribe & Bell',
                type: 'video',
                isSticker: true,
                stickerId: 'subscribe',
                startTime: 5.0,
                duration: 4.8,
                posX: 0,
                posY: isPortrait ? 320 : 180,
                scale: 0.95
            });

        } else if (tpl.id === 'podcast-highlight') {
            // Main video: Studio waveform visualizer
            newClips.push({
                trackId: 'video',
                title: 'Podcast Studio Ljudspektrum',
                type: 'video',
                startTime: 0,
                duration: 8.0,
                scale: 1.0,
                demoPattern: 'podcast',
                colorFilterPreset: colorStyle
            });

            // Top Banner Episode Header
            newClips.push({
                trackId: 'text',
                title: 'Avsnittsbanner',
                type: 'text',
                text: headline,
                startTime: 0,
                duration: 8.0,
                fontSize: ratio === '9:16' ? 38 : 44,
                fontFamily: 'Inter, sans-serif',
                color: '#ffffff',
                bgColor: 'rgba(217, 119, 6, 0.88)',
                bgPadX: 20,
                bgPadY: 10,
                bgRoundness: 12,
                bold: true,
                align: 'center',
                posY: ratio === '9:16' ? -360 : -210
            });

            // Subtitle 1 (Karaoke style)
            newClips.push({
                trackId: 'text',
                title: 'Undertext Block 1 (Karaoke)',
                type: 'text',
                text: 'Det är den här enkla insikten som förändrar allt.',
                startTime: 0.5,
                duration: 3.5,
                fontSize: ratio === '9:16' ? 48 : 54,
                fontFamily: 'Inter, sans-serif',
                color: '#00d482',
                outlineColor: '#000000',
                outlineWidth: 5,
                bold: true,
                align: 'center',
                posY: ratio === '9:16' ? 140 : 110,
                captionStyle: 'karaoke',
                textAnim: 'slide_up'
            });

            // Subtitle 2
            newClips.push({
                trackId: 'text',
                title: 'Undertext Block 2 (Karaoke)',
                type: 'text',
                text: subtitle,
                startTime: 4.0,
                duration: 4.0,
                fontSize: ratio === '9:16' ? 52 : 58,
                fontFamily: 'Inter, sans-serif',
                color: '#ffe600',
                outlineColor: '#000000',
                outlineWidth: 6,
                bold: true,
                align: 'center',
                posY: ratio === '9:16' ? 140 : 110,
                captionStyle: 'karaoke',
                textAnim: 'pop'
            });

            // Subtle film grain effect
            newClips.push({
                trackId: 'effect',
                title: '35mm Studiekorn',
                type: 'effect',
                startTime: 0,
                duration: 8.0,
                overlayType: 'film_grain'
            });

        } else if (tpl.id === 'cinematic-youtube-4k') {
            // Main video: Cinematic landscape
            newClips.push({
                trackId: 'video',
                title: 'Cinematic Widescreen Footage',
                type: 'video',
                startTime: 0,
                duration: 8.0,
                scale: 1.02,
                demoPattern: 'cinematic',
                colorFilterPreset: 'teal-orange',
                transitionIn: { type: 'dissolve', duration: 0.8 },
                transitionOut: { type: 'dip_black', duration: 1.0 }
            });

            // 35mm Film Grain effect
            newClips.push({
                trackId: 'effect',
                title: '35mm Film Grain Look',
                type: 'effect',
                startTime: 0,
                duration: 8.0,
                overlayType: 'film_grain'
            });

            // Cinematic Serif Title
            newClips.push({
                trackId: 'text',
                title: 'Cinematic Huvudtitel',
                type: 'text',
                text: headline,
                startTime: 0.8,
                duration: 6.0,
                fontSize: 68,
                fontFamily: 'Cinzel, Georgia, serif',
                color: '#f8fafc',
                outlineColor: 'rgba(0, 0, 0, 0.8)',
                outlineWidth: 3,
                bold: true,
                align: 'center',
                posY: -20,
                textAnim: 'typewriter',
                textAnimDuration: 1.5,
                hasShadow: true
            });

            // Cinematic Subtitle
            newClips.push({
                trackId: 'text',
                title: 'Cinematic Underrubrik',
                type: 'text',
                text: subtitle,
                startTime: 2.2,
                duration: 4.8,
                fontSize: 32,
                fontFamily: 'Inter, sans-serif',
                color: '#cbd5e1',
                bold: false,
                align: 'center',
                posY: 50,
                textAnim: 'slide_up',
                textAnimDuration: 1.0
            });

        } else if (tpl.id === 'tiktok-split-duet') {
            // Lower Video: Context / Original (posY: 270)
            newClips.push({
                trackId: 'video',
                title: 'Huvudvideo Undre Halva (V1)',
                type: 'video',
                startTime: 0,
                duration: 7.0,
                posY: 270,
                scale: 1.0,
                demoPattern: 'viral'
            });

            // Upper Video: Reaction / Duet (posY: -270)
            newClips.push({
                trackId: 'overlay',
                title: 'Reaktion Övre Halva (V2)',
                type: 'video',
                startTime: 0,
                duration: 7.0,
                posY: -270,
                scale: 1.0,
                borderWidth: 2,
                borderColor: '#ffffff',
                demoPattern: 'facecam'
            });

            // Text: Call to Action question
            newClips.push({
                trackId: 'text',
                title: 'Fråga & CTA',
                type: 'text',
                text: headline,
                startTime: 0,
                duration: 7.0,
                fontSize: 62,
                fontFamily: 'Impact, sans-serif',
                color: '#ffe600',
                outlineColor: '#000000',
                outlineWidth: 6,
                bold: true,
                align: 'center',
                posY: 0,
                textAnim: 'pop'
            });

            // Sticker: Attention Arrow
            newClips.push({
                trackId: 'overlay',
                title: '🎯 Pil Sticker',
                type: 'video',
                isSticker: true,
                stickerId: 'arrow',
                startTime: 0.5,
                duration: 6.5,
                posX: 0,
                posY: 80,
                scale: 0.95
            });
        }

        // Add all clips to timeline
        newClips.forEach(c => {
            this.timeline.addClip(c);
        });

        // 5. Add Sound Effects (SFX) if enabled
        if (includeSfx && window.sfxManager) {
            try {
                if (tpl.id === 'tiktok-viral-hook') {
                    await this.addTemplateSfx('vine-boom', 0.0);
                    await this.addTemplateSfx('whoosh-fast', 2.2);
                } else if (tpl.id === 'gaming-reaction') {
                    await this.addTemplateSfx('glitch', 0.5);
                    await this.addTemplateSfx('click', 5.0);
                } else if (tpl.id === 'podcast-highlight') {
                    await this.addTemplateSfx('ding', 4.0);
                } else if (tpl.id === 'cinematic-youtube-4k') {
                    await this.addTemplateSfx('impact', 0.0);
                    await this.addTemplateSfx('whoosh', 5.5);
                } else if (tpl.id === 'tiktok-split-duet') {
                    await this.addTemplateSfx('whoosh-fast', 0.0);
                    await this.addTemplateSfx('pop', 0.5);
                }
            } catch (err) {
                console.warn('[Templates] SFX generation error:', err);
            }
        }

        // 6. Add Beat Markers if enabled
        if (includeBeats && window.beatsManager) {
            const beats = window.beatsManager.generateMusicalGrid(0, tpl.duration, 128);
            this.timeline.beatMarkers = beats;
            this.timeline.drawRuler();
        } else {
            this.timeline.beatMarkers = [];
            this.timeline.drawRuler();
        }

        // 7. Update timeline duration and render
        this.timeline.recalculateProjectDuration();
        this.timeline.renderAllClips();
        this.engine.seek(0);
        this.engine.render();

        // 8. Hide welcome hub if active
        if (this.projectManager) {
            this.projectManager.hideWelcome();
            this.projectManager.saveCurrentProject(false);
            this.projectManager.loadProjectList().then(() => {
                this.projectManager.renderProjects();
            });
            if (typeof this.projectManager.showToast === 'function') {
                this.projectManager.showToast(` Mallen "${tpl.name}" applicerad! Redo att klippa.`);
            }
        }
    }

    async addTemplateSfx(sfxId, startTime = 0) {
        if (!window.sfxManager) return;
        const sfx = window.sfxManager.sfxList.find(s => s.id === sfxId);
        if (!sfx) return;

        let cached = window.sfxManager.cache.get(sfxId);
        if (!cached) {
            const blob = await window.sfxManager.generateWav(sfx.id, sfx.duration);
            const url = URL.createObjectURL(blob);
            cached = { blob, url };
            window.sfxManager.cache.set(sfxId, cached);
        }

        const mediaId = `sfx-${sfxId}-${Date.now()}-${Math.floor(Math.random()*1000)}`;
        const audioEl = new Audio(cached.url);
        audioEl.preload = 'auto';

        if (this.engine && this.engine.mediaElements) {
            this.engine.mediaElements.set(mediaId, audioEl);
        }

        this.timeline.addClip({
            trackId: 'audio',
            mediaId: mediaId,
            title: sfx.name,
            type: 'audio',
            startTime: startTime,
            duration: sfx.duration,
            isSfx: true
        });
    }
}

window.NovaCutTemplates = NovaCutTemplates;

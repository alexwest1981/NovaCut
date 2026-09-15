/**
 * NovaCut - Viral Stickers & Meme Overlays System
 */
class NovaCutStickers {
    constructor(timeline, engine) {
        this.timeline = timeline;
        this.engine = engine;
        this.activeCategory = 'all';

        this.stickerList = [
            {
                id: 'rec_badge',
                name: '🔴 REC Indikator',
                category: 'ui',
                categoryLabel: 'UI / Kamera',
                width: 240,
                height: 60,
                description: 'Klassisk röd blinkande kameraindikator med tidskod.'
            },
            {
                id: 'subscribe_bell',
                name: '🔔 Subscribe & Bell',
                category: 'social',
                categoryLabel: 'Socialt / YouTube',
                width: 320,
                height: 70,
                description: 'Röd prenumerera-knapp med pulserande gyllene klocka.'
            },
            {
                id: 'red_arrow',
                name: '🎯 Uppmärksamhetspil',
                category: 'arrows',
                categoryLabel: 'Pilar / Pekare',
                width: 180,
                height: 180,
                description: 'Fet röd böjd pil som pekar ut viktiga detaljer i videon.'
            },
            {
                id: 'wow_comic',
                name: '💥 WOW! Comic Burst',
                category: 'memes',
                categoryLabel: 'Memes / Comic',
                width: 260,
                height: 180,
                description: 'Serietidnings-explosion i gult och rött med pop-effekt.'
            },
            {
                id: 'censored_bar',
                name: '⬛ CENSORED Balk',
                category: 'memes',
                categoryLabel: 'Memes / Humor',
                width: 320,
                height: 64,
                description: 'Svart censurbalk med fet vit text för komisk effekt.'
            },
            {
                id: 'thug_shades',
                name: '🕶️ Thug Life Solglasögon',
                category: 'memes',
                categoryLabel: 'Memes / Humor',
                width: 280,
                height: 70,
                description: 'Klassiska 8-bitars pixlade svarta solglasögon.'
            },
            {
                id: 'fire_emoji',
                name: '🔥 Lit Fire Flame',
                category: 'reactions',
                categoryLabel: 'Reaktioner',
                width: 180,
                height: 200,
                description: 'Brinnande levande eldflamma med glödande kant.'
            },
            {
                id: 'warning_sign',
                name: '⚠️ Varningstriangel',
                category: 'arrows',
                categoryLabel: 'Varning / Info',
                width: 180,
                height: 160,
                description: 'Gul varningsskylt med svart utropstecken.'
            },
            {
                id: 'crown_gold',
                name: '👑 Gyllene Krona',
                category: 'reactions',
                categoryLabel: 'Reaktioner / VIP',
                width: 220,
                height: 160,
                description: 'Gnistrande kungakrona med ädelstenar.'
            },
            {
                id: 'live_badge',
                name: '🔴 LIVE Sändning',
                category: 'ui',
                categoryLabel: 'UI / Status',
                width: 190,
                height: 52,
                description: 'Röd LIVE-banner med pulserande sändningsvågor.'
            }
        ];

        this.setupUI();
    }

    renderSticker(ctx, stickerId, w, h, localTime = 0) {
        ctx.save();

        switch (stickerId) {
            case 'rec_badge': {
                // Background pill
                ctx.fillStyle = 'rgba(12, 14, 20, 0.82)';
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.roundRect(-w / 2, -h / 2, w, h, h / 2);
                ctx.fill();
                ctx.stroke();

                // Blinking red recording dot
                const isBlinkOn = Math.floor(localTime * 2.5) % 2 === 0;
                ctx.fillStyle = isBlinkOn ? '#ff0033' : 'rgba(255, 0, 51, 0.25)';
                if (isBlinkOn) {
                    ctx.shadowColor = '#ff0033';
                    ctx.shadowBlur = 12;
                }
                ctx.beginPath();
                ctx.arc(-w / 2 + 28, 0, 10, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 0;

                // REC text
                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 22px sans-serif';
                ctx.textAlign = 'left';
                ctx.textBaseline = 'middle';
                ctx.fillText('REC', -w / 2 + 48, 0);

                // Live timer string
                const totalSec = Math.floor(localTime);
                const mm = String(Math.floor(totalSec / 60)).padStart(2, '0');
                const ss = String(totalSec % 60).padStart(2, '0');
                ctx.font = '16px "JetBrains Mono", monospace';
                ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
                ctx.fillText(`${mm}:${ss}`, -w / 2 + 115, 0);
                break;
            }

            case 'subscribe_bell': {
                // Main Red Pill
                ctx.fillStyle = '#e60023';
                ctx.beginPath();
                ctx.roundRect(-w / 2, -h / 2, w, h, 12);
                ctx.fill();

                // Text
                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 22px sans-serif';
                ctx.textAlign = 'left';
                ctx.textBaseline = 'middle';
                ctx.fillText('SUBSCRIBE', -w / 2 + 24, 0);

                // Animated Bell
                ctx.save();
                const bellX = w / 2 - 38;
                const bellAngle = Math.sin(localTime * 8) * 0.25;
                ctx.translate(bellX, 0);
                ctx.rotate(bellAngle);
                ctx.font = '28px sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('🔔', 0, 0);
                ctx.restore();
                break;
            }

            case 'red_arrow': {
                // Curved red arrow
                ctx.fillStyle = '#ff1744';
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 5;
                ctx.lineJoin = 'round';
                ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
                ctx.shadowBlur = 10;
                ctx.shadowOffsetY = 4;

                ctx.beginPath();
                ctx.moveTo(-w * 0.35, -h * 0.35);
                ctx.quadraticCurveTo(w * 0.05, -h * 0.4, w * 0.15, -h * 0.05);
                ctx.lineTo(w * 0.35, -h * 0.12);
                ctx.lineTo(w * 0.18, h * 0.35);
                ctx.lineTo(-w * 0.12, h * 0.18);
                ctx.lineTo(0, h * 0.08);
                ctx.quadraticCurveTo(-w * 0.05, -h * 0.18, -w * 0.35, -h * 0.2);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
                break;
            }

            case 'wow_comic': {
                // Comic burst background
                ctx.save();
                const points = 16;
                const outerR = w * 0.45;
                const innerR = w * 0.28;

                ctx.beginPath();
                for (let i = 0; i < points * 2; i++) {
                    const r = (i % 2 === 0) ? outerR : innerR;
                    const angle = (i / (points * 2)) * Math.PI * 2;
                    const px = Math.cos(angle) * r;
                    const py = Math.sin(angle) * (r * 0.75);
                    if (i === 0) ctx.moveTo(px, py);
                    else ctx.lineTo(px, py);
                }
                ctx.closePath();

                ctx.fillStyle = '#ffd600';
                ctx.strokeStyle = '#ff0033';
                ctx.lineWidth = 6;
                ctx.fill();
                ctx.stroke();

                // "WOW!" text
                ctx.font = '900 48px Impact, sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 8;
                ctx.strokeText('WOW!', 0, 0);
                ctx.fillStyle = '#d50000';
                ctx.fillText('WOW!', 0, 0);
                ctx.restore();
                break;
            }

            case 'censored_bar': {
                // Solid black bar with hazard / stencil style
                ctx.fillStyle = '#000000';
                ctx.beginPath();
                ctx.roundRect(-w / 2, -h / 2, w, h, 6);
                ctx.fill();

                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 26px "JetBrains Mono", monospace';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.letterSpacing = '4px';
                ctx.fillText('CENSORED', 0, 0);
                break;
            }

            case 'thug_shades': {
                // Pixelated 8-bit black sunglasses
                ctx.fillStyle = '#000000';
                const pw = w * 0.38;
                const ph = h * 0.6;
                const bridgeW = w * 0.1;

                // Left lens
                ctx.fillRect(-w / 2 + 10, -ph / 2, pw, ph);
                // Right lens
                ctx.fillRect(w / 2 - 10 - pw, -ph / 2, pw, ph);
                // Bridge
                ctx.fillRect(-bridgeW / 2, -ph / 4, bridgeW, 10);

                // Pixel glares (white)
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(-w / 2 + 25, -ph / 2 + 8, 12, 12);
                ctx.fillRect(-w / 2 + 42, -ph / 2 + 22, 12, 12);

                ctx.fillRect(w / 2 - pw + 5, -ph / 2 + 8, 12, 12);
                ctx.fillRect(w / 2 - pw + 22, -ph / 2 + 22, 12, 12);
                break;
            }

            case 'fire_emoji': {
                // Multi-layered flame
                ctx.save();
                // Outer red flame
                ctx.fillStyle = '#ff1744';
                ctx.beginPath();
                ctx.moveTo(0, -h * 0.45);
                ctx.bezierCurveTo(w * 0.35, -h * 0.1, w * 0.45, h * 0.2, 0, h * 0.45);
                ctx.bezierCurveTo(-w * 0.45, h * 0.2, -w * 0.35, -h * 0.1, 0, -h * 0.45);
                ctx.fill();

                // Middle orange flame
                ctx.fillStyle = '#ff9100';
                ctx.beginPath();
                ctx.moveTo(0, -h * 0.2);
                ctx.bezierCurveTo(w * 0.25, 0, w * 0.3, h * 0.25, 0, h * 0.4);
                ctx.bezierCurveTo(-w * 0.3, h * 0.25, -w * 0.25, 0, 0, -h * 0.2);
                ctx.fill();

                // Inner yellow core
                ctx.fillStyle = '#ffea00';
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.bezierCurveTo(w * 0.15, h * 0.1, w * 0.18, h * 0.3, 0, h * 0.35);
                ctx.bezierCurveTo(-w * 0.18, h * 0.3, -w * 0.15, h * 0.1, 0, 0);
                ctx.fill();
                ctx.restore();
                break;
            }

            case 'warning_sign': {
                // Yellow Triangle
                ctx.fillStyle = '#ffcc00';
                ctx.strokeStyle = '#000000';
                ctx.lineWidth = 8;
                ctx.lineJoin = 'round';

                ctx.beginPath();
                ctx.moveTo(0, -h * 0.45);
                ctx.lineTo(w * 0.45, h * 0.4);
                ctx.lineTo(-w * 0.45, h * 0.4);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();

                // Exclamation mark
                ctx.fillStyle = '#000000';
                ctx.beginPath();
                ctx.roundRect(-5, -h * 0.15, 10, h * 0.28, 4);
                ctx.fill();

                ctx.beginPath();
                ctx.arc(0, h * 0.24, 6, 0, Math.PI * 2);
                ctx.fill();
                break;
            }

            case 'crown_gold': {
                // Golden crown
                ctx.fillStyle = '#ffd700';
                ctx.strokeStyle = '#b8860b';
                ctx.lineWidth = 4;
                ctx.lineJoin = 'round';

                ctx.beginPath();
                ctx.moveTo(-w * 0.4, h * 0.35);
                ctx.lineTo(-w * 0.45, -h * 0.2);
                ctx.lineTo(-w * 0.18, h * 0.05);
                ctx.lineTo(0, -h * 0.35);
                ctx.lineTo(w * 0.18, h * 0.05);
                ctx.lineTo(w * 0.45, -h * 0.2);
                ctx.lineTo(w * 0.4, h * 0.35);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();

                // Crown base band
                ctx.fillStyle = '#ff4081';
                ctx.beginPath();
                ctx.roundRect(-w * 0.4, h * 0.22, w * 0.8, h * 0.12, 4);
                ctx.fill();

                // Jewels on peaks
                [-w * 0.45, 0, w * 0.45].forEach((px, i) => {
                    const py = (i === 1) ? -h * 0.35 : -h * 0.2;
                    ctx.fillStyle = (i === 1) ? '#00e5ff' : '#ff1744';
                    ctx.beginPath();
                    ctx.arc(px, py, 7, 0, Math.PI * 2);
                    ctx.fill();
                });
                break;
            }

            case 'live_badge': {
                // Glowing LIVE pill
                const waveRadius = 14 + (localTime * 18) % 20;
                const waveAlpha = Math.max(0, 1 - (waveRadius - 14) / 20);

                ctx.strokeStyle = `rgba(255, 23, 68, ${waveAlpha})`;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(-w / 2 + 25, 0, waveRadius, 0, Math.PI * 2);
                ctx.stroke();

                ctx.fillStyle = '#ff1744';
                ctx.beginPath();
                ctx.roundRect(-w / 2, -h / 2, w, h, 8);
                ctx.fill();

                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(-w / 2 + 25, 0, 7, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 22px sans-serif';
                ctx.textAlign = 'left';
                ctx.textBaseline = 'middle';
                ctx.fillText('LIVE', -w / 2 + 48, 0);
                break;
            }

            default: {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
                ctx.fillRect(-w / 2, -h / 2, w, h);
            }
        }

        ctx.restore();
    }

    createThumbnailDataUrl(stickerId) {
        const s = this.stickerList.find(st => st.id === stickerId);
        if (!s) return null;
        const c = document.createElement('canvas');
        c.width = 120;
        c.height = 80;
        const ctx = c.getContext('2d');
        ctx.translate(60, 40);
        const scale = Math.min(100 / s.width, 64 / s.height);
        ctx.scale(scale, scale);
        this.renderSticker(ctx, s.id, s.width, s.height, 1.2);
        return c.toDataURL();
    }

    addStickerToTimeline(stickerId) {
        const sticker = this.stickerList.find(s => s.id === stickerId);
        if (!sticker) return;

        const clip = this.timeline.addClip({
            trackId: 'overlay',
            title: sticker.name,
            type: 'sticker',
            isSticker: true,
            stickerId: sticker.id,
            stickerWidth: sticker.width,
            stickerHeight: sticker.height,
            startTime: this.engine.currentTime,
            duration: 3.0,
            scale: 1.0,
            posX: 0,
            posY: 0
        });

        if (window.inspector) {
            window.inspector.update(clip);
        }
        this.engine.render();
    }

    setupUI() {
        const grid = document.getElementById('stickersGrid');
        if (!grid) return;

        grid.innerHTML = '';

        const filtered = this.stickerList.filter(s => {
            return this.activeCategory === 'all' || s.category === this.activeCategory;
        });

        filtered.forEach(s => {
            const card = document.createElement('div');
            card.className = 'sticker-card';
            const thumbUrl = this.createThumbnailDataUrl(s.id);

            card.innerHTML = `
                <div class="sticker-thumb-box">
                    <img src="${thumbUrl}" alt="${s.name}" class="sticker-thumb-img">
                </div>
                <div class="sticker-meta">
                    <div class="sticker-name">${s.name}</div>
                    <div class="sticker-cat">${s.categoryLabel}</div>
                </div>
                <button class="btn-primary btn-sm btn-add-sticker" data-id="${s.id}" title="Lägg till sticker på tidslinjen">
                    + Använd
                </button>
            `;

            card.querySelector('.btn-add-sticker').addEventListener('click', (e) => {
                e.stopPropagation();
                this.addStickerToTimeline(s.id);
            });

            card.addEventListener('click', () => {
                this.addStickerToTimeline(s.id);
            });

            grid.appendChild(card);
        });

        // Setup category chips
        document.querySelectorAll('.sticker-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                document.querySelectorAll('.sticker-chip').forEach(c => c.classList.remove('active'));
                chip.classList.add('active');
                this.activeCategory = chip.dataset.cat;
                this.setupUI();
            });
        });
    }
}

window.NovaCutStickers = NovaCutStickers;

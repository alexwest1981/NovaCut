/**
 * NovaCut - Creator SFX Pack & Audio Synthesizer (Sprint 1)
 */
class NovaCutSFX {
    constructor(timeline, engine) {
        this.timeline = timeline;
        this.engine = engine;
        this.audioCtx = null;

        this.sfxList = [
            {
                id: 'whoosh',
                name: '💨 Whoosh Swift',
                category: 'transition',
                categoryLabel: 'Whoosh / Klipp',
                duration: 0.38,
                description: 'Snabb luftig svepeffekt för text, bildbyten och snabba klipp.'
            },
            {
                id: 'pop',
                name: '🫧 Pop Bubble',
                category: 'reaction',
                categoryLabel: 'Pop / Reaktion',
                duration: 0.14,
                description: 'Snärtig bubbelpopp när text, stickers eller ikoner dyker upp.'
            },
            {
                id: 'ding',
                name: '🔔 Bell / Ding Chime',
                category: 'reaction',
                categoryLabel: 'Ding / Notis',
                duration: 0.65,
                description: 'Klar klockklang för tips, insikter, poäng och positiva notiser.'
            },
            {
                id: 'camera',
                name: '📸 Camera Shutter',
                category: 'reaction',
                categoryLabel: 'Kamera / Foto',
                duration: 0.28,
                description: 'Mekaniskt dubbelklick för skärmdumpar, foton och frysrutor.'
            },
            {
                id: 'scratch',
                name: '💿 Vinyl Record Scratch',
                category: 'retro',
                categoryLabel: 'Glitch / Retro',
                duration: 0.36,
                description: 'Klassiskt vinylstopp för komiska pauser och oväntade vändningar.'
            },
            {
                id: 'glitch',
                name: '⚡ Glitch Zap',
                category: 'retro',
                categoryLabel: 'Glitch / Retro',
                duration: 0.26,
                description: 'Digital brus- och frekvensstörning för cyberpunk och felklipp.'
            },
            {
                id: 'impact',
                name: '💥 Cinematic Sub Impact',
                category: 'impact',
                categoryLabel: 'Impact / Bas',
                duration: 1.10,
                description: 'Tung bas-hook med sub-muller för dramatiska inledningar.'
            },
            {
                id: 'riser',
                name: '🥁 Dramatic Tension Riser',
                category: 'impact',
                categoryLabel: 'Impact / Spänning',
                duration: 1.40,
                description: 'Stigande ton som bygger upp maximal spänning före en hook.'
            },
            {
                id: 'vine-boom',
                name: '🗿 Vine Boom (Meme)',
                category: 'impact',
                categoryLabel: 'Impact / Meme',
                duration: 1.25,
                description: 'Den legendariska virala meme-effekten med massiv mättad sub-bas.'
            },
            {
                id: 'whoosh-fast',
                name: '⚡ Whip Fast Swish',
                category: 'transition',
                categoryLabel: 'Whoosh / Klipp',
                duration: 0.18,
                description: 'Ultrasnabb pisk-effekt för blixtsnabba klipp och zoomar.'
            },
            {
                id: 'click',
                name: '🖱️ UI Mouse Click',
                category: 'reaction',
                categoryLabel: 'Klick / UI',
                duration: 0.06,
                description: 'Krispigt mekaniskt klick för knappar och pekare.'
            },
            {
                id: 'keyboard',
                name: '⌨️ Mechanical Key Tap',
                category: 'retro',
                categoryLabel: 'Retro / Tangentbord',
                duration: 0.12,
                description: 'Mekanisk switch-klick för skrivmaskinseffekt och kod.'
            },
            {
                id: 'laser',
                name: '🔫 Sci-Fi Laser Blaster',
                category: 'retro',
                categoryLabel: 'Retro / Sci-Fi',
                duration: 0.24,
                description: 'Retro arkad-laser för skoj, spel och actionklipp.'
            },
            {
                id: 'tada',
                name: '🎺 Fanfare / Tada Chime',
                category: 'reaction',
                categoryLabel: 'Reaktion / Vinst',
                duration: 0.85,
                description: 'Festlig tretons-fanfar för succéer och reveal-ögonblick.'
            },
            {
                id: 'buzzer',
                name: '❌ Fail Buzzer (Wrong)',
                category: 'reaction',
                categoryLabel: 'Reaktion / Fel',
                duration: 0.45,
                description: 'Dissonant tv-show felsignal för misslyckanden och memes.'
            }
        ];

        this.cache = new Map(); // id -> { blobUrl, audioBuffer }
        this.currentPreviewAudio = null;
        this.currentPlayingId = null;
        this.activeCategory = 'all';

        this.init();
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

    async init() {
        // Pre-render all SFX in background into WAV Blobs
        for (const sfx of this.sfxList) {
            this.generateWav(sfx.id, sfx.duration).then(blob => {
                const url = URL.createObjectURL(blob);
                this.cache.set(sfx.id, { blob, url });
            });
        }
        this.setupUI();
    }

    async generateWav(id, duration) {
        const sampleRate = 44100;
        const totalFrames = Math.ceil(sampleRate * duration);
        const offlineCtx = new OfflineAudioContext(1, totalFrames, sampleRate);

        if (id === 'whoosh') {
            // White noise through sweeping bandpass filter
            const bufferSize = totalFrames;
            const noiseBuffer = offlineCtx.createBuffer(1, bufferSize, sampleRate);
            const output = noiseBuffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                output[i] = Math.random() * 2 - 1;
            }

            const whiteNoise = offlineCtx.createBufferSource();
            whiteNoise.buffer = noiseBuffer;

            const filter = offlineCtx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.Q.setValueAtTime(3.0, 0);
            filter.frequency.setValueAtTime(250, 0);
            filter.frequency.exponentialRampToValueAtTime(2600, duration * 0.45);
            filter.frequency.exponentialRampToValueAtTime(220, duration);

            const gain = offlineCtx.createGain();
            gain.gain.setValueAtTime(0.01, 0);
            gain.gain.linearRampToValueAtTime(0.9, duration * 0.45);
            gain.gain.exponentialRampToValueAtTime(0.001, duration);

            whiteNoise.connect(filter);
            filter.connect(gain);
            gain.connect(offlineCtx.destination);
            whiteNoise.start(0);

        } else if (id === 'pop') {
            // Snappy sine sweep down
            const osc = offlineCtx.createOscillator();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(950, 0);
            osc.frequency.exponentialRampToValueAtTime(140, duration);

            const gain = offlineCtx.createGain();
            gain.gain.setValueAtTime(0.95, 0);
            gain.gain.exponentialRampToValueAtTime(0.001, duration);

            osc.connect(gain);
            gain.connect(offlineCtx.destination);
            osc.start(0);

        } else if (id === 'ding') {
            // Bell chime: Fundamental + harmonics
            const freqs = [1400, 2800, 4200];
            const gains = [0.7, 0.25, 0.1];

            freqs.forEach((f, idx) => {
                const osc = offlineCtx.createOscillator();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(f, 0);

                const gain = offlineCtx.createGain();
                gain.gain.setValueAtTime(gains[idx], 0);
                gain.gain.exponentialRampToValueAtTime(0.0005, duration);

                osc.connect(gain);
                gain.connect(offlineCtx.destination);
                osc.start(0);
            });

        } else if (id === 'camera') {
            // Dual shutter click
            [0, 0.08].forEach(startTime => {
                const osc = offlineCtx.createOscillator();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(1800, startTime);
                osc.frequency.exponentialRampToValueAtTime(200, startTime + 0.04);

                const gain = offlineCtx.createGain();
                gain.gain.setValueAtTime(0.8, startTime);
                gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.04);

                osc.connect(gain);
                gain.connect(offlineCtx.destination);
                osc.start(startTime);
                osc.stop(startTime + 0.045);
            });

        } else if (id === 'scratch') {
            // Vinyl record scratch
            const osc = offlineCtx.createOscillator();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(800, 0);
            osc.frequency.linearRampToValueAtTime(1200, duration * 0.4);
            osc.frequency.exponentialRampToValueAtTime(60, duration);

            const filter = offlineCtx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.setValueAtTime(900, 0);
            filter.Q.setValueAtTime(4.0, 0);

            const gain = offlineCtx.createGain();
            gain.gain.setValueAtTime(0.75, 0);
            gain.gain.exponentialRampToValueAtTime(0.001, duration);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(offlineCtx.destination);
            osc.start(0);

        } else if (id === 'glitch') {
            // Glitch pulse with rapid square wave steps
            const osc = offlineCtx.createOscillator();
            osc.type = 'square';
            const steps = [440, 880, 220, 1760, 330, 90];
            steps.forEach((f, idx) => {
                const t = (idx / steps.length) * duration;
                osc.frequency.setValueAtTime(f, t);
            });

            const gain = offlineCtx.createGain();
            gain.gain.setValueAtTime(0.6, 0);
            gain.gain.exponentialRampToValueAtTime(0.001, duration);

            osc.connect(gain);
            gain.connect(offlineCtx.destination);
            osc.start(0);

        } else if (id === 'impact') {
            // Cinematic Sub-Bass Impact Drop
            const osc = offlineCtx.createOscillator();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(160, 0);
            osc.frequency.exponentialRampToValueAtTime(42, 0.18);
            osc.frequency.linearRampToValueAtTime(32, duration);

            const gain = offlineCtx.createGain();
            gain.gain.setValueAtTime(0.95, 0);
            gain.gain.exponentialRampToValueAtTime(0.001, duration);

            osc.connect(gain);
            gain.connect(offlineCtx.destination);
            osc.start(0);

        } else if (id === 'riser') {
            // Rising tension tone
            const osc = offlineCtx.createOscillator();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(70, 0);
            osc.frequency.exponentialRampToValueAtTime(650, duration);

            const gain = offlineCtx.createGain();
            gain.gain.setValueAtTime(0.05, 0);
            gain.gain.linearRampToValueAtTime(0.85, duration * 0.9);
            gain.gain.exponentialRampToValueAtTime(0.001, duration);

            osc.connect(gain);
            gain.connect(offlineCtx.destination);
            osc.start(0);

        } else if (id === 'vine-boom') {
            // Massive distorted sub-bass drop with punch
            const osc = offlineCtx.createOscillator();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(110, 0);
            osc.frequency.exponentialRampToValueAtTime(32, 0.22);
            osc.frequency.linearRampToValueAtTime(24, duration);

            const oscSub = offlineCtx.createOscillator();
            oscSub.type = 'triangle';
            oscSub.frequency.setValueAtTime(55, 0);
            oscSub.frequency.exponentialRampToValueAtTime(20, 0.35);

            // Distortion / overdrive curve
            const waveShaper = offlineCtx.createWaveShaper();
            const n_samples = 44100;
            const curve = new Float32Array(n_samples);
            const deg = Math.PI / 180;
            const k = 45;
            for (let i = 0; i < n_samples; ++i) {
                const x = (i * 2) / n_samples - 1;
                curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
            }
            waveShaper.curve = curve;
            waveShaper.oversample = '2x';

            const gain = offlineCtx.createGain();
            gain.gain.setValueAtTime(0.95, 0);
            gain.gain.exponentialRampToValueAtTime(0.001, duration);

            osc.connect(waveShaper);
            oscSub.connect(waveShaper);
            waveShaper.connect(gain);
            gain.connect(offlineCtx.destination);

            osc.start(0);
            oscSub.start(0);

        } else if (id === 'whoosh-fast') {
            // Fast whip whoosh
            const bufferSize = totalFrames;
            const noiseBuffer = offlineCtx.createBuffer(1, bufferSize, sampleRate);
            const output = noiseBuffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                output[i] = Math.random() * 2 - 1;
            }

            const whiteNoise = offlineCtx.createBufferSource();
            whiteNoise.buffer = noiseBuffer;

            const filter = offlineCtx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.Q.setValueAtTime(4.0, 0);
            filter.frequency.setValueAtTime(400, 0);
            filter.frequency.exponentialRampToValueAtTime(3600, duration * 0.4);
            filter.frequency.exponentialRampToValueAtTime(300, duration);

            const gain = offlineCtx.createGain();
            gain.gain.setValueAtTime(0.01, 0);
            gain.gain.linearRampToValueAtTime(0.95, duration * 0.4);
            gain.gain.exponentialRampToValueAtTime(0.001, duration);

            whiteNoise.connect(filter);
            filter.connect(gain);
            gain.connect(offlineCtx.destination);
            whiteNoise.start(0);

        } else if (id === 'click') {
            // UI mechanical click
            const osc = offlineCtx.createOscillator();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(2200, 0);
            osc.frequency.exponentialRampToValueAtTime(280, duration);

            const gain = offlineCtx.createGain();
            gain.gain.setValueAtTime(0.85, 0);
            gain.gain.exponentialRampToValueAtTime(0.001, duration);

            osc.connect(gain);
            gain.connect(offlineCtx.destination);
            osc.start(0);

        } else if (id === 'keyboard') {
            // Mechanical switch tap
            const osc = offlineCtx.createOscillator();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(1400, 0);
            osc.frequency.exponentialRampToValueAtTime(220, duration);

            const gain = offlineCtx.createGain();
            gain.gain.setValueAtTime(0.9, 0);
            gain.gain.exponentialRampToValueAtTime(0.001, duration);

            osc.connect(gain);
            gain.connect(offlineCtx.destination);
            osc.start(0);

        } else if (id === 'laser') {
            // Retro blaster laser
            const osc = offlineCtx.createOscillator();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(2400, 0);
            osc.frequency.exponentialRampToValueAtTime(110, duration);

            const gain = offlineCtx.createGain();
            gain.gain.setValueAtTime(0.8, 0);
            gain.gain.exponentialRampToValueAtTime(0.001, duration);

            osc.connect(gain);
            gain.connect(offlineCtx.destination);
            osc.start(0);

        } else if (id === 'tada') {
            // Fanfare 3-tone arpeggio (C5, E5, G5 + C6)
            const notes = [
                { f: 523.25, t: 0, d: 0.18 },
                { f: 659.25, t: 0.14, d: 0.18 },
                { f: 783.99, t: 0.28, d: 0.18 },
                { f: 1046.50, t: 0.42, d: 0.42 }
            ];

            notes.forEach(note => {
                const osc = offlineCtx.createOscillator();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(note.f, note.t);

                const gain = offlineCtx.createGain();
                gain.gain.setValueAtTime(0.7, note.t);
                gain.gain.exponentialRampToValueAtTime(0.001, note.t + note.d);

                osc.connect(gain);
                gain.connect(offlineCtx.destination);
                osc.start(note.t);
                osc.stop(note.t + note.d + 0.01);
            });

        } else if (id === 'buzzer') {
            // Dual dissonant fail buzzer
            const freqs = [140, 196];
            freqs.forEach(f => {
                const osc = offlineCtx.createOscillator();
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(f, 0);

                const gain = offlineCtx.createGain();
                gain.gain.setValueAtTime(0.6, 0);
                gain.gain.exponentialRampToValueAtTime(0.001, duration);

                osc.connect(gain);
                gain.connect(offlineCtx.destination);
                osc.start(0);
            });
        }

        const renderedBuffer = await offlineCtx.startRendering();
        return this.audioBufferToWav(renderedBuffer);
    }

    audioBufferToWav(buffer) {
        const numChannels = buffer.numberOfChannels;
        const sampleRate = buffer.sampleRate;
        const length = buffer.length * numChannels * 2;
        const arrayBuffer = new ArrayBuffer(44 + length);
        const view = new DataView(arrayBuffer);

        const writeString = (offset, string) => {
            for (let i = 0; i < string.length; i++) {
                view.setUint8(offset + i, string.charCodeAt(i));
            }
        };

        writeString(0, 'RIFF');
        view.setUint32(4, 36 + length, true);
        writeString(8, 'WAVE');
        writeString(12, 'fmt ');
        view.setUint32(16, 16, true);
        view.setUint16(20, 1, true); // PCM
        view.setUint16(22, numChannels, true);
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, sampleRate * numChannels * 2, true);
        view.setUint16(32, numChannels * 2, true);
        view.setUint16(34, 16, true); // 16-bit
        writeString(36, 'data');
        view.setUint32(40, length, true);

        let offset = 44;
        for (let i = 0; i < buffer.length; i++) {
            for (let channel = 0; channel < numChannels; channel++) {
                let sample = buffer.getChannelData(channel)[i];
                sample = Math.max(-1, Math.min(1, sample));
                view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
                offset += 2;
            }
        }

        return new Blob([arrayBuffer], { type: 'audio/wav' });
    }

    playPreview(sfxId) {
        if (this.currentPreviewAudio) {
            this.currentPreviewAudio.pause();
            this.currentPreviewAudio = null;
        }

        if (this.currentPlayingId === sfxId) {
            this.currentPlayingId = null;
            this.updatePlayIcons();
            return;
        }

        const cached = this.cache.get(sfxId);
        if (!cached || !cached.url) return;

        const audio = new Audio(cached.url);
        this.currentPreviewAudio = audio;
        this.currentPlayingId = sfxId;
        this.updatePlayIcons();

        audio.onended = () => {
            if (this.currentPlayingId === sfxId) {
                this.currentPlayingId = null;
                this.updatePlayIcons();
            }
        };
        audio.play().catch(e => console.warn('Audio play error:', e));
    }

    updatePlayIcons() {
        document.querySelectorAll('.btn-sfx-play').forEach(btn => {
            const id = btn.dataset.sfx;
            if (id === this.currentPlayingId) {
                btn.innerHTML = ncIcon('stop', { solid: true });
                btn.classList.add('playing');
            } else {
                btn.innerHTML = ncIcon('play', { solid: true });
                btn.classList.remove('playing');
            }
        });
    }

    async addSfxToTimeline(sfxId) {
        const sfx = this.sfxList.find(s => s.id === sfxId);
        if (!sfx) return;

        let cached = this.cache.get(sfxId);
        if (!cached) {
            const blob = await this.generateWav(sfx.id, sfx.duration);
            const url = URL.createObjectURL(blob);
            cached = { blob, url };
            this.cache.set(sfxId, cached);
        }

        const mediaId = `sfx-${sfxId}-${Date.now()}`;
        const audioEl = new Audio(cached.url);
        audioEl.preload = 'auto';

        if (this.engine && this.engine.mediaElements) {
            this.engine.mediaElements.set(mediaId, audioEl);
        }

        const clip = this.timeline.addClip({
            trackId: 'audio',
            mediaId: mediaId,
            title: sfx.name,
            type: 'audio',
            startTime: this.engine.currentTime,
            duration: sfx.duration,
            isSfx: true
        });

        if (window.inspector) {
            window.inspector.update(clip);
        }
        this.engine.render();
    }

    setupUI() {
        const container = document.getElementById('sfxPresetsList');
        if (!container) return;

        container.innerHTML = '';

        const filtered = this.sfxList.filter(s => {
            return this.activeCategory === 'all' || s.category === this.activeCategory;
        });

        filtered.forEach(sfx => {
            const card = document.createElement('div');
            card.className = 'plugin-card sfx-card';
            card.innerHTML = `
                <div style="padding: 10px 12px; display: flex; align-items: center; justify-content: space-between; gap: 10px;">
                    <div style="display: flex; align-items: center; gap: 10px; overflow: hidden;">
                        <button class="btn-sfx-play" data-sfx="${sfx.id}" title="Förhandslyssna">${ncIcon('play', { solid: true })}</button>
                        <div style="overflow: hidden;">
                            <div style="font-weight: 600; font-size: 12px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                                ${sfx.name}
                            </div>
                            <div style="font-size: 10px; color: var(--text-muted); display: flex; gap: 6px; align-items: center;">
                                <span>${sfx.categoryLabel}</span>
                                <span>•</span>
                                <span>${sfx.duration.toFixed(2)}s</span>
                            </div>
                        </div>
                    </div>
                    <button class="btn-add-sfx-timeline" data-sfx="${sfx.id}" title="Placera vid spelhuvud">
                        + Använd
                    </button>
                </div>
            `;

            card.querySelector('.btn-sfx-play').addEventListener('click', (e) => {
                e.stopPropagation();
                this.playPreview(sfx.id);
            });

            card.querySelector('.btn-add-sfx-timeline').addEventListener('click', (e) => {
                e.stopPropagation();
                this.addSfxToTimeline(sfx.id);
            });

            container.appendChild(card);
        });

        // Setup category chips
        document.querySelectorAll('.sfx-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                document.querySelectorAll('.sfx-chip').forEach(c => c.classList.remove('active'));
                chip.classList.add('active');
                this.activeCategory = chip.dataset.cat;
                this.setupUI();
            });
        });
    }
}

window.NovaCutSFX = NovaCutSFX;

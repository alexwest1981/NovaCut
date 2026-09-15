/**
 * NovaCut - Curated Google Fonts & Custom Font Manager
 */
class NovaCutFontManager {
    constructor() {
        this.curatedFonts = [
            {
                name: 'Bebas Neue',
                category: 'Rubrik / YouTube',
                description: 'Världens mest använda typsnitt för YouTube-titlar och klickbara thumbnails.',
                sample: 'BREAKING NEWS 2026',
                fontFamily: "'Bebas Neue', cursive, sans-serif",
                weights: ['400'],
                tags: ['youtube', 'bold', 'display']
            },
            {
                name: 'Anton',
                category: 'Extremt Fet / Memes',
                description: 'Tjocka versaler med brutal genomslagskraft för rubriker, reaktioner och action.',
                sample: 'MAXIMAL IMPACT',
                fontFamily: "'Anton', sans-serif",
                weights: ['400'],
                tags: ['meme', 'bold', 'headline']
            },
            {
                name: 'Poppins',
                category: 'Undertext / Vlogg',
                description: 'Modern geometrisk sans-serif med runda, vänliga former. Perfekt för TikTok & captions.',
                sample: 'Här är en snygg undertext!',
                fontFamily: "'Poppins', sans-serif",
                weights: ['400', '600', '800'],
                tags: ['captions', 'vlog', 'clean']
            },
            {
                name: 'Montserrat',
                category: 'Modern Sans-Serif',
                description: 'Urban arkitekturkänsla, extremt mångsidigt för modern skandinavisk videodesign.',
                sample: 'CREATIVE DESIGN',
                fontFamily: "'Montserrat', sans-serif",
                weights: ['700', '900'],
                tags: ['modern', 'clean', 'versatile']
            },
            {
                name: 'Oswald',
                category: 'Dokumentär / Nyheter',
                description: 'Klassisk omarbetning av tidningsstilen Alternate Gothic. Seriöst, tight och professionellt.',
                sample: 'THE DOCUMENTARY',
                fontFamily: "'Oswald', sans-serif",
                weights: ['700'],
                tags: ['documentary', 'news', 'tight']
            },
            {
                name: 'Cinzel',
                category: 'Bio / Episk Serif',
                description: 'Inspirerad av klassiska romerska inskriptioner. Ger omedelbar Hollywood-biokänsla.',
                sample: 'AN EPIC JOURNEY',
                fontFamily: "'Cinzel', serif",
                weights: ['700'],
                tags: ['cinematic', 'epic', 'movie']
            },
            {
                name: 'Playfair Display',
                category: 'Lyx & Elegans',
                description: 'Klassisk stil med höga kontraster och skarp elegans. Perfekt för mode och livsstil.',
                sample: 'Elegance & Style',
                fontFamily: "'Playfair Display', serif",
                weights: ['700'],
                tags: ['luxury', 'editorial', 'fashion']
            },
            {
                name: 'Permanent Marker',
                category: 'Handskrift / Vlogger',
                description: 'Autentisk spritpennelook för vlogs, personliga kommentarer och street video.',
                sample: 'My Crazy Vlog!',
                fontFamily: "'Permanent Marker', cursive",
                weights: ['400'],
                tags: ['handwritten', 'vlog', 'marker']
            },
            {
                name: 'Pacifico',
                category: 'Retro / Surf / Kul',
                description: 'Rolig och avslappnad 1950-tals amerikansk surfkultur i skriven penselstil.',
                sample: 'Summer Vacation',
                fontFamily: "'Pacifico', cursive",
                weights: ['400'],
                tags: ['retro', 'script', 'fun']
            },
            {
                name: 'Caveat',
                category: 'Mjuk Anteckning',
                description: 'Snabb och naturlig handstil med rundade spetsar för personliga stickers.',
                sample: 'Glöm inte att prenumerera',
                fontFamily: "'Caveat', cursive",
                weights: ['700'],
                tags: ['handwritten', 'casual', 'notes']
            },
            {
                name: 'Righteous',
                category: '80s Retro / Synthwave',
                description: 'Futuristisk retrokänsla med rundade sci-fi-vinklar för 80-talsestetik.',
                sample: 'SYNTHWAVE 1984',
                fontFamily: "'Righteous', cursive",
                weights: ['400'],
                tags: ['retro', 'synthwave', '80s']
            },
            {
                name: 'Bangers',
                category: 'Serietidning / Gaming',
                description: 'Klassisk amerikansk serietidningsstil för actionklipp, ljudeffekter och gaming.',
                sample: 'BOOM! HEADSHOT!',
                fontFamily: "'Bangers', cursive",
                weights: ['400'],
                tags: ['comic', 'gaming', 'action']
            },
            {
                name: 'Orbitron',
                category: 'Sci-Fi / Cyberpunk',
                description: 'Geometriskt rymdtypsnitt för cyberpunk, spel och tech-videor.',
                sample: 'CYBERPUNK 2077',
                fontFamily: "'Orbitron', sans-serif",
                weights: ['700', '900'],
                tags: ['cyberpunk', 'scifi', 'gaming']
            },
            {
                name: 'Lobster',
                category: 'Vintage Skript',
                description: 'Tjock, fet kursivstil för logotyper, emblem och klassiska intron.',
                sample: 'The Good Times',
                fontFamily: "'Lobster', cursive",
                weights: ['400'],
                tags: ['vintage', 'script', 'bold']
            },
            {
                name: 'Press Start 2P',
                category: '8-bit / Pixel Art',
                description: 'Autentisk arkadpixelstil baserad på 1980-talets klassiska arkadspel.',
                sample: 'GAME OVER',
                fontFamily: "'Press Start 2P', cursive",
                weights: ['400'],
                tags: ['pixel', '8bit', 'retro', 'gaming']
            },
            {
                name: 'Inter',
                category: 'Teknisk & Knivskarp',
                description: 'Världsledande typsnitt för UI och dataskärmar, extremt lättläst på mobila skärmar.',
                sample: 'Knivskarpa undertexter',
                fontFamily: "'Inter', sans-serif",
                weights: ['400', '700'],
                tags: ['subtitles', 'tech', 'clean']
            }
        ];

        this.systemFonts = [
            { name: 'Modern Sans-serif', fontFamily: 'sans-serif' },
            { name: 'Impact (Meme/Bold)', fontFamily: 'Impact, sans-serif' },
            { name: 'JetBrains Mono / Tech', fontFamily: "'JetBrains Mono', monospace" },
            { name: 'Klassisk Serif', fontFamily: 'Georgia, serif' }
        ];

        this.customFonts = []; // { fontName, fontFamily, fileName }
        this.isLoaded = false;
    }

    async init() {
        this.injectGoogleFontsStylesheet();
        await this.loadSavedCustomFonts();
        this.isLoaded = true;
    }

    injectGoogleFontsStylesheet() {
        const id = 'novacut-google-fonts';
        if (document.getElementById(id)) return;

        const link = document.createElement('link');
        link.id = id;
        link.rel = 'stylesheet';
        // Single combined Google Fonts query for all curated fonts
        link.href = 'https://fonts.googleapis.com/css2?family=Anton&family=Bangers&family=Bebas+Neue&family=Caveat:wght@700&family=Cinzel:wght@700&family=Inter:wght@400;700&family=Lobster&family=Montserrat:wght@700;900&family=Orbitron:wght@700;900&family=Oswald:wght@700&family=Pacifico&family=Permanent+Marker&family=Playfair+Display:wght@700&family=Poppins:wght@600;800&family=Press+Start+2P&family=Righteous&display=swap';
        document.head.appendChild(link);
    }

    async loadSavedCustomFonts() {
        if (window.novaCut && typeof window.novaCut.loadCustomFonts === 'function') {
            try {
                const list = await window.novaCut.loadCustomFonts();
                for (const item of list) {
                    await this.registerFontFromBase64(item.fontName, item.dataBase64, item.fileName);
                }
            } catch (err) {
                console.warn('Could not load custom fonts from IPC:', err);
            }
        }
    }

    async registerFontFromBase64(fontName, base64Data, fileName = '') {
        try {
            const binaryStr = atob(base64Data);
            const len = binaryStr.length;
            const bytes = new Uint8Array(len);
            for (let i = 0; i < len; i++) {
                bytes[i] = binaryStr.charCodeAt(i);
            }
            const fontFace = new FontFace(fontName, bytes.buffer);
            await fontFace.load();
            document.fonts.add(fontFace);

            const fontFamily = `"${fontName}", sans-serif`;
            if (!this.customFonts.some(f => f.fontName === fontName)) {
                this.customFonts.push({
                    fontName,
                    fontFamily,
                    fileName: fileName || `${fontName}.ttf`
                });
            }
            return fontFamily;
        } catch (e) {
            console.error(`Failed to register font ${fontName}:`, e);
            return null;
        }
    }

    async importCustomFont() {
        if (window.novaCut && typeof window.novaCut.importFont === 'function') {
            const fontData = await window.novaCut.importFont();
            if (fontData && fontData.dataBase64) {
                const fam = await this.registerFontFromBase64(fontData.fontName, fontData.dataBase64, fontData.fileName);
                return { fontName: fontData.fontName, fontFamily: fam };
            }
            return null;
        } else {
            // HTML5 file picker fallback
            return new Promise((resolve) => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = '.ttf,.otf,.woff,.woff2';
                input.onchange = async (e) => {
                    const file = e.target.files[0];
                    if (!file) return resolve(null);
                    const fontName = file.name.replace(/\.[^/.]+$/, "");
                    const buffer = await file.arrayBuffer();
                    try {
                        const fontFace = new FontFace(fontName, buffer);
                        await fontFace.load();
                        document.fonts.add(fontFace);
                        const fontFamily = `"${fontName}", sans-serif`;
                        this.customFonts.push({ fontName, fontFamily, fileName: file.name });
                        resolve({ fontName, fontFamily });
                    } catch (err) {
                        console.error('Failed to load font file:', err);
                        resolve(null);
                    }
                };
                input.click();
            });
        }
    }

    getCuratedFonts() {
        return this.curatedFonts;
    }

    getCustomFonts() {
        return this.customFonts;
    }

    getSystemFonts() {
        return this.systemFonts;
    }
}

window.fontManager = new NovaCutFontManager();
window.fontManager.init();

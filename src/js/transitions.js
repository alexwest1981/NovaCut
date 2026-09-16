/**
 * NovaCut - Video Transitions & Visual FX Engine
 * Over 120+ CapCut-style high-impact video transitions across 7 categories.
 */
class NovaCutTransitions {
    constructor(engine, timeline) {
        this.engine = engine;
        this.timeline = timeline;

        this.gridEl = document.getElementById('transitionsGrid');
        this.selectedTransitionId = 'dissolve';
        this.draggedTransitionId = null;
        this.activeCategory = 'all';
        this.searchQuery = '';

        this.initLibrary();
        this.init();
    }

    initLibrary() {
        this.library = [
            // 1. Mjuka & Toningar (soft - 16 st)
            { id: 'dissolve', name: 'Cross Dissolve', category: 'soft', icon: '⧗', description: 'Klassisk mjuk övertoning mellan klipp.', defaultDuration: 0.5 },
            { id: 'dip_black', name: 'Dip to Black', category: 'soft', icon: '🌑', description: 'Dämpar mjukt till svart och tonar upp.', defaultDuration: 0.6 },
            { id: 'dip_white', name: 'Vit Blixt / Flash', category: 'soft', icon: '⚡', description: 'Intensiv vit ljusblixt för snabba beats.', defaultDuration: 0.35 },
            { id: 'dip_color', name: 'Amber Dip', category: 'soft', icon: '🌅', description: 'Varm bärnstenstoning mellan scener.', defaultDuration: 0.5 },
            { id: 'blur_fade', name: 'Gaussian Blur Fade', category: 'soft', icon: '🌫️', description: 'Mjuk upptoning via optisk linsoskärpa.', defaultDuration: 0.55 },
            { id: 'fade_sepia', name: 'Vintage Sepia Fade', category: 'soft', icon: '📜', description: 'Nostalgisk tonad övergång.', defaultDuration: 0.5 },
            { id: 'soft_glow', name: 'Dreamy Glow Fade', category: 'soft', icon: '✨', description: 'Drömsk glödande övertoning.', defaultDuration: 0.6 },
            { id: 'lens_blur', name: 'Bokeh Focus Pull', category: 'soft', icon: '🔮', description: 'Kamerans fokus dras ur och in igen.', defaultDuration: 0.5 },
            { id: 'soft_mist', name: 'Mjuk Dimslöja', category: 'soft', icon: '☁️', description: 'Atmosfärisk vit dimma som lättar.', defaultDuration: 0.55 },
            { id: 'film_melt', name: 'Celluloid Smälta', category: 'soft', icon: '🔥', description: 'Varm filmremsa som smälter bort.', defaultDuration: 0.5 },
            { id: 'pastel_fade', name: 'Pastelltoning', category: 'soft', icon: '🎨', description: 'Mjuk akvarell-toning.', defaultDuration: 0.5 },
            { id: 'charcoal_fade', name: 'Kolfrost Fade', category: 'soft', icon: '🖤', description: 'Mörk dramatisk kolsänka.', defaultDuration: 0.55 },
            { id: 'smoke_fade', name: 'Rökslöja Toning', category: 'soft', icon: '💨', description: 'Tät rök som rullar över bilden.', defaultDuration: 0.6 },
            { id: 'light_bleed', name: 'Ljusblödning', category: 'soft', icon: '💡', description: 'Överexponerat mjukt kantljus.', defaultDuration: 0.45 },
            { id: 'cloud_soft', name: 'Molnövertoning', category: 'soft', icon: '⛅', description: 'Svepande vita molnlag.', defaultDuration: 0.5 },
            { id: 'vignette_fade', name: 'Vinjett Mörker', category: 'soft', icon: '🎯', description: 'Fokuserad mörk vinjett-toning.', defaultDuration: 0.5 },

            // 2. Rörelse & Svep (motion - 20 st)
            { id: 'slide_left', name: 'Svep Vänster', category: 'motion', icon: '👈', description: 'Glider in från höger mot vänster.', defaultDuration: 0.45 },
            { id: 'slide_right', name: 'Svep Höger', category: 'motion', icon: '👉', description: 'Glider in från vänster mot höger.', defaultDuration: 0.45 },
            { id: 'slide_up', name: 'Svep Uppåt', category: 'motion', icon: '👆', description: 'Glider in underifrån och uppåt.', defaultDuration: 0.45 },
            { id: 'slide_down', name: 'Svep Nedåt', category: 'motion', icon: '👇', description: 'Glider in uppifrån och nedåt.', defaultDuration: 0.45 },
            { id: 'whip_left', name: 'Whip Pan Vänster', category: 'motion', icon: '💨', description: 'Blixtsnabbt kamerasvep med fartkänsla.', defaultDuration: 0.35 },
            { id: 'whip_right', name: 'Whip Pan Höger', category: 'motion', icon: '🌪️', description: 'Snabbt kamerasvep åt höger.', defaultDuration: 0.35 },
            { id: 'whip_up', name: 'Whip Pan Upp', category: 'motion', icon: '🚀', description: 'Vertikal whip pan uppåt.', defaultDuration: 0.35 },
            { id: 'whip_down', name: 'Whip Pan Ner', category: 'motion', icon: '⚡', description: 'Vertikal whip pan nedåt.', defaultDuration: 0.35 },
            { id: 'smooth_push_left', name: 'Push Vänster', category: 'motion', icon: '◀️', description: 'Mjuk elastisk knuff åt vänster.', defaultDuration: 0.5 },
            { id: 'smooth_push_right', name: 'Push Höger', category: 'motion', icon: '▶️', description: 'Mjuk elastisk knuff åt höger.', defaultDuration: 0.5 },
            { id: 'diagonal_ne', name: 'Diagonalt Nordost', category: 'motion', icon: '↗️', description: 'Glider in snett upp åt höger.', defaultDuration: 0.45 },
            { id: 'diagonal_nw', name: 'Diagonalt Nordväst', category: 'motion', icon: '↖️', description: 'Glider in snett upp åt vänster.', defaultDuration: 0.45 },
            { id: 'diagonal_se', name: 'Diagonalt Sydost', category: 'motion', icon: '↘️', description: 'Glider in snett ner åt höger.', defaultDuration: 0.45 },
            { id: 'diagonal_sw', name: 'Diagonalt Sydväst', category: 'motion', icon: '↙️', description: 'Glider in snett ner åt vänster.', defaultDuration: 0.45 },
            { id: 'inertial_snap', name: 'Tröghets-Snap', category: 'motion', icon: '🧲', description: 'Fjädrande kamerasvep med stopp.', defaultDuration: 0.4 },
            { id: 'accordion_slide', name: 'Dragspelssvep', category: 'motion', icon: '🪗', description: 'Horisontellt komprimerat svep.', defaultDuration: 0.45 },
            { id: 'elastic_toss', name: 'Elastiskt Kast', category: 'motion', icon: '🪃', description: 'Bumerang-knuff med studs.', defaultDuration: 0.45 },
            { id: 'skew_slide', name: 'Snedställt Svep', category: 'motion', icon: '📐', description: 'Perspektiv-skevat svep.', defaultDuration: 0.45 },
            { id: 'roller_blind', name: 'Rulljalusi', category: 'motion', icon: '📜', description: 'Rullande filmiskt svep.', defaultDuration: 0.5 },
            { id: 'shuffle_deck', name: 'Kortleksskifte', category: 'motion', icon: '🃏', description: 'Klippen byter plats som spelkort.', defaultDuration: 0.45 },

            // 3. 3D & Rotations (3d - 16 st)
            { id: 'cube_left', name: '3D Kub Vänster', category: '3d', icon: '🎲', description: 'Scenen roterar som en 3D-kub åt vänster.', defaultDuration: 0.55 },
            { id: 'cube_right', name: '3D Kub Höger', category: '3d', icon: '🧊', description: 'Scenen roterar som en 3D-kub åt höger.', defaultDuration: 0.55 },
            { id: 'cube_up', name: '3D Kub Uppåt', category: '3d', icon: '📦', description: 'Vertikal 3D-kubrotation uppåt.', defaultDuration: 0.55 },
            { id: 'cube_down', name: '3D Kub Nedåt', category: '3d', icon: '📥', description: 'Vertikal 3D-kubrotation nedåt.', defaultDuration: 0.55 },
            { id: 'flip_horiz', name: '3D Spegelvändning', category: '3d', icon: '🔄', description: 'Vänds 180° horisontellt runt sin axel.', defaultDuration: 0.5 },
            { id: 'flip_vert', name: '3D Voltvertikal', category: '3d', icon: '🔃', description: 'Vänds 180° vertikalt som en myntflipp.', defaultDuration: 0.5 },
            { id: 'door_swing', name: '3D Dörröppning', category: '3d', icon: '🚪', description: 'Bilden öppnas inåt som en rumsdörr.', defaultDuration: 0.55 },
            { id: 'page_turn', name: 'Bokbläddring 3D', category: '3d', icon: '📖', description: 'Bläddrar sida som i ett glansigt magasin.', defaultDuration: 0.6 },
            { id: 'origami_fold', name: 'Origamivikning', category: '3d', icon: '🦢', description: 'Papper viks på mitten i 3D-rummet.', defaultDuration: 0.55 },
            { id: 'cylinder_roll', name: 'Cylinderrulle', category: '3d', icon: '🌀', description: 'Scenen rullar upp på en 3D-cylinder.', defaultDuration: 0.5 },
            { id: 'prism_3d', name: 'Prisma Splittring', category: '3d', icon: '💎', description: 'Reflekterande 3D-glasprisma.', defaultDuration: 0.5 },
            { id: 'rotating_plate', name: 'Roterande Tallrik', category: '3d', icon: '💿', description: 'Centrifugalt snurrande plan.', defaultDuration: 0.55 },
            { id: 'depth_zoom_3d', name: 'Djupzoom 3D', category: '3d', icon: '🌌', description: 'Faller bakåt i en djup rumsdimension.', defaultDuration: 0.55 },
            { id: 'card_flip_3d', name: 'Kortvändning', category: '3d', icon: '🎴', description: 'Snabb snärtig vändning.', defaultDuration: 0.45 },
            { id: 'hex_spin_3d', name: 'Hexagon Spin', category: '3d', icon: '⬡', description: 'Geometrisk sexhörning i 3D.', defaultDuration: 0.5 },
            { id: 'sphere_wrap', name: 'Sfärisk Kula', category: '3d', icon: '🔮', description: 'Böjs runt en 3D-sfär.', defaultDuration: 0.55 },

            // 4. Zoom & Skala (zoom - 18 st)
            { id: 'zoom_in', name: 'Super Zoom In', category: 'zoom', icon: '🔍', description: 'Suger in blicken med dynamisk inzoomning.', defaultDuration: 0.5 },
            { id: 'zoom_out', name: 'Filmisk Zoom Ut', category: 'zoom', icon: '🔎', description: 'Filmisk utzoomning för scenövergångar.', defaultDuration: 0.5 },
            { id: 'spin_zoom_cw', name: 'Virvel Medsols', category: 'zoom', icon: '🔄', description: '360° virvelzoom medurs.', defaultDuration: 0.55 },
            { id: 'spin_zoom_ccw', name: 'Virvel Motsols', category: 'zoom', icon: '🔃', description: '360° virvelzoom moturs.', defaultDuration: 0.55 },
            { id: 'bounce_zoom', name: 'Bounce Zoom', category: 'zoom', icon: '🏀', description: 'Dynamisk studsande zoom.', defaultDuration: 0.45 },
            { id: 'elastic_zoom', name: 'Snap Zoom / Beat', category: 'zoom', icon: '🎯', description: 'Snabb beat-zoom som snappar till.', defaultDuration: 0.3 },
            { id: 'swirl_zoom', name: 'Vortex Swirl', category: 'zoom', icon: '🌀', description: 'Vridande centrifugal vortex.', defaultDuration: 0.5 },
            { id: 'cross_zoom', name: 'Dubbel Korszoom', category: 'zoom', icon: '✖️', description: 'Övergående optisk korszoom.', defaultDuration: 0.45 },
            { id: 'crash_zoom', name: 'Crash Zoom Snabb', category: 'zoom', icon: '💥', description: 'Tarantino-stil blixtsnabb inzoomning.', defaultDuration: 0.25 },
            { id: 'optical_warp', name: 'Optisk Linswarp', category: 'zoom', icon: '👁️', description: 'Fisheye-krökning under zoom.', defaultDuration: 0.45 },
            { id: 'heartbeat_zoom', name: 'Hjärtslags-Puls', category: 'zoom', icon: '💓', description: 'Dubbel beat-puls in i nästa scen.', defaultDuration: 0.35 },
            { id: 'glitch_zoom', name: 'Glitch Zoom', category: 'zoom', icon: '👾', description: 'Skakig pixelzoom med bildstörning.', defaultDuration: 0.35 },
            { id: 'dolly_zoom', name: 'Vertigo Dolly Zoom', category: 'zoom', icon: '😵', description: 'Hitchcock-effekt (zoom in, bakgrund ut).', defaultDuration: 0.6 },
            { id: 'infinite_tunnel', name: 'Oändlig Tunnel', category: 'zoom', icon: '🕳️', description: 'Dras genom en oändlig ramtunnel.', defaultDuration: 0.55 },
            { id: 'micro_zoom', name: 'Subtil Pop Zoom', category: 'zoom', icon: '🔎', description: 'Minimal 5% mikropuls för vlogs.', defaultDuration: 0.3 },
            { id: 'shake_zoom', name: 'Skakande Zoom', category: 'zoom', icon: '📳', description: 'Handburen skakzoom.', defaultDuration: 0.4 },
            { id: 'lens_snap', name: 'Lins-Snap', category: 'zoom', icon: '📸', description: 'Klickande kameralinszoom.', defaultDuration: 0.3 },
            { id: 'hyperspeed', name: 'Hyperdrive Warp', category: 'zoom', icon: '🚀', description: 'Stjärnfart och strecklinjer.', defaultDuration: 0.4 },

            // 5. Glitch & Cyber (glitch - 18 st)
            { id: 'glitch', name: 'Cyber Glitch', category: 'glitch', icon: '👾', description: 'Digital glitch, RGB-skifte och bildhopp.', defaultDuration: 0.4 },
            { id: 'rgb_split_trans', name: 'RGB Chromatic Shift', category: 'glitch', icon: '🌈', description: 'Separerade färgkanaler vid klippet.', defaultDuration: 0.35 },
            { id: 'scanline_glitch', name: 'CRT Katodstråle', category: 'glitch', icon: '📺', description: 'Analog TV-linjerullning och brus.', defaultDuration: 0.4 },
            { id: 'pixelate_trans', name: '8-Bit Mosaik', category: 'glitch', icon: '🧱', description: 'Pixelering som löser upp bildrutan.', defaultDuration: 0.45 },
            { id: 'tv_noise', name: 'TV Static Burst', category: 'glitch', icon: '📻', description: 'Snabb snö- och brusblixt mellan klipp.', defaultDuration: 0.3 },
            { id: 'vcr_distortion', name: 'VCR Bandsträckning', category: 'glitch', icon: '📼', description: 'Analog bandskada och skevning.', defaultDuration: 0.45 },
            { id: 'datamosh', name: 'Datamosh Tear', category: 'glitch', icon: '💽', description: 'Komprimeringsglitch med rörelseartefakt.', defaultDuration: 0.4 },
            { id: 'cyber_matrix', name: 'Matrix Drop', category: 'glitch', icon: '🟩', description: 'Digital kodpuls mellan scener.', defaultDuration: 0.35 },
            { id: 'pixel_sort', name: 'Pixel Sorting', category: 'glitch', icon: '📊', description: 'Glidande smälta pixelstrimmor.', defaultDuration: 0.45 },
            { id: 'analog_track', name: 'Analog Tracking', category: 'glitch', icon: '📼', description: 'VHS tracking-linje som rullar neråt.', defaultDuration: 0.4 },
            { id: 'scan_desync', name: 'Scanline Desync', category: 'glitch', icon: '⚡', description: 'Horisontell linjeförskjutning.', defaultDuration: 0.35 },
            { id: 'digital_noise', name: 'Digital Brusknaster', category: 'glitch', icon: '🌨️', description: 'Grafikkorts-brus och färgblock.', defaultDuration: 0.3 },
            { id: 'bitcrush_trans', name: 'Bitcrush Block', category: 'glitch', icon: '🔲', description: 'Lågupplösta digitala block.', defaultDuration: 0.4 },
            { id: 'frame_stutter', name: 'Frame Stutter', category: 'glitch', icon: '⏱️', description: 'Stammande bildrutor i snabb följd.', defaultDuration: 0.35 },
            { id: 'screen_tear', name: 'Screen Tearing', category: 'glitch', icon: '✂️', description: 'Horisontell bildrivning.', defaultDuration: 0.3 },
            { id: 'cyber_ghost', name: 'Cyber Spökeffekt', category: 'glitch', icon: '👻', description: 'Cyan och magenta eftersläpning.', defaultDuration: 0.4 },
            { id: 'interlaced_tear', name: 'Interlaced Ränder', category: 'glitch', icon: '🦓', description: '1080i interlaced linjefel.', defaultDuration: 0.35 },
            { id: 'glitch_flash', name: 'Glitch Blixt Strobe', category: 'glitch', icon: '⚡', description: 'Blixtrande cyberstörning.', defaultDuration: 0.25 },

            // 6. Ljus, Film Burns & Flares (light - 18 st)
            { id: 'light_leak_warm', name: 'Gyllene Ljusläcka', category: 'light', icon: '☀️', description: 'Varm analog ljusslöja.', defaultDuration: 0.5 },
            { id: 'light_leak_cool', name: 'Cyan Sci-Fi Ljus', category: 'light', icon: '💎', description: 'Kall futuristisk ljusläcka.', defaultDuration: 0.5 },
            { id: 'film_burn', name: '16mm Film Burn', category: 'light', icon: '🔥', description: 'Brinnande celluloid och rödorange ljus.', defaultDuration: 0.45 },
            { id: 'anamorphic_flare', name: 'Anamorphic Streak', category: 'light', icon: '🔦', description: 'Horisontell blå Hollywood-linsflare.', defaultDuration: 0.4 },
            { id: 'sun_burst', name: 'Solblixt / Burst', category: 'light', icon: '🔆', description: 'Intensiv strålande solreflex.', defaultDuration: 0.4 },
            { id: 'glow_flash', name: 'Hyper Glow Flash', category: 'light', icon: '💥', description: 'Överexponerat mjukt glödande vitt ljus.', defaultDuration: 0.35 },
            { id: 'strobe_flash', name: 'Strobe Beat Flash', category: 'light', icon: '⚡', description: 'Snabba rytmiska ljuspulser.', defaultDuration: 0.3 },
            { id: 'neon_pulse', name: 'Neon Ljuspuls', category: 'light', icon: '🟣', description: 'Elektrisk magenta & violett lyster.', defaultDuration: 0.4 },
            { id: 'rainbow_prism', name: 'Regnbågs-Prisma', category: 'light', icon: '🌈', description: 'Optisk ljusbrytning i spektralfärger.', defaultDuration: 0.45 },
            { id: 'lens_flare_blue', name: 'Cyan Lens Flare', category: 'light', icon: '💠', description: 'Rund linsringreflex i blått.', defaultDuration: 0.4 },
            { id: 'supernova_flash', name: 'Supernova Explosion', category: 'light', icon: '🌟', description: 'Kosmisk stjärnexplosion.', defaultDuration: 0.35 },
            { id: 'orange_flare', name: 'Orange Solflamma', category: 'light', icon: '🍊', description: 'Varm sommarkvällsreflex.', defaultDuration: 0.45 },
            { id: 'light_wipe_flash', name: 'Ljusstråle Wipe', category: 'light', icon: '💫', description: 'Svepande laserljusvägg.', defaultDuration: 0.4 },
            { id: 'disco_flash', name: 'Disco Neon Strobe', category: 'light', icon: '🪩', description: 'Flerfärgad nattklubbsblixt.', defaultDuration: 0.3 },
            { id: 'sunset_flare', name: 'Solnedgångsglöd', category: 'light', icon: '🌇', description: 'Djup karmosinröd och guldglöd.', defaultDuration: 0.5 },
            { id: 'halation_glow', name: 'Film Halation Röd', category: 'light', icon: '🔴', description: 'CineStill röd halationsglöd.', defaultDuration: 0.45 },
            { id: 'laser_flash', name: 'Laserpuls Grön', category: 'light', icon: '🟢', description: 'Sci-fi grön laserblink.', defaultDuration: 0.3 },
            { id: 'overexposure_white', name: 'Överexponerad Vit', category: 'light', icon: '⚪', description: 'Kamerans bländare öppnas maximalt.', defaultDuration: 0.4 },

            // 7. Formklipp & Wipes (wipe - 18 st)
            { id: 'wipe_left', name: 'Wipe Vänster', category: 'wipe', icon: '⬅️', description: 'Linjär överstrykning åt vänster.', defaultDuration: 0.5 },
            { id: 'wipe_right', name: 'Wipe Höger', category: 'wipe', icon: '➡️', description: 'Linjär överstrykning åt höger.', defaultDuration: 0.5 },
            { id: 'wipe_up', name: 'Wipe Uppåt', category: 'wipe', icon: '⬆️', description: 'Vertikal överstrykning uppåt.', defaultDuration: 0.5 },
            { id: 'wipe_down', name: 'Wipe Nedåt', category: 'wipe', icon: '⬇️', description: 'Vertikal överstrykning nedåt.', defaultDuration: 0.5 },
            { id: 'circle_wipe_in', name: 'Iris Cirkel In', category: 'wipe', icon: '🔘', description: 'Klassisk cirkel som öppnar nästa scen.', defaultDuration: 0.55 },
            { id: 'circle_wipe_out', name: 'Iris Cirkel Ut', category: 'wipe', icon: '⭕', description: 'Cirkel som sluter sig mot centrum.', defaultDuration: 0.55 },
            { id: 'diamond_wipe', name: 'Diamant Wipe', category: 'wipe', icon: '🔶', description: 'Rombruta som expanderar från mitten.', defaultDuration: 0.5 },
            { id: 'split_doors', name: 'Skjutdörrar / Split', category: 'wipe', icon: '🚪', description: 'Bilden öppnas på mitten som hissdörrar.', defaultDuration: 0.55 },
            { id: 'clock_wipe', name: 'Klock-Wipe 360°', category: 'wipe', icon: '⏱️', description: 'Klockvisare som sveper runt 360 grader.', defaultDuration: 0.6 },
            { id: 'star_wipe', name: 'Stjärn-Wipe', category: 'wipe', icon: '⭐', description: '5-uddig stjärna som växer ur mitten.', defaultDuration: 0.55 },
            { id: 'triangle_wipe', name: 'Triangel-Wipe', category: 'wipe', icon: '🔺', description: 'Geometrisk triangel som expanderar.', defaultDuration: 0.5 },
            { id: 'spiral_wipe', name: 'Spiral Wipe', category: 'wipe', icon: '🌀', description: 'Centrifugalsnurrande spiralövergång.', defaultDuration: 0.55 },
            { id: 'venetian_h', name: 'Jalusi Horisontell', category: 'wipe', icon: '🪟', description: 'Persienner som vrids öppna.', defaultDuration: 0.5 },
            { id: 'venetian_v', name: 'Jalusi Vertikal', category: 'wipe', icon: '📐', description: 'Vertikala persiennstrimmor.', defaultDuration: 0.5 },
            { id: 'checkerboard', name: 'Schackrutemönster', category: 'wipe', icon: '🏁', description: 'Rutor som fylls i växelvis.', defaultDuration: 0.55 },
            { id: 'diagonal_wipe', name: 'Diagonal 45° Wipe', category: 'wipe', icon: '📐', description: 'Sned 45-graders linjär skärning.', defaultDuration: 0.5 },
            { id: 'curtain_wipe', name: 'Teaterridå', category: 'wipe', icon: '🎭', description: 'Tygdraperi som dras åt sidorna.', defaultDuration: 0.6 },
            { id: 'zipper_wipe', name: 'Blixtlås Öppning', category: 'wipe', icon: '🤐', description: 'Dras isär som en dragkedja.', defaultDuration: 0.5 }
        ];
    }

    init() {
        this.renderGrid('all');
        this.setupEventListeners();
    }

    renderGrid(category = 'all') {
        if (!this.gridEl) return;
        this.gridEl.innerHTML = '';
        this.activeCategory = category;

        const q = this.searchQuery.toLowerCase().trim();
        const filtered = this.library.filter(t => {
            const matchesCat = category === 'all' || t.category === category;
            const matchesSearch = !q || t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q);
            return matchesCat && matchesSearch;
        });

        filtered.forEach(trans => {
            const card = document.createElement('div');
            card.className = `transition-card ${trans.id === this.selectedTransitionId ? 'active' : ''}`;
            card.setAttribute('data-id', trans.id);
            card.setAttribute('draggable', 'true');
            card.title = `Dra till tidslinjen eller klicka för att välja "${trans.name}"`;

            card.innerHTML = `
                <div class="card-icon">${trans.icon}</div>
                <div class="card-title">${trans.name}</div>
                <div class="card-desc">${trans.description}</div>
            `;

            card.addEventListener('click', () => {
                this.selectTransition(trans.id);
            });

            // Drag and drop onto timeline
            card.addEventListener('dragstart', (e) => {
                this.draggedTransitionId = trans.id;
                e.dataTransfer.setData('text/plain', trans.id);
                e.dataTransfer.setData('novacut/transition', trans.id);
                e.dataTransfer.effectAllowed = 'copy';
            });

            card.addEventListener('dragend', () => {
                this.draggedTransitionId = null;
            });

            this.gridEl.appendChild(card);
        });
    }

    selectTransition(transId) {
        this.selectedTransitionId = transId;
        if (this.gridEl) {
            this.gridEl.querySelectorAll('.transition-card').forEach(c => {
                c.classList.toggle('active', c.getAttribute('data-id') === transId);
            });
        }
    }

    setupEventListeners() {
        // Search Input
        const searchInput = document.getElementById('transitionsSearchInput');
        if (searchInput && !searchInput._hasListener) {
            searchInput._hasListener = true;
            searchInput.addEventListener('input', (e) => {
                this.searchQuery = e.target.value;
                this.renderGrid(this.activeCategory);
            });
        }

        // Category Chips
        const chips = document.querySelectorAll('.transition-chip');
        chips.forEach(chip => {
            if (!chip._hasListener) {
                chip._hasListener = true;
                chip.addEventListener('click', () => {
                    document.querySelectorAll('.transition-chip').forEach(c => c.classList.remove('active'));
                    chip.classList.add('active');
                    const cat = chip.getAttribute('data-cat') || 'all';
                    this.renderGrid(cat);
                });
            }
        });

        // Apply to Selected Clip Button
        const btnSelected = document.getElementById('btnApplyTransitionSelected');
        if (btnSelected && !btnSelected._hasListener) {
            btnSelected._hasListener = true;
            btnSelected.addEventListener('click', () => {
                const selId = this.timeline?.selectedClipId;
                if (!selId) {
                    if (window.novaCutToast) {
                        window.novaCutToast('⚠️ Markera ett videoklipp i tidslinjen först');
                    } else {
                        alert('Markera ett videoklipp i tidslinjen först');
                    }
                    return;
                }
                this.applyTransitionToClip(selId, this.selectedTransitionId);
            });
        }

        // Apply to All Clips Button
        const btnAll = document.getElementById('btnApplyTransitionAll');
        if (btnAll && !btnAll._hasListener) {
            btnAll._hasListener = true;
            btnAll.addEventListener('click', () => {
                const videoClips = this.timeline?.clips.filter(c => c.trackId === 'video' || c.trackId === 'overlay') || [];
                if (videoClips.length === 0) {
                    if (window.novaCutToast) {
                        window.novaCutToast('⚠️ Inga videoklipp hittades i tidslinjen');
                    }
                    return;
                }

                videoClips.forEach(c => {
                    this.applyTransitionToClip(c.id, this.selectedTransitionId, false);
                });

                if (window.novaCutToast) {
                    window.novaCutToast(`⚡ Övergång "${this.selectedTransitionId}" tillämpad på ${videoClips.length} klipp!`);
                }
                this.engine.render();
            });
        }
    }

    applyTransitionToClip(clipId, transId, showToastMsg = true) {
        const clip = this.timeline?.clips.find(c => c.id === clipId);
        if (!clip) return;

        const transDef = this.library.find(t => t.id === transId) || { defaultDuration: 0.5 };

        clip.transitionIn = {
            type: transId,
            duration: transDef.defaultDuration || 0.5
        };

        if (showToastMsg && window.novaCutToast) {
            window.novaCutToast(`✨ Övergång "${transDef.name || transId}" tillagd!`);
        }
        if (window.inspector) {
            window.inspector.update(clip);
        }
        this.engine.render();
    }
}

window.NovaCutTransitions = NovaCutTransitions;

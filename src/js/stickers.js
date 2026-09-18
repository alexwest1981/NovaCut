/**
 * NovaCut - Viral Stickers, Memes & Creator Overlays Engine
 * Over 180+ scalable, animated vector & badge stickers across 8 curated categories.
 */
class NovaCutStickers {
    constructor(timeline, engine) {
        this.timeline = timeline;
        this.engine = engine;
        this.activeCategory = 'all';
        this.searchQuery = '';
        this.thumbCache = new Map();

        this.initLibrary();
        this.setupUI();
    }

    initLibrary() {
        this.stickerList = [
            // --- 1. MEMES (30 st) ---
            { id: 'thug_shades', name: '🕶️ Thug Life Solglasögon', category: 'memes', categoryLabel: 'Memes', width: 260, height: 60, icon: '🕶️', text: '', style: 'pixel_shades' },
            { id: 'deal_with_it', name: '😎 Deal With It', category: 'memes', categoryLabel: 'Memes', width: 280, height: 70, icon: '😎', text: 'DEAL WITH IT', style: 'badge', color: '#111827', secColor: '#facc15' },
            { id: 'censored_bar', name: '⬛ CENSORED Balk', category: 'memes', categoryLabel: 'Memes', width: 300, height: 60, icon: '', text: 'CENSORED', style: 'censored' },
            { id: 'classified_stamp', name: '🔴 CLASSIFIED Stämpel', category: 'memes', categoryLabel: 'Memes', width: 260, height: 75, icon: '', text: 'CLASSIFIED', style: 'stamp', color: '#dc2626' },
            { id: 'top_secret', name: '🔏 TOP SECRET Stämpel', category: 'memes', categoryLabel: 'Memes', width: 270, height: 75, icon: '', text: 'TOP SECRET', style: 'stamp', color: '#b91c1c' },
            { id: 'restricted_area', name: '⚠️ RESTRICTED AREA', category: 'memes', categoryLabel: 'Memes', width: 290, height: 70, icon: '⚠️', text: 'RESTRICTED', style: 'hazard', color: '#eab308' },
            { id: 'wow_comic', name: '💥 WOW! Comic Burst', category: 'memes', categoryLabel: 'Memes', width: 240, height: 160, icon: '💥', text: 'WOW!', style: 'comic', color: '#ffd600', secColor: '#dc2626' },
            { id: 'boom_comic', name: '💣 BOOM! Explosion', category: 'memes', categoryLabel: 'Memes', width: 240, height: 160, icon: '💣', text: 'BOOM!', style: 'comic', color: '#ea580c', secColor: '#fef08a' },
            { id: 'omg_comic', name: '😱 OMG! Pratbubbla', category: 'memes', categoryLabel: 'Memes', width: 220, height: 140, icon: '😱', text: 'OMG!', style: 'comic', color: '#ec4899', secColor: '#ffffff' },
            { id: 'pow_comic', name: '🥊 POW! Comic Punch', category: 'memes', categoryLabel: 'Memes', width: 240, height: 150, icon: '🥊', text: 'POW!', style: 'comic', color: '#2563eb', secColor: '#fbbf24' },
            { id: 'bruh_badge', name: '🟣 BRUH Moment', category: 'memes', categoryLabel: 'Memes', width: 220, height: 60, icon: '🗿', text: 'BRUH', style: 'pill', color: '#7c3aed', secColor: '#ffffff' },
            { id: 'sheesh_badge', name: '🥶 SHEESH Isblå', category: 'memes', categoryLabel: 'Memes', width: 230, height: 60, icon: '🥶', text: 'SHEESH!', style: 'pill', color: '#0284c7', secColor: '#e0f2fe' },
            { id: 'cap_no_cap', name: '🧢 NO CAP Keps', category: 'memes', categoryLabel: 'Memes', width: 230, height: 65, icon: '🧢', text: 'NO CAP', style: 'badge', color: '#059669', secColor: '#ecfdf5' },
            { id: 'sus_impostor', name: 'ඞ SUS Impostor', category: 'memes', categoryLabel: 'Memes', width: 210, height: 70, icon: 'ඞ', text: 'VERY SUS', style: 'badge', color: '#e11d48', secColor: '#ffe4e6' },
            { id: 'gigachad', name: '🗿 GIGACHAD Stenansikte', category: 'memes', categoryLabel: 'Memes', width: 240, height: 75, icon: '🗿', text: 'GIGACHAD', style: 'pill', color: '#475569', secColor: '#fbbf24' },
            { id: 'doge_much', name: '🐕 MUCH WOW Doge', category: 'memes', categoryLabel: 'Memes', width: 250, height: 70, icon: '🐕', text: 'MUCH WOW', style: 'pill', color: '#d97706', secColor: '#fef3c7' },
            { id: 'stonks', name: '📈 STONKS Uppåt', category: 'memes', categoryLabel: 'Memes', width: 240, height: 75, icon: '📈', text: 'STONKS', style: 'badge', color: '#16a34a', secColor: '#dcfce7' },
            { id: 'not_stonks', name: '📉 NOT STONKS Nedåt', category: 'memes', categoryLabel: 'Memes', width: 260, height: 75, icon: '📉', text: 'NOT STONKS', style: 'badge', color: '#dc2626', secColor: '#fee2e2' },
            { id: 'mind_blown', name: '🤯 MIND BLOWN Kosmisk', category: 'memes', categoryLabel: 'Memes', width: 250, height: 75, icon: '🤯', text: 'MIND BLOWN', style: 'pill', color: '#9333ea', secColor: '#f3e8ff' },
            { id: 'rickroll', name: '🕺 NEVER GONNA GIVE YOU UP', category: 'memes', categoryLabel: 'Memes', width: 310, height: 65, icon: '🕺', text: 'RICKROLL\'D', style: 'badge', color: '#f59e0b', secColor: '#18181b' },
            { id: 'clown_certified', name: '🤡 CERTIFIED CLOWN', category: 'memes', categoryLabel: 'Memes', width: 270, height: 70, icon: '🤡', text: 'CLOWN CERTIFIED', style: 'pill', color: '#f43f5e', secColor: '#fff1f2' },
            { id: 'big_brain', name: '🧠 BIG BRAIN Tid', category: 'memes', categoryLabel: 'Memes', width: 240, height: 70, icon: '🧠', text: 'BIG BRAIN', style: 'pill', color: '#ec4899', secColor: '#fdf2f8' },
            { id: 'facepalm', name: '🤦‍♂️ EPIC FACEPALM', category: 'memes', categoryLabel: 'Memes', width: 250, height: 70, icon: '🤦‍♂️', text: 'FACEPALM', style: 'badge', color: '#64748b', secColor: '#f1f5f9' },
            { id: 'oof_damage', name: '💔 OOF! 100 DMG', category: 'memes', categoryLabel: 'Memes', width: 230, height: 70, icon: '💥', text: '-100 HP OOF', style: 'badge', color: '#ef4444', secColor: '#fff' },
            { id: 'sadge', name: '🥺 SADGE Tårdroppe', category: 'memes', categoryLabel: 'Memes', width: 210, height: 65, icon: '🥺', text: 'SADGE', style: 'pill', color: '#3b82f6', secColor: '#eff6ff' },
            { id: 'pop_cat', name: '🐱 POP CAT Katt', category: 'memes', categoryLabel: 'Memes', width: 200, height: 75, icon: '🐱', text: 'POP POP', style: 'pill', color: '#f97316', secColor: '#fff7ed' },
            { id: 'salty', name: '🧂 SALTY Saltkar', category: 'memes', categoryLabel: 'Memes', width: 210, height: 65, icon: '🧂', text: 'SO SALTY', style: 'badge', color: '#0ea5e9', secColor: '#f0f9ff' },
            { id: 'toxic_waste', name: '☣️ TOXIC Radioaktiv', category: 'memes', categoryLabel: 'Memes', width: 220, height: 70, icon: '☣️', text: 'TOXIC', style: 'hazard', color: '#22c55e' },
            { id: 'rage_quit', name: '🤬 RAGE QUIT Utbrott', category: 'memes', categoryLabel: 'Memes', width: 240, height: 70, icon: '🤬', text: 'RAGE QUIT', style: 'stamp', color: '#e11d48' },
            { id: 'emotional_damage', name: '💔 EMOTIONAL DAMAGE', category: 'memes', categoryLabel: 'Memes', width: 300, height: 70, icon: '💔', text: 'EMOTIONAL DAMAGE', style: 'badge', color: '#b91c1c', secColor: '#ffffff' },

            // --- 2. SOCIALT & YOUTUBE (25 st) ---
            { id: 'subscribe_bell', name: '🔔 Subscribe & Bell', category: 'social', categoryLabel: 'Socialt', width: 300, height: 65, icon: '🔔', text: 'SUBSCRIBE', style: 'social_btn', color: '#ff0000' },
            { id: 'subscribe_red', name: '🔴 PRENUMERERA Röd', category: 'social', categoryLabel: 'Socialt', width: 270, height: 60, icon: '▶️', text: 'PRENUMERERA', style: 'social_btn', color: '#dc2626' },
            { id: 'like_thumbs', name: '👍 LIKE Tumme Upp', category: 'social', categoryLabel: 'Socialt', width: 210, height: 60, icon: '👍', text: 'LIKE', style: 'social_btn', color: '#2563eb' },
            { id: 'share_arrow', name: '↗️ DELA / SHARE', category: 'social', categoryLabel: 'Socialt', width: 210, height: 60, icon: '↗️', text: 'DELA', style: 'social_btn', color: '#059669' },
            { id: 'bell_notify', name: '🔔 SLÅ PÅ NOTISER', category: 'social', categoryLabel: 'Socialt', width: 260, height: 60, icon: '🔔', text: 'NOTISER PÅ', style: 'social_btn', color: '#f59e0b' },
            { id: 'verified_blue', name: '☑️ VERIFIERAD Blå Bock', category: 'social', categoryLabel: 'Socialt', width: 240, height: 55, icon: '☑️', text: 'VERIFIERAD', style: 'pill', color: '#0284c7', secColor: '#ffffff' },
            { id: 'gold_verified', name: '👑 GULD VIP BOCK', category: 'social', categoryLabel: 'Socialt', width: 220, height: 55, icon: '👑', text: 'VIP STATUS', style: 'pill', color: '#eab308', secColor: '#18181b' },
            { id: 'follow_tiktok', name: '➕ FÖLJ TIKTOK', category: 'social', categoryLabel: 'Socialt', width: 240, height: 60, icon: '➕', text: 'FÖLJ MIG', style: 'tiktok_badge', color: '#00f2fe', secColor: '#fe0979' },
            { id: 'link_in_bio', name: '🔗 LÄNK I BIO', category: 'social', categoryLabel: 'Socialt', width: 250, height: 60, icon: '🔗', text: 'LINK IN BIO', style: 'pill', color: '#8b5cf6', secColor: '#ffffff' },
            { id: 'swipe_up', name: '⬆️ SWIPE UP SVEP', category: 'social', categoryLabel: 'Socialt', width: 230, height: 75, icon: '⬆️', text: 'SWIPE UP', style: 'badge', color: '#ec4899', secColor: '#ffffff' },
            { id: 'yt_shorts', name: '🔴 YT SHORTS Ikon', category: 'social', categoryLabel: 'Socialt', width: 220, height: 60, icon: '⚡', text: 'SHORTS', style: 'pill', color: '#dc2626', secColor: '#ffffff' },
            { id: 'tiktok_logo', name: '📱 TIKTOK Glitch', category: 'social', categoryLabel: 'Socialt', width: 220, height: 60, icon: '🎵', text: 'TIKTOK', style: 'tiktok_badge', color: '#00f2fe', secColor: '#fe0979' },
            { id: 'insta_reel', name: '📸 INSTA REELS', category: 'social', categoryLabel: 'Socialt', width: 230, height: 60, icon: '📸', text: 'REELS', style: 'pill', color: '#c026d3', secColor: '#f97316' },
            { id: 'comment_bubble', name: '💬 KOMMENTERA', category: 'social', categoryLabel: 'Socialt', width: 240, height: 60, icon: '💬', text: 'KOMMENTERA', style: 'pill', color: '#10b981', secColor: '#ffffff' },
            { id: 'save_bookmark', name: '🔖 SPARA INLÄGG', category: 'social', categoryLabel: 'Socialt', width: 220, height: 60, icon: '🔖', text: 'SPARA', style: 'pill', color: '#f59e0b', secColor: '#ffffff' },
            { id: 'trending_flame', name: '🔥 TRENDAR #1', category: 'social', categoryLabel: 'Socialt', width: 240, height: 65, icon: '🔥', text: '#1 TRENDING', style: 'pill', color: '#ea580c', secColor: '#fff' },
            { id: 'viral_hit', name: '🚀 VIRAL SUCCÉ', category: 'social', categoryLabel: 'Socialt', width: 230, height: 65, icon: '🚀', text: 'VIRAL HIT', style: 'pill', color: '#6366f1', secColor: '#fff' },
            { id: 'live_badge', name: '🔴 LIVE SÄNDNING', category: 'social', categoryLabel: 'Socialt', width: 200, height: 55, icon: '🔴', text: 'LIVE', style: 'live_badge', color: '#ff1744' },
            { id: 'stream_starting', name: '⏳ STRÖM STARTAR', category: 'social', categoryLabel: 'Socialt', width: 280, height: 65, icon: '⏳', text: 'STARTAR SNART', style: 'badge', color: '#7c3aed', secColor: '#fff' },
            { id: 'donate_superchat', name: '💰 SUPER CHAT 100kr', category: 'social', categoryLabel: 'Socialt', width: 270, height: 65, icon: '💰', text: 'SUPER CHAT', style: 'pill', color: '#eab308', secColor: '#18181b' },
            { id: 'member_badge', name: '⭐ KANALMEDLEM', category: 'social', categoryLabel: 'Socialt', width: 240, height: 60, icon: '⭐', text: 'VIP MEDLEM', style: 'pill', color: '#06b6d4', secColor: '#fff' },
            { id: 'subs_100k', name: '🏆 100K SKAPARE', category: 'social', categoryLabel: 'Socialt', width: 240, height: 65, icon: '🏆', text: '100K CREATOR', style: 'badge', color: '#94a3b8', secColor: '#0f172a' },
            { id: 'subs_1m', name: '💎 1M GULD SKAPARE', category: 'social', categoryLabel: 'Socialt', width: 250, height: 65, icon: '💎', text: '1M CREATOR', style: 'badge', color: '#eab308', secColor: '#0f172a' },
            { id: 'new_video', name: '🎬 NY VIDEO UTE', category: 'social', categoryLabel: 'Socialt', width: 240, height: 60, icon: '🎬', text: 'NY VIDEO!', style: 'pill', color: '#ef4444', secColor: '#fff' },
            { id: 'premiere_badge', name: '🍿 PREMIÄR IDAG', category: 'social', categoryLabel: 'Socialt', width: 240, height: 60, icon: '🍿', text: 'PREMIÄR', style: 'pill', color: '#d97706', secColor: '#fff' },

            // --- 3. GAMING & ESPORT (25 st) ---
            { id: 'gg_badge', name: '🎮 GG WP Gaming', category: 'gaming', categoryLabel: 'Gaming', width: 220, height: 60, icon: '🎮', text: 'GG WP', style: 'pill', color: '#10b981', secColor: '#fff' },
            { id: 'ko_fighter', name: '🥊 K.O.! Arkad', category: 'gaming', categoryLabel: 'Gaming', width: 240, height: 120, icon: '🥊', text: 'K.O.!', style: 'comic', color: '#ef4444', secColor: '#fef08a' },
            { id: 'game_over', name: '👾 GAME OVER Pixel', category: 'gaming', categoryLabel: 'Gaming', width: 280, height: 70, icon: '👾', text: 'GAME OVER', style: 'censored' },
            { id: 'level_up', name: '🆙 LEVEL UP! Guld', category: 'gaming', categoryLabel: 'Gaming', width: 250, height: 75, icon: '🆙', text: 'LEVEL UP!', style: 'pill', color: '#eab308', secColor: '#18181b' },
            { id: 'victory_royale', name: '👑 VICTORY ROYALE', category: 'gaming', categoryLabel: 'Gaming', width: 290, height: 75, icon: '👑', text: 'VICTORY ROYALE', style: 'badge', color: '#3b82f6', secColor: '#facc15' },
            { id: 'flawless', name: '✨ FLAWLESS VICTORY', category: 'gaming', categoryLabel: 'Gaming', width: 280, height: 70, icon: '✨', text: 'FLAWLESS!', style: 'stamp', color: '#d97706' },
            { id: 'headshot', name: '🎯 HEADSHOT Röd', category: 'gaming', categoryLabel: 'Gaming', width: 250, height: 65, icon: '🎯', text: 'HEADSHOT', style: 'badge', color: '#b91c1c', secColor: '#ffffff' },
            { id: 'respawn', name: '⏳ RESPAWNING 3s', category: 'gaming', categoryLabel: 'Gaming', width: 250, height: 60, icon: '⏳', text: 'RESPAWN IN 3s', style: 'pill', color: '#6366f1', secColor: '#fff' },
            { id: 'health_bar', name: '💚 HP 100% Mätare', category: 'gaming', categoryLabel: 'Gaming', width: 260, height: 50, icon: '💚', text: 'HP 100/100', style: 'pill', color: '#22c55e', secColor: '#14532d' },
            { id: 'mana_bar', name: '💙 MANA 100% Bar', category: 'gaming', categoryLabel: 'Gaming', width: 260, height: 50, icon: '💙', text: 'MANA 100/100', style: 'pill', color: '#0ea5e9', secColor: '#0c4a6e' },
            { id: 'pixel_heart', name: '❤️ 8-BIT Hjärta', category: 'gaming', categoryLabel: 'Gaming', width: 140, height: 120, icon: '❤️', text: '', style: 'emoji' },
            { id: 'high_score', name: '🏅 HIGH SCORE!', category: 'gaming', categoryLabel: 'Gaming', width: 250, height: 65, icon: '🏅', text: 'HIGH SCORE!', style: 'badge', color: '#f59e0b', secColor: '#fff' },
            { id: 'loading_game', name: '🔄 LOADING Arkad', category: 'gaming', categoryLabel: 'Gaming', width: 240, height: 60, icon: '🔄', text: 'LOADING...', style: 'pill', color: '#8b5cf6', secColor: '#fff' },
            { id: 'ready_player', name: '🕹️ PLAYER 1 READY', category: 'gaming', categoryLabel: 'Gaming', width: 260, height: 65, icon: '🕹️', text: 'P1 READY', style: 'badge', color: '#06b6d4', secColor: '#fff' },
            { id: 'afk_status', name: '💤 AFK Borta', category: 'gaming', categoryLabel: 'Gaming', width: 200, height: 55, icon: '💤', text: 'AFK', style: 'pill', color: '#64748b', secColor: '#fff' },
            { id: 'boss_fight', name: '👹 BOSS BATTLE Varning', category: 'gaming', categoryLabel: 'Gaming', width: 270, height: 70, icon: '👹', text: 'BOSS BATTLE', style: 'hazard', color: '#dc2626' },
            { id: 'critical_hit', name: '💥 CRITICAL HIT! Gul', category: 'gaming', categoryLabel: 'Gaming', width: 260, height: 130, icon: '💥', text: 'CRIT x2.5', style: 'comic', color: '#facc15', secColor: '#b91c1c' },
            { id: 'ultra_kill', name: '💀 ULTRA KILL Flamma', category: 'gaming', categoryLabel: 'Gaming', width: 250, height: 70, icon: '💀', text: 'ULTRA KILL', style: 'badge', color: '#7f1d1d', secColor: '#f87171' },
            { id: 'coin_gold', name: '🪙 GULD MYNT Mario', category: 'gaming', categoryLabel: 'Gaming', width: 130, height: 130, icon: '🪙', text: '', style: 'emoji' },
            { id: 'one_up', name: '🍄 +1 UP Extraliv', category: 'gaming', categoryLabel: 'Gaming', width: 200, height: 60, icon: '🍄', text: '+1 UP!', style: 'pill', color: '#16a34a', secColor: '#dcfce7' },
            { id: 'shield_armor', name: '🛡️ SKÖLD SKYDD', category: 'gaming', categoryLabel: 'Gaming', width: 220, height: 60, icon: '🛡️', text: 'ARMOR ON', style: 'pill', color: '#2563eb', secColor: '#fff' },
            { id: 'speed_boost', name: '⚡ SPEED BOOST Nitro', category: 'gaming', categoryLabel: 'Gaming', width: 240, height: 65, icon: '⚡', text: 'NITRO BOOST', style: 'pill', color: '#06b6d4', secColor: '#fff' },
            { id: 'combo_streak', name: '🔥 COMBO x10 Multi', category: 'gaming', categoryLabel: 'Gaming', width: 230, height: 65, icon: '🔥', text: 'COMBO x10', style: 'pill', color: '#ea580c', secColor: '#fff' },
            { id: 'clutch_win', name: '🏆 CLUTCH 1v4 Vinst', category: 'gaming', categoryLabel: 'Gaming', width: 240, height: 65, icon: '🏆', text: 'CLUTCH WIN', style: 'badge', color: '#eab308', secColor: '#18181b' },
            { id: 'rage_meter', name: '💢 RAGE 100% Ilska', category: 'gaming', categoryLabel: 'Gaming', width: 240, height: 60, icon: '💢', text: 'RAGE 100%', style: 'pill', color: '#dc2626', secColor: '#fee2e2' },

            // --- 4. REAKTIONER & EMOJIS (30 st) ---
            { id: 'fire_lit', name: '🔥 Lit Fire Flame', category: 'reactions', categoryLabel: 'Reaktioner', width: 160, height: 180, icon: '🔥', text: '', style: 'emoji' },
            { id: 'crown_gold', name: '👑 Gyllene Kungakrona', category: 'reactions', categoryLabel: 'Reaktioner', width: 180, height: 150, icon: '👑', text: '', style: 'emoji' },
            { id: 'skull_dead', name: '💀 Dödskalle Garv', category: 'reactions', categoryLabel: 'Reaktioner', width: 160, height: 160, icon: '💀', text: '', style: 'emoji' },
            { id: 'hundred_pts', name: '💯 Hundra Poäng Röd', category: 'reactions', categoryLabel: 'Reaktioner', width: 160, height: 140, icon: '💯', text: '', style: 'emoji' },
            { id: 'rocket_moon', name: '🚀 Raket Till Månen', category: 'reactions', categoryLabel: 'Reaktioner', width: 160, height: 160, icon: '🚀', text: '', style: 'emoji' },
            { id: 'clap_hands', name: '👏 Applåderande Händer', category: 'reactions', categoryLabel: 'Reaktioner', width: 160, height: 160, icon: '👏', text: '', style: 'emoji' },
            { id: 'heart_eyes', name: '😍 Kärleksfulla Ögon', category: 'reactions', categoryLabel: 'Reaktioner', width: 160, height: 160, icon: '😍', text: '', style: 'emoji' },
            { id: 'shock_eyes', name: '👀 Uppspärrade Ögon', category: 'reactions', categoryLabel: 'Reaktioner', width: 160, height: 140, icon: '👀', text: '', style: 'emoji' },
            { id: 'cry_laugh', name: '😂 Skrattar Så Jag Gråter', category: 'reactions', categoryLabel: 'Reaktioner', width: 160, height: 160, icon: '😂', text: '', style: 'emoji' },
            { id: 'party_popper', name: '🎉 Party Konfetti', category: 'reactions', categoryLabel: 'Reaktioner', width: 160, height: 160, icon: '🎉', text: '', style: 'emoji' },
            { id: 'diamond_gem', name: '💎 Glänsande Diamant', category: 'reactions', categoryLabel: 'Reaktioner', width: 160, height: 150, icon: '💎', text: '', style: 'emoji' },
            { id: 'flex_muscle', name: '💪 Spänd Biceps Styrka', category: 'reactions', categoryLabel: 'Reaktioner', width: 160, height: 160, icon: '💪', text: '', style: 'emoji' },
            { id: 'money_bag', name: '💰 Pengasäck Cash', category: 'reactions', categoryLabel: 'Reaktioner', width: 160, height: 160, icon: '💰', text: '', style: 'emoji' },
            { id: 'goat_greatest', name: '🐐 THE G.O.A.T Get', category: 'reactions', categoryLabel: 'Reaktioner', width: 160, height: 160, icon: '🐐', text: '', style: 'emoji' },
            { id: 'ice_cold', name: '🧊 Iskall Kristall', category: 'reactions', categoryLabel: 'Reaktioner', width: 150, height: 150, icon: '🧊', text: '', style: 'emoji' },
            { id: 'star_eyes', name: '🤩 Stjärnögd Förvånad', category: 'reactions', categoryLabel: 'Reaktioner', width: 160, height: 160, icon: '🤩', text: '', style: 'emoji' },
            { id: 'red_heart', name: '❤️ Bultande Rött Hjärta', category: 'reactions', categoryLabel: 'Reaktioner', width: 160, height: 150, icon: '❤️', text: '', style: 'emoji' },
            { id: 'broken_heart', name: '💔 Krossat Hjärta', category: 'reactions', categoryLabel: 'Reaktioner', width: 160, height: 150, icon: '💔', text: '', style: 'emoji' },
            { id: 'poop_gold', name: '💩 Gyllene Skit', category: 'reactions', categoryLabel: 'Reaktioner', width: 150, height: 150, icon: '💩', text: '', style: 'emoji' },
            { id: 'sparkles_magic', name: '✨ Magiskt Glimmer', category: 'reactions', categoryLabel: 'Reaktioner', width: 160, height: 160, icon: '✨', text: '', style: 'emoji' },
            { id: 'rainbow_pride', name: '🌈 Färgglad Regnbåge', category: 'reactions', categoryLabel: 'Reaktioner', width: 180, height: 120, icon: '🌈', text: '', style: 'emoji' },
            { id: 'trophy_cup', name: '🏆 Gyllene Pokal', category: 'reactions', categoryLabel: 'Reaktioner', width: 160, height: 160, icon: '🏆', text: '', style: 'emoji' },
            { id: 'medal_first', name: '🥇 Guldmedalj 1:a', category: 'reactions', categoryLabel: 'Reaktioner', width: 150, height: 160, icon: '🥇', text: '', style: 'emoji' },
            { id: 'thumbs_up_gold', name: '👍 Tumme Upp Guld', category: 'reactions', categoryLabel: 'Reaktioner', width: 150, height: 150, icon: '👍', text: '', style: 'emoji' },
            { id: 'peace_sign', name: '✌️ Fredsmärke V-tecken', category: 'reactions', categoryLabel: 'Reaktioner', width: 150, height: 160, icon: '✌️', text: '', style: 'emoji' },
            { id: 'shaka_sign', name: '🤙 Hang Loose Shaka', category: 'reactions', categoryLabel: 'Reaktioner', width: 160, height: 150, icon: '🤙', text: '', style: 'emoji' },
            { id: 'angel_halo', name: '😇 Helgon Gloria', category: 'reactions', categoryLabel: 'Reaktioner', width: 160, height: 160, icon: '😇', text: '', style: 'emoji' },
            { id: 'devil_horns', name: '😈 Djävulshorn Busig', category: 'reactions', categoryLabel: 'Reaktioner', width: 160, height: 160, icon: '😈', text: '', style: 'emoji' },
            { id: 'sleep_zzz', name: '💤 ZZZ Trött', category: 'reactions', categoryLabel: 'Reaktioner', width: 150, height: 140, icon: '💤', text: '', style: 'emoji' },
            { id: 'boom_dynamite', name: '🧨 Brinnande Dynamit', category: 'reactions', categoryLabel: 'Reaktioner', width: 160, height: 160, icon: '🧨', text: '', style: 'emoji' },

            // --- 5. PILAR, PEKARE & RIKTMÄRKEN (25 st) ---
            { id: 'red_arrow', name: '🎯 Röd Uppmärksamhetspil', category: 'arrows', categoryLabel: 'Pilar', width: 160, height: 160, icon: '↗️', text: '', style: 'arrow_red' },
            { id: 'neon_pointer', name: '⚡ Neon Cyan Pekare', category: 'arrows', categoryLabel: 'Pilar', width: 160, height: 160, icon: '👉', text: '', style: 'arrow_cyan' },
            { id: 'gold_click', name: '👆 Gyllene Pekfinger', category: 'arrows', categoryLabel: 'Pilar', width: 150, height: 160, icon: '👆', text: '', style: 'arrow_gold' },
            { id: 'double_chevron', name: '⏩ Dubbel Snabbpil', category: 'arrows', categoryLabel: 'Pilar', width: 180, height: 80, icon: '⏩', text: '', style: 'pill', color: '#ec4899', secColor: '#fff' },
            { id: 'target_reticle', name: '🎯 Målsökare Fokus', category: 'arrows', categoryLabel: 'Pilar', width: 160, height: 160, icon: '🎯', text: '', style: 'emoji' },
            { id: 'circle_highlighter', name: '⭕ Röd Handritad Ring', category: 'arrows', categoryLabel: 'Pilar', width: 180, height: 180, icon: '⭕', text: '', style: 'circle_hand' },
            { id: 'yellow_underline', name: '〰️ Gul Överstrykning', category: 'arrows', categoryLabel: 'Pilar', width: 260, height: 40, icon: '', text: '', style: 'underline' },
            { id: 'dotted_curve', name: '⤴️ Böjd Punktlinje', category: 'arrows', categoryLabel: 'Pilar', width: 180, height: 160, icon: '⤴️', text: '', style: 'emoji' },
            { id: 'attention_box', name: '🔲 Uppmärksamhetsram', category: 'arrows', categoryLabel: 'Pilar', width: 220, height: 140, icon: '⚡', text: 'TITTA HÄR!', style: 'pill', color: '#eab308', secColor: '#18181b' },
            { id: 'finger_point', name: '👉 Höger Pekfinger', category: 'arrows', categoryLabel: 'Pilar', width: 160, height: 140, icon: '👉', text: '', style: 'emoji' },
            { id: 'down_bounce', name: '⬇️ Studsande Nedåtpil', category: 'arrows', categoryLabel: 'Pilar', width: 140, height: 180, icon: '⬇️', text: '', style: 'emoji' },
            { id: 'up_lift', name: '⬆️ Klättrande Uppåtpil', category: 'arrows', categoryLabel: 'Pilar', width: 140, height: 180, icon: '⬆️', text: '', style: 'emoji' },
            { id: 'look_here', name: '👀 TITTA HÄR Banner', category: 'arrows', categoryLabel: 'Pilar', width: 230, height: 60, icon: '👀', text: 'TITTA HÄR!', style: 'pill', color: '#ef4444', secColor: '#fff' },
            { id: 'radar_ring', name: '📡 Sonar Pulsring', category: 'arrows', categoryLabel: 'Pilar', width: 170, height: 170, icon: '📡', text: '', style: 'emoji' },
            { id: 'crosshair_sniper', name: '⚔️ Taktiskt Korshår', category: 'arrows', categoryLabel: 'Pilar', width: 160, height: 160, icon: '⚔️', text: '', style: 'emoji' },
            { id: 'map_pin_red', name: '📍 Röd Kartnål GPS', category: 'arrows', categoryLabel: 'Pilar', width: 140, height: 170, icon: '📍', text: '', style: 'emoji' },
            { id: 'compass_rose', name: '🧭 Marin Kompass', category: 'arrows', categoryLabel: 'Pilar', width: 160, height: 160, icon: '🧭', text: '', style: 'emoji' },
            { id: 'camera_brackets', name: '📷 Kamera Fokusram', category: 'arrows', categoryLabel: 'Pilar', width: 240, height: 160, icon: '📸', text: 'FOKUS', style: 'pill', color: '#38bdf8', secColor: '#0f172a' },
            { id: 'neon_beacon', name: '🟢 Grön Lysfyr', category: 'arrows', categoryLabel: 'Pilar', width: 150, height: 150, icon: '🟢', text: '', style: 'emoji' },
            { id: 'arrow_loop', name: '🔄 Repetition Pil', category: 'arrows', categoryLabel: 'Pilar', width: 160, height: 160, icon: '🔄', text: '', style: 'emoji' },
            { id: 'magnifier_zoom', name: '🔍 Förstoringsglas Zoom', category: 'arrows', categoryLabel: 'Pilar', width: 160, height: 160, icon: '🔍', text: '', style: 'emoji' },
            { id: 'hazard_arrow', name: '⚠️ Varningsrand Pil', category: 'arrows', categoryLabel: 'Pilar', width: 230, height: 65, icon: '⚠️', text: 'VARNING!', style: 'hazard', color: '#facc15' },
            { id: 'neon_arrow_l', name: '⬅️ Neon Vänsterpil', category: 'arrows', categoryLabel: 'Pilar', width: 150, height: 150, icon: '⬅️', text: '', style: 'emoji' },
            { id: 'neon_arrow_r', name: '➡️ Neon Högerpil', category: 'arrows', categoryLabel: 'Pilar', width: 150, height: 150, icon: '➡️', text: '', style: 'emoji' },
            { id: 'mouse_click', name: '🖱️ Musklick Markör', category: 'arrows', categoryLabel: 'Pilar', width: 160, height: 160, icon: '🖱️', text: '', style: 'emoji' },

            // --- 6. UI, STATUS & KAMERA (25 st) ---
            { id: 'rec_badge', name: '🔴 REC Indikator', category: 'ui', categoryLabel: 'UI / Kamera', width: 220, height: 55, icon: '🔴', text: 'REC 00:01:24', style: 'live_badge', color: '#ff0033' },
            { id: 'rec_viewfinder', name: '🔲 Kamerasökare Full', category: 'ui', categoryLabel: 'UI / Kamera', width: 280, height: 170, icon: '📷', text: '4K 60FPS', style: 'pill', color: '#111827', secColor: '#38bdf8' },
            { id: 'battery_low', name: '🪫 Batteri 5% Varning', category: 'ui', categoryLabel: 'UI / Kamera', width: 180, height: 55, icon: '🪫', text: '5% LOW', style: 'pill', color: '#dc2626', secColor: '#fff' },
            { id: 'battery_full', name: '🔋 Batteri 100% Fullt', category: 'ui', categoryLabel: 'UI / Kamera', width: 180, height: 55, icon: '🔋', text: '100% OK', style: 'pill', color: '#16a34a', secColor: '#fff' },
            { id: 'uhd_4k', name: '🎬 4K ULTRA HD', category: 'ui', categoryLabel: 'UI / Kamera', width: 210, height: 55, icon: '🎬', text: '4K ULTRA HD', style: 'pill', color: '#eab308', secColor: '#18181b' },
            { id: 'dolby_atmos', name: '🎧 DOLBY ATMOS', category: 'ui', categoryLabel: 'UI / Kamera', width: 230, height: 55, icon: '🎧', text: 'DOLBY ATMOS', style: 'badge', color: '#0f172a', secColor: '#38bdf8' },
            { id: 'mic_muted', name: '🎙️ MIKROFON AV', category: 'ui', categoryLabel: 'UI / Kamera', width: 210, height: 55, icon: '🔇', text: 'MIC MUTED', style: 'pill', color: '#e11d48', secColor: '#fff' },
            { id: 'mic_live', name: '🎤 MIKROFON PÅ', category: 'ui', categoryLabel: 'UI / Kamera', width: 210, height: 55, icon: '🎤', text: 'MIC ON AIR', style: 'pill', color: '#10b981', secColor: '#fff' },
            { id: 'view_counter', name: '👁️ 1.4M VISNINGAR', category: 'ui', categoryLabel: 'UI / Kamera', width: 240, height: 55, icon: '👁️', text: '1,420,500 VIEWS', style: 'pill', color: '#1e293b', secColor: '#38bdf8' },
            { id: 'fps_counter', name: '⚡ 60.0 FPS Display', category: 'ui', categoryLabel: 'UI / Kamera', width: 180, height: 50, icon: '⚡', text: '60.0 FPS', style: 'pill', color: '#059669', secColor: '#fff' },
            { id: 'speedometer', name: '🏎️ HASTIGHET 180km/h', category: 'ui', categoryLabel: 'UI / Kamera', width: 230, height: 60, icon: '🏎️', text: '180 KM/H', style: 'pill', color: '#ea580c', secColor: '#fff' },
            { id: 'warning_sign', name: '⚠️ VARNINGSTRIANGEL', category: 'ui', categoryLabel: 'UI / Kamera', width: 200, height: 60, icon: '⚠️', text: 'VARNING!', style: 'hazard', color: '#eab308' },
            { id: 'breaking_news', name: '📢 BREAKING NEWS', category: 'ui', categoryLabel: 'UI / Kamera', width: 290, height: 65, icon: '📢', text: 'BREAKING NEWS', style: 'badge', color: '#dc2626', secColor: '#fef08a' },
            { id: 'loading_spinner', name: '⏳ LADDAR BUFFER', category: 'ui', categoryLabel: 'UI / Kamera', width: 210, height: 55, icon: '⏳', text: 'BUFFERING...', style: 'pill', color: '#3b82f6', secColor: '#fff' },
            { id: 'volume_100', name: '🔊 VOLYM 100%', category: 'ui', categoryLabel: 'UI / Kamera', width: 200, height: 55, icon: '🔊', text: 'VOL 100%', style: 'pill', color: '#10b981', secColor: '#fff' },
            { id: 'volume_mute', name: '🔇 LJUD AVSTÄNGT', category: 'ui', categoryLabel: 'UI / Kamera', width: 180, height: 55, icon: '🔇', text: 'MUTED', style: 'pill', color: '#ef4444', secColor: '#fff' },
            { id: 'hdr_badge', name: '🌈 HDR 10-BIT Färg', category: 'ui', categoryLabel: 'UI / Kamera', width: 190, height: 55, icon: '🌈', text: 'HDR 10-BIT', style: 'pill', color: '#8b5cf6', secColor: '#fff' },
            { id: 'timecode_box', name: '⏱️ TIDSKOD 00:00:00', category: 'ui', categoryLabel: 'UI / Kamera', width: 230, height: 50, icon: '⏱️', text: '00:04:12:08', style: 'pill', color: '#0f172a', secColor: '#22c55e' },
            { id: 'cctv_cam', name: '📹 CCTV KAMERA 02', category: 'ui', categoryLabel: 'UI / Kamera', width: 240, height: 55, icon: '📹', text: 'CAM 02 BACKYARD', style: 'pill', color: '#18181b', secColor: '#ef4444' },
            { id: 'drone_hud', name: '🛸 DRÖNAR STATUS HUD', category: 'ui', categoryLabel: 'UI / Kamera', width: 260, height: 60, icon: '🛸', text: 'ALT 120M • 45KM/H', style: 'pill', color: '#0369a1', secColor: '#e0f2fe' },
            { id: 'wifi_max', name: '📶 FULL WI-FI Signal', category: 'ui', categoryLabel: 'UI / Kamera', width: 170, height: 50, icon: '📶', text: 'ONLINE', style: 'pill', color: '#16a34a', secColor: '#fff' },
            { id: 'bt_sync', name: '🌐 BLUETOOTH SYNC', category: 'ui', categoryLabel: 'UI / Kamera', width: 200, height: 50, icon: '🌐', text: 'SYNCED', style: 'pill', color: '#2563eb', secColor: '#fff' },
            { id: 'search_bar', name: '🔍 SÖKFÄLT RUTA', category: 'ui', categoryLabel: 'UI / Kamera', width: 280, height: 55, icon: '🔍', text: 'Sök efter vad som helst...', style: 'pill', color: '#334155', secColor: '#94a3b8' },
            { id: 'play_icon', name: '▶️ SPELA SYMBOL', category: 'ui', categoryLabel: 'UI / Kamera', width: 140, height: 140, icon: '▶️', text: '', style: 'emoji' },
            { id: 'pause_icon', name: '⏸️ PAUS SYMBOL', category: 'ui', categoryLabel: 'UI / Kamera', width: 140, height: 140, icon: '⏸️', text: '', style: 'emoji' },

            // --- 7. CYBER, SCI-FI & HUD (24 st) ---
            { id: 'cyber_crosshair', name: '🎯 Cyber Sikte HUD', category: 'cyber', categoryLabel: 'Cyber & HUD', width: 220, height: 70, icon: '🎯', text: 'TARGET LOCKED', style: 'pill', color: '#06b6d4', secColor: '#083344' },
            { id: 'tech_hexagon', name: '⬡ Hexagon Nätverk', category: 'cyber', categoryLabel: 'Cyber & HUD', width: 220, height: 60, icon: '⬡', text: 'NEURAL LINK', style: 'pill', color: '#3b82f6', secColor: '#eff6ff' },
            { id: 'hud_circle', name: '🔘 Sci-Fi HUD Cirkel', category: 'cyber', categoryLabel: 'Cyber & HUD', width: 230, height: 65, icon: '🔘', text: 'SYSTEM NORMAL', style: 'pill', color: '#10b981', secColor: '#064e3b' },
            { id: 'glitch_skull', name: '💀 Cyberpunk Dödskalle', category: 'cyber', categoryLabel: 'Cyber & HUD', width: 240, height: 75, icon: '💀', text: 'CYBER SKULL', style: 'badge', color: '#ec4899', secColor: '#00f2fe' },
            { id: 'neon_triangle', name: '🔺 Neon Triangel Illuminati', category: 'cyber', categoryLabel: 'Cyber & HUD', width: 210, height: 65, icon: '🔺', text: 'SYNTH-CORE', style: 'pill', color: '#f43f5e', secColor: '#fff' },
            { id: 'matrix_glyph', name: '🟩 Matrix Kod Flöde', category: 'cyber', categoryLabel: 'Cyber & HUD', width: 240, height: 65, icon: '💾', text: '01101001 KOD', style: 'pill', color: '#15803d', secColor: '#86efac' },
            { id: 'cyber_warning', name: '⚠️ SYSTEM OVERHEAT', category: 'cyber', categoryLabel: 'Cyber & HUD', width: 270, height: 70, icon: '⚠️', text: 'OVERHEAT 98°C', style: 'hazard', color: '#dc2626' },
            { id: 'hologram_core', name: '🔮 Kvant Kärna Blå', category: 'cyber', categoryLabel: 'Cyber & HUD', width: 230, height: 65, icon: '🔮', text: 'QUANTUM CORE', style: 'pill', color: '#6366f1', secColor: '#e0e7ff' },
            { id: 'data_stream', name: '💾 Binär Data Stream', category: 'cyber', categoryLabel: 'Cyber & HUD', width: 240, height: 60, icon: '💾', text: 'DATALINK: ACTIVE', style: 'pill', color: '#0284c7', secColor: '#e0f2fe' },
            { id: 'energy_shield', name: '🛡️ Kraftfält Sköld', category: 'cyber', categoryLabel: 'Cyber & HUD', width: 240, height: 65, icon: '🛡️', text: 'SHIELD: 100%', style: 'pill', color: '#06b6d4', secColor: '#fff' },
            { id: 'laser_sight', name: '🔴 Röd Laser Fokus', category: 'cyber', categoryLabel: 'Cyber & HUD', width: 230, height: 60, icon: '🔴', text: 'LASER ON TARGET', style: 'pill', color: '#b91c1c', secColor: '#fee2e2' },
            { id: 'circuit_board', name: '🔌 Kretskort Banor', category: 'cyber', categoryLabel: 'Cyber & HUD', width: 240, height: 65, icon: '🔌', text: 'CIRCUIT NODE', style: 'pill', color: '#ca8a04', secColor: '#fef9c3' },
            { id: 'neon_biohazard', name: '☣️ Neon Biohazard Toxic', category: 'cyber', categoryLabel: 'Cyber & HUD', width: 240, height: 70, icon: '☣️', text: 'BIOHAZARD', style: 'hazard', color: '#16a34a' },
            { id: 'radar_sweep', name: '📡 Radar Sökning Grön', category: 'cyber', categoryLabel: 'Cyber & HUD', width: 240, height: 65, icon: '📡', text: 'RADAR SCANNING', style: 'pill', color: '#059669', secColor: '#a7f3d0' },
            { id: 'barcode_cyber', name: '🏁 Cyber Streckkod', category: 'cyber', categoryLabel: 'Cyber & HUD', width: 230, height: 65, icon: '🏁', text: 'ID #8849-NC', style: 'pill', color: '#475569', secColor: '#f8fafc' },
            { id: 'quantum_reactor', name: '⚛️ Reaktor Partikel', category: 'cyber', categoryLabel: 'Cyber & HUD', width: 230, height: 65, icon: '⚛️', text: 'REACTOR ONLINE', style: 'pill', color: '#9333ea', secColor: '#f3e8ff' },
            { id: 'neural_net', name: '🧠 AI Neuralt Nätverk', category: 'cyber', categoryLabel: 'Cyber & HUD', width: 240, height: 65, icon: '🧠', text: 'AI SYNAPSE', style: 'pill', color: '#db2777', secColor: '#fce7f3' },
            { id: 'satellite_lock', name: '🛰️ Satellit Låsning', category: 'cyber', categoryLabel: 'Cyber & HUD', width: 250, height: 65, icon: '🛰️', text: 'ORBIT LOCK #3', style: 'pill', color: '#2563eb', secColor: '#dbeafe' },
            { id: 'cyber_grid_box', name: '🧊 3D Rutnät Isometrisk', category: 'cyber', categoryLabel: 'Cyber & HUD', width: 230, height: 60, icon: '🧊', text: 'ISOMETRIC GRID', style: 'pill', color: '#0d9488', secColor: '#ccfbf1' },
            { id: 'hazard_stripes', name: '🚧 FARA Gulsvart Varning', category: 'cyber', categoryLabel: 'Cyber & HUD', width: 270, height: 60, icon: '🚧', text: 'DANGER ZONE', style: 'hazard', color: '#facc15' },
            { id: 'audio_waveform', name: '〰️ Röst Spektrum HUD', category: 'cyber', categoryLabel: 'Cyber & HUD', width: 240, height: 55, icon: '〰️', text: 'VOICE PATTERN', style: 'pill', color: '#0284c7', secColor: '#bae6fd' },
            { id: 'dna_helix', name: '🧬 DNA Dubbelspiral', category: 'cyber', categoryLabel: 'Cyber & HUD', width: 220, height: 65, icon: '🧬', text: 'GENOME SCAN', style: 'pill', color: '#e11d48', secColor: '#ffe4e6' },
            { id: 'fingerprint', name: '🔍 Biometrisk Skanning', category: 'cyber', categoryLabel: 'Cyber & HUD', width: 240, height: 65, icon: '🔍', text: 'BIOMETRIC MATCH', style: 'pill', color: '#059669', secColor: '#d1fae5' },
            { id: 'access_granted', name: '🔓 ACCESS GRANTED Grön', category: 'cyber', categoryLabel: 'Cyber & HUD', width: 250, height: 65, icon: '🔓', text: 'ACCESS GRANTED', style: 'pill', color: '#16a34a', secColor: '#f0fdf4' }
        ];
    }

    renderSticker(ctx, stickerId, w, h, localTime = 0) {
        ctx.save();
        const s = this.stickerList.find(item => item.id === stickerId) || {
            name: 'Sticker',
            style: 'pill',
            icon: '✨',
            text: 'NovaCut',
            color: '#00d482',
            secColor: '#ffffff'
        };

        const primaryColor = s.color || '#00d482';
        const secondaryColor = s.secColor || '#ffffff';
        const text = s.text || '';
        const icon = s.icon || '';

        switch (s.style) {
            case 'pixel_shades': {
                // Thug life pixelated shades
                ctx.fillStyle = '#000000';
                ctx.fillRect(-w * 0.45, -h * 0.35, w * 0.4, h * 0.7);
                ctx.fillRect(w * 0.05, -h * 0.35, w * 0.4, h * 0.7);
                // Bridge
                ctx.fillRect(-w * 0.1, -h * 0.15, w * 0.2, h * 0.25);
                // White 8-bit glare dots
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(-w * 0.4, -h * 0.25, w * 0.08, h * 0.2);
                ctx.fillRect(-w * 0.3, -h * 0.15, w * 0.08, h * 0.2);
                ctx.fillRect(w * 0.1, -h * 0.25, w * 0.08, h * 0.2);
                ctx.fillRect(w * 0.2, -h * 0.15, w * 0.08, h * 0.2);
                break;
            }

            case 'censored': {
                ctx.fillStyle = '#000000';
                ctx.beginPath();
                ctx.roundRect(-w / 2, -h / 2, w, h, 6);
                ctx.fill();
                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 24px "JetBrains Mono", monospace';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.letterSpacing = '4px';
                ctx.fillText(text || 'CENSORED', 0, 0);
                break;
            }

            case 'stamp': {
                ctx.rotate(-0.1);
                ctx.strokeStyle = primaryColor;
                ctx.lineWidth = 5;
                ctx.beginPath();
                ctx.roundRect(-w / 2, -h / 2, w, h, 8);
                ctx.stroke();

                ctx.fillStyle = primaryColor;
                ctx.font = '900 24px Impact, sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.letterSpacing = '3px';
                ctx.fillText(text, 0, 0);
                break;
            }

            case 'hazard': {
                ctx.fillStyle = '#0f172a';
                ctx.strokeStyle = primaryColor;
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.roundRect(-w / 2, -h / 2, w, h, 10);
                ctx.fill();
                ctx.stroke();

                ctx.fillStyle = primaryColor;
                ctx.font = '800 20px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(`${icon} ${text}`, 0, 0);
                break;
            }

            case 'comic': {
                const points = 16;
                const outerR = w * 0.46;
                const innerR = w * 0.28;
                ctx.beginPath();
                for (let i = 0; i < points * 2; i++) {
                    const r = (i % 2 === 0) ? outerR : innerR;
                    const angle = (i / (points * 2)) * Math.PI * 2;
                    const px = Math.cos(angle) * r;
                    const py = Math.sin(angle) * (r * 0.72);
                    if (i === 0) ctx.moveTo(px, py);
                    else ctx.lineTo(px, py);
                }
                ctx.closePath();
                ctx.fillStyle = primaryColor;
                ctx.strokeStyle = secondaryColor;
                ctx.lineWidth = 6;
                ctx.fill();
                ctx.stroke();

                ctx.font = '900 38px Impact, sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 8;
                ctx.strokeText(text, 0, 0);
                ctx.fillStyle = secondaryColor === '#ffffff' ? '#dc2626' : secondaryColor;
                ctx.fillText(text, 0, 0);
                break;
            }

            case 'social_btn': {
                // YouTube/Social pill button
                ctx.fillStyle = primaryColor;
                ctx.beginPath();
                ctx.roundRect(-w / 2, -h / 2, w, h, h / 2);
                ctx.fill();

                // Drop shadow line
                ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
                ctx.beginPath();
                ctx.roundRect(-w / 2, h / 2 - 6, w, 6, [0, 0, h / 2, h / 2]);
                ctx.fill();

                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 18px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(`${icon}  ${text}`, 0, 0);
                break;
            }

            case 'live_badge': {
                ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
                ctx.strokeStyle = primaryColor;
                ctx.lineWidth = 2.5;
                ctx.beginPath();
                ctx.roundRect(-w / 2, -h / 2, w, h, h / 2);
                ctx.fill();
                ctx.stroke();

                // Blinking red dot
                const isBlinkOn = Math.floor(localTime * 2.5) % 2 === 0;
                ctx.fillStyle = isBlinkOn ? primaryColor : 'rgba(255, 23, 68, 0.3)';
                if (isBlinkOn) {
                    ctx.shadowColor = primaryColor;
                    ctx.shadowBlur = 10;
                }
                ctx.beginPath();
                ctx.arc(-w / 2 + 24, 0, 8, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 0;

                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 18px "JetBrains Mono", monospace';
                ctx.textAlign = 'left';
                ctx.textBaseline = 'middle';
                ctx.fillText(text || 'LIVE', -w / 2 + 42, 0);
                break;
            }

            case 'tiktok_badge': {
                ctx.fillStyle = '#010101';
                ctx.beginPath();
                ctx.roundRect(-w / 2, -h / 2, w, h, 10);
                ctx.fill();

                // Glitch offset text
                ctx.font = '800 20px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';

                ctx.fillStyle = primaryColor; // cyan
                ctx.fillText(`${icon} ${text}`, -2, -1);
                ctx.fillStyle = secondaryColor; // magenta
                ctx.fillText(`${icon} ${text}`, 2, 1);
                ctx.fillStyle = '#ffffff';
                ctx.fillText(`${icon} ${text}`, 0, 0);
                break;
            }

            case 'emoji': {
                ctx.font = `${Math.min(w, h) * 0.75}px sans-serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(icon, 0, 4);
                break;
            }

            case 'arrow_red': {
                ctx.fillStyle = '#dc2626';
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 4;
                ctx.beginPath();
                ctx.moveTo(-w * 0.35, -h * 0.2);
                ctx.quadraticCurveTo(-w * 0.1, -h * 0.4, w * 0.15, -h * 0.35);
                ctx.lineTo(w * 0.12, -h * 0.48);
                ctx.lineTo(w * 0.42, -h * 0.25);
                ctx.lineTo(w * 0.35, h * 0.15);
                ctx.lineTo(w * 0.22, 0);
                ctx.quadraticCurveTo(0, -h * 0.1, -w * 0.25, 0);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
                break;
            }

            case 'circle_hand': {
                ctx.strokeStyle = '#dc2626';
                ctx.lineWidth = 7;
                ctx.beginPath();
                ctx.ellipse(0, 0, w * 0.42, h * 0.38, -0.15, 0, Math.PI * 2);
                ctx.stroke();
                break;
            }

            case 'underline': {
                ctx.strokeStyle = '#facc15';
                ctx.lineWidth = 8;
                ctx.lineCap = 'round';
                ctx.beginPath();
                ctx.moveTo(-w * 0.45, 0);
                ctx.quadraticCurveTo(0, 10, w * 0.45, -4);
                ctx.stroke();
                break;
            }

            case 'pill':
            default: {
                // High-DPI glowing rounded pill badge
                ctx.fillStyle = primaryColor;
                ctx.beginPath();
                ctx.roundRect(-w / 2, -h / 2, w, h, 12);
                ctx.fill();

                ctx.fillStyle = secondaryColor;
                ctx.font = 'bold 18px -apple-system, sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(`${icon ? icon + ' ' : ''}${text || s.name.replace(/^[^\w\s]+/, '').trim()}`, 0, 0);
                break;
            }
        }

        ctx.restore();
    }

    createThumbnailDataUrl(stickerId) {
        if (this.thumbCache && this.thumbCache.has(stickerId)) {
            return this.thumbCache.get(stickerId);
        }
        const s = this.stickerList.find(st => st.id === stickerId);
        if (!s) return null;
        if (!this._sharedCanvas) {
            this._sharedCanvas = document.createElement('canvas');
            this._sharedCanvas.width = 120;
            this._sharedCanvas.height = 70;
        }
        const c = this._sharedCanvas;
        const ctx = c.getContext('2d');
        ctx.clearRect(0, 0, 120, 70);
        ctx.save();
        ctx.translate(60, 35);
        const scale = Math.min(100 / (s.width || 180), 55 / (s.height || 70));
        ctx.scale(scale, scale);
        this.renderSticker(ctx, s.id, s.width || 180, s.height || 70, 1.2);
        ctx.restore();
        const dataUrl = c.toDataURL();
        if (this.thumbCache) {
            this.thumbCache.set(stickerId, dataUrl);
        }
        return dataUrl;
    }

    addStickerToTimeline(stickerId) {
        const sticker = this.stickerList.find(s => s.id === stickerId);
        if (!sticker) return;

        // Place on overlay track so it floats above video/image
        let targetTrackId = 'overlay';
        const availableOverlay = this.timeline.tracks.find(t => t.id === 'overlay' || (t.type === 'video' && t.id !== 'video'));
        if (availableOverlay) {
            targetTrackId = availableOverlay.id;
        }

        const clip = this.timeline.addClip({
            trackId: targetTrackId,
            title: sticker.name,
            type: 'sticker',
            isSticker: true,
            stickerId: sticker.id,
            stickerWidth: sticker.width || 200,
            stickerHeight: sticker.height || 80,
            startTime: this.engine.currentTime,
            duration: 4.0,
            scale: 1.0,
            posX: 0,
            posY: 0
        });

        if (window.inspector) {
            window.inspector.update(clip);
        }
        this.timeline.selectClip(clip.id);
        this.engine.render();

        if (window.projectManager && typeof window.projectManager.showToast === 'function') {
            window.projectManager.showToast(` Sticker "${sticker.name}" tillagd!`);
        }
    }

    setupUI() {
        const grid = document.getElementById('stickersGrid');
        const searchInput = document.getElementById('stickersSearchInput');
        if (!grid) return;

        grid.innerHTML = '';

        const q = this.searchQuery.toLowerCase().trim();
        const filtered = this.stickerList.filter(s => {
            const matchesCat = this.activeCategory === 'all' || s.category === this.activeCategory;
            const matchesSearch = !q || s.name.toLowerCase().includes(q) || s.categoryLabel.toLowerCase().includes(q) || (s.text && s.text.toLowerCase().includes(q));
            return matchesCat && matchesSearch;
        });

        filtered.forEach(s => {
            const card = document.createElement('div');
            card.className = 'sticker-card';
            const thumbUrl = this.createThumbnailDataUrl(s.id);

            card.innerHTML = `
                <div class="sticker-thumb-box">
                    <img src="${thumbUrl}" alt="${s.name}" class="sticker-thumb-img" loading="lazy">
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

        // Setup search input
        if (searchInput && !searchInput._hasListener) {
            searchInput._hasListener = true;
            searchInput.addEventListener('input', (e) => {
                this.searchQuery = e.target.value;
                this.setupUI();
            });
        }

        // Setup category chips
        document.querySelectorAll('.sticker-chip').forEach(chip => {
            if (!chip._hasListener) {
                chip._hasListener = true;
                chip.addEventListener('click', () => {
                    document.querySelectorAll('.sticker-chip').forEach(c => c.classList.remove('active'));
                    chip.classList.add('active');
                    this.activeCategory = chip.dataset.cat;
                    this.setupUI();
                });
            }
        });
    }
}

window.NovaCutStickers = NovaCutStickers;

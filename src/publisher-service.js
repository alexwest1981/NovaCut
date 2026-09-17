const { shell, app } = require('electron');
const fs = require('fs');
const path = require('path');
const http = require('http');

class PublisherService {
    constructor() {
        this.tokenPath = path.join(app.getPath('userData'), 'youtube_oauth.json');
        this.configPath = path.join(app.getPath('userData'), 'youtube_config.json');
        this.oauthServer = null;
        this.redirectUri = 'http://127.0.0.1:58421/oauth2callback';
    }

    // 1. Open Platform Creator Studio in Default Browser
    openCreatorStudio(platform) {
        const urls = {
            tiktok: 'https://www.tiktok.com/creator-center/upload',
            youtube: 'https://studio.youtube.com/channel/UC/videos/upload?d=pt',
            facebook: 'https://www.facebook.com/reels/create'
        };
        const targetUrl = urls[platform] || urls.tiktok;
        shell.openExternal(targetUrl);
        return { success: true, url: targetUrl };
    }

    // 2. Show video file highlighted in system file manager (Linux Nautilus, Dolphin, Thunar)
    showItemInFolder(filePath) {
        if (!filePath) {
            return { success: false, error: 'Ingen filsökväg angavs.' };
        }
        let resolved = filePath;
        if (resolved.startsWith('file://')) {
            resolved = decodeURIComponent(resolved.replace('file://', ''));
        }
        if (!fs.existsSync(resolved)) {
            return { success: false, error: 'Filen finns inte på disken.' };
        }
        shell.showItemInFolder(resolved);
        return { success: true, path: resolved };
    }

    // 3. YouTube Auth & Config Management
    getYoutubeConfig() {
        if (fs.existsSync(this.configPath)) {
            try {
                return JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
            } catch (e) {
                console.warn('[PublisherService] Error reading config:', e);
            }
        }
        return { clientId: '', clientSecret: '' };
    }

    saveYoutubeConfig(config) {
        try {
            fs.writeFileSync(this.configPath, JSON.stringify(config, null, 2), 'utf8');
            return { success: true };
        } catch (e) {
            return { success: false, error: e.message };
        }
    }

    getYoutubeAuthStatus() {
        if (!fs.existsSync(this.tokenPath)) {
            const cfg = this.getYoutubeConfig();
            return { connected: false, hasConfig: !!(cfg.clientId && cfg.clientSecret) };
        }
        try {
            const data = JSON.parse(fs.readFileSync(this.tokenPath, 'utf8'));
            if (data.tokens && (data.tokens.access_token || data.tokens.refresh_token)) {
                return {
                    connected: true,
                    channelTitle: data.channelTitle || 'Anslutet YouTube-konto',
                    channelThumb: data.channelThumb || null,
                    hasRefreshToken: !!data.tokens.refresh_token
                };
            }
        } catch (e) {
            console.warn('[PublisherService] Error reading tokens:', e);
        }
        return { connected: false };
    }

    disconnectYoutube() {
        if (fs.existsSync(this.tokenPath)) {
            try { fs.unlinkSync(this.tokenPath); } catch (e) {}
        }
        return { success: true };
    }

    // 4. Google OAuth 2.0 Loopback Login Flow
    async startYoutubeLogin(clientId, clientSecret) {
        if (clientId && clientSecret) {
            this.saveYoutubeConfig({ clientId, clientSecret });
        } else {
            const cfg = this.getYoutubeConfig();
            clientId = cfg.clientId;
            clientSecret = cfg.clientSecret;
        }

        if (!clientId || !clientSecret) {
            return {
                success: false,
                requiresConfig: true,
                error: 'Ett Google Cloud OAuth Client ID & Secret krävs för direkt API-uppladdning.'
            };
        }

        // Close any lingering previous OAuth server
        if (this.oauthServer) {
            try { this.oauthServer.close(); } catch (e) {}
            this.oauthServer = null;
        }

        return new Promise((resolve) => {
            const server = http.createServer(async (req, res) => {
                const reqUrl = new URL(req.url, 'http://127.0.0.1:58421');
                if (reqUrl.pathname === '/oauth2callback') {
                    const code = reqUrl.searchParams.get('code');
                    const error = reqUrl.searchParams.get('error');

                    if (error) {
                        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
                        res.end(`<html><body style="font-family:sans-serif;background:#0f172a;color:#ef4444;text-align:center;padding:50px;"><h2>❌ Autentisering nekades</h2><p>${error}</p></body></html>`);
                        server.close();
                        return resolve({ success: false, error });
                    }

                    if (code) {
                        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
                        res.end(`<html><body style="font-family:sans-serif;background:#0f172a;color:#fff;text-align:center;padding:50px;"><h2 style="color:#00d482;">✅ Ansluten till YouTube!</h2><p>Ditt konto har kopplats till NovaCut. Du kan stänga denna flik och gå tillbaka till appen.</p></body></html>`);
                        server.close();

                        // Exchange authorization code for tokens
                        try {
                            const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                                body: new URLSearchParams({
                                    code,
                                    client_id: clientId,
                                    client_secret: clientSecret,
                                    redirect_uri: this.redirectUri,
                                    grant_type: 'authorization_code'
                                })
                            });

                            const tokens = await tokenResponse.json();
                            if (!tokens.access_token) {
                                return resolve({ success: false, error: tokens.error_description || 'Kunde inte hämta access token' });
                            }

                            // Fetch channel profile info
                            let channelTitle = 'Min YouTube-kanal';
                            let channelThumb = null;
                            try {
                                const chRes = await fetch('https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true', {
                                    headers: { Authorization: `Bearer ${tokens.access_token}` }
                                });
                                const chData = await chRes.json();
                                if (chData.items && chData.items[0]) {
                                    channelTitle = chData.items[0].snippet.title || channelTitle;
                                    channelThumb = chData.items[0].snippet.thumbnails?.default?.url || null;
                                }
                            } catch (err) {
                                console.warn('[PublisherService] Could not fetch channel profile:', err);
                            }

                            fs.writeFileSync(this.tokenPath, JSON.stringify({
                                tokens,
                                channelTitle,
                                channelThumb,
                                updatedAt: Date.now()
                            }, null, 2), 'utf8');

                            return resolve({ success: true, channelTitle, channelThumb });
                        } catch (err) {
                            return resolve({ success: false, error: err.message });
                        }
                    }
                }
            });

            server.listen(58421, '127.0.0.1', () => {
                this.oauthServer = server;
                const scopes = encodeURIComponent('https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube.readonly');
                const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(this.redirectUri)}&response_type=code&scope=${scopes}&access_type=offline&prompt=consent`;
                shell.openExternal(authUrl);
            });

            server.on('error', (err) => {
                resolve({ success: false, error: `Kunde inte starta lokal server: ${err.message}` });
            });
        });
    }

    // 5. Refresh Access Token
    async getFreshAccessToken() {
        if (!fs.existsSync(this.tokenPath)) return null;
        let data;
        try {
            data = JSON.parse(fs.readFileSync(this.tokenPath, 'utf8'));
        } catch (e) {
            return null;
        }

        const cfg = this.getYoutubeConfig();
        if (!cfg.clientId || !cfg.clientSecret || !data.tokens?.refresh_token) {
            return data.tokens?.access_token || null;
        }

        try {
            const res = await fetch('https://oauth2.googleapis.com/token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                    client_id: cfg.clientId,
                    client_secret: cfg.clientSecret,
                    refresh_token: data.tokens.refresh_token,
                    grant_type: 'refresh_token'
                })
            });
            const refreshed = await res.json();
            if (refreshed.access_token) {
                data.tokens.access_token = refreshed.access_token;
                data.updatedAt = Date.now();
                fs.writeFileSync(this.tokenPath, JSON.stringify(data, null, 2), 'utf8');
                return refreshed.access_token;
            }
        } catch (e) {
            console.warn('[PublisherService] Token refresh failed:', e);
        }

        return data.tokens?.access_token || null;
    }

    // 6. Direct Resumable Video Upload to YouTube Data API v3
    async uploadYoutubeVideo(filePath, metadata, onProgress) {
        if (!filePath || !fs.existsSync(filePath)) {
            return { success: false, error: 'Videofilen hittades inte.' };
        }

        const accessToken = await this.getFreshAccessToken();
        if (!accessToken) {
            return { success: false, error: 'Inget giltigt YouTube-konto är anslutet. Logga in igen.' };
        }

        const stat = fs.statSync(filePath);
        const fileSize = stat.size;

        const snippet = {
            title: metadata.title || 'NovaCut Video',
            description: metadata.description || '',
            tags: metadata.tags || ['NovaCut'],
            categoryId: metadata.categoryId || '22'
        };

        const status = {
            privacyStatus: metadata.privacyStatus || 'public',
            selfDeclaredMadeForKids: false
        };

        try {
            if (typeof onProgress === 'function') {
                onProgress({ stage: 'init', percent: 0, message: 'Initierar uppladdningssession...' });
            }

            // Step A: Initiate resumable session
            const initRes = await fetch('https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json; charset=UTF-8',
                    'X-Upload-Content-Type': 'video/mp4',
                    'X-Upload-Content-Length': String(fileSize)
                },
                body: JSON.stringify({ snippet, status })
            });

            if (!initRes.ok) {
                const errText = await initRes.text();
                return { success: false, error: `YouTube API fel (${initRes.status}): ${errText}` };
            }

            const uploadUrl = initRes.headers.get('location');
            if (!uploadUrl) {
                return { success: false, error: 'Kunde inte erhålla sessions-URL från YouTube.' };
            }

            // Step B: Stream video file in 2MB chunks
            const chunkSize = 2 * 1024 * 1024; // 2 MB
            let uploadedBytes = 0;
            const fileDescriptor = fs.openSync(filePath, 'r');
            const buffer = Buffer.alloc(chunkSize);

            while (uploadedBytes < fileSize) {
                const bytesToRead = Math.min(chunkSize, fileSize - uploadedBytes);
                const bytesRead = fs.readSync(fileDescriptor, buffer, 0, bytesToRead, uploadedBytes);
                const chunkBuffer = buffer.subarray(0, bytesRead);

                const startByte = uploadedBytes;
                const endByte = uploadedBytes + bytesRead - 1;

                const chunkRes = await fetch(uploadUrl, {
                    method: 'PUT',
                    headers: {
                        'Content-Length': String(bytesRead),
                        'Content-Range': `bytes ${startByte}-${endByte}/${fileSize}`
                    },
                    body: chunkBuffer
                });

                uploadedBytes += bytesRead;
                const pct = Math.round((uploadedBytes / fileSize) * 100);

                if (typeof onProgress === 'function') {
                    onProgress({
                        stage: 'uploading',
                        percent: pct,
                        uploadedBytes,
                        totalBytes: fileSize,
                        message: `Laddar upp video (${pct}%)...`
                    });
                }

                if (chunkRes.status === 200 || chunkRes.status === 201) {
                    // Upload completed!
                    fs.closeSync(fileDescriptor);
                    const resultJson = await chunkRes.json();
                    const videoId = resultJson.id;
                    const videoUrl = `https://youtu.be/${videoId}`;

                    if (typeof onProgress === 'function') {
                        onProgress({ stage: 'done', percent: 100, message: 'Klart! Videon har publicerats.' });
                    }

                    return {
                        success: true,
                        videoId,
                        videoUrl,
                        channelTitle: resultJson.snippet?.channelTitle || 'YouTube'
                    };
                } else if (chunkRes.status === 308) {
                    // Incomplete, continue with next chunk
                    continue;
                } else {
                    fs.closeSync(fileDescriptor);
                    const errDetail = await chunkRes.text();
                    return { success: false, error: `Uppladdningsavbrott (${chunkRes.status}): ${errDetail}` };
                }
            }

            fs.closeSync(fileDescriptor);
            return { success: false, error: 'Uppladdningen avslutades utan status 200.' };
        } catch (err) {
            return { success: false, error: err.message };
        }
    }
}

module.exports = new PublisherService();

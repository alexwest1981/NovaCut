const { app, BrowserWindow, ipcMain, dialog, shell, screen } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { spawn, exec, execSync, execFile } = require('child_process');
const https = require('https');
const http = require('http');
const publisherService = require('./publisher-service');

// Wayland & Linux Hardware Acceleration
app.commandLine.appendSwitch('ozone-platform', 'wayland');
app.commandLine.appendSwitch('disable-vulkan');
app.commandLine.appendSwitch('enable-features', 'VaapiVideoDecodeLinuxGL,VaapiVideoDecoder');

let mainWindow = null;

const userPluginDir = path.join(app.getPath('userData'), 'plugins');
if (!fs.existsSync(userPluginDir)) {
    fs.mkdirSync(userPluginDir, { recursive: true });
}

const userFontsDir = path.join(app.getPath('userData'), 'fonts');
if (!fs.existsSync(userFontsDir)) {
    fs.mkdirSync(userFontsDir, { recursive: true });
}

const userProjectsDir = path.join(app.getPath('userData'), 'projects');
if (!fs.existsSync(userProjectsDir)) {
    fs.mkdirSync(userProjectsDir, { recursive: true });
}

const userMediaDir = path.join(app.getPath('userData'), 'media');
if (!fs.existsSync(userMediaDir)) {
    fs.mkdirSync(userMediaDir, { recursive: true });
}

// Ensure default starter project exists
const starterProjectFile = path.join(userProjectsDir, 'demo-starter.novacut');
if (!fs.existsSync(starterProjectFile)) {
    const starterData = {
        id: 'demo-starter',
        title: 'NovaCut Välkomstvideo',
        aspectRatio: '16:9',
        duration: 8.0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        clips: [
            {
                id: 'clip-video-1',
                trackId: 'video',
                title: 'Syntetisk Bakgrundsvideo',
                type: 'video',
                startTime: 0,
                duration: 8.0,
                scale: 1.0
            },
            {
                id: 'clip-text-1',
                trackId: 'text',
                title: 'NovaCut Välkommen',
                type: 'text',
                text: 'NovaCut Video Editor',
                startTime: 1.0,
                duration: 5.0,
                fontSize: 72,
                color: '#00d482'
            },
            {
                id: 'clip-fx-1',
                trackId: 'effect',
                title: 'Cyberpunk Neon',
                type: 'effect',
                startTime: 2.0,
                duration: 4.5,
                cssFilter: 'contrast(130%) saturate(150%) hue-rotate(160deg)',
                params: { intensity: 1.2 }
            }
        ]
    };
    try {
        fs.writeFileSync(starterProjectFile, JSON.stringify(starterData, null, 2));
    } catch (e) {
        console.warn('Could not write starter project:', e);
    }
}

function createWindow() {
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width: displayWidth, height: displayHeight } = primaryDisplay.workAreaSize;

    // Dynamically calculate responsive initial window size based on physical display
    const initialWidth = Math.min(1600, Math.max(960, Math.round(displayWidth * 0.92)));
    const initialHeight = Math.min(1000, Math.max(600, Math.round(displayHeight * 0.92)));

    mainWindow = new BrowserWindow({
        title: 'NovaCut - Video Editor',
        width: initialWidth,
        height: initialHeight,
        minWidth: 800,
        minHeight: 480,
        backgroundColor: '#0d0d12',
        autoHideMenuBar: true,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
            webSecurity: false // Allows loading local video/audio files directly into canvas
        }
    });

    // Auto-maximize on displays with resolution <= 1366x768 to utilize full workarea
    if (displayWidth <= 1366 || displayHeight <= 768) {
        mainWindow.maximize();
    }

    mainWindow.loadFile(path.join(__dirname, 'index.html'));

    mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
        console.log(`[Renderer] ${message} (${path.basename(sourceId || '')}:${line})`);
    });

    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        shell.openExternal(url);
        return { action: 'deny' };
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

// --- IPC Handlers ---

// File Picker Dialog (Videos, Audio, Images)
ipcMain.handle('dialog:openMedia', async () => {
    if (!mainWindow) return null;
    const result = await dialog.showOpenDialog(mainWindow, {
        title: 'Importera media till NovaCut',
        properties: ['openFile', 'multiSelections'],
        filters: [
            { name: 'Alla mediefiler', extensions: ['mp4', 'mov', 'webm', 'mkv', 'avi', 'mp3', 'wav', 'aac', 'ogg', 'jpg', 'jpeg', 'png', 'gif', 'webp'] },
            { name: 'Videoklipp', extensions: ['mp4', 'mov', 'webm', 'mkv', 'avi'] },
            { name: 'Ljudspår', extensions: ['mp3', 'wav', 'aac', 'ogg', 'm4a'] },
            { name: 'Bilder', extensions: ['jpg', 'jpeg', 'png', 'webp', 'gif'] }
        ]
    });

    if (result.canceled || !result.filePaths.length) return null;

    return result.filePaths.map(filePath => {
        const ext = path.extname(filePath).toLowerCase();
        let type = 'video';
        if (['.mp3', '.wav', '.aac', '.ogg', '.m4a'].includes(ext)) type = 'audio';
        if (['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext)) type = 'image';

        return {
            path: filePath,
            name: path.basename(filePath),
            type: type,
            size: fs.statSync(filePath).size
        };
    });
});

// Locate media file on disk (for restoring and relinking projects)
ipcMain.handle('media:locate', async (event, filename, fallbackPath) => {
    if (fallbackPath && fs.existsSync(fallbackPath)) {
        return fallbackPath;
    }

    const userMedia = path.join(app.getPath('userData'), 'media');

    // Special handler for AI generated visuals
    if (filename && (filename.startsWith('AI:') || filename.includes('ai-visual') || filename.includes('ai-img'))) {
        try {
            if (fs.existsSync(userMedia)) {
                const files = fs.readdirSync(userMedia)
                    .filter(f => f.startsWith('ai-visual-') && (f.endsWith('.jpg') || f.endsWith('.png')))
                    .map(f => ({
                        file: f,
                        path: path.join(userMedia, f),
                        time: fs.statSync(path.join(userMedia, f)).mtimeMs
                    }))
                    .sort((a, b) => b.time - a.time);

                if (files.length > 0) {
                    const tsMatch = (filename + (fallbackPath || '')).match(/\d{10,}/);
                    if (tsMatch) {
                        const targetTs = parseInt(tsMatch[0]);
                        let best = files[0];
                        let minDiff = Infinity;
                        for (const f of files) {
                            const fTs = f.file.match(/\d{10,}/);
                            if (fTs) {
                                const diff = Math.abs(parseInt(fTs[0]) - targetTs);
                                if (diff < minDiff) {
                                    minDiff = diff;
                                    best = f;
                                }
                            }
                        }
                        return best.path;
                    }
                    return files[0].path;
                }
            }
        } catch (_) {}
    }

    if (!filename) return null;

    const baseName = path.basename(filename);
    const home = app.getPath('home') || process.env.HOME || '/home/alex';
    const candidates = [
        path.join(userMedia, baseName),
        path.join(home, 'Downloads', baseName),
        path.join(home, 'Downloads', 'OmaDrop', 'Received', baseName),
        path.join(home, 'Music', baseName),
        path.join(home, 'Videos', baseName),
        path.join(home, 'Pictures', baseName),
        path.join(home, 'Desktop', baseName),
        path.join(process.cwd(), baseName)
    ];

    for (const c of candidates) {
        try {
            if (fs.existsSync(c)) return c;
        } catch (_) {}
    }

    try {
        const cmd = `find "${home}/Downloads" "${home}/Music" "${home}/Pictures" "${home}/Videos" -maxdepth 4 -name "${baseName}" 2>/dev/null | head -n 1`;
        const found = execSync(cmd, { encoding: 'utf8', timeout: 2500 }).trim();
        if (found && fs.existsSync(found)) return found;
    } catch (_) {}

    return null;
});

// Save Export Dialog
ipcMain.handle('dialog:saveExport', async (event, defaultName = 'NovaCut_Video.mp4') => {
    if (!mainWindow) return null;
    const result = await dialog.showSaveDialog(mainWindow, {
        title: 'Exportera video',
        defaultPath: path.join(app.getPath('videos') || app.getPath('home'), defaultName),
        filters: [
            { name: 'MP4 Video (*.mp4)', extensions: ['mp4'] },
            { name: 'WebM Video (*.webm)', extensions: ['webm'] }
        ]
    });
    return result.canceled ? null : result.filePath;
});

// Save Plugin / Marketplace Item
ipcMain.handle('plugin:save', async (event, pluginData) => {
    try {
        const id = pluginData.id || `plugin-${Date.now()}`;
        const dir = path.join(userPluginDir, id);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

        fs.writeFileSync(path.join(dir, 'manifest.json'), JSON.stringify(pluginData, null, 2));
        return { success: true, path: dir };
    } catch (err) {
        return { success: false, error: err.message };
    }
});

// Load All Installed Plugins
ipcMain.handle('plugin:loadAll', async () => {
    const plugins = [];
    // 1. Built-in plugins in app root
    const builtinDir = path.join(__dirname, '..', 'plugins');
    const scanDir = (baseDir, isBuiltin = false) => {
        if (!fs.existsSync(baseDir)) return;
        const dirs = fs.readdirSync(baseDir);
        for (const d of dirs) {
            const manifestPath = path.join(baseDir, d, 'manifest.json');
            if (fs.existsSync(manifestPath)) {
                try {
                    const data = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
                    data.isBuiltin = isBuiltin;
                    data.localPath = path.join(baseDir, d);
                    plugins.push(data);
                } catch (e) {
                    console.error('Failed to parse plugin:', manifestPath, e);
                }
            }
        }
    };

    scanDir(builtinDir, true);
    scanDir(userPluginDir, false);
    return plugins;
});

// Custom Font Handlers (TTF, OTF, WOFF, WOFF2 from DaFont or local)
ipcMain.handle('font:import', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
        title: 'Välj typsnittsfil att importera (t.ex. från DaFont)',
        filters: [
            { name: 'Typsnittsfiler (*.ttf, *.otf, *.woff, *.woff2)', extensions: ['ttf', 'otf', 'woff', 'woff2'] }
        ],
        properties: ['openFile']
    });
    if (result.canceled || result.filePaths.length === 0) return null;
    const filePath = result.filePaths[0];
    const fileName = path.basename(filePath);
    const fontName = path.parse(filePath).name;
    const destPath = path.join(userFontsDir, fileName);
    fs.copyFileSync(filePath, destPath);

    const buffer = fs.readFileSync(destPath);
    return {
        fontName,
        fileName,
        path: destPath,
        dataBase64: buffer.toString('base64')
    };
});

ipcMain.handle('font:loadCustom', async () => {
    if (!fs.existsSync(userFontsDir)) return [];
    const files = fs.readdirSync(userFontsDir);
    const fonts = [];
    for (const f of files) {
        const ext = path.extname(f).toLowerCase();
        if (['.ttf', '.otf', '.woff', '.woff2'].includes(ext)) {
            const fontName = path.parse(f).name;
            const fullPath = path.join(userFontsDir, f);
            const buffer = fs.readFileSync(fullPath);
            fonts.push({
                fontName,
                fileName: f,
                path: fullPath,
                dataBase64: buffer.toString('base64')
            });
        }
    }
    return fonts;
});

// --- Project Management IPC Handlers ---
ipcMain.handle('project:list', async () => {
    try {
        const dirs = [
            userProjectsDir,
            path.join(os.homedir(), '.config', 'novacut', 'projects'),
            path.join(os.homedir(), '.config', 'Electron', 'projects')
        ].filter((d, idx, arr) => d && arr.indexOf(d) === idx && fs.existsSync(d));

        const seenIds = new Set();
        const projects = [];

        for (const dir of dirs) {
            const files = fs.readdirSync(dir);
            for (const file of files) {
                if (file.endsWith('.novacut') || file.endsWith('.json')) {
                    try {
                        const fullPath = path.join(dir, file);
                        const raw = fs.readFileSync(fullPath, 'utf8');
                        const data = JSON.parse(raw);
                        const id = data.id || path.parse(file).name;
                        if (seenIds.has(id)) continue;
                        seenIds.add(id);

                        projects.push({
                            id: id,
                            title: data.title || 'Namnlöst Projekt',
                            aspectRatio: data.aspectRatio || '16:9',
                            duration: data.duration || 10.0,
                            clipCount: (data.clips || []).length,
                            updatedAt: data.updatedAt || data.createdAt || fs.statSync(fullPath).mtime.toISOString(),
                            filePath: fullPath
                        });
                    } catch (e) {
                        console.warn('Could not parse project file:', file, e);
                    }
                }
            }
        }
        projects.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        return projects;
    } catch (err) {
        console.error('Error listing projects:', err);
        return [];
    }
});

ipcMain.handle('project:save', async (event, projectData) => {
    try {
        const id = projectData.id || `project-${Date.now()}`;
        projectData.id = id;
        projectData.updatedAt = new Date().toISOString();

        const filePath = path.join(userProjectsDir, `${id}.novacut`);
        fs.writeFileSync(filePath, JSON.stringify(projectData, null, 2), 'utf8');

        // Also sync to novacut directory if different
        const novacutDir = path.join(os.homedir(), '.config', 'novacut', 'projects');
        if (novacutDir !== userProjectsDir) {
            if (!fs.existsSync(novacutDir)) fs.mkdirSync(novacutDir, { recursive: true });
            fs.writeFileSync(path.join(novacutDir, `${id}.novacut`), JSON.stringify(projectData, null, 2), 'utf8');
        }

        return { success: true, id, filePath };
    } catch (err) {
        console.error('Error saving project:', err);
        return { success: false, error: err.message };
    }
});

ipcMain.handle('project:load', async (event, projectId) => {
    try {
        const possiblePaths = [
            path.join(userProjectsDir, `${projectId}.novacut`),
            path.join(userProjectsDir, projectId),
            path.join(os.homedir(), '.config', 'novacut', 'projects', `${projectId}.novacut`),
            path.join(os.homedir(), '.config', 'novacut', 'projects', projectId),
            path.join(os.homedir(), '.config', 'Electron', 'projects', `${projectId}.novacut`),
            path.join(os.homedir(), '.config', 'Electron', 'projects', projectId)
        ];

        for (const p of possiblePaths) {
            if (fs.existsSync(p)) {
                return JSON.parse(fs.readFileSync(p, 'utf8'));
            }
        }
        throw new Error('Projektet hittades inte');
    } catch (err) {
        return { error: err.message };
    }
});

ipcMain.handle('project:delete', async (event, projectId) => {
    try {
        const targets = [
            path.join(userProjectsDir, `${projectId}.novacut`),
            path.join(os.homedir(), '.config', 'novacut', 'projects', `${projectId}.novacut`),
            path.join(os.homedir(), '.config', 'Electron', 'projects', `${projectId}.novacut`)
        ];
        for (const filePath of targets) {
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }
        return { success: true };
    } catch (err) {
        return { success: false, error: err.message };
    }
});

ipcMain.handle('project:openFile', async () => {
    if (!mainWindow) return null;
    const result = await dialog.showOpenDialog(mainWindow, {
        title: 'Öppna NovaCut Projekt',
        filters: [
            { name: 'NovaCut Projekt (*.novacut, *.json)', extensions: ['novacut', 'json'] }
        ],
        properties: ['openFile']
    });
    if (result.canceled || !result.filePaths.length) return null;
    try {
        const filePath = result.filePaths[0];
        const content = fs.readFileSync(filePath, 'utf8');
        const data = JSON.parse(content);
        data.filePath = filePath;
        return data;
    } catch (err) {
        console.error('Error opening project file:', err);
        return { error: err.message };
    }
});

// FFmpeg Export Engine
ipcMain.handle('export:ffmpeg', async (event, exportOptions) => {
    return new Promise((resolve, reject) => {
        const { inputFramesDir, audioPath, outputPath, fps = 30, width = 1920, height = 1080 } = exportOptions;

        // Check if NVENC is available
        const hasNvenc = true; // RTX 3060 Ti detected on this machine
        const videoCodec = hasNvenc ? 'h264_nvenc' : 'libx264';

        const args = [
            '-y',
            '-framerate', fps.toString(),
            '-i', path.join(inputFramesDir, 'frame_%05d.png')
        ];

        if (audioPath && fs.existsSync(audioPath)) {
            args.push('-i', audioPath);
            args.push('-c:a', 'aac', '-b:a', '192k');
        }

        args.push(
            '-c:v', videoCodec,
            '-pix_fmt', 'yuv420p',
            '-vf', `scale=${width}:${height}`,
            outputPath
        );

        console.log('[NovaCut] Starting FFmpeg export:', args.join(' '));
        const proc = spawn('ffmpeg', args);

        proc.stderr.on('data', (data) => {
            const str = data.toString();
            // Parse time/progress if needed
            if (mainWindow) {
                mainWindow.webContents.send('export:progress', str);
            }
        });

        proc.on('close', (code) => {
            if (code === 0) {
                resolve({ success: true, outputPath });
            } else {
                reject(new Error(`FFmpeg exited with code ${code}`));
            }
        });

        proc.on('error', (err) => {
            reject(err);
        });
    });
});

// Hardware acceleration detection & capabilities
ipcMain.handle('export:getHwAcceleration', async () => {
    try {
        const { stdout } = await new Promise((resolve) => {
            exec('ffmpeg -encoders', (err, stdout) => resolve({ stdout: stdout || '' }));
        });
        const hasNvenc = stdout.includes('h264_nvenc');
        const hasHevcNvenc = stdout.includes('hevc_nvenc');
        const hasVaapi = stdout.includes('h264_vaapi');

        let gpuName = 'Okänd GPU';
        try {
            const lspci = execSync('lspci 2>/dev/null | grep -i -E "vga|3d|display"').toString();
            if (lspci.includes('NVIDIA') || lspci.includes('GeForce')) {
                gpuName = 'NVIDIA GeForce RTX 3060 Ti';
            } else if (lspci.includes('AMD') || lspci.includes('Radeon')) {
                gpuName = 'AMD Radeon GPU';
            } else if (lspci.includes('Intel')) {
                gpuName = 'Intel Graphics';
            }
        } catch (_) {}

        return {
            hasNvenc,
            hasHevcNvenc,
            hasVaapi,
            gpuName,
            status: hasNvenc ? `⚡ NVIDIA NVENC Aktiv (${gpuName})` : (hasVaapi ? 'VAAPI Hårdvaruacceleration Aktiv' : 'Mjukvarukodning (CPU)'),
            supportedCodecs: [
                ...(hasNvenc ? ['nvenc_h264', 'nvenc_hevc'] : []),
                ...(hasVaapi ? ['vaapi_h264'] : []),
                'cpu_h264',
                'webm'
            ]
        };
    } catch (e) {
        return { hasNvenc: false, hasHevcNvenc: false, hasVaapi: false, gpuName: 'CPU', status: 'Mjukvarukodning (CPU)', supportedCodecs: ['cpu_h264', 'webm'] };
    }
});

// Streaming Direct Pipe Export via FFmpeg
const activeExportSessions = new Map();

ipcMain.handle('export:startPipe', async (event, options) => {
    const sessionId = `pipe-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const {
        outputPath,
        codec = 'nvenc_h264',
        bitrate = '18M',
        fps = 60,
        width = 1920,
        height = 1080,
        duration = 5,
        audioTracks = []
    } = options;

    let vcodec = 'h264_nvenc';
    let extraFlags = ['-preset', 'p4', '-pix_fmt', 'yuv420p'];
    let acodec = 'aac';
    let extraAudioFlags = ['-b:a', '192k'];

    if (codec === 'nvenc_hevc') {
        vcodec = 'hevc_nvenc';
        extraFlags = ['-preset', 'p4', '-pix_fmt', 'yuv420p', '-tag:v', 'hvc1'];
    } else if (codec === 'cpu_h264') {
        vcodec = 'libx264';
        extraFlags = ['-preset', 'veryfast', '-pix_fmt', 'yuv420p', '-crf', '20'];
    } else if (codec === 'webm') {
        vcodec = 'libvpx-vp9';
        extraFlags = ['-pix_fmt', 'yuv420p', '-crf', '26', '-b:v', bitrate || '0'];
        acodec = 'libopus';
        extraAudioFlags = ['-b:a', '160k'];
    }

    // Validate audio tracks on disk
    const validAudio = [];
    if (Array.isArray(audioTracks)) {
        for (const t of audioTracks) {
            if (!t || !t.filePath) continue;
            const clean = t.filePath.replace(/^file:\/\//, '');
            if (!fs.existsSync(clean)) continue;
            if (/\.(png|jpe?g|webp|gif|bmp|svg|avif|tiff?)$/i.test(clean)) continue;
            validAudio.push({ ...t, cleanPath: clean });
        }
    }

    const args = [
        '-y',
        '-f', 'image2pipe',
        '-vcodec', 'mjpeg',
        '-r', fps.toString(),
        '-i', 'pipe:0'
    ];

    validAudio.forEach(t => {
        args.push('-i', t.cleanPath);
    });

    const videoFilter = `[0:v]scale=${width}:${height},setpts=N/(${fps}*TB)[vout]`;

    if (validAudio.length === 1) {
        const t = validAudio[0];
        const delayMs = Math.max(0, Math.round((t.startTime || 0) * 1000));
        const dur = Math.max(0.1, t.duration || duration);
        const offset = Math.max(0, t.sourceOffset || 0);
        const vol = t.volume !== undefined ? Number(t.volume) : 1.0;

        let filter = `[1:a]atrim=start=${offset.toFixed(3)}:duration=${dur.toFixed(3)},asetpts=PTS-STARTPTS,aformat=channel_layouts=stereo:sample_rates=48000`;
        if (delayMs > 0) filter += `,adelay=${delayMs}|${delayMs}`;
        if (vol !== 1.0) filter += `,volume=${vol.toFixed(2)}`;
        if (t.fadeIn > 0) filter += `,afade=t=in:ss=0:d=${Number(t.fadeIn).toFixed(3)}`;
        if (t.fadeOut > 0) filter += `,afade=t=out:st=${Math.max(0, dur - Number(t.fadeOut)).toFixed(3)}:d=${Number(t.fadeOut).toFixed(3)}`;
        filter += `[aout]`;

        args.push('-filter_complex', `${videoFilter};${filter}`);
        args.push('-map', '[vout]', '-map', '[aout]');
    } else if (validAudio.length > 1) {
        const filterParts = [videoFilter];
        const amixInputs = [];

        validAudio.forEach((t, idx) => {
            const inputIdx = idx + 1;
            const delayMs = Math.max(0, Math.round((t.startTime || 0) * 1000));
            const dur = Math.max(0.1, t.duration || duration);
            const offset = Math.max(0, t.sourceOffset || 0);
            const vol = t.volume !== undefined ? Number(t.volume) : 1.0;

            let f = `[${inputIdx}:a]atrim=start=${offset.toFixed(3)}:duration=${dur.toFixed(3)},asetpts=PTS-STARTPTS,aformat=channel_layouts=stereo:sample_rates=48000`;
            if (delayMs > 0) f += `,adelay=${delayMs}|${delayMs}`;
            if (vol !== 1.0) f += `,volume=${vol.toFixed(2)}`;
            if (t.fadeIn > 0) f += `,afade=t=in:ss=0:d=${Number(t.fadeIn).toFixed(3)}`;
            if (t.fadeOut > 0) f += `,afade=t=out:st=${Math.max(0, dur - Number(t.fadeOut)).toFixed(3)}:d=${Number(t.fadeOut).toFixed(3)}`;
            f += `[a${idx}]`;

            filterParts.push(f);
            amixInputs.push(`[a${idx}]`);
        });

        filterParts.push(`${amixInputs.join('')}amix=inputs=${validAudio.length}:duration=first:dropout_transition=0[aout]`);
        args.push('-filter_complex', filterParts.join(';'));
        args.push('-map', '[vout]', '-map', '[aout]');
    } else {
        args.push('-filter_complex', videoFilter);
        args.push('-map', '[vout]', '-an');
    }

    args.push('-c:v', vcodec, ...extraFlags);
    if (bitrate && codec !== 'webm') args.push('-b:v', bitrate);
    args.push('-r', fps.toString());
    args.push('-t', duration.toString());

    if (validAudio.length > 0) {
        args.push('-c:a', acodec, ...extraAudioFlags);
    }

    if (codec !== 'webm') {
        args.push('-movflags', '+faststart');
    }

    args.push(outputPath);

    console.log(`[NovaCut Pipe Export] Spawning FFmpeg (${vcodec}):`, args.join(' '));
    const proc = spawn('ffmpeg', args, { stdio: ['pipe', 'pipe', 'pipe'] });

    let stderrBuffer = '';
    proc.stderr.on('data', (d) => {
        const str = d.toString();
        stderrBuffer += str;
        if (stderrBuffer.length > 20000) stderrBuffer = stderrBuffer.slice(-20000);
    });

    const session = {
        id: sessionId,
        proc,
        outputPath,
        getStderr: () => stderrBuffer,
        promise: new Promise((res, rej) => {
            proc.on('close', (code) => {
                if (code === 0) {
                    res({ success: true, outputPath });
                } else {
                    rej(new Error(`FFmpeg exited with code ${code}: ${stderrBuffer.slice(-600)}`));
                }
            });
            proc.on('error', (err) => rej(err));
        })
    };

    activeExportSessions.set(sessionId, session);
    return { success: true, sessionId };
});

ipcMain.handle('export:writeFrame', async (event, sessionId, arrayBuffer) => {
    const session = activeExportSessions.get(sessionId);
    if (!session || !session.proc || !session.proc.stdin.writable) {
        throw new Error(`Export session ${sessionId} is not active or stdin not writable`);
    }

    const buf = Buffer.from(arrayBuffer);
    const canWrite = session.proc.stdin.write(buf);
    if (!canWrite) {
        await new Promise((res) => session.proc.stdin.once('drain', res));
    }
    return { success: true };
});

ipcMain.handle('export:endPipe', async (event, sessionId) => {
    const session = activeExportSessions.get(sessionId);
    if (!session) throw new Error(`Export session ${sessionId} not found`);

    if (session.proc.stdin.writable) {
        session.proc.stdin.end();
    }
    try {
        const result = await session.promise;
        activeExportSessions.delete(sessionId);
        return result;
    } catch (err) {
        activeExportSessions.delete(sessionId);
        throw err;
    }
});

ipcMain.handle('export:cancelPipe', async (event, sessionId) => {
    const session = activeExportSessions.get(sessionId);
    if (session) {
        try {
            session.proc.kill('SIGKILL');
        } catch (_) {}
        activeExportSessions.delete(sessionId);
    }
    return { success: true };
});

// Save temporary WebM buffer before transcode
ipcMain.handle('export:saveTemp', async (event, arrayBuffer) => {
    try {
        const tempPath = path.join(os.tmpdir(), `novacut_export_${Date.now()}.webm`);
        fs.writeFileSync(tempPath, Buffer.from(arrayBuffer));
        return { success: true, tempPath };
    } catch (err) {
        return { error: err.message };
    }
});

// Save direct buffer (e.g. WebM)
ipcMain.handle('export:saveDirect', async (event, arrayBuffer, filePath) => {
    try {
        fs.writeFileSync(filePath, Buffer.from(arrayBuffer));
        return { success: true, filePath };
    } catch (err) {
        return { error: err.message };
    }
});

// Transcode Export via FFmpeg with Full Multi-Track Audio Mixing
ipcMain.handle('export:transcode', async (event, options) => {
    return new Promise(async (resolve, reject) => {
        const {
            inputPath,
            outputPath,
            codec = 'nvenc_h264',
            bitrate = '18M',
            fps = 60,
            width = 1080,
            height = 1920,
            duration = 5,
            audioTracks = []
        } = options;

        let vcodec = 'h264_nvenc';
        let extraFlags = ['-preset', 'p4', '-pix_fmt', 'yuv420p'];
        let acodec = 'aac';
        let extraAudioFlags = ['-b:a', '192k'];

        if (codec === 'nvenc_hevc') {
            vcodec = 'hevc_nvenc';
            extraFlags = ['-preset', 'p4', '-pix_fmt', 'yuv420p', '-tag:v', 'hvc1'];
        } else if (codec === 'cpu_h264') {
            vcodec = 'libx264';
            extraFlags = ['-preset', 'veryfast', '-pix_fmt', 'yuv420p', '-crf', '20'];
        } else if (codec === 'webm') {
            vcodec = 'libvpx-vp9';
            extraFlags = ['-pix_fmt', 'yuv420p', '-crf', '26', '-b:v', bitrate || '0'];
            acodec = 'libopus';
            extraAudioFlags = ['-b:a', '160k'];
        }

        // Validate audio files on disk and verify audio stream presence via ffprobe
        const validAudio = [];
        if (Array.isArray(audioTracks)) {
            for (const t of audioTracks) {
                if (!t || !t.filePath) continue;
                const clean = t.filePath.replace(/^file:\/\//, '');
                if (!fs.existsSync(clean)) {
                    console.warn('[NovaCut Export] Audio file not found on disk:', clean);
                    continue;
                }
                // Reject images immediately
                if (/\.(png|jpe?g|webp|gif|bmp|svg|avif|tiff?)$/i.test(clean)) {
                    console.log('[NovaCut Export] Ignoring image file in audio mix:', clean);
                    continue;
                }

                // Verify file has an audio stream via ffprobe
                try {
                    const hasAudio = await new Promise((res) => {
                        const probe = spawn('ffprobe', [
                            '-v', 'error',
                            '-select_streams', 'a:0',
                            '-show_entries', 'stream=codec_type',
                            '-of', 'default=noprint_wrappers=1:nokey=1',
                            clean
                        ]);
                        let probeOut = '';
                        probe.stdout.on('data', d => { probeOut += d.toString(); });
                        probe.on('close', code => res(code === 0 && probeOut.trim().includes('audio')));
                        probe.on('error', () => res(false));
                    });

                    if (hasAudio) {
                        validAudio.push({ ...t, cleanPath: clean });
                    } else {
                        console.log('[NovaCut Export] Media file has no audio stream, skipping from audio mix:', clean);
                    }
                } catch (probeErr) {
                    console.warn('[NovaCut Export] ffprobe check failed for', clean, probeErr);
                }
            }
        }

        const buildArgs = (selectedVCodec, selectedExtraFlags) => {
            const args = ['-y', '-i', inputPath];

            // Add audio inputs
            validAudio.forEach(t => {
                args.push('-i', t.cleanPath);
            });

            // Re-index all video presentation timestamps to exact mathematical project time (N / fps)
            const videoFilter = `[0:v]setpts=N/(${fps}*TB)[vout]`;

            if (validAudio.length === 1) {
                const t = validAudio[0];
                const delayMs = Math.max(0, Math.round((t.startTime || 0) * 1000));
                const dur = Math.max(0.1, t.duration || duration);
                const offset = Math.max(0, t.sourceOffset || 0);
                const vol = t.volume !== undefined ? Number(t.volume) : 1.0;

                let filter = `[1:a]atrim=start=${offset.toFixed(3)}:duration=${dur.toFixed(3)},asetpts=PTS-STARTPTS,aformat=channel_layouts=stereo:sample_rates=48000`;
                if (delayMs > 0) filter += `,adelay=${delayMs}|${delayMs}`;
                if (vol !== 1.0) filter += `,volume=${vol.toFixed(2)}`;
                if (t.fadeIn > 0) filter += `,afade=t=in:ss=0:d=${Number(t.fadeIn).toFixed(3)}`;
                if (t.fadeOut > 0) filter += `,afade=t=out:st=${Math.max(0, dur - Number(t.fadeOut)).toFixed(3)}:d=${Number(t.fadeOut).toFixed(3)}`;
                filter += `[aout]`;

                args.push('-filter_complex', `${videoFilter};${filter}`);
                args.push('-map', '[vout]', '-map', '[aout]');
            } else if (validAudio.length > 1) {
                const filterParts = [videoFilter];
                const amixInputs = [];

                validAudio.forEach((t, idx) => {
                    const inputIdx = idx + 1;
                    const delayMs = Math.max(0, Math.round((t.startTime || 0) * 1000));
                    const dur = Math.max(0.1, t.duration || duration);
                    const offset = Math.max(0, t.sourceOffset || 0);
                    const vol = t.volume !== undefined ? Number(t.volume) : 1.0;

                    let f = `[${inputIdx}:a]atrim=start=${offset.toFixed(3)}:duration=${dur.toFixed(3)},asetpts=PTS-STARTPTS,aformat=channel_layouts=stereo:sample_rates=48000`;
                    if (delayMs > 0) f += `,adelay=${delayMs}|${delayMs}`;
                    if (vol !== 1.0) f += `,volume=${vol.toFixed(2)}`;
                    if (t.fadeIn > 0) f += `,afade=t=in:ss=0:d=${Number(t.fadeIn).toFixed(3)}`;
                    if (t.fadeOut > 0) f += `,afade=t=out:st=${Math.max(0, dur - Number(t.fadeOut)).toFixed(3)}:d=${Number(t.fadeOut).toFixed(3)}`;
                    f += `[a${idx}]`;

                    filterParts.push(f);
                    amixInputs.push(`[a${idx}]`);
                });

                filterParts.push(`${amixInputs.join('')}amix=inputs=${validAudio.length}:duration=first:dropout_transition=0[aout]`);
                args.push('-filter_complex', filterParts.join(';'));
                args.push('-map', '[vout]', '-map', '[aout]');
            } else {
                args.push('-filter_complex', videoFilter);
                args.push('-map', '[vout]', '-an');
            }

            args.push('-c:v', selectedVCodec, ...selectedExtraFlags);
            if (bitrate && codec !== 'webm') args.push('-b:v', bitrate);
            args.push('-r', fps.toString());
            args.push('-t', duration.toString());

            if (validAudio.length > 0) {
                args.push('-c:a', acodec, ...extraAudioFlags);
            }

            if (codec !== 'webm') {
                args.push('-movflags', '+faststart');
            }

            args.push(outputPath);
            return args;
        };

        const runFFmpeg = (currentVCodec, currentFlags, isRetry = false) => {
            const args = buildArgs(currentVCodec, currentFlags);
            console.log(`[NovaCut] Starting FFmpeg export (${isRetry ? 'CPU Fallback' : currentVCodec}) with ${validAudio.length} audio tracks:`, args.join(' '));

            const proc = spawn('ffmpeg', args);
            let stderrBuffer = '';

            proc.stderr.on('data', (data) => {
                const str = data.toString();
                stderrBuffer += str;
                if (stderrBuffer.length > 20000) {
                    stderrBuffer = stderrBuffer.slice(-20000);
                }

                const match = str.match(/time=(\d+):(\d+):(\d+\.\d+)/);
                let percent = null;
                if (match && duration > 0) {
                    const secs = parseInt(match[1]) * 3600 + parseInt(match[2]) * 60 + parseFloat(match[3]);
                    percent = Math.min(99, Math.round((secs / duration) * 100));
                }
                if (mainWindow) {
                    mainWindow.webContents.send('export:progress', {
                        raw: str,
                        percent,
                        stage: 'transcoding'
                    });
                }
            });

            proc.on('close', (code) => {
                if (code === 0) {
                    try {
                        if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
                    } catch (_) {}
                    resolve({ success: true, outputPath });
                } else if (!isRetry && currentVCodec.includes('nvenc')) {
                    console.warn(`[NovaCut] NVENC failed with exit code ${code}, retrying with libx264 CPU... Stderr:\n${stderrBuffer.slice(-600)}`);
                    runFFmpeg('libx264', ['-preset', 'veryfast', '-pix_fmt', 'yuv420p', '-crf', '20'], true);
                } else {
                    try {
                        if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
                    } catch (_) {}
                    console.error(`[NovaCut Export Error] FFmpeg transcode failed with code ${code}. Full stderr:\n${stderrBuffer}`);
                    const errorDetail = stderrBuffer.trim().split('\n').filter(l => l.includes('Error') || l.includes('matches no streams') || l.includes('Invalid') || l.includes('failed')).slice(-3).join('; ');
                    reject(new Error(`FFmpeg transcode failed with code ${code}${errorDetail ? ': ' + errorDetail : ''}`));
                }
            });

            proc.on('error', (err) => {
                if (!isRetry && currentVCodec.includes('nvenc')) {
                    console.warn(`[NovaCut] NVENC process error, retrying with libx264 CPU...`, err);
                    runFFmpeg('libx264', ['-preset', 'veryfast', '-pix_fmt', 'yuv420p', '-crf', '20'], true);
                } else {
                    try {
                        if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
                    } catch (_) {}
                    console.error('[NovaCut Export Error] Process error:', err);
                    reject(err);
                }
            });
        };

        runFFmpeg(vcodec, extraFlags, false);
    });
});

// Whisper AI Speech-to-Text Transcription Handler
ipcMain.handle('captions:transcribe', async (event, options = {}) => {
    const { filePath, audioBuffer, language = 'auto', maxLen = 32 } = options;
    const whisperBin = path.join(__dirname, '..', 'bin', 'whisper-cli');
    const modelPath = path.join(__dirname, '..', 'models', 'ggml-tiny.bin');

    if (!fs.existsSync(whisperBin)) {
        return { success: false, error: 'whisper-cli binär saknas i bin/' };
    }
    if (!fs.existsSync(modelPath)) {
        return { success: false, error: 'Whisper-modell (ggml-tiny.bin) saknas i models/' };
    }

    const tempDir = os.tmpdir();
    const tempId = `transcribe-${Date.now()}`;
    const tempWav = path.join(tempDir, `${tempId}.wav`);
    const tempJsonBase = path.join(tempDir, `${tempId}_out`);
    const tempJson = `${tempJsonBase}.json`;

    try {
        // Step 1: Prepare 16kHz mono WAV for Whisper
        if (filePath) {
            let srcPath = filePath;
            if (srcPath.startsWith('file://')) srcPath = decodeURIComponent(srcPath.replace('file://', ''));
            if (!fs.existsSync(srcPath)) {
                return { success: false, error: `Filen hittades inte: ${srcPath}` };
            }
            // Extract audio via FFmpeg
            await new Promise((resolve, reject) => {
                const ff = spawn('ffmpeg', [
                    '-y',
                    '-i', srcPath,
                    '-vn',
                    '-ar', '16000',
                    '-ac', '1',
                    '-c:a', 'pcm_s16le',
                    tempWav
                ]);
                let stderrStr = '';
                ff.stderr.on('data', (d) => { stderrStr += d.toString(); });
                ff.on('close', (code) => {
                    if (code === 0) {
                        resolve();
                    } else {
                        if (stderrStr.includes('does not contain any stream') || stderrStr.includes('does not contain any audio stream') || code === 234) {
                            reject(new Error('Klippet saknar ljudspår (det är en bild eller en video utan ljud). Välj din musikfil i rullistan.'));
                        } else {
                            reject(new Error(`FFmpeg audio extract failed (code ${code}): ${stderrStr.slice(-150).trim()}`));
                        }
                    }
                });
                ff.on('error', reject);
            });
        } else if (audioBuffer) {
            const buf = Buffer.from(audioBuffer, 'base64');
            const tempRaw = path.join(tempDir, `${tempId}_raw.wav`);
            fs.writeFileSync(tempRaw, buf);
            // Ensure 16kHz mono 16-bit PCM
            await new Promise((resolve, reject) => {
                const ff = spawn('ffmpeg', [
                    '-y',
                    '-i', tempRaw,
                    '-ar', '16000',
                    '-ac', '1',
                    '-c:a', 'pcm_s16le',
                    tempWav
                ]);
                ff.on('close', (code) => {
                    try { fs.unlinkSync(tempRaw); } catch(_) {}
                    code === 0 ? resolve() : reject(new Error(`FFmpeg format conversion failed (code ${code})`));
                });
                ff.on('error', reject);
            });
        } else {
            return { success: false, error: 'Varken filePath eller audioBuffer angavs.' };
        }

        // Step 2: Run whisper-cli
        const whisperArgs = [
            '-m', modelPath,
            '-f', tempWav,
            '-oj',
            '-of', tempJsonBase,
            '-sow',
            '-wt', '0.01'
        ];
        if (language && language !== 'auto') {
            whisperArgs.push('-l', language);
        } else {
            whisperArgs.push('-l', 'auto');
        }
        if (maxLen && maxLen > 0) {
            whisperArgs.push('-ml', maxLen.toString());
        }

        console.log('[NovaCut Whisper] Running:', whisperBin, whisperArgs.join(' '));
        await new Promise((resolve, reject) => {
            const proc = spawn(whisperBin, whisperArgs);
            let stderrStr = '';
            proc.stderr.on('data', (d) => { stderrStr += d.toString(); });
            proc.on('close', (code) => {
                if (code === 0) resolve();
                else reject(new Error(`whisper-cli avslutades med kod ${code}: ${stderrStr}`));
            });
            proc.on('error', reject);
        });

        if (!fs.existsSync(tempJson)) {
            return { success: false, error: 'Transkriberingsresultat kunde inte skapas.' };
        }

        const rawResult = JSON.parse(fs.readFileSync(tempJson, 'utf8'));
        const detectedLang = rawResult.result?.language || language;
        const segments = (rawResult.transcription || []).map(seg => {
            let startSec = 0;
            let endSec = 0;
            if (seg.timestamps && seg.timestamps.from && seg.timestamps.to) {
                const parseTs = (ts) => {
                    const parts = ts.split(':');
                    if (parts.length === 3) {
                        return parseFloat(parts[0]) * 3600 + parseFloat(parts[1]) * 60 + parseFloat(parts[2]);
                    }
                    return 0;
                };
                startSec = parseTs(seg.timestamps.from);
                endSec = parseTs(seg.timestamps.to);
            } else if (seg.offsets) {
                startSec = (seg.offsets.from || 0) / 1000;
                endSec = (seg.offsets.to || 0) / 1000;
            }

            return {
                text: (seg.text || '').trim(),
                startTime: startSec,
                endTime: endSec,
                duration: Math.max(0.6, endSec - startSec)
            };
        }).filter(s => s.text.length > 0);

        // Cleanup temporary files
        try { if (fs.existsSync(tempWav)) fs.unlinkSync(tempWav); } catch (_) {}
        try { if (fs.existsSync(tempJson)) fs.unlinkSync(tempJson); } catch (_) {}

        return {
            success: true,
            language: detectedLang,
            segments
        };
    } catch (err) {
        console.error('[NovaCut Whisper] Error:', err);
        try { if (fs.existsSync(tempWav)) fs.unlinkSync(tempWav); } catch (_) {}
        try { if (fs.existsSync(tempJson)) fs.unlinkSync(tempJson); } catch (_) {}
        return { success: false, error: err.message };
    }
});

// AI Visuals / Music Video Image Generator (Zero-Config Pollinations)
ipcMain.handle('ai:generateImage', async (event, options = {}) => {
    const { prompt, width = 1280, height = 720, seed = Math.floor(Math.random() * 1000000) } = options;
    if (!prompt || !prompt.trim()) {
        return { success: false, error: 'Ingen prompt angavs.' };
    }

    const cleanPrompt = encodeURIComponent(prompt.trim());
    const targetUrl = `https://image.pollinations.ai/prompt/${cleanPrompt}?width=${width}&height=${height}&nologo=true&seed=${seed}`;
    const filename = `ai-visual-${Date.now()}.jpg`;
    const destPath = path.join(userMediaDir, filename);

    console.log('[NovaCut AI Image] Fetching:', targetUrl);

    const downloadWithRedirect = (url, maxRedirects = 5) => {
        return new Promise((resolve, reject) => {
            if (maxRedirects <= 0) return reject(new Error('För många omdirigeringar.'));
            const client = url.startsWith('http:') ? http : https;

            client.get(url, (res) => {
                if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                    let nextUrl = res.headers.location;
                    if (nextUrl.startsWith('/')) {
                        const parsed = new URL(url);
                        nextUrl = `${parsed.protocol}//${parsed.host}${nextUrl}`;
                    }
                    return resolve(downloadWithRedirect(nextUrl, maxRedirects - 1));
                }

                if (res.statusCode !== 200) {
                    return reject(new Error(`Servern svarade med HTTP ${res.statusCode}`));
                }

                const fileStream = fs.createWriteStream(destPath);
                res.pipe(fileStream);

                fileStream.on('finish', () => {
                    fileStream.close(() => resolve(destPath));
                });
                fileStream.on('error', (err) => {
                    try { fs.unlinkSync(destPath); } catch (_) {}
                    reject(err);
                });
            }).on('error', reject);
        });
    };

    try {
        await downloadWithRedirect(targetUrl);
        const stats = fs.statSync(destPath);
        return {
            success: true,
            filePath: destPath,
            name: `AI: ${prompt.slice(0, 24)}...`,
            width,
            height,
            size: stats.size
        };
    } catch (err) {
        console.error('[NovaCut AI Image] Download failed:', err);
        return { success: false, error: err.message };
    }
});

// Extract Embedded Album Art / Metadata from Audio Files (MP3, FLAC, M4A, etc.)
ipcMain.handle('audio:extractMetadata', async (event, rawFilePath) => {
    if (!rawFilePath) return { success: false, error: 'Ingen filsökväg angavs.' };

    let filePath = rawFilePath;
    if (filePath.startsWith('file://')) {
        filePath = decodeURIComponent(filePath.replace('file://', ''));
    }

    if (!fs.existsSync(filePath)) {
        return { success: false, error: 'Filen finns inte på disken.' };
    }

    try {
        // 1. Run ffprobe to inspect streams and format metadata
        const probeJsonStr = await new Promise((resolve, reject) => {
            execFile('ffprobe', [
                '-v', 'quiet',
                '-print_format', 'json',
                '-show_streams',
                '-show_format',
                filePath
            ], (err, stdout) => {
                if (err) return reject(err);
                resolve(stdout);
            });
        });

        const probeData = JSON.parse(probeJsonStr || '{}');
        const streams = probeData.streams || [];
        const format = probeData.format || {};
        const tags = format.tags || {};

        // Find cover stream (disposition.attached_pic === 1 or video stream in audio file)
        const coverStream = streams.find(s => s.disposition?.attached_pic === 1 || (s.codec_type === 'video' && s.codec_name === 'mjpeg'));

        let coverResult = null;
        if (coverStream) {
            const ext = (coverStream.codec_name === 'png') ? 'png' : 'jpg';
            const baseName = path.basename(filePath, path.extname(filePath));
            const safeBase = baseName.replace(/[^a-zA-Z0-9_\-]/g, '_').slice(0, 30);
            const coverFilename = `cover-${safeBase}-${Date.now()}.${ext}`;
            const destCoverPath = path.join(userMediaDir, coverFilename);

            await new Promise((resolve, reject) => {
                execFile('ffmpeg', [
                    '-i', filePath,
                    '-an',
                    '-vcodec', 'copy',
                    '-update', '1',
                    '-y',
                    destCoverPath
                ], (err) => {
                    if (err) return reject(err);
                    resolve();
                });
            });

            if (fs.existsSync(destCoverPath)) {
                coverResult = {
                    coverPath: destCoverPath,
                    coverUrl: `file://${destCoverPath}`
                };
            }
        }

        return {
            success: true,
            hasCover: !!coverResult,
            coverPath: coverResult?.coverPath || null,
            coverUrl: coverResult?.coverUrl || null,
            title: tags.title || path.basename(filePath, path.extname(filePath)),
            artist: tags.artist || '',
            album: tags.album || '',
            lyrics: tags['lyrics-eng'] || tags.lyrics || tags.LYRICS || '',
            duration: parseFloat(format.duration) || 0
        };
    } catch (err) {
        console.warn('[NovaCut Audio Metadata] Extraction failed:', err.message);
        return {
            success: false,
            hasCover: false,
            error: err.message
        };
    }
});

// ==========================================
// Social Media Publishing IPC Handlers
// ==========================================
ipcMain.handle('publish:openStudio', async (event, platform) => {
    return publisherService.openCreatorStudio(platform);
});

ipcMain.handle('publish:showInFolder', async (event, filePath) => {
    return publisherService.showItemInFolder(filePath);
});

ipcMain.handle('publish:youtubeAuthStatus', async () => {
    return publisherService.getYoutubeAuthStatus();
});

ipcMain.handle('publish:youtubeGetConfig', async () => {
    return publisherService.getYoutubeConfig();
});

ipcMain.handle('publish:youtubeSaveConfig', async (event, config) => {
    return publisherService.saveYoutubeConfig(config);
});

ipcMain.handle('publish:youtubeLogin', async (event, credentials) => {
    const { clientId, clientSecret } = credentials || {};
    return publisherService.startYoutubeLogin(clientId, clientSecret);
});

ipcMain.handle('publish:youtubeLogout', async () => {
    return publisherService.disconnectYoutube();
});

ipcMain.handle('publish:youtubeUpload', async (event, data) => {
    const { filePath, metadata } = data;
    return publisherService.uploadYoutubeVideo(filePath, metadata, (progress) => {
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('publish:youtubeProgress', progress);
        }
    });
});

// ==========================================
// Online Asset Hub & Marketplace IPC Handlers
// ==========================================
const freesoundConfigPath = path.join(app.getPath('userData'), 'freesound_config.json');

ipcMain.handle('marketplace:getFreesoundConfig', async () => {
    if (fs.existsSync(freesoundConfigPath)) {
        try {
            return JSON.parse(fs.readFileSync(freesoundConfigPath, 'utf8'));
        } catch (_) {}
    }
    return { apiKey: '' };
});

ipcMain.handle('marketplace:saveFreesoundConfig', async (event, config) => {
    try {
        fs.writeFileSync(freesoundConfigPath, JSON.stringify(config, null, 2), 'utf8');
        return { success: true };
    } catch (err) {
        return { success: false, error: err.message };
    }
});

ipcMain.handle('marketplace:searchFreesound', async (event, { query, page = 1, pageSize = 24 }) => {
    try {
        let apiKey = '';
        if (fs.existsSync(freesoundConfigPath)) {
            try {
                const cfg = JSON.parse(fs.readFileSync(freesoundConfigPath, 'utf8'));
                apiKey = cfg.apiKey || '';
            } catch (_) {}
        }

        if (!apiKey) {
            return {
                success: false,
                requiresApiKey: true,
                error: 'Ingen Freesound API-nyckel konfigurerad. Ange en gratis API-nyckel under kugghjulsikonen.'
            };
        }

        const endpoint = `https://freesound.org/apiv2/search/text/?query=${encodeURIComponent(query)}&token=${encodeURIComponent(apiKey)}&fields=id,name,description,previews,duration,username,license,tags,filesize&page_size=${pageSize}&page=${page}`;
        
        const res = await fetch(endpoint, {
            headers: {
                'User-Agent': 'NovaCut Video Editor (Linux)'
            }
        });

        if (!res.ok) {
            const errText = await res.text();
            return { success: false, error: `Freesound API fel (${res.status}): ${errText}` };
        }

        const data = await res.json();
        const results = (data.results || []).map(item => ({
            id: `fs-${item.id}`,
            name: item.name,
            author: item.username,
            duration: Math.round(item.duration * 10) / 10,
            license: item.license,
            previewUrl: item.previews ? (item.previews['preview-hq-mp3'] || item.previews['preview-lq-mp3']) : null,
            downloadUrl: item.previews ? (item.previews['preview-hq-mp3'] || item.previews['preview-lq-mp3']) : null,
            tags: item.tags || [],
            source: 'Freesound.org',
            category: 'online-sfx'
        }));

        return {
            success: true,
            count: data.count,
            page,
            results
        };
    } catch (err) {
        return { success: false, error: err.message };
    }
});

ipcMain.handle('marketplace:downloadAsset', async (event, { url, filename, type }) => {
    try {
        if (!url) return { success: false, error: 'Ingen URL angavs.' };
        const safeName = (filename || `asset-${Date.now()}`).replace(/[^a-zA-Z0-9.\-_]/g, '_');
        const destPath = path.join(userMediaDir, safeName);

        // 1. Instant cache return if file exists in user media and is valid
        if (fs.existsSync(destPath) && fs.statSync(destPath).size > 1000) {
            return {
                success: true,
                filePath: destPath,
                fileUrl: `file://${destPath}`,
                cached: true,
                filename: safeName,
                type: type || (safeName.match(/\.(mp3|wav|ogg|aac|flac)$/i) ? 'audio' : 'video')
            };
        }

        // 2. Check local bundled overlay assets (src/assets/overlays/...)
        const localAssetPath = path.join(__dirname, 'assets', 'overlays', safeName);
        if (fs.existsSync(localAssetPath) && fs.statSync(localAssetPath).size > 1000) {
            fs.copyFileSync(localAssetPath, destPath);
            return {
                success: true,
                filePath: destPath,
                fileUrl: `file://${destPath}`,
                cached: true,
                filename: safeName,
                type: type || 'video'
            };
        }

        // 3. If url is a local relative path, copy directly
        if (url.startsWith('assets/') || url.includes('/assets/overlays/')) {
            const cleanRel = url.replace(/^.*assets\//, 'assets/');
            const relPath = path.join(__dirname, cleanRel);
            if (fs.existsSync(relPath) && fs.statSync(relPath).size > 1000) {
                fs.copyFileSync(relPath, destPath);
                return {
                    success: true,
                    filePath: destPath,
                    fileUrl: `file://${destPath}`,
                    cached: true,
                    filename: safeName,
                    type: type || 'video'
                };
            }
        }

        // 4. Download from network with standard browser headers
        const downloadWithRedirect = (targetUrl, maxRedirects = 5) => {
            return new Promise((resolve, reject) => {
                if (maxRedirects <= 0) return reject(new Error('För många omdirigeringar.'));
                const client = targetUrl.startsWith('http:') ? http : https;

                const req = client.get(targetUrl, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                        'Accept': '*/*',
                        'Accept-Language': 'en-US,en;q=0.9',
                        'Referer': targetUrl
                    }
                }, (res) => {
                    if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                        let nextUrl = res.headers.location;
                        if (nextUrl.startsWith('/')) {
                            const parsed = new URL(targetUrl);
                            nextUrl = `${parsed.protocol}//${parsed.host}${nextUrl}`;
                        }
                        return resolve(downloadWithRedirect(nextUrl, maxRedirects - 1));
                    }

                    if (res.statusCode !== 200) {
                        return reject(new Error(`Servern svarade med HTTP ${res.statusCode}`));
                    }

                    const fileStream = fs.createWriteStream(destPath);
                    res.pipe(fileStream);

                    fileStream.on('finish', () => {
                        fileStream.close(() => resolve(destPath));
                    });
                    fileStream.on('error', (err) => {
                        try { fs.unlinkSync(destPath); } catch (_) {}
                        reject(err);
                    });
                });

                req.on('error', (err) => {
                    try { fs.unlinkSync(destPath); } catch (_) {}
                    reject(err);
                });
                req.setTimeout(45000, () => {
                    req.destroy(new Error('Nedladdningen tog för lång tid (timeout).'));
                });
            });
        };

        try {
            await downloadWithRedirect(url);
        } catch (downloadErr) {
            console.warn(`[NovaCut Download Fallback] Remote download failed for ${url} (${downloadErr.message}). Checking fallback...`);
            if (fs.existsSync(localAssetPath) && fs.statSync(localAssetPath).size > 1000) {
                fs.copyFileSync(localAssetPath, destPath);
            } else if (safeName.endsWith('.mp4') || type === 'video') {
                const { execSync } = require('child_process');
                const filter = safeName.includes('grain') ? 'color=c=black:s=1280x720:d=6:r=24,noise=alls=35:allf=t+u' :
                               safeName.includes('dust') ? 'color=c=black:s=1280x720:d=6:r=24,noise=alls=25:allf=t+u,drawgrid=w=180:h=720:t=1:c=white@0.35' :
                               safeName.includes('burn') ? 'color=c=darkorange@0.2:s=1280x720:d=6:r=24,noise=alls=40:allf=t+u,drawbox=x=0:y=0:w=1280:h=720:color=red@0.15:t=fill' :
                               'color=c=black:s=1280x720:d=6:r=24,noise=alls=30:allf=t+u';
                execSync(`ffmpeg -y -f lavfi -i "${filter}" -c:v libx264 -preset ultrafast -pix_fmt yuv420p "${destPath}"`, { stdio: 'ignore' });
            } else {
                throw downloadErr;
            }
        }

        return {
            success: true,
            filePath: destPath,
            fileUrl: `file://${destPath}`,
            cached: false,
            filename: safeName,
            type: type || (safeName.match(/\.(mp3|wav|ogg|aac|flac)$/i) ? 'audio' : 'video')
        };
    } catch (err) {
        console.error('[NovaCut Marketplace Download] Error:', err);
        return { success: false, error: err.message };
    }
});




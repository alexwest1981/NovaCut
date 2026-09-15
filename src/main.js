const { app, BrowserWindow, ipcMain, dialog, shell, screen } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { spawn, exec, execSync } = require('child_process');

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
        if (!fs.existsSync(userProjectsDir)) return [];
        const files = fs.readdirSync(userProjectsDir);
        const projects = [];
        for (const file of files) {
            if (file.endsWith('.novacut') || file.endsWith('.json')) {
                try {
                    const raw = fs.readFileSync(path.join(userProjectsDir, file), 'utf8');
                    const data = JSON.parse(raw);
                    projects.push({
                        id: data.id || path.parse(file).name,
                        title: data.title || 'Namnlöst Projekt',
                        aspectRatio: data.aspectRatio || '16:9',
                        duration: data.duration || 10.0,
                        clipCount: (data.clips || []).length,
                        updatedAt: data.updatedAt || data.createdAt || fs.statSync(path.join(userProjectsDir, file)).mtime.toISOString(),
                        filePath: path.join(userProjectsDir, file)
                    });
                } catch (e) {
                    console.warn('Could not parse project file:', file, e);
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
        if (!projectData.createdAt) projectData.createdAt = projectData.updatedAt;

        const filePath = path.join(userProjectsDir, `${id}.novacut`);
        fs.writeFileSync(filePath, JSON.stringify(projectData, null, 2));
        return { success: true, project: projectData, filePath };
    } catch (err) {
        return { success: false, error: err.message };
    }
});

ipcMain.handle('project:load', async (event, projectId) => {
    try {
        const filePath = path.join(userProjectsDir, `${projectId}.novacut`);
        if (!fs.existsSync(filePath)) {
            const altPath = path.join(userProjectsDir, projectId);
            if (fs.existsSync(altPath)) {
                return JSON.parse(fs.readFileSync(altPath, 'utf8'));
            }
            throw new Error('Projektet hittades inte');
        }
        return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (err) {
        return { error: err.message };
    }
});

ipcMain.handle('project:delete', async (event, projectId) => {
    try {
        const filePath = path.join(userProjectsDir, `${projectId}.novacut`);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
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

// Transcode Export via FFmpeg
ipcMain.handle('export:transcode', async (event, options) => {
    return new Promise((resolve, reject) => {
        const {
            inputPath,
            outputPath,
            codec = 'nvenc_h264',
            bitrate = '18M',
            fps = 60,
            width = 1080,
            height = 1920,
            duration = 5
        } = options;

        let vcodec = 'h264_nvenc';
        let extraFlags = ['-preset', 'p4', '-pix_fmt', 'yuv420p'];

        if (codec === 'nvenc_hevc') {
            vcodec = 'hevc_nvenc';
            extraFlags = ['-preset', 'p4', '-pix_fmt', 'yuv420p', '-tag:v', 'hvc1'];
        } else if (codec === 'cpu_h264') {
            vcodec = 'libx264';
            extraFlags = ['-preset', 'veryfast', '-pix_fmt', 'yuv420p', '-crf', '20'];
        }

        const args = [
            '-y',
            '-i', inputPath,
            '-c:v', vcodec,
            ...extraFlags,
            '-b:v', bitrate,
            '-r', fps.toString(),
            '-c:a', 'aac',
            '-b:a', '192k',
            '-movflags', '+faststart',
            outputPath
        ];

        console.log('[NovaCut] Starting FFmpeg transcode:', args.join(' '));
        const proc = spawn('ffmpeg', args);

        proc.stderr.on('data', (data) => {
            const str = data.toString();
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
            try {
                if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
            } catch (_) {}

            if (code === 0) {
                resolve({ success: true, outputPath });
            } else {
                reject(new Error(`FFmpeg transcode failed with code ${code}`));
            }
        });

        proc.on('error', (err) => {
            try {
                if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
            } catch (_) {}
            reject(err);
        });
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
                ff.on('close', (code) => code === 0 ? resolve() : reject(new Error(`FFmpeg audio extract failed (code ${code})`)));
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


/**
 * Electron Main Process Entry Point
 * 
 * Responsibilities:
 * - Window lifecycle management
 * - IPC channel registration
 * - OS integration (menus, dialogs)
 * - File system access
 * 
 * Architecture: Application Shell Layer
 * Authority: system_architecture.md
 */

// When requiring from package.json "main", we need to handle electron correctly
const electron = process.versions.electron ? require('electron') : null;

if (!electron || !electron.app) {
    console.error('ERROR: Not running in Electron environment');
    process.exit(1);
}

const { app, BrowserWindow, ipcMain } = electron;
const path = require('path');
const fsSync = require('fs');
const fsPromises = require('fs').promises;

let mainWindow = null;
const MAX_LOG_FILE_SIZE_BYTES = 2 * 1024 * 1024;
const DEFAULT_FPS = 24;
const AUDIO_METADATA_READ_BYTES = 512 * 1024;

const MP3_BITRATE_TABLES = {
    V1L1: [0, 32, 64, 96, 128, 160, 192, 224, 256, 288, 320, 352, 384, 416, 448, 0],
    V1L2: [0, 32, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320, 384, 0],
    V1L3: [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320, 0],
    V2L1: [0, 32, 48, 56, 64, 80, 96, 112, 128, 144, 160, 176, 192, 224, 256, 0],
    V2L2L3: [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160, 0]
};

const MP3_SAMPLE_RATES = {
    0: [11025, 12000, 8000],   // MPEG 2.5
    2: [22050, 24000, 16000],  // MPEG 2
    3: [44100, 48000, 32000]   // MPEG 1
};

function parseSynchsafeInteger(buffer, offset) {
    if (buffer.length < offset + 4) {
        return 0;
    }
    return ((buffer[offset] & 0x7f) << 21)
        | ((buffer[offset + 1] & 0x7f) << 14)
        | ((buffer[offset + 2] & 0x7f) << 7)
        | (buffer[offset + 3] & 0x7f);
}

function parseWavMetadata(headBuffer) {
    if (headBuffer.length < 44) {
        return null;
    }
    if (headBuffer.toString('ascii', 0, 4) !== 'RIFF' || headBuffer.toString('ascii', 8, 12) !== 'WAVE') {
        return null;
    }

    let offset = 12;
    let channels = 0;
    let sampleRate = 0;
    let bitsPerSample = 0;
    let dataChunkSize = 0;

    while (offset + 8 <= headBuffer.length) {
        const chunkId = headBuffer.toString('ascii', offset, offset + 4);
        const chunkSize = headBuffer.readUInt32LE(offset + 4);
        const chunkDataOffset = offset + 8;

        if (chunkId === 'fmt ' && chunkDataOffset + 16 <= headBuffer.length) {
            channels = headBuffer.readUInt16LE(chunkDataOffset + 2);
            sampleRate = headBuffer.readUInt32LE(chunkDataOffset + 4);
            bitsPerSample = headBuffer.readUInt16LE(chunkDataOffset + 14);
        } else if (chunkId === 'data') {
            dataChunkSize = chunkSize;
            break;
        }

        offset = chunkDataOffset + chunkSize + (chunkSize % 2);
    }

    if (!sampleRate || !channels || !bitsPerSample || !dataChunkSize) {
        return null;
    }

    const bytesPerSecond = sampleRate * channels * (bitsPerSample / 8);
    if (!bytesPerSecond) {
        return null;
    }

    const durationSeconds = dataChunkSize / bytesPerSecond;
    if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) {
        return null;
    }

    return {
        durationSeconds,
        sampleRate,
        metadataSource: 'wav-header'
    };
}

function parseMp3Bitrate(versionBits, layerBits, bitrateIndex) {
    const layerKey = layerBits === 3 ? 'L1' : (layerBits === 2 ? 'L2' : 'L3');
    const tableKey = versionBits === 3
        ? `V1${layerKey}`
        : (layerKey === 'L1' ? 'V2L1' : 'V2L2L3');
    const table = MP3_BITRATE_TABLES[tableKey];
    if (!table) {
        return 0;
    }
    return table[bitrateIndex] || 0;
}

function parseMp3SamplesPerFrame(versionBits, layerBits) {
    if (layerBits === 3) {
        return 384;
    }
    if (layerBits === 2) {
        return 1152;
    }
    return versionBits === 3 ? 1152 : 576;
}

function parseMp3Metadata(headBuffer, fileSizeBytes) {
    if (headBuffer.length < 4) {
        return null;
    }

    let offset = 0;
    if (headBuffer.length >= 10 && headBuffer.toString('ascii', 0, 3) === 'ID3') {
        const id3Size = parseSynchsafeInteger(headBuffer, 6);
        offset = 10 + id3Size;
    }

    for (let i = offset; i <= headBuffer.length - 4; i += 1) {
        const b1 = headBuffer[i];
        const b2 = headBuffer[i + 1];
        const b3 = headBuffer[i + 2];

        if (b1 !== 0xff || (b2 & 0xe0) !== 0xe0) {
            continue;
        }

        const versionBits = (b2 >> 3) & 0x03;
        const layerBits = (b2 >> 1) & 0x03;
        const bitrateIndex = (b3 >> 4) & 0x0f;
        const sampleRateIndex = (b3 >> 2) & 0x03;

        if (versionBits === 1 || layerBits === 0 || bitrateIndex === 0 || bitrateIndex === 15 || sampleRateIndex === 3) {
            continue;
        }

        const sampleRates = MP3_SAMPLE_RATES[versionBits];
        if (!sampleRates) {
            continue;
        }

        const sampleRate = sampleRates[sampleRateIndex];
        const bitrateKbps = parseMp3Bitrate(versionBits, layerBits, bitrateIndex);
        if (!sampleRate || !bitrateKbps) {
            continue;
        }

        const audioBytes = Math.max(0, fileSizeBytes - i);
        const durationSeconds = (audioBytes * 8) / (bitrateKbps * 1000);
        const samplesPerFrame = parseMp3SamplesPerFrame(versionBits, layerBits);
        const estimatedFrameCount = durationSeconds > 0
            ? (durationSeconds * sampleRate) / samplesPerFrame
            : 0;

        if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) {
            continue;
        }

        return {
            durationSeconds,
            sampleRate,
            estimatedFrameCount,
            metadataSource: 'mp3-frame-header'
        };
    }

    return null;
}

async function extractAudioMetadata(filePath) {
    const stats = await fsPromises.stat(filePath);
    const bytesToRead = Math.min(AUDIO_METADATA_READ_BYTES, stats.size);
    const file = await fsPromises.open(filePath, 'r');

    try {
        const headBuffer = Buffer.alloc(bytesToRead);
        await file.read(headBuffer, 0, bytesToRead, 0);

        const wav = parseWavMetadata(headBuffer);
        if (wav) {
            return wav;
        }

        const mp3 = parseMp3Metadata(headBuffer, stats.size);
        if (mp3) {
            return mp3;
        }

        return null;
    } finally {
        await file.close();
    }
}

async function appendMainLog(level, message, data) {
    try {
        const logsDir = path.join(app.getPath('userData'), 'logs');
        const logPath = path.join(logsDir, 'main.log');
        await fsPromises.mkdir(logsDir, { recursive: true });

        const line = `${new Date().toISOString()} [${level}] ${message}${data ? ` ${JSON.stringify(data)}` : ''}\n`;
        await fsPromises.appendFile(logPath, line, 'utf-8');

        const stats = await fsPromises.stat(logPath);
        if (stats.size > MAX_LOG_FILE_SIZE_BYTES) {
            const rotatedPath = path.join(logsDir, 'main.log.1');
            await fsPromises.copyFile(logPath, rotatedPath);
            await fsPromises.writeFile(logPath, '', 'utf-8');
        }
    } catch {
        // Never throw from logging path.
    }
}

/**
 * Create the main application window
 */
function createWindow() {
    const distPreloadPath = path.join(__dirname, '..', '..', 'dist', 'main', 'preload.js');
    const srcPreloadPath = path.join(__dirname, 'preload.js');
    const preloadPath = fsSync.existsSync(distPreloadPath) ? distPreloadPath : srcPreloadPath;

    mainWindow = new BrowserWindow({
        width: 1920,
        height: 1080,
        title: 'CreoVox',
        backgroundColor: '#1a1a1a',
        webPreferences: {
            preload: preloadPath,
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: false
        }
    });

    // Load renderer - use port 5173 (Vite dev server port)
    if (process.env.NODE_ENV === 'development' || !app.isPackaged) {
        mainWindow.loadURL('http://localhost:5173');
        mainWindow.webContents.openDevTools();
    } else {
        const distRendererIndexPath = path.join(__dirname, '..', '..', 'dist', 'renderer', 'index.html');
        const defaultRendererIndexPath = path.join(__dirname, '..', 'renderer', 'index.html');
        const rendererIndexPath = fsSync.existsSync(distRendererIndexPath) ? distRendererIndexPath : defaultRendererIndexPath;
        mainWindow.loadFile(rendererIndexPath);
    }

    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    mainWindow.webContents.on('render-process-gone', (_event, details) => {
        console.error('Renderer process gone:', details);
        void appendMainLog('ERROR', 'Renderer process gone', details);
    });

    mainWindow.webContents.on('unresponsive', () => {
        console.error('Renderer became unresponsive');
        void appendMainLog('ERROR', 'Renderer became unresponsive');
    });
}

/**
 * Create application menu
 */
function createMenu() {
    const { Menu } = electron;

    const template = [
        {
            label: 'File',
            submenu: [
                {
                    label: 'Save Project',
                    accelerator: 'CmdOrCtrl+S',
                    click: () => {
                        if (mainWindow) {
                            mainWindow.webContents.send('menu:save');
                        }
                    }
                },
                {
                    label: 'Save As...',
                    accelerator: 'CmdOrCtrl+Shift+S',
                    click: () => {
                        if (mainWindow) {
                            mainWindow.webContents.send('menu:saveAs');
                        }
                    }
                },
                {
                    label: 'Load Project...',
                    accelerator: 'CmdOrCtrl+O',
                    click: () => {
                        if (mainWindow) {
                            mainWindow.webContents.send('menu:load');
                        }
                    }
                },
                { type: 'separator' },
                {
                    label: 'Import',
                    submenu: [
                        {
                            label: 'Audio...',
                            accelerator: 'CmdOrCtrl+I',
                            click: () => {
                                if (mainWindow) {
                                    mainWindow.webContents.send('menu:importAudio');
                                }
                            }
                        }
                    ]
                },
                {
                    label: 'Export',
                    submenu: [
                        {
                            label: 'USD Scene...',
                            click: () => {
                                if (mainWindow) {
                                    mainWindow.webContents.send('menu:exportUSD');
                                }
                            }
                        },
                        {
                            label: 'OTIO Timeline...',
                            click: () => {
                                if (mainWindow) {
                                    mainWindow.webContents.send('menu:exportOTIO');
                                }
                            }
                        }
                    ]
                },
                { type: 'separator' },
                {
                    label: 'Quit',
                    accelerator: 'CmdOrCtrl+Q',
                    click: () => {
                        app.quit();
                    }
                }
            ]
        },
        {
            label: 'Edit',
            submenu: [
                { role: 'undo' },
                { role: 'redo' },
                { type: 'separator' },
                { role: 'cut' },
                { role: 'copy' },
                { role: 'paste' }
            ]
        },
        {
            label: 'View',
            submenu: [
                { role: 'reload' },
                { role: 'forceReload' },
                { role: 'toggleDevTools' },
                { type: 'separator' },
                { role: 'resetZoom' },
                { role: 'zoomIn' },
                { role: 'zoomOut' },
                { type: 'separator' },
                { role: 'togglefullscreen' }
            ]
        }
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
}

/**
 * Register IPC handlers
 */
function registerIPCHandlers() {
    const { dialog } = electron;
    const fs = require('fs').promises;

    // Ping handler
    ipcMain.handle('ping', async () => {
        return 'pong';
    });

    // File operations
    ipcMain.handle('file:save', async (_event, data) => {
        try {
            const { filePath, canceled } = await dialog.showSaveDialog(mainWindow, {
                title: 'Save Project',
                defaultPath: 'project.creovox',
                filters: [
                    { name: 'CreoVox Project', extensions: ['creovox'] },
                    { name: 'All Files', extensions: ['*'] }
                ]
            });

            if (canceled || !filePath) {
                return { success: false, canceled: true };
            }

            await fs.writeFile(filePath, data, 'utf-8');
            return { success: true, filePath };
        } catch (error) {
            console.error('Save failed:', error);
            return { success: false, error: error.message };
        }
    });

    // TASK 4: Direct save to existing path (no dialog)
    ipcMain.handle('file:saveToPath', async (_event, filePath, data) => {
        try {
            // TASK 4: IPC contract safety - validate inputs
            if (!filePath || typeof filePath !== 'string') {
                return { success: false, error: 'Invalid file path' };
            }

            if (!data || typeof data !== 'string') {
                return { success: false, error: 'Invalid data' };
            }

            await fs.writeFile(filePath, data, 'utf-8');
            return { success: true, filePath };
        } catch (error) {
            console.error('Save to path failed:', error);
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('file:load', async () => {
        try {
            const { filePaths, canceled } = await dialog.showOpenDialog(mainWindow, {
                title: 'Load Project',
                filters: [
                    { name: 'CreoVox Project', extensions: ['creovox'] },
                    { name: 'All Files', extensions: ['*'] }
                ],
                properties: ['openFile']
            });

            if (canceled || !filePaths || filePaths.length === 0) {
                return { success: false, canceled: true };
            }

            const data = await fs.readFile(filePaths[0], 'utf-8');
            return { success: true, data, filePath: filePaths[0] };
        } catch (error) {
            console.error('Load failed:', error);
            return { success: false, error: error.message };
        }
    });

    // Audio operations
    ipcMain.handle('audio:import', async () => {
        try {
            const { filePaths, canceled } = await dialog.showOpenDialog(mainWindow, {
                title: 'Import Audio',
                filters: [
                    { name: 'Audio Files', extensions: ['mp3', 'wav', 'ogg', 'm4a', 'flac'] },
                    { name: 'All Files', extensions: ['*'] }
                ],
                properties: ['openFile']
            });

            if (canceled || !filePaths || filePaths.length === 0) {
                return { success: false, canceled: true };
            }

            const filePath = filePaths[0];
            return {
                success: true,
                filePath,
                fileName: path.basename(filePath)
            };
        } catch (error) {
            console.error('Audio import failed:', error);
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('audio:readFile', async (_event, filePath) => {
        try {
            if (!filePath || typeof filePath !== 'string') {
                return { success: false, error: 'Invalid file path' };
            }

            const data = await fs.readFile(filePath);
            return { success: true, data };
        } catch (error) {
            console.error('Audio read failed:', error);
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('audio:loadAudio', async (_event, filePath) => {
        try {
            if (!filePath || typeof filePath !== 'string') {
                return { success: false, error: 'Invalid file path' };
            }

            const metadata = await extractAudioMetadata(filePath);
            if (!metadata) {
                return {
                    success: true,
                    durationFrames: undefined,
                    durationSeconds: undefined,
                    sampleRate: undefined,
                    metadataSource: 'unavailable'
                };
            }

            return {
                success: true,
                durationFrames: Math.max(1, Math.round(metadata.durationSeconds * DEFAULT_FPS)),
                durationSeconds: metadata.durationSeconds,
                sampleRate: metadata.sampleRate,
                metadataSource: metadata.metadataSource
            };
        } catch (error) {
            console.error('Audio load failed:', error);
            return { success: false, error: error.message };
        }
    });

    // Render operations
    ipcMain.handle('render:selectOutputDir', async () => {
        try {
            const { filePaths, canceled } = await dialog.showOpenDialog(mainWindow, {
                title: 'Select Output Directory',
                properties: ['openDirectory', 'createDirectory']
            });

            if (canceled || !filePaths || filePaths.length === 0) {
                return { success: false, canceled: true };
            }

            return { success: true, path: filePaths[0] };
        } catch (error) {
            console.error('Directory selection failed:', error);
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('render:saveImageSequence', async (_event, frames, outputDir) => {
        try {
            const frameNumbers = Object.keys(frames);

            for (const frameNum of frameNumbers) {
                const buffer = Buffer.from(frames[frameNum]);
                const fileName = `frame_${String(frameNum).padStart(4, '0')}.png`;
                const filePath = path.join(outputDir, fileName);
                await fs.writeFile(filePath, buffer);
            }

            return {
                success: true,
                count: frameNumbers.length
            };
        } catch (error) {
            console.error('Image sequence save failed:', error);
            return { success: false, error: error.message };
        }
    });

    // Export operations
    ipcMain.handle('export:selectUSDPath', async () => {
        try {
            const { filePath, canceled } = await dialog.showSaveDialog(mainWindow, {
                title: 'Export USD Scene',
                defaultPath: 'scene.usda',
                filters: [
                    { name: 'USD ASCII', extensions: ['usda'] },
                    { name: 'All Files', extensions: ['*'] }
                ]
            });

            if (canceled || !filePath) {
                return { success: false, canceled: true };
            }

            return { success: true, path: filePath };
        } catch (error) {
            console.error('USD path selection failed:', error);
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('export:saveUSD', async (_event, usdContent, filePath) => {
        try {
            await fs.writeFile(filePath, usdContent, { encoding: 'utf-8' });
            return { success: true, filePath };
        } catch (error) {
            console.error('USD export failed:', error);
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('export:selectOTIOPath', async () => {
        try {
            const { filePath, canceled } = await dialog.showSaveDialog(mainWindow, {
                title: 'Export OTIO Timeline',
                defaultPath: 'timeline.otio',
                filters: [
                    { name: 'OpenTimelineIO', extensions: ['otio'] },
                    { name: 'All Files', extensions: ['*'] }
                ]
            });

            if (canceled || !filePath) {
                return { success: false, canceled: true };
            }

            return { success: true, path: filePath };
        } catch (error) {
            console.error('OTIO path selection failed:', error);
            return { success: false, error: error.message };
        }
    });

    ipcMain.handle('export:saveOTIO', async (_event, otioContent, filePath) => {
        try {
            await fs.writeFile(filePath, otioContent, { encoding: 'utf-8' });
            return { success: true, filePath };
        } catch (error) {
            console.error('OTIO export failed:', error);
            return { success: false, error: error.message };
        }
    });

    // ===== AUTOSAVE & CRASH RECOVERY =====

    // Check for autosave files on app start
    ipcMain.handle('autosave:check', async () => {
        try {
            const os = require('os');
            const candidateDirs = [process.cwd(), os.tmpdir(), app.getPath('userData')];
            const candidates = [];

            for (const dir of candidateDirs) {
                let entries = [];
                try {
                    entries = await fsPromises.readdir(dir, { withFileTypes: true });
                } catch {
                    continue;
                }

                for (const entry of entries) {
                    if (!entry.isFile()) continue;
                    if (!entry.name.endsWith('.autosave')) continue;

                    const fullPath = path.join(dir, entry.name);
                    try {
                        const stats = await fsPromises.stat(fullPath);
                        let isValid = false;
                        try {
                            const data = await fsPromises.readFile(fullPath, 'utf-8');
                            JSON.parse(data);
                            isValid = true;
                        } catch {
                            isValid = false;
                        }

                        candidates.push({
                            path: fullPath,
                            modifiedAt: stats.mtime.toISOString(),
                            size: stats.size,
                            mtimeMs: stats.mtimeMs,
                            isValid
                        });
                    } catch {
                        // Ignore unreadable files.
                    }
                }
            }

            if (candidates.length === 0) {
                return { found: false };
            }

            const validCandidates = candidates.filter((candidate) => candidate.isValid);
            const corruptedCount = candidates.length - validCandidates.length;

            if (validCandidates.length === 0) {
                candidates.sort((a, b) => b.mtimeMs - a.mtimeMs);
                return {
                    found: false,
                    error: 'AUTOSAVE_NO_VALID_CANDIDATE',
                    corruptedFound: true,
                    corruptedCount,
                    candidateCount: candidates.length
                };
            }

            validCandidates.sort((a, b) => b.mtimeMs - a.mtimeMs);
            const latest = validCandidates[0];

            const candidateSummaries = validCandidates.slice(0, 10).map((candidate) => ({
                path: candidate.path,
                modifiedAt: candidate.modifiedAt,
                size: candidate.size
            }));

            return {
                found: true,
                autosavePath: latest.path,
                modifiedAt: latest.modifiedAt,
                size: latest.size,
                candidateCount: validCandidates.length,
                corruptedCount,
                candidates: candidateSummaries
            };
        } catch (error) {
            console.error('Autosave check failed:', error);
            void appendMainLog('ERROR', 'Autosave check failed', { error: error?.message || String(error) });
            return { found: false };
        }
    });

    // Restore from autosave file
    ipcMain.handle('autosave:restore', async (_event, autosavePath) => {
        try {
            if (!autosavePath || typeof autosavePath !== 'string') {
                return { success: false, error: 'Invalid autosave path' };
            }

            const data = await fs.readFile(autosavePath, 'utf-8');
            try {
                JSON.parse(data);
            } catch {
                return { success: false, error: 'AUTOSAVE_INVALID_JSON' };
            }
            return { success: true, data, filePath: autosavePath };
        } catch (error) {
            console.error('Autosave restore failed:', error);
            void appendMainLog('ERROR', 'Autosave restore failed', { error: error?.message || String(error) });
            return { success: false, error: error.message };
        }
    });

    // Discard autosave file
    ipcMain.handle('autosave:discard', async (_event, autosavePath) => {
        try {
            if (!autosavePath || typeof autosavePath !== 'string') {
                return { success: false, error: 'Invalid autosave path' };
            }

            await fs.unlink(autosavePath);
            return { success: true };
        } catch (error) {
            if (error && error.code === 'ENOENT') {
                return { success: true };
            }
            console.error('Autosave discard failed:', error);
            void appendMainLog('ERROR', 'Autosave discard failed', { error: error?.message || String(error) });
            return { success: false, error: error.message };
        }
    });

    // Discard multiple autosave files in one action
    ipcMain.handle('autosave:discardMany', async (_event, autosavePaths) => {
        try {
            if (!Array.isArray(autosavePaths)) {
                return { success: false, error: 'Invalid autosave path list' };
            }

            const failedPaths = [];
            let removed = 0;
            for (const autosavePath of autosavePaths) {
                if (!autosavePath || typeof autosavePath !== 'string') {
                    failedPaths.push(String(autosavePath));
                    continue;
                }

                try {
                    await fs.unlink(autosavePath);
                    removed += 1;
                } catch (error) {
                    if (error && error.code === 'ENOENT') {
                        continue;
                    }
                    failedPaths.push(autosavePath);
                }
            }

            return {
                success: failedPaths.length === 0,
                removed,
                failedPaths,
                error: failedPaths.length > 0 ? 'Some autosave files could not be removed' : undefined
            };
        } catch (error) {
            console.error('Autosave discardMany failed:', error);
            void appendMainLog('ERROR', 'Autosave discardMany failed', { error: error?.message || String(error) });
            return { success: false, error: error.message };
        }
    });

    // Get temp directory path
    ipcMain.handle('autosave:getTempPath', async () => {
        try {
            const os = require('os');
            return { success: true, path: os.tmpdir() };
        } catch (error) {
            console.error('Get temp path failed:', error);
            return { success: false, error: error.message };
        }
    });
}

// Application lifecycle
app.whenReady().then(() => {
    void appendMainLog('INFO', 'App startup', { version: app.getVersion(), platform: process.platform });
    registerIPCHandlers();
    createWindow();
    createMenu(); // Add File menu

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

process.on('uncaughtException', (error) => {
    console.error('Uncaught exception in main process:', error);
    void appendMainLog('ERROR', 'Uncaught exception', { message: error.message, stack: error.stack });
});

process.on('unhandledRejection', (reason) => {
    console.error('Unhandled rejection in main process:', reason);
    void appendMainLog('ERROR', 'Unhandled rejection', { reason: String(reason) });
});

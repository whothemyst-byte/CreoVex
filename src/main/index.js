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
            // For now, just return success with placeholder duration
            // TODO: Use proper audio analysis library
            const stats = await fs.stat(filePath);
            const durationFrames = 240; // Placeholder: ~10 seconds at 24fps

            return {
                success: true,
                durationFrames,
                sampleRate: 48000
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
            const candidateDirs = [process.cwd(), os.tmpdir()];
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
                        candidates.push({
                            path: fullPath,
                            modifiedAt: stats.mtime.toISOString(),
                            size: stats.size,
                            mtimeMs: stats.mtimeMs
                        });
                    } catch {
                        // Ignore unreadable files.
                    }
                }
            }

            if (candidates.length === 0) {
                return { found: false };
            }

            candidates.sort((a, b) => b.mtimeMs - a.mtimeMs);
            const latest = candidates[0];
            return {
                found: true,
                autosavePath: latest.path,
                modifiedAt: latest.modifiedAt,
                size: latest.size
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
            const data = await fs.readFile(autosavePath, 'utf-8');
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
            await fs.unlink(autosavePath);
            return { success: true };
        } catch (error) {
            console.error('Autosave discard failed:', error);
            void appendMainLog('ERROR', 'Autosave discard failed', { error: error?.message || String(error) });
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

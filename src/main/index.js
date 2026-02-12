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

let mainWindow = null;

/**
 * Create the main application window
 */
function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1920,
        height: 1080,
        title: 'CreoVox',
        backgroundColor: '#1a1a1a',
        webPreferences: {
            preload: path.join(__dirname, '..', '..', 'dist', 'main', 'preload.js'),
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
        mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
    }

    mainWindow.on('closed', () => {
        mainWindow = null;
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
    ipcMain.handle('audio:selectFile', async () => {
        try {
            const { filePaths, canceled } = await dialog.showOpenDialog(mainWindow, {
                title: 'Select Audio File',
                filters: [
                    { name: 'Audio Files', extensions: ['mp3', 'wav', 'ogg', 'm4a', 'flac'] },
                    { name: 'All Files', extensions: ['*'] }
                ],
                properties: ['openFile']
            });

            if (canceled || !filePaths || filePaths.length === 0) {
                return { success: false, canceled: true };
            }

            return { success: true, filePath: filePaths[0] };
        } catch (error) {
            console.error('Audio select failed:', error);
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
            // TODO: Implement full autosave detection logic
            return { found: false };
        } catch (error) {
            console.error('Autosave check failed:', error);
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

/**
 * Electron Main Process
 * 
 * Responsibilities:
 * - Application lifecycle
 * - Window management
 * - File system operations (save/load projects)
 * - IPC orchestration
 * 
 * Architecture: Main Process
 * Authority: system_architecture.md (Process Model)
 */

import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import * as path from 'path';
import * as fs from 'fs/promises';

let mainWindow: BrowserWindow | null = null;

/**
 * Create main application window
 */
function createWindow() {
  const isDev = !app.isPackaged;

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    webPreferences: {
      preload: isDev
        ? path.join(__dirname, '../../src/main/preload.js')
        : path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  // Load renderer
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    // mainWindow.webContents.openDevTools(); // Uncomment for debugging
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

/**
 * IPC: Save Project Dialog
 */
ipcMain.handle('file:save', async (_event, projectData: string) => {
  try {
    if (!mainWindow) {
      throw new Error('No active window');
    }

    const { filePath, canceled } = await dialog.showSaveDialog(mainWindow, {
      title: 'Save Project',
      defaultPath: 'untitled.creovox.json',
      filters: [
        { name: 'CreoVox Project', extensions: ['creovox.json'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    });

    if (canceled || !filePath) {
      return { success: false, canceled: true };
    }

    // Write file asynchronously
    await fs.writeFile(filePath, projectData, 'utf-8');

    return { success: true, filePath };
  } catch (error) {
    console.error('Save project failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
});

/**
 * IPC: Save Project to Path (no dialog)
 */
ipcMain.handle('file:saveToPath', async (_event, filePath: string, projectData: string) => {
  try {
    await fs.writeFile(filePath, projectData, 'utf-8');
    return { success: true, filePath };
  } catch (error) {
    console.error('Save to path failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
});

/**
 * IPC: Load Project Dialog
 */
ipcMain.handle('file:load', async () => {
  try {
    if (!mainWindow) {
      throw new Error('No active window');
    }

    const { filePaths, canceled } = await dialog.showOpenDialog(mainWindow, {
      title: 'Open Project',
      filters: [
        { name: 'CreoVox Project', extensions: ['creovox.json'] },
        { name: 'All Files', extensions: ['*'] }
      ],
      properties: ['openFile']
    });

    if (canceled || filePaths.length === 0) {
      return { success: false, canceled: true };
    }

    const filePath = filePaths[0];

    // Read file asynchronously
    const fileContent = await fs.readFile(filePath, 'utf-8');

    // Validate JSON
    try {
      JSON.parse(fileContent);
    } catch (parseError) {
      throw new Error('Invalid JSON file');
    }

    return { success: true, data: fileContent, filePath };
  } catch (error) {
    console.error('Load project failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
});

/**
 * IPC: Import Audio File
 * 
 * Opens file dialog for audio selection and returns file path
 * 
 * TODO: Extract audio metadata (duration, sample rate)
 * TODO: Support drag-and-drop audio import
 * TODO: Audio file validation
 */
ipcMain.handle('audio:import', async () => {
  try {
    if (!mainWindow) {
      throw new Error('No active window');
    }

    const { filePaths, canceled } = await dialog.showOpenDialog(mainWindow, {
      title: 'Import Audio',
      filters: [
        { name: 'Audio Files', extensions: ['wav', 'mp3', 'ogg', 'm4a', 'aac'] },
        { name: 'All Files', extensions: ['*'] }
      ],
      properties: ['openFile']
    });

    if (canceled || filePaths.length === 0) {
      return { success: false, canceled: true };
    }

    const filePath = filePaths[0];

    // TODO: Read audio metadata to get duration
    // For now, return file path and let Web Audio API handle it

    return {
      success: true,
      filePath,
      fileName: path.basename(filePath)
    };
  } catch (error) {
    console.error('Audio import failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
});

/**
 * IPC: Export Image Sequence
 * 
 * Save directory dialog and write PNG files
 * 
 * TODO: Parallel file writes for performance
 * TODO: Compression level options
 * TODO: Filename template customization
 */
ipcMain.handle('render:saveImageSequence', async (_event, frames: { [frame: number]: ArrayBuffer }, outputDir: string) => {
  try {
    // Validate output directory
    const stats = await fs.stat(outputDir);
    if (!stats.isDirectory()) {
      throw new Error('Output path is not a directory');
    }

    // Write each frame
    const frameNumbers = Object.keys(frames).map(Number).sort((a, b) => a - b);

    for (const frameNum of frameNumbers) {
      const buffer = frames[frameNum];
      const filename = `frame_${String(frameNum).padStart(4, '0')}.png`;
      const filepath = path.join(outputDir, filename);

      await fs.writeFile(filepath, Buffer.from(buffer));
    }

    return {
      success: true,
      count: frameNumbers.length,
      outputDir
    };
  } catch (error) {
    console.error('Image sequence export failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
});

/**
 * IPC: Select Output Directory
 * 
 * Opens directory selection dialog
 */
ipcMain.handle('render:selectOutputDir', async () => {
  try {
    if (!mainWindow) {
      throw new Error('No active window');
    }

    const { filePaths, canceled } = await dialog.showOpenDialog(mainWindow, {
      title: 'Select Output Directory',
      properties: ['openDirectory', 'createDirectory']
    });

    if (canceled || filePaths.length === 0) {
      return { success: false, canceled: true };
    }

    return {
      success: true,
      path: filePaths[0]
    };
  } catch (error) {
    console.error('Directory selection failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
});

/**
 * IPC: Export USD Scene
 * 
 * Save USD scene file
 * 
 * TODO: Validate USD syntax before writing
 * TODO: USDZ binary export option
 */
ipcMain.handle('export:saveUSD', async (_event, usdContent: string, filePath: string) => {
  try {
    // Write USD file (UTF-8, LF line endings)
    await fs.writeFile(filePath, usdContent, { encoding: 'utf-8' });

    return {
      success: true,
      filePath
    };
  } catch (error) {
    console.error('USD export failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
});

/**
 * IPC: Export OTIO Timeline
 * 
 * Save OTIO timeline file
 * 
 * TODO: Validate OTIO JSON schema
 * TODO: OTIO import (reverse direction)
 */
ipcMain.handle('export:saveOTIO', async (_event, otioContent: string, filePath: string) => {
  try {
    // Write OTIO file (UTF-8, formatted JSON)
    await fs.writeFile(filePath, otioContent, { encoding: 'utf-8' });

    return {
      success: true,
      filePath
    };
  } catch (error) {
    console.error('OTIO export failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
});

/**
 * IPC: Select USD Export Path
 */
ipcMain.handle('export:selectUSDPath', async () => {
  try {
    if (!mainWindow) {
      throw new Error('No active window');
    }

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
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
});

/**
 * IPC: Select OTIO Export Path
 */
ipcMain.handle('export:selectOTIOPath', async () => {
  try {
    if (!mainWindow) {
      throw new Error('No active window');
    }

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
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
});

// App lifecycle
app.whenReady().then(() => {
  createWindow();

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

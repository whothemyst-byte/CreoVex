/**
 * Electron Preload Script
 * 
 * Exposes safe IPC methods to renderer process.
 * 
 * Architecture: Preload (Security Boundary)
 * Authority: system_architecture.md (Process Model)
 */

import { contextBridge, ipcRenderer } from 'electron';

/**
 * File operations API
 * 
 * Exposes file dialogs and I/O to renderer
 */
const fileAPI = {
    /**
     * Save project to disk
     * @param projectData JSON string of project snapshot
     * @returns Promise with save result
     */
    saveProject: async (projectData: string): Promise<{
        success: boolean;
        filePath?: string;
        canceled?: boolean;
        error?: string;
    }> => {
        return await ipcRenderer.invoke('file:save', projectData);
    },

    /**
     * Save project to existing path (no dialog)
     * @param filePath Path to save to
     * @param projectData JSON string of project snapshot
     * @returns Promise with save result
     */
    saveProjectToPath: async (filePath: string, projectData: string): Promise<{
        success: boolean;
        filePath?: string;
        error?: string;
    }> => {
        return await ipcRenderer.invoke('file:saveToPath', filePath, projectData);
    },

    /**
     * Load project from disk
     * @returns Promise with load result and project data
     */
    loadProject: async (): Promise<{
        success: boolean;
        data?: string;
        filePath?: string;
        canceled?: boolean;
        error?: string;
    }> => {
        return await ipcRenderer.invoke('file:load');
    }
};

/**
 * Audio operations API
 * 
 * Exposes audio import functionality
 */
const audioAPI = {
    /**
     * Import audio file
     * @returns Promise with audio file path
     */
    importAudio: async (): Promise<{
        success: boolean;
        filePath?: string;
        fileName?: string;
        canceled?: boolean;
        error?: string;
    }> => {
        return await ipcRenderer.invoke('audio:import');
    },

    /**
     * Read audio file as binary data
     * @param filePath Absolute file path
     */
    readFile: async (filePath: string): Promise<{
        success: boolean;
        data?: Uint8Array;
        error?: string;
    }> => {
        return await ipcRenderer.invoke('audio:readFile', filePath);
    },

    /**
     * Load basic audio metadata
     * @param filePath Absolute file path
     */
    loadAudio: async (filePath: string): Promise<{
        success: boolean;
        durationFrames?: number;
        durationSeconds?: number;
        sampleRate?: number;
        metadataSource?: string;
        error?: string;
    }> => {
        return await ipcRenderer.invoke('audio:loadAudio', filePath);
    }
};

/**
 * Render operations API
 * 
 * Exposes rendering and export functionality
 */
const renderAPI = {
    /**
     * Select output directory for rendering
     */
    selectOutputDir: async (): Promise<{
        success: boolean;
        path?: string;
        canceled?: boolean;
        error?: string;
    }> => {
        return await ipcRenderer.invoke('render:selectOutputDir');
    },

    /**
     * Save image sequence to disk
     */
    saveImageSequence: async (frames: { [frame: number]: ArrayBuffer }, outputDir: string): Promise<{
        success: boolean;
        count?: number;
        outputDir?: string;
        error?: string;
    }> => {
        return await ipcRenderer.invoke('render:saveImageSequence', frames, outputDir);
    }
};

/**
 * Export operations API
 * 
 * Exposes USD and OTIO export functionality
 */
const exportAPI = {
    /**
     * Select USD export path
     */
    selectUSDPath: async (): Promise<{
        success: boolean;
        path?: string;
        canceled?: boolean;
        error?: string;
    }> => {
        return await ipcRenderer.invoke('export:selectUSDPath');
    },

    /**
     * Save USD scene
     */
    saveUSD: async (usdContent: string, filePath: string): Promise<{
        success: boolean;
        filePath?: string;
        error?: string;
    }> => {
        return await ipcRenderer.invoke('export:saveUSD', usdContent, filePath);
    },

    /**
     * Select OTIO export path
     */
    selectOTIOPath: async (): Promise<{
        success: boolean;
        path?: string;
        canceled?: boolean;
        error?: string;
    }> => {
        return await ipcRenderer.invoke('export:selectOTIOPath');
    },

    /**
     * Save OTIO timeline
     */
    saveOTIO: async (otioContent: string, filePath: string): Promise<{
        success: boolean;
        filePath?: string;
        error?: string;
    }> => {
        return await ipcRenderer.invoke('export:saveOTIO', otioContent, filePath);
    }
};

/**
 * Autosave and recovery API
 */
const autosaveAPI = {
    check: async (): Promise<{
        found: boolean;
        autosavePath?: string;
        modifiedAt?: string;
        size?: number;
        candidateCount?: number;
        corruptedCount?: number;
        corruptedFound?: boolean;
        candidates?: Array<{
            path: string;
            modifiedAt: string;
            size: number;
        }>;
        error?: string;
    }> => {
        return await ipcRenderer.invoke('autosave:check');
    },

    restore: async (autosavePath: string): Promise<{
        success: boolean;
        data?: string;
        filePath?: string;
        error?: string;
    }> => {
        return await ipcRenderer.invoke('autosave:restore', autosavePath);
    },

    discard: async (autosavePath: string): Promise<{
        success: boolean;
        error?: string;
    }> => {
        return await ipcRenderer.invoke('autosave:discard', autosavePath);
    },

    discardMany: async (autosavePaths: string[]): Promise<{
        success: boolean;
        removed?: number;
        failedPaths?: string[];
        error?: string;
    }> => {
        return await ipcRenderer.invoke('autosave:discardMany', autosavePaths);
    }
};

/**
 * Menu event listeners API
 * 
 * Allows renderer to listen for menu commands from main process
 */
const menuAPI = {
    /**
     * Listen for Save command from menu
     */
    onSave: (callback: () => void) => {
        ipcRenderer.on('menu:save', callback);
        return () => ipcRenderer.removeListener('menu:save', callback);
    },

    /**
     * Listen for Save As command from menu
     */
    onSaveAs: (callback: () => void) => {
        ipcRenderer.on('menu:saveAs', callback);
        return () => ipcRenderer.removeListener('menu:saveAs', callback);
    },

    /**
     * Listen for Load command from menu
     */
    onLoad: (callback: () => void) => {
        ipcRenderer.on('menu:load', callback);
        return () => ipcRenderer.removeListener('menu:load', callback);
    },

    /**
     * Listen for Import Audio command from menu
     */
    onImportAudio: (callback: () => void) => {
        ipcRenderer.on('menu:importAudio', callback);
        return () => ipcRenderer.removeListener('menu:importAudio', callback);
    },

    /**
     * Listen for Export USD command from menu
     */
    onExportUSD: (callback: () => void) => {
        ipcRenderer.on('menu:exportUSD', callback);
        return () => ipcRenderer.removeListener('menu:exportUSD', callback);
    },

    /**
     * Listen for Export OTIO command from menu
     */
    onExportOTIO: (callback: () => void) => {
        ipcRenderer.on('menu:exportOTIO', callback);
        return () => ipcRenderer.removeListener('menu:exportOTIO', callback);
    }
};

// Expose to window.electronAPI
contextBridge.exposeInMainWorld('electronAPI', {
    file: fileAPI,
    audio: audioAPI,
    render: renderAPI,
    export: exportAPI,
    autosave: autosaveAPI,
    menu: menuAPI
});

// Type definitions for renderer
declare global {
    interface Window {
        electronAPI: {
            file: typeof fileAPI;
            audio: typeof audioAPI;
            render: typeof renderAPI;
            export: typeof exportAPI;
            autosave: typeof autosaveAPI;
            menu: typeof menuAPI;
        };
    }
}

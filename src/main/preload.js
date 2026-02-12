/**
 * Electron Preload Script (JavaScript fallback for dev/runtime)
 *
 * Mirrors src/main/preload.ts so window.electronAPI is always available.
 */

const { contextBridge, ipcRenderer } = require('electron');

const fileAPI = {
    saveProject: async (projectData) => {
        return await ipcRenderer.invoke('file:save', projectData);
    },
    saveProjectToPath: async (filePath, projectData) => {
        return await ipcRenderer.invoke('file:saveToPath', filePath, projectData);
    },
    loadProject: async () => {
        return await ipcRenderer.invoke('file:load');
    }
};

const audioAPI = {
    importAudio: async () => {
        return await ipcRenderer.invoke('audio:import');
    },
    readFile: async (filePath) => {
        return await ipcRenderer.invoke('audio:readFile', filePath);
    },
    loadAudio: async (filePath) => {
        return await ipcRenderer.invoke('audio:loadAudio', filePath);
    }
};

const renderAPI = {
    selectOutputDir: async () => {
        return await ipcRenderer.invoke('render:selectOutputDir');
    },
    saveImageSequence: async (frames, outputDir) => {
        return await ipcRenderer.invoke('render:saveImageSequence', frames, outputDir);
    }
};

const exportAPI = {
    selectUSDPath: async () => {
        return await ipcRenderer.invoke('export:selectUSDPath');
    },
    saveUSD: async (usdContent, filePath) => {
        return await ipcRenderer.invoke('export:saveUSD', usdContent, filePath);
    },
    selectOTIOPath: async () => {
        return await ipcRenderer.invoke('export:selectOTIOPath');
    },
    saveOTIO: async (otioContent, filePath) => {
        return await ipcRenderer.invoke('export:saveOTIO', otioContent, filePath);
    }
};

const menuAPI = {
    onSave: (callback) => {
        ipcRenderer.on('menu:save', callback);
        return () => ipcRenderer.removeListener('menu:save', callback);
    },
    onSaveAs: (callback) => {
        ipcRenderer.on('menu:saveAs', callback);
        return () => ipcRenderer.removeListener('menu:saveAs', callback);
    },
    onLoad: (callback) => {
        ipcRenderer.on('menu:load', callback);
        return () => ipcRenderer.removeListener('menu:load', callback);
    },
    onImportAudio: (callback) => {
        ipcRenderer.on('menu:importAudio', callback);
        return () => ipcRenderer.removeListener('menu:importAudio', callback);
    },
    onExportUSD: (callback) => {
        ipcRenderer.on('menu:exportUSD', callback);
        return () => ipcRenderer.removeListener('menu:exportUSD', callback);
    },
    onExportOTIO: (callback) => {
        ipcRenderer.on('menu:exportOTIO', callback);
        return () => ipcRenderer.removeListener('menu:exportOTIO', callback);
    }
};

contextBridge.exposeInMainWorld('electronAPI', {
    file: fileAPI,
    audio: audioAPI,
    render: renderAPI,
    export: exportAPI,
    menu: menuAPI
});

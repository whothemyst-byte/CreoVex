/**
 * Preload script for secure IPC communication
 */

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
    invoke: (channel, ...args) => {
        const validChannels = ['ping'];
        if (validChannels.includes(channel)) {
            return ipcRenderer.invoke(channel, ...args);
        }
        throw new Error(`Invalid IPC channel: ${channel}`);
    },

    on: (channel, callback) => {
        const validChannels = [];
        if (validChannels.includes(channel)) {
            ipcRenderer.on(channel, (_, ...args) => callback(...args));
        }
    }
});

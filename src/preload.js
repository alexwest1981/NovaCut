const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('novaCut', {
    openMedia: () => ipcRenderer.invoke('dialog:openMedia'),
    saveExportDialog: (defaultName) => ipcRenderer.invoke('dialog:saveExport', defaultName),
    savePlugin: (pluginData) => ipcRenderer.invoke('plugin:save', pluginData),
    loadPlugins: () => ipcRenderer.invoke('plugin:loadAll'),
    exportFFmpeg: (options) => ipcRenderer.invoke('export:ffmpeg', options),
    onExportProgress: (callback) => {
        ipcRenderer.on('export:progress', (event, data) => callback(data));
    }
});

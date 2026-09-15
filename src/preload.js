const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('novaCut', {
    openMedia: () => ipcRenderer.invoke('dialog:openMedia'),
    saveExportDialog: (defaultName) => ipcRenderer.invoke('dialog:saveExport', defaultName),
    savePlugin: (pluginData) => ipcRenderer.invoke('plugin:save', pluginData),
    loadPlugins: () => ipcRenderer.invoke('plugin:loadAll'),
    exportFFmpeg: (options) => ipcRenderer.invoke('export:ffmpeg', options),
    onExportProgress: (callback) => {
        ipcRenderer.on('export:progress', (event, data) => callback(data));
    },
    importFont: () => ipcRenderer.invoke('font:import'),
    loadCustomFonts: () => ipcRenderer.invoke('font:loadCustom'),
    listProjects: () => ipcRenderer.invoke('project:list'),
    saveProject: (projectData) => ipcRenderer.invoke('project:save', projectData),
    loadProject: (id) => ipcRenderer.invoke('project:load', id),
    deleteProject: (id) => ipcRenderer.invoke('project:delete', id),
    openProjectFile: () => ipcRenderer.invoke('project:openFile')
});


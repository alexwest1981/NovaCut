const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('novaCut', {
    openMedia: () => ipcRenderer.invoke('dialog:openMedia'),
    saveExportDialog: (defaultName) => ipcRenderer.invoke('dialog:saveExport', defaultName),
    savePlugin: (pluginData) => ipcRenderer.invoke('plugin:save', pluginData),
    loadPlugins: () => ipcRenderer.invoke('plugin:loadAll'),
    exportFFmpeg: (options) => ipcRenderer.invoke('export:ffmpeg', options),
    getHwAcceleration: () => ipcRenderer.invoke('export:getHwAcceleration'),
    saveTempExport: (buffer) => ipcRenderer.invoke('export:saveTemp', buffer),
    saveDirectExport: (buffer, filePath) => ipcRenderer.invoke('export:saveDirect', buffer, filePath),
    transcodeExport: (options) => ipcRenderer.invoke('export:transcode', options),
    onExportProgress: (callback) => {
        ipcRenderer.on('export:progress', (event, data) => callback(data));
    },
    importFont: () => ipcRenderer.invoke('font:import'),
    loadCustomFonts: () => ipcRenderer.invoke('font:loadCustom'),
    listProjects: () => ipcRenderer.invoke('project:list'),
    saveProject: (projectData) => ipcRenderer.invoke('project:save', projectData),
    loadProject: (id) => ipcRenderer.invoke('project:load', id),
    deleteProject: (id) => ipcRenderer.invoke('project:delete', id),
    openProjectFile: () => ipcRenderer.invoke('project:openFile'),
    transcribeAudio: (options) => ipcRenderer.invoke('captions:transcribe', options),
    generateAiImage: (options) => ipcRenderer.invoke('ai:generateImage', options),
    locateMediaFile: (filename, fallbackPath) => ipcRenderer.invoke('media:locate', filename, fallbackPath)
});


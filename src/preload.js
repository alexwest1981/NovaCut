const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('novaCut', {
    openMedia: () => ipcRenderer.invoke('dialog:openMedia'),
    saveExportDialog: (defaultName) => ipcRenderer.invoke('dialog:saveExport', defaultName),
    savePlugin: (pluginData) => ipcRenderer.invoke('plugin:save', pluginData),
    loadPlugins: () => ipcRenderer.invoke('plugin:loadAll'),
    exportStartPipe: (options) => ipcRenderer.invoke('export:startPipe', options),
    exportPushFrame: (sessionId, buffer) => ipcRenderer.invoke('export:writeFrame', sessionId, buffer),
    exportFinishPipe: (sessionId) => ipcRenderer.invoke('export:endPipe', sessionId),
    exportCancelPipe: (sessionId) => ipcRenderer.invoke('export:cancelPipe', sessionId),
    getHwAcceleration: () => ipcRenderer.invoke('export:getHwAcceleration'),
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
    captionsStatus: () => ipcRenderer.invoke('captions:status'),
    generateAiImage: (options) => ipcRenderer.invoke('ai:generateImage', options),
    locateMediaFile: (filename, fallbackPath) => ipcRenderer.invoke('media:locate', filename, fallbackPath),
    extractAudioMetadata: (filePath) => ipcRenderer.invoke('audio:extractMetadata', filePath),

    // Social Publishing APIs
    publishOpenStudio: (platform) => ipcRenderer.invoke('publish:openStudio', platform),
    publishShowInFolder: (filePath) => ipcRenderer.invoke('publish:showInFolder', filePath),
    publishYoutubeAuthStatus: () => ipcRenderer.invoke('publish:youtubeAuthStatus'),
    publishYoutubeGetConfig: () => ipcRenderer.invoke('publish:youtubeGetConfig'),
    publishYoutubeSaveConfig: (config) => ipcRenderer.invoke('publish:youtubeSaveConfig', config),
    publishYoutubeLogin: (credentials) => ipcRenderer.invoke('publish:youtubeLogin', credentials),
    publishYoutubeLogout: () => ipcRenderer.invoke('publish:youtubeLogout'),
    publishYoutubeUpload: (data) => ipcRenderer.invoke('publish:youtubeUpload', data),
    onYoutubeUploadProgress: (callback) => {
        ipcRenderer.on('publish:youtubeProgress', (event, data) => callback(data));
    },

    // Online Marketplace & Asset Hub APIs
    downloadOnlineAsset: (options) => ipcRenderer.invoke('marketplace:downloadAsset', options),
    searchFreesound: (options) => ipcRenderer.invoke('marketplace:searchFreesound', options),
    getFreesoundConfig: () => ipcRenderer.invoke('marketplace:getFreesoundConfig'),
    saveFreesoundConfig: (config) => ipcRenderer.invoke('marketplace:saveFreesoundConfig', config)
});


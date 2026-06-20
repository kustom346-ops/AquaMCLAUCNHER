const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    closeWindow: () => ipcRenderer.invoke('window:close'),
    minimizeWindow: () => ipcRenderer.invoke('window:minimize'),
    maximizeWindow: () => ipcRenderer.invoke('window:maximize'),
    isMaximized: () => ipcRenderer.invoke('window:isMaximized'),
    openExternal: (url) => ipcRenderer.invoke('shell:openExternal', url),
    getAppVersion: () => ipcRenderer.invoke('app:getVersion'),
    getVersions: () => ipcRenderer.invoke('launcher:getVersions'),
    getNews: () => ipcRenderer.invoke('launcher:getNews'),
    getAccounts: () => ipcRenderer.invoke('launcher:getAccounts'),
    downloadMinecraft: (opts) => ipcRenderer.invoke('launcher:download', opts),
    launchMinecraft: (opts) => ipcRenderer.invoke('launcher:launch', opts),
    checkUpdate: () => ipcRenderer.invoke('launcher:checkUpdate'),
    
    onLog: (callback) => ipcRenderer.on('launcher:log', (e, msg) => callback(msg)),
    onDownloadProgress: (callback) => ipcRenderer.on('launcher:downloadProgress', (e, data) => callback(data)),
    onError: (callback) => ipcRenderer.on('launcher:error', (e, msg) => callback(msg)),
    onExit: (callback) => ipcRenderer.on('launcher:exit', (e, code) => callback(code)),
    onMaximizeChange: (callback) => ipcRenderer.on('window:maximizeChange', (e, isMax) => callback(isMax)),
});
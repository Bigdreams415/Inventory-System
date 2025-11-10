const { contextBridge, ipcRenderer, app } = require('electron');

// Expose your existing electronAPI
contextBridge.exposeInMainWorld('electronAPI', {
  onUpdateAvailable: (callback) => ipcRenderer.on('update_available', callback),
  onUpdateDownloaded: (callback) => ipcRenderer.on('update_downloaded', callback),
  restartApp: () => ipcRenderer.invoke('restart_app')
});

// Expose resourcesPath for production
contextBridge.exposeInMainWorld('electronResources', {
  resourcesPath: process.resourcesPath  
});

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  loadProgress: () => ipcRenderer.invoke('progress:load'),
  saveProgress: (progress) => ipcRenderer.invoke('progress:save', progress),
  getStoragePath: () => ipcRenderer.invoke('progress:path'),
});

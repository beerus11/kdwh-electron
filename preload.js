const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: ipcRenderer,
  handleCounter: (callback) => ipcRenderer.on('update-counter', callback),
  validationComplete: (callback) => ipcRenderer.on('validation-complete', callback),
  onSave: (callback) => ipcRenderer.on('on-save', callback),
});

window.addEventListener('DOMContentLoaded', () => {
    const replaceText = (selector, text) => {
      const element = document.getElementById(selector)
      if (element) element.innerText = text
    }
  
    for (const type of ['chrome', 'node', 'electron']) {
      replaceText(`${type}-version`, process.versions[type])
    }
  })


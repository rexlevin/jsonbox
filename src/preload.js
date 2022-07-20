const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld(
    'api', {
        devTools: () => {ipcRenderer.send('devTools');},
        reload: () => {ipcRenderer.send('reload');},
        exit: () => {ipcRenderer.send('exit');}
    }
);
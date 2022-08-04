const { contextBridge, ipcRenderer } = require('electron');
const package = require('../package.json');

contextBridge.exposeInMainWorld(
    'api', {
        devTools: () => {ipcRenderer.send('devTools');},
        reload: () => {ipcRenderer.send('reload');},
        getDescription: () => {
            return package.description;
        },
        getVersion: (type) => {
            let version;
            switch(type){
                case "electron":
                    version = process.versions.electron;
                    break;
                case "node":
                    version = process.versions.node;
                    break;
                case "jsonbox":
                    version = package.version;
                    break;
                default:
                    console.info('not all');
                    break;
            }
            return version;
        },
        exit: () => {ipcRenderer.send('exit');}
    }
);
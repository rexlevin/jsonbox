const { contextBridge, ipcRenderer } = require('electron');
const { nanoid, customAlphabet } = require('nanoid');    // nanoid是内部的函数，记得要加{}包起来，否则报错nanoid is not a function
const package = require('../package.json');

contextBridge.exposeInMainWorld(
    'api', {
        notification: (options) => {
            new window.Notification(options.title, options);
        },
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
        exit: () => {ipcRenderer.send('exit');},
        sid: () => {
            const nanoid = customAlphabet('23456789ABDEFGHJLMNQRTY', 8)
            return nanoid()
        },
        modifyTitle: (options, cb) => {
            ipcRenderer.send('modifyTitle', options);
            ipcRenderer.on('modifyTitle-reply', (event, r) => {
                cb(r);
            });
        },
        save2File: (options, content) => {
            ipcRenderer.send('saveFile', options, content);
        },
        openSettings: (options) => {
            ipcRenderer.send('settings');
        }
    }
);
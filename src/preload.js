const { contextBridge, ipcRenderer, shell } = require('electron');
const { nanoid, customAlphabet } = require('nanoid');    // nanoid是内部的函数，记得要加{}包起来，否则报错nanoid is not a function
const package = require('../package.json');

const Store = require('electron-store');  // 引入store

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
        getRepository: (cb) => {
            ipcRenderer.send('repository');
            ipcRenderer.on('repository-reply', (e, r) => {
                cb(r);
            });
        },
        exit: () => {ipcRenderer.send('exit');},
        sid: () => {
            const nanoid = customAlphabet('23456789ABDEFGHJLMNQRTY', 8)
            return nanoid()
        },
        getBoxes(cb) {
            ipcRenderer.send('getBoxes');
            ipcRenderer.on('getBoxes-reply', (e, r) => { cb(r); });
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
            ipcRenderer.send('openSettings');
        },
        exitSettings() {
            ipcRenderer.send('exitSettings');
        },
        openUrl: (url) => {
            shell.openExternal(url);
        },
        getSt(cb) {
            let store = new Store();  // 开启electron-store
            let s = store.get('settings');
            cb(s);
        },
        saveBxs(boxes, cb) {
            let store = new Store();
            store.set('boxes', JSON.parse(boxes));
            cb('ok');
        },
        getSettings(cb) {
            ipcRenderer.send('getSettings');
            ipcRenderer.on('getSettings-reply', (e, r) => {
                cb(r);
            });
        },
        saveSettings(s) {
            ipcRenderer.send('saveSettings', s);
        },
        appCloseHandler(cb) {
            ipcRenderer.on('close', cb);
        },
        saveBoxes(boxes, cb) {
            ipcRenderer.send('saveBoxes', boxes);
            ipcRenderer.on('saveBoxes-reply', (e, r) => {
                cb(r);
            })
        }
    }
);

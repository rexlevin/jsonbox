const { contextBridge, ipcRenderer, shell } = require('electron');
const { nanoid, customAlphabet } = require('nanoid');    // nanoid是内部的函数，记得要加{}包起来，否则报错nanoid is not a function
const package = require('../package.json');

const fs = require('fs')

const Store = require('electron-store');  // 引入store
const store = new Store();

contextBridge.exposeInMainWorld(
    'api', {
        notification: (options) => {
            new window.Notification(options.title, options);
        },
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
        save2File: (options, content, cb) => {
            ipcRenderer.send('saveFile', options, content);
            ipcRenderer.on('saveFile-reply', (e, r) => {
                if(cb) cb(r);
            });
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
        saveBoxs(boxes, activeTab, cb) {
            store.set('boxes', JSON.parse(boxes));
            store.set('activeTab', activeTab);
            cb('ok');
        },
        getBoxes(cb) {
            cb(store.get('boxes'), store.get('activeTab'));
        },
        getSettings(cb) {
            cb(store.get('settings'));
        },
        saveSettings(s) {
            ipcRenderer.send('saveSettings', s);
        },
        saveJSON(fn) {
            ipcRenderer.on('save', fn);
        },
        renameTab(fn) {
            ipcRenderer.on('renameTab', fn);
        },
        searchText(fn) {
            ipcRenderer.on('search', fn);
        },
        newTab(fn) {
            ipcRenderer.on('newTab', fn);
        },
        closeTab(fn) {
            ipcRenderer.on('closeTab', fn);
        },
        appCloseHandler(cb) {
            ipcRenderer.on('close', cb);
        },
        saveBoxes(boxes, cb) {
            ipcRenderer.send('saveBoxes', boxes);
            ipcRenderer.on('saveBoxes-reply', (e, r) => {
                cb(r);
            })
        },
        autoSaveFile(options, cb) {
            fs.writeFile(options.path, options.content, (err) => {
                if(err) return cb({code: '0001', desc: err});
                return cb({code: '0000'});
            });
        }
    }
);

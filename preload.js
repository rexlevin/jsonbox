// const { contextBridge, ipcRenderer, shell } = require('electron');
const { contextBridge, ipcRenderer } = require('electron');
const Store  = require('electron-store');
const { customAlphabet } = require('nanoid');    // nanoid是内部的函数，记得要加{}包起来，否则报错nanoid is not a function
const package = require('./package.json');

const store = new Store();  // 不带参，使用了默认名：config.json

window.addEventListener('DOMContentLoaded', () => {
    document.title = package.description + ' - v' + package.version;
});

contextBridge.exposeInMainWorld(
    'api', {
        saveBoxe: (boxes, callback) => {
            callback(localStorage.setItem('saveBoxes', JSON.stringify(boxes)));
        },
        getBoxe: (callback) => {
            callback(JSON.parse(localStorage.getItem('boxes') || null));
            // callback(JSON.parse(store.get('boxes') || '[]'));
        },
        sid: () => {
            const nanoid = customAlphabet('23456789ABDEFGHJLMNQRTY', 8)
            return nanoid();
        },
        saveWindowState: (isMax, mainPosition) => {
            console.info(isMax, mainPosition);
        },
        saveSettings: () => {},
        getSettings: (fn) => {
            console.info('asdf' + localStorage.getItem('settings'));
            return localStorage.getItem('settings');
        },
        newTab(fn) {
            ipcRenderer.on('newTab', fn);
        }
    }
);
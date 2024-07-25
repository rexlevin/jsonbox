// const { contextBridge, ipcRenderer, shell } = require('electron');
const { contextBridge, ipcRenderer } = require('electron');
const Store  = require('electron-store');
const { customAlphabet } = require('nanoid');    // nanoid是内部的函数，记得要加{}包起来，否则报错nanoid is not a function
const package = require('./package.json');

// 不带参，即使用默认名：config.json
const store = new Store({
    name: 'box'
});

window.addEventListener('DOMContentLoaded', () => {
    document.title = package.description + ' - v' + package.version;
});

// 接收来自主窗口的消息，并作出响应
ipcRenderer.on('closeApp', (event, isMax, position) => {
    console.info(isMax + '=======' + position);
    console.info(event);
    localStorage.setItem('isMax', isMax);
    localStorage.setItem('position', position);
    store.set('isMax', isMax);
    store.set('position', position);
    event.sender.send('close-reply', 'ok');
});

// 接收来自主窗口的消息，并作出响应
ipcRenderer.on('getWindowParams', (event) => {
    // const isMax = localStorage.getItem('isMax') === 'true';
    // const position = localStorage.getItem('position');
    const isMax = store.get('isMax') === 'true';
    const position = store.get('position');
    event.sender.send('window-params-reply', isMax, position);
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
        },
        closeTab(fn) {
            ipcRenderer.on('closeTab', fn);
        },
        // closeApp(ar) {
        //     ipcRenderer.on('closeApp', (ar) => {
        //         console.info(ar + '=======');
        //     });
        // },
    }
);
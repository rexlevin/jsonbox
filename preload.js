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
ipcRenderer.on('getWindowParams', (event) => {
    let isMax = store.get('isMax') === 'true';
    let position = store.get('position');
    event.sender.send('window-params-reply', isMax, position);
});

contextBridge.exposeInMainWorld(
    'api', {
        openSettings: () => {
            ipcRenderer.send('openSettings');
        },
        saveBox: (box) => {
            store.set('box', JSON.parse(box));
        },
        savePosition(isMax, position) {
            store.set('isMax', isMax);
            store.set('position', position);
            return;
        },
        getBox: (callback) => {
            console.info('box from store===%o', (store.get('box') || null));
            callback(store.get('box') || null);
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
        closeApp(fn) {
            // ipcRenderer.on('closeApp', (event, isMax, position) => {
            //     store.set('isMax', isMax);
            //     store.set('position', position);
            //     event.sender.send('close-reply', 'ok');
            // });
            ipcRenderer.on('closeApp', fn);
        },
        closeAppReply() {
            ipcRenderer.send('close-reply', 'ok');
        }
    }
);



// 接收来自主窗口的消息，并作出响应
// ipcRenderer.on('closeApp', (event, isMax, position) => {
//     store.set('isMax', isMax);
//     store.set('position', position);
//     event.sender.send('close-reply', 'ok');
// });
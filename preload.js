// const { contextBridge, ipcRenderer, shell } = require('electron');
const { contextBridge } = require('electron');
const Store  = require('electron-store');
const package = require('./package.json');

const store = new Store();  // 不带参，使用了默认名：config.json

window.addEventListener('DOMContentLoaded', () => {
    document.title = package.description + ' - v' + package.version;
});

contextBridge.exposeInMainWorld(
    'api', {
        saveBoxes: () => {},
        getBoxes: (callback) => {
            callback(JSON.parse(localStorage.getItem('boxes') || '[]'));
            // callback(JSON.parse(store.get('boxes') || '[]'));
        }
    }
);
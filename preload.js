// const { contextBridge, ipcRenderer, shell } = require('electron');
const package = require('./package.json');

// console.info(package);

// contextBridge.exposeInMainWorld();

window.addEventListener('DOMContentLoaded', () => {
    console.info(package);
    document.title = package.description + ' - v' + package.version;
});
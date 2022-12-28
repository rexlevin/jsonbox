const { app, BrowserWindow, Menu, Tray, ipcMain, dialog } = require('electron')
const Store = require('electron-store');  // 引入store
const path = require('path')
const package = require('./package.json')

// 清除启动时控制台的“Electron Security Warning (Insecure Content-Security-Policy)”报错信息
process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true'

let win;
const store = new Store();  // 开启electron-store

app.whenReady().then(() => {
    createTray();
    createWindow()
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
})

app.on('window-all-closed', () => {
    if(process.platform !== 'darwin') app.quit();
});

const createWindow = () => {
    Menu.setApplicationMenu(null);
    
    // 启动恢复主窗口位置和大小
    let isMax = store.get('isMax') ? true : false
        , position = store.get('mainPosition')
        , config = {};
    if(!isMax && !('' == position || undefined == position)) {
        // win.setContentBounds(position)
        config.width = position.width;
        config.height = position.height;
        config.minWidth = position.width;
        config.minHeight = position.height;
        config.x = position.x;
        config.y = position.y;
    } else if(!isMax && ('' == position || undefined == position)) {
        config.width = 800;
        config.height = 600;
    }
    config.minWidth = 600;
    config.minHeight = 600;
    config.icon = path.join(__dirname, './src/logo.png');
    config.webPreferences = {
        preload: path.join(__dirname, './src/preload.js'),
        spellcheck: false
    }
    config.useContentSize = true;

    win = new BrowserWindow(config);
    if(isMax) win.maximize();
    win.loadFile('./src/index.html');
    
    // 关闭主窗口事件，记录窗口大小和位置
    win.on('close', (e) => {
        console.info('close main window, we need record postion of mainWindow and it\'s size');
        store.set('isMax', win.isMaximized());
        store.set('mainPosition', win.getContentBounds())
    });
}

const createTray = () => {
    tray = new Tray(path.join(__dirname, './src/logo.png'));
    const menu = Menu.buildFromTemplate(trayMenuTemplate);
    tray.setContextMenu(menu);
}

const trayMenuTemplate = [{
    label: 'about',
    type: 'normal',
    click: function() {
        dialog.showMessageBox({
            type: 'info',
            title: '关于',
            message: package.name + ':' + package.version + '\n' + package.description + '\nnode:' + process.versions['node'] + '\nchrome:' + process.versions['chrome'] + '\nelectron:' + process.versions['electron']
        });
    }
}, {
    label: 'quit',
    type: 'normal',
    click: function() {
        app.quit();
    }
}]

ipcMain.on('devTools', () => {
    if(win.webContents.isDevToolsOpened()) win.webContents.closeDevTools();
    else win.webContents.openDevTools();
});
ipcMain.on('reload', () => {
    win.reload();
    // win.webContents.reload();
});
ipcMain.on('exit', () => {
    app.quit();
});
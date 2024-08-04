const { app, BrowserWindow, Menu, Tray, ipcMain, dialog, shell } = require('electron')
const path = require('path')
const Store  = require('electron-store');
const { sandboxed } = require('process');

Store.initRenderer();

// 清除启动时控制台的“Electron Security Warning (Insecure Content-Security-Policy)”报错信息
process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true'

// 禁用当前应用程序的硬件加速
app.disableHardwareAcceleration();

const isDarwin = process.platform === 'darwin' ? true : false;

let win, winSettings = null;

app.whenReady().then(() => {
    createWindow()
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    })
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

const createWindow = () => {
    Menu.setApplicationMenu(Menu.buildFromTemplate(menuTemplate));

    // 启动恢复主窗口位置和大小
    // let isMax = localStorage.getItem('isMax')
    //     , position = localStorage.getItem('position')
    let config = {};
    config.minWidth = 820;
    config.minHeight = 600;
    config.icon = path.join(__dirname, 'logo.png');
    config.webPreferences = {
        sandbox: false,     // 没有这个配置，加载不到 preload.js
        preload: path.join(__dirname, 'preload.js'),
        // preload: 'http://localhost:13000',
        spellcheck: false
    }
    config.useContentSize = true;
    config.show = false;
    config.autoHideMenuBar = true;

    win = new BrowserWindow(config);

    win.webContents.send('getWindowParams');

    win.loadURL('file://' + __dirname + '/dist/index.html');

    // 打开开发者窗口
    // win.webContents.openDevTools();

    win.on('ready-to-show', () => {
        win.show();
    });

    // 关闭主窗口事件，记录窗口大小和位置
    win.on('close', (e) => {
        e.preventDefault();     // 阻止默认事件
        let isMax = win.isMaximized()
            , mainPosition = win.getContentBounds();
        console.info('now will close app');
        win.webContents.send('closeApp', isMax, mainPosition);
    });
}

function openSettings() {
    if(winSettings) {
        winSettings.focus();
        return;
    }
    let config = {
        width: 800,
        height: 600,
        resizable: false,
        icon: path.join(__dirname, 'logo.png'),
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            spellcheck: false
        },
        show: false,
        autoHideMenuBar: true
    };
    winSettings = new BrowserWindow(config);
    winSettings.loadURL('file://' + __dirname + '/dist/index.html#settings');
    winSettings.on('close', () => {
        winSettings = null;
    });
    winSettings.on('ready-to-show', () => {
        winSettings.show();
    });
}

const menuTemplate = [{
    label: 'File',
    submenu: [{
        label: 'Save JSON',
        accelerator: isDarwin ? 'Cmd+S' : 'Ctrl+S',
        click: () => {
            win.webContents.send('save');
        }
    }, {
        type: 'separator'
    }, {
        // role: 'Exit',
        label: 'Exit',
        accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
        click: () => { app.quit(); }
    }]
}, {
    label: 'Edit',
    submenu: [{
        label: 'Rename Tab',
        accelerator: 'F2',
        click: () => {
            win.webContents.send('renameTab');
        }
    }, {
        label: 'Search',
        accelerator: isDarwin ? 'Cmd+F' : 'Ctrl+F',
        click: () => {
            win.webContents.send('search');
        }
    }, {
        label: 'New Tab',
        accelerator: isDarwin ? 'Cmd+T' : 'Ctrl+T',
        click: () => {
            win.webContents.send('newTab');
        }
    }, {
        label: 'Close Tab',
        accelerator: isDarwin ? 'Cmd+W' : 'Ctrl+W',
        click: () => {
            win.webContents.send('closeTab');
        }
    }]
}, {
    label: 'Help',
    submenu: [{
        label: 'Config',
        accelerator: 'Alt+S',
        click: () => {
            openSettings();
        }
    }, {
        label: 'Reload App',
        accelerator: isDarwin ? 'Cmd+R' : 'Ctrl+R',
        click: () => { win.reload(); }
    }, {
        label: 'Toggle Developer Tools',
        accelerator: isDarwin ? 'Alt+Cmd+I' : 'Alt+Shift+I',
        click: () => {
            if (win.webContents.isDevToolsOpened()) win.webContents.closeDevTools();
            else win.webContents.openDevTools();
        }
    }, {
        type: 'separator'
    }, {
        label: 'HomePage',
        click: () => {
            shell.openExternal('https://docs.r-xnoro.com/jsonbox/#/');
        }
    }, {
        label: 'About',
        click: () => {
            openAbout();
        }
    }]
}];

ipcMain.on('close-reply', (e, r) => {
    console.info('now close app==' + r);
    app.exit();
});
ipcMain.on('window-params-reply', (e, isMax, position) => {
    console.info('isMax===' + isMax + ', position==' + position);
    if (isMax) win.maximize();
    // 启动恢复主窗口位置和大小
    if (!isMax && !('' == position || undefined == position)) {
        win.setContentBounds(position)
    }
});
ipcMain.on('openSettings', () => {
    openSettings();
});
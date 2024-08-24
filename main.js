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
    createWindow();
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    })
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

const createWindow = () => {
    // Menu.setApplicationMenu(Menu.buildFromTemplate(menuTemplate));
    // Menu.setApplicationMenu(null);

    let config = {
        minWidth: 820,
        minHeight: 600,
        icon: path.join(__dirname, 'logo.png'),
        webPreferences: {
            sandbox: false,     // 没有这个配置，加载不到 preload.js
            preload: path.join(__dirname, 'preload.js'),
            // preload: 'http://localhost:13000',
            spellcheck: false
        },
        useContentSize: true,
        show: false,
        autoHideMenuBar: true,
    };

    win = new BrowserWindow(config);

    win.webContents.send('getWindowParams');

    // win.loadURL('file://' + __dirname + '/dist/index.html');
    // win.loadURL('file://${__dirname}/dist/index.html');
    win.loadURL(path.join('file://', __dirname, '/dist/index.html'));
    
    // win.setMenu(Menu.buildFromTemplate(menuTemplate));
    win.setMenu(null);

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

// function openSettings() {
//     if(winSettings) {
//         winSettings.focus();
//         return;
//     }
//     let config = {
//         width: 700,
//         height: 500,
//         resizable: false,
//         icon: path.join(__dirname, 'logo.png'),
//         webPreferences: {
//             sandbox: false,     // 没有这个配置，加载不到 preload.js
//             preload: path.join(__dirname, 'preload.js'),
//             spellcheck: false
//         },
//         show: false,
//         autoHideMenuBar: true,

//     };
//     winSettings = new BrowserWindow(config);
//     // winSettings.loadURL('file://' + __dirname + '/dist/index.html#/settings');
//     winSettings.loadURL(path.join('file://', __dirname, '/dist/index.html#/settings'));
//     winSettings.on('close', () => {
//         winSettings = null;
//     });
//     winSettings.on('ready-to-show', () => {
//         winSettings.show();
//     });
//     // 打开开发者窗口
//     winSettings.webContents.openDevTools();
// }

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
ipcMain.on('reload', () => {
    win.reload();
});
ipcMain.on('openDevTools', () => {
    // win.webContents.openDevTools();
    if(win.webContents.isDevToolsOpened()) win.webContents.closeDevTools();
    else win.webContents.openDevTools();
});

// 设置一个map集合，用于存放所有打开的window
const windowMap = new Map();
ipcMain.on('openWindow',(e, url, name, options) => {
    if(windowMap.has(name)) {
        console.info(name + ' is already exists');
        return;
    }
    console.info('openWindow, url: '+ url + ', name: '+ name + ', option: '+ options);
    let winNew = new BrowserWindow(JSON.parse(options));
    // winSettings.loadURL(path.join('file://', __dirname, '/dist/index.html#/settings'));
    url = path.join('file://',  __dirname, '/dist/' + url);
    // console.info('loadURL, url: '+ url);
    winNew.loadURL(url);
    winNew.setMenu(null);
    // winNew.setMenu(null);
    windowMap.set(name, {
        url: url,
        option: options
    });
    winNew.on('close', () => {
        windowMap.delete(name);
    });
});
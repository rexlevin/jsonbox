const { app, BrowserWindow, Menu, MenuItem, Tray, ipcMain, dialog } = require('electron')
const Store = require('electron-store');  // 引入store
const path = require('path')
const package = require('./package.json')
const prompt = require('custom-electron-prompt')
const fs = require('fs');
const { toUnicode } = require('punycode');

// 清除启动时控制台的“Electron Security Warning (Insecure Content-Security-Policy)”报错信息
process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true'

// 禁用当前应用程序的硬件加速
app.disableHardwareAcceleration();

const store = new Store();  // 开启electron-store
const menu = new Menu();

const isDarwin = process.platform === 'darwin' ? true : false;

let win, winSettings = null;

app.whenReady().then(() => {
    // createTray();
    createWindow()
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
})

app.on('window-all-closed', () => {
    if(process.platform !== 'darwin') app.quit();
});

const createWindow = () => {
    Menu.setApplicationMenu(Menu.buildFromTemplate(menuTemplate));
    
    // 启动恢复主窗口位置和大小
    let isMax = store.get('isMax') ? true : false
        , position = store.get('mainPosition')
        , config = {};
    config.minWidth = 820;
    config.minHeight = 600;
    config.icon = path.join(__dirname, './src/logo.png');
    config.webPreferences = {
        preload: path.join(__dirname, './src/preload.js'),
        spellcheck: false
    }
    config.useContentSize = true;
    config.show = false;

    win = new BrowserWindow(config);
    if(isMax) win.maximize();
    win.loadFile('./src/index.html');

    // 打开开发者窗口
    // win.webContents.openDevTools();
    
    // 启动恢复主窗口位置和大小
    if(!isMax && !('' == position || undefined == position)) {
        win.setContentBounds(position)
    }

    win.on('ready-to-show', ()=>{
        win.show();
    });
    
    // 关闭主窗口事件，记录窗口大小和位置
    win.on('close', (e) => {
        e.preventDefault();     // 阻止默认事件
        let s = store.get('settings')
            , closeAppConfirm = false;
        if(undefined === s) closeAppConfirm = false;
        else if(undefined === s.closeAppConfirm) closeAppConfirm = false;
        else closeAppConfirm = s.closeAppConfirm;
        if(!closeAppConfirm) {
            store.set('isMax', win.isMaximized());
            store.set('mainPosition', win.getContentBounds());
            if(null != winSettings) winSettings.close();    // 关闭子窗口
            // 这里窗口关闭时向渲染进程发送关闭消息，因为需要判断是否要保存 boxes
            win.webContents.send('close');
        } else {
            dialog.showMessageBox({
                type: 'info',
                title: '确认关闭',
                defaultId: 0,
                message: '是否要退出 JsonBox ?',
                buttons: ['取消', '退出']
            }).then(result => {
                // console.info(result);
                // if(0 === result.response) {
                //     // 取消
                //     return;
                // }
                if(1 === result.response) {
                    // 确认退出
                    store.set('isMax', win.isMaximized());
                    store.set('mainPosition', win.getContentBounds());
                    if(null != winSettings) winSettings.close();    // 关闭子窗口
                    // 这里窗口关闭时向渲染进程发送关闭消息，因为需要判断是否要保存 boxes
                    win.webContents.send('close');
                }
            });
        }
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
        icon: path.join(__dirname, './src/logo.png'),
        webPreferences: {
            preload: path.join(__dirname, './src/preload.js'),
            spellcheck: false
        },
        show: false
    };
    winSettings = new BrowserWindow(config);
    winSettings.loadFile('./src/settings.html');
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
        // accelerator: process.platform === 'darwin' ? 'Alt+Cmd+I' : 'Alt+Shift+I',
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
            if(win.webContents.isDevToolsOpened()) win.webContents.closeDevTools();
            else win.webContents.openDevTools();
        }
    }, {
        type: 'separator'
    }, {
        label: 'About'
    }]
}];

const createTray = () => {
    let tray = new Tray(path.join(__dirname, './src/logo.png'));
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

ipcMain.on('modifyTitle', (event, options) => {
    let result = {}
        , et = event;
    // 这是修改 tab title 的弹框，需要把 win 作为父窗口
    prompt(options, win)
    .then((r) => {
        if(r === null) {
            result = {code: '0001'};
            et.reply('modifyTitle-reply', result);
        } else {
            result = {code: '0000', body: r};
            et.reply('modifyTitle-reply', result);
        }
    })
    .catch(console.error);
    // event.reply('modifyTitle-reply', result);
});
ipcMain.on('saveFile', (e, options, content, cb) => {
    dialog.showSaveDialog(win, options).then(r => {
        if(r.canceled) {
            console.info('user canceled');
        } else {
            // console.info('file path is==%s', r.filePath);
            fs.writeFile(r.filePath, content, (err) => {
                if(err) e.reply('saveFile-reply', {code: '001'});
                e.reply('saveFile-reply', {code: '0000', body: r.filePath});
            })
        }
    });
});
ipcMain.on('openSettings', () => {
    openSettings();
});
ipcMain.on('exitSettings', () => {
    winSettings.close();
});
ipcMain.on('repository', (event) => {
    let locale = app.getLocale()
        , url = ''
    // 使用ip的话要么自己维护一个ip库放在外部（太大，没必要放项目里），要么使用第三方，都需要进行网络交互
    // 所以这里使用一个最粗略的方式“语言环境”来判断是否是中国大陆
    if(locale.indexOf('zh-CN') == -1) {
        url = 'https://github.com/rexlevin/jsonbox'
    } else {
        url = 'https://gitee.com/rexlevin/jsonbox'
    }
    event.reply('repository-reply', url);
});
ipcMain.on('getSettings', (event) => {
    let s = store.get('settings')
    event.reply('getSettings-reply', s);
});
ipcMain.on('saveSettings', (e, settings) => {
    store.set('settings', JSON.parse(settings));
})
ipcMain.on('getBoxes', (e) => {
    let boxes = store.get('boxes');
    e.reply('getBoxes-reply', boxes);
});
ipcMain.on('close-reply', (e, r) => {
    app.exit();
});
ipcMain.on('saveBoxes', (e, boxes) => {
    store.set('boxes', JSON.parse(boxes));
    e.reply('saveBoxes-reply', 'ok');
});
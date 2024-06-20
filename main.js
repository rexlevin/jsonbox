const { app, BrowserWindow, Menu, Tray, ipcMain, dialog, shell } = require('electron')
const path = require('path')
const Store = require('electron-store');  // 引入store
const { sandboxed } = require('process');

// 清除启动时控制台的“Electron Security Warning (Insecure Content-Security-Policy)”报错信息
process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true'

// 禁用当前应用程序的硬件加速
app.disableHardwareAcceleration();

const store = new Store();  // 开启electron-store

const isDarwin = process.platform === 'darwin' ? true : false;

let win, winSettings = null;

app.whenReady().then(() => {
    createWindow()
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
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
    config.icon = path.join(__dirname, 'logo.png');
    config.webPreferences = {
        sandbox: false,     // 没有这个配置，加载不到 preload.js
        preload: path.join(__dirname, 'preload.js'),
        spellcheck: false
    }
    config.useContentSize = true;
    config.show = false;
    config.autoHideMenuBar = true;

    win = new BrowserWindow(config);
    if(isMax) win.maximize();
    win.loadFile('dist/index.html');

    // 打开开发者窗口
    win.webContents.openDevTools();
    
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
        let s = win.webContents.send('getSettings')
            , closeAppConfirm = false;
        console.info('s===' + s);
        if(undefined === s) closeAppConfirm = false;
        else if(undefined === s.closeAppConfirm) closeAppConfirm = false;
        else closeAppConfirm = s.closeAppConfirm;
        if(!closeAppConfirm) {
            // store.set('isMax', win.isMaximized());
            // store.set('mainPosition', win.getContentBounds());
            let isMax = win.isMaximized()
                , mainPosition = win.getContentBounds();
            win.webContents.send('saveWindowState', isMax, mainPosition);
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
            if(win.webContents.isDevToolsOpened()) win.webContents.closeDevTools();
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
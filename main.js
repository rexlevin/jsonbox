const { app, BrowserWindow, Menu, Tray } = require('electron')
const path = require('path')

app.whenReady().then(() => {
    // createTray();
    createWindow()
})

app.on('window-all-closed', () => {
    if(process.platform !== 'darwin') app.quit();
});

const createWindow = () => {
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        minWidth: 800,
        minHeight: 600,
        icon: path.join(__dirname, './src/logo.png'),
        webPreferences: {
            preload: path.join(__dirname, './src/preload.js'),
            spellcheck: false
        },
        useContentSize: true
    });
    win.loadFile('./src/index.html');
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
        alert('jsonbox');
    }
}, {
    label: 'quit',
    type: 'normal',
    click: function() {
        app.quit();
    }
}]
const { app, BrowserWindow, shell } = require('electron');
const path = require('path');
const { autoUpdater } = require('electron-updater'); // Adiciona auto-update

function createWindow () {
  const win = new BrowserWindow({
    width: 1050,
    height: 825,
    autoHideMenuBar: true,
    resizable: false,
    icon: path.join(__dirname, 'icon.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  win.loadFile('index.html');

  // Intercepta novas janelas e abre no navegador
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Intercepta cliques em links externos
  win.webContents.on('will-navigate', (event, url) => {
    const currentURL = win.webContents.getURL();
    if (url !== currentURL) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });
}

app.whenReady().then(() => {
  createWindow();
  autoUpdater.checkForUpdatesAndNotify(); // Verifica e aplica atualizações

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
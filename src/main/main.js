const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const { initDB } = require('./db');
const { registerHandlers } = require('./ipc-handlers');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    autoHideMenuBar: true,
    setMenuBarVisibility: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    },
    backgroundColor: '#0f172a',
    title: 'Cert Vault - Gestor de Certificados Digitales'
  });

  mainWindow.maximize();

  const isDev = process.env.NODE_ENV === 'development';
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'renderer', 'dist', 'index.html'));
  }

  ipcMain.handle('window:setBackgroundColor', (event, color) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.setBackgroundColor(color);
    }
  });
}

app.whenReady().then(() => {
  initDB();
  registerHandlers(ipcMain, dialog, mainWindow);
  createWindow();
});

app.on('window-all-closed', () => {
  app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

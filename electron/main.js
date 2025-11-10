const { app, BrowserWindow } = require('electron');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const http = require('http');

const isDev = !app.isPackaged;
let mainWindow;
let splashWindow;
let backendProcess;

const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) app.quit();
else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  function createSplash() {
    splashWindow = new BrowserWindow({
      width: 400,
      height: 400,
      frame: false,
      alwaysOnTop: true,
      resizable: false,
      transparent: true,
      center: true,
      show: false,
      webPreferences: { nodeIntegration: false, contextIsolation: true },
    });
    splashWindow.loadFile(path.join(__dirname, 'splash.html'));
    splashWindow.once('ready-to-show', () => splashWindow.show());
  }

  function createMainWindow() {
    if (mainWindow) return mainWindow.focus();

    mainWindow = new BrowserWindow({
      width: 1400,
      height: 900,
      show: false,
      title: 'Solomon Medicals POS',
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, 'preload.js'),
        webSecurity: false,
      },
      icon: path.join(__dirname, isDev ? '../public/logo.png' : '../build/logo.png'),
    });

    const startUrl = isDev
      ? 'http://localhost:3000'
      : `file://${path.join(__dirname, '../build/index.html')}`;

    mainWindow.loadURL(startUrl);

    mainWindow.once('ready-to-show', () => {
      if (splashWindow) {
        splashWindow.close();
        splashWindow = null;
      }
      mainWindow.show();
    });

    mainWindow.on('closed', () => (mainWindow = null));
    if (isDev) mainWindow.webContents.openDevTools();
  }

  function startBackend() {
    if (backendProcess) return;

    const serverPath = isDev
      ? path.join(__dirname, '../server/index.js')
      : path.join(process.resourcesPath, 'server', 'index.js');

    const nodePath = process.execPath;

    if (!fs.existsSync(serverPath)) {
      console.error('❌ Backend not found:', serverPath);
      return;
    }

    backendProcess = spawn(nodePath, [serverPath], {
      env: { ...process.env, NODE_ENV: isDev ? 'development' : 'production', PORT: '3001' },
    });

    backendProcess.stdout.on('data', data => console.log(`[BACKEND] ${data}`));
    backendProcess.stderr.on('data', data => console.error(`[BACKEND ERROR] ${data}`));
    backendProcess.on('exit', code => console.log('Backend exited with', code));
    backendProcess.on('error', err => console.error('Backend spawn error:', err));
  }

  function stopBackend() {
    if (backendProcess) {
      backendProcess.kill('SIGTERM');
      backendProcess = null;
    }
  }

  function waitForBackend() {
    const MAX_RETRIES = 60;
    let retries = 0;

    const check = () => {
      const req = http.get('http://localhost:3001/api/health', res => {
        if (res.statusCode === 200) createMainWindow();
        else scheduleRetry();
      });
      req.on('error', scheduleRetry);
      req.setTimeout(3000, () => {
        req.destroy();
        scheduleRetry();
      });
    };

    const scheduleRetry = () => {
      retries++;
      if (retries >= MAX_RETRIES) {
        console.error('Backend failed to start');
        app.quit();
        return;
      }
      setTimeout(check, 500);
    };

    check();
  }

  app.whenReady().then(() => {
    createSplash();
    startBackend();
    waitForBackend();
  });

  app.on('window-all-closed', () => {
    stopBackend();
    if (process.platform !== 'darwin') app.quit();
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
  });

  process.on('uncaughtException', err => console.error('Uncaught Exception:', err));
  process.on('unhandledRejection', (reason, p) => console.error('Unhandled Rejection:', reason));
}

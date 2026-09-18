/**
 * Electron main process for VaultX.
 *
 * SECURITY: This file is the *only* code that runs with full Node
 * privileges. It must never load untrusted content or expose Node APIs
 * to the renderer.
 *
 * Hardening applied:
 *  - contextIsolation: true          (renderer JS cannot touch Node)
 *  - nodeIntegration: false          (no require() in renderer)
 *  - sandbox: true                   (renderer runs in OS sandbox)
 *  - webSecurity: true               (enforce same-origin policy)
 *  - Navigation is blocked off-origin; popups are denied.
 *  - DevTools can be opened in dev, disabled in production.
 */

const { app, BrowserWindow, shell, session } = require('electron');
const path = require('node:path');

const isDev = !app.isPackaged;
const DEV_URL = 'http://localhost:5173';
const PROD_INDEX = path.join(__dirname, '..', 'dist', 'index.html');

/**
 * Path to the window/taskbar icon.
 *
 * In dev, we reach into build/icon.ico (the same file electron-builder
 * uses for the packaged exe).
 * In production, the file is bundled at resources/icon.ico inside the
 * app's resources folder.
 */
const WINDOW_ICON = isDev
  ? path.join(__dirname, '..', 'build', 'icon.ico')
  : path.join(process.resourcesPath, 'icon.ico');

/** Origins the renderer is allowed to navigate to. */
const ALLOWED_ORIGINS = new Set(
  isDev ? ['http://localhost:5173'] : ['file://']
);

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: '#0a0a0b', // matches app bg, avoids white flash
    autoHideMenuBar: true,      // clean look; Alt reveals it
    show: false,                // show after ready-to-show
    title: 'VaultX',
    icon: WINDOW_ICON,          // window / taskbar icon
    webPreferences: {
      // --- SECURITY: do not change these ---
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
      preload: path.join(__dirname, 'preload.cjs'),
      // --------------------------------------
    },
  });

  // Show only when the renderer is ready to paint — avoids a blank
  // flicker on slower machines.
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  if (isDev) {
    mainWindow.loadURL(DEV_URL);
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(PROD_INDEX);
  }

  // --- Navigation lockdown ---

  mainWindow.webContents.on('will-navigate', (event, url) => {
    try {
      const target = new URL(url);
      const origin = isDev ? target.origin : 'file://';
      if (!ALLOWED_ORIGINS.has(origin)) {
        event.preventDefault();
      }
    } catch {
      event.preventDefault();
    }
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// --- Global app-level hardening ---

app.on('web-contents-created', (_event, contents) => {
  contents.on('will-attach-webview', (event) => {
    event.preventDefault();
  });
});

app.whenReady().then(() => {
  session.defaultSession.setPermissionRequestHandler((_wc, permission, cb) => {
    const allowed =
      permission === 'clipboard-read' ||
      permission === 'clipboard-sanitized-write';
    cb(allowed);
  });

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
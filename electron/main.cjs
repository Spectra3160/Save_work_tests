const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const http = require('http');

const DIST_DIR = path.join(__dirname, '..', 'dist');
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.pdf': 'application/pdf',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.woff2': 'font/woff2',
};

function getProgressFilePath() {
  return path.join(app.getPath('userData'), 'progress.json');
}

function startStaticServer() {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      try {
        const cleanUrl = decodeURIComponent((req.url || '/').split('?')[0]);
        let filePath = path.join(DIST_DIR, cleanUrl === '/' ? 'index.html' : cleanUrl);
        if (!filePath.startsWith(DIST_DIR)) {
          res.writeHead(403);
          res.end('Forbidden');
          return;
        }
        if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
          filePath = path.join(DIST_DIR, 'index.html');
        }
        const ext = path.extname(filePath).toLowerCase();
        res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
        fs.createReadStream(filePath).pipe(res);
      } catch (err) {
        res.writeHead(500);
        res.end('Internal Error');
      }
    });

    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      resolve({ server, port: address.port });
    });
  });
}

let staticServer = null;

async function createWindow() {
  const { server, port } = await startStaticServer();
  staticServer = server;

  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 840,
    minWidth: 960,
    minHeight: 640,
    title: 'Охрана труда — Интерактивный тренажёр',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  await mainWindow.loadURL(`http://127.0.0.1:${port}/`);
}

ipcMain.handle('progress:load', async () => {
  const filePath = getProgressFilePath();
  try {
    if (!fs.existsSync(filePath)) return null;
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
});

ipcMain.handle('progress:save', async (_event, payload) => {
  const filePath = getProgressFilePath();
  try {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(payload, null, 2), 'utf-8');
    return { ok: true, path: filePath };
  } catch {
    return { ok: false };
  }
});

ipcMain.handle('progress:path', async () => getProgressFilePath());

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (staticServer) {
    staticServer.close();
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

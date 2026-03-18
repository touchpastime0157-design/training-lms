const { app, BrowserWindow } = require('electron');
const path = require('path');
const http = require('http');
const fs = require('fs');

const isDev = !app.isPackaged;
let port = 0;

function serveApp(appPath) {
  const server = http.createServer((req, res) => {
    // Basic normalized URL resolving
    let requestPath = req.url.split('?')[0];

    // Decode URL to handle Japanese filenames or special chars if any
    try {
      requestPath = decodeURIComponent(requestPath);
    } catch (e) {}

    let filePath = path.join(appPath, requestPath);

    // Check if path exists and what it is
    fs.stat(filePath, (err, stats) => {
      if (!err) {
        if (stats.isDirectory()) {
          // It's a directory, look for index.html inside
          filePath = path.join(filePath, 'index.html');
        }
      } else {
        // Path doesn't exist as is, try appending .html (Standard Next.js export behavior)
        if (fs.existsSync(filePath + '.html')) {
          filePath += '.html';
        } else {
          // Still not found, could be a client-side route, fallback to root index.html
          filePath = path.join(appPath, 'index.html');
        }
      }

      // Final check and read
      fs.readFile(filePath, (error, content) => {
        if (error) {
          res.writeHead(404);
          res.end('File not found');
          return;
        }

        // Expanded MIME types
        let ext = path.extname(filePath).toLowerCase();
        let mimeTypes = {
          '.html': 'text/html',
          '.js': 'text/javascript',
          '.css': 'text/css',
          '.json': 'application/json',
          '.png': 'image/png',
          '.jpg': 'image/jpg',
          '.jpeg': 'image/jpeg',
          '.svg': 'image/svg+xml',
          '.gif': 'image/gif',
          '.woff': 'font/woff',
          '.woff2': 'font/woff2',
          '.ttf': 'font/ttf',
          '.otf': 'font/otf',
          '.wasm': 'application/wasm',
          '.ico': 'image/x-icon'
        };

        const contentType = mimeTypes[ext] || 'application/octet-stream';
        res.writeHead(200, {
          'Content-Type': contentType,
          'Access-Control-Allow-Origin': '*' // Helpful for some integrations
        });
        res.end(content, 'utf-8');
      });
    });
  });

  return new Promise((resolve) => {
    // ポートを固定することで Origin (http://127.0.0.1:39393) を一定に保ち、
    // localStorage のデータが消えないようにします。
    const FIXED_PORT = 39393;
    server.listen(FIXED_PORT, '127.0.0.1', () => {
      resolve(FIXED_PORT);
    });
  });
}

async function createWindow() {
  if (!isDev) {
    port = await serveApp(path.join(__dirname, 'out'));
  }

  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
    autoHideMenuBar: true,
  });

  win.maximize();

  if (isDev) {
    win.loadURL('http://localhost:3000');
    win.webContents.openDevTools();
  } else {
    win.loadURL(`http://127.0.0.1:${port}`);
    // プロダクションでも不具合調査用にDevToolsを一時的に有効化したい場合は以下をコメント解除
    // win.webContents.openDevTools();
  }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

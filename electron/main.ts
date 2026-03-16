import { app, BrowserWindow, ipcMain } from 'electron'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

import {
  initDatabase,
  getAllVideos,
  getVideoById,
  insertVideo,
  getProgress,
  saveProgress,
} from './db'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.mjs
// │
process.env.APP_ROOT = path.join(__dirname, '..')

// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST

let win: BrowserWindow | null

function createWindow() {
  win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC, 'electron-vite.svg'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
    },
  })

  // Test active push message to Renderer-process.
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString())
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
    win.webContents.openDevTools()
  } else {
    // win.loadFile('dist/index.html')
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }
}

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

function setupIpcHandlers() {
  initDatabase()

  ipcMain.handle('db:getAllVideos', () => getAllVideos())

  ipcMain.handle('db:getVideoById', (_event, id: number) => getVideoById(id))

  ipcMain.handle('db:insertVideo', (_event, title: string, youtubeId: string, duration: number) =>
    insertVideo(title, youtubeId, duration)
  )

  ipcMain.handle('db:getProgress', (_event, userId: string, videoId: number) =>
    getProgress(userId, videoId)
  )

  ipcMain.handle('db:saveProgress', (
    _event,
    userId: string,
    videoId: number,
    watchedSeconds: number,
    lastPosition: number,
    completed: boolean
  ) => {
    // 無効値は保存しない（レンダラー側の一時的不整合などに耐える）
    if (!userId) return
    if (!Number.isFinite(videoId) || videoId <= 0) return
    if (!Number.isFinite(watchedSeconds) || watchedSeconds < 0) return
    if (!Number.isFinite(lastPosition) || lastPosition < 0) return

    saveProgress(userId, videoId, watchedSeconds, lastPosition, completed)
  })
}

app.whenReady().then(() => {
  setupIpcHandlers()
  createWindow()
})

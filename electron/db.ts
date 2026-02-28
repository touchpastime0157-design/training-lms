import Database from 'better-sqlite3'
import { app } from 'electron'
import path from 'node:path'

let db: Database.Database | null = null

export function initDatabase(): Database.Database {
  if (db) return db

  const userDataPath = app.getPath('userData')
  const dbPath = path.join(userDataPath, 'lms.db')
  db = new Database(dbPath)

  db.exec(`
    CREATE TABLE IF NOT EXISTS videos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      youtubeId TEXT NOT NULL UNIQUE,
      duration REAL NOT NULL
    );

    CREATE TABLE IF NOT EXISTS progress (
      userId TEXT NOT NULL,
      videoId INTEGER NOT NULL,
      watchedSeconds REAL NOT NULL DEFAULT 0,
      lastPosition REAL NOT NULL DEFAULT 0,
      completed INTEGER NOT NULL DEFAULT 0,
      updatedAt INTEGER NOT NULL,
      PRIMARY KEY (userId, videoId),
      FOREIGN KEY (videoId) REFERENCES videos(id)
    );

    CREATE INDEX IF NOT EXISTS idx_progress_user ON progress(userId);
  `)

  // 仮の動画データを3件シード（youtubeId が存在しないものだけ追加）
  const seedVideos = [
    { title: 'LMSデモ動画', youtubeId: 'ht3-G5Eurks', duration: 600 },
    { title: 'サンプル動画1', youtubeId: 'jNQXAC9IVRw', duration: 19 },
    { title: 'サンプル動画2', youtubeId: 'dQw4w9WgXcQ', duration: 212 },
  ]
  const insert = db.prepare('INSERT OR IGNORE INTO videos (title, youtubeId, duration) VALUES (?, ?, ?)')
  for (const v of seedVideos) {
    insert.run(v.title, v.youtubeId, v.duration)
  }

  return db
}

export function getDb(): Database.Database {
  if (!db) throw new Error('Database not initialized')
  return db
}

export interface Video {
  id: number
  title: string
  youtubeId: string
  duration: number
}

export interface Progress {
  userId: string
  videoId: number
  watchedSeconds: number
  lastPosition: number
  completed: boolean
  updatedAt: number
}

export function getAllVideos(): Video[] {
  const database = getDb()
  const rows = database.prepare('SELECT id, title, youtubeId, duration FROM videos').all() as Video[]
  return rows
}

export function getVideoById(id: number): Video | undefined {
  const database = getDb()
  const row = database.prepare('SELECT id, title, youtubeId, duration FROM videos WHERE id = ?').get(id) as Video | undefined
  return row
}

export function insertVideo(title: string, youtubeId: string, duration: number): number {
  const database = getDb()
  const result = database.prepare('INSERT INTO videos (title, youtubeId, duration) VALUES (?, ?, ?)').run(title, youtubeId, duration)
  return result.lastInsertRowid as number
}

export function getProgress(userId: string, videoId: number): Progress | undefined {
  const database = getDb()
  const row = database.prepare(`
    SELECT userId, videoId, watchedSeconds, lastPosition, completed, updatedAt
    FROM progress WHERE userId = ? AND videoId = ?
  `).get(userId, videoId) as { userId: string; videoId: number; watchedSeconds: number; lastPosition: number; completed: number; updatedAt: number } | undefined

  if (!row) return undefined
  return {
    ...row,
    completed: row.completed === 1,
  }
}

/**
 * 進捗を保存。セキュリティ: watchedSeconds は増加方向のみ許可、最大値のみ保存
 */
export function saveProgress(
  userId: string,
  videoId: number,
  watchedSeconds: number,
  lastPosition: number,
  completed: boolean
): void {
  const database = getDb()
  const now = Date.now()

  if (!userId) throw new Error('userId is required')
  if (!Number.isFinite(videoId) || videoId <= 0) throw new Error('videoId is invalid')
  if (!Number.isFinite(watchedSeconds) || watchedSeconds < 0) throw new Error('watchedSeconds is invalid')
  if (!Number.isFinite(lastPosition) || lastPosition < 0) throw new Error('lastPosition is invalid')

  const existing = getProgress(userId, videoId)
  if (existing) {
    // 増加方向のみ許可
    const newWatchedSeconds = Math.max(existing.watchedSeconds, watchedSeconds)
    const newCompleted = existing.completed || completed

    database.prepare(`
      UPDATE progress SET
        watchedSeconds = ?,
        lastPosition = ?,
        completed = ?,
        updatedAt = ?
      WHERE userId = ? AND videoId = ?
    `).run(newWatchedSeconds, lastPosition, newCompleted ? 1 : 0, now, userId, videoId)
  } else {
    database.prepare(`
      INSERT INTO progress (userId, videoId, watchedSeconds, lastPosition, completed, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(userId, videoId, watchedSeconds, lastPosition, completed ? 1 : 0, now)
  }
}

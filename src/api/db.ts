/**
 * ?????????? DB API?E?EPC ???E?E
 */

import type { Video } from '../types/video'

export type { Video }

export interface Progress {
  userId: string
  videoId: string
  watchedSeconds: number
  lastPosition: number
  completed: boolean
  updatedAt: number
}

declare const window: Window & { ipcRenderer?: { invoke: (channel: string, ...args: unknown[]) => Promise<unknown> } }

function getIpc() {
  const ipc = window.ipcRenderer
  if (!ipc) throw new Error('ipcRenderer not available. This app must run in Electron.')
  return ipc
}

export async function getAllVideos(): Promise<Video[]> {
  const raw = (await getIpc().invoke('db:getAllVideos')) as { id: number; title: string; youtubeId: string; duration: number }[]
  return raw.map((v) => ({ ...v, id: String(v.id) }))
}

export async function getVideoById(id: number): Promise<Video | undefined> {
  const raw = (await getIpc().invoke('db:getVideoById', id)) as { id: number; title: string; youtubeId: string; duration: number } | undefined
  if (!raw) return undefined
  return { ...raw, id: String(raw.id) }
}

export async function getProgress(userId: string, videoId: string): Promise<Progress | undefined> {
  const vidNum = Number(videoId)
  if (!Number.isFinite(vidNum) || vidNum <= 0) return undefined

  const raw = (await getIpc().invoke('db:getProgress', userId, vidNum)) as
    | {
        userId: string
        videoId: number
        watchedSeconds: number
        lastPosition: number
        completed: boolean
        updatedAt: number
      }
    | undefined

  if (!raw) return undefined
  return { ...raw, videoId: String(raw.videoId) }
}

export async function saveProgress(
  userId: string,
  videoId: string,
  watchedSeconds: number,
  lastPosition: number,
  completed: boolean
): Promise<void> {
  if (!userId) return
  const vidNum = Number(videoId)
  if (!Number.isFinite(vidNum) || vidNum <= 0) return
  await getIpc().invoke('db:saveProgress', userId, vidNum, watchedSeconds, lastPosition, completed)
}

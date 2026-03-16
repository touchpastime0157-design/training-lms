/**
 * 動画再生トラッカー composable
 * - 実再生時間のみカウント（シークで飛ばした時間は加算しない）
 * - タブ非アクティブ時は加算停止
 * - バッファリング中は加算しない
 * - 再生速度変更（1.5x等）でも正常加算
 */
import { ref } from 'vue'

const PLAYING = 1
const TICK_INTERVAL_MS = 1000
const DELTA_MIN = 0.5
const DELTA_MAX = 2.0 // 2秒以上はシーク判定。1.5x再生でdelta=1.5を許容
const SAVE_INTERVAL_SEC = 10
const COMPLETION_TOLERANCE_SEC = 2

export interface ProgressState {
  watchedSeconds: number
  lastPosition: number
  completed: boolean
  lastTickTime: number
}

export interface UseVideoProgressOptions {
  userId: string
  videoId: number
  getDuration: () => number
  initialWatchedSeconds: number
  initialLastPosition: number
  initialCompleted: boolean
  onSave: (state: ProgressState) => void | Promise<void>
}

export function useVideoProgress(options: UseVideoProgressOptions) {
  const watchedSeconds = ref(options.initialWatchedSeconds)
  const lastPosition = ref(options.initialLastPosition)
  const completed = ref(options.initialCompleted)
  const lastTickTime = ref(0)
  const lastSavedWatched = ref(options.initialWatchedSeconds)
  let tickTimer: ReturnType<typeof setInterval> | null = null

  const getState = (): ProgressState => ({
    watchedSeconds: watchedSeconds.value,
    lastPosition: lastPosition.value,
    completed: completed.value,
    lastTickTime: lastTickTime.value,
  })

  const saveProgress = async () => {
    await options.onSave(getState())
    lastSavedWatched.value = watchedSeconds.value
  }

  const checkCompletion = () => {
    if (completed.value) return
    const duration = options.getDuration()
    if (duration > 0 && watchedSeconds.value >= duration - COMPLETION_TOLERANCE_SEC) {
      completed.value = true
      saveProgress()
    }
  }

  const startTracking = (
    getCurrentTime: () => number,
    getPlayerState: () => YT.PlayerState
  ) => {
    lastTickTime.value = getCurrentTime()

    const tick = () => {
      // タブが非アクティブの場合は加算しない
      if (document.visibilityState !== 'visible') return

      const state = getPlayerState()
      // 再生中のみ加算（バッファリング中は加算しない）
      if (state !== PLAYING) return

      const currentTime = getCurrentTime()
      const delta = currentTime - lastTickTime.value

      // シーク判定: 2秒以上の飛びは加算しない
      if (delta >= 2) {
        lastTickTime.value = currentTime
        lastPosition.value = currentTime
        return
      }

      // 正常範囲: 0.5〜2秒（1x, 1.5x再生対応）
      if (delta >= DELTA_MIN && delta < DELTA_MAX) {
        watchedSeconds.value += delta
        checkCompletion()
      }

      lastTickTime.value = currentTime
      lastPosition.value = currentTime

      // 10秒ごとに保存
      if (watchedSeconds.value - lastSavedWatched.value >= SAVE_INTERVAL_SEC) {
        saveProgress()
      }
    }

    tickTimer = setInterval(tick, TICK_INTERVAL_MS)
  }

  const stopTracking = () => {
    if (tickTimer) {
      clearInterval(tickTimer)
      tickTimer = null
    }
  }

  const onPause = async (currentTime: number) => {
    lastPosition.value = currentTime
    await saveProgress()
  }

  const onBeforeUnload = () => {
    saveProgress()
  }

  return {
    watchedSeconds,
    lastPosition,
    completed,
    startTracking,
    stopTracking,
    onPause,
    onBeforeUnload,
    saveProgress,
    getState,
  }
}

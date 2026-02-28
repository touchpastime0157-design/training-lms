/**
 * YouTube iframe API ラッパー
 * YT.Player の Promise ベースラッパー
 */

const PLAYING = 1
const PAUSED = 2
const BUFFERING = 3

export function loadYouTubeAPI(): Promise<typeof YT> {
  if (typeof YT !== 'undefined' && YT.Player) {
    return Promise.resolve(YT)
  }
  return new Promise((resolve, reject) => {
    // script が無ければ挿入（index.html にある場合も想定）
    const scriptId = 'youtube-iframe-api'
    const existing = document.getElementById(scriptId) as HTMLScriptElement | null
    if (!existing) {
      const tag = document.createElement('script')
      tag.id = scriptId
      tag.src = 'https://www.youtube.com/iframe_api'
      tag.async = true
      document.head.appendChild(tag)
    }

    // ready コールバックを取り逃がした場合に備えてポーリングも併用
    const start = Date.now()
    const timeoutMs = 10_000

    const prev = (window as unknown as { onYouTubeIframeAPIReady?: () => void }).onYouTubeIframeAPIReady
    ;(window as unknown as { onYouTubeIframeAPIReady: () => void }).onYouTubeIframeAPIReady = () => {
      if (prev) prev()
      if (typeof YT !== 'undefined' && YT.Player) resolve(YT)
    }

    const timer = setInterval(() => {
      if (typeof YT !== 'undefined' && YT.Player) {
        clearInterval(timer)
        resolve(YT)
        return
      }
      if (Date.now() - start > timeoutMs) {
        clearInterval(timer)
        reject(new Error('YouTube iframe API の読み込みがタイムアウトしました'))
      }
    }, 50)
  })
}

export interface YouTubePlayerOptions {
  videoId: string
  width?: number
  height?: number
  startSeconds?: number
  onReady?: (player: YT.Player) => void
  onStateChange?: (state: YT.PlayerState) => void
}

export function createYouTubePlayer(
  containerId: string,
  options: YouTubePlayerOptions
): Promise<YT.Player> {
  return loadYouTubeAPI().then((YT) => {
    return new Promise((resolve) => {
      new YT.Player(containerId, {
        width: options.width ?? 640,
        height: options.height ?? 360,
        videoId: options.videoId,
        playerVars: {
          enablejsapi: 1,
          start: options.startSeconds ?? 0,
        },
        events: {
          onReady: (e) => {
            options.onReady?.(e.target)
            resolve(e.target)
          },
          onStateChange: (e) => options.onStateChange?.(e.data),
        },
      })
    })
  })
}

export function isPlaying(state: YT.PlayerState): boolean {
  return state === PLAYING
}

export function isPaused(state: YT.PlayerState): boolean {
  return state === PAUSED
}

export function isBuffering(state: YT.PlayerState): boolean {
  return state === BUFFERING
}

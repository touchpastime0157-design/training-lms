declare namespace YT {
  type PlayerState = -1 | 0 | 1 | 2 | 3 | 5
  // -1: unstarted, 0: ended, 1: playing, 2: paused, 3: buffering, 5: cued

  interface PlayerOptions {
    height?: string | number
    width?: string | number
    videoId?: string
    playerVars?: Record<string, string | number>
    events?: {
      onReady?: (event: { target: Player }) => void
      onStateChange?: (event: { data: PlayerState; target: Player }) => void
    }
  }

  interface Player {
    playVideo(): void
    pauseVideo(): void
    stopVideo(): void
    seekTo(seconds: number, allowSeekAhead: boolean): void
    getCurrentTime(): number
    getDuration(): number
    getPlayerState(): PlayerState
    destroy(): void
  }

  interface PlayerConstructor {
    new (elementId: string, options: PlayerOptions): Player
  }
}

declare interface YTStatic {
  Player: YT.PlayerConstructor
  PlayerState: {
    UNSTARTED: -1
    ENDED: 0
    PLAYING: 1
    PAUSED: 2
    BUFFERING: 3
    CUED: 5
  }
}

declare var YT: YTStatic
declare function onYouTubeIframeAPIReady(): void

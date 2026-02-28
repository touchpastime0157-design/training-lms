<template>
  <div class="video-player-page">
    <router-link to="/videos" class="back-link">← 動画一覧に戻る</router-link>
    <div v-if="loading" class="loading">読み込み中...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else class="player-container">
      <div class="video-header">
        <h1>{{ video?.title }}</h1>
        <div class="badges">
          <span v-if="completed" class="badge completed">完了</span>
          <span class="badge progress">{{ watchPercent }}% 視聴</span>
        </div>
      </div>

      <div :id="playerContainerId" class="youtube-container"></div>

      <div class="progress-info">
        <p>視聴時間: {{ Math.floor(watchedSeconds) }}秒 / {{ Math.floor((actualDuration || video?.duration) ?? 0) }}秒</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import {
  createYouTubePlayer,
  isPlaying,
  isPaused,
} from '../lib/youtubePlayer'
import { getVideoById, getProgress, saveProgress } from '../api/db'
import { useAuth } from '../stores/auth'
import { useVideoProgress } from '../composables/useVideoProgress'

const route = useRoute()
const { userId } = useAuth()

const video = ref<{ id: string; title: string; youtubeId: string; duration: number } | null>(null)
const actualDuration = ref(0) // YouTube API から取得した実際の長さ
const loading = ref(true)
const error = ref('')
const playerContainerId = 'yt-player-' + Date.now()
const resolvedVideoId = ref(0) // videos テーブルの id（確定後にセット）

const progress = useVideoProgress({
  userId: userId.value,
  videoId: 0,
  getDuration: () => (actualDuration.value || video.value?.duration) ?? 0,
  initialWatchedSeconds: 0,
  initialLastPosition: 0,
  initialCompleted: false,
  onSave: async (state) => {
    if (!resolvedVideoId.value) return
    await saveProgress(
      userId.value,
      String(resolvedVideoId.value),
      state.watchedSeconds,
      state.lastPosition,
      state.completed
    )
  },
})

const watchedSeconds = progress.watchedSeconds
const completed = progress.completed

const watchPercent = computed(() => {
  const d = (actualDuration.value || video.value?.duration) ?? 1
  return Math.min(100, Math.floor((watchedSeconds.value / d) * 100))
})

let player: YT.Player | null = null

onMounted(async () => {
  window.addEventListener('beforeunload', handleBeforeUnload)
  try {
    const routeId = Number(route.params.id)
    if (!Number.isFinite(routeId)) {
      error.value = '動画IDが不正です'
      loading.value = false
      return
    }

    const v = await getVideoById(routeId)
    if (!v) {
      error.value = '動画が見つかりません'
      loading.value = false
      return
    }
    video.value = v
    resolvedVideoId.value = Number(v.id)

    const prog = await getProgress(userId.value, v.id)
    if (prog) {
      progress.watchedSeconds.value = prog.watchedSeconds
      progress.lastPosition.value = prog.lastPosition
      progress.completed.value = prog.completed
    }

    // プレイヤーDOMを表示してから YouTube プレイヤーを生成する
    loading.value = false
    await nextTick()

    player = await createYouTubePlayer(playerContainerId, {
      videoId: v.youtubeId,
      width: 640,
      height: 360,
      startSeconds: progress.lastPosition.value,
      onReady: (p) => {
        actualDuration.value = p.getDuration() ?? v.duration
      },
      onStateChange: (state) => {
        if (isPlaying(state)) {
          progress.startTracking(
            () => player?.getCurrentTime() ?? 0,
            () => player?.getPlayerState() ?? -1
          )
        } else if (isPaused(state)) {
          progress.stopTracking()
          progress.onPause(player?.getCurrentTime() ?? 0)
        } else {
          progress.stopTracking()
        }
      },
    })

    // 初回再生開始時
    player?.playVideo()
    const state = player?.getPlayerState()
    if (state === 1) {
      progress.startTracking(
        () => player?.getCurrentTime() ?? 0,
        () => player?.getPlayerState() ?? -1
      )
    }
  } catch (e) {
    error.value = String(e)
    loading.value = false
  }
})

const handleBeforeUnload = () => {
  progress.onBeforeUnload()
}

onUnmounted(() => {
  progress.stopTracking()
  progress.onBeforeUnload()
  window.removeEventListener('beforeunload', handleBeforeUnload)
})
</script>

<style scoped>
.video-player-page {
  padding: 24px;
  max-width: 800px;
  margin: 0 auto;
}

.back-link {
  display: inline-block;
  margin-bottom: 16px;
  color: #3b82f6;
  text-decoration: none;
}

.back-link:hover {
  text-decoration: underline;
}

.loading,
.error {
  text-align: center;
  padding: 40px;
}

.error {
  color: #c00;
}

.video-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.video-header h1 {
  margin: 0;
  font-size: 1.25rem;
}

.badges {
  display: flex;
  gap: 8px;
}

.badge {
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 0.85rem;
}

.badge.completed {
  background: #22c55e;
  color: white;
}

.badge.progress {
  background: #e5e7eb;
  color: #374151;
}

.youtube-container {
  aspect-ratio: 16/9;
  background: #000;
}

.youtube-container :deep(iframe) {
  width: 100%;
  height: 100%;
}

.progress-info {
  margin-top: 12px;
  font-size: 0.9rem;
  color: #6b7280;
}
</style>

<template>
  <div class="dashboard">
    <h1>動画一覧</h1>
    <div v-if="loading" class="loading">読み込み中...</div>
    <ul v-else class="video-list">
      <li v-for="item in videoItems" :key="item.video.id" class="video-item">
        <router-link :to="`/video/${item.video.id}`" class="video-link">
          <span class="title">{{ item.video.title }}</span>
          <div class="meta">
            <span v-if="item.progress?.completed" class="badge completed">完了</span>
            <span class="percent">{{ item.watchPercent }}% 視聴</span>
          </div>
        </router-link>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { getAllVideos, getProgress } from '../api/db'
import { useAuth } from '../stores/auth'
import type { Video, Progress } from '../api/db'

const { userId } = useAuth()
const videos = ref<Video[]>([])
const progressMap = ref<Map<number, Progress>>(new Map())
const loading = ref(true)

const videoItems = computed(() => {
  return videos.value.map((video) => {
    const prog = progressMap.value.get(Number(video.id))
    const watched = prog?.watchedSeconds ?? 0
    const duration = video.duration || 1
    const watchPercent = Math.min(100, Math.floor((watched / duration) * 100))
    return {
      video,
      progress: prog,
      watchPercent,
    }
  })
})

onMounted(async () => {
  try {
    const vids = await getAllVideos()
    videos.value = vids

    const map = new Map<number, Progress>()
    for (const v of vids) {
      const p = await getProgress(userId.value, v.id)
      if (p) map.set(Number(v.id), p)
    }
    progressMap.value = map
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.dashboard {
  padding: 40px;
  max-width: 600px;
  margin: 0 auto;
}

.loading {
  padding: 20px;
}

.video-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.video-item {
  margin-bottom: 12px;
}

.video-link {
  display: block;
  padding: 16px;
  background: #f3f4f6;
  border-radius: 8px;
  text-decoration: none;
  color: inherit;
  transition: background 0.2s;
}

.video-link:hover {
  background: #e5e7eb;
}

.title {
  font-weight: 500;
}

.meta {
  margin-top: 8px;
  display: flex;
  gap: 8px;
  align-items: center;
}

.badge.completed {
  padding: 2px 8px;
  background: #22c55e;
  color: white;
  border-radius: 4px;
  font-size: 0.8rem;
}

.percent {
  font-size: 0.9rem;
  color: #6b7280;
}
</style>

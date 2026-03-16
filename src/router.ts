import { createRouter, createWebHashHistory } from 'vue-router'

import Login from './pages/Login.vue'

const routes = [
  { path: '/', redirect: '/login' },
  { path: '/login', component: Login },
  { path: '/videos', component: () => import('./pages/VideosList.vue') },
  { path: '/videos/:id', component: () => import('./pages/VideoPlayer.vue') },
]

export const router = createRouter({
  // Electron では hash の方が画面遷移が安定（リロード/直リンク含む）
  history: createWebHashHistory(),
  routes,
})
import { ref } from 'vue'

const USER_KEY = 'lms-user-id'

const userId = ref<string>(localStorage.getItem(USER_KEY) || 'user-1')

export function useAuth() {
  const setUserId = (id: string) => {
    userId.value = id
    localStorage.setItem(USER_KEY, id)
  }

  return { userId, setUserId }
}

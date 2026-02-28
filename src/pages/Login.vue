<template>
  <div class="login">
    <h1>Training LMS</h1>

    <input v-model="email" placeholder="Email" />
    <input v-model="password" type="password" placeholder="Password" />

    <button @click="login">Login</button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../stores/auth'

const router = useRouter()
const { setUserId } = useAuth()

const email = ref('')
const password = ref('')

const login = () => {
  if (email.value && password.value) {
    setUserId(email.value)
    router.push('/videos')
  } else {
    alert('入力してください')
  }
}
</script>

<style scoped>
.login {
  max-width: 400px;
  margin: 100px auto;
  text-align: center;
}

input {
  width: 100%;
  padding: 10px;
  margin-bottom: 15px;
}

button {
  width: 100%;
  padding: 12px;
}
</style>
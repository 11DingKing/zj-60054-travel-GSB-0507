<template>
  <div class="login-view flex justify-center items-center min-h-[60vh]">
    <div class="card w-full max-w-md">
      <div class="card-header text-center">
        <font-awesome-icon :icon="['fas', 'user']" class="text-4xl text-blue-600 mb-2" />
        <h1 class="card-title text-2xl">登录</h1>
        <p class="text-gray-500 text-sm mt-1">登录您的账户开始规划旅行</p>
      </div>
      <div class="card-body">
        <form @submit.prevent="handleLogin">
          <div class="form-group">
            <label class="form-label">邮箱</label>
            <input
              v-model="form.email"
              type="email"
              class="form-input"
              placeholder="请输入邮箱"
              required
            />
          </div>
          <div class="form-group">
            <label class="form-label">密码</label>
            <input
              v-model="form.password"
              type="password"
              class="form-input"
              placeholder="请输入密码"
              required
            />
          </div>
          <div v-if="error" class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            {{ error }}
          </div>
          <button type="submit" class="btn btn-primary w-full" :disabled="loading">
            <div v-if="loading" class="spinner w-4 h-4 mr-2"></div>
            <span>{{ loading ? '登录中...' : '登录' }}</span>
          </button>
        </form>
        <div class="mt-4 text-center">
          <p class="text-gray-500 text-sm">
            还没有账户？
            <router-link to="/register" class="text-blue-600 hover:text-blue-800">立即注册</router-link>
          </p>
        </div>
        <div class="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p class="text-sm text-blue-700">
            <strong>测试账户：</strong><br />
            邮箱：zhang@example.com<br />
            密码：password123
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores';

const router = useRouter();
const authStore = useAuthStore();

const form = ref({
  email: '',
  password: '',
});

const loading = ref(false);
const error = ref('');

async function handleLogin() {
  loading.value = true;
  error.value = '';

  try {
    await authStore.login(form.value.email, form.value.password);
    router.push('/');
  } catch (err: any) {
    error.value = err.response?.data?.message || '登录失败，请检查邮箱和密码';
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
</style>

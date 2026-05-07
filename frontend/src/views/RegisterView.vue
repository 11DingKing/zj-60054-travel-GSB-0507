<template>
  <div class="register-view flex justify-center items-center min-h-[60vh]">
    <div class="card w-full max-w-md">
      <div class="card-header text-center">
        <font-awesome-icon :icon="['fas', 'user']" class="text-4xl text-blue-600 mb-2" />
        <h1 class="card-title text-2xl">注册</h1>
        <p class="text-gray-500 text-sm mt-1">创建您的账户开始规划旅行</p>
      </div>
      <div class="card-body">
        <form @submit.prevent="handleRegister">
          <div class="form-group">
            <label class="form-label">姓名</label>
            <input
              v-model="form.name"
              type="text"
              class="form-input"
              placeholder="请输入姓名"
              required
            />
          </div>
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
              placeholder="请输入密码（至少6位）"
              required
              minlength="6"
            />
          </div>
          <div class="form-group">
            <label class="form-label">确认密码</label>
            <input
              v-model="form.confirmPassword"
              type="password"
              class="form-input"
              placeholder="请再次输入密码"
              required
            />
          </div>
          <div v-if="error" class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            {{ error }}
          </div>
          <button type="submit" class="btn btn-primary w-full" :disabled="loading">
            <div v-if="loading" class="spinner w-4 h-4 mr-2"></div>
            <span>{{ loading ? '注册中...' : '注册' }}</span>
          </button>
        </form>
        <div class="mt-4 text-center">
          <p class="text-gray-500 text-sm">
            已有账户？
            <router-link to="/login" class="text-blue-600 hover:text-blue-800">立即登录</router-link>
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
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
});

const loading = ref(false);
const error = ref('');

async function handleRegister() {
  if (form.value.password !== form.value.confirmPassword) {
    error.value = '两次输入的密码不一致';
    return;
  }

  loading.value = true;
  error.value = '';

  try {
    await authStore.register(form.value.email, form.value.password, form.value.name);
    router.push('/');
  } catch (err: any) {
    error.value = err.response?.data?.message || '注册失败，请稍后重试';
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
</style>

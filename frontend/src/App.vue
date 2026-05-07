<template>
  <div id="app" class="min-h-screen bg-gray-50">
    <nav class="bg-white shadow-sm sticky top-0 z-50">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          <div class="flex items-center">
            <router-link to="/" class="flex items-center space-x-2">
              <font-awesome-icon :icon="['fas', 'plane']" class="text-blue-600 text-xl" />
              <span class="text-xl font-bold text-gray-900">旅行规划</span>
            </router-link>
            <div class="hidden md:flex ml-10 space-x-4">
              <router-link
                v-for="item in navItems"
                :key="item.path"
                :to="item.path"
                class="flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                :class="
                  isActive(item.path)
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                "
              >
                <font-awesome-icon :icon="['fas', item.icon]" />
                <span>{{ item.label }}</span>
              </router-link>
            </div>
          </div>
          <div class="flex items-center space-x-4">
            <template v-if="authStore.isAuthenticated">
              <div class="hidden md:flex items-center space-x-2">
                <span class="text-gray-700">{{ authStore.user?.name }}</span>
              </div>
              <button
                @click="handleLogout"
                class="px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 transition-colors"
              >
                退出登录
              </button>
            </template>
            <template v-else>
              <router-link
                to="/login"
                class="px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
              >
                登录
              </router-link>
              <router-link
                to="/register"
                class="px-4 py-2 rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
              >
                注册
              </router-link>
            </template>
          </div>
        </div>
      </div>
      <div class="md:hidden border-t">
        <div class="px-2 pt-2 pb-3 space-y-1">
          <router-link
            v-for="item in navItems"
            :key="item.path"
            :to="item.path"
            class="flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium"
            :class="
              isActive(item.path)
                ? 'text-blue-600 bg-blue-50'
                : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
            "
          >
            <font-awesome-icon :icon="['fas', item.icon]" />
            <span>{{ item.label }}</span>
          </router-link>
        </div>
      </div>
    </nav>
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <router-view />
    </main>
    <footer class="bg-white border-t mt-auto">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <p class="text-center text-gray-500 text-sm">
          © 2024 旅行行程规划系统 - 让每一次旅行都更加精彩
        </p>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router';
import { useAuthStore } from '@/stores';

const route = useRoute();
const authStore = useAuthStore();

const navItems = [
  { path: '/', label: '首页', icon: 'home' },
  { path: '/discover', label: '发现', icon: 'search' },
  { path: '/plans', label: '我的计划', icon: 'calendar' },
  { path: '/favorites', label: '我的收藏', icon: 'heart' },
  { path: '/statistics', label: '数据看板', icon: 'chart-bar' },
  { path: '/profile', label: '个人中心', icon: 'user' },
];

function isActive(path: string): boolean {
  if (path === '/') {
    return route.path === '/';
  }
  return route.path.startsWith(path);
}

async function handleLogout() {
  authStore.logout();
  window.location.href = '/';
}
</script>

<style scoped>
</style>

<template>
  <div class="discover-view">
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900 mb-2">发现</h1>
      <p class="text-gray-500">探索其他用户分享的精彩旅行计划</p>
    </div>

    <div class="card mb-6">
      <div class="card-body">
        <div class="flex flex-col md:flex-row gap-4">
          <div class="flex-1">
            <div class="relative">
              <input
                v-model="searchQuery"
                type="text"
                class="form-input pl-10"
                placeholder="搜索目的地或计划名称..."
                @keyup.enter="handleSearch"
              />
              <font-awesome-icon
                :icon="['fas', 'search']"
                class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
            </div>
          </div>
          <button @click="handleSearch" class="btn btn-primary">
            搜索
          </button>
        </div>
      </div>
    </div>

    <div v-if="loading" class="loading-container">
      <div class="spinner"></div>
    </div>

    <div v-else-if="plans.length === 0" class="empty-state">
      <div class="empty-state-icon">
        <font-awesome-icon :icon="['fas', 'search']" />
      </div>
      <p>暂无公开计划</p>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div
        v-for="plan in plans"
        :key="plan.id"
        class="card hover:shadow-lg transition-shadow"
      >
        <div
          class="h-48 bg-cover bg-center cursor-pointer relative"
          :style="{ backgroundImage: `url(${plan.coverImage || defaultCover})` }"
          @click="goToPlan(plan.id)"
        >
          <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
            <div class="flex items-center text-white text-sm">
              <div class="avatar w-8 h-8 mr-2">
                <img :src="plan.user?.avatar" v-if="plan.user?.avatar" />
                <span v-else>{{ plan.user?.name?.charAt(0) || 'U' }}</span>
              </div>
              <span>{{ plan.user?.name }}</span>
            </div>
          </div>
        </div>
        <div class="p-4">
          <h3
            class="font-semibold text-gray-900 mb-2 cursor-pointer hover:text-blue-600"
            @click="goToPlan(plan.id)"
          >
            {{ plan.title }}
          </h3>
          <div class="space-y-1 text-sm text-gray-500 mb-3">
            <div class="flex items-center">
              <font-awesome-icon :icon="['fas', 'map-marker-alt']" class="mr-2 w-4" />
              <span>{{ plan.destinationCity }}</span>
            </div>
            <div class="flex items-center">
              <font-awesome-icon :icon="['fas', 'calendar']" class="mr-2 w-4" />
              <span>{{ formatDate(plan.startDate) }} - {{ formatDate(plan.endDate) }}</span>
            </div>
            <div class="flex items-center">
              <font-awesome-icon :icon="['fas', 'dollar-sign']" class="mr-2 w-4" />
              <span>预算: ¥{{ plan.budget.toLocaleString() }}</span>
            </div>
          </div>
          <div class="flex items-center justify-between">
            <button
              v-if="authStore.isAuthenticated"
              @click="toggleFavorite(plan)"
              class="flex items-center text-sm"
              :class="favorites.includes(plan.id) ? 'text-red-500' : 'text-gray-500 hover:text-red-500'"
            >
              <font-awesome-icon :icon="['fas', 'heart']" class="mr-1" />
              {{ plan._count?.favorites || 0 }}
            </button>
            <span v-else class="flex items-center text-sm text-gray-500">
              <font-awesome-icon :icon="['fas', 'heart']" class="mr-1" />
              {{ plan._count?.favorites || 0 }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { planApi, favoriteApi } from '@/api';
import { useAuthStore } from '@/stores';
import type { Plan } from '@/types';
import dayjs from 'dayjs';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const plans = ref<Plan[]>([]);
const loading = ref(false);
const searchQuery = ref(route.query.search as string || '');
const favorites = ref<number[]>([]);

const defaultCover = 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=beautiful%20travel%20destination%20landscape&image_size=square_hd';

async function fetchPlans() {
  loading.value = true;
  try {
    const response = await planApi.findPublic(searchQuery.value);
    plans.value = response.data;
  } catch (error) {
    console.error('Failed to fetch plans:', error);
  } finally {
    loading.value = false;
  }
}

async function fetchFavorites() {
  if (!authStore.isAuthenticated) return;
  try {
    const response = await favoriteApi.findMyFavorites();
    favorites.value = response.data.map(p => p.id);
  } catch (error) {
    console.error('Failed to fetch favorites:', error);
  }
}

function formatDate(date: string): string {
  return dayjs(date).format('YYYY-MM-DD');
}

function goToPlan(id: number) {
  router.push(`/plans/${id}`);
}

function handleSearch() {
  fetchPlans();
}

async function toggleFavorite(plan: Plan) {
  try {
    if (favorites.value.includes(plan.id)) {
      await favoriteApi.remove(plan.id);
      favorites.value = favorites.value.filter(id => id !== plan.id);
      if (plan._count) {
        plan._count.favorites = Math.max(0, (plan._count.favorites || 0) - 1);
      }
    } else {
      await favoriteApi.add(plan.id);
      favorites.value.push(plan.id);
      if (plan._count) {
        plan._count.favorites = (plan._count.favorites || 0) + 1;
      }
    }
  } catch (error) {
    console.error('Failed to toggle favorite:', error);
  }
}

onMounted(() => {
  fetchPlans();
  fetchFavorites();
});
</script>

<style scoped>
</style>

<template>
  <div class="favorites-view">
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900 mb-2">我的收藏</h1>
      <p class="text-gray-500">您收藏的旅行计划</p>
    </div>

    <div v-if="loading" class="loading-container">
      <div class="spinner"></div>
    </div>

    <div v-else-if="favorites.length === 0" class="empty-state">
      <div class="empty-state-icon">
        <font-awesome-icon :icon="['fas', 'heart']" />
      </div>
      <p class="mb-4">暂无收藏的计划</p>
      <router-link to="/discover" class="btn btn-primary">
        去发现计划
      </router-link>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div
        v-for="plan in favorites"
        :key="plan.id"
        class="card hover:shadow-lg transition-shadow"
      >
        <div
          class="h-40 bg-cover bg-center cursor-pointer relative"
          :style="{ backgroundImage: `url(${plan.coverImage || defaultCover})` }"
          @click="goToPlan(plan.id)"
        >
          <button
            @click.stop="removeFavorite(plan)"
            class="absolute top-2 right-2 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors"
          >
            <font-awesome-icon :icon="['fas', 'times']" />
          </button>
        </div>
        <div class="p-4">
          <h3
            class="font-semibold text-gray-900 mb-2 cursor-pointer hover:text-blue-600"
            @click="goToPlan(plan.id)"
          >
            {{ plan.title }}
          </h3>
          <div class="space-y-1 text-sm text-gray-500">
            <div class="flex items-center">
              <font-awesome-icon :icon="['fas', 'map-marker-alt']" class="mr-2 w-4" />
              <span>{{ plan.destinationCity }}</span>
            </div>
            <div class="flex items-center">
              <font-awesome-icon :icon="['fas', 'calendar']" class="mr-2 w-4" />
              <span>{{ formatDate(plan.startDate) }} - {{ formatDate(plan.endDate) }}</span>
            </div>
            <div class="flex items-center justify-between">
              <div class="flex items-center">
                <div class="avatar w-5 h-5 mr-2">
                  <img :src="plan.user?.avatar" v-if="plan.user?.avatar" />
                  <span v-else>{{ plan.user?.name?.charAt(0) || 'U' }}</span>
                </div>
                <span>{{ plan.user?.name }}</span>
              </div>
              <span class="text-gray-500">¥{{ plan.budget.toLocaleString() }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { favoriteApi } from '@/api';
import type { Plan } from '@/types';
import dayjs from 'dayjs';

const router = useRouter();

const favorites = ref<Plan[]>([]);
const loading = ref(false);

const defaultCover = 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=beautiful%20travel%20destination%20landscape&image_size=square_hd';

async function fetchFavorites() {
  loading.value = true;
  try {
    const response = await favoriteApi.findMyFavorites();
    favorites.value = response.data;
  } catch (error) {
    console.error('Failed to fetch favorites:', error);
  } finally {
    loading.value = false;
  }
}

function formatDate(date: string): string {
  return dayjs(date).format('YYYY-MM-DD');
}

function goToPlan(id: number) {
  router.push(`/plans/${id}`);
}

async function removeFavorite(plan: Plan) {
  if (!confirm('确定要取消收藏这个计划吗？')) return;
  try {
    await favoriteApi.remove(plan.id);
    favorites.value = favorites.value.filter(p => p.id !== plan.id);
  } catch (error) {
    console.error('Failed to remove favorite:', error);
  }
}

onMounted(() => {
  fetchFavorites();
});
</script>

<style scoped>
</style>

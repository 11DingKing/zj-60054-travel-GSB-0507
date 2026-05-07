<template>
  <div class="home-view">
    <div class="hero-section bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-xl p-8 mb-8">
      <h1 class="text-3xl md:text-4xl font-bold mb-4">探索世界，规划完美旅程</h1>
      <p class="text-lg text-blue-100 mb-6 max-w-2xl">
        创建详细的旅行计划，管理行程安排，记录每一笔花费，让每一次旅行都更加精彩
      </p>
      <div class="flex flex-wrap gap-4">
        <router-link
          v-if="authStore.isAuthenticated"
          to="/plans/new"
          class="btn btn-lg bg-white text-blue-600 hover:bg-blue-50"
        >
          <font-awesome-icon :icon="['fas', 'plus']" class="mr-2" />
          创建新计划
        </router-link>
        <router-link
          v-else
          to="/register"
          class="btn btn-lg bg-white text-blue-600 hover:bg-blue-50"
        >
          立即注册
        </router-link>
        <router-link to="/discover" class="btn btn-lg bg-transparent border-2 border-white text-white hover:bg-white/10">
          发现计划
        </router-link>
      </div>
    </div>

    <div v-if="authStore.isAuthenticated && upcomingPlans.length > 0" class="mb-8">
      <h2 class="text-xl font-semibold text-gray-900 mb-4 flex items-center">
        <font-awesome-icon :icon="['fas', 'calendar']" class="mr-2 text-blue-600" />
        即将出发的计划
      </h2>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div
          v-for="plan in upcomingPlans"
          :key="plan.id"
          class="card hover:shadow-lg transition-shadow cursor-pointer"
          @click="goToPlan(plan.id)"
        >
          <div class="h-40 bg-cover bg-center relative" :style="{ backgroundImage: `url(${plan.coverImage || defaultCover})` }">
            <span class="absolute top-2 right-2" :class="getStatusBadge(plan.status)">
              {{ getStatusText(plan.status) }}
            </span>
          </div>
          <div class="p-4">
            <h3 class="font-semibold text-gray-900 mb-1">{{ plan.title }}</h3>
            <div class="flex items-center text-sm text-gray-500 mb-2">
              <font-awesome-icon :icon="['fas', 'map-marker-alt']" class="mr-1" />
              {{ plan.destinationCity }}
            </div>
            <div class="flex items-center text-sm text-gray-500">
              <font-awesome-icon :icon="['fas', 'calendar']" class="mr-1" />
              {{ formatDate(plan.startDate) }} - {{ formatDate(plan.endDate) }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="mb-8">
      <h2 class="text-xl font-semibold text-gray-900 mb-4 flex items-center">
        <font-awesome-icon :icon="['fas', 'map-marker-alt']" class="mr-2 text-blue-600" />
        热门目的地
      </h2>
      <div v-if="loadingPopular" class="loading-container">
        <div class="spinner"></div>
      </div>
      <div v-else class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div
          v-for="dest in popularDestinations"
          :key="dest.city"
          class="card hover:shadow-lg transition-shadow cursor-pointer text-center p-4"
          @click="searchByCity(dest.city)"
        >
          <div class="w-16 h-16 mx-auto mb-3 bg-blue-100 rounded-full flex items-center justify-center">
            <font-awesome-icon :icon="['fas', 'map-marker-alt']" class="text-2xl text-blue-600" />
          </div>
          <h3 class="font-semibold text-gray-900">{{ dest.city }}</h3>
          <p class="text-sm text-gray-500">{{ dest.planCount }} 个计划</p>
        </div>
      </div>
    </div>

    <div>
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-xl font-semibold text-gray-900 flex items-center">
          <font-awesome-icon :icon="['fas', 'plane']" class="mr-2 text-blue-600" />
          最新公开计划
        </h2>
        <router-link to="/discover" class="text-blue-600 hover:text-blue-800 text-sm">
          查看更多 →
        </router-link>
      </div>
      <div v-if="loadingPublic" class="loading-container">
        <div class="spinner"></div>
      </div>
      <div v-else-if="publicPlans.length === 0" class="empty-state">
        <div class="empty-state-icon">
          <font-awesome-icon :icon="['fas', 'plane']" />
        </div>
        <p>暂无公开计划</p>
      </div>
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div
          v-for="plan in publicPlans"
          :key="plan.id"
          class="card hover:shadow-lg transition-shadow cursor-pointer"
          @click="goToPlan(plan.id)"
        >
          <div class="h-40 bg-cover bg-center relative" :style="{ backgroundImage: `url(${plan.coverImage || defaultCover})` }">
            <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
              <div class="flex items-center text-white text-sm">
                <div class="avatar w-6 h-6 mr-2">
                  <img :src="plan.user?.avatar" v-if="plan.user?.avatar" />
                  <span v-else>{{ plan.user?.name?.charAt(0) || 'U' }}</span>
                </div>
                <span>{{ plan.user?.name }}</span>
              </div>
            </div>
          </div>
          <div class="p-4">
            <h3 class="font-semibold text-gray-900 mb-1">{{ plan.title }}</h3>
            <div class="flex items-center text-sm text-gray-500 mb-2">
              <font-awesome-icon :icon="['fas', 'map-marker-alt']" class="mr-1" />
              {{ plan.destinationCity }}
            </div>
            <div class="flex items-center justify-between text-sm">
              <span class="text-gray-500">
                <font-awesome-icon :icon="['fas', 'heart']" class="mr-1 text-red-500" />
                {{ plan._count?.favorites || 0 }}
              </span>
              <span class="text-gray-500">
                预算: ¥{{ plan.budget.toLocaleString() }}
              </span>
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
import { planApi } from '@/api';
import { useAuthStore } from '@/stores';
import type { Plan, PopularDestination, PlanStatus as PlanStatusType } from '@/types';
import dayjs from 'dayjs';

const router = useRouter();
const authStore = useAuthStore();

const popularDestinations = ref<PopularDestination[]>([]);
const publicPlans = ref<Plan[]>([]);
const upcomingPlans = ref<Plan[]>([]);
const loadingPopular = ref(true);
const loadingPublic = ref(true);

const defaultCover = 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=beautiful%20travel%20destination%20landscape&image_size=square_hd';

async function fetchPopularDestinations() {
  try {
    const response = await planApi.getPopularDestinations();
    popularDestinations.value = response.data;
  } catch (error) {
    console.error('Failed to fetch popular destinations:', error);
  } finally {
    loadingPopular.value = false;
  }
}

async function fetchPublicPlans() {
  try {
    const response = await planApi.findPublic(undefined, 6);
    publicPlans.value = response.data;
  } catch (error) {
    console.error('Failed to fetch public plans:', error);
  } finally {
    loadingPublic.value = false;
  }
}

async function fetchUpcomingPlans() {
  if (!authStore.isAuthenticated) return;
  try {
    const response = await planApi.getUpcoming();
    upcomingPlans.value = response.data;
  } catch (error) {
    console.error('Failed to fetch upcoming plans:', error);
  }
}

function formatDate(date: string): string {
  return dayjs(date).format('MM-DD');
}

function getStatusBadge(status: PlanStatusType): string {
  const map: Record<string, string> = {
    PLANNING: 'badge badge-planning',
    IN_PROGRESS: 'badge badge-in-progress',
    COMPLETED: 'badge badge-completed',
    CANCELLED: 'badge badge-cancelled',
  };
  return map[status] || '';
}

function getStatusText(status: PlanStatusType): string {
  const map: Record<string, string> = {
    PLANNING: '规划中',
    IN_PROGRESS: '进行中',
    COMPLETED: '已完成',
    CANCELLED: '已取消',
  };
  return map[status] || status;
}

function goToPlan(id: number) {
  router.push(`/plans/${id}`);
}

function searchByCity(city: string) {
  router.push({ path: '/discover', query: { search: city } });
}

onMounted(() => {
  fetchPopularDestinations();
  fetchPublicPlans();
  fetchUpcomingPlans();
});
</script>

<style scoped>
.hero-section {
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
}

.bg-gradient-to-t {
  background: linear-gradient(to top, rgba(0, 0, 0, 0.6) 0%, transparent 100%);
}
</style>

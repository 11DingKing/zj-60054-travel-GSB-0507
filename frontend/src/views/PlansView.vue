<template>
  <div class="plans-view">
    <div class="flex justify-between items-center mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 mb-2">我的计划</h1>
        <p class="text-gray-500">管理您的所有旅行计划</p>
      </div>
      <router-link to="/plans/new" class="btn btn-primary">
        <font-awesome-icon :icon="['fas', 'plus']" class="mr-2" />
        新建计划
      </router-link>
    </div>

    <div class="card mb-6">
      <div class="card-body">
        <div class="flex flex-wrap gap-2">
          <button
            v-for="filter in statusFilters"
            :key="filter.value"
            @click="selectedStatus = filter.value"
            class="btn"
            :class="selectedStatus === filter.value ? 'btn-primary' : 'btn-outline'"
          >
            {{ filter.label }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="loading" class="loading-container">
      <div class="spinner"></div>
    </div>

    <div v-else-if="filteredPlans.length === 0" class="empty-state">
      <div class="empty-state-icon">
        <font-awesome-icon :icon="['fas', 'calendar']" />
      </div>
      <p class="mb-4">暂无旅行计划</p>
      <router-link to="/plans/new" class="btn btn-primary">
        <font-awesome-icon :icon="['fas', 'plus']" class="mr-2" />
        创建第一个计划
      </router-link>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div
        v-for="plan in filteredPlans"
        :key="plan.id"
        class="card hover:shadow-lg transition-shadow"
      >
        <div
          class="h-40 bg-cover bg-center cursor-pointer relative"
          :style="{ backgroundImage: `url(${plan.coverImage || defaultCover})` }"
          @click="goToPlan(plan.id)"
        >
          <span class="absolute top-2 right-2" :class="getStatusBadge(plan.status)">
            {{ getStatusText(plan.status) }}
          </span>
          <div v-if="plan.isPublic" class="absolute top-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">
            公开
          </div>
        </div>
        <div class="p-4">
          <h3
            class="font-semibold text-gray-900 mb-2 cursor-pointer hover:text-blue-600"
            @click="goToPlan(plan.id)"
          >
            {{ plan.title }}
          </h3>
          <div class="space-y-1 text-sm text-gray-500 mb-4">
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
          <div class="flex gap-2">
            <router-link :to="`/plans/${plan.id}`" class="btn btn-outline btn-sm flex-1">
              查看
            </router-link>
            <router-link :to="`/plans/${plan.id}/edit`" class="btn btn-outline btn-sm">
              <font-awesome-icon :icon="['fas', 'edit']" />
            </router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { planApi } from '@/api';
import type { Plan, PlanStatus as PlanStatusType } from '@/types';
import dayjs from 'dayjs';

const router = useRouter();

const plans = ref<Plan[]>([]);
const loading = ref(false);
const selectedStatus = ref<string | null>(null);

const defaultCover = 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=beautiful%20travel%20destination%20landscape&image_size=square_hd';

const statusFilters = [
  { label: '全部', value: null },
  { label: '规划中', value: 'PLANNING' },
  { label: '进行中', value: 'IN_PROGRESS' },
  { label: '已完成', value: 'COMPLETED' },
  { label: '已取消', value: 'CANCELLED' },
];

const filteredPlans = computed(() => {
  if (!selectedStatus.value) {
    return plans.value;
  }
  return plans.value.filter(p => p.status === selectedStatus.value);
});

async function fetchPlans() {
  loading.value = true;
  try {
    const response = await planApi.findAll();
    plans.value = response.data;
  } catch (error) {
    console.error('Failed to fetch plans:', error);
  } finally {
    loading.value = false;
  }
}

function formatDate(date: string): string {
  return dayjs(date).format('YYYY-MM-DD');
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

onMounted(() => {
  fetchPlans();
});
</script>

<style scoped>
</style>

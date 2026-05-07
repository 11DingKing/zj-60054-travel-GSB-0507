<template>
  <div class="profile-view">
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900 mb-2">个人中心</h1>
      <p class="text-gray-500">管理您的账户信息</p>
    </div>

    <div v-if="loading" class="loading-container">
      <div class="spinner"></div>
    </div>

    <template v-else>
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="card">
          <div class="card-body text-center">
            <div class="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden">
              <img :src="authStore.user?.avatar" v-if="authStore.user?.avatar" class="w-full h-full object-cover" />
              <span v-else class="text-4xl font-bold text-gray-400">{{ authStore.user?.name?.charAt(0) || 'U' }}</span>
            </div>
            <h2 class="text-xl font-semibold text-gray-900 mb-1">{{ authStore.user?.name }}</h2>
            <p class="text-gray-500 text-sm mb-4">{{ authStore.user?.email }}</p>
            <div class="grid grid-cols-3 gap-4 pt-4 border-t">
              <div>
                <p class="text-2xl font-bold text-blue-600">{{ userStatistics?.citiesCount || 0 }}</p>
                <p class="text-xs text-gray-500">城市</p>
              </div>
              <div>
                <p class="text-2xl font-bold text-green-600">{{ userStatistics?.completedPlansCount || 0 }}</p>
                <p class="text-xs text-gray-500">计划</p>
              </div>
              <div>
                <p class="text-2xl font-bold text-purple-600">{{ userStatistics?.totalDays || 0 }}</p>
                <p class="text-xs text-gray-500">天数</p>
              </div>
            </div>
          </div>
        </div>

        <div class="lg:col-span-2">
          <div class="card">
            <div class="card-header">
              <h3 class="card-title">编辑个人信息</h3>
            </div>
            <div class="card-body">
              <form @submit.prevent="handleUpdate">
                <div class="form-group">
                  <label class="form-label">姓名</label>
                  <input v-model="form.name" type="text" class="form-input" placeholder="请输入姓名" />
                </div>
                <div class="form-group">
                  <label class="form-label">邮箱</label>
                  <input v-model="form.email" type="email" class="form-input" placeholder="请输入邮箱" />
                </div>
                <div class="form-group">
                  <label class="form-label">头像 URL (可选)</label>
                  <input v-model="form.avatar" type="url" class="form-input" placeholder="请输入头像图片链接" />
                </div>
                <div class="form-group">
                  <label class="form-label">新密码 (留空则不修改)</label>
                  <input v-model="form.password" type="password" class="form-input" placeholder="请输入新密码" />
                </div>

                <div v-if="error" class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                  {{ error }}
                </div>
                <div v-if="success" class="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-600 text-sm">
                  保存成功
                </div>

                <div class="flex gap-4">
                  <button type="submit" class="btn btn-primary" :disabled="saving">
                    <div v-if="saving" class="spinner w-4 h-4 mr-2"></div>
                    <span>{{ saving ? '保存中...' : '保存修改' }}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      <div class="card mt-6">
        <div class="card-header">
          <h3 class="card-title">我的计划</h3>
        </div>
        <div class="card-body">
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div
              v-for="plan in myPlans"
              :key="plan.id"
              class="card hover:shadow-md transition-shadow cursor-pointer"
              @click="goToPlan(plan.id)"
            >
              <div
                class="h-24 bg-cover bg-center relative"
                :style="{ backgroundImage: `url(${plan.coverImage || defaultCover})` }"
              >
                <span class="absolute top-2 right-2" :class="getStatusBadge(plan.status)">
                  {{ getStatusText(plan.status) }}
                </span>
              </div>
              <div class="p-3">
                <h4 class="font-medium text-gray-900 truncate">{{ plan.title }}</h4>
                <p class="text-sm text-gray-500">{{ plan.destinationCity }}</p>
              </div>
            </div>
          </div>
          <div v-if="myPlans.length === 0" class="empty-state">
            <p class="text-gray-500">暂无计划</p>
            <router-link to="/plans/new" class="btn btn-primary mt-4">创建第一个计划</router-link>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore, useUserStore } from '@/stores';
import { planApi } from '@/api';
import type { Plan, PlanStatus as PlanStatusType } from '@/types';

const router = useRouter();
const authStore = useAuthStore();
const userStore = useUserStore();

const loading = ref(false);
const saving = ref(false);
const error = ref('');
const success = ref(false);
const myPlans = ref<Plan[]>([]);

const userStatistics = computed(() => userStore.statistics);

const form = ref({
  name: authStore.user?.name || '',
  email: authStore.user?.email || '',
  avatar: authStore.user?.avatar || '',
  password: '',
});

const defaultCover = 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=beautiful%20travel%20destination%20landscape&image_size=square_hd';

async function fetchData() {
  loading.value = true;
  try {
    const [plansRes, statsRes] = await Promise.all([
      planApi.findAll(),
      userStore.fetchStatistics(),
    ]);
    myPlans.value = plansRes.data.slice(0, 6);
    userStore.statistics = statsRes;
  } catch (error) {
    console.error('Failed to fetch data:', error);
  } finally {
    loading.value = false;
  }
}

async function handleUpdate() {
  saving.value = true;
  error.value = '';
  success.value = false;

  try {
    const updateData: any = {
      name: form.value.name,
      email: form.value.email,
    };
    if (form.value.avatar) {
      updateData.avatar = form.value.avatar;
    }
    if (form.value.password) {
      updateData.password = form.value.password;
    }

    await authStore.updateProfile(updateData);
    success.value = true;
    form.value.password = '';
  } catch (err: any) {
    error.value = err.response?.data?.message || '保存失败，请稍后重试';
  } finally {
    saving.value = false;
  }
}

function goToPlan(id: number) {
  router.push(`/plans/${id}`);
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

onMounted(() => {
  form.value = {
    name: authStore.user?.name || '',
    email: authStore.user?.email || '',
    avatar: authStore.user?.avatar || '',
    password: '',
  };
  fetchData();
});
</script>

<style scoped>
</style>

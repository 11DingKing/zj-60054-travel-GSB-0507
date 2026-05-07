<template>
  <div class="plan-form-view">
    <button @click="router.back()" class="btn btn-outline mb-6">
      <font-awesome-icon :icon="['fas', 'arrow-left']" class="mr-2" />
      返回
    </button>

    <div class="card">
      <div class="card-header">
        <h1 class="card-title text-xl">{{ isEdit ? '编辑计划' : '创建新计划' }}</h1>
      </div>
      <div class="card-body">
        <form @submit.prevent="handleSubmit" class="max-w-2xl">
          <div class="form-group">
            <label class="form-label">计划名称 *</label>
            <input v-model="form.title" type="text" class="form-input" placeholder="例如：三亚五日游" required />
          </div>

          <div class="form-group">
            <label class="form-label">目的地城市 *</label>
            <input v-model="form.destinationCity" type="text" class="form-input" placeholder="例如：三亚" required />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="form-group">
              <label class="form-label">出发日期 *</label>
              <input v-model="form.startDate" type="date" class="form-input" required />
            </div>
            <div class="form-group">
              <label class="form-label">返回日期 *</label>
              <input v-model="form.endDate" type="date" class="form-input" required />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">预算总额 (¥) *</label>
            <input v-model.number="form.budget" type="number" min="0" class="form-input" placeholder="例如：8000" required />
          </div>

          <div class="form-group">
            <label class="form-label">封面图片 URL</label>
            <input v-model="form.coverImage" type="url" class="form-input" placeholder="可选，输入图片链接" />
          </div>

          <div class="form-group">
            <label class="form-label">计划状态</label>
            <select v-model="form.status" class="form-select">
              <option value="PLANNING">规划中</option>
              <option value="IN_PROGRESS">进行中</option>
              <option value="COMPLETED">已完成</option>
              <option value="CANCELLED">已取消</option>
            </select>
          </div>

          <div class="form-group">
            <label class="flex items-center cursor-pointer">
              <input v-model="form.isPublic" type="checkbox" class="w-5 h-5 rounded border-gray-300 text-blue-600 mr-3" />
              <span class="text-gray-700">设为公开（其他用户可在发现页面看到此计划）</span>
            </label>
          </div>

          <div v-if="error" class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            {{ error }}
          </div>

          <div class="flex gap-4 mt-8">
            <button type="button" @click="router.back()" class="btn btn-outline flex-1">
              取消
            </button>
            <button type="submit" class="btn btn-primary flex-1" :disabled="loading">
              <div v-if="loading" class="spinner w-4 h-4 mr-2"></div>
              <span>{{ loading ? '保存中...' : (isEdit ? '保存修改' : '创建计划') }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { planApi } from '@/api';
import type { PlanStatus, CreatePlanDto } from '@/types';

const route = useRoute();
const router = useRouter();

const planId = computed(() => route.params.id ? parseInt(route.params.id as string) : null);
const isEdit = computed(() => !!planId.value);

const form = ref<CreatePlanDto & { status: PlanStatus; isPublic: boolean }>({
  title: '',
  destinationCity: '',
  startDate: '',
  endDate: '',
  budget: 0,
  coverImage: '',
  status: 'PLANNING' as PlanStatus,
  isPublic: false,
});

const loading = ref(false);
const error = ref('');

async function fetchPlan() {
  if (!planId.value) return;
  try {
    const response = await planApi.findOne(planId.value);
    const plan = response.data;
    form.value = {
      title: plan.title,
      destinationCity: plan.destinationCity,
      startDate: plan.startDate.substring(0, 10),
      endDate: plan.endDate.substring(0, 10),
      budget: plan.budget,
      coverImage: plan.coverImage || '',
      status: plan.status,
      isPublic: plan.isPublic,
    };
  } catch (err: any) {
    error.value = err.response?.data?.message || '获取计划信息失败';
  }
}

async function handleSubmit() {
  if (form.value.startDate > form.value.endDate) {
    error.value = '返回日期必须晚于出发日期';
    return;
  }

  loading.value = true;
  error.value = '';

  try {
    if (isEdit.value && planId.value) {
      await planApi.update(planId.value, form.value);
    } else {
      const response = await planApi.create(form.value);
      router.push(`/plans/${response.data.id}`);
      return;
    }
    router.push(`/plans/${planId.value}`);
  } catch (err: any) {
    error.value = err.response?.data?.message || '保存失败，请稍后重试';
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  if (isEdit.value) {
    fetchPlan();
  }
});
</script>

<style scoped>
</style>

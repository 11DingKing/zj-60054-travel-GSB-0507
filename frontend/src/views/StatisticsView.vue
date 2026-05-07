<template>
  <div class="statistics-view">
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900 mb-2">数据看板</h1>
      <p class="text-gray-500">您的旅行数据分析</p>
    </div>

    <div v-if="loading" class="loading-container">
      <div class="spinner"></div>
    </div>

    <template v-else>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div class="card">
          <div class="card-body text-center">
            <font-awesome-icon :icon="['fas', 'map-marker-alt']" class="text-3xl text-blue-600 mb-2" />
            <p class="text-3xl font-bold text-gray-900">{{ userStatistics?.citiesCount || 0 }}</p>
            <p class="text-sm text-gray-500">去过城市</p>
          </div>
        </div>
        <div class="card">
          <div class="card-body text-center">
            <font-awesome-icon :icon="['fas', 'calendar']" class="text-3xl text-green-600 mb-2" />
            <p class="text-3xl font-bold text-gray-900">{{ userStatistics?.completedPlansCount || 0 }}</p>
            <p class="text-sm text-gray-500">完成计划</p>
          </div>
        </div>
        <div class="card">
          <div class="card-body text-center">
            <font-awesome-icon :icon="['fas', 'clock']" class="text-3xl text-purple-600 mb-2" />
            <p class="text-3xl font-bold text-gray-900">{{ userStatistics?.totalDays || 0 }}</p>
            <p class="text-sm text-gray-500">总天数</p>
          </div>
        </div>
        <div class="card">
          <div class="card-body text-center">
            <font-awesome-icon :icon="['fas', 'dollar-sign']" class="text-3xl text-orange-600 mb-2" />
            <p class="text-3xl font-bold text-gray-900">¥{{ (userStatistics?.totalSpent || 0).toLocaleString() }}</p>
            <p class="text-sm text-gray-500">总花费</p>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">月度出行频次（近12个月）</h3>
          </div>
          <div class="card-body">
            <div ref="monthlyChartRef" style="height: 288px; width: 100%; min-width: 300px;"></div>
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <h3 class="card-title">花费分类占比</h3>
          </div>
          <div class="card-body">
            <div ref="expenseChartRef" style="height: 288px; width: 100%; min-width: 300px;"></div>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">目的地城市分布</h3>
          </div>
          <div class="card-body">
            <div v-if="cityDistribution.length > 0" class="space-y-3">
              <div
                v-for="city in cityDistribution"
                :key="city.city"
                class="flex items-center"
              >
                <span class="w-24 text-gray-700 truncate">{{ city.city }}</span>
                <div class="flex-1 mx-4">
                  <div class="w-full bg-gray-200 rounded-full h-3">
                    <div
                      class="bg-blue-500 h-3 rounded-full transition-all"
                      :style="{ width: `${(city.count / maxCityCount) * 100}%` }"
                    ></div>
                  </div>
                </div>
                <span class="w-12 text-right text-gray-600">{{ city.count }} 次</span>
              </div>
            </div>
            <div v-else class="empty-state">
              <p class="text-gray-500">暂无数据</p>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <h3 class="card-title">预算 vs 实际花费</h3>
          </div>
          <div class="card-body">
            <div ref="budgetChartRef" style="height: 288px; width: 100%; min-width: 300px;"></div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue';
import { useUserStore } from '@/stores';
import { statisticsApi } from '@/api';
import type { UserStatistics, CityDistribution, MonthlyFrequency, ExpenseCategoryStat, BudgetVsActual } from '@/types';
import * as echarts from 'echarts';
import type { ECharts } from 'echarts';

const userStore = useUserStore();

const loading = ref(false);
const userStatistics = ref<UserStatistics | null>(null);
const cityDistribution = ref<CityDistribution[]>([]);
const monthlyFrequency = ref<MonthlyFrequency[]>([]);
const expenseCategories = ref<ExpenseCategoryStat[]>([]);
const budgetVsActual = ref<BudgetVsActual[]>([]);

const monthlyChartRef = ref<HTMLElement | null>(null);
const expenseChartRef = ref<HTMLElement | null>(null);
const budgetChartRef = ref<HTMLElement | null>(null);

const monthlyChart = ref<ECharts | null>(null);
const expenseChart = ref<ECharts | null>(null);
const budgetChart = ref<ECharts | null>(null);

const maxCityCount = ref(0);

const categoryColors: Record<string, string> = {
  TRANSPORTATION: '#3b82f6',
  ACCOMMODATION: '#8b5cf6',
  DINING: '#f97316',
  TICKETS: '#22c55e',
  SHOPPING: '#ec4899',
  OTHER: '#6b7280',
};

const categoryLabels: Record<string, string> = {
  TRANSPORTATION: '交通',
  ACCOMMODATION: '住宿',
  DINING: '餐饮',
  TICKETS: '门票',
  SHOPPING: '购物',
  OTHER: '其他',
};

async function fetchData() {
  loading.value = true;
  
  try {
    try {
      const statsRes = await userStore.fetchStatistics();
      userStatistics.value = statsRes;
    } catch (e) {
      console.error('Failed to fetch user statistics:', e);
    }

    try {
      const cityRes = await statisticsApi.getCityDistribution();
      cityDistribution.value = cityRes.data || [];
      if (cityDistribution.value.length > 0) {
        maxCityCount.value = Math.max(...cityDistribution.value.map(c => c.count));
      }
    } catch (e) {
      console.error('Failed to fetch city distribution:', e);
    }

    try {
      const monthlyRes = await statisticsApi.getMonthlyFrequency();
      monthlyFrequency.value = monthlyRes.data || [];
    } catch (e) {
      console.error('Failed to fetch monthly frequency:', e);
    }

    try {
      const expenseRes = await statisticsApi.getExpenseCategories();
      expenseCategories.value = expenseRes.data || [];
    } catch (e) {
      console.error('Failed to fetch expense categories:', e);
    }

    try {
      const budgetRes = await statisticsApi.getBudgetVsActual();
      budgetVsActual.value = budgetRes.data || [];
    } catch (e) {
      console.error('Failed to fetch budget vs actual:', e);
    }
  } finally {
    loading.value = false;
    await nextTick();
    initCharts();
    await nextTick();
    handleResize();
  }
}

function initMonthlyChart() {
  if (!monthlyChartRef.value) {
    console.warn('Monthly chart ref is not available');
    return;
  }
  
  if (monthlyChart.value) {
    monthlyChart.value.dispose();
    monthlyChart.value = null;
  }
  
  try {
    monthlyChart.value = echarts.init(monthlyChartRef.value);
    
    const hasData = monthlyFrequency.value.length > 0 && monthlyFrequency.value.some(m => m.count > 0);
    
    const option = {
      tooltip: { trigger: 'axis' },
      grid: { left: '10%', right: '10%', bottom: '20%', top: '10%', containLabel: true },
      xAxis: {
        type: 'category',
        data: hasData ? monthlyFrequency.value.map(m => m.month.substring(5)) : ['暂无数据'],
        axisLabel: { rotate: 45, interval: 0 },
      },
      yAxis: {
        type: 'value',
        minInterval: 1,
      },
      series: [{
        type: 'bar',
        data: hasData ? monthlyFrequency.value.map(m => m.count) : [0],
        itemStyle: { color: '#3b82f6' },
        barWidth: '60%',
      }],
    };
    
    monthlyChart.value.setOption(option);
    monthlyChart.value.resize();
  } catch (e) {
    console.error('Failed to initialize monthly chart:', e);
  }
}

function initExpenseChart() {
  if (!expenseChartRef.value) {
    console.warn('Expense chart ref is not available');
    return;
  }
  
  if (expenseChart.value) {
    expenseChart.value.dispose();
    expenseChart.value = null;
  }
  
  try {
    expenseChart.value = echarts.init(expenseChartRef.value);
    
    const hasData = expenseCategories.value.length > 0 && expenseCategories.value.some(e => e.amount > 0);
    
    const pieData = hasData 
      ? expenseCategories.value.map(e => ({
          name: categoryLabels[e.category] || e.category,
          value: e.amount,
          itemStyle: { color: categoryColors[e.category] || '#6b7280' },
        }))
      : [{ name: '暂无数据', value: 1, itemStyle: { color: '#9ca3af' } }];
    
    const option = {
      tooltip: { 
        trigger: 'item',
        formatter: hasData ? '{b}: ¥{c} ({d}%)' : '{b}',
      },
      legend: { 
        bottom: '5%',
        left: 'center',
        type: hasData ? 'scroll' : 'plain',
      },
      series: [{
        type: 'pie',
        radius: hasData ? ['30%', '60%'] : ['40%', '60%'],
        center: ['50%', '40%'],
        data: pieData,
        label: {
          show: hasData,
          formatter: '{b}: {d}%',
        },
        labelLine: {
          show: hasData,
        },
      }],
    };
    
    expenseChart.value.setOption(option);
    expenseChart.value.resize();
  } catch (e) {
    console.error('Failed to initialize expense chart:', e);
  }
}

function initBudgetChart() {
  if (!budgetChartRef.value) {
    console.warn('Budget chart ref is not available');
    return;
  }
  
  if (budgetChart.value) {
    budgetChart.value.dispose();
    budgetChart.value = null;
  }
  
  try {
    budgetChart.value = echarts.init(budgetChartRef.value);
    
    const hasData = budgetVsActual.value.length > 0;
    
    const option = {
      tooltip: { 
        trigger: 'axis',
        formatter: hasData ? '{b}<br/>{a0}: ¥{c0}<br/>{a1}: ¥{c1}' : '{b}',
      },
      legend: { 
        data: hasData ? ['预算', '实际花费'] : [],
        bottom: '5%',
      },
      grid: { left: '10%', right: '10%', bottom: '20%', top: '10%', containLabel: true },
      xAxis: {
        type: 'category',
        data: hasData ? budgetVsActual.value.map(b => b.title.substring(0, 8)) : ['暂无数据'],
        axisLabel: { rotate: 45, interval: 0 },
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          formatter: '¥{value}',
        },
      },
      series: hasData ? [
        {
          name: '预算',
          type: 'line',
          data: budgetVsActual.value.map(b => b.budget),
          itemStyle: { color: '#3b82f6' },
          lineStyle: { width: 2 },
          symbol: 'circle',
          symbolSize: 6,
        },
        {
          name: '实际花费',
          type: 'line',
          data: budgetVsActual.value.map(b => b.actual),
          itemStyle: { color: '#ef4444' },
          lineStyle: { width: 2 },
          symbol: 'circle',
          symbolSize: 6,
        },
      ] : [
        {
          name: '暂无数据',
          type: 'line',
          data: [0],
          itemStyle: { color: '#9ca3af' },
        },
      ],
    };
    
    budgetChart.value.setOption(option);
    budgetChart.value.resize();
  } catch (e) {
    console.error('Failed to initialize budget chart:', e);
  }
}

function initCharts() {
  initMonthlyChart();
  initExpenseChart();
  initBudgetChart();
}

function handleResize() {
  try {
    monthlyChart.value?.resize();
    expenseChart.value?.resize();
    budgetChart.value?.resize();
  } catch (e) {
    console.error('Failed to resize charts:', e);
  }
}

function disposeCharts() {
  try {
    monthlyChart.value?.dispose();
    expenseChart.value?.dispose();
    budgetChart.value?.dispose();
    monthlyChart.value = null;
    expenseChart.value = null;
    budgetChart.value = null;
  } catch (e) {
    console.error('Failed to dispose charts:', e);
  }
}

onMounted(() => {
  fetchData();
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
  disposeCharts();
});
</script>

<style scoped>
</style>

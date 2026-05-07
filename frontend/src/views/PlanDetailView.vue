<template>
  <div class="plan-detail-view">
    <div v-if="loading" class="loading-container">
      <div class="spinner"></div>
    </div>

    <template v-else-if="plan">
      <div class="mb-6">
        <button @click="router.back()" class="btn btn-outline mb-4">
          <font-awesome-icon :icon="['fas', 'arrow-left']" class="mr-2" />
          返回
        </button>
        <div
          class="h-64 bg-cover bg-center rounded-xl relative"
          :style="{ backgroundImage: `url(${plan.coverImage || defaultCover})` }"
        >
          <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6 rounded-b-xl">
            <div class="flex items-center justify-between">
              <div>
                <h1 class="text-3xl font-bold text-white mb-2">{{ plan.title }}</h1>
                <div class="flex items-center text-white/80 space-x-4">
                  <span class="flex items-center">
                    <font-awesome-icon :icon="['fas', 'map-marker-alt']" class="mr-2" />
                    {{ plan.destinationCity }}
                  </span>
                  <span class="flex items-center">
                    <font-awesome-icon :icon="['fas', 'calendar']" class="mr-2" />
                    {{ formatDate(plan.startDate) }} - {{ formatDate(plan.endDate) }}
                  </span>
                </div>
              </div>
              <div class="flex items-center space-x-3">
                <span :class="getStatusBadge(plan.status)">
                  {{ getStatusText(plan.status) }}
                </span>
                <span v-if="plan.isPublic" class="bg-blue-600 text-white text-sm px-3 py-1 rounded">
                  公开
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="isOwner" class="card mb-6">
        <div class="card-body">
          <div class="flex flex-wrap gap-2">
            <router-link :to="`/plans/${plan.id}/edit`" class="btn btn-primary">
              <font-awesome-icon :icon="['fas', 'edit']" class="mr-2" />
              编辑计划
            </router-link>
            <button @click="togglePublic" class="btn btn-outline">
              <font-awesome-icon :icon="['fas', 'globe']" class="mr-2" />
              {{ plan.isPublic ? '设为私有' : '设为公开' }}
            </button>
          </div>
        </div>
      </div>

      <div v-else class="card mb-6">
        <div class="card-body flex items-center justify-between">
          <div class="flex items-center">
            <div class="avatar w-12 h-12 mr-4">
              <img :src="plan.user?.avatar" v-if="plan.user?.avatar" />
              <span v-else>{{ plan.user?.name?.charAt(0) || 'U' }}</span>
            </div>
            <div>
              <p class="font-semibold text-gray-900">{{ plan.user?.name }}</p>
              <p class="text-sm text-gray-500">{{ plan._count?.favorites || 0 }} 个收藏</p>
            </div>
          </div>
          <button
            v-if="authStore.isAuthenticated"
            @click="toggleFavorite"
            class="btn"
            :class="isFavorited ? 'btn-danger' : 'btn-outline'"
          >
            <font-awesome-icon :icon="['fas', 'heart']" class="mr-2" />
            {{ isFavorited ? '已收藏' : '收藏' }}
          </button>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div class="card">
          <div class="card-body text-center">
            <font-awesome-icon :icon="['fas', 'dollar-sign']" class="text-3xl text-blue-600 mb-2" />
            <p class="text-2xl font-bold text-gray-900">¥{{ plan.budget.toLocaleString() }}</p>
            <p class="text-sm text-gray-500">预算</p>
          </div>
        </div>
        <div class="card">
          <div class="card-body text-center">
            <font-awesome-icon :icon="['fas', 'dollar-sign']" class="text-3xl text-green-600 mb-2" />
            <p class="text-2xl font-bold" :class="actualSpent > plan.budget ? 'text-red-600' : 'text-green-600'">
              ¥{{ actualSpent.toLocaleString() }}
            </p>
            <p class="text-sm text-gray-500">
              实际花费
              <span :class="actualSpent > plan.budget ? 'text-red-600' : 'text-green-600'" v-if="actualSpent > 0">
                ({{ actualSpent > plan.budget ? '超支' : '节省' }} ¥{{ Math.abs(actualSpent - plan.budget).toLocaleString() }})
              </span>
            </p>
          </div>
        </div>
        <div class="card">
          <div class="card-body text-center">
            <font-awesome-icon :icon="['fas', 'calendar']" class="text-3xl text-purple-600 mb-2" />
            <p class="text-2xl font-bold text-gray-900">{{ totalDays }} 天</p>
            <p class="text-sm text-gray-500">行程天数</p>
          </div>
        </div>
      </div>

      <div class="tabs flex border-b mb-6">
        <button
          v-for="tab in tabs"
          :key="tab.value"
          @click="activeTab = tab.value"
          class="px-6 py-3 font-medium text-sm"
          :class="
            activeTab === tab.value
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          "
        >
          <font-awesome-icon :icon="['fas', tab.icon]" class="mr-2" />
          {{ tab.label }}
        </button>
      </div>

      <div v-if="activeTab === 'itinerary'">
        <div class="flex justify-between items-center mb-4" v-if="isOwner">
          <h2 class="text-lg font-semibold text-gray-900">行程安排</h2>
          <button @click="showItineraryModal = true" class="btn btn-primary btn-sm">
            <font-awesome-icon :icon="['fas', 'plus']" class="mr-2" />
            添加行程天
          </button>
        </div>

        <div v-if="plan.itineraries && plan.itineraries.length > 0" class="space-y-6">
          <div
            v-for="itinerary in plan.itineraries"
            :key="itinerary.id"
            class="card"
          >
            <div class="card-header flex justify-between items-center">
              <div class="flex items-center">
                <div class="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                  <span class="font-bold text-blue-600">D{{ itinerary.dayNumber }}</span>
                </div>
                <div>
                  <h3 class="font-semibold text-gray-900">第 {{ itinerary.dayNumber }} 天</h3>
                  <p class="text-sm text-gray-500">{{ formatDate(itinerary.date) }}</p>
                </div>
              </div>
              <button v-if="isOwner" @click="currentItinerary = itinerary; showItemModal = true" class="btn btn-outline btn-sm">
                <font-awesome-icon :icon="['fas', 'plus']" class="mr-2" />
                添加项目
              </button>
            </div>
            <div class="card-body">
              <div v-if="itinerary.items.length === 0" class="text-center py-6 text-gray-500">
                暂无行程项目
              </div>
              <div v-else class="relative">
                <div
                  v-for="(item, index) in itinerary.items"
                  :key="item.id"
                  class="flex items-start mb-4 last:mb-0"
                  :class="{ 'sortable-item': isOwner }"
                  :data-id="item.id"
                >
                  <div class="flex flex-col items-center mr-4">
                    <div class="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <div v-if="index < itinerary.items.length - 1" class="w-0.5 h-full bg-blue-200 my-1"></div>
                  </div>
                  <div class="flex-1 bg-gray-50 rounded-lg p-4">
                    <div class="flex justify-between items-start">
                      <div class="flex-1">
                        <div class="flex items-center mb-2">
                          <span class="w-8 h-8 bg-white rounded-full flex items-center justify-center mr-3 shadow-sm">
                            <font-awesome-icon :icon="['fas', getItemIcon(item.type)]" class="text-gray-600" />
                          </span>
                          <div>
                            <h4 class="font-medium text-gray-900">{{ item.name }}</h4>
                            <p v-if="item.startTime" class="text-sm text-gray-500">
                              {{ formatTime(item.startTime) }} - {{ formatTime(item.endTime) }}
                            </p>
                          </div>
                        </div>
                        <p v-if="item.address" class="text-sm text-gray-500 mb-1">
                          <font-awesome-icon :icon="['fas', 'map-marker-alt']" class="mr-1" />
                          {{ item.address }}
                        </p>
                        <p v-if="item.estimatedCost" class="text-sm text-green-600">
                          预估花费: ¥{{ item.estimatedCost.toLocaleString() }}
                        </p>
                      </div>
                      <div v-if="isOwner" class="flex space-x-2 ml-4">
                        <button @click="editItem(itinerary, item)" class="text-blue-600 hover:text-blue-800">
                          <font-awesome-icon :icon="['fas', 'edit']" />
                        </button>
                        <button @click="deleteItem(itinerary.id, item.id)" class="text-red-600 hover:text-red-800">
                          <font-awesome-icon :icon="['fas', 'trash']" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="empty-state">
          <div class="empty-state-icon">
            <font-awesome-icon :icon="['fas', 'calendar']" />
          </div>
          <p>暂无行程安排</p>
          <button v-if="isOwner" @click="showItineraryModal = true" class="btn btn-primary mt-4">
            添加行程天
          </button>
        </div>
      </div>

      <div v-if="activeTab === 'expenses'">
        <div class="flex justify-between items-center mb-4" v-if="isOwner">
          <h2 class="text-lg font-semibold text-gray-900">费用管理</h2>
          <button @click="showExpenseModal = true" class="btn btn-primary btn-sm">
            <font-awesome-icon :icon="['fas', 'plus']" class="mr-2" />
            添加费用
          </button>
        </div>

        <div v-if="plan.expenses && plan.expenses.length > 0" class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div class="card">
            <div class="card-header">
              <h3 class="card-title">费用列表</h3>
            </div>
            <div class="card-body">
              <div class="space-y-3">
                <div
                  v-for="expense in plan.expenses"
                  :key="expense.id"
                  class="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div class="flex items-center">
                    <span
                      class="w-10 h-10 rounded-full flex items-center justify-center mr-3"
                      :class="getCategoryBg(expense.category)"
                    >
                      <font-awesome-icon :icon="['fas', getCategoryIcon(expense.category)]" class="text-white" />
                    </span>
                    <div>
                      <p class="font-medium text-gray-900">{{ getCategoryLabel(expense.category) }}</p>
                      <p class="text-sm text-gray-500">{{ formatDate(expense.date) }}</p>
                    </div>
                  </div>
                  <div class="flex items-center">
                    <span class="font-semibold text-gray-900 mr-4">¥{{ expense.amount.toLocaleString() }}</span>
                    <div v-if="isOwner" class="flex space-x-2">
                      <button @click="editExpense(expense)" class="text-blue-600 hover:text-blue-800">
                        <font-awesome-icon :icon="['fas', 'edit']" />
                      </button>
                      <button @click="deleteExpense(expense.id)" class="text-red-600 hover:text-red-800">
                        <font-awesome-icon :icon="['fas', 'trash']" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="card">
            <div class="card-header">
              <h3 class="card-title">费用统计</h3>
            </div>
            <div class="card-body">
              <div class="mb-6">
                <div class="flex justify-between items-center mb-2">
                  <span class="text-gray-600">总花费</span>
                  <span class="text-2xl font-bold" :class="actualSpent > plan.budget ? 'text-red-600' : 'text-green-600'">
                    ¥{{ actualSpent.toLocaleString() }}
                  </span>
                </div>
                <div class="flex justify-between items-center mb-2">
                  <span class="text-gray-600">预算</span>
                  <span class="text-lg font-semibold text-gray-900">¥{{ plan.budget.toLocaleString() }}</span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-3 mt-3">
                  <div
                    class="h-3 rounded-full transition-all"
                    :class="actualSpent > plan.budget ? 'bg-red-500' : 'bg-green-500'"
                    :style="{ width: `${Math.min((actualSpent / plan.budget) * 100, 100)}%` }"
                  ></div>
                </div>
                <p class="text-sm mt-2" :class="actualSpent > plan.budget ? 'text-red-600' : 'text-green-600'">
                  {{ actualSpent > plan.budget ? '超支' : '剩余' }}: ¥{{ Math.abs(plan.budget - actualSpent).toLocaleString() }}
                </p>
              </div>

              <div class="divider"></div>

              <h4 class="font-semibold text-gray-900 mb-3">分类统计</h4>
              <div class="space-y-3">
                <div
                  v-for="(amount, category) in expenseByCategory"
                  :key="category"
                  class="flex items-center justify-between"
                >
                  <div class="flex items-center">
                    <span
                      class="w-6 h-6 rounded-full flex items-center justify-center mr-2"
                      :class="getCategoryBg(category)"
                    >
                      <font-awesome-icon :icon="['fas', getCategoryIcon(category)]" class="text-white text-xs" />
                    </span>
                    <span class="text-gray-700">{{ getCategoryLabel(category) }}</span>
                  </div>
                  <span class="font-medium text-gray-900">¥{{ amount.toLocaleString() }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="empty-state">
          <div class="empty-state-icon">
            <font-awesome-icon :icon="['fas', 'dollar-sign']" />
          </div>
          <p>暂无费用记录</p>
          <button v-if="isOwner" @click="showExpenseModal = true" class="btn btn-primary mt-4">
            添加费用
          </button>
        </div>
      </div>

      <div v-if="activeTab === 'packing'">
        <div class="flex justify-between items-center mb-4" v-if="isOwner">
          <h2 class="text-lg font-semibold text-gray-900">打包清单</h2>
          <div class="flex gap-2">
            <div class="relative">
              <select v-model="selectedTemplate" class="form-select pr-8" @change="applyTemplate">
                <option value="">选择模板</option>
                <option value="beach">海边游模板</option>
                <option value="hiking">登山模板</option>
                <option value="business">商务出行模板</option>
              </select>
            </div>
            <button @click="showPackingItemModal = true" class="btn btn-primary btn-sm">
              <font-awesome-icon :icon="['fas', 'plus']" class="mr-2" />
              添加物品
            </button>
          </div>
        </div>

        <div v-if="packingList && packingList.items.length > 0" class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="card">
            <div class="card-header">
              <h3 class="card-title">待打包 ({{ unpackedCount }})</h3>
            </div>
            <div class="card-body">
              <div class="space-y-2">
                <div
                  v-for="item in packingList.items.filter(i => !i.isPacked)"
                  :key="item.id"
                  class="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <label class="flex items-center flex-1" :class="{ 'cursor-pointer': isOwner, 'cursor-default': !isOwner }">
                    <input
                      type="checkbox"
                      :checked="item.isPacked"
                      :disabled="!isOwner"
                      @change="isOwner ? togglePackingItem(item) : null"
                      class="w-5 h-5 rounded border-gray-300 text-blue-600 mr-3 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <span class="text-gray-900">{{ item.name }}</span>
                    <span v-if="item.quantity > 1" class="text-gray-500 ml-2">x{{ item.quantity }}</span>
                  </label>
                  <div v-if="isOwner" class="flex space-x-2 ml-4">
                    <button @click="deletePackingItem(item.id)" class="text-red-600 hover:text-red-800">
                      <font-awesome-icon :icon="['fas', 'trash']" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="card">
            <div class="card-header">
              <h3 class="card-title">已打包 ({{ packedCount }})</h3>
            </div>
            <div class="card-body">
              <div class="space-y-2">
                <div
                  v-for="item in packingList.items.filter(i => i.isPacked)"
                  :key="item.id"
                  class="flex items-center justify-between p-3 bg-green-50 rounded-lg"
                >
                  <label class="flex items-center flex-1" :class="{ 'cursor-pointer': isOwner, 'cursor-default': !isOwner }">
                    <input
                      type="checkbox"
                      :checked="item.isPacked"
                      :disabled="!isOwner"
                      @change="isOwner ? togglePackingItem(item) : null"
                      class="w-5 h-5 rounded border-gray-300 text-blue-600 mr-3 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <span class="text-gray-500 line-through">{{ item.name }}</span>
                    <span v-if="item.quantity > 1" class="text-gray-400 ml-2">x{{ item.quantity }}</span>
                  </label>
                  <div v-if="isOwner" class="flex space-x-2 ml-4">
                    <button @click="deletePackingItem(item.id)" class="text-red-600 hover:text-red-800">
                      <font-awesome-icon :icon="['fas', 'trash']" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="empty-state">
          <div class="empty-state-icon">
            <font-awesome-icon :icon="['fas', 'box']" />
          </div>
          <p>暂无打包清单</p>
          <div class="flex justify-center gap-4 mt-4" v-if="isOwner">
            <button @click="showPackingItemModal = true" class="btn btn-primary">
              添加物品
            </button>
          </div>
        </div>
      </div>
    </template>

    <div v-if="showItineraryModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div class="card w-full max-w-md">
        <div class="card-header">
          <h3 class="card-title">添加行程天</h3>
        </div>
        <div class="card-body">
          <div class="form-group">
            <label class="form-label">日期</label>
            <input v-model="newItinerary.date" type="date" class="form-input" />
          </div>
          <div class="flex gap-3 mt-6">
            <button @click="showItineraryModal = false" class="btn btn-outline flex-1">取消</button>
            <button @click="addItinerary" class="btn btn-primary flex-1">添加</button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showItemModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div class="card w-full max-w-lg">
        <div class="card-header">
          <h3 class="card-title">{{ editingItem ? '编辑行程项目' : '添加行程项目' }}</h3>
        </div>
        <div class="card-body">
          <div class="grid grid-cols-2 gap-4">
            <div class="form-group col-span-2">
              <label class="form-label">名称</label>
              <input v-model="newItem.name" type="text" class="form-input" placeholder="请输入名称" />
            </div>
            <div class="form-group">
              <label class="form-label">类型</label>
              <select v-model="newItem.type" class="form-select">
                <option value="ATTRACTION">景点</option>
                <option value="RESTAURANT">餐厅</option>
                <option value="HOTEL">酒店</option>
                <option value="TRANSPORTATION">交通</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">预估花费</label>
              <input v-model.number="newItem.estimatedCost" type="number" class="form-input" placeholder="0" />
            </div>
            <div class="form-group">
              <label class="form-label">开始时间</label>
              <input v-model="newItem.startTime" type="time" class="form-input" />
            </div>
            <div class="form-group">
              <label class="form-label">结束时间</label>
              <input v-model="newItem.endTime" type="time" class="form-input" />
            </div>
            <div class="form-group col-span-2">
              <label class="form-label">地址</label>
              <input v-model="newItem.address" type="text" class="form-input" placeholder="请输入地址" />
            </div>
          </div>
          <div class="flex gap-3 mt-6">
            <button @click="closeItemModal" class="btn btn-outline flex-1">取消</button>
            <button @click="saveItem" class="btn btn-primary flex-1">保存</button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showExpenseModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div class="card w-full max-w-md">
        <div class="card-header">
          <h3 class="card-title">{{ editingExpense ? '编辑费用' : '添加费用' }}</h3>
        </div>
        <div class="card-body">
          <div class="form-group">
            <label class="form-label">金额</label>
            <input v-model.number="newExpense.amount" type="number" class="form-input" placeholder="0" />
          </div>
          <div class="form-group">
            <label class="form-label">分类</label>
            <select v-model="newExpense.category" class="form-select">
              <option value="TRANSPORTATION">交通</option>
              <option value="ACCOMMODATION">住宿</option>
              <option value="DINING">餐饮</option>
              <option value="TICKETS">门票</option>
              <option value="SHOPPING">购物</option>
              <option value="OTHER">其他</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">日期</label>
            <input v-model="newExpense.date" type="date" class="form-input" />
          </div>
          <div class="form-group">
            <label class="form-label">备注</label>
            <textarea v-model="newExpense.notes" class="form-textarea" placeholder="可选"></textarea>
          </div>
          <div class="flex gap-3 mt-6">
            <button @click="closeExpenseModal" class="btn btn-outline flex-1">取消</button>
            <button @click="saveExpense" class="btn btn-primary flex-1">保存</button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showPackingItemModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div class="card w-full max-w-md">
        <div class="card-header">
          <h3 class="card-title">添加物品</h3>
        </div>
        <div class="card-body">
          <div class="form-group">
            <label class="form-label">物品名称</label>
            <input v-model="newPackingItem.name" type="text" class="form-input" placeholder="请输入物品名称" />
          </div>
          <div class="form-group">
            <label class="form-label">数量</label>
            <input v-model.number="newPackingItem.quantity" type="number" min="1" class="form-input" placeholder="1" />
          </div>
          <div class="flex gap-3 mt-6">
            <button @click="showPackingItemModal = false" class="btn btn-outline flex-1">取消</button>
            <button @click="addPackingItem" class="btn btn-primary flex-1">添加</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { planApi, itineraryApi, expenseApi, packingListApi, favoriteApi } from '@/api';
import { useAuthStore } from '@/stores';
import type { Plan, Itinerary, ItineraryItem, Expense, PackingList, PackingItem, ExpenseCategory, ItemType, PlanStatus as PlanStatusType } from '@/types';
import dayjs from 'dayjs';
import Sortable from 'sortablejs';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const planId = computed(() => parseInt(route.params.id as string));
const plan = ref<Plan | null>(null);
const loading = ref(true);
const isOwner = computed(() => authStore.isAuthenticated && plan.value?.userId === authStore.user?.id);
const isFavorited = ref(false);

const activeTab = ref('itinerary');
const tabs = [
  { label: '行程安排', value: 'itinerary', icon: 'calendar' },
  { label: '费用管理', value: 'expenses', icon: 'dollar-sign' },
  { label: '打包清单', value: 'packing', icon: 'box' },
];

const defaultCover = 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=beautiful%20travel%20destination%20landscape&image_size=square_hd';

const totalDays = computed(() => {
  if (!plan.value) return 0;
  return Math.ceil((dayjs(plan.value.endDate).valueOf() - dayjs(plan.value.startDate).valueOf()) / (1000 * 60 * 60 * 24)) + 1;
});

const actualSpent = computed(() => {
  if (!plan.value?.expenses) return 0;
  return plan.value.expenses.reduce((sum, e) => sum + e.amount, 0);
});

const expenseByCategory = computed(() => {
  if (!plan.value?.expenses) return {};
  const result: Record<string, number> = {};
  plan.value.expenses.forEach(e => {
    result[e.category] = (result[e.category] || 0) + e.amount;
  });
  return result;
});

const packingList = computed(() => plan.value?.packingList);
const packedCount = computed(() => packingList.value?.items.filter(i => i.isPacked).length || 0);
const unpackedCount = computed(() => packingList.value?.items.filter(i => !i.isPacked).length || 0);

const showItineraryModal = ref(false);
const showItemModal = ref(false);
const showExpenseModal = ref(false);
const showPackingItemModal = ref(false);

const currentItinerary = ref<Itinerary | null>(null);
const editingItem = ref<ItineraryItem | null>(null);
const editingExpense = ref<Expense | null>(null);

const newItinerary = ref({
  date: '',
});

const newItem = ref({
  name: '',
  type: 'ATTRACTION' as ItemType,
  address: '',
  startTime: '',
  endTime: '',
  estimatedCost: undefined as number | undefined,
});

const newExpense = ref({
  amount: 0,
  category: 'OTHER' as ExpenseCategory,
  date: dayjs().format('YYYY-MM-DD'),
  notes: '',
});

const newPackingItem = ref({
  name: '',
  quantity: 1,
});

const selectedTemplate = ref('');

async function fetchPlan() {
  loading.value = true;
  try {
    const response = await planApi.findOne(planId.value);
    plan.value = response.data;
    
    if (authStore.isAuthenticated && !isOwner.value) {
      const favResponse = await favoriteApi.check(planId.value);
      isFavorited.value = favResponse.data.isFavorite;
    }
  } catch (error) {
    console.error('Failed to fetch plan:', error);
  } finally {
    loading.value = false;
  }
}

async function togglePublic() {
  if (!plan.value) return;
  try {
    await planApi.update(planId.value, { isPublic: !plan.value.isPublic });
    plan.value.isPublic = !plan.value.isPublic;
  } catch (error) {
    console.error('Failed to toggle public:', error);
  }
}

async function toggleFavorite() {
  try {
    if (isFavorited.value) {
      await favoriteApi.remove(planId.value);
    } else {
      await favoriteApi.add(planId.value);
    }
    isFavorited.value = !isFavorited.value;
  } catch (error) {
    console.error('Failed to toggle favorite:', error);
  }
}

async function addItinerary() {
  if (!newItinerary.value.date) return;
  try {
    await itineraryApi.create(planId.value, newItinerary.value.date);
    showItineraryModal.value = false;
    newItinerary.value.date = '';
    fetchPlan();
  } catch (error) {
    console.error('Failed to add itinerary:', error);
  }
}

function editItem(itinerary: Itinerary, item: ItineraryItem) {
  currentItinerary.value = itinerary;
  editingItem.value = item;
  newItem.value = {
    name: item.name,
    type: item.type,
    address: item.address || '',
    startTime: item.startTime ? dayjs(item.startTime).format('HH:mm') : '',
    endTime: item.endTime ? dayjs(item.endTime).format('HH:mm') : '',
    estimatedCost: item.estimatedCost,
  };
  showItemModal.value = true;
}

function closeItemModal() {
  showItemModal.value = false;
  editingItem.value = null;
  currentItinerary.value = null;
  newItem.value = {
    name: '',
    type: 'ATTRACTION' as ItemType,
    address: '',
    startTime: '',
    endTime: '',
    estimatedCost: undefined,
  };
}

async function saveItem() {
  if (!currentItinerary.value || !newItem.value.name) return;

  const itemData: any = {
    name: newItem.value.name,
    type: newItem.value.type,
    address: newItem.value.address || undefined,
    estimatedCost: newItem.value.estimatedCost,
  };

  if (currentItinerary.value && newItem.value.startTime) {
    itemData.startTime = dayjs(currentItinerary.value.date).hour(parseInt(newItem.value.startTime.split(':')[0])).minute(parseInt(newItem.value.startTime.split(':')[1])).toISOString();
  }
  if (currentItinerary.value && newItem.value.endTime) {
    itemData.endTime = dayjs(currentItinerary.value.date).hour(parseInt(newItem.value.endTime.split(':')[0])).minute(parseInt(newItem.value.endTime.split(':')[1])).toISOString();
  }

  try {
    if (editingItem.value) {
      await itineraryApi.updateItem(planId.value, currentItinerary.value.id, editingItem.value.id, itemData);
    } else {
      await itineraryApi.createItem(planId.value, currentItinerary.value.id, itemData);
    }
    closeItemModal();
    fetchPlan();
  } catch (error) {
    console.error('Failed to save item:', error);
  }
}

async function deleteItem(itineraryId: number, itemId: number) {
  if (!confirm('确定要删除这个行程项目吗？')) return;
  try {
    await itineraryApi.deleteItem(planId.value, itineraryId, itemId);
    fetchPlan();
  } catch (error) {
    console.error('Failed to delete item:', error);
  }
}

function editExpense(expense: Expense) {
  editingExpense.value = expense;
  newExpense.value = {
    amount: expense.amount,
    category: expense.category,
    date: dayjs(expense.date).format('YYYY-MM-DD'),
    notes: expense.notes || '',
  };
  showExpenseModal.value = true;
}

function closeExpenseModal() {
  showExpenseModal.value = false;
  editingExpense.value = null;
  newExpense.value = {
    amount: 0,
    category: 'OTHER' as ExpenseCategory,
    date: dayjs().format('YYYY-MM-DD'),
    notes: '',
  };
}

async function saveExpense() {
  if (!newExpense.value.amount) return;

  try {
    if (editingExpense.value) {
      await expenseApi.update(planId.value, editingExpense.value.id, newExpense.value);
    } else {
      await expenseApi.create(planId.value, newExpense.value);
    }
    closeExpenseModal();
    fetchPlan();
  } catch (error) {
    console.error('Failed to save expense:', error);
  }
}

async function deleteExpense(id: number) {
  if (!confirm('确定要删除这笔费用吗？')) return;
  try {
    await expenseApi.delete(planId.value, id);
    fetchPlan();
  } catch (error) {
    console.error('Failed to delete expense:', error);
  }
}

async function addPackingItem() {
  if (!newPackingItem.value.name) return;
  try {
    await packingListApi.addItem(planId.value, newPackingItem.value);
    showPackingItemModal.value = false;
    newPackingItem.value = { name: '', quantity: 1 };
    fetchPlan();
  } catch (error) {
    console.error('Failed to add packing item:', error);
  }
}

async function togglePackingItem(item: PackingItem) {
  try {
    await packingListApi.toggleItem(planId.value, item.id);
    fetchPlan();
  } catch (error) {
    console.error('Failed to toggle packing item:', error);
  }
}

async function deletePackingItem(id: number) {
  if (!confirm('确定要删除这个物品吗？')) return;
  try {
    await packingListApi.deleteItem(planId.value, id);
    fetchPlan();
  } catch (error) {
    console.error('Failed to delete packing item:', error);
  }
}

async function applyTemplate() {
  if (!selectedTemplate.value) return;
  try {
    await packingListApi.applyTemplate(planId.value, selectedTemplate.value);
    selectedTemplate.value = '';
    fetchPlan();
  } catch (error) {
    console.error('Failed to apply template:', error);
  }
}

function formatDate(date: string): string {
  return dayjs(date).format('YYYY-MM-DD');
}

function formatTime(date: string): string {
  return dayjs(date).format('HH:mm');
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

function getItemIcon(type: ItemType): string {
  const map: Record<string, string> = {
    ATTRACTION: 'landmark',
    RESTAURANT: 'utensils',
    HOTEL: 'hotel',
    TRANSPORTATION: 'plane',
  };
  return map[type] || 'map-marker-alt';
}

function getCategoryIcon(category: string): string {
  const map: Record<string, string> = {
    TRANSPORTATION: 'plane',
    ACCOMMODATION: 'hotel',
    DINING: 'utensils',
    TICKETS: 'ticket',
    SHOPPING: 'shopping-bag',
    OTHER: 'ellipsis-h',
  };
  return map[category] || 'ellipsis-h';
}

function getCategoryLabel(category: string): string {
  const map: Record<string, string> = {
    TRANSPORTATION: '交通',
    ACCOMMODATION: '住宿',
    DINING: '餐饮',
    TICKETS: '门票',
    SHOPPING: '购物',
    OTHER: '其他',
  };
  return map[category] || category;
}

function getCategoryBg(category: string): string {
  const map: Record<string, string> = {
    TRANSPORTATION: 'bg-blue-500',
    ACCOMMODATION: 'bg-purple-500',
    DINING: 'bg-orange-500',
    TICKETS: 'bg-green-500',
    SHOPPING: 'bg-pink-500',
    OTHER: 'bg-gray-500',
  };
  return map[category] || 'bg-gray-500';
}

watch(activeTab, (tab) => {
  if (tab === 'itinerary' && isOwner.value) {
    nextTick(() => {
      const containers = document.querySelectorAll('.sortable-item').forEach(el => {
        const parent = el.parentElement;
        if (parent && !parent.classList.contains('sortable-container')) {
          parent.classList.add('sortable-container');
          new Sortable(parent as HTMLElement, {
            animation: 150,
            ghostClass: 'sortable-ghost',
            chosenClass: 'sortable-chosen',
            handle: '.sortable-item',
            onEnd: async (evt) => {
              if (!currentItinerary.value) return;
              const items = Array.from(parent.children).map((child, index) => {
                const id = child.getAttribute('data-id');
                return id ? parseInt(id) : 0;
              }).filter(id => id > 0);
              
              try {
                await itineraryApi.reorderItems(planId.value, currentItinerary.value.id, items);
                fetchPlan();
              } catch (error) {
                console.error('Failed to reorder items:', error);
              }
            },
          });
        }
      });
    });
  }
});

onMounted(() => {
  fetchPlan();
});
</script>

<style scoped>
</style>

import axios from 'axios';
import type {
  User,
  Plan,
  Itinerary,
  ItineraryItem,
  Expense,
  ExpenseSummary,
  PackingList,
  PackingItem,
  PopularDestination,
  UserStatistics,
  CityDistribution,
  MonthlyFrequency,
  ExpenseCategoryStat,
  BudgetVsActual,
  CreatePlanDto,
  UpdatePlanDto,
  CreateItineraryItemDto,
  CreateExpenseDto,
  CreatePackingItemDto,
  PlanStatus,
  ItemType,
} from '@/types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:13054';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 30000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: (email: string, password: string) =>
    api.post<{ access_token: string; user: User }>('/auth/login', { email, password }),
  register: (email: string, password: string, name: string) =>
    api.post<{ access_token: string; user: User }>('/auth/register', { email, password, name }),
  getProfile: () => api.get<User>('/auth/profile'),
};

export const userApi = {
  getProfile: () => api.get<User>('/users/me'),
  updateProfile: (data: Partial<User>) => api.put<User>('/users/me', data),
  getStatistics: () => api.get<UserStatistics>('/users/me/statistics'),
};

export const planApi = {
  create: (data: CreatePlanDto) => api.post<Plan>('/plans', data),
  findAll: (status?: PlanStatus) =>
    api.get<Plan[]>('/plans', { params: { status } }),
  findPublic: (search?: string, limit?: number) =>
    api.get<Plan[]>('/plans/public', { params: { search, limit } }),
  getPopularDestinations: () => api.get<PopularDestination[]>('/plans/popular-destinations'),
  getUpcoming: () => api.get<Plan[]>('/plans/upcoming'),
  findOne: (id: number) => api.get<Plan>(`/plans/${id}`),
  update: (id: number, data: UpdatePlanDto) => api.put<Plan>(`/plans/${id}`, data),
  remove: (id: number) => api.delete(`/plans/${id}`),
};

export const itineraryApi = {
  findByPlan: (planId: number) => api.get<Itinerary[]>(`/plans/${planId}/itineraries`),
  create: (planId: number, date: string) =>
    api.post<Itinerary>(`/plans/${planId}/itineraries`, { date }),
  createItem: (planId: number, itineraryId: number, data: CreateItineraryItemDto) =>
    api.post<ItineraryItem>(`/plans/${planId}/itineraries/${itineraryId}/items`, data),
  updateItem: (planId: number, itineraryId: number, itemId: number, data: Partial<CreateItineraryItemDto>) =>
    api.put<ItineraryItem>(`/plans/${planId}/itineraries/${itineraryId}/items/${itemId}`, data),
  deleteItem: (planId: number, itineraryId: number, itemId: number) =>
    api.delete(`/plans/${planId}/itineraries/${itineraryId}/items/${itemId}`),
  reorderItems: (planId: number, itineraryId: number, itemIds: number[]) =>
    api.post<ItineraryItem[]>(`/plans/${planId}/itineraries/${itineraryId}/items/reorder`, { itemIds }),
};

export const expenseApi = {
  findByPlan: (planId: number) => api.get<Expense[]>(`/plans/${planId}/expenses`),
  getSummary: (planId: number) => api.get<ExpenseSummary>(`/plans/${planId}/expenses/summary`),
  create: (planId: number, data: CreateExpenseDto) =>
    api.post<Expense>(`/plans/${planId}/expenses`, data),
  update: (planId: number, id: number, data: Partial<CreateExpenseDto>) =>
    api.put<Expense>(`/plans/${planId}/expenses/${id}`, data),
  delete: (planId: number, id: number) =>
    api.delete(`/plans/${planId}/expenses/${id}`),
};

export const packingListApi = {
  findByPlan: (planId: number) => api.get<PackingList>(`/plans/${planId}/packing-list`),
  addItem: (planId: number, data: CreatePackingItemDto) =>
    api.post<PackingItem>(`/plans/${planId}/packing-list/items`, data),
  updateItem: (planId: number, itemId: number, data: Partial<CreatePackingItemDto>) =>
    api.put<PackingItem>(`/plans/${planId}/packing-list/items/${itemId}`, data),
  deleteItem: (planId: number, itemId: number) =>
    api.delete(`/plans/${planId}/packing-list/items/${itemId}`),
  toggleItem: (planId: number, itemId: number) =>
    api.post<PackingItem>(`/plans/${planId}/packing-list/items/${itemId}/toggle`),
  applyTemplate: (planId: number, template: string) =>
    api.post<PackingList>(`/plans/${planId}/packing-list/apply-template`, { template }),
};

export const favoriteApi = {
  findMyFavorites: () => api.get<Plan[]>('/favorites'),
  add: (planId: number) => api.post(`/favorites/plans/${planId}`),
  remove: (planId: number) => api.delete(`/favorites/plans/${planId}`),
  check: (planId: number) => api.get<{ isFavorite: boolean }>(`/favorites/plans/${planId}/check`),
};

export const statisticsApi = {
  getCityDistribution: () => api.get<CityDistribution[]>('/statistics/city-distribution'),
  getMonthlyFrequency: () => api.get<MonthlyFrequency[]>('/statistics/monthly-frequency'),
  getExpenseCategories: () => api.get<ExpenseCategoryStat[]>('/statistics/expense-categories'),
  getBudgetVsActual: () => api.get<BudgetVsActual[]>('/statistics/budget-vs-actual'),
};

export default api;

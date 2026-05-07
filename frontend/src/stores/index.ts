import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { authApi, userApi } from '@/api';
import type { User, UserStatistics } from '@/types';

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null);
  const token = ref<string | null>(localStorage.getItem('token'));
  const isAuthenticated = computed(() => !!token.value);

  async function login(email: string, password: string) {
    const response = await authApi.login(email, password);
    token.value = response.data.access_token;
    user.value = response.data.user;
    localStorage.setItem('token', response.data.access_token);
    return response.data;
  }

  async function register(email: string, password: string, name: string) {
    const response = await authApi.register(email, password, name);
    token.value = response.data.access_token;
    user.value = response.data.user;
    localStorage.setItem('token', response.data.access_token);
    return response.data;
  }

  async function fetchUser() {
    try {
      const response = await authApi.getProfile();
      user.value = response.data;
    } catch (error) {
      logout();
      throw error;
    }
  }

  function logout() {
    user.value = null;
    token.value = null;
    localStorage.removeItem('token');
  }

  async function updateProfile(data: Partial<User>) {
    const response = await userApi.updateProfile(data);
    user.value = response.data;
    return response.data;
  }

  return {
    user,
    token,
    isAuthenticated,
    login,
    register,
    fetchUser,
    logout,
    updateProfile,
  };
});

export const useUserStore = defineStore('user', () => {
  const statistics = ref<UserStatistics | null>(null);

  async function fetchStatistics() {
    const response = await userApi.getStatistics();
    statistics.value = response.data;
    return response.data;
  }

  return {
    statistics,
    fetchStatistics,
  };
});

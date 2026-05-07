import { createRouter, createWebHistory } from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';
import { useAuthStore } from '@/stores';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/HomeView.vue'),
    meta: { requiresAuth: false },
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/LoginView.vue'),
    meta: { requiresAuth: false, guestOnly: true },
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/RegisterView.vue'),
    meta: { requiresAuth: false, guestOnly: true },
  },
  {
    path: '/discover',
    name: 'Discover',
    component: () => import('@/views/DiscoverView.vue'),
    meta: { requiresAuth: false },
  },
  {
    path: '/plans',
    name: 'Plans',
    component: () => import('@/views/PlansView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/plans/new',
    name: 'NewPlan',
    component: () => import('@/views/PlanFormView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/plans/:id',
    name: 'PlanDetail',
    component: () => import('@/views/PlanDetailView.vue'),
    meta: { requiresAuth: false },
  },
  {
    path: '/plans/:id/edit',
    name: 'EditPlan',
    component: () => import('@/views/PlanFormView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/favorites',
    name: 'Favorites',
    component: () => import('@/views/FavoritesView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/statistics',
    name: 'Statistics',
    component: () => import('@/views/StatisticsView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('@/views/ProfileView.vue'),
    meta: { requiresAuth: true },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach(async (to, _from, next) => {
  const authStore = useAuthStore();
  const isAuthenticated = authStore.isAuthenticated;

  if (isAuthenticated && !authStore.user) {
    try {
      await authStore.fetchUser();
    } catch (error) {
      authStore.logout();
    }
  }

  if (to.meta.requiresAuth && !isAuthenticated) {
    next('/login');
  } else if (to.meta.guestOnly && isAuthenticated) {
    next('/');
  } else {
    next();
  }
});

export default router;

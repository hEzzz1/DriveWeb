import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import LoginView from '../views/LoginView.vue'
import AuthStatusView from '../views/AuthStatusView.vue'
import AlertsListView from '../views/AlertsListView.vue'
import AlertDetailView from '../views/AlertDetailView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: LoginView,
      meta: { public: true },
    },
    {
      path: '/',
      name: 'auth-status',
      component: AuthStatusView,
      meta: { requiresAuth: true },
    },
    {
      path: '/alerts',
      name: 'alerts-list',
      component: AlertsListView,
      meta: { requiresAuth: true },
    },
    {
      path: '/alerts/:id',
      name: 'alert-detail',
      component: AlertDetailView,
      meta: { requiresAuth: true },
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/',
    },
  ],
})

router.beforeEach((to) => {
  const authStore = useAuthStore()
  authStore.hydrate()

  const isPublic = Boolean(to.meta.public)

  if (isPublic && authStore.isAuthenticated) {
    return { name: 'auth-status' }
  }

  if (!isPublic && !authStore.isAuthenticated) {
    return {
      name: 'login',
      query: { redirect: to.fullPath },
    }
  }

  return true
})

export default router

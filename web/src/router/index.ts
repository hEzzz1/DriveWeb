import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import LoginView from '../views/LoginView.vue'
import AuthStatusView from '../views/AuthStatusView.vue'
import RealtimeOverviewView from '../views/RealtimeOverviewView.vue'
import AlertsListView from '../views/AlertsListView.vue'
import AlertDetailView from '../views/AlertDetailView.vue'
import TrendAnalysisView from '../views/TrendAnalysisView.vue'
import RiskRankingView from '../views/RiskRankingView.vue'
import RulesManagementView from '../views/RulesManagementView.vue'
import AuditStatusView from '../views/AuditStatusView.vue'
import SystemManagementView from '../views/SystemManagementView.vue'

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
      name: 'realtime-overview',
      component: RealtimeOverviewView,
      meta: { requiresAuth: true, roles: ['ADMIN', 'OPERATOR', 'VIEWER'] },
    },
    {
      path: '/session',
      name: 'auth-status',
      component: AuthStatusView,
      meta: { requiresAuth: true, roles: ['ADMIN', 'OPERATOR', 'VIEWER'] },
    },
    {
      path: '/alerts',
      name: 'alerts-list',
      component: AlertsListView,
      meta: { requiresAuth: true, roles: ['ADMIN', 'OPERATOR', 'VIEWER'] },
    },
    {
      path: '/alerts/:id',
      name: 'alert-detail',
      component: AlertDetailView,
      meta: { requiresAuth: true, roles: ['ADMIN', 'OPERATOR', 'VIEWER'] },
    },
    {
      path: '/stats/trend',
      name: 'trend-analysis',
      component: TrendAnalysisView,
      meta: { requiresAuth: true, roles: ['ADMIN', 'OPERATOR', 'VIEWER'] },
    },
    {
      path: '/stats/ranking',
      name: 'risk-ranking',
      component: RiskRankingView,
      meta: { requiresAuth: true, roles: ['ADMIN', 'OPERATOR', 'VIEWER'] },
    },
    {
      path: '/rules',
      name: 'rules-management',
      component: RulesManagementView,
      meta: { requiresAuth: true, roles: ['ADMIN'] },
    },
    {
      path: '/audit',
      name: 'audit-status',
      component: AuditStatusView,
      meta: { requiresAuth: true, roles: ['ADMIN', 'OPERATOR'] },
    },
    {
      path: '/system',
      name: 'system-management',
      component: SystemManagementView,
      meta: { requiresAuth: true, roles: ['ADMIN'] },
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
    return { name: 'realtime-overview' }
  }

  if (!isPublic && !authStore.isAuthenticated) {
    return {
      name: 'login',
      query: { redirect: to.fullPath },
    }
  }

  const requiredRoles = Array.isArray(to.meta.roles) ? to.meta.roles : []

  if (
    requiredRoles.length &&
    !requiredRoles.some((role) => authStore.hasRole(role))
  ) {
    return { name: 'realtime-overview' }
  }

  return true
})

export default router

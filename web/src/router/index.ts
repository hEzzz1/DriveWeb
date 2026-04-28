import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import type { UserRole } from '../types/api'
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
import UserManagementView from '../views/UserManagementView.vue'
import EnterpriseManagementView from '../views/EnterpriseManagementView.vue'
import FleetManagementView from '../views/FleetManagementView.vue'
import DriverManagementView from '../views/DriverManagementView.vue'

const OPS_ROLES: UserRole[] = ['SUPER_ADMIN', 'OPERATOR', 'ANALYST', 'VIEWER']
const ANALYSIS_ROLES: UserRole[] = ['SUPER_ADMIN', 'OPERATOR', 'ANALYST']
const RULE_ROLES: UserRole[] = ['SUPER_ADMIN', 'RISK_ADMIN']
const SYSTEM_ROLES: UserRole[] = ['SUPER_ADMIN', 'SYS_ADMIN']
const USER_ADMIN_ROLES: UserRole[] = ['SUPER_ADMIN', 'ENTERPRISE_ADMIN']
const ENTERPRISE_ROLES: UserRole[] = ['SUPER_ADMIN', 'SYS_ADMIN']
const BUSINESS_DOMAIN_ROLES: UserRole[] = ['SUPER_ADMIN', 'ENTERPRISE_ADMIN', 'OPERATOR', 'ANALYST']
const ALL_AUTH_ROLES: UserRole[] = ['SUPER_ADMIN', 'ENTERPRISE_ADMIN', 'SYS_ADMIN', 'RISK_ADMIN', 'OPERATOR', 'ANALYST', 'VIEWER']

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
      meta: { requiresAuth: true, roles: OPS_ROLES },
    },
    {
      path: '/session',
      name: 'auth-status',
      component: AuthStatusView,
      meta: { requiresAuth: true, roles: ALL_AUTH_ROLES },
    },
    {
      path: '/alerts',
      name: 'alerts-list',
      component: AlertsListView,
      meta: { requiresAuth: true, roles: OPS_ROLES },
    },
    {
      path: '/alerts/:id',
      name: 'alert-detail',
      component: AlertDetailView,
      meta: { requiresAuth: true, roles: OPS_ROLES },
    },
    {
      path: '/stats/trend',
      name: 'trend-analysis',
      component: TrendAnalysisView,
      meta: { requiresAuth: true, roles: ANALYSIS_ROLES },
    },
    {
      path: '/stats/ranking',
      name: 'risk-ranking',
      component: RiskRankingView,
      meta: { requiresAuth: true, roles: ANALYSIS_ROLES },
    },
    {
      path: '/rules',
      name: 'rules-management',
      component: RulesManagementView,
      meta: { requiresAuth: true, roles: RULE_ROLES },
    },
    {
      path: '/audit',
      name: 'audit-logs',
      component: AuditStatusView,
      meta: { requiresAuth: true, roles: SYSTEM_ROLES },
    },
    {
      path: '/system',
      redirect: '/system/health',
    },
    {
      path: '/system/health',
      name: 'system-health',
      component: SystemManagementView,
      meta: { requiresAuth: true, roles: SYSTEM_ROLES },
    },
    {
      path: '/system/services',
      name: 'service-status',
      component: SystemManagementView,
      meta: { requiresAuth: true, roles: SYSTEM_ROLES },
    },
    {
      path: '/system/version',
      name: 'version-info',
      component: SystemManagementView,
      meta: { requiresAuth: true, roles: SYSTEM_ROLES },
    },
    {
      path: '/users',
      name: 'user-management',
      component: UserManagementView,
      meta: { requiresAuth: true, roles: USER_ADMIN_ROLES },
    },
    {
      path: '/fleets',
      name: 'fleet-management',
      component: FleetManagementView,
      meta: { requiresAuth: true, roles: BUSINESS_DOMAIN_ROLES },
    },
    {
      path: '/drivers',
      name: 'driver-management',
      component: DriverManagementView,
      meta: { requiresAuth: true, roles: BUSINESS_DOMAIN_ROLES },
    },
    {
      path: '/enterprises',
      name: 'enterprise-management',
      component: EnterpriseManagementView,
      meta: { requiresAuth: true, roles: ENTERPRISE_ROLES },
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: () => {
        const authStore = useAuthStore()
        authStore.hydrate()
        return authStore.isAuthenticated ? authStore.getDefaultRoute() : '/login'
      },
    },
  ],
})

router.beforeEach((to) => {
  const authStore = useAuthStore()
  authStore.hydrate()

  const isPublic = Boolean(to.meta.public)

  if (isPublic && authStore.isAuthenticated) {
    return authStore.getDefaultRoute()
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
    !authStore.hasAnyRole(requiredRoles as UserRole[])
  ) {
    return authStore.getDefaultRoute()
  }

  return true
})

export default router

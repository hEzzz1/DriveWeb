import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import type { PermissionCode } from '../types/api'
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
import VehicleManagementView from '../views/VehicleManagementView.vue'
import DeviceManagementView from '../views/DeviceManagementView.vue'
import DeviceDetailView from '../views/DeviceDetailView.vue'
import DeviceApprovalListView from '../views/DeviceApprovalListView.vue'
import DeviceApprovalDetailView from '../views/DeviceApprovalDetailView.vue'
import DrivingSessionManagementView from '../views/DrivingSessionManagementView.vue'

const OVERVIEW_PERMISSIONS: PermissionCode[] = ['overview.read']
const ALERT_PERMISSIONS: PermissionCode[] = ['alert.read']
const STATS_PERMISSIONS: PermissionCode[] = ['stats.read']
const RULE_PERMISSIONS: PermissionCode[] = ['rule.read']
const AUDIT_PERMISSIONS: PermissionCode[] = ['audit.read']
const SYSTEM_PERMISSIONS: PermissionCode[] = ['system.read']
const USER_PERMISSIONS: PermissionCode[] = ['user.read']
const ENTERPRISE_PERMISSIONS: PermissionCode[] = ['enterprise.read']
const FLEET_PERMISSIONS: PermissionCode[] = ['fleet.read']
const DRIVER_PERMISSIONS: PermissionCode[] = ['driver.read']
const VEHICLE_PERMISSIONS: PermissionCode[] = ['vehicle.read']
const DEVICE_PERMISSIONS: PermissionCode[] = ['device.read']
const ACTIVATION_CODE_PERMISSIONS: PermissionCode[] = ['activation_code.read']
const SESSION_PERMISSIONS: PermissionCode[] = ['session.read']

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
      redirect: () => {
        const authStore = useAuthStore()
        authStore.hydrate()
        return authStore.isAuthenticated ? authStore.getDefaultRoute() : '/login'
      },
    },
    {
      path: '/overview',
      name: 'realtime-overview',
      component: RealtimeOverviewView,
      meta: { requiresAuth: true, permissions: OVERVIEW_PERMISSIONS },
    },
    {
      path: '/account/session',
      name: 'auth-status',
      component: AuthStatusView,
      meta: { requiresAuth: true },
    },
    {
      path: '/alerts',
      name: 'alerts-list',
      component: AlertsListView,
      meta: { requiresAuth: true, permissions: ALERT_PERMISSIONS },
    },
    {
      path: '/alerts/:id',
      name: 'alert-detail',
      component: AlertDetailView,
      meta: { requiresAuth: true, permissions: ALERT_PERMISSIONS },
    },
    {
      path: '/stats/trend',
      name: 'trend-analysis',
      component: TrendAnalysisView,
      meta: { requiresAuth: true, permissions: STATS_PERMISSIONS },
    },
    {
      path: '/stats/ranking',
      name: 'risk-ranking',
      component: RiskRankingView,
      meta: { requiresAuth: true, permissions: STATS_PERMISSIONS },
    },
    {
      path: '/rules',
      name: 'rules-management',
      component: RulesManagementView,
      meta: { requiresAuth: true, permissions: RULE_PERMISSIONS },
    },
    {
      path: '/audit',
      name: 'audit-logs',
      component: AuditStatusView,
      meta: { requiresAuth: true, permissions: AUDIT_PERMISSIONS },
    },
    {
      path: '/system',
      redirect: '/system/health',
    },
    {
      path: '/system/health',
      name: 'system-health',
      component: SystemManagementView,
      meta: { requiresAuth: true, permissions: SYSTEM_PERMISSIONS },
    },
    {
      path: '/system/services',
      name: 'service-status',
      component: SystemManagementView,
      meta: { requiresAuth: true, permissions: SYSTEM_PERMISSIONS },
    },
    {
      path: '/system/version',
      name: 'version-info',
      component: SystemManagementView,
      meta: { requiresAuth: true, permissions: SYSTEM_PERMISSIONS },
    },
    {
      path: '/users',
      name: 'user-management',
      component: UserManagementView,
      meta: { requiresAuth: true, permissions: USER_PERMISSIONS },
    },
    {
      path: '/fleets',
      name: 'fleet-management',
      component: FleetManagementView,
      meta: { requiresAuth: true, permissions: FLEET_PERMISSIONS },
    },
    {
      path: '/drivers',
      name: 'driver-management',
      component: DriverManagementView,
      meta: { requiresAuth: true, permissions: DRIVER_PERMISSIONS },
    },
    {
      path: '/vehicles',
      name: 'vehicle-management',
      component: VehicleManagementView,
      meta: { requiresAuth: true, permissions: VEHICLE_PERMISSIONS },
    },
    {
      path: '/device-approvals',
      redirect: '/device-bind-logs',
    },
    {
      path: '/device-bind-logs',
      name: 'device-bind-log-list',
      component: DeviceApprovalListView,
      meta: { requiresAuth: true, permissions: ACTIVATION_CODE_PERMISSIONS },
    },
    {
      path: '/device-approvals/:id',
      redirect: (to) => ({
        path: `/device-bind-logs/${to.params.id}`,
        query: to.query,
      }),
    },
    {
      path: '/device-bind-logs/:id',
      name: 'device-bind-log-detail',
      component: DeviceApprovalDetailView,
      meta: { requiresAuth: true, permissions: ACTIVATION_CODE_PERMISSIONS },
    },
    {
      path: '/devices',
      name: 'device-management',
      component: DeviceManagementView,
      meta: { requiresAuth: true, permissions: DEVICE_PERMISSIONS },
    },
    {
      path: '/devices/:id',
      name: 'device-detail',
      component: DeviceDetailView,
      meta: { requiresAuth: true, permissions: DEVICE_PERMISSIONS },
    },
    {
      path: '/sessions',
      name: 'session-management',
      component: DrivingSessionManagementView,
      meta: { requiresAuth: true, permissions: SESSION_PERMISSIONS },
    },
    {
      path: '/enterprises',
      name: 'enterprise-management',
      component: EnterpriseManagementView,
      meta: { requiresAuth: true, permissions: ENTERPRISE_PERMISSIONS },
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

  const requiredPermissions = Array.isArray(to.meta.permissions) ? to.meta.permissions : []

  if (requiredPermissions.length && !authStore.hasAnyPermission(requiredPermissions as PermissionCode[])) {
    return authStore.getDefaultRoute()
  }

  return true
})

export default router

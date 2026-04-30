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
import PlatformEnterpriseAdminManagementView from '../views/PlatformEnterpriseAdminManagementView.vue'
import OrgUserManagementView from '../views/OrgUserManagementView.vue'
import EnterpriseManagementView from '../views/EnterpriseManagementView.vue'
import FleetManagementView from '../views/FleetManagementView.vue'
import DriverManagementView from '../views/DriverManagementView.vue'
import VehicleManagementView from '../views/VehicleManagementView.vue'
import DeviceManagementView from '../views/DeviceManagementView.vue'
import DeviceDetailView from '../views/DeviceDetailView.vue'
import DrivingSessionManagementView from '../views/DrivingSessionManagementView.vue'
import OrgEnterpriseProfileView from '../views/OrgEnterpriseProfileView.vue'

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
const SESSION_PERMISSIONS: PermissionCode[] = ['session.read']

function resolveUserManagementLegacyPath(): string {
  const authStore = useAuthStore()
  authStore.hydrate()
  return authStore.workspaceDomain === 'platform' ? '/platform/enterprise-admins' : '/org/users'
}

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
      path: '/account/session',
      name: 'auth-status',
      component: AuthStatusView,
      meta: { requiresAuth: true },
    },
    {
      path: '/platform/enterprises',
      name: 'enterprise-management',
      component: EnterpriseManagementView,
      meta: { requiresAuth: true, permissions: ENTERPRISE_PERMISSIONS, domain: 'platform' },
    },
    {
      path: '/platform/enterprise-admins',
      name: 'enterprise-admin-management',
      component: PlatformEnterpriseAdminManagementView,
      meta: { requiresAuth: true, permissions: USER_PERMISSIONS, domain: 'platform' },
    },
    {
      path: '/platform/rules',
      name: 'rules-management',
      component: RulesManagementView,
      meta: { requiresAuth: true, permissions: RULE_PERMISSIONS, domain: 'platform' },
    },
    {
      path: '/platform/audit',
      name: 'audit-logs',
      component: AuditStatusView,
      meta: { requiresAuth: true, permissions: AUDIT_PERMISSIONS, domain: 'platform' },
    },
    {
      path: '/platform/system',
      redirect: '/platform/system/health',
    },
    {
      path: '/platform/system/health',
      name: 'system-health',
      component: SystemManagementView,
      meta: { requiresAuth: true, permissions: SYSTEM_PERMISSIONS, domain: 'platform' },
    },
    {
      path: '/platform/system/services',
      name: 'service-status',
      component: SystemManagementView,
      meta: { requiresAuth: true, permissions: SYSTEM_PERMISSIONS, domain: 'platform' },
    },
    {
      path: '/platform/system/version',
      name: 'version-info',
      component: SystemManagementView,
      meta: { requiresAuth: true, permissions: SYSTEM_PERMISSIONS, domain: 'platform' },
    },
    {
      path: '/org/overview',
      name: 'realtime-overview',
      component: RealtimeOverviewView,
      meta: { requiresAuth: true, permissions: OVERVIEW_PERMISSIONS, domain: 'org' },
    },
    {
      path: '/org/alerts',
      name: 'alerts-list',
      component: AlertsListView,
      meta: { requiresAuth: true, permissions: ALERT_PERMISSIONS, domain: 'org' },
    },
    {
      path: '/org/alerts/:id',
      name: 'alert-detail',
      component: AlertDetailView,
      meta: { requiresAuth: true, permissions: ALERT_PERMISSIONS, domain: 'org' },
    },
    {
      path: '/org/stats/trend',
      name: 'trend-analysis',
      component: TrendAnalysisView,
      meta: { requiresAuth: true, permissions: STATS_PERMISSIONS, domain: 'org' },
    },
    {
      path: '/org/stats/ranking',
      name: 'risk-ranking',
      component: RiskRankingView,
      meta: { requiresAuth: true, permissions: STATS_PERMISSIONS, domain: 'org' },
    },
    {
      path: '/org/users',
      name: 'org-user-management',
      component: OrgUserManagementView,
      meta: { requiresAuth: true, permissions: USER_PERMISSIONS, domain: 'org' },
    },
    {
      path: '/org/fleets',
      name: 'fleet-management',
      component: FleetManagementView,
      meta: { requiresAuth: true, permissions: FLEET_PERMISSIONS, domain: 'org' },
    },
    {
      path: '/org/drivers',
      name: 'driver-management',
      component: DriverManagementView,
      meta: { requiresAuth: true, permissions: DRIVER_PERMISSIONS, domain: 'org' },
    },
    {
      path: '/org/vehicles',
      name: 'vehicle-management',
      component: VehicleManagementView,
      meta: { requiresAuth: true, permissions: VEHICLE_PERMISSIONS, domain: 'org' },
    },
    {
      path: '/org/devices',
      name: 'device-management',
      component: DeviceManagementView,
      meta: { requiresAuth: true, permissions: DEVICE_PERMISSIONS, domain: 'org' },
    },
    {
      path: '/org/devices/:id',
      name: 'device-detail',
      component: DeviceDetailView,
      meta: { requiresAuth: true, permissions: DEVICE_PERMISSIONS, domain: 'org' },
    },
    {
      path: '/org/sessions',
      name: 'session-management',
      component: DrivingSessionManagementView,
      meta: { requiresAuth: true, permissions: SESSION_PERMISSIONS, domain: 'org' },
    },
    {
      path: '/org/enterprise-profile',
      name: 'org-enterprise-profile',
      component: OrgEnterpriseProfileView,
      meta: { requiresAuth: true, permissions: ENTERPRISE_PERMISSIONS, domain: 'org' },
    },
    {
      path: '/overview',
      redirect: '/org/overview',
    },
    {
      path: '/alerts',
      redirect: '/org/alerts',
    },
    {
      path: '/alerts/:id',
      redirect: (to) => ({
        path: `/org/alerts/${to.params.id}`,
        query: to.query,
      }),
    },
    {
      path: '/stats/trend',
      redirect: '/org/stats/trend',
    },
    {
      path: '/stats/ranking',
      redirect: '/org/stats/ranking',
    },
    {
      path: '/users',
      redirect: () => resolveUserManagementLegacyPath(),
    },
    {
      path: '/fleets',
      redirect: '/org/fleets',
    },
    {
      path: '/drivers',
      redirect: '/org/drivers',
    },
    {
      path: '/vehicles',
      redirect: '/org/vehicles',
    },
    {
      path: '/devices',
      redirect: '/org/devices',
    },
    {
      path: '/devices/:id',
      redirect: (to) => ({
        path: `/org/devices/${to.params.id}`,
        query: to.query,
      }),
    },
    {
      path: '/sessions',
      redirect: '/org/sessions',
    },
    {
      path: '/enterprises',
      redirect: '/platform/enterprises',
    },
    {
      path: '/rules',
      redirect: '/platform/rules',
    },
    {
      path: '/audit',
      redirect: '/platform/audit',
    },
    {
      path: '/system',
      redirect: '/platform/system/health',
    },
    {
      path: '/system/health',
      redirect: '/platform/system/health',
    },
    {
      path: '/system/services',
      redirect: '/platform/system/services',
    },
    {
      path: '/system/version',
      redirect: '/platform/system/version',
    },
    {
      path: '/device-approvals',
      redirect: '/org/enterprise-profile',
    },
    {
      path: '/device-approvals/:id',
      redirect: '/org/enterprise-profile',
    },
    {
      path: '/device-bind-logs',
      redirect: '/org/enterprise-profile',
    },
    {
      path: '/device-bind-logs/:id',
      redirect: '/org/enterprise-profile',
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

  const requiredDomain = typeof to.meta.domain === 'string' ? to.meta.domain : null

  if (requiredDomain && authStore.workspaceDomain !== requiredDomain) {
    return authStore.getDefaultRoute()
  }

  const requiredPermissions = Array.isArray(to.meta.permissions) ? to.meta.permissions : []

  if (requiredPermissions.length && !authStore.hasAnyPermission(requiredPermissions as PermissionCode[])) {
    return authStore.getDefaultRoute()
  }

  return true
})

export default router

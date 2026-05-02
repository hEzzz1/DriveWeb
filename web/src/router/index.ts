import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { workspaceDefinitions, workspaceSectionLabels } from '../config/workspace'
import { useAuthStore } from '../stores/auth'
import type { PermissionCode } from '../types/api'
import AlertDetailView from '../views/AlertDetailView.vue'
import AlertsListView from '../views/AlertsListView.vue'
import AuthStatusView from '../views/AuthStatusView.vue'
import AuditStatusView from '../views/AuditStatusView.vue'
import DeviceDetailView from '../views/DeviceDetailView.vue'
import DeviceManagementView from '../views/DeviceManagementView.vue'
import DriverManagementView from '../views/DriverManagementView.vue'
import DrivingSessionManagementView from '../views/DrivingSessionManagementView.vue'
import EnterpriseManagementView from '../views/EnterpriseManagementView.vue'
import FleetManagementView from '../views/FleetManagementView.vue'
import LoginView from '../views/LoginView.vue'
import OrgAuditStatusView from '../views/OrgAuditStatusView.vue'
import OrgEnterpriseProfileView from '../views/OrgEnterpriseProfileView.vue'
import OrgUserManagementView from '../views/OrgUserManagementView.vue'
import PlatformEnterpriseAdminManagementView from '../views/PlatformEnterpriseAdminManagementView.vue'
import PlatformInternalUserManagementView from '../views/PlatformInternalUserManagementView.vue'
import RealtimeOverviewView from '../views/RealtimeOverviewView.vue'
import RiskRankingView from '../views/RiskRankingView.vue'
import RulesManagementView from '../views/RulesManagementView.vue'
import SystemManagementView from '../views/SystemManagementView.vue'
import TrendAnalysisView from '../views/TrendAnalysisView.vue'
import VehicleManagementView from '../views/VehicleManagementView.vue'

function resolveUserManagementLegacyPath(): string {
  const authStore = useAuthStore()
  authStore.hydrate()
  return authStore.workspaceDomain === 'platform' ? '/platform/enterprise-admins' : '/org/users'
}

const workspaceViewMap: Record<string, RouteRecordRaw['component']> = {
  'auth-session': AuthStatusView,
  enterprises: EnterpriseManagementView,
  'enterprise-admins': PlatformEnterpriseAdminManagementView,
  'internal-users': PlatformInternalUserManagementView,
  rules: RulesManagementView,
  audit: AuditStatusView,
  health: SystemManagementView,
  services: SystemManagementView,
  version: SystemManagementView,
  overview: RealtimeOverviewView,
  alerts: AlertsListView,
  'alert-detail': AlertDetailView,
  trend: TrendAnalysisView,
  ranking: RiskRankingView,
  users: OrgUserManagementView,
  'org-audit': OrgAuditStatusView,
  'enterprise-profile': OrgEnterpriseProfileView,
  fleets: FleetManagementView,
  drivers: DriverManagementView,
  vehicles: VehicleManagementView,
  devices: DeviceManagementView,
  'device-detail': DeviceDetailView,
  sessions: DrivingSessionManagementView,
}

const workspaceRoutes: RouteRecordRaw[] = workspaceDefinitions.reduce<RouteRecordRaw[]>((routes, item) => {
  const component = workspaceViewMap[item.key]

  if (!component) {
    return routes
  }

  routes.push({
    path: item.path,
    name: item.routeName,
    component,
    meta: {
      requiresAuth: true,
      permissions: item.permissions,
      domain: item.domain,
      workspaceKey: item.key,
      workspaceParentKey: item.parentKey,
      workspaceMenu: item.menu,
      workspaceSection: item.section,
      workspaceSectionLabel: workspaceSectionLabels[item.section],
      pageTitle: item.label,
      pageSubtitle: item.subtitle,
      pageBadge: item.badge,
    },
  })

  return routes
}, [])

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
    ...workspaceRoutes,
    {
      path: '/platform/system',
      redirect: '/platform/system/health',
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

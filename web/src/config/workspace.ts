import type { PermissionCode } from '../types/api'
import type { WorkspaceNavEntry } from '../types/workspace'

export type WorkspaceDomain = 'platform' | 'org'

export type WorkspaceSectionKey =
  | 'platform-core'
  | 'platform-system'
  | 'org-monitor'
  | 'org-admin'
  | 'org-business'
  | 'workspace'

export interface WorkspaceDefinition {
  key: string
  routeName: string
  path: string
  label: string
  subtitle: string
  badge: string
  section: WorkspaceSectionKey
  domain?: WorkspaceDomain
  permissions?: PermissionCode[]
  menu: boolean
  parentKey?: string
}

export interface WorkspaceAccessContext {
  workspaceDomain: string
  permissions: PermissionCode[]
}

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

export const workspaceSectionLabels: Record<WorkspaceSectionKey, string> = {
  'platform-core': '平台治理',
  'platform-system': '平台系统',
  'org-monitor': '企业总览',
  'org-admin': '组织与资料',
  'org-business': '业务模块',
  workspace: '账户与安全',
}

export const workspaceSectionOrder: Record<WorkspaceDomain, WorkspaceSectionKey[]> = {
  platform: ['platform-core', 'platform-system'],
  org: ['org-monitor', 'org-admin', 'org-business'],
}

export const workspaceDefinitions: WorkspaceDefinition[] = [
  {
    key: 'auth-session',
    routeName: 'auth-status',
    path: '/account/session',
    label: '会话状态',
    subtitle: '登录状态、访问范围与能力概览',
    badge: '鉴',
    section: 'workspace',
    menu: false,
  },
  {
    key: 'enterprises',
    routeName: 'enterprise-management',
    path: '/platform/enterprises',
    label: '企业',
    subtitle: '平台级企业元数据、状态与资料维护',
    badge: '企',
    section: 'platform-core',
    domain: 'platform',
    permissions: ENTERPRISE_PERMISSIONS,
    menu: true,
  },
  {
    key: 'enterprise-admins',
    routeName: 'enterprise-admin-management',
    path: '/platform/enterprise-admins',
    label: '企业管理员',
    subtitle: '企业管理员账号、归属企业与启停管理',
    badge: '管',
    section: 'platform-core',
    domain: 'platform',
    permissions: USER_PERMISSIONS,
    menu: true,
  },
  {
    key: 'internal-users',
    routeName: 'platform-internal-user-management',
    path: '/platform/internal-users',
    label: '平台内部账号',
    subtitle: '平台角色账号、密码、启停与角色分配',
    badge: '内',
    section: 'platform-core',
    domain: 'platform',
    permissions: USER_PERMISSIONS,
    menu: true,
  },
  {
    key: 'rules',
    routeName: 'rules-management',
    path: '/platform/rules',
    label: '规则管理',
    subtitle: '平台规则配置、发布与回滚',
    badge: '规',
    section: 'platform-core',
    domain: 'platform',
    permissions: RULE_PERMISSIONS,
    menu: true,
  },
  {
    key: 'audit',
    routeName: 'audit-logs',
    path: '/platform/audit',
    label: '审计日志',
    subtitle: '平台审计列表、详情与导出',
    badge: '审',
    section: 'platform-core',
    domain: 'platform',
    permissions: AUDIT_PERMISSIONS,
    menu: true,
  },
  {
    key: 'health',
    routeName: 'system-health',
    path: '/platform/system/health',
    label: '系统健康',
    subtitle: '健康概览与平台运行状态',
    badge: '康',
    section: 'platform-system',
    domain: 'platform',
    permissions: SYSTEM_PERMISSIONS,
    menu: true,
  },
  {
    key: 'services',
    routeName: 'service-status',
    path: '/platform/system/services',
    label: '服务状态',
    subtitle: '服务探测状态与最近检查时间',
    badge: '服',
    section: 'platform-system',
    domain: 'platform',
    permissions: SYSTEM_PERMISSIONS,
    menu: true,
  },
  {
    key: 'version',
    routeName: 'version-info',
    path: '/platform/system/version',
    label: '版本信息',
    subtitle: '应用版本、构建时间与提交号',
    badge: '版',
    section: 'platform-system',
    domain: 'platform',
    permissions: SYSTEM_PERMISSIONS,
    menu: true,
  },
  {
    key: 'overview',
    routeName: 'realtime-overview',
    path: '/org/overview',
    label: '总览',
    subtitle: '企业风险态势、连接状态与风险概览',
    badge: '览',
    section: 'org-monitor',
    domain: 'org',
    permissions: OVERVIEW_PERMISSIONS,
    menu: true,
  },
  {
    key: 'alerts',
    routeName: 'alerts-list',
    path: '/org/alerts',
    label: '告警',
    subtitle: '告警筛选、详情查看与处置',
    badge: '警',
    section: 'org-monitor',
    domain: 'org',
    permissions: ALERT_PERMISSIONS,
    menu: true,
  },
  {
    key: 'alert-detail',
    routeName: 'alert-detail',
    path: '/org/alerts/:id',
    label: '告警详情',
    subtitle: '单条告警上下文、处置轨迹与关联实体信息',
    badge: '详',
    section: 'org-monitor',
    domain: 'org',
    permissions: ALERT_PERMISSIONS,
    menu: false,
    parentKey: 'alerts',
  },
  {
    key: 'trend',
    routeName: 'trend-analysis',
    path: '/org/stats/trend',
    label: '趋势分析',
    subtitle: '趋势洞察与波动分析',
    badge: '势',
    section: 'org-monitor',
    domain: 'org',
    permissions: STATS_PERMISSIONS,
    menu: true,
  },
  {
    key: 'ranking',
    routeName: 'risk-ranking',
    path: '/org/stats/ranking',
    label: '风险排行',
    subtitle: '车辆与司机风险排行',
    badge: '排',
    section: 'org-monitor',
    domain: 'org',
    permissions: STATS_PERMISSIONS,
    menu: true,
  },
  {
    key: 'users',
    routeName: 'org-user-management',
    path: '/org/users',
    label: '普通用户',
    subtitle: '本企业普通用户账号、角色与状态管理',
    badge: '户',
    section: 'org-admin',
    domain: 'org',
    permissions: USER_PERMISSIONS,
    menu: true,
  },
  {
    key: 'org-audit',
    routeName: 'org-audit-logs',
    path: '/org/audit',
    label: '企业审计',
    subtitle: '当前企业范围内的管理与业务操作记录',
    badge: '审',
    section: 'org-admin',
    domain: 'org',
    permissions: AUDIT_PERMISSIONS,
    menu: true,
  },
  {
    key: 'enterprise-profile',
    routeName: 'org-enterprise-profile',
    path: '/org/enterprise-profile',
    label: '我的企业',
    subtitle: '企业资料与激活码查看',
    badge: '企',
    section: 'org-admin',
    domain: 'org',
    permissions: ENTERPRISE_PERMISSIONS,
    menu: true,
  },
  {
    key: 'fleets',
    routeName: 'fleet-management',
    path: '/org/fleets',
    label: '车队',
    subtitle: '车队状态、归属与资源规模',
    badge: '队',
    section: 'org-business',
    domain: 'org',
    permissions: FLEET_PERMISSIONS,
    menu: true,
  },
  {
    key: 'drivers',
    routeName: 'driver-management',
    path: '/org/drivers',
    label: '驾驶员',
    subtitle: '驾驶员主数据、归属与 PIN 管理',
    badge: '司',
    section: 'org-business',
    domain: 'org',
    permissions: DRIVER_PERMISSIONS,
    menu: true,
  },
  {
    key: 'vehicles',
    routeName: 'vehicle-management',
    path: '/org/vehicles',
    label: '车辆',
    subtitle: '车辆主数据与设备绑定状态',
    badge: '车',
    section: 'org-business',
    domain: 'org',
    permissions: VEHICLE_PERMISSIONS,
    menu: true,
  },
  {
    key: 'devices',
    routeName: 'device-management',
    path: '/org/devices',
    label: '设备',
    subtitle: '设备台账、归属信息与车辆分配',
    badge: '设',
    section: 'org-business',
    domain: 'org',
    permissions: DEVICE_PERMISSIONS,
    menu: true,
  },
  {
    key: 'device-detail',
    routeName: 'device-detail',
    path: '/org/devices/:id',
    label: '设备详情',
    subtitle: '设备档案、绑定状态与关联车辆信息',
    badge: '详',
    section: 'org-business',
    domain: 'org',
    permissions: DEVICE_PERMISSIONS,
    menu: false,
    parentKey: 'devices',
  },
  {
    key: 'sessions',
    routeName: 'session-management',
    path: '/org/sessions',
    label: '会话',
    subtitle: '驾驶会话、最近心跳与强制签退',
    badge: '会',
    section: 'org-business',
    domain: 'org',
    permissions: SESSION_PERMISSIONS,
    menu: true,
  },
]

export const workspaceDefinitionMap = new Map(
  workspaceDefinitions.map((item) => [item.key, item] as const),
)

export const workspaceRouteNameMap = new Map(
  workspaceDefinitions.map((item) => [item.routeName, item] as const),
)

export function canAccessWorkspaceDefinition(
  item: WorkspaceDefinition,
  context: WorkspaceAccessContext,
): boolean {
  if (item.domain && item.domain !== context.workspaceDomain) {
    return false
  }

  if (!item.permissions?.length) {
    return true
  }

  return item.permissions.some((permission) => context.permissions.includes(permission))
}

export function toWorkspaceNavEntry(item: WorkspaceDefinition): WorkspaceNavEntry {
  return {
    key: item.key,
    badge: item.badge,
    section: item.section,
    label: item.label,
    subtitle: item.subtitle,
    path: item.path,
  }
}

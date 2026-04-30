import type {
  BusinessRole,
  DefaultScope,
  PermissionCode,
  PlatformRole,
  ScopeMembership,
  ScopeType,
  UserRole,
} from '../types/api'

export const PLATFORM_ROLES: PlatformRole[] = [
  'PLATFORM_SUPER_ADMIN',
  'PLATFORM_SYS_ADMIN',
  'PLATFORM_RISK_ADMIN',
]

export const BUSINESS_ROLES: BusinessRole[] = [
  'ORG_ADMIN',
  'ORG_OPERATOR',
  'ORG_ANALYST',
  'ORG_VIEWER',
]

export const ALL_USER_ROLES: UserRole[] = [
  ...PLATFORM_ROLES,
  ...BUSINESS_ROLES,
]

export const ROLE_PRIORITY: UserRole[] = [
  'PLATFORM_SUPER_ADMIN',
  'ORG_ADMIN',
  'PLATFORM_SYS_ADMIN',
  'PLATFORM_RISK_ADMIN',
  'ORG_OPERATOR',
  'ORG_ANALYST',
  'ORG_VIEWER',
]

export const ALL_PERMISSIONS: PermissionCode[] = [
  'overview.read',
  'alert.read',
  'alert.handle',
  'stats.read',
  'rule.read',
  'rule.manage',
  'audit.read',
  'audit.export',
  'system.read',
  'user.read',
  'user.manage',
  'enterprise.read',
  'enterprise.manage',
  'activation_code.read',
  'activation_code.manage',
  'fleet.read',
  'fleet.manage',
  'driver.read',
  'driver.manage',
  'vehicle.read',
  'vehicle.manage',
  'device.read',
  'device.manage',
  'session.read',
  'session.force_sign_out',
]

export const roleLabelMap: Record<UserRole, string> = {
  PLATFORM_SUPER_ADMIN: '平台超级管理员',
  PLATFORM_SYS_ADMIN: '平台系统管理员',
  PLATFORM_RISK_ADMIN: '平台风控管理员',
  ORG_ADMIN: '业务管理员',
  ORG_OPERATOR: '运营处理人员',
  ORG_ANALYST: '分析查看人员',
  ORG_VIEWER: '只读观察人员',
}

export const roleDescriptionMap: Record<UserRole, string> = {
  PLATFORM_SUPER_ADMIN: '跨企业治理与紧急兜底，可覆盖全部平台与业务权限。',
  PLATFORM_SYS_ADMIN: '负责系统健康、服务状态、版本信息与审计导出。',
  PLATFORM_RISK_ADMIN: '负责规则治理，并可观察告警与统计效果。',
  ORG_ADMIN: '负责企业范围内的用户、车队、司机、车辆、设备与会话管理。',
  ORG_OPERATOR: '负责告警处置、实时值守与会话巡检。',
  ORG_ANALYST: '负责趋势、排行与风险复盘分析，默认只读。',
  ORG_VIEWER: '仅可查看总览和基础告警信息。',
}

export const scopeTypeLabelMap: Record<ScopeType, string> = {
  PLATFORM: '平台级',
  ENTERPRISE: '企业级',
  FLEET: '车队级',
}

export const permissionLabelMap: Record<PermissionCode, string> = {
  'overview.read': '风险总览读取',
  'alert.read': '告警读取',
  'alert.handle': '告警处置',
  'stats.read': '统计分析读取',
  'rule.read': '规则读取',
  'rule.manage': '规则管理',
  'audit.read': '审计读取',
  'audit.export': '审计导出',
  'system.read': '系统信息读取',
  'user.read': '用户读取',
  'user.manage': '用户管理',
  'enterprise.read': '企业读取',
  'enterprise.manage': '企业管理',
  'activation_code.read': '激活码读取',
  'activation_code.manage': '激活码管理',
  'fleet.read': '车队读取',
  'fleet.manage': '车队管理',
  'driver.read': '司机读取',
  'driver.manage': '司机管理',
  'vehicle.read': '车辆读取',
  'vehicle.manage': '车辆管理',
  'device.read': '设备读取',
  'device.manage': '设备管理',
  'session.read': '会话读取',
  'session.force_sign_out': '强制签退',
}

const ROLE_PERMISSION_MAP: Record<UserRole, PermissionCode[]> = {
  PLATFORM_SUPER_ADMIN: [...ALL_PERMISSIONS],
  PLATFORM_SYS_ADMIN: ['audit.read', 'audit.export', 'system.read'],
  PLATFORM_RISK_ADMIN: ['rule.read', 'rule.manage', 'overview.read', 'alert.read', 'stats.read'],
  ORG_ADMIN: [
    'overview.read',
    'alert.read',
    'stats.read',
    'user.read',
    'user.manage',
    'enterprise.read',
    'activation_code.read',
    'activation_code.manage',
    'fleet.read',
    'fleet.manage',
    'driver.read',
    'driver.manage',
    'vehicle.read',
    'vehicle.manage',
    'device.read',
    'device.manage',
    'session.read',
    'session.force_sign_out',
  ],
  ORG_OPERATOR: [
    'overview.read',
    'alert.read',
    'alert.handle',
    'stats.read',
    'fleet.read',
    'driver.read',
    'vehicle.read',
    'device.read',
    'session.read',
  ],
  ORG_ANALYST: [
    'overview.read',
    'alert.read',
    'stats.read',
    'fleet.read',
    'driver.read',
    'vehicle.read',
    'device.read',
    'session.read',
  ],
  ORG_VIEWER: ['overview.read', 'alert.read'],
}

function isPresentId(value: unknown): value is number | string {
  return value !== null && value !== undefined && value !== ''
}

function sortRoles(roles: UserRole[]): UserRole[] {
  return [...roles].sort((left, right) => {
    const leftIndex = ROLE_PRIORITY.indexOf(left)
    const rightIndex = ROLE_PRIORITY.indexOf(right)

    if (leftIndex === -1 && rightIndex === -1) {
      return left.localeCompare(right)
    }

    if (leftIndex === -1) {
      return 1
    }

    if (rightIndex === -1) {
      return -1
    }

    return leftIndex - rightIndex
  })
}

export function isUserRole(value: string): value is UserRole {
  return ALL_USER_ROLES.includes(value as UserRole)
}

export function isPlatformRole(value: string): value is PlatformRole {
  return PLATFORM_ROLES.includes(value as PlatformRole)
}

export function isBusinessRole(value: string): value is BusinessRole {
  return BUSINESS_ROLES.includes(value as BusinessRole)
}

export function isPermissionCode(value: string): value is PermissionCode {
  return ALL_PERMISSIONS.includes(value as PermissionCode)
}

export function isScopeType(value: string): value is ScopeType {
  return value === 'PLATFORM' || value === 'ENTERPRISE' || value === 'FLEET'
}

export function normalizeUserRoleList(values?: readonly string[] | null): UserRole[] {
  if (!Array.isArray(values)) {
    return []
  }

  return sortRoles([...new Set(values.filter((value): value is UserRole => isUserRole(value)))])
}

export function normalizePlatformRoleList(values?: readonly string[] | null): PlatformRole[] {
  if (!Array.isArray(values)) {
    return []
  }

  return [...new Set(values.filter((value): value is PlatformRole => isPlatformRole(value)))]
}

export function normalizePermissionList(values?: readonly string[] | null): PermissionCode[] {
  if (!Array.isArray(values)) {
    return []
  }

  return [...new Set(values.filter((value): value is PermissionCode => isPermissionCode(value)))]
}

export function normalizeScopeMembershipList(
  values?: readonly (Partial<ScopeMembership> | null | undefined)[] | null,
): ScopeMembership[] {
  if (!Array.isArray(values)) {
    return []
  }

  const memberships: ScopeMembership[] = []

  for (const item of values) {
    if (!item?.role || !item.scopeType || !isUserRole(item.role) || !isScopeType(item.scopeType)) {
      continue
    }

    memberships.push({
      role: item.role,
      scopeType: item.scopeType,
      enterpriseId: item.enterpriseId ?? null,
      fleetId: item.fleetId ?? null,
    })
  }

  return memberships
}

export function normalizeDefaultScope(value?: Partial<DefaultScope> | null): DefaultScope | null {
  if (!value?.scopeType || !isScopeType(value.scopeType)) {
    return null
  }

  return {
    scopeType: value.scopeType,
    enterpriseId: value.enterpriseId ?? null,
    fleetId: value.fleetId ?? null,
  }
}

export function derivePlatformRoles(rawRoles: readonly UserRole[]): PlatformRole[] {
  return [...new Set(rawRoles.filter((role): role is PlatformRole => isPlatformRole(role)))]
}

export function deriveMemberships(
  rawRoles: readonly UserRole[],
  enterpriseId?: number | string | null,
): ScopeMembership[] {
  if (!isPresentId(enterpriseId)) {
    return []
  }

  const seen = new Set<string>()
  const memberships: ScopeMembership[] = []

  for (const role of rawRoles) {
    if (!isBusinessRole(role)) {
      continue
    }

    const key = `${role}:ENTERPRISE:${String(enterpriseId)}`

    if (seen.has(key)) {
      continue
    }

    seen.add(key)
    memberships.push({
      role,
      scopeType: 'ENTERPRISE',
      enterpriseId,
      fleetId: null,
    })
  }

  return memberships
}

export function buildEffectiveRoles(
  rawRoles: readonly UserRole[],
  platformRoles: readonly PlatformRole[],
  memberships: readonly ScopeMembership[],
  enterpriseId?: number | string | null,
): UserRole[] {
  const derivedPlatformRoles = derivePlatformRoles(rawRoles)
  const derivedMemberships = deriveMemberships(rawRoles, enterpriseId)
  const normalizedPlatformRoles = [...new Set([...platformRoles, ...derivedPlatformRoles])]
  const normalizedMemberships = normalizeScopeMembershipList([...memberships, ...derivedMemberships])

  return sortRoles(
    [...new Set([...rawRoles, ...normalizedPlatformRoles, ...normalizedMemberships.map((item) => item.role)])],
  )
}

export function buildDisplayRoles(
  rawRoles: readonly UserRole[],
  platformRoles: readonly PlatformRole[],
  memberships: readonly ScopeMembership[],
): UserRole[] {
  const structuredRoles = [...platformRoles, ...memberships.map((item) => item.role)]

  if (structuredRoles.length) {
    return sortRoles([...new Set(structuredRoles)])
  }

  return sortRoles([...new Set(rawRoles)])
}

export function resolvePermissionsFromRoles(roles: readonly UserRole[]): PermissionCode[] {
  if (roles.includes('PLATFORM_SUPER_ADMIN')) {
    return [...ALL_PERMISSIONS]
  }

  const permissions = new Set<PermissionCode>()

  for (const role of roles) {
    for (const permission of ROLE_PERMISSION_MAP[role] || []) {
      permissions.add(permission)
    }
  }

  return [...permissions]
}

export function getRolePermissions(role: UserRole): PermissionCode[] {
  return [...(ROLE_PERMISSION_MAP[role] || [])]
}

export function resolveDefaultScope(
  explicitScope: DefaultScope | null,
  platformRoles: readonly PlatformRole[],
  memberships: readonly ScopeMembership[],
  enterpriseId?: number | string | null,
): DefaultScope | null {
  if (explicitScope) {
    return explicitScope
  }

  const firstMembership = memberships[0]

  if (firstMembership) {
    return {
      scopeType: firstMembership.scopeType,
      enterpriseId: firstMembership.enterpriseId ?? null,
      fleetId: firstMembership.fleetId ?? null,
    }
  }

  if (platformRoles.length) {
    return {
      scopeType: 'PLATFORM',
      enterpriseId: null,
      fleetId: null,
    }
  }

  if (isPresentId(enterpriseId)) {
    return {
      scopeType: 'ENTERPRISE',
      enterpriseId,
      fleetId: null,
    }
  }

  return null
}

export function formatRoleLabel(role: UserRole): string {
  return roleLabelMap[role] || role
}

export function formatScopeLabel(scope?: Partial<DefaultScope> | null): string {
  if (!scope?.scopeType || !isScopeType(scope.scopeType)) {
    return '-'
  }

  if (scope.scopeType === 'PLATFORM') {
    return scopeTypeLabelMap.PLATFORM
  }

  if (scope.scopeType === 'ENTERPRISE') {
    return `${scopeTypeLabelMap.ENTERPRISE} · 企业 ${scope.enterpriseId ?? '-'}`
  }

  return `${scopeTypeLabelMap.FLEET} · 企业 ${scope.enterpriseId ?? '-'} / 车队 ${scope.fleetId ?? '-'}`
}

export function getRoleTagType(role: UserRole): '' | 'success' | 'warning' | 'info' | 'primary' | 'danger' {
  if (role === 'PLATFORM_SUPER_ADMIN') {
    return 'danger'
  }

  if (role === 'PLATFORM_SYS_ADMIN') {
    return 'warning'
  }

  if (role === 'PLATFORM_RISK_ADMIN') {
    return 'success'
  }

  if (role === 'ORG_OPERATOR') {
    return 'primary'
  }

  if (role === 'ORG_ADMIN') {
    return 'warning'
  }

  return 'info'
}

export function requiresEnterpriseForRoles(roles: readonly UserRole[]): boolean {
  return roles.some(
    (role) =>
      role === 'ORG_ADMIN' ||
      role === 'ORG_OPERATOR' ||
      role === 'ORG_ANALYST' ||
      role === 'ORG_VIEWER',
  )
}

export function getRoleScopeHint(role: UserRole): string {
  if (requiresEnterpriseForRoles([role])) {
    return '默认按企业或车队作用域生效，需要业务归属。'
  }

  return '默认按平台作用域生效，可不绑定企业。'
}

export function getRoleTypeLabel(role: UserRole): string {
  if (isPlatformRole(role)) {
    return '平台角色'
  }

  return '业务角色'
}

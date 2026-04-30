import type {
  BusinessRole,
  DefaultScope,
  LegacyUserRole,
  PermissionCode,
  PlatformRole,
  ScopeMembership,
  ScopeType,
  UserRole,
} from '../types/api'

const LEGACY_TO_PLATFORM_ROLE_MAP: Partial<Record<LegacyUserRole, PlatformRole>> = {
  SUPER_ADMIN: 'PLATFORM_SUPER_ADMIN',
  SYS_ADMIN: 'PLATFORM_SYS_ADMIN',
  RISK_ADMIN: 'PLATFORM_RISK_ADMIN',
}

const LEGACY_TO_BUSINESS_ROLE_MAP: Partial<Record<LegacyUserRole, BusinessRole>> = {
  ENTERPRISE_ADMIN: 'ORG_ADMIN',
  OPERATOR: 'ORG_OPERATOR',
  ANALYST: 'ORG_ANALYST',
  VIEWER: 'ORG_VIEWER',
}

const STRUCTURED_TO_LEGACY_ROLE_MAP: Record<PlatformRole | BusinessRole, LegacyUserRole> = {
  PLATFORM_SUPER_ADMIN: 'SUPER_ADMIN',
  PLATFORM_SYS_ADMIN: 'SYS_ADMIN',
  PLATFORM_RISK_ADMIN: 'RISK_ADMIN',
  ORG_ADMIN: 'ENTERPRISE_ADMIN',
  ORG_OPERATOR: 'OPERATOR',
  ORG_ANALYST: 'ANALYST',
  ORG_VIEWER: 'VIEWER',
}

export const LEGACY_USER_ROLES: LegacyUserRole[] = [
  'SUPER_ADMIN',
  'ENTERPRISE_ADMIN',
  'SYS_ADMIN',
  'RISK_ADMIN',
  'OPERATOR',
  'ANALYST',
  'VIEWER',
]

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
  ...LEGACY_USER_ROLES,
]

export const ROLE_PRIORITY: UserRole[] = [
  'PLATFORM_SUPER_ADMIN',
  'SUPER_ADMIN',
  'ORG_ADMIN',
  'ENTERPRISE_ADMIN',
  'PLATFORM_SYS_ADMIN',
  'SYS_ADMIN',
  'PLATFORM_RISK_ADMIN',
  'RISK_ADMIN',
  'ORG_OPERATOR',
  'OPERATOR',
  'ORG_ANALYST',
  'ANALYST',
  'ORG_VIEWER',
  'VIEWER',
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
  SUPER_ADMIN: '超级管理员',
  ENTERPRISE_ADMIN: '企业管理员',
  SYS_ADMIN: '系统管理员',
  RISK_ADMIN: '风控管理员',
  OPERATOR: '运营人员',
  ANALYST: '分析人员',
  VIEWER: '访客',
}

export const roleDescriptionMap: Record<UserRole, string> = {
  PLATFORM_SUPER_ADMIN: '跨企业治理与紧急兜底，可覆盖全部平台与业务权限。',
  PLATFORM_SYS_ADMIN: '负责系统健康、服务状态、版本信息与审计导出。',
  PLATFORM_RISK_ADMIN: '负责规则治理，并可观察告警与统计效果。',
  ORG_ADMIN: '负责企业范围内的用户、车队、司机、车辆、设备与会话管理。',
  ORG_OPERATOR: '负责告警处置、实时值守与会话巡检。',
  ORG_ANALYST: '负责趋势、排行与风险复盘分析，默认只读。',
  ORG_VIEWER: '仅可查看总览和基础告警信息。',
  SUPER_ADMIN: '旧版超级管理员，兼容映射到 PLATFORM_SUPER_ADMIN@PLATFORM。',
  ENTERPRISE_ADMIN: '旧版企业管理员，兼容映射到 ORG_ADMIN@ENTERPRISE。',
  SYS_ADMIN: '旧版系统管理员，兼容映射到 PLATFORM_SYS_ADMIN@PLATFORM。',
  RISK_ADMIN: '旧版风控管理员，兼容映射到 PLATFORM_RISK_ADMIN@PLATFORM。',
  OPERATOR: '旧版运营人员，兼容映射到 ORG_OPERATOR@ENTERPRISE。',
  ANALYST: '旧版分析人员，兼容映射到 ORG_ANALYST@ENTERPRISE。',
  VIEWER: '旧版访客，兼容映射到 ORG_VIEWER@ENTERPRISE。',
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
  SUPER_ADMIN: [...ALL_PERMISSIONS],
  ENTERPRISE_ADMIN: [
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
  SYS_ADMIN: ['audit.read', 'audit.export', 'system.read'],
  RISK_ADMIN: ['rule.read', 'rule.manage', 'overview.read', 'alert.read', 'stats.read'],
  OPERATOR: [
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
  ANALYST: [
    'overview.read',
    'alert.read',
    'stats.read',
    'fleet.read',
    'driver.read',
    'vehicle.read',
    'device.read',
    'session.read',
  ],
  VIEWER: ['overview.read', 'alert.read'],
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
  const resolved = new Set<PlatformRole>()

  for (const role of rawRoles) {
    if (isPlatformRole(role)) {
      resolved.add(role)
      continue
    }

    const mappedRole = LEGACY_TO_PLATFORM_ROLE_MAP[role as LegacyUserRole]

    if (mappedRole) {
      resolved.add(mappedRole)
    }
  }

  return [...resolved]
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
    const mappedRole = BUSINESS_ROLES.includes(role as BusinessRole)
      ? (role as BusinessRole)
      : LEGACY_TO_BUSINESS_ROLE_MAP[role as LegacyUserRole]

    if (!mappedRole) {
      continue
    }

    const key = `${mappedRole}:ENTERPRISE:${String(enterpriseId)}`

    if (seen.has(key)) {
      continue
    }

    seen.add(key)
    memberships.push({
      role: mappedRole,
      scopeType: 'ENTERPRISE',
      enterpriseId,
      fleetId: null,
    })
  }

  return memberships
}

export function deriveLegacyRoles(
  platformRoles: readonly PlatformRole[],
  memberships: readonly ScopeMembership[],
): LegacyUserRole[] {
  const resolved = new Set<LegacyUserRole>()

  for (const role of platformRoles) {
    resolved.add(STRUCTURED_TO_LEGACY_ROLE_MAP[role])
  }

  for (const membership of memberships) {
    const mappedRole = STRUCTURED_TO_LEGACY_ROLE_MAP[membership.role as PlatformRole | BusinessRole]

    if (mappedRole) {
      resolved.add(mappedRole)
    }
  }

  return [...resolved]
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
  const derivedLegacyRoles = deriveLegacyRoles(normalizedPlatformRoles, normalizedMemberships)

  return sortRoles(
    [...new Set([...rawRoles, ...normalizedPlatformRoles, ...normalizedMemberships.map((item) => item.role), ...derivedLegacyRoles])],
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
  if (roles.includes('SUPER_ADMIN') || roles.includes('PLATFORM_SUPER_ADMIN')) {
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
  if (role === 'PLATFORM_SUPER_ADMIN' || role === 'SUPER_ADMIN') {
    return 'danger'
  }

  if (role === 'PLATFORM_SYS_ADMIN' || role === 'SYS_ADMIN') {
    return 'warning'
  }

  if (role === 'PLATFORM_RISK_ADMIN' || role === 'RISK_ADMIN') {
    return 'success'
  }

  if (role === 'ORG_OPERATOR' || role === 'OPERATOR') {
    return 'primary'
  }

  if (role === 'ORG_ADMIN' || role === 'ENTERPRISE_ADMIN') {
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
      role === 'ORG_VIEWER' ||
      role === 'ENTERPRISE_ADMIN' ||
      role === 'OPERATOR' ||
      role === 'ANALYST' ||
      role === 'VIEWER',
  )
}

import type { UserRole } from '../types/api'

export interface AccessContext {
  roles: UserRole[]
}

export interface CapabilityMap {
  canViewUsers: boolean
  canCreateUser: boolean
  canEditUser: boolean
  canAssignUserRoles: boolean
  canResetUserPassword: boolean
  canToggleUserStatus: boolean
  canViewBusinessDomains: boolean
  canViewFleets: boolean
  canManageFleets: boolean
  canViewDrivers: boolean
  canManageDrivers: boolean
  canViewVehicles: boolean
  canManageVehicles: boolean
  canViewDevices: boolean
  canManageDevices: boolean
  canViewSessions: boolean
  canManageSessions: boolean
  canViewEnterprises: boolean
  canManageEnterprises: boolean
  canEditEnterprise: boolean
  canViewSystemAudit: boolean
  canExportSystemAudit: boolean
  canViewSystemHealth: boolean
  canViewServiceStatus: boolean
  canViewVersionInfo: boolean
}

function hasRole(roles: UserRole[], targets: UserRole[]): boolean {
  return targets.some((role) => roles.includes(role))
}

export function resolveCapabilities(context: AccessContext): CapabilityMap {
  const { roles } = context
  const isSuperAdmin = roles.includes('SUPER_ADMIN')
  const isEnterpriseAdmin = roles.includes('ENTERPRISE_ADMIN')
  const isSystemAdmin = roles.includes('SYS_ADMIN')
  const canReadBusinessDomain = hasRole(roles, ['SUPER_ADMIN', 'ENTERPRISE_ADMIN', 'OPERATOR'])

  return {
    canViewUsers: isSuperAdmin || isEnterpriseAdmin,
    canCreateUser: isSuperAdmin || isEnterpriseAdmin,
    canEditUser: isSuperAdmin || isEnterpriseAdmin,
    canAssignUserRoles: isSuperAdmin || isEnterpriseAdmin,
    canResetUserPassword: isSuperAdmin || isEnterpriseAdmin,
    canToggleUserStatus: isSuperAdmin || isEnterpriseAdmin,
    canViewBusinessDomains: canReadBusinessDomain,
    canViewFleets: canReadBusinessDomain,
    canManageFleets: isSuperAdmin || isEnterpriseAdmin,
    canViewDrivers: canReadBusinessDomain,
    canManageDrivers: isSuperAdmin || isEnterpriseAdmin,
    canViewVehicles: canReadBusinessDomain,
    canManageVehicles: isSuperAdmin || isEnterpriseAdmin,
    canViewDevices: canReadBusinessDomain,
    canManageDevices: isSuperAdmin || isEnterpriseAdmin,
    canViewSessions: canReadBusinessDomain,
    canManageSessions: isSuperAdmin || isEnterpriseAdmin,
    canViewEnterprises: canReadBusinessDomain,
    canManageEnterprises: isSuperAdmin,
    canEditEnterprise: isSuperAdmin,
    canViewSystemAudit: isSuperAdmin || isSystemAdmin,
    canExportSystemAudit: isSuperAdmin || isSystemAdmin,
    canViewSystemHealth: hasRole(roles, ['SUPER_ADMIN', 'SYS_ADMIN']),
    canViewServiceStatus: hasRole(roles, ['SUPER_ADMIN', 'SYS_ADMIN']),
    canViewVersionInfo: hasRole(roles, ['SUPER_ADMIN', 'SYS_ADMIN']),
  }
}

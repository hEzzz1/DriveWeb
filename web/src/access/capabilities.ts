import type { PermissionCode } from '../types/api'

export interface AccessContext {
  permissions: PermissionCode[]
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
  canViewDeviceApprovals: boolean
  canManageDeviceApprovals: boolean
  canViewSessions: boolean
  canManageSessions: boolean
  canViewEnterprises: boolean
  canManageEnterprises: boolean
  canEditEnterprise: boolean
  canViewEnterpriseActivationCodes: boolean
  canManageEnterpriseActivationCodes: boolean
  canViewSystemAudit: boolean
  canExportSystemAudit: boolean
  canViewSystemHealth: boolean
  canViewServiceStatus: boolean
  canViewVersionInfo: boolean
}

function hasPermission(permissions: PermissionCode[], targets: PermissionCode[]): boolean {
  return targets.some((permission) => permissions.includes(permission))
}

export function resolveCapabilities(context: AccessContext): CapabilityMap {
  const { permissions } = context
  const canReadBusinessDomain = hasPermission(permissions, [
    'fleet.read',
    'driver.read',
    'vehicle.read',
    'device.read',
    'session.read',
  ])

  return {
    canViewUsers: hasPermission(permissions, ['user.read']),
    canCreateUser: hasPermission(permissions, ['user.manage']),
    canEditUser: hasPermission(permissions, ['user.manage']),
    canAssignUserRoles: hasPermission(permissions, ['user.manage']),
    canResetUserPassword: hasPermission(permissions, ['user.manage']),
    canToggleUserStatus: hasPermission(permissions, ['user.manage']),
    canViewBusinessDomains: canReadBusinessDomain,
    canViewFleets: hasPermission(permissions, ['fleet.read']),
    canManageFleets: hasPermission(permissions, ['fleet.manage']),
    canViewDrivers: hasPermission(permissions, ['driver.read']),
    canManageDrivers: hasPermission(permissions, ['driver.manage']),
    canViewVehicles: hasPermission(permissions, ['vehicle.read']),
    canManageVehicles: hasPermission(permissions, ['vehicle.manage']),
    canViewDevices: hasPermission(permissions, ['device.read']),
    canManageDevices: hasPermission(permissions, ['device.manage']),
    canViewDeviceApprovals: hasPermission(permissions, ['activation_code.read']),
    canManageDeviceApprovals: hasPermission(permissions, ['activation_code.manage']),
    canViewSessions: hasPermission(permissions, ['session.read']),
    canManageSessions: hasPermission(permissions, ['session.force_sign_out']),
    canViewEnterprises: hasPermission(permissions, ['enterprise.read']),
    canManageEnterprises: hasPermission(permissions, ['enterprise.manage']),
    canEditEnterprise: hasPermission(permissions, ['enterprise.manage']),
    canViewEnterpriseActivationCodes: hasPermission(permissions, ['activation_code.read']),
    canManageEnterpriseActivationCodes: hasPermission(permissions, ['activation_code.manage']),
    canViewSystemAudit: hasPermission(permissions, ['audit.read']),
    canExportSystemAudit: hasPermission(permissions, ['audit.export']),
    canViewSystemHealth: hasPermission(permissions, ['system.read']),
    canViewServiceStatus: hasPermission(permissions, ['system.read']),
    canViewVersionInfo: hasPermission(permissions, ['system.read']),
  }
}

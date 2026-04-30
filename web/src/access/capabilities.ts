import type { PermissionCode } from '../types/api'
import type { WorkspaceDomain } from './auth-model'

export interface AccessContext {
  permissions: PermissionCode[]
  workspaceDomain: WorkspaceDomain
}

export interface CapabilityMap {
  workspaceDomain: WorkspaceDomain
  isPlatformDomain: boolean
  isOrgDomain: boolean
  canViewEnterprises: boolean
  canManageEnterprises: boolean
  canViewEnterpriseAdmins: boolean
  canManageEnterpriseAdmins: boolean
  canViewPlatformInternalUsers: boolean
  canManagePlatformInternalUsers: boolean
  canViewPlatformAudit: boolean
  canExportPlatformAudit: boolean
  canViewPlatformSystem: boolean
  canViewPlatformRules: boolean
  canManagePlatformRules: boolean
  canViewUsers: boolean
  canManageUsers: boolean
  canViewOverview: boolean
  canViewAlerts: boolean
  canHandleAlerts: boolean
  canViewStats: boolean
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
  canViewEnterpriseProfile: boolean
  canManageEnterpriseProfile: boolean
  canViewEnterpriseActivationCodes: boolean
  canManageEnterpriseActivationCodes: boolean
}

function hasPermission(permissions: PermissionCode[], targets: PermissionCode[]): boolean {
  return targets.some((permission) => permissions.includes(permission))
}

export function resolveCapabilities(context: AccessContext): CapabilityMap {
  const { permissions, workspaceDomain } = context
  const isPlatformDomain = workspaceDomain === 'platform'
  const isOrgDomain = workspaceDomain === 'org'

  return {
    workspaceDomain,
    isPlatformDomain,
    isOrgDomain,
    canViewEnterprises: isPlatformDomain && hasPermission(permissions, ['enterprise.read']),
    canManageEnterprises: isPlatformDomain && hasPermission(permissions, ['enterprise.manage']),
    canViewEnterpriseAdmins: isPlatformDomain && hasPermission(permissions, ['user.read']),
    canManageEnterpriseAdmins: isPlatformDomain && hasPermission(permissions, ['user.manage']),
    canViewPlatformInternalUsers: isPlatformDomain && hasPermission(permissions, ['user.read']),
    canManagePlatformInternalUsers: isPlatformDomain && hasPermission(permissions, ['user.manage']),
    canViewPlatformAudit: isPlatformDomain && hasPermission(permissions, ['audit.read']),
    canExportPlatformAudit: isPlatformDomain && hasPermission(permissions, ['audit.export']),
    canViewPlatformSystem: isPlatformDomain && hasPermission(permissions, ['system.read']),
    canViewPlatformRules: isPlatformDomain && hasPermission(permissions, ['rule.read']),
    canManagePlatformRules: isPlatformDomain && hasPermission(permissions, ['rule.manage']),
    canViewUsers: isOrgDomain && hasPermission(permissions, ['user.read']),
    canManageUsers: isOrgDomain && hasPermission(permissions, ['user.manage']),
    canViewOverview: isOrgDomain && hasPermission(permissions, ['overview.read']),
    canViewAlerts: isOrgDomain && hasPermission(permissions, ['alert.read']),
    canHandleAlerts: isOrgDomain && hasPermission(permissions, ['alert.handle']),
    canViewStats: isOrgDomain && hasPermission(permissions, ['stats.read']),
    canViewFleets: isOrgDomain && hasPermission(permissions, ['fleet.read']),
    canManageFleets: isOrgDomain && hasPermission(permissions, ['fleet.manage']),
    canViewDrivers: isOrgDomain && hasPermission(permissions, ['driver.read']),
    canManageDrivers: isOrgDomain && hasPermission(permissions, ['driver.manage']),
    canViewVehicles: isOrgDomain && hasPermission(permissions, ['vehicle.read']),
    canManageVehicles: isOrgDomain && hasPermission(permissions, ['vehicle.manage']),
    canViewDevices: isOrgDomain && hasPermission(permissions, ['device.read']),
    canManageDevices: isOrgDomain && hasPermission(permissions, ['device.manage']),
    canViewSessions: isOrgDomain && hasPermission(permissions, ['session.read']),
    canManageSessions: isOrgDomain && hasPermission(permissions, ['session.force_sign_out']),
    canViewEnterpriseProfile: isOrgDomain && hasPermission(permissions, ['enterprise.read']),
    canManageEnterpriseProfile: isOrgDomain && hasPermission(permissions, ['enterprise.manage']),
    canViewEnterpriseActivationCodes: isOrgDomain && hasPermission(permissions, ['activation_code.read']),
    canManageEnterpriseActivationCodes: isOrgDomain && hasPermission(permissions, ['activation_code.manage']),
  }
}

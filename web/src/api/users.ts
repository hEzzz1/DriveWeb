import { request } from './http'
import type {
  CreateUserPayload,
  ResetUserPasswordPayload,
  RoleOptionItem,
  UpdateUserProfilePayload,
  UpdateUserRolesPayload,
  UpdateUserStatusPayload,
  UserDetail,
  UserAuditListData,
  UserListData,
  UserListQuery,
} from '../types/users'

function getUserResourcePath(prefix: string, id?: number | string): string {
  return id === undefined ? prefix : `${prefix}/${id}`
}

function getUserRolesPath(prefix: string): string {
  return `${prefix}/roles`
}

function getUserAuditsPath(prefix: string, id: number | string): string {
  return `${prefix}/${id}/audits`
}

function createUserApi(prefix: string) {
  return {
    getList(params: UserListQuery): Promise<UserListData> {
      return request<UserListData>({
        url: prefix,
        method: 'GET',
        params,
      })
    },
    getDetail(id: number | string): Promise<UserDetail> {
      return request<UserDetail>({
        url: getUserResourcePath(prefix, id),
        method: 'GET',
      })
    },
    update(id: number | string, payload: UpdateUserProfilePayload): Promise<UserDetail> {
      return request<UserDetail>({
        url: getUserResourcePath(prefix, id),
        method: 'PUT',
        data: payload,
      })
    },
    updateRoles(id: number | string, payload: UpdateUserRolesPayload): Promise<UserDetail> {
      return request<UserDetail>({
        url: `${getUserResourcePath(prefix, id)}/roles`,
        method: 'PUT',
        data: payload,
      })
    },
    updateStatus(id: number | string, payload: UpdateUserStatusPayload): Promise<UserDetail> {
      return request<UserDetail>({
        url: `${getUserResourcePath(prefix, id)}/status`,
        method: 'PUT',
        data: payload,
      })
    },
    getRoleOptions(): Promise<RoleOptionItem[]> {
      return request<RoleOptionItem[]>({
        url: getUserRolesPath(prefix),
        method: 'GET',
      })
    },
    create(payload: CreateUserPayload): Promise<UserDetail> {
      return request<UserDetail>({
        url: prefix,
        method: 'POST',
        data: payload,
      })
    },
    resetPassword(id: number | string, payload: ResetUserPasswordPayload): Promise<UserDetail> {
      return request<UserDetail>({
        url: `${getUserResourcePath(prefix, id)}/reset-password`,
        method: 'POST',
        data: payload,
      })
    },
    getAudits(id: number | string, params: Pick<UserListQuery, 'page' | 'size'>): Promise<UserAuditListData> {
      return request<UserAuditListData>({
        url: getUserAuditsPath(prefix, id),
        method: 'GET',
        params,
      })
    },
  }
}

const legacyUsersApi = createUserApi('/users')
const platformEnterpriseAdminApi = createUserApi('/platform/enterprise-admins')
const orgUsersApi = createUserApi('/org/users')

export function getUserList(params: UserListQuery): Promise<UserListData> {
  return legacyUsersApi.getList(params)
}

export function getUserDetail(id: number | string): Promise<UserDetail> {
  return legacyUsersApi.getDetail(id)
}

export function updateUser(id: number | string, payload: UpdateUserProfilePayload): Promise<UserDetail> {
  return legacyUsersApi.update(id, payload)
}

export function updateUserRoles(
  id: number | string,
  payload: UpdateUserRolesPayload,
): Promise<UserDetail> {
  return legacyUsersApi.updateRoles(id, payload)
}

export function updateUserStatus(
  id: number | string,
  payload: UpdateUserStatusPayload,
): Promise<UserDetail> {
  return legacyUsersApi.updateStatus(id, payload)
}

export function getRoleOptions(): Promise<RoleOptionItem[]> {
  return legacyUsersApi.getRoleOptions()
}

export function createUser(payload: CreateUserPayload): Promise<UserDetail> {
  return legacyUsersApi.create(payload)
}

export function resetUserPassword(
  id: number | string,
  payload: ResetUserPasswordPayload,
): Promise<UserDetail> {
  return legacyUsersApi.resetPassword(id, payload)
}

export function getUserAudits(
  id: number | string,
  params: Pick<UserListQuery, 'page' | 'size'>,
): Promise<UserAuditListData> {
  return legacyUsersApi.getAudits(id, params)
}

export function getPlatformEnterpriseAdminList(params: UserListQuery): Promise<UserListData> {
  return platformEnterpriseAdminApi.getList(params)
}

export function getPlatformEnterpriseAdminDetail(id: number | string): Promise<UserDetail> {
  return platformEnterpriseAdminApi.getDetail(id)
}

export function updatePlatformEnterpriseAdmin(
  id: number | string,
  payload: UpdateUserProfilePayload,
): Promise<UserDetail> {
  return platformEnterpriseAdminApi.update(id, payload)
}

export function updatePlatformEnterpriseAdminStatus(
  id: number | string,
  payload: UpdateUserStatusPayload,
): Promise<UserDetail> {
  return platformEnterpriseAdminApi.updateStatus(id, payload)
}

export function getPlatformEnterpriseAdminRoleOptions(): Promise<RoleOptionItem[]> {
  return platformEnterpriseAdminApi.getRoleOptions()
}

export function createPlatformEnterpriseAdmin(payload: CreateUserPayload): Promise<UserDetail> {
  return platformEnterpriseAdminApi.create(payload)
}

export function resetPlatformEnterpriseAdminPassword(
  id: number | string,
  payload: ResetUserPasswordPayload,
): Promise<UserDetail> {
  return platformEnterpriseAdminApi.resetPassword(id, payload)
}

export function getPlatformEnterpriseAdminAudits(
  id: number | string,
  params: Pick<UserListQuery, 'page' | 'size'>,
): Promise<UserAuditListData> {
  return platformEnterpriseAdminApi.getAudits(id, params)
}

export function getOrgUserList(params: UserListQuery): Promise<UserListData> {
  return orgUsersApi.getList(params)
}

export function getOrgUserDetail(id: number | string): Promise<UserDetail> {
  return orgUsersApi.getDetail(id)
}

export function updateOrgUser(id: number | string, payload: UpdateUserProfilePayload): Promise<UserDetail> {
  return orgUsersApi.update(id, payload)
}

export function updateOrgUserRoles(id: number | string, payload: UpdateUserRolesPayload): Promise<UserDetail> {
  return orgUsersApi.updateRoles(id, payload)
}

export function updateOrgUserStatus(
  id: number | string,
  payload: UpdateUserStatusPayload,
): Promise<UserDetail> {
  return orgUsersApi.updateStatus(id, payload)
}

export function getOrgUserRoleOptions(): Promise<RoleOptionItem[]> {
  return orgUsersApi.getRoleOptions()
}

export function createOrgUser(payload: CreateUserPayload): Promise<UserDetail> {
  return orgUsersApi.create(payload)
}

export function resetOrgUserPassword(
  id: number | string,
  payload: ResetUserPasswordPayload,
): Promise<UserDetail> {
  return orgUsersApi.resetPassword(id, payload)
}

export function getOrgUserAudits(
  id: number | string,
  params: Pick<UserListQuery, 'page' | 'size'>,
): Promise<UserAuditListData> {
  return orgUsersApi.getAudits(id, params)
}

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

export function getUserList(params: UserListQuery): Promise<UserListData> {
  return request<UserListData>({
    url: '/users',
    method: 'GET',
    params,
  })
}

export function getUserDetail(id: number | string): Promise<UserDetail> {
  return request<UserDetail>({
    url: `/users/${id}`,
    method: 'GET',
  })
}

export function updateUser(id: number | string, payload: UpdateUserProfilePayload): Promise<UserDetail> {
  return request<UserDetail>({
    url: `/users/${id}`,
    method: 'PUT',
    data: payload,
  })
}

export function updateUserRoles(
  id: number | string,
  payload: UpdateUserRolesPayload,
): Promise<UserDetail> {
  return request<UserDetail>({
    url: `/users/${id}/roles`,
    method: 'PUT',
    data: payload,
  })
}

export function updateUserStatus(
  id: number | string,
  payload: UpdateUserStatusPayload,
): Promise<UserDetail> {
  return request<UserDetail>({
    url: `/users/${id}/status`,
    method: 'PUT',
    data: payload,
  })
}

export function getRoleOptions(): Promise<RoleOptionItem[]> {
  return request<RoleOptionItem[]>({
    url: '/roles',
    method: 'GET',
  })
}

export function createUser(payload: CreateUserPayload): Promise<UserDetail> {
  return request<UserDetail>({
    url: '/users',
    method: 'POST',
    data: payload,
  })
}

export function resetUserPassword(
  id: number | string,
  payload: ResetUserPasswordPayload,
): Promise<UserDetail> {
  return request<UserDetail>({
    url: `/users/${id}/reset-password`,
    method: 'POST',
    data: payload,
  })
}

export function getUserAudits(
  id: number | string,
  params: Pick<UserListQuery, 'page' | 'size'>,
): Promise<UserAuditListData> {
  return request<UserAuditListData>({
    url: `/users/${id}/audits`,
    method: 'GET',
    params,
  })
}

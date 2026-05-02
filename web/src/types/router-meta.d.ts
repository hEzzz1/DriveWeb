import 'vue-router'
import type { PermissionCode } from './api'
import type { WorkspaceDomain, WorkspaceSectionKey } from '../config/workspace'

declare module 'vue-router' {
  interface RouteMeta {
    public?: boolean
    requiresAuth?: boolean
    permissions?: PermissionCode[]
    domain?: WorkspaceDomain
    workspaceKey?: string
    workspaceParentKey?: string
    workspaceMenu?: boolean
    workspaceSection?: WorkspaceSectionKey
    workspaceSectionLabel?: string
    pageTitle?: string
    pageSubtitle?: string
    pageBadge?: string
  }
}

export {}

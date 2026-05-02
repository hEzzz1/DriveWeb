<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { ElMessageBox } from 'element-plus'
import { useRoute, useRouter } from 'vue-router'
import WorkspaceCommandDialog from './components/shell/WorkspaceCommandDialog.vue'
import WorkspaceWorkbenchDrawer from './components/shell/WorkspaceWorkbenchDrawer.vue'
import {
  canAccessWorkspaceDefinition,
  toWorkspaceNavEntry,
  workspaceDefinitionMap,
  workspaceDefinitions,
  workspaceRouteNameMap,
  workspaceSectionLabels,
  workspaceSectionOrder,
  type WorkspaceSectionKey,
} from './config/workspace'
import { useAccess } from './composables/useAccess'
import { useAuthStore } from './stores/auth'
import { useRealtimeStore } from './stores/realtime'
import type { NormalizedAlertRealtimeEvent } from './types/alerts'
import type {
  WorkspaceAlertFeedItem,
  WorkspaceCommandItem,
  WorkspaceNavEntry,
  WorkspaceVisitedEntry,
} from './types/workspace'
import { formatDateTime } from './utils/alerts'
import {
  appendWorkspaceAlertFeed,
  buildWorkspaceShellStorageKey,
  buildWorkspaceAlertFeedItem,
  loadWorkspaceShellPreferences,
  saveWorkspaceShellPreferences,
} from './utils/workspace-shell'

interface NavSection {
  key: WorkspaceSectionKey
  label: string
  items: WorkspaceNavEntry[]
}

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
authStore.hydrate()
const access = useAccess()
const realtimeStore = useRealtimeStore()

const sidebarCollapsed = ref(false)
const mobileSidebarOpen = ref(false)
const workbenchOpen = ref(false)
const commandDialogOpen = ref(false)
const commandQuery = ref('')
const commandActiveIndex = ref(0)
const navSearch = ref('')
const pinnedPaths = ref<string[]>([])
const visitedTags = ref<WorkspaceVisitedEntry[]>([])
const recentRealtimeAlerts = ref<WorkspaceAlertFeedItem[]>([])
const shellStateReady = ref(false)
const shellStorageKey = computed(() =>
  buildWorkspaceShellStorageKey({
    userId: authStore.userId,
    username: authStore.username,
  }),
)

let unsubscribeRealtime: (() => void) | null = null

const isPublicPage = computed(() => Boolean(route.meta.public))
const workspaceAccessContext = computed(() => ({
  workspaceDomain: authStore.workspaceDomain,
  permissions: authStore.permissions,
}))
const visibleNavItems = computed<WorkspaceNavEntry[]>(() =>
  workspaceDefinitions
    .filter((item) => item.menu)
    .filter((item) => canAccessWorkspaceDefinition(item, workspaceAccessContext.value))
    .map((item) => toWorkspaceNavEntry(item)),
)
const utilityNavItems = computed<WorkspaceNavEntry[]>(() => {
  if (!authStore.isAuthenticated || isPublicPage.value) {
    return []
  }

  return workspaceDefinitions
    .filter((item) => !item.menu && item.section === 'workspace')
    .filter((item) => canAccessWorkspaceDefinition(item, workspaceAccessContext.value))
    .map((item) => toWorkspaceNavEntry(item))
})
const workspaceEntryMap = computed(() => {
  const map = new Map<string, WorkspaceNavEntry>()

  for (const item of [...visibleNavItems.value, ...utilityNavItems.value]) {
    map.set(item.path, item)
  }

  return map
})
const activeWorkspaceDefinition = computed(() => {
  if (typeof route.meta.workspaceKey === 'string') {
    return workspaceDefinitionMap.get(route.meta.workspaceKey)
  }

  if (typeof route.name === 'string') {
    return workspaceRouteNameMap.get(route.name)
  }

  return undefined
})
const activeNavKey = computed(() => {
  const currentItem = activeWorkspaceDefinition.value

  if (currentItem?.menu) {
    return currentItem.key
  }

  if (currentItem?.parentKey) {
    return currentItem.parentKey
  }

  return (
    visibleNavItems.value.find(
      (item) => route.path === item.path || route.path.startsWith(`${item.path}/`),
    )?.key || ''
  )
})
const currentNavItem = computed<WorkspaceNavEntry | undefined>(() => {
  const utilityItem = utilityNavItems.value.find((item) => item.key === activeWorkspaceDefinition.value?.key)

  if (utilityItem) {
    return utilityItem
  }

  return (
    visibleNavItems.value.find((item) => item.key === activeNavKey.value) ||
    visibleNavItems.value[0] ||
    utilityNavItems.value[0]
  )
})
const navSections = computed<NavSection[]>(() => {
  const sectionOrder = workspaceSectionOrder[access.value.isPlatformDomain ? 'platform' : 'org']

  return sectionOrder
    .map((section) => ({
      key: section,
      label: workspaceSectionLabels[section],
      items: visibleNavItems.value.filter((item) => item.section === section),
    }))
    .filter((section) => section.items.length)
})
const filteredNavSections = computed<NavSection[]>(() => {
  const keyword = normalizeSearchText(navSearch.value)

  if (!keyword) {
    return navSections.value
  }

  return navSections.value
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => matchesNavItem(item, keyword)),
    }))
    .filter((section) => section.items.length)
})
const currentSectionLabel = computed(
  () =>
    route.meta.workspaceSectionLabel ||
    (currentNavItem.value ? getNavSectionLabel(currentNavItem.value.section) : '工作区'),
)
const currentPageTitle = computed(() => route.meta.pageTitle || currentNavItem.value?.label || '工作区')
const currentPageSubtitle = computed(
  () =>
    route.meta.pageSubtitle ||
    currentNavItem.value?.subtitle ||
    '统一管理当前工作空间中的页面、快捷动作和实时状态。',
)
const showRealtimeStatus = computed(
  () => authStore.isAuthenticated && !isPublicPage.value && access.value.isOrgDomain,
)
const showRealtimeAlertFeed = computed(
  () => showRealtimeStatus.value && access.value.canViewAlerts,
)
const realtimeHint = computed(() => {
  if (realtimeStore.status === 'connected' && realtimeStore.lastMessageAt) {
    return `最近消息 ${formatDateTime(realtimeStore.lastMessageAt)}`
  }

  if (realtimeStore.status === 'disconnected') {
    return '实时更新已中断'
  }

  if (realtimeStore.status === 'reconnecting') {
    return '正在自动重连'
  }

  return '等待实时消息'
})
const userInitial = computed(() => (authStore.username || 'D').slice(0, 1).toUpperCase())
const favoriteNavItems = computed<WorkspaceNavEntry[]>(() =>
  pinnedPaths.value
    .map((path) => workspaceEntryMap.value.get(path))
    .filter((item): item is WorkspaceNavEntry => Boolean(item)),
)
const sessionSummary = computed(() => ({
  username: authStore.username || '未登录用户',
  roleText: authStore.roleText,
  scopeText: authStore.scopeText,
  expireAtText: authStore.expireAtText,
  minutesLeft: authStore.minutesLeft,
  willExpireSoon: authStore.willExpireSoon,
}))
const realtimeSummary = computed(() => ({
  status: realtimeStore.status,
  statusText: realtimeStore.statusText,
  hint: realtimeHint.value,
  canReconnect: realtimeStore.status !== 'connected',
}))
const commandItems = computed<WorkspaceCommandItem[]>(() => {
  const items: WorkspaceCommandItem[] = []
  const pinnedPathSet = new Set(pinnedPaths.value)

  for (const item of favoriteNavItems.value) {
    items.push({
      id: `favorite:${item.path}`,
      group: 'favorites',
      groupLabel: '收藏入口',
      label: item.label,
      description: item.subtitle,
      action: 'navigate',
      path: item.path,
      hint: getNavSectionLabel(item.section),
      badge: item.badge,
      pinned: true,
      keywords: [item.section],
    })
  }

  for (const item of visibleNavItems.value) {
    if (pinnedPathSet.has(item.path)) {
      continue
    }

    items.push({
      id: `page:${item.path}`,
      group: 'pages',
      groupLabel: '页面',
      label: item.label,
      description: item.subtitle,
      action: 'navigate',
      path: item.path,
      hint: getNavSectionLabel(item.section),
      badge: item.badge,
      keywords: [item.section],
    })
  }

  if (showRealtimeAlertFeed.value) {
    for (const item of recentRealtimeAlerts.value) {
      items.push({
        id: `alert:${item.id}`,
        group: 'alerts',
        groupLabel: '最近告警',
        label: item.alertNo,
        description: getAlertCommandDescription(item.eventType),
        action: 'open-alert',
        alertId: item.id,
        hint: formatDateTime(item.eventAt),
        badge: '警',
      })
    }
  }

  items.push({
    id: 'action:session',
    group: 'actions',
    groupLabel: '快捷动作',
    label: '打开会话状态',
    description: '查看当前登录状态、访问范围和能力概览。',
    action: 'open-session',
    hint: '账户与安全',
    badge: '鉴',
    keywords: ['权限', '会话', '安全'],
  })

  if (showRealtimeStatus.value && realtimeStore.status !== 'connected') {
    items.push({
      id: 'action:reconnect',
      group: 'actions',
      groupLabel: '快捷动作',
      label: '重连实时通道',
      description: '立即重建告警实时连接。',
      action: 'reconnect',
      hint: realtimeStore.statusText,
      badge: '连',
      keywords: ['ws', 'websocket', '重连'],
    })
  }

  items.push({
    id: 'action:logout',
    group: 'actions',
    groupLabel: '快捷动作',
    label: '退出登录',
    description: '清除本地 token 并返回登录页。',
    action: 'logout',
    hint: '安全退出',
    badge: '退',
    keywords: ['logout', '退出', '登录'],
  })

  return items
})
const filteredCommandItems = computed(() => {
  const keyword = normalizeSearchText(commandQuery.value)

  if (!keyword) {
    return commandItems.value.slice(0, 24)
  }

  return commandItems.value
    .filter((item) => matchesCommandItem(item, keyword))
    .slice(0, 24)
})

watch(
  shellStorageKey,
  (storageKey) => {
    applyShellPreferences(loadWorkspaceShellPreferences(storageKey))
  },
  { immediate: true },
)

watch(
  [() => authStore.isAuthenticated, () => authStore.workspaceDomain],
  ([isAuthenticated, workspaceDomain]) => {
    if (isAuthenticated && workspaceDomain === 'org') {
      realtimeStore.ensureConnected()
      return
    }

    recentRealtimeAlerts.value = []
    realtimeStore.disconnect()
  },
  { immediate: true },
)

watch(
  [visibleNavItems, () => route.path],
  () => {
    if (!shellStateReady.value) {
      return
    }

    syncPinnedPaths()
    syncVisitedTags()
    mobileSidebarOpen.value = false
  },
  { immediate: true },
)

watch(
  [sidebarCollapsed, pinnedPaths, visitedTags],
  () => {
    if (!shellStateReady.value) {
      return
    }

    saveWorkspaceShellPreferences(shellStorageKey.value, {
      sidebarCollapsed: sidebarCollapsed.value,
      pinnedPaths: pinnedPaths.value,
      visitedTags: visitedTags.value,
    })
  },
  { deep: true },
)

watch(
  () => commandDialogOpen.value,
  (isOpen) => {
    if (!isOpen) {
      commandQuery.value = ''
      commandActiveIndex.value = 0
      return
    }

    commandActiveIndex.value = 0
  },
)

watch(filteredCommandItems, (items) => {
  if (!commandDialogOpen.value) {
    return
  }

  if (!items.length) {
    commandActiveIndex.value = -1
    return
  }

  if (commandActiveIndex.value < 0 || commandActiveIndex.value >= items.length) {
    commandActiveIndex.value = 0
  }
})

onMounted(() => {
  unsubscribeRealtime = realtimeStore.subscribe((event) => {
    handleRealtimeEvent(event)
  })

  if (typeof window !== 'undefined') {
    window.addEventListener('keydown', handleGlobalKeydown)
  }
})

onBeforeUnmount(() => {
  unsubscribeRealtime?.()
  unsubscribeRealtime = null

  if (typeof window !== 'undefined') {
    window.removeEventListener('keydown', handleGlobalKeydown)
  }

  realtimeStore.disconnect()
})

async function handleLogout(): Promise<void> {
  try {
    await ElMessageBox.confirm('退出后将清除本地 token，是否继续？', '确认退出', {
      confirmButtonText: '退出登录',
      cancelButtonText: '取消',
      type: 'warning',
    })
  } catch {
    return
  }

  authStore.logout()
  await router.replace('/login')
}

function syncPinnedPaths(): void {
  const nextPaths = pinnedPaths.value.filter((path) => workspaceEntryMap.value.has(path))

  if (nextPaths.length !== pinnedPaths.value.length) {
    pinnedPaths.value = nextPaths
  }
}

function syncVisitedTags(): void {
  const currentItem = currentNavItem.value
  const nextTags = visitedTags.value
    .filter((tag) => workspaceEntryMap.value.has(tag.path))
    .map((tag) => {
      const item = workspaceEntryMap.value.get(tag.path)

      return item ? { key: item.key, label: item.label, path: tag.path, subtitle: item.subtitle } : tag
    })

  if (
    currentItem?.path &&
    workspaceEntryMap.value.has(currentItem.path) &&
    !nextTags.some((tag) => tag.path === currentItem.path)
  ) {
    nextTags.push({
      key: currentItem.key,
      label: currentItem.label,
      path: currentItem.path,
      subtitle: currentItem.subtitle,
    })
  }

  if (nextTags.length) {
    visitedTags.value = nextTags
    return
  }

  const fallbackItem = visibleNavItems.value[0] || utilityNavItems.value[0]

  visitedTags.value = fallbackItem
    ? [{ key: fallbackItem.key, label: fallbackItem.label, path: fallbackItem.path, subtitle: fallbackItem.subtitle }]
    : []
}

function handleNavigate(item: { path?: string }): void {
  if (!item.path || item.path === route.path) {
    mobileSidebarOpen.value = false
    workbenchOpen.value = false
    commandDialogOpen.value = false
    return
  }

  mobileSidebarOpen.value = false
  workbenchOpen.value = false
  commandDialogOpen.value = false
  router.push(item.path)
}

function handleToggleSidebar(): void {
  if (typeof window !== 'undefined' && window.matchMedia('(max-width: 1080px)').matches) {
    mobileSidebarOpen.value = !mobileSidebarOpen.value
    return
  }

  sidebarCollapsed.value = !sidebarCollapsed.value
}

function isTagActive(tag: WorkspaceVisitedEntry): boolean {
  return route.path === tag.path || route.path.startsWith(`${tag.path}/`)
}

function handleCloseTag(tag: WorkspaceVisitedEntry): void {
  if (visitedTags.value.length <= 1) {
    return
  }

  const closingIndex = visitedTags.value.findIndex((item) => item.path === tag.path)

  if (closingIndex === -1) {
    return
  }

  const nextTags = visitedTags.value.filter((item) => item.path !== tag.path)
  const shouldRedirect = isTagActive(tag)
  visitedTags.value = nextTags

  if (!shouldRedirect) {
    return
  }

  const fallbackTag = nextTags[closingIndex] || nextTags[closingIndex - 1] || nextTags[0]

  if (fallbackTag) {
    router.push(fallbackTag.path)
  }
}

function handleReconnect(): void {
  realtimeStore.reconnect()
}

function handleRealtimeEvent(event: NormalizedAlertRealtimeEvent): void {
  if (!showRealtimeAlertFeed.value) {
    return
  }

  recentRealtimeAlerts.value = appendWorkspaceAlertFeed(
    recentRealtimeAlerts.value,
    buildWorkspaceAlertFeedItem(event),
  )
}

function handleTogglePinnedPath(path: string): void {
  if (!workspaceEntryMap.value.has(path)) {
    return
  }

  if (pinnedPaths.value.includes(path)) {
    pinnedPaths.value = pinnedPaths.value.filter((item) => item !== path)
    return
  }

  pinnedPaths.value = [path, ...pinnedPaths.value]
}

function handleOpenWorkbench(): void {
  mobileSidebarOpen.value = false
  commandDialogOpen.value = false
  workbenchOpen.value = true
}

function handleOpenCommandDialog(initialQuery = ''): void {
  mobileSidebarOpen.value = false
  workbenchOpen.value = false
  commandQuery.value = initialQuery
  commandDialogOpen.value = true
}

function handleOpenSession(): void {
  handleNavigate({ path: '/account/session' })
}

function handleOpenAlert(alertId: number): void {
  if (!showRealtimeAlertFeed.value) {
    return
  }

  router.push({
    name: 'alert-detail',
    params: { id: String(alertId) },
  })
  workbenchOpen.value = false
  commandDialogOpen.value = false
}

async function handleSelectCommand(item: WorkspaceCommandItem): Promise<void> {
  if (item.action === 'navigate') {
    handleNavigate({ path: item.path })
    return
  }

  if (item.action === 'open-alert' && item.alertId) {
    handleOpenAlert(item.alertId)
    return
  }

  if (item.action === 'open-session') {
    handleOpenSession()
    return
  }

  if (item.action === 'reconnect') {
    handleReconnect()
    commandDialogOpen.value = false
    return
  }

  await handleLogout()
}

function applyShellPreferences(preferences: ReturnType<typeof loadWorkspaceShellPreferences>): void {
  shellStateReady.value = false
  sidebarCollapsed.value = preferences.sidebarCollapsed
  pinnedPaths.value = preferences.pinnedPaths
  visitedTags.value = preferences.visitedTags
  syncPinnedPaths()
  syncVisitedTags()
  mobileSidebarOpen.value = false
  shellStateReady.value = true
}

function isComposingKeyboardEvent(event: KeyboardEvent): boolean {
  return event.isComposing || event.keyCode === 229
}

function isCommandDialogKeyContext(target: EventTarget | null): boolean {
  const targetElement = target instanceof Element ? target : null

  if (targetElement?.closest('.command-dialog')) {
    return true
  }

  return document.activeElement instanceof Element
    ? Boolean(document.activeElement.closest('.command-dialog'))
    : false
}

function handleGlobalKeydown(event: KeyboardEvent): void {
  const key = event.key.toLowerCase()

  if ((event.metaKey || event.ctrlKey) && key === 'k' && !isComposingKeyboardEvent(event)) {
    event.preventDefault()
    handleOpenCommandDialog(commandQuery.value)
    return
  }

  if (!commandDialogOpen.value) {
    return
  }

  if (event.key === 'Escape') {
    commandDialogOpen.value = false
    return
  }

  if (isComposingKeyboardEvent(event) || !isCommandDialogKeyContext(event.target)) {
    return
  }

  if (event.key === 'ArrowDown') {
    event.preventDefault()
    moveCommandSelection(1)
    return
  }

  if (event.key === 'ArrowUp') {
    event.preventDefault()
    moveCommandSelection(-1)
    return
  }

  if (event.key === 'Enter') {
    const activeItem = filteredCommandItems.value[commandActiveIndex.value]

    if (!activeItem) {
      return
    }

    event.preventDefault()
    void handleSelectCommand(activeItem)
  }
}

function moveCommandSelection(step: 1 | -1): void {
  const items = filteredCommandItems.value

  if (!items.length) {
    commandActiveIndex.value = -1
    return
  }

  if (commandActiveIndex.value < 0) {
    commandActiveIndex.value = 0
    return
  }

  commandActiveIndex.value =
    (commandActiveIndex.value + step + items.length) % items.length
}

function matchesNavItem(item: WorkspaceNavEntry, keyword: string): boolean {
  return normalizeSearchText([item.label, item.subtitle].join(' ')).includes(keyword)
}

function matchesCommandItem(item: WorkspaceCommandItem, keyword: string): boolean {
  return normalizeSearchText(
    [
      item.label,
      item.description,
      item.hint,
      item.badge,
      ...(item.keywords || []),
    ]
      .filter(Boolean)
      .join(' '),
  ).includes(keyword)
}

function normalizeSearchText(value: string): string {
  return value.trim().toLowerCase()
}

function getNavSectionLabel(section: string): string {
  return workspaceSectionLabels[section as WorkspaceSectionKey] || '工作区'
}

function getAlertCommandDescription(eventType: WorkspaceAlertFeedItem['eventType']): string {
  return eventType === 'ALERT_CREATED' ? '收到新的实时告警，点击查看详情。' : '告警状态已更新，点击查看详情。'
}
</script>

<template>
  <RouterView v-if="isPublicPage" />

  <div
    v-else
    class="admin-shell"
    :class="{
      'is-collapsed': sidebarCollapsed,
      'is-mobile-open': mobileSidebarOpen,
    }"
  >
    <div class="shell-mask" @click="mobileSidebarOpen = false"></div>

    <aside class="sidebar">
      <div class="sidebar-brand">
        <div class="brand-badge">DW</div>
        <div v-if="!sidebarCollapsed" class="brand-copy">
          <strong>DriveWeb</strong>
          <span>{{ access.isPlatformDomain ? '平台管理后台' : '企业运营后台' }}</span>
        </div>
      </div>

      <div class="sidebar-scroll">
        <div v-if="!sidebarCollapsed" class="sidebar-tools">
          <el-input
            v-model="navSearch"
            class="sidebar-search"
            clearable
            placeholder="筛选菜单，回车打开全局检索"
            @keyup.enter="handleOpenCommandDialog(navSearch)"
          />

          <button class="sidebar-command-trigger" type="button" @click="handleOpenCommandDialog(navSearch)">
            <span>全局检索</span>
            <span class="shortcut-hint">⌘K</span>
          </button>
        </div>

        <div v-if="favoriteNavItems.length" class="sidebar-group is-favorites">
          <div v-if="!sidebarCollapsed" class="sidebar-section">
            <span>收藏入口</span>
          </div>

          <div
            v-for="item in favoriteNavItems"
            :key="item.path"
            class="sidebar-item"
            :class="{ active: item.key === activeNavKey }"
          >
            <button
              class="sidebar-item-main"
              type="button"
              :title="sidebarCollapsed ? item.label : ''"
              @click="handleNavigate(item)"
            >
              <span class="sidebar-item-badge">{{ item.badge }}</span>

              <span v-if="!sidebarCollapsed" class="sidebar-item-copy">
                <span class="sidebar-item-label">{{ item.label }}</span>
              </span>
            </button>

            <button
              v-if="!sidebarCollapsed"
              class="sidebar-item-pin is-active"
              type="button"
              title="取消收藏"
              @click.stop="handleTogglePinnedPath(item.path)"
            >
              ★
            </button>
          </div>
        </div>

        <div v-for="section in filteredNavSections" :key="section.key" class="sidebar-group">
          <div v-if="!sidebarCollapsed" class="sidebar-section">
            <span>{{ section.label }}</span>
          </div>

          <div
            v-for="item in section.items"
            :key="item.key"
            class="sidebar-item"
            :class="{ active: item.key === activeNavKey }"
          >
            <button
              class="sidebar-item-main"
              type="button"
              :title="sidebarCollapsed ? item.label : ''"
              @click="handleNavigate(item)"
            >
              <span class="sidebar-item-badge">{{ item.badge }}</span>

              <span v-if="!sidebarCollapsed" class="sidebar-item-copy">
                <span class="sidebar-item-label">{{ item.label }}</span>
              </span>
            </button>

            <button
              v-if="!sidebarCollapsed"
              class="sidebar-item-pin"
              type="button"
              :class="{ 'is-active': pinnedPaths.includes(item.path) }"
              :title="pinnedPaths.includes(item.path) ? '取消收藏' : '加入收藏'"
              @click.stop="handleTogglePinnedPath(item.path)"
            >
              {{ pinnedPaths.includes(item.path) ? '★' : '☆' }}
            </button>
          </div>
        </div>

        <el-empty
          v-if="!filteredNavSections.length && !favoriteNavItems.length"
          description="没有匹配的菜单项"
        />
      </div>

      <div class="sidebar-footer">
        <div v-if="!sidebarCollapsed" class="footer-card">
          <p class="footer-label">当前角色</p>
          <p class="footer-value">{{ authStore.roleText }}</p>
          <p class="footer-note">当前范围 {{ authStore.scopeText }}</p>
          <p class="footer-note">已授权 {{ visibleNavItems.length }} 个工作项</p>
        </div>

        <div v-else class="footer-mini" :title="`已授权 ${visibleNavItems.length} 个工作项`">
          {{ visibleNavItems.length }}
        </div>
      </div>
    </aside>

    <section class="shell-main">
      <header class="topbar">
        <div class="topbar-left">
          <button class="menu-toggle" type="button" aria-label="切换导航" @click="handleToggleSidebar">
            <span></span>
            <span></span>
            <span></span>
          </button>

          <div class="topbar-page">
            <div class="breadcrumb">
              <span>DriveWeb</span>
              <span class="breadcrumb-separator">/</span>
              <span>{{ currentSectionLabel }}</span>
              <span class="breadcrumb-separator">/</span>
              <strong>{{ currentPageTitle }}</strong>
            </div>

            <div class="topbar-page-copy">
              <strong>{{ currentPageTitle }}</strong>
              <span>{{ currentPageSubtitle }}</span>
            </div>
          </div>

          <div class="workspace-chip">
            <span class="workspace-chip-label">{{ access.isPlatformDomain ? '平台域' : '企业域' }}</span>
            <strong>{{ authStore.scopeText }}</strong>
          </div>
        </div>

        <div class="topbar-right">
          <button class="workbench-trigger" type="button" @click="handleOpenCommandDialog()">
            <span>搜索</span>
            <span class="shortcut-hint">⌘K</span>
          </button>

          <button class="workbench-trigger secondary" type="button" @click="handleOpenWorkbench">
            <span>工作台</span>
          </button>

          <div v-if="showRealtimeStatus" class="realtime-card">
            <el-tag size="small" effect="plain" :type="realtimeStore.statusTagType">{{ realtimeStore.statusText }}</el-tag>

            <div class="realtime-copy">
              <strong>实时通道</strong>
              <span>{{ realtimeHint }}</span>
            </div>

            <el-button
              v-if="realtimeStore.status !== 'connected'"
              link
              type="primary"
              @click="handleReconnect"
            >
              重连
            </el-button>
          </div>

          <div class="account-card">
            <div class="avatar-badge">{{ userInitial }}</div>

            <div class="account-copy">
              <strong>{{ authStore.username || '未登录用户' }}</strong>
              <span>{{ authStore.roleText }} · {{ authStore.scopeText }}</span>
            </div>
          </div>

          <el-button plain @click="handleLogout">退出</el-button>
        </div>
      </header>

      <div v-if="authStore.willExpireSoon" class="session-banner">
        <div class="session-banner-copy">
          <strong>登录会话即将过期</strong>
          <span>剩余 {{ authStore.minutesLeft ?? 0 }} 分钟，建议尽快续登，避免管理操作中断。</span>
        </div>

        <el-button type="warning" plain @click="handleOpenSession">查看会话状态</el-button>
      </div>

      <div v-if="visitedTags.length" class="tags-bar">
        <button
          v-for="tag in visitedTags"
          :key="tag.path"
          class="tag-chip"
          :class="{ active: isTagActive(tag) }"
          type="button"
          @click="handleNavigate({ path: tag.path })"
        >
          <span>{{ tag.label }}</span>
          <span v-if="visitedTags.length > 1" class="tag-close" @click.stop="handleCloseTag(tag)">×</span>
        </button>
      </div>

      <main class="global-main">
        <RouterView />
      </main>
    </section>

    <WorkspaceWorkbenchDrawer
      v-model="workbenchOpen"
      :favorites="favoriteNavItems"
      :recent-visits="visitedTags"
      :pinned-paths="pinnedPaths"
      :recent-alerts="recentRealtimeAlerts"
      :session-summary="sessionSummary"
      :realtime-summary="realtimeSummary"
      :show-realtime="showRealtimeStatus"
      :show-alerts="showRealtimeAlertFeed"
      @navigate="handleNavigate({ path: $event })"
      @toggle-pin="handleTogglePinnedPath"
      @open-session="handleOpenSession"
      @reconnect="handleReconnect"
      @open-alert="handleOpenAlert"
    />

    <WorkspaceCommandDialog
      v-model="commandDialogOpen"
      v-model:query="commandQuery"
      :items="filteredCommandItems"
      :active-index="commandActiveIndex"
      @select="handleSelectCommand"
    />
  </div>
</template>

<style scoped>
.admin-shell {
  --sidebar-width: 256px;
  --sidebar-collapsed-width: 80px;
  min-height: 100vh;
  display: grid;
  grid-template-columns: var(--sidebar-width) minmax(0, 1fr);
  background:
    radial-gradient(circle at top left, rgba(22, 119, 255, 0.08), transparent 320px),
    linear-gradient(180deg, #f5f8ff 0%, var(--page-bg) 220px);
}

.admin-shell.is-collapsed {
  grid-template-columns: var(--sidebar-collapsed-width) minmax(0, 1fr);
}

.shell-mask {
  display: none;
}

.sidebar {
  position: relative;
  z-index: 30;
  display: flex;
  min-height: 100vh;
  flex-direction: column;
  background: var(--sidebar-bg);
  border-right: 1px solid rgba(5, 5, 5, 0.06);
  box-shadow: 0 6px 24px rgba(15, 23, 42, 0.06);
  transition:
    transform 0.2s ease,
    width 0.2s ease;
}

.sidebar-brand {
  display: flex;
  min-height: 64px;
  align-items: center;
  gap: 14px;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(5, 5, 5, 0.06);
}

.brand-badge {
  display: grid;
  width: 36px;
  height: 36px;
  flex-shrink: 0;
  place-items: center;
  border-radius: 10px;
  background: linear-gradient(135deg, #1677ff, #0958d9);
  color: #ffffff;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.08em;
  box-shadow: 0 8px 18px rgba(22, 119, 255, 0.22);
}

.brand-copy strong {
  display: block;
  color: var(--text-main);
  font-size: 16px;
  font-weight: 600;
}

.brand-copy span {
  display: block;
  margin-top: 4px;
  color: var(--text-faint);
  font-size: 12px;
}

.sidebar-scroll {
  flex: 1;
  overflow: auto;
  padding: 12px 12px 18px;
}

.sidebar-tools {
  display: grid;
  gap: 10px;
  margin-bottom: 16px;
}

.sidebar-command-trigger,
.workbench-trigger {
  display: inline-flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  border: 1px solid var(--line);
  border-radius: 12px;
  background: #ffffff;
  color: var(--text-main);
  cursor: pointer;
  padding: 10px 12px;
  transition:
    border-color 0.2s ease,
    background-color 0.2s ease,
    box-shadow 0.2s ease;
}

.sidebar-command-trigger:hover,
.workbench-trigger:hover {
  border-color: #b7cdf9;
  background: #f7fbff;
}

.workbench-trigger.secondary {
  background: #f7faff;
}

.shortcut-hint {
  display: inline-flex;
  align-items: center;
  padding: 4px 8px;
  border-radius: 999px;
  background: #f0f5ff;
  color: #4c6fcf;
  font-size: 12px;
  font-weight: 600;
}

.sidebar-group {
  display: grid;
  gap: 4px;
  margin-bottom: 16px;
}

.sidebar-section {
  margin: 0 8px 6px;
}

.sidebar-section span {
  display: inline-flex;
  align-items: center;
  min-height: 24px;
  padding: 0 8px;
  border-radius: 999px;
  background: #f0f5ff;
  color: #597ef7;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.02em;
}

.sidebar-item {
  display: flex;
  width: 100%;
  align-items: center;
  gap: 8px;
  min-height: 44px;
  padding: 6px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  transition:
    background-color 0.2s ease,
    box-shadow 0.2s ease,
    color 0.2s ease;
}

.sidebar-item:hover {
  background: var(--sidebar-hover);
}

.sidebar-item.active {
  background: #e6f4ff;
  box-shadow: inset 3px 0 0 var(--brand);
}

.sidebar-item-main {
  display: flex;
  flex: 1;
  min-width: 0;
  align-items: center;
  gap: 12px;
  min-height: 44px;
  border: 0;
  background: transparent;
  cursor: pointer;
  padding: 2px 6px;
  text-align: left;
}

.sidebar-item-badge {
  display: grid;
  width: 28px;
  height: 28px;
  flex-shrink: 0;
  place-items: center;
  border-radius: 8px;
  background: #f0f5ff;
  color: #1677ff;
  font-size: 13px;
  font-weight: 700;
}

.sidebar-item.active .sidebar-item-badge {
  background: #1677ff;
  color: #ffffff;
}

.sidebar-item-copy {
  display: grid;
  min-width: 0;
  gap: 0;
  text-align: left;
}

.sidebar-item-label {
  color: var(--text-main);
  font-size: 14px;
  font-weight: 500;
  line-height: 1.25;
}

.sidebar-item-pin {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  align-self: center;
  width: 26px;
  height: 26px;
  flex-shrink: 0;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: #94a3b8;
  cursor: pointer;
  font-size: 14px;
  transition:
    background-color 0.2s ease,
    color 0.2s ease;
}

.sidebar-item-pin:hover,
.sidebar-item-pin.is-active {
  background: rgba(22, 119, 255, 0.12);
  color: #1677ff;
}

.admin-shell.is-collapsed .sidebar-brand {
  justify-content: center;
  padding-right: 12px;
  padding-left: 12px;
}

.admin-shell.is-collapsed .sidebar-group {
  margin-bottom: 14px;
}

.admin-shell.is-collapsed .sidebar-item {
  justify-content: center;
  padding: 8px 0;
}

.admin-shell.is-collapsed .sidebar-item-badge {
  width: 32px;
  height: 32px;
  font-size: 14px;
}

.admin-shell.is-collapsed .sidebar-item-main {
  justify-content: center;
}

.sidebar-footer {
  padding: 14px 16px 18px;
  border-top: 1px solid rgba(5, 5, 5, 0.06);
}

.footer-card {
  border: 1px solid var(--line);
  border-radius: 12px;
  background: linear-gradient(180deg, #fafcff 0%, #f5f9ff 100%);
  padding: 12px 14px;
}

.footer-label {
  margin: 0;
  color: var(--text-faint);
  font-size: 12px;
}

.footer-value {
  margin: 6px 0 0;
  color: var(--text-main);
  font-size: 14px;
  font-weight: 600;
}

.footer-note {
  margin: 6px 0 0;
  color: var(--text-soft);
  font-size: 12px;
}

.footer-mini {
  display: grid;
  width: 36px;
  height: 36px;
  margin: 0 auto;
  place-items: center;
  border: 1px solid var(--line);
  border-radius: 12px;
  background: #f7faff;
  color: var(--text-main);
  font-size: 13px;
  font-weight: 700;
}

.shell-main {
  min-width: 0;
  min-height: 100vh;
  display: grid;
  grid-template-rows: auto auto minmax(0, 1fr);
  overflow: hidden;
}

.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 24px;
  border-bottom: 1px solid rgba(5, 5, 5, 0.06);
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(14px);
}

.topbar-left,
.topbar-right {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 14px;
}

.topbar-page {
  display: grid;
  min-width: 0;
  gap: 6px;
}

.topbar-page-copy {
  display: grid;
  min-width: 0;
  gap: 3px;
}

.topbar-page-copy strong {
  overflow: hidden;
  color: #0f172a;
  font-size: 20px;
  font-weight: 700;
  line-height: 1.1;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.topbar-page-copy span {
  overflow: hidden;
  color: var(--text-faint);
  font-size: 13px;
  line-height: 1.4;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.menu-toggle {
  display: grid;
  width: 36px;
  height: 36px;
  align-content: center;
  gap: 5px;
  padding: 0 8px;
  border: 1px solid transparent;
  border-radius: 8px;
  background: transparent;
  cursor: pointer;
  transition:
    background-color 0.2s ease,
    border-color 0.2s ease;
}

.menu-toggle:hover {
  border-color: var(--line);
  background: var(--surface);
}

.menu-toggle span {
  display: block;
  width: 100%;
  height: 2px;
  border-radius: 999px;
  background: #475569;
}

.breadcrumb {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 8px;
  overflow: hidden;
  color: var(--text-faint);
  font-size: 13px;
  white-space: nowrap;
}

.breadcrumb strong {
  overflow: hidden;
  color: var(--text-main);
  font-weight: 600;
  text-overflow: ellipsis;
}

.breadcrumb-separator {
  color: #c0c4cc;
}

.workspace-chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: #ffffff;
  color: var(--text-soft);
  font-size: 12px;
}

.workspace-chip-label {
  color: #1677ff;
  font-weight: 600;
}

.workspace-chip strong {
  color: var(--text-main);
  font-weight: 600;
}

.realtime-card {
  display: flex;
  align-items: center;
  gap: 10px;
  border: 1px solid var(--line);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.92);
  padding: 8px 12px;
}

.realtime-copy {
  display: grid;
  gap: 2px;
}

.realtime-copy strong {
  color: var(--text-main);
  font-size: 13px;
  font-weight: 600;
}

.realtime-copy span {
  color: var(--text-faint);
  font-size: 12px;
}

.account-card {
  display: flex;
  align-items: center;
  gap: 10px;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.92);
  padding: 6px 12px 6px 8px;
}

.avatar-badge {
  display: grid;
  width: 34px;
  height: 34px;
  flex-shrink: 0;
  place-items: center;
  border-radius: 50%;
  background: linear-gradient(135deg, #69b1ff, #1677ff);
  color: #ffffff;
  font-size: 13px;
  font-weight: 700;
}

.account-copy {
  display: grid;
  gap: 2px;
}

.account-copy strong {
  color: var(--text-main);
  font-size: 13px;
  font-weight: 600;
  line-height: 1.2;
}

.account-copy span {
  color: var(--text-faint);
  font-size: 12px;
}

.session-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  border-bottom: 1px solid rgba(5, 5, 5, 0.06);
  background: linear-gradient(90deg, rgba(255, 247, 237, 0.98) 0%, rgba(255, 251, 235, 0.94) 100%);
  padding: 12px 20px;
}

.session-banner-copy {
  display: grid;
  gap: 4px;
}

.session-banner-copy strong {
  color: #9a3412;
  font-size: 14px;
  font-weight: 700;
}

.session-banner-copy span {
  color: #9a3412;
  font-size: 12px;
}

.tags-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  overflow-x: auto;
  border-bottom: 1px solid rgba(5, 5, 5, 0.06);
  background: rgba(255, 255, 255, 0.7);
  padding: 10px 20px;
}

.tag-chip {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  gap: 10px;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: #ffffff;
  color: var(--text-soft);
  cursor: pointer;
  padding: 7px 12px;
  transition:
    border-color 0.2s ease,
    background-color 0.2s ease,
    color 0.2s ease,
    box-shadow 0.2s ease;
}

.tag-chip:hover {
  border-color: var(--brand);
  color: var(--brand-strong);
}

.tag-chip.active {
  border-color: var(--brand);
  background: #e6f4ff;
  box-shadow: none;
  color: var(--brand-strong);
}

.tag-close {
  display: inline-flex;
  width: 16px;
  height: 16px;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgba(22, 119, 255, 0.1);
  font-size: 12px;
  line-height: 1;
}

.tag-chip:not(.active) .tag-close {
  background: var(--surface);
  color: var(--text-faint);
}

.global-main {
  min-width: 0;
  min-height: 0;
  overflow: auto;
  background: transparent;
  padding: 24px;
}

@media (max-width: 1080px) {
  .admin-shell,
  .admin-shell.is-collapsed {
    grid-template-columns: 1fr;
  }

  .shell-mask {
    position: fixed;
    inset: 0;
    z-index: 20;
    display: block;
    background: rgba(15, 23, 42, 0.36);
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.2s ease;
  }

  .admin-shell.is-mobile-open .shell-mask {
    opacity: 1;
    pointer-events: auto;
  }

  .sidebar {
    position: fixed;
    inset: 0 auto 0 0;
    width: var(--sidebar-width);
    transform: translateX(-100%);
    box-shadow: 12px 0 28px rgba(15, 23, 42, 0.18);
  }

  .admin-shell.is-mobile-open .sidebar {
    transform: translateX(0);
  }
}

@media (max-width: 900px) {
  .topbar {
    padding: 12px 16px;
  }

  .topbar,
  .topbar-right {
    flex-wrap: wrap;
  }

  .tags-bar {
    padding-right: 16px;
    padding-left: 16px;
  }

  .session-banner {
    padding-right: 16px;
    padding-left: 16px;
  }

  .topbar-page-copy strong {
    font-size: 18px;
  }

  .global-main {
    padding: 16px;
  }
}

@media (max-width: 720px) {
  .topbar-left,
  .topbar-right,
  .realtime-card,
  .topbar-page {
    width: 100%;
  }

  .workspace-chip {
    display: none;
  }

  .topbar-right {
    align-items: stretch;
  }

  .account-card {
    justify-content: flex-start;
  }

  .breadcrumb {
    font-size: 12px;
  }

  .topbar-page-copy span {
    white-space: normal;
  }

  .realtime-card {
    flex-wrap: wrap;
  }

  .session-banner {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>

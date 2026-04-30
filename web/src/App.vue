<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { ElMessageBox } from 'element-plus'
import { useRoute, useRouter } from 'vue-router'
import { useAccess } from './composables/useAccess'
import { useAuthStore } from './stores/auth'
import { useRealtimeStore } from './stores/realtime'
import { formatDateTime } from './utils/alerts'

interface NavItem {
  key: string
  badge: string
  section: 'platform-core' | 'platform-system' | 'org-monitor' | 'org-admin' | 'org-business'
  label: string
  subtitle: string
  visible: boolean
  path?: string
}

interface VisitedTag {
  key: string
  label: string
  path: string
}

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const access = useAccess()
const realtimeStore = useRealtimeStore()
const sidebarCollapsed = ref(false)
const mobileSidebarOpen = ref(false)
const visitedTags = ref<VisitedTag[]>([])

authStore.hydrate()

const navItems = computed<NavItem[]>(() => {
  if (access.value.isPlatformDomain) {
    return [
      {
        key: 'enterprises',
        badge: '企',
        section: 'platform-core',
        label: '企业',
        subtitle: '平台级企业元数据、状态与资料维护',
        visible: access.value.canViewEnterprises,
        path: '/platform/enterprises',
      },
      {
        key: 'enterprise-admins',
        badge: '管',
        section: 'platform-core',
        label: '企业管理员',
        subtitle: '企业管理员账号、归属企业与启停管理',
        visible: access.value.canViewEnterpriseAdmins,
        path: '/platform/enterprise-admins',
      },
      {
        key: 'internal-users',
        badge: '内',
        section: 'platform-core',
        label: '平台内部账号',
        subtitle: '平台角色账号、密码、启停与角色分配',
        visible: access.value.canViewPlatformInternalUsers,
        path: '/platform/internal-users',
      },
      {
        key: 'rules',
        badge: '规',
        section: 'platform-core',
        label: '规则管理',
        subtitle: '平台规则配置、发布与回滚',
        visible: access.value.canViewPlatformRules,
        path: '/platform/rules',
      },
      {
        key: 'audit',
        badge: '审',
        section: 'platform-core',
        label: '审计日志',
        subtitle: '平台审计列表、详情与导出',
        visible: access.value.canViewPlatformAudit,
        path: '/platform/audit',
      },
      {
        key: 'health',
        badge: '康',
        section: 'platform-system',
        label: '系统健康',
        subtitle: '健康概览与平台运行状态',
        visible: access.value.canViewPlatformSystem,
        path: '/platform/system/health',
      },
      {
        key: 'services',
        badge: '服',
        section: 'platform-system',
        label: '服务状态',
        subtitle: '服务探测状态与最近检查时间',
        visible: access.value.canViewPlatformSystem,
        path: '/platform/system/services',
      },
      {
        key: 'version',
        badge: '版',
        section: 'platform-system',
        label: '版本信息',
        subtitle: '应用版本、构建时间与提交号',
        visible: access.value.canViewPlatformSystem,
        path: '/platform/system/version',
      },
    ]
  }

  return [
    {
      key: 'overview',
      badge: '览',
      section: 'org-monitor',
      label: '总览',
      subtitle: '企业风险态势、连接状态与风险概览',
      visible: access.value.canViewOverview,
      path: '/org/overview',
    },
    {
      key: 'alerts',
      badge: '警',
      section: 'org-monitor',
      label: '告警',
      subtitle: '告警筛选、详情查看与处置',
      visible: access.value.canViewAlerts,
      path: '/org/alerts',
    },
    {
      key: 'trend',
      badge: '势',
      section: 'org-monitor',
      label: '趋势分析',
      subtitle: '趋势洞察与波动分析',
      visible: access.value.canViewStats,
      path: '/org/stats/trend',
    },
    {
      key: 'ranking',
      badge: '排',
      section: 'org-monitor',
      label: '风险排行',
      subtitle: '车辆与司机风险排行',
      visible: access.value.canViewStats,
      path: '/org/stats/ranking',
    },
    {
      key: 'users',
      badge: '户',
      section: 'org-admin',
      label: '普通用户',
      subtitle: '本企业普通用户账号、角色与状态管理',
      visible: access.value.canViewUsers,
      path: '/org/users',
    },
    {
      key: 'enterprise-profile',
      badge: '企',
      section: 'org-admin',
      label: '我的企业',
      subtitle: '企业资料与激活码查看',
      visible: access.value.canViewEnterpriseProfile,
      path: '/org/enterprise-profile',
    },
    {
      key: 'fleets',
      badge: '队',
      section: 'org-business',
      label: '车队',
      subtitle: '车队状态、归属与资源规模',
      visible: access.value.canViewFleets,
      path: '/org/fleets',
    },
    {
      key: 'drivers',
      badge: '司',
      section: 'org-business',
      label: '驾驶员',
      subtitle: '驾驶员主数据、归属与 PIN 管理',
      visible: access.value.canViewDrivers,
      path: '/org/drivers',
    },
    {
      key: 'vehicles',
      badge: '车',
      section: 'org-business',
      label: '车辆',
      subtitle: '车辆主数据与设备绑定状态',
      visible: access.value.canViewVehicles,
      path: '/org/vehicles',
    },
    {
      key: 'devices',
      badge: '设',
      section: 'org-business',
      label: '设备',
      subtitle: '设备台账、归属信息与车辆分配',
      visible: access.value.canViewDevices,
      path: '/org/devices',
    },
    {
      key: 'sessions',
      badge: '会',
      section: 'org-business',
      label: '会话',
      subtitle: '驾驶会话、最近心跳与强制签退',
      visible: access.value.canViewSessions,
      path: '/org/sessions',
    },
  ]
})

const isPublicPage = computed(() => Boolean(route.meta.public))
const visibleNavItems = computed(() => navItems.value.filter((item) => item.visible))
const activeNavKey = computed(
  () =>
    visibleNavItems.value.find((item) => {
      if (!item.path) {
        return false
      }

      return route.path === item.path || route.path.startsWith(`${item.path}/`)
    })?.key || '',
)
const currentNavItem = computed(
  () => visibleNavItems.value.find((item) => item.key === activeNavKey.value) || visibleNavItems.value[0],
)
const navSections = computed(() => {
  if (access.value.isPlatformDomain) {
    return [
      { key: 'platform-core', label: '平台治理', items: visibleNavItems.value.filter((item) => item.section === 'platform-core') },
      { key: 'platform-system', label: '平台系统', items: visibleNavItems.value.filter((item) => item.section === 'platform-system') },
    ].filter((section) => section.items.length)
  }

  return [
    { key: 'org-monitor', label: '企业总览', items: visibleNavItems.value.filter((item) => item.section === 'org-monitor') },
    { key: 'org-admin', label: '组织与资料', items: visibleNavItems.value.filter((item) => item.section === 'org-admin') },
    { key: 'org-business', label: '业务模块', items: visibleNavItems.value.filter((item) => item.section === 'org-business') },
  ].filter((section) => section.items.length)
})
const currentSectionLabel = computed(
  () =>
    navSections.value.find((section) => section.items.some((item) => item.key === activeNavKey.value))?.label || '工作区',
)
const showRealtimeStatus = computed(
  () => authStore.isAuthenticated && !isPublicPage.value && access.value.isOrgDomain,
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

watch(
  [() => authStore.isAuthenticated, () => authStore.workspaceDomain],
  ([isAuthenticated, workspaceDomain]) => {
    if (isAuthenticated && workspaceDomain === 'org') {
      realtimeStore.ensureConnected()
      return
    }

    realtimeStore.disconnect()
  },
  { immediate: true },
)

watch(
  [visibleNavItems, () => route.path],
  () => {
    syncVisitedTags()
    mobileSidebarOpen.value = false
  },
  { immediate: true },
)

onBeforeUnmount(() => {
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

function syncVisitedTags(): void {
  const availableMap = new Map<string, NavItem>()

  for (const item of visibleNavItems.value) {
    if (item.path) {
      availableMap.set(item.path, item)
    }
  }

  const nextTags = visitedTags.value
    .filter((tag) => availableMap.has(tag.path))
    .map((tag) => {
      const item = availableMap.get(tag.path)

      return item ? { key: item.key, label: item.label, path: tag.path } : tag
    })

  if (currentNavItem.value?.path && availableMap.has(currentNavItem.value.path) && !nextTags.some((tag) => tag.path === currentNavItem.value?.path)) {
    nextTags.push({
      key: currentNavItem.value.key,
      label: currentNavItem.value.label,
      path: currentNavItem.value.path,
    })
  }

  if (nextTags.length) {
    visitedTags.value = nextTags
    return
  }

  const fallbackItem = visibleNavItems.value.find((item) => item.path)

  visitedTags.value = fallbackItem?.path
    ? [{ key: fallbackItem.key, label: fallbackItem.label, path: fallbackItem.path }]
    : []
}

function handleNavigate(item: Pick<NavItem, 'path'>): void {
  if (!item.path || item.path === route.path) {
    return
  }

  mobileSidebarOpen.value = false
  router.push(item.path)
}

function handleToggleSidebar(): void {
  if (typeof window !== 'undefined' && window.matchMedia('(max-width: 1080px)').matches) {
    mobileSidebarOpen.value = !mobileSidebarOpen.value
    return
  }

  sidebarCollapsed.value = !sidebarCollapsed.value
}

function isTagActive(tag: VisitedTag): boolean {
  return route.path === tag.path || route.path.startsWith(`${tag.path}/`)
}

function handleCloseTag(tag: VisitedTag): void {
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
          <span>{{ access.isPlatformDomain ? '平台治理控制台' : '企业业务控制台' }}</span>
        </div>
      </div>

      <div class="sidebar-scroll">
        <div v-for="section in navSections" :key="section.key" class="sidebar-group">
          <p v-if="!sidebarCollapsed" class="sidebar-section">{{ section.label }}</p>

          <button
            v-for="item in section.items"
            :key="item.key"
            class="sidebar-item"
            :class="{ active: item.key === activeNavKey }"
            :title="sidebarCollapsed ? item.label : ''"
            @click="handleNavigate(item)"
          >
            <span class="sidebar-item-badge">{{ item.badge }}</span>

            <span v-if="!sidebarCollapsed" class="sidebar-item-copy">
              <span class="sidebar-item-label">{{ item.label }}</span>
              <span class="sidebar-item-sub">{{ item.subtitle }}</span>
            </span>
          </button>
        </div>
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

          <div class="breadcrumb">
            <span>DriveWeb</span>
            <span class="breadcrumb-separator">/</span>
            <span>{{ currentSectionLabel }}</span>
            <span class="breadcrumb-separator">/</span>
            <strong>{{ currentNavItem?.label || '工作区' }}</strong>
          </div>
        </div>

        <div class="topbar-right">
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
  </div>
</template>

<style scoped>
.admin-shell {
  --sidebar-width: 248px;
  --sidebar-collapsed-width: 84px;
  min-height: 100vh;
  display: grid;
  grid-template-columns: var(--sidebar-width) minmax(0, 1fr);
  background: var(--page-bg);
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
  box-shadow: inset -1px 0 0 rgba(255, 255, 255, 0.06);
  transition: transform 0.2s ease;
}

.sidebar-brand {
  display: flex;
  min-height: 68px;
  align-items: center;
  gap: 12px;
  padding: 18px 18px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.brand-badge {
  display: grid;
  width: 40px;
  height: 40px;
  flex-shrink: 0;
  place-items: center;
  border-radius: 12px;
  background: linear-gradient(135deg, #3b9bff, #1966d2);
  color: #ffffff;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.08em;
}

.brand-copy strong {
  display: block;
  color: #ffffff;
  font-size: 17px;
  font-weight: 600;
}

.brand-copy span {
  display: block;
  margin-top: 4px;
  color: rgba(255, 255, 255, 0.58);
  font-size: 12px;
}

.sidebar-scroll {
  flex: 1;
  overflow: auto;
  padding: 14px 12px 18px;
}

.sidebar-group {
  display: grid;
  gap: 6px;
  margin-bottom: 18px;
}

.sidebar-section {
  margin: 0 10px 6px;
  color: rgba(255, 255, 255, 0.4);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.sidebar-item {
  display: flex;
  width: 100%;
  align-items: flex-start;
  gap: 12px;
  padding: 12px;
  border: 0;
  border-radius: 10px;
  background: transparent;
  cursor: pointer;
  transition:
    background-color 0.2s ease,
    box-shadow 0.2s ease;
}

.sidebar-item:hover {
  background: var(--sidebar-hover);
}

.sidebar-item.active {
  background: linear-gradient(90deg, rgba(64, 158, 255, 0.22), rgba(64, 158, 255, 0.08));
  box-shadow: inset 3px 0 0 var(--brand);
}

.sidebar-item-badge {
  display: grid;
  width: 28px;
  height: 28px;
  flex-shrink: 0;
  place-items: center;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.12);
  color: #ffffff;
  font-size: 13px;
  font-weight: 700;
}

.sidebar-item.active .sidebar-item-badge {
  background: rgba(64, 158, 255, 0.2);
  color: #dbeafe;
}

.sidebar-item-copy {
  display: grid;
  min-width: 0;
  gap: 4px;
  text-align: left;
}

.sidebar-item-label {
  color: rgba(255, 255, 255, 0.92);
  font-size: 14px;
  font-weight: 500;
  line-height: 1.25;
}

.sidebar-item-sub {
  color: rgba(255, 255, 255, 0.48);
  font-size: 12px;
  line-height: 1.45;
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
  padding: 10px 0;
}

.admin-shell.is-collapsed .sidebar-item-badge {
  width: 32px;
  height: 32px;
  font-size: 14px;
}

.sidebar-footer {
  padding: 14px 18px 18px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.footer-card {
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.06);
  padding: 12px 14px;
}

.footer-label {
  margin: 0;
  color: rgba(255, 255, 255, 0.46);
  font-size: 12px;
}

.footer-value {
  margin: 6px 0 0;
  color: #ffffff;
  font-size: 14px;
  font-weight: 600;
}

.footer-note {
  margin: 6px 0 0;
  color: rgba(255, 255, 255, 0.58);
  font-size: 12px;
}

.footer-mini {
  display: grid;
  width: 36px;
  height: 36px;
  margin: 0 auto;
  place-items: center;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.08);
  color: #ffffff;
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
  height: 56px;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 0 24px;
  border-bottom: 1px solid var(--line);
  background: #ffffff;
}

.topbar-left,
.topbar-right {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 14px;
}

.menu-toggle {
  display: grid;
  width: 36px;
  height: 36px;
  align-content: center;
  gap: 5px;
  padding: 0 8px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.menu-toggle:hover {
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

.realtime-card {
  display: flex;
  align-items: center;
  gap: 10px;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: var(--panel-bg);
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
  background: var(--panel-bg);
  padding: 6px 12px 6px 8px;
}

.avatar-badge {
  display: grid;
  width: 34px;
  height: 34px;
  flex-shrink: 0;
  place-items: center;
  border-radius: 50%;
  background: linear-gradient(135deg, #409eff, #1d6ce0);
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

.tags-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  overflow-x: auto;
  border-bottom: 1px solid var(--line);
  background: #ffffff;
  padding: 10px 20px;
}

.tag-chip {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  gap: 10px;
  border: 1px solid var(--line);
  border-radius: 6px;
  background: #ffffff;
  color: var(--text-soft);
  cursor: pointer;
  padding: 8px 12px;
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
  background: var(--brand);
  box-shadow: 0 4px 10px rgba(64, 158, 255, 0.18);
  color: #ffffff;
}

.tag-close {
  display: inline-flex;
  width: 16px;
  height: 16px;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.18);
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
  background: var(--page-bg);
  padding: 20px;
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
    height: auto;
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

  .global-main {
    padding: 16px;
  }
}

@media (max-width: 720px) {
  .topbar-left,
  .topbar-right,
  .realtime-card {
    width: 100%;
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

  .realtime-card {
    flex-wrap: wrap;
  }
}
</style>

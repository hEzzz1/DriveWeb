<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
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
import type { WorkspaceNavEntry } from './types/workspace'

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

const mobileSidebarOpen = ref(false)
const expandedSectionKeys = ref<WorkspaceSectionKey[]>([])

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
const currentNavItem = computed<WorkspaceNavEntry | undefined>(() =>
  visibleNavItems.value.find((item) => item.key === activeNavKey.value) || visibleNavItems.value[0],
)
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
const currentSectionLabel = computed(
  () =>
    route.meta.workspaceSectionLabel ||
    (currentNavItem.value ? getNavSectionLabel(currentNavItem.value.section) : '工作区'),
)
const currentPageTitle = computed(() => route.meta.pageTitle || currentNavItem.value?.label || '工作区')
const userInitial = computed(() => (authStore.username || '用户').slice(0, 1).toUpperCase())
const activeSectionKey = computed<WorkspaceSectionKey | undefined>(
  () => currentNavItem.value?.section as WorkspaceSectionKey | undefined,
)

watch(
  activeSectionKey,
  (sectionKey) => {
    if (sectionKey && !expandedSectionKeys.value.includes(sectionKey)) {
      expandedSectionKeys.value = [...expandedSectionKeys.value, sectionKey]
    }
  },
  { immediate: true },
)

function handleToggleSidebar(): void {
  if (window.matchMedia('(max-width: 960px)').matches) {
    mobileSidebarOpen.value = !mobileSidebarOpen.value
  }
}

function handleNavigate(item: { path: string }): void {
  mobileSidebarOpen.value = false
  router.push(item.path)
}

function handleToggleSection(sectionKey: WorkspaceSectionKey): void {
  expandedSectionKeys.value = expandedSectionKeys.value.includes(sectionKey)
    ? expandedSectionKeys.value.filter((key) => key !== sectionKey)
    : [...expandedSectionKeys.value, sectionKey]
}

function isSectionExpanded(sectionKey: WorkspaceSectionKey): boolean {
  return expandedSectionKeys.value.includes(sectionKey)
}

function handleOpenSession(): void {
  router.push('/account/session')
}

function handleLogout(): void {
  authStore.logout()
  router.push('/login')
}

function getNavSectionLabel(section: string): string {
  return workspaceSectionLabels[section as WorkspaceSectionKey] || '工作区'
}
</script>

<template>
  <RouterView v-if="isPublicPage" />

  <div
    v-else
    class="admin-shell"
    :class="{
      'is-mobile-open': mobileSidebarOpen,
    }"
  >
    <div class="shell-mask" @click="mobileSidebarOpen = false"></div>

    <aside class="sidebar">
      <div class="sidebar-brand">
        <div class="brand-badge">风控</div>
        <div class="brand-copy">
          <strong>风控管理平台</strong>
        </div>
      </div>

      <div class="sidebar-scroll">
        <div v-for="section in navSections" :key="section.key" class="sidebar-group">
          <button
            class="sidebar-section"
            :class="{ active: section.key === activeSectionKey }"
            type="button"
            :aria-expanded="isSectionExpanded(section.key)"
            @click="handleToggleSection(section.key)"
          >
            <span>{{ section.label }}</span>
            <span class="sidebar-section-arrow" aria-hidden="true"></span>
          </button>

          <div v-show="isSectionExpanded(section.key)" class="sidebar-submenu">
            <button
              v-for="item in section.items"
              :key="item.key"
              class="sidebar-item"
              :class="{ active: item.key === activeNavKey }"
              type="button"
              @click="handleNavigate(item)"
            >
              <span class="sidebar-item-copy">
                <span class="sidebar-item-label">{{ item.label }}</span>
              </span>
            </button>
          </div>
        </div>
      </div>

      <div class="sidebar-footer">
        <div class="footer-card">
          <p class="footer-label">当前角色</p>
          <p class="footer-value">{{ authStore.roleText }}</p>
          <p class="footer-note">当前范围 {{ authStore.scopeText }}</p>
        </div>
      </div>
    </aside>

    <section class="shell-main">
      <header class="topbar">
        <div class="topbar-left">
          <button
            class="menu-toggle"
            type="button"
            aria-label="切换导航"
            @click="handleToggleSidebar"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>

          <div class="topbar-page">
            <div class="breadcrumb">
              <span>风控平台</span>
              <span class="breadcrumb-separator">/</span>
              <span>{{ currentSectionLabel }}</span>
              <span class="breadcrumb-separator">/</span>
              <strong>{{ currentPageTitle }}</strong>
            </div>

            <div class="topbar-page-copy">
              <strong>{{ currentPageTitle }}</strong>
            </div>
          </div>

          <div class="workspace-chip">
            <span class="workspace-chip-label">{{ access.isPlatformDomain ? '平台域' : '企业域' }}</span>
            <strong>{{ authStore.scopeText }}</strong>
          </div>
        </div>

        <div class="topbar-right">
          <div class="account-card">
            <div class="avatar-badge">{{ userInitial }}</div>

            <div class="account-copy">
              <strong>{{ authStore.username || '未登录用户' }}</strong>
              <span>{{ authStore.roleText }} · {{ authStore.scopeText }}</span>
            </div>
          </div>

          <el-button plain @click="handleOpenSession">会话</el-button>
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

      <main class="global-main">
        <RouterView />
      </main>
    </section>
  </div>
</template>

<style scoped>
.admin-shell {
  --sidebar-width: 256px;
  min-height: 100vh;
  display: grid;
  grid-template-columns: var(--sidebar-width) minmax(0, 1fr);
  background:
    radial-gradient(circle at top left, rgba(22, 119, 255, 0.08), transparent 320px),
    linear-gradient(180deg, #f5f8ff 0%, var(--page-bg) 220px);
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
  transition: transform 0.22s ease;
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
  min-width: 44px;
  height: 44px;
  padding: 0 10px;
  flex-shrink: 0;
  place-items: center;
  border-radius: 10px;
  background: linear-gradient(135deg, #1677ff, #0958d9);
  color: #ffffff;
  font-size: 14px;
  font-weight: 700;
  box-shadow: 0 8px 18px rgba(22, 119, 255, 0.22);
}

.brand-copy strong {
  display: block;
  color: var(--text-main);
  font-size: 16px;
  font-weight: 600;
}

.sidebar-scroll {
  flex: 1;
  overflow: auto;
  padding: 12px;
}

.sidebar-group {
  display: grid;
  gap: 8px;
  margin-bottom: 16px;
}

.sidebar-section {
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  min-height: 38px;
  margin: 0;
  padding: 8px 10px;
  border: 1px solid transparent;
  border-radius: 10px;
  background: transparent;
  cursor: pointer;
  text-align: left;
  transition:
    background-color 0.2s ease,
    border-color 0.2s ease;
}

.sidebar-section:hover,
.sidebar-section.active {
  border-color: rgba(22, 119, 255, 0.1);
  background: rgba(22, 119, 255, 0.06);
}

.sidebar-section span {
  display: block;
  color: var(--text-faint);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.06em;
}

.sidebar-section.active span {
  color: #0958d9;
}

.sidebar-section-arrow {
  width: 8px;
  height: 8px;
  flex-shrink: 0;
  border-right: 2px solid #94a3b8;
  border-bottom: 2px solid #94a3b8;
  transform: rotate(-45deg);
  transition: transform 0.18s ease;
}

.sidebar-section[aria-expanded='true'] .sidebar-section-arrow {
  transform: rotate(45deg);
}

.sidebar-submenu {
  display: grid;
  gap: 4px;
  margin: 0 0 4px 10px;
  padding-left: 10px;
  border-left: 1px solid rgba(229, 234, 243, 0.9);
}

.sidebar-item {
  display: flex;
  width: 100%;
  align-items: center;
  min-height: 44px;
  padding: 10px 12px;
  border: 1px solid transparent;
  border-radius: 12px;
  background: transparent;
  cursor: pointer;
  text-align: left;
  transition:
    background-color 0.2s ease,
    box-shadow 0.2s ease;
}

.sidebar-item:hover {
  background: var(--sidebar-hover);
}

.sidebar-item.active {
  border-color: rgba(22, 119, 255, 0.14);
  background: linear-gradient(180deg, rgba(22, 119, 255, 0.1), rgba(22, 119, 255, 0.06));
}

.sidebar-item-copy {
  display: grid;
  min-width: 0;
  text-align: left;
}

.sidebar-item-label {
  color: var(--text-main);
  font-size: 14px;
  font-weight: 500;
  line-height: 1.25;
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
  gap: 2px;
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

.menu-toggle {
  display: none;
  width: 36px;
  height: 36px;
  align-content: center;
  gap: 5px;
  padding: 0 8px;
  border: 1px solid transparent;
  border-radius: 8px;
  background: transparent;
  cursor: pointer;
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
  line-height: 1.2;
}

.session-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 24px;
  border-bottom: 1px solid rgba(230, 162, 60, 0.24);
  background: #fff7e6;
}

.session-banner-copy {
  display: grid;
  gap: 2px;
}

.session-banner-copy strong {
  color: #ad6800;
  font-size: 14px;
}

.session-banner-copy span {
  color: #8c6d1f;
  font-size: 13px;
}

.global-main {
  min-width: 0;
  overflow: auto;
  padding: 24px;
}

@media (max-width: 1180px) {
  .workspace-chip,
  .breadcrumb {
    display: none;
  }
}

@media (max-width: 960px) {
  .admin-shell {
    grid-template-columns: minmax(0, 1fr);
  }

  .sidebar {
    position: fixed;
    inset: 0 auto 0 0;
    width: min(82vw, 288px);
    transform: translateX(-105%);
  }

  .admin-shell.is-mobile-open .sidebar {
    transform: translateX(0);
  }

  .shell-mask {
    position: fixed;
    inset: 0;
    z-index: 20;
    display: none;
    background: rgba(15, 23, 42, 0.32);
  }

  .admin-shell.is-mobile-open .shell-mask {
    display: block;
  }

  .topbar {
    align-items: flex-start;
    flex-direction: column;
  }

  .topbar-left,
  .topbar-right {
    width: 100%;
    justify-content: space-between;
  }

  .account-copy {
    display: none;
  }

  .menu-toggle {
    display: grid;
  }
}

@media (max-width: 640px) {
  .global-main {
    padding: 16px;
  }

  .topbar-page-copy span {
    display: none;
  }

  .session-banner {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>

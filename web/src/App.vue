<script setup lang="ts">
import { computed, onBeforeUnmount, watch } from 'vue'
import { ElMessageBox } from 'element-plus'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from './stores/auth'
import { useRealtimeStore } from './stores/realtime'
import { formatDateTime } from './utils/alerts'
import type { UserRole } from './types/api'

interface NavItem {
  key: string
  section: 'ops' | 'risk' | 'system'
  label: string
  subtitle: string
  roles: UserRole[]
  path?: string
}

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const realtimeStore = useRealtimeStore()
authStore.hydrate()

const navItems: NavItem[] = [
  { key: 'overview', section: 'ops', label: '风险总览', subtitle: '总体态势、连接状态与风险概览', roles: ['SUPER_ADMIN', 'OPERATOR', 'ANALYST', 'VIEWER'], path: '/' },
  { key: 'alerts', section: 'ops', label: '告警中心', subtitle: '告警筛选、详情查看与处置', roles: ['SUPER_ADMIN', 'OPERATOR', 'ANALYST', 'VIEWER'], path: '/alerts' },
  { key: 'trend', section: 'ops', label: '趋势分析', subtitle: '趋势洞察与波动分析', roles: ['SUPER_ADMIN', 'OPERATOR', 'ANALYST'], path: '/stats/trend' },
  { key: 'ranking', section: 'ops', label: '风险排行', subtitle: '车辆与司机风险排行', roles: ['SUPER_ADMIN', 'OPERATOR', 'ANALYST'], path: '/stats/ranking' },
  { key: 'rules', section: 'risk', label: '规则管理', subtitle: '规则配置、发布与回滚', roles: ['SUPER_ADMIN', 'RISK_ADMIN'], path: '/rules' },
  { key: 'audit', section: 'system', label: '审计日志', subtitle: '审计列表、详情与导出', roles: ['SUPER_ADMIN', 'SYS_ADMIN'], path: '/audit' },
  { key: 'health', section: 'system', label: '系统健康', subtitle: '健康概览与监控摘要', roles: ['SUPER_ADMIN', 'SYS_ADMIN'], path: '/system/health' },
  { key: 'services', section: 'system', label: '服务状态', subtitle: '服务探测状态与最近检查时间', roles: ['SUPER_ADMIN', 'SYS_ADMIN'], path: '/system/services' },
  { key: 'version', section: 'system', label: '版本信息', subtitle: '应用版本、构建时间与提交号', roles: ['SUPER_ADMIN', 'SYS_ADMIN'], path: '/system/version' },
]

const isPublicPage = computed(() => Boolean(route.meta.public))
const visibleNavItems = computed(() => {
  const availableItems = navItems.filter((item) => hasMenuAccess(item.roles))
  return availableItems.length ? availableItems : navItems.slice(0, 1)
})
const activeNavKey = computed(
  () =>
    visibleNavItems.value.find((item) => {
      if (!item.path) {
        return false
      }

      return item.path === '/' ? route.path === '/' : route.path.startsWith(item.path)
    })?.key || '',
)
const currentNavItem = computed(
  () => visibleNavItems.value.find((item) => item.key === activeNavKey.value) || visibleNavItems.value[0],
)
const navSections = computed(() => [
  { key: 'ops', label: '运营工作台', items: visibleNavItems.value.filter((item) => item.section === 'ops') },
  { key: 'risk', label: '风控配置台', items: visibleNavItems.value.filter((item) => item.section === 'risk') },
  { key: 'system', label: '系统管理台', items: visibleNavItems.value.filter((item) => item.section === 'system') },
].filter((section) => section.items.length))
const showRealtimeStatus = computed(() => authStore.isAuthenticated && !isPublicPage.value)
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

watch(
  () => authStore.isAuthenticated,
  (isAuthenticated) => {
    if (isAuthenticated) {
      realtimeStore.ensureConnected()
      return
    }

    realtimeStore.disconnect()
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  realtimeStore.disconnect()
})

function hasMenuAccess(roles: UserRole[]): boolean {
  return authStore.hasAnyRole(roles)
}

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

function handleNavigate(item: NavItem): void {
  if (!item.path || item.path === route.path) {
    return
  }

  router.push(item.path)
}

function handleReconnect(): void {
  realtimeStore.reconnect()
}
</script>

<template>
  <RouterView v-if="isPublicPage" />

  <div v-else class="app-shell">
    <aside class="global-nav">
      <div class="brand-panel">
        <p class="brand-mark">DriveWeb</p>
        <strong>风控运营管理台</strong>
      </div>

      <div v-for="section in navSections" :key="section.key" class="nav-group">
        <p class="nav-title">{{ section.label }}</p>
        <button
          v-for="item in section.items"
          :key="item.key"
          class="nav-item"
          :class="{ active: item.key === activeNavKey }"
          @click="handleNavigate(item)"
        >
          <span class="nav-label">{{ item.label }}</span>
          <span class="nav-sub">{{ item.subtitle }}</span>
        </button>
      </div>

      <div class="nav-foot">
        <span>当前角色</span>
        <strong>{{ authStore.roleText }}</strong>
      </div>
    </aside>

    <section class="workspace">
      <header class="global-head">
        <div class="head-main">
          <div class="head-breadcrumb">
            <span>风控运营管理台</span>
            <span class="separator">/</span>
            <span>{{ currentNavItem?.label || '工作区' }}</span>
          </div>
          <div class="head-title">
            <h1>{{ currentNavItem?.label || '风控运营管理台' }}</h1>
            <p>{{ currentNavItem?.subtitle || '面向运营、风控与系统运维的分域管理前端。' }}</p>
          </div>
        </div>

        <div class="user-wrap">
          <div v-if="showRealtimeStatus" class="realtime-status">
            <el-tag size="small" effect="plain" :type="realtimeStore.statusTagType">{{ realtimeStore.statusText }}</el-tag>
            <span>{{ realtimeHint }}</span>
            <el-button
              v-if="realtimeStore.status !== 'connected'"
              link
              type="primary"
              @click="handleReconnect"
            >
              重连
            </el-button>
          </div>

          <div class="user-meta">
            <p class="name">{{ authStore.username || '未登录用户' }}</p>
            <p class="role">{{ authStore.roleText }}</p>
          </div>
          <el-button plain @click="handleLogout">退出</el-button>
        </div>
      </header>

      <main class="global-main">
        <RouterView />
      </main>
    </section>
  </div>
</template>

<style scoped>
.app-shell {
  min-height: 100vh;
  display: grid;
  grid-template-columns: 240px minmax(0, 1fr);
  background: #0f1720;
}

.global-nav {
  display: grid;
  align-content: start;
  gap: 18px;
  padding: 18px 14px;
  border-right: 1px solid rgba(255, 255, 255, 0.06);
  background: #111827;
}

.brand-panel {
  display: grid;
  gap: 4px;
  padding: 6px 10px 14px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.brand-mark {
  margin: 0;
  font-size: 11px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgba(148, 163, 184, 0.7);
}

.brand-panel strong {
  color: #f8fafc;
  font-size: 18px;
  font-weight: 600;
}

.nav-group {
  display: grid;
  gap: 6px;
}

.nav-title {
  margin: 0 10px 4px;
  color: rgba(148, 163, 184, 0.8);
  font-size: 12px;
  text-transform: uppercase;
}

.nav-item {
  border: 1px solid transparent;
  background: transparent;
  border-radius: 8px;
  padding: 10px 12px;
  text-align: left;
  cursor: pointer;
  display: grid;
  gap: 2px;
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.04);
}

.nav-item.active {
  background: rgba(59, 130, 246, 0.18);
  border-color: rgba(59, 130, 246, 0.34);
}

.nav-label {
  color: rgba(241, 245, 249, 0.96);
  font-size: 14px;
  font-weight: 500;
}

.nav-sub {
  color: rgba(148, 163, 184, 0.82);
  font-size: 12px;
  line-height: 1.4;
}

.nav-foot {
  margin-top: auto;
  display: grid;
  gap: 4px;
  padding: 12px 10px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.nav-foot span {
  color: rgba(148, 163, 184, 0.8);
  font-size: 12px;
}

.nav-foot strong {
  color: #f8fafc;
  font-size: 14px;
}

.workspace {
  min-width: 0;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  background: #f5f7fa;
}

.global-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
  padding: 18px 22px 14px;
  background: #f5f7fa;
  border-bottom: 1px solid #e5e7eb;
}

.head-main {
  min-width: 0;
  display: grid;
  gap: 6px;
}

.head-breadcrumb {
  display: flex;
  gap: 8px;
  color: #6b7280;
  font-size: 12px;
}

.separator {
  color: #9ca3af;
}

.head-title h1 {
  margin: 0;
  color: #111827;
  font-size: 26px;
  font-weight: 600;
}

.head-title p {
  margin: 4px 0 0;
  color: #6b7280;
  font-size: 14px;
  line-height: 1.5;
}

.user-wrap {
  display: flex;
  align-items: center;
  gap: 12px;
}

.realtime-status {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #ffffff;
  color: #6b7280;
  font-size: 13px;
}

.user-meta {
  text-align: right;
}

.name {
  margin: 0;
  color: #111827;
  font-size: 14px;
  font-weight: 600;
}

.role {
  margin: 2px 0 0;
  color: #6b7280;
  font-size: 12px;
}

.global-main {
  min-width: 0;
  padding: 20px 22px 24px;
}

@media (max-width: 960px) {
  .app-shell {
    grid-template-columns: 1fr;
  }

  .global-nav {
    gap: 12px;
    border-right: 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  }

  .nav-group {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .nav-title {
    grid-column: 1 / -1;
  }
}

@media (max-width: 720px) {
  .global-head {
    flex-direction: column;
  }

  .user-wrap {
    width: 100%;
    flex-direction: column;
    align-items: stretch;
  }

  .user-meta {
    text-align: left;
  }

  .realtime-status {
    flex-wrap: wrap;
  }

  .global-main {
    padding: 16px;
  }

  .nav-group {
    grid-template-columns: 1fr;
  }
}
</style>

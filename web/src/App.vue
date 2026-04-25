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
  {
    key: 'overview',
    label: '实时总览',
    subtitle: '实时态势与连接',
    roles: ['ADMIN', 'OPERATOR', 'VIEWER'],
    path: '/',
  },
  {
    key: 'alerts',
    label: '告警中心',
    subtitle: '筛选与处置',
    roles: ['ADMIN', 'OPERATOR', 'VIEWER'],
    path: '/alerts',
  },
  {
    key: 'trend',
    label: '趋势分析',
    subtitle: '多条件趋势洞察',
    roles: ['ADMIN', 'OPERATOR', 'VIEWER'],
    path: '/stats/trend',
  },
  {
    key: 'ranking',
    label: '风险排行',
    subtitle: '车辆与司机排行',
    roles: ['ADMIN', 'OPERATOR', 'VIEWER'],
    path: '/stats/ranking',
  },
  {
    key: 'rules',
    label: '规则管理',
    subtitle: '规则配置与启停',
    roles: ['ADMIN'],
    path: undefined,
  },
  {
    key: 'audit',
    label: '审计状态',
    subtitle: '审计与系统观测',
    roles: ['ADMIN', 'OPERATOR'],
    path: undefined,
  },
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
const showRealtimeStatus = computed(() => authStore.isAuthenticated && !isPublicPage.value)
const realtimeHint = computed(() => {
  if (realtimeStore.status === 'connected' && realtimeStore.lastMessageAt) {
    return `最近消息 ${formatDateTime(realtimeStore.lastMessageAt)}`
  }

  if (realtimeStore.status === 'disconnected') {
    return '实时更新已中断，可手动重连或刷新页面'
  }

  if (realtimeStore.status === 'reconnecting') {
    return '正在自动重连，不影响手动查询'
  }

  return '告警列表与详情页会自动消费实时更新'
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
  if (authStore.hasRole('ADMIN')) {
    return true
  }

  return roles.some((role) => authStore.hasRole(role))
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
    <header class="global-head">
      <div class="brand-wrap">
        <p class="brand-mark">DriveWeb</p>
        <h1>疲劳与分心风险运营平台</h1>
      </div>

      <div class="user-wrap">
        <div v-if="showRealtimeStatus" class="realtime-status">
          <el-tag effect="plain" :type="realtimeStore.statusTagType">{{ realtimeStore.statusText }}</el-tag>
          <p class="realtime-hint">{{ realtimeHint }}</p>
          <el-button
            v-if="realtimeStore.status !== 'connected'"
            link
            type="primary"
            @click="handleReconnect"
          >
            重新连接
          </el-button>
        </div>

        <div class="user-meta">
          <p class="name">{{ authStore.username || '未登录用户' }}</p>
          <p class="role">{{ authStore.roleText }}</p>
        </div>
        <el-button type="danger" plain @click="handleLogout">退出登录</el-button>
      </div>
    </header>

    <div class="global-body">
      <aside class="global-nav">
        <p class="nav-title">导航</p>
        <button
          v-for="item in visibleNavItems"
          :key="item.key"
          class="nav-item"
          :class="{ active: item.key === activeNavKey }"
          :disabled="!item.path"
          @click="handleNavigate(item)"
        >
          <span class="nav-label">{{ item.label }}</span>
          <span class="nav-sub">{{ item.path ? item.subtitle : `${item.subtitle}（待开发）` }}</span>
        </button>
      </aside>

      <main class="global-main">
        <RouterView />
      </main>
    </div>
  </div>
</template>

<style scoped>
.app-shell {
  min-height: 100vh;
  padding: 14px;
  display: grid;
  grid-template-rows: auto 1fr;
  gap: 14px;
}

.global-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 18px 22px;
  border: 1px solid #d2e1de;
  border-radius: 18px;
  background: linear-gradient(110deg, rgba(240, 250, 246, 0.94), rgba(235, 244, 255, 0.92));
  box-shadow: 0 14px 26px rgba(13, 66, 77, 0.08);
}

.brand-wrap h1 {
  margin: 8px 0 0;
  font-size: 24px;
  line-height: 1.25;
  color: #133a41;
}

.brand-mark {
  margin: 0;
  font-size: 12px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: #116b57;
  font-weight: 700;
}

.user-wrap {
  display: flex;
  align-items: center;
  gap: 14px;
}

.realtime-status {
  min-width: 0;
  display: grid;
  justify-items: end;
  gap: 4px;
}

.realtime-hint {
  margin: 0;
  font-size: 12px;
  color: #5f7a81;
}

.user-meta {
  text-align: right;
}

.name {
  margin: 0;
  font-weight: 700;
  color: #153a40;
}

.role {
  margin: 2px 0 0;
  font-size: 13px;
  color: #5d7a81;
}

.global-body {
  min-height: 0;
  display: grid;
  grid-template-columns: 240px minmax(0, 1fr);
  gap: 14px;
}

.global-nav {
  border: 1px solid #d2e1de;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.9);
  padding: 16px 14px;
  display: grid;
  align-content: start;
  gap: 8px;
}

.nav-title {
  margin: 0 4px 10px;
  color: #5f7a81;
  font-size: 13px;
  letter-spacing: 0.06em;
}

.nav-item {
  border: 1px solid #dfebea;
  background: #f8fbfb;
  border-radius: 12px;
  padding: 10px 12px;
  text-align: left;
  cursor: pointer;
  display: grid;
  gap: 3px;
  transition: all 0.18s ease;
}

.nav-item:hover:not(:disabled) {
  transform: translateY(-1px);
  border-color: #b8d8d3;
  background: #f0f8f6;
}

.nav-item.active {
  border-color: #7bc4b6;
  background: linear-gradient(140deg, #e8f7f3, #edf4ff);
}

.nav-item:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.nav-label {
  font-weight: 700;
  color: #164149;
}

.nav-sub {
  font-size: 12px;
  color: #617e85;
}

.global-main {
  min-width: 0;
  min-height: 0;
  border: 1px solid #d2e1de;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.78);
  overflow: auto;
}

@media (max-width: 980px) {
  .global-head {
    flex-direction: column;
    align-items: flex-start;
  }

  .user-wrap {
    width: 100%;
    justify-content: space-between;
    flex-wrap: wrap;
  }

  .user-meta {
    text-align: left;
  }

  .realtime-status {
    justify-items: start;
    width: 100%;
  }

  .global-body {
    grid-template-columns: 1fr;
  }

  .global-nav {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    align-items: stretch;
  }

  .nav-title {
    grid-column: 1 / -1;
  }
}

@media (max-width: 640px) {
  .app-shell {
    padding: 10px;
  }

  .global-head,
  .global-main,
  .global-nav {
    border-radius: 14px;
  }

  .brand-wrap h1 {
    font-size: 20px;
  }

  .global-nav {
    grid-template-columns: 1fr;
  }
}
</style>

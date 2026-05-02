<script setup lang="ts">
import { computed } from 'vue'
import { riskLevelLabelMap, statusLabelMap } from '../../types/alerts'
import type {
  WorkspaceAlertFeedItem,
  WorkspaceNavEntry,
  WorkspaceRealtimeSummary,
  WorkspaceSessionSummary,
  WorkspaceVisitedEntry,
} from '../../types/workspace'
import {
  formatDateTime,
  getRiskTagType,
  getStatusTagType,
} from '../../utils/alerts'

const props = defineProps<{
  modelValue: boolean
  favorites: WorkspaceNavEntry[]
  recentVisits: WorkspaceVisitedEntry[]
  pinnedPaths: string[]
  recentAlerts: WorkspaceAlertFeedItem[]
  sessionSummary: WorkspaceSessionSummary
  realtimeSummary: WorkspaceRealtimeSummary
  showRealtime: boolean
  showAlerts: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  navigate: [path: string]
  'toggle-pin': [path: string]
  'open-session': []
  reconnect: []
  'open-alert': [alertId: number]
}>()

const pinnedPathSet = computed(() => new Set(props.pinnedPaths))

function handleVisibility(value: boolean): void {
  emit('update:modelValue', value)
}

function isPinned(path: string): boolean {
  return pinnedPathSet.value.has(path)
}

function handleNavigate(path: string): void {
  emit('navigate', path)
}

function handleTogglePin(path: string): void {
  emit('toggle-pin', path)
}

function formatMinutesLeft(value: number | null): string {
  if (value === null) {
    return '会话时长未知'
  }

  if (value < 0) {
    return '会话已过期'
  }

  return `剩余 ${value} 分钟`
}

function getAlertEventText(eventType: WorkspaceAlertFeedItem['eventType']): string {
  return eventType === 'ALERT_CREATED' ? '收到新的实时告警，点击查看详情。' : '告警状态已更新，点击查看详情。'
}
</script>

<template>
  <el-drawer
    :model-value="modelValue"
    size="420px"
    append-to-body
    @update:model-value="handleVisibility"
  >
    <template #header>
      <div class="drawer-head">
        <div>
          <strong>工作台</strong>
          <p>集中处理常用入口、会话状态与实时动态。</p>
        </div>
      </div>
    </template>

    <div class="drawer-body">
      <section class="summary-grid">
        <article class="summary-card">
          <span class="summary-label">当前用户</span>
          <strong>{{ sessionSummary.username || '未登录用户' }}</strong>
          <p>{{ sessionSummary.roleText }} · {{ sessionSummary.scopeText }}</p>
        </article>

        <article class="summary-card" :class="{ warning: sessionSummary.willExpireSoon }">
          <span class="summary-label">登录会话</span>
          <strong>{{ formatMinutesLeft(sessionSummary.minutesLeft) }}</strong>
          <p>{{ sessionSummary.expireAtText }}</p>
        </article>
      </section>

      <el-card class="workspace-card" shadow="never">
        <template #header>
          <div class="card-head">
            <div>
              <strong>会话与通道</strong>
              <p>统一查看登录时效与实时连接状态。</p>
            </div>

            <div class="card-actions">
              <el-button link type="primary" @click="$emit('open-session')">会话详情</el-button>
              <el-button
                v-if="showRealtime && realtimeSummary.canReconnect"
                link
                type="primary"
                @click="$emit('reconnect')"
              >
                重新连接
              </el-button>
            </div>
          </div>
        </template>

        <div class="status-list">
          <div class="status-item">
            <span>登录状态</span>
            <strong>{{ sessionSummary.willExpireSoon ? '待续期' : '正常' }}</strong>
          </div>

          <div class="status-item">
            <span>过期时间</span>
            <strong>{{ sessionSummary.expireAtText }}</strong>
          </div>

          <div v-if="showRealtime" class="status-item">
            <span>实时通道</span>
            <strong>{{ realtimeSummary.statusText }}</strong>
          </div>

          <p v-if="showRealtime" class="status-note">{{ realtimeSummary.hint }}</p>
        </div>
      </el-card>

      <el-card class="workspace-card" shadow="never">
        <template #header>
          <div class="card-head">
            <div>
              <strong>收藏入口</strong>
              <p>把高频模块固定在工作台和命令面板顶部。</p>
            </div>
          </div>
        </template>

        <div v-if="favorites.length" class="list-stack">
          <article v-for="item in favorites" :key="item.path" class="list-item">
            <button type="button" class="list-item-main" @click="handleNavigate(item.path)">
              <span class="item-badge">{{ item.badge }}</span>
              <div>
                <strong>{{ item.label }}</strong>
                <p>{{ item.subtitle }}</p>
              </div>
            </button>

            <el-button link @click="handleTogglePin(item.path)">移除</el-button>
          </article>
        </div>

        <el-empty v-else description="还没有收藏入口，可从导航或最近访问中固定常用模块。" />
      </el-card>

      <el-card class="workspace-card" shadow="never">
        <template #header>
          <div class="card-head">
            <div>
              <strong>最近访问</strong>
              <p>保留最近打开的模块，减少来回跳转。</p>
            </div>
          </div>
        </template>

        <div v-if="recentVisits.length" class="list-stack">
          <article v-for="item in recentVisits" :key="item.path" class="list-item compact">
            <button type="button" class="list-item-main" @click="handleNavigate(item.path)">
              <div>
                <strong>{{ item.label }}</strong>
                <p>{{ item.subtitle || '最近打开的工作项' }}</p>
              </div>
            </button>

            <el-button link type="primary" @click="handleTogglePin(item.path)">
              {{ isPinned(item.path) ? '取消收藏' : '收藏' }}
            </el-button>
          </article>
        </div>

        <el-empty v-else description="访问过的模块会自动出现在这里。" />
      </el-card>

      <el-card v-if="showAlerts" class="workspace-card" shadow="never">
        <template #header>
          <div class="card-head">
            <div>
              <strong>实时告警流</strong>
              <p>展示最近收到的告警事件，便于从后台直接追踪处理。</p>
            </div>
          </div>
        </template>

        <div v-if="recentAlerts.length" class="alert-stack">
          <article v-for="item in recentAlerts" :key="item.id" class="alert-item">
            <button type="button" class="list-item-main" @click="$emit('open-alert', item.id)">
              <div class="alert-head">
                <strong>{{ item.alertNo }}</strong>
                <span>{{ formatDateTime(item.eventAt) }}</span>
              </div>

              <div class="alert-meta">
                <el-tag size="small" effect="plain" :type="getRiskTagType(item.riskLevel)">
                  {{ item.riskLevel ? riskLevelLabelMap[item.riskLevel] : '风险待定' }}
                </el-tag>

                <el-tag size="small" effect="plain" :type="getStatusTagType(item.status)">
                  {{ item.status !== null ? statusLabelMap[item.status] : '状态待定' }}
                </el-tag>
              </div>

              <p>{{ getAlertEventText(item.eventType) }}</p>
            </button>
          </article>
        </div>

        <el-empty v-else description="实时告警将在收到推送后显示在这里。" />
      </el-card>
    </div>
  </el-drawer>
</template>

<style scoped>
.drawer-head strong {
  color: #111827;
  font-size: 18px;
  font-weight: 700;
}

.drawer-head p {
  margin: 6px 0 0;
  color: #6b7280;
  font-size: 13px;
}

.drawer-body {
  display: grid;
  gap: 16px;
  padding-bottom: 20px;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.summary-card {
  padding: 16px;
  border: 1px solid #e4e7ec;
  border-radius: 16px;
  background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
}

.summary-card.warning {
  border-color: #fedf89;
  background: linear-gradient(180deg, #fffdf6 0%, #fff7e8 100%);
}

.summary-label {
  display: block;
  color: #667085;
  font-size: 12px;
  font-weight: 700;
}

.summary-card strong {
  display: block;
  margin-top: 10px;
  color: #111827;
  font-size: 18px;
  line-height: 1.35;
}

.summary-card p {
  margin: 8px 0 0;
  color: #6b7280;
  font-size: 13px;
  line-height: 1.5;
}

.workspace-card {
  border-radius: 16px;
}

.card-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.card-head strong {
  color: #111827;
  font-size: 15px;
  font-weight: 700;
}

.card-head p {
  margin: 4px 0 0;
  color: #6b7280;
  font-size: 12px;
}

.card-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.status-list {
  display: grid;
  gap: 10px;
}

.status-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 12px;
  background: #f8fafc;
}

.status-item span {
  color: #667085;
  font-size: 12px;
}

.status-item strong {
  color: #111827;
  font-size: 13px;
  font-weight: 600;
  text-align: right;
}

.status-note {
  margin: 0;
  color: #667085;
  font-size: 12px;
  line-height: 1.5;
}

.list-stack,
.alert-stack {
  display: grid;
  gap: 12px;
}

.list-item,
.alert-item {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 14px;
  border: 1px solid #e4e7ec;
  border-radius: 14px;
  background: #ffffff;
}

.list-item.compact {
  align-items: center;
}

.list-item-main {
  min-width: 0;
  flex: 1;
  border: 0;
  background: transparent;
  padding: 0;
  cursor: pointer;
  text-align: left;
}

.list-item-main strong {
  color: #111827;
  font-size: 14px;
  font-weight: 600;
}

.list-item-main p {
  margin: 6px 0 0;
  color: #6b7280;
  font-size: 12px;
  line-height: 1.5;
}

.item-badge {
  display: inline-grid;
  width: 30px;
  height: 30px;
  margin-right: 10px;
  place-items: center;
  border-radius: 10px;
  background: #eef4ff;
  color: #2f5fc4;
  font-size: 13px;
  font-weight: 700;
  vertical-align: top;
}

.alert-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.alert-head span {
  color: #98a2b3;
  font-size: 12px;
  flex-shrink: 0;
}

.alert-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
}

@media (max-width: 520px) {
  .summary-grid {
    grid-template-columns: 1fr;
  }

  .card-head,
  .list-item,
  .alert-item {
    flex-direction: column;
  }

  .card-actions {
    width: 100%;
    justify-content: flex-start;
  }
}
</style>

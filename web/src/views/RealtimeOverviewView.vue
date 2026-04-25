<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import type { EChartsOption } from 'echarts'
import EChartPanel from '../components/EChartPanel.vue'
import { getRealtimeOverview } from '../api/stats'
import { useAuthStore } from '../stores/auth'
import { useRealtimeStore } from '../stores/realtime'
import { riskLevelLabelMap, statusLabelMap, type NormalizedAlertRealtimeEvent } from '../types/alerts'
import type { OverviewLatestAlertItem, RealtimeOverviewData } from '../types/stats'
import { formatDateTime, getRiskTagType, getStatusTagType } from '../utils/alerts'
import { formatCompactDateTime } from '../utils/stats'

const router = useRouter()
const authStore = useAuthStore()
const realtimeStore = useRealtimeStore()
authStore.hydrate()

const overview = ref<RealtimeOverviewData | null>(null)
const loading = ref(false)
const moduleError = ref('')
const lastRefreshAt = ref('')
const streamAlerts = ref<OverviewLatestAlertItem[]>([])
let pollTimer: number | null = null
let unsubscribeRealtime: (() => void) | null = null

const distributionChartOption = computed<EChartsOption>(() => ({
  tooltip: {
    trigger: 'item',
  },
  color: ['#85c1b3', '#f1ab55', '#db6558'],
  legend: {
    bottom: 0,
  },
  series: [
    {
      name: '风险分布',
      type: 'pie',
      radius: ['48%', '72%'],
      label: {
        formatter: '{b}\n{c}',
      },
      data: (overview.value?.riskDistribution || []).map((item) => ({
        name: riskLevelLabelMap[item.riskLevel],
        value: item.count,
      })),
    },
  ],
}))

const distributionEmpty = computed(() =>
  !overview.value?.riskDistribution?.some((item) => Number(item.count) > 0),
)
const distributionError = computed(() => (!overview.value ? moduleError.value : ''))
const onlineDeviceCount = computed(() =>
  typeof overview.value?.onlineDeviceCount === 'number' ? String(overview.value.onlineDeviceCount) : '-',
)
const activeRiskVehicleCount = computed(() =>
  typeof overview.value?.activeRiskVehicleCount === 'number'
    ? String(overview.value.activeRiskVehicleCount)
    : '-',
)
const handledRateText = computed(() => {
  const total = overview.value?.alertCountLast5Minutes || 0
  const handled = overview.value?.handledCountLast5Minutes || 0

  if (!total) {
    return '0%'
  }

  return `${((handled / total) * 100).toFixed(0)}%`
})
const riskSummaryItems = computed(() => {
  const data = overview.value

  return [
    {
      label: '观测窗口',
      value:
        data?.windowStartTime && data?.windowEndTime
          ? `${formatCompactDateTime(data.windowStartTime)} - ${formatCompactDateTime(data.windowEndTime)}`
          : '-',
    },
    {
      label: '高风险告警',
      value: `${data?.highRiskCountLast5Minutes ?? 0} 条`,
    },
    {
      label: '已处置占比',
      value: handledRateText.value,
    },
  ]
})
const healthRows = computed(() => {
  const rows = [
    realtimeStore.status === 'disconnected' ? '实时通道已断开，当前依赖手动重连或轮询刷新。' : '',
    realtimeStore.lastError ? `最近连接异常：${realtimeStore.lastError}` : '',
    (overview.value?.highRiskCountLast5Minutes || 0) > (overview.value?.handledCountLast5Minutes || 0)
      ? `高风险积压 ${Math.max(
          0,
          (overview.value?.highRiskCountLast5Minutes || 0) -
            (overview.value?.handledCountLast5Minutes || 0),
        )} 条。`
      : '',
    moduleError.value ? `总览接口异常：${moduleError.value}` : '',
  ]

  return rows.filter(Boolean)
})

onMounted(async () => {
  unsubscribeRealtime = realtimeStore.subscribe((event) => {
    handleRealtimeEvent(event)
  })
  await fetchOverview(true)
  pollTimer = window.setInterval(() => {
    void fetchOverview(false)
  }, 30000)
})

onBeforeUnmount(() => {
  if (pollTimer !== null) {
    window.clearInterval(pollTimer)
    pollTimer = null
  }

  unsubscribeRealtime?.()
  unsubscribeRealtime = null
})

async function fetchOverview(showLoading: boolean): Promise<void> {
  if (showLoading && !overview.value) {
    loading.value = true
  }

  try {
    const data = await getRealtimeOverview({}, { silentError: true })
    overview.value = data
    streamAlerts.value = mergeLatestAlerts(data.latestAlerts, streamAlerts.value)
    moduleError.value = ''
    lastRefreshAt.value = new Date().toISOString()
  } catch (error) {
    moduleError.value = error instanceof Error ? error.message : '总览数据加载失败'
  } finally {
    loading.value = false
  }
}

function handleRealtimeEvent(event: NormalizedAlertRealtimeEvent): void {
  const nextItem = toOverviewAlertItem(event)

  if (!nextItem) {
    return
  }

  streamAlerts.value = mergeLatestAlerts([nextItem], streamAlerts.value)
}

function handleOpenAlert(item: OverviewLatestAlertItem): void {
  router.push({
    name: 'alert-detail',
    params: { id: String(item.id) },
  })
}

function mergeLatestAlerts(
  incoming: OverviewLatestAlertItem[],
  current: OverviewLatestAlertItem[],
): OverviewLatestAlertItem[] {
  const merged = new Map<number, OverviewLatestAlertItem>()

  for (const item of [...incoming, ...current]) {
    if (!item?.id) {
      continue
    }

    merged.set(item.id, item)
  }

  return [...merged.values()]
    .sort((left, right) => Date.parse(right.triggerTime) - Date.parse(left.triggerTime))
    .slice(0, 8)
}

function toOverviewAlertItem(event: NormalizedAlertRealtimeEvent): OverviewLatestAlertItem | null {
  const payload = event.payload

  if (!payload.alertNo || !payload.triggerTime || payload.riskLevel === undefined || payload.status === undefined) {
    return null
  }

  return {
    id: event.alertId,
    alertNo: payload.alertNo,
    fleetId: payload.fleetId,
    vehicleId: payload.vehicleId,
    driverId: payload.driverId,
    riskLevel: payload.riskLevel,
    status: payload.status,
    riskScore: payload.riskScore,
    triggerTime: payload.triggerTime,
  }
}
</script>

<template>
  <div class="overview-page">
    <div class="page-head">
      <div>
        <p class="eyebrow">Overview</p>
        <h1>实时总览</h1>
        <p class="subhead">聚合最近 5 分钟态势、最新告警流与实时连接状态。</p>
      </div>

      <div class="head-meta">
        <el-tag effect="plain" :type="realtimeStore.statusTagType">{{ realtimeStore.statusText }}</el-tag>
        <span>最近刷新 {{ formatDateTime(lastRefreshAt || overview?.lastUpdatedAt) }}</span>
      </div>
    </div>

    <section class="kpi-grid">
      <el-card class="metric-card" shadow="never">
        <p class="metric-label">在线设备数</p>
        <strong>{{ onlineDeviceCount }}</strong>
        <span>仅展示后端返回值</span>
      </el-card>

      <el-card class="metric-card" shadow="never">
        <p class="metric-label">活跃风险车辆数</p>
        <strong>{{ activeRiskVehicleCount }}</strong>
        <span>仅展示后端返回值</span>
      </el-card>

      <el-card class="metric-card" shadow="never">
        <p class="metric-label">近 5 分钟告警数</p>
        <strong>{{ overview?.alertCountLast5Minutes ?? 0 }}</strong>
        <span>已处置 {{ overview?.handledCountLast5Minutes ?? 0 }} 条</span>
      </el-card>

      <el-card class="metric-card" shadow="never">
        <p class="metric-label">WebSocket 状态</p>
        <strong>{{ realtimeStore.statusText }}</strong>
        <span>{{ realtimeStore.lastMessageAt ? `最近消息 ${formatDateTime(realtimeStore.lastMessageAt)}` : '等待实时消息' }}</span>
      </el-card>
    </section>

    <section class="content-grid">
      <el-card class="panel-card" shadow="never">
        <template #header>
          <div class="card-title">风险等级分布</div>
        </template>

        <EChartPanel
          :option="distributionChartOption"
          :loading="loading"
          :error="distributionError"
          :empty="distributionEmpty"
        />
      </el-card>

      <el-card class="panel-card" shadow="never">
        <template #header>
          <div class="card-title">最新告警流</div>
        </template>

        <div v-if="streamAlerts.length" class="stream-list">
          <button
            v-for="item in streamAlerts"
            :key="item.id"
            class="stream-item"
            @click="handleOpenAlert(item)"
          >
            <div>
              <strong>{{ item.alertNo }}</strong>
              <p>{{ item.vehicleId || '-' }} / {{ item.driverId || '-' }}</p>
            </div>

            <div class="stream-meta">
              <el-tag :type="getRiskTagType(item.riskLevel)">{{ riskLevelLabelMap[item.riskLevel] }}</el-tag>
              <el-tag effect="plain" :type="getStatusTagType(item.status)">{{ statusLabelMap[item.status] }}</el-tag>
              <span>{{ formatCompactDateTime(item.triggerTime) }}</span>
            </div>
          </button>
        </div>
        <el-empty v-else :description="loading ? '加载中…' : '无符合条件数据'" />
      </el-card>

      <el-card class="panel-card summary-card" shadow="never">
        <template #header>
          <div class="card-title">重点风险摘要</div>
        </template>

        <div class="summary-list">
          <div v-for="item in riskSummaryItems" :key="item.label" class="summary-item">
            <span>{{ item.label }}</span>
            <strong>{{ item.value }}</strong>
          </div>
        </div>
      </el-card>
    </section>

    <section class="health-grid">
      <el-card class="panel-card" shadow="never">
        <template #header>
          <div class="card-title">系统异常摘要</div>
        </template>

        <el-empty v-if="healthRows.length === 0" description="当前未发现显著异常" />
        <ul v-else class="health-list">
          <li v-for="item in healthRows" :key="item">{{ item }}</li>
        </ul>
      </el-card>

      <el-card class="panel-card" shadow="never">
        <template #header>
          <div class="card-title">连接与会话状态</div>
        </template>

        <div class="info-list">
          <p><span>当前用户</span>{{ authStore.username || '-' }}</p>
          <p><span>当前角色</span>{{ authStore.roleText }}</p>
          <p><span>连接状态</span>{{ realtimeStore.statusText }}</p>
          <p><span>Token 过期</span>{{ authStore.expireAtText }}</p>
        </div>
      </el-card>

      <el-card class="panel-card" shadow="never">
        <template #header>
          <div class="card-title">刷新信息</div>
        </template>

        <div class="info-list">
          <p><span>接口刷新</span>{{ formatDateTime(lastRefreshAt || overview?.lastUpdatedAt) }}</p>
          <p><span>最近消息</span>{{ formatDateTime(realtimeStore.lastMessageAt) }}</p>
          <p><span>重连次数</span>{{ realtimeStore.reconnectAttempt }}</p>
          <p><span>窗口结束</span>{{ formatDateTime(overview?.windowEndTime) }}</p>
        </div>
      </el-card>
    </section>
  </div>
</template>

<style scoped>
.overview-page {
  width: min(1280px, 100%);
  margin: 0 auto;
  padding: 26px 24px 34px;
  display: grid;
  gap: 16px;
}

.page-head,
.head-meta,
.kpi-grid,
.content-grid,
.health-grid {
  display: grid;
  gap: 16px;
}

.page-head {
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: end;
}

.head-meta {
  justify-items: end;
  color: #607c82;
  font-size: 13px;
}

.eyebrow {
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  font-weight: 700;
  font-size: 12px;
  color: #0f755f;
}

h1 {
  margin: 8px 0 6px;
  font-size: 30px;
  line-height: 1.25;
  color: #12363f;
}

.subhead {
  margin: 0;
  color: #58737b;
}

.kpi-grid {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.content-grid {
  grid-template-columns: 1.2fr 1fr 0.84fr;
}

.health-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.panel-card,
.metric-card {
  border-radius: 16px;
  border: 1px solid #d7e5e2;
  background: rgba(255, 255, 255, 0.9);
}

.metric-card strong {
  display: block;
  margin-top: 12px;
  font-size: 30px;
  color: #143d45;
}

.metric-card span {
  display: block;
  margin-top: 8px;
  color: #628087;
  font-size: 13px;
}

.metric-label,
.card-title {
  margin: 0;
  font-weight: 700;
  color: #184148;
}

.stream-list,
.summary-list,
.info-list {
  display: grid;
  gap: 12px;
}

.stream-item {
  width: 100%;
  border: 1px solid #dfeae8;
  border-radius: 12px;
  padding: 12px 14px;
  background: #f7fbfa;
  text-align: left;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 12px;
  cursor: pointer;
}

.stream-item strong {
  color: #173d45;
}

.stream-item p {
  margin: 6px 0 0;
  color: #658086;
}

.stream-meta {
  min-width: 110px;
  display: grid;
  justify-items: end;
  align-content: start;
  gap: 6px;
  color: #607b82;
  font-size: 12px;
}

.summary-item,
.info-list p {
  margin: 0;
  padding: 12px 14px;
  border: 1px solid #e1ece9;
  border-radius: 12px;
  background: #f8fbfb;
  display: grid;
  gap: 6px;
}

.summary-item span,
.info-list p span {
  color: #69858a;
  font-size: 13px;
}

.summary-item strong,
.info-list p {
  color: #294f56;
}

.health-list {
  margin: 0;
  padding-left: 18px;
  display: grid;
  gap: 10px;
  color: #32575e;
}

@media (max-width: 1180px) {
  .content-grid,
  .health-grid,
  .kpi-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 760px) {
  .overview-page {
    padding: 20px 16px 26px;
  }

  .page-head,
  .content-grid,
  .health-grid,
  .kpi-grid {
    grid-template-columns: 1fr;
  }

  .head-meta {
    justify-items: start;
  }
}
</style>

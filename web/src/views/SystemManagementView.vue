<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import PageSectionCard from '../components/PageSectionCard.vue'
import WorkspacePageHeader from '../components/layout/WorkspacePageHeader.vue'
import IncidentSummaryCard from '../components/system/IncidentSummaryCard.vue'
import MessageLinkCard from '../components/system/MessageLinkCard.vue'
import ServiceStatusCard from '../components/system/ServiceStatusCard.vue'
import SystemHealthCard from '../components/system/SystemHealthCard.vue'
import VersionInfoCard from '../components/system/VersionInfoCard.vue'
import {
  getServiceStatus,
  getSystemErrorTrace,
  getSystemErrorTraces,
  getSystemHealth,
  getSystemMonitoring,
  getSystemSummary,
  getVersionInfo,
} from '../api/system'
import type {
  ServiceStatusItem,
  SystemErrorTraceItem,
  SystemHealthSnapshot,
  SystemMonitoringSnapshot,
  SystemSummarySnapshot,
  VersionInfoItem,
} from '../types/system'
import { clearErrorTraceRecords, listErrorTraceRecords, type ErrorTraceRecord } from '../utils/error-trace'
import { formatDateTime } from '../utils/time'

const route = useRoute()
const loading = ref(false)
const errorText = ref('')
const health = ref<SystemHealthSnapshot | null>(null)
const services = ref<ServiceStatusItem[]>([])
const monitoring = ref<SystemMonitoringSnapshot | null>(null)
const version = ref<VersionInfoItem | null>(null)
const summary = ref<SystemSummarySnapshot | null>(null)
const errorTraceRecords = ref<ErrorTraceRecord[]>([])
const serverErrorRecords = ref<SystemErrorTraceItem[]>([])
const serverErrorDetail = ref<SystemErrorTraceItem | null>(null)
const diagnosticsTraceId = ref('')
const diagnosticsPage = ref(1)
const diagnosticsSize = ref(10)
const diagnosticsTotal = ref(0)

const summaryItems = computed(() => [
  { label: '服务数量', value: services.value.length },
  { label: '打开告警数', value: monitoring.value?.openAlertCount ?? 0 },
  { label: '24小时告警', value: monitoring.value?.alertCount24h ?? 0 },
  { label: '启用规则', value: monitoring.value?.enabledRuleCount ?? 0 },
])
const currentSection = computed(() => {
  if (route.name === 'service-status') {
    return {
      title: '服务状态',
      description: '查看服务探测状态、最近检查时间与依赖运行情况。',
    }
  }

  if (route.name === 'version-info') {
    return {
      title: '版本信息',
      description: '查看应用版本、构建时间与交付版本信息。',
    }
  }

  if (route.name === 'system-diagnostics') {
    return {
      title: '问题排查',
      description: '查看最近接口异常、请求地址、状态码与追踪编号。',
    }
  }

  return {
    title: '系统健康',
    description: '查看健康概览、监控摘要和系统总体运行状态。',
  }
})

onMounted(async () => {
  refreshTraceRecords()
  await fetchData()
})

function refreshTraceRecords(): void {
  errorTraceRecords.value = listErrorTraceRecords()
}

function handleClearTraceRecords(): void {
  clearErrorTraceRecords()
  refreshTraceRecords()
}

async function fetchData(): Promise<void> {
  loading.value = true

  const [summaryResult, healthResult, servicesResult, monitoringResult, versionResult, diagnosticsResult] =
    await Promise.allSettled([
      getSystemSummary(),
      getSystemHealth(),
      getServiceStatus(),
      getSystemMonitoring(),
      getVersionInfo(),
      route.name === 'system-diagnostics'
        ? getSystemErrorTraces({
            page: diagnosticsPage.value,
            size: diagnosticsSize.value,
            traceId: diagnosticsTraceId.value.trim() || undefined,
          })
        : Promise.resolve(null),
    ])

  summary.value = summaryResult.status === 'fulfilled' ? summaryResult.value : null
  health.value =
    summaryResult.status === 'fulfilled'
      ? summaryResult.value.health
      : healthResult.status === 'fulfilled'
        ? healthResult.value
        : null
  services.value =
    summaryResult.status === 'fulfilled'
      ? summaryResult.value.services.items || []
      : servicesResult.status === 'fulfilled'
        ? servicesResult.value.items || []
        : []
  monitoring.value =
    summaryResult.status === 'fulfilled'
      ? summaryResult.value.monitoring
      : monitoringResult.status === 'fulfilled'
        ? monitoringResult.value
        : null
  version.value =
    summaryResult.status === 'fulfilled'
      ? summaryResult.value.version
      : versionResult.status === 'fulfilled'
        ? versionResult.value
        : null

  errorText.value =
    summaryResult.status === 'rejected' &&
    healthResult.status === 'rejected' &&
    servicesResult.status === 'rejected' &&
    monitoringResult.status === 'rejected' &&
    versionResult.status === 'rejected'
      ? '系统运维数据加载失败'
      : ''

  if (diagnosticsResult.status === 'fulfilled' && diagnosticsResult.value) {
    serverErrorRecords.value = diagnosticsResult.value.items || []
    diagnosticsTotal.value = diagnosticsResult.value.total || 0
    diagnosticsPage.value = diagnosticsResult.value.page || diagnosticsPage.value
    diagnosticsSize.value = diagnosticsResult.value.size || diagnosticsSize.value
  } else if (route.name === 'system-diagnostics') {
    serverErrorRecords.value = []
    diagnosticsTotal.value = 0
  }

  loading.value = false
}

async function handleTraceSearch(): Promise<void> {
  diagnosticsPage.value = 1
  serverErrorDetail.value = null
  await fetchData()

  const traceId = diagnosticsTraceId.value.trim()
  if (!traceId) {
    return
  }

  try {
    serverErrorDetail.value = await getSystemErrorTrace(traceId)
  } catch {
    serverErrorDetail.value = null
  }
}

function resetTraceSearch(): void {
  diagnosticsTraceId.value = ''
  diagnosticsPage.value = 1
  serverErrorDetail.value = null
  fetchData()
}

function handleDiagnosticsPageChange(page: number): void {
  diagnosticsPage.value = page
  fetchData()
}

function formatRequestPath(row: SystemErrorTraceItem): string {
  const query = row.queryString ? `?${row.queryString}` : ''
  return `${row.method || '-'} ${row.requestPath || '-'}${query}`
}
</script>

<template>
  <div class="page-shell">
    <WorkspacePageHeader :title="currentSection.title">
      <template #actions>
        <el-button v-if="route.name === 'system-diagnostics'" plain @click="handleClearTraceRecords">清空浏览器记录</el-button>
        <el-button :loading="loading" type="primary" @click="fetchData">刷新状态</el-button>
      </template>
    </WorkspacePageHeader>

    <section class="stats-grid">
      <el-card v-for="item in summaryItems" :key="item.label" class="metric-card" shadow="never">
        <p class="metric-label">{{ item.label }}</p>
        <strong>{{ item.value }}</strong>
      </el-card>
    </section>

    <el-alert v-if="errorText" :closable="false" type="error" :title="errorText" show-icon />

    <section v-if="route.name === 'system-health'" class="status-grid">
      <SystemHealthCard :data="health" />
      <MessageLinkCard :data="monitoring" />
    </section>

    <PageSectionCard
      v-if="route.name === 'service-status'"
      title="服务状态"
      description="展示后端探测到的服务状态与最近检查时间。"
    >
      <ServiceStatusCard :items="services" />
    </PageSectionCard>

    <PageSectionCard
      v-if="route.name === 'version-info'"
      title="版本信息"
      description="展示后端应用名称、版本、构建时间和提交号。"
    >
      <VersionInfoCard :item="version" />
    </PageSectionCard>

    <PageSectionCard
      v-if="route.name === 'system-diagnostics'"
      title="最近服务端异常"
      description="后端会保留最近接口异常，可通过追踪编号查看错误摘要。"
    >
      <div class="diagnostics-toolbar">
        <el-input v-model="diagnosticsTraceId" clearable placeholder="输入追踪编号" />
        <el-button type="primary" :loading="loading" @click="handleTraceSearch">查询</el-button>
        <el-button @click="resetTraceSearch">重置</el-button>
      </div>

      <el-descriptions v-if="serverErrorDetail" class="diagnostic-detail" :column="2" border>
        <el-descriptions-item label="追踪编号">{{ serverErrorDetail.traceId }}</el-descriptions-item>
        <el-descriptions-item label="发生时间">{{ formatDateTime(serverErrorDetail.occurredAt) }}</el-descriptions-item>
        <el-descriptions-item label="请求">{{ formatRequestPath(serverErrorDetail) }}</el-descriptions-item>
        <el-descriptions-item label="状态码">{{ serverErrorDetail.httpStatus }}</el-descriptions-item>
        <el-descriptions-item label="业务码">{{ serverErrorDetail.code }}</el-descriptions-item>
        <el-descriptions-item label="异常类型">{{ serverErrorDetail.exceptionClass || '-' }}</el-descriptions-item>
        <el-descriptions-item label="错误提示" :span="2">{{ serverErrorDetail.message }}</el-descriptions-item>
        <el-descriptions-item label="错误摘要" :span="2">{{ serverErrorDetail.summary || '-' }}</el-descriptions-item>
      </el-descriptions>

      <el-empty v-if="serverErrorRecords.length === 0" description="暂无服务端异常记录" />
      <el-table v-else :data="serverErrorRecords" stripe>
        <el-table-column label="发生时间" min-width="170">
          <template #default="{ row }">{{ formatDateTime(row.occurredAt) }}</template>
        </el-table-column>
        <el-table-column prop="message" label="错误提示" min-width="220" />
        <el-table-column label="请求" min-width="240">
          <template #default="{ row }">{{ formatRequestPath(row) }}</template>
        </el-table-column>
        <el-table-column prop="httpStatus" label="状态码" width="100" />
        <el-table-column prop="code" label="业务码" width="110" />
        <el-table-column prop="exceptionClass" label="异常类型" min-width="220" />
        <el-table-column label="追踪编号" min-width="240">
          <template #default="{ row }">
            <el-tag effect="plain">{{ row.traceId }}</el-tag>
          </template>
        </el-table-column>
      </el-table>

      <div v-if="diagnosticsTotal > diagnosticsSize" class="pager">
        <span>共 {{ diagnosticsTotal }} 条</span>
        <el-pagination
          background
          layout="prev, pager, next"
          :total="diagnosticsTotal"
          :current-page="diagnosticsPage"
          :page-size="diagnosticsSize"
          @current-change="handleDiagnosticsPageChange"
        />
      </div>
    </PageSectionCard>

    <PageSectionCard
      v-if="route.name === 'system-diagnostics'"
      title="浏览器侧接口记录"
      description="仅展示当前浏览器捕获到的接口异常，用于辅助核对服务端追踪编号。"
    >
      <el-empty v-if="errorTraceRecords.length === 0" description="暂无浏览器侧异常记录" />
      <el-table v-else :data="errorTraceRecords" stripe>
        <el-table-column label="发生时间" min-width="170">
          <template #default="{ row }">{{ formatDateTime(row.occurredAt) }}</template>
        </el-table-column>
        <el-table-column prop="message" label="错误提示" min-width="220" />
        <el-table-column label="请求" min-width="240">
          <template #default="{ row }">{{ row.method }} {{ row.url }}</template>
        </el-table-column>
        <el-table-column prop="status" label="状态码" width="100" />
        <el-table-column prop="code" label="业务码" width="110" />
        <el-table-column label="追踪编号" min-width="240">
          <template #default="{ row }">
            <el-tag effect="plain">{{ row.traceId }}</el-tag>
          </template>
        </el-table-column>
      </el-table>
    </PageSectionCard>

    <PageSectionCard
      v-if="route.name === 'system-health'"
      :title="currentSection.title"
      description="展示 summary 聚合接口返回的系统总览。"
    >
      <IncidentSummaryCard :summary="summary" />
    </PageSectionCard>
  </div>
</template>

<style scoped>
.page-shell {
  display: grid;
  gap: 18px;
}

.status-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.diagnostics-toolbar {
  display: grid;
  grid-template-columns: minmax(220px, 360px) auto auto;
  gap: 10px;
  margin-bottom: 14px;
}

.diagnostic-detail {
  margin-bottom: 14px;
}

.pager {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 14px;
}

@media (max-width: 900px) {
  .status-grid {
    grid-template-columns: 1fr;
  }

  .diagnostics-toolbar {
    grid-template-columns: 1fr;
  }
}
</style>

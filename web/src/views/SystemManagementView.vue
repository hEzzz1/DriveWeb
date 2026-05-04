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
  getSystemHealth,
  getSystemMonitoring,
  getSystemSummary,
  getVersionInfo,
} from '../api/system'
import type {
  ServiceStatusItem,
  SystemHealthSnapshot,
  SystemMonitoringSnapshot,
  SystemSummarySnapshot,
  VersionInfoItem,
} from '../types/system'

const route = useRoute()
const loading = ref(false)
const errorText = ref('')
const health = ref<SystemHealthSnapshot | null>(null)
const services = ref<ServiceStatusItem[]>([])
const monitoring = ref<SystemMonitoringSnapshot | null>(null)
const version = ref<VersionInfoItem | null>(null)
const summary = ref<SystemSummarySnapshot | null>(null)

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

  return {
    title: '系统健康',
    description: '查看健康概览、监控摘要和系统总体运行状态。',
  }
})

onMounted(async () => {
  await fetchData()
})

async function fetchData(): Promise<void> {
  loading.value = true

  const [summaryResult, healthResult, servicesResult, monitoringResult, versionResult] =
    await Promise.allSettled([
      getSystemSummary(),
      getSystemHealth(),
      getServiceStatus(),
      getSystemMonitoring(),
      getVersionInfo(),
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

  loading.value = false
}
</script>

<template>
  <div class="page-shell">
    <WorkspacePageHeader title="系统运维">
      <template #actions>
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

@media (max-width: 900px) {
  .status-grid {
    grid-template-columns: 1fr;
  }
}
</style>

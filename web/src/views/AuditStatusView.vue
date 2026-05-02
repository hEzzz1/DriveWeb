<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import PageSectionCard from '../components/PageSectionCard.vue'
import WorkspacePageHeader from '../components/layout/WorkspacePageHeader.vue'
import AuditDetailDrawer from '../components/audit/AuditDetailDrawer.vue'
import AuditFilterBar from '../components/audit/AuditFilterBar.vue'
import AuditListTable from '../components/audit/AuditListTable.vue'
import {
  exportPlatformAuditLogs,
  getPlatformAuditDetail,
  getPlatformAuditList,
} from '../api/audit'
import { useAccess } from '../composables/useAccess'
import type { AuditDetail, AuditFilter, AuditSummary } from '../types/audit'
import { normalizeAuditDetail } from '../utils/audit'

const access = useAccess()
const loading = ref(false)
const detailLoading = ref(false)
const exportLoading = ref(false)
const items = ref<AuditSummary[]>([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)
const errorText = ref('')
const detailVisible = ref(false)
const activeDetail = ref<AuditDetail | null>(null)

const filters = reactive<AuditFilter>({
  module: undefined,
  startTime: undefined,
  endTime: undefined,
  actionType: undefined,
  targetType: undefined,
  targetId: undefined,
  actionBy: undefined,
})

const summaryItems = computed(() => [
  { label: '审计总量', value: total.value },
  { label: '用户域记录', value: items.value.filter((item) => item.module === 'USER').length },
  { label: '企业域记录', value: items.value.filter((item) => item.module === 'ENTERPRISE').length },
  { label: '当前页', value: currentPage.value },
])
const canExport = computed(() => access.value.canExportPlatformAudit)

onMounted(async () => {
  await fetchList()
})

async function fetchList(): Promise<void> {
  loading.value = true

  try {
    const data = await getPlatformAuditList({
      ...filters,
      page: currentPage.value,
      size: pageSize.value,
    })
    items.value = Array.isArray(data.items) ? data.items : []
    total.value = data.total || 0
    currentPage.value = data.page || currentPage.value
    pageSize.value = data.size || pageSize.value
    errorText.value = ''
  } catch (error) {
    errorText.value = error instanceof Error ? error.message : '审计列表加载失败'
  } finally {
    loading.value = false
  }
}

async function handleSearch(): Promise<void> {
  currentPage.value = 1
  await fetchList()
}

async function handleReset(): Promise<void> {
  filters.startTime = undefined
  filters.endTime = undefined
  filters.module = undefined
  filters.actionType = undefined
  filters.targetType = undefined
  filters.targetId = undefined
  filters.actionBy = undefined
  currentPage.value = 1
  pageSize.value = 10
  await fetchList()
}

async function handleOpenDetail(row: AuditSummary): Promise<void> {
  detailVisible.value = true
  detailLoading.value = true

  try {
    activeDetail.value = normalizeAuditDetail(await getPlatformAuditDetail(row.id))
  } finally {
    detailLoading.value = false
  }
}

async function handleExport(): Promise<void> {
  if (!canExport.value) {
    return
  }

  exportLoading.value = true

  try {
    const result = await exportPlatformAuditLogs({ ...filters })
    ElMessage.success(`审计导出完成，共 ${result.total} 条`)
  } finally {
    exportLoading.value = false
  }
}

async function handlePageChange(page: number): Promise<void> {
  currentPage.value = page
  await fetchList()
}

async function handleSizeChange(size: number): Promise<void> {
  pageSize.value = size
  currentPage.value = 1
  await fetchList()
}
</script>

<template>
  <div class="page-shell">
    <WorkspacePageHeader
      eyebrow="Audit"
      title="审计日志"
      subtitle="平台域审计只展示平台侧治理和系统操作记录，不承接企业业务原始明细。"
    />

    <section class="stats-grid">
      <el-card v-for="item in summaryItems" :key="item.label" class="metric-card" shadow="never">
        <p class="metric-label">{{ item.label }}</p>
        <strong>{{ item.value }}</strong>
      </el-card>
    </section>

    <PageSectionCard title="筛选条件" description="支持按时间、模块、动作编码、对象类型、对象 ID 和操作人 ID 过滤。">
      <template #actions>
        <el-button v-if="canExport" :loading="exportLoading" type="success" @click="handleExport">导出记录</el-button>
      </template>

      <AuditFilterBar
        v-model="filters"
        :can-export="canExport"
        :loading="loading"
        @search="handleSearch"
        @reset="handleReset"
        @export="handleExport"
      />
    </PageSectionCard>

    <PageSectionCard title="审计列表" description="查看列表并下钻到详情抽屉。">
      <el-alert v-if="errorText" :closable="false" type="error" :title="errorText" show-icon />
      <AuditListTable
        :items="items"
        :loading="loading"
        :total="total"
        :page="currentPage"
        :size="pageSize"
        @detail="handleOpenDetail"
        @page-change="handlePageChange"
        @size-change="handleSizeChange"
      />
    </PageSectionCard>

    <AuditDetailDrawer v-model:visible="detailVisible" :detail="activeDetail" :loading="detailLoading" />
  </div>
</template>

<style scoped>
.page-shell {
  display: grid;
  gap: 18px;
}
</style>

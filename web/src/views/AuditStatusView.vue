<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import PageSectionCard from '../components/PageSectionCard.vue'
import AuditDetailDrawer from '../components/audit/AuditDetailDrawer.vue'
import AuditFilterBar from '../components/audit/AuditFilterBar.vue'
import AuditListTable from '../components/audit/AuditListTable.vue'
import { exportAuditLogs, getAuditDetail, getAuditList } from '../api/audit'
import { useAuthStore } from '../stores/auth'
import type { AuditDetail, AuditFilter, AuditSummary } from '../types/audit'

const authStore = useAuthStore()
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
  startTime: undefined,
  endTime: undefined,
  actionType: undefined,
  operator: '',
  targetType: undefined,
  result: undefined,
})

const summaryItems = computed(() => [
  { label: '审计总量', value: total.value },
  { label: '成功记录', value: items.value.filter((item) => item.result === 'SUCCESS').length },
  { label: '失败记录', value: items.value.filter((item) => item.result === 'FAILED').length },
  { label: '当前页', value: currentPage.value },
])
const canExport = computed(() => authStore.canExportAudit())

onMounted(async () => {
  await fetchList()
})

async function fetchList(): Promise<void> {
  loading.value = true

  try {
    const data = await getAuditList({
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
  filters.actionType = undefined
  filters.operator = ''
  filters.targetType = undefined
  filters.result = undefined
  currentPage.value = 1
  pageSize.value = 10
  await fetchList()
}

async function handleOpenDetail(row: AuditSummary): Promise<void> {
  detailVisible.value = true
  detailLoading.value = true

  try {
    activeDetail.value = await getAuditDetail(row.id)
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
    const result = await exportAuditLogs({
      ...filters,
      format: 'CSV',
    })
    ElMessage.success(result.downloadUrl ? '导出任务已生成下载地址' : '导出任务已提交')
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
    <div class="page-head">
      <div>
        <p class="eyebrow">Audit</p>
        <h1>审计日志</h1>
        <p class="subhead">集中查看操作留痕、链路状态和关联对象，支持按条件导出。</p>
      </div>
    </div>

    <section class="stats-grid">
      <el-card v-for="item in summaryItems" :key="item.label" class="metric-card" shadow="never">
        <p class="metric-label">{{ item.label }}</p>
        <strong>{{ item.value }}</strong>
      </el-card>
    </section>

    <PageSectionCard title="筛选条件" description="支持按时间、操作类型、操作人、对象类型和结果过滤。">
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

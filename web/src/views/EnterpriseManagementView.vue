<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import PageSectionCard from '../components/PageSectionCard.vue'
import AuditDetailDrawer from '../components/audit/AuditDetailDrawer.vue'
import EnterpriseCreateDialog from '../components/enterprises/EnterpriseCreateDialog.vue'
import EnterpriseDetailDrawer from '../components/enterprises/EnterpriseDetailDrawer.vue'
import EnterpriseEditDialog from '../components/enterprises/EnterpriseEditDialog.vue'
import EnterpriseListTable from '../components/enterprises/EnterpriseListTable.vue'
import { getPlatformAuditDetail, getPlatformAuditList } from '../api/audit'
import {
  createPlatformEnterprise,
  getPlatformEnterpriseDetail,
  getPlatformEnterpriseList,
  updatePlatformEnterprise,
  updatePlatformEnterpriseStatus,
} from '../api/enterprises'
import { useAccess } from '../composables/useAccess'
import type { AuditDetail, AuditSummary } from '../types/audit'
import type { EnterpriseDetail, EnterpriseListQuery, EnterpriseSummary } from '../types/enterprises'
import { normalizeAuditDetail } from '../utils/audit'

interface FilterModel {
  keyword: string
  enabled?: boolean
}

const access = useAccess()

const loading = ref(false)
const createSaving = ref(false)
const editSaving = ref(false)
const statusSaving = ref(false)
const detailLoading = ref(false)
const auditLoading = ref(false)
const errorText = ref('')
const feedbackMessage = ref('')
const feedbackType = ref<'success' | 'info'>('success')

const items = ref<EnterpriseSummary[]>([])
const selectedItems = ref<EnterpriseSummary[]>([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)

const detailVisible = ref(false)
const createVisible = ref(false)
const editVisible = ref(false)
const auditDetailVisible = ref(false)

const activeDetail = ref<EnterpriseDetail | null>(null)
const activeAuditItems = ref<AuditSummary[]>([])
const auditTotal = ref(0)
const auditPage = ref(1)
const auditSize = ref(5)
const activeAuditDetail = ref<AuditDetail | null>(null)

const filters = reactive<FilterModel>({
  keyword: '',
  enabled: undefined,
})

const enabledOptions = [
  { label: '启用中', value: true },
  { label: '已禁用', value: false },
]

const summaryItems = computed(() => [
  { label: '企业总数', value: total.value },
  { label: '启用企业', value: items.value.filter((item) => item.enabled).length },
  { label: '待启用处理', value: items.value.filter((item) => !item.enabled).length },
  { label: '当前已选', value: selectedItems.value.length || '未选择' },
])

const activeFilterTags = computed(() => {
  const tags: string[] = []
  if (filters.keyword.trim()) {
    tags.push(`关键词：${filters.keyword.trim()}`)
  }
  if (typeof filters.enabled === 'boolean') {
    tags.push(filters.enabled ? '状态：启用中' : '状态：已禁用')
  }
  return tags
})

const disabledCount = computed(() => items.value.filter((item) => !item.enabled).length)
const selectedEnabledCount = computed(() => selectedItems.value.filter((item) => item.enabled).length)
const selectedDisabledCount = computed(() => selectedItems.value.filter((item) => !item.enabled).length)
const canBatchEnable = computed(() => access.value.canManageEnterprises && selectedDisabledCount.value > 0)
const canBatchDisable = computed(() => access.value.canManageEnterprises && selectedEnabledCount.value > 0)
const resultDescription = computed(() => {
  if (errorText.value) {
    return errorText.value
  }

  if (activeFilterTags.value.length) {
    return `当前结果 ${total.value} 条，已应用 ${activeFilterTags.value.join('，')}。`
  }

  return '优先处理待启用企业，详情抽屉继续查看平台侧审计记录。'
})

onMounted(async () => {
  await fetchList()
})

async function fetchList(): Promise<void> {
  loading.value = true

  try {
    const data = await getPlatformEnterpriseList(buildQuery())
    items.value = Array.isArray(data.items) ? data.items : []
    selectedItems.value = selectedItems.value.filter((selected) => items.value.some((item) => item.id === selected.id))
    total.value = data.total || 0
    currentPage.value = data.page || currentPage.value
    pageSize.value = data.size || pageSize.value
    errorText.value = ''
  } catch (error) {
    errorText.value = error instanceof Error ? error.message : '企业列表加载失败'
  } finally {
    loading.value = false
  }
}

function buildQuery(): EnterpriseListQuery {
  return {
    page: currentPage.value,
    size: pageSize.value,
    keyword: filters.keyword.trim() || undefined,
    enabled: filters.enabled,
  }
}

async function handleSearch(): Promise<void> {
  currentPage.value = 1
  await fetchList()
}

async function handleReset(): Promise<void> {
  filters.keyword = ''
  filters.enabled = undefined
  currentPage.value = 1
  pageSize.value = 10
  await fetchList()
}

async function applyQuickFilter(type: 'all' | 'disabled' | 'enabled'): Promise<void> {
  if (type === 'all') {
    filters.enabled = undefined
  } else {
    filters.enabled = type === 'enabled'
  }
  currentPage.value = 1
  await fetchList()
}

async function handleOpenDetail(row: EnterpriseSummary): Promise<void> {
  detailVisible.value = true
  detailLoading.value = true
  auditPage.value = 1
  auditSize.value = 5
  activeAuditItems.value = []

  try {
    activeDetail.value = await getPlatformEnterpriseDetail(row.id)
    await fetchEnterpriseAudits()
  } catch {
    detailVisible.value = false
  } finally {
    detailLoading.value = false
  }
}

async function handleOpenEdit(row: EnterpriseSummary): Promise<void> {
  await handleOpenDetail(row)
  editVisible.value = true
}

async function fetchEnterpriseAudits(): Promise<void> {
  if (!activeDetail.value) {
    return
  }

  auditLoading.value = true

  try {
    const data = await getPlatformAuditList({
      module: 'ENTERPRISE',
      targetType: 'ENTERPRISE',
      targetId: String(activeDetail.value.id),
      page: auditPage.value,
      size: auditSize.value,
    })
    activeAuditItems.value = data.items
    auditTotal.value = data.total
  } finally {
    auditLoading.value = false
  }
}

async function handleCreateEnterprise(
  payload: Parameters<typeof createPlatformEnterprise>[0],
  mode: 'close' | 'continue' = 'close',
): Promise<void> {
  createSaving.value = true

  try {
    const detail = await createPlatformEnterprise(payload)
    feedbackType.value = 'success'
    feedbackMessage.value = `企业「${detail.name}」已创建。${mode === 'continue' ? '当前表单已保留，可继续录入。' : '你可以继续查看详情或筛选结果。'}`
    if (mode === 'close') {
      createVisible.value = false
    }
    await fetchList()
    ElMessage.success(mode === 'continue' ? '企业已创建，继续录入下一条' : '企业已创建')
  } finally {
    createSaving.value = false
  }
}

async function handleEditEnterprise(payload: Parameters<typeof updatePlatformEnterprise>[1]): Promise<void> {
  if (!activeDetail.value) {
    return
  }

  editSaving.value = true

  try {
    const detail = await updatePlatformEnterprise(activeDetail.value.id, payload)
    activeDetail.value = detail
    syncTableRow(detail)
    editVisible.value = false
    await fetchEnterpriseAudits()
    feedbackType.value = 'success'
    feedbackMessage.value = `企业「${detail.name}」资料已更新。`
    ElMessage.success('企业信息已更新')
  } finally {
    editSaving.value = false
  }
}

async function handleToggleStatus(row?: EnterpriseSummary): Promise<void> {
  const target = row ? await getPlatformEnterpriseDetail(row.id) : activeDetail.value
  if (!target) {
    return
  }

  const nextEnabled = !target.enabled
  const actionText = nextEnabled ? '启用' : '禁用'

  try {
    await ElMessageBox.confirm(`确认${actionText}企业「${target.name}」吗？`, `${actionText}企业`, {
      type: 'warning',
      confirmButtonText: actionText,
      cancelButtonText: '取消',
    })
  } catch {
    return
  }

  statusSaving.value = true

  try {
    const detail = await updatePlatformEnterpriseStatus(target.id, { enabled: nextEnabled })
    if (activeDetail.value?.id === detail.id) {
      activeDetail.value = detail
      await fetchEnterpriseAudits()
    }
    syncTableRow(detail)
    feedbackType.value = 'info'
    feedbackMessage.value = `企业「${detail.name}」已${actionText}。`
    ElMessage.success(`企业已${actionText}`)
  } finally {
    statusSaving.value = false
  }
}

async function handleBatchStatus(enabled: boolean): Promise<void> {
  const targets = selectedItems.value.filter((item) => item.enabled !== enabled)
  if (!targets.length) {
    return
  }

  const actionText = enabled ? '启用' : '禁用'

  try {
    await ElMessageBox.confirm(`确认批量${actionText}已选的 ${targets.length} 家企业吗？`, `批量${actionText}`, {
      type: 'warning',
      confirmButtonText: actionText,
      cancelButtonText: '取消',
    })
  } catch {
    return
  }

  statusSaving.value = true

  try {
    await Promise.all(targets.map((item) => updatePlatformEnterpriseStatus(item.id, { enabled })))
    feedbackType.value = 'success'
    feedbackMessage.value = `已批量${actionText} ${targets.length} 家企业。`
    selectedItems.value = []
    await fetchList()
    ElMessage.success(`批量${actionText}完成`)
  } finally {
    statusSaving.value = false
  }
}

function syncTableRow(detail: EnterpriseDetail): void {
  items.value = items.value.map((item) => (item.id === detail.id ? { ...item, ...detail } : item))
  selectedItems.value = selectedItems.value.map((item) => (item.id === detail.id ? { ...item, ...detail } : item))
}

async function handleOpenAuditDetail(row: AuditSummary): Promise<void> {
  activeAuditDetail.value = normalizeAuditDetail(await getPlatformAuditDetail(row.id))
  auditDetailVisible.value = true
}

function handleSelectionChange(rows: EnterpriseSummary[]): void {
  selectedItems.value = rows
}
</script>

<template>
  <div class="page-shell">
    <div class="page-head">
      <div>
        <p class="eyebrow">Enterprises</p>
        <h1>企业管理</h1>
        <p class="subhead">把待启用处理、企业录入和状态维护收敛到一个连续工作台，减少来回切换和重复筛选。</p>
      </div>
      <div class="head-actions">
        <el-button v-if="access.canManageEnterprises" type="primary" @click="createVisible = true">新建企业</el-button>
      </div>
    </div>

    <section class="stats-grid">
      <el-card v-for="item in summaryItems" :key="item.label" class="metric-card" shadow="never">
        <p class="metric-label">{{ item.label }}</p>
        <strong>{{ item.value }}</strong>
      </el-card>
    </section>

    <section class="workbench-grid">
      <el-card class="page-section-card workbench-card" shadow="never">
        <div class="workbench-copy">
          <p class="workbench-label">高频任务</p>
          <h2>先处理待启用，再补录新企业</h2>
          <p>把最常见的状态核查、创建录入和详情校对放在同一视野里，减少翻页后再回找的成本。</p>
        </div>
        <div class="workbench-actions">
          <el-button @click="applyQuickFilter('all')">全部企业</el-button>
          <el-button :type="filters.enabled === false ? 'primary' : 'default'" @click="applyQuickFilter('disabled')">
            待启用 {{ disabledCount }}
          </el-button>
          <el-button :type="filters.enabled === true ? 'primary' : 'default'" @click="applyQuickFilter('enabled')">
            仅看启用中
          </el-button>
        </div>
      </el-card>

      <el-card class="page-section-card queue-card" shadow="never">
        <p class="queue-label">当前工作提示</p>
        <ul class="queue-list">
          <li>已选 {{ selectedItems.length }} 家企业，可直接批量启停。</li>
          <li>本页待启用企业 {{ disabledCount }} 家，适合优先核查。</li>
          <li>创建弹窗支持“创建并继续”，适合连续录入。</li>
        </ul>
      </el-card>
    </section>

    <el-alert v-if="feedbackMessage" :closable="true" class="feedback-banner" :title="feedbackMessage" :type="feedbackType" show-icon />

    <PageSectionCard title="搜索与筛选" description="支持快速视图、关键词搜索和状态过滤，结果区会显示当前筛选上下文。">
      <div class="filter-stack">
        <div class="filter-bar">
          <el-input v-model="filters.keyword" clearable placeholder="企业编码 / 企业名称" @keyup.enter="handleSearch" />
          <el-select v-model="filters.enabled" clearable placeholder="企业状态">
            <el-option v-for="item in enabledOptions" :key="String(item.value)" :label="item.label" :value="item.value" />
          </el-select>
          <div class="actions">
            <el-button :loading="loading" type="primary" @click="handleSearch">查询</el-button>
            <el-button @click="handleReset">重置</el-button>
          </div>
        </div>

        <div class="filter-summary">
          <span class="result-count">共 {{ total }} 条结果</span>
          <div v-if="activeFilterTags.length" class="filter-tags">
            <el-tag v-for="tag in activeFilterTags" :key="tag" effect="plain" type="info">{{ tag }}</el-tag>
          </div>
          <span v-else class="result-hint">未设置筛选时展示全部企业。</span>
        </div>
      </div>
    </PageSectionCard>

    <PageSectionCard title="企业列表" :description="resultDescription">
      <template #actions>
        <div class="list-actions">
          <el-button :disabled="!canBatchEnable" :loading="statusSaving" @click="handleBatchStatus(true)">批量启用</el-button>
          <el-button :disabled="!canBatchDisable" :loading="statusSaving" @click="handleBatchStatus(false)">批量禁用</el-button>
        </div>
      </template>
      <el-alert v-if="errorText" :closable="false" type="error" :title="errorText" show-icon />
      <EnterpriseListTable
        :items="items"
        :loading="loading"
        :total="total"
        :page="currentPage"
        :size="pageSize"
        :can-edit="access.canManageEnterprises"
        :can-toggle-status="access.canManageEnterprises"
        :selectable="access.canManageEnterprises"
        @detail="handleOpenDetail"
        @edit="handleOpenEdit"
        @toggle-status="handleToggleStatus"
        @selection-change="handleSelectionChange"
        @page-change="currentPage = $event; fetchList()"
        @size-change="pageSize = $event; currentPage = 1; fetchList()"
      />
    </PageSectionCard>

    <EnterpriseCreateDialog v-model:visible="createVisible" :loading="createSaving" @save="handleCreateEnterprise" />

    <EnterpriseEditDialog
      v-model:visible="editVisible"
      :loading="editSaving"
      :enterprise="activeDetail"
      @save="handleEditEnterprise"
    />

    <EnterpriseDetailDrawer
      v-model:visible="detailVisible"
      :detail="activeDetail"
      :loading="detailLoading"
      :users="[]"
      :audits="activeAuditItems"
      :audit-loading="auditLoading"
      :audit-total="auditTotal"
      :audit-page="auditPage"
      :audit-size="auditSize"
      :can-edit="access.canManageEnterprises"
      :can-toggle-status="access.canManageEnterprises"
      :show-user-summary="false"
      @edit="editVisible = true"
      @toggle-status="handleToggleStatus()"
      @audit-detail="handleOpenAuditDetail"
      @audit-page-change="auditPage = $event; fetchEnterpriseAudits()"
      @audit-size-change="auditSize = $event; auditPage = 1; fetchEnterpriseAudits()"
    />

    <AuditDetailDrawer v-model:visible="auditDetailVisible" :detail="activeAuditDetail" />
  </div>
</template>

<style scoped>
.workbench-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.3fr) minmax(280px, 0.7fr);
  gap: 16px;
}

.workbench-card,
.queue-card {
  display: grid;
  gap: 18px;
}

.workbench-copy h2 {
  margin: 6px 0 8px;
  font-size: 22px;
  line-height: 1.25;
}

.workbench-copy p,
.queue-list {
  margin: 0;
  color: var(--text-soft);
  line-height: 1.6;
}

.workbench-label,
.queue-label {
  margin: 0;
  color: var(--brand);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.workbench-actions,
.list-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.queue-list {
  padding-left: 18px;
}

.feedback-banner {
  border-radius: 12px;
}

.filter-stack {
  display: grid;
  gap: 12px;
}

.filter-bar {
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(180px, 0.7fr) auto;
  gap: 12px;
  align-items: center;
}

.actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.filter-summary {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.result-count {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-main);
}

.result-hint {
  color: var(--text-faint);
  font-size: 13px;
}

.filter-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

@media (max-width: 960px) {
  .workbench-grid,
  .filter-bar {
    grid-template-columns: 1fr;
  }

  .actions {
    justify-content: flex-start;
  }
}
</style>

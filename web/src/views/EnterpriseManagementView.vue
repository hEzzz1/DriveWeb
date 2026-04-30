<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import PageSectionCard from '../components/PageSectionCard.vue'
import AuditDetailDrawer from '../components/audit/AuditDetailDrawer.vue'
import EnterpriseCreateDialog from '../components/enterprises/EnterpriseCreateDialog.vue'
import EnterpriseDetailDrawer from '../components/enterprises/EnterpriseDetailDrawer.vue'
import EnterpriseEditDialog from '../components/enterprises/EnterpriseEditDialog.vue'
import EnterpriseListTable from '../components/enterprises/EnterpriseListTable.vue'
import { getAuditDetail, getAuditList } from '../api/audit'
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

const items = ref<EnterpriseSummary[]>([])
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
  { label: '当前页企业', value: items.value.length },
  { label: '可编辑模式', value: access.value.canManageEnterprises ? '读写' : '只读' },
])

onMounted(async () => {
  await fetchList()
})

async function fetchList(): Promise<void> {
  loading.value = true

  try {
    const data = await getPlatformEnterpriseList(buildQuery())
    items.value = Array.isArray(data.items) ? data.items : []
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
    const data = await getAuditList({
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

async function handleCreateEnterprise(payload: Parameters<typeof createPlatformEnterprise>[0]): Promise<void> {
  createSaving.value = true

  try {
    await createPlatformEnterprise(payload)
    createVisible.value = false
    await fetchList()
    ElMessage.success('企业已创建')
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
    ElMessage.success(`企业已${actionText}`)
  } finally {
    statusSaving.value = false
  }
}

function syncTableRow(detail: EnterpriseDetail): void {
  items.value = items.value.map((item) => (item.id === detail.id ? { ...item, ...detail } : item))
}

async function handleOpenAuditDetail(row: AuditSummary): Promise<void> {
  activeAuditDetail.value = normalizeAuditDetail(await getAuditDetail(row.id))
  auditDetailVisible.value = true
}
</script>

<template>
  <div class="page-shell">
    <div class="page-head">
      <div>
        <p class="eyebrow">Enterprises</p>
        <h1>企业管理</h1>
        <p class="subhead">平台域仅查看和维护企业元数据，不拉取企业用户、设备绑定明细或激活码原文。</p>
      </div>
    </div>

    <section class="stats-grid">
      <el-card v-for="item in summaryItems" :key="item.label" class="metric-card" shadow="never">
        <p class="metric-label">{{ item.label }}</p>
        <strong>{{ item.value }}</strong>
      </el-card>
    </section>

    <PageSectionCard title="筛选条件" description="按企业编码、企业名称和状态过滤。">
      <template #actions>
        <el-button v-if="access.canManageEnterprises" type="primary" @click="createVisible = true">新建企业</el-button>
      </template>

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
    </PageSectionCard>

    <PageSectionCard title="企业列表" description="详情抽屉仅展示平台级企业资料和平台侧变更记录。">
      <el-alert v-if="errorText" :closable="false" type="error" :title="errorText" show-icon />
      <EnterpriseListTable
        :items="items"
        :loading="loading"
        :total="total"
        :page="currentPage"
        :size="pageSize"
        :can-edit="access.canManageEnterprises"
        :can-toggle-status="access.canManageEnterprises"
        @detail="handleOpenDetail"
        @edit="handleOpenEdit"
        @toggle-status="handleToggleStatus"
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

@media (max-width: 960px) {
  .filter-bar {
    grid-template-columns: 1fr;
  }

  .actions {
    justify-content: flex-start;
  }
}
</style>

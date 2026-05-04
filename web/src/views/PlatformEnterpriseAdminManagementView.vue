<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import PageSectionCard from '../components/PageSectionCard.vue'
import WorkspacePageHeader from '../components/layout/WorkspacePageHeader.vue'
import AuditDetailDrawer from '../components/audit/AuditDetailDrawer.vue'
import UserCreateDialog from '../components/users/UserCreateDialog.vue'
import UserDetailDrawer from '../components/users/UserDetailDrawer.vue'
import UserEditDialog from '../components/users/UserEditDialog.vue'
import UserListTable from '../components/users/UserListTable.vue'
import UserResetPasswordDialog from '../components/users/UserResetPasswordDialog.vue'
import { getPlatformAuditDetail } from '../api/audit'
import { getPlatformEnterpriseList } from '../api/enterprises'
import {
  createPlatformEnterpriseAdmin,
  getPlatformEnterpriseAdminAudits,
  getPlatformEnterpriseAdminDetail,
  getPlatformEnterpriseAdminList,
  getPlatformEnterpriseAdminRoleOptions,
  resetPlatformEnterpriseAdminPassword,
  updatePlatformEnterpriseAdmin,
  updatePlatformEnterpriseAdminStatus,
} from '../api/users'
import { useAccess } from '../composables/useAccess'
import { useAuthStore } from '../stores/auth'
import type { AuditDetail, AuditSummary } from '../types/audit'
import type { RoleOptionItem, UserDetail, UserListQuery, UserSummary } from '../types/users'
import { normalizeAuditDetail } from '../utils/audit'

interface FilterModel {
  keyword: string
  enabled?: boolean
  enterpriseId?: number
}

const ENTERPRISE_ADMIN_ROLE = 'ORG_ADMIN'

const authStore = useAuthStore()
const access = useAccess()

const loading = ref(false)
const roleOptionsLoading = ref(false)
const createSaving = ref(false)
const editSaving = ref(false)
const resetPasswordSaving = ref(false)
const statusSaving = ref(false)
const detailLoading = ref(false)
const auditLoading = ref(false)
const errorText = ref('')

const items = ref<UserSummary[]>([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)
const roleOptions = ref<RoleOptionItem[]>([])
const enterpriseOptions = ref<Array<{ value: number; label: string }>>([])

const detailVisible = ref(false)
const createVisible = ref(false)
const editVisible = ref(false)
const resetPasswordVisible = ref(false)
const auditDetailVisible = ref(false)

const activeDetail = ref<UserDetail | null>(null)
const activeAuditDetail = ref<AuditDetail | null>(null)
const activeAuditItems = ref<AuditSummary[]>([])
const auditTotal = ref(0)
const auditPage = ref(1)
const auditSize = ref(5)

const filters = reactive<FilterModel>({
  keyword: '',
  enabled: undefined,
  enterpriseId: undefined,
})

const enabledOptions = [
  { label: '启用中', value: true },
  { label: '已禁用', value: false },
]

const summaryItems = computed(() => {
  const enterpriseIds = new Set(items.value.map((item) => item.enterpriseId).filter(Boolean))

  return [
    { label: '企业管理员数', value: total.value },
    { label: '启用账号', value: items.value.filter((item) => item.enabled).length },
    { label: '覆盖企业数', value: enterpriseIds.size },
    { label: '可分配角色', value: '仅 ORG_ADMIN' },
  ]
})

onMounted(async () => {
  authStore.hydrate()
  await authStore.syncCurrentUser()
  await Promise.all([fetchList(), fetchRoleOptions(), fetchEnterpriseOptions()])
})

async function fetchList(): Promise<void> {
  loading.value = true

  try {
    const data = await getPlatformEnterpriseAdminList(buildQuery())
    items.value = Array.isArray(data.items) ? data.items : []
    total.value = data.total || 0
    currentPage.value = data.page || currentPage.value
    pageSize.value = data.size || pageSize.value
    errorText.value = ''
  } catch (error) {
    errorText.value = error instanceof Error ? error.message : '企业管理员列表加载失败'
  } finally {
    loading.value = false
  }
}

async function fetchRoleOptions(): Promise<void> {
  roleOptionsLoading.value = true

  try {
    const options = await getPlatformEnterpriseAdminRoleOptions()
    roleOptions.value = options.filter((item) => item.roleCode === ENTERPRISE_ADMIN_ROLE)
  } finally {
    roleOptionsLoading.value = false
  }
}

async function fetchEnterpriseOptions(): Promise<void> {
  const data = await getPlatformEnterpriseList({ page: 1, size: 100 })
  enterpriseOptions.value = data.items.map((item) => ({
    value: item.id,
    label: `${item.name} (#${item.id})`,
  }))
}

function buildQuery(): UserListQuery {
  return {
    page: currentPage.value,
    size: pageSize.value,
    keyword: filters.keyword.trim() || undefined,
    enabled: filters.enabled,
    enterpriseId: filters.enterpriseId,
  }
}

async function fetchUserAudits(): Promise<void> {
  if (!activeDetail.value) {
    return
  }

  auditLoading.value = true

  try {
    const data = await getPlatformEnterpriseAdminAudits(activeDetail.value.id, {
      page: auditPage.value,
      size: auditSize.value,
    })
    activeAuditItems.value = data.items
    auditTotal.value = data.total
  } finally {
    auditLoading.value = false
  }
}

async function handleSearch(): Promise<void> {
  currentPage.value = 1
  await fetchList()
}

async function handleReset(): Promise<void> {
  filters.keyword = ''
  filters.enabled = undefined
  filters.enterpriseId = undefined
  currentPage.value = 1
  pageSize.value = 10
  await fetchList()
}

async function handleOpenDetail(row: UserSummary): Promise<void> {
  detailVisible.value = true
  detailLoading.value = true
  activeAuditItems.value = []
  auditPage.value = 1
  auditSize.value = 5

  try {
    activeDetail.value = await getPlatformEnterpriseAdminDetail(row.id)
    await fetchUserAudits()
  } catch {
    detailVisible.value = false
  } finally {
    detailLoading.value = false
  }
}

async function handleCreateUser(payload: Parameters<typeof createPlatformEnterpriseAdmin>[0]): Promise<void> {
  createSaving.value = true

  try {
    await createPlatformEnterpriseAdmin({
      ...payload,
      roles: [ENTERPRISE_ADMIN_ROLE],
    })
    createVisible.value = false
    await fetchList()
    ElMessage.success('企业管理员已创建')
  } finally {
    createSaving.value = false
  }
}

async function handleEditUser(payload: Parameters<typeof updatePlatformEnterpriseAdmin>[1]): Promise<void> {
  if (!activeDetail.value) {
    return
  }

  editSaving.value = true

  try {
    const detail = await updatePlatformEnterpriseAdmin(activeDetail.value.id, payload)
    activeDetail.value = detail
    syncTableRow(detail)
    editVisible.value = false
    ElMessage.success('企业管理员资料已更新')
  } finally {
    editSaving.value = false
  }
}

async function handleResetPassword(payload: Parameters<typeof resetPlatformEnterpriseAdminPassword>[1]): Promise<void> {
  if (!activeDetail.value) {
    return
  }

  resetPasswordSaving.value = true

  try {
    const detail = await resetPlatformEnterpriseAdminPassword(activeDetail.value.id, payload)
    activeDetail.value = detail
    syncTableRow(detail)
    resetPasswordVisible.value = false
    await fetchUserAudits()
    ElMessage.success('密码已重置')
  } finally {
    resetPasswordSaving.value = false
  }
}

async function handleToggleStatus(): Promise<void> {
  if (!activeDetail.value) {
    return
  }

  const nextEnabled = !activeDetail.value.enabled
  const actionText = nextEnabled ? '启用' : '禁用'

  try {
    await ElMessageBox.confirm(`确认${actionText}企业管理员「${activeDetail.value.username}」吗？`, `${actionText}账号`, {
      type: 'warning',
      confirmButtonText: actionText,
      cancelButtonText: '取消',
    })
  } catch {
    return
  }

  statusSaving.value = true

  try {
    const detail = await updatePlatformEnterpriseAdminStatus(activeDetail.value.id, { enabled: nextEnabled })
    activeDetail.value = detail
    syncTableRow(detail)
    await fetchUserAudits()
    ElMessage.success(`账号已${actionText}`)
  } finally {
    statusSaving.value = false
  }
}

function syncTableRow(detail: UserDetail): void {
  items.value = items.value.map((item) => (item.id === detail.id ? detail : item))
}

async function handleOpenAuditDetail(row: AuditSummary): Promise<void> {
  activeAuditDetail.value = normalizeAuditDetail(await getPlatformAuditDetail(row.id))
  auditDetailVisible.value = true
}
</script>

<template>
  <div class="page-shell">
    <WorkspacePageHeader title="企业管理员" />

    <section class="stats-grid">
      <el-card v-for="item in summaryItems" :key="item.label" class="metric-card" shadow="never">
        <p class="metric-label">{{ item.label }}</p>
        <strong>{{ item.value }}</strong>
      </el-card>
    </section>

    <PageSectionCard title="筛选条件" description="按用户名、昵称、归属企业和状态过滤企业管理员。">
      <template #actions>
        <el-button v-if="access.canManageEnterpriseAdmins" type="primary" @click="createVisible = true">新建企业管理员</el-button>
      </template>

      <div class="filter-bar">
        <el-input v-model="filters.keyword" clearable placeholder="用户名 / 昵称" @keyup.enter="handleSearch" />
        <el-select
          v-model="filters.enterpriseId"
          clearable
          filterable
          allow-create
          default-first-option
          placeholder="归属企业"
        >
          <el-option v-for="item in enterpriseOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
        <el-select v-model="filters.enabled" clearable placeholder="账号状态">
          <el-option v-for="item in enabledOptions" :key="String(item.value)" :label="item.label" :value="item.value" />
        </el-select>
        <div class="actions">
          <el-button :loading="loading" type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </div>
      </div>
    </PageSectionCard>

    <PageSectionCard title="企业管理员列表" description="仅展示企业管理员账号，详情区可查看归属企业和最近操作审计。">
      <el-alert v-if="errorText" :closable="false" type="error" :title="errorText" show-icon />
      <UserListTable
        :items="items"
        :loading="loading"
        :total="total"
        :page="currentPage"
        :size="pageSize"
        @detail="handleOpenDetail"
        @page-change="currentPage = $event; fetchList()"
        @size-change="pageSize = $event; currentPage = 1; fetchList()"
      />
    </PageSectionCard>

    <UserCreateDialog
      v-model:visible="createVisible"
      :loading="createSaving || roleOptionsLoading"
      :role-options="roleOptions"
      :enterprise-options="enterpriseOptions"
      @save="handleCreateUser"
    />

    <UserEditDialog
      v-model:visible="editVisible"
      :loading="editSaving"
      :user="activeDetail"
      :enterprise-options="enterpriseOptions"
      @save="handleEditUser"
    />

    <UserResetPasswordDialog
      v-model:visible="resetPasswordVisible"
      :loading="resetPasswordSaving"
      @save="handleResetPassword"
    />

    <UserDetailDrawer
      v-model:visible="detailVisible"
      :detail="activeDetail"
      :loading="detailLoading"
      :audit-items="activeAuditItems"
      :audit-loading="auditLoading"
      :audit-total="auditTotal"
      :audit-page="auditPage"
      :audit-size="auditSize"
      :can-edit="access.canManageEnterpriseAdmins"
      :can-assign-roles="false"
      :can-toggle-status="access.canManageEnterpriseAdmins"
      :can-reset-password="access.canManageEnterpriseAdmins"
      @edit="editVisible = true"
      @toggle-status="handleToggleStatus"
      @reset-password="resetPasswordVisible = true"
      @audit-detail="handleOpenAuditDetail"
      @audit-page-change="auditPage = $event; fetchUserAudits()"
      @audit-size-change="auditSize = $event; auditPage = 1; fetchUserAudits()"
    />

    <AuditDetailDrawer v-model:visible="auditDetailVisible" :detail="activeAuditDetail" />
  </div>
</template>

<style scoped>
.filter-bar {
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(220px, 0.9fr) minmax(180px, 0.7fr) auto;
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

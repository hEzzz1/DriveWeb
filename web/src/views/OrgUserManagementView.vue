<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { buildDisplayRoles } from '../access/auth-model'
import PageSectionCard from '../components/PageSectionCard.vue'
import AuditDetailDrawer from '../components/audit/AuditDetailDrawer.vue'
import UserCreateDialog from '../components/users/UserCreateDialog.vue'
import UserDetailDrawer from '../components/users/UserDetailDrawer.vue'
import UserEditDialog from '../components/users/UserEditDialog.vue'
import UserListTable from '../components/users/UserListTable.vue'
import UserResetPasswordDialog from '../components/users/UserResetPasswordDialog.vue'
import UserRolesDialog from '../components/users/UserRolesDialog.vue'
import { getOrgAuditDetail } from '../api/audit'
import {
  createOrgUser,
  getOrgUserAudits,
  getOrgUserDetail,
  getOrgUserList,
  getOrgUserRoleOptions,
  resetOrgUserPassword,
  updateOrgUser,
  updateOrgUserRoles,
  updateOrgUserStatus,
} from '../api/users'
import { useAccess } from '../composables/useAccess'
import { useAuthStore } from '../stores/auth'
import type { AuditDetail, AuditSummary } from '../types/audit'
import type { RoleOptionItem, UserDetail, UserListQuery, UserSummary } from '../types/users'
import { normalizeAuditDetail } from '../utils/audit'

interface FilterModel {
  keyword: string
  enabled?: boolean
}

const ORG_ASSIGNABLE_ROLES = ['ORG_OPERATOR', 'ORG_ANALYST', 'ORG_VIEWER'] as const

const authStore = useAuthStore()
const access = useAccess()

const loading = ref(false)
const roleOptionsLoading = ref(false)
const createSaving = ref(false)
const editSaving = ref(false)
const roleSaving = ref(false)
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
const rolesVisible = ref(false)
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
})

const enabledOptions = [
  { label: '启用中', value: true },
  { label: '已禁用', value: false },
]

const summaryItems = computed(() => [
  { label: '普通用户数', value: total.value },
  { label: '启用账号', value: items.value.filter((item) => item.enabled).length },
  { label: '所属企业', value: authStore.enterpriseName || authStore.enterpriseId || '-' },
  { label: '可分配角色', value: roleOptions.value.length },
])

const activeRoleModel = computed(() =>
  activeDetail.value
    ? buildDisplayRoles(
        activeDetail.value.roles || [],
        activeDetail.value.platformRoles || [],
        activeDetail.value.memberships || [],
      )
    : [],
)

onMounted(async () => {
  authStore.hydrate()
  await authStore.syncCurrentUser()
  enterpriseOptions.value = authStore.enterpriseId
    ? [{ value: Number(authStore.enterpriseId), label: authStore.enterpriseName || `企业 ${authStore.enterpriseId}` }]
    : []
  await Promise.all([fetchList(), fetchRoleOptions()])
})

async function fetchList(): Promise<void> {
  loading.value = true

  try {
    const data = await getOrgUserList(buildQuery())
    items.value = Array.isArray(data.items) ? data.items : []
    total.value = data.total || 0
    currentPage.value = data.page || currentPage.value
    pageSize.value = data.size || pageSize.value
    errorText.value = ''
  } catch (error) {
    errorText.value = error instanceof Error ? error.message : '普通用户列表加载失败'
  } finally {
    loading.value = false
  }
}

async function fetchRoleOptions(): Promise<void> {
  roleOptionsLoading.value = true

  try {
    const options = await getOrgUserRoleOptions()
    roleOptions.value = options.filter((item) => ORG_ASSIGNABLE_ROLES.includes(item.roleCode as (typeof ORG_ASSIGNABLE_ROLES)[number]))
  } finally {
    roleOptionsLoading.value = false
  }
}

function buildQuery(): UserListQuery {
  return {
    page: currentPage.value,
    size: pageSize.value,
    keyword: filters.keyword.trim() || undefined,
    enabled: filters.enabled,
  }
}

async function fetchUserAudits(): Promise<void> {
  if (!activeDetail.value) {
    return
  }

  auditLoading.value = true

  try {
    const data = await getOrgUserAudits(activeDetail.value.id, {
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
    activeDetail.value = await getOrgUserDetail(row.id)
    await fetchUserAudits()
  } catch {
    detailVisible.value = false
  } finally {
    detailLoading.value = false
  }
}

async function handleCreateUser(payload: Parameters<typeof createOrgUser>[0]): Promise<void> {
  createSaving.value = true

  try {
    await createOrgUser(payload)
    createVisible.value = false
    await fetchList()
    ElMessage.success('普通用户已创建')
  } finally {
    createSaving.value = false
  }
}

async function handleEditUser(payload: Parameters<typeof updateOrgUser>[1]): Promise<void> {
  if (!activeDetail.value) {
    return
  }

  editSaving.value = true

  try {
    const detail = await updateOrgUser(activeDetail.value.id, payload)
    activeDetail.value = detail
    syncTableRow(detail)
    editVisible.value = false
    ElMessage.success('用户资料已更新')
  } finally {
    editSaving.value = false
  }
}

async function handleSaveRoles(roles: UserDetail['roles']): Promise<void> {
  if (!activeDetail.value) {
    return
  }

  roleSaving.value = true

  try {
    const detail = await updateOrgUserRoles(activeDetail.value.id, { roles })
    activeDetail.value = detail
    syncTableRow(detail)
    rolesVisible.value = false
    await fetchUserAudits()
    ElMessage.success('角色分配已更新')
  } finally {
    roleSaving.value = false
  }
}

async function handleResetPassword(payload: Parameters<typeof resetOrgUserPassword>[1]): Promise<void> {
  if (!activeDetail.value) {
    return
  }

  resetPasswordSaving.value = true

  try {
    const detail = await resetOrgUserPassword(activeDetail.value.id, payload)
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
    await ElMessageBox.confirm(`确认${actionText}普通用户「${activeDetail.value.username}」吗？`, `${actionText}用户`, {
      type: 'warning',
      confirmButtonText: actionText,
      cancelButtonText: '取消',
    })
  } catch {
    return
  }

  statusSaving.value = true

  try {
    const detail = await updateOrgUserStatus(activeDetail.value.id, { enabled: nextEnabled })
    activeDetail.value = detail
    syncTableRow(detail)
    await fetchUserAudits()
    ElMessage.success(`用户已${actionText}`)
  } finally {
    statusSaving.value = false
  }
}

function syncTableRow(detail: UserDetail): void {
  items.value = items.value.map((item) => (item.id === detail.id ? detail : item))
}

async function handleOpenAuditDetail(row: AuditSummary): Promise<void> {
  activeAuditDetail.value = normalizeAuditDetail(await getOrgAuditDetail(row.id))
  auditDetailVisible.value = true
}
</script>

<template>
  <div class="page-shell">
    <div class="page-head">
      <div>
        <p class="eyebrow">Organization</p>
        <h1>普通用户</h1>
        <p class="subhead">企业域只管理本企业普通用户，不承接平台账号和企业管理员。可分配角色限定为 ORG_OPERATOR、ORG_ANALYST、ORG_VIEWER。</p>
      </div>
    </div>

    <section class="stats-grid">
      <el-card v-for="item in summaryItems" :key="item.label" class="metric-card" shadow="never">
        <p class="metric-label">{{ item.label }}</p>
        <strong>{{ item.value }}</strong>
      </el-card>
    </section>

    <PageSectionCard title="筛选条件" description="按用户名、昵称和状态过滤本企业普通用户。">
      <template #actions>
        <el-button v-if="access.canManageUsers" type="primary" @click="createVisible = true">新建普通用户</el-button>
      </template>

      <div class="filter-bar">
        <el-input v-model="filters.keyword" clearable placeholder="用户名 / 昵称" @keyup.enter="handleSearch" />
        <el-select v-model="filters.enabled" clearable placeholder="账号状态">
          <el-option v-for="item in enabledOptions" :key="String(item.value)" :label="item.label" :value="item.value" />
        </el-select>
        <div class="actions">
          <el-button :loading="loading" type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </div>
      </div>
    </PageSectionCard>

    <PageSectionCard title="普通用户列表" description="列表只展示本企业普通用户，详情区提供资料、角色、状态、密码和审计查看。">
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
      :default-enterprise-id="Number(authStore.enterpriseId) || undefined"
      :lock-enterprise="true"
      @save="handleCreateUser"
    />

    <UserEditDialog
      v-model:visible="editVisible"
      :loading="editSaving"
      :user="activeDetail"
      :enterprise-options="enterpriseOptions"
      :lock-enterprise="true"
      @save="handleEditUser"
    />

    <UserRolesDialog
      v-model:visible="rolesVisible"
      :loading="roleSaving || roleOptionsLoading"
      :role-options="roleOptions"
      :model-value="activeRoleModel"
      @save="handleSaveRoles"
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
      :can-edit="access.canManageUsers"
      :can-assign-roles="access.canManageUsers"
      :can-toggle-status="access.canManageUsers"
      :can-reset-password="access.canManageUsers"
      @edit="editVisible = true"
      @roles="rolesVisible = true"
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
  grid-template-columns: minmax(0, 1.4fr) minmax(180px, 0.8fr) auto;
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

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import PageSectionCard from '../components/PageSectionCard.vue'
import {
  getRoleOptions,
  getUserDetail,
  getUserList,
  updateUserRoles,
  updateUserStatus,
} from '../api/users'
import type { UserRole } from '../types/api'
import {
  userRoleLabelMap,
  type RoleOptionItem,
  type UserDetail,
  type UserListQuery,
  type UserSummary,
} from '../types/users'

interface FilterModel {
  keyword: string
  enabled?: boolean
}

const loading = ref(false)
const detailLoading = ref(false)
const roleSaving = ref(false)
const statusSaving = ref(false)
const roleOptionsLoading = ref(false)
const errorText = ref('')
const items = ref<UserSummary[]>([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)
const roleOptions = ref<RoleOptionItem[]>([])
const detailVisible = ref(false)
const activeDetail = ref<UserDetail | null>(null)
const selectedRoles = ref<UserRole[]>([])

const filters = reactive<FilterModel>({
  keyword: '',
  enabled: undefined,
})

const enabledOptions = [
  { label: '启用中', value: true },
  { label: '已禁用', value: false },
]

const summaryItems = computed(() => [
  { label: '用户总数', value: total.value },
  { label: '启用用户', value: items.value.filter((item) => item.enabled).length },
  { label: '禁用用户', value: items.value.filter((item) => !item.enabled).length },
  { label: '角色种类', value: roleOptions.value.length },
])

const roleLabelMap = computed<Record<string, string>>(() =>
  Object.fromEntries(
    roleOptions.value.map((item) => [item.roleCode, item.roleName || userRoleLabelMap[item.roleCode]]),
  ),
)

onMounted(async () => {
  await Promise.all([fetchList(), fetchRoleOptions()])
})

async function fetchList(): Promise<void> {
  loading.value = true

  try {
    const data = await getUserList(buildQuery())
    items.value = Array.isArray(data.items) ? data.items : []
    total.value = data.total || 0
    currentPage.value = data.page || currentPage.value
    pageSize.value = data.size || pageSize.value
    errorText.value = ''
  } catch (error) {
    errorText.value = error instanceof Error ? error.message : '用户列表加载失败'
  } finally {
    loading.value = false
  }
}

async function fetchRoleOptions(): Promise<void> {
  roleOptionsLoading.value = true

  try {
    roleOptions.value = await getRoleOptions()
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

async function handlePageChange(page: number): Promise<void> {
  currentPage.value = page
  await fetchList()
}

async function handleSizeChange(size: number): Promise<void> {
  pageSize.value = size
  currentPage.value = 1
  await fetchList()
}

async function handleOpenDetail(row: UserSummary): Promise<void> {
  detailVisible.value = true
  detailLoading.value = true

  try {
    const detail = await getUserDetail(row.id)
    activeDetail.value = detail
    selectedRoles.value = [...detail.roles]
  } finally {
    detailLoading.value = false
  }
}

async function handleSaveRoles(): Promise<void> {
  if (!activeDetail.value) {
    return
  }

  roleSaving.value = true

  try {
    const detail = await updateUserRoles(activeDetail.value.id, {
      roles: selectedRoles.value,
    })
    activeDetail.value = detail
    syncTableRow(detail)
    ElMessage.success('角色分配已更新')
  } finally {
    roleSaving.value = false
  }
}

async function handleToggleStatus(): Promise<void> {
  if (!activeDetail.value) {
    return
  }

  const nextEnabled = !activeDetail.value.enabled
  const actionText = nextEnabled ? '启用' : '禁用'

  try {
    await ElMessageBox.confirm(
      `确认${actionText}用户「${activeDetail.value.username}」吗？`,
      `${actionText}用户`,
      {
        type: 'warning',
        confirmButtonText: actionText,
        cancelButtonText: '取消',
      },
    )
  } catch {
    return
  }

  statusSaving.value = true

  try {
    const detail = await updateUserStatus(activeDetail.value.id, {
      enabled: nextEnabled,
    })
    activeDetail.value = detail
    syncTableRow(detail)
    ElMessage.success(`用户已${actionText}`)
  } finally {
    statusSaving.value = false
  }
}

function syncTableRow(detail: UserDetail): void {
  items.value = items.value.map((item) => (item.id === detail.id ? detail : item))
}

function getRoleTagType(role: UserRole): '' | 'success' | 'warning' | 'info' | 'primary' | 'danger' {
  if (role === 'SUPER_ADMIN') {
    return 'danger'
  }

  if (role === 'SYS_ADMIN') {
    return 'warning'
  }

  if (role === 'RISK_ADMIN') {
    return 'success'
  }

  if (role === 'OPERATOR') {
    return 'primary'
  }

  return 'info'
}

function formatRole(role: UserRole): string {
  return roleLabelMap.value[role] || userRoleLabelMap[role] || role
}

function formatDateTime(value?: string): string {
  if (!value) {
    return '-'
  }

  const time = Date.parse(value)
  return Number.isNaN(time) ? value : new Date(time).toLocaleString()
}
</script>

<template>
  <div class="page-shell">
    <div class="page-head">
      <div>
        <p class="eyebrow">Users</p>
        <h1>用户管理</h1>
        <p class="subhead">面向超级管理员统一管理账号、角色分配与启停状态。</p>
      </div>
    </div>

    <section class="stats-grid">
      <el-card v-for="item in summaryItems" :key="item.label" class="metric-card" shadow="never">
        <p class="metric-label">{{ item.label }}</p>
        <strong>{{ item.value }}</strong>
      </el-card>
    </section>

    <PageSectionCard title="筛选条件" description="按用户名、昵称或启用状态快速定位账号。">
      <div class="filter-bar">
        <el-input
          v-model="filters.keyword"
          clearable
          placeholder="用户名 / 昵称"
          @keyup.enter="handleSearch"
        />
        <el-select v-model="filters.enabled" clearable placeholder="账号状态">
          <el-option
            v-for="item in enabledOptions"
            :key="String(item.value)"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
        <div class="actions">
          <el-button :loading="loading" type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </div>
      </div>
    </PageSectionCard>

    <PageSectionCard title="用户列表" description="支持查看详情、分配角色与启用或禁用账号。">
      <el-alert v-if="errorText" :closable="false" type="error" :title="errorText" show-icon />

      <div class="table-wrap">
        <el-table :data="items" :loading="loading" stripe>
          <el-table-column prop="username" label="用户名" min-width="140" />
          <el-table-column prop="nickname" label="昵称" min-width="140">
            <template #default="{ row }">
              {{ row.nickname || '-' }}
            </template>
          </el-table-column>
          <el-table-column label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="row.enabled ? 'success' : 'info'" effect="plain">
                {{ row.enabled ? '启用中' : '已禁用' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="角色" min-width="280">
            <template #default="{ row }">
              <div class="role-tags">
                <el-tag
                  v-for="role in row.roles"
                  :key="role"
                  :type="getRoleTagType(role)"
                  effect="plain"
                >
                  {{ formatRole(role) }}
                </el-tag>
                <span v-if="!row.roles.length" class="empty-text">未分配角色</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="创建时间" min-width="180">
            <template #default="{ row }">
              {{ formatDateTime(row.createdAt) }}
            </template>
          </el-table-column>
          <el-table-column label="更新时间" min-width="180">
            <template #default="{ row }">
              {{ formatDateTime(row.updatedAt) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" min-width="120" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" @click="handleOpenDetail(row)">详情</el-button>
            </template>
          </el-table-column>
        </el-table>

        <div class="pager">
          <span>共 {{ total }} 条</span>
          <el-pagination
            background
            layout="sizes, prev, pager, next"
            :total="total"
            :current-page="currentPage"
            :page-size="pageSize"
            :page-sizes="[10, 20, 50]"
            @current-change="handlePageChange"
            @size-change="handleSizeChange"
          />
        </div>
      </div>
    </PageSectionCard>

    <el-drawer
      v-model="detailVisible"
      size="620px"
      title="用户详情"
    >
      <el-skeleton :loading="detailLoading" animated :rows="8">
        <template #default>
          <div v-if="activeDetail" class="drawer-body">
            <el-descriptions :column="2" border>
              <el-descriptions-item label="用户 ID">{{ activeDetail.id }}</el-descriptions-item>
              <el-descriptions-item label="用户名">{{ activeDetail.username }}</el-descriptions-item>
              <el-descriptions-item label="昵称">{{ activeDetail.nickname || '-' }}</el-descriptions-item>
              <el-descriptions-item label="状态">
                <el-tag :type="activeDetail.enabled ? 'success' : 'info'" effect="plain">
                  {{ activeDetail.enabled ? '启用中' : '已禁用' }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="创建时间">{{ formatDateTime(activeDetail.createdAt) }}</el-descriptions-item>
              <el-descriptions-item label="更新时间">{{ formatDateTime(activeDetail.updatedAt) }}</el-descriptions-item>
            </el-descriptions>

            <PageSectionCard title="角色分配" description="可为当前账号分配多个角色。">
              <el-select
                v-model="selectedRoles"
                class="full-width"
                clearable
                collapse-tags
                collapse-tags-tooltip
                filterable
                multiple
                placeholder="请选择角色"
              >
                <el-option
                  v-for="item in roleOptions"
                  :key="item.roleCode"
                  :label="item.roleName || userRoleLabelMap[item.roleCode]"
                  :value="item.roleCode"
                />
              </el-select>

              <div class="drawer-actions">
                <el-button
                  :loading="roleOptionsLoading"
                  plain
                  @click="fetchRoleOptions"
                >
                  刷新角色
                </el-button>
                <el-button
                  type="primary"
                  :loading="roleSaving"
                  @click="handleSaveRoles"
                >
                  保存角色
                </el-button>
              </div>
            </PageSectionCard>

            <PageSectionCard title="账号状态" description="支持启用或禁用当前账号。">
              <div class="status-panel">
                <p>
                  当前状态：
                  <strong>{{ activeDetail.enabled ? '启用中' : '已禁用' }}</strong>
                </p>
                <el-button
                  :loading="statusSaving"
                  :type="activeDetail.enabled ? 'warning' : 'success'"
                  @click="handleToggleStatus"
                >
                  {{ activeDetail.enabled ? '禁用用户' : '启用用户' }}
                </el-button>
              </div>
            </PageSectionCard>
          </div>

          <el-empty v-else description="未获取到用户详情" />
        </template>
      </el-skeleton>
    </el-drawer>
  </div>
</template>

<style scoped>
.page-shell {
  display: grid;
  gap: 18px;
}

.filter-bar {
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(220px, 0.8fr) auto;
  gap: 12px;
  align-items: center;
}

.actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.table-wrap {
  display: grid;
  gap: 16px;
}

.role-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.pager {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.drawer-body {
  display: grid;
  gap: 16px;
}

.drawer-actions {
  margin-top: 14px;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.status-panel {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.status-panel p {
  margin: 0;
  color: var(--text-soft);
}

.status-panel strong {
  color: var(--text-main);
}

.full-width {
  width: 100%;
}

.empty-text {
  color: var(--text-soft);
  font-size: 13px;
}

@media (max-width: 960px) {
  .filter-bar {
    grid-template-columns: 1fr;
  }

  .actions {
    justify-content: flex-start;
  }

  .pager {
    flex-direction: column;
    align-items: flex-start;
  }

  .status-panel {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>

<script setup lang="ts">
import type { UserRole } from '../../types/api'
import type { UserSummary } from '../../types/users'
import { userRoleLabelMap } from '../../types/users'

defineProps<{
  items: UserSummary[]
  loading?: boolean
  total: number
  page: number
  size: number
}>()

const emit = defineEmits<{
  detail: [row: UserSummary]
  'page-change': [page: number]
  'size-change': [size: number]
}>()

function formatDateTime(value?: string): string {
  if (!value) {
    return '-'
  }

  const time = Date.parse(value)
  return Number.isNaN(time) ? value : new Date(time).toLocaleString()
}

function getRoleTagType(role: UserRole): '' | 'success' | 'warning' | 'info' | 'primary' | 'danger' {
  if (role === 'SUPER_ADMIN') {
    return 'danger'
  }

  if (role === 'ENTERPRISE_ADMIN' || role === 'SYS_ADMIN') {
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

function formatRole(role: UserRole | string): string {
  return userRoleLabelMap[role as UserRole] || role
}
</script>

<template>
  <div class="table-wrap">
    <el-table :data="items" :loading="loading" stripe>
      <el-table-column prop="username" label="用户名" min-width="140" />
      <el-table-column prop="nickname" label="昵称" min-width="130">
        <template #default="{ row }">
          {{ row.nickname || '-' }}
        </template>
      </el-table-column>
      <el-table-column prop="enterpriseName" label="所属企业" min-width="160">
        <template #default="{ row }">
          {{ row.enterpriseName || row.enterpriseId || '-' }}
        </template>
      </el-table-column>
      <el-table-column label="角色" min-width="260">
        <template #default="{ row }">
          <div class="role-tags">
            <el-tag v-for="role in row.roles" :key="role" effect="plain" :type="getRoleTagType(role)">
              {{ formatRole(role) }}
            </el-tag>
            <span v-if="!row.roles.length" class="empty-text">未分配角色</span>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag effect="plain" :type="row.enabled ? 'success' : 'info'">
            {{ row.enabled ? '启用中' : '已禁用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="最近登录时间" min-width="180">
        <template #default="{ row }">
          {{ formatDateTime(row.lastLoginAt) }}
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
      <el-table-column label="操作" width="90" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="emit('detail', row)">详情</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="pager">
      <span>共 {{ total }} 条</span>
      <el-pagination
        background
        layout="sizes, prev, pager, next"
        :total="total"
        :current-page="page"
        :page-size="size"
        :page-sizes="[10, 20, 50]"
        @current-change="emit('page-change', $event)"
        @size-change="emit('size-change', $event)"
      />
    </div>
  </div>
</template>

<style scoped>
.role-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.empty-text {
  color: var(--text-soft);
  font-size: 13px;
}

.pager {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

@media (max-width: 720px) {
  .pager {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>

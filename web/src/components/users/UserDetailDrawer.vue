<script setup lang="ts">
import type { AuditSummary } from '../../types/audit'
import type { UserRole } from '../../types/api'
import { buildDisplayRoles, formatRoleLabel, formatScopeLabel, getRoleTagType } from '../../access/auth-model'
import type { UserDetail } from '../../types/users'
import { formatDateTime } from '../../utils/time'
import AuditListTable from '../audit/AuditListTable.vue'

defineProps<{
  visible: boolean
  detail?: UserDetail | null
  loading?: boolean
  auditItems: AuditSummary[]
  auditLoading?: boolean
  auditTotal: number
  auditPage: number
  auditSize: number
  canEdit?: boolean
  canAssignRoles?: boolean
  canToggleStatus?: boolean
  canResetPassword?: boolean
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  edit: []
  roles: []
  toggleStatus: []
  resetPassword: []
  'audit-detail': [row: AuditSummary]
  'audit-page-change': [page: number]
  'audit-size-change': [size: number]
}>()

function resolveRoles(detail: UserDetail): UserRole[] {
  return buildDisplayRoles(detail.roles || [], detail.platformRoles || [], detail.memberships || [])
}
</script>

<template>
  <el-drawer :model-value="visible" size="760px" title="用户详情" @close="emit('update:visible', false)">
    <el-skeleton :loading="loading" animated :rows="10">
      <template #default>
        <el-empty v-if="!detail" description="未获取到用户详情" />
        <div v-else class="drawer-body">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="用户 ID">{{ detail.id }}</el-descriptions-item>
            <el-descriptions-item label="状态">
              <el-tag effect="plain" :type="detail.enabled ? 'success' : 'info'">
                {{ detail.enabled ? '启用中' : '已禁用' }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="用户名">{{ detail.username }}</el-descriptions-item>
            <el-descriptions-item label="昵称">{{ detail.nickname || '-' }}</el-descriptions-item>
            <el-descriptions-item label="企业">{{ detail.enterpriseName || detail.enterpriseId || '-' }}</el-descriptions-item>
            <el-descriptions-item label="默认范围">{{ formatScopeLabel(detail.defaultScope) }}</el-descriptions-item>
            <el-descriptions-item label="角色">
              <div class="role-tags">
                <el-tag v-for="role in resolveRoles(detail)" :key="role" effect="plain" :type="getRoleTagType(role)">
                  {{ formatRoleLabel(role) || role }}
                </el-tag>
              </div>
            </el-descriptions-item>
            <el-descriptions-item label="业务归属" :span="2">
              <div class="membership-tags">
                <span
                  v-for="item in detail.memberships || []"
                  :key="`${item.role}-${item.scopeType}-${item.enterpriseId ?? 'na'}-${item.fleetId ?? 'na'}`"
                  class="membership-chip"
                >
                  {{ formatRoleLabel(item.role) }} · {{ formatScopeLabel(item) }}
                </span>
                <span v-if="!(detail.memberships || []).length" class="empty-text">未返回业务归属</span>
              </div>
            </el-descriptions-item>
            <el-descriptions-item label="创建时间">{{ formatDateTime(detail.createdAt) }}</el-descriptions-item>
            <el-descriptions-item label="更新时间">{{ formatDateTime(detail.updatedAt) }}</el-descriptions-item>
          </el-descriptions>

          <div class="action-row">
            <el-button v-if="canEdit" @click="emit('edit')">编辑资料</el-button>
            <el-button v-if="canAssignRoles" type="primary" plain @click="emit('roles')">分配角色</el-button>
            <el-button
              v-if="canToggleStatus"
              :type="detail.enabled ? 'warning' : 'success'"
              plain
              @click="emit('toggleStatus')"
            >
              {{ detail.enabled ? '禁用用户' : '启用用户' }}
            </el-button>
            <el-button v-if="canResetPassword" type="danger" plain @click="emit('resetPassword')">重置密码</el-button>
          </div>

          <div class="audit-block">
            <div class="audit-head">
              <h3>最近操作记录</h3>
              <span>展示当前用户的用户域审计记录</span>
            </div>
            <AuditListTable
              :items="auditItems"
              :loading="auditLoading"
              :total="auditTotal"
              :page="auditPage"
              :size="auditSize"
              @detail="emit('audit-detail', $event)"
              @page-change="emit('audit-page-change', $event)"
              @size-change="emit('audit-size-change', $event)"
            />
          </div>
        </div>
      </template>
    </el-skeleton>
  </el-drawer>
</template>

<style scoped>
.drawer-body {
  display: grid;
  gap: 18px;
}

.role-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.membership-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.membership-chip {
  display: inline-flex;
  align-items: center;
  min-height: 28px;
  padding: 0 10px;
  border-radius: 999px;
  background: #f5f8f9;
  color: #47616a;
  font-size: 13px;
}

.empty-text {
  color: var(--text-soft);
}

.action-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.audit-block {
  display: grid;
  gap: 12px;
}

.audit-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
}

.audit-head h3 {
  margin: 0;
}

.audit-head span {
  color: var(--text-soft);
  font-size: 12px;
}
</style>

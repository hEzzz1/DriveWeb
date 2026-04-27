<script setup lang="ts">
import type { AuditSummary } from '../../types/audit'
import type { EnterpriseDetail } from '../../types/enterprises'
import type { UserSummary } from '../../types/users'
import AuditListTable from '../audit/AuditListTable.vue'

defineProps<{
  visible: boolean
  detail?: EnterpriseDetail | null
  loading?: boolean
  users: UserSummary[]
  audits: AuditSummary[]
  auditLoading?: boolean
  auditTotal: number
  auditPage: number
  auditSize: number
  canEdit?: boolean
  canToggleStatus?: boolean
  canViewUsers?: boolean
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  edit: []
  toggleStatus: []
  'audit-detail': [row: AuditSummary]
  'audit-page-change': [page: number]
  'audit-size-change': [size: number]
}>()

function formatDateTime(value?: string): string {
  if (!value) {
    return '-'
  }

  const time = Date.parse(value)
  return Number.isNaN(time) ? value : new Date(time).toLocaleString()
}
</script>

<template>
  <el-drawer :model-value="visible" size="760px" title="企业详情" @close="emit('update:visible', false)">
    <el-skeleton :loading="loading" animated :rows="9">
      <template #default>
        <el-empty v-if="!detail" description="未获取到企业详情" />
        <div v-else class="drawer-body">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="企业 ID">{{ detail.id }}</el-descriptions-item>
            <el-descriptions-item label="状态">
              <el-tag effect="plain" :type="detail.enabled ? 'success' : 'info'">
                {{ detail.enabled ? '启用中' : '已禁用' }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="企业编码">{{ detail.code }}</el-descriptions-item>
            <el-descriptions-item label="企业名称">{{ detail.name }}</el-descriptions-item>
            <el-descriptions-item label="联系人">{{ detail.contactName || '-' }}</el-descriptions-item>
            <el-descriptions-item label="联系方式">{{ detail.contactPhone || '-' }}</el-descriptions-item>
            <el-descriptions-item label="创建时间">{{ formatDateTime(detail.createdAt) }}</el-descriptions-item>
            <el-descriptions-item label="更新时间">{{ formatDateTime(detail.updatedAt) }}</el-descriptions-item>
            <el-descriptions-item label="备注" :span="2">{{ detail.remark || '-' }}</el-descriptions-item>
          </el-descriptions>

          <div class="action-row">
            <el-button v-if="canEdit" @click="emit('edit')">编辑企业</el-button>
            <el-button
              v-if="canToggleStatus"
              :type="detail.enabled ? 'warning' : 'success'"
              plain
              @click="emit('toggleStatus')"
            >
              {{ detail.enabled ? '禁用企业' : '启用企业' }}
            </el-button>
          </div>

          <div class="summary-block">
            <div class="summary-head">
              <h3>企业下用户摘要</h3>
              <span>{{ canViewUsers ? `当前展示 ${users.length} 条` : '当前账号不具备用户查看权限' }}</span>
            </div>
            <el-empty v-if="!canViewUsers" description="无权限查看企业下用户摘要" />
            <el-empty v-else-if="!users.length" description="暂无用户数据" />
            <div v-else class="user-chips">
              <el-tag v-for="item in users" :key="item.id" effect="plain">
                {{ item.username }} / {{ item.nickname || '-' }}
              </el-tag>
            </div>
          </div>

          <div class="summary-block">
            <div class="summary-head">
              <h3>最近变更记录</h3>
              <span>展示当前企业的企业域审计记录</span>
            </div>
            <AuditListTable
              :items="audits"
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

.action-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.summary-block {
  display: grid;
  gap: 12px;
}

.summary-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
}

.summary-head h3 {
  margin: 0;
}

.summary-head span {
  color: var(--text-soft);
  font-size: 12px;
}

.user-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
</style>

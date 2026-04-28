<script setup lang="ts">
import type { FleetDetail } from '../../types/fleets'

defineProps<{
  visible: boolean
  detail?: FleetDetail | null
  loading?: boolean
  canManage?: boolean
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  edit: []
  toggleStatus: []
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
  <el-drawer :model-value="visible" size="680px" title="车队详情" @close="emit('update:visible', false)">
    <el-skeleton :loading="loading" animated :rows="8">
      <template #default>
        <el-empty v-if="!detail" description="未获取到车队详情" />
        <div v-else class="drawer-body">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="车队 ID">{{ detail.id }}</el-descriptions-item>
            <el-descriptions-item label="状态">
              <el-tag effect="plain" :type="detail.enabled ? 'success' : 'info'">
                {{ detail.enabled ? '启用中' : '已停用' }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="所属企业">{{ detail.enterpriseName || detail.enterpriseId }}</el-descriptions-item>
            <el-descriptions-item label="驾驶员数量">{{ detail.driverCount ?? '-' }}</el-descriptions-item>
            <el-descriptions-item label="车队名称">{{ detail.name }}</el-descriptions-item>
            <el-descriptions-item label="创建时间">{{ formatDateTime(detail.createdAt) }}</el-descriptions-item>
            <el-descriptions-item label="更新时间">{{ formatDateTime(detail.updatedAt) }}</el-descriptions-item>
            <el-descriptions-item label="备注" :span="2">{{ detail.remark || '-' }}</el-descriptions-item>
          </el-descriptions>

          <div v-if="canManage" class="action-row">
            <el-button @click="emit('edit')">编辑车队</el-button>
            <el-button :type="detail.enabled ? 'warning' : 'success'" plain @click="emit('toggleStatus')">
              {{ detail.enabled ? '停用车队' : '启用车队' }}
            </el-button>
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
</style>

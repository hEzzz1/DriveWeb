<script setup lang="ts">
import type { DriverDetail } from '../../types/drivers'
import { formatDateTime } from '../../utils/time'

defineProps<{
  visible: boolean
  detail?: DriverDetail | null
  loading?: boolean
  canManage?: boolean
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  edit: []
  reassign: []
  unassign: []
  resetPin: []
  toggleStatus: []
}>()

</script>

<template>
  <el-drawer :model-value="visible" size="720px" title="驾驶员详情" @close="emit('update:visible', false)">
    <el-skeleton :loading="loading" animated :rows="9">
      <template #default>
        <el-empty v-if="!detail" description="未获取到驾驶员详情" />
        <div v-else class="drawer-body">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="驾驶员编号">{{ detail.driverCode || detail.id }}</el-descriptions-item>
            <el-descriptions-item label="状态">
              <el-tag effect="plain" :type="detail.enabled ? 'success' : 'info'">
                {{ detail.enabled ? '启用中' : '已禁用' }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="姓名">{{ detail.name }}</el-descriptions-item>
            <el-descriptions-item label="手机号">{{ detail.phone || '-' }}</el-descriptions-item>
            <el-descriptions-item label="驾驶证号">{{ detail.licenseNo || '-' }}</el-descriptions-item>
            <el-descriptions-item label="所属企业">{{ detail.enterpriseName || detail.enterpriseId }}</el-descriptions-item>
            <el-descriptions-item label="所属车队">{{ detail.fleetName || detail.fleetId || '未分配' }}</el-descriptions-item>
            <el-descriptions-item label="活跃会话">
              {{ detail.hasActiveSession ? `进行中${detail.activeSessionId ? ` #${detail.activeSessionId}` : ''}` : '无' }}
            </el-descriptions-item>
            <el-descriptions-item label="创建时间">{{ formatDateTime(detail.createdAt) }}</el-descriptions-item>
            <el-descriptions-item label="更新时间">{{ formatDateTime(detail.updatedAt) }}</el-descriptions-item>
            <el-descriptions-item label="备注" :span="2">{{ detail.remark || '-' }}</el-descriptions-item>
          </el-descriptions>

          <div v-if="canManage" class="action-row">
            <el-button @click="emit('edit')">编辑资料</el-button>
            <el-button type="primary" plain @click="emit('reassign')">调整车队</el-button>
            <el-button v-if="detail.fleetId && !detail.hasActiveSession" type="warning" plain @click="emit('unassign')">移出车队</el-button>
            <el-button plain @click="emit('resetPin')">重置签到码</el-button>
            <el-button :type="detail.enabled ? 'warning' : 'success'" plain @click="emit('toggleStatus')">
              {{ detail.enabled ? '禁用驾驶员' : '启用驾驶员' }}
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

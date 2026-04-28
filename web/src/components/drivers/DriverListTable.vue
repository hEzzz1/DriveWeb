<script setup lang="ts">
import type { DriverSummary } from '../../types/drivers'

defineProps<{
  items: DriverSummary[]
  loading?: boolean
  total: number
  page: number
  size: number
  canManage?: boolean
}>()

const emit = defineEmits<{
  detail: [row: DriverSummary]
  edit: [row: DriverSummary]
  toggleStatus: [row: DriverSummary]
  reassign: [row: DriverSummary]
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
</script>

<template>
  <div class="table-wrap">
    <el-table :data="items" :loading="loading" stripe>
      <el-table-column prop="id" label="驾驶员 ID" width="110" />
      <el-table-column prop="name" label="姓名" min-width="120" />
      <el-table-column prop="phone" label="手机号" min-width="140">
        <template #default="{ row }">
          {{ row.phone || '-' }}
        </template>
      </el-table-column>
      <el-table-column prop="licenseNo" label="驾驶证号" min-width="180">
        <template #default="{ row }">
          {{ row.licenseNo || '-' }}
        </template>
      </el-table-column>
      <el-table-column prop="enterpriseName" label="所属企业" min-width="160">
        <template #default="{ row }">
          {{ row.enterpriseName || row.enterpriseId }}
        </template>
      </el-table-column>
      <el-table-column prop="fleetName" label="所属车队" min-width="160">
        <template #default="{ row }">
          {{ row.fleetName || row.fleetId }}
        </template>
      </el-table-column>
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag effect="plain" :type="row.enabled ? 'success' : 'info'">
            {{ row.enabled ? '启用中' : '已禁用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="创建时间" min-width="180">
        <template #default="{ row }">
          {{ formatDateTime(row.createdAt) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" min-width="220" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="emit('detail', row)">详情</el-button>
          <el-button v-if="canManage" link @click="emit('edit', row)">编辑</el-button>
          <el-button v-if="canManage" link @click="emit('reassign', row)">调车队</el-button>
          <el-button v-if="canManage" link :type="row.enabled ? 'warning' : 'success'" @click="emit('toggleStatus', row)">
            {{ row.enabled ? '禁用' : '启用' }}
          </el-button>
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

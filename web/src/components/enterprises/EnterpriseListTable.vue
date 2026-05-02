<script setup lang="ts">
import type { EnterpriseSummary } from '../../types/enterprises'

defineProps<{
  items: EnterpriseSummary[]
  loading?: boolean
  total: number
  page: number
  size: number
  canEdit?: boolean
  canToggleStatus?: boolean
  selectable?: boolean
}>()

const emit = defineEmits<{
  detail: [row: EnterpriseSummary]
  edit: [row: EnterpriseSummary]
  toggleStatus: [row: EnterpriseSummary]
  selectionChange: [rows: EnterpriseSummary[]]
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
    <el-table
      :data="items"
      :loading="loading"
      stripe
      row-key="id"
      @selection-change="emit('selectionChange', $event)"
    >
      <el-table-column v-if="selectable" type="selection" width="48" reserve-selection />
      <el-table-column prop="id" label="企业 ID" width="100" />
      <el-table-column prop="code" label="企业编码" min-width="140" />
      <el-table-column prop="name" label="企业名称" min-width="180" />
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag effect="plain" :type="row.enabled ? 'success' : 'info'">
            {{ row.enabled ? '启用中' : '已禁用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="contactName" label="联系人" min-width="120">
        <template #default="{ row }">
          {{ row.contactName || '-' }}
        </template>
      </el-table-column>
      <el-table-column prop="contactPhone" label="联系方式" min-width="140">
        <template #default="{ row }">
          {{ row.contactPhone || '-' }}
        </template>
      </el-table-column>
      <el-table-column label="备注" min-width="180">
        <template #default="{ row }">
          {{ row.remark || '-' }}
        </template>
      </el-table-column>
      <el-table-column label="创建时间" min-width="180">
        <template #default="{ row }">
          {{ formatDateTime(row.createdAt) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" min-width="160" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="emit('detail', row)">详情</el-button>
          <el-button v-if="canEdit" link @click="emit('edit', row)">编辑</el-button>
          <el-button v-if="canToggleStatus" link :type="row.enabled ? 'warning' : 'success'" @click="emit('toggleStatus', row)">
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

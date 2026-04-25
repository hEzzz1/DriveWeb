<script setup lang="ts">
import type { AuditSummary } from '../../types/audit'

defineProps<{
  items: AuditSummary[]
  loading?: boolean
  total: number
  page: number
  size: number
}>()

const emit = defineEmits<{
  detail: [row: AuditSummary]
  'page-change': [page: number]
  'size-change': [size: number]
}>()
</script>

<template>
  <div class="table-wrap">
    <el-table :data="items" :loading="loading" stripe>
      <el-table-column prop="traceId" label="Trace ID" min-width="180" />
      <el-table-column prop="actionType" label="操作类型" width="120" />
      <el-table-column prop="operator" label="操作人" width="120" />
      <el-table-column prop="targetType" label="对象类型" width="120" />
      <el-table-column prop="targetName" label="对象名称" min-width="160" />
      <el-table-column label="结果" width="120">
        <template #default="{ row }">
          <el-tag
            effect="plain"
            :type="row.result === 'SUCCESS' ? 'success' : row.result === 'PARTIAL_SUCCESS' ? 'warning' : 'danger'"
          >
            {{ row.result }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="occurredAt" label="发生时间" min-width="180" />
      <el-table-column label="操作" width="100" fixed="right">
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
.table-wrap {
  display: grid;
  gap: 16px;
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

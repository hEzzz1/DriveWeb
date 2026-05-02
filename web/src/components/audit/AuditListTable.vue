<script setup lang="ts">
import type { AuditSummary } from '../../types/audit'
import {
  formatAuditModule,
  formatAuditResult,
  getAuditResultTagType,
  resolveAuditOperatorLabel,
  resolveAuditTargetLabel,
} from '../../utils/audit'
import { formatDateTime } from '../../utils/time'

withDefaults(
  defineProps<{
    items: AuditSummary[]
    loading?: boolean
    total?: number
    page?: number
    size?: number
    showPager?: boolean
  }>(),
  {
    total: 0,
    page: 1,
    size: 10,
    showPager: true,
  },
)

const emit = defineEmits<{
  detail: [row: AuditSummary]
  'page-change': [page: number]
  'size-change': [size: number]
}>()

</script>

<template>
  <div class="table-wrap">
    <el-table :data="items" :loading="loading" stripe>
      <el-table-column label="模块" width="110">
        <template #default="{ row }">
          {{ formatAuditModule(row.module) }}
        </template>
      </el-table-column>
      <el-table-column prop="actionType" label="动作" min-width="180" />
      <el-table-column label="操作人" min-width="160">
        <template #default="{ row }">
          {{ resolveAuditOperatorLabel(row) }}
        </template>
      </el-table-column>
      <el-table-column prop="actionTargetType" label="对象类型" width="120" />
      <el-table-column label="对象" min-width="180">
        <template #default="{ row }">
          {{ resolveAuditTargetLabel(row) }}
        </template>
      </el-table-column>
      <el-table-column prop="actionRemark" label="说明" min-width="180">
        <template #default="{ row }">
          {{ row.actionRemark || '-' }}
        </template>
      </el-table-column>
      <el-table-column label="结果" width="110">
        <template #default="{ row }">
          <el-tag effect="plain" :type="getAuditResultTagType(row.actionResult)">
            {{ formatAuditResult(row.actionResult) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="发生时间" min-width="180">
        <template #default="{ row }">
          {{ formatDateTime(row.actionTime) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="90" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="emit('detail', row)">详情</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div v-if="showPager" class="pager">
      <span>共 {{ total }} 条</span>
      <el-pagination
        background
        layout="sizes, prev, pager, next"
        :total="total"
        :current-page="page"
        :page-size="size"
        :page-sizes="[5, 10, 20, 50]"
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

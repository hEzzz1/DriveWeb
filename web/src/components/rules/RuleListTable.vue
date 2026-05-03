<script setup lang="ts">
import { computed } from 'vue'
import { ruleStatusLabelMap, ruleTypeOptions, type RuleSummary } from '../../types/rules'

const props = defineProps<{
  items: RuleSummary[]
  loading?: boolean
  total: number
  page: number
  size: number
  canManage?: boolean
}>()

const emit = defineEmits<{
  edit: [row: RuleSummary]
  toggle: [row: RuleSummary]
  publish: [row: RuleSummary]
  versions: [row: RuleSummary]
  'page-change': [page: number]
  'size-change': [size: number]
}>()

const typeLabelMap = computed(() =>
  Object.fromEntries(ruleTypeOptions.map((item) => [item.value, item.label])),
)

function getRuleStatusLabel(status: RuleSummary['status']): string {
  return ruleStatusLabelMap[status as keyof typeof ruleStatusLabelMap] || status
}
</script>

<template>
  <div class="table-wrap">
    <el-table :data="items" :loading="loading" stripe>
      <el-table-column prop="name" label="规则名称" min-width="180" />
      <el-table-column prop="ruleCode" label="编码" min-width="120" />
      <el-table-column label="风险等级" min-width="120">
        <template #default="{ row }">
          {{ typeLabelMap[row.type] || row.type }}
        </template>
      </el-table-column>
      <el-table-column label="状态" width="110">
        <template #default="{ row }">
          <el-tag :type="row.status === 'ENABLED' ? 'success' : row.status === 'DRAFT' ? 'warning' : 'info'" effect="plain">
            {{ getRuleStatusLabel(row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="currentVersion" label="当前版本" width="120" />
      <el-table-column label="规则参数" min-width="220">
        <template #default="{ row }">
          阈值 {{ row.threshold }} / 持续 {{ row.durationSeconds }}s / 冷却 {{ row.cooldownSeconds }}s
        </template>
      </el-table-column>
      <el-table-column label="触发/误报" min-width="160">
        <template #default="{ row }">
          {{ row.alertCount ?? 0 }} / {{ row.falsePositiveCount ?? 0 }}
        </template>
      </el-table-column>
      <el-table-column label="误报率" width="110">
        <template #default="{ row }">
          {{ row.falsePositiveRate !== undefined ? `${(row.falsePositiveRate * 100).toFixed(1)}%` : '-' }}
        </template>
      </el-table-column>
      <el-table-column prop="updatedBy" label="更新人" width="120" />
      <el-table-column prop="updatedAt" label="更新时间" min-width="180" />
      <el-table-column v-if="canManage" label="操作" fixed="right" min-width="250">
        <template #default="{ row }">
          <div class="row-actions">
            <el-button link type="primary" @click="emit('edit', row)">编辑</el-button>
            <el-button link type="primary" @click="emit('toggle', row)">
              {{ row.status === 'ENABLED' ? '停用' : '启用' }}
            </el-button>
            <el-button link type="primary" @click="emit('publish', row)">发布</el-button>
            <el-button link type="primary" @click="emit('versions', row)">版本历史</el-button>
          </div>
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

.row-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 10px;
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

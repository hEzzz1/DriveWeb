<script setup lang="ts">
import { reactive, watch } from 'vue'
import { auditActionOptions, auditResultOptions, auditTargetOptions, type AuditFilter } from '../../types/audit'

const props = defineProps<{
  modelValue: AuditFilter
  loading?: boolean
  canExport?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: AuditFilter]
  search: []
  reset: []
  export: []
}>()

const localModel = reactive({
  timeRange: [] as [Date, Date] | [],
  actionType: undefined as AuditFilter['actionType'],
  operator: '',
  targetType: undefined as AuditFilter['targetType'],
  result: undefined as AuditFilter['result'],
})

watch(
  () => props.modelValue,
  (value) => {
    localModel.actionType = value.actionType
    localModel.operator = value.operator || ''
    localModel.targetType = value.targetType
    localModel.result = value.result
    if (value.startTime && value.endTime) {
      localModel.timeRange = [new Date(value.startTime), new Date(value.endTime)]
      return
    }
    localModel.timeRange = []
  },
  { immediate: true, deep: true },
)

function syncModel(): void {
  emit('update:modelValue', {
    ...props.modelValue,
    startTime: localModel.timeRange.length === 2 ? localModel.timeRange[0].toISOString() : undefined,
    endTime: localModel.timeRange.length === 2 ? localModel.timeRange[1].toISOString() : undefined,
    actionType: localModel.actionType,
    operator: localModel.operator.trim() || undefined,
    targetType: localModel.targetType,
    result: localModel.result,
  })
}

function handleSearch(): void {
  syncModel()
  emit('search')
}
</script>

<template>
  <div class="filter-bar">
    <el-date-picker
      v-model="localModel.timeRange"
      type="datetimerange"
      start-placeholder="开始时间"
      end-placeholder="结束时间"
      range-separator="至"
    />
    <el-select v-model="localModel.actionType" clearable placeholder="操作类型">
      <el-option v-for="item in auditActionOptions" :key="item.value" :label="item.label" :value="item.value" />
    </el-select>
    <el-input v-model="localModel.operator" clearable placeholder="操作人" @keyup.enter="handleSearch" />
    <el-select v-model="localModel.targetType" clearable placeholder="对象类型">
      <el-option v-for="item in auditTargetOptions" :key="item.value" :label="item.label" :value="item.value" />
    </el-select>
    <el-select v-model="localModel.result" clearable placeholder="结果">
      <el-option v-for="item in auditResultOptions" :key="item.value" :label="item.label" :value="item.value" />
    </el-select>
    <div class="actions">
      <el-button :loading="loading" type="primary" @click="handleSearch">查询</el-button>
      <el-button @click="emit('reset')">重置</el-button>
      <el-button v-if="canExport" type="success" @click="emit('export')">导出</el-button>
    </div>
  </div>
</template>

<style scoped>
.filter-bar {
  display: grid;
  grid-template-columns: 1.4fr repeat(4, minmax(0, 1fr)) auto;
  gap: 12px;
  align-items: center;
}

.actions {
  display: flex;
  gap: 8px;
  padding-left: 8px;
}

@media (max-width: 1200px) {
  .filter-bar {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .actions {
    grid-column: 1 / -1;
  }
}

@media (max-width: 720px) {
  .filter-bar {
    grid-template-columns: 1fr;
  }
}
</style>

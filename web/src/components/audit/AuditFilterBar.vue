<script setup lang="ts">
import { reactive, watch } from 'vue'
import { auditModuleOptions, auditTargetOptions, type AuditFilter } from '../../types/audit'

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
  module: undefined as AuditFilter['module'],
  actionType: undefined as AuditFilter['actionType'],
  targetId: '',
  actionBy: undefined as number | undefined,
  targetType: undefined as AuditFilter['targetType'],
})

watch(
  () => props.modelValue,
  (value) => {
    localModel.module = value.module
    localModel.actionType = value.actionType
    localModel.targetId = value.targetId || ''
    localModel.actionBy = value.actionBy
    localModel.targetType = value.targetType
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
    module: localModel.module,
    actionType: localModel.actionType,
    targetId: localModel.targetId.trim() || undefined,
    actionBy: localModel.actionBy,
    targetType: localModel.targetType,
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
    <el-select v-model="localModel.module" clearable placeholder="模块">
      <el-option v-for="item in auditModuleOptions" :key="item.value" :label="item.label" :value="item.value" />
    </el-select>
    <el-input v-model="localModel.actionType" clearable placeholder="动作编码" @keyup.enter="handleSearch" />
    <el-select v-model="localModel.targetType" clearable placeholder="对象类型">
      <el-option v-for="item in auditTargetOptions" :key="item.value" :label="item.label" :value="item.value" />
    </el-select>
    <el-input v-model="localModel.targetId" clearable placeholder="对象 ID" @keyup.enter="handleSearch" />
    <el-input-number v-model="localModel.actionBy" :min="1" controls-position="right" placeholder="操作人 ID" />
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
  grid-template-columns: 1.4fr repeat(5, minmax(0, 1fr)) auto;
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

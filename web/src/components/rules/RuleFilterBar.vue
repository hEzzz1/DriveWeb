<script setup lang="ts">
import { reactive, watch } from 'vue'
import {
  ruleScopeOptions,
  ruleStatusOptions,
  ruleTypeOptions,
  type RuleListQuery,
} from '../../types/rules'

const props = defineProps<{
  modelValue: RuleListQuery
  loading?: boolean
  canManage?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: RuleListQuery]
  search: []
  reset: []
  create: []
}>()

const localModel = reactive<RuleListQuery>({
  keyword: '',
  type: undefined,
  status: undefined,
  version: '',
  scopeType: undefined,
})

watch(
  () => props.modelValue,
  (value) => {
    localModel.keyword = value.keyword || ''
    localModel.type = value.type
    localModel.status = value.status
    localModel.version = value.version || ''
    localModel.scopeType = value.scopeType
  },
  { immediate: true, deep: true },
)

function syncModel(): void {
  emit('update:modelValue', {
    ...props.modelValue,
    keyword: localModel.keyword?.trim() || undefined,
    type: localModel.type,
    status: localModel.status,
    version: localModel.version?.trim() || undefined,
    scopeType: localModel.scopeType,
  })
}

function handleSearch(): void {
  syncModel()
  emit('search')
}

function handleReset(): void {
  emit('reset')
}
</script>

<template>
  <div class="filter-bar">
    <el-input
      v-model="localModel.keyword"
      placeholder="规则名称 / 编码"
      clearable
      @keyup.enter="handleSearch"
    />
    <el-select v-model="localModel.type" placeholder="规则类型" clearable>
      <el-option v-for="item in ruleTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
    </el-select>
    <el-select v-model="localModel.status" placeholder="规则状态" clearable>
      <el-option v-for="item in ruleStatusOptions" :key="item.value" :label="item.label" :value="item.value" />
    </el-select>
    <el-input v-model="localModel.version" placeholder="版本号" clearable @keyup.enter="handleSearch" />
    <el-select v-model="localModel.scopeType" placeholder="生效范围" clearable>
      <el-option v-for="item in ruleScopeOptions" :key="item.value" :label="item.label" :value="item.value" />
    </el-select>
    <div class="actions">
      <el-button :loading="loading" type="primary" @click="handleSearch">查询</el-button>
      <el-button @click="handleReset">重置</el-button>
      <el-button v-if="canManage" type="success" @click="emit('create')">新建规则</el-button>
    </div>
  </div>
</template>

<style scoped>
.filter-bar {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr)) auto;
  gap: 12px;
  align-items: center;
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding-left: 8px;
}

@media (max-width: 1200px) {
  .filter-bar {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .actions {
    grid-column: 1 / -1;
    justify-content: flex-start;
  }
}

@media (max-width: 720px) {
  .filter-bar {
    grid-template-columns: 1fr;
  }
}
</style>

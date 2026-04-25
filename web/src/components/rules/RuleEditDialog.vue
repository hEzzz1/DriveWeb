<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import { ruleScopeOptions, ruleTypeOptions, type RuleDetail, type RuleFormPayload } from '../../types/rules'

const props = defineProps<{
  visible: boolean
  loading?: boolean
  detail?: RuleDetail | null
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  submit: [value: RuleFormPayload]
}>()

const form = reactive<RuleFormPayload>({
  name: '',
  type: 'FATIGUE',
  description: '',
  threshold: 80,
  durationSeconds: 5,
  cooldownSeconds: 60,
  scope: {
    type: 'GLOBAL',
    targetIds: [],
  },
  versionRemark: '',
})

const scopeTargetText = computed({
  get: () => form.scope.targetIds.join(','),
  set: (value: string) => {
    form.scope.targetIds = value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
  },
})

watch(
  () => props.detail,
  (value) => {
    form.id = value?.id
    form.name = value?.name || ''
    form.type = value?.type || 'FATIGUE'
    form.description = value?.description || ''
    form.threshold = value?.threshold ?? 80
    form.durationSeconds = value?.durationSeconds ?? 5
    form.cooldownSeconds = value?.cooldownSeconds ?? 60
    form.scope = value?.scope
      ? {
          type: value.scope.type,
          targetIds: [...value.scope.targetIds],
        }
      : { type: 'GLOBAL', targetIds: [] }
    form.versionRemark = value?.versionRemark || ''
  },
  { immediate: true },
)

function handleSubmit(): void {
  emit('submit', {
    ...form,
    description: form.description?.trim() || undefined,
    versionRemark: form.versionRemark?.trim() || undefined,
    scope: {
      type: form.scope.type,
      targetIds: [...form.scope.targetIds],
    },
  })
}
</script>

<template>
  <el-dialog
    :model-value="visible"
    width="720px"
    :title="detail?.id ? '编辑规则' : '新建规则'"
    @close="emit('update:visible', false)"
  >
    <el-form label-position="top" class="rule-form">
      <el-form-item label="规则名称">
        <el-input v-model="form.name" placeholder="请输入规则名称" />
      </el-form-item>
      <el-form-item label="规则类型">
        <el-select v-model="form.type">
          <el-option v-for="item in ruleTypeOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="规则描述" class="full">
        <el-input v-model="form.description" type="textarea" :rows="3" placeholder="可填写变更背景或备注" />
      </el-form-item>
      <el-form-item label="阈值">
        <el-input-number v-model="form.threshold" :min="0" :max="1000" :step="1" />
      </el-form-item>
      <el-form-item label="持续时长（秒）">
        <el-input-number v-model="form.durationSeconds" :min="1" :max="3600" :step="1" />
      </el-form-item>
      <el-form-item label="冷却时间（秒）">
        <el-input-number v-model="form.cooldownSeconds" :min="0" :max="86400" :step="10" />
      </el-form-item>
      <el-form-item label="生效范围">
        <el-select v-model="form.scope.type">
          <el-option v-for="item in ruleScopeOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="范围目标 ID" class="full">
        <el-input
          v-model="scopeTargetText"
          placeholder="多个目标以逗号分隔，GLOBAL 可留空"
        />
      </el-form-item>
      <el-form-item label="版本备注" class="full">
        <el-input v-model="form.versionRemark" placeholder="用于版本历史摘要" />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="emit('update:visible', false)">取消</el-button>
      <el-button type="primary" :loading="loading" @click="handleSubmit">保存</el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
.rule-form {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 6px 16px;
}

.full {
  grid-column: 1 / -1;
}

@media (max-width: 720px) {
  .rule-form {
    grid-template-columns: 1fr;
  }
}
</style>

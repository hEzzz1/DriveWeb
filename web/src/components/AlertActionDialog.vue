<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { AlertActionType } from '../types/alerts'

const props = withDefaults(
  defineProps<{
    modelValue: boolean
    actionType: AlertActionType
    submitting?: boolean
  }>(),
  {
    submitting: false,
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  submit: [payload: { remark: string }]
}>()

const MAX_REMARK_LENGTH = 255

const actionConfig = computed(() => {
  if (props.actionType === 'CONFIRM') {
    return {
      title: '确认告警',
      prompt: '请确认此风险已被人工确认，并补充需要保留的处理说明。',
      placeholder: '例如：已电话提醒驾驶员',
      confirmText: '确认提交',
    }
  }

  if (props.actionType === 'FALSE_POSITIVE') {
    return {
      title: '标记误报',
      prompt: '请说明该告警被判定为误报的原因，便于后续追踪。',
      placeholder: '例如：遮挡导致误报',
      confirmText: '确认标记',
    }
  }

  return {
    title: '关闭告警',
    prompt: '请说明关闭原因，确认该告警已处理完成或无需继续关注。',
    placeholder: '例如：风险已解除',
    confirmText: '确认关闭',
  }
})

const remark = ref('')

watch(
  () => props.modelValue,
  (visible) => {
    if (visible) {
      remark.value = ''
    }
  },
)

function handleClose(): void {
  emit('update:modelValue', false)
}

function handleSubmit(): void {
  emit('submit', { remark: remark.value.trim() })
}
</script>

<template>
  <el-dialog
    :model-value="modelValue"
    :title="actionConfig.title"
    width="520px"
    destroy-on-close
    @close="handleClose"
  >
    <div class="dialog-body">
      <p class="dialog-prompt">{{ actionConfig.prompt }}</p>
      <el-input
        v-model="remark"
        type="textarea"
        :rows="5"
        :maxlength="MAX_REMARK_LENGTH"
        show-word-limit
        resize="none"
        :placeholder="actionConfig.placeholder"
      />
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">
          {{ actionConfig.confirmText }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<style scoped>
.dialog-body {
  display: grid;
  gap: 12px;
}

.dialog-prompt {
  margin: 0;
  line-height: 1.6;
  color: #4d666d;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>

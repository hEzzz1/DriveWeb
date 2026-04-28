<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import type { FleetDetail, UpdateFleetPayload } from '../../types/fleets'

const props = defineProps<{
  visible: boolean
  loading?: boolean
  fleet?: FleetDetail | null
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  save: [payload: UpdateFleetPayload]
}>()

const formRef = ref<FormInstance>()
const form = reactive<UpdateFleetPayload>({
  name: '',
  remark: '',
})

const rules: FormRules = {
  name: [{ required: true, message: '请输入车队名称', trigger: 'blur' }],
}

watch(
  () => [props.visible, props.fleet] as const,
  ([visible, fleet]) => {
    if (!visible || !fleet) {
      return
    }

    form.name = fleet.name
    form.remark = fleet.remark || ''
    formRef.value?.clearValidate()
  },
  { immediate: true },
)

async function handleSave(): Promise<void> {
  if (!formRef.value) {
    return
  }

  try {
    await formRef.value.validate()
  } catch {
    return
  }

  emit('save', {
    name: form.name.trim(),
    remark: form.remark?.trim() || undefined,
  })
}
</script>

<template>
  <el-dialog :model-value="visible" width="520px" title="编辑车队" @close="emit('update:visible', false)">
    <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
      <el-form-item label="车队名称" prop="name">
        <el-input v-model="form.name" clearable placeholder="请输入车队名称" />
      </el-form-item>
      <el-form-item label="备注">
        <el-input v-model="form.remark" type="textarea" :rows="3" placeholder="选填" />
      </el-form-item>
    </el-form>
    <template #footer>
      <div class="actions">
        <el-button @click="emit('update:visible', false)">取消</el-button>
        <el-button type="primary" :loading="loading" @click="handleSave">保存变更</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<style scoped>
.actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>

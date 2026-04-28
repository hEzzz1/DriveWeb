<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import type { CreateFleetPayload } from '../../types/fleets'

const props = defineProps<{
  visible: boolean
  loading?: boolean
  enterpriseOptions: Array<{ value: number; label: string }>
  defaultEnterpriseId?: number
  lockEnterprise?: boolean
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  save: [payload: CreateFleetPayload]
}>()

const formRef = ref<FormInstance>()
const form = reactive<CreateFleetPayload>({
  enterpriseId: 0,
  name: '',
  remark: '',
})

const rules: FormRules = {
  enterpriseId: [{ required: true, message: '请选择所属企业', trigger: 'change' }],
  name: [{ required: true, message: '请输入车队名称', trigger: 'blur' }],
}

watch(
  () => props.visible,
  (visible) => {
    if (!visible) {
      return
    }

    form.enterpriseId = props.defaultEnterpriseId || 0
    form.name = ''
    form.remark = ''
    formRef.value?.clearValidate()
  },
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
    enterpriseId: Number(form.enterpriseId),
    name: form.name.trim(),
    remark: form.remark?.trim() || undefined,
  })
}
</script>

<template>
  <el-dialog :model-value="visible" width="520px" title="新建车队" @close="emit('update:visible', false)">
    <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
      <el-form-item label="所属企业" prop="enterpriseId">
        <el-select v-if="!lockEnterprise" v-model="form.enterpriseId" class="full-width" filterable placeholder="请选择企业">
          <el-option v-for="item in enterpriseOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
        <el-input v-else :model-value="String(defaultEnterpriseId || '-')" disabled />
      </el-form-item>
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
        <el-button type="primary" :loading="loading" @click="handleSave">创建车队</el-button>
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

.full-width {
  width: 100%;
}
</style>

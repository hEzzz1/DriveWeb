<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import type { CreateEnterprisePayload } from '../../types/enterprises'

const props = defineProps<{
  visible: boolean
  loading?: boolean
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  save: [payload: CreateEnterprisePayload]
}>()

const formRef = ref<FormInstance>()
const form = reactive<CreateEnterprisePayload>({
  code: '',
  name: '',
  contactName: '',
  contactPhone: '',
  remark: '',
})

const rules: FormRules = {
  code: [{ required: true, message: '请输入企业编码', trigger: 'blur' }],
  name: [{ required: true, message: '请输入企业名称', trigger: 'blur' }],
}

watch(
  () => props.visible,
  (visible) => {
    if (!visible) {
      return
    }

    form.code = ''
    form.name = ''
    form.contactName = ''
    form.contactPhone = ''
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
    code: form.code.trim(),
    name: form.name.trim(),
    contactName: form.contactName?.trim() || undefined,
    contactPhone: form.contactPhone?.trim() || undefined,
    remark: form.remark?.trim() || undefined,
  })
}
</script>

<template>
  <el-dialog :model-value="visible" width="560px" title="新建企业" @close="emit('update:visible', false)">
    <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
      <el-form-item label="企业编码" prop="code">
        <el-input v-model="form.code" clearable placeholder="请输入企业编码" />
      </el-form-item>
      <el-form-item label="企业名称" prop="name">
        <el-input v-model="form.name" clearable placeholder="请输入企业名称" />
      </el-form-item>
      <el-form-item label="联系人">
        <el-input v-model="form.contactName" clearable placeholder="请输入联系人" />
      </el-form-item>
      <el-form-item label="联系方式">
        <el-input v-model="form.contactPhone" clearable placeholder="请输入联系方式" />
      </el-form-item>
      <el-form-item label="备注">
        <el-input v-model="form.remark" type="textarea" :rows="3" placeholder="请输入备注" />
      </el-form-item>
    </el-form>
    <template #footer>
      <div class="actions">
        <el-button @click="emit('update:visible', false)">取消</el-button>
        <el-button type="primary" :loading="loading" @click="handleSave">创建企业</el-button>
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

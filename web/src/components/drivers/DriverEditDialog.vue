<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import type { DriverDetail, UpdateDriverPayload } from '../../types/drivers'

const props = defineProps<{
  visible: boolean
  loading?: boolean
  driver?: DriverDetail | null
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  save: [payload: UpdateDriverPayload]
}>()

const formRef = ref<FormInstance>()
const form = reactive<UpdateDriverPayload>({
  driverCode: '',
  name: '',
  phone: '',
  licenseNo: '',
  remark: '',
})

const rules: FormRules = {
  name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
}

watch(
  () => [props.visible, props.driver] as const,
  ([visible, driver]) => {
    if (!visible || !driver) {
      return
    }

    form.driverCode = driver.driverCode || ''
    form.name = driver.name
    form.phone = driver.phone || ''
    form.licenseNo = driver.licenseNo || ''
    form.remark = driver.remark || ''
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
    driverCode: form.driverCode?.trim() || undefined,
    name: form.name.trim(),
    phone: form.phone?.trim() || undefined,
    licenseNo: form.licenseNo?.trim() || undefined,
    remark: form.remark?.trim() || undefined,
  })
}
</script>

<template>
  <el-dialog :model-value="visible" width="560px" title="编辑驾驶员" @close="emit('update:visible', false)">
    <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
      <el-form-item label="驾驶员编号">
        <el-input v-model="form.driverCode" clearable placeholder="请输入驾驶员编号" />
      </el-form-item>
      <el-form-item label="姓名" prop="name">
        <el-input v-model="form.name" clearable placeholder="请输入姓名" />
      </el-form-item>
      <el-form-item label="手机号">
        <el-input v-model="form.phone" clearable placeholder="请输入手机号" />
      </el-form-item>
      <el-form-item label="驾驶证号">
        <el-input v-model="form.licenseNo" clearable placeholder="请输入驾驶证号" />
      </el-form-item>
      <el-form-item label="备注">
        <el-input v-model="form.remark" type="textarea" :rows="3" placeholder="选填" />
      </el-form-item>
    </el-form>
    <template #footer>
      <div class="actions">
        <el-button @click="emit('update:visible', false)">取消</el-button>
        <el-button type="primary" :loading="loading" @click="handleSave">保存资料</el-button>
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

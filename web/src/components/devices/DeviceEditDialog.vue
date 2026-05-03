<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import type { DeviceDetail, UpdateDevicePayload } from '../../types/devices'

const props = defineProps<{
  visible: boolean
  loading?: boolean
  device?: DeviceDetail | null
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  save: [payload: UpdateDevicePayload]
}>()

const formRef = ref<FormInstance>()
const form = reactive<UpdateDevicePayload>({
  deviceName: '',
  activationCode: '',
  remark: '',
})

const rules: FormRules = {
  deviceName: [{ required: true, message: '请输入设备名', trigger: 'blur' }],
}

watch(
  () => [props.visible, props.device] as const,
  ([visible, device]) => {
    if (!visible || !device) {
      return
    }

    form.deviceName = device.deviceName
    form.activationCode = device.activationCode || ''
    form.remark = device.remark || ''
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
    deviceName: form.deviceName.trim(),
    activationCode: form.activationCode?.trim() || undefined,
    remark: form.remark?.trim() || undefined,
  })
}
</script>

<template>
  <el-dialog :model-value="visible" width="560px" title="编辑设备" @close="emit('update:visible', false)">
    <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
      <el-form-item label="设备码">
        <el-input :model-value="device?.deviceCode || '-'" disabled />
      </el-form-item>

      <el-form-item label="设备名" prop="deviceName">
        <el-input v-model="form.deviceName" clearable placeholder="请输入设备名" />
      </el-form-item>

      <el-form-item label="旧版激活码">
        <el-input v-model="form.activationCode" clearable placeholder="选填，企业激活码认领流程可不填写" />
      </el-form-item>

      <el-form-item label="备注">
        <el-input v-model="form.remark" type="textarea" :rows="3" placeholder="选填" />
      </el-form-item>
    </el-form>

    <template #footer>
      <div class="actions">
        <el-button @click="emit('update:visible', false)">取消</el-button>
        <el-button type="primary" :loading="loading" @click="handleSave">保存设备</el-button>
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

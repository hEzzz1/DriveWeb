<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import type { CreateDevicePayload } from '../../types/devices'
import type { FleetSummary } from '../../types/fleets'
import type { VehicleSummary } from '../../types/vehicles'

const props = defineProps<{
  visible: boolean
  loading?: boolean
  fleets: FleetSummary[]
  vehicles: VehicleSummary[]
  enterpriseOptions: Array<{ value: number; label: string }>
  defaultEnterpriseId?: number
  lockEnterprise?: boolean
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  save: [payload: CreateDevicePayload]
}>()

const formRef = ref<FormInstance>()
const form = reactive({
  enterpriseId: 0,
  fleetId: 0,
  vehicleId: 0,
  deviceCode: '',
  deviceName: '',
  activationCode: '',
  remark: '',
})

const rules: FormRules = {
  deviceCode: [{ required: true, message: '请输入设备码', trigger: 'blur' }],
  deviceName: [{ required: true, message: '请输入设备名', trigger: 'blur' }],
}

const fleetOptions = computed(() => {
  const enterpriseId = Number(form.enterpriseId) || undefined
  return props.fleets.filter((item) => !enterpriseId || item.enterpriseId === enterpriseId)
})
const vehicleOptions = computed(() => {
  const enterpriseId = Number(form.enterpriseId) || undefined
  const fleetId = Number(form.fleetId) || undefined
  return props.vehicles.filter((item) => {
    if (enterpriseId && item.enterpriseId !== enterpriseId) {
      return false
    }
    if (fleetId && item.fleetId !== fleetId) {
      return false
    }
    return true
  })
})

watch(
  () => props.visible,
  (visible) => {
    if (!visible) {
      return
    }

    form.enterpriseId = props.defaultEnterpriseId || 0
    form.fleetId = 0
    form.vehicleId = 0
    form.deviceCode = ''
    form.deviceName = ''
    form.activationCode = ''
    form.remark = ''
    formRef.value?.clearValidate()
  },
)

watch(
  () => form.enterpriseId,
  () => {
    if (!fleetOptions.value.some((item) => item.id === Number(form.fleetId))) {
      form.fleetId = 0
    }
    if (!vehicleOptions.value.some((item) => item.id === Number(form.vehicleId))) {
      form.vehicleId = 0
    }
  },
)

watch(
  () => form.fleetId,
  () => {
    if (!vehicleOptions.value.some((item) => item.id === Number(form.vehicleId))) {
      form.vehicleId = 0
    }
  },
)

function vehicleOptionLabel(item: VehicleSummary): string {
  if (item.boundDeviceId) {
    return `${item.plateNumber}（已绑定 ${item.boundDeviceCode || `#${item.boundDeviceId}`}）`
  }
  return `${item.plateNumber} / ${item.id}`
}

async function handleSave(): Promise<void> {
  if (!formRef.value) {
    return
  }

  try {
    await formRef.value.validate()
  } catch {
    return
  }

  if (!form.enterpriseId && !form.fleetId && !form.vehicleId) {
    ElMessage.warning('请至少选择企业、车队或车辆中的一项')
    return
  }

  emit('save', {
    enterpriseId: form.enterpriseId || undefined,
    fleetId: form.fleetId || undefined,
    vehicleId: form.vehicleId || undefined,
    deviceCode: form.deviceCode.trim(),
    deviceName: form.deviceName.trim(),
    activationCode: form.activationCode.trim() || undefined,
    remark: form.remark.trim() || undefined,
  })
}
</script>

<template>
  <el-dialog :model-value="visible" width="620px" title="新增设备" @close="emit('update:visible', false)">
    <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
      <el-form-item label="所属企业">
        <el-select v-if="!lockEnterprise" v-model="form.enterpriseId" class="full-width" clearable filterable placeholder="请选择企业">
          <el-option v-for="item in enterpriseOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
        <el-input v-else :model-value="String(defaultEnterpriseId || '-')" disabled />
      </el-form-item>

      <el-form-item label="所属车队">
        <el-select v-model="form.fleetId" class="full-width" clearable filterable placeholder="可选，选择车辆时会自动限定范围">
          <el-option v-for="item in fleetOptions" :key="item.id" :label="item.name" :value="item.id" />
        </el-select>
      </el-form-item>

      <el-form-item label="分配车辆">
        <el-select v-model="form.vehicleId" class="full-width" clearable filterable placeholder="可选，设备可稍后在详情页分车">
          <el-option
            v-for="item in vehicleOptions"
            :key="item.id"
            :label="vehicleOptionLabel(item)"
            :value="item.id"
            :disabled="Boolean(item.boundDeviceId)"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="设备码" prop="deviceCode">
        <el-input v-model="form.deviceCode" clearable placeholder="请输入边缘设备码" />
      </el-form-item>

      <el-form-item label="设备名" prop="deviceName">
        <el-input v-model="form.deviceName" clearable placeholder="例如：A车前置摄像头终端" />
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
        <el-button type="primary" :loading="loading" @click="handleSave">创建设备</el-button>
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

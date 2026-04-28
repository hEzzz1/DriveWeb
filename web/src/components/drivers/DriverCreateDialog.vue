<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import type { CreateDriverPayload } from '../../types/drivers'
import type { FleetSummary } from '../../types/fleets'

const props = defineProps<{
  visible: boolean
  loading?: boolean
  fleets: FleetSummary[]
  enterpriseOptions: Array<{ value: number; label: string }>
  defaultEnterpriseId?: number
  lockEnterprise?: boolean
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  save: [payload: CreateDriverPayload]
}>()

const formRef = ref<FormInstance>()
const form = reactive<CreateDriverPayload>({
  enterpriseId: 0,
  fleetId: 0,
  driverCode: '',
  name: '',
  phone: '',
  licenseNo: '',
  remark: '',
})

const rules: FormRules = {
  enterpriseId: [{ required: true, message: '请选择所属企业', trigger: 'change' }],
  fleetId: [{ required: true, message: '请选择所属车队', trigger: 'change' }],
  name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
}

const fleetOptions = computed(() => props.fleets.filter((item) => item.enterpriseId === Number(form.enterpriseId)))

watch(
  () => props.visible,
  (visible) => {
    if (!visible) {
      return
    }

    form.enterpriseId = props.defaultEnterpriseId || 0
    form.fleetId = 0
    form.driverCode = ''
    form.name = ''
    form.phone = ''
    form.licenseNo = ''
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
    fleetId: Number(form.fleetId),
    driverCode: form.driverCode?.trim() || undefined,
    name: form.name.trim(),
    phone: form.phone?.trim() || undefined,
    licenseNo: form.licenseNo?.trim() || undefined,
    remark: form.remark?.trim() || undefined,
  })
}
</script>

<template>
  <el-dialog :model-value="visible" width="560px" title="新增驾驶员" @close="emit('update:visible', false)">
    <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
      <el-form-item label="所属企业" prop="enterpriseId">
        <el-select v-if="!lockEnterprise" v-model="form.enterpriseId" class="full-width" filterable placeholder="请选择企业">
          <el-option v-for="item in enterpriseOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
        <el-input v-else :model-value="String(defaultEnterpriseId || '-')" disabled />
      </el-form-item>
      <el-form-item label="所属车队" prop="fleetId">
        <el-select v-model="form.fleetId" class="full-width" filterable placeholder="请选择车队">
          <el-option v-for="item in fleetOptions" :key="item.id" :label="item.name" :value="item.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="驾驶员编号">
        <el-input v-model="form.driverCode" clearable placeholder="选填，不填则由后端生成" />
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
        <el-button type="primary" :loading="loading" @click="handleSave">创建驾驶员</el-button>
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

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import type { DriverDetail, ReassignDriverFleetPayload } from '../../types/drivers'
import type { FleetSummary } from '../../types/fleets'

const props = defineProps<{
  visible: boolean
  loading?: boolean
  driver?: DriverDetail | null
  fleets: FleetSummary[]
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  save: [payload: ReassignDriverFleetPayload]
}>()

const formRef = ref<FormInstance>()
const form = reactive<ReassignDriverFleetPayload>({
  fleetId: 0,
})

const rules: FormRules = {
  fleetId: [{ required: true, message: '请选择车队', trigger: 'change' }],
}

const fleetOptions = computed(() =>
  props.fleets.filter((item) => item.enterpriseId === Number(props.driver?.enterpriseId)),
)

watch(
  () => [props.visible, props.driver] as const,
  ([visible, driver]) => {
    if (!visible || !driver) {
      return
    }

    form.fleetId = driver.fleetId
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
    fleetId: Number(form.fleetId),
  })
}
</script>

<template>
  <el-dialog :model-value="visible" width="480px" title="调整所属车队" @close="emit('update:visible', false)">
    <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
      <el-form-item label="所属车队" prop="fleetId">
        <el-select v-model="form.fleetId" class="full-width" filterable placeholder="请选择车队">
          <el-option v-for="item in fleetOptions" :key="item.id" :label="item.name" :value="item.id" />
        </el-select>
      </el-form-item>
    </el-form>
    <template #footer>
      <div class="actions">
        <el-button @click="emit('update:visible', false)">取消</el-button>
        <el-button type="primary" :loading="loading" @click="handleSave">保存调整</el-button>
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

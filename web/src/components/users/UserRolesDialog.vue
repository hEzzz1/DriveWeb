<script setup lang="ts">
import { ref, watch } from 'vue'
import type { UserRole } from '../../types/api'
import type { RoleOptionItem } from '../../types/users'
import { userRoleLabelMap } from '../../types/users'

const props = defineProps<{
  visible: boolean
  loading?: boolean
  roleOptions: RoleOptionItem[]
  modelValue: UserRole[]
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  save: [roles: UserRole[]]
}>()

const selectedRoles = ref<UserRole[]>([])

watch(
  () => [props.visible, props.modelValue] as const,
  ([visible, modelValue]) => {
    if (visible) {
      selectedRoles.value = [...modelValue]
    }
  },
  { immediate: true },
)
</script>

<template>
  <el-dialog :model-value="visible" width="520px" title="分配角色" @close="emit('update:visible', false)">
    <el-select
      v-model="selectedRoles"
      class="full-width"
      multiple
      filterable
      clearable
      collapse-tags
      collapse-tags-tooltip
      placeholder="请选择角色"
    >
      <el-option
        v-for="item in roleOptions"
        :key="item.roleCode"
        :label="item.roleName || userRoleLabelMap[item.roleCode]"
        :value="item.roleCode"
      />
    </el-select>
    <template #footer>
      <div class="actions">
        <el-button @click="emit('update:visible', false)">取消</el-button>
        <el-button type="primary" :loading="loading" @click="emit('save', selectedRoles)">保存角色</el-button>
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

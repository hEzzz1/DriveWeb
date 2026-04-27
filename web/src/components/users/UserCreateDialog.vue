<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import type { UserRole } from '../../types/api'
import type { CreateUserPayload, RoleOptionItem } from '../../types/users'
import { userRoleLabelMap } from '../../types/users'

const props = defineProps<{
  visible: boolean
  loading?: boolean
  roleOptions: RoleOptionItem[]
  enterpriseOptions: Array<{ value: number; label: string }>
  defaultEnterpriseId?: number | null
  lockEnterprise?: boolean
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  save: [payload: CreateUserPayload]
}>()

const formRef = ref<FormInstance>()

const form = reactive({
  username: '',
  password: '',
  nickname: '',
  enterpriseId: undefined as number | undefined,
  enabled: true,
  roles: [] as UserRole[],
})

const rules: FormRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入初始密码', trigger: 'blur' }],
  enterpriseId: [{ required: true, message: '请选择企业', trigger: 'change' }],
  roles: [{ required: true, message: '请选择角色', trigger: 'change' }],
}

watch(
  () => props.visible,
  (visible) => {
    if (!visible) {
      return
    }

    form.username = ''
    form.password = ''
    form.nickname = ''
    form.enterpriseId = props.defaultEnterpriseId ?? undefined
    form.enabled = true
    form.roles = []
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
    username: form.username.trim(),
    password: form.password,
    nickname: form.nickname.trim() || undefined,
    enterpriseId: form.enterpriseId,
    enabled: form.enabled,
    roles: [...form.roles],
  })
}
</script>

<template>
  <el-dialog :model-value="visible" width="560px" title="新建用户" @close="emit('update:visible', false)">
    <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
      <el-form-item label="用户名" prop="username">
        <el-input v-model="form.username" clearable placeholder="请输入用户名" />
      </el-form-item>
      <el-form-item label="初始密码" prop="password">
        <el-input v-model="form.password" type="password" show-password placeholder="请输入初始密码" />
      </el-form-item>
      <el-form-item label="昵称">
        <el-input v-model="form.nickname" clearable placeholder="为空时默认同用户名" />
      </el-form-item>
      <el-form-item label="所属企业" prop="enterpriseId">
        <el-select
          v-if="!lockEnterprise"
          v-model="form.enterpriseId"
          class="full-width"
          clearable
          filterable
          allow-create
          default-first-option
          placeholder="请选择或输入企业 ID"
        >
          <el-option v-for="item in enterpriseOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
        <el-input v-else :model-value="String(defaultEnterpriseId ?? '-')" disabled />
      </el-form-item>
      <el-form-item label="状态">
        <el-switch v-model="form.enabled" inline-prompt active-text="启用" inactive-text="禁用" />
      </el-form-item>
      <el-form-item label="角色" prop="roles">
        <el-select v-model="form.roles" class="full-width" multiple filterable clearable placeholder="请选择角色">
          <el-option
            v-for="item in roleOptions"
            :key="item.roleCode"
            :label="item.roleName || userRoleLabelMap[item.roleCode]"
            :value="item.roleCode"
          />
        </el-select>
      </el-form-item>
    </el-form>
    <template #footer>
      <div class="actions">
        <el-button @click="emit('update:visible', false)">取消</el-button>
        <el-button type="primary" :loading="loading" @click="handleSave">创建用户</el-button>
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

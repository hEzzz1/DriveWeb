<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import { buildDisplayRoles, requiresEnterpriseForRoles } from '../../access/auth-model'
import type { UpdateUserProfilePayload, UserDetail } from '../../types/users'

const props = defineProps<{
  visible: boolean
  loading?: boolean
  user?: UserDetail | null
  enterpriseOptions: Array<{ value: number; label: string }>
  lockEnterprise?: boolean
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  save: [payload: UpdateUserProfilePayload]
}>()

const formRef = ref<FormInstance>()
const form = reactive({
  username: '',
  nickname: '',
  enterpriseId: undefined as number | undefined,
})

const needsEnterprise = computed(() =>
  requiresEnterpriseForRoles(
    buildDisplayRoles(props.user?.roles || [], props.user?.platformRoles || [], props.user?.memberships || []),
  ),
)

const rules: FormRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  enterpriseId: [
    {
      validator: (_rule, value, callback) => {
        if (!needsEnterprise.value || (value !== undefined && value !== null && value !== '')) {
          callback()
          return
        }

        callback(new Error('请选择企业'))
      },
      trigger: 'change',
    },
  ],
}

watch(
  () => [props.visible, props.user] as const,
  ([visible, user]) => {
    if (!visible || !user) {
      return
    }

    form.username = user.username
    form.nickname = user.nickname || ''
    form.enterpriseId = user.enterpriseId ? Number(user.enterpriseId) : undefined
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
    username: form.username.trim(),
    nickname: form.nickname.trim() || undefined,
    enterpriseId: needsEnterprise.value ? form.enterpriseId : null,
  })
}
</script>

<template>
  <el-dialog :model-value="visible" width="560px" title="编辑用户资料" @close="emit('update:visible', false)">
    <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
      <el-form-item label="用户名" prop="username">
        <el-input v-model="form.username" clearable placeholder="请输入用户名" />
      </el-form-item>
      <el-form-item label="昵称">
        <el-input v-model="form.nickname" clearable placeholder="请输入昵称" />
      </el-form-item>
      <el-form-item label="所属企业" prop="enterpriseId" :required="needsEnterprise">
        <el-select
          v-if="!lockEnterprise"
          v-model="form.enterpriseId"
          class="full-width"
          clearable
          filterable
          allow-create
          default-first-option
          :placeholder="needsEnterprise ? '请选择或输入企业 ID' : '平台级角色可留空'"
        >
          <el-option v-for="item in enterpriseOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
        <el-input
          v-else
          :model-value="needsEnterprise ? String(form.enterpriseId ?? '-') : '平台级角色无需企业归属'"
          disabled
        />
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

.full-width {
  width: 100%;
}
</style>

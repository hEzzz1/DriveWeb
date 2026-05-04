<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import { useRoute, useRouter } from 'vue-router'
import { ApiError } from '../types/api'
import { useAuthStore } from '../stores/auth'

interface LoginFormModel {
  username: string
  password: string
}

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const formRef = ref<FormInstance>()
const loading = ref(false)
const loginError = ref<ApiError | null>(null)

const formModel = reactive<LoginFormModel>({
  username: '',
  password: '',
})
const productModules = ['实时监测', '告警处置', '证据留存', '审计追踪']

const rules: FormRules<LoginFormModel> = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
}

const errorTitle = computed(() => {
  if (!loginError.value) {
    return ''
  }

  if (loginError.value.code === 40101) {
    return '账号或密码错误，请重试'
  }

  if (loginError.value.code === 40301) {
    return '当前账号无权限登录系统'
  }

  if (loginError.value.message.includes('无法连接')) {
    return loginError.value.message
  }

  return loginError.value.message || '登录失败，请稍后重试'
})

const redirectPath = computed(() => {
  return typeof route.query.redirect === 'string' ? route.query.redirect : '/'
})

async function handleSubmit(): Promise<void> {
  if (!formRef.value) {
    return
  }

  try {
    await formRef.value.validate()
  } catch {
    return
  }

  loading.value = true
  loginError.value = null

  try {
    await authStore.login({
      username: formModel.username.trim(),
      password: formModel.password,
    })

    await router.replace(redirectPath.value)
  } catch (error) {
    loginError.value = error instanceof ApiError ? error : new ApiError('登录失败')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login-page">
    <div class="aura aura-one"></div>
    <div class="aura aura-two"></div>

    <section class="login-shell">
      <aside class="login-intro">
        <div class="brand-lockup">
          <span>监测</span>
          <strong>驾驶员疲劳与分心实时检测系统</strong>
        </div>

        <h1>驾驶员疲劳与分心实时检测系统</h1>

        <div class="module-grid">
          <div v-for="item in productModules" :key="item" class="module-card">{{ item }}</div>
        </div>
      </aside>

      <main class="login-card-wrap">
        <el-card class="login-card" shadow="never">
          <template #header>
            <div class="card-head">
              <h2>账号登录</h2>
            </div>
          </template>

          <el-form
            ref="formRef"
            :model="formModel"
            :rules="rules"
            label-position="top"
            @keyup.enter="handleSubmit"
          >
            <el-form-item label="用户名" prop="username">
              <el-input
                v-model="formModel.username"
                placeholder="请输入用户名"
                clearable
                autocomplete="username"
              />
            </el-form-item>

            <el-form-item label="密码" prop="password">
              <el-input
                v-model="formModel.password"
                type="password"
                placeholder="请输入密码"
                show-password
                autocomplete="current-password"
              />
            </el-form-item>

            <el-alert
              v-if="loginError"
              class="error-alert"
              type="error"
              :closable="false"
              :title="errorTitle"
            />

            <el-button class="submit-btn" type="primary" :loading="loading" @click="handleSubmit">
              {{ loading ? '登录中...' : '立即登录' }}
            </el-button>
          </el-form>
        </el-card>
      </main>
    </section>
  </div>
</template>

<style scoped>
.login-page {
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 30px;
  overflow: hidden;
}

.aura {
  position: absolute;
  filter: blur(2px);
  animation: float 8s ease-in-out infinite;
  z-index: 0;
}

.aura-one {
  width: 420px;
  height: 420px;
  border-radius: 35% 65% 65% 35%;
  background: linear-gradient(130deg, rgba(22, 119, 255, 0.18), rgba(22, 119, 255, 0.04));
  top: -70px;
  left: -90px;
}

.aura-two {
  width: 360px;
  height: 360px;
  border-radius: 50% 40% 60% 45%;
  background: linear-gradient(120deg, rgba(9, 88, 217, 0.16), rgba(105, 177, 255, 0.08));
  bottom: -90px;
  right: -60px;
  animation-delay: 1.6s;
}

.login-shell {
  position: relative;
  z-index: 1;
  width: min(1080px, 100%);
  display: grid;
  grid-template-columns: 1.1fr 0.9fr;
  border: 1px solid var(--line);
  border-radius: 24px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(10px);
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.12);
  animation: reveal 0.5s ease-out;
}

.login-intro {
  padding: 44px;
  background:
    radial-gradient(circle at top right, rgba(22, 119, 255, 0.12), transparent 38%),
    linear-gradient(155deg, #f8fbff 0%, #eef4ff 76%);
}

.brand-lockup {
  display: grid;
  gap: 4px;
  margin-bottom: 18px;
}

.brand-lockup span {
  color: var(--brand);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
}

.brand-lockup strong {
  color: var(--text-main);
  font-size: 18px;
  font-weight: 700;
}

.login-intro h1 {
  margin: 0;
  font-size: 38px;
  line-height: 1.25;
  color: var(--text-main);
}

.module-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-top: 28px;
}

.module-card {
  padding: 16px 18px;
  border: 1px solid rgba(22, 119, 255, 0.12);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.84);
  color: var(--text-main);
  font-size: 14px;
  font-weight: 600;
  box-shadow: 0 8px 18px rgba(15, 23, 42, 0.04);
}

.login-card-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 30px;
}

.login-card {
  width: min(440px, 100%);
  border-radius: 20px;
  border: 1px solid var(--line);
  box-shadow: 0 16px 34px rgba(15, 23, 42, 0.08);
}

.card-head {
  display: flex;
  align-items: center;
  justify-content: flex-start;
}

.card-head h2 {
  margin: 0;
  color: var(--text-main);
}

.submit-btn {
  width: 100%;
  margin-top: 6px;
  height: 42px;
  font-weight: 600;
}

.error-alert {
  margin-bottom: 14px;
}

@keyframes reveal {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-12px);
  }
}

@media (max-width: 960px) {
  .login-page {
    padding: 18px;
  }

  .login-shell {
    grid-template-columns: 1fr;
  }

  .login-intro {
    padding: 28px;
  }

  .login-intro h1 {
    font-size: 28px;
  }

  .module-grid {
    grid-template-columns: 1fr;
  }

  .login-card-wrap {
    padding: 22px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .aura,
  .login-shell {
    animation: none;
  }
}
</style>

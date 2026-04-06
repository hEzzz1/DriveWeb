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

const apiBaseURL = import.meta.env.VITE_API_BASE_URL || '/api/v1'
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
        <p class="eyebrow">DriveWeb</p>
        <h1>疲劳与分心风险运营平台</h1>
        <p class="subtitle">
          根据 DriveServer 鉴权规范，登录成功后将写入 JWT 与角色信息，并以
          <code>Bearer Token</code> 自动携带访问受保护接口。
        </p>

        <ul class="spec-list">
          <li>登录接口：<code>POST {{ apiBaseURL }}/auth/login</code></li>
          <li>统一响应：<code>code/message/data/traceId</code></li>
          <li>角色模型：<code>ADMIN / OPERATOR / VIEWER</code></li>
        </ul>
      </aside>

      <main class="login-card-wrap">
        <el-card class="login-card" shadow="never">
          <template #header>
            <div class="card-head">
              <h2>登录与鉴权</h2>
              <span>Session 初始化</span>
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
            >
              <p v-if="loginError.traceId" class="trace-id">traceId: {{ loginError.traceId }}</p>
            </el-alert>

            <el-button class="submit-btn" type="primary" :loading="loading" @click="handleSubmit">
              {{ loading ? '登录中...' : '立即登录' }}
            </el-button>
          </el-form>

          <p class="hint">示例账户可参考 DriveServer 文档中的请求示例：<code>admin / 123456</code></p>
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
  background: linear-gradient(130deg, rgba(17, 122, 99, 0.22), rgba(58, 157, 210, 0.08));
  top: -70px;
  left: -90px;
}

.aura-two {
  width: 360px;
  height: 360px;
  border-radius: 50% 40% 60% 45%;
  background: linear-gradient(120deg, rgba(20, 96, 160, 0.18), rgba(120, 176, 236, 0.1));
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
  backdrop-filter: blur(5px);
  box-shadow: 0 20px 45px rgba(8, 48, 52, 0.1);
  animation: reveal 0.5s ease-out;
}

.login-intro {
  padding: 44px;
  background: linear-gradient(155deg, #f0fbf6 0%, #eef6ff 75%);
}

.eyebrow {
  margin: 0;
  font-weight: 700;
  color: #0d765c;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  font-size: 12px;
}

.login-intro h1 {
  margin: 14px 0 12px;
  font-size: 34px;
  line-height: 1.25;
  color: #10343d;
}

.subtitle {
  margin: 0;
  font-size: 15px;
  color: #40616b;
  line-height: 1.65;
}

.subtitle code,
.spec-list code,
.hint code {
  background: rgba(11, 98, 83, 0.08);
  color: #0f5f4d;
  border-radius: 8px;
  padding: 2px 8px;
  font-size: 13px;
}

.spec-list {
  margin: 28px 0 0;
  padding-left: 18px;
  color: #2f535c;
  display: grid;
  gap: 10px;
}

.login-card-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 30px;
}

.login-card {
  width: min(440px, 100%);
  border-radius: 18px;
  border: 1px solid #d7e5e2;
}

.card-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
}

.card-head h2 {
  margin: 0;
  color: #0f3840;
}

.card-head span {
  color: #648086;
  font-size: 13px;
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

.trace-id {
  margin: 6px 0 0;
  font-size: 12px;
  color: #7f302f;
}

.hint {
  margin: 14px 2px 0;
  font-size: 13px;
  color: #607f87;
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

  .login-card-wrap {
    padding: 22px;
  }
}
</style>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import type { EnterpriseActivationCodeSummary } from '../../types/enterprise-activation-codes'
import {
  enterpriseActivationCodeStatusTagType,
  enterpriseActivationCodeStatusText,
} from '../../utils/device-status'

const props = defineProps<{
  loading?: boolean
  data?: EnterpriseActivationCodeSummary | null
  canManage?: boolean
}>()

const emit = defineEmits<{
  rotate: []
  disable: []
}>()

const qrCodeDataUrl = ref('')
const qrLoading = ref(false)

const activationCode = computed(() => props.data?.activationCode || '')

watch(
  activationCode,
  async (value) => {
    if (!value) {
      qrCodeDataUrl.value = ''
      return
    }

    qrLoading.value = true
    try {
      const { toDataURL } = await import('qrcode')
      qrCodeDataUrl.value = await toDataURL(value, {
        errorCorrectionLevel: 'M',
        margin: 1,
        width: 220,
        color: {
          dark: '#0f172a',
          light: '#ffffffff',
        },
      })
    } catch {
      qrCodeDataUrl.value = ''
    } finally {
      qrLoading.value = false
    }
  },
  { immediate: true },
)

function formatDateTime(value?: string): string {
  if (!value) {
    return '-'
  }

  const time = Date.parse(value)
  return Number.isNaN(time) ? value : new Date(time).toLocaleString()
}

async function copyText(value: string, successMessage: string): Promise<void> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value)
    } else {
      const textarea = document.createElement('textarea')
      textarea.value = value
      textarea.setAttribute('readonly', 'true')
      textarea.style.position = 'absolute'
      textarea.style.left = '-9999px'
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
    }
    ElMessage.success(successMessage)
  } catch {
    ElMessage.error('复制失败，请手动复制')
  }
}

function downloadQrCode(): void {
  if (!qrCodeDataUrl.value || !props.data) {
    return
  }

  const link = document.createElement('a')
  const fileName = `${props.data.enterpriseName || `enterprise-${props.data.enterpriseId}`}-activation-code.png`
  link.href = qrCodeDataUrl.value
  link.download = fileName
  link.click()
}
</script>

<template>
  <el-skeleton :loading="loading" animated>
    <template #default>
      <div v-if="data" class="activation-code-panel">
        <div class="activation-code-copy">
          <div class="code-card">
            <div class="code-card__head">
              <div>
                <div class="code-card__label">企业激活码</div>
                <div class="code-card__hint">安装人员在 Edge 端输入或扫码后，设备将直接绑定到对应企业。</div>
              </div>
              <el-button text type="primary" @click="copyText(data.activationCode, '企业激活码已复制')">复制激活码</el-button>
            </div>
            <div class="code-card__value">{{ data.activationCode }}</div>
          </div>

          <el-descriptions :column="1" border class="code-meta">
            <el-descriptions-item label="脱敏展示">{{ data.activationCodeMasked || '-' }}</el-descriptions-item>
            <el-descriptions-item label="状态">
              <el-tag effect="plain" :type="enterpriseActivationCodeStatusTagType(data.status)">
                {{ enterpriseActivationCodeStatusText(data.status) }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="最近轮换">{{ formatDateTime(data.rotatedAt) }}</el-descriptions-item>
            <el-descriptions-item label="失效时间">{{ formatDateTime(data.expiresAt) }}</el-descriptions-item>
          </el-descriptions>

          <div v-if="canManage" class="action-row">
            <el-button plain :disabled="!qrCodeDataUrl" @click="downloadQrCode">下载二维码</el-button>
            <el-button type="primary" plain @click="emit('rotate')">轮换激活码</el-button>
            <el-button type="warning" plain @click="emit('disable')">停用激活码</el-button>
          </div>
        </div>

        <div class="activation-code-qr">
          <div class="activation-code-qr__label">二维码</div>
          <div class="activation-code-qr__hint">推荐现场扫码录入，减少人工输入企业激活码时的误差。</div>
          <div class="activation-code-qr__frame">
            <el-skeleton v-if="qrLoading" animated>
              <template #template>
                <el-skeleton-item variant="image" style="width: 220px; height: 220px;" />
              </template>
            </el-skeleton>
            <img v-else-if="qrCodeDataUrl" :src="qrCodeDataUrl" alt="企业激活码二维码" class="activation-code-qr__image" />
            <span v-else class="activation-code-qr__empty">二维码生成失败</span>
          </div>
        </div>
      </div>

      <div v-else class="empty-block">
        <el-empty description="当前企业暂无可展示的激活码" :image-size="88" />
        <el-button v-if="canManage" type="primary" plain @click="emit('rotate')">生成激活码</el-button>
      </div>
    </template>
  </el-skeleton>
</template>

<style scoped>
.activation-code-panel {
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(240px, 0.9fr);
  gap: 16px;
  align-items: stretch;
}

.activation-code-copy {
  display: grid;
  gap: 12px;
}

.code-card,
.activation-code-qr,
.code-meta {
  background: var(--surface);
}

.code-card,
.activation-code-qr {
  padding: 16px;
  border: 1px solid var(--line);
  border-radius: 12px;
}

.code-card__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.code-card__label,
.activation-code-qr__label {
  font-size: 13px;
  font-weight: 700;
  color: var(--text-main);
}

.code-card__hint,
.activation-code-qr__hint {
  margin-top: 4px;
  font-size: 12px;
  line-height: 1.5;
  color: var(--text-faint);
}

.code-card__value {
  margin-top: 14px;
  padding: 14px 16px;
  border-radius: 10px;
  background: var(--panel-bg);
  border: 1px dashed var(--line-strong);
  font-family:
    'SFMono-Regular', 'JetBrains Mono', 'Fira Code', 'Source Code Pro', monospace;
  font-size: 22px;
  font-weight: 700;
  line-height: 1.35;
  color: #0f172a;
  word-break: break-all;
}

.action-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.activation-code-qr {
  display: grid;
  gap: 10px;
  place-items: center;
  text-align: center;
}

.activation-code-qr__frame {
  display: grid;
  place-items: center;
  width: 100%;
  min-height: 236px;
  padding: 12px;
  border-radius: 12px;
  background: var(--panel-bg);
  border: 1px dashed var(--line-strong);
}

.activation-code-qr__image {
  width: 220px;
  max-width: 100%;
  height: auto;
  display: block;
}

.activation-code-qr__empty {
  color: var(--text-faint);
  font-size: 13px;
}

.empty-block {
  display: grid;
  justify-items: start;
  gap: 12px;
}

@media (max-width: 900px) {
  .activation-code-panel {
    grid-template-columns: 1fr;
  }
}
</style>

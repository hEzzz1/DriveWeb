<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { buildClaimQrPayload, formatClaimCode } from '../../utils/device-claim'

interface Props {
  deviceCode?: string
  deviceName?: string
  activationCode?: string
}

const props = defineProps<Props>()

const qrCodeDataUrl = ref('')
const qrLoading = ref(false)

const claimCode = computed(() => formatClaimCode(props.activationCode))
const qrPayload = computed(() =>
  buildClaimQrPayload({
    deviceCode: props.deviceCode,
    deviceName: props.deviceName,
    activationCode: props.activationCode,
  }),
)

watch(
  qrPayload,
  async (value) => {
    if (!props.activationCode || !value) {
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
</script>

<template>
  <div v-if="activationCode" class="activation-panel">
    <div class="activation-copy">
      <div class="code-card">
        <div class="code-card__head">
          <div>
            <div class="code-card__label">Activation Code</div>
            <div class="code-card__hint">保留原始激活码，便于直接录入设备端。</div>
          </div>
          <el-button text type="primary" @click="copyText(activationCode, 'activationCode 已复制')">复制</el-button>
        </div>
        <div class="code-card__value">{{ activationCode }}</div>
      </div>

      <div class="code-card">
        <div class="code-card__head">
          <div>
            <div class="code-card__label">认领码</div>
            <div class="code-card__hint">按 4 位分组显示，适合人工确认和口述。</div>
          </div>
          <el-button text type="primary" @click="copyText(claimCode, '认领码已复制')">复制</el-button>
        </div>
        <div class="code-card__value code-card__value--claim">{{ claimCode }}</div>
      </div>
    </div>

    <div class="activation-qr">
      <div class="activation-qr__label">二维码</div>
      <div class="activation-qr__hint">扫码后可直接读取设备码、原始激活码和认领码。</div>
      <div class="activation-qr__frame">
        <el-skeleton v-if="qrLoading" animated>
          <template #template>
            <el-skeleton-item variant="image" style="width: 220px; height: 220px;" />
          </template>
        </el-skeleton>
        <img v-else-if="qrCodeDataUrl" :src="qrCodeDataUrl" alt="设备激活二维码" class="activation-qr__image" />
        <span v-else class="activation-qr__empty">二维码生成失败</span>
      </div>
    </div>
  </div>
  <el-empty v-else description="当前设备暂无 activationCode" :image-size="96" />
</template>

<style scoped>
.activation-panel {
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(240px, 0.9fr);
  gap: 16px;
  align-items: stretch;
}

.activation-copy {
  display: grid;
  gap: 12px;
}

.code-card,
.activation-qr {
  padding: 16px;
  border: 1px solid var(--line);
  border-radius: 12px;
  background: var(--surface);
}

.code-card__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.code-card__label,
.activation-qr__label {
  font-size: 13px;
  font-weight: 700;
  color: var(--text-main);
}

.code-card__hint,
.activation-qr__hint {
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

.code-card__value--claim {
  letter-spacing: 0.08em;
}

.activation-qr {
  display: grid;
  gap: 10px;
  place-items: center;
  text-align: center;
}

.activation-qr__frame {
  display: grid;
  place-items: center;
  width: 100%;
  min-height: 236px;
  padding: 12px;
  border-radius: 12px;
  background: var(--panel-bg);
  border: 1px dashed var(--line-strong);
}

.activation-qr__image {
  width: 220px;
  max-width: 100%;
  height: auto;
  display: block;
}

.activation-qr__empty {
  color: var(--text-faint);
  font-size: 13px;
}

@media (max-width: 900px) {
  .activation-panel {
    grid-template-columns: 1fr;
  }
}
</style>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import * as echarts from 'echarts'
import type { EChartsOption } from 'echarts'

const props = withDefaults(
  defineProps<{
    option: EChartsOption
    height?: number
    loading?: boolean
    empty?: boolean
    error?: string
    emptyDescription?: string
  }>(),
  {
    height: 320,
    loading: false,
    empty: false,
    error: '',
    emptyDescription: '无符合条件数据',
  },
)

const chartRef = ref<HTMLDivElement | null>(null)
let chart: echarts.ECharts | null = null

const chartStyle = computed(() => ({
  height: `${props.height}px`,
}))

watch(
  () => props.option,
  (option) => {
    if (!chart || props.empty || props.error) {
      return
    }

    chart.setOption(option, true)
    chart.resize()
  },
  { deep: true },
)

watch(
  () => [props.empty, props.error] as const,
  () => {
    window.setTimeout(() => {
      chart?.resize()
    }, 0)
  },
)

onMounted(() => {
  if (!chartRef.value) {
    return
  }

  chart = echarts.init(chartRef.value)
  chart.setOption(props.option, true)
  window.addEventListener('resize', resizeChart)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', resizeChart)
  chart?.dispose()
  chart = null
})

function resizeChart(): void {
  chart?.resize()
}
</script>

<template>
  <div class="chart-shell" :style="chartStyle">
    <div v-if="error" class="chart-state">
      <el-alert :title="error" type="error" :closable="false" show-icon />
    </div>

    <div v-else-if="empty && !loading" class="chart-state">
      <el-empty :description="emptyDescription" />
    </div>

    <div v-show="!error && !empty" ref="chartRef" class="chart-canvas" />

    <div v-if="loading" class="loading-mask">
      <el-skeleton animated :rows="6" />
    </div>
  </div>
</template>

<style scoped>
.chart-shell {
  position: relative;
  min-height: 220px;
}

.chart-canvas {
  width: 100%;
  height: 100%;
}

.chart-state {
  height: 100%;
  display: grid;
  place-items: center;
}

.loading-mask {
  position: absolute;
  inset: 0;
  padding: 16px;
  background: rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(2px);
}
</style>

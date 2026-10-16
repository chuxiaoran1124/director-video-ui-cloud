<template>
  <el-dialog :model-value="visible && phase !== 'done'" title="打包下载" width="min(440px, 94vw)" append-to-body :close-on-click-modal="false" :show-close="false" :close-on-press-escape="false">
    <div class="zip-progress" aria-live="polite" aria-busy="true">
      <p>{{ phase === 'packing' ? '正在写入并保存 ZIP' : total ? `正在获取文件 ${currentIndex || Math.min(completed + 1, total)}/${total}` : '正在准备可下载文件…' }}</p>
      <p v-if="currentName" class="current-name" :title="currentName">{{ currentName }}</p>
      <el-progress :percentage="Math.max(0, Math.min(100, percent || 0))" />
      <div class="transfer-details">
        <span v-if="loadedBytes !== undefined">{{ formatBytes(loadedBytes) }}<template v-if="totalBytes"> / {{ formatBytes(totalBytes) }}</template></span>
        <span v-if="speedBytesPerSecond !== undefined">{{ formatBytes(speedBytesPerSecond) }}/秒</span>
        <span v-if="attempt && attempt > 1">第 {{ attempt }} 次尝试</span>
      </div>
      <p v-if="notice" class="notice" role="status">{{ notice }}</p>
      <small v-if="streaming === false">文件可能拆为多个 ZIP，请允许本站下载多个文件，并检查浏览器保存结果。</small>
      <small>请保持页面打开，完成前不要刷新。取消后已保存的分包会保留。</small>
    </div>
    <template #footer>
      <el-button :disabled="!cancel || cancelling" :loading="cancelling" @click="requestCancel">{{ cancelling ? '正在取消…' : '取消下载' }}</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onDeactivated, ref, watch } from 'vue'

const props = defineProps<{
  visible: boolean; phase: 'fetching' | 'packing' | 'done'; completed: number; total: number; percent: number
  success?: number; failed?: number; archives?: number; streaming?: boolean
  currentName?: string; currentIndex?: number; loadedBytes?: number; totalBytes?: number
  speedBytesPerSecond?: number; attempt?: number; notice?: string; cancel?: () => void
}>()
const cancelling = ref(false)
watch(() => [props.visible, props.phase], () => {
  if (!props.visible || props.phase === 'done') cancelling.value = false
})
function requestCancel() {
  if (!props.cancel || cancelling.value) return
  cancelling.value = true
  props.cancel()
}
function stopOnLeave() { if (props.visible && props.phase !== 'done') props.cancel?.() }
onBeforeUnmount(stopOnLeave)
onDeactivated(stopOnLeave)
function formatBytes(bytes: number) {
  const value = Math.max(0, Number(bytes) || 0)
  if (value < 1024) return `${Math.round(value)} B`
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`
  if (value < 1024 * 1024 * 1024) return `${(value / (1024 * 1024)).toFixed(1)} MB`
  return `${(value / (1024 * 1024 * 1024)).toFixed(2)} GB`
}
</script>

<style scoped>
.zip-progress { display: grid; gap: 12px; }
.zip-progress p { margin: 0; }
.current-name, .notice { overflow-wrap: anywhere; }
.current-name { max-height: 4.5em; overflow: auto; }
.transfer-details { display: flex; flex-wrap: wrap; gap: 6px 16px; font-size: 12px; color: #606266; }
.notice { color: #a66300; }
.zip-progress small { color: #606266; line-height: 1.6; }
</style>

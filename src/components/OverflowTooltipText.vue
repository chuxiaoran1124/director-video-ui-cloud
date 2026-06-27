<template>
  <el-tooltip
    :disabled="!shouldShowTooltip"
    :content="normalizedText"
    placement="top"
    effect="dark"
    :show-after="120"
  >
    <span
      ref="textRef"
      class="overflow-tooltip-text"
      @mouseenter="checkOverflow"
    >
      {{ displayText }}
    </span>
  </el-tooltip>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = withDefaults(defineProps<{
  text?: string
  maxChars?: number
}>(), {
  text: '',
  maxChars: 60
})

const textRef = ref<HTMLElement | null>(null)
const isVisualOverflow = ref(false)
let resizeObserver: ResizeObserver | null = null

const normalizedText = computed(() => String(props.text || '').trim())
const isCharTruncated = computed(() => normalizedText.value.length > props.maxChars)
const displayText = computed(() => {
  if (!normalizedText.value) {
    return ''
  }
  if (!isCharTruncated.value) {
    return normalizedText.value
  }
  return `${normalizedText.value.slice(0, props.maxChars)}...`
})
const shouldShowTooltip = computed(() => Boolean(normalizedText.value) && (isCharTruncated.value || isVisualOverflow.value))

const checkOverflow = async() => {
  await nextTick()
  const el = textRef.value
  if (!el) {
    isVisualOverflow.value = false
    return
  }
  isVisualOverflow.value = el.scrollWidth > el.clientWidth + 1
}

watch(() => props.text, () => {
  checkOverflow()
})

watch(() => props.maxChars, () => {
  checkOverflow()
})

onMounted(() => {
  checkOverflow()
  if (typeof ResizeObserver !== 'undefined' && textRef.value) {
    resizeObserver = new ResizeObserver(() => {
      checkOverflow()
    })
    resizeObserver.observe(textRef.value)
  }
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  resizeObserver = null
})
</script>

<style scoped>
.overflow-tooltip-text {
  display: block;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>

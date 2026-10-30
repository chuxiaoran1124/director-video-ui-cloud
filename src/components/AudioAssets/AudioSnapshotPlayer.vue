<template>
  <audio v-if="url" ref="element" :src="url" controls preload="none" aria-label="试听任务快照音频" style="width:180px;height:32px" @play="stopOthers" />
  <span v-else>暂无试听地址（历史信息保留）</span>
</template>
<script setup lang="ts">
import { onBeforeUnmount, onDeactivated, ref, watch } from 'vue'
const props = defineProps<{ url?: string; active: boolean }>()
const element = ref<HTMLAudioElement | null>(null)
function stop() { const audio = element.value; if (audio) { audio.pause(); audio.removeAttribute('src'); audio.load() } }
function stopOthers() { document.querySelectorAll('audio').forEach(audio => { if (audio !== element.value) audio.pause() }) }
watch(() => props.active, active => { if (!active) stop() })
onBeforeUnmount(stop)
onDeactivated(stop)
</script>

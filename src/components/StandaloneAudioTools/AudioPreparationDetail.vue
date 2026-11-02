<template>
    <details ref="root" class="audio-preparation" @toggle="toggled">
        <summary>音频优化详情</summary>
        <p>{{ audioPreparationLabel(preparation) }}</p>
        <p v-if="explanation" role="status">{{ explanation }}</p>
        <template v-if="expanded">
            <div v-for="item in sources" :key="item.key" class="audio-source">
                <p>{{ item.label }}</p>
                <audio v-if="item.url" :src="item.url" :aria-label="item.label" controls preload="none" @error="playbackFailed = true" />
                <p v-else>暂无音频</p>
            </div>
            <p v-if="playbackFailed" role="status">音频暂时无法播放，请稍后刷新详情或检查网络。</p>
            <p v-if="preparation.referenceText" class="preparation-text">参考文案：{{ preparation.referenceText }}</p>
            <p v-if="preparation.targetText" class="preparation-text">目标文案：{{ preparation.targetText }}</p>
        </template>
    </details>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onDeactivated, ref, watch } from 'vue'
import { AudioPreparation, audioPreparationExplanation, audioPreparationLabel, preparationAudioUrl, stopPreparationAudio } from './audioPreparation'

const props = defineProps<{ preparation: AudioPreparation }>()
const root = ref<HTMLDetailsElement>()
const expanded = ref(false)
const playbackFailed = ref(false)
const explanation = computed(() => audioPreparationExplanation(props.preparation))
const sources = computed(() => [
    { key: 'original', label: '原始音频', url: preparationAudioUrl(props.preparation.originalUrl) },
    { key: 'reference', label: '参考音频', url: preparationAudioUrl(props.preparation.referenceUrl) },
    { key: 'processed', label: '优化后音频', url: preparationAudioUrl(props.preparation.processedUrl) }
])
function stop() { stopPreparationAudio(root.value) }
function toggled() {
    expanded.value = !!root.value?.open
    if (!expanded.value) stop()
}
watch(() => sources.value.map(item => item.url).join('\n'), () => {
    // Vue updates changed src attributes; keep unchanged sources attached and the disclosure open.
    root.value?.querySelectorAll('audio').forEach(audio => audio.pause())
    playbackFailed.value = false
})
onDeactivated(stop)
onBeforeUnmount(stop)
</script>

<style scoped>
.audio-preparation { margin-top: 16px; }
summary { cursor: pointer; }
.audio-source { margin-top: 12px; }
audio { width: 100%; }
.preparation-text { white-space: pre-wrap; overflow-wrap: anywhere; }
</style>

<template>
    <div class="voice-picker">
        <div class="search-row">
            <el-input v-model="keyword" placeholder="搜索可用声音" clearable @keyup.enter="search" @clear="search" />
            <el-button :loading="loading" @click="search">搜索</el-button>
            <el-select v-model="gender" class="gender-filter" placeholder="全部性别" clearable @change="search">
                <el-option label="男" value="male" /><el-option label="女" value="female" />
            </el-select>
        </div>
        <div class="selected-row">
            <el-select :model-value="modelValue" placeholder="请选择云端声音" filterable @update:model-value="$emit('update:modelValue', $event)">
                <el-option v-for="voice in voiceOptions" :key="voice.id" :value="voice.id" :label="voice.name" />
            </el-select>
            <el-button :disabled="!selectedVoice || !selectedVoice.url" @click="togglePreview">{{ previewing ? '停止试听' : '试听' }}</el-button>
        </div>
        <audio v-if="previewing && selectedVoice" ref="player" :src="selectedVoice.url" controls autoplay preload="metadata" @error="previewError" />
        <div class="pager">
            <el-button size="small" :disabled="page === 1 || loading" @click="changePage(-1)">上一页</el-button>
            <span>第 {{ page }} 页 · {{ total }} 个声音</span>
            <el-button size="small" :disabled="page * 20 >= total || loading" @click="changePage(1)">下一页</el-button>
        </div>
        <p v-if="error" role="alert">{{ error }}</p>
        <small>仅显示当前账号有权访问的云端声音；新训练声音完成后可在此搜索。</small>
    </div>
</template>

<script setup lang="ts">
import { computed, onActivated, onBeforeUnmount, onDeactivated, onMounted, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { getVoicePaginateList } from '/@/api/material'
import { normalizeAssetUrl } from '/@/utils/download'

const props = defineProps<{ modelValue: number | null }>()
defineEmits(['update:modelValue'])
interface CloudVoice { id: number; name: string; url: string }
const keyword = ref('')
const gender = ref('')
const page = ref(1)
const total = ref(0)
const voices = ref<CloudVoice[]>([])
const selectedVoice = ref<CloudVoice | null>(null)
const voiceOptions = computed(() => selectedVoice.value && !voices.value.some(voice => voice.id === selectedVoice.value?.id)
    ? [selectedVoice.value, ...voices.value] : voices.value)
const previewing = ref(false)
const player = ref<HTMLAudioElement>()
const loading = ref(false)
const error = ref('')
let version = 0
let disposed = false
let mounted = false
async function load() {
    const ticket = ++version
    loading.value = true
    error.value = ''
    try {
        const response = await getVoicePaginateList(page.value, 20, { name: keyword.value.trim(), gender: gender.value })
        if (disposed || ticket !== version) return
        const result = response.data.data
        voices.value = result.data.map((voice: any) => ({
            id: Number(voice.id), name: voice.voiceName || voice.name,
            url: normalizeAssetUrl(voice.url || voice.voiceUrl || voice.audioUrl || '')
        }))
            .filter((voice: { id: number }) => Number.isSafeInteger(voice.id) && voice.id > 0)
        selectedVoice.value = voices.value.find(voice => voice.id === props.modelValue) || selectedVoice.value
        total.value = Number(result.total) || 0
    } catch { if (!disposed && ticket === version) error.value = '声音加载失败，请点击搜索重试' }
    finally { if (ticket === version) loading.value = false }
}
function search() { page.value = 1; void load() }
function changePage(offset: number) { page.value += offset; void load() }
function stopPreview() {
    player.value?.pause()
    player.value?.removeAttribute('src')
    player.value?.load()
    previewing.value = false
}
function togglePreview() {
    if (previewing.value) stopPreview()
    else if (selectedVoice.value && /^https?:\/\//i.test(selectedVoice.value.url)) previewing.value = true
    else ElMessage.warning('该声音暂无有效试听地址')
}
function previewError() { if (previewing.value) { stopPreview(); ElMessage.error('声音试听失败，请检查音源或网络后重试') } }
watch(() => props.modelValue, id => {
    stopPreview()
    selectedVoice.value = id === null ? null : voices.value.find(voice => voice.id === id) || (selectedVoice.value?.id === id ? selectedVoice.value : null)
})
onMounted(() => { mounted = true; void load() })
onActivated(() => { if (disposed && mounted) { disposed = false; void load() } })
onDeactivated(() => { disposed = true; version++; stopPreview() })
onBeforeUnmount(() => { disposed = true; version++; stopPreview() })
</script>

<style scoped>
.voice-picker, .el-select { width: 100%; }
.search-row, .selected-row, .pager { display: flex; gap: 8px; margin-bottom: 10px; align-items: center; }
.search-row { flex-wrap: wrap; }
.search-row > .el-input { flex: 1; min-width: 140px; }
.search-row > .gender-filter { width: 130px; }
.selected-row > .el-select { flex: 1; min-width: 0; }
audio { width: 100%; margin: 4px 0; }
.pager { margin-top: 10px; flex-wrap: wrap; font-size: 12px; }
small { color: #909399; line-height: 1.5; }
p { color: #f56c6c; }
</style>

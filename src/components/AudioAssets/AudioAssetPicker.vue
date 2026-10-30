<template>
  <section class="audio-assets" aria-label="音频素材库">
    <div class="quota-row">
      <el-tag>上传音频 {{ quota ? `${quota.uploaded.used}/${quota.uploaded.limit}` : '--/100' }}</el-tag>
      <el-tag type="success">生成音频 {{ quota ? `${quota.generated.used}/${quota.generated.limit}` : '--/100' }}</el-tag>
      <span>两类各最多 100 条</span>
    </div>
    <el-alert title="删除仅移除音频库素材，不删除已有任务历史；历史仍按任务快照展示。上传保留完整音频，不裁剪。" type="info" :closable="false" show-icon />
    <div class="audio-toolbar">
      <el-input v-model="keyword" placeholder="输入音频名称搜索" clearable aria-label="音频名称搜索" @keyup.enter="search" @clear="search" />
      <el-select v-model="source" aria-label="音频来源" @change="search">
        <el-option label="全部音频" value="" />
        <el-option label="历史上传" value="uploaded" />
        <el-option label="生成成品" value="generated" />
      </el-select>
      <el-button type="primary" :loading="loading" @click="search">搜索</el-button>
      <el-button :disabled="disabled || !quota || quota.uploaded.used >= quota.uploaded.limit" @click="uploadVisible = true">上传音频</el-button>
    </div>
    <div v-if="selectable" class="selection-summary">
      <span>已选 {{ modelValue.length }} 条（跨搜索、来源和分页保留）</span>
      <el-button v-if="modelValue.length" :disabled="disabled" link @click="emit('update:modelValue', [])">清空选择</el-button>
      <div class="selected-tags">
        <el-tag v-for="item in modelValue" :key="String(item.id)" :closable="!disabled" @close="toggle(item)">{{ item.name }}</el-tag>
      </div>
    </div>
    <el-alert v-if="errorMessage" :title="errorMessage" type="error" :closable="false" />
    <el-table v-loading="loading" :data="records" row-key="id" border max-height="360">
      <el-table-column v-if="selectable" label="选择" width="60" align="center">
        <template #default="{ row }"><el-checkbox :model-value="isSelected(row)" :disabled="disabled || !audioAssetReady(row)" :aria-label="`选择音频 ${row.name}`" @change="toggle(row)" /></template>
      </el-table-column>
      <el-table-column prop="name" label="音频名称" min-width="170" show-overflow-tooltip />
      <el-table-column label="来源" width="95"><template #default="{ row }">{{ row.source === 'uploaded' ? '历史上传' : '生成成品' }}</template></el-table-column>
      <el-table-column label="状态" width="100"><template #default="{ row }"><el-tag :type="audioAssetReady(row) ? 'success' : 'info'">{{ statusText(row) }}</el-tag></template></el-table-column>
      <el-table-column label="时长" width="85"><template #default="{ row }">{{ durationText(row.duration) }}</template></el-table-column>
      <el-table-column label="大小" width="90"><template #default="{ row }">{{ sizeText(row.sizeBytes) }}</template></el-table-column>
      <el-table-column label="创建时间" min-width="160"><template #default="{ row }">{{ formatTime(row.createTime) }}</template></el-table-column>
      <el-table-column label="操作" width="145">
        <template #default="{ row }">
          <el-button link type="primary" :disabled="!row.url || !audioAssetReady(row)" @click="preview(row)">试听</el-button>
          <el-button link type="danger" :disabled="disabled || deletingId !== null" @click="remove(row)">删除</el-button>
        </template>
      </el-table-column>
      <template #empty><el-empty description="暂无音频，可上传完整音频或选择历史生成成品" :image-size="65" /></template>
    </el-table>
    <el-pagination class="audio-pagination" :current-page="page" :page-size="pageSize" :total="total" :page-sizes="[10, 20, 50]" layout="total, sizes, prev, pager, next" @current-change="changePage" @size-change="changeSize" />

    <el-dialog v-model="previewVisible" :title="previewName" width="min(520px, 94vw)" append-to-body destroy-on-close @close="stopPlayback">
      <audio ref="audioElement" :src="previewUrl" controls preload="none" style="width:100%" />
    </el-dialog>
    <el-dialog v-model="uploadVisible" title="上传完整音频" width="min(520px, 94vw)" append-to-body :close-on-click-modal="false" :close-on-press-escape="!uploading" :show-close="!uploading" :before-close="closeUpload">
      <el-form label-position="top">
        <el-form-item label="音频名称"><el-input v-model="uploadName" maxlength="100" :disabled="uploading || uploadUncertain" /></el-form-item>
        <el-form-item label="完整音频，单条最大 100MB（mp3 / wav / m4a / aac / flac / ogg）"><input ref="fileInput" type="file" accept="audio/*,.mp3,.wav,.m4a,.aac,.ogg,.flac" :disabled="uploading || uploadUncertain" @change="chooseFile" /></el-form-item>
        <el-progress v-if="uploading" :percentage="uploadProgress" />
        <el-alert v-if="uploadError" :title="uploadError" type="warning" :closable="false" />
      </el-form>
      <template #footer>
        <el-button :disabled="uploading" @click="uploadVisible = false">关闭</el-button>
        <el-button type="primary" :loading="uploading" :disabled="disabled || !uploadFile || !uploadName.trim()" @click="upload">{{ uploadUncertain ? '使用原请求重试确认' : '上传并保存到音频库' }}</el-button>
      </template>
    </el-dialog>
  </section>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onDeactivated, ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useLayoutStore } from '/@/store/modules/layout'
import { registerVersionRefreshBlocker } from '/@/utils/versionRefresh'
import { audioAssetError, audioAssetReady, deleteAudioAsset, paginateAudioAssets, uploadAudioAsset, type AudioAsset, type AudioAssetPage, type AudioSource } from '/@/api/material/audioAssets'

const props = withDefaults(defineProps<{ modelValue?: AudioAsset[]; selectable?: boolean; active?: boolean; disabled?: boolean }>(), { modelValue: () => [], selectable: true, active: true, disabled: false })
const emit = defineEmits<{ (event: 'update:modelValue', value: AudioAsset[]): void }>()
const layoutStore = useLayoutStore()
const records = ref<AudioAsset[]>([])
const quota = ref<AudioAssetPage['quota'] | null>(null)
const keyword = ref(''), source = ref<AudioSource | ''>(''), appliedKeyword = ref('')
const page = ref(1), pageSize = ref(10), total = ref(0), loading = ref(false), errorMessage = ref('')
const deletingId = ref<string | number | null>(null)
const previewVisible = ref(false), previewName = ref(''), previewUrl = ref('')
const audioElement = ref<HTMLAudioElement | null>(null)
const uploadVisible = ref(false), uploadName = ref(''), uploadFile = ref<File | null>(null), fileInput = ref<HTMLInputElement | null>(null)
const uploading = ref(false), uploadProgress = ref(0), uploadError = ref(''), uploadUncertain = ref(false)
let requestId = '', listSequence = 0, lifetime = 0
const unregisterRefreshBlocker = registerVersionRefreshBlocker(() => props.active && (uploadVisible.value || uploading.value || deletingId.value !== null || previewVisible.value))
function formatTime(value: string) { return value ? String(value).replace('T', ' ').slice(0, 19) : '-' }

function isSelected(row: AudioAsset) { return props.modelValue.some(item => String(item.id) === String(row.id)) }
function toggle(row: AudioAsset) {
  if (props.disabled || !audioAssetReady(row)) return
  emit('update:modelValue', isSelected(row) ? props.modelValue.filter(item => String(item.id) !== String(row.id)) : [...props.modelValue, row])
}
async function load() {
  if (!props.active) return
  const sequence = ++listSequence
  loading.value = true; errorMessage.value = ''
  try {
    const data = await paginateAudioAssets({ page: page.value, pageSize: pageSize.value, ...(source.value ? { source: source.value } : {}), keyword: appliedKeyword.value })
    if (sequence !== listSequence) return
    records.value = data.records; total.value = data.total; quota.value = data.quota
    const unavailable = new Set(data.records.filter(row => !audioAssetReady(row)).map(row => String(row.id)))
    if (unavailable.size) emit('update:modelValue', props.modelValue.filter(row => !unavailable.has(String(row.id))))
  } catch (error: any) {
    if (sequence === listSequence) { errorMessage.value = error?.message || '音频加载失败，请重试搜索'; records.value = [] }
  } finally { if (sequence === listSequence) loading.value = false }
}
function search() { page.value = 1; appliedKeyword.value = keyword.value.trim(); load() }
function changePage(value: number) { page.value = value; load() }
function changeSize(value: number) { pageSize.value = value; page.value = 1; load() }
function durationText(value: number) { return value > 0 ? `${Number(value).toFixed(1)} 秒` : '-' }
function sizeText(value: number) { return value > 0 ? `${(value / 1024 / 1024).toFixed(2)} MB` : '-' }
function statusText(row: AudioAsset) { return ({ ready: '可用', reserved: '待上传 / 预占', deleting: '删除中', released: '已释放' } as Record<string, string>)[row.status || 'ready'] || '未就绪' }
function stopPlayback() {
  const audio = audioElement.value
  if (audio) { audio.pause(); audio.removeAttribute('src'); audio.load() }
  previewUrl.value = ''
}
function preview(row: AudioAsset) { if (!audioAssetReady(row)) return; stopPlayback(); previewName.value = row.name; previewUrl.value = row.url; previewVisible.value = true }
async function remove(row: AudioAsset) {
  if (props.disabled || deletingId.value !== null) return
  const generation = lifetime
  try {
    await ElMessageBox.confirm(`确认从音频库删除“${row.name}”？已有任务历史仍会保留。`, '删除音频', { type: 'warning', confirmButtonText: '确认删除', cancelButtonText: '取消' })
    if (generation !== lifetime || props.disabled || !props.active) return
    deletingId.value = row.id
    await deleteAudioAsset(row.id)
    if (generation !== lifetime) return
    emit('update:modelValue', props.modelValue.filter(item => String(item.id) !== String(row.id)))
    if (previewUrl.value === row.url) { stopPlayback(); previewVisible.value = false }
    if (records.value.length === 1 && page.value > 1) page.value--
    ElMessage.success('音频已从库中删除，任务历史保留'); await load()
  } catch (error: any) { if (generation === lifetime && error !== 'cancel' && error !== 'close') ElMessage.error(audioAssetError(error, '删除失败')) }
  finally { if (generation === lifetime) deletingId.value = null }
}
function chooseFile(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0] || null
  if (file && (file.size > 100 * 1024 * 1024 || !/\.(mp3|wav|m4a|aac|flac|ogg)$/i.test(file.name))) {
    ElMessage.warning(file.size > 100 * 1024 * 1024 ? '单条音频不能超过 100MB' : '请选择 mp3、wav、m4a、aac、flac 或 ogg 音频')
    ;(event.target as HTMLInputElement).value = ''; uploadFile.value = null; return
  }
  uploadFile.value = file; uploadName.value = file?.name.replace(/\.[^.]+$/, '') || ''
  requestId = ''; uploadError.value = ''; uploadUncertain.value = false
}
function closeUpload(done: () => void) { if (!uploading.value) done() }
async function upload() {
  if (!uploadFile.value || !uploadName.value.trim() || uploading.value || props.disabled || !props.active) return
  requestId ||= crypto.randomUUID()
  const generation = lifetime
  uploading.value = true; uploadError.value = ''; uploadProgress.value = 0
  try {
    const row = await uploadAudioAsset(uploadFile.value, uploadName.value, requestId, value => { if (generation === lifetime) uploadProgress.value = value })
    if (generation !== lifetime) return
    if (props.selectable && audioAssetReady(row) && !isSelected(row)) emit('update:modelValue', [...props.modelValue, row])
    uploadVisible.value = false; uploadFile.value = null; uploadName.value = ''; requestId = ''; uploadUncertain.value = false
    if (fileInput.value) fileInput.value.value = ''
    ElMessage.success(props.selectable ? '已保存到音频库并自动选中' : '已保存到音频库')
    await load()
  } catch (error: any) {
    if (generation === lifetime) {
      // Keep the same file, name and requestId after UNKNOWN/timeout; never replay as a new upload.
      uploadUncertain.value = true
      uploadError.value = `${audioAssetError(error, '上传结果未确认')}。请先搜索音频库确认；重试将复用原请求标识。`
    }
  } finally { if (generation === lifetime) uploading.value = false }
}
function deactivate() { ++lifetime; ++listSequence; stopPlayback(); previewVisible.value = false; uploadVisible.value = false }
watch(() => props.active, active => { if (active) load(); else { stopPlayback(); previewVisible.value = false; uploadVisible.value = false; ++listSequence; loading.value = false } }, { immediate: true })
watch(() => layoutStore.getUserInfo.tenantId, () => {
  deactivate(); records.value = []; quota.value = null; total.value = 0; page.value = 1; keyword.value = ''; appliedKeyword.value = ''; source.value = ''
  uploading.value = false; uploadFile.value = null; uploadUncertain.value = false; uploadName.value = ''; uploadError.value = ''; requestId = ''; deletingId.value = null
  emit('update:modelValue', []); load()
})
onDeactivated(stopPlayback)
onBeforeUnmount(() => { deactivate(); unregisterRefreshBlocker() })
defineExpose({ stopPlayback })
</script>

<style scoped>
.audio-assets { min-width:0; }
.quota-row,.audio-toolbar,.selection-summary { display:flex; gap:12px; align-items:center; flex-wrap:wrap; margin:14px 0; }
.quota-row>span { color:#758398; font-size:12px; }
.audio-toolbar .el-input { width:240px; }
.audio-toolbar .el-select { width:140px; }
.selected-tags { display:flex; flex-wrap:wrap; gap:6px; width:100%; max-height:95px; overflow:auto; }
.audio-pagination { margin-top:16px; justify-content:flex-end; flex-wrap:wrap; }
</style>

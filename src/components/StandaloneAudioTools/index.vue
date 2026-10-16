<template>
    <section class="audio-tools">
        <header class="page-header">
            <div><h2>{{ title }}</h2><p>{{ training ? '上传中文声音样本，训练完成后加入云端声音素材库。' : '选择云端声音，将文案生成独立配音。' }}</p></div>
            <el-button type="primary" @click="openCreate">新建{{ title }}</el-button>
        </header>
        <div class="panel">
            <div class="toolbar">
                <el-input v-model="searchName" placeholder="按名称搜索" clearable @keyup.enter="search" @clear="search" />
                <el-button type="primary" @click="search">搜索</el-button>
                <el-select v-model="query.search.gender" placeholder="全部性别" clearable @change="search">
                    <el-option label="男" value="male" /><el-option label="女" value="female" />
                </el-select>
                <el-select v-model="query.search.taskStatus" placeholder="全部状态" clearable @change="search">
                    <el-option v-for="(label, value) in statusLabels" :key="value" :label="label" :value="value" />
                </el-select>
                <el-button :loading="loading" @click="load()">刷新</el-button>
                <el-button :disabled="!downloadable.length || downloading" :loading="downloading" @click="downloadSelected">批量下载 ({{ downloadable.length }})</el-button>
            </div>
            <el-alert v-if="listError" :title="listError" type="warning" :closable="false" show-icon />
            <VideoZipProgress v-bind="zipProgress" :visible="downloading" />
            <el-table ref="table" v-loading="loading" :data="rows" row-key="id" empty-text="暂无任务" @selection-change="selectionChanged">
                <el-table-column type="selection" width="45" reserve-selection />
                <el-table-column prop="name" label="名称" min-width="160" show-overflow-tooltip />
                <el-table-column label="性别" width="70"><template #default="{ row }">{{ genderLabel(row.gender) }}</template></el-table-column>
                <el-table-column label="语言" width="70"><template #default="{ row }">{{ row.language === 'zh' ? '中文' : row.language === 'en' ? '英文' : '—' }}</template></el-table-column>
                <el-table-column v-if="training" label="模型" width="80"><template #default="{ row }">{{ row.model === 'a2e' ? 'A2E' : row.model || '—' }}</template></el-table-column>
                <el-table-column label="状态" width="125"><template #default="{ row }"><el-tag :type="statusType(row.taskStatus)">{{ statusLabels[row.taskStatus] || '状态待确认' }}</el-tag></template></el-table-column>
                <el-table-column prop="attemptNo" label="尝试次数" width="90" />
                <el-table-column prop="createTime" label="创建时间" min-width="170" />
                <el-table-column prop="updateTime" label="更新时间" min-width="170" />
                <el-table-column label="操作" :fixed="narrow ? undefined : 'right'" width="250">
                    <template #default="{ row }">
                        <el-button type="text" @click="showDetail(row)">详情</el-button>
                        <el-button type="text" :disabled="!hasOutput(row)" @click="play(row)">试听</el-button>
                        <el-button type="text" :disabled="!hasOutput(row)" @click="downloadOne(row)">下载</el-button>
                        <el-button v-if="row.canRetry === true" type="text" :disabled="actionId !== null" @click="retry(row)">重试</el-button>
                        <el-button type="text" :disabled="actionId !== null" @click="remove(row)">删除</el-button>
                    </template>
                </el-table-column>
            </el-table>
            <div class="pagination">
                <el-pagination :current-page="query.page" :page-size="query.pageSize" :page-sizes="[10, 20, 50, 100]" :total="total"
                    layout="total, sizes, prev, pager, next" @current-change="changePage" @size-change="changeSize" />
            </div>
            <p class="hint">当前页面每 10 秒静默刷新，离开页面后停止。任务完成后可试听、下载。</p>
        </div>

        <el-dialog v-model="creating" :title="`新建${title}`" width="min(640px, 94vw)" :before-close="beforeCloseCreate"
            :close-on-click-modal="false" :close-on-press-escape="!submitting" :show-close="!submitting" destroy-on-close>
            <el-form :model="form" label-position="top" :disabled="submitting" @submit.prevent="submit">
                <el-form-item :label="training ? '样本名称' : '配音名称'" required>
                    <el-input v-model="form.name" maxlength="100" show-word-limit placeholder="请输入名称" @blur="checkName" />
                    <div class="name-feedback" role="status">
                        <span v-if="nameChecking" class="hint">正在校验名称…</span>
                        <span v-else-if="nameFeedback" class="hint">{{ nameFeedback }}</span>
                    </div>
                    <el-button v-if="recommendedName" type="text" @click="applyRecommended">使用推荐名称：{{ recommendedName }}</el-button>
                </el-form-item>
                <template v-if="training">
                    <el-form-item label="性别" required><el-radio-group v-model="form.gender"><el-radio label="male">男</el-radio><el-radio label="female">女</el-radio></el-radio-group></el-form-item>
                    <el-form-item label="训练语言 / 模型"><span>中文（zh） / A2E（固定）</span></el-form-item>
                    <el-form-item label="中文声音样本" required>
                        <input type="file" accept=".mp3,.wav,.m4a,.mp4" :disabled="submitting" aria-label="上传中文声音样本" @change="chooseFile" />
                        <p class="hint">支持 MP3、WAV、M4A、MP4，时长 10–60 秒，请使用清晰单人中文录音。</p>
                        <p v-if="fileChecking" role="status">正在校验素材时长…</p>
                        <p v-else-if="sample">{{ sample.name }} · {{ duration.toFixed(1) }} 秒</p>
                    </el-form-item>
                </template>
                <template v-else>
                    <el-form-item label="云端声音" required><VoicePicker v-if="creating" :key="scopeKey" v-model="form.voiceId" /></el-form-item>
                    <el-form-item label="配音语言" required><el-radio-group v-model="form.language"><el-radio label="zh">中文</el-radio><el-radio label="en">英文</el-radio></el-radio-group></el-form-item>
                    <el-form-item label="配音文案" required><el-input v-model="form.msg" type="textarea" :rows="7" placeholder="请输入配音文案" /></el-form-item>
                    <el-form-item label="语速"><span>1.0（标准语速）</span></el-form-item>
                </template>
            </el-form>
            <el-alert v-if="submitting" :title="training ? '正在上传并创建训练任务，请勿关闭页面…' : '正在创建配音任务，请勿关闭页面…'" type="info" :closable="false" />
            <template #footer>
                <el-button :disabled="submitting" @click="creating = false">取消</el-button>
                <el-button type="primary" :loading="submitting" :disabled="fileChecking" @click="submit">{{ submitting ? '提交中…' : '提交任务' }}</el-button>
            </template>
        </el-dialog>

        <el-dialog v-model="previewVisible" :title="previewName || '音频试听'" width="min(560px, 94vw)" @close="stopPlayback" destroy-on-close>
            <audio v-if="previewVisible" ref="player" :src="previewUrl" controls autoplay preload="metadata" @error="playbackError" />
            <p class="hint">直接播放云端音频，不经过后端下载代理。</p>
        </el-dialog>
        <el-dialog v-model="detailVisible" title="任务详情" width="min(620px, 94vw)">
            <template v-if="detail">
                <p>名称：{{ detail.name }}</p><p>状态：{{ statusLabels[detail.taskStatus] }}</p>
                <p>创建时间：{{ detail.createTime || '—' }}</p><p>更新时间：{{ detail.updateTime || '—' }}</p>
                <p>开始时间：{{ detail.startTime || '—' }}</p><p>结束时间：{{ detail.endTime || '—' }}</p>
                <p>尝试次数：{{ detail.attemptNo }}</p>
                <p v-if="detail.taskStatus === 'uncertain'">任务结果待确认，请等待后台核实；仅在允许重试时操作，避免重复生成。</p>
                <p v-if="detail.errorMessage || detail.statusHint || ['-1', 'uncertain'].includes(detail.taskStatus)" class="error">{{ taskExplanation(detail) }}</p>
                <p v-if="detail.taskStatus === '2' && !detail.outputUrl">任务已完成，暂未返回音频地址，请稍后刷新。</p>
            </template>
        </el-dialog>
    </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onActivated, onBeforeUnmount, onDeactivated, onMounted, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useLayoutStore } from '/@/store/modules/layout'
import { AudioTask, AudioTool, trainingPayload } from '/@/api/material/standaloneAudio'
import { beginCriticalOperation } from '/@/utils/criticalOperation'
import { registerVersionRefreshBlocker, registerVersionRefreshState } from '/@/utils/versionRefresh'
import { downloadVideoDirect, sanitizeFileName, type ZipProgress } from '/@/utils/download'
import { downloadVideoZip } from '/@/utils/downloadInteraction'
import VideoZipProgress from '/@/components/VideoZipProgress.vue'
import { newIdempotencyKey, readSampleDuration, statusLabels } from './media'
import { useAudioTasks } from './useAudioTasks'
import VoicePicker from './VoicePicker.vue'

const props = defineProps<{ tool: AudioTool }>()
const training = props.tool === 'voice-training'
const title = training ? '声音训练' : '配音生成'
const expectedPath = training ? '/prior-disposal/voice-training' : '/generate-materials/audio-dubbing'
const route = useRoute()
const layout = useLayoutStore()
const active = ref(false)
const narrow = ref(window.innerWidth <= 640)
const scopeKey = computed(() => `standalone-audio:${layout.getUserInfo.tenantId || layout.currentTenant?.id || 'none'}:${layout.getUserInfo.userId}:${props.tool}`)
const relevant = () => active.value && route.path.replace(/\/$/, '') === expectedPath && !document.hidden
const { api, query, rows, total, loading, listError, load, search: runSearch, persist, reset, stop } = useAudioTasks(props.tool, () => scopeKey.value, relevant)
const searchName = ref('')
const table = ref<any>()
const selectedIds = ref<number[]>([])
const downloadable = computed(() => rows.value.filter(row => selectedIds.value.includes(row.id) && hasOutput(row)))
const actionId = ref<number | null>(null)
const downloading = ref(false)
const zipProgress = reactive<ZipProgress>({ phase: 'fetching', completed: 0, total: 0, percent: 0 })
const creating = ref(false)
const submitting = ref(false)
const form = reactive({ name: '', gender: 'male', voiceId: null as number | null, msg: '', language: 'zh' as 'zh' | 'en' })
const sample = ref<File | null>(null)
const duration = ref(0)
const fileChecking = ref(false)
const nameChecking = ref(false)
const nameFeedback = ref('')
const recommendedName = ref('')
const previewVisible = ref(false)
const previewUrl = ref('')
const previewName = ref('')
const player = ref<HTMLAudioElement>()
const detailVisible = ref(false)
const detail = computed(() => rows.value.find(row => row.id === detailId.value) || null)
const detailId = ref<number | null>(null)
let fileVersion = 0
let nameVersion = 0
let cancelProbe: (() => void) | undefined
let lastFingerprint = ''
let idempotencyKey = ''
let restoringSelection = false
let unregisterState: (() => void) | undefined
const unregisterBlocker = registerVersionRefreshBlocker(() => submitting.value || downloading.value || actionId.value !== null || (active.value && (creating.value || previewVisible.value)))

function statusType(status: string) { return status === '2' ? 'success' : status === '-1' ? 'danger' : status === '0' ? 'info' : 'warning' }
function genderLabel(gender: string) { return gender === 'male' ? '男' : gender === 'female' ? '女' : '—' }
function taskExplanation(row: AudioTask) {
    if (layout.getUserInfo.isPlatformSuperAdmin) return row.errorMessage || row.statusHint || '请联系管理员确认任务状态'
    return row.statusHint || (row.taskStatus === 'uncertain' ? '任务结果待确认，请等待后台核实' : '任务处理失败，请重试或联系管理员')
}
function hasOutput(row: AudioTask) { return row.taskStatus === '2' && /^https?:\/\//i.test(row.outputUrl || '') }
function selectionChanged(selection: AudioTask[]) { if (!restoringSelection) selectedIds.value = selection.map(row => row.id) }
function clearSelection() { selectedIds.value = []; table.value?.clearSelection() }
function search() { query.search.name = searchName.value.trim(); clearSelection(); runSearch() }
function changePage(page: number) { query.page = page; clearSelection(); persist(); void load() }
function changeSize(size: number) { query.pageSize = size; clearSelection(); search() }
watch(() => JSON.stringify(query.search), persist)
watch(rows, async () => {
    const ids = selectedIds.value.filter(id => rows.value.some(row => row.id === id))
    restoringSelection = true
    await nextTick()
    table.value?.clearSelection()
    rows.value.forEach(row => { if (ids.includes(row.id)) table.value?.toggleRowSelection(row, true) })
    selectedIds.value = ids
    restoringSelection = false
})

function resetForm() {
    Object.assign(form, { name: '', gender: 'male', voiceId: null, msg: '', language: 'zh' })
    sample.value = null
    duration.value = 0
    nameFeedback.value = ''
    recommendedName.value = ''
    lastFingerprint = ''
    idempotencyKey = ''
    cancelFileCheck()
}
function openCreate() { creating.value = true }
function beforeCloseCreate(done: () => void) { if (!submitting.value) done() }
watch(() => form.name, () => { nameVersion++; recommendedName.value = ''; nameFeedback.value = ''; nameChecking.value = false })
async function checkName(): Promise<boolean> {
    const name = form.name.trim()
    if (!name) return false
    const ticket = ++nameVersion
    const requestScope = scopeKey.value
    nameChecking.value = true
    try {
        const result = await api.validateName(name)
        if (ticket !== nameVersion || requestScope !== scopeKey.value || !active.value || !creating.value) return false
        recommendedName.value = result.recommended_name || ''
        nameFeedback.value = result.is_valid === true ? '名称可用' : '名称已存在，请更换名称或使用推荐名称'
        return result.is_valid === true
    } catch {
        if (ticket === nameVersion) nameFeedback.value = '名称校验失败，请重试'
        return false
    } finally { if (ticket === nameVersion) nameChecking.value = false }
}
async function applyRecommended() { form.name = recommendedName.value; await nextTick(); await checkName() }
function cancelFileCheck() { fileVersion++; cancelProbe?.(); cancelProbe = undefined; fileChecking.value = false }
async function chooseFile(event: Event) {
    cancelFileCheck()
    const input = event.target as HTMLInputElement
    const file = input.files?.[0]
    sample.value = null
    duration.value = 0
    if (!file) return
    if (!/\.(mp3|wav|m4a|mp4)$/i.test(file.name)) { input.value = ''; ElMessage.error('仅支持 MP3/WAV/M4A/MP4'); return }
    const ticket = fileVersion
    fileChecking.value = true
    const probe = readSampleDuration(file)
    cancelProbe = probe.cancel
    try {
        const seconds = await probe.promise
        if (ticket !== fileVersion) return
        sample.value = file
        duration.value = seconds
    } catch (error) {
        if (ticket === fileVersion) { input.value = ''; ElMessage.error((error as Error).message) }
    } finally { if (ticket === fileVersion) { fileChecking.value = false; cancelProbe = undefined } }
}
async function submit() {
    if (submitting.value || fileChecking.value) return
    if (!form.name.trim()) return void ElMessage.warning('请输入名称')
    if (training && !sample.value) return void ElMessage.warning('请上传通过时长校验的样本')
    if (!training && (!Number.isSafeInteger(form.voiceId) || !form.voiceId || !form.msg.trim())) return void ElMessage.warning('请选择云端声音并填写配音文案')
    submitting.value = true
    const endCritical = beginCriticalOperation()
    const requestScope = scopeKey.value
    try {
        const fingerprint = JSON.stringify({ ...form, name: form.name.trim(), sample: sample.value ? [sample.value.name, sample.value.size, sample.value.lastModified, fileVersion] : null })
        // An ambiguous network failure retains the same key for the same submission.
        // Do not revalidate an already-attempted name: a timed-out successful create may now own it.
        if (fingerprint !== lastFingerprint || !idempotencyKey) {
            if (!await checkName()) return
            idempotencyKey = newIdempotencyKey()
            lastFingerprint = fingerprint
        }
        const payload = training
            ? trainingPayload(form.name, form.gender, sample.value!, idempotencyKey)
            : { name: form.name.trim(), msg: form.msg.trim(), voiceId: Number(form.voiceId), language: form.language, speechRate: 1, idempotencyKey }
        await api.create(payload)
        if (scopeKey.value !== requestScope) return
        creating.value = false
        resetForm()
        ElMessage.success('任务已创建，请在任务列表查看处理结果')
        // Preserve the current filters/page instead of silently clearing the user's query.
        void load()
    } catch (error) {
        if (scopeKey.value === requestScope) ElMessage.error(`${(error as Error).message || '提交失败'}；若网络中断，保持内容不变重试可避免重复创建`)
    } finally { submitting.value = false; endCritical() }
}
function showDetail(row: AudioTask) { detailId.value = row.id; detailVisible.value = true }
function stopPlayback() {
    player.value?.pause()
    player.value?.removeAttribute('src')
    player.value?.load()
    previewVisible.value = false
    previewUrl.value = ''
}
function play(row: AudioTask) { stopPlayback(); previewName.value = row.name; previewUrl.value = row.outputUrl; previewVisible.value = true }
function playbackError() { if (previewVisible.value && previewUrl.value) ElMessage.error('音频播放失败，请检查音源或网络后重试') }
function downloadOne(row: AudioTask) {
    try { downloadVideoDirect(row.outputUrl); ElMessage.info('已打开音频直连，由浏览器处理下载；也可在试听播放器中保存') }
    catch { ElMessage.error('音频地址不可用') }
}
async function downloadSelected() {
    if (downloading.value || !downloadable.value.length) return
    const requestScope = scopeKey.value
    downloading.value = true
    try {
        await downloadVideoZip(downloadable.value.map(row => ({
            url: row.outputUrl, taskId: row.id, taskName: row.name,
            fileName: `${sanitizeFileName(row.name)}-${row.id}${new URL(row.outputUrl).pathname.match(/\.(mp3|wav|m4a|mp4|ogg)$/i)?.[0] || '.mp3'}`
        })), `audios-${Date.now()}.zip`, progress => Object.assign(zipProgress, progress), undefined, { isCurrent: () => scopeKey.value === requestScope && active.value })
    } catch (error: any) {
        if (error?.code === 'DOWNLOAD_CANCELLED') return
        if (requestScope === scopeKey.value && error?.name !== 'AbortError') {
            ElMessage.error(error?.message || '音频打包失败，请重试')
        }
    } finally { downloading.value = false }
}
async function retry(row: AudioTask) {
    if (actionId.value !== null || row.canRetry !== true) return
    actionId.value = row.id
    const requestScope = scopeKey.value
    try { await api.retry(row.id); if (requestScope === scopeKey.value) { ElMessage.success('已提交重试'); void load() } }
    catch (error) { if (requestScope === scopeKey.value) ElMessage.error((error as Error).message || '重试失败') }
    finally { actionId.value = null }
}
async function remove(row: AudioTask) {
    if (actionId.value !== null) return
    const requestScope = scopeKey.value
    try { await ElMessageBox.confirm(`确定删除“${row.name}”任务？`, '删除任务', { type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消' }) }
    catch { return }
    if (!active.value || requestScope !== scopeKey.value) return
    actionId.value = row.id
    try { await api.remove(row.id); if (requestScope === scopeKey.value) { ElMessage.success('任务已删除'); selectedIds.value = selectedIds.value.filter(id => id !== row.id); void load() } }
    catch (error) { if (requestScope === scopeKey.value) ElMessage.error((error as Error).message || '删除失败') }
    finally { actionId.value = null }
}
function activate() {
    if (active.value) return
    active.value = true
    unregisterState = registerVersionRefreshState(scopeKey.value, () => JSON.parse(JSON.stringify(query)))
    void load()
}
function deactivate() {
    active.value = false
    stop()
    stopPlayback()
    cancelFileCheck()
    creating.value = false
    detailVisible.value = false
    unregisterState?.()
    unregisterState = undefined
}
function visibilityChanged() { if (document.hidden) { stop(); stopPlayback() } else if (active.value) void load(true) }
function resized() { narrow.value = window.innerWidth <= 640 }
watch(scopeKey, () => {
    deactivate()
    creating.value = false
    detailVisible.value = false
    resetForm()
    clearSelection()
    reset()
    searchName.value = query.search.name
    if (route.path.replace(/\/$/, '') === expectedPath) activate()
})
watch(() => route.path, path => { if (path.replace(/\/$/, '') !== expectedPath) deactivate(); else activate() })
onMounted(() => { reset(); searchName.value = query.search.name; activate(); document.addEventListener('visibilitychange', visibilityChanged); window.addEventListener('resize', resized) })
onActivated(activate)
onDeactivated(deactivate)
onBeforeUnmount(() => { deactivate(); unregisterBlocker(); document.removeEventListener('visibilitychange', visibilityChanged); window.removeEventListener('resize', resized) })
</script>

<style scoped>
.audio-tools { padding: 20px; color: #303133; }
.page-header, .toolbar { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.page-header { justify-content: space-between; margin-bottom: 20px; }
h2 { margin: 0 0 8px; font-size: 22px; }
.page-header p, .hint { color: #909399; font-size: 13px; line-height: 1.6; margin: 8px 0; }
.panel { background: #fff; border: 1px solid #ebeef5; border-radius: 8px; padding: 20px; }
.toolbar { margin-bottom: 16px; }
.toolbar .el-input { width: 220px; }
.toolbar .el-select { width: 140px; }
.pagination { display: flex; justify-content: flex-end; margin-top: 20px; overflow-x: auto; }
audio { width: 100%; }
.error { color: #f56c6c; white-space: pre-wrap; overflow-wrap: anywhere; }
.name-feedback { min-height: 24px; width: 100%; }
input[type=file] { max-width: 100%; }
@media (max-width: 640px) {
    .audio-tools { padding: 12px; }
    .panel { padding: 12px; }
    .toolbar .el-input { width: 100%; }
    .toolbar .el-select { flex: 1; min-width: 120px; }
    .pagination { justify-content: flex-start; }
}
</style>

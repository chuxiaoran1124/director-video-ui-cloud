<template>
  <el-dialog custom-class="audio-batch-dialog" :model-value="modelValue" title="多选叉乘-音频驱动" width="min(1240px, 96vw)" top="4vh" append-to-body destroy-on-close :close-on-click-modal="false" :close-on-press-escape="!submitting" :show-close="!submitting" :before-close="beforeClose" @update:model-value="emit('update:modelValue', $event)" @close="picker?.stopPlayback()">
    <p class="batch-hint">数字人 × 完整音频，每个组合生成一个执行项，最多 50 项。创建计划后确认提交，不需要选择配音声音或填写文案。</p>
    <div class="plan-name"><label for="audio-batch-plan-name">计划名称</label><el-input id="audio-batch-plan-name" v-model="name" :disabled="submitting || createUncertain" maxlength="80" show-word-limit placeholder="请输入计划名称" /></div>
    <div class="batch-selection-layout">
      <section class="selection-panel">
        <div class="panel-heading"><strong>选择数字人</strong><span>已选 {{ humans.length }} 个 · 跨页保留</span><el-button v-if="humans.length" size="small" :disabled="submitting || createUncertain" @click="humans = []">清空</el-button></div>
        <div class="human-section">
          <div class="human-search"><el-input v-model="humanKeyword" placeholder="搜索数字人名称" clearable @keyup.enter="applyHumanSearch" @clear="applyHumanSearch" /><el-select v-model="humanGender" placeholder="全部性别" style="width:130px"><el-option label="全部性别" value="" /><el-option label="男" value="male" /><el-option label="女" value="female" /></el-select><el-button @click="applyHumanSearch">搜索</el-button><el-button :loading="loadingHumans" @click="loadHumans">刷新</el-button></div>
          <el-alert v-if="humanError" :title="humanError" type="error" :closable="false" />
          <div v-loading="loadingHumans" class="human-grid">
            <label v-for="human in pagedHumans" :key="String(human.id)" class="human-card" :class="{ selected: humanSelected(human) }">
              <el-checkbox :model-value="humanSelected(human)" :disabled="submitting || createUncertain" :aria-label="`选择数字人 ${human.name}`" @change="toggleHuman(human)" />
              <img v-if="human.coverUrl" :src="human.coverUrl" alt="" loading="lazy" />
              <span>{{ human.name }}</span>
            </label>
          </div>
          <el-empty v-if="!loadingHumans && !visibleHumans.length" description="暂无匹配数字人" :image-size="50" />
          <el-pagination small :pager-count="5" :current-page="humanPage" :page-size="humanPageSize" :total="visibleHumans.length" layout="total, prev, pager, next" @current-change="humanPage = $event" />
        </div>
      </section>
      <section class="selection-panel"><div class="panel-heading"><strong>选择音频</strong><span>上传或选择已有音频</span></div><AudioAssetPicker v-if="modelValue" ref="picker" v-model="audios" compact :rows-per-page="rowsPerPage" :active="modelValue" :disabled="submitting || createUncertain" /></section>
    </div>
    <el-alert v-if="createUncertain" title="创建结果未确认，为避免重复创建已停止重试。请关闭弹窗并刷新计划列表确认。" type="warning" :closable="false" />
    <template #footer>
      <span class="combination-count" :class="{ over: combinationCount > AUDIO_BATCH_LIMIT }">{{ humans.length }} 个数字人 × {{ audios.length }} 条音频 = {{ combinationCount }} / {{ AUDIO_BATCH_LIMIT }} 项</span>
      <el-button :disabled="submitting" @click="emit('update:modelValue', false)">取消</el-button>
      <el-button type="primary" :loading="submitting" :disabled="!name.trim() || !combinationCount || combinationCount > AUDIO_BATCH_LIMIT || createUncertain" @click="create">确认创建 {{ combinationCount }} 项</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { createVideoBatchPlan, getDigitalHumanList } from '/@/api/material'
import { unwrapAudioResponse, type AudioAsset } from '/@/api/material/audioAssets'
import { useLayoutStore } from '/@/store/modules/layout'
import { registerVersionRefreshBlocker } from '/@/utils/versionRefresh'
import AudioAssetPicker from './AudioAssetPicker.vue'
import { audioBatchPayload, AUDIO_BATCH_LIMIT, type AudioBatchHuman } from './audioBatch'

const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{ (event: 'update:modelValue', value: boolean): void; (event: 'created', id: number | string): void }>()
const layoutStore = useLayoutStore()
const name = ref(''), humanKeyword = ref(''), appliedHumanKeyword = ref(''), humanError = ref('')
const humanGender = ref('')
const humans = ref<AudioBatchHuman[]>([]), allHumans = ref<AudioBatchHuman[]>([]), audios = ref<AudioAsset[]>([])
const loadingHumans = ref(false), submitting = ref(false), createUncertain = ref(false)
const picker = ref<InstanceType<typeof AudioAssetPicker> | null>(null)
const viewportHeight = ref(window.innerHeight)
const rowsPerPage = computed(() => viewportHeight.value < 700 ? 3 : viewportHeight.value < 850 ? 4 : 6)
const humanPage = ref(1)
const humanPageSize = computed(() => rowsPerPage.value < 6 ? 4 : 6)
function resizeDialog() { viewportHeight.value = window.innerHeight }
window.addEventListener('resize', resizeDialog)
const combinationCount = computed(() => humans.value.length * audios.value.length)
const visibleHumans = computed(() => allHumans.value.filter(row => row.name.toLowerCase().includes(appliedHumanKeyword.value) && (!humanGender.value || (['男', 'male'].includes(row.gender || '') ? 'male' : ['女', 'female'].includes(row.gender || '') ? 'female' : '') === humanGender.value)))
const pagedHumans = computed(() => visibleHumans.value.slice((humanPage.value - 1) * humanPageSize.value, humanPage.value * humanPageSize.value))
watch([visibleHumans, humanPageSize], () => { humanPage.value = 1 })
const unregisterBlocker = registerVersionRefreshBlocker(() => props.modelValue)
let generation = 0, humanRequest = 0
function applyHumanSearch() { appliedHumanKeyword.value = humanKeyword.value.trim().toLowerCase() }
function humanSelected(row: AudioBatchHuman) { return humans.value.some(item => String(item.id) === String(row.id)) }
function toggleHuman(row: AudioBatchHuman) {
  if (submitting.value || createUncertain.value) return
  humans.value = humanSelected(row) ? humans.value.filter(item => String(item.id) !== String(row.id)) : [...humans.value, row]
}
async function loadHumans() {
  const current = ++humanRequest
  loadingHumans.value = true; humanError.value = ''
  try {
    const data = unwrapAudioResponse(await getDigitalHumanList())
    if (current !== humanRequest) return
    const items = Array.isArray(data) ? data : data.data || data.items || []
    allHumans.value = items.map((item: any) => ({ id: item.id ?? item.digitalHumanId, name: item.digitalHumanName || item.name || '未命名数字人', coverUrl: item.coverUrl || item.imageUrl || '', gender: item.gender || '' })).filter((item: AudioBatchHuman) => item.id != null)
  } catch (error: any) { if (current === humanRequest) humanError.value = error?.message || '数字人加载失败' }
  finally { if (current === humanRequest) loadingHumans.value = false }
}
function beforeClose(done: () => void) { if (!submitting.value) done() }
async function create() {
  if (submitting.value || createUncertain.value) return
  const current = generation
  let submitted = false
  submitting.value = true
  try {
    const payload = audioBatchPayload(name.value, humans.value, audios.value)
    await ElMessageBox.confirm(`确认创建 ${humans.value.length} 个数字人 × ${audios.value.length} 条音频，共 ${payload.performerConfigs.length} 个执行项？本步仅创建计划，不提交生成。`, '确认音频叉乘数量', { type: 'warning', confirmButtonText: '确认创建', cancelButtonText: '返回选择' })
    if (current !== generation || !props.modelValue) return
    submitted = true
    const data = unwrapAudioResponse(await createVideoBatchPlan(payload))
    if (current !== generation) return
    const id = data?.id ?? data?.planId ?? data?.plan?.id
    if (id == null) throw new Error('计划创建结果未确认')
    emit('update:modelValue', false); emit('created', id)
    ElMessage.success('计划已创建，请在详情确认后提交执行')
  } catch (error: any) {
    if (current !== generation || error === 'cancel' || error === 'close') return
    if (submitted) createUncertain.value = true
    ElMessage.error(error?.message || '创建失败，请刷新计划列表确认')
  } finally { if (current === generation) submitting.value = false }
}
watch(() => props.modelValue, visible => {
  ++generation; ++humanRequest
  if (visible) { name.value = ''; humans.value = []; audios.value = []; allHumans.value = []; humanKeyword.value = ''; humanGender.value = ''; appliedHumanKeyword.value = ''; createUncertain.value = false; submitting.value = false; loadHumans() }
  else picker.value?.stopPlayback()
})
watch(() => layoutStore.getUserInfo.tenantId, () => { ++generation; ++humanRequest; humans.value = []; audios.value = []; allHumans.value = []; emit('update:modelValue', false) })
onBeforeUnmount(() => { ++generation; ++humanRequest; unregisterBlocker(); window.removeEventListener('resize', resizeDialog) })
</script>

<style scoped>
:global(.audio-batch-dialog) { max-height:92vh; display:flex; flex-direction:column; }
:global(.audio-batch-dialog .el-dialog__body) { overflow:hidden; min-height:0; padding:12px 20px; }
:global(.audio-batch-dialog .el-dialog__header), :global(.audio-batch-dialog .el-dialog__footer) { flex-shrink:0; }
.batch-hint { margin:0 0 12px; padding:9px 12px; border-radius:4px; background:#f1f8f8; color:#688087; font-size:12px; line-height:18px; }
.plan-name { display:flex; align-items:center; gap:14px; margin-bottom:14px; }
.plan-name label { flex-shrink:0; color:#52647d; }
.batch-selection-layout { display:grid; grid-template-columns:minmax(280px,.85fr) minmax(440px,1.4fr); gap:16px; }
.selection-panel { min-width:0; padding:12px; border:1px solid #e7edf5; border-radius:8px; }
.panel-heading { display:flex; align-items:center; flex-wrap:wrap; gap:8px; min-height:28px; margin-bottom:10px; color:#26364d; }
.panel-heading span { color:#8a96a8; font-size:12px; }
.panel-heading .el-button { margin-left:auto; }
.human-section { width:100%; }
.human-search { display:flex; flex-wrap:wrap; gap:8px; margin-bottom:10px; }
.human-search .el-input { width:100%; }
.human-search .el-select { flex:1; }
.human-search .el-button { margin:0; }
.human-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:8px; margin-bottom:12px; }
.human-card { display:flex; gap:8px; align-items:center; border:1px solid #e3e9f2; border-radius:8px; padding:8px; cursor:pointer; }
.human-card.selected { border-color:#168c84; background:#eff9f8; }
.human-card img { width:36px; height:48px; flex-shrink:0; object-fit:cover; border-radius:4px; }
.human-card span { overflow:hidden; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow-wrap:anywhere; font-size:12px; line-height:18px; }
.human-tags { display:flex; gap:6px; flex-wrap:wrap; margin-top:8px; }
.combination-count { display:inline-block; margin:0 16px 8px 0; color:#52647d; }
.combination-count.over { color:#e45656; }
@media(max-width:800px),(max-height:620px) { :global(.audio-batch-dialog .el-dialog__body) { overflow:auto; } .batch-selection-layout { grid-template-columns:minmax(0,1fr); } }
</style>

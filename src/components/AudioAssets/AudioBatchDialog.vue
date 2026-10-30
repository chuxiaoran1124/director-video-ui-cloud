<template>
  <el-dialog class="audio-batch-dialog" :model-value="modelValue" title="多选叉乘-音频驱动" width="min(1120px, 96vw)" top="4vh" append-to-body destroy-on-close :close-on-click-modal="false" :close-on-press-escape="!submitting" :show-close="!submitting" :before-close="beforeClose" @update:model-value="emit('update:modelValue', $event)" @close="picker?.stopPlayback()">
    <el-alert title="多个数字人 × 多条完整音频，每个组合生成一个执行项，最多 50 项。不需要配音声音或文案；创建后进入详情，确认后再提交执行。" type="info" :closable="false" />
    <el-form label-position="top" class="audio-batch-form">
      <el-form-item label="计划名称"><el-input v-model="name" :disabled="submitting || createUncertain" maxlength="80" show-word-limit /></el-form-item>
      <el-form-item :label="`数字人（已选 ${humans.length} 个）`">
        <div class="human-section">
          <div class="human-search"><el-input v-model="humanKeyword" placeholder="搜索数字人名称" clearable @keyup.enter="applyHumanSearch" @clear="applyHumanSearch" /><el-select v-model="humanGender" placeholder="全部性别" style="width:130px"><el-option label="全部性别" value="" /><el-option label="男" value="male" /><el-option label="女" value="female" /></el-select><el-button @click="applyHumanSearch">搜索</el-button><el-button :loading="loadingHumans" @click="loadHumans">刷新</el-button></div>
          <el-alert v-if="humanError" :title="humanError" type="error" :closable="false" />
          <div v-loading="loadingHumans" class="human-grid">
            <label v-for="human in visibleHumans" :key="String(human.id)" class="human-card" :class="{ selected: humanSelected(human) }">
              <el-checkbox :model-value="humanSelected(human)" :disabled="submitting || createUncertain" :aria-label="`选择数字人 ${human.name}`" @change="toggleHuman(human)" />
              <img v-if="human.coverUrl" :src="human.coverUrl" alt="" loading="lazy" />
              <span>{{ human.name }}</span>
            </label>
          </div>
          <el-empty v-if="!loadingHumans && !visibleHumans.length" description="暂无匹配数字人" :image-size="50" />
          <div class="human-tags"><el-tag v-for="human in humans" :key="String(human.id)" :closable="!submitting && !createUncertain" @close="toggleHuman(human)">{{ human.name }}</el-tag></div>
        </div>
      </el-form-item>
    </el-form>
    <AudioAssetPicker v-if="modelValue" ref="picker" v-model="audios" :active="modelValue" :disabled="submitting || createUncertain" />
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
const combinationCount = computed(() => humans.value.length * audios.value.length)
const visibleHumans = computed(() => allHumans.value.filter(row => row.name.toLowerCase().includes(appliedHumanKeyword.value) && (!humanGender.value || (['男', 'male'].includes(row.gender || '') ? 'male' : ['女', 'female'].includes(row.gender || '') ? 'female' : '') === humanGender.value)))
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
onBeforeUnmount(() => { ++generation; ++humanRequest; unregisterBlocker() })
</script>

<style scoped>
:global(.audio-batch-dialog) { max-height:92vh; display:flex; flex-direction:column; }
:global(.audio-batch-dialog .el-dialog__body) { overflow:auto; min-height:0; }
:global(.audio-batch-dialog .el-dialog__header), :global(.audio-batch-dialog .el-dialog__footer) { flex-shrink:0; }
.audio-batch-form { margin-top:16px; }
.human-section { width:100%; }
.human-search { display:flex; flex-wrap:wrap; gap:8px; margin-bottom:10px; }
.human-search .el-input { max-width:280px; }
.human-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(150px,1fr)); gap:8px; max-height:210px; overflow:auto; }
.human-card { display:flex; gap:8px; align-items:center; border:1px solid #e3e9f2; border-radius:8px; padding:8px; cursor:pointer; }
.human-card.selected { border-color:#409eff; background:#ecf5ff; }
.human-card img { width:32px; height:42px; object-fit:cover; border-radius:4px; }
.human-card span { overflow-wrap:anywhere; }
.human-tags { display:flex; gap:6px; flex-wrap:wrap; margin-top:8px; }
.combination-count { display:inline-block; margin:0 16px 8px 0; color:#52647d; }
.combination-count.over { color:#e45656; }
</style>

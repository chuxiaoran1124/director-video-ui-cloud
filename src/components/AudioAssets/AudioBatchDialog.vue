<template>
  <el-dialog custom-class="audio-batch-dialog" :model-value="modelValue" title="多选叉乘-音频驱动" width="min(820px, 94vw)" top="10vh" append-to-body destroy-on-close :close-on-click-modal="false" :close-on-press-escape="!submitting" :show-close="!submitting" :before-close="beforeClose" @update:model-value="emit('update:modelValue', $event)">
    <p class="batch-hint">多个形象共用一条完整音频，每个形象生成一个执行项，最多 50 项。不需要选择配音声音或填写文案。</p>
    <el-form label-position="top">
      <el-form-item label="计划名称"><el-input v-model="name" :disabled="locked" maxlength="80" show-word-limit placeholder="请输入计划名称" /></el-form-item>
      <div class="picker-row">
        <el-form-item label="数字人形象（可多选）"><el-input :model-value="humans.map(item => item.name).join('、')" readonly :disabled="locked" placeholder="点击多选数字人形象" @click="!locked && emit('select-humans', humans)"><template #prepend>选择形象</template><template #append><el-button :disabled="locked" :icon="Search" aria-label="选择多个形象" @click.stop="emit('select-humans', humans)" /></template></el-input></el-form-item>
        <el-form-item label="所有形象共用音频（单选）"><el-input :model-value="audios[0]?.name || ''" readonly :disabled="locked" placeholder="点击选择或上传一条音频" @click="!locked && (audioPickerVisible = true)"><template #prepend>选择音频</template><template #append><el-button :disabled="locked" :icon="Search" aria-label="选择一条音频" @click.stop="audioPickerVisible = true" /></template></el-input></el-form-item>
      </div>
      <div v-if="humans.length" class="selected-humans"><el-tag v-for="human in humans" :key="String(human.id)" :closable="!locked" @close="humans = humans.filter(item => String(item.id) !== String(human.id))">{{ human.name }}</el-tag></div>
      <p v-if="audios.length" class="batch-hint">已选音频：{{ audios[0].name }}。所有执行项均使用这条音频。</p>
    </el-form>
    <el-alert v-if="createUncertain" title="创建结果未确认，为避免重复创建已停止重试。请关闭弹窗并刷新计划列表确认。" type="warning" :closable="false" />
    <template #footer><span class="combination-count">{{ humans.length }} 个形象 × {{ audios.length }} 条音频 = {{ combinationCount }} / {{ AUDIO_BATCH_LIMIT }} 项</span><el-button :disabled="submitting" @click="emit('update:modelValue', false)">取消</el-button><el-button type="primary" :loading="submitting" :disabled="!name.trim() || !combinationCount || combinationCount > AUDIO_BATCH_LIMIT || createUncertain" @click="create">确认创建 {{ combinationCount }} 项</el-button></template>
  </el-dialog>
  <el-dialog v-model="audioPickerVisible" custom-class="audio-single-picker-dialog" title="选择共用音频（单选）" width="min(900px, 94vw)" top="6vh" append-to-body destroy-on-close @close="picker?.stopPlayback()">
    <AudioAssetPicker v-if="audioPickerVisible" ref="picker" v-model="audios" compact single :rows-per-page="rowsPerPage" :active="audioPickerVisible" :disabled="locked" />
    <template #footer><span class="combination-count">{{ audios[0] ? `已选：${audios[0].name}` : '请选择一条音频，也可以上传新音频' }}</span><el-button type="primary" :disabled="audios.length !== 1" @click="audioPickerVisible = false">确认选择</el-button></template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import { createVideoBatchPlan } from '/@/api/material'
import { unwrapAudioResponse, type AudioAsset } from '/@/api/material/audioAssets'
import { useLayoutStore } from '/@/store/modules/layout'
import { registerVersionRefreshBlocker } from '/@/utils/versionRefresh'
import AudioAssetPicker from './AudioAssetPicker.vue'
import { audioBatchPayload, AUDIO_BATCH_LIMIT, type AudioBatchHuman } from './audioBatch'
const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{ (event: 'update:modelValue', value: boolean): void; (event: 'created', id: number | string): void; (event: 'select-humans', humans: AudioBatchHuman[]): void }>()
const layoutStore = useLayoutStore()
const name = ref(''), humans = ref<AudioBatchHuman[]>([]), audios = ref<AudioAsset[]>([])
const submitting = ref(false), createUncertain = ref(false), audioPickerVisible = ref(false)
const locked = computed(() => submitting.value || createUncertain.value)
const picker = ref<InstanceType<typeof AudioAssetPicker> | null>(null)
const viewportHeight = ref(window.innerHeight)
const rowsPerPage = computed(() => viewportHeight.value < 750 ? 4 : 6)
function resizeDialog() { viewportHeight.value = window.innerHeight }
window.addEventListener('resize', resizeDialog)
const combinationCount = computed(() => audios.value.length === 1 ? humans.value.length : 0)
const unregisterBlocker = registerVersionRefreshBlocker(() => props.modelValue || audioPickerVisible.value)
let generation = 0
function setHumans(value: AudioBatchHuman[]) { if (props.modelValue && !locked.value) humans.value = value }
defineExpose({ setHumans })
function beforeClose(done: () => void) { if (!submitting.value) done() }
async function create() {
  if (locked.value) return
  const current = generation
  let submitted = false
  submitting.value = true
  try {
    const payload = audioBatchPayload(name.value, humans.value, audios.value)
    await ElMessageBox.confirm(`确认创建 ${humans.value.length} 个形象共用一条音频，共 ${payload.performerConfigs.length} 个执行项？本步仅创建计划，不提交生成。`, '确认音频叉乘数量', { type: 'warning', confirmButtonText: '确认创建', cancelButtonText: '返回选择' })
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
  ++generation
  if (visible) { name.value = ''; humans.value = []; audios.value = []; createUncertain.value = false; submitting.value = false }
  else { audioPickerVisible.value = false; picker.value?.stopPlayback() }
})
watch(() => layoutStore.getUserInfo.tenantId, () => { ++generation; humans.value = []; audios.value = []; emit('update:modelValue', false) })
onBeforeUnmount(() => { ++generation; unregisterBlocker(); window.removeEventListener('resize', resizeDialog) })
</script>

<style scoped>
:global(.audio-batch-dialog),:global(.audio-single-picker-dialog) { max-height:88vh; display:flex; flex-direction:column; }
:global(.audio-batch-dialog .el-dialog__body),:global(.audio-single-picker-dialog .el-dialog__body) { overflow:auto; min-height:0; padding:12px 20px; }
:global(.audio-batch-dialog .el-dialog__header),:global(.audio-batch-dialog .el-dialog__footer),:global(.audio-single-picker-dialog .el-dialog__footer) { flex-shrink:0; }
.batch-hint { margin:0 0 16px; padding:9px 12px; border-radius:4px; background:#f1f8f8; color:#688087; font-size:12px; line-height:18px; }
.picker-row { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:16px; }
.selected-humans { display:flex; gap:6px; flex-wrap:wrap; max-height:100px; overflow:auto; margin-bottom:14px; }
.combination-count { display:inline-block; max-width:100%; overflow-wrap:anywhere; margin:0 16px 8px 0; color:#52647d; }
@media(max-width:650px) { .picker-row { grid-template-columns:minmax(0,1fr); gap:0; } }
</style>

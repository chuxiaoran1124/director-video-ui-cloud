/// <reference path="../src/type/shims-vue.d.ts" />
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { defineComponent, h, nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import { parse, compileScript, compileTemplate } from '@vue/compiler-sfc'
import GeneratePlan from '/@/views/GenerateMaterials/GeneratePlan.vue'
import { audioDraftPayload, restoreSharedAudio } from '/@/components/AudioAssets/audioDraft'
import { ElMessage, ElMessageBox } from 'element-plus'
import * as api from '/@/api/material'

jest.mock('/@/api/material', () => Object.fromEntries([
  'cancelVideoBatchPlan', 'createVideoBatchPlan', 'deleteVideoBatchPlan', 'downloadFileByProxy',
  'getBannerOverlayList', 'getBindingList', 'getCornerMarkList', 'getDigitalHumanList',
  'getDigitalHumanPickerPreference', 'getScriptHistoryList', 'getScriptPaginateList',
  'getVideoBatchPlanDetail', 'getVideoBatchPlanList', 'getVoiceList', 'retryVideoBatchChild',
  'startVideoBatchPlan', 'updateDigitalHumanPickerPreference', 'updateVideoBatchPlan'
].map(name => [name, jest.fn()])))
jest.mock('/@/api/user', () => ({ getUserList: jest.fn() }))
jest.mock('element-plus', () => ({
  ElMessage: { success: jest.fn(), warning: jest.fn(), error: jest.fn(), info: jest.fn() },
  ElMessageBox: { confirm: jest.fn() }
}))
jest.mock('/@/store/modules/layout', () => ({ useLayoutStore: () => ({ getUserInfo: { tenantId: 1, userId: 1 }, getCurrentTenant: { id: 1 } }) }))
jest.mock('/@/utils/versionRefresh', () => ({ consumeVersionRefreshState: jest.fn(), registerVersionRefreshState: () => () => {}, registerVersionRefreshBlocker: () => () => {} }))
jest.mock('/@/utils/download', () => ({ directVideoUrl: jest.fn(), downloadVideoDirect: jest.fn() }))
jest.mock('/@/utils/downloadInteraction', () => ({ downloadVideoZip: jest.fn() }))
jest.mock('/@/components/SubtitlePreview/index.vue', () => ({ name: 'SubtitlePreview', render: () => null }))
jest.mock('/@/components/VideoZipProgress.vue', () => ({ render: () => null }))
jest.mock('/@/components/AudioAssets/AudioAssetPicker.vue', () => ({ name: 'AudioAssetPicker', props: { modelValue: Array, single: Boolean, active: Boolean }, emits: ['update:modelValue'], render: () => null }))
jest.mock('/@/components/AudioAssets/AudioSnapshotPlayer.vue', () => ({ render: () => null }))

const source = readFileSync(resolve(__dirname, '../src/views/GenerateMaterials/GeneratePlan.vue'), 'utf8')
const audio = { id: 81, name: '完整历史音频', source: 'uploaded' as const, url: '/test-only.mp3', duration: 60, sizeBytes: 100, createTime: '' }
const child = (id: number, audioAssetId = 81) => ({ id, seqNo: id, selectionMode: 'audio', digitalHumanId: id, audioAssetId, audioName: audio.name, audioUrl: audio.url, videoOptions: { videoType: 0 } })
const normalizedPlan = (children: any[] = [], source = 'manual', statusKey = 'draft') => ({ id: 160, name: '保持原计划名', statusKey, scheduleMode: 'overnight', scheduledAt: '', script: { source, content: source === 'audio' ? '' : '原脚本' }, processTypes: [], children })
const response = (value: any) => ({ data: { data: value } })
const rawPlan = (children: any[] = [], source = 'manual', status = 'draft') => ({
  ...normalizedPlan([], source), status, children: children.map(row => ({
    ...row, bindingSnapshot: { selectionMode: row.selectionMode, digitalHumanId: row.digitalHumanId, audioAssetId: row.audioAssetId, audioName: row.audioName, audioUrl: row.audioUrl }
  }))
})
const send = (name: keyof typeof api) => api[name] as jest.Mock
const confirm = ElMessageBox.confirm as jest.Mock
let wrapper: any
let vm: any
const flush = async () => { for (let i = 0; i < 8; i++) await Promise.resolve(); await nextTick() }

beforeEach(async () => {
  jest.resetAllMocks()
  Object.values(api).filter(jest.isMockFunction).forEach(fn => (fn as jest.Mock).mockResolvedValue(response([])))
  confirm.mockResolvedValue('confirm')
  send('getDigitalHumanList').mockResolvedValue(response(Array.from({ length: 51 }, (_, i) => ({ id: i + 1, name: `形象${i + 1}` }))))
  send('getDigitalHumanPickerPreference').mockResolvedValue(response({}))
  const box = defineComponent({ setup: (_props, { slots }) => () => h('div', [slots.title?.(), slots.default?.(), slots.footer?.()]) })
  const visibleBox = defineComponent({ props: ['modelValue'], setup: (props, { slots }) => () => props.modelValue ? h('div', [slots.default?.(), slots.footer?.()]) : null })
  const stubs: Record<string, any> = Object.fromEntries([...new Set(source.match(/el-[a-z-]+/g) || [])].map(name => [name, box]))
  stubs['el-drawer'] = visibleBox; stubs['el-dialog'] = visibleBox
  stubs['el-table'] = { render: () => null }
  stubs['el-form'] = defineComponent({ setup: (_props, { slots, expose }) => { expose({ validate: () => Promise.resolve(true), clearValidate: () => {} }); return () => h('form', slots.default?.()) } })
  wrapper = mount(GeneratePlan, { global: { stubs, directives: { loading: () => {} } } })
  // This repo's Vue Test Utils predates public script-setup proxy support.
  vm = wrapper.vm.$.setupState
  await flush()
})
afterEach(() => wrapper?.unmount())

test('Vue script and template compile; legacy new-plan AudioBatchDialog is absent', () => {
  const { descriptor, errors } = parse(source)
  expect(errors).toEqual([])
  const script = compileScript(descriptor, { id: 'inline-audio' })
  expect(compileTemplate({ source: descriptor.template!.content, filename: 'GeneratePlan.vue', id: 'inline-audio', compilerOptions: { bindingMetadata: script.bindings } }).errors).toEqual([])
  expect(source).not.toMatch(/AudioBatchDialog|audio_batch|startAudioDraft/)
})

test.each(['manual', 'audio'])('%s draft opens the same editor, completed audio retains table details', async source => {
  send('getVideoBatchPlanDetail').mockResolvedValueOnce(response(rawPlan(source === 'audio' ? [child(1), child(2)] : [], source)))
  await vm.openDetail({ id: 160 }); await flush()
  expect(wrapper.find('.draft-workspace').exists()).toBe(true)
  expect(vm.planForm.id).toBe(160)
  expect(vm.planForm.scheduleMode).toBe('overnight')
  expect(vm.draftIsAudio).toBe(source === 'audio')
  send('getVideoBatchPlanDetail').mockResolvedValueOnce(response(rawPlan([child(1)], 'audio', 'completed')))
  await vm.openDetail({ id: 160 }); await flush()
  expect(wrapper.find('.draft-workspace').exists()).toBe(false)
  expect(wrapper.find('.child-table-card').exists()).toBe(true)
})

test('mode switch cancellation preserves every field; confirmation replaces whole plan in-place', async () => {
  vm.detail.visible = true; vm.detail.plan = normalizedPlan()
  vm.fillPlanForm(normalizedPlan([{ ...child(1), selectionMode: 'custom', voiceId: 4 }]))
  vm.planForm.processTypes = ['subtitle', 'corner_mark']
  await flush()
  const before = JSON.stringify(vm.planForm)
  confirm.mockRejectedValueOnce('cancel')
  await vm.handleSelectionModeChange('audio')
  expect(JSON.stringify(vm.planForm)).toBe(before)
  await vm.handleSelectionModeChange('audio')
  expect(vm.planForm).toMatchObject({ id: 160, planName: '保持原计划名', scheduleMode: 'overnight', scriptSource: 'audio', scriptContent: '', processTypes: [] })
  expect(vm.planForm.performerConfigs).toHaveLength(1)
  expect(vm.planForm.performerConfigs[0]).toMatchObject({ selectionMode: 'audio', voiceId: null, bindingId: null })
  expect(send('createVideoBatchPlan')).not.toHaveBeenCalled()
})

test('new audio draft uses the existing create dialog with an empty audio script, no fake text', async () => {
  vm.openCreateDialog('audio'); await flush()
  expect(vm.createDialog.visible).toBe(true)
  expect(vm.planForm.scriptContent).toBe('')
  const callback = jest.fn()
  vm.createRules.scriptContent[0].validator({}, '', callback)
  expect(callback).toHaveBeenCalledWith()
  vm.planForm.planName = '空音频草稿'
  vm.planForm.scheduleMode = 'overnight'
  send('createVideoBatchPlan').mockResolvedValueOnce(response({ id: 160 }))
  send('getVideoBatchPlanDetail').mockResolvedValueOnce(response(rawPlan([], 'audio')))
  await vm.createDraftPlan(); await flush()
  expect(send('createVideoBatchPlan')).toHaveBeenCalledTimes(1)
  expect(send('createVideoBatchPlan').mock.calls[0][0]).toMatchObject({ script: { source: 'audio', content: '' }, performerConfigs: [], scheduleMode: 'overnight', postProcessConfig: { processTypes: [] } })
  expect(wrapper.find('.draft-workspace').exists()).toBe(true)
})

test('shared audio picker is single-select; selecting it updates every performer', async () => {
  vm.detail.visible = true; vm.detail.plan = normalizedPlan([child(1), child(2)], 'audio')
  vm.fillPlanForm(vm.detail.plan)
  vm.audioPickerVisible = true; await flush()
  const picker = wrapper.findComponent({ name: 'AudioAssetPicker' })
  expect(picker.props('single')).toBe(true)
  picker.vm.$emit('update:modelValue', [{ ...audio, id: 82 }, audio]); await flush()
  expect(vm.sharedAudio).toHaveLength(1)
  expect(vm.planForm.performerConfigs.map((row: any) => row.audioAssetId)).toEqual([82, 82])
  expect(vm.buildDraftPayload().performerConfigs.every((row: any) => row.audioAssetId === 82 && !('voiceId' in row))).toBe(true)
})

test('reuses multi-human picker from any audio item, restores selections and keeps one audio', async () => {
  vm.detail.visible = true; vm.detail.plan = normalizedPlan([child(1), child(2)], 'audio')
  vm.fillPlanForm(vm.detail.plan); vm.activePerformerIndex = 1
  await vm.openAssetPicker('human')
  expect(vm.assetPicker.multi).toBe(true)
  expect(vm.selectedHumanIds).toEqual(['1', '2'])
  vm.selectedHumanIds = ['1', '2', '3']
  await vm.confirmMultiHumanSelection()
  expect(vm.planForm.performerConfigs.map((row: any) => String(row.digitalHumanId))).toEqual(['1', '2', '3'])
  expect(vm.buildDraftPayload().performerConfigs.map((row: any) => row.audioAssetId)).toEqual([81, 81, 81])
  await vm.openAssetPicker('human'); vm.selectedHumanIds = ['2']
  confirm.mockRejectedValueOnce('cancel')
  await vm.confirmMultiHumanSelection()
  expect(vm.planForm.performerConfigs).toHaveLength(3)
  expect(vm.assetPicker.visible).toBe(true)
})

test('50 audio items save; 51 are blocked before an update or new-plan call', async () => {
  vm.detail.visible = true; vm.detail.plan = normalizedPlan(Array.from({ length: 50 }, (_, i) => child(i + 1)), 'audio')
  vm.fillPlanForm(vm.detail.plan)
  expect(vm.validateDraftForSave()).toBe(true)
  expect(vm.buildDraftPayload().performerConfigs).toHaveLength(50)
  vm.planForm.performerConfigs.push({ ...vm.planForm.performerConfigs[0], digitalHumanId: 51 })
  expect(await vm.saveDraftConfiguration()).toBe(false)
  expect(send('updateVideoBatchPlan')).not.toHaveBeenCalled()
  expect(send('createVideoBatchPlan')).not.toHaveBeenCalled()
})

test('two saves and refresh retain same ID, overnight, humans, audio and editable workspace', async () => {
  const saved = rawPlan([child(1), child(2)], 'audio')
  send('getVideoBatchPlanDetail').mockResolvedValue(response(saved))
  await vm.openDetail({ id: 160 })
  for (let i = 0; i < 2; i++) {
    expect(await vm.saveDraftConfiguration()).toBe(true)
    await flush()
    expect(wrapper.find('.draft-workspace').exists()).toBe(true)
    expect(wrapper.find('.child-table-card').exists()).toBe(false)
    expect(vm.sharedAudio[0]).toMatchObject({ id: 81, name: audio.name, url: audio.url })
    expect(vm.planForm.performerConfigs.map((row: any) => row.digitalHumanId)).toEqual([1, 2])
  }
  expect(send('updateVideoBatchPlan')).toHaveBeenCalledTimes(2)
  send('updateVideoBatchPlan').mock.calls.forEach(([id, payload]) => {
    expect(id).toBe(160)
    expect(payload).toMatchObject({ script: { source: 'audio', content: '' }, scheduleMode: 'overnight', scheduledAt: null, postProcessConfig: { processTypes: [], subtitleSelector: 0 } })
    expect(payload.performerConfigs).toHaveLength(2)
  })
  expect(send('createVideoBatchPlan')).not.toHaveBeenCalled()
  expect(send('startVideoBatchPlan')).not.toHaveBeenCalled()
})

test('mixed legacy audio IDs do not silently select the first; save requires explicit common audio', async () => {
  vm.detail.visible = true; vm.detail.plan = normalizedPlan([child(1), child(2, 82)], 'audio')
  vm.fillPlanForm(vm.detail.plan)
  expect(vm.sharedAudio).toEqual([])
  expect(vm.planForm.performerConfigs.map((row: any) => row.audioAssetId)).toEqual([81, 82])
  expect(await vm.saveDraftConfiguration()).toBe(false)
  expect(send('updateVideoBatchPlan')).not.toHaveBeenCalled()
  expect(ElMessage.warning).toHaveBeenCalledWith(expect.stringContaining('音频'))
  vm.setSharedAudio([audio])
  expect(vm.buildDraftPayload().performerConfigs.map((row: any) => row.audioAssetId)).toEqual([81, 81])
})

test('switch back to text clears audio, allows entering script and never mixes payload modes', async () => {
  vm.detail.visible = true; vm.detail.plan = normalizedPlan([child(1), child(2)], 'audio')
  vm.fillPlanForm(vm.detail.plan)
  await vm.handleSelectionModeChange('custom')
  expect(vm.draftIsAudio).toBe(false)
  expect(vm.sharedAudio).toEqual([])
  expect(vm.validateDraftForSubmission()).toBe(false)
  vm.planForm.scriptContent = '重新填写文案'
  Object.assign(vm.planForm.performerConfigs[0], { digitalHumanId: 1, voiceId: 4 })
  expect(vm.buildDraftPayload()).toMatchObject({ script: { source: 'manual', content: '重新填写文案' }, performerConfigs: [{ selectionMode: 'custom', digitalHumanId: 1, voiceId: 4 }] })
})

test.each(['binding', 'custom', 'first_voice'])('ordinary %s text payload retains original voice semantics', mode => {
  vm.fillPlanForm(normalizedPlan())
  const first = vm.planForm.performerConfigs[0]
  Object.assign(first, { selectionMode: mode, bindingId: 2, digitalHumanId: 1, voiceId: 4 })
  vm.voiceOptions = [{ id: 4, name: '声音' }]
  expect(vm.buildDraftPayload().performerConfigs[0]).toMatchObject(mode === 'binding' ? { selectionMode: 'binding', bindingId: 2 } : { selectionMode: 'custom', digitalHumanId: 1, voiceId: 4 })
})

test('scheduled audio keeps configured time; empty draft saves no placeholder child', () => {
  vm.fillPlanForm(normalizedPlan([], 'audio'))
  vm.planForm.scheduleMode = 'scheduled'; vm.planForm.scheduledAt = '2099-01-02 03:04:05'
  const payload = vm.buildDraftPayload()
  expect(payload.scheduleMode).toBe('scheduled')
  expect(payload.scheduledAt).toBe(new Date('2099-01-02T03:04:05').toISOString())
  expect(payload.performerConfigs).toEqual([])
  vm.fillPlanForm({ ...normalizedPlan([], 'audio'), scheduleMode: 'scheduled', scheduledAt: '2099-01-02T03:04:05Z' })
  expect(vm.buildDraftPayload().scheduledAt).toBe('2099-01-02T03:04:05.000Z')
})

test('incomplete switch back to text cannot leave saved audio children mixed with a manual script', async () => {
  vm.detail.visible = true; vm.detail.plan = normalizedPlan([child(1)], 'audio')
  vm.fillPlanForm(vm.detail.plan)
  await vm.handleSelectionModeChange('custom')
  vm.planForm.scriptContent = '新文案'
  expect(await vm.saveDraftConfiguration()).toBe(false)
  expect(send('updateVideoBatchPlan')).not.toHaveBeenCalled()
})

test('submission uses current plan after save; unknown result blocks repeat submission', async () => {
  send('getVideoBatchPlanDetail').mockResolvedValue(response(rawPlan([child(1), child(2)], 'audio')))
  await vm.openDetail({ id: 160 })
  send('startVideoBatchPlan').mockRejectedValueOnce(new Error('test-only timeout'))
  await vm.saveAndStartPlan()
  expect(send('updateVideoBatchPlan')).toHaveBeenCalledTimes(1)
  expect(send('startVideoBatchPlan')).toHaveBeenCalledWith(160)
  await vm.saveAndStartPlan()
  expect(send('startVideoBatchPlan')).toHaveBeenCalledTimes(1)
  expect(await vm.saveDraftConfiguration()).toBe(false)
  expect(send('createVideoBatchPlan')).not.toHaveBeenCalled()
})

test('pure audio serializer rejects mixed modes/multiple or unavailable audio and clears enhancements', () => {
  expect(() => audioDraftPayload([{ selectionMode: 'custom', digitalHumanId: 1 }], [audio])).toThrow('不能混合')
  expect(() => audioDraftPayload([child(1)], [audio, audio])).toThrow('一条')
  expect(() => audioDraftPayload([child(1)], [{ ...audio, status: 'released' }])).toThrow('可用')
  expect(() => audioDraftPayload(Array.from({ length: 51 }, (_, i) => child(i + 1)), [audio])).toThrow('50')
  expect(restoreSharedAudio([child(1), child(2, 82)])).toEqual([])
  expect(restoreSharedAudio([child(1), child(2)])[0].id).toBe(81)
  expect(audioDraftPayload([child(1), child(2)], [audio]).performerConfigs.every(row => row.postProcessConfig.processTypes.length === 0 && !('voiceId' in row))).toBe(true)
})

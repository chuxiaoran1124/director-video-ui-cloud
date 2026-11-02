import { readFileSync } from 'fs'
import { resolve } from 'path'
import { execFileSync } from 'child_process'
import { parse, compileScript, compileTemplate } from '@vue/compiler-sfc'
import { standaloneAudioApi } from '/@/api/material/standaloneAudio'
import request from '/@/utils/request'
import { AudioPreparation, audioPreparationExplanation, audioPreparationLabel, isAudioOptimizing, preparationAudioUrl, stopPreparationAudio } from '/@/components/StandaloneAudioTools/audioPreparation'

jest.mock('/@/utils/request', () => ({ __esModule: true, default: jest.fn() }))
const send = request as jest.MockedFunction<any>
const preparation: AudioPreparation = {
    id: 9, status: 'processing', statusLabel: 'internal provider error', referenceText: '参考', targetText: '目标',
    originalUrl: '/original.mp3', referenceUrl: '/reference.mp3', processedUrl: '/processed.mp3', errorCode: ''
}

test.each([0, 1, '0', '1', 'waiting', 'processing'])('pending parent %s displays waiting without mutating it', status => {
    const value = { ...preparation }
    expect(isAudioOptimizing(value, status)).toBe(true)
    expect(audioPreparationLabel(value)).toBe('等待中')
    expect(value).toEqual(preparation)
})
test.each([2, 3, 4, -1, '2', '3', '4', '-1', 'success', 'failed', 'uncertain'])('terminal/uncertain parent %s is never overridden', status => {
    expect(isAudioOptimizing(preparation, status)).toBe(false)
})
test.each(['pending', 'waiting', 'queued', 'running', 'preparing', 'optimizing', 'processing'])('active preparation %s is recognized', status => {
    expect(isAudioOptimizing({ ...preparation, status }, '0')).toBe(true)
})
test.each(['ready', 'success', 'completed', 'failed', 'unknown'])('non-processing preparation %s does not relabel parent', status => {
    expect(isAudioOptimizing({ ...preparation, status }, '1')).toBe(false)
})
test('old responses and missing optional preparation remain usable', () => {
    expect(isAudioOptimizing(undefined, '1')).toBe(false)
    expect(isAudioOptimizing(null, '0')).toBe(false)
})
test('new preparation enums can use only the exact safe processing label, never a terminal override', () => {
    expect(isAudioOptimizing({ ...preparation, status: 'synthesizing', statusLabel: '音频优化处理中' }, '1')).toBe(true)
    expect(isAudioOptimizing({ ...preparation, status: 'synthesizing', statusLabel: 'provider error' }, '1')).toBe(false)
    expect(isAudioOptimizing({ ...preparation, status: 'failed', statusLabel: '音频优化处理中' }, '1')).toBe(false)
})
test.each(['voice-training', 'audio-dubbing'] as const)('%s list/detail preserve optional display contract and original parent status', async tool => {
    const task = { id: 7, taskStatus: '1', audioPreparation: preparation }
    send.mockResolvedValueOnce({ data: { code: 200, data: { data: [task], total: 1 } } })
        .mockResolvedValueOnce({ data: { code: 200, data: task } })
        .mockResolvedValueOnce({ data: { code: 200, data: { id: 8, taskStatus: '0' } } })
    const api = standaloneAudioApi(tool)
    expect((await api.paginate({ page: 1, pageSize: 20, search: { name: '', gender: '', taskStatus: '' } })).data[0]).toEqual(task)
    expect(await api.detail(7)).toEqual(task)
    expect((await api.detail(8)).audioPreparation).toBeUndefined()
})
test('only mapped safe explanations are displayed; arbitrary provider content is never returned', () => {
    expect(audioPreparationExplanation({ ...preparation, errorCode: 'AUDIO_TOO_SHORT' })).toContain('样本过短')
    for (const errorCode of ['HTTP 400 secret signed-url', 'constructor', '__proto__']) {
        const explanation = audioPreparationExplanation({ ...preparation, status: 'failed', errorCode })
        expect(explanation).toBe('音频优化暂未完成，请稍后刷新或联系管理员')
        expect(explanation).not.toContain(errorCode)
    }
    expect(audioPreparationLabel({ ...preparation, status: 'provider stack trace' })).toBe('音频优化状态待确认')
    expect(audioPreparationExplanation(preparation)).toBe('')
})
test.each(['javascript:alert(1)', 'data:audio/mp3;base64,test', '//example.invalid/test.mp3', 'https://user:password@example.invalid/audio', '/\\example.invalid/audio'])('unsafe source %s is not mounted', url => {
    expect(preparationAudioUrl(url)).toBe('')
})
test('valid signed audio URLs are preserved without rewriting or logging', () => {
    const url = 'https://example.invalid/audio.mp3?signature=test-only&expires=999'
    expect(preparationAudioUrl(url)).toBe(url)
    expect(preparationAudioUrl('/media/original.mp3')).toBe('/media/original.mp3')
})
test('playback cleanup pauses and releases every mounted audio', () => {
    const audio = { pause: jest.fn(), removeAttribute: jest.fn(), load: jest.fn() }
    stopPreparationAudio({ querySelectorAll: () => [audio, audio] } as any)
    expect(audio.pause).toHaveBeenCalledTimes(2)
    expect(audio.removeAttribute).toHaveBeenCalledWith('src')
    expect(audio.load).toHaveBeenCalledTimes(2)
    expect(() => stopPreparationAudio(null)).not.toThrow()
})

const root = resolve(__dirname, '..')
const source = (file: string) => readFileSync(resolve(root, file), 'utf8')
test.each([
    'src/components/StandaloneAudioTools/AudioPreparationDetail.vue',
    'src/components/StandaloneAudioTools/index.vue',
    'src/views/PriorDisposal/RapidGenerating.vue'
])('%s compiles as a Vue SFC', filename => {
    const { descriptor, errors } = parse(source(filename), { filename })
    expect(errors).toEqual([])
    const script = compileScript(descriptor, { id: 'contract' })
    const compiled = compileTemplate({ source: descriptor.template!.content, filename, id: 'contract', compilerOptions: { bindingMetadata: script.bindings } })
    expect(compiled.errors).toEqual([])
})
test('actual training entries use detail-only players and scoped existing APIs', () => {
    expect(source('src/views/PriorDisposal/VoiceTraining.vue')).toContain('tool="voice-training"')
    const standalone = source('src/components/StandaloneAudioTools/index.vue')
    const fast = source('src/views/PriorDisposal/RapidGenerating.vue')
    expect(standalone).toContain('training && detailVisible && detail.audioPreparation')
    expect(standalone).toContain('await api.detail(row.id)')
    expect(standalone).toContain('requestScope === scopeKey.value')
    expect(fast).toContain('audioPreparation: item.audioPreparation')
    expect(fast).toContain('scope !== trainingDetailScope.value')
    expect(fast).toContain('onBeforeRouteLeave(closeTrainingDetail)')
    expect(fast).toContain('onDeactivated(closeTrainingDetail)')
    expect(fast).not.toContain("console.log('Viewing asset:'")
    const list = fast.slice(0, fast.indexOf('<!-- 2.'))
    expect(list).not.toContain('<audio')
    expect(list).not.toContain('<AudioPreparationDetail')
})
test.each([
    'src/components/AudioAssets/AudioAssetPicker.vue', 'src/components/AudioAssets/AudioAssetManager.vue',
    'src/components/AudioAssets/AudioBatchDialog.vue', 'src/components/AudioAssets/audioBatch.ts',
    // GeneratePlan intentionally uses the inline same-plan editor now; covered by audioDraftInline.test.ts.
    'src/api/material/audioAssets.ts',
    'src/views/GenerateMaterials/GenerateVideo.vue', 'src/views/GenerateMaterials/GenerateVoice.vue'
])('8e165db batch/shared-single-audio/quota/hidden controls preserved byte-for-byte: %s', filename => {
    const baseline = execFileSync('git', ['show', `8e165db:${filename}`], { cwd: root, encoding: 'utf8' })
    expect(source(filename).replace(/\r\n/g, '\n')).toBe(baseline.replace(/\r\n/g, '\n'))
})

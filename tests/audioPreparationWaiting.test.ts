import { readFileSync } from 'fs'
import { resolve } from 'path'
import * as ts from 'typescript'
import { parse } from '@vue/compiler-sfc'
import { AudioPreparation, audioPreparationLabel, isAudioOptimizing } from '/@/components/StandaloneAudioTools/audioPreparation'
import { statusLabels } from '/@/components/StandaloneAudioTools/media'

const root = resolve(__dirname, '..')
const standalone = readFileSync(resolve(root, 'src/components/StandaloneAudioTools/index.vue'), 'utf8')
const rapid = readFileSync(resolve(root, 'src/views/PriorDisposal/RapidGenerating.vue'), 'utf8')

// Execute the actual display functions without mounting pages or starting API/polling work.
function setupFunction(source: string, name: string, bindings: Record<string, unknown>) {
    const script = parse(source).descriptor.scriptSetup!.content
    const file = ts.createSourceFile('display.ts', script, ts.ScriptTarget.Latest, true)
    const statement = file.statements.find(node =>
        (ts.isFunctionDeclaration(node) && node.name?.text === name)
        || (ts.isVariableStatement(node) && node.declarationList.declarations.some(declaration =>
            ts.isIdentifier(declaration.name) && declaration.name.text === name)))
    if (!statement) throw new Error(`Missing display function: ${name}`)
    const { outputText } = ts.transpileModule(statement.getText(file), {
        compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS }
    })
    return new Function(...Object.keys(bindings), `${outputText}\nreturn ${name}`)(...Object.values(bindings))
}

const trainingLabel = setupFunction(standalone, 'taskStatusLabel', { training: true, isAudioOptimizing, statusLabels })
const dubbingLabel = setupFunction(standalone, 'taskStatusLabel', { training: false, isAudioOptimizing, statusLabels })
const rapidLabel = setupFunction(rapid, 'getStatusLabel', { isAudioOptimizing })
const getProgressText = setupFunction(rapid, 'getProgressText', {})
const progressExpression = parse(rapid).descriptor.template!.content.match(/\{\{\s*([^{}]*getProgressText\(scope\.row\.taskStatus\)[^{}]*)\s*\}\}/)![1]
const renderProgressLabel = new Function('scope', 'isAudioOptimizing', 'getProgressText', `return (${progressExpression})`)
const progressLabel = (row: any) => renderProgressLabel({ row }, isAudioOptimizing, getProgressText)

const preparation: AudioPreparation = Object.freeze({
    id: 9, status: 'processing', statusLabel: '音频优化处理中',
    referenceText: '参考文案', targetText: '目标文案',
    originalUrl: '/original.mp3', referenceUrl: '/reference.mp3', processedUrl: '/processed.mp3'
})

test.each(['0', '1', 'pending', 'waiting', 'queued', 'processing', 'running', 'preparing', 'optimizing', 'uploaded', 'processed_submitting'])(
    'active audio preparation %s shows waiting in lists, progress and details, without mutation', status => {
        const audioPreparation = Object.freeze({ ...preparation, status })
        expect(audioPreparationLabel(audioPreparation)).toBe('等待中')
        for (const taskStatus of [0, 1, '0', '1', 'waiting', 'processing']) {
            const row = Object.freeze({ taskStatus, audioPreparation })
            expect(trainingLabel(row)).toBe('等待中')
            expect(rapidLabel(row)).toBe('等待中')
            expect(progressLabel(row)).toBe('等待中')
            expect(row.taskStatus).toBe(taskStatus)
            expect(row.audioPreparation).toBe(audioPreparation)
            expect(row.audioPreparation).toEqual({ ...preparation, status })
        }
    }
)

test('safe processing-label fallback for a future ASR/Qwen stage also remains waiting', () => {
    const row = { taskStatus: '1', audioPreparation: { ...preparation, status: 'future-asr-qwen-stage' } }
    expect(trainingLabel(row)).toBe('等待中')
    expect(rapidLabel(row)).toBe('等待中')
    expect(progressLabel(row)).toBe('等待中')
    expect(audioPreparationLabel(row.audioPreparation)).toBe('等待中')
    expect(row.audioPreparation.statusLabel).toBe('音频优化处理中')
})

test.each([
    ['ready', '音频优化已完成'], ['accepted', '音频优化已完成'], ['success', '音频优化已完成'],
    ['succeeded', '音频优化已完成'], ['completed', '音频优化已完成'], ['done', '音频优化已完成'],
    ['-1', '音频优化未完成'], ['failed', '音频优化未完成'], ['error', '音频优化未完成'],
    ['unknown', '训练提交结果待确认，请联系管理员'], ['cancelled', '音频优化已取消']
])('detail status %s retains its label despite legacy processing-label input', (status, label) => {
    const value = Object.freeze({ ...preparation, status })
    expect(audioPreparationLabel(value)).toBe(label)
    expect(value).toEqual({ ...preparation, status })
})

test.each(Object.entries(statusLabels))('standalone normal/terminal status %s and dubbing retain their labels', (taskStatus, label) => {
    for (const audioPreparation of [undefined, null, { ...preparation, status: 'ready' }, { ...preparation, status: 'failed' }]) {
        expect(trainingLabel({ taskStatus, audioPreparation })).toBe(label)
    }
    expect(dubbingLabel({ taskStatus, audioPreparation: preparation })).toBe(label)
    if (!['0', '1'].includes(taskStatus)) {
        expect(trainingLabel({ taskStatus, audioPreparation: preparation })).toBe(label)
    }
})

test.each([
    [0, '等待中'], [1, '生成音频中'], [2, '生成视频中'], [3, '已完成'], [4, '任务失败'], [-1, '任务失败'],
    ['0', '等待中'], ['1', '生成音频中'], ['2', '生成视频中'], ['3', '已完成'], ['4', '任务失败'], ['-1', '任务失败'],
    ['waiting', '等待中'], ['processing', '处理中'], ['success', '已完成'], ['failed', '克隆失败']
])('rapid normal/terminal status %s retains its label', (taskStatus, label) => {
    for (const audioPreparation of [undefined, null, { ...preparation, status: 'ready' }, { ...preparation, status: 'failed' }]) {
        const row = { taskStatus, audioPreparation }
        expect(rapidLabel(row)).toBe(label)
        expect(progressLabel(row)).toBe(getProgressText(taskStatus))
    }
    if (!isAudioOptimizing(preparation, taskStatus)) {
        expect(rapidLabel({ taskStatus, audioPreparation: preparation })).toBe(label)
        expect(progressLabel({ taskStatus, audioPreparation: preparation })).toBe(getProgressText(taskStatus))
    }
})

test('details show waiting while retaining their title, original fields and legacy input', () => {
    expect(audioPreparationLabel(preparation)).toBe('等待中')
    expect(preparation.statusLabel).toBe('音频优化处理中')
    const detail = readFileSync(resolve(root, 'src/components/StandaloneAudioTools/AudioPreparationDetail.vue'), 'utf8')
    expect(detail).toContain('<summary>音频优化详情</summary>')
    expect(detail).toContain('{{ audioPreparationLabel(preparation) }}')
    expect(standalone).toContain('<AudioPreparationDetail v-if="training && detailVisible && detail.audioPreparation" :key="detail.id" :preparation="detail.audioPreparation" />')
    expect(rapid).toContain('<AudioPreparationDetail v-if="trainingDetailVisible && trainingDetail.audioPreparation" :key="trainingDetail.id" :preparation="trainingDetail.audioPreparation" />')
    expect(rapid).toContain('audioPreparation: item.audioPreparation')
})

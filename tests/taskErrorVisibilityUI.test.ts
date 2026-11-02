/// <reference path="../src/type/shims-vue.d.ts" />
import { readFileSync } from 'fs'
import { resolve } from 'path'
import * as ts from 'typescript'
import * as Vue from 'vue'
import { mount } from '@vue/test-utils'
import { parse } from '@vue/compiler-sfc'
import { baseParse, compile } from '@vue/compiler-dom'
import AudioPreparationDetail from '/@/components/StandaloneAudioTools/AudioPreparationDetail.vue'
import { isAudioOptimizing } from '/@/components/StandaloneAudioTools/audioPreparation'
import { statusLabels } from '/@/components/StandaloneAudioTools/media'

const root = resolve(__dirname, '..')
const standalone = readFileSync(resolve(root, 'src/components/StandaloneAudioTools/index.vue'), 'utf8')
const rapid = readFileSync(resolve(root, 'src/views/PriorDisposal/RapidGenerating.vue'), 'utf8')
const preparation = {
    id: 9, status: 'failed', errorCode: 'provider-secret',
    referenceText: 'private-transcript', targetText: 'private-target',
    originalUrl: '/private-original.mp3', referenceUrl: '/private-reference.mp3', processedUrl: '/private-processed.mp3'
}

// Execute the actual setup functions, without running page lifecycle hooks or APIs.
function setupFunction(source: string, name: string, bindings: Record<string, unknown>) {
    const file = ts.createSourceFile('visibility.ts', parse(source).descriptor.scriptSetup!.content, ts.ScriptTarget.Latest, true)
    const statement = file.statements.find(node => ts.isFunctionDeclaration(node) && node.name?.text === name)
    if (!statement) throw new Error(`Missing setup function: ${name}`)
    const { outputText } = ts.transpileModule(statement.getText(file), {
        compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS }
    })
    return new Function(...Object.keys(bindings), `${outputText}\nreturn ${name}`)(...Object.values(bindings))
}

// Compile the real parent template node (including its v-if), not a duplicated test gate.
function boundary(source: string, predicate: (node: any) => boolean, bindings: Record<string, unknown>) {
    const ast = baseParse(parse(source).descriptor.template!.content)
    function find(node: any): any {
        if (node.type === 1 && predicate(node)) return node
        for (const child of node.children || []) {
            const match = find(child)
            if (match) return match
        }
    }
    const node = find(ast)
    if (!node) throw new Error('Missing template boundary')
    const { code } = compile(node.loc.source, { mode: 'function' })
    const render = new Function('Vue', code)(Vue)
    return mount(Vue.defineComponent({ components: { AudioPreparationDetail }, setup: () => bindings, render }))
}

afterEach(() => jest.restoreAllMocks())

const nonPlatformRoles: Array<[string, unknown]> = [
    ['member', false], ['tenant admin', false], ['missing', undefined],
    ['null', null], ['string false', 'false'], ['string true', 'true'], ['numeric true', 1]
]

test.each(nonPlatformRoles)('%s never reads task errorMessage or renders arbitrary statusHint', (_role, flag) => {
    const layout = { getUserInfo: { isPlatformSuperAdmin: flag, permissionFlags: { canManageUsers: true } } }
    for (const training of [true, false]) {
        const bindings = { layout, training }
        const explanation = setupFunction(standalone, 'taskExplanation', bindings)
        const show = setupFunction(standalone, 'showTaskExplanation', bindings)
        const row = {
            taskStatus: '-1',
            get errorMessage(): string { throw new Error('must not read raw errorMessage') },
            statusHint: 'provider-secret raw-hint'
        }
        expect(show(row)).toBe(true)
        expect(explanation(row)).toBe('任务处理失败，请重试或联系管理员')
        row.taskStatus = 'uncertain'
        expect(show(row)).toBe(true)
        expect(explanation(row)).toBe('任务结果待确认，请等待后台核实')
        row.taskStatus = '2'
        expect(show(row)).toBe(false)
    }
})

test('platform admin retains raw task diagnostics and status hints', () => {
    const bindings = { layout: { getUserInfo: { isPlatformSuperAdmin: true } }, training: false }
    const explanation = setupFunction(standalone, 'taskExplanation', bindings)
    const show = setupFunction(standalone, 'showTaskExplanation', bindings)
    expect(explanation({ taskStatus: '-1', errorMessage: 'provider-secret', statusHint: 'raw-hint' })).toBe('provider-secret')
    expect(explanation({ taskStatus: 'uncertain', statusHint: 'raw-hint' })).toBe('raw-hint')
    expect(show({ taskStatus: '2', statusHint: 'raw-hint' })).toBe(true)
})

test.each(nonPlatformRoles)('%s cannot mount either preparation detail even with a full legacy payload', (_role, flag) => {
    const detail = { id: 7, audioPreparation: preparation }
    const standaloneView = boundary(standalone, node => node.tag === 'AudioPreparationDetail', {
        layout: { getUserInfo: { isPlatformSuperAdmin: flag, permissionFlags: { canManageUsers: true } } },
        training: true, detailVisible: true, detail
    })
    const rapidView = boundary(rapid, node => node.tag === 'AudioPreparationDetail', {
        isPlatformSuperAdmin: flag, trainingDetailVisible: true, trainingDetail: detail
    })
    for (const wrapper of [standaloneView, rapidView]) {
        expect(wrapper.findComponent(AudioPreparationDetail).exists()).toBe(false)
        expect(wrapper.find('audio').exists()).toBe(false)
        expect(wrapper.html()).not.toMatch(/private-|provider-secret/)
        wrapper.unmount()
    }
})

test.each(['standalone', 'rapid'])('%s platform detail remains usable and role revocation releases players', async entry => {
    const pause = jest.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {})
    const load = jest.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(() => {})
    const flag = Vue.ref<unknown>(true)
    const layout = Vue.reactive({ getUserInfo: { isPlatformSuperAdmin: true as unknown } })
    const detail = { id: 7, audioPreparation: preparation }
    const wrapper = entry === 'standalone'
        ? boundary(standalone, node => node.tag === 'AudioPreparationDetail', { layout, training: true, detailVisible: true, detail })
        : boundary(rapid, node => node.tag === 'AudioPreparationDetail', { isPlatformSuperAdmin: flag, trainingDetailVisible: true, trainingDetail: detail })
    expect(wrapper.findComponent(AudioPreparationDetail).exists()).toBe(true)
    expect(wrapper.findAll('audio')).toHaveLength(0)
    wrapper.get('details').element.open = true
    await wrapper.get('details').trigger('toggle')
    expect(wrapper.findAll('audio').map(audio => audio.attributes('src'))).toEqual([
        preparation.originalUrl, preparation.referenceUrl, preparation.processedUrl
    ])
    expect(wrapper.text()).toContain(preparation.referenceText)
    expect(wrapper.text()).toContain(preparation.targetText)
    layout.getUserInfo.isPlatformSuperAdmin = false
    flag.value = false
    await Vue.nextTick()
    expect(wrapper.findComponent(AudioPreparationDetail).exists()).toBe(false)
    expect(pause).toHaveBeenCalledTimes(3)
    expect(load).toHaveBeenCalledTimes(3)
    wrapper.unmount()
})

test.each([
    ['uncertain', 'raw-provider-hint'],
    ['-1', '提交结果待确认，请联系管理员']
])('pending confirmation %s keeps the actual no-duplicate-generation warning and blocks retry', (taskStatus, statusHint) => {
    const detail = { taskStatus, statusHint, canRetry: false }
    const wrapper = boundary(standalone, node => node.tag === 'p' && node.loc.source.includes('仅在允许重试时操作'), { detail })
    expect(wrapper.text()).toBe('任务结果待确认，请等待后台核实；仅在允许重试时操作，避免重复生成。')
    const retryView = boundary(standalone, node => node.tag === 'el-button' && node.loc.source.includes('row.canRetry === true'), { row: detail, actionId: null })
    expect(retryView.find('el-button').exists()).toBe(false)
    retryView.unmount()
    wrapper.unmount()
})

test.each(nonPlatformRoles)('%s recognizes only the exact historical safe hint', (_role, flag) => {
    const explanation = setupFunction(standalone, 'taskExplanation', {
        layout: { getUserInfo: { isPlatformSuperAdmin: flag } }
    })
    expect(explanation({ taskStatus: '-1', statusHint: '提交结果待确认，请联系管理员', canRetry: false })).toBe('任务结果待确认，请等待后台核实')
    for (const statusHint of ['任务失败', '提交结果待确认，请联系管理员 provider-secret', 'provider-secret', '提交结果待确认']) {
        expect(explanation({ taskStatus: '-1', statusHint })).toBe('任务处理失败，请重试或联系管理员')
    }
})

test.each([true, false])('training=%s historical unknown task is labelled pending confirmation, not failed', training => {
    const label = setupFunction(standalone, 'taskStatusLabel', { training, isAudioOptimizing, statusLabels })
    expect(label({ taskStatus: '-1', statusHint: '提交结果待确认，请联系管理员' })).toBe('状态待确认')
    expect(label({ taskStatus: '-1', statusHint: '提交结果待确认，请联系管理员 provider-secret' })).toBe('失败')
    expect(label({ taskStatus: '-1', statusHint: '任务失败' })).toBe('失败')
})

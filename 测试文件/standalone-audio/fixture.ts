// Isolated test harness only. No production routes, permissions, APIs or accounts are modified.
import { createApp, h, KeepAlive, reactive } from 'vue'
import { createRouter, createMemoryHistory, RouterView } from 'vue-router'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import VoiceTraining from '/@/views/PriorDisposal/VoiceTraining.vue'
import AudioDubbing from '/@/views/GenerateMaterials/AudioDubbing.vue'
import request from '/@/utils/request'
import { layout } from './layout.fixture'
import { hasCriticalOperation } from '/@/utils/criticalOperation'

const state = reactive({
    requests: [] as Array<{ url: string; data: any }>,
    status: '0', holdCreate: false, failNextCreate: false,
    listActive: 0, maxListActive: 0, holdList: false, createCount: 0,
    deleted: [] as number[], registeredName: ''
})
let releaseCreate = () => {}
let releaseList = () => {}
const router = createRouter({ history: createMemoryHistory(), routes: [
    { path: '/prior-disposal/voice-training', component: VoiceTraining },
    { path: '/generate-materials/audio-dubbing', component: AudioDubbing },
    { path: '/away', component: { render: () => h('p', '离开音频页面') } }
] })
const row = (id: number) => ({
    id, name: `样本${id}`, gender: id % 2 ? 'male' : 'female', language: 'zh', model: 'a2e',
    taskStatus: id === 1 ? state.status : id === 3 ? 'uncertain' : id === 4 ? '-1' : '2',
    outputUrl: `${location.origin}/fixture-audio.wav`, errorMessage: id === 4 ? 'INTERNAL_TOKEN_SHOULD_NOT_LEAK' : '',
    statusHint: id === 4 ? '生成失败，请重试或联系管理员' : '',
    createTime: '2026-10-15 09:00:00', updateTime: '2026-10-15 09:01:00', startTime: '', endTime: '',
    canRetry: id === 4, attemptNo: 1
})
request.defaults.adapter = async config => {
    const url = String(config.url)
    let data = typeof config.data === 'string' ? JSON.parse(config.data) : config.data
    if (data instanceof FormData) {
        const fields: Record<string, any> = {}
        data.forEach((value, key) => { fields[key] = value instanceof File ? { name: value.name, size: value.size } : value })
        data = fields
    }
    state.requests.push({ url, data })
    let result: any
    if (url.includes('validate-name/')) {
        const name = data.name
        result = { is_valid: name !== '重复名称' && name !== state.registeredName, recommended_name: name === '重复名称' ? '推荐名称' : '' }
    } else if (url.endsWith('/create/')) {
        if (state.holdCreate) await new Promise<void>(resolve => { releaseCreate = resolve })
        if (state.failNextCreate) { state.failNextCreate = false; state.registeredName = data.name; throw Object.assign(new Error('模拟响应丢失但任务已创建'), { config }) }
        state.createCount++
        result = row(50)
    } else if (url.includes('/voice/paginate/')) {
        result = { page: data.page, pageSize: 20, total: 25, data: [{ id: data.page === 1 ? 201 : 225, voiceName: data.page === 1 ? '云端声音甲' : '云端声音乙', gender: 'female', url: `${location.origin}/fixture-audio.wav`, externalId: 'do-not-submit-external-id' }] }
    } else if (url.endsWith('/paginate/')) {
        state.listActive++
        state.maxListActive = Math.max(state.maxListActive, state.listActive)
        if (state.holdList) await new Promise<void>(resolve => { releaseList = resolve })
        const all = Array.from({ length: 25 }, (_item, index) => row(index + 1)).filter(item => !state.deleted.includes(item.id))
            .filter(item => !data.search.name || item.name.includes(data.search.name))
            .filter(item => !data.search.gender || item.gender === data.search.gender)
            .filter(item => !data.search.taskStatus || item.taskStatus === data.search.taskStatus)
        result = { page: data.page, pageSize: data.pageSize, total: all.length, data: all.slice((data.page - 1) * data.pageSize, data.page * data.pageSize) }
        state.listActive--
    } else if (url.endsWith('/retry/')) { result = row(4) }
    else if (config.method === 'delete') { state.deleted.push(Number(url.split('/').filter(Boolean).pop())); result = {} }
    else result = row(1)
    return { status: 200, statusText: 'OK', headers: {}, config, data: { code: 200, data: result } }
}
;(window as any).audioFixture = {
    state, layout, critical: hasCriticalOperation,
    releaseCreate: () => releaseCreate(), releaseList: () => releaseList(),
    navigate: (path: string) => router.push(path)
}
void router.push('/prior-disposal/voice-training').then(() => {
    createApp({ render: () => h(RouterView, null, { default: ({ Component }: any) => h(KeepAlive, null, [h(Component)]) }) })
        .use(router).use(ElementPlus).mount('#app')
})

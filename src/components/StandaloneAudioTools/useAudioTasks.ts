import { reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { standaloneAudioApi, AudioQuery, AudioTask, AudioTool } from '/@/api/material/standaloneAudio'

export const defaultQuery = (): AudioQuery => ({ page: 1, pageSize: 20, search: { name: '', gender: '', taskStatus: '' } })

export function restoreQuery(key: string): AudioQuery {
    const result = defaultQuery()
    try {
        const saved = JSON.parse(localStorage.getItem(key) || 'null')
        if (!saved) return result
        result.page = Number.isInteger(saved.page) && saved.page > 0 ? saved.page : 1
        result.pageSize = [10, 20, 50, 100].includes(saved.pageSize) ? saved.pageSize : 20
        result.search.name = typeof saved.search?.name === 'string' ? saved.search.name : ''
        result.search.gender = ['male', 'female'].includes(saved.search?.gender) ? saved.search.gender : ''
        result.search.taskStatus = ['0', '1', '2', '-1', 'uncertain'].includes(saved.search?.taskStatus) ? saved.search.taskStatus : ''
    } catch { /* Storage may be disabled; the page remains usable. */ }
    return result
}

/** One serialized list request, including manual refreshes queued during polling. */
export function useAudioTasks(tool: AudioTool, scope: () => string, relevant: () => boolean) {
    const api = standaloneAudioApi(tool)
    const query = reactive(defaultQuery())
    const rows = ref<AudioTask[]>([])
    const total = ref(0)
    const loading = ref(false)
    const listError = ref('')
    let running = false
    let pending: boolean | null = null
    let timer: ReturnType<typeof setTimeout> | undefined
    let generation = 0

    function persist() {
        try { localStorage.setItem(scope(), JSON.stringify(query)) } catch { /* optional persistence */ }
    }
    function schedule() {
        if (timer) clearTimeout(timer)
        if (relevant()) timer = setTimeout(() => { void load(true) }, 10000)
    }
    async function load(silent = false): Promise<void> {
        if (!relevant()) return
        if (timer) clearTimeout(timer)
        if (running) {
            pending = pending === false ? false : silent
            return
        }
        running = true
        loading.value = !silent
        const requestScope = scope()
        const requestGeneration = generation
        const snapshot = JSON.stringify(query)
        persist()
        try {
            const page = await api.paginate(JSON.parse(snapshot))
            if (!relevant() || scope() !== requestScope || requestGeneration !== generation || JSON.stringify(query) !== snapshot) return
            const previous = new Map(rows.value.map(row => [row.id, row.taskStatus]))
            rows.value = page.data
            total.value = Number(page.total) || 0
            listError.value = ''
            for (const row of page.data) {
                const before = previous.get(row.id)
                if (before && ['0', '1', 'uncertain'].includes(before) && before !== row.taskStatus) {
                    if (row.taskStatus === '2') ElMessage.success(`${row.name}：已完成`)
                    if (row.taskStatus === '-1') ElMessage.error(`${row.name}：失败，请查看任务说明`)
                }
            }
            const lastPage = Math.max(1, Math.ceil(total.value / query.pageSize))
            if (query.page > lastPage) { query.page = lastPage; pending = false }
        } catch (error) {
            if (relevant() && scope() === requestScope && generation === requestGeneration && JSON.stringify(query) === snapshot) {
                listError.value = '任务列表刷新失败，已保留当前结果；稍后自动重试或点击刷新'
                if (!silent) ElMessage.error('获取任务列表失败，请重试')
            }
        } finally {
            running = false
            loading.value = false
            if (pending !== null && relevant()) {
                const nextSilent = pending
                pending = null
                void load(nextSilent)
            } else { pending = null; schedule() }
        }
    }
    function stop() { if (timer) clearTimeout(timer); pending = null; generation++ }
    function reset() {
        stop()
        Object.assign(query, restoreQuery(scope()))
        rows.value = []
        total.value = 0
        listError.value = ''
    }
    function search() { query.page = 1; persist(); void load() }
    return { api, query, rows, total, loading, listError, load, search, persist, reset, stop }
}

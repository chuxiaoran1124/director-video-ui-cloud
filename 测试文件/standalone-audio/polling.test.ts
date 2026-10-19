import { ElMessage } from 'element-plus'
import { standaloneAudioApi } from '/@/api/material/standaloneAudio'
import { defaultQuery, restoreQuery, useAudioTasks } from '/@/components/StandaloneAudioTools/useAudioTasks'
jest.mock('element-plus', () => ({ ElMessage: { success: jest.fn(), error: jest.fn() } }))
jest.mock('/@/api/material/standaloneAudio', () => ({ standaloneAudioApi: jest.fn() }))
const paginate = jest.fn()
const setup = () => {
    let scope = 'tenant:1:user:1'
    let relevant = true
    const tasks = useAudioTasks('voice-training', () => scope, () => relevant)
    return { tasks, setScope: (value: string) => { scope = value }, setRelevant: (value: boolean) => { relevant = value } }
}
const page = (id = 1, taskStatus = '0') => ({ page: 1, pageSize: 20, total: 1, data: [{ id, name: '任务', taskStatus }] })
const flush = async () => { await Promise.resolve(); await Promise.resolve(); await Promise.resolve() }
beforeEach(() => {
    jest.useFakeTimers()
    localStorage.clear()
    jest.clearAllMocks()
    ;(standaloneAudioApi as jest.Mock).mockReturnValue({ paginate })
    paginate.mockReset().mockResolvedValue(page())
})
afterEach(() => jest.useRealTimers())
test('10 second polling, no overlapping manual/poll requests, stop on deactivate', async () => {
    const { tasks, setRelevant } = setup()
    let resolve!: (value: any) => void
    paginate.mockReturnValueOnce(new Promise(done => { resolve = done }))
    const first = tasks.load()
    expect(tasks.loading.value).toBe(true)
    await tasks.load(true)
    tasks.query.search.gender = 'female'
    await tasks.load(false)
    jest.advanceTimersByTime(30000)
    expect(paginate).toHaveBeenCalledTimes(1)
    resolve(page(88))
    await first
    await flush()
    expect(paginate).toHaveBeenCalledTimes(2)
    expect(paginate.mock.calls[1][0].search.gender).toBe('female')
    expect(tasks.rows.value[0].id).toBe(1)
    jest.advanceTimersByTime(9999)
    expect(paginate).toHaveBeenCalledTimes(2)
    jest.advanceTimersByTime(1)
    expect(tasks.loading.value).toBe(false)
    await flush()
    expect(paginate).toHaveBeenCalledTimes(3)
    setRelevant(false)
    tasks.stop()
    jest.advanceTimersByTime(30000)
    expect(paginate).toHaveBeenCalledTimes(3)
})
test('stale tenant response cannot populate a new tenant', async () => {
    const { tasks, setScope } = setup()
    let resolve!: (value: any) => void
    paginate.mockReturnValueOnce(new Promise(done => { resolve = done }))
    const first = tasks.load()
    setScope('tenant:2:user:1')
    tasks.reset()
    await tasks.load()
    resolve(page(99))
    await first
    await flush()
    expect(tasks.rows.value[0].id).toBe(1)
    expect(paginate).toHaveBeenCalledTimes(2)
    tasks.stop()
})
test('silent poll errors preserve data and avoid toast; subsequent terminal status is announced once', async () => {
    const { tasks } = setup()
    await tasks.load()
    paginate.mockRejectedValueOnce(new Error('offline'))
    await tasks.load(true)
    expect(tasks.rows.value[0].id).toBe(1)
    expect(tasks.listError.value).toContain('刷新失败')
    expect(ElMessage.error).not.toHaveBeenCalled()
    paginate.mockResolvedValue(page(1, '2'))
    await tasks.load(true)
    await tasks.load(true)
    expect(ElMessage.success).toHaveBeenCalledTimes(1)
    tasks.stop()
})
test('pagination/filter state persists per tenant/user, validates stored fields and survives corrupt storage', () => {
    const { tasks, setScope } = setup()
    tasks.query.page = 3
    tasks.query.pageSize = 50
    tasks.query.search = { name: '样本', gender: 'male', taskStatus: 'uncertain' }
    tasks.persist()
    expect(restoreQuery('tenant:1:user:1')).toEqual(tasks.query)
    setScope('tenant:2:user:1')
    tasks.reset()
    expect(tasks.query).toEqual(defaultQuery())
    localStorage.setItem('broken', '{oops')
    expect(restoreQuery('broken')).toEqual(defaultQuery())
    localStorage.setItem('invalid', JSON.stringify({ page: -3, pageSize: 999, search: { gender: 'all', taskStatus: 'unknown' } }))
    expect(restoreQuery('invalid')).toEqual(defaultQuery())
})

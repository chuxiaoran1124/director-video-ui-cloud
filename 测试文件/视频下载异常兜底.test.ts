/** @jest-environment node */
import { downloadVideoZip, ZipProgress, ZipVideoItem } from '../src/utils/download'
import { createVideoZipSink } from '../src/utils/videoZipWriter'
import { ZIP_DOWNLOAD_LIMITS } from '../src/utils/downloadSafety'
import { hasCriticalOperation } from '../src/utils/criticalOperation'
import { downloadFileByProxy } from '/@/api/material'
import JSZip from 'jszip'

jest.mock('/@/api/material', () => ({ downloadFileByProxy: jest.fn() }))
jest.mock('../src/utils/downloadSafety', () => {
    const actual = jest.requireActual<any>('../src/utils/downloadSafety')
    return { ...actual, ZIP_DOWNLOAD_LIMITS: { ...actual.ZIP_DOWNLOAD_LIMITS,
        idleMs: 100, itemMs: 4000, writeIdleMs: 1000, writeTotalMs: 4000,
        cleanupMs: 50, batchMs: 20000, slowAfterMs: 30, slowBps: 32768
    } }
})
// Keep the REAL sink/ZIP writer. Only shrink the 256 MiB packing threshold.
jest.mock('../src/utils/videoZipWriter', () => ({
    ...jest.requireActual<any>('../src/utils/videoZipWriter'), VIDEO_ZIP_FALLBACK_BYTES: 32
}))

const realImmediate = jest.requireActual<any>('timers').setImmediate
const nextIO = () => new Promise<void>(resolve => realImmediate(resolve))
const never = <T = void>() => new Promise<T>(() => undefined)
const defaults = { ...ZIP_DOWNLOAD_LIMITS }
const originals = ['window', 'document', 'fetch'].map(key => [key, Object.getOwnPropertyDescriptor(global, key)] as const)
const saved: Array<{ name: string; blob: Blob }> = []
let listeners: Map<string, Set<(...args: any[]) => void>>
let currentBlob: Blob

const items = (n = 3): ZipVideoItem[] => Array.from({ length: n }, (_, i) => ({
    url: `https://zip-safety.invalid/${i}.mp4`, fileName: `${i}.mp4`, taskId: i, taskName: `视频-${i}`
}))
const response = (text = 'x') => ({ ok: true, status: 200,
    headers: { get: (name: string) => name === 'content-type' ? 'video/mp4' : null },
    blob: async () => new Blob([text], { type: 'video/mp4' })
})
const fire = (type: string) => { for (const callback of Array.from(listeners.get(type) || [])) callback({ type }) }

// Jest 26 has no advanceTimersByTimeAsync. Yield to real stream I/O between
// deterministic fake-clock steps; NEVER runAllTimers on an infinite trickle.
async function until(predicate: () => boolean, maxMs = 10000): Promise<void> {
    for (let elapsed = 0; elapsed <= maxMs; elapsed += 10) {
        for (let turn = 0; turn < 4; turn++) await nextIO()
        if (predicate()) return
        jest.advanceTimersByTime(10)
    }
    throw new Error(`Fault-injection operation exceeded ${maxMs} ms of fake time`)
}
async function bounded<T>(operation: Promise<T>, maxMs = 10000): Promise<T> {
    let settled = false
    let value: T
    let failure: unknown
    let rejected = false
    operation.then(result => { value = result; settled = true }, error => { failure = error; rejected = true; settled = true })
    await until(() => settled, maxMs)
    if (rejected) throw failure
    return value!
}
async function unzip(blob: Blob): Promise<JSZip> {
    return bounded(JSZip.loadAsync(await blob.arrayBuffer(), { checkCRC32: true }))
}

function disk(options: { write?: (chunk: Uint8Array) => void | Promise<void>; close?: () => void | Promise<void>; abort?: () => void | Promise<void> } = {}) {
    const chunks: Uint8Array[] = []
    let committed = false
    const write = jest.fn(async (chunk: Uint8Array) => { await options.write?.(chunk); chunks.push(chunk.slice()) })
    const close = jest.fn(async () => { await options.close?.(); committed = true })
    const abort = jest.fn(async () => { await options.abort?.() })
    const stream = new WritableStream<Uint8Array>({ write, close, abort })
    const getWriter = jest.spyOn(stream, 'getWriter')
    return { stream, chunks, write, close, abort, getWriter, get committed() { return committed } }
}
function native(output: ReturnType<typeof disk>) {
    ;(window as any).showSaveFilePicker = jest.fn(async () => ({ createWritable: async () => output.stream }))
}
function directory(factory: (index: number) => ReturnType<typeof disk> = () => disk()) {
    const outputs: ReturnType<typeof disk>[] = []
    const names: string[] = []
    const getFileHandle = jest.fn(async (name: string) => {
        names.push(name)
        const output = factory(outputs.length)
        outputs.push(output)
        return { createWritable: async () => output.stream }
    })
    ;(window as any).showDirectoryPicker = jest.fn(async () => ({ getFileHandle }))
    ;(window as any).showSaveFilePicker = jest.fn(() => { throw new Error('Directory mode must not reopen a save picker') })
    return { outputs, names, getFileHandle }
}

// Models browser fetch abort propagation while retaining real ReadableStream
// ownership/cancellation. No request can reach the network.
function bodyResponse(signal: AbortSignal, delayMs?: number, text = 'x') {
    let stopped = false
    const cancel = jest.fn(() => { stopped = true })
    const body = new ReadableStream<Uint8Array>({
        start(controller) {
            signal.addEventListener('abort', () => { stopped = true; controller.error((signal as any).reason) }, { once: true })
        },
        pull(controller) {
            if (delayMs === undefined) return never()
            return new Promise<void>(resolve => setTimeout(() => {
                if (!stopped) controller.enqueue(new TextEncoder().encode(text))
                resolve()
            }, delayMs))
        },
        cancel
    })
    return { ...response(), body, cancel }
}

beforeEach(() => {
    jest.useFakeTimers('modern')
    jest.setSystemTime(1_700_000_000_000)
    Object.assign(ZIP_DOWNLOAD_LIMITS, defaults)
    saved.length = 0
    listeners = new Map()
    ;(global as any).window = {
        setTimeout: (...args: any[]) => (setTimeout as any)(...args), clearTimeout: (id: any) => clearTimeout(id),
        URL: { createObjectURL: (blob: Blob) => { currentBlob = blob; return 'blob:zip-safety' }, revokeObjectURL: jest.fn() },
        addEventListener: (name: string, callback: (...args: any[]) => void) => {
            if (!listeners.has(name)) listeners.set(name, new Set())
            listeners.get(name)!.add(callback)
        },
        removeEventListener: (name: string, callback: (...args: any[]) => void) => listeners.get(name)?.delete(callback)
    }
    ;(global as any).document = {
        createElement: () => ({ style: {}, href: '', download: '', click() { saved.push({ name: this.download, blob: currentBlob }) } }),
        body: { appendChild: jest.fn(), removeChild: jest.fn() }
    }
    ;(global as any).fetch = jest.fn(async () => response())
    ;(downloadFileByProxy as jest.Mock).mockClear()
})

afterEach(async () => {
    try {
        // Drain a failed assertion's operation before moving to another test.
        // The bounded test itself still fails; this only prevents cascading locks.
        await until(() => !hasCriticalOperation(), 21000)
        expect(downloadFileByProxy).not.toHaveBeenCalled()
        expect(hasCriticalOperation()).toBe(false)
        expect(Array.from(listeners.values()).every(set => set.size === 0)).toBe(true)
    } finally {
        jest.clearAllTimers()
        jest.useRealTimers()
        jest.restoreAllMocks()
        for (const [key, descriptor] of originals) {
            if (descriptor) Object.defineProperty(global, key, descriptor)
            else delete (global as any)[key]
        }
    }
})

test('生产安全预算和256MiB上限保持原值；只在本套测试缩小', () => {
    expect(jest.requireActual<any>('../src/utils/downloadSafety').ZIP_DOWNLOAD_LIMITS).toEqual({
        idleMs: 60000, itemMs: 300000, writeIdleMs: 60000, writeTotalMs: 300000,
        cleanupMs: 1000, batchMs: 1800000, slowAfterMs: 30000, slowBps: 32768
    })
    expect(jest.requireActual<any>('../src/utils/videoZipWriter').VIDEO_ZIP_FALLBACK_BYTES).toBe(256 * 1024 * 1024)
})

test('慢速持续字节不能延长单条总预算，并报告当前项、字节、速度与慢速提示', async () => {
    ZIP_DOWNLOAD_LIMITS.itemMs = 400
    native(disk())
    const progress: ZipProgress[] = []
    let signal!: AbortSignal
    ;(fetch as jest.Mock).mockImplementation(async (_url, options) => {
        signal = options.signal
        return bodyResponse(signal, 40)
    })
    const start = Date.now()
    const result = await bounded(downloadVideoZip(items(1), 'trickle.zip', p => progress.push(p)), 600)
    expect(Date.now() - start).toBeLessThanOrEqual(500)
    expect(signal.aborted).toBe(true)
    expect(fetch).toHaveBeenCalledTimes(1)
    expect(result).toMatchObject({ success: 0, failed: 1, archives: 0 })
    expect(result.failedItems[0].reason).toMatch(/累计|超时/)
    expect(progress.some(p => p.currentName === '视频-0' && p.currentIndex === 1 && p.attempt === 1 && (p.loadedBytes || 0) > 0 && (p.speedBytesPerSecond || 0) > 0)).toBe(true)
    expect(progress.some(p => /速度较慢/.test(p.notice || ''))).toBe(true)
    expect(saved).toHaveLength(0)
})

test('无响应fetch忽略abort也在单条预算内返回，且不锁住下一批', async () => {
    ZIP_DOWNLOAD_LIMITS.itemMs = 250
    const signals: AbortSignal[] = []
    ;(fetch as jest.Mock).mockImplementation((_url, options) => { signals.push(options.signal); return never() })
    expect(await bounded(downloadVideoZip(items(1), 'hung-fetch.zip', () => undefined), 400)).toMatchObject({ success: 0, failed: 1 })
    expect(signals.every(signal => signal.aborted)).toBe(true)
    expect(hasCriticalOperation()).toBe(false)
    ;(fetch as jest.Mock).mockResolvedValue(response())
    expect(await bounded(downloadVideoZip(items(1), 'next.zip', () => undefined))).toMatchObject({ success: 1, failed: 0 })
})

test.each(['write', 'close'] as const)('真实WritableStream的%s永久停滞：有界失败、请求abort、无未保存成功', async stage => {
    ZIP_DOWNLOAD_LIMITS.writeIdleMs = 100
    const output = disk({ [stage]: () => never() })
    native(output)
    const callback = jest.fn()
    const operation = downloadVideoZip(items(), 'hung-disk.zip', () => undefined, callback)
    await until(() => output[stage].mock.calls.length > 0)
    const writer = output.getWriter.mock.results[0].value
    const abort = jest.spyOn(writer, 'abort')
    const start = Date.now()
    // requireActual's boundedCleanup closes over its actual 1000ms budget,
    // even though the exported limits used by the writer are mocked smaller.
    const result = await bounded(operation, 1500)
    expect(Date.now() - start).toBeLessThanOrEqual(1200)
    expect(abort).toHaveBeenCalled()
    expect(output.stream.locked).toBe(false)
    expect(output.committed).toBe(false)
    expect(callback).not.toHaveBeenCalled()
    expect(result).toMatchObject({ success: 0, failed: 3, archives: 0, cancelled: false })
    expect(result.failedItems.map(f => f.item)).toEqual(items())
    expect(result.errorMessage).toMatch(/写入|超时/)
    expect(fetch).toHaveBeenCalledTimes(stage === 'write' ? 1 : 3)
})

test('即使写入不断前进，真实sink的写入总预算仍不可续期', async () => {
    ZIP_DOWNLOAD_LIMITS.writeIdleMs = 100
    ZIP_DOWNLOAD_LIMITS.writeTotalMs = 200
    const output = disk({ write: () => new Promise<void>(resolve => setTimeout(resolve, 70)) })
    const sink = createVideoZipSink(output.stream)
    const start = Date.now()
    await expect(bounded(sink.add('tiny.mp4', new Blob(['x'])), 350)).rejects.toMatchObject({ code: 'ZIP_WRITE_TIMEOUT' })
    expect(Date.now() - start).toBeLessThanOrEqual(220)
    expect(output.write.mock.calls.length).toBeGreaterThanOrEqual(2)
    await bounded(sink.abort(), 100)
    expect(output.stream.locked).toBe(false)
})

test.each(['write', 'close'] as const)('磁盘%s抛出ENOSPC：返回全部未保存项，绝不误报成功', async stage => {
    const output = disk({ [stage]: () => { throw new Error('ENOSPC: disk full') } })
    native(output)
    const callback = jest.fn()
    const progress: ZipProgress[] = []
    const result = await bounded(downloadVideoZip(items(), 'full.zip', p => progress.push(p), callback))
    expect(result).toMatchObject({ success: 0, failed: 3, archives: 0, cancelled: false })
    expect(result.failedItems.map(f => f.item.taskId)).toEqual([0, 1, 2])
    expect(result.errorMessage).toMatch(/空间不足/)
    expect(progress.every(p => !p.success)).toBe(true)
    expect(callback).not.toHaveBeenCalled()
    expect(output.stream.locked).toBe(false)
})

test('close真正完成前成功数和成功回调均为0，close后ZIP可独立校验', async () => {
    let finish!: () => void
    const output = disk({ close: () => new Promise<void>(resolve => { finish = resolve }) })
    native(output)
    const callback = jest.fn(() => expect(output.committed).toBe(true))
    const progress: ZipProgress[] = []
    const operation = downloadVideoZip(items(2), 'commit.zip', p => progress.push(p), callback)
    await until(() => !!finish)
    expect(progress.every(p => !p.success)).toBe(true)
    expect(callback).not.toHaveBeenCalled()
    expect(hasCriticalOperation()).toBe(true)
    finish()
    expect(await bounded(operation)).toMatchObject({ success: 2, failed: 0, archives: 1, streaming: true })
    expect(callback).toHaveBeenCalledTimes(2)
    expect(Object.keys((await unzip(new Blob(output.chunks))).files)).toEqual(['0.mp4', '1.mp4'])
    expect(saved).toHaveLength(0)
})

test.each(['cancel', 'pagehide'] as const)('%s中止当前请求和后续fetch，返回未处理项并释放关键锁', async action => {
    const output = disk()
    native(output)
    let signal!: AbortSignal
    let cancel!: () => void
    ;(fetch as jest.Mock).mockImplementation(async (_url, options) => { signal = options.signal; return bodyResponse(signal) })
    const callback = jest.fn()
    const operation = downloadVideoZip(items(), 'cancel.zip', p => { cancel = p.cancel! }, callback)
    await until(() => !!signal)
    expect(typeof cancel).toBe('function')
    expect(hasCriticalOperation()).toBe(true)
    if (action === 'pagehide') fire('pagehide')
    else { cancel(); cancel() }
    const result = await bounded(operation, 200)
    expect(signal.aborted).toBe(true)
    expect(fetch).toHaveBeenCalledTimes(1)
    expect(result).toMatchObject({ success: 0, failed: 0, archives: 0, cancelled: true, unprocessedItems: items() })
    expect(callback).not.toHaveBeenCalled()
    expect(output.abort).toHaveBeenCalledTimes(1)
    expect(hasCriticalOperation()).toBe(false)
    ;(fetch as jest.Mock).mockResolvedValue(response())
    native(disk())
    expect(await bounded(downloadVideoZip(items(1), 'after-cancel.zip', () => undefined))).toMatchObject({ success: 1, failed: 0 })
})

test('写入已有条目但尚未close时取消：当前包的全部项仍未保存', async () => {
    const output = disk()
    native(output)
    let cancel!: () => void
    ;(fetch as jest.Mock).mockResolvedValueOnce(response()).mockImplementation((_url, options) => bodyResponse(options.signal))
    const callback = jest.fn()
    const operation = downloadVideoZip(items(), 'pending.zip', p => { cancel = p.cancel! }, callback)
    await until(() => (fetch as jest.Mock).mock.calls.length === 2)
    expect(output.write).toHaveBeenCalled()
    cancel()
    const result = await bounded(operation)
    expect(result).toMatchObject({ success: 0, cancelled: true, unprocessedItems: items() })
    expect(fetch).toHaveBeenCalledTimes(2)
    expect(callback).not.toHaveBeenCalled()
    expect(output.abort).toHaveBeenCalledTimes(1)
    expect(output.stream.locked).toBe(false)
})

test('永久网络故障最多3次尝试；重试后仍继续下一条', async () => {
    const attempts: number[] = []
    ;(fetch as jest.Mock).mockImplementation(async (url: string) => {
        if (url.endsWith('/0.mp4')) throw new TypeError('offline fixture')
        return response('ok')
    })
    const result = await bounded(downloadVideoZip(items(2), 'retry.zip', p => { if (p.currentIndex === 1 && p.attempt) attempts.push(p.attempt) }))
    expect((fetch as jest.Mock).mock.calls.filter(([url]) => url.endsWith('/0.mp4'))).toHaveLength(3)
    expect(fetch).toHaveBeenCalledTimes(4)
    expect(new Set(attempts)).toEqual(new Set([1, 2, 3]))
    expect(result).toMatchObject({ success: 1, failed: 1 })
    expect(Object.keys((await unzip(saved[0].blob)).files)).toEqual(['1.mp4'])
})

test('瞬时网络异常第3次成功，不重复条目、不误记失败', async () => {
    ;(fetch as jest.Mock).mockRejectedValueOnce(new TypeError('network')).mockRejectedValueOnce(new TypeError('network')).mockResolvedValue(response('recovered'))
    const result = await bounded(downloadVideoZip(items(1), 'recovered.zip', () => undefined))
    expect(result).toMatchObject({ success: 1, failed: 0, archives: 1 })
    expect(fetch).toHaveBeenCalledTimes(3)
    expect(await bounded((await unzip(saved[0].blob)).file('0.mp4')!.async('string'))).toBe('recovered')
})

test('部分404不重试：最终ZIP仅含成功项，内容和CRC正确', async () => {
    ;(fetch as jest.Mock).mockImplementation(async (url: string) => url.endsWith('/1.mp4')
        ? { ok: false, status: 404 } : response(url.endsWith('/0.mp4') ? 'a' : 'b'))
    const callback = jest.fn()
    const result = await bounded(downloadVideoZip(items(), 'mixed.zip', () => undefined, callback))
    expect(result).toMatchObject({ success: 2, failed: 1, archives: 1, streaming: false })
    expect(result.failedItems.map(f => f.item.taskId)).toEqual([1])
    expect(fetch).toHaveBeenCalledTimes(3)
    const zip = await unzip(saved[0].blob)
    expect(Object.keys(zip.files)).toEqual(['0.mp4', '2.mp4'])
    expect(await bounded(zip.file('0.mp4')!.async('string'))).toBe('a')
    expect(await bounded(zip.file('2.mp4')!.async('string'))).toBe('b')
    expect(callback.mock.calls.map(([item]) => item.taskId)).toEqual([0, 2])
})

test.each(['file', 'directory'] as const)('%s选择器取消仍抛DOWNLOAD_CANCELLED，零fetch并清理锁', async mode => {
    const picker = jest.fn(async () => { throw Object.assign(new Error('user cancelled'), { name: 'AbortError' }) })
    ;(window as any)[mode === 'file' ? 'showSaveFilePicker' : 'showDirectoryPicker'] = picker
    await expect(bounded(downloadVideoZip(items(mode === 'file' ? 2 : 11), 'picker.zip', () => undefined))).rejects.toMatchObject({ code: 'DOWNLOAD_CANCELLED' })
    expect(fetch).not.toHaveBeenCalled()
    expect(saved).toHaveLength(0)
})

test('11条原生目录按10条checkpoint；每包独立解压且只选一次目录', async () => {
    const target = directory()
    const callback = jest.fn()
    const result = await bounded(downloadVideoZip(items(11), 'folder.zip', () => undefined, callback))
    expect(result).toMatchObject({ success: 11, failed: 0, archives: 2, streaming: true })
    expect((window as any).showDirectoryPicker).toHaveBeenCalledTimes(1)
    expect((window as any).showSaveFilePicker).not.toHaveBeenCalled()
    expect(target.names[0]).toMatch(/^folder-.*part-01\.zip$/)
    expect(target.names[1]).toBe(target.names[0].replace(/01\.zip$/, '02.zip'))
    expect(target.outputs.every(output => output.committed)).toBe(true)
    const first = await unzip(new Blob(target.outputs[0].chunks))
    const second = await unzip(new Blob(target.outputs[1].chunks))
    expect(Object.keys(first.files)).toEqual(items(10).map(item => item.fileName))
    expect(Object.keys(second.files)).toEqual(['10.mp4'])
    expect(callback).toHaveBeenCalledTimes(11)
    expect(saved).toHaveLength(0)
})

test.each(['write', 'close'] as const)('第二checkpoint的%s失败保留已close的前10条，其余全失败', async stage => {
    const target = directory(index => index === 0 ? disk() : disk({ [stage]: () => { throw new Error('disk full') } }))
    const callback = jest.fn()
    const result = await bounded(downloadVideoZip(items(13), 'checkpoint.zip', () => undefined, callback))
    expect(result).toMatchObject({ success: 10, failed: 3, archives: 1, cancelled: false })
    expect(result.failedItems.map(f => f.item.taskId)).toEqual([10, 11, 12])
    expect(callback.mock.calls.map(([item]) => item.taskId)).toEqual(Array.from({ length: 10 }, (_, i) => i))
    expect(target.outputs[0].committed).toBe(true)
    expect(target.outputs[0].abort).not.toHaveBeenCalled()
    expect(target.outputs[1].committed).toBe(false)
    expect(Object.keys((await unzip(new Blob(target.outputs[0].chunks))).files)).toEqual(items(10).map(item => item.fileName))
    expect(fetch).toHaveBeenCalledTimes(stage === 'write' ? 11 : 13)
})

test('checkpoint后取消仅回报剩余项，已保存前10条保持成功', async () => {
    const target = directory()
    let cancel!: () => void
    ;(fetch as jest.Mock).mockImplementation(async (url: string, options) => url.endsWith('/10.mp4') ? bodyResponse(options.signal) : response())
    const callback = jest.fn()
    const operation = downloadVideoZip(items(13), 'checkpoint-cancel.zip', p => { cancel = p.cancel! }, callback)
    await until(() => (fetch as jest.Mock).mock.calls.length === 11)
    cancel()
    const result = await bounded(operation)
    expect(result).toMatchObject({ success: 10, failed: 0, archives: 1, cancelled: true })
    expect(result.unprocessedItems!.map(item => item.taskId)).toEqual([10, 11, 12])
    expect(callback).toHaveBeenCalledTimes(10)
    expect(target.outputs[0].committed).toBe(true)
    expect(fetch).toHaveBeenCalledTimes(11)
})

test('目录模式也按字节checkpoint，tiny阈值32字节模拟256MiB', async () => {
    const target = directory()
    ;(fetch as jest.Mock).mockResolvedValue(response('1234567890123456'))
    const result = await bounded(downloadVideoZip(items(11), 'bytes.zip', () => undefined))
    expect(result).toMatchObject({ success: 11, failed: 0, archives: 6, streaming: true })
    const counts: number[] = []
    for (const output of target.outputs) counts.push(Object.keys((await unzip(new Blob(output.chunks))).files).length)
    expect(counts).toEqual([2, 2, 2, 2, 2, 1])
})

test('无目录API但有保存API：11条保持单个流式ZIP，不重复弹选择器', async () => {
    const output = disk()
    native(output)
    ;(fetch as jest.Mock).mockResolvedValue(response('1234567890123456'))
    expect(await bounded(downloadVideoZip(items(11), 'one.zip', () => undefined))).toMatchObject({ success: 11, failed: 0, archives: 1, streaming: true })
    expect((window as any).showSaveFilePicker).toHaveBeenCalledTimes(1)
    expect(Object.keys((await unzip(new Blob(output.chunks))).files)).toHaveLength(11)
    expect(saved).toHaveLength(0)
})

test('无原生API：按有界字节分包，所有小包ZIP完整且无遗漏', async () => {
    ;(fetch as jest.Mock).mockResolvedValue(response('1234567890123456'))
    expect(await bounded(downloadVideoZip(items(5), 'fallback.zip', () => undefined))).toMatchObject({ success: 5, failed: 0, archives: 3, streaming: false })
    const names: string[] = []
    for (const part of saved) names.push(...Object.keys((await unzip(part.blob)).files))
    expect(names).toEqual(items(5).map(item => item.fileName))
})

test('批次总预算可中断重试等待，无后续fetch且没有假成功', async () => {
    ZIP_DOWNLOAD_LIMITS.batchMs = 200
    ;(fetch as jest.Mock).mockRejectedValue(new TypeError('temporary network failure'))
    const callback = jest.fn()
    const result = await bounded(downloadVideoZip(items(), 'batch.zip', () => undefined, callback), 400)
    expect(result).toMatchObject({ success: 0, failed: 3, archives: 0, cancelled: false })
    expect(result.errorMessage).toMatch(/本批|30 分钟/)
    expect(fetch).toHaveBeenCalledTimes(1)
    expect(callback).not.toHaveBeenCalled()
})

/** @jest-environment node */
import { downloadVideoZip } from '../src/utils/download'
import { createVideoZipSink, chooseVideoZipFile } from '../src/utils/videoZipWriter'
import { hasCriticalOperation } from '../src/utils/criticalOperation'
import JSZip from 'jszip'
import { ZIP_DOWNLOAD_LIMITS } from '../src/utils/downloadSafety'

jest.mock('/@/api/material', () => ({ downloadFileByProxy: jest.fn() }))
jest.mock('../src/utils/videoZipWriter', () => ({
    ...jest.requireActual<any>('../src/utils/videoZipWriter'), VIDEO_ZIP_FALLBACK_BYTES: 32
}))

const saved: Array<{ name: string; blob: Blob }> = []
let currentBlob: Blob
beforeEach(() => {
    saved.length = 0
    ;(global as any).window = {
        setTimeout: (fn: () => void, ms: number) => { const timer = setTimeout(fn, ms); (timer as any).unref?.(); return timer },
        clearTimeout,
        URL: { createObjectURL: (blob: Blob) => { currentBlob = blob; return 'blob:test' }, revokeObjectURL: () => undefined }
    }
    ;(global as any).document = {
        createElement: () => ({ style: {}, href: '', download: '', click() { saved.push({ name: this.download, blob: currentBlob }) } }),
        body: { appendChild: () => undefined, removeChild: () => undefined }
    }
    ;(global as any).fetch = jest.fn(async () => ({ ok: true, headers: { get: () => 'video/mp4' }, blob: async () => new Blob(['test-video']) }))
})
const items = (n = 2) => Array.from({ length: n }, (_, i) => ({ url: `https://example.com/${i}.mp4`, fileName: `${i}.mp4`, taskName: `video-${i}` }))
const inspect = async (blob: Blob) => JSZip.loadAsync(await blob.arrayBuffer(), { checkCRC32: true })
afterEach(() => jest.restoreAllMocks())

test('浏览器内存分配失败立即提示，不反复申请同一大文件', async () => {
    ;(fetch as jest.Mock).mockRejectedValue(new RangeError('Array buffer allocation failed'))
    const result = await downloadVideoZip(items(1), 'memory.zip', () => undefined)
    expect(result).toMatchObject({ success: 0, failed: 1 })
    expect(result.failedItems[0].reason).toContain('浏览器可用内存不足')
    expect(fetch).toHaveBeenCalledTimes(1)
})

test('小包可被独立ZIP库解压，且逐条读取、不再并发累积整批', async () => {
    const result = await downloadVideoZip(items(), 'test.zip', () => undefined)
    expect(result).toMatchObject({ success: 2, failed: 0, archives: 1, streaming: false })
    const zip = await inspect(saved[0].blob)
    expect(Object.keys(zip.files)).toEqual(['0.mp4', '1.mp4'])
    expect(await zip.file('0.mp4')!.async('string')).toBe('test-video')
    expect(hasCriticalOperation()).toBe(false)
})

test('部分404失败仍将成功项写入完整可解压ZIP，永久失败不重试', async () => {
    ;(fetch as jest.Mock).mockImplementation(async (url: string) => url.endsWith('0.mp4')
        ? { ok: false, status: 404 }
        : { ok: true, headers: { get: () => '' }, blob: async () => new Blob(['ok']) })
    const result = await downloadVideoZip(items(), 'mixed.zip', () => undefined)
    expect(result).toMatchObject({ success: 1, failed: 1 })
    expect(fetch).toHaveBeenCalledTimes(2)
    expect(Object.keys((await inspect(saved[0].blob)).files)).toEqual(['1.mp4'])
})

test('原生磁盘流写入单ZIP，不生成整包Blob并在close后标记成功', async () => {
    const chunks: Uint8Array[] = []
    let closed = false
    const output = new WritableStream<Uint8Array>({ write: data => { chunks.push(data.slice()) }, close: () => { closed = true } })
    ;(window as any).showSaveFilePicker = jest.fn(async () => ({ createWritable: async () => output }))
    const callback = jest.fn(() => expect(closed).toBe(true))
    const result = await downloadVideoZip(items(), 'stream.zip', () => undefined, callback)
    expect(result).toMatchObject({ success: 2, failed: 0, streaming: true, archives: 1 })
    expect(saved).toHaveLength(0)
    expect(callback).toHaveBeenCalledTimes(2)
    expect(Object.keys((await inspect(new Blob(chunks))).files)).toEqual(['0.mp4', '1.mp4'])
})

test('磁盘写失败不报成功、不调用成功回调，释放关键操作锁', async () => {
    const output = new WritableStream<Uint8Array>({ write: () => { throw new Error('disk full') } })
    ;(window as any).showSaveFilePicker = jest.fn(async () => ({ createWritable: async () => output }))
    const callback = jest.fn()
    const result = await downloadVideoZip(items(), 'failed.zip', () => undefined, callback)
    expect(result).toMatchObject({ success: 0, failed: 2 })
    expect(result.errorMessage).toContain('空间不足')
    expect(callback).not.toHaveBeenCalled()
    expect(saved).toHaveLength(0)
    expect(fetch).toHaveBeenCalledTimes(1)
    expect(hasCriticalOperation()).toBe(false)
})

test('取消文件选择不发出视频请求', async () => {
    ;(window as any).showSaveFilePicker = jest.fn(async () => { throw Object.assign(new Error('cancelled'), { name: 'AbortError' }) })
    await expect(downloadVideoZip(items(), 'cancel.zip', () => undefined)).rejects.toThrow('已取消下载')
    expect(fetch).not.toHaveBeenCalled()
    expect(hasCriticalOperation()).toBe(false)
})

test('全部失败没有ZIP，完成状态明确为success=0', async () => {
    ;(fetch as jest.Mock).mockResolvedValue({ ok: false, status: 404 })
    const progress = jest.fn()
    await downloadVideoZip(items(), 'none.zip', progress)
    expect(saved).toHaveLength(0)
    expect(progress.mock.calls[progress.mock.calls.length - 1][0]).toMatchObject({ phase: 'done', success: 0, failed: 2 })
})

test('重名文件保留全部内容而非覆盖', async () => {
    const sink = createVideoZipSink()
    await sink.add('same.mp4', new Blob(['a']))
    await sink.add('same.mp4', new Blob(['b']))
    const zip = await inspect((await sink.close())!)
    expect(Object.keys(zip.files)).toEqual(['same.mp4', 'same-2.mp4'])
})

test('无文件选择器返回分包模式，而不是静默走下载代理', async () => {
    expect(await chooseVideoZipFile('a.zip')).toBeUndefined()
})

test('不支持磁盘流时按字节拆包，所有分包独立可解压且无文件遗漏', async () => {
    ;(fetch as jest.Mock).mockResolvedValue({ ok: true, headers: { get: () => '' }, blob: async () => new Blob(['1234567890123456']) })
    const result = await downloadVideoZip(items(5), 'parts.zip', () => undefined)
    expect(result).toMatchObject({ success: 5, failed: 0, archives: 3 })
    expect(saved.map(s => s.name)).toEqual(['parts-part-01.zip', 'parts-part-02.zip', 'parts-part-03.zip'])
    const names: string[] = []
    for (const part of saved) names.push(...Object.keys((await inspect(part.blob)).files))
    expect(names.sort()).toEqual(['0.mp4', '1.mp4', '2.mp4', '3.mp4', '4.mp4'])
})

test('无Content-Length的超大文件读取期间停止，不把整个文件攒入内存', async () => {
    let cancelled = false
    let reads = 0
    const body = {
        getReader: () => ({
            read: async () => { reads++; return { done: false, value: new Uint8Array(20) } },
            cancel: async () => { cancelled = true }, releaseLock: () => undefined
        })
    }
    ;(fetch as jest.Mock).mockResolvedValue({ ok: true, headers: { get: () => null }, body })
    const result = await downloadVideoZip(items(1), 'oversize.zip', () => undefined)
    expect(result).toMatchObject({ success: 0, failed: 1 })
    expect(reads).toBe(2)
    expect(cancelled).toBe(true)
    expect(fetch).toHaveBeenCalledTimes(1)
    expect(saved).toHaveLength(0)
})

test('持续收到字节重置停滞计时器，但单条累计预算始终独立保留', async () => {
    const timers: Array<{ fn: () => void; ms: number; cancelled: boolean }> = []
    jest.spyOn(globalThis, 'setTimeout').mockImplementation(((fn: () => void, ms: number) => { timers.push({ fn, ms, cancelled: false }); return timers.length }) as any)
    jest.spyOn(globalThis, 'clearTimeout').mockImplementation(((id: number) => { if (timers[id - 1]) timers[id - 1].cancelled = true }) as any)
    let reads = 0
    ;(fetch as jest.Mock).mockResolvedValue({ ok: true, headers: { get: () => null }, body: {
        getReader: () => ({ read: async () => ++reads <= 3 ? { value: new Uint8Array([1]), done: false } : { done: true }, cancel: async () => undefined, releaseLock: () => undefined })
    } })
    await downloadVideoZip(items(1), 'progress.zip', () => undefined)
    const idle = timers.filter(t => t.ms === ZIP_DOWNLOAD_LIMITS.idleMs)
    expect(idle.length).toBeGreaterThanOrEqual(4)
    expect(idle.every(t => t.cancelled)).toBe(true)
    expect(timers.some(t => t.ms === ZIP_DOWNLOAD_LIMITS.itemMs)).toBe(true)
})

test('50条共2.18GB输出保持小块写入，不申请整包ArrayBuffer', async () => {
    const payload = new Blob([new Uint8Array(43_647_313)])
    let bytes = 0
    let largestWrite = 0
    const output = new WritableStream<Uint8Array>({ write: chunk => { bytes += chunk.byteLength; largestWrite = Math.max(largestWrite, chunk.byteLength) } })
    ;(window as any).showSaveFilePicker = jest.fn(async () => ({ createWritable: async () => output }))
    ;(fetch as jest.Mock).mockResolvedValue({ ok: true, headers: { get: () => '' }, blob: async () => payload })
    const result = await downloadVideoZip(items(50), 'large.zip', () => undefined)
    expect(result).toMatchObject({ success: 50, failed: 0, archives: 1, streaming: true })
    expect(bytes).toBeGreaterThan(2_182_365_650)
    expect(largestWrite).toBeLessThanOrEqual(1024 * 1024)
    expect(saved).toHaveLength(0)
}, 180_000)

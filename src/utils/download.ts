import { downloadFileByProxy } from '/@/api/material'
import { chooseVideoZipDirectory, chooseVideoZipFile, createVideoZipSink, VIDEO_ZIP_FALLBACK_BYTES, type VideoZipSink } from './videoZipWriter'
import { beginCriticalOperation } from './criticalOperation'
import { abortable, abortDownload, abortReason, boundedCleanup, downloadError, explainDownloadError, ZIP_DOWNLOAD_LIMITS } from './downloadSafety'

const CONTENT_TYPE_EXTENSION_MAP: Array<[string, string]> = [
    ['video/mp4', '.mp4'],
    ['audio/mpeg', '.mp3'],
    ['audio/mp3', '.mp3'],
    ['audio/wav', '.wav'],
    ['audio/x-wav', '.wav'],
    ['audio/ogg', '.ogg'],
    ['application/zip', '.zip'],
    ['image/png', '.png'],
    ['image/jpeg', '.jpg']
]

export function normalizeAssetUrl(rawUrl: any): string {
    if (!rawUrl) {
        return ''
    }

    if (Array.isArray(rawUrl)) {
        return normalizeAssetUrl(rawUrl[0])
    }

    const rawValue = String(rawUrl).trim()
    if (!rawValue) {
        return ''
    }

    if ((rawValue.startsWith("['") && rawValue.endsWith("']")) || (rawValue.startsWith('["') && rawValue.endsWith('"]'))) {
        try {
            const normalizedJson = rawValue.replace(/'/g, '"')
            const parsed = JSON.parse(normalizedJson)
            if (Array.isArray(parsed) && parsed.length > 0) {
                return normalizeAssetUrl(parsed[0])
            }
        } catch {
            // 继续走下面的正则兜底解析
        }
    }

    if (rawValue.startsWith('[') && rawValue.endsWith(']')) {
        try {
            const normalizedJson = rawValue.replace(/'/g, '"')
            const parsed = JSON.parse(normalizedJson)
            if (Array.isArray(parsed) && parsed.length > 0) {
                return normalizeAssetUrl(parsed[0])
            }
        } catch {
            // 继续走下面的正则兜底解析
        }
    }

    const matchedUrl = rawValue.match(/https?:\/\/[^\s'",\]]+/)
    if (matchedUrl && matchedUrl[0]) {
        return matchedUrl[0]
    }

    return rawValue.replace(/^['"]|['"]$/g, '')
}

export function sanitizeFileName(fileName: string, fallback = 'file'): string {
    const sanitized = fileName.replace(/[\\/:*?"<>|]+/g, '-').replace(/\s+/g, ' ').trim()
    return sanitized || fallback
}

function resolveExtensionByContentType(contentType?: string): string {
    const normalized = String(contentType || '').toLowerCase()
    const matched = CONTENT_TYPE_EXTENSION_MAP.find(([prefix]) => normalized.includes(prefix))
    return matched ? matched[1] : ''
}

function resolveUrlFileName(url: string): string {
    try {
        const pathname = decodeURIComponent(new URL(url).pathname)
        const segments = pathname.split('/').filter(Boolean)
        return segments.length > 0 ? segments[segments.length - 1] : ''
    } catch {
        const pathname = decodeURIComponent(url.split('?')[0])
        const segments = pathname.split('/').filter(Boolean)
        return segments.length > 0 ? segments[segments.length - 1] : ''
    }
}

function resolveUrlExtension(url: string): string {
    const fileName = resolveUrlFileName(url)
    const matched = fileName.match(/\.[a-zA-Z0-9]{1,8}$/)
    return matched ? matched[0] : ''
}

export function buildDownloadFileName(rawUrl: any, fallbackBaseName: string, defaultExtension: string, contentType?: string): string {
    const normalizedUrl = normalizeAssetUrl(rawUrl)
    const urlFileName = resolveUrlFileName(normalizedUrl)
    if (urlFileName && urlFileName.includes('.')) {
        return sanitizeFileName(urlFileName, `${sanitizeFileName(fallbackBaseName)}${defaultExtension}`)
    }

    const extension = resolveUrlExtension(normalizedUrl) || resolveExtensionByContentType(contentType) || defaultExtension
    return `${sanitizeFileName(fallbackBaseName)}${extension}`
}

export function triggerBlobDownload(blob: Blob, fileName: string): void {
    const blobUrl = window.URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = blobUrl
    anchor.download = fileName
    anchor.style.display = 'none'
    document.body.appendChild(anchor)
    anchor.click()
    document.body.removeChild(anchor)
    window.setTimeout(() => window.URL.revokeObjectURL(blobUrl), 30_000)
}

// 公网视频交给浏览器请求，避免先把整段 MP4 经过应用服务和网关。
export function directVideoUrl(rawUrl: any): string {
    const url = normalizeAssetUrl(rawUrl)
    if (!url || !/^https?:\/\//i.test(url)) throw new Error('视频地址不可用')
    return url
}

export function downloadVideoDirect(rawUrl: any): void {
    const anchor = document.createElement('a')
    anchor.href = directVideoUrl(rawUrl)
    anchor.target = '_blank'
    anchor.rel = 'noopener noreferrer'
    anchor.style.display = 'none'
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
}

export interface ZipVideoItem { url: string; taskId?: string | number | null; fileName: string; taskName?: string }
export interface ZipProgress { phase: 'fetching' | 'packing' | 'done'; completed: number; total: number; percent: number; success?: number; failed?: number; archives?: number; streaming?: boolean; currentName?: string; currentIndex?: number; loadedBytes?: number; totalBytes?: number; speedBytesPerSecond?: number; attempt?: number; notice?: string; cancel?: () => void }
export interface ZipVideoFailure { item: ZipVideoItem; reason: string }
export interface ZipVideoResult { success: number; failed: number; failedItems: ZipVideoFailure[]; archives?: number; streaming?: boolean; cancelled?: boolean; unprocessedItems?: ZipVideoItem[]; errorMessage?: string }

export function describeZipVideoFailures(result: ZipVideoResult, limit = Number.POSITIVE_INFINITY): string {
    const names = result.failedItems
        .slice(0, limit)
        .map(({ item }) => item.taskName || item.fileName || `任务 ${item.taskId || '-'}`)
    const remaining = Math.max(0, result.failedItems.length - names.length)
    return `成功 ${result.success} 个，失败 ${result.failed} 个。失败任务：${names.join('、')}${remaining ? `，另有 ${remaining} 个` : ''}`
}

const ZIP_VIDEO_MAX_ATTEMPTS = 3
async function fetchZipVideoWithRetry(item: ZipVideoItem, signal: AbortSignal, progress: (state: Partial<ZipProgress>) => void, maxBytes: number): Promise<Blob> {
    const budget = new AbortController()
    const cancel = () => abortDownload(budget, abortReason(signal))
    if (signal.aborted) cancel()
    else signal.addEventListener('abort', cancel, { once: true })
    const total = setTimeout(() => abortDownload(budget, downloadError('单条下载累计超过 5 分钟，请检查网络后重试', 'ZIP_ITEM_TIMEOUT')), ZIP_DOWNLOAD_LIMITS.itemMs)
    let lastError: any = null
    try {
    for (let attempt = 1; attempt <= ZIP_VIDEO_MAX_ATTEMPTS; attempt++) {
        if (budget.signal.aborted) throw abortReason(budget.signal)
        const controller = new AbortController()
        const stop = () => abortDownload(controller, abortReason(budget.signal))
        budget.signal.addEventListener('abort', stop, { once: true })
        const offline = () => abortDownload(controller, downloadError('网络已断开，请恢复网络后重试', 'NETWORK_OFFLINE'))
        window.addEventListener?.('offline', offline)
        let timeoutId: ReturnType<typeof setTimeout>
        const touch = () => {
            clearTimeout(timeoutId)
            timeoutId = setTimeout(() => abortDownload(controller, downloadError('连续 60 秒未收到数据，正在重试或跳过', 'ZIP_NETWORK_IDLE')), ZIP_DOWNLOAD_LIMITS.idleMs)
        }
        touch()
        const start = Date.now()
        let lastUpdate = 0
        progress({ attempt, loadedBytes: 0, totalBytes: undefined, speedBytesPerSecond: 0, notice: attempt > 1 ? `正在进行第 ${attempt} 次尝试` : '' })
        try {
            const { blob } = await abortable(fetchDirectBlob(item.url, {
                fallbackBaseName: item.fileName,
                defaultExtension: '.mp4',
                signal: controller.signal,
                maxBytes,
                onChunk: (loadedBytes, totalBytes) => {
                    touch()
                    const elapsed = Math.max(1, Date.now() - start)
                    const speedBytesPerSecond = loadedBytes * 1000 / elapsed
                    if (Date.now() - lastUpdate >= 250 || loadedBytes === totalBytes) {
                        lastUpdate = Date.now()
                        progress({ loadedBytes, totalBytes, speedBytesPerSecond,
                            notice: elapsed >= ZIP_DOWNLOAD_LIMITS.slowAfterMs && speedBytesPerSecond < ZIP_DOWNLOAD_LIMITS.slowBps ? '当前下载速度较慢，可取消后检查网络；单条任务不会无限等待' : '' })
                    }
                }
            }), controller.signal)
            return blob
        } catch (error) {
            if (budget.signal.aborted) throw abortReason(budget.signal)
            lastError = controller.signal.aborted ? abortReason(controller.signal) : error
            const status = Number((error as any)?.status || 0)
            const memoryFailure = error instanceof RangeError || /array buffer allocation|out of memory/i.test((error as any)?.message || '')
            const retryable = !memoryFailure && (!status || status === 408 || status === 425 || status === 429 || status >= 500)
            if (!retryable) break
            if (attempt < ZIP_VIDEO_MAX_ATTEMPTS) {
                progress({ notice: `下载暂时失败，准备第 ${attempt + 1} 次尝试` })
                let retryTimer: ReturnType<typeof setTimeout> | undefined
                try { await abortable(new Promise<void>(resolve => { retryTimer = setTimeout(() => resolve(), attempt * 1000) }), budget.signal) }
                finally { if (retryTimer !== undefined) clearTimeout(retryTimer) }
            }
        } finally {
            clearTimeout(timeoutId!)
            budget.signal.removeEventListener('abort', stop)
            window.removeEventListener?.('offline', offline)
        }
    }
    throw lastError || new Error('视频下载失败')
    } finally { clearTimeout(total); signal.removeEventListener('abort', cancel) }
}

// Native: one disk-streamed ZIP. Unsupported browsers: bounded independent ZIPs.
// Sequential entries avoid retaining every video's ArrayBuffer at once.
export async function downloadVideoZip(items: ZipVideoItem[], zipName: string, onProgress: (progress: ZipProgress) => void, onItemSuccess?: (item: ZipVideoItem) => void): Promise<ZipVideoResult> {
    if (!items.length) throw new Error('没有可下载的视频')
    const endCriticalOperation = beginCriticalOperation()
    const controller = new AbortController()
    const cancel = () => abortDownload(controller, downloadError('已取消下载，当前未保存分包已停止', 'DOWNLOAD_CANCELLED'))
    const beforeUnload = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = '' }
    window.addEventListener?.('beforeunload', beforeUnload)
    window.addEventListener?.('pagehide', cancel)
    let batchTimer: ReturnType<typeof setTimeout> | undefined
    let sink: VideoZipSink | undefined
    let pendingFile: WritableStream<Uint8Array> | undefined
    let completed = 0, success = 0, archives = 0, packBytes = 0
    let streaming = false
    let packItems: ZipVideoItem[] = []
    const saved = new Set<ZipVideoItem>()
    const failedItems: ZipVideoFailure[] = []
    let state: Partial<ZipProgress> = {}
    const emit = (patch: Partial<ZipProgress>) => {
        state = { ...state, ...patch }
        if (patch.percent === undefined) delete state.percent
        onProgress({ phase: 'fetching', completed, total: items.length, percent: Math.round(completed / items.length * 80), success, failed: failedItems.length, archives, streaming, ...state, cancel })
    }
    const remaining = () => items.filter(item => !saved.has(item) && !failedItems.some(failure => failure.item === item))
    const result = (extra: Partial<ZipVideoResult> = {}): ZipVideoResult => ({ success, failed: failedItems.length, failedItems, archives, streaming, ...extra })
    try {
    const safeZipName = sanitizeFileName(zipName, 'videos.zip')
    emit({ notice: items.length > 10 && (window as any).showDirectoryPicker ? '请选择保存文件夹，大批量将分包保存' : '请选择保存位置' })
    // Call the picker before yielding user activation. Never send customer data to the application server.
    const directory = items.length > 10 ? await abortable(chooseVideoZipDirectory(), controller.signal) : undefined
    const filePromise = directory ? Promise.resolve(undefined) : chooseVideoZipFile(safeZipName, controller.signal)
    filePromise.then(file => { if (file && controller.signal.aborted) void boundedCleanup(file.abort()) }, () => undefined)
    const file = await abortable(filePromise, controller.signal)
    pendingFile = file
    streaming = !!directory || !!file
    const checkpoint = !!directory || !streaming
    // Directory handles have no overwrite confirmation. Each run gets distinct output names.
    const runSuffix = directory ? `-${Date.now()}-${Math.random().toString(36).slice(2, 10)}` : ''
    const partName = () => `${safeZipName.replace(/\.zip$/i, '')}${runSuffix}-part-${String(archives + 1).padStart(2, '0')}.zip`
    const openSink = async () => {
        if (controller.signal.aborted) throw abortReason(controller.signal)
        let stream = archives === 0 ? file : undefined
        if (directory) {
            const opening = directory.getFileHandle(partName(), { create: true }).then((handle: any) => handle.createWritable()) as Promise<WritableStream<Uint8Array>>
            opening.then(value => { if (controller.signal.aborted) void boundedCleanup(value.abort()) }, () => undefined)
            const timer = setTimeout(() => abortDownload(controller, downloadError('创建 ZIP 文件超时，请检查保存盘和权限', 'ZIP_WRITE_TIMEOUT')), ZIP_DOWNLOAD_LIMITS.writeIdleMs)
            try { stream = await abortable(opening, controller.signal) } finally { clearTimeout(timer) }
        }
        sink = createVideoZipSink(stream, controller.signal)
        pendingFile = undefined
    }
    batchTimer = setTimeout(() => abortDownload(controller, downloadError('本批下载超过 30 分钟，已停止；已保存分包保留，请仅重试未成功项', 'ZIP_BATCH_TIMEOUT')), ZIP_DOWNLOAD_LIMITS.batchMs)
    const flush = async (final = false) => {
        if (!packItems.length || !sink) return
        emit({ phase: 'packing', notice: '正在完成 ZIP 保存，保存完成后才计入成功', percent: final ? 99 : Math.round(completed / items.length * 80) })
        const output = await sink.close()
        if (output) {
            const name = archives === 0 && final ? safeZipName : safeZipName.replace(/\.zip$/i, '') + `-part-${String(archives + 1).padStart(2, '0')}.zip`
            triggerBlobDownload(output, name)
        }
        archives++
        for (const item of packItems) {
            saved.add(item); success++
            try { onItemSuccess?.(item) } catch { /* UI bookkeeping cannot invalidate a saved archive. */ }
        }
        packItems = []
        packBytes = 0
        sink = undefined
    }
    emit({ phase: 'fetching', notice: directory ? '每包最多 10 条或约 256 MB，已保存分包不会因后续失败丢失' : '' })
        for (const [index, item] of items.entries()) {
            if (controller.signal.aborted) throw abortReason(controller.signal)
            emit({ phase: 'fetching', currentName: item.taskName || item.fileName, currentIndex: index + 1, loadedBytes: 0, totalBytes: undefined, speedBytesPerSecond: 0, attempt: 1, notice: '' })
            let blob: Blob
            try {
                blob = await fetchZipVideoWithRetry(item, controller.signal, patch => emit(patch), streaming ? 512 * 1024 * 1024 : VIDEO_ZIP_FALLBACK_BYTES)
            } catch (error) {
                if (controller.signal.aborted) throw abortReason(controller.signal)
                failedItems.push({ item, reason: explainDownloadError(error) })
                completed++
                emit({ notice: '本条未成功，将继续处理其余文件' })
                continue
            }
            if (checkpoint && packItems.length && packBytes + blob.size > VIDEO_ZIP_FALLBACK_BYTES) await flush()
            // Writing failures abort the operation, not the next video: a corrupt
            // output must never be counted as a normal per-video network failure.
            if (!sink) await openSink()
            emit({ phase: 'packing', notice: '正在将当前文件写入 ZIP' })
            await sink!.add(sanitizeFileName(item.fileName, 'video.mp4'), blob)
            packItems.push(item)
            packBytes += blob.size
            completed++
            if (checkpoint && (packBytes >= VIDEO_ZIP_FALLBACK_BYTES || packItems.length >= 10)) await flush()
            emit({ phase: 'fetching', notice: '' })
        }
        if (packItems.length) await flush(true)
        // A selected but unused native file must not leave an open writer when all requests failed.
        else if (file && !success) await boundedCleanup(file.abort())
        emit({ phase: 'done', percent: 100, notice: '' })
        return result()
    } catch (error) {
        const cancelled = (error as any)?.code === 'DOWNLOAD_CANCELLED'
        if (cancelled && !controller.signal.aborted) throw error // Native picker cancellation: no work was started.
        if (sink) await boundedCleanup(sink.abort())
        if (pendingFile) await boundedCleanup(pendingFile.abort())
        const message = explainDownloadError(error)
        const unprocessedItems = remaining()
        if (!cancelled) for (const item of unprocessedItems) failedItems.push({ item, reason: message })
        emit({ phase: 'done', notice: message, percent: Math.round(saved.size / items.length * 100) })
        return result({ cancelled, unprocessedItems: cancelled ? unprocessedItems : [], errorMessage: message })
    } finally {
        if (batchTimer !== undefined) clearTimeout(batchTimer)
        window.removeEventListener?.('beforeunload', beforeUnload)
        window.removeEventListener?.('pagehide', cancel)
        endCriticalOperation()
    }
}

export async function fetchProxyBlob(rawUrl: any, options: {
    taskId?: string | number | null
    assetType?: string
    fallbackBaseName: string
    defaultExtension: string
}): Promise<{ blob: Blob; fileName: string; sourceUrl: string }> {
    const normalizedUrl = normalizeAssetUrl(rawUrl)
    if (!normalizedUrl) {
        throw new Error('文件地址不可用')
    }

    const response = await downloadFileByProxy(normalizedUrl, options.taskId ?? undefined, options.assetType)
    const contentType = String(response.headers?.['content-type'] || '')
    return {
        blob: response.data as Blob,
        fileName: buildDownloadFileName(normalizedUrl, options.fallbackBaseName, options.defaultExtension, contentType),
        sourceUrl: normalizedUrl
    }
}

// 只用于允许浏览器跨域读取的公网资源（例如 TOS 视频）。不带登录态，也不经过后端代理。
export async function fetchDirectBlob(rawUrl: any, options: {
    fallbackBaseName: string
    defaultExtension: string
    signal?: AbortSignal
    onChunk?: (loadedBytes: number, totalBytes?: number) => void
    maxBytes?: number
}): Promise<{ blob: Blob; fileName: string; sourceUrl: string }> {
    const normalizedUrl = directVideoUrl(rawUrl)
    const request = fetch(normalizedUrl, { mode: 'cors', credentials: 'omit', signal: options.signal })
    const response = await (options.signal ? abortable(request, options.signal) : request)
    if (!response.ok) {
        throw Object.assign(new Error(`视频下载失败（HTTP ${response.status}）`), { status: response.status })
    }
    const tooLarge = () => Object.assign(new Error('此视频超过浏览器分包上限，请使用支持直接保存 ZIP 的 Chrome/Edge，或单独直连下载'), { status: 413 })
    if (options.maxBytes && Number(response.headers.get('content-length')) > options.maxBytes) {
        try { await response.body?.cancel() } catch { /* original limit error wins */ }
        throw tooLarge()
    }
    let blob: Blob
    if (options.onChunk && response.body) {
        const reader = response.body.getReader()
        const stopReader = () => { void boundedCleanup(reader.cancel(options.signal ? abortReason(options.signal) : undefined)) }
        if (options.signal?.aborted) stopReader()
        else options.signal?.addEventListener('abort', stopReader, { once: true })
        const chunks: Uint8Array[] = []
        let received = 0
        try {
            while (true) {
                const reading = reader.read()
                const { done, value } = await (options.signal ? abortable(reading, options.signal) : reading)
                if (done) break
                if (value?.byteLength) {
                    received += value.byteLength
                    if (options.maxBytes && received > options.maxBytes) throw tooLarge()
                    options.onChunk(received, Number(response.headers.get('content-length')) || undefined); chunks.push(value)
                }
            }
            blob = new Blob(chunks, { type: response.headers.get('content-type') || 'video/mp4' })
        } catch (error) {
            await boundedCleanup(reader.cancel(error))
            throw error
        } finally {
            options.signal?.removeEventListener('abort', stopReader)
            try { reader.releaseLock() } catch { /* native cancellation may still be settling */ }
        }
    } else blob = await response.blob()
    return {
        blob,
        fileName: buildDownloadFileName(normalizedUrl, options.fallbackBaseName, options.defaultExtension, response.headers.get('content-type') || ''),
        sourceUrl: normalizedUrl
    }
}

export async function downloadProxyFile(rawUrl: any, options: {
    taskId?: string | number | null
    assetType?: string
    fallbackBaseName: string
    defaultExtension: string
}): Promise<string> {
    const { blob, fileName } = await fetchProxyBlob(rawUrl, options)
    triggerBlobDownload(blob, fileName)
    return fileName
}

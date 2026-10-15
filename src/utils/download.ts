import { downloadFileByProxy } from '/@/api/material'
import { chooseVideoZipFile, createVideoZipSink, VIDEO_ZIP_FALLBACK_BYTES } from './videoZipWriter'
import { beginCriticalOperation } from './criticalOperation'

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
export interface ZipProgress { phase: 'fetching' | 'packing' | 'done'; completed: number; total: number; percent: number; success?: number; failed?: number; archives?: number; streaming?: boolean }
export interface ZipVideoFailure { item: ZipVideoItem; reason: string }
export interface ZipVideoResult { success: number; failed: number; failedItems: ZipVideoFailure[]; archives?: number; streaming?: boolean }

export function describeZipVideoFailures(result: ZipVideoResult, limit = Number.POSITIVE_INFINITY): string {
    const names = result.failedItems
        .slice(0, limit)
        .map(({ item }) => item.taskName || item.fileName || `任务 ${item.taskId || '-'}`)
    const remaining = Math.max(0, result.failedItems.length - names.length)
    return `成功 ${result.success} 个，失败 ${result.failed} 个。失败任务：${names.join('、')}${remaining ? `，另有 ${remaining} 个` : ''}`
}

const ZIP_VIDEO_MAX_ATTEMPTS = 3
const ZIP_VIDEO_ATTEMPT_TIMEOUT_MS = 180_000

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => window.setTimeout(resolve, ms))
}

async function fetchZipVideoWithRetry(item: ZipVideoItem, maxBytes?: number): Promise<Blob> {
    let lastError: any = null
    for (let attempt = 1; attempt <= ZIP_VIDEO_MAX_ATTEMPTS; attempt++) {
        const controller = new AbortController()
        let timeoutId = window.setTimeout(() => controller.abort(), ZIP_VIDEO_ATTEMPT_TIMEOUT_MS)
        try {
            const { blob } = await fetchDirectBlob(item.url, {
                fallbackBaseName: item.fileName,
                defaultExtension: '.mp4',
                signal: controller.signal,
                maxBytes,
                onChunk: () => {
                    window.clearTimeout(timeoutId)
                    timeoutId = window.setTimeout(() => controller.abort(), ZIP_VIDEO_ATTEMPT_TIMEOUT_MS)
                }
            })
            return blob
        } catch (error) {
            lastError = error
            const status = Number((error as any)?.status || 0)
            const retryable = !status || status === 408 || status === 425 || status === 429 || status >= 500
            if (!retryable) break
            if (attempt < ZIP_VIDEO_MAX_ATTEMPTS) {
                await sleep(attempt * 1_000)
            }
        } finally {
            window.clearTimeout(timeoutId)
        }
    }
    throw lastError || new Error('视频下载失败')
}

// Native: one disk-streamed ZIP. Unsupported browsers: bounded independent ZIPs.
// Sequential entries avoid retaining every video's ArrayBuffer at once.
export async function downloadVideoZip(items: ZipVideoItem[], zipName: string, onProgress: (progress: ZipProgress) => void, onItemSuccess?: (item: ZipVideoItem) => void): Promise<ZipVideoResult> {
    if (!items.length) throw new Error('没有可下载的视频')
    const endCriticalOperation = beginCriticalOperation()
    try {
    const safeZipName = sanitizeFileName(zipName, 'videos.zip')
    const file = await chooseVideoZipFile(safeZipName)
    const streaming = !!file
    let sink = createVideoZipSink(file)
    let packBytes = 0
    let packItems: ZipVideoItem[] = []
    let archives = 0
    const flush = async (final = false) => {
        if (!packItems.length && !streaming) return
        onProgress({ phase: 'packing', completed, total: items.length, percent: final ? 99 : Math.round(completed / items.length * 80), success, failed, archives, streaming })
        const output = await sink.close()
        if (output) {
            const name = archives === 0 && final ? safeZipName : safeZipName.replace(/\.zip$/i, '') + `-part-${String(archives + 1).padStart(2, '0')}.zip`
            triggerBlobDownload(output, name)
        }
        if (packItems.length) archives++
        for (const item of packItems) {
            try { onItemSuccess?.(item) } catch (error) { console.warn('ZIP 视频成功回调失败，不影响下载结果', item.taskId, error) }
        }
        packItems = []
        packBytes = 0
        if (!final) sink = createVideoZipSink()
    }
    let completed = 0
    let success = 0
    let failed = 0
    const failedItems: ZipVideoFailure[] = []
    onProgress({ phase: 'fetching', completed: 0, total: items.length, percent: 0, success: 0, failed: 0, archives: 0, streaming })
    try {
        for (const item of items) {
            let blob: Blob
            try {
                blob = await fetchZipVideoWithRetry(item, streaming ? undefined : VIDEO_ZIP_FALLBACK_BYTES)
                if (!streaming && blob.size > VIDEO_ZIP_FALLBACK_BYTES) {
                    throw new Error('此视频超过浏览器分包上限，请使用支持直接保存 ZIP 的 Chrome/Edge，或单独直连下载')
                }
            } catch (error) {
                console.error('ZIP 视频获取失败', item.taskId, error)
                failed++
                failedItems.push({
                    item,
                    reason: error instanceof Error ? error.message : '视频下载失败'
                })
                completed++
                onProgress({ phase: 'fetching', completed, total: items.length, percent: Math.round(completed / items.length * 80), success, failed, archives, streaming })
                continue
            }
            if (!streaming && packBytes + blob.size > VIDEO_ZIP_FALLBACK_BYTES) await flush()
            // Writing failures abort the operation, not the next video: a corrupt
            // output must never be counted as a normal per-video network failure.
            await sink.add(sanitizeFileName(item.fileName, 'video.mp4'), blob)
            packItems.push(item)
            packBytes += blob.size
            success++
            completed++
            if (!streaming && packBytes >= VIDEO_ZIP_FALLBACK_BYTES) await flush()
            onProgress({ phase: 'fetching', completed, total: items.length, percent: Math.round(completed / items.length * 80), success, failed, archives, streaming })
        }
        if (success) await flush(true)
        else await sink.abort()
        onProgress({ phase: 'done', completed, total: items.length, percent: 100, success, failed, archives, streaming })
        return { success, failed, failedItems, archives, streaming }
    } catch (error) {
        await sink.abort()
        throw new Error(`ZIP 保存失败${archives ? `（此前已生成 ${archives} 个分包）` : ''}：${error instanceof Error ? error.message : '请检查磁盘空间'}`)
    }
    } finally {
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
    onChunk?: () => void
    maxBytes?: number
}): Promise<{ blob: Blob; fileName: string; sourceUrl: string }> {
    const normalizedUrl = directVideoUrl(rawUrl)
    const response = await fetch(normalizedUrl, { mode: 'cors', credentials: 'omit', signal: options.signal })
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
        const chunks: Uint8Array[] = []
        let received = 0
        try {
            while (true) {
                const { done, value } = await reader.read()
                if (done) break
                if (value?.byteLength) {
                    received += value.byteLength
                    if (options.maxBytes && received > options.maxBytes) throw tooLarge()
                    options.onChunk(); chunks.push(value)
                }
            }
            blob = new Blob(chunks, { type: response.headers.get('content-type') || 'video/mp4' })
        } catch (error) {
            try { await reader.cancel(error) } catch { /* retain original failure */ }
            throw error
        } finally { reader.releaseLock() }
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

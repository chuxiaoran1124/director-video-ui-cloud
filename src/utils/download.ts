import { downloadFileByProxy } from '/@/api/material'
import JSZip from 'jszip'

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

export interface ZipVideoItem { url: string; taskId?: string | number | null; fileName: string }
export interface ZipProgress { phase: 'fetching' | 'packing' | 'done'; completed: number; total: number; percent: number }

// ZIP 在浏览器侧读取公网视频字节；每次最多两个直连请求，不经过应用服务和网关。
export async function downloadVideoZip(items: ZipVideoItem[], zipName: string, onProgress: (progress: ZipProgress) => void, onItemSuccess?: (item: ZipVideoItem) => void): Promise<{ success: number; failed: number }> {
    if (!items.length) throw new Error('没有可下载的视频')
    const zip = new JSZip()
    let cursor = 0
    let completed = 0
    let success = 0
    let failed = 0
    onProgress({ phase: 'fetching', completed: 0, total: items.length, percent: 0 })
    const worker = async () => {
        while (cursor < items.length) {
            const item = items[cursor++]
            try {
                const { blob } = await fetchDirectBlob(item.url, { fallbackBaseName: item.fileName, defaultExtension: '.mp4' })
                zip.file(sanitizeFileName(item.fileName, 'video.mp4'), blob)
                success++
                onItemSuccess?.(item)
            } catch (error) {
                console.error('ZIP 视频获取失败', item.taskId, error)
                failed++
            } finally {
                completed++
                onProgress({ phase: 'fetching', completed, total: items.length, percent: Math.round(completed / items.length * 80) })
            }
        }
    }
    await Promise.all(Array.from({ length: Math.min(2, items.length) }, () => worker()))
    if (!success) throw new Error('所有视频获取失败，请稍后重试')
    onProgress({ phase: 'packing', completed, total: items.length, percent: 80 })
    const blob = await zip.generateAsync({ type: 'blob' }, metadata => {
        onProgress({ phase: 'packing', completed, total: items.length, percent: Math.min(99, 80 + Math.round(metadata.percent * 0.19)) })
    })
    triggerBlobDownload(blob, sanitizeFileName(zipName, 'videos.zip'))
    onProgress({ phase: 'done', completed, total: items.length, percent: 100 })
    return { success, failed }
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
}): Promise<{ blob: Blob; fileName: string; sourceUrl: string }> {
    const normalizedUrl = directVideoUrl(rawUrl)
    const response = await fetch(normalizedUrl, { mode: 'cors', credentials: 'omit' })
    if (!response.ok) {
        throw new Error(`视频下载失败（HTTP ${response.status}）`)
    }
    const blob = await response.blob()
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

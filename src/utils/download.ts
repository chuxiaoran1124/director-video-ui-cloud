import { downloadFileByProxy } from '/@/api/material'

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
    window.URL.revokeObjectURL(blobUrl)
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

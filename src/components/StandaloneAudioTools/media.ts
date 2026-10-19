export const statusLabels: Record<string, string> = {
    '0': '等待中', '1': '进行中', '2': '已完成', '-1': '失败', uncertain: '状态待确认'
}

export function readSampleDuration(file: File): { promise: Promise<number>; cancel: () => void } {
    const media = document.createElement(file.name.toLowerCase().endsWith('.mp4') ? 'video' : 'audio')
    const url = URL.createObjectURL(file)
    let cancel = () => {}
    let settled = false
    const promise = new Promise<number>((resolve, reject) => {
        const finish = (error?: string) => {
            if (settled) return
            settled = true
            const duration = media.duration
            clearTimeout(timer)
            media.onloadedmetadata = null
            media.onerror = null
            media.removeAttribute('src')
            media.load()
            URL.revokeObjectURL(url)
            if (error) reject(new Error(error))
            else resolve(duration)
        }
        const timer = setTimeout(() => finish('读取素材时长超时，请更换文件'), 15000)
        cancel = () => finish('素材校验已取消')
        media.preload = 'metadata'
        media.onerror = () => finish('无法读取素材，请使用有效的 MP3/WAV/M4A/MP4 文件')
        media.onloadedmetadata = () => finish(
            !Number.isFinite(media.duration) || media.duration < 10 || media.duration > 60
                ? '素材时长须为 10–60 秒' : undefined
        )
        media.src = url
    })
    return { promise, cancel: () => cancel() }
}

export function newIdempotencyKey(): string {
    const bytes = new Uint8Array(16)
    crypto.getRandomValues(bytes)
    return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('')
}

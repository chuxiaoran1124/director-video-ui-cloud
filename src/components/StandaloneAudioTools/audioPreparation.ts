/** Optional display-only addition shared by voice and fast digital-human training. */
export interface AudioPreparation {
    id: number | string
    status: string
    statusLabel?: string
    referenceText?: string
    targetText?: string
    originalUrl?: string
    referenceUrl?: string
    processedUrl?: string
    errorCode?: string
}

const processingStatuses = ['0', '1', 'pending', 'waiting', 'queued', 'processing', 'running', 'preparing', 'optimizing', 'uploaded', 'processed_submitting']
const completedStatuses = ['ready', 'accepted', 'success', 'succeeded', 'completed', 'done']
const failedStatuses = ['-1', 'failed', 'error']

export function isAudioOptimizing(preparation: AudioPreparation | null | undefined, parentStatus: string | number): boolean {
    // A substage must never turn a terminal/uncertain parent into a processing task.
    return ['0', '1', 'waiting', 'processing'].includes(String(parentStatus))
        && !!preparation && (processingStatuses.includes(preparation.status)
            || (preparation.statusLabel === '音频优化处理中'
                && !completedStatuses.includes(preparation.status) && !failedStatuses.includes(preparation.status)))
}

export function audioPreparationLabel(preparation: AudioPreparation): string {
    // Do not render arbitrary statusLabel/errorCode strings returned by a provider.
    if (completedStatuses.includes(preparation.status)) return '音频优化已完成'
    if (failedStatuses.includes(preparation.status)) return '音频优化未完成'
    if (preparation.status === 'unknown') return '训练提交结果待确认，请联系管理员'
    if (preparation.status === 'cancelled') return '音频优化已取消'
    if (isAudioOptimizing(preparation, 'processing')) return '等待中'
    return '音频优化状态待确认'
}

export function audioPreparationExplanation(preparation: AudioPreparation): string {
    const messages: Record<string, string> = {
        REFERENCE_AUDIO_NOT_FOUND: '暂未找到可用的参考音频，请联系管理员',
        AUDIO_TOO_SHORT: '声音样本过短，请更换清晰完整的录音后重试',
        AUDIO_PREPARATION_FAILED: '音频优化未完成，请稍后重试或联系管理员',
        AUDIO_OPTIMIZATION_FAILED: '音频优化未完成，请稍后重试或联系管理员'
    }
    if (preparation.errorCode || failedStatuses.includes(preparation.status)) {
        return Object.prototype.hasOwnProperty.call(messages, preparation.errorCode || '')
            ? messages[preparation.errorCode!] : '音频优化暂未完成，请稍后刷新或联系管理员'
    }
    return ''
}

export function preparationAudioUrl(value?: string): string {
    if (typeof value !== 'string') return ''
    const url = value.trim()
    if (/^\/(?!\/)/.test(url) && !url.includes('\\')) return url
    try {
        const parsed = new URL(url)
        return ['http:', 'https:'].includes(parsed.protocol) && !parsed.username && !parsed.password ? url : ''
    } catch { return '' }
}

export function stopPreparationAudio(root: ParentNode | null | undefined): void {
    root?.querySelectorAll<HTMLAudioElement>('audio').forEach(audio => {
        audio.pause()
        audio.removeAttribute('src')
        audio.load()
    })
}

/** Limits are shared by transport and ZIP output; byte progress cannot extend total budgets. */
export const ZIP_DOWNLOAD_LIMITS = {
    idleMs: 60_000, itemMs: 300_000, writeIdleMs: 60_000, writeTotalMs: 300_000,
    cleanupMs: 1_000, batchMs: 1_800_000, slowAfterMs: 30_000, slowBps: 32_768
}

export function downloadError(message: string, code: string): Error & { code: string } {
    return Object.assign(new Error(message), { code })
}
const abortReasons = new WeakMap<AbortSignal, Error>()
export function abortDownload(controller: AbortController, reason: Error): void {
    if (controller.signal.aborted) return
    abortReasons.set(controller.signal, reason)
    ;(controller as any).abort(reason)
}
export function abortReason(signal: AbortSignal): Error {
    return abortReasons.get(signal) || ((signal as any).reason instanceof Error ? (signal as any).reason : downloadError('已取消下载', 'DOWNLOAD_CANCELLED'))
}
/** Observe non-cooperative promises too, while forwarding cancellation to their real resource owner. */
export function abortable<T>(operation: Promise<T>, signal: AbortSignal): Promise<T> {
    return new Promise<T>((resolve, reject) => {
        const abort = () => { signal.removeEventListener('abort', abort); reject(abortReason(signal)) }
        const finish = (callback: (value: any) => void, value: any) => {
            signal.removeEventListener('abort', abort); callback(value)
        }
        operation.then(value => finish(resolve, value), error => finish(reject, error))
        if (signal.aborted) abort()
        else signal.addEventListener('abort', abort, { once: true })
    })
}
export async function boundedCleanup(operation: Promise<unknown>): Promise<void> {
    let timer: ReturnType<typeof setTimeout> | undefined
    try {
        await Promise.race([operation.catch(() => undefined), new Promise(resolve => {
            timer = setTimeout(resolve, ZIP_DOWNLOAD_LIMITS.cleanupMs)
        })])
    } finally { if (timer) clearTimeout(timer) }
}
export function explainDownloadError(error: any): string {
    if (error?.name === 'QuotaExceededError' || /disk full|no space|ENOSPC/i.test(error?.message || '')) return '保存盘或浏览器临时空间不足，请释放空间或更换保存位置'
    if (['NotAllowedError', 'SecurityError', 'NoModificationAllowedError'].includes(error?.name)) return '保存位置无法写入，请检查权限或更换保存位置'
    return error instanceof Error ? error.message : '下载或保存失败，请检查网络和保存位置'
}

import { h } from 'vue'
import { ElMessageBox } from 'element-plus'
import { downloadVideoZip as downloadVideoZipCore, type ZipProgress, type ZipVideoItem, type ZipVideoResult } from './download'
import { downloadError } from './downloadSafety'

function itemName(item: ZipVideoItem): string {
    return item.taskName || item.fileName || `任务 ${item.taskId ?? '—'}`
}

/** Result presentation and explicit retries only; the core owns cancellation and durable saves. */
export async function downloadVideoZip(items: ZipVideoItem[], zipName: string, onProgress: (progress: ZipProgress) => void, onItemSuccess?: (item: ZipVideoItem) => void, options?: { isCurrent?: () => boolean }): Promise<ZipVideoResult> {
    const initialRoute = window.location?.hash
    const current = () => window.location?.hash === initialRoute && (options?.isCurrent?.() ?? true)
    const originalItems = [...items]
    const saved = new Set<ZipVideoItem>()
    let pending = originalItems
    let round = 0
    let success = 0
    let archives = 0
    let allStreaming = true
    let aggregate: ZipVideoResult | undefined

    while (true) {
        round++
        // Clear optional fields too, including the previous run's cancellation callback.
        onProgress({ phase: 'fetching', completed: 0, total: pending.length, percent: 0,
            success, failed: 0, archives, currentName: undefined, currentIndex: undefined,
            loadedBytes: undefined, totalBytes: undefined, speedBytesPerSecond: undefined,
            attempt: undefined, notice: undefined, cancel: undefined })
        try {
            // Some pages first gather paginated records. Restore a real user click before a native picker.
            const activation = (navigator as any).userActivation
            if (((window as any).showSaveFilePicker || (window as any).showDirectoryPicker) && activation && !activation.isActive) {
                try { await ElMessageBox.confirm('文件列表已准备好，点击后选择保存位置。', '准备下载', { confirmButtonText: '选择保存位置', cancelButtonText: '取消', closeOnClickModal: false }) }
                catch { throw downloadError('已取消下载', 'DOWNLOAD_CANCELLED') }
            }
            const attemptName = round === 1 ? zipName : `${zipName.replace(/\.zip$/i, '')}-retry-${round - 1}.zip`
            const result = await downloadVideoZipCore(pending, attemptName, progress => {
                if (!current()) { progress.cancel?.(); return }
                onProgress({ ...progress, success: success + (progress.success || 0), archives: archives + (progress.archives || 0) })
            }, item => {
                // Distinct entries can share a URL/task ID: preserve exact item identity.
                if (saved.has(item)) return
                saved.add(item)
                onItemSuccess?.(item)
            })
            success += result.success
            archives += result.archives || 0
            allStreaming = allStreaming && result.streaming === true
            const failedItems = result.failedItems.filter(({ item }) => !saved.has(item))
            const failed = new Set(failedItems.map(({ item }) => item))
            const unprocessedItems = (result.unprocessedItems || []).filter(item => !saved.has(item) && !failed.has(item))
            aggregate = { ...result, success, archives, streaming: allStreaming, failed: failedItems.length, failedItems, unprocessedItems }
        } catch (error) {
            // Preserve the public rejection contract for the initial file-picker cancellation.
            if (!aggregate || (error as { code?: string })?.code !== 'DOWNLOAD_CANCELLED') throw error
            // Cancelling a retry picker retains earlier saved packs and never auto-restarts.
            aggregate = { ...aggregate, cancelled: true }
        }

        if (!current()) return aggregate
        const retryable = new Set([...aggregate.failedItems.map(({ item }) => item), ...(aggregate.unprocessedItems || [])])
        pending = originalItems.filter(item => retryable.has(item) && !saved.has(item))
        onProgress({ phase: 'done', completed: items.length - pending.length, total: items.length, percent: 100,
            success, failed: aggregate.failed, archives, streaming: aggregate.streaming, cancel: undefined })

        const summary = aggregate
        const unsaved = summary.unprocessedItems || []
        const incomplete = !!(summary.cancelled || summary.errorMessage || pending.length)
        const message = h('div', { style: { maxHeight: '55vh', overflow: 'auto', overflowWrap: 'anywhere' } }, [
            h('p', `${summary.cancelled ? '下载已取消。' : ''}${success ? summary.streaming ? '已确认保存' : '已生成 ZIP 并发起浏览器保存' : '保存成功'} ${success} 项，失败 ${summary.failed} 项，未处理/未保存 ${unsaved.length} 项，共 ${archives} 个 ZIP。`),
            summary.errorMessage ? h('p', summary.errorMessage) : null,
            !summary.streaming && success ? h('p', '请检查浏览器下载列表，确认所有 ZIP 均已保存。') : null,
            success ? h('p', '此前已保存的分包会保留，重试不会重复下载已确认成功项。') : null,
            summary.failedItems.length ? h('ul', summary.failedItems.map(({ item, reason }) => h('li', `${itemName(item)}：${reason || '下载失败'}`))) : null,
            unsaved.length ? h('ul', unsaved.map(item => h('li', `${itemName(item)}：${summary.cancelled ? '取消后未保存或尚未处理' : '未保存或尚未处理'}`))) : null
        ])
        let retry = false
        try {
            const action = await ElMessageBox({
                title: summary.cancelled ? '下载已取消' : incomplete ? '下载未全部完成' : success ? '下载结果' : '没有文件保存成功',
                message, type: incomplete || !success ? 'warning' : 'success',
                confirmButtonText: pending.length ? '仅重试未成功项' : '知道了',
                showCancelButton: pending.length > 0, cancelButtonText: '结束',
                closeOnClickModal: false, closeOnPressEscape: true, distinguishCancelAndClose: true
            })
            retry = action === 'confirm' && pending.length > 0
        } catch { /* Dismissing the summary never starts another download. */ }
        if (!retry || !current()) return aggregate
    }
}

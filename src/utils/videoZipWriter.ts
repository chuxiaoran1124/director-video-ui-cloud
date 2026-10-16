import { BlobReader, BlobWriter, ZipWriter } from '@zip.js/zip.js'
import { abortable, abortDownload, abortReason, boundedCleanup, downloadError, ZIP_DOWNLOAD_LIMITS } from './downloadSafety'

// Do not use JSZip.generateAsync here: it concatenates the entire archive into
// one ArrayBuffer. Native file writing keeps only the current video's chunks.
export const VIDEO_ZIP_FALLBACK_BYTES = 256 * 1024 * 1024

export interface VideoZipSink {
    add(name: string, blob: Blob): Promise<void>
    close(): Promise<Blob | undefined>
    abort(): Promise<void>
}

export function createVideoZipSink(file?: WritableStream<Uint8Array>, signal?: AbortSignal): VideoZipSink {
    const diskWriter = file?.getWriter()
    const controller = new AbortController()
    let closed = false
    const cancel = () => abortDownload(controller, signal ? abortReason(signal) : downloadError('已取消下载', 'DOWNLOAD_CANCELLED'))
    if (signal?.aborted) cancel()
    else signal?.addEventListener('abort', cancel, { once: true })
    let touch: () => void = () => undefined
    const detach = () => signal?.removeEventListener('abort', cancel)
    const output = diskWriter ? new WritableStream<Uint8Array>({
        write: async chunk => {
            if (controller.signal.aborted) throw abortReason(controller.signal)
            await abortable(diskWriter.write(chunk), controller.signal)
            touch()
        },
        close: async () => { await diskWriter.close(); closed = true; diskWriter.releaseLock() },
        abort: async reason => { await diskWriter.abort(reason); closed = true; diskWriter.releaseLock() }
    }) : new BlobWriter('application/zip')
    const writer = new ZipWriter(output, {
        level: 0, useWebWorkers: false, bufferedWrite: false
    })
    const names = new Set<string>()
    async function guarded<T>(operation: () => Promise<T>): Promise<T> {
        let idle: ReturnType<typeof setTimeout>
        const stalled = () => abortDownload(controller, downloadError('ZIP 写入长时间没有进展，请检查保存盘空间和写入权限', 'ZIP_WRITE_TIMEOUT'))
        touch = () => { clearTimeout(idle); idle = setTimeout(stalled, ZIP_DOWNLOAD_LIMITS.writeIdleMs) }
        touch()
        const total = setTimeout(() => abortDownload(controller, downloadError('ZIP 写入超时，请更换保存位置后重试', 'ZIP_WRITE_TIMEOUT')), ZIP_DOWNLOAD_LIMITS.writeTotalMs)
        try { return await abortable(operation(), controller.signal) }
        finally { clearTimeout(idle!); clearTimeout(total); touch = () => undefined }
    }
    return {
        async add(name, blob) {
            // Sanitizing two different names can produce the same ZIP entry.
            let unique = name
            let suffix = 2
            while (names.has(unique)) unique = name.replace(/(\.[^.]*)?$/, `-${suffix++}$1`)
            await guarded(() => writer.add(unique, new BlobReader(blob), { signal: controller.signal }))
            names.add(unique)
        },
        async close() {
            const result = await guarded(() => writer.close())
            closed = true
            detach()
            return result instanceof Blob ? result : undefined
        },
        async abort() {
            abortDownload(controller, downloadError('ZIP 保存已停止', 'DOWNLOAD_CANCELLED'))
            detach()
            // Do not close/finalize a corrupt archive. File System Access abort
            // discards the temporary file instead of committing incomplete data.
            if (diskWriter && !closed) {
                await boundedCleanup(diskWriter.abort())
                try { diskWriter.releaseLock() } catch { /* already released */ }
                closed = true
            }
        }
    }
}

/** Native checkpoints require a directory handle; do not re-open save pickers after user activation expires. */
export async function chooseVideoZipDirectory(): Promise<any | undefined> {
    const picker = (window as any).showDirectoryPicker
    if (!picker) return undefined
    try { return await picker.call(window, { mode: 'readwrite' }) }
    catch (error: any) {
        if (error?.name === 'AbortError') throw downloadError('已取消下载', 'DOWNLOAD_CANCELLED')
        throw downloadError('无法打开保存文件夹，请检查权限或更换位置', 'ZIP_DIRECTORY_FAILED')
    }
}

export async function chooseVideoZipFile(fileName: string, signal?: AbortSignal): Promise<WritableStream<Uint8Array> | undefined> {
    const picker = (window as any).showSaveFilePicker
    if (!picker) return undefined
    // Must be called synchronously from the user's click, before fetching.
    try {
        const handle = await picker.call(window, {
            suggestedName: fileName,
            types: [{ description: 'ZIP 压缩包', accept: { 'application/zip': ['.zip'] } }]
        })
        if (signal?.aborted) throw abortReason(signal)
        const controller = new AbortController()
        const cancel = () => abortDownload(controller, signal ? abortReason(signal) : downloadError('已取消下载', 'DOWNLOAD_CANCELLED'))
        signal?.addEventListener('abort', cancel, { once: true })
        const timer = setTimeout(() => abortDownload(controller, downloadError('创建 ZIP 文件超时，请检查保存盘和权限', 'ZIP_WRITE_TIMEOUT')), ZIP_DOWNLOAD_LIMITS.writeIdleMs)
        const opening = Promise.resolve(handle.createWritable()) as Promise<WritableStream<Uint8Array>>
        opening.then(value => { if (controller.signal.aborted) void boundedCleanup(value.abort()) }, () => undefined)
        try { return await abortable(opening, controller.signal) }
        finally { clearTimeout(timer); signal?.removeEventListener('abort', cancel) }
    } catch (error: any) {
        if (error?.name === 'AbortError' || error?.code === 'DOWNLOAD_CANCELLED') {
            throw Object.assign(new Error('已取消下载'), { code: 'DOWNLOAD_CANCELLED' })
        }
        // Do not hide disk-full/permission errors by silently re-downloading.
        throw new Error('无法创建 ZIP 文件，请检查保存位置的空间和写入权限')
    }
}

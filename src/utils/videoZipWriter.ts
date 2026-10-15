import { BlobReader, BlobWriter, ZipWriter } from '@zip.js/zip.js'

// Do not use JSZip.generateAsync here: it concatenates the entire archive into
// one ArrayBuffer. Native file writing keeps only the current video's chunks.
export const VIDEO_ZIP_FALLBACK_BYTES = 256 * 1024 * 1024

export interface VideoZipSink {
    add(name: string, blob: Blob): Promise<void>
    close(): Promise<Blob | undefined>
    abort(): Promise<void>
}

export function createVideoZipSink(file?: WritableStream<Uint8Array>): VideoZipSink {
    const diskWriter = file?.getWriter()
    let closed = false
    const output = diskWriter ? new WritableStream<Uint8Array>({
        write: chunk => diskWriter.write(chunk),
        close: async () => { await diskWriter.close(); closed = true; diskWriter.releaseLock() },
        abort: async reason => { await diskWriter.abort(reason); closed = true; diskWriter.releaseLock() }
    }) : new BlobWriter('application/zip')
    const writer = new ZipWriter(output, {
        level: 0, useWebWorkers: false, bufferedWrite: false
    })
    const names = new Set<string>()
    return {
        async add(name, blob) {
            // Sanitizing two different names can produce the same ZIP entry.
            let unique = name
            let suffix = 2
            while (names.has(unique)) unique = name.replace(/(\.[^.]*)?$/, `-${suffix++}$1`)
            await writer.add(unique, new BlobReader(blob))
            names.add(unique)
        },
        async close() {
            const result = await writer.close()
            return result instanceof Blob ? result : undefined
        },
        async abort() {
            // Do not close/finalize a corrupt archive. File System Access abort
            // discards the temporary file instead of committing incomplete data.
            if (diskWriter && !closed) {
                try { await diskWriter.abort() } catch { /* preserve original error */ }
                try { diskWriter.releaseLock() } catch { /* already released */ }
                closed = true
            }
        }
    }
}

export async function chooseVideoZipFile(fileName: string): Promise<WritableStream<Uint8Array> | undefined> {
    const picker = (window as any).showSaveFilePicker
    if (!picker) return undefined
    // Must be called synchronously from the user's click, before fetching.
    try {
        const handle = await picker.call(window, {
            suggestedName: fileName,
            types: [{ description: 'ZIP 压缩包', accept: { 'application/zip': ['.zip'] } }]
        })
        return await handle.createWritable()
    } catch (error: any) {
        if (error?.name === 'AbortError') {
            throw Object.assign(new Error('已取消下载'), { code: 'DOWNLOAD_CANCELLED' })
        }
        // Do not hide disk-full/permission errors by silently re-downloading.
        throw new Error('无法创建 ZIP 文件，请检查保存位置的空间和写入权限')
    }
}

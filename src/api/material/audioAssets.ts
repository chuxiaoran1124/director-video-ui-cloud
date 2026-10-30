import request from '/@/utils/request'

export type AudioSource = 'uploaded' | 'generated'
export interface AudioAsset {
  id: number | string
  name: string
  source: AudioSource
  status?: 'ready' | 'reserved' | 'deleting' | 'released'
  url: string
  duration: number
  sizeBytes: number
  createTime: string
}
export function audioAssetReady(row: AudioAsset): boolean { return !row.status || row.status === 'ready' }

// Only backend busy/quota/validation messages from this bounded asset API may bypass the
// generic local toast; do not expose arbitrary internal/raw server errors.
export function audioAssetError(error: any, fallback: string): string {
  const raw = String(error?.rawMessage || '')
  if (/占用|使用中|处理中|正在删除|正在上传|预占|额度|上限|100\s*MB|busy|in use|reserved/i.test(raw) && raw.length <= 240 && !/traceback|sql|token|secret|password|https?:\/\/|[\\/][\w.-]+[\\/]/i.test(raw)) return raw
  return error?.message || fallback
}
export interface AudioAssetPage {
  records: AudioAsset[]
  total: number
  quota: Record<AudioSource, { used: number; limit: number }>
}

// Match the existing Axios envelope, including older endpoints with a single data layer.
export function unwrapAudioResponse(response: any): any {
  return response?.data?.data ?? response?.data ?? {}
}

export async function paginateAudioAssets(query: { page: number; pageSize: number; source?: AudioSource; keyword: string }): Promise<AudioAssetPage> {
  return unwrapAudioResponse(await request({
    url: '/api/material/audio-assets/paginate/', method: 'post', data: query,
    hideLoading: true, silentError: true
  } as any))
}

export async function uploadAudioAsset(file: File, name: string, requestId: string, onProgress?: (percent: number) => void): Promise<AudioAsset> {
  const data = new FormData()
  data.append('file', file) // Persist the complete original audio; never trim or create a training sample.
  data.append('name', name.trim())
  data.append('requestId', requestId)
  return unwrapAudioResponse(await request({
    url: '/api/material/audio-assets/upload/', method: 'post', data,
    headers: { 'Content-Type': 'multipart/form-data' }, timeout: 180000,
    hideLoading: true, silentError: true,
    onUploadProgress: (event: ProgressEvent) => onProgress?.(event.total ? Math.min(99, Math.round(event.loaded / event.total * 100)) : 0)
  } as any))
}

export async function deleteAudioAsset(id: number | string): Promise<void> {
  await request({
    url: `/api/material/audio-assets/${encodeURIComponent(String(id))}/delete/`, method: 'post',
    hideLoading: true, silentError: true
  } as any)
}

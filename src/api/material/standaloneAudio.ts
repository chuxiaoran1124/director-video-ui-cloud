import request from '/@/utils/request'

export type AudioTool = 'voice-training' | 'audio-dubbing'
export type AudioTaskStatus = '0' | '1' | '2' | '-1' | 'uncertain'
export interface AudioTask {
    id: number
    name: string
    gender: string
    language: string
    model: string
    taskStatus: AudioTaskStatus
    outputUrl: string
    errorMessage: string
    statusHint?: string
    createTime: string
    updateTime: string
    startTime: string
    endTime: string
    canRetry: boolean
    attemptNo: number
}
export interface AudioQuery {
    page: number
    pageSize: number
    search: { name: string; gender: string; taskStatus: string }
}
export interface AudioPage { page: number; pageSize: number; total: number; data: AudioTask[] }
export interface DubbingPayload {
    name: string
    msg: string
    voiceId: number
    language: 'zh' | 'en'
    speechRate: number
    idempotencyKey: string
}
interface ApiResponse<T> { code: number; data: T; message?: string }

export function standaloneAudioApi(tool: AudioTool) {
    const base = `/api/material/${tool}/`
    // Every request uses local feedback. Poll failures never create global notifications/masks.
    const send = async <T>(url: string, method: 'get' | 'post' | 'delete', data?: unknown, multipart = false): Promise<T> => {
        const response = await request({
            url: base + url, method, data, hideLoading: true, silentError: true,
            ...(multipart ? { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 180000 } : {})
        } as any)
        const payload = response.data as ApiResponse<T>
        // request.ts already rejects non-2xx business codes; guard this frozen API's code=200 contract too.
        if (Number(payload?.code) !== 200 || payload.data === undefined) {
            throw new Error('操作未成功，请刷新任务列表确认后重试')
        }
        return payload.data
    }
    return {
        paginate: (query: AudioQuery) => send<AudioPage>('paginate/', 'post', query),
        create: (data: FormData | DubbingPayload) => send<AudioTask>('create/', 'post', data, data instanceof FormData),
        validateName: (name: string) => send<{ is_valid: boolean; recommended_name: string }>('validate-name/', 'post', { name }),
        detail: (id: number) => send<AudioTask>(`${id}/`, 'get'),
        remove: (id: number) => send<unknown>(`${id}/`, 'delete'),
        retry: (id: number) => send<AudioTask>(`${id}/retry/`, 'post')
    }
}

export function trainingPayload(name: string, gender: string, file: File, idempotencyKey: string): FormData {
    const data = new FormData()
    Object.entries({ name: name.trim(), gender, language: 'zh', model: 'a2e', idempotencyKey }).forEach(([key, value]) => data.append(key, value))
    data.append('file', file)
    return data
}

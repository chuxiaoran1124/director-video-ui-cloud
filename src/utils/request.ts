import { useLayoutStore } from '/@/store/modules/layout'
import axios, { AxiosResponse } from 'axios'
import { ElLoading, ElNotification } from 'element-plus'

const GENERIC_MASKED_ERROR_MESSAGE = '请求失败，请联系管理员'
const ORIGINAL_MESSAGE_URL_PATTERNS = [
    /\/user\/login\/?$/i,
    /\/user\/refresh-token\/?$/i,
    /\/user\/platform-login-entry\/activate\/?$/i,
    /\/user\/temporary-access\/activate\/?$/i,
    /\/user\/temporary-access\/exchange\/?$/i
]
const ORIGINAL_MESSAGE_WHITELIST = new Set([
    '账号已停用，请联系管理员',
    '链接授权已过期，请联系管理员'
])

const request = axios.create({
    baseURL: import.meta.env.VITE_API_URL as string | undefined,
    timeout: 60000,
    headers: {
        'Content-Type': 'application/json;charset=UTF-8'
    }
})

const shouldMaskErrorMessage = () => {
    try {
        const layoutStore = useLayoutStore()
        return Boolean(layoutStore.getStatus.ACCESS_TOKEN) && !layoutStore.getUserInfo.isPlatformSuperAdmin
    } catch (_error) {
        return false
    }
}

const shouldKeepOriginalMessage = (config: any, rawMessage: string) => {
    if (ORIGINAL_MESSAGE_WHITELIST.has(rawMessage)) {
        return true
    }

    const requestUrl = String(config?.url || '')
    return ORIGINAL_MESSAGE_URL_PATTERNS.some((pattern) => pattern.test(requestUrl))
}

const normalizeErrorMessage = (rawMessage: string, config?: any) => {
    const fallbackMessage = rawMessage || GENERIC_MASKED_ERROR_MESSAGE
    if (shouldKeepOriginalMessage(config, fallbackMessage)) {
        return fallbackMessage
    }
    return shouldMaskErrorMessage() ? GENERIC_MASKED_ERROR_MESSAGE : fallbackMessage
}

const buildRejectedError = (message: string, rawMessage: string, status?: number) => {
    return Object.assign(new Error(message), {
        rawMessage,
        status
    })
}

const errorHandler = async(error: any) => {
    error?.config?._loadingInstance?.close?.()
    const status = error?.response?.status
    const rawMessage = error?.response?.data?.message || error?.message || '请求失败'
    const message = normalizeErrorMessage(rawMessage, error?.config)

    if (status === 401) {
        const layoutStore = useLayoutStore()
        await layoutStore.forceLogout()
    }

    if (!error?.config?.silentError) {
        ElNotification({
            title: status ? `请求失败 ${status}` : '请求失败',
            message,
            type: 'error'
        })
    }

    return Promise.reject(buildRejectedError(message, rawMessage, status))
}

request.interceptors.request.use((config: any) => {
    if (!config.hideLoading) {
        config._loadingInstance = ElLoading.service({
            lock: true,
            text: '正在加载',
            spinner: 'el-icon-loading',
            background: 'rgba(3, 15, 28, 0.35)'
        })
    }

    const token = sessionStorage.getItem('accessToken')
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
}, errorHandler)

request.interceptors.response.use(async(response: AxiosResponse<IResponse>) => {
    const payload = response.data
    ;(response.config as any)._loadingInstance?.close?.()

    if (response.data instanceof Blob) {
        return response
    }

    const code = Number(payload?.code)
    const isBusinessSuccess = code >= 200 && code < 300
    if (!isBusinessSuccess) {
        const rawMessage = payload?.message || '系统出错，请联系管理员'
        const message = normalizeErrorMessage(rawMessage, response.config)
        if (code === 401) {
            const layoutStore = useLayoutStore()
            await layoutStore.forceLogout()
        }

        if (!(response.config as any).silentError) {
            ElNotification({
                title: code === 401 ? '身份认证失败' : '请求失败',
                message,
                type: 'error'
            })
        }
        return Promise.reject(buildRejectedError(message, rawMessage, code))
    }

    return response
}, errorHandler)

export default request

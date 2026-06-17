import { useLayoutStore } from '/@/store/modules/layout'
import axios, { AxiosResponse } from 'axios'
import { ElLoading, ElNotification } from 'element-plus'

const request = axios.create({
    baseURL: import.meta.env.VITE_API_URL as string | undefined,
    timeout: 60000,
    headers: {
        'Content-Type': 'application/json;charset=UTF-8'
    }
})

const errorHandler = async(error: any) => {
    error?.config?._loadingInstance?.close?.()
    const status = error?.response?.status
    const message = error?.response?.data?.message || error?.message || '请求失败'

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

    return Promise.reject(new Error(message))
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
        const message = payload?.message || '系统出错，请联系管理员'
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
        return Promise.reject(new Error(message))
    }

    return response
}, errorHandler)

export default request

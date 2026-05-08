import { useLayoutStore } from '/@/store/modules/layout'
import router from '/@/router/index'
import axios from 'axios'
import { AxiosResponse } from 'axios'
import { ElLoading, ElNotification } from 'element-plus'

let loading:{close():void}
// 创建 axios 实例
const request = axios.create({
    // API 请求的默认前缀
    baseURL: import.meta.env.VITE_API_URL as string | undefined,
    timeout: 60000, // 请求超时时间
    headers: {
        'Content-Type': 'application/json;charset=UTF-8'
    }
})

// 异常拦截处理器
const errorHandler = (error:any) => {
    loading.close && loading.close()
    let status = error && error.response ? error.response.status : undefined
    let msg = error && error.response && error.response.data && error.response.data.message ? error.response.data.message : error.message
    let title = status ? `请求失败 ${status}` : '请求失败'
    console.log('err', error)
    // 401 未授权时重定向到登录
    if (status === 401) {
        const { logout } = useLayoutStore()
        try { logout() } catch {}
        router.push('/login')
    }
    if (!error?.config?.silentError) {
        ElNotification({
            title,
            message: msg,
            type: 'error'
        })
    }
    return Promise.reject(new Error(msg))
}

// request interceptor
request.interceptors.request.use(config => {
    const { getStatus } = useLayoutStore()
    loading = ElLoading.service({
        lock: true,
        text: 'Loading',
        spinner: 'el-icon-loading',
        background: 'rgba(0, 0, 0, 0.4)'
    })
    // 直接从 sessionStorage 读取 token
    const token = sessionStorage.getItem('token')
    if (token) {
        config.headers['Authorization'] = `Bearer ${token}`
    }
    return config
}, errorHandler)

// response interceptor
request.interceptors.response.use((response:AxiosResponse<IResponse>) => {
    const { data } = response
    const { getStatus, logout, setToken } = useLayoutStore()
    loading.close()
    
    // 如果是blob类型（文件下载），直接返回
    if (response.data instanceof Blob) {
        return response
    }
    
    // 检查响应头是否有新token，自动更新
    const newToken = response.headers['authorization'] || response.headers['Authorization']
    if (newToken && newToken.startsWith('Bearer ')) {
        const jwt = newToken.slice(7)
        setToken(jwt)
    }
    if(data.code !== 200) {
        let title = '请求失败'
        let msg = data.message || '系统出错，请联系管理员'
        if(data.code === 401) {
            if (getStatus.ACCESS_TOKEN) {
                logout()
            }
            title = '身份认证失败'
            // Token 过期或未授权，重定向到登录页
            router.push('/login')
        }
        if (!(response.config as any).silentError) {
            ElNotification({
                title,
                message: msg,
                type: 'error'
            })
        }
        return Promise.reject(new Error(msg))
    }
    return response
}, errorHandler)

export default request
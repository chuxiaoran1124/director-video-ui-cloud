import request from '/@/utils/request'
import { AxiosResponse } from 'axios'
import { IMenubarList, ITenantSummary, IUserInfo } from '/@/type/store/layout'

const api = {
    login: '/api/user/login/',
    refreshToken: '/api/user/refresh-token/',
    logout: '/api/user/logout/',
    currentUser: '/api/user/current-user/',
    currentTenant: '/api/user/current-tenant/',
    getRouteList: '/api/user/get-route/',
    switchTenant: '/api/user/switch-tenant/'
}

export interface ILoginParam {
    username: string
    password: string
    tenantId?: number
}

export interface ILoginResponse {
    user: {
        userId: number
        username: string
        email?: string | null
        name: string
        phone?: string | null
        status: string
        role: string
        photoUrl?: string | null
        createTime: string
        updateTime: string
    }
    currentTenant: ITenantSummary
    tenantList: ITenantSummary[]
    accessToken: string
    refreshToken: string
    expiresIn: number
}

export function login(param: ILoginParam): Promise<AxiosResponse<IResponse<ILoginResponse>>> {
    return request({
        url: api.login,
        method: 'post',
        data: param
    })
}

export function refreshToken(refreshTokenValue: string): Promise<AxiosResponse<IResponse<ILoginResponse>>> {
    return request({
        url: api.refreshToken,
        method: 'post',
        data: {
            refreshToken: refreshTokenValue
        },
        hideLoading: true,
        silentError: true
    })
}

export function logout(refreshTokenValue?: string): Promise<AxiosResponse<IResponse<{ userId: number }>>> {
    return request({
        url: api.logout,
        method: 'post',
        data: {
            refreshToken: refreshTokenValue || ''
        },
        hideLoading: true,
        silentError: true
    })
}

export function getUser(): Promise<AxiosResponse<IResponse<IUserInfo>>> {
    return request({
        url: api.currentUser,
        method: 'get',
        hideLoading: true
    })
}

export function getCurrentTenant(): Promise<AxiosResponse<IResponse<ITenantSummary>>> {
    return request({
        url: api.currentTenant,
        method: 'get',
        hideLoading: true
    })
}

export function getRouterList(): Promise<AxiosResponse<IResponse<Array<IMenubarList>>>> {
    return request({
        url: api.getRouteList,
        method: 'get',
        hideLoading: true
    })
}

export function switchTenant(tenantId: number): Promise<AxiosResponse<IResponse<ILoginResponse>>> {
    return request({
        url: api.switchTenant,
        method: 'post',
        data: {
            tenantId
        }
    })
}

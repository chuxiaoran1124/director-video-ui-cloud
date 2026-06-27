import request from '/@/utils/request'
import { AxiosResponse } from 'axios'
import { IMenubarList, ITenantSummary, IUserInfo } from '/@/type/store/layout'

const api = {
    login: '/api/user/login/',
    platformLoginEntryActivate: '/api/user/platform-login-entry/activate/',
    platformLoginEntryStatus: '/api/user/platform-login-entry/status/',
    temporaryAccessActivate: '/api/user/temporary-access/activate/',
    temporaryAccessExchange: '/api/user/temporary-access/exchange/',
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
    loginGrantToken?: string
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

export interface IPlatformLoginEntryStatusResponse {
    gateEnabled: boolean
    granted: boolean
    expiresAt?: string | null
    entryUrl?: string
    message?: string
    grantToken?: string
    loginPath?: string
}

export function login(param: ILoginParam): Promise<AxiosResponse<IResponse<ILoginResponse>>> {
    return request({
        url: api.login,
        method: 'post',
        data: param
    })
}

export function activatePlatformLoginEntry(entryToken: string): Promise<AxiosResponse<IResponse<IPlatformLoginEntryStatusResponse>>> {
    return request({
        url: api.platformLoginEntryActivate,
        method: 'post',
        data: {
            entryToken
        },
        hideLoading: true,
        silentError: true
    })
}

export function getPlatformLoginEntryStatus(grantToken: string): Promise<AxiosResponse<IResponse<IPlatformLoginEntryStatusResponse>>> {
    return request({
        url: api.platformLoginEntryStatus,
        method: 'get',
        params: {
            grantToken
        },
        hideLoading: true,
        silentError: true
    })
}

export function activateTemporaryAccess(ticket: string): Promise<AxiosResponse<IResponse<IPlatformLoginEntryStatusResponse>>> {
    return request({
        url: api.temporaryAccessActivate,
        method: 'post',
        data: {
            ticket
        },
        hideLoading: true,
        silentError: true
    })
}

export function exchangeTemporaryAccess(ticket: string): Promise<AxiosResponse<IResponse<ILoginResponse>>> {
    return request({
        url: api.temporaryAccessExchange,
        method: 'post',
        data: {
            ticket
        },
        hideLoading: true
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

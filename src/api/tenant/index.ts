import request from '/@/utils/request'
import { AxiosResponse } from 'axios'
import { ITenantSummary } from '/@/type/store/layout'

export interface ITenantListItem extends ITenantSummary {
    userCount: number
    roleCount: number
    currentSelected: boolean
}

export interface ITenantListResponse {
    page: number
    pageSize: number
    total: number
    data: ITenantListItem[]
}

export interface ITenantDetailResponse extends ITenantSummary {
    userCount: number
    roleCount: number
    runtimeConfig: Record<string, any>
    schedulerConfig: Record<string, any>
    storageConfig: Record<string, any>
    initialAdmin?: {
        username: string
        enabled: boolean
        name?: string
    }
}

export interface ICreateTenantPayload {
    tenantCode: string
    tenantName: string
    tenantShortName?: string
    contactName?: string
    contactPhone?: string
    contactEmail?: string
    remark?: string
    adminUsername: string
    adminPassword: string
    adminName?: string
    adminPhone?: string
    adminEmail?: string
    adminEnabled?: boolean
}

export function createTenant(payload: ICreateTenantPayload): Promise<AxiosResponse<IResponse<ITenantDetailResponse>>> {
    return request({
        url: '/api/tenant/create/',
        method: 'post',
        data: payload
    })
}

export function getTenantList(payload: { page: number; pageSize: number; search: Record<string, any> }): Promise<AxiosResponse<IResponse<ITenantListResponse>>> {
    return request({
        url: '/api/tenant/list/',
        method: 'post',
        data: payload
    })
}

export function getTenantDetail(tenantId?: number): Promise<AxiosResponse<IResponse<ITenantDetailResponse>>> {
    return request({
        url: '/api/tenant/detail/',
        method: 'post',
        data: tenantId ? { tenantId } : {}
    })
}

export function updateTenantRuntimeConfig(payload: { tenantId: number; enablePostProcessPipeline: boolean }): Promise<AxiosResponse<IResponse<ITenantDetailResponse>>> {
    return request({
        url: '/api/tenant/runtime-config/update/',
        method: 'post',
        data: payload
    })
}

export function updateTenantSchedulerPriorityConfig(payload: { tenantId: number; priorityMode: string }): Promise<AxiosResponse<IResponse<ITenantDetailResponse>>> {
    return request({
        url: '/api/tenant/scheduler-config/update/',
        method: 'post',
        data: payload
    })
}

export function updateTenantSchedulerQuotaConfig(payload: {
    tenantId: number
    maxConcurrency: number
    maxVideoTaskConcurrency: number
    maxFastTaskConcurrency: number
}): Promise<AxiosResponse<IResponse<ITenantDetailResponse>>> {
    return request({
        url: '/api/tenant/scheduler-config/quota/update/',
        method: 'post',
        data: payload
    })
}

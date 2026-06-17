import request from '/@/utils/request'
import { AxiosResponse } from 'axios'
import { IMenubarList } from '/@/type/store/layout'

export interface IUserListItem {
    userId: number
    username: string
    email?: string | null
    name?: string | null
    phone?: string | null
    status: string
    role: string
    photoUrl?: string | null
    createTime: string
    updateTime: string
    tenantId?: number
    tenantRoleCodes: string[]
    tenantRoleNames: string[]
    globalRoleCodes: string[]
}

export interface IUserListResponse {
    page: number
    pageSize: number
    total: number
    tenantId: number
    data: IUserListItem[]
}

export interface IUserRoleItem {
    id: number
    tenantId: number
    roleCode: string
    roleName: string
    description?: string | null
    dataScope: string
    roleLevel: number
    canManageUsers: boolean
    canManageRoles: boolean
    canManageRolePermissions: boolean
    canManageTenantRoutes: boolean
    isSystem: boolean
    status: string
    sort: number
}

export interface IRoutePermissionItem {
    id: number
    tenantId: number
    roleId: number
    routeId: number
    permissionIds: number[]
}

export interface IPermissionOption {
    id: number
    name: string
    description?: string | null
}

export interface IUserListPayload {
    page: number
    pageSize: number
    tenantId?: number
    search: Record<string, any>
}

export function getUserList(payload: IUserListPayload): Promise<AxiosResponse<IResponse<IUserListResponse>>> {
    return request({
        url: '/api/user/list/',
        method: 'post',
        data: payload
    })
}

export function getUserDetail(userId: number, tenantId?: number): Promise<AxiosResponse<IResponse<IUserListItem>>> {
    return request({
        url: '/api/user/detail/',
        method: 'post',
        data: {
            userId,
            tenantId
        }
    })
}

export function createUser(payload: Record<string, any>): Promise<AxiosResponse<IResponse<IUserListItem>>> {
    return request({
        url: '/api/user/create/',
        method: 'post',
        data: payload
    })
}

export function updateUser(payload: Record<string, any>): Promise<AxiosResponse<IResponse<IUserListItem>>> {
    return request({
        url: '/api/user/update/',
        method: 'post',
        data: payload
    })
}

export function deleteUser(payload: { tenantId?: number; userId?: number; userIds?: number[] }): Promise<AxiosResponse<IResponse<null>>> {
    return request({
        url: '/api/user/delete/',
        method: 'post',
        data: payload
    })
}

export function checkUserUnique(payload: { username?: string; email?: string }): Promise<AxiosResponse<IResponse<null>>> {
    return request({
        url: '/api/user/check-unique/',
        method: 'post',
        data: payload,
        hideLoading: true,
        silentError: true
    })
}

export function changePassword(payload: { oldPassword: string; newPassword: string }): Promise<AxiosResponse<IResponse<null>>> {
    return request({
        url: '/api/user/change-password/',
        method: 'post',
        data: payload
    })
}

export function resetUserPassword(payload: { userId: number; tenantId?: number; newPassword: string }): Promise<AxiosResponse<IResponse<null>>> {
    return request({
        url: '/api/user/reset-password/',
        method: 'post',
        data: payload
    })
}

export function getRoleList(tenantId?: number): Promise<AxiosResponse<IResponse<IUserRoleItem[]>>> {
    return request({
        url: '/api/user/get-role-list/',
        method: 'get',
        params: tenantId ? { tenantId } : {},
        hideLoading: true
    })
}

export function createRole(payload: Record<string, any>): Promise<AxiosResponse<IResponse<IUserRoleItem>>> {
    return request({
        url: '/api/user/create-role/',
        method: 'post',
        data: payload
    })
}

export function updateRole(roleId: number, payload: Record<string, any>): Promise<AxiosResponse<IResponse<IUserRoleItem>>> {
    return request({
        url: `/api/user/update-role/${roleId}/`,
        method: 'post',
        data: payload
    })
}

export function deleteRole(roleId: number, payload: { tenantId?: number }): Promise<AxiosResponse<IResponse<null>>> {
    return request({
        url: `/api/user/delete-role/${roleId}/`,
        method: 'post',
        data: payload
    })
}

export function getRouteCatalog(): Promise<AxiosResponse<IResponse<IMenubarList[]>>> {
    return request({
        url: '/api/user/get-route-catalog/',
        method: 'get',
        hideLoading: true
    })
}

export function getPermissionList(): Promise<AxiosResponse<IResponse<IPermissionOption[]>>> {
    return request({
        url: '/api/user/get-permission-list/',
        method: 'get',
        hideLoading: true
    })
}

export function getRoleRoutePermissionList(roleId: number, tenantId?: number): Promise<AxiosResponse<IResponse<IRoutePermissionItem[]>>> {
    return request({
        url: `/api/user/get-role-route-permission-list/${roleId}/`,
        method: 'get',
        params: tenantId ? { tenantId } : {},
        hideLoading: true
    })
}

export function updateRoleRoutePermission(payload: { tenantId?: number; permissions: any[] }): Promise<AxiosResponse<IResponse<null>>> {
    return request({
        url: '/api/user/update-role-route-permission/',
        method: 'post',
        data: payload
    })
}

// 兼容旧页面的最小导出，后续旧权限页完全移除后可删除。
export function userList(): Promise<AxiosResponse<IResponse<IUserListResponse>>> {
    return getUserList({
        page: 1,
        pageSize: 50,
        search: {}
    })
}

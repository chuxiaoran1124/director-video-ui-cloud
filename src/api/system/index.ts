import request from '/@/utils/request'
import { AxiosResponse } from 'axios'

export function getAllRoute(): Promise<AxiosResponse<IResponse<any[]>>> {
  return request({
    url: '/api/system/get-all-route/',
    method: 'get'
  })
}

export function createRoute(data: any): Promise<AxiosResponse<IResponse<any>>> {
  return request({
    url: '/api/system/add-route/',
    method: 'post',
    data
  })
}

// 编辑路由
export function updateRoute(id: number, data: any) {
  return request({
    url: `/api/system/update-route/${id}/`,
    method: 'POST',
    data
  })
}

export function deleteRoute(id: number): Promise<AxiosResponse<IResponse<any>>> {
  return request({
    url: `/api/system/delete-route/${id}/`,
    method: 'delete'
  })
}

// 获取角色列表
export function getRoleList(): Promise<AxiosResponse<IResponse<any[]>>> {
  return request({
    url: '/api/users/get-role-list/',
    method: 'get'
  })
}

// 获取角色的路由权限配置
export function getRoleRoutePermissions(roleId: number): Promise<AxiosResponse<IResponse<any[]>>> {
  return request({
    url: `/api/users/get-role-route-permission-list/${roleId}/`,
    method: 'get'
  })
}

// 更新角色的路由权限配置
export function updateRoleRoutePermissions(data: any): Promise<AxiosResponse<IResponse<any>>> {
  return request({
    url: '/api/users/update-role-route-permission/',
    method: 'post',
    data
  })
}

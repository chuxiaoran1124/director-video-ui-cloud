import request from '/@/utils/request'
import { AxiosResponse } from 'axios'

/**
 * 用户组 API
 */

// 获取当前用户所属的所有组及权限信息
export function getUserGroupInfo(): Promise<AxiosResponse<IResponse<any[]>>> {
  return request({
    url: '/api/users/group/info/',
    method: 'get'
  })
}

// 创建用户组
export function createGroup(data: {
  groupName: string
  groupCode: string
  msg?: string
  number?: number
}): Promise<AxiosResponse<IResponse<any>>> {
  return request({
    url: '/api/users/group/create/',
    method: 'post',
    data
  })
}

// 更新用户组
export function updateGroup(id: number, data: {
  groupName?: string
  msg?: string
  number?: number
}): Promise<AxiosResponse<IResponse<any>>> {
  return request({
    url: `/api/users/group/update/${id}/`,
    method: 'post',
    data
  })
}

// 删除用户组
export function deleteGroup(id: number): Promise<AxiosResponse<IResponse<any>>> {
  return request({
    url: `/api/users/group/delete/${id}/`,
    method: 'post',
    data: {}
  })
}

// 获取所有用户组
export function getAllGroups(): Promise<AxiosResponse<IResponse<any[]>>> {
  return request({
    url: '/api/users/group/all/',
    method: 'get'
  })
}

// 根据ID获取用户组
export function getGroupById(id: number): Promise<AxiosResponse<IResponse<any>>> {
  return request({
    url: `/api/users/group/${id}/`,
    method: 'get'
  })
}

// 分页查询用户组
export function getGroupsPaginate(page: number, pageSize: number, search?: {
  group_name?: string
  [key: string]: any
}): Promise<AxiosResponse<IResponse<any>>> {
  return request({
    url: '/api/users/group/paginate/',
    method: 'post',
    data: {
      page,
      pageSize,
      search: search || {}
    }
  })
}

// 搜索用户组
export function searchGroups(search: {
  group_name?: string
  [key: string]: any
}): Promise<AxiosResponse<IResponse<any>>> {
  return request({
    url: '/api/users/group/search/',
    method: 'post',
    data: search
  })
}

/**
 * 用户组人员 API
 */

// 创建用户组人员
export function createGroupPerson(data: {
  groupId: number
  personName: string
  userName?: string
  userId: number | string
  role?: string
}): Promise<AxiosResponse<IResponse<any>>> {
  return request({
    url: '/api/users/group-person/create/',
    method: 'post',
    data
  })
}

// 更新用户组人员
export function updateGroupPerson(id: number, data: {
  personName?: string
  role?: string
}): Promise<AxiosResponse<IResponse<any>>> {
  return request({
    url: `/api/users/group-person/update/${id}/`,
    method: 'post',
    data
  })
}

// 删除用户组人员
export function deleteGroupPerson(id: number): Promise<AxiosResponse<IResponse<any>>> {
  return request({
    url: `/api/users/group-person/delete/${id}/`,
    method: 'post',
    data: {}
  })
}

// 获取所有用户组人员
export function getAllGroupPersons(): Promise<AxiosResponse<IResponse<any[]>>> {
  return request({
    url: '/api/users/group-person/all/',
    method: 'get'
  })
}

// 根据ID获取用户组人员
export function getGroupPersonById(id: number): Promise<AxiosResponse<IResponse<any>>> {
  return request({
    url: `/api/users/group-person/${id}/`,
    method: 'get'
  })
}

// 根据组ID获取该组的所有人员
export function getGroupPersonsByGroupId(groupId: number): Promise<AxiosResponse<IResponse<any[]>>> {
  return request({
    url: `/api/users/group-person/by-group/${groupId}/`,
    method: 'get'
  })
}

// 搜索用户
export function searchUsers(name: string): Promise<AxiosResponse<IResponse<any[]>>> {
  return request({
    url: '/api/users/search/',
    method: 'post',
    data: {
      name
    }
  })
}

// 搜索用户组人员
export function searchGroupPersons(personName: string): Promise<AxiosResponse<IResponse<any[]>>> {
  return request({
    url: '/api/users/group-person/search/',
    method: 'post',
    data: {
      personName
    }
  })
}

// 分页查询用户组人员
export function getGroupPersonsPaginate(page: number, pageSize: number, search?: {
  personName?: string
  userName?: string
  groupId?: number
  role?: string
}): Promise<AxiosResponse<IResponse<any>>> {
  return request({
    url: '/api/users/group-person/paginate/',
    method: 'post',
    data: {
      page,
      pageSize,
      search: search || {}
    }
  })
}

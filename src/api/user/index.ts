// 获取用户列表（分页/查询）
export function getUserList(params?: any): Promise<AxiosResponse<IResponse<IUserListResponse>>> {
  return request({
    url: '/api/users/list/',
    method: 'post',
    data: params
  })
}
// 获取角色列表
export function getRoleList(): Promise<AxiosResponse<IResponse<Array<{id:number,name:string,description:string}>>>> {
  return request({
    url: '/api/users/get-role-list/',
    method: 'get'
  })
}
import request from '/@/utils/request'
import { AxiosResponse } from 'axios'

export interface IUserItem {
  user_id: number
  username: string
  email: string
  name: string | null
  phone: string | null
  create_time: string
  update_time: string
  status: string
  role: string
}

export interface IUserListResponse {
  data: IUserItem[]
  total: number
  page: number
  page_size: number
}

export function userList(): Promise<AxiosResponse<IResponse<IUserItem[]>>> {
  return request({
    url: '/api/user/list/',
    method: 'post',
    data: {}
  })
}

export function userCreate(payload: any): Promise<AxiosResponse<IResponse<IUserItem>>> {
  return request({
    url: '/api/user/create/',
    method: 'post',
    data: payload
  })
  }
  
  export function createUser(data: any): Promise<AxiosResponse<IResponse<any>>> {
    return request({
      url: '/api/users/create/',
      method: 'post',
      data: { ...data, password: '123456' }
    })
  }
export function userDetail(user_id: number): Promise<AxiosResponse<IResponse<IUserItem>>> {
  return request({
    url: '/api/user/detail/',
    method: 'post',
    data: { user_id }
  })
}

export function userUpdate(payload: any): Promise<AxiosResponse<IResponse<IUserItem>>> {
  return request({
    url: '/api/users/update/',
    method: 'post',
    data: payload
  })
}


export function userRoutes(): Promise<AxiosResponse<IResponse<any[]>>> {
  // ...实现或留空...
  return Promise.resolve({} as AxiosResponse<IResponse<any[]>>)
}
// 删除用户（单个或批量）
export function userDelete(payload: { user_id?: number|string, user_ids?: (number|string)[] }): Promise<AxiosResponse<IResponse<null>>> {
  return request({
    url: '/api/users/delete/',
    method: 'post',
    data: payload
  })
}

// 修改密码
export function changePassword(payload: { user_id: number | string; old_password: string; new_password: string }): Promise<AxiosResponse<IResponse<null>>> {
  return request({
    url: '/api/users/change-password/',
    method: 'post',
    data: payload
  })
}

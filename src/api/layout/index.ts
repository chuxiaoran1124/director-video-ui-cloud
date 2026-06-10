import request from '/@/utils/request'
import { AxiosResponse } from 'axios'
import { IMenubarList } from '/@/type/store/layout'

const api = {
    login: '/api/users/login/',
    getUser: '/api/User/getUser',
    getRouterList: '/api/users/get-route/',
    publickey: '/api/User/Publickey'
}

export interface loginParam {
    username: string,
    password: string
}

// 登录接口返回的数据结构
export interface ILoginRes {
    id?: number | string,
    user_id?: number | string,
    name: string,
    role: string,
    token: string
}

export function login(param: loginParam):Promise<AxiosResponse<IResponse<ILoginRes>>> {
    return request({
        url: api.login,
        method: 'post',
        data: param
    })
}

export function publickey():Promise<AxiosResponse<IResponse<string>>> {
    return request({
        url: api.publickey,
        method: 'get'
    })
}

interface IGetuserRes {
    id?: number | string
    user_id?: number | string
    name: string
    username?: string
    role: Array<string>
}

export function getUser(): Promise<AxiosResponse<IResponse<IGetuserRes>>> {
    return request({
        url: api.getUser,
        method: 'get'
    })
}
export function getRouterList(): Promise<AxiosResponse<IResponse<Array<IMenubarList>>>> {
    return request({
        url: api.getRouterList,
        method: 'get'
    })
}

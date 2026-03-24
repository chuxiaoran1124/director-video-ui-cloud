import request from '/@/utils/request'
import { AxiosResponse } from 'axios'

// --- 字典主项 (Dictionary) ---

/**
 * 分页查询字典列表
 */
export function getDictionaryPage(data: any): Promise<AxiosResponse<any>> {
    return request({
        url: '/api/system/dictionary/page/',
        method: 'post',
        data
    })
}

/**
 * 新增字典
 */
export function createDictionary(data: any): Promise<AxiosResponse<any>> {
    return request({
        url: '/api/system/dictionary/create/',
        method: 'post',
        data
    })
}

/**
 * 修改字典
 */
export function updateDictionary(id: number | string, data: any): Promise<AxiosResponse<any>> {
    return request({
        url: `/api/system/dictionary/update/${id}/`,
        method: 'post',
        data
    })
}

/**
 * 删除字典
 */
export function deleteDictionary(id: number | string): Promise<AxiosResponse<any>> {
    return request({
        url: `/api/system/dictionary/delete/${id}/`,
        method: 'get'
    })
}

// --- 字典项 (Dictionary Entry) ---

/**
 * 分页查询字典项
 */
export function getDictionaryEntryPage(data: any): Promise<AxiosResponse<any>> {
    return request({
        url: '/api/system/dictionary-entry/page/',
        method: 'post',
        data
    })
}

/**
 * 新增字典项
 */
export function createDictionaryEntry(data: any): Promise<AxiosResponse<any>> {
    return request({
        url: '/api/system/dictionary-entry/create/',
        method: 'post',
        data
    })
}

/**
 * 修改字典项
 */
export function updateDictionaryEntry(id: number | string, data: any): Promise<AxiosResponse<any>> {
    return request({
        url: `/api/system/dictionary-entry/update/${id}/`,
        method: 'post',
        data
    })
}

/**
 * 删除字典项
 */
export function deleteDictionaryEntry(id: number | string): Promise<AxiosResponse<any>> {
    return request({
        url: `/api/system/dictionary-entry/delete/${id}/`,
        method: 'get'
    })
}

/**
 * 根据 code 查询字典项列表 (全量)
 */
export function getDictionaryEntryListByCode(code: string): Promise<AxiosResponse<any>> {
    return request({
        url: '/api/system/dictionary-entry/list/',
        method: 'post',
        data: { code }
    })
}

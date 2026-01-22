import request from '/@/utils/request'

export function getVoices() {
    return request({
        url: '/api/material/getVoices',
        method: 'get',
        baseURL: ''
    })
}

export function getDigitalHumans() {
    return request({
        url: '/api/material/getDigitalHumans',
        method: 'get',
        baseURL: ''
    })
}

export function getRelations() {
    return request({
        url: '/api/material/getRelations',
        method: 'get',
        baseURL: ''
    })
}

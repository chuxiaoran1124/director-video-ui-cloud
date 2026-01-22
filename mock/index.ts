import { MockMethod } from 'vite-plugin-mock'
import { mock, Random } from 'mockjs'
import { login, setToken, checkToken, getUser, getRoute } from '/mock/response'
import { voices, digitalHumans, relations } from '/mock/data/material'

export interface IReq { 
    body: any; 
    query: any, 
    headers: any; 
}

Random.extend({
    tag: function() {
        const tag = ['家', '公司', '学校', '超市']
        return this.pick(tag)
    }
})
interface ITableList {
    list: Array<{
        date: string
        name: string
        address: string
        tag: '家' | '公司' | '学校' | '超市'
        amt: number
    }>
}
const tableList: ITableList = mock({
    // 属性 list 的值是一个数组，其中含有 1 到 10 个元素
    'list|100': [{
        // 属性 id 是一个自增数，起始值为 1，每次增 1
        'id|+1': 1,
        date: () => Random.date('yyyy-MM-dd'),
        name: () => Random.name(),
        address: () => Random.cparagraph(1),
        tag: () => Random.tag(),
        amt: () => Number(Random.float(-100000,100000).toFixed(2))
    }]
})

const responseData = (code: number, message: string, data: any) => {
    return {
        code: code,
        message: message,
        data: data
    }
}

export default [
    {
        url: '/api/User/getUser',
        method: 'get',
        timeout: 300,
        response: (req: IReq) => {
            const userName = checkToken(req)
            if(!userName) return responseData(401, '身份认证失败', '')
            return responseData(200, '', getUser(userName))
        }
    },
    {
        url: '/api/User/getRoute',
        method: 'get',
        timeout: 300,
        response: (req: IReq) => {
            const userName = checkToken(req)
            if(!userName) return responseData(401, '身份认证失败', '')
            return responseData(200, '', getRoute(userName))
        }
    },
    {
        url: '/api/getTableList',
        method: 'get',
        timeout: 600,
        response: (req: IReq) => {
            const userName = checkToken(req)
            if(!userName) return responseData(401, '身份认证失败', '')
            const { page, size, tag } = req.query
            const data = tag === '所有' ? tableList.list : tableList.list.filter(v => v.tag === tag)
            const d = {
                data: data.filter((v,i) => i >= (page - 1) * size && i < page * size),
                total: data.length
            }
            return responseData(200, '', d)
        }
    },
    {
        url: '/api/material/getVoices',
        method: 'get',
        timeout: 300,
        response: (req: IReq) => {
            const userName = checkToken(req)
            if(!userName) return responseData(401, '身份认证失败', '')
            return responseData(200, '', voices.list)
        }
    },
    {
        url: '/api/material/getDigitalHumans',
        method: 'get',
        timeout: 300,
        response: (req: IReq) => {
            const userName = checkToken(req)
            if(!userName) return responseData(401, '身份认证失败', '')
            return responseData(200, '', digitalHumans.list)
        }
    },
    {
        url: '/api/material/getRelations',
        method: 'get',
        timeout: 300,
        response: (req: IReq) => {
            const userName = checkToken(req)
            if(!userName) return responseData(401, '身份认证失败', '')
            return responseData(200, '', relations.list.map((rel: any) => {
                const voice = voices.list.find((v: any) => v.id === rel.voiceId)
                const dh = digitalHumans.list.find((d: any) => d.id === rel.digitalHumanId)
                return {
                    ...rel,
                    voiceName: voice ? voice.name : '未知声音',
                    digitalHumanName: dh ? dh.name : '未知数字人'
                }
            }))
        }
    }
] as MockMethod[]

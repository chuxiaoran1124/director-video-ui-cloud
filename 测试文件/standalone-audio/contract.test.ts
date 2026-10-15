import request from '/@/utils/request'
import { standaloneAudioApi, trainingPayload } from '/@/api/material/standaloneAudio'
jest.mock('/@/utils/request', () => ({ __esModule: true, default: jest.fn() }))
const send = request as jest.MockedFunction<any>

beforeEach(() => { send.mockReset(); send.mockResolvedValue({ data: { code: 200, data: { id: 9 } } }) })
test.each(['voice-training', 'audio-dubbing'] as const)('%s frozen endpoints and silent/local loading', async tool => {
    const api = standaloneAudioApi(tool)
    const query = { page: 2, pageSize: 20, search: { name: '测试', gender: 'female', taskStatus: 'uncertain' } }
    await api.paginate(query)
    await api.validateName('名称/甲 ?')
    await api.detail(9)
    await api.remove(9)
    await api.retry(9)
    const configs: any[] = send.mock.calls.map((call: any[]) => call[0])
    expect(configs.map(config => [config.method, config.url])).toEqual([
        ['post', `/api/material/${tool}/paginate/`],
        ['post', `/api/material/${tool}/validate-name/`],
        ['get', `/api/material/${tool}/9/`], ['delete', `/api/material/${tool}/9/`], ['post', `/api/material/${tool}/9/retry/`]
    ])
    expect(configs[0].data).toEqual(query)
    expect(configs[1].data).toEqual({ name: '名称/甲 ?' })
    configs.forEach(config => { expect(config.hideLoading).toBe(true); expect(config.silentError).toBe(true); expect(config.showLoading).not.toBe(true) })
})
test.each([400, 201, 500])('HTTP 200 with business code %s is not accepted as success', async code => {
    send.mockResolvedValue({ data: { code, message: 'internal-error' } })
    await expect(standaloneAudioApi('voice-training').create(new FormData())).rejects.toThrow('操作未成功')
})
test('missing business payload is rejected', async () => {
    send.mockResolvedValue({ data: { code: 200 } })
    await expect(standaloneAudioApi('voice-training').paginate({ page: 1, pageSize: 20, search: { name: '', gender: '', taskStatus: '' } })).rejects.toThrow('操作未成功')
})
test('training sends only fixed zh/a2e multipart contract and unwraps ApiResponse', async () => {
    const file = new File(['sample'], 'sample.m4a')
    const data = trainingPayload(' 样本 ', 'male', file, 'stable-key')
    const keys: string[] = []
    data.forEach((_value, key) => keys.push(key))
    expect(keys.sort()).toEqual(['file', 'gender', 'idempotencyKey', 'language', 'model', 'name'])
    expect(data.get('language')).toBe('zh')
    expect(data.get('model')).toBe('a2e')
    expect(data.get('name')).toBe('样本')
    expect(data.get('file')).toBe(file)
    expect(await standaloneAudioApi('voice-training').create(data)).toEqual({ id: 9 })
    expect(send.mock.calls[0][0].headers['Content-Type']).toBe('multipart/form-data')
})
test('dubbing sends numeric BusinessVoice id, English and standard speech rate', async () => {
    const data = { name: 'English', msg: 'Hello', voiceId: 23, language: 'en' as const, speechRate: 1, idempotencyKey: 'key' }
    await standaloneAudioApi('audio-dubbing').create(data)
    expect(send.mock.calls[0][0].data).toEqual(data)
    expect(send.mock.calls[0][0].headers).toBeUndefined()
})

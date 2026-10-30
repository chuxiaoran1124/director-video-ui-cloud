jest.mock('/@/utils/request', () => ({ __esModule: true, default: jest.fn() }))
import { audioBatchPayload } from '/@/components/AudioAssets/audioBatch'
import { audioAssetReady, unwrapAudioResponse, type AudioAsset } from '/@/api/material/audioAssets'

const asset = (id: number, source: 'uploaded' | 'generated' = 'uploaded'): AudioAsset => ({
  id, name: `audio-${id}`, source, status: 'ready', url: '/sample.mp3', duration: 30, sizeBytes: 50, createTime: ''
})
describe('音频叉乘契约', () => {
  it('多个形象共用一条音频，生成成品也可选择', () => {
    const p = audioBatchPayload('计划', [{ id: 1, name: 'A' }, { id: 2, name: 'B' }],
      [asset(1, 'generated')])
    expect(p.performerConfigs).toHaveLength(2)
    expect(p.performerConfigs.every(row => row.audioAssetId === 1)).toBe(true)
    expect(p.performerConfigs[0]).toEqual({ selectionMode: 'audio', digitalHumanId: 1, audioAssetId: 1 })
    expect(p.performerConfigs.every(row => !('voiceId' in row))).toBe(true)
    expect(p.script).toEqual({ source: 'audio', title: '音频驱动', content: '' })
  })
  it('同一记录重复选择不重复占用组合', () => {
    expect(audioBatchPayload('p', [{ id: 1, name: 'A' }, { id: 1, name: 'A' }],
      [asset(1), asset(1)]).performerConfigs).toHaveLength(1)
  })
  it('接受50项，拒绝超限，不静默截断', () => {
    const humans = Array.from({ length: 50 }, (_, id) => ({ id: id + 1, name: 'A' }))
    expect(audioBatchPayload('p', humans, [asset(1)]).performerConfigs).toHaveLength(50)
    expect(() => audioBatchPayload('p', [...humans, { id: 51, name: 'B' }], [asset(1)])).toThrow('50')
  })
  it('拒绝多条不同音频，防止旧UI多选流入提交', () => {
    expect(() => audioBatchPayload('p', [{ id: 1, name: 'A' }], [asset(1), asset(2)])).toThrow('一条共用音频')
  })
  it('未就绪预占项不允许提交', () => {
    const row = { ...asset(1), status: 'reserved' as const }
    expect(audioAssetReady(row)).toBe(false)
    expect(() => audioBatchPayload('p', [{ id: 1, name: 'A' }], [row])).toThrow('未就绪')
  })
  it('空输入不能提交', () => {
    expect(() => audioBatchPayload('', [{ id: 1, name: 'A' }], [asset(1)])).toThrow()
    expect(() => audioBatchPayload('p', [], [asset(1)])).toThrow()
    expect(() => audioBatchPayload('p', [{ id: 1, name: 'A' }], [])).toThrow()
  })
  it('兼容既有axios双层信封', () => {
    expect(unwrapAudioResponse({ data: { data: { id: 1 } } })).toEqual({ id: 1 })
    expect(unwrapAudioResponse({ data: { id: 1 } })).toEqual({ id: 1 })
  })
})

import { downloadFileByProxy } from '/@/api/material'
import { directVideoUrl, downloadVideoDirect, downloadVideoZip } from '../src/utils/download'

jest.mock('/@/api/material', () => ({ downloadFileByProxy: jest.fn() }))

const proxy = downloadFileByProxy as jest.Mock

beforeEach(() => {
  proxy.mockReset()
  ;(global as any).fetch = jest.fn()
  jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined)
  Object.defineProperty(window.URL, 'createObjectURL', { configurable: true, value: jest.fn(() => 'blob:test') })
  Object.defineProperty(window.URL, 'revokeObjectURL', { configurable: true, value: jest.fn() })
})

afterEach(() => jest.restoreAllMocks())

test('单个视频交给浏览器直连，不经过代理且拒绝非 HTTP 地址', () => {
  downloadVideoDirect('https://example.com/video.mp4')
  expect(HTMLAnchorElement.prototype.click).toHaveBeenCalledTimes(1)
  expect(proxy).not.toHaveBeenCalled()
  expect(() => directVideoUrl('javascript:alert(1)')).toThrow
})

test('ZIP 直连同时最多两条，逐条上报进度并完成压缩', async () => {
  let active = 0
  let peak = 0
  ;(global.fetch as jest.Mock).mockImplementation(async () => {
    active++
    peak = Math.max(peak, active)
    await new Promise(resolve => setTimeout(resolve, 10))
    active--
    return { ok: true, status: 200, blob: async () => new Blob(['video'], { type: 'video/mp4' }), headers: { get: () => 'video/mp4' } }
  })
  const phases: string[] = []
  const result = await downloadVideoZip(
    Array.from({ length: 5 }, (_, index) => ({ url: `https://example.com/${index}.mp4`, taskId: index, fileName: `${index}.mp4` })),
    'videos.zip',
    progress => phases.push(`${progress.phase}:${progress.completed}:${progress.percent}`)
  )
  expect(peak).toBe(2)
  expect(global.fetch).toHaveBeenCalledTimes(5)
  expect(proxy).not.toHaveBeenCalled()
  expect(result).toEqual({ success: 5, failed: 0, failedItems: [] })
  expect(phases).toContain('fetching:5:80')
  expect(phases[phases.length - 1]).toBe('done:5:100')
})

test('瞬时失败最多三次尝试，成功后不记为失败', async () => {
  ;(global.fetch as jest.Mock)
    .mockRejectedValueOnce(new TypeError('network'))
    .mockRejectedValueOnce(new TypeError('network'))
    .mockResolvedValueOnce({ ok: true, status: 200, blob: async () => new Blob(['video']), headers: { get: () => 'video/mp4' } })
  const result = await downloadVideoZip(
    [{ url: 'https://example.com/retry.mp4', taskId: 1, taskName: '重试任务', fileName: 'retry.mp4' }],
    'retry.zip',
    () => undefined
  )
  expect(global.fetch).toHaveBeenCalledTimes(3)
  expect(result).toEqual({ success: 1, failed: 0, failedItems: [] })
})

test('全部失败仍返回完整失败任务名称，永久404不重复请求', async () => {
  ;(global.fetch as jest.Mock).mockResolvedValue({ ok: false, status: 404, headers: { get: () => '' } })
  const result = await downloadVideoZip(
    [
      { url: 'https://example.com/a.mp4', taskId: 1, taskName: '失败任务A', fileName: 'a.mp4' },
      { url: 'https://example.com/b.mp4', taskId: 2, taskName: '失败任务B', fileName: 'b.mp4' }
    ],
    'failed.zip',
    () => undefined
  )
  expect(global.fetch).toHaveBeenCalledTimes(2)
  expect(result.success).toBe(0)
  expect(result.failed).toBe(2)
  expect(result.failedItems.map(item => item.item.taskName)).toEqual(['失败任务A', '失败任务B'])
})

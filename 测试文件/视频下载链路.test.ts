import { downloadFileByProxy } from '/@/api/material'
import { directVideoUrl, downloadVideoDirect, downloadVideoZip } from '../src/utils/download'

jest.mock('/@/api/material', () => ({ downloadFileByProxy: jest.fn() }))

const proxy = downloadFileByProxy as jest.Mock

beforeEach(() => {
  proxy.mockReset()
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

test('ZIP 代理同时最多两条，逐条上报进度并完成压缩', async () => {
  let active = 0
  let peak = 0
  proxy.mockImplementation(async () => {
    active++
    peak = Math.max(peak, active)
    await new Promise(resolve => setTimeout(resolve, 10))
    active--
    return { data: new Blob(['video'], { type: 'video/mp4' }), headers: { 'content-type': 'video/mp4' } }
  })
  const phases: string[] = []
  const result = await downloadVideoZip(
    Array.from({ length: 5 }, (_, index) => ({ url: `https://example.com/${index}.mp4`, taskId: index, fileName: `${index}.mp4` })),
    'videos.zip',
    progress => phases.push(`${progress.phase}:${progress.completed}:${progress.percent}`)
  )
  expect(peak).toBe(2)
  expect(proxy).toHaveBeenCalledTimes(5)
  expect(result).toEqual({ success: 5, failed: 0 })
  expect(phases).toContain('fetching:5:80')
  expect(phases[phases.length - 1]).toBe('done:5:100')
})

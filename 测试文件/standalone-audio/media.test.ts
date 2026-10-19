import { readSampleDuration } from '/@/components/StandaloneAudioTools/media'
let media: HTMLMediaElement
beforeEach(() => {
    jest.useFakeTimers()
    URL.createObjectURL = jest.fn(() => 'blob:sample')
    URL.revokeObjectURL = jest.fn()
    jest.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(() => {})
    const create = document.createElement.bind(document)
    jest.spyOn(document, 'createElement').mockImplementation((tag: string) => {
        const element = create(tag)
        if (tag === 'audio' || tag === 'video') media = element as HTMLMediaElement
        return element
    })
})
afterEach(() => { jest.restoreAllMocks(); jest.useRealTimers() })
test.each([10, 60])('accepts exact boundary %s seconds and releases the object URL once', async seconds => {
    const probe = readSampleDuration(new File(['audio'], 'sample.mp4'))
    expect(media.tagName).toBe('VIDEO')
    Object.defineProperty(media, 'duration', { value: seconds })
    media.dispatchEvent(new Event('loadedmetadata'))
    await expect(probe.promise).resolves.toBe(seconds)
    probe.cancel()
    expect(URL.revokeObjectURL).toHaveBeenCalledTimes(1)
})
test.each([9.999, 60.001, Infinity, NaN])('rejects invalid duration %s without rounding', async seconds => {
    const probe = readSampleDuration(new File(['audio'], 'sample.wav'))
    Object.defineProperty(media, 'duration', { value: seconds })
    media.dispatchEvent(new Event('loadedmetadata'))
    await expect(probe.promise).rejects.toThrow('10–60')
    expect(URL.revokeObjectURL).toHaveBeenCalledTimes(1)
})
test('cancels metadata probing on leaving the page', async () => {
    const probe = readSampleDuration(new File(['audio'], 'sample.m4a'))
    probe.cancel()
    await expect(probe.promise).rejects.toThrow('取消')
    expect(media.getAttribute('src')).toBeNull()
    expect(URL.revokeObjectURL).toHaveBeenCalledTimes(1)
})
test('metadata timeout and invalid media release resources', async () => {
    const probe = readSampleDuration(new File(['audio'], 'sample.mp3'))
    jest.advanceTimersByTime(15000)
    await expect(probe.promise).rejects.toThrow('超时')
    const invalid = readSampleDuration(new File(['bad'], 'broken.wav'))
    media.dispatchEvent(new Event('error'))
    await expect(invalid.promise).rejects.toThrow('无法读取')
})

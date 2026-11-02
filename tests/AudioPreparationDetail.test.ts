/// <reference path="../src/type/shims-vue.d.ts" />
import { defineComponent, nextTick, ref } from 'vue'
import { mount } from '@vue/test-utils'
import AudioPreparationDetail from '/@/components/StandaloneAudioTools/AudioPreparationDetail.vue'

const preparation = { id: 9, status: 'processing', originalUrl: '/original.mp3', referenceUrl: '/reference.mp3', processedUrl: '/processed.mp3', referenceText: '参考文案', targetText: '目标文案' }
let pause: jest.SpyInstance
let load: jest.SpyInstance
beforeEach(() => {
    pause = jest.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {})
    load = jest.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(() => {})
})
afterEach(() => jest.restoreAllMocks())
async function expand(wrapper: any) {
    wrapper.get('details').element.open = true
    await wrapper.get('details').trigger('toggle')
}
test('collapsed details mount no players; expansion mounts at most three with no preload/autoplay', async () => {
    const wrapper = mount(AudioPreparationDetail, { props: { preparation } })
    expect(wrapper.findAll('audio')).toHaveLength(0)
    await expand(wrapper)
    expect(wrapper.findAll('audio')).toHaveLength(3)
    wrapper.findAll('audio').forEach(audio => {
        expect(audio.attributes('preload')).toBe('none')
        expect(audio.attributes('autoplay')).toBeUndefined()
        expect(audio.attributes('aria-label')).toBeTruthy()
    })
    expect(wrapper.text()).toContain('参考文案')
    expect(wrapper.text()).toContain('目标文案')
    await wrapper.setProps({ preparation: { ...preparation, status: 'completed' } })
    expect((wrapper.get('details').element as HTMLDetailsElement).open).toBe(true)
    expect(wrapper.findAll('audio')).toHaveLength(3)
    expect(pause).not.toHaveBeenCalled()
    wrapper.unmount()
    expect(pause).toHaveBeenCalledTimes(3)
    expect(load).toHaveBeenCalledTimes(3)
})
test('signed URL refresh preserves expansion and unaffected source attributes', async () => {
    const wrapper = mount(AudioPreparationDetail, { props: { preparation } })
    await expand(wrapper)
    await wrapper.setProps({ preparation: { ...preparation, processedUrl: '/processed-new.mp3' } })
    expect((wrapper.get('details').element as HTMLDetailsElement).open).toBe(true)
    expect(wrapper.findAll('audio').map(audio => audio.attributes('src'))).toEqual(['/original.mp3', '/reference.mp3', '/processed-new.mp3'])
    wrapper.get('details').element.open = false
    await wrapper.get('details').trigger('toggle')
    expect(wrapper.findAll('audio')).toHaveLength(0)
    expect(pause).toHaveBeenCalledTimes(6)
    wrapper.unmount()
})
test('closing parent detail/route removes and releases playing audio', async () => {
    const visible = ref(true)
    const wrapper = mount(defineComponent({
        components: { AudioPreparationDetail },
        setup: () => ({ visible, preparation }),
        template: '<AudioPreparationDetail v-if="visible" :preparation="preparation" />'
    }))
    await expand(wrapper)
    const audios = wrapper.findAll('audio').map(audio => audio.element)
    visible.value = false
    await nextTick()
    expect(pause).toHaveBeenCalledTimes(3)
    expect(load).toHaveBeenCalledTimes(3)
    audios.forEach(audio => expect(audio.hasAttribute('src')).toBe(false))
    wrapper.unmount()
})
test('missing sources/text are harmless and raw backend messages are not exposed', async () => {
    const wrapper = mount(AudioPreparationDetail, { props: { preparation: { id: 1, status: 'failed', statusLabel: 'secret stack trace', errorCode: 'provider HTTP 400 token=test' } } })
    await expand(wrapper)
    expect(wrapper.findAll('audio')).toHaveLength(0)
    expect(wrapper.text()).toContain('请稍后刷新或联系管理员')
    expect(wrapper.text()).not.toMatch(/secret|HTTP 400|token=test/)
    wrapper.unmount()
})

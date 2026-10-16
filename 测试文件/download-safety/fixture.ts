import { createApp, h, reactive, ref } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import VideoZipProgress from '/@/components/VideoZipProgress.vue'
import { downloadVideoZip } from '/@/utils/downloadInteraction'
import { ZIP_DOWNLOAD_LIMITS } from '/@/utils/downloadSafety'
import { hasCriticalOperation } from '/@/utils/criticalOperation'
const defaults = { ...ZIP_DOWNLOAD_LIMITS }
const state = reactive({ done: false, mode: '', error: '', result: null as any })
createApp({ setup() {
    const visible = ref(false)
    const progress = reactive({ phase: 'fetching', completed: 0, total: 0, percent: 0 } as any)
    async function run(mode: string) {
        Object.assign(ZIP_DOWNLOAD_LIMITS, defaults)
        if (mode === 'write') Object.assign(ZIP_DOWNLOAD_LIMITS, { writeIdleMs: 150, writeTotalMs: 500, cleanupMs: 20 })
        if (mode === 'trickle') Object.assign(ZIP_DOWNLOAD_LIMITS, { idleMs: 100, itemMs: 240, cleanupMs: 20 })
        ;(window as any).showSaveFilePicker = mode === 'write'
            ? async () => ({ createWritable: async () => new WritableStream({ write: () => new Promise(() => {}) }) }) : undefined
        Object.assign(state, { done: false, mode, error: '', result: null })
        visible.value = true
        const names = mode === 'partial' ? ['a', 'b'] : [mode]
        try {
            state.result = await downloadVideoZip(names.map(name => ({ url: `${location.origin}/safety-media/${name}`, fileName: `${name}.mp4`, taskName: `测试文件-${name}` })), `test-${mode}.zip`, value => Object.assign(progress, value))
        } catch (error: any) { state.error = error.message }
        finally { state.done = true; visible.value = false }
    }
    ;(window as any).downloadFixture = { state, critical: hasCriticalOperation }
    return () => h('main', { style: 'padding:24px' }, [h('h1', '下载异常隔离验收'),
        ...['normal', 'partial', 'hold', 'write', 'trickle'].map(mode => h('button', { onClick: () => run(mode), disabled: visible.value }, mode)),
        h(VideoZipProgress, { ...progress, visible: visible.value })])
} }).use(ElementPlus).mount('#app')

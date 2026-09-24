const assert = require('node:assert/strict')
const { readFileSync } = require('node:fs')
const { join } = require('node:path')
const { test } = require('node:test')
const ts = require('typescript')

const calls = []
const request = (config) => { calls.push(config); return Promise.resolve({}) }
const source = readFileSync(join(__dirname, '..', 'src', 'api', 'material', 'index.ts'), 'utf8')
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText
const apiModule = { exports: {} }
new Function('require', 'module', 'exports', compiled)(
  (name) => {
    assert.equal(name, '/@/utils/request')
    return { __esModule: true, default: request }
  },
  apiModule,
  apiModule.exports
)
const api = apiModule.exports
const silent = { hideLoading: true, silentError: true }

for (const [name, invoke] of [
  ['批量数字人计划', () => api.getVideoBatchPlanList(2, 10, { planName: '测试' }, silent)],
  ['单条视频', () => api.getVideoTaskList(2, 10, {}, silent)],
  ['单条视频等待数', () => api.getVideoTaskWaiting(silent)],
  ['配音任务', () => api.getDubbingTaskList(1, 20, undefined, silent)],
  ['快速训练', () => api.getFastTaskList(2, 10, undefined, silent)],
  ['快速训练等待数', () => api.getFastTaskWaitingBefore(undefined, silent)],
  ['快速训练进度', () => api.getFastTaskDetail(1, silent)],
  ['角标任务', () => api.getCornerMarkTaskList(1, 20, undefined, silent)],
  ['角标批量任务', () => api.getCornerMarkBatchTaskList(1, 20, undefined, silent)],
  ['字幕消除任务', () => api.getSubtitleRemoveTaskList(1, 20, undefined, silent)]
]) {
  test(`${name}轮询传递静默配置`, () => {
    calls.length = 0
    invoke()
    assert.equal(calls.length, 1)
    assert.equal(calls[0].hideLoading, true)
    assert.equal(calls[0].silentError, true)
  })
}

test('显式加载保留默认全局反馈', () => {
  calls.length = 0
  api.getVideoTaskList(1, 20)
  assert.equal(calls.length, 1)
  assert.equal(calls[0].hideLoading, undefined)
})

for (const [name, relativePath, pattern] of [
  ['批量数字人计划', 'src/views/GenerateMaterials/GeneratePlan.vue', /setInterval\(refreshPlanListWhenVisible, 10000\)/],
  ['单条视频列表', 'src/views/GenerateMaterials/GenerateVideo.vue', /setInterval\([\s\S]*?loadVideoTasks\(true\)[\s\S]*?}, 10000\)/],
  ['快速训练列表', 'src/views/PriorDisposal/RapidGenerating.vue', /listPollTimer = setInterval\([\s\S]*?loadTaskList\(true\)[\s\S]*?}, 10000\)/],
  ['角标任务列表', 'src/views/PriorDisposal/AddCornerMark.vue', /pollingTimer = setInterval\([\s\S]*?loadCurrentList\(true\)[\s\S]*?}, 10000\)/],
  ['字幕消除列表', 'src/views/PriorDisposal/SubtitleRemove.vue', /pollingTimer = setInterval\([\s\S]*?loadTaskList\(true\)[\s\S]*?}, 10000\)/]
]) {
  test(`${name}使用10秒静默轮询`, () => {
    const viewSource = readFileSync(join(__dirname, '..', relativePath), 'utf8')
    assert.match(viewSource, pattern)
  })
}

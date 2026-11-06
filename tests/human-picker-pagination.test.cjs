const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const ts = require('typescript')

const source = fs.readFileSync(path.join(__dirname, '../src/views/GenerateMaterials/GenerateVideo.vue'), 'utf8')
const start = source.indexOf('let humanPickerRequestVersion = 0')
const end = source.indexOf('// 滚动到底部时自动加载', start)
assert(start >= 0 && end > start, 'could not find picker implementation')
const implementation = ts.transpileModule(source.slice(start, end) + '\nglobalThis.load = loadMoreHumans;', {
  compilerOptions: { target: ts.ScriptTarget.ES2020 }
}).outputText

function harness(request) {
  const state = { visible: true, search: '', gender: '', tag: '', page: 1, pageSize: 20, loading: false, hasMore: true, allList: [], displayList: [] }
  const messages = []
  const context = vm.createContext({
    humanSelectorDialog: state,
    getDigitalHumanPaginateList: request,
    videoForm: { videoType: 1, language: 'zh' },
    ElMessage: { error: (message) => messages.push(message) },
    console: { error: () => {} }
  })
  vm.runInContext(implementation, context)
  return { state, context, messages }
}

const response = (count, total, name = 'person') => ({ data: { data: { data: Array.from({ length: count }, () => ({ name })), total } } })
const deferred = () => { let resolve, reject; const promise = new Promise((yes, no) => { resolve = yes; reject = no }); return { promise, resolve, reject } }

async function main() {
  {
    let calls = 0
    const h = harness(async () => { calls++; return response(20, 20) })
    await h.context.load(); await h.context.load()
    assert.equal(calls, 1, 'a full final page must not request an invalid next page')
    assert.equal(h.state.hasMore, false)
  }
  {
    let calls = 0
    const h = harness(async () => { calls++; return calls === 1 ? response(20, 21) : response(1, 21) })
    await h.context.load(); await h.context.load()
    assert.equal(h.state.allList.length, 21)
    assert.equal(h.state.hasMore, false)
  }
  {
    const first = deferred(); let calls = 0
    const h = harness(() => { calls++; return first.promise })
    const pending = h.context.load(); await h.context.load()
    assert.equal(calls, 1, 'concurrent scroll must not duplicate requests')
    first.resolve(response(1, 1)); await pending
  }
  {
    const old = deferred(); const latest = deferred(); let calls = 0
    const h = harness(() => (++calls === 1 ? old.promise : latest.promise))
    const a = h.context.load()
    vm.runInContext('humanPickerRequestVersion++', h.context)
    Object.assign(h.state, { loading: false, allList: [], displayList: [], page: 1, hasMore: true })
    const b = h.context.load()
    latest.resolve(response(1, 1, 'new')); await b
    old.resolve(response(1, 1, 'old')); await a
    assert.deepEqual(Array.from(h.state.allList, item => item.name), ['new'], 'stale search must not overwrite new results')
  }
  {
    let calls = 0
    const h = harness(async () => { calls++; throw { invalidPage: true } })
    h.state.page = 2
    await h.context.load(); await h.context.load()
    assert.equal(calls, 1)
    assert.equal(h.state.hasMore, false)
    assert.equal(h.messages.length, 0)
  }
  console.log('5 picker pagination scenarios passed')
}
main().catch(error => { console.error(error); process.exitCode = 1 })

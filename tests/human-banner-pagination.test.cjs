const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const ts = require('typescript')
const source = fs.readFileSync(path.join(__dirname, '../src/views/PriorDisposal/MaterialManagement.vue'), 'utf8')
const start = source.indexOf('let bannerDHRequestVersion = 0')
const end = source.indexOf('const onBannerDHSearch', start)
assert(start >= 0 && end > start)
const code = ts.transpileModule(source.slice(start, end) + '\nglobalThis.load = loadBannerDHOptions;', {
  compilerOptions: { target: ts.ScriptTarget.ES2020 }
}).outputText
function harness(request) {
  const context = vm.createContext({
    bannerDHLoading: { value: false }, bannerDHPage: { page: 1, pageSize: 20, hasMore: true },
    bannerDHOptions: { value: [] }, bannerDHSearchKeyword: { value: '' },
    getDigitalHumanPaginateList: request, console: { error: () => {} }
  })
  vm.runInContext(code, context)
  return context
}
const response = (count, total, label) => ({ data: { code: 200, data: { data: Array.from({ length: count }, (_, i) => ({ id: i, label })), total } } })
const deferred = () => { let resolve; const promise = new Promise(yes => { resolve = yes }); return { promise, resolve } }
async function main() {
  {
    let calls = 0
    const h = harness(async () => { calls++; return response(20, 20, 'final') })
    await h.load(true); await h.load(false)
    assert.equal(calls, 1)
    assert.equal(h.bannerDHPage.hasMore, false)
  }
  {
    const old = deferred(); const latest = deferred(); let calls = 0
    const h = harness(() => (++calls === 1 ? old.promise : latest.promise))
    const a = h.load(true); const b = h.load(true)
    latest.resolve(response(1, 1, 'new')); await b
    old.resolve(response(1, 1, 'old')); await a
    assert.equal(h.bannerDHOptions.value[0].label, 'new')
    assert.equal(h.bannerDHLoading.value, false)
  }
  console.log('2 banner pagination scenarios passed')
}
main().catch(error => { console.error(error); process.exitCode = 1 })

const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const ts = require('typescript')

const source = fs.readFileSync(path.join(__dirname, '../src/views/PriorDisposal/MaterialManagement.vue'), 'utf8')
const start = source.indexOf('let digitalHumanRequestVersion = 0')
const end = source.indexOf('const resetVoiceSearch', start)
assert(start >= 0 && end > start)
const code = ts.transpileModule(source.slice(start, end) + '\nglobalThis.fetch = fetchDigitalHumans; globalThis.genderChange = onDHGenderChange;', {
  compilerOptions: { target: ts.ScriptTarget.ES2020 }
}).outputText

function harness(request) {
  const context = vm.createContext({
    dhPage: { currentPage: 1, pageSize: 10 }, searchDH: { value: '' }, filterDHGender: { value: '' },
    digitalHumans: { value: [] }, digitalHumansTotal: { value: 0 },
    getDigitalHumanPaginateList: request, console: { error: () => {} }
  })
  vm.runInContext(code, context)
  return context
}
const response = (name) => ({ data: { code: 200, data: { data: [{ name }], total: 1 } } })
const deferred = () => { let resolve; const promise = new Promise(yes => { resolve = yes }); return { promise, resolve } }

async function main() {
  {
    const h = harness(async () => { throw { invalidPage: true } })
    h.dhPage.currentPage = 5
    await h.fetch()
    assert.equal(h.dhPage.currentPage, 1, 'an invalid page returns to the first valid page')
  }
  {
    const h = harness(async () => response('first'))
    h.dhPage.currentPage = 5
    h.genderChange()
    assert.equal(h.dhPage.currentPage, 1, 'changing gender must not retain a stale page')
  }
  {
    const old = deferred(); const latest = deferred(); let calls = 0
    const h = harness(() => (++calls === 1 ? old.promise : latest.promise))
    const a = h.fetch(); const b = h.fetch()
    latest.resolve(response('new')); await b
    old.resolve(response('old')); await a
    assert.equal(h.digitalHumans.value[0].name, 'new', 'stale results must not overwrite a newer search')
  }
  console.log('3 management pagination scenarios passed')
}
main().catch(error => { console.error(error); process.exitCode = 1 })

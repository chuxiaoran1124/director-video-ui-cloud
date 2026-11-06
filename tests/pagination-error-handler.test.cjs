const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const ts = require('typescript')

const source = fs.readFileSync(path.join(__dirname, '../src/utils/request.ts'), 'utf8')
const start = source.indexOf('const errorHandler = async')
const end = source.indexOf('request.interceptors.request.use', start)
assert(start >= 0 && end > start)
const implementation = ts.transpileModule(source.slice(start, end) + '\nglobalThis.handle = errorHandler;', {
  compilerOptions: { target: ts.ScriptTarget.ES2020 }
}).outputText
const notifications = []
const context = vm.createContext({
  normalizeErrorMessage: () => 'masked',
  buildRejectedError: (message, rawMessage, status) => Object.assign(new Error(message), { rawMessage: message, status }),
  ElNotification: (event) => notifications.push(event),
  SILENT_GATEWAY_STATUSES: new Set([504]),
  AUTH_ENDPOINT_PATTERN: /never-match/,
  canRefreshRequest: () => false,
  Promise
})
vm.runInContext(implementation, context)

async function call(status, detail, silentInvalidPage) {
  try {
    await context.handle({ config: { silentInvalidPage }, response: { status, data: { detail } }, message: 'network error' })
    assert.fail('expected rejection')
  } catch (error) { return error }
}

async function main() {
  let err = await call(404, '无效页面。', true)
  assert.equal(err.invalidPage, true)
  assert.equal(notifications.length, 0)
  assert.equal(err.response, undefined, 'the original response must not be exposed')
  err = await call(404, 'different internal error', true)
  assert.equal(err.invalidPage, false)
  assert.equal(notifications.length, 1, 'other 404s must remain visible')
  err = await call(404, '无效页面。', false)
  assert.equal(err.invalidPage, true)
  assert.equal(notifications.length, 2, 'non-opted-in requests must retain notifications')
  err = await call(500, '无效页面。', true)
  assert.equal(err.invalidPage, false)
  assert.equal(notifications.length, 3, 'other status codes must remain visible')
  console.log('4 pagination error-handler scenarios passed')
}
main().catch(error => { console.error(error); process.exitCode = 1 })

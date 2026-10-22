// Runs the actual route guard with isolated storage/session doubles. No network.
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const ts = require('typescript')

const root = path.resolve(__dirname, '../..')
const source = fs.readFileSync(path.join(root, 'src/permission.ts'), 'utf8')
const code = ts.transpileModule(source.replace(/import\.meta\.env\.VITE_APP_TITLE/g, "'test'"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 }
}).outputText

async function navigate(routePath, query, session) {
    let guard
    let bootstrapCalls = 0
    let clearCalls = 0
    const oldToken = session === 'fresh' ? '' : 'test-only-old-token'
    const store = {
        getStatus: { ACCESS_TOKEN: oldToken, isRoutesLoaded: false },
        getMenubar: { menuList: [] },
        getTags: { tagsList: [], cachedViews: [] },
        bootstrapSession: async () => {
            bootstrapCalls++
            if (session !== 'valid') throw new Error('Simulated expired or missing session')
        },
        clearAuthState: () => { clearCalls++; store.getStatus.ACCESS_TOKEN = '' },
        getDefaultLandingPath: () => '/test-home',
        changeTagNavList() {},
        addCachedViews() {},
        changeNocacheViewStatus() {}
    }
    const router = { beforeEach: fn => { guard = fn }, afterEach() {}, resolve: () => ({ matched: [{}] }) }
    vm.runInNewContext(code, {
        exports: {}, document: {},
        sessionStorage: { getItem: key => key === 'accessToken' ? oldToken : null },
        require: name => {
            if (name === '/@/router') return { default: router }
            if (name === 'nprogress') return { configure() {}, done() {}, start() {} }
            if (name === '/@/utils/tools') return { encode: encodeURIComponent }
            if (name === '/@/store/modules/layout') return { useLayoutStore: () => store }
            throw new Error('Unexpected import: ' + name)
        }
    })
    const result = await guard({ path: routePath, fullPath: routePath, query, meta: {}, matched: [{}] }, { path: '/' })
    return { result, bootstrapCalls, clearCalls }
}

;(async () => {
    let count = 0
    for (const session of ['fresh', 'expired', 'valid']) {
        for (const entryPath of ['/link-entry', '/platform-login-entry']) {
            assert.deepEqual(await navigate(entryPath, {}, session), { result: true, bootstrapCalls: 0, clearCalls: 0 })
            count++
        }
        for (const entry of ['link', 'platform']) {
            for (const query of [{ entry, grant: 'test-only-grant' }, { entry }]) {
                assert.deepEqual(await navigate('/login', query, session), { result: true, bootstrapCalls: 0, clearCalls: 0 })
                count++
            }
        }
    }
    for (const session of ['fresh', 'expired']) {
        const protectedPage = await navigate('/generate-materials/video-batch', {}, session)
        assert.match(protectedPage.result, /^\/login\?from=/)
        assert.equal(protectedPage.bootstrapCalls, 1)
        assert.equal((await navigate('/login', {}, session)).result, true)
        count += 2
    }
    assert.equal((await navigate('/login', {}, 'valid')).result, '/test-home')
    assert.equal((await navigate('/generate-materials/video-batch', {}, 'valid')).result, true)
    count += 2
    console.log(`PASS ${count} login-entry guard scenarios; no network or real credentials used.`)
})().catch(error => { console.error(error); process.exitCode = 1 })

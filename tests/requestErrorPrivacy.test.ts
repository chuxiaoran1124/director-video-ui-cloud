import fs from 'fs'
import path from 'path'
import ts from 'typescript'

const source = fs.readFileSync(path.resolve(__dirname, '../src/utils/request.ts'), 'utf8')
const tree = ts.createSourceFile('request.ts', source, ts.ScriptTarget.Latest, true)
const names = new Set(['GENERIC_MASKED_ERROR_MESSAGE', 'ORIGINAL_MESSAGE_URL_PATTERNS', 'ORIGINAL_MESSAGE_WHITELIST',
    'shouldMaskErrorMessage', 'shouldKeepOriginalMessage', 'normalizeErrorMessage', 'buildRejectedError'])
const selected = tree.statements.filter(node => ts.isVariableStatement(node)
    && node.declarationList.declarations.some(decl => names.has(decl.name.getText(tree))))
const compiled = ts.transpileModule(selected.map(node => node.getText(tree)).join('\n'), {
    compilerOptions: { target: ts.ScriptTarget.ES2019, module: ts.ModuleKind.CommonJS }
}).outputText
const make = (getStore: () => any) => new Function('useLayoutStore', compiled + '\nreturn {normalizeErrorMessage,buildRejectedError};')(getStore)

test.each([undefined, false, 'true', 1])('only verified boolean platform administrator exposes details: %s', flag => {
    const api = make(() => ({getUserInfo: {isPlatformSuperAdmin: flag}, getStatus: {ACCESS_TOKEN: ''}}))
    const message = api.normalizeErrorMessage('private provider error', {url: '/material/voice-training/'})
    expect(message).toBe('请求失败，请联系管理员')
    expect(api.buildRejectedError(message, 'private provider error', 503).rawMessage).toBe(message)
})
test('store initialization failure is fail-closed', () => {
    expect(make(() => { throw new Error('not initialized') }).normalizeErrorMessage('private')).toBe('请求失败，请联系管理员')
})
test('platform admin retains diagnostics; normal login authorization hints are preserved', () => {
    expect(make(() => ({getUserInfo: {isPlatformSuperAdmin: true}})).normalizeErrorMessage('provider detail')).toBe('provider detail')
    expect(make(() => ({getUserInfo: {}})).normalizeErrorMessage('链接授权已过期，请联系管理员', {url:'/user/login/'})).toBe('链接授权已过期，请联系管理员')
})

test.each(['GenerateVideo.vue', 'GeneratePlan.vue'])('%s preview diagnostics require platform privilege', filename => {
    const page = fs.readFileSync(path.resolve(__dirname, '../src/views/GenerateMaterials', filename), 'utf8')
    expect(page).toContain("layoutStore.getUserInfo.isPlatformSuperAdmin === true ? '视频直连预览失败，请检查 TOS 公网访问配置' : '视频预览失败，请稍后重试或联系管理员'")
})

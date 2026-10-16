// Run: node 测试文件/standalone-audio/browser.test.cjs
const assert = require('assert/strict')
const path = require('path')
const fs = require('fs')
const { createServer } = require('vite')
const vue = require('@vitejs/plugin-vue')
const { chromium } = require('playwright')
const root = path.resolve(__dirname, '../..')
const artifactDir = path.join(root, 'output/playwright/standalone-audio')
const wav = (seconds = 10) => {
    const bytes = Buffer.alloc(44 + 8000 * 2 * seconds)
    bytes.write('RIFF', 0); bytes.writeUInt32LE(bytes.length - 8, 4); bytes.write('WAVEfmt ', 8)
    bytes.writeUInt32LE(16, 16); bytes.writeUInt16LE(1, 20); bytes.writeUInt16LE(1, 22)
    bytes.writeUInt32LE(8000, 24); bytes.writeUInt32LE(16000, 28); bytes.writeUInt16LE(2, 32); bytes.writeUInt16LE(16, 34)
    bytes.write('data', 36); bytes.writeUInt32LE(bytes.length - 44, 40)
    return bytes
}
async function main() {
    const server = await createServer({
        configFile: false, root, cacheDir: path.join(root, '.codex-temp/audio-vite-cache'),
        optimizeDeps: { entries: ['测试文件/standalone-audio/fixture.html'] },
        resolve: { alias: [
            { find: '/@/store/modules/layout', replacement: path.join(__dirname, 'layout.fixture.ts') },
            { find: '/@', replacement: path.join(root, 'src') }
        ] },
        plugins: [vue(), { name: 'test-audio', configureServer(server) {
            server.middlewares.use('/fixture-audio.wav', (_request, response) => { response.setHeader('Content-Type', 'audio/wav'); response.end(wav()) })
        } }],
        server: { host: '127.0.0.1', port: 0 },
        define: { __APP_BUILD_ID__: JSON.stringify('audio-fixture') },
        css: { postcss: { plugins: [] } }
    })
    let browser
    let debugPage
    try {
        await server.listen()
        browser = await chromium.launch({ headless: true, channel: 'msedge' })
        const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, acceptDownloads: true })
        const page = await context.newPage()
        debugPage = page
        // Exercise the bounded-memory browser-download fallback; disk streaming has dedicated ZIP unit tests.
        await page.addInitScript(() => { window.showSaveFilePicker = undefined })
        const errors = []
        page.on('pageerror', error => errors.push(error.message))
        await page.route('**/*', route => {
            if (new URL(route.request().url()).hostname === '127.0.0.1') return route.continue()
            return route.abort()
        })
        const address = server.httpServer.address()
        await page.goto(`http://127.0.0.1:${address.port}/测试文件/standalone-audio/fixture.html`)
        await page.getByRole('heading', { name: '声音训练' }).waitFor()
        await page.locator('.el-table__body tr').first().waitFor()
        if (process.argv.includes('--visual-only')) {
            await page.evaluate(() => window.audioFixture.navigate('/generate-materials/audio-dubbing'))
            await page.setViewportSize({ width: 390, height: 844 })
            fs.mkdirSync(artifactDir, { recursive: true })
            await page.waitForTimeout(500)
            await page.screenshot({ path: path.join(artifactDir, 'mobile.png'), fullPage: true })
            await page.getByRole('button', { name: '新建配音生成' }).click()
            await page.getByRole('dialog').getByPlaceholder('请选择云端声音').waitFor()
            await page.waitForTimeout(500)
            await page.screenshot({ path: path.join(artifactDir, 'mobile-dubbing-form.png'), fullPage: true })
            assert.deepEqual(errors, [])
            console.log('PASS final mobile visual capture')
            return
        }
        await page.getByRole('button', { name: '新建声音训练' }).click()
        const dialog = page.getByRole('dialog')
        await dialog.getByPlaceholder('请输入名称').fill('中文样本')
        await dialog.getByLabel('上传中文声音样本').setInputFiles({ name: 'sample.wav', mimeType: 'audio/wav', buffer: wav(10) })
        await dialog.getByText('sample.wav · 10.0 秒').waitFor()
        await page.evaluate(() => { window.audioFixture.state.holdCreate = true })
        await dialog.getByRole('button', { name: '提交任务', exact: true }).click()
        await dialog.getByText('正在上传并创建训练任务，请勿关闭页面…').waitFor()
        assert.equal(await page.evaluate(() => window.audioFixture.critical()), true)
        assert.equal(await dialog.getByRole('button', { name: '取消', exact: true }).isDisabled(), true)
        const training = await page.evaluate(() => window.audioFixture.state.requests.find(item => item.url.includes('/voice-training/create/')))
        assert.equal(training.data.language, 'zh'); assert.equal(training.data.model, 'a2e'); assert.equal(training.data.gender, 'male')
        assert.equal(training.data.file.name, 'sample.wav'); assert.ok(training.data.idempotencyKey)
        await page.evaluate(() => { window.audioFixture.state.holdCreate = false; window.audioFixture.releaseCreate() })
        await dialog.waitFor({ state: 'hidden' })
        assert.equal(await page.evaluate(() => window.audioFixture.critical()), false)

        // Stable selection remains after a real ten-second poll and row object replacement.
        const firstRow = page.locator('.el-table__body tr').first()
        await firstRow.locator('.el-checkbox').click()
        await page.evaluate(() => { window.audioFixture.state.status = '2' })
        await page.waitForFunction(() => window.audioFixture.state.requests.filter(item => item.url.endsWith('/voice-training/paginate/')).length >= 3, { timeout: 16000 })
        await page.getByText('样本1：已完成', { exact: true }).waitFor()
        assert.equal(await firstRow.locator('.el-checkbox').getAttribute('class').then(value => value.includes('is-checked')), true)
        assert.equal(await page.locator('.el-loading-mask:visible').count(), 0)
        fs.mkdirSync(artifactDir, { recursive: true })
        await page.screenshot({ path: path.join(artifactDir, 'desktop-training.png'), fullPage: true })
        assert.equal(await page.locator('.el-table__body tr').nth(2).getByRole('button', { name: '重试', exact: true }).count(), 0)
        const failedRow = page.locator('.el-table__body tr').nth(3)
        await failedRow.getByRole('button', { name: '详情', exact: true }).click()
        const detailDialog = page.getByRole('dialog', { name: '任务详情' })
        await detailDialog.getByText('生成失败，请重试或联系管理员', { exact: true }).waitFor()
        assert.equal(await detailDialog.getByText('INTERNAL_TOKEN_SHOULD_NOT_LEAK').count(), 0)
        await detailDialog.locator('.el-dialog__headerbtn').click()
        await failedRow.getByRole('button', { name: '重试', exact: true }).click()
        await page.waitForFunction(() => window.audioFixture.state.requests.some(item => item.url.endsWith('/4/retry/')))

        // Direct media and low-memory streaming ZIP reuse, without any backend download proxy.
        await firstRow.getByRole('button', { name: '试听', exact: true }).click()
        await page.locator('audio').waitFor()
        await page.waitForFunction(() => document.querySelector('audio')?.readyState >= 2)
        await page.evaluate(() => window.audioFixture.navigate('/away'))
        assert.equal(await page.locator('audio').count(), 0)
        const listCount = await page.evaluate(() => window.audioFixture.state.requests.length)
        await page.waitForTimeout(10500)
        assert.equal(await page.evaluate(() => window.audioFixture.state.requests.length), listCount)
        await page.evaluate(() => window.audioFixture.navigate('/prior-disposal/voice-training'))
        await page.locator('.el-table__body tr').first().waitFor()
        await firstRow.locator('.el-checkbox').click()
        if (!await firstRow.locator('.el-checkbox').getAttribute('class').then(value => value.includes('is-checked'))) await firstRow.locator('.el-checkbox').click()
        const downloadPromise = page.waitForEvent('download')
        await page.getByRole('button', { name: /批量下载/ }).click()
        const download = await downloadPromise
        assert.ok(download.suggestedFilename().endsWith('.zip'))
        await page.getByText(/已生成 ZIP 并发起浏览器保存 1 项/).waitFor()
        const resultDialog = page.getByRole('dialog', { name: '下载结果' })
        await page.waitForTimeout(3500)
        assert.equal(await resultDialog.isVisible(), true)
        await resultDialog.getByRole('button', { name: '知道了' }).click()
        await page.locator('.el-table__body tr').nth(4).getByRole('button', { name: '删除', exact: true }).click()
        await page.locator('.el-message-box').getByRole('button', { name: '删除', exact: true }).click()
        await page.waitForFunction(() => window.audioFixture.state.deleted.includes(5))

        // Page state also survives a hard refresh, independently of filters.
        await page.locator('.el-pagination .number').getByText('2', { exact: true }).click()
        await page.waitForFunction(() => window.audioFixture.state.requests.filter(item => item.url.endsWith('/voice-training/paginate/')).at(-1)?.data.page === 2)
        await page.reload()
        await page.waitForFunction(() => window.audioFixture?.state.requests[0]?.data.page === 2)

        // Enter search, dropdown-immediate filtering and hard-refresh persistence.
        await page.getByPlaceholder('按名称搜索').fill('样本2')
        await page.getByPlaceholder('按名称搜索').press('Enter')
        await page.waitForFunction(() => window.audioFixture.state.requests.filter(item => item.url.endsWith('/voice-training/paginate/')).at(-1)?.data.search.name === '样本2')
        await page.locator('.toolbar .el-select').first().click()
        await page.locator('.el-select-dropdown:visible .el-select-dropdown__item').getByText('女', { exact: true }).click()
        await page.waitForFunction(() => window.audioFixture.state.requests.filter(item => item.url.endsWith('/voice-training/paginate/')).at(-1)?.data.search.gender === 'female')
        await page.reload()
        await page.getByRole('heading', { name: '声音训练' }).waitFor()
        assert.equal(await page.getByPlaceholder('按名称搜索').inputValue(), '样本2')
        await page.waitForFunction(() => window.audioFixture.state.requests[0]?.data.search.gender === 'female')
        await page.evaluate(() => { window.audioFixture.layout.getUserInfo.tenantId = 2 })
        await page.waitForFunction(() => window.audioFixture.state.requests.filter(item => item.url.endsWith('/voice-training/paginate/')).at(-1)?.data.search.name === '')
        assert.equal(await page.getByPlaceholder('按名称搜索').inputValue(), '')

        // English dubbing uses accessible numeric BusinessVoice id; duplicate name feedback and idempotent retry.
        await page.evaluate(() => window.audioFixture.navigate('/generate-materials/audio-dubbing'))
        await page.getByRole('button', { name: '新建配音生成' }).click()
        await dialog.getByPlaceholder('请输入名称').fill('重复名称')
        await dialog.getByPlaceholder('请输入名称').blur()
        await dialog.getByRole('button', { name: '使用推荐名称：推荐名称' }).click()
        await dialog.getByText('名称可用', { exact: true }).waitFor()
        await dialog.getByPlaceholder('请选择云端声音').click()
        await page.locator('.el-select-dropdown:visible .el-select-dropdown__item').getByText('云端声音甲', { exact: true }).click()
        await dialog.getByPlaceholder('全部性别').click()
        await page.locator('.el-select-dropdown:visible .el-select-dropdown__item').getByText('女', { exact: true }).click()
        await page.waitForFunction(() => window.audioFixture.state.requests.filter(item => item.url.includes('/voice/paginate/')).at(-1)?.data.search.gender === 'female')
        await dialog.getByRole('button', { name: '下一页', exact: true }).click()
        await page.waitForFunction(() => window.audioFixture.state.requests.filter(item => item.url.includes('/voice/paginate/')).at(-1)?.data.page === 2)
        assert.equal(await dialog.getByPlaceholder('请选择云端声音').inputValue(), '云端声音甲')
        await dialog.getByRole('button', { name: '试听', exact: true }).click()
        await page.waitForFunction(() => document.querySelector('.voice-picker audio')?.readyState >= 2)
        await dialog.getByRole('button', { name: '停止试听', exact: true }).click()
        assert.equal(await dialog.locator('audio').count(), 0)
        await dialog.getByText('英文', { exact: true }).click()
        await dialog.getByPlaceholder('请输入配音文案').fill('Hello cloud audio')
        await dialog.getByRole('button', { name: '试听', exact: true }).click()
        await page.waitForFunction(() => document.querySelector('.voice-picker audio')?.readyState >= 2)
        await page.evaluate(() => { window.audioFixture.state.failNextCreate = true })
        await dialog.getByRole('button', { name: '提交任务', exact: true }).click()
        await page.getByText(/保持内容不变重试可避免重复创建/).waitFor()
        await dialog.getByRole('button', { name: '提交任务', exact: true }).click()
        await dialog.waitFor({ state: 'hidden' })
        assert.equal(await page.locator('.voice-picker audio').count(), 0)
        const creates = await page.evaluate(() => window.audioFixture.state.requests.filter(item => item.url.includes('/audio-dubbing/create/')))
        assert.equal(creates.length, 2)
        assert.equal(creates[0].data.voiceId, 201); assert.equal(creates[0].data.language, 'en'); assert.equal(creates[0].data.speechRate, 1)
        assert.equal(creates[0].data.idempotencyKey, creates[1].data.idempotencyKey)
        assert.equal(creates[0].data.name, '推荐名称')
        assert.equal(await page.evaluate(() => window.audioFixture.state.maxListActive), 1)
        assert.equal(await page.evaluate(() => window.audioFixture.state.requests.some(item => /proxy|download/.test(item.url))), false)
        await page.setViewportSize({ width: 390, height: 844 })
        await page.waitForTimeout(3500)
        await page.screenshot({ path: path.join(artifactDir, 'mobile.png'), fullPage: true })
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true)
        await page.getByRole('button', { name: '新建配音生成' }).click()
        await dialog.getByPlaceholder('请选择云端声音').waitFor()
        await page.waitForTimeout(500)
        await page.screenshot({ path: path.join(artifactDir, 'mobile-dubbing-form.png'), fullPage: true })
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true)
        await dialog.getByRole('button', { name: '取消', exact: true }).click()
        assert.deepEqual(errors, [])
        console.log('PASS real-browser: training upload/loading, fixed contract, polling, stable selection, lifecycle, direct playback, ZIP, filters/tenant isolation, Chinese/English dubbing, recommended names, idempotent retry, mobile')
    } catch (error) {
        if (debugPage) console.error('Browser diagnostic:', await debugPage.evaluate(() => ({ dialog: document.querySelector('[role=dialog]')?.textContent, requests: window.audioFixture?.state.requests.slice(-5) })))
        throw error
    } finally { if (browser) await browser.close(); await server.close() }
}
main().catch(error => { console.error(error); process.exitCode = 1 })

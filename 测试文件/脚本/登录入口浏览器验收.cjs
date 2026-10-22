// Exercise the production build with a local-only API fixture; never contact production.
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const http = require('node:http')
const { chromium } = require('playwright')
const root = path.resolve(__dirname, '../..')
const dist = path.join(root, 'dist')
const output = path.join(root, 'output/playwright/login-entry-20261022')
const mime = { '.js': 'application/javascript', '.css': 'text/css', '.html': 'text/html', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2' }
const server = http.createServer((req, res) => {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname)
    let file = path.resolve(dist, '.' + pathname)
    if (!file.startsWith(dist + path.sep) && file !== dist) { res.writeHead(403).end(); return }
    if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(dist, 'index.html')
    res.setHeader('Content-Type', mime[path.extname(file)] || 'application/octet-stream')
    fs.createReadStream(file).pipe(res)
})

;(async () => {
    fs.mkdirSync(output, { recursive: true })
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
    const origin = `http://127.0.0.1:${server.address().port}`
    let browser
    const results = []
    try {
        browser = await chromium.launch({ channel: 'chrome', headless: true })
        for (const test of [
            { name: 'fresh-link', entry: 'link', state: 'fresh' },
            { name: 'expired-session-link', entry: 'link', state: 'expired' },
            { name: 'other-session-link', entry: 'link', state: 'valid' },
            { name: 'expired-session-platform', entry: 'platform', state: 'expired' },
            { name: 'expired-link-rejected', entry: 'link', state: 'expired', deny: '链接授权已过期，请联系管理员' },
            { name: 'revoked-link-rejected', entry: 'link', state: 'expired', deny: '链接授权已撤销，请联系管理员' },
            { name: 'missing-grant-rejected', entry: 'login', state: 'expired' }
        ]) {
            const context = await browser.newContext()
            try {
                if (test.state !== 'fresh') {
                    await context.addInitScript(() => sessionStorage.setItem('accessToken', 'fixture-expired-access'))
                    await context.addCookies([{ name: 'fixture_session', value: test.state, url: origin }])
                }
                let activations = 0, refreshCalls = 0, unexpected = 0
                await context.route('**/*', async route => {
                    const url = new URL(route.request().url())
                    if (url.origin !== origin) { await route.abort(); return }
                    if (!url.pathname.startsWith('/api/')) { await route.continue(); return }
                    const respond = (code, data, message = '') => route.fulfill({ status: code, contentType: 'application/json', body: JSON.stringify({ code, data, message }) })
                    if (url.pathname.endsWith('/activate/')) {
                        activations++
                        return test.deny ? respond(403, null, test.deny) : respond(200, { granted: true, grantToken: 'fixture-grant' })
                    }
                    if (url.pathname.endsWith('/platform-login-entry/status/')) return respond(200, { granted: url.searchParams.get('grantToken') === 'fixture-grant' })
                    if (url.pathname.endsWith('/temporary-access/current-ip/')) return respond(200, { clientIp: '127.0.0.1' })
                    if (url.pathname.endsWith('/refresh-token/')) { refreshCalls++; return respond(401, null, 'fixture expired session') }
                    unexpected++
                    return respond(403, null, 'fixture denies unexpected API')
                })
                const page = await context.newPage()
                const target = test.entry === 'link' ? '/?ticket=fixture-ticket#/link-entry' : test.entry === 'platform' ? '/?token=fixture-token#/platform-login-entry' : '/#/login?entry=link'
                await page.goto(origin + target)
                if (test.deny) {
                    await page.getByText('当前访问链接不可用', { exact: true }).waitFor()
                    assert.equal(await page.getByPlaceholder('请输入用户名').count(), 0)
                } else if (test.entry === 'login') {
                    await page.getByText('登录入口暂未开放', { exact: true }).waitFor()
                    assert.equal(activations, 0)
                } else {
                    await page.getByPlaceholder('请输入用户名').waitFor()
                    await page.getByPlaceholder('请输入用户名').click()
                    await page.getByPlaceholder('请输入用户名').fill('fixture-user')
                    assert.equal(await page.getByRole('button', { name: '登录系统' }).isVisible(), true)
                    await page.waitForURL(url => url.hash === `#/login?entry=${test.entry}`)
                    assert.equal(await page.evaluate(() => sessionStorage.getItem('loginGrantToken')), 'fixture-grant')
                    await page.reload()
                    await page.getByPlaceholder('请输入用户名').waitFor()
                    assert.equal(activations, 1)
                }
                assert.equal(refreshCalls, 0, 'Entry validation must not restore an unrelated session')
                assert.equal(unexpected, 0, 'No business API calls expected')
                if (test.name === 'expired-session-link') await page.screenshot({ path: path.join(output, 'expired-session-login-fixed.png') })
                results.push({ name: test.name, passed: true, activations, refreshCalls })
            } finally { await context.close() }
        }
        fs.writeFileSync(path.join(output, 'results.json'), JSON.stringify(results, null, 2))
        console.log(JSON.stringify({ passed: results.length, results }))
    } finally {
        if (browser) await browser.close()
        await new Promise(resolve => server.close(resolve))
    }
})().catch(error => { console.error(error); process.exitCode = 1 })

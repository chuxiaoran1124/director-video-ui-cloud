import fs from 'node:fs/promises'
import { chromium } from 'playwright'

const entryUrl = process.env.STAGING_ENTRY_URL
const username = process.env.TEST_USERNAME
const password = process.env.TEST_PASSWORD
const planName = process.env.TEST_PLAN_NAME || '含片-14'
const timeoutMs = Number(process.env.TEST_BATCH_TIMEOUT_MS || 900000)

if (!entryUrl || !username || !password) {
  throw new Error('缺少测试入口或测试账号环境变量')
}

const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.PW_EXECUTABLE_PATH || chromium.executablePath()
})
const context = await browser.newContext({
  acceptDownloads: true,
  httpCredentials: process.env.STAGING_GATEWAY_USER && process.env.STAGING_GATEWAY_PASSWORD
    ? { username: process.env.STAGING_GATEWAY_USER, password: process.env.STAGING_GATEWAY_PASSWORD }
    : undefined
})
const page = await context.newPage()
page.setDefaultTimeout(180000)
const proxyRequests = []
const tosRequests = []
const failedRequests = []

page.on('request', request => {
  const url = request.url()
  if (url.includes('/api/material/download-proxy/')) proxyRequests.push(url)
  if (/\.tos-[^/]+\.volces\.com|tos\.cn-/i.test(url)) tosRequests.push(url)
})
page.on('requestfailed', request => {
  if (/\.tos-[^/]+\.volces\.com|tos\.cn-/i.test(request.url())) failedRequests.push(request.failure()?.errorText || 'failed')
})

try {
  await page.goto(entryUrl, { waitUntil: 'commit', timeout: 30000 })
  const usernameInput = page.locator('input[name="content_support_username"]')
  await page.waitForTimeout(5000)
  if (await usernameInput.count() === 0) {
    console.log(JSON.stringify({ gateUrl: page.url(), gateText: (await page.locator('body').innerText()).slice(0, 300) }))
  }
  await usernameInput.waitFor({ state: 'visible', timeout: 60000 })
  await usernameInput.fill(username)
  await page.locator('input[name="content_support_password"]').fill(password)
  await page.locator('button.login-button').click()
  await page.waitForTimeout(2500)

  await page.goto(new URL('/#/generate-materials/video-batch', entryUrl).toString(), { waitUntil: 'commit', timeout: 30000 })
  const planSearch = page.locator('input[placeholder="搜索计划名称"]')
  await planSearch.waitFor({ state: 'visible', timeout: 60000 })
  await planSearch.fill(planName)
  await planSearch.press('Enter')
  await page.waitForTimeout(1500)

  const matchingRow = page.locator('tr').filter({ hasText: planName }).first()
  if (await matchingRow.count() === 0) {
    throw new Error(`测试计划未出现在当前租户：${planName}`)
  }
  await matchingRow.getByRole('button', { name: '任务详情' }).click()
  await page.getByText('视频子任务', { exact: true }).waitFor({ state: 'visible', timeout: 60000 })
  const downloadButton = page.getByRole('button', { name: '批量下载' }).last()
  await downloadButton.waitFor({ state: 'visible', timeout: 60000 })
  if (await downloadButton.isDisabled()) throw new Error('批量下载按钮不可用')

  const downloadPromise = page.waitForEvent('download', { timeout: timeoutMs })
  await downloadButton.click()
  const download = await downloadPromise
  const filePath = await download.path()
  const fileSize = filePath ? (await fs.stat(filePath)).size : 0
  if (filePath) await fs.unlink(filePath).catch(() => {})

  console.log(JSON.stringify({
    passed: true,
    planName,
    proxyRequestCount: proxyRequests.length,
    tosRequestCount: tosRequests.length,
    tosFailedRequestCount: failedRequests.length,
    zipSizeBytes: fileSize,
    suggestedFileName: download.suggestedFilename()
  }))
} finally {
  await browser.close()
}

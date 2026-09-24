import { chromium } from 'playwright'

const originUrl = process.env.STAGING_ORIGIN_URL
const urls = JSON.parse(process.env.TEST_VIDEO_URLS_JSON || '[]')
if (!originUrl || !Array.isArray(urls) || urls.length < 1) {
  throw new Error(`测试输入不足：origin=${Boolean(originUrl)}，视频数=${urls.length}`)
}

const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.PW_EXECUTABLE_PATH || chromium.executablePath()
})
const context = await browser.newContext({
  httpCredentials: process.env.STAGING_GATEWAY_USER && process.env.STAGING_GATEWAY_PASSWORD
    ? { username: process.env.STAGING_GATEWAY_USER, password: process.env.STAGING_GATEWAY_PASSWORD }
    : undefined
})
const page = await context.newPage()

try {
  await page.goto(originUrl, { waitUntil: 'commit', timeout: 30000 })
  const result = await page.evaluate(async videoUrls => {
    let cursor = 0
    let completed = 0
    let totalBytes = 0
    let firstError = ''
    const startedAt = performance.now()
    const worker = async () => {
      while (!firstError) {
        const index = cursor++
        if (index >= videoUrls.length) return
        try {
          const response = await fetch(videoUrls[index], { mode: 'cors', credentials: 'omit' })
          if (!response.ok) throw new Error(`HTTP ${response.status}`)
          const blob = await response.blob()
          totalBytes += blob.size
          completed++
        } catch (error) {
          firstError = error?.message || '浏览器直连失败'
        }
      }
    }
    await Promise.all([worker(), worker()])
    return {
      requested: videoUrls.length,
      completed,
      totalBytes,
      firstError,
      durationMs: Math.round(performance.now() - startedAt)
    }
  }, urls)
  const passed = !result.firstError && result.completed === result.requested
  console.log(JSON.stringify({ passed, ...result }))
  if (!passed) process.exitCode = 1
} finally {
  await browser.close()
}

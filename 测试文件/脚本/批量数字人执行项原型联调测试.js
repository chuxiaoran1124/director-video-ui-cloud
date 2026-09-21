const fs = require('fs')
const path = require('path')
const os = require('os')
const { chromium } = require('playwright')

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://127.0.0.1:3002'
const TEST_USERNAME = process.env.TEST_USERNAME
const TEST_PASSWORD = process.env.TEST_PASSWORD
const OUTPUT_ROOT = path.resolve(__dirname, '..')
const REPORT_DIR = path.join(OUTPUT_ROOT, '测试报告')
const SCREENSHOT_DIR = path.join(OUTPUT_ROOT, '截图', '批量数字人执行项原型')
const REPORT_PATH = path.join(REPORT_DIR, '批量数字人执行项原型联调测试报告.json')
const MARKDOWN_PATH = path.join(REPORT_DIR, '批量数字人执行项原型联调测试报告.md')

function ensureDir(targetPath) { fs.mkdirSync(targetPath, { recursive: true }) }
function resolveChromiumExecutable() {
  if (process.env.PLAYWRIGHT_EXECUTABLE_PATH && fs.existsSync(process.env.PLAYWRIGHT_EXECUTABLE_PATH)) return process.env.PLAYWRIGHT_EXECUTABLE_PATH
  const baseDir = path.join(os.homedir(), 'AppData', 'Local', 'ms-playwright')
  const candidates = fs.readdirSync(baseDir)
    .filter((name) => name.startsWith('chromium-'))
    .map((name) => path.join(baseDir, name, 'chrome-win64', 'chrome.exe'))
    .filter((candidatePath) => fs.existsSync(candidatePath))
    .sort()
  if (!candidates.length) throw new Error(`未找到 Playwright Chromium：${baseDir}`)
  return candidates[candidates.length - 1]
}
function buildAppUrl(routePath) { return `${FRONTEND_URL}/#${routePath.startsWith('/') ? routePath : `/${routePath}`}` }
function timestampText(date = new Date()) { return date.toISOString().replace('T', ' ').slice(0, 19) }

async function login(page) {
  await page.goto(buildAppUrl('/login?from=%2F'), { waitUntil: 'networkidle', timeout: 30000 })
  const usernameInput = page.locator('input[placeholder="请输入用户名"]')
  const passwordInput = page.locator('input[placeholder="请输入密码"]')
  await usernameInput.click()
  await usernameInput.fill(TEST_USERNAME)
  await passwordInput.click()
  await passwordInput.fill(TEST_PASSWORD)
  await page.getByRole('button', { name: '登录系统' }).click()
  await page.waitForURL((url) => !url.hash.startsWith('#/login'), { timeout: 30000 })
  await page.waitForLoadState('networkidle')
}

async function openBatchPlanPage(page) {
  const batchMenuItem = page.locator('.el-menu-item').filter({ hasText: '批量数字人生成' }).first()
  await batchMenuItem.waitFor({ state: 'visible', timeout: 30000 })
  await batchMenuItem.click()
  await page.waitForTimeout(800)
  await page.getByRole('button', { name: '新建批量计划' }).waitFor({ state: 'visible', timeout: 30000 })
}

async function closeDetail(page) {
  const closeButton = page.locator('.batch-detail-drawer .el-drawer__close-btn')
  if (await closeButton.isVisible().catch(() => false)) await closeButton.click()
  await page.waitForTimeout(300)
}

async function deleteDraftPlan(page, planName) {
  await closeDetail(page)
  const row = page.locator('.table-card .el-table__row').filter({ hasText: planName }).first()
  if (await row.count()) {
    const deleteButton = row.getByRole('button', { name: '删除' })
    if (await deleteButton.isVisible().catch(() => false)) {
      await deleteButton.click()
      const confirm = page.getByRole('button', { name: '确定', exact: true })
      if (await confirm.isVisible().catch(() => false)) await confirm.click()
      await page.waitForTimeout(500)
    }
  }
}

async function selectFirstVoice(page) {
  await page.getByText('声音跟随第1项', { exact: true }).first().click()
  const rootHumanInput = page.locator('.performer-editor .picker-row input[placeholder*="可多选数字人"]').first()
  await rootHumanInput.click()
  const humanDialog = page.locator('.el-dialog').filter({ hasText: '选择数字人形象' }).last()
  await humanDialog.locator('.asset-card').nth(0).click()
  await humanDialog.locator('.asset-card').nth(1).click()
  await humanDialog.getByRole('button', { name: '确认选择', exact: true }).click()
  await page.getByText('第1项声音', { exact: true }).first().click().catch(() => {})
  const rootVoiceInput = page.locator('.performer-editor .picker-row input[placeholder="点击选择第1项声音"]').first()
  await rootVoiceInput.click()
  const voiceDialog = page.locator('.el-dialog').filter({ hasText: '选择配音声音' }).last()
  await voiceDialog.getByRole('button', { name: '选入', exact: true }).first().click()
}

async function main() {
  if (!TEST_USERNAME || !TEST_PASSWORD) throw new Error('请通过 TEST_USERNAME 和 TEST_PASSWORD 环境变量提供测试账号，不要把凭据写入脚本。')
  ensureDir(REPORT_DIR)
  ensureDir(SCREENSHOT_DIR)
  const browserExecutable = resolveChromiumExecutable()
  const browser = await chromium.launch({ headless: true, executablePath: browserExecutable })
  const context = await browser.newContext({ viewport: { width: 1600, height: 1000 } })
  const page = await context.newPage()
  const steps = []
  const planName = `执行项交互验收-${Date.now()}`
  let status = 'passed'
  let error = ''

  try {
    await login(page)
    await openBatchPlanPage(page)
    steps.push('测试账号登录成功并进入批量数字人生成计划页')

    await page.getByRole('button', { name: '新建批量计划' }).click()
    const createDialog = page.getByRole('dialog', { name: '新建批量数字人生成计划' })
    await createDialog.locator('input').first().fill(planName)
    await createDialog.locator('textarea').fill('执行项交互验收脚本')
    await createDialog.getByRole('button', { name: '创建任务并配置数字人' }).click()
    await page.getByText(`批量计划 #`, { exact: false }).waitFor({ state: 'visible', timeout: 30000 })
    steps.push('创建草稿计划并打开详情')

    const countText = page.locator('.sidebar-heading').getByText(/\/50/).first()
    await countText.waitFor({ state: 'visible', timeout: 30000 })

    await page.getByRole('button', { name: '添加', exact: true }).click()
    await countText.waitFor({ state: 'visible' })
    if (!(await countText.innerText()).includes('2/50')) throw new Error('添加后执行项没有变为 2/50')
    if (!(await page.locator('.performer-nav-item').nth(1).innerText()).includes('未选形象 + 未选声音')) throw new Error('添加后没有生成空白执行项')
    steps.push('点击添加后只生成空白执行项，未带入当前数字人')

    await page.getByRole('button', { name: '清空', exact: true }).click()
    if (!(await countText.innerText()).includes('0/50')) throw new Error('清空后执行项数量不是 0/50')
    if (await page.locator('.performer-nav-item').count()) throw new Error('清空后仍残留执行项')
    steps.push('一键清空成功，执行项数量为 0/50')

    await page.getByRole('button', { name: '添加', exact: true }).click()
    await selectFirstVoice(page)
    if (!(await countText.innerText()).includes('2/50')) throw new Error('多选确认后没有覆盖为 2/50')
    if (!(await page.locator('.first-voice-summary').innerText()).includes('后 1 项声音跟随第1项')) throw new Error('没有显示后续项跟随第1项提示')
    steps.push('首项多选两个数字人后覆盖队列，并显示后 1 项声音跟随第1项')

    await page.locator('.performer-nav-item').nth(1).click()
    if (!(await page.getByText('跟随声音', { exact: true }).count())) throw new Error('后续执行项没有显示跟随声音')
    if (await page.locator('.performer-editor input[placeholder="点击选择声音"]').count()) throw new Error('跟随第1项的声音仍可单独编辑')
    steps.push('后续执行项声音只读，值跟随第1项')

    await page.getByText('单独选择形象和声音', { exact: true }).click()
    await page.locator('.performer-editor input[placeholder="点击选择数字人"]').first().click()
    const singleHumanDialog = page.locator('.el-dialog').filter({ hasText: '选择数字人形象' }).last()
    if (await singleHumanDialog.locator('.asset-selection-check').count()) throw new Error('单独选择数字人模式仍显示勾选框')
    await singleHumanDialog.locator('.asset-card').first().click()
    await page.locator('.performer-editor input[placeholder="点击选择声音"]').first().click()
    const singleVoiceDialog = page.locator('.el-dialog').filter({ hasText: '选择配音声音' }).last()
    await singleVoiceDialog.getByRole('button', { name: '选入', exact: true }).first().click()
    if ((await page.locator('.performer-nav-item').nth(1).innerText()).includes('跟随第1项')) throw new Error('单独选择模式仍显示跟随第1项')
    steps.push('单独选择形象和声音模式无勾选框，形象和声音均可单独选择')

    await page.getByRole('button', { name: '清空', exact: true }).click()
    await page.getByRole('button', { name: '添加', exact: true }).click()
    if (!(await page.locator('.performer-nav-item').first().innerText()).includes('未选形象 + 未选声音')) throw new Error('清空后重新添加没有恢复空白执行项')
    steps.push('再次清空并添加后，队列恢复为可配置的空白执行项')

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '批量数字人执行项原型联调通过.png'), fullPage: true })
  } catch (caught) {
    status = 'failed'
    error = caught instanceof Error ? caught.stack || caught.message : String(caught)
    try { await page.screenshot({ path: path.join(SCREENSHOT_DIR, '批量数字人执行项原型联调失败.png'), fullPage: true }) } catch (_) {}
  } finally {
    try { await deleteDraftPlan(page, planName) } catch (_) {}
    await context.close()
    await browser.close()
  }

  const report = {
    executedAt: timestampText(), frontendUrl: FRONTEND_URL, status, error, steps,
    summary: { total: 1, passed: status === 'passed' ? 1 : 0, failed: status === 'failed' ? 1 : 0 }
  }
  fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2), 'utf8')
  fs.writeFileSync(MARKDOWN_PATH, [
    '# 批量数字人执行项原型联调测试报告', '',
    `- 测试时间：${report.executedAt}`,
    `- 测试环境：${report.frontendUrl}`,
    `- 结果：${status === 'passed' ? '通过' : '失败'}`,
    `- 用例数：${report.summary.total}`,
    `- 通过：${report.summary.passed}`,
    `- 失败：${report.summary.failed}`, '',
    '## 覆盖操作', '',
    ...steps.map(step => `- ${step}`), '',
    error ? `## 失败原因\n\n${error}` : '## 结论\n\n添加空白执行项、清空、多选覆盖、声音跟随只读、单独选择无勾选框等操作均通过。'
  ].join('\n'), 'utf8')
  if (status === 'failed') process.exitCode = 1
}

main().catch((error) => { console.error(error); process.exitCode = 1 })

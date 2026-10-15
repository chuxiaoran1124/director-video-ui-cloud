// Real isolated site/browser test. Secrets stay in memory; never log API payloads or URLs with tokens.
const assert = require('assert/strict')
const { execFileSync } = require('child_process')
const { chromium } = require('playwright')
const fs = require('fs')
const path = require('path')
// Match an existing allowed testing origin; never loosen production/test bucket CORS for automation.
const base = 'http://127.0.0.1:18445'
async function main() {
    const command = 'docker exec director-video-audio-staging-backend python -c "import os,json; print(json.dumps({k:os.environ[k] for k in [\'PLATFORM_LOGIN_ENTRY_TOKEN\',\'AUDIO_TEST_ADMIN_PASSWORD\']}))"'
    const secret = JSON.parse(execFileSync('ssh.exe',['-o','BatchMode=yes','-o','ConnectTimeout=8','root@8.148.213.7',command],{encoding:'utf8'}))
    const browser = await chromium.launch({headless:true,channel:'msedge'})
    const output = path.resolve(__dirname,'../../output/playwright/standalone-audio-live')
    fs.mkdirSync(output,{recursive:true})
    let page
    try {
        const context = await browser.newContext({viewport:{width:1440,height:1000},acceptDownloads:true})
        const gate = await context.request.post(base+'/api/user/platform-login-entry/activate/',{data:{entryToken:secret.PLATFORM_LOGIN_ENTRY_TOKEN}})
        assert.equal(gate.status(),200,'isolated platform entry')
        const grant = (await gate.json()).data.grantToken
        const login = await context.request.post(base+'/api/user/login/',{data:{username:'audio_stage_admin',password:secret.AUDIO_TEST_ADMIN_PASSWORD,loginGrantToken:grant}})
        assert.equal(login.status(),200,'isolated login')
        // No injected localStorage token: exercise the existing HttpOnly-cookie session recovery.
        page = await context.newPage()
        const pageErrors=[]; const proxyRequests=[]
        page.on('console',message=>{if(message.type()==='error') console.log('BROWSER_ERROR_KIND', /cors|access-control/i.test(message.text())?'CORS':/fetch|network|net::/i.test(message.text())?'NETWORK':'OTHER')})
        page.on('requestfailed',request=>console.log('REQUEST_FAILED',new URL(request.url()).hostname,request.failure()?.errorText))
        page.on('pageerror',error=>pageErrors.push(error.message))
        page.on('request',request=>{if(new URL(request.url()).pathname.includes('download-proxy'))proxyRequests.push(true)})
        await page.addInitScript(()=>{window.showSaveFilePicker=undefined})
        await page.goto(base+'/#/prior-disposal/voice-training')
        await page.getByRole('heading',{name:'声音训练',exact:true}).waitFor({timeout:30000})
        await page.locator('.el-table__body tr').filter({hasText:'隔离测试中文声音20261015'}).waitFor()
        await page.screenshot({path:path.join(output,'training.png'),fullPage:true})
        await page.getByRole('button',{name:'新建声音训练'}).click()
        const dialog=page.getByRole('dialog')
        await dialog.waitFor()
        assert(!(await dialog.innerText()).includes('泰语'))
        assert((await dialog.innerText()).includes('A2E'))
        await dialog.getByRole('button',{name:'取消',exact:true}).click()
        await page.goto(base+'/#/generate-materials/audio-dubbing')
        await page.getByRole('heading',{name:'配音生成',exact:true}).waitFor()
        const row=page.locator('.el-table__body tr').filter({hasText:'隔离测试配音20261015'})
        await row.waitFor()
        await row.getByRole('button',{name:'试听',exact:true}).click()
        const player=page.locator('audio')
        await player.waitFor()
        await page.waitForFunction(()=>{const audio=document.querySelector('audio');return audio&&audio.readyState>=2},{timeout:20000})
        const media=await player.evaluate(audio=>({ready:audio.readyState,duration:audio.duration,origin:new URL(audio.currentSrc).origin}))
        assert(media.duration>0 && media.origin!==base)
        await page.getByRole('dialog').locator('.el-dialog__headerbtn').click()
        const search=page.getByPlaceholder('按名称搜索')
        await search.fill('隔离测试配音20261015')
        await page.getByRole('button',{name:'搜索',exact:true}).click()
        await row.waitFor()
        await page.reload()
        await page.getByRole('heading',{name:'配音生成',exact:true}).waitFor()
        assert.equal(await page.getByPlaceholder('按名称搜索').inputValue(),'隔离测试配音20261015')
        await row.waitFor()
        await row.locator('.el-checkbox').click()
        const download=page.waitForEvent('download',{timeout:45000})
        await page.getByRole('button',{name:/批量下载/}).click()
        const file=await download
        await file.saveAs(path.join(output,'live-dubbing.zip'))
        assert.equal(await file.failure(),null)
        await page.getByRole('dialog').filter({hasText:'音频下载结果'}).waitFor()
        await page.screenshot({path:path.join(output,'dubbing-download.png'),fullPage:true})
        assert.equal(proxyRequests.length,0)
        assert.deepEqual(pageErrors,[])
        console.log(JSON.stringify({live_cookie_session_restore:true,training_ui:true,dubbing_ui:true,direct_playback:true,
            audio_seconds:media.duration,filters_retained_after_reload:true,zip_download:true,no_download_proxy:true,browser_errors:0}))
    } catch(error) {
        if(page) await page.screenshot({path:path.join(output,'failure.png'),fullPage:true}).catch(()=>{})
        // Never dump page/request state: it may contain session data.
        throw error
    } finally { await browser.close() }
}
main().catch(error=>{console.error(error.message);process.exitCode=1})

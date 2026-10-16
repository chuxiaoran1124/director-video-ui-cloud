const assert=require('assert/strict'),path=require('path'),fs=require('fs')
const {createServer}=require('vite'),vue=require('@vitejs/plugin-vue'),{chromium}=require('playwright')
const root=path.resolve(__dirname,'../..'),output=path.join(root,'output/playwright/download-safety')
async function main(){
 const counts={},closed={};let page,browser
 const server=await createServer({configFile:false,root,cacheDir:path.join(root,'.codex-temp/zip-safety-vite'),
  optimizeDeps:{entries:['测试文件/download-safety/fixture.html']},
  resolve:{alias:[{find:'/@/api/material',replacement:path.join(__dirname,'api.fixture.ts')},{find:'/@',replacement:path.join(root,'src')}]},
  plugins:[vue(),{name:'fault-media',configureServer(s){s.middlewares.use('/safety-media',(req,res)=>{
   const name=req.url.slice(1);counts[name]=(counts[name]||0)+1
   if(name==='b'&&counts[name]===1){res.statusCode=404;res.end();return}
   res.setHeader('Content-Type','video/mp4')
   if(name==='hold'){res.write(Buffer.from('start'));res.on('close',()=>closed.hold=true);return}
   if(name==='trickle'){res.write('x');const timer=setInterval(()=>res.write('x'),30);res.on('close',()=>{clearInterval(timer);closed.trickle=true});return}
   res.end(Buffer.alloc(1024,7))
  })}}],server:{host:'127.0.0.1',port:0},css:{postcss:{plugins:[]}}})
 try{
  await server.listen();fs.mkdirSync(output,{recursive:true})
  browser=await chromium.launch({headless:true,channel:'msedge'})
  const context=await browser.newContext({acceptDownloads:true,viewport:{width:1100,height:800}})
  page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message))
  const url=`http://127.0.0.1:${server.httpServer.address().port}/测试文件/download-safety/fixture.html`
  await page.goto(url);await page.getByRole('heading',{name:'下载异常隔离验收'}).waitFor()
  let download=page.waitForEvent('download');await page.getByRole('button',{name:'normal',exact:true}).click()
  await (await download).saveAs(path.join(output,'normal.zip'))
  await page.getByRole('button',{name:'知道了',exact:true}).click();await page.waitForFunction(()=>window.downloadFixture.state.done)
  assert.equal(await page.evaluate(()=>window.downloadFixture.state.result.success),1)
  download=page.waitForEvent('download');await page.getByRole('button',{name:'partial',exact:true}).click()
  await (await download).saveAs(path.join(output,'partial-first.zip'))
  await page.getByRole('button',{name:'仅重试未成功项'}).waitFor()
  await page.waitForTimeout(350)
  await page.screenshot({path:path.join(output,'partial-result.png'),fullPage:true})
  download=page.waitForEvent('download');await page.getByRole('button',{name:'仅重试未成功项'}).click()
  await (await download).saveAs(path.join(output,'retry-only-failed.zip'))
  await page.getByRole('button',{name:'知道了',exact:true}).click();await page.waitForFunction(()=>window.downloadFixture.state.done)
  assert.equal(counts.a,1);assert.equal(counts.b,2)
  assert.equal(await page.evaluate(()=>window.downloadFixture.state.result.success),2)
  await page.getByRole('button',{name:'hold',exact:true}).click()
  await page.getByText('测试文件-hold',{exact:true}).waitFor()
  await page.getByRole('button',{name:'取消下载',exact:true}).click()
  await page.getByRole('button',{name:'结束',exact:true}).click();await page.waitForFunction(()=>window.downloadFixture.state.done)
  assert.equal(await page.evaluate(()=>window.downloadFixture.state.result.cancelled),true)
  assert.equal(await page.evaluate(()=>window.downloadFixture.critical()),false)
  await page.waitForTimeout(100);assert(closed.hold)
  await page.getByRole('button',{name:'write',exact:true}).click()
  await page.getByRole('button',{name:'仅重试未成功项'}).waitFor()
  await page.waitForTimeout(350)
  await page.screenshot({path:path.join(output,'write-timeout.png'),fullPage:true})
  await page.getByRole('button',{name:'结束',exact:true}).click();await page.waitForFunction(()=>window.downloadFixture.state.done)
  assert.equal(await page.evaluate(()=>window.downloadFixture.state.result.success),0)
  await page.getByRole('button',{name:'trickle',exact:true}).click()
  await page.getByRole('button',{name:'仅重试未成功项'}).waitFor()
  await page.getByRole('button',{name:'结束',exact:true}).click();await page.waitForFunction(()=>window.downloadFixture.state.done)
  assert.equal(await page.evaluate(()=>window.downloadFixture.state.result.failed),1);assert(closed.trickle)
  await page.setViewportSize({width:390,height:844})
  await page.getByRole('button',{name:'hold',exact:true}).click();await page.getByRole('button',{name:'取消下载'}).waitFor()
  await page.getByRole('dialog',{name:'打包下载',exact:true}).waitFor()
  await page.waitForTimeout(350)
  await page.screenshot({path:path.join(output,'mobile-cancel.png'),fullPage:true})
  await page.getByRole('button',{name:'取消下载'}).click();await page.getByRole('button',{name:'结束',exact:true}).click()
  assert.deepEqual(errors,[])
  console.log(JSON.stringify({normalZIP:true,partialZIP:true,retryOnlyFailed:true,cancelAbortsHTTP:true,writeTimeout:true,trickleBudget:true,mobileCancel:true,browserErrors:0}))
 }catch(e){if(page)await page.screenshot({path:path.join(output,'failure.png'),fullPage:true}).catch(()=>{});throw e}
 finally{if(browser)await browser.close();await server.close()}
}
main().catch(e=>{console.error(e.message);process.exitCode=1})

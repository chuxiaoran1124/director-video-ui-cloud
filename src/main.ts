import { createApp } from 'vue'
import App from '/@/App.vue'
import ElementPlus from 'element-plus'
import direct from '/@/directive/index'
import router from '/@/router/index'
import { pinia } from '/@/store'
import '/@/permission'
import '/@/assets/css/index.css'

import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/display.css'
import 'nprogress/nprogress.css'
import 'virtual:svg-icons-register'
import SvgIcon from '/@/components/SvnIcon/index.vue'

import * as ElIcons from '@element-plus/icons-vue'


const app = createApp(App)
direct(app)
app.use(ElementPlus)
app.use(router)
app.use(pinia)
app.component('SvgIcon', SvgIcon)

const ElIconsData = ElIcons as unknown as Array<() => Promise<typeof import('*.vue')>>
for (const iconName in ElIconsData) {
    app.component(`ElIcon${iconName}`, ElIconsData[iconName])
}
  
// 生产环境禁用 F12 及右键菜单
if (import.meta.env.PROD) {
  document.addEventListener('keydown', (e) => {
    if (
      e.key === 'F12' ||
      (e.ctrlKey && e.shiftKey && ['I', 'J', 'C'].includes(e.key.toUpperCase())) ||
      (e.ctrlKey && e.key.toUpperCase() === 'U')
    ) {
      e.preventDefault()
      e.stopPropagation()
    }
  }, true)
  document.addEventListener('contextmenu', (e) => e.preventDefault())
}

app.mount('#app')
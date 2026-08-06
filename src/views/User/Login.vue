<template>
    <div class='login-page'>
        <div class='login-page__backdrop' />
        <div class='login-page__noise' />

        <section class='login-page__hero'>
            <div class='hero-badge'>内容协作台</div>
            <h1>内容支持工具</h1>
            <p>
                把素材整理、成片生产和团队协作放进一个顺手的工作台，帮助剪辑团队更快开工、更少来回切换。
            </p>
            <ul class='hero-points'>
                <li>常用入口更集中，打开就能继续当天工作</li>
                <li>不同岗位自动看到适合自己的功能范围</li>
                <li>素材、生成任务和账号协作统一在一个界面里</li>
            </ul>
        </section>

        <section class='login-panel'>
            <div class='login-panel__card'>
                <div class='panel-header'>
                    <span class='panel-header__eyebrow'>{{ panelEyebrow }}</span>
                    <h2>{{ panelTitle }}</h2>
                    <p>{{ panelDescription }}</p>
                </div>

                <div v-if='gateChecking' class='login-state-card'>
                    正在确认当前浏览器是否具备平台登录权限，请稍等。
                </div>

                <div v-else-if='!canUsePasswordLogin' class='login-state-card login-state-card--blocked'>
                    <strong>当前阶段仅开放受邀访问</strong>
                    <p>请使用授权链接访问系统，并在授权成功后输入账号密码完成登录。</p>
                </div>

                <el-form v-else ref='ruleFormRef' :model='form' :rules='rules' label-position='top' autocomplete='off' @keyup.enter='onSubmit'>
                    <input type='text' name='fake_username' autocomplete='username' class='login-page__hidden-input'>
                    <input type='password' name='fake_password' autocomplete='current-password' class='login-page__hidden-input'>
                    <el-form-item label='用户名' prop='username'>
                        <el-input
                            v-model='form.username'
                            placeholder='请输入用户名'
                            size='large'
                            :readonly='autofillGuard'
                            name='content_support_username'
                            autocomplete='off'
                            @focus='releaseAutofillGuard'
                            @mousedown='releaseAutofillGuard'
                        />
                    </el-form-item>
                    <el-form-item label='密码' prop='password'>
                        <el-input
                            v-model='form.password'
                            placeholder='请输入密码'
                            size='large'
                            show-password
                            :readonly='autofillGuard'
                            name='content_support_password'
                            autocomplete='new-password'
                            @focus='releaseAutofillGuard'
                            @mousedown='releaseAutofillGuard'
                        />
                    </el-form-item>
                    <el-form-item>
                        <el-button type='primary' size='large' class='login-button' :loading='submitting' @click='onSubmit'>
                            登录系统
                        </el-button>
                    </el-form-item>
                </el-form>

                <div class='panel-footer'>
                    <span>{{ footerText }}</span>
                </div>
            </div>
        </section>

        <compliance-footer variant='dark' class='login-page__compliance' />
    </div>
</template>

<script lang='ts' setup>
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElNotification, FormInstance, FormRules } from 'element-plus'
import { getPlatformLoginEntryStatus } from '/@/api/layout'
import { useLayoutStore } from '/@/store/modules/layout'
import ComplianceFooter from '/@/components/ComplianceFooter/index.vue'

const layoutStore = useLayoutStore()
const route = useRoute()
const router = useRouter()
const ruleFormRef = ref<FormInstance>()
const submitting = ref(false)
const autofillGuard = ref(true)
const gateChecking = ref(true)
const canUsePasswordLogin = ref(false)
const currentPlatformGrantToken = ref('')
const LOGIN_GRANT_SESSION_KEY = 'loginGrantToken'
const LOGIN_ENTRY_SESSION_KEY = 'loginGrantEntry'

const form = reactive({
    username: '',
    password: ''
})

const rules = reactive<FormRules>({
    username: [
        { required: true, message: '用户名不能为空', trigger: 'blur' }
    ],
    password: [
        { required: true, message: '密码不能为空', trigger: 'blur' }
    ]
})

const releaseAutofillGuard = () => {
    autofillGuard.value = false
}

const panelEyebrow = computed(() => {
    if (gateChecking.value) {
        return '正在检查'
    }
    return canUsePasswordLogin.value ? '欢迎回来' : '受邀访问'
})

const panelTitle = computed(() => {
    if (gateChecking.value) {
        return '校验登录入口'
    }
    return canUsePasswordLogin.value ? '进入工作台' : '登录入口暂未开放'
})

const panelDescription = computed(() => {
    if (gateChecking.value) {
        return '系统正在确认当前浏览器是否已经通过平台入口授权。'
    }
    if (canUsePasswordLogin.value) {
        return '当前浏览器已经完成访问校验，请输入账号密码进入你可用的工作页面。'
    }
    return '当前阶段，所有账号都必须先通过管理员分发的访问链接进入系统。'
})

const footerText = computed(() => {
    if (canUsePasswordLogin.value) {
        return '如无法进入，请联系管理员确认访问链接、账号状态和当前网络是否符合要求。'
    }
    return '如果你需要进入系统，请联系平台管理员获取对应入口。'
})

const getPlatformGrantTokenFromRoute = () => {
    const routeGrant = String(route.query.grant || '').trim()
    if (routeGrant) {
        return routeGrant
    }

    const searchGrant = new URLSearchParams(window.location.search).get('grant') || ''
    if (searchGrant.trim()) {
        return searchGrant.trim()
    }

    const hashValue = window.location.hash || ''
    if (hashValue.includes('?')) {
        const hashQuery = hashValue.slice(hashValue.indexOf('?') + 1)
        const hashGrant = new URLSearchParams(hashQuery).get('grant') || ''
        if (hashGrant.trim()) {
            return hashGrant.trim()
        }
    }

    return ''
}

const getPlatformEntryFlagFromRoute = () => {
    const routeEntry = String(route.query.entry || '').trim()
    if (routeEntry) {
        return routeEntry
    }

    const searchEntry = new URLSearchParams(window.location.search).get('entry') || ''
    if (searchEntry.trim()) {
        return searchEntry.trim()
    }

    const hashValue = window.location.hash || ''
    if (hashValue.includes('?')) {
        const hashQuery = hashValue.slice(hashValue.indexOf('?') + 1)
        const hashEntry = new URLSearchParams(hashQuery).get('entry') || ''
        if (hashEntry.trim()) {
            return hashEntry.trim()
        }
    }

    return ''
}

const storeLoginGrantSession = (entryType: string, grantToken: string) => {
    if (!entryType || !grantToken) {
        return
    }
    sessionStorage.setItem(LOGIN_GRANT_SESSION_KEY, grantToken)
    sessionStorage.setItem(LOGIN_ENTRY_SESSION_KEY, entryType)
}

const clearLoginGrantSession = () => {
    sessionStorage.removeItem(LOGIN_GRANT_SESSION_KEY)
    sessionStorage.removeItem(LOGIN_ENTRY_SESSION_KEY)
}

const getStoredLoginGrantToken = (entryType: string) => {
    if (!entryType) {
        return ''
    }
    const storedEntryType = sessionStorage.getItem(LOGIN_ENTRY_SESSION_KEY) || ''
    if (storedEntryType !== entryType) {
        return ''
    }
    return sessionStorage.getItem(LOGIN_GRANT_SESSION_KEY) || ''
}

const validatePasswordLoginGate = async() => {
    gateChecking.value = true
    const grantToken = getPlatformGrantTokenFromRoute()
    const entryFlag = getPlatformEntryFlagFromRoute()
    if (!entryFlag) {
        clearLoginGrantSession()
    }
    const storedGrantToken = getStoredLoginGrantToken(entryFlag)
    const effectiveGrantToken = grantToken || storedGrantToken
    try {
        currentPlatformGrantToken.value = effectiveGrantToken
        const response = await getPlatformLoginEntryStatus(effectiveGrantToken)
        const payload = response.data.data || {}
        canUsePasswordLogin.value = Boolean(payload.granted)
        if (!payload.granted) {
            currentPlatformGrantToken.value = ''
            clearLoginGrantSession()
            return
        }
        if (entryFlag && effectiveGrantToken) {
            storeLoginGrantSession(entryFlag, effectiveGrantToken)
        }
        if (grantToken) {
            const normalizedEntry = entryFlag || 'platform'
            await router.replace(`/login?entry=${normalizedEntry}`)
        }
    } catch {
        canUsePasswordLogin.value = false
        currentPlatformGrantToken.value = ''
        clearLoginGrantSession()
    } finally {
        gateChecking.value = false
    }
}

onMounted(() => {
    nextTick(() => {
        form.username = ''
        form.password = ''
    })
    validatePasswordLoginGate()
})

watch(
    () => route.fullPath,
    () => {
        if (route.path === '/login') {
            validatePasswordLoginGate()
        }
    }
)

const onSubmit = async() => {
    if (!canUsePasswordLogin.value) {
        return
    }

    if (!ruleFormRef.value) {
        return
    }

    const valid = await ruleFormRef.value.validate().catch(() => false)
    if (!valid) {
        return
    }

    submitting.value = true
    try {
        await layoutStore.login({
            username: form.username,
            password: form.password,
            loginGrantToken: currentPlatformGrantToken.value
        })
        clearLoginGrantSession()
        ElNotification({
            title: '登录成功',
            message: '欢迎回来，常用功能已经为你准备好了。',
            type: 'success'
        })
    } finally {
        submitting.value = false
    }
}
</script>

<style lang='postcss' scoped>
.login-page {
    position: relative;
    min-height: 100vh;
    display: grid;
    grid-template-columns: minmax(320px, 1.2fr) minmax(360px, 460px);
    grid-template-rows: minmax(0, 1fr) auto;
    overflow-x: hidden;
    overflow-y: auto;
    background:
        radial-gradient(circle at 12% 18%, rgba(15, 118, 110, 0.28), transparent 28%),
        radial-gradient(circle at 86% 22%, rgba(14, 116, 144, 0.18), transparent 26%),
        linear-gradient(135deg, #04131f 0%, #082033 38%, #0f2a3c 100%);
    color: #f4fbff;
}

.login-page__backdrop,
.login-page__noise {
    position: absolute;
    inset: 0;
    pointer-events: none;
}

.login-page__backdrop {
    background:
        linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px),
        linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px);
    background-size: 52px 52px;
    mask-image: linear-gradient(180deg, rgba(0, 0, 0, 0.9), transparent 92%);
}

.login-page__noise {
    background: radial-gradient(circle at center, rgba(255, 255, 255, 0.08) 0, transparent 58%);
    opacity: 0.35;
}

.login-page__hero,
.login-panel {
    position: relative;
    z-index: 1;
}

.login-page__hero {
    grid-column: 1;
    grid-row: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 80px 7vw;
}

.hero-badge {
    width: fit-content;
    padding: 8px 16px;
    border-radius: 999px;
    background: rgba(148, 210, 189, 0.12);
    border: 1px solid rgba(148, 210, 189, 0.28);
    color: #9fe6d1;
    font-size: 13px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
}

.login-page__hero h1 {
    margin: 24px 0 18px;
    font-size: clamp(38px, 5vw, 68px);
    line-height: 1.04;
    font-weight: 800;
    letter-spacing: 0.02em;
}

.login-page__hero p {
    max-width: 640px;
    margin: 0;
    color: rgba(235, 248, 255, 0.82);
    font-size: 17px;
    line-height: 1.8;
}

.hero-points {
    margin: 36px 0 0;
    padding: 0;
    list-style: none;
    display: grid;
    gap: 14px;
}

.hero-points li {
    position: relative;
    padding-left: 22px;
    color: rgba(244, 251, 255, 0.9);
}

.hero-points li::before {
    content: '';
    position: absolute;
    left: 0;
    top: 10px;
    width: 9px;
    height: 9px;
    border-radius: 999px;
    background: linear-gradient(135deg, #67e8f9, #34d399);
    box-shadow: 0 0 18px rgba(103, 232, 249, 0.5);
}

.login-panel {
    grid-column: 2;
    grid-row: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 48px 32px;
}

.login-page__compliance {
    position: relative;
    z-index: 1;
    grid-column: 1 / -1;
    grid-row: 2;
}

.login-panel__card {
    width: min(100%, 420px);
    padding: 34px 32px 28px;
    border-radius: 28px;
    background: rgba(248, 252, 255, 0.94);
    box-shadow: 0 24px 70px rgba(2, 12, 23, 0.35);
    color: #0f172a;
    backdrop-filter: blur(14px);
}

.panel-header__eyebrow {
    display: inline-block;
    color: #0f766e;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
}

.panel-header h2 {
    margin: 12px 0 10px;
    font-size: 28px;
    line-height: 1.2;
}

.panel-header p {
    margin: 0 0 24px;
    color: #475569;
    line-height: 1.7;
}

.login-button {
    width: 100%;
    height: 46px;
    border: none;
    background: linear-gradient(135deg, #0f766e, #0ea5a4);
}

.panel-footer {
    margin-top: 12px;
    color: #64748b;
    font-size: 13px;
}

.login-state-card {
    margin-bottom: 18px;
    padding: 18px 18px;
    border-radius: 18px;
    background: rgba(15, 118, 110, 0.08);
    color: #0f172a;
    line-height: 1.8;
}

.login-state-card--blocked {
    background: rgba(15, 23, 42, 0.05);
}

.login-state-card--blocked strong {
    display: block;
    margin-bottom: 8px;
    font-size: 16px;
}

.login-state-card--blocked p {
    margin: 0;
    color: #475569;
}

.login-page__hidden-input {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: 0;
    border: 0;
    opacity: 0;
    pointer-events: none;
}

::v-deep(.el-input__wrapper) {
    min-height: 46px;
    border-radius: 14px;
    box-shadow: 0 0 0 1px rgba(15, 118, 110, 0.08) inset;
}

::v-deep(.el-form-item__label) {
    color: #0f172a;
    font-weight: 600;
}

@media (max-width: 980px) {
    .login-page {
        grid-template-columns: 1fr;
    }

    .login-page__hero {
        grid-column: 1;
        grid-row: 1;
        padding: 56px 32px 18px;
    }

    .login-panel {
        grid-column: 1;
        grid-row: 2;
        padding-top: 8px;
        padding-bottom: 40px;
    }

    .login-page__compliance {
        grid-column: 1;
        grid-row: 3;
    }
}
</style>

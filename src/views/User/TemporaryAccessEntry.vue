<template>
    <div class='entry-page'>
        <div class='entry-page__backdrop' />
        <section class='entry-card'>
            <span class='entry-card__eyebrow'>临时访问入口</span>
            <h1>{{ titleText }}</h1>
            <p>{{ descriptionText }}</p>

            <div class='entry-card__status'>
                <el-icon v-if='loading' class='is-loading'>
                    <Loading />
                </el-icon>
                <el-icon v-else-if='status === "success"' class='entry-card__success'>
                    <CircleCheckFilled />
                </el-icon>
                <el-icon v-else class='entry-card__error'>
                    <WarningFilled />
                </el-icon>
            </div>

            <div class='entry-card__actions'>
                <div v-if='status === "failed" && currentDetectedIp' class='entry-card__ip'>
                    后端当前识别到的访问 IP：{{ currentDetectedIp }}
                </div>
                <el-button v-if='status === "failed"' type='primary' class='entry-card__button' @click='goLogin'>
                    返回登录页
                </el-button>
            </div>
        </section>
    </div>
</template>

<script lang='ts' setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { CircleCheckFilled, Loading, WarningFilled } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { exchangeTemporaryAccess } from '/@/api/layout'
import { getTemporaryAccessCurrentIp } from '/@/api/user'
import { useLayoutStore } from '/@/store/modules/layout'

const route = useRoute()
const router = useRouter()
const layoutStore = useLayoutStore()

const loading = ref(true)
const status = ref<'loading' | 'success' | 'failed'>('loading')
const errorMessage = ref('')
const currentDetectedIp = ref('')

const titleText = computed(() => {
    if (status.value === 'success') {
        return '正在进入工作台'
    }
    if (status.value === 'failed') {
        return '当前访问链接不可用'
    }
    return '正在校验访问权限'
})

const descriptionText = computed(() => {
    if (status.value === 'success') {
        return '系统已经为你准备好当前可用的团队与工作入口，正在自动跳转。'
    }
    if (status.value === 'failed') {
        return errorMessage.value || '该访问链接已失效，或当前网络地址不在允许范围内。'
    }
    return '请稍等，系统正在确认该访问链接的有效期、网络地址和账号状态。'
})

const goLogin = async() => {
    await router.replace('/login')
}

const loadCurrentDetectedIp = async() => {
    try {
        const response = await getTemporaryAccessCurrentIp()
        currentDetectedIp.value = response.data.data.clientIp || ''
    } catch {
        currentDetectedIp.value = ''
    }
}

const getTemporaryAccessTicket = () => {
    const routeTicket = String(route.query.ticket || '').trim()
    if (routeTicket) {
        return routeTicket
    }

    const searchTicket = new URLSearchParams(window.location.search).get('ticket') || ''
    if (searchTicket.trim()) {
        return searchTicket.trim()
    }

    const hashValue = window.location.hash || ''
    if (hashValue.includes('?')) {
        const hashQuery = hashValue.slice(hashValue.indexOf('?') + 1)
        const hashTicket = new URLSearchParams(hashQuery).get('ticket') || ''
        if (hashTicket.trim()) {
            return hashTicket.trim()
        }
    }

    return ''
}

const bootstrapTemporaryAccess = async() => {
    const ticket = getTemporaryAccessTicket()
    if (!ticket) {
        loading.value = false
        status.value = 'failed'
        errorMessage.value = '访问地址缺少必要凭证，请联系平台管理员重新分发。'
        return
    }

    try {
        const response = await exchangeTemporaryAccess(ticket)
        layoutStore.clearAuthState()
        layoutStore.applyLoginResponse(response.data.data)
        await layoutStore.initializeUserState()
        await layoutStore.loadDynamicRoutes()
        status.value = 'success'
        loading.value = false
        await router.replace(layoutStore.getDefaultLandingPath())
    } catch (error: any) {
        loading.value = false
        status.value = 'failed'
        await loadCurrentDetectedIp()
        errorMessage.value = error?.response?.data?.msg
            || error?.response?.data?.message
            || error?.message
            || '临时访问登录失败，请联系平台管理员处理。'
        ElMessage.error(errorMessage.value)
    }
}

onMounted(() => {
    bootstrapTemporaryAccess()
})
</script>

<style lang='postcss' scoped>
.entry-page {
    position: relative;
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    background:
        radial-gradient(circle at 12% 18%, rgba(15, 118, 110, 0.24), transparent 26%),
        radial-gradient(circle at 84% 22%, rgba(14, 116, 144, 0.18), transparent 26%),
        linear-gradient(135deg, #04131f 0%, #082033 42%, #0f2a3c 100%);
}

.entry-page__backdrop {
    position: absolute;
    inset: 0;
    background:
        linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px),
        linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px);
    background-size: 52px 52px;
    mask-image: linear-gradient(180deg, rgba(0, 0, 0, 0.92), transparent 92%);
    pointer-events: none;
}

.entry-card {
    position: relative;
    z-index: 1;
    width: min(100%, 460px);
    padding: 34px 32px 30px;
    border-radius: 28px;
    background: rgba(248, 252, 255, 0.95);
    box-shadow: 0 24px 70px rgba(2, 12, 23, 0.35);
    text-align: center;
    color: #0f172a;
}

.entry-card__eyebrow {
    display: inline-block;
    color: #0f766e;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
}

.entry-card h1 {
    margin: 14px 0 12px;
    font-size: 30px;
    line-height: 1.2;
}

.entry-card p {
    margin: 0;
    color: #475569;
    line-height: 1.8;
}

.entry-card__status {
    margin: 28px auto 0;
    width: 68px;
    height: 68px;
    border-radius: 999px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(15, 118, 110, 0.08);
    color: #0f766e;
    font-size: 32px;
}

.entry-card__success {
    color: #10b981;
}

.entry-card__error {
    color: #ef4444;
}

.entry-card__actions {
    margin-top: 28px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 14px;
}

.entry-card__ip {
    max-width: 100%;
    padding: 12px 14px;
    border-radius: 16px;
    background: rgba(15, 118, 110, 0.08);
    color: #0f172a;
    font-size: 13px;
    line-height: 1.6;
    word-break: break-all;
}

.entry-card__button {
    min-width: 160px;
    border: none;
    background: linear-gradient(135deg, #0f766e, #0ea5a4);
}
</style>

<template>
    <div class='entry-page'>
        <div class='entry-page__backdrop' />
        <section class='entry-card'>
            <span class='entry-card__eyebrow'>平台入口</span>
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
                <el-button v-if='status === "failed"' type='primary' class='entry-card__button' @click='goLogin'>
                    返回关闭页
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
import { activatePlatformLoginEntry } from '/@/api/layout'

const route = useRoute()
const router = useRouter()

const loading = ref(true)
const status = ref<'loading' | 'success' | 'failed'>('loading')
const errorMessage = ref('')

const titleText = computed(() => {
    if (status.value === 'success') {
        return '正在打开平台登录页'
    }
    if (status.value === 'failed') {
        return '平台入口不可用'
    }
    return '正在校验平台入口'
})

const descriptionText = computed(() => {
    if (status.value === 'success') {
        return '浏览器登录凭证已经激活，正在跳转到平台管理员登录页。'
    }
    if (status.value === 'failed') {
        return errorMessage.value || '该平台入口链接无效或已失效，请联系维护人员。'
    }
    return '请稍等，系统正在核对当前入口链接是否可用于平台管理员登录。'
})

const getEntryToken = () => {
    const routeToken = String(route.query.token || '').trim()
    if (routeToken) {
        return routeToken
    }

    const searchToken = new URLSearchParams(window.location.search).get('token') || ''
    if (searchToken.trim()) {
        return searchToken.trim()
    }

    const hashValue = window.location.hash || ''
    if (hashValue.includes('?')) {
        const hashQuery = hashValue.slice(hashValue.indexOf('?') + 1)
        const hashToken = new URLSearchParams(hashQuery).get('token') || ''
        if (hashToken.trim()) {
            return hashToken.trim()
        }
    }

    return ''
}

const goLogin = async() => {
    await router.replace('/login')
}

const replaceToHashPath = (targetPath: string) => {
    const normalizedPath = targetPath.startsWith('/') ? targetPath : `/${targetPath}`
    window.location.replace(`${window.location.origin}${window.location.pathname}#${normalizedPath}`)
}

const bootstrapPlatformLoginEntry = async() => {
    const entryToken = getEntryToken()
    if (!entryToken) {
        loading.value = false
        status.value = 'failed'
        errorMessage.value = '平台入口链接缺少必要凭证，请联系维护人员重新提供。'
        return
    }

    try {
        const response = await activatePlatformLoginEntry(entryToken)
        const payload = response.data.data
        status.value = 'success'
        loading.value = false
        replaceToHashPath(`/login?entry=platform&grant=${encodeURIComponent(payload.grantToken || '')}`)
    } catch (error: any) {
        loading.value = false
        status.value = 'failed'
        errorMessage.value = error?.response?.data?.message
            || error?.message
            || '平台入口激活失败，请联系维护人员处理。'
        ElMessage.error(errorMessage.value)
    }
}

onMounted(() => {
    bootstrapPlatformLoginEntry()
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

.entry-card__button {
    min-width: 160px;
    border: none;
    background: linear-gradient(135deg, #0f766e, #0ea5a4);
}
</style>

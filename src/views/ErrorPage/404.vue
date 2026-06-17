<template>
    <div class='not-found-page'>
        <div class='not-found-card'>
            <div class='not-found-card__code'>404</div>
        <div class='not-found-card__content'>
            <span class='not-found-card__eyebrow'>暂时不可用</span>
            <h1>这个页面暂时进不去。</h1>
            <p>
                可能是这个入口还没有对你的账号开放，也可能是页面位置刚刚调整。
                你可以先回到首页继续工作，或者联系管理员确认可用功能。
            </p>
                <div class='not-found-actions'>
                    <el-button type='primary' @click='goHome'>返回首页</el-button>
                    <el-button plain @click='goBack'>返回上一页</el-button>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang='ts' setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const goHome = () => {
    router.push('/')
}

const goBack = () => {
    router.back()
}
</script>

<style lang='postcss' scoped>
.not-found-page {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    background:
        radial-gradient(circle at 16% 18%, rgba(14, 165, 164, 0.18), transparent 24%),
        radial-gradient(circle at 88% 30%, rgba(59, 130, 246, 0.14), transparent 24%),
        linear-gradient(135deg, #06121d 0%, #0b1f31 42%, #11263a 100%);
}

.not-found-card {
    width: min(1040px, 100%);
    display: grid;
    grid-template-columns: 220px 1fr;
    gap: 28px;
    padding: 42px;
    border-radius: 30px;
    background: rgba(248, 252, 255, 0.96);
    box-shadow: 0 30px 90px rgba(2, 12, 23, 0.36);
    overflow: hidden;
}

.not-found-card__code {
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 24px;
    background: linear-gradient(180deg, #0f766e, #0f172a);
    color: #f0fdfa;
    font-size: clamp(64px, 10vw, 110px);
    font-weight: 800;
    letter-spacing: 0.04em;
}

.not-found-card__eyebrow {
    display: inline-block;
    color: #0f766e;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
}

.not-found-card__content h1 {
    margin: 16px 0 14px;
    font-size: clamp(28px, 4vw, 42px);
    line-height: 1.2;
    color: #0f172a;
}

.not-found-card__content p {
    margin: 0;
    font-size: 16px;
    line-height: 1.8;
    color: #475569;
}

.not-found-actions {
    display: flex;
    gap: 12px;
    margin-top: 28px;
}

@media (max-width: 820px) {
    .not-found-card {
        grid-template-columns: 1fr;
        padding: 28px;
    }

    .not-found-card__code {
        min-height: 160px;
    }

    .not-found-actions {
        flex-direction: column;
    }
}
</style>

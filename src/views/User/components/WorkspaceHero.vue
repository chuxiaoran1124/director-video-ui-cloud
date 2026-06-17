<template>
    <section class='workspace-hero'>
        <div class='workspace-hero__glow workspace-hero__glow--left' />
        <div class='workspace-hero__glow workspace-hero__glow--right' />

        <div class='workspace-hero__content'>
            <div class='workspace-hero__main'>
                <span class='workspace-hero__eyebrow'>{{ eyebrow }}</span>
                <h1>{{ title }}</h1>
                <p>{{ description }}</p>
            </div>
            <div v-if='$slots.actions' class='workspace-hero__actions'>
                <slot name='actions' />
            </div>
        </div>

        <div v-if='$slots.metrics' class='workspace-hero__metrics'>
            <slot name='metrics' />
        </div>
    </section>
</template>

<script lang='ts' setup>
defineProps<{
    eyebrow: string
    title: string
    description: string
}>()
</script>

<style lang='postcss' scoped>
.workspace-hero {
    position: relative;
    overflow: hidden;
    padding: 28px 28px 24px;
    border-radius: 28px;
    background:
        linear-gradient(135deg, rgba(255, 255, 255, 0.96), rgba(247, 250, 255, 0.92)),
        linear-gradient(135deg, #eef5ff, #f8fbff);
    border: 1px solid rgba(141, 163, 196, 0.18);
    box-shadow: 0 22px 60px rgba(38, 73, 145, 0.12);
}

.workspace-hero__content,
.workspace-hero__metrics {
    position: relative;
    z-index: 1;
}

.workspace-hero__content {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 20px;
}

.workspace-hero__main {
    max-width: 720px;
}

.workspace-hero__eyebrow {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 7px 12px;
    border-radius: 999px;
    color: #2457d6;
    background: rgba(54, 110, 255, 0.08);
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.08em;
}

.workspace-hero h1 {
    margin: 16px 0 10px;
    font-size: clamp(30px, 4vw, 38px);
    line-height: 1.14;
    color: #132039;
}

.workspace-hero p {
    margin: 0;
    color: #5d6b84;
    line-height: 1.8;
    font-size: 14px;
}

.workspace-hero__actions {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 12px;
}

.workspace-hero__metrics {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 14px;
    margin-top: 20px;
}

.workspace-hero__glow {
    position: absolute;
    border-radius: 999px;
    filter: blur(14px);
    opacity: 0.7;
    animation: floatGlow 7.2s ease-in-out infinite;
}

.workspace-hero__glow--left {
    top: -28px;
    left: -10px;
    width: 180px;
    height: 180px;
    background: radial-gradient(circle, rgba(64, 136, 255, 0.26), transparent 68%);
}

.workspace-hero__glow--right {
    right: -20px;
    bottom: -40px;
    width: 220px;
    height: 220px;
    background: radial-gradient(circle, rgba(86, 197, 255, 0.18), transparent 70%);
    animation-delay: -2.4s;
}

@keyframes floatGlow {
    0%,
    100% {
        transform: translate3d(0, 0, 0) scale(1);
    }
    50% {
        transform: translate3d(0, 10px, 0) scale(1.06);
    }
}

@media (max-width: 980px) {
    .workspace-hero {
        padding: 24px 20px 20px;
    }

    .workspace-hero__content {
        flex-direction: column;
    }

    .workspace-hero__actions {
        width: 100%;
        justify-content: flex-start;
    }
}
</style>

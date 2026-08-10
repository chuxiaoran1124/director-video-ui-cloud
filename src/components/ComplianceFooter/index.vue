<template>
    <footer class='compliance-footer' :class='`compliance-footer--${variant}`'>
        <div class='compliance-footer__inner'>
            <div class='compliance-footer__identity'>
                <span class='compliance-footer__brand'>
                    <span class='compliance-footer__mark' aria-hidden='true' />
                    内容支持工具
                </span>
                <span class='compliance-footer__separator' aria-hidden='true'>·</span>
                <span>© {{ currentYear }} 广州超起信息科技有限公司</span>
            </div>

            <div class='compliance-footer__records' aria-label='网站备案信息'>
                <a
                    class='compliance-footer__record'
                    href='https://beian.miit.gov.cn/'
                    target='_blank'
                    rel='noopener noreferrer'
                >
                    粤ICP备2025496411号
                </a>
                <span class='compliance-footer__separator' aria-hidden='true'>·</span>
                <a
                    class='compliance-footer__record compliance-footer__record--public-security'
                    href='https://beian.mps.gov.cn/'
                    target='_blank'
                    rel='noopener noreferrer'
                >
                    <img :src='publicSecurityIcon' alt='' aria-hidden='true'>
                    粤公网安备44010602016728号
                </a>
            </div>
        </div>
    </footer>
</template>

<script lang='ts' setup>
import { computed } from 'vue'
import publicSecurityIcon from '/@/assets/img/gongan-beian.png'

const props = withDefaults(defineProps<{
    variant?: 'light' | 'dark'
}>(), {
    variant: 'light'
})

const variant = computed(() => props.variant)
const currentYear = new Date().getFullYear()
</script>

<style lang='postcss' scoped>
.compliance-footer {
    width: 100%;
    padding: 18px 24px 20px;
    font-size: 12px;
    line-height: 1.7;
}

.compliance-footer__inner {
    display: grid;
    align-items: center;
    justify-content: center;
    justify-items: center;
    gap: 5px;
}

.compliance-footer__identity,
.compliance-footer__records {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-wrap: wrap;
    gap: 7px;
}

.compliance-footer__brand {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-weight: 600;
}

.compliance-footer__mark {
    width: 7px;
    height: 7px;
    border-radius: 999px;
    background: #0f8a80;
    box-shadow: 0 0 0 4px rgba(15, 138, 128, 0.1);
}

.compliance-footer__separator {
    color: currentColor;
    opacity: 0.5;
}

.compliance-footer__record {
    color: inherit;
    text-decoration: none;
    transition: color 160ms ease, opacity 160ms ease;
}

.compliance-footer__record:hover {
    color: #0f766e;
}

.compliance-footer__record--public-security {
    display: inline-flex;
    align-items: center;
    gap: 5px;
}

.compliance-footer__record--public-security img {
    width: 15px;
    height: 15px;
    object-fit: contain;
}

.compliance-footer--light {
    color: #7b8798;
    border-top: 1px solid #e8edf3;
    background: rgba(255, 255, 255, 0.72);
}

.compliance-footer--light .compliance-footer__brand {
    color: #526174;
}

.compliance-footer--dark {
    color: rgba(226, 239, 247, 0.68);
    border-top: 1px solid rgba(226, 239, 247, 0.1);
    background: rgba(2, 12, 23, 0.18);
    backdrop-filter: blur(10px);
}

.compliance-footer--dark .compliance-footer__brand {
    color: rgba(244, 251, 255, 0.9);
}

.compliance-footer--dark .compliance-footer__mark {
    background: #5eead4;
    box-shadow: 0 0 0 4px rgba(94, 234, 212, 0.12);
}

.compliance-footer--dark .compliance-footer__record:hover {
    color: #99f6e4;
}
</style>

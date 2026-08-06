<template>
    <footer class='compliance-footer' :class='`compliance-footer--${variant}`'>
        <div class='compliance-footer__inner'>
            <span class='compliance-footer__brand'>
                <span class='compliance-footer__mark' aria-hidden='true' />
                内容支持工具
            </span>
            <span class='compliance-footer__divider' aria-hidden='true' />
            <span>© {{ currentYear }} 广州超起信息科技有限公司</span>
            <a
                class='compliance-footer__record'
                href='https://beian.miit.gov.cn/'
                target='_blank'
                rel='noopener noreferrer'
            >
                粤ICP备2025496411号
            </a>
        </div>
    </footer>
</template>

<script lang='ts' setup>
import { computed } from 'vue'

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
    display: flex;
    align-items: center;
    justify-content: center;
    flex-wrap: wrap;
    gap: 8px 14px;
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

.compliance-footer__divider {
    width: 1px;
    height: 12px;
}

.compliance-footer__record {
    color: inherit;
    text-decoration: none;
    transition: color 160ms ease;
}

.compliance-footer__record:hover {
    color: #0f766e;
}

.compliance-footer--light {
    color: #7b8798;
    border-top: 1px solid #e8edf3;
    background: rgba(255, 255, 255, 0.72);
}

.compliance-footer--light .compliance-footer__brand {
    color: #526174;
}

.compliance-footer--light .compliance-footer__divider {
    background: #d8e0e9;
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

.compliance-footer--dark .compliance-footer__divider {
    background: rgba(226, 239, 247, 0.2);
}

.compliance-footer--dark .compliance-footer__record:hover {
    color: #99f6e4;
}

@media (max-width: 640px) {
    .compliance-footer {
        padding: 15px 18px 17px;
    }

    .compliance-footer__inner {
        gap: 5px 10px;
    }

    .compliance-footer__divider {
        display: none;
    }

    .compliance-footer__brand {
        width: 100%;
        justify-content: center;
    }
}
</style>

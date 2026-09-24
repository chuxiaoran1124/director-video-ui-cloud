declare const __APP_BUILD_ID__: string

import { hasCriticalOperation } from './criticalOperation'

const VERSION_CHECK_INTERVAL = 60 * 1000
const VISIBLE_IDLE_BEFORE_REFRESH = 5 * 60 * 1000
const HIDDEN_IDLE_BEFORE_REFRESH = 30 * 1000
const REFRESH_RETRY_INTERVAL = 5 * 1000

const ACTIVITY_EVENTS = ['pointerdown', 'keydown', 'touchstart', 'wheel', 'input', 'change', 'focusin'] as const
const BUSY_SELECTORS = [
    '.el-loading-mask',
    '.el-overlay',
    '.el-upload-list__item.is-uploading',
    '[aria-busy="true"]'
]

let lastActivityAt = Date.now()
let pendingVersion = ''
let refreshTimer: number | undefined
let versionCheckRunning = false

function isVisible(element: Element): boolean {
    const style = window.getComputedStyle(element)
    return style.display !== 'none' && style.visibility !== 'hidden' && element.getClientRects().length > 0
}

function hasBusyUi(): boolean {
    return BUSY_SELECTORS.some(selector => Array.from(document.querySelectorAll(selector)).some(isVisible))
}

function hasFocusedEditor(): boolean {
    const active = document.activeElement as HTMLElement | null
    if (!active || active === document.body) return false
    return active.matches('input, textarea, select, [contenteditable="true"]')
        || Boolean(active.closest('[contenteditable="true"]'))
}

function markActivity(): void {
    lastActivityAt = Date.now()
}

function refreshToVersion(version: string): void {
    const nextUrl = new URL(window.location.href)
    nextUrl.searchParams.set('_appv', version)
    window.location.replace(nextUrl.toString())
}

function tryRefresh(): void {
    if (!pendingVersion) return

    const idleFor = Date.now() - lastActivityAt
    const requiredIdle = document.hidden ? HIDDEN_IDLE_BEFORE_REFRESH : VISIBLE_IDLE_BEFORE_REFRESH
    if (idleFor < requiredIdle || hasCriticalOperation() || hasBusyUi() || hasFocusedEditor()) return

    refreshToVersion(pendingVersion)
}

async function checkVersion(): Promise<void> {
    if (versionCheckRunning) return
    versionCheckRunning = true
    try {
        const response = await fetch(`/version.json?t=${Date.now()}`, {
            cache: 'no-store',
            credentials: 'same-origin'
        })
        if (!response.ok) return

        const payload = await response.json()
        const remoteVersion = String(payload?.version || '')
        if (remoteVersion && remoteVersion !== __APP_BUILD_ID__) {
            pendingVersion = remoteVersion
            tryRefresh()
        }
    } catch (_error) {
        // 版本检查失败不影响当前业务页面，下一轮自动重试。
    } finally {
        versionCheckRunning = false
    }
}

export function startVersionRefreshGuard(): void {
    if (!import.meta.env.PROD) return

    ACTIVITY_EVENTS.forEach(eventName => {
        window.addEventListener(eventName, markActivity, { capture: true, passive: true })
    })
    document.addEventListener('visibilitychange', tryRefresh)

    window.setInterval(checkVersion, VERSION_CHECK_INTERVAL)
    refreshTimer = window.setInterval(tryRefresh, REFRESH_RETRY_INTERVAL)
    window.setTimeout(checkVersion, 10 * 1000)

    window.addEventListener('beforeunload', () => {
        if (refreshTimer) window.clearInterval(refreshTimer)
    }, { once: true })
}

declare const __APP_BUILD_ID__: string

import { hasCriticalOperation } from './criticalOperation'

const VERSION_CHECK_INTERVAL = 60 * 1000
const VISIBLE_IDLE_BEFORE_REFRESH = 5 * 60 * 1000
const HIDDEN_IDLE_BEFORE_REFRESH = 5 * 60 * 1000
const REFRESH_RETRY_INTERVAL = 5 * 1000
const REFRESH_STATE_KEY = 'director-video-version-refresh-state'
const REFRESH_STATE_TTL = 5 * 60 * 1000

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
const refreshBlockers = new Set<() => boolean>()
const refreshStateCaptures = new Map<string, { path: string; capture: () => unknown }>()
const currentPath = () => `${location.pathname}${location.hash}`
const activeStateCaptures = () => Array.from(refreshStateCaptures.entries()).filter(([, entry]) => entry.path === currentPath())

// 页面可登记未保存的编辑状态。新版本仍会被发现，但在编辑完成前不会强制重载。
export function registerVersionRefreshBlocker(blocker: () => boolean): () => void {
    refreshBlockers.add(blocker)
    return () => refreshBlockers.delete(blocker)
}

// 只有自动更新使用这份一次性快照；普通手动刷新不恢复旧查询条件。
export function registerVersionRefreshState(name: string, capture: () => unknown): () => void {
    refreshStateCaptures.set(name, { path: currentPath(), capture })
    return () => refreshStateCaptures.delete(name)
}

export function consumeVersionRefreshState<T>(name: string): T | null {
    try {
        const raw = sessionStorage.getItem(REFRESH_STATE_KEY)
        if (!raw) return null
        const snapshot = JSON.parse(raw)
        if (snapshot.path !== currentPath() || Date.now() - snapshot.savedAt > REFRESH_STATE_TTL) {
            sessionStorage.removeItem(REFRESH_STATE_KEY)
            return null
        }
        const value = snapshot.states?.[name]
        delete snapshot.states?.[name]
        if (Object.keys(snapshot.states || {}).length) sessionStorage.setItem(REFRESH_STATE_KEY, JSON.stringify(snapshot))
        else sessionStorage.removeItem(REFRESH_STATE_KEY)
        return value ?? null
    } catch {
        sessionStorage.removeItem(REFRESH_STATE_KEY)
        return null
    }
}

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
    try {
        const states: Record<string, unknown> = {}
        activeStateCaptures().forEach(([name, entry]) => { states[name] = entry.capture() })
        sessionStorage.setItem(REFRESH_STATE_KEY, JSON.stringify({
            path: currentPath(),
            savedAt: Date.now(),
            scrollX: window.scrollX,
            scrollY: window.scrollY,
            states
        }))
    } catch {
        // 无法保存当前状态时不能强制更新，以免把用户送回列表第一页。
        return
    }
    const nextUrl = new URL(window.location.href)
    nextUrl.searchParams.set('_appv', version)
    window.location.replace(nextUrl.toString())
}

function tryRefresh(): void {
    if (!pendingVersion) return

    const idleFor = Date.now() - lastActivityAt
    const requiredIdle = document.hidden ? HIDDEN_IDLE_BEFORE_REFRESH : VISIBLE_IDLE_BEFORE_REFRESH
    const visiblePagination = Array.from(document.querySelectorAll('.el-pagination')).some(isVisible)
    if (idleFor < requiredIdle || hasCriticalOperation() || hasBusyUi() || hasFocusedEditor()
        || (visiblePagination && activeStateCaptures().length === 0)
        || Array.from(refreshBlockers).some(blocker => blocker())) return

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

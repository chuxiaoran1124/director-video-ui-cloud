let criticalOperationCount = 0

export function beginCriticalOperation(): () => void {
    criticalOperationCount += 1
    let released = false
    return () => {
        if (released) return
        released = true
        criticalOperationCount = Math.max(0, criticalOperationCount - 1)
    }
}

export function hasCriticalOperation(): boolean {
    return criticalOperationCount > 0
}

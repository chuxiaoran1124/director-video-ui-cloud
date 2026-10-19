// Render API ISO timestamps in the viewer's local timezone, without altering API values.
export function formatTaskTime(value?: string | null): string {
    if (!value) return '—'
    const date = new Date(value.replace(' ', 'T'))
    if (!Number.isFinite(date.getTime())) return '—'
    const pad = (part: number) => String(part).padStart(2, '0')
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

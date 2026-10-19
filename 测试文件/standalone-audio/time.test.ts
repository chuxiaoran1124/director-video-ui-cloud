import { formatTaskTime } from '../../src/components/StandaloneAudioTools/time'

test('friendly local timestamps omit ISO separator and fractional seconds', () => {
    expect(formatTaskTime('2026-10-19T14:13:05.123456')).toBe('2026-10-19 14:13:05')
    expect(formatTaskTime('2026-10-19 14:13:05')).toBe('2026-10-19 14:13:05')
    const utc = new Date('2026-10-19T06:13:05Z')
    expect(formatTaskTime(utc.toISOString())).toContain(` ${String(utc.getHours()).padStart(2, '0')}:13:05`)
})

test('missing or invalid time is a placeholder', () => {
    expect(formatTaskTime(null)).toBe('—')
    expect(formatTaskTime('invalid')).toBe('—')
})

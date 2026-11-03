import { describe, expect, it } from 'vitest'
import { isSameLocalDay, localDayKey } from '@/logic/day'

describe('localDayKey', () => {
  it('usa el día local y no UTC', () => {
    const late = new Date(2026, 10, 3, 23, 59, 59).getTime()
    const early = new Date(2026, 10, 4, 0, 0, 1).getTime()

    expect(localDayKey(late)).toBe('2026-11-03')
    expect(localDayKey(early)).toBe('2026-11-04')
  })

  it('compara días locales', () => {
    const morning = new Date(2026, 10, 3, 8, 0, 0).getTime()
    const night = new Date(2026, 10, 3, 23, 0, 0).getTime()

    expect(isSameLocalDay(morning, night)).toBe(true)
    expect(isSameLocalDay(morning, night + 2 * 60 * 60 * 1000)).toBe(false)
  })
})

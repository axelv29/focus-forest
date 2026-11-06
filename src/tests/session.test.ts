import { describe, expect, it } from 'vitest'
import { sessionName } from '@/logic/session'

describe('sessionName', () => {
  it('numera el próximo pomodoro del día', () => {
    expect(sessionName(null, 0)).toBe('Pomodoro 1 · Hoy')
    expect(sessionName('focus', 2)).toBe('Pomodoro 3 · Hoy')
  })

  it('nombra el descanso sin numerarlo', () => {
    expect(sessionName('break', 4)).toBe('Descanso · Hoy')
  })
})

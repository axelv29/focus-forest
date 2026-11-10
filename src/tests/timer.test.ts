import { describe, expect, it } from 'vitest'
import {
  createBreakSession,
  createFocusSession,
  elapsedMs,
  formatClock,
  isExpired,
  pauseSession,
  remainingMs,
  resumeSession,
} from '@/logic/timer'

const START = new Date(2026, 10, 3, 10, 0, 0).getTime()
const MINUTE = 60_000
const CELL = { col: 0, row: 0 }

describe('createFocusSession', () => {
  it('crea una sesión de 25 minutos con celda', () => {
    const session = createFocusSession('s1', START, CELL)

    expect(session.kind).toBe('focus')
    expect(session.durationMin).toBe(25)
    expect(session.endsAt).toBe(START + 25 * MINUTE)
    expect(session.cell).toEqual(CELL)
    expect(session.pausedAt).toBeNull()
  })
})

describe('createBreakSession', () => {
  it('crea un descanso de 5 minutos sin celda', () => {
    const session = createBreakSession('b1', START)

    expect(session.kind).toBe('break')
    expect(session.durationMin).toBe(5)
    expect(session.endsAt).toBe(START + 5 * MINUTE)
    expect(session.cell).toBeNull()
  })
})

describe('remainingMs', () => {
  it('descuenta el tiempo transcurrido', () => {
    const session = createFocusSession('s1', START, CELL)

    expect(remainingMs(session, START)).toBe(25 * MINUTE)
    expect(remainingMs(session, START + 5 * MINUTE)).toBe(20 * MINUTE)
    expect(remainingMs(session, START + 30 * MINUTE)).toBe(0)
  })
})

describe('pausa', () => {
  it('congela el restante y no cuenta el tiempo pausado', () => {
    const session = createFocusSession('s1', START, CELL)
    const paused = pauseSession(session, START + 10 * MINUTE)

    expect(remainingMs(paused, START + 20 * MINUTE)).toBe(15 * MINUTE)
    expect(elapsedMs(paused, START + 20 * MINUTE)).toBe(10 * MINUTE)
    expect(isExpired(paused, START + 40 * MINUTE)).toBe(false)
  })

  it('al reanudar corre el final por el tiempo pausado', () => {
    const session = createFocusSession('s1', START, CELL)
    const paused = pauseSession(session, START + 10 * MINUTE)
    const resumed = resumeSession(paused, START + 20 * MINUTE)

    expect(resumed.pausedAt).toBeNull()
    expect(resumed.pausedMs).toBe(10 * MINUTE)
    expect(resumed.endsAt).toBe(START + 35 * MINUTE)
    expect(remainingMs(resumed, START + 20 * MINUTE)).toBe(15 * MINUTE)
    expect(elapsedMs(resumed, START + 25 * MINUTE)).toBe(15 * MINUTE)
    expect(isExpired(resumed, START + 34 * MINUTE)).toBe(false)
    expect(isExpired(resumed, START + 35 * MINUTE)).toBe(true)
  })

  it('pausar dos veces no duplica el estado', () => {
    const session = createFocusSession('s1', START, CELL)
    const once = pauseSession(session, START + MINUTE)
    const twice = pauseSession(once, START + 2 * MINUTE)

    expect(twice).toBe(once)
  })
})

describe('formatClock', () => {
  it('formatea en mm:ss', () => {
    expect(formatClock(25 * MINUTE)).toBe('25:00')
    expect(formatClock(61_000)).toBe('01:01')
    expect(formatClock(59_000)).toBe('00:59')
    expect(formatClock(0)).toBe('00:00')
    expect(formatClock(-500)).toBe('00:00')
  })
})

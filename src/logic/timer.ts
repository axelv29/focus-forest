import { BREAK_MINUTES, FOCUS_MINUTES } from '@/config/timer'
import type { ActiveSession, Cell } from '@/state/types'

export function createFocusSession(id: string, now: number, cell: Cell, focusMin: number = FOCUS_MINUTES): ActiveSession {
  return {
    id,
    kind: 'focus',
    startedAt: now,
    endsAt: now + focusMin * 60_000,
    durationMin: focusMin,
    pausedAt: null,
    pausedMs: 0,
    cell,
  }
}

export function createBreakSession(id: string, now: number, breakMin: number = BREAK_MINUTES): ActiveSession {
  return {
    id,
    kind: 'break',
    startedAt: now,
    endsAt: now + breakMin * 60_000,
    durationMin: breakMin,
    pausedAt: null,
    pausedMs: 0,
    cell: null,
  }
}

/**
 * Tiempo restante. Si está pausado, el reloj se congela en `pausedAt`.
 * Nunca se resta un contador: todo se deriva de `endsAt`.
 */
export function remainingMs(session: ActiveSession, now: number): number {
  const reference = session.pausedAt ?? now

  return Math.max(0, session.endsAt - reference)
}

/** Tiempo efectivo de la sesión, sin contar las pausas. */
export function elapsedMs(session: ActiveSession, now: number): number {
  const reference = session.pausedAt ?? Math.min(now, session.endsAt)

  return Math.max(0, reference - session.startedAt - session.pausedMs)
}

export function isExpired(session: ActiveSession, now: number): boolean {
  if (session.pausedAt !== null) {
    return false
  }

  return now >= session.endsAt
}

export function pauseSession(session: ActiveSession, now: number): ActiveSession {
  if (session.pausedAt !== null) {
    return session
  }

  return { ...session, pausedAt: now }
}

export function resumeSession(session: ActiveSession, now: number): ActiveSession {
  if (session.pausedAt === null) {
    return session
  }

  const pausedFor = now - session.pausedAt

  return {
    ...session,
    endsAt: session.endsAt + pausedFor,
    pausedMs: session.pausedMs + pausedFor,
    pausedAt: null,
  }
}

export function formatClock(ms: number): string {
  const totalSeconds = Math.ceil(Math.max(0, ms) / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

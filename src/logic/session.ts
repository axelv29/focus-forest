import type { SessionKind } from '@/state/types'

/**
 * Nombre visible de la sesión. Se deriva de los datos existentes: el próximo
 * pomodoro del día. Cuando exista el nombre editable (v0.2), esta función
 * devuelve ese valor y no cambia la interfaz.
 */
export function sessionName(kind: SessionKind | null, todayPomodoros: number): string {
  if (kind === 'break') {
    return 'Descanso · Hoy'
  }

  return `Pomodoro ${todayPomodoros + 1} · Hoy`
}

/** Día y hora de inicio, con el formato corto de la tarjeta de sesión. */
export function formatSessionStart(timestamp: number): string {
  const date = new Intl.DateTimeFormat('es', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
    .format(new Date(timestamp))
    .replace(',', '')
  const time = new Intl.DateTimeFormat('es', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(timestamp))

  return `${date.charAt(0).toUpperCase()}${date.slice(1)}, ${time}`
}

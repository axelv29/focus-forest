import { localDayKey } from './day'

export interface DateParts {
  year: number
  month: number
  day: number
}

export interface CountdownLabel {
  label: string
  past: boolean
}

const DATE_KEY = /^(\d{4})-(\d{2})-(\d{2})$/

export function parseDateKey(value: string): DateParts | null {
  const match = DATE_KEY.exec(value)
  if (!match) {
    return null
  }

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const date = new Date(year, month - 1, day)

  // Rechaza fechas imposibles como 2026-02-31.
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null
  }

  return { year, month, day }
}

export function dateKeyFromParts(year: number, month: number, day: number): string {
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

export function dateKeyFromDate(date: Date): string {
  return dateKeyFromParts(date.getFullYear(), date.getMonth() + 1, date.getDate())
}

export function todayKey(now = Date.now()): string {
  return localDayKey(now)
}

export function shiftDateKey(value: string, days: number): string {
  const parts = parseDateKey(value)
  if (!parts) {
    return value
  }

  const date = new Date(parts.year, parts.month - 1, parts.day)
  date.setDate(date.getDate() + days)
  return dateKeyFromDate(date)
}

/** Diferencia en días entre dos claves locales, sin horarios ni zonas. */
export function daysBetweenKeys(from: string, to: string): number {
  const a = parseDateKey(from)
  const b = parseDateKey(to)
  if (!a || !b) {
    return 0
  }

  return Math.round(
    (Date.UTC(b.year, b.month - 1, b.day) - Date.UTC(a.year, a.month - 1, a.day)) / 86_400_000,
  )
}

export function formatDateKey(value: string): string {
  const parts = parseDateKey(value)
  if (!parts) {
    return value
  }

  return new Intl.DateTimeFormat('es', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(parts.year, parts.month - 1, parts.day))
}

export function monthLabel(year: number, month: number): string {
  const label = new Intl.DateTimeFormat('es', {
    month: 'long',
    year: 'numeric',
  }).format(new Date(year, month - 1, 1))

  return label.charAt(0).toUpperCase() + label.slice(1)
}

export function describeForestCountdown(
  endsOn: string | null,
  now = Date.now(),
): CountdownLabel | null {
  if (!endsOn || !parseDateKey(endsOn)) {
    return null
  }

  const difference = daysBetweenKeys(todayKey(now), endsOn)

  if (difference === 0) {
    return { label: 'Último día', past: false }
  }
  if (difference === 1) {
    return { label: 'Falta 1 día', past: false }
  }
  if (difference > 1) {
    return { label: `Faltan ${difference} días`, past: false }
  }
  if (difference === -1) {
    return { label: 'Terminó ayer', past: true }
  }

  return { label: `Terminó hace ${Math.abs(difference)} días`, past: true }
}

export function isPastDateKey(value: string, now = Date.now()): boolean {
  return daysBetweenKeys(todayKey(now), value) < 0
}

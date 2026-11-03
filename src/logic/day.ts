/**
 * Clave de día local (YYYY-MM-DD).
 *
 * No usar `toISOString()`: convierte a UTC y corre el día en zonas como
 * Argentina, sobre todo cerca de la medianoche.
 */
export function localDayKey(timestamp: number): string {
  const date = new Date(timestamp)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

export function isSameLocalDay(a: number, b: number): boolean {
  return localDayKey(a) === localDayKey(b)
}

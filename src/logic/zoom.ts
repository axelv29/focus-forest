import { DEFAULT_ZOOM, MAX_ZOOM, MIN_ZOOM } from '@/config/zoom'

/**
 * Mantiene el zoom dentro del rango visible y lo redondea a dos decimales
 * para que el slider y los botones no acumulen errores de punto flotante.
 */
export function clampZoom(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_ZOOM
  }

  const clamped = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value))
  return Math.round(clamped * 100) / 100
}

export function stepZoom(value: number, delta: number): number {
  return clampZoom(value + delta)
}

export function formatZoom(value: number): string {
  return `${Math.round(clampZoom(value) * 100)}%`
}

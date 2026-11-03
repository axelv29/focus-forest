import { DEFAULT_ZOOM, MAX_ZOOM, MIN_ZOOM } from '@/config/zoom'

/** Sensibilidad de la rueda; un delta de 100 px acerca o aleja ~14%. */
const WHEEL_SENSITIVITY = 0.0015

function clampValue(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_ZOOM
  }

  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value))
}

/**
 * Mantiene el zoom dentro del rango visible y lo redondea a dos decimales
 * para que el slider y los botones no acumulen errores de punto flotante.
 */
export function clampZoom(value: number): number {
  return Math.round(clampValue(value) * 100) / 100
}

/**
 * Convierte el desplazamiento de la rueda en un zoom continuo.
 * No redondea a dos decimales para que los deltas chicos de un trackpad
 * se acumulen en lugar de perderse en cada evento.
 */
export function zoomFromWheel(value: number, deltaY: number, deltaMode = 0): number {
  if (!Number.isFinite(deltaY) || deltaY === 0) {
    return clampValue(value)
  }

  const unit = deltaMode === 1 ? 16 : deltaMode === 2 ? 100 : 1
  return clampValue(value * Math.exp(-deltaY * unit * WHEEL_SENSITIVITY))
}

export function stepZoom(value: number, delta: number): number {
  return clampZoom(value + delta)
}

export function formatZoom(value: number): string {
  return `${Math.round(clampZoom(value) * 100)}%`
}

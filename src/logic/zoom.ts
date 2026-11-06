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

/**
 * Escala base en píxeles físicos por píxel lógico. Elige la mayor escala
 * entera (o 0.5x) que entra en el contenedor sin desbordarlo.
 */
export function fitPixelScale(ideal: number): number {
  if (!Number.isFinite(ideal) || ideal <= 0) {
    return 1
  }
  if (ideal < 1) {
    return 0.5
  }
  return Math.max(1, Math.floor(ideal))
}

/**
 * Redondea a una escala pixel-perfect: 0.5x o un múltiplo entero.
 * Evita que el pixel art se reescale con factores fraccionarios.
 */
export function snapPixelScale(ideal: number): number {
  if (!Number.isFinite(ideal) || ideal <= 0) {
    return 1
  }
  if (ideal < 0.75) {
    return 0.5
  }
  return Math.max(1, Math.round(ideal))
}

/** Convierte un zoom continuo al nivel pixel-perfect más cercano. */
export function pixelPerfectZoom(value: number, basePixelScale: number): number {
  const base = Math.max(0.5, basePixelScale)
  const snapped = snapPixelScale(base * clampValue(value))
  return clampZoom(snapped / base)
}

/**
 * Nivel mínimo de zoom. Si la escala base ya es 1 o menor, el propio ajuste
 * es el mínimo; si es mayor, no baja de una escala entera para no muestrear
 * el pixel art hacia abajo.
 */
export function minPixelPerfectZoom(basePixelScale: number): number {
  const base = Math.max(0.5, basePixelScale)
  if (base <= 1) {
    return 1
  }
  return clampZoom(Math.max(1, Math.ceil(base * MIN_ZOOM)) / base)
}

/** Avanza al siguiente nivel pixel-perfect en la dirección indicada. */
export function stepPixelPerfectZoom(
  value: number,
  basePixelScale: number,
  direction: 1 | -1,
): number {
  const base = Math.max(0.5, basePixelScale)
  const current = snapPixelScale(base * clampValue(value))
  const next = direction > 0 ? (current < 1 ? 1 : current + 1) : current <= 1 ? 0.5 : current - 1

  return clampZoom(next / base)
}

export function formatZoom(value: number): string {
  return `${Math.round(clampZoom(value) * 100)}%`
}

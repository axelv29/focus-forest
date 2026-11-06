import { DEFAULT_ZOOM, MAX_ZOOM, MIN_ZOOM, WHEEL_STEP_DELTA } from '@/config/zoom'

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

/** Lleva un delta de rueda (píxeles, líneas o páginas) a una unidad común. */
export function normalizeWheelDelta(deltaY: number, deltaMode = 0): number {
  if (!Number.isFinite(deltaY) || deltaY === 0) {
    return 0
  }

  const unit = deltaMode === 1 ? 16 : deltaMode === 2 ? 100 : 1
  return deltaY * unit
}

export interface WheelZoomStep {
  zoom: number
  accumulator: number
}

/**
 * Acumula la rueda y avanza un único nivel pixel-perfect cuando se alcanza el
 * umbral. Así un giro normal cambia 50→100→150→200 sin saltos intermedios y
 * los deltas chicos de un trackpad no se pierden.
 */
export function wheelZoomStep(
  zoom: number,
  basePixelScale: number,
  accumulator: number,
  deltaY: number,
  deltaMode = 0,
): WheelZoomStep {
  const delta = normalizeWheelDelta(deltaY, deltaMode)
  if (delta === 0) {
    return { zoom, accumulator }
  }

  const previous = Number.isFinite(accumulator) ? accumulator : 0
  const nextAccumulator = Math.sign(previous) === Math.sign(delta) ? previous + delta : delta

  if (Math.abs(nextAccumulator) < WHEEL_STEP_DELTA) {
    return { zoom, accumulator: nextAccumulator }
  }

  const direction: 1 | -1 = nextAccumulator < 0 ? 1 : -1
  return {
    zoom: stepPixelPerfectZoom(zoom, basePixelScale, direction),
    accumulator: 0,
  }
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

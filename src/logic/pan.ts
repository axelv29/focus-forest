/**
 * Límites del arrastre global de la pradera.
 *
 * Se miden simétricamente desde el centro del mapa. El recorrido base crece
 * con el zoom y además se suma la parte del canvas que desborda el contenedor,
 * con un margen fijo. Así el 200 % tiene mucha más movilidad que el 50 %.
 */
const PAN_X = 150
const PAN_Y = 170
const EDGE_MARGIN = 80

export interface PanOffset {
  x: number
  y: number
}

export interface PanLimit {
  x: number
  y: number
}

function safeSize(value: number): number {
  return Number.isFinite(value) && value > 0 ? value : 0
}

export function panLimit(
  zoom: number,
  canvasWidth: number,
  canvasHeight: number,
  containerWidth: number,
  containerHeight: number,
): PanLimit {
  const safeZoom = Number.isFinite(zoom) ? Math.min(2, Math.max(0.5, zoom)) : 1
  const overflowX = Math.max(0, (safeSize(canvasWidth) - safeSize(containerWidth)) / 2)
  const overflowY = Math.max(0, (safeSize(canvasHeight) - safeSize(containerHeight)) / 2)

  return {
    x: Math.round(Math.max(PAN_X * safeZoom, overflowX + EDGE_MARGIN)),
    y: Math.round(Math.max(PAN_Y * safeZoom, overflowY + EDGE_MARGIN)),
  }
}

/** Mantiene el desplazamiento dentro del límite, en píxeles enteros. */
export function clampPan(offset: PanOffset, limit: PanLimit): PanOffset {
  const x = Number.isFinite(offset.x) ? offset.x : 0
  const y = Number.isFinite(offset.y) ? offset.y : 0

  return {
    x: Math.round(Math.min(limit.x, Math.max(-limit.x, x))),
    y: Math.round(Math.min(limit.y, Math.max(-limit.y, y))),
  }
}

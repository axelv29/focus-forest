import { describe, expect, it } from 'vitest'
import { MAX_ZOOM, MIN_ZOOM } from '@/config/zoom'
import { clampZoom, formatZoom, stepZoom, zoomFromWheel } from '@/logic/zoom'

describe('clampZoom', () => {
  it('mantiene el rango 0.5–2', () => {
    expect(clampZoom(0.2)).toBe(MIN_ZOOM)
    expect(clampZoom(0.5)).toBe(0.5)
    expect(clampZoom(1.234)).toBe(1.23)
    expect(clampZoom(2)).toBe(MAX_ZOOM)
    expect(clampZoom(3)).toBe(MAX_ZOOM)
  })

  it('vuelve al centro con valores inválidos', () => {
    expect(clampZoom(Number.NaN)).toBe(1)
    expect(clampZoom(Number.POSITIVE_INFINITY)).toBe(1)
  })
})

describe('stepZoom', () => {
  it('suma y resta sin salir del rango', () => {
    expect(stepZoom(1, 0.1)).toBe(1.1)
    expect(stepZoom(1, -0.1)).toBe(0.9)
    expect(stepZoom(0.5, -0.1)).toBe(0.5)
    expect(stepZoom(2, 0.1)).toBe(2)
  })
})

describe('zoomFromWheel', () => {
  it('acerca al girar hacia arriba y aleja al girar hacia abajo', () => {
    expect(zoomFromWheel(1, -100)).toBeGreaterThan(1)
    expect(zoomFromWheel(1, 100)).toBeLessThan(1)
  })

  it('acumula los deltas chicos sin redondear cada evento', () => {
    const first = zoomFromWheel(1, 4)
    expect(first).toBeLessThan(1)
    expect(zoomFromWheel(first, 4)).toBeLessThan(first)
  })

  it('respeta los límites y los deltas inválidos', () => {
    expect(zoomFromWheel(MIN_ZOOM, 1000)).toBe(MIN_ZOOM)
    expect(zoomFromWheel(MAX_ZOOM, -1000)).toBe(MAX_ZOOM)
    expect(zoomFromWheel(1, 0)).toBe(1)
    expect(zoomFromWheel(1, Number.NaN)).toBe(1)
  })

  it('normaliza los deltas por línea y por página', () => {
    expect(zoomFromWheel(1, -1, 1)).toBeGreaterThan(zoomFromWheel(1, -1, 0))
    expect(zoomFromWheel(1, -1, 2)).toBeGreaterThan(zoomFromWheel(1, -1, 1))
  })
})

describe('formatZoom', () => {
  it('muestra el porcentaje redondeado', () => {
    expect(formatZoom(0.5)).toBe('50%')
    expect(formatZoom(1)).toBe('100%')
    expect(formatZoom(1.234)).toBe('123%')
    expect(formatZoom(2)).toBe('200%')
  })
})

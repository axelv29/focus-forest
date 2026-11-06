import { describe, expect, it } from 'vitest'
import { MAX_ZOOM, MIN_ZOOM } from '@/config/zoom'
import {
  clampZoom,
  fitPixelScale,
  formatZoom,
  minPixelPerfectZoom,
  normalizeWheelDelta,
  pixelPerfectZoom,
  snapPixelScale,
  stepPixelPerfectZoom,
  stepZoom,
  wheelZoomStep,
} from '@/logic/zoom'

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

describe('rueda de zoom', () => {
  it('normaliza los deltas por píxel, línea y página', () => {
    expect(normalizeWheelDelta(-1)).toBe(-1)
    expect(normalizeWheelDelta(-1, 1)).toBe(-16)
    expect(normalizeWheelDelta(-1, 2)).toBe(-100)
    expect(normalizeWheelDelta(1)).toBe(1)
    expect(normalizeWheelDelta(Number.NaN)).toBe(0)
  })

  it('un giro normal avanza un nivel pixel-perfect', () => {
    expect(wheelZoomStep(1, 2, 0, -100)).toEqual({ zoom: 1.5, accumulator: 0 })
    expect(wheelZoomStep(1.5, 2, 0, -100)).toEqual({ zoom: 2, accumulator: 0 })
    expect(wheelZoomStep(1, 2, 0, 100)).toEqual({ zoom: 0.5, accumulator: 0 })
  })

  it('acumula deltas chicos hasta alcanzar el umbral', () => {
    const first = wheelZoomStep(1, 2, 0, -20)
    expect(first).toEqual({ zoom: 1, accumulator: -20 })
    expect(wheelZoomStep(1, 2, first.accumulator, -20)).toEqual({ zoom: 1.5, accumulator: 0 })
  })

  it('reinicia al cambiar de dirección y respeta los extremos', () => {
    expect(wheelZoomStep(1, 2, -20, 20)).toEqual({ zoom: 1, accumulator: 20 })
    expect(wheelZoomStep(2, 2, 0, -100)).toEqual({ zoom: 2, accumulator: 0 })
    expect(wheelZoomStep(0.5, 2, 0, 100)).toEqual({ zoom: 0.5, accumulator: 0 })
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

describe('escalado del pixel art', () => {
  it('elige la mayor escala que entra sin desbordar', () => {
    expect(fitPixelScale(0.68)).toBe(0.5)
    expect(fitPixelScale(1.09)).toBe(1)
    expect(fitPixelScale(1.9)).toBe(1)
    expect(fitPixelScale(2.1)).toBe(2)
  })

  it('usa solo escalas pixel-perfect', () => {
    expect(snapPixelScale(0.6)).toBe(0.5)
    expect(snapPixelScale(0.9)).toBe(1)
    expect(snapPixelScale(1.2)).toBe(1)
    expect(snapPixelScale(1.4)).toBe(1)
    expect(snapPixelScale(1.6)).toBe(2)
    expect(snapPixelScale(1.8)).toBe(2)
    expect(snapPixelScale(2.2)).toBe(2)
    expect(snapPixelScale(2.4)).toBe(2)
    expect(snapPixelScale(2.8)).toBe(3)
  })

  it('convierte el zoom al nivel pixel-perfect más cercano', () => {
    expect(pixelPerfectZoom(0.7, 1)).toBe(0.5)
    expect(pixelPerfectZoom(1.5, 1)).toBe(2)
    expect(pixelPerfectZoom(0.75, 2)).toBe(1)
    expect(pixelPerfectZoom(0.8, 2)).toBe(1)
    expect(pixelPerfectZoom(1.25, 2)).toBe(1.5)
    expect(pixelPerfectZoom(1.5, 2)).toBe(1.5)
    expect(pixelPerfectZoom(2, 2)).toBe(2)
  })

  it('avanza al siguiente nivel pixel-perfect', () => {
    expect(stepPixelPerfectZoom(1, 1, 1)).toBe(2)
    expect(stepPixelPerfectZoom(1, 1, -1)).toBe(0.5)
    expect(stepPixelPerfectZoom(1, 2, 1)).toBe(1.5)
    expect(stepPixelPerfectZoom(1, 2, -1)).toBe(0.5)
    expect(stepPixelPerfectZoom(0.8, 2, 1)).toBe(1.5)
    expect(stepPixelPerfectZoom(0.8, 2, -1)).toBe(0.5)
    expect(stepPixelPerfectZoom(1.25, 2, -1)).toBe(1)
    expect(stepPixelPerfectZoom(1.25, 2, 1)).toBe(2)
    expect(stepPixelPerfectZoom(0.5, 1, -1)).toBe(0.5)
    expect(stepPixelPerfectZoom(2, 2, 1)).toBe(2)
  })

  it('no baja de 1:1 cuando la base ya entra', () => {
    expect(minPixelPerfectZoom(0.5)).toBe(1)
    expect(minPixelPerfectZoom(1)).toBe(1)
    expect(minPixelPerfectZoom(2)).toBe(0.5)
    expect(minPixelPerfectZoom(3)).toBe(0.67)
    expect(minPixelPerfectZoom(5)).toBe(0.6)
  })
})

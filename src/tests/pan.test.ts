import { describe, expect, it } from 'vitest'
import { clampPan, panLimit } from '@/logic/pan'

describe('arrastre de la pradera', () => {
  it('amplía el recorrido a medida que se acerca el zoom', () => {
    expect(panLimit(0.5, 482, 400, 1024, 853)).toEqual({ x: 80, y: 85 })
    expect(panLimit(1, 962, 800, 1024, 853)).toEqual({ x: 150, y: 170 })
    expect(panLimit(1.5, 1442, 1200, 1024, 853)).toEqual({ x: 289, y: 255 })
    expect(panLimit(2, 1922, 1600, 1024, 853)).toEqual({ x: 529, y: 454 })
  })

  it('usa un límite simétrico desde el centro', () => {
    const limit = panLimit(1, 962, 800, 1024, 853)

    expect(clampPan({ x: 300, y: -300 }, limit)).toEqual({ x: 150, y: -170 })
    expect(clampPan({ x: -300, y: 300 }, limit)).toEqual({ x: -150, y: 170 })
  })

  it('redondea a píxeles enteros y tolera valores inválidos', () => {
    expect(clampPan({ x: 12.4, y: -8.6 }, panLimit(1, 962, 800, 1024, 853))).toEqual({
      x: 12,
      y: -9,
    })
    expect(
      clampPan({ x: Number.NaN, y: Number.POSITIVE_INFINITY }, panLimit(1, 962, 800, 1024, 853)),
    ).toEqual({
      x: 0,
      y: 0,
    })
  })
})

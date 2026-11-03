import { describe, expect, it } from 'vitest'
import {
  CANVAS_HEIGHT,
  CANVAS_OVERSCAN,
  CANVAS_RENDER_HEIGHT,
  CANVAS_RENDER_WIDTH,
  CANVAS_WIDTH,
  SCENE_HEIGHT,
  SCENE_WIDTH,
} from '@/config/grid'
import { MAX_ZOOM } from '@/config/zoom'

describe('canvas de la pradera', () => {
  it('deja margen suficiente para el zoom máximo', () => {
    expect(CANVAS_OVERSCAN).toBeGreaterThanOrEqual(MAX_ZOOM)
    expect(CANVAS_RENDER_WIDTH).toBeGreaterThanOrEqual(CANVAS_WIDTH * MAX_ZOOM)
    expect(CANVAS_RENDER_HEIGHT).toBeGreaterThanOrEqual(CANVAS_HEIGHT * MAX_ZOOM)
  })

  it('mantiene la proporción de la escena', () => {
    expect(CANVAS_RENDER_WIDTH / CANVAS_RENDER_HEIGHT).toBeCloseTo(SCENE_WIDTH / SCENE_HEIGHT)
  })
})

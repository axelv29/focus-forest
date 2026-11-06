import { describe, expect, it } from 'vitest'
import { GRID_PIXEL_HEIGHT, ISLAND_DEPTH, SCENE_HEIGHT, TOP_PADDING } from '@/config/grid'

describe('escena de la pradera', () => {
  it('reserva el margen superior y la profundidad de la isla', () => {
    expect(SCENE_HEIGHT).toBe(TOP_PADDING + GRID_PIXEL_HEIGHT + ISLAND_DEPTH)
  })
})

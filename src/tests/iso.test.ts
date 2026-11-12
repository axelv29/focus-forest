import { describe, expect, it } from 'vitest'
import { ORIGIN_X, ORIGIN_Y, TILE_HEIGHT } from '@/config/grid'
import { cellFromScenePoint, cellToScreen } from '@/render/iso'

describe('cellFromScenePoint', () => {
  it('encuentra el centro de una celda', () => {
    const base = cellToScreen({ col: 3, row: 3 })

    expect(
      cellFromScenePoint({ x: base.x, y: base.y + TILE_HEIGHT / 2 }, 8),
    ).toEqual({ col: 3, row: 3 })
  })

  it('encuentra una celda del borde', () => {
    const base = cellToScreen({ col: 0, row: 0 })

    expect(
      cellFromScenePoint({ x: base.x, y: base.y + TILE_HEIGHT / 2 }, 8),
    ).toEqual({ col: 0, row: 0 })
  })

  it('devuelve null fuera de la pradera', () => {
    expect(cellFromScenePoint({ x: 0, y: 0 }, 8)).toBeNull()
    expect(cellFromScenePoint({ x: ORIGIN_X, y: ORIGIN_Y - TILE_HEIGHT }, 8)).toBeNull()
  })
})

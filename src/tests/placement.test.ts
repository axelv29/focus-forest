import { describe, expect, it } from 'vitest'
import { cellKey, cellOrder, choosePlacement, isCellInside, nextFreeCell } from '@/logic/placement'
import type { Cell, Tree, TreeState } from '@/state/types'

function treeAt(id: string, cell: Cell, state: TreeState, createdAt: number): Tree {
  return {
    id,
    sessionId: `session-${id}`,
    cell,
    stage: 4,
    state,
    createdAt,
  }
}

describe('cellOrder', () => {
  it('genera las 64 celdas sin repetir', () => {
    const order = cellOrder()
    const keys = new Set(order.map(cellKey))

    expect(order).toHaveLength(64)
    expect(keys.size).toBe(64)
  })

  it('empieza por el centro', () => {
    const firstFour = cellOrder().slice(0, 4)

    expect(firstFour).toEqual([
      { col: 3, row: 3 },
      { col: 4, row: 3 },
      { col: 3, row: 4 },
      { col: 4, row: 4 },
    ])
  })
})

describe('nextFreeCell', () => {
  it('elige la celda más cercana al centro', () => {
    expect(nextFreeCell([])).toEqual({ col: 3, row: 3 })
  })

  it('salta las celdas ocupadas', () => {
    expect(nextFreeCell([{ col: 3, row: 3 }])).toEqual({ col: 4, row: 3 })
  })

  it('devuelve null cuando la grilla está llena', () => {
    expect(nextFreeCell(cellOrder())).toBeNull()
  })
})

describe('isCellInside', () => {
  it('valida los límites de la grilla', () => {
    expect(isCellInside({ col: 0, row: 0 })).toBe(true)
    expect(isCellInside({ col: 7, row: 7 })).toBe(true)
    expect(isCellInside({ col: -1, row: 0 })).toBe(false)
    expect(isCellInside({ col: 8, row: 0 })).toBe(false)
  })
})

describe('choosePlacement', () => {
  it('usa una celda libre aunque haya marchitos', () => {
    const trees = [treeAt('withered', { col: 0, row: 0 }, 'withered', 1)]
    const placement = choosePlacement(trees)

    expect(placement).toEqual({ cell: { col: 3, row: 3 }, replacedTreeId: null })
  })

  it('reemplaza el marchito más viejo cuando la grilla está llena', () => {
    const trees = cellOrder().map((cell, index) =>
      treeAt(`mature-${index}`, cell, 'mature', index + 10),
    )
    trees[0] = treeAt('withered-nuevo', trees[0].cell, 'withered', 50)
    trees[1] = treeAt('withered-viejo', trees[1].cell, 'withered', 2)

    expect(choosePlacement(trees)).toEqual({
      cell: trees[1].cell,
      replacedTreeId: 'withered-viejo',
    })
  })

  it('bloquea el inicio si la grilla está llena solo de maduros', () => {
    const trees = cellOrder().map((cell, index) => treeAt(`mature-${index}`, cell, 'mature', index))

    expect(choosePlacement(trees)).toBeNull()
  })
})

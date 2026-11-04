import {
  GRID_COLS,
  GRID_ROWS,
  MIN_TREE_SPACING_CELLS,
  TILE_HEIGHT,
  TILE_WIDTH,
} from '@/config/grid'
import type { Cell, Tree } from '@/state/types'

export function cellKey(cell: Cell): string {
  return `${cell.col},${cell.row}`
}

export function isCellInside(cell: Cell, cols = GRID_COLS, rows = GRID_ROWS): boolean {
  return cell.col >= 0 && cell.col < cols && cell.row >= 0 && cell.row < rows
}

/**
 * Orden de candidatos: del centro hacia afuera.
 * Los empates se resuelven por fila y después por columna, para que el
 * resultado sea siempre el mismo.
 */
export function cellOrder(cols = GRID_COLS, rows = GRID_ROWS): Cell[] {
  const centerX = (cols - 1) / 2
  const centerY = (rows - 1) / 2
  const cells: Cell[] = []

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      cells.push({ col, row })
    }
  }

  return cells.sort((a, b) => {
    const distanceA = (a.col - centerX) ** 2 + (a.row - centerY) ** 2
    const distanceB = (b.col - centerX) ** 2 + (b.row - centerY) ** 2

    if (distanceA !== distanceB) {
      return distanceA - distanceB
    }

    return a.row - b.row || a.col - b.col
  })
}

function cellDistanceSq(a: Cell, b: Cell): number {
  const aX = (a.col - a.row) * TILE_WIDTH
  const aY = (a.col + a.row) * TILE_HEIGHT
  const bX = (b.col - b.row) * TILE_WIDTH
  const bY = (b.col + b.row) * TILE_HEIGHT

  const dx = aX - bX
  const dy = aY - bY

  return dx * dx + dy * dy
}

export function nextFreeCell(
  occupied: readonly Cell[],
  cols = GRID_COLS,
  rows = GRID_ROWS,
  random: () => number = Math.random,
): Cell | null {
  const taken = new Set(occupied.map(cellKey))
  const minDistance = MIN_TREE_SPACING_CELLS * TILE_WIDTH
  const minDistanceSq = minDistance * minDistance
  const candidates = cellOrder(cols, rows).filter((cell) => {
    if (taken.has(cellKey(cell))) {
      return false
    }

    return occupied.every((other) => cellDistanceSq(cell, other) >= minDistanceSq)
  })

  if (candidates.length === 0) {
    return null
  }

  const index = Math.floor(random() * candidates.length)
  return candidates[index]
}

export interface Placement {
  cell: Cell
  /** Si la grilla está llena, la celda pertenece a este árbol marchito. */
  replacedTreeId: string | null
}

/**
 * Elige dónde va el próximo árbol: aleatoriamente entre las celdas libres y
 * espaciadas. Si no quedan candidatas, reemplaza el marchito más viejo; si solo
 * quedan árboles maduros, devuelve null.
 */
export function choosePlacement(
  trees: readonly Tree[],
  random: () => number = Math.random,
): Placement | null {
  const free = nextFreeCell(
    trees.map((tree) => tree.cell),
    GRID_COLS,
    GRID_ROWS,
    random,
  )
  if (free) {
    return { cell: free, replacedTreeId: null }
  }

  const oldestWithered = trees
    .filter((tree) => tree.state === 'withered')
    .sort((a, b) => a.createdAt - b.createdAt)[0]

  if (!oldestWithered) {
    return null
  }

  return { cell: oldestWithered.cell, replacedTreeId: oldestWithered.id }
}

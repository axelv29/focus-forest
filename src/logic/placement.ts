import { GRID_COLS, GRID_ROWS } from '@/config/grid'
import type { Cell, Tree } from '@/state/types'

export function cellKey(cell: Cell): string {
  return `${cell.col},${cell.row}`
}

export function isCellInside(cell: Cell, cols = GRID_COLS, rows = GRID_ROWS): boolean {
  return cell.col >= 0 && cell.col < cols && cell.row >= 0 && cell.row < rows
}

/**
 * Orden de colocación: del centro hacia afuera.
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

export function nextFreeCell(
  occupied: readonly Cell[],
  cols = GRID_COLS,
  rows = GRID_ROWS,
): Cell | null {
  const taken = new Set(occupied.map(cellKey))

  return cellOrder(cols, rows).find((cell) => !taken.has(cellKey(cell))) ?? null
}

export interface Placement {
  cell: Cell
  /** Si la grilla está llena, la celda pertenece a este árbol marchito. */
  replacedTreeId: string | null
}

/**
 * Elige dónde va el próximo árbol. Si la grilla está llena, reemplaza el
 * marchito más viejo; si solo quedan árboles maduros, devuelve null.
 */
export function choosePlacement(trees: readonly Tree[]): Placement | null {
  const free = nextFreeCell(trees.map((tree) => tree.cell))
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

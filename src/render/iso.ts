import {
  GRID_COLS,
  ORIGIN_X,
  ORIGIN_Y,
  TILE_HEIGHT,
  TILE_WIDTH,
  TOP_PADDING,
} from '@/config/grid'
import type { Cell } from '@/state/types'

export interface ScreenPoint {
  x: number
  y: number
}

/** Centro de una celda en coordenadas lógicas de la escena. */
export function cellToScreen(cell: Cell): ScreenPoint {
  return {
    x: ORIGIN_X + (cell.col - cell.row) * (TILE_WIDTH / 2),
    y: ORIGIN_Y + (cell.col + cell.row) * (TILE_HEIGHT / 2),
  }
}

/** Profundidad de dibujo: primero el fondo, después el frente. */
export function drawDepth(cell: Cell): number {
  return cell.col + cell.row
}

export function sortByDepth<T extends { cell: Cell }>(items: readonly T[]): T[] {
  return [...items].sort((a, b) => drawDepth(a.cell) - drawDepth(b.cell) || a.cell.col - b.cell.col)
}

/**
 * Celda que contiene un punto de la escena. Se recorre la grilla y se prueba
 * el rombo de cada celda; el más profundo gana cuando dos se tocan.
 */
export function cellFromScenePoint(
  point: ScreenPoint,
  gardenSize: number = GRID_COLS,
): Cell | null {
  const size = Math.min(GRID_COLS, Math.max(1, Math.round(gardenSize)))
  const meadowShift = TOP_PADDING + (GRID_COLS - size) * TILE_HEIGHT - TOP_PADDING
  let found: Cell | null = null
  let foundDepth = -1

  for (let row = 0; row < size; row += 1) {
    for (let col = 0; col < size; col += 1) {
      const base = cellToScreen({ col, row })
      const centerX = base.x
      const centerY = base.y + meadowShift + TILE_HEIGHT / 2
      const normalized =
        Math.abs((point.x - centerX) / (TILE_WIDTH / 2)) +
        Math.abs((point.y - centerY) / (TILE_HEIGHT / 2))

      if (normalized <= 1 && col + row > foundDepth) {
        found = { col, row }
        foundDepth = col + row
      }
    }
  }

  return found
}

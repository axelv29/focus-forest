import { ORIGIN_X, ORIGIN_Y, TILE_HEIGHT, TILE_WIDTH } from '@/config/grid'
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

import { createJSONStorage, type StateStorage } from 'zustand/middleware'
import { GRID_COLS, GRID_ROWS } from '@/config/grid'
import type { ActiveSession, Cell, FocusRecord, PersistedV1, Tree, TreeStage } from './types'

export const STORAGE_KEY = 'focus-forest'
export const PERSIST_VERSION = 1

export function emptyState(): PersistedV1 {
  return { version: 1, trees: [], sessions: [], active: null }
}

/**
 * localStorage puede fallar por cuota, modo privado o JSON corrupto.
 * En ese caso se conserva una copia del dato roto y se arranca limpio,
 * sin romper la app.
 */
const safeStorage: StateStorage = {
  getItem: (name) => {
    try {
      const raw = localStorage.getItem(name)
      if (raw === null) {
        return null
      }

      JSON.parse(raw)
      return raw
    } catch {
      try {
        const raw = localStorage.getItem(name)
        if (raw !== null) {
          localStorage.setItem(`${name}.broken`, raw)
          localStorage.removeItem(name)
        }
      } catch {
        // Sin almacenamiento disponible.
      }

      return null
    }
  },
  setItem: (name, value) => {
    try {
      localStorage.setItem(name, value)
    } catch {
      // Cuota llena o modo privado: se sigue en memoria.
    }
  },
  removeItem: (name) => {
    try {
      localStorage.removeItem(name)
    } catch {
      // Sin almacenamiento disponible.
    }
  },
}

export const persistStorage = createJSONStorage<PersistedV1>(() => safeStorage)

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isCell(value: unknown): value is Cell {
  return (
    isRecord(value) &&
    typeof value.col === 'number' &&
    typeof value.row === 'number' &&
    Number.isInteger(value.col) &&
    Number.isInteger(value.row) &&
    value.col >= 0 &&
    value.col < GRID_COLS &&
    value.row >= 0 &&
    value.row < GRID_ROWS
  )
}

function isStage(value: unknown): value is TreeStage {
  return value === 1 || value === 2 || value === 3 || value === 4
}

function isTree(value: unknown): value is Tree {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.sessionId === 'string' &&
    isCell(value.cell) &&
    isStage(value.stage) &&
    (value.state === 'mature' || value.state === 'withered') &&
    typeof value.createdAt === 'number'
  )
}

function isFocusRecord(value: unknown): value is FocusRecord {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.startedAt === 'number' &&
    typeof value.endedAt === 'number' &&
    typeof value.durationMin === 'number' &&
    value.durationMin > 0 &&
    (value.status === 'completed' || value.status === 'abandoned') &&
    typeof value.treeId === 'string'
  )
}

function isActiveSession(value: unknown): value is ActiveSession {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    (value.kind === 'focus' || value.kind === 'break') &&
    typeof value.startedAt === 'number' &&
    typeof value.endsAt === 'number' &&
    typeof value.durationMin === 'number' &&
    value.durationMin > 0 &&
    (value.pausedAt === null || typeof value.pausedAt === 'number') &&
    typeof value.pausedMs === 'number' &&
    (value.cell === null || isCell(value.cell))
  )
}

/**
 * Acepta datos de cualquier versión y conserva solo lo que tenga la forma
 * esperada. Una versión futura compatible no se borra; una entrada rota se
 * descarta sin tirar el resto del bosque.
 */
export function migrate(persisted: unknown, _version: number): PersistedV1 {
  const data = isRecord(persisted) ? persisted : {}
  const trees = Array.isArray(data.trees) ? data.trees.filter(isTree) : []
  const sessions = Array.isArray(data.sessions) ? data.sessions.filter(isFocusRecord) : []
  const active = isActiveSession(data.active) ? data.active : null

  return { version: 1, trees, sessions, active }
}

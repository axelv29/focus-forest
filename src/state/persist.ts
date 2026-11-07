import { createJSONStorage, type StateStorage } from 'zustand/middleware'
import { GRID_COLS, GRID_ROWS } from '@/config/grid'
import { reportStorageIssue, useStorageStatus, type StorageIssue } from './storageStatus'
import type { ActiveSession, Cell, FocusRecord, PersistedV2, PomodoroSettings, Tree, TreeStage } from './types'
import { DEFAULT_POMODORO_SETTINGS } from './types'

export const STORAGE_KEY = 'focus-forest'
export const PERSIST_VERSION = 2

export function emptyState(): PersistedV2 {
  return { version: 2, trees: [], sessions: [], active: null, settings: { ...DEFAULT_POMODORO_SETTINGS } }
}

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

function isPomodoroSettings(value: unknown): value is PomodoroSettings {
  if (!isRecord(value)) {
    return false
  }
  return (
    typeof value.focusMin === 'number' &&
    value.focusMin > 0 &&
    typeof value.breakMin === 'number' &&
    value.breakMin > 0 &&
    typeof value.longBreakMin === 'number' &&
    value.longBreakMin > 0 &&
    typeof value.longBreakEvery === 'number' &&
    value.longBreakEvery > 0 &&
    (value.alarmTone === 'bell' || value.alarmTone === 'chime' || value.alarmTone === 'pulse') &&
    typeof value.notification === 'boolean'
  )
}

/** Valida el estado completo; se usa al leer la versión actual. */
export function isPersistedState(value: unknown): value is PersistedV2 {
  return (
    isRecord(value) &&
    value.version === PERSIST_VERSION &&
    Array.isArray(value.trees) &&
    value.trees.every(isTree) &&
    Array.isArray(value.sessions) &&
    value.sessions.every(isFocusRecord) &&
    (value.active === null || isActiveSession(value.active)) &&
    isPomodoroSettings(value.settings)
  )
}

interface PersistedEnvelope {
  state: unknown
  version: unknown
}

function parseEnvelope(raw: string): PersistedEnvelope | null {
  try {
    const value: unknown = JSON.parse(raw)

    if (!isRecord(value) || !('state' in value) || !('version' in value)) {
      return null
    }

    return { state: value.state, version: value.version }
  } catch {
    return null
  }
}

/**
 * Acepta datos de cualquier versión y conserva solo lo que tenga la forma
 * esperada. Una versión futura compatible no se borra; una entrada rota se
 * descarta sin tirar el resto del bosque.
 */
export function migrate(persisted: unknown, _version: number): PersistedV2 {
  const data = isRecord(persisted) ? persisted : {}

  const trees = Array.isArray(data.trees) ? data.trees.filter(isTree) : []
  const sessions = Array.isArray(data.sessions) ? data.sessions.filter(isFocusRecord) : []
  const active = isActiveSession(data.active) ? data.active : null

  const settings = isPomodoroSettings(data.settings)
    ? data.settings
    : { ...DEFAULT_POMODORO_SETTINGS }

  return { version: 2, trees, sessions, active, settings }
}

type GetStorage = () => Storage | null
type ReportIssue = (issue: StorageIssue) => void

function defaultGetStorage(): Storage | null {
  return typeof localStorage === 'undefined' ? null : localStorage
}

function backupState(storage: Storage, name: string, raw: string): boolean {
  try {
    const baseKey = `${name}.broken`
    const backupKey = storage.getItem(baseKey) === null ? baseKey : `${baseKey}.${Date.now()}`

    storage.setItem(backupKey, raw)

    try {
      storage.removeItem(name)
    } catch {
      // Si no se puede borrar, la copia ya está a salvo.
    }

    return true
  } catch {
    return false
  }
}

/**
 * Envuelve localStorage con tres protecciones:
 * - datos dañados: copia en `focus-forest.broken` y reinicio;
 * - versión más nueva: aviso y escrituras bloqueadas, sin tocar el original;
 * - almacenamiento bloqueado o lleno: aviso y estado solo en memoria.
 */
export function createSafeStorage(
  getStorage: GetStorage = defaultGetStorage,
  reportIssue: ReportIssue = reportStorageIssue,
): StateStorage {
  let writesBlocked = false

  return {
    getItem: (name) => {
      let storage: Storage | null

      try {
        storage = getStorage()
      } catch {
        reportIssue({ kind: 'unavailable' })
        return null
      }

      if (!storage) {
        reportIssue({ kind: 'unavailable' })
        return null
      }

      let raw: string | null
      try {
        raw = storage.getItem(name)
      } catch {
        reportIssue({ kind: 'unavailable' })
        return null
      }

      if (raw === null) {
        return null
      }

      const resetCorrupt = (): null => {
        const backedUp = backupState(storage, name, raw)
        if (!backedUp) {
          writesBlocked = true
        }
        reportIssue(backedUp ? { kind: 'corrupt' } : { kind: 'unavailable' })
        return null
      }

      const envelope = parseEnvelope(raw)
      if (!envelope) {
        return resetCorrupt()
      }

      if (typeof envelope.version !== 'number' || !Number.isFinite(envelope.version)) {
        return resetCorrupt()
      }

      if (envelope.version > PERSIST_VERSION) {
        writesBlocked = true
        reportIssue({ kind: 'future-version', version: envelope.version })
        return null
      }

      if (envelope.version === PERSIST_VERSION && !isPersistedState(envelope.state)) {
        return resetCorrupt()
      }

      return raw
    },

    setItem: (name, value) => {
      if (writesBlocked) {
        return
      }

      let storage: Storage | null
      try {
        storage = getStorage()
      } catch {
        reportIssue({ kind: 'unavailable' })
        return
      }

      if (!storage) {
        reportIssue({ kind: 'unavailable' })
        return
      }

      try {
        storage.setItem(name, value)

        // Si el almacenamiento se recuperó, el aviso deja de aplicar.
        if (useStorageStatus.getState().issue?.kind === 'unavailable') {
          useStorageStatus.getState().dismiss()
        }
      } catch {
        reportIssue({ kind: 'unavailable' })
      }
    },

    removeItem: (name) => {
      if (writesBlocked) {
        return
      }

      try {
        const storage = getStorage()
        storage?.removeItem(name)
      } catch {
        reportIssue({ kind: 'unavailable' })
      }
    },
  }
}

export const safeStorage = createSafeStorage()
export const persistStorage = createJSONStorage<PersistedV2>(() => safeStorage)

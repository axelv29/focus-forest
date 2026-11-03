import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { stageForElapsedMs } from '@/logic/growth'
import { choosePlacement } from '@/logic/placement'
import {
  createBreakSession,
  createFocusSession,
  elapsedMs,
  isExpired,
  pauseSession,
  resumeSession,
} from '@/logic/timer'
import type { ActiveSession, FocusRecord, PersistedV1, Tree } from './types'
import { migrate, PERSIST_VERSION, persistStorage, STORAGE_KEY } from './persist'

export type NoticeKind = 'info' | 'success' | 'warning'

export interface Notice {
  kind: NoticeKind
  text: string
}

interface StoreState extends PersistedV1 {
  pendingBreak: boolean
  notice: Notice | null
  startFocus: (now: number) => void
  startBreak: (now: number) => void
  pause: (now: number) => void
  resume: (now: number) => void
  abandon: (now: number) => void
  skipBreak: () => void
  reconcile: (now: number) => void
  dismissNotice: () => void
  dismissBreak: () => void
}

function makeId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => {
      const completeFocus = (active: ActiveSession, now: number) => {
        if (!active.cell) {
          set({
            active: null,
            pendingBreak: false,
            notice: {
              kind: 'warning',
              text: 'La sesión no tenía una celda. Se cerró sin plantar.',
            },
          })
          return
        }

        // Si la pestaña estuvo cerrada, la sesión terminó en `endsAt`,
        // no cuando se reabrió: así cae en el día correcto.
        const endedAt = Math.min(now, active.endsAt)
        const tree: Tree = {
          id: makeId(),
          sessionId: active.id,
          cell: active.cell,
          stage: 4,
          state: 'mature',
          createdAt: endedAt,
        }
        const record: FocusRecord = {
          id: active.id,
          startedAt: active.startedAt,
          endedAt,
          durationMin: active.durationMin,
          status: 'completed',
          treeId: tree.id,
        }

        set((state) => ({
          trees: [...state.trees, tree],
          sessions: [...state.sessions, record],
          active: null,
          pendingBreak: true,
          notice: {
            kind: 'success',
            text: '¡Pomodoro completado! El árbol quedó en la pradera.',
          },
        }))
      }

      return {
        version: 1,
        trees: [],
        sessions: [],
        active: null,
        pendingBreak: false,
        notice: null,

        startFocus: (now) => {
          if (get().active) {
            return
          }

          const placement = choosePlacement(get().trees)
          if (!placement) {
            set({
              notice: {
                kind: 'warning',
                text: 'La pradera está llena. Las parcelas nuevas llegan en la próxima versión.',
              },
            })
            return
          }

          const currentTrees = get().trees
          const currentSessions = get().sessions
          const trees =
            placement.replacedTreeId === null
              ? currentTrees
              : currentTrees.filter((tree) => tree.id !== placement.replacedTreeId)
          const sessions =
            placement.replacedTreeId === null
              ? currentSessions
              : currentSessions.filter((session) => session.treeId !== placement.replacedTreeId)
          const session = createFocusSession(makeId(), now, placement.cell)

          set({ trees, sessions, active: session, pendingBreak: false, notice: null })
        },

        startBreak: (now) => {
          if (get().active) {
            return
          }

          const session = createBreakSession(makeId(), now)
          set({ active: session, pendingBreak: false, notice: null })
        },

        pause: (now) => {
          const active = get().active
          if (!active) {
            return
          }

          const paused = pauseSession(active, now)
          if (paused !== active) {
            set({ active: paused })
          }
        },

        resume: (now) => {
          const active = get().active
          if (!active) {
            return
          }

          const resumed = resumeSession(active, now)
          if (resumed !== active) {
            set({ active: resumed })
          }
        },

        abandon: (now) => {
          const active = get().active
          if (!active) {
            return
          }

          if (active.kind === 'break') {
            set({
              active: null,
              pendingBreak: false,
              notice: { kind: 'info', text: 'Descanso saltado.' },
            })
            return
          }

          if (isExpired(active, now)) {
            get().reconcile(now)
            return
          }

          if (!active.cell) {
            set({ active: null })
            return
          }

          const stage = stageForElapsedMs(elapsedMs(active, now))
          const tree: Tree = {
            id: makeId(),
            sessionId: active.id,
            cell: active.cell,
            stage,
            state: 'withered',
            createdAt: now,
          }
          const record: FocusRecord = {
            id: active.id,
            startedAt: active.startedAt,
            endedAt: now,
            durationMin: active.durationMin,
            status: 'abandoned',
            treeId: tree.id,
          }

          set((state) => ({
            trees: [...state.trees, tree],
            sessions: [...state.sessions, record],
            active: null,
            pendingBreak: false,
            notice: {
              kind: 'info',
              text: 'El árbol quedó marchito. El próximo pomodoro planta uno nuevo.',
            },
          }))
        },

        skipBreak: () => {
          if (get().active?.kind === 'break') {
            set({
              active: null,
              pendingBreak: false,
              notice: { kind: 'info', text: 'Descanso saltado.' },
            })
            return
          }

          set({ pendingBreak: false })
        },

        reconcile: (now) => {
          const active = get().active
          if (!active || !isExpired(active, now)) {
            return
          }

          if (active.kind === 'break') {
            set({
              active: null,
              pendingBreak: false,
              notice: {
                kind: 'info',
                text: 'Descanso terminado. Cuando quieras, otro pomodoro.',
              },
            })
            return
          }

          completeFocus(active, now)
        },

        dismissNotice: () => set({ notice: null }),
        dismissBreak: () => set({ pendingBreak: false }),
      }
    },
    {
      name: STORAGE_KEY,
      version: PERSIST_VERSION,
      storage: persistStorage,
      migrate,
      partialize: (state) => ({
        version: state.version,
        trees: state.trees,
        sessions: state.sessions,
        active: state.active,
      }),
    },
  ),
)

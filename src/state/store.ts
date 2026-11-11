import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  FOREST_DESCRIPTION_MAX_LENGTH,
  FOREST_GOAL_HOURS_MAX,
  FOREST_NAME_MAX_LENGTH,
} from '@/config/forest'
import { finalStage, speciesForFocusMin } from '@/config/species'
import { DEFAULT_GARDEN_SIZE } from '@/config/grid'
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
import type {
  ActiveSession,
  DisplaySettings,
  FocusRecord,
  Forest,
  NewForestInput,
  PersistedV3,
  PomodoroSettings,
  Tree,
} from './types'
import { DEFAULT_DISPLAY_SETTINGS, DEFAULT_POMODORO_SETTINGS } from './types'
import { migrate, PERSIST_VERSION, persistStorage, STORAGE_KEY } from './persist'

export type NoticeKind = 'info' | 'success' | 'warning'

export interface Notice {
  kind: NoticeKind
  text: string
}

interface StoreState extends PersistedV3 {
  pendingBreak: boolean
  notice: Notice | null
  /** Dev: tamaño del bosque en celdas por lado para el preview del panel. */
  devGardenSize: number
  createForest: (input: NewForestInput, now: number) => string | null
  selectForest: (id: string) => void
  updateForest: (id: string, input: NewForestInput) => void
  archiveForest: (id: string, now: number) => void
  unarchiveForest: (id: string) => void
  deleteForest: (id: string) => void
  updateDisplay: (patch: Partial<DisplaySettings>) => void
  startFocus: (now: number) => void
  startBreak: (now: number) => void
  pause: (now: number) => void
  resume: (now: number) => void
  abandon: (now: number) => void
  skipBreak: () => void
  reconcile: (now: number) => void
  dismissNotice: () => void
  dismissBreak: () => void
  updateSettings: (patch: Partial<PomodoroSettings>) => void
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
        if (!active.cell || !active.forestId) {
          set({
            active: null,
            pendingBreak: false,
            notice: {
              kind: 'warning',
              text: 'La sesión no tenía una celda o un bosque. Se cerró sin plantar.',
            },
          })
          return
        }

        // Si la pestaña estuvo cerrada, la sesión terminó en `endsAt`,
        // no cuando se reabrió: así cae en el día correcto.
        const endedAt = Math.min(now, active.endsAt)
        const species = speciesForFocusMin(active.durationMin)
        const tree: Tree = {
          id: makeId(),
          forestId: active.forestId,
          sessionId: active.id,
          cell: active.cell,
          kind: species,
          stage: finalStage(species),
          state: 'mature',
          createdAt: endedAt,
        }
        const record: FocusRecord = {
          id: active.id,
          forestId: active.forestId,
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
        version: 3,
        forests: [],
        activeForestId: null,
        trees: [],
        sessions: [],
        active: null,
        settings: { ...DEFAULT_POMODORO_SETTINGS },
        display: { ...DEFAULT_DISPLAY_SETTINGS },
        pendingBreak: false,
        notice: null,
        devGardenSize: DEFAULT_GARDEN_SIZE,

        createForest: (input, now) => {
          const name = input.name.trim().slice(0, FOREST_NAME_MAX_LENGTH)
          if (!name) {
            return null
          }

          const description =
            input.description?.trim().slice(0, FOREST_DESCRIPTION_MAX_LENGTH) || null
          const goalHours =
            typeof input.goalHours === 'number' && input.goalHours > 0
              ? Math.min(Math.round(input.goalHours), FOREST_GOAL_HOURS_MAX)
              : null
          const forest: Forest = {
            id: makeId(),
            name,
            description,
            size: input.size,
            createdAt: now,
            endsOn: input.endsOn,
            goalHours,
            archivedAt: null,
          }

          set((state) => ({
            forests: [...state.forests, forest],
            // Durante una sesión no se cambia de bosque.
            activeForestId: state.active ? state.activeForestId : forest.id,
            notice: {
              kind: 'success',
              text: 'Bosque creado. Ya podés empezar a plantar.',
            },
          }))

          return forest.id
        },

        updateForest: (id, input) => {
          const name = input.name.trim().slice(0, FOREST_NAME_MAX_LENGTH)
          if (!name) {
            return
          }

          const description =
            input.description?.trim().slice(0, FOREST_DESCRIPTION_MAX_LENGTH) || null
          const goalHours =
            typeof input.goalHours === 'number' && input.goalHours > 0
              ? Math.min(Math.round(input.goalHours), FOREST_GOAL_HOURS_MAX)
              : null

          set((state) => ({
            forests: state.forests.map((forest) =>
              forest.id === id
                ? {
                    ...forest,
                    name,
                    description,
                    // El tamaño se define al crear el bosque y no se puede cambiar.
                    size: forest.size,
                    endsOn: input.endsOn,
                    goalHours,
                  }
                : forest,
            ),
          }))
        },

        archiveForest: (id, now) => {
          set((state) => {
            const forests = state.forests.map((forest) =>
              forest.id === id ? { ...forest, archivedAt: now } : forest,
            )
            const fallback =
              forests.find((forest) => forest.id !== id && forest.archivedAt === null)?.id ?? null

            return {
              forests,
              // Si el bosque archivado era el activo, pasamos al primero disponible.
              activeForestId: state.activeForestId === id ? fallback : state.activeForestId,
            }
          })
        },

        unarchiveForest: (id) => {
          set((state) => {
            const forests = state.forests.map((forest) =>
              forest.id === id ? { ...forest, archivedAt: null } : forest,
            )
            const hasActive =
              state.activeForestId !== null &&
              forests.some(
                (forest) => forest.id === state.activeForestId && forest.archivedAt === null,
              )

            return {
              forests,
              activeForestId: hasActive ? state.activeForestId : id,
            }
          })
        },

        deleteForest: (id) => {
          set((state) => {
            const forests = state.forests.filter((forest) => forest.id !== id)
            const fallback =
              forests.find((forest) => forest.archivedAt === null)?.id ?? forests[0]?.id ?? null

            return {
              forests,
              trees: state.trees.filter((tree) => tree.forestId !== id),
              sessions: state.sessions.filter((session) => session.forestId !== id),
              active: state.active && state.active.forestId === id ? null : state.active,
              activeForestId: state.activeForestId === id ? fallback : state.activeForestId,
            }
          })
        },

        selectForest: (id) => {
          if (get().active) {
            return
          }
          if (!get().forests.some((forest) => forest.id === id)) {
            return
          }

          set({ activeForestId: id, notice: null })
        },

        updateDisplay: (patch) => set((state) => ({ display: { ...state.display, ...patch } })),

        startFocus: (now) => {
          if (get().active) {
            return
          }

          const state = get()
          const forest = state.forests.find((item) => item.id === state.activeForestId)
          if (!forest) {
            set({
              notice: {
                kind: 'info',
                text: 'Primero creá un bosque para empezar a plantar.',
              },
            })
            return
          }
          if (forest.archivedAt !== null) {
            set({
              notice: {
                kind: 'warning',
                text: 'Ese bosque está archivado. Elegí otro para empezar.',
              },
            })
            return
          }

          const forestTrees = state.trees.filter((tree) => tree.forestId === forest.id)
          const placement = choosePlacement(forestTrees, Math.random, forest.size, forest.size)
          if (!placement) {
            set({
              notice: {
                kind: 'warning',
                text: 'La pradera está llena. Las parcelas nuevas llegan en la próxima versión.',
              },
            })
            return
          }

          const trees =
            placement.replacedTreeId === null
              ? state.trees
              : state.trees.filter((tree) => tree.id !== placement.replacedTreeId)
          const sessions =
            placement.replacedTreeId === null
              ? state.sessions
              : state.sessions.filter((session) => session.treeId !== placement.replacedTreeId)
          const session = createFocusSession(
            makeId(),
            now,
            placement.cell,
            state.settings.focusMin,
            forest.id,
          )
          const activeSession: ActiveSession = {
            ...session,
            strictPause: state.settings.strictPause,
            pauseToleranceMin: state.settings.pauseToleranceMin,
          }

          set({ trees, sessions, active: activeSession, pendingBreak: false, notice: null })
        },

        startBreak: (now) => {
          if (get().active) {
            return
          }

          const settings = get().settings
          const completed = get().sessions.filter((s) => s.status === 'completed').length
          const isLong = completed > 0 && completed % settings.longBreakEvery === 0
          const breakMin = isLong ? settings.longBreakMin : settings.breakMin
          const session = createBreakSession(makeId(), now, breakMin)

          set({ active: { ...session, longBreak: isLong }, pendingBreak: false, notice: null })
        },

        pause: (now) => {
          const active = get().active
          if (!active) {
            return
          }

          // Con pausa estricta la interfaz pide confirmación antes de
          // abandonar; nunca se pausa ni se marchita en silencio.
          if (active.strictPause) {
            return
          }

          const paused = pauseSession(active, now)
          if (paused !== active) {
            set({ active: paused })
          }
        },

        resume: (now) => {
          const active = get().active
          if (!active || active.pausedAt === null) {
            return
          }

          const toleranceMin = active.pauseToleranceMin ?? 0
          const toleranceMs = toleranceMin * 60_000
          const pausedFor = now - active.pausedAt
          if (toleranceMin > 0 && active.pausedMs + pausedFor > toleranceMs) {
            get().abandon(now)
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

          if (!active.cell || !active.forestId) {
            set({ active: null })
            return
          }

          const species = speciesForFocusMin(active.durationMin)
          const stage = stageForElapsedMs(species, elapsedMs(active, now), active.durationMin)
          const tree: Tree = {
            id: makeId(),
            forestId: active.forestId,
            sessionId: active.id,
            cell: active.cell,
            kind: species,
            stage,
            state: 'withered',
            createdAt: now,
          }
          const record: FocusRecord = {
            id: active.id,
            forestId: active.forestId,
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
          if (!active) {
            return
          }

          // Tolerancia de pausa agotada mientras estaba pausado.
          if (active.pausedAt !== null) {
            const toleranceMin = active.pauseToleranceMin ?? 0
            const toleranceMs = toleranceMin * 60_000
            const pausedFor = now - active.pausedAt
            if (toleranceMin > 0 && active.pausedMs + pausedFor > toleranceMs) {
              get().abandon(now)
              return
            }
            return
          }

          if (!isExpired(active, now)) {
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
        updateSettings: (patch) => set((state) => ({ settings: { ...state.settings, ...patch } })),
      }
    },
    {
      name: STORAGE_KEY,
      version: PERSIST_VERSION,
      storage: persistStorage,
      migrate,
      partialize: (state) => ({
        version: state.version,
        forests: state.forests,
        activeForestId: state.activeForestId,
        trees: state.trees,
        sessions: state.sessions,
        active: state.active,
        settings: state.settings,
        display: state.display,
      }),
    },
  ),
)

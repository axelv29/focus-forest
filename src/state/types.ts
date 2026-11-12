import type { ForestSize } from '@/config/forest'

export type TreeStage = 1 | 2 | 3 | 4 | 5 | 6 | 7
export type TreeSpecies = 'pino' | 'abedul' | 'roble' | 'ceibo'
export type TreeState = 'mature' | 'withered'
export type SessionKind = 'focus' | 'break'
export type FocusStatus = 'completed' | 'abandoned'
export type TreeKind = string
export type AlarmTone = 'bell' | 'chime' | 'pulse'

export interface Cell {
  col: number
  row: number
}

/** Un bosque es un objetivo con vida propia: un semestre, una materia, un examen. */
export interface Forest {
  id: string
  name: string
  description: string | null
  size: ForestSize
  createdAt: number
  /** Fecha local YYYY-MM-DD; null si el bosque no tiene plazo. */
  endsOn: string | null
  /** Objetivo opcional en horas de enfoque. */
  goalHours: number | null
  /** Se completará en una próxima versión; null mientras esté activo. */
  archivedAt: number | null
}

export interface NewForestInput {
  name: string
  description: string | null
  size: ForestSize
  endsOn: string | null
  goalHours: number | null
}

export interface Tree {
  id: string
  forestId: string
  sessionId: string
  cell: Cell
  kind?: TreeKind
  stage: TreeStage
  state: TreeState
  createdAt: number
}

/** Sesión planificada: uno o varios pomodoros con un mismo objetivo. */
export interface SessionPlan {
  id: string
  forestId: string
  title: string
  description: string | null
  tasks: string[]
  /** Cantidad de pomodoros que dura la sesión (1–8). */
  targetPomodoros: number
  completedPomodoros: number
  createdAt: number
  /** Se cierra al completar el objetivo o al abandonar la sesión. */
  finishedAt: number | null
}

export interface NewSessionInput {
  title: string
  description: string | null
  tasks: string[]
  targetPomodoros: number
}

export interface ActiveSession {
  id: string
  /** Solo los enfoques pertenecen a un bosque; los descansos no. */
  forestId: string | null
  kind: SessionKind
  startedAt: number
  endsAt: number
  durationMin: number
  pausedAt: number | null
  pausedMs: number
  /** Solo las sesiones de enfoque reservan una celda. */
  cell: Cell | null
  /** v2: pausa estricta. */
  strictPause?: boolean
  /** v2: tolerancia acumulada de pausa (minutos). */
  pauseToleranceMin?: number
  /** v2: true para los descansos largos (distinto color en el anillo). */
  longBreak?: boolean
  /** Sesión a la que pertenece este pomodoro. */
  planId?: string | null
  /** Posición del pomodoro dentro de la sesión (1-based). */
  pomoIndex?: number
  pomoTotal?: number
  title?: string | null
  description?: string | null
  tasks?: string[]
}

export interface FocusRecord {
  id: string
  forestId: string
  startedAt: number
  endedAt: number
  durationMin: number
  status: FocusStatus
  treeId: string
  /** v2: título de la sesión. */
  title?: string | null
  /** v2: descripción de la sesión. */
  description?: string | null
  /** v2: tareas con checkboxes. */
  tasks?: string[]
  /** Sesión planificada a la que pertenece el pomodoro. */
  planId?: string | null
  pomoIndex?: number
  pomoTotal?: number
}

export interface PomodoroSettings {
  focusMin: number
  breakMin: number
  longBreakMin: number
  longBreakEvery: number
  strictPause: boolean
  pauseToleranceMin: number
  alarmTone: AlarmTone
  notification: boolean
  alarmVolume: number
  autoStartBreak: boolean
  autoStartFocus: boolean
}

export const DEFAULT_POMODORO_SETTINGS: PomodoroSettings = {
  focusMin: 25,
  breakMin: 5,
  longBreakMin: 15,
  longBreakEvery: 4,
  strictPause: false,
  pauseToleranceMin: 0,
  alarmTone: 'bell',
  notification: true,
  alarmVolume: 0.6,
  autoStartBreak: false,
  autoStartFocus: false,
}

export interface DisplaySettings {
  showForestName: boolean
  showCountdown: boolean
}

export const DEFAULT_DISPLAY_SETTINGS: DisplaySettings = {
  showForestName: true,
  showCountdown: true,
}

export type LegacyTree = Omit<Tree, 'forestId'>
export type LegacyFocusRecord = Omit<FocusRecord, 'forestId'>
export type LegacyActiveSession = Omit<ActiveSession, 'forestId'>

export interface PersistedV1 {
  version: 1
  trees: LegacyTree[]
  sessions: LegacyFocusRecord[]
  active: LegacyActiveSession | null
}

export interface PersistedV2 {
  version: 2
  trees: LegacyTree[]
  sessions: LegacyFocusRecord[]
  active: LegacyActiveSession | null
  settings: PomodoroSettings
}

export interface PersistedV3 {
  version: 3
  forests: Forest[]
  activeForestId: string | null
  trees: Tree[]
  sessions: FocusRecord[]
  active: ActiveSession | null
  settings: PomodoroSettings
  display: DisplaySettings
}

/** v4: sesiones planificadas de uno o varios pomodoros. */
export interface PersistedV4 {
  version: 4
  forests: Forest[]
  activeForestId: string | null
  trees: Tree[]
  sessions: FocusRecord[]
  plans: SessionPlan[]
  active: ActiveSession | null
  /** Sesión planificada que se puede continuar con el próximo pomodoro. */
  activePlanId: string | null
  settings: PomodoroSettings
  display: DisplaySettings
}

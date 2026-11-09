export type TreeStage = 1 | 2 | 3 | 4
export type TreeState = 'mature' | 'withered'
export type SessionKind = 'focus' | 'break'
export type FocusStatus = 'completed' | 'abandoned'
export type TreeKind = string
export type AlarmTone = 'bell' | 'chime' | 'pulse'

export interface Cell {
  col: number
  row: number
}

export interface Tree {
  id: string
  sessionId: string
  cell: Cell
  kind?: TreeKind
  stage: TreeStage
  state: TreeState
  createdAt: number
}

export interface ActiveSession {
  id: string
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
}

export interface FocusRecord {
  id: string
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

export interface PersistedV1 {
  version: 1
  trees: Tree[]
  sessions: FocusRecord[]
  active: ActiveSession | null
}

export interface PersistedV2 {
  version: 2
  trees: Tree[]
  sessions: FocusRecord[]
  active: ActiveSession | null
  settings: PomodoroSettings
}

export type TreeStage = 1 | 2 | 3 | 4
export type TreeState = 'mature' | 'withered'
export type SessionKind = 'focus' | 'break'
export type FocusStatus = 'completed' | 'abandoned'

export interface Cell {
  col: number
  row: number
}

export interface Tree {
  id: string
  sessionId: string
  cell: Cell
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
}

export interface FocusRecord {
  id: string
  startedAt: number
  endedAt: number
  durationMin: number
  status: FocusStatus
  treeId: string
}

export interface PersistedV1 {
  version: 1
  trees: Tree[]
  sessions: FocusRecord[]
  active: ActiveSession | null
}

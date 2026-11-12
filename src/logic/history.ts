import type { FocusRecord, SessionPlan, Tree } from '@/state/types'
import { localDayKey } from './day'

export type HistoryFilter = 'all' | 'today' | 'week' | 'multi' | 'withered'
export type HistoryStatus = 'completed' | 'abandoned' | 'mixed'

/** Una sesión del historial: uno o varios pomodoros agrupados por plan. */
export interface HistoryEntry {
  key: string
  plan: SessionPlan | null
  records: FocusRecord[]
  trees: Tree[]
  primaryRecord: FocusRecord
  primaryTree: Tree | null
  title: string
  description: string | null
  tasks: string[]
  startedAt: number
  endedAt: number
  totalDurationMin: number
  status: HistoryStatus
  withered: boolean
  completedPomodoros: number
  targetPomodoros: number
  isMulti: boolean
}

export const HISTORY_FILTERS: ReadonlyArray<{ value: HistoryFilter; label: string }> = [
  { value: 'all', label: 'Todas' },
  { value: 'today', label: 'Hoy' },
  { value: 'week', label: 'Esta semana' },
  { value: 'multi', label: 'Series' },
  { value: 'withered', label: 'Marchitas' },
]

function startOfLocalWeek(now: number): number {
  const date = new Date(now)
  const mondayOffset = (date.getDay() + 6) % 7

  return new Date(date.getFullYear(), date.getMonth(), date.getDate() - mondayOffset).getTime()
}

function statusFor(records: readonly FocusRecord[]): HistoryStatus {
  const completed = records.filter((record) => record.status === 'completed').length
  const abandoned = records.length - completed

  if (abandoned === 0) {
    return 'completed'
  }
  if (completed === 0) {
    return 'abandoned'
  }

  return 'mixed'
}

function buildEntry(
  key: string,
  plan: SessionPlan | null,
  records: FocusRecord[],
  treesBySession: ReadonlyMap<string, Tree>,
): HistoryEntry {
  const ordered = [...records].sort((a, b) => a.startedAt - b.startedAt || a.id.localeCompare(b.id))
  const primaryRecord = ordered[ordered.length - 1]
  const trees = ordered.flatMap((record) => {
    const tree = treesBySession.get(record.treeId)
    return tree ? [tree] : []
  })
  const completed = ordered.filter((record) => record.status === 'completed')
  const latestWithTitle = [...ordered]
    .reverse()
    .find((record) => (record.title ?? '').trim().length > 0)

  return {
    key,
    plan,
    records: ordered,
    trees,
    primaryRecord,
    primaryTree: treesBySession.get(primaryRecord.treeId) ?? null,
    title: plan?.title ?? latestWithTitle?.title ?? 'Pomodoro',
    description: plan?.description ?? primaryRecord.description ?? null,
    tasks: plan?.tasks.length ? plan.tasks : (primaryRecord.tasks ?? []),
    startedAt: Math.min(...ordered.map((record) => record.startedAt)),
    endedAt: Math.max(...ordered.map((record) => record.endedAt)),
    // Los pomodoros completados aportan su duración planeada y los abandonados
    // los minutos reales enfocados antes de marchitarse.
    totalDurationMin: ordered.reduce((total, record) => total + record.durationMin, 0),
    status: statusFor(ordered),
    withered: trees.some((tree) => tree.state === 'withered'),
    completedPomodoros: completed.length,
    targetPomodoros: plan?.targetPomodoros ?? primaryRecord.pomoTotal ?? ordered.length,
    isMulti:
      (plan?.targetPomodoros ?? primaryRecord.pomoTotal ?? ordered.length) > 1 ||
      ordered.length > 1,
  }
}

/**
 * Agrupa los pomodoros de una misma sesión y aplica los filtros del historial.
 * Solo se consideran sesiones de enfoque; los descansos nunca se guardan.
 */
export function buildHistory(
  sessions: readonly FocusRecord[],
  plans: readonly SessionPlan[],
  trees: readonly Tree[],
  forestId: string | null,
  filter: HistoryFilter,
  now: number,
): HistoryEntry[] {
  if (!forestId) {
    return []
  }

  const plansById = new Map(
    plans.filter((plan) => plan.forestId === forestId).map((plan) => [plan.id, plan]),
  )
  const treesBySession = new Map(
    trees.filter((tree) => tree.forestId === forestId).map((tree) => [tree.id, tree]),
  )
  const groups = new Map<string, FocusRecord[]>()

  for (const record of sessions) {
    if (record.forestId !== forestId) {
      continue
    }

    const key = record.planId ?? record.id
    const group = groups.get(key)
    if (group) {
      group.push(record)
    } else {
      groups.set(key, [record])
    }
  }

  const entries = [...groups.entries()]
    .map(([key, records]) => buildEntry(key, plansById.get(key) ?? null, records, treesBySession))
    .sort(
      (a, b) => b.endedAt - a.endedAt || b.startedAt - a.startedAt || a.key.localeCompare(b.key),
    )

  const weekStart = startOfLocalWeek(now)
  const todayKey = localDayKey(now)

  return entries.filter((entry) => {
    switch (filter) {
      case 'today':
        return entry.records.some((record) => localDayKey(record.endedAt) === todayKey)
      case 'week':
        return entry.records.some((record) => record.endedAt >= weekStart)
      case 'multi':
        return entry.isMulti
      case 'withered':
        return entry.withered
      case 'all':
      default:
        return true
    }
  })
}

/** Sesiones que hay que resaltar al seleccionar una entrada del historial. */
export function selectedSessionIds(entry: HistoryEntry | null): ReadonlySet<string> {
  return new Set(entry ? entry.records.map((record) => record.id) : [])
}

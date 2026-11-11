import type { FocusRecord, Tree } from '@/state/types'
import { localDayKey } from './day'

export interface StatsSummary {
  todayPomodoros: number
  todayMinutes: number
  totalPomodoros: number
  totalMinutes: number
  matureTrees: number
  witheredTrees: number
}

export function summarizeStats(
  sessions: readonly FocusRecord[],
  trees: readonly Tree[],
  now = Date.now(),
  forestId?: string,
): StatsSummary {
  const todayKey = localDayKey(now)
  const summary: StatsSummary = {
    todayPomodoros: 0,
    todayMinutes: 0,
    totalPomodoros: 0,
    totalMinutes: 0,
    matureTrees: 0,
    witheredTrees: 0,
  }

  for (const session of sessions) {
    if (session.status !== 'completed' || (forestId && session.forestId !== forestId)) {
      continue
    }

    summary.totalPomodoros += 1
    summary.totalMinutes += session.durationMin

    if (localDayKey(session.endedAt) === todayKey) {
      summary.todayPomodoros += 1
      summary.todayMinutes += session.durationMin
    }
  }

  for (const tree of trees) {
    if (forestId && tree.forestId !== forestId) {
      continue
    }

    if (tree.state === 'mature') {
      summary.matureTrees += 1
    } else {
      summary.witheredTrees += 1
    }
  }

  return summary
}

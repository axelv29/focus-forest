import { summarizeStats } from '@/logic/stats'
import type { FocusRecord, Forest, Tree } from './types'

export function selectActiveForest(
  forests: readonly Forest[],
  activeForestId: string | null,
): Forest | null {
  return forests.find((forest) => forest.id === activeForestId) ?? null
}

export function selectStats(
  sessions: readonly FocusRecord[],
  trees: readonly Tree[],
  now: number,
  forestId?: string,
) {
  return summarizeStats(sessions, trees, now, forestId)
}

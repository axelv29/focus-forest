import { summarizeStats } from '@/logic/stats'
import type { FocusRecord, Tree } from './types'

export function selectStats(sessions: readonly FocusRecord[], trees: readonly Tree[], now: number) {
  return summarizeStats(sessions, trees, now)
}

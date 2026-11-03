import { describe, expect, it } from 'vitest'
import { summarizeStats } from '@/logic/stats'
import type { FocusRecord, Tree } from '@/state/types'

const MINUTE = 60_000
const TODAY = new Date(2026, 10, 3, 23, 0, 0).getTime()
const YESTERDAY = new Date(2026, 10, 2, 23, 0, 0).getTime()
const TOMORROW = new Date(2026, 10, 4, 0, 30, 0).getTime()

function record(
  id: string,
  endedAt: number,
  status: FocusRecord['status'] = 'completed',
): FocusRecord {
  return {
    id,
    startedAt: endedAt - 25 * MINUTE,
    endedAt,
    durationMin: 25,
    status,
    treeId: `tree-${id}`,
  }
}

function tree(id: string, state: Tree['state']): Tree {
  return {
    id,
    sessionId: `session-${id}`,
    cell: { col: 0, row: 0 },
    stage: 4,
    state,
    createdAt: TODAY,
  }
}

const SESSIONS = [
  record('hoy', TODAY),
  record('ayer', YESTERDAY),
  record('manana', TOMORROW),
  record('abandonada', TODAY, 'abandoned'),
]

const TREES = [tree('t1', 'mature'), tree('t2', 'withered')]

describe('summarizeStats', () => {
  it('cuenta solo los enfoques completados de hoy y los totales', () => {
    const stats = summarizeStats(SESSIONS, TREES, TODAY)

    expect(stats.todayPomodoros).toBe(1)
    expect(stats.todayMinutes).toBe(25)
    expect(stats.totalPomodoros).toBe(3)
    expect(stats.totalMinutes).toBe(75)
    expect(stats.matureTrees).toBe(1)
    expect(stats.witheredTrees).toBe(1)
  })

  it('cambia de día a la medianoche local', () => {
    const afterMidnight = new Date(2026, 10, 4, 1, 0, 0).getTime()
    const stats = summarizeStats(SESSIONS, TREES, afterMidnight)

    expect(stats.todayPomodoros).toBe(1)
    expect(stats.todayMinutes).toBe(25)
  })

  it('no cuenta los abandonos', () => {
    const stats = summarizeStats([record('abandonada', TODAY, 'abandoned')], [], TODAY)

    expect(stats.todayPomodoros).toBe(0)
    expect(stats.totalPomodoros).toBe(0)
    expect(stats.totalMinutes).toBe(0)
  })
})

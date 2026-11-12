import { describe, expect, it } from 'vitest'
import { buildHistory, selectedSessionIds } from '@/logic/history'
import type { FocusRecord, SessionPlan, Tree } from '@/state/types'

const FOREST = 'forest-test'
const NOW = new Date(2026, 4, 20, 18).getTime()
const EARLIER = new Date(2026, 4, 20, 10).getTime()

const PLAN: SessionPlan = {
  id: 'plan-1',
  forestId: FOREST,
  title: 'Estudiar final',
  description: 'Capítulo 4',
  tasks: ['Leer', 'Resumir'],
  targetPomodoros: 2,
  completedPomodoros: 2,
  createdAt: EARLIER,
  finishedAt: NOW,
}

function record(
  id: string,
  startedAt: number,
  status: FocusRecord['status'] = 'completed',
  planId: string | null = PLAN.id,
): FocusRecord {
  return {
    id,
    forestId: FOREST,
    startedAt,
    endedAt: startedAt + 25 * 60_000,
    durationMin: 25,
    status,
    treeId: `tree-${id}`,
    planId,
    pomoIndex: 1,
    pomoTotal: 2,
    title: 'Estudiar final',
  }
}

function tree(id: string, treeState: Tree['state'] = 'mature'): Tree {
  return {
    id: `tree-${id}`,
    sessionId: id,
    forestId: FOREST,
    cell: { col: 0, row: 0 },
    stage: 4,
    state: treeState,
    createdAt: EARLIER,
  }
}

const RECORDS = [record('session-a', EARLIER), record('session-b', NOW - 3 * 60_000)]
const TREES = [tree('session-a'), tree('session-b')]
const SESSION_RECORDS = [
  { ...record('session-c', NOW - 24 * 60 * 60_000, 'completed', null), pomoTotal: 1 },
]

describe('buildHistory', () => {
  it('agrupa los pomodoros de un mismo plan en una sesión', () => {
    const entries = buildHistory(RECORDS, [PLAN], TREES, FOREST, 'all', NOW)

    expect(entries).toHaveLength(1)
    expect(entries[0].key).toBe(PLAN.id)
    expect(entries[0].records).toHaveLength(2)
    expect(entries[0].trees).toHaveLength(2)
    expect(entries[0].isMulti).toBe(true)
    expect(entries[0].totalDurationMin).toBe(50)
    expect(entries[0].title).toBe('Estudiar final')
  })

  it('separa los pomodoros sueltos y los ordena por fecha', () => {
    const entries = buildHistory(
      [...RECORDS, ...SESSION_RECORDS],
      [PLAN],
      TREES,
      FOREST,
      'all',
      NOW,
    )

    expect(entries).toHaveLength(2)
    expect(entries[0].key).toBe(PLAN.id)
    expect(entries[1].key).toBe('session-c')
    expect(entries[1].isMulti).toBe(false)
  })

  it('filtra las sesiones con árboles marchitos', () => {
    const withered = [...TREES, tree('session-b', 'withered')]

    expect(buildHistory(RECORDS, [PLAN], TREES, FOREST, 'withered', NOW)).toHaveLength(0)
    expect(buildHistory(RECORDS, [PLAN], withered, FOREST, 'withered', NOW)).toHaveLength(1)
  })

  it('filtra por hoy y deja afuera lo de días anteriores', () => {
    const entries = buildHistory(
      [...RECORDS, ...SESSION_RECORDS],
      [PLAN],
      TREES,
      FOREST,
      'today',
      NOW,
    )

    expect(entries.map((entry) => entry.key)).toEqual([PLAN.id])
  })

  it('ignora las sesiones de otros bosques', () => {
    const foreign = RECORDS.map((item) => ({ ...item, forestId: 'otro' }))

    expect(buildHistory(foreign, [], TREES, FOREST, 'all', NOW)).toEqual([])
  })

  it('suma los minutos de enfoque reales de una sesión abandonada', () => {
    const abandoned: FocusRecord = {
      ...record('session-a', EARLIER, 'abandoned'),
      durationMin: 5,
      endedAt: EARLIER + 5 * 60_000,
    }

    const entries = buildHistory(
      [abandoned],
      [],
      [tree('session-a', 'withered')],
      FOREST,
      'all',
      NOW,
    )

    expect(entries).toHaveLength(1)
    expect(entries[0].status).toBe('abandoned')
    expect(entries[0].totalDurationMin).toBe(5)
  })
})

describe('selectedSessionIds', () => {
  it('devuelve las sesiones de la entrada elegida', () => {
    const entries = buildHistory(RECORDS, [PLAN], TREES, FOREST, 'all', NOW)
    const ids = selectedSessionIds(entries[0])

    expect([...ids].sort()).toEqual(['session-a', 'session-b'])
    expect(selectedSessionIds(null).size).toBe(0)
  })
})

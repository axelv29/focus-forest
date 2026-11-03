import { describe, expect, it } from 'vitest'
import { emptyState, migrate } from '@/state/persist'
import type { ActiveSession, FocusRecord, Tree } from '@/state/types'

const TREE: Tree = {
  id: 'tree-1',
  sessionId: 'session-1',
  cell: { col: 0, row: 0 },
  stage: 4,
  state: 'mature',
  createdAt: 1_000,
}

const SESSION: FocusRecord = {
  id: 'session-1',
  startedAt: 0,
  endedAt: 1_500_000,
  durationMin: 25,
  status: 'completed',
  treeId: 'tree-1',
}

const ACTIVE: ActiveSession = {
  id: 'session-2',
  kind: 'focus',
  startedAt: 2_000,
  endsAt: 1_502_000,
  durationMin: 25,
  pausedAt: null,
  pausedMs: 0,
  cell: { col: 1, row: 1 },
}

describe('migrate', () => {
  it('devuelve un estado vacío si no hay datos', () => {
    expect(migrate(null, 1)).toEqual(emptyState())
    expect(migrate(undefined, 1)).toEqual(emptyState())
  })

  it('descarta datos con la forma equivocada', () => {
    expect(migrate({ trees: 'x', sessions: [{}], active: { kind: 'x' } }, 1)).toEqual(emptyState())
  })

  it('conserva lo válido y descarta solo lo roto', () => {
    const result = migrate(
      {
        trees: [TREE, { nope: true }],
        sessions: [SESSION, null],
        active: ACTIVE,
      },
      1,
    )

    expect(result.trees).toEqual([TREE])
    expect(result.sessions).toEqual([SESSION])
    expect(result.active).toEqual(ACTIVE)
  })

  it('no borra datos compatibles de una versión futura', () => {
    const result = migrate({ trees: [TREE], sessions: [SESSION], active: null }, 99)

    expect(result.trees).toEqual([TREE])
    expect(result.sessions).toEqual([SESSION])
  })

  it('descarta celdas fuera de la grilla', () => {
    const result = migrate(
      { trees: [{ ...TREE, cell: { col: 99, row: 0 } }], sessions: [], active: null },
      1,
    )

    expect(result.trees).toEqual([])
  })
})

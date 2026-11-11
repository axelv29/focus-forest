import { describe, expect, it } from 'vitest'
import {
  createSafeStorage,
  DEFAULT_FOREST_ID,
  emptyState,
  isPersistedState,
  migrate,
} from '@/state/persist'
import type { StorageIssue } from '@/state/storageStatus'
import type { ActiveSession, FocusRecord, Forest, PersistedV3, Tree } from '@/state/types'
import { DEFAULT_DISPLAY_SETTINGS, DEFAULT_POMODORO_SETTINGS } from '@/state/types'

const FOREST: Forest = {
  id: DEFAULT_FOREST_ID,
  name: 'Mi bosque',
  description: null,
  size: 8,
  createdAt: 0,
  endsOn: null,
  goalHours: null,
  archivedAt: null,
}

const TREE: Tree = {
  id: 'tree-1',
  sessionId: 'session-1',
  forestId: DEFAULT_FOREST_ID,
  cell: { col: 0, row: 0 },
  stage: 4,
  state: 'mature',
  createdAt: 1_000,
}

const SESSION: FocusRecord = {
  id: 'session-1',
  forestId: DEFAULT_FOREST_ID,
  startedAt: 0,
  endedAt: 1_500_000,
  durationMin: 25,
  status: 'completed',
  treeId: 'tree-1',
}

const ACTIVE: ActiveSession = {
  id: 'session-2',
  kind: 'focus',
  forestId: DEFAULT_FOREST_ID,
  startedAt: 2_000,
  endsAt: 1_502_000,
  durationMin: 25,
  pausedAt: null,
  pausedMs: 0,
  cell: { col: 1, row: 1 },
}

const STATE: PersistedV3 = {
  version: 3,
  forests: [FOREST],
  activeForestId: FOREST.id,
  trees: [TREE],
  sessions: [SESSION],
  active: ACTIVE,
  settings: { ...DEFAULT_POMODORO_SETTINGS },
  display: { ...DEFAULT_DISPLAY_SETTINGS },
}

const LEGACY_TREE = {
  id: 'tree-1',
  sessionId: 'session-1',
  cell: { col: 0, row: 0 },
  stage: 4,
  state: 'mature',
  createdAt: 1_000,
}

const LEGACY_SESSION = {
  id: 'session-1',
  startedAt: 0,
  endedAt: 1_500_000,
  durationMin: 25,
  status: 'completed',
  treeId: 'tree-1',
}

const LEGACY_ACTIVE = {
  id: 'session-2',
  kind: 'focus',
  startedAt: 2_000,
  endsAt: 1_502_000,
  durationMin: 25,
  pausedAt: null,
  pausedMs: 0,
  cell: { col: 1, row: 1 },
}

function envelope(state: unknown, version: unknown): string {
  return JSON.stringify({ state, version })
}

function makeStorage(): { storage: Storage; data: Map<string, string> } {
  const data = new Map<string, string>()
  const storage = {
    get length() {
      return data.size
    },
    clear: () => data.clear(),
    getItem: (key: string) => data.get(key) ?? null,
    key: (index: number) => Array.from(data.keys())[index] ?? null,
    removeItem: (key: string) => {
      data.delete(key)
    },
    setItem: (key: string, value: string) => {
      data.set(key, value)
    },
  }

  return { storage: storage as Storage, data }
}

describe('migrate', () => {
  it('devuelve un estado vacío si no hay datos', () => {
    expect(migrate(null, 1)).toEqual(emptyState())
    expect(migrate(undefined, 1)).toEqual(emptyState())
  })

  it('descarta datos con la forma equivocada', () => {
    expect(migrate({ trees: 'x', sessions: [{}], active: { kind: 'x' } }, 1)).toEqual(emptyState())
  })

  it('conserva lo válido y lo adjunta al bosque recuperado', () => {
    const result = migrate(
      {
        trees: [LEGACY_TREE, { nope: true }],
        sessions: [LEGACY_SESSION, null],
        active: LEGACY_ACTIVE,
      },
      1,
    )

    expect(result.forests).toHaveLength(1)
    expect(result.forests[0]).toMatchObject({
      id: DEFAULT_FOREST_ID,
      name: 'Mi bosque',
      size: 8,
    })
    expect(result.activeForestId).toBe(DEFAULT_FOREST_ID)
    expect(result.trees).toEqual([{ ...LEGACY_TREE, forestId: DEFAULT_FOREST_ID }])
    expect(result.sessions).toEqual([{ ...LEGACY_SESSION, forestId: DEFAULT_FOREST_ID }])
    expect(result.active).toEqual({ ...LEGACY_ACTIVE, forestId: DEFAULT_FOREST_ID })
  })

  it('no borra datos compatibles de una versión futura', () => {
    const result = migrate({ trees: [LEGACY_TREE], sessions: [LEGACY_SESSION], active: null }, 99)

    expect(result.trees).toEqual([{ ...LEGACY_TREE, forestId: DEFAULT_FOREST_ID }])
    expect(result.sessions).toEqual([{ ...LEGACY_SESSION, forestId: DEFAULT_FOREST_ID }])
  })

  it('descarta celdas fuera de la grilla', () => {
    const result = migrate(
      { trees: [{ ...LEGACY_TREE, cell: { col: 99, row: 0 } }], sessions: [], active: null },
      1,
    )

    expect(result.trees).toEqual([])
  })

  it('acepta un estado de la versión actual', () => {
    expect(migrate(STATE, 3)).toEqual(STATE)
  })

  it('recupera árboles huérfanos sin perderlos', () => {
    const result = migrate(
      {
        ...STATE,
        forests: [],
        activeForestId: null,
        trees: [{ ...TREE, forestId: 'forest-que-no-existe' }],
        sessions: [],
        active: null,
      },
      3,
    )

    expect(result.forests).toHaveLength(1)
    expect(result.activeForestId).toBe(result.forests[0].id)
    expect(result.trees).toHaveLength(1)
    expect(result.trees[0].forestId).toBe(result.forests[0].id)
  })
})

describe('isPersistedState', () => {
  it('acepta un estado completo de la versión actual', () => {
    expect(isPersistedState(STATE)).toBe(true)
  })

  it('rechaza árboles con forma inválida', () => {
    expect(isPersistedState({ ...STATE, trees: [{ nope: true }] })).toBe(false)
  })

  it('rechaza una sesión activa incompleta', () => {
    expect(isPersistedState({ ...STATE, active: { kind: 'focus' } })).toBe(false)
  })

  it('rechaza una versión distinta', () => {
    expect(isPersistedState({ ...STATE, version: 4 })).toBe(false)
    expect(isPersistedState({ ...STATE, version: 2 })).toBe(false)
  })
})

describe('createSafeStorage', () => {
  it('lee un guardado válido sin avisos', () => {
    const { storage } = makeStorage()
    const raw = envelope(STATE, 3)
    storage.setItem('focus-forest', raw)
    const issues: StorageIssue[] = []
    const safe = createSafeStorage(
      () => storage,
      (issue) => issues.push(issue),
    )

    expect(safe.getItem('focus-forest')).toBe(raw)
    expect(issues).toEqual([])
  })

  it('respalda y reinicia un JSON inválido', () => {
    const { storage } = makeStorage()
    const raw = '{"state":'
    storage.setItem('focus-forest', raw)
    const issues: StorageIssue[] = []
    const safe = createSafeStorage(
      () => storage,
      (issue) => issues.push(issue),
    )

    expect(safe.getItem('focus-forest')).toBeNull()
    expect(storage.getItem('focus-forest')).toBeNull()
    expect(storage.getItem('focus-forest.broken')).toBe(raw)
    expect(issues).toEqual([{ kind: 'corrupt' }])
  })

  it('respalda y reinicia un estado con forma inválida', () => {
    const { storage } = makeStorage()
    const raw = envelope({ ...STATE, trees: 'x' }, 3)
    storage.setItem('focus-forest', raw)
    const issues: StorageIssue[] = []
    const safe = createSafeStorage(
      () => storage,
      (issue) => issues.push(issue),
    )

    expect(safe.getItem('focus-forest')).toBeNull()
    expect(storage.getItem('focus-forest.broken')).toBe(raw)
    expect(issues).toEqual([{ kind: 'corrupt' }])
  })

  it('respalda un guardado sin versión reconocible', () => {
    const { storage } = makeStorage()
    const raw = envelope(STATE, 'uno')
    storage.setItem('focus-forest', raw)
    const issues: StorageIssue[] = []
    const safe = createSafeStorage(
      () => storage,
      (issue) => issues.push(issue),
    )

    expect(safe.getItem('focus-forest')).toBeNull()
    expect(storage.getItem('focus-forest.broken')).toBe(raw)
    expect(issues).toEqual([{ kind: 'corrupt' }])
  })

  it('no toca una versión más nueva y bloquea las escrituras', () => {
    const { storage } = makeStorage()
    const raw = envelope({ ...STATE, version: 4 }, 4)
    storage.setItem('focus-forest', raw)
    const issues: StorageIssue[] = []
    const safe = createSafeStorage(
      () => storage,
      (issue) => issues.push(issue),
    )

    expect(safe.getItem('focus-forest')).toBeNull()
    expect(storage.getItem('focus-forest')).toBe(raw)
    expect(issues).toEqual([{ kind: 'future-version', version: 4 }])

    safe.setItem('focus-forest', 'nuevo')
    safe.removeItem('focus-forest')

    expect(storage.getItem('focus-forest')).toBe(raw)
  })

  it('avisa si el almacenamiento está bloqueado', () => {
    const issues: StorageIssue[] = []
    const safe = createSafeStorage(
      () => {
        throw new Error('bloqueado')
      },
      (issue) => issues.push(issue),
    )

    expect(safe.getItem('focus-forest')).toBeNull()
    expect(issues).toEqual([{ kind: 'unavailable' }])
    expect(() => safe.setItem('focus-forest', 'x')).not.toThrow()
  })

  it('avisa si no puede escribir', () => {
    const { storage } = makeStorage()
    const failing = {
      ...storage,
      setItem: () => {
        throw new Error('cuota')
      },
    } as Storage
    const issues: StorageIssue[] = []
    const safe = createSafeStorage(
      () => failing,
      (issue) => issues.push(issue),
    )

    expect(() => safe.setItem('focus-forest', 'x')).not.toThrow()
    expect(issues).toEqual([{ kind: 'unavailable' }])
  })
})

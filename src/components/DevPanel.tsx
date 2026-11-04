import { useState } from 'react'
import { choosePlacement } from '@/logic/placement'
import { useStore } from '@/state/store'
import type { TreeStage, TreeState } from '@/state/types'

const STAGE_OPTIONS: readonly { value: TreeStage; label: string }[] = [
  { value: 1, label: 'Brote' },
  { value: 2, label: 'Joven' },
  { value: 3, label: 'Maduro' },
  { value: 4, label: 'Adulto' },
]

export function DevPanel() {
  const trees = useStore((state) => state.trees)
  const setState = useStore.setState
  const [open, setOpen] = useState(false)

  const addTree = () => {
    const placement = choosePlacement(trees, Math.random)

    if (!placement || placement.replacedTreeId !== null) {
      return
    }

    const now = Date.now()
    const tree = {
      id: `dev-tree-${now}-${Math.random().toString(16).slice(2)}`,
      sessionId: 'dev-session',
      cell: placement.cell,
      stage: 1 as TreeStage,
      state: 'mature' as TreeState,
      createdAt: now,
    }

    setState({ trees: [...trees, tree] })
  }

  const updateTree = (id: string, stage: TreeStage, state: TreeState) => {
    setState({
      trees: trees.map((tree) => (tree.id === id ? { ...tree, stage, state } : tree)),
    })
  }

  const removeTree = (id: string) => {
    setState({
      trees: trees.filter((tree) => tree.id !== id),
    })
  }

  const clearTrees = () => {
    setState({ trees: [] })
  }

  return (
    <div className="fixed bottom-4 right-4 z-40 w-64 max-w-[calc(100vw-2rem)]">
      <button
        type="button"
        className="btn btn-primary btn--sm"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        Panel dev
      </button>

      {open && (
        <section className="card card--compact mt-2" aria-label="Panel de desarrollo">
          <p className="eyebrow">DEV</p>
          <p className="type-body mt-1">Pruebas rápidas del bosque.</p>

          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" className="btn btn-primary btn--sm" onClick={addTree}>
              Agregar árbol
            </button>
            <button type="button" className="btn btn-secondary btn--sm" onClick={clearTrees}>
              Limpiar bosque
            </button>
          </div>

          <div className="mt-4 space-y-2">
            {trees.map((tree) => (
              <div
                key={tree.id}
                className="flex flex-wrap items-center justify-between gap-2 border border-bark/30 p-2"
              >
                <span className="type-caption type-muted">{tree.id}</span>

                <select
                  className="btn btn--sm btn-secondary w-full"
                  value={tree.stage}
                  onChange={(event) =>
                    updateTree(tree.id, Number(event.target.value) as TreeStage, tree.state)
                  }
                  aria-label={`Cambiar etapa del árbol ${tree.id}`}
                >
                  {STAGE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>

                <select
                  className="btn btn--sm btn-secondary w-full"
                  value={tree.state}
                  onChange={(event) =>
                    updateTree(tree.id, tree.stage, event.target.value as TreeState)
                  }
                  aria-label={`Cambiar estado del árbol ${tree.id}`}
                >
                  <option value="mature">Vivo</option>
                  <option value="withered">Marchito</option>
                </select>

                <button
                  type="button"
                  className="btn btn-danger btn--sm w-full"
                  onClick={() => removeTree(tree.id)}
                >
                  Eliminar
                </button>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

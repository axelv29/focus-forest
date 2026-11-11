import { useMemo, useState } from 'react'
import { playTone } from '@/logic/alarm'
import {
  getNotificationPermission,
  requestNotificationPermission,
  sendNotification,
} from '@/logic/notifications'
import { cellKey, cellOrder, choosePlacement } from '@/logic/placement'
import { speciesConfig, speciesFromKind } from '@/config/species'
import { useStore } from '@/state/store'
import type { AlarmTone, Tree, TreeSpecies, TreeStage, TreeState } from '@/state/types'
import { Select } from './Select'

const STAGE_OPTIONS: readonly { value: TreeStage; label: string }[] = [
  { value: 1, label: 'Brote' },
  { value: 2, label: 'Plantín' },
  { value: 3, label: 'Joven' },
  { value: 4, label: 'Maduro' },
  { value: 5, label: 'Grande' },
  { value: 6, label: 'Muy Grande' },
  { value: 7, label: 'Adulto' },
]

const TONE_OPTIONS: readonly { value: AlarmTone; label: string }[] = [
  { value: 'bell', label: 'Campana' },
  { value: 'chime', label: 'Campanilla' },
  { value: 'pulse', label: 'Pulso' },
]

const TREE_STATE_SELECT_OPTIONS = [
  { value: 'mature', label: 'Vivo' },
  { value: 'withered', label: 'Marchito' },
] as const

const SPECIES_OPTIONS: readonly { value: TreeSpecies; label: string }[] = [
  { value: 'abedul', label: 'Abedul' },
  { value: 'pino', label: 'Pino' },
  { value: 'roble', label: 'Roble' },
  { value: 'ceibo', label: 'Ceibo' },
]

const TREE_SPECIES_SELECT_OPTIONS = SPECIES_OPTIONS.map((option) => ({
  value: option.value,
  label: option.label,
}))

const GARDEN_SIZE_OPTIONS = [4, 5, 6, 7, 8].map((size) => ({
  value: String(size),
  label: `${size}×${size}`,
}))

const FILL_SPECIES_OPTIONS = [
  { value: 'mix', label: 'Mixto' },
  { value: 'abedul', label: 'Abedul' },
  { value: 'pino', label: 'Pino' },
  { value: 'roble', label: 'Roble' },
  { value: 'ceibo', label: 'Ceibo' },
] as const

type FillSpecies = (typeof FILL_SPECIES_OPTIONS)[number]['value']

export function DevPanel() {
  const trees = useStore((state) => state.trees)
  const active = useStore((state) => state.active)
  const settings = useStore((state) => state.settings)
  const forests = useStore((state) => state.forests)
  const activeForestId = useStore((state) => state.activeForestId)
  const gardenSize = useStore((state) => state.devGardenSize)
  const setState = useStore.setState
  const [open, setOpen] = useState(false)
  const [permission, setPermission] = useState(getNotificationPermission())
  const [fillSpecies, setFillSpecies] = useState<FillSpecies>('mix')

  const activeForest = useMemo(() => {
    if (activeForestId) {
      return forests.find((forest) => forest.id === activeForestId) ?? null
    }
    return forests[0] ?? null
  }, [forests, activeForestId])

  const forestId = activeForest?.id ?? null
  const forestTrees = useMemo(
    () => (forestId ? trees.filter((tree) => tree.forestId === forestId) : []),
    [trees, forestId],
  )
  const workingSize = activeForest?.size ?? gardenSize

  const addTree = (species: TreeSpecies) => {
    if (!forestId) {
      return
    }

    const placement = choosePlacement(forestTrees, Math.random, workingSize, workingSize)

    if (!placement || placement.replacedTreeId !== null) {
      return
    }

    const now = Date.now()
    const tree: Tree = {
      id: `dev-tree-${now}-${Math.random().toString(16).slice(2)}`,
      sessionId: 'dev-session',
      forestId,
      cell: placement.cell,
      kind: species,
      stage: 1,
      state: 'mature',
      createdAt: now,
    }

    setState({ trees: [...trees, tree] })
  }

  const updateTree = (id: string, patch: Partial<Pick<Tree, 'kind' | 'stage' | 'state'>>) => {
    setState({
      trees: trees.map((tree) => (tree.id === id ? { ...tree, ...patch } : tree)),
    })
  }

  const removeTree = (id: string) => {
    setState({
      trees: trees.filter((tree) => tree.id !== id),
    })
  }

  const clearTrees = () => {
    if (!forestId) {
      return
    }
    setState({ trees: trees.filter((tree) => tree.forestId !== forestId) })
  }

  const fillGarden = () => {
    if (!forestId) {
      return
    }

    const speciesList: TreeSpecies[] = ['abedul', 'pino', 'roble', 'ceibo']
    const taken = new Set(forestTrees.map((tree) => cellKey(tree.cell)))
    const now = Date.now()
    const added: Tree[] = cellOrder(workingSize, workingSize)
      .filter((cell) => !taken.has(cellKey(cell)))
      .map((cell, index) => ({
        id: `dev-tree-${now}-${index}-${Math.random().toString(16).slice(2)}`,
        sessionId: 'dev-session',
        forestId,
        cell,
        kind:
          fillSpecies === 'mix'
            ? speciesList[Math.floor(Math.random() * speciesList.length)]
            : fillSpecies,
        stage: 1,
        state: 'mature',
        createdAt: now + index,
      }))

    if (added.length > 0) {
      setState({ trees: [...trees, ...added] })
    }
  }

  const setAllStages = (stage: TreeStage) => {
    if (!forestId) {
      return
    }
    setState({
      trees: trees.map((tree) => {
        if (tree.forestId !== forestId) {
          return tree
        }
        const species = speciesFromKind(tree.kind)
        const stages = speciesConfig(species).stages
        const maxStage = stages[stages.length - 1].stage

        return { ...tree, stage: (stage > maxStage ? maxStage : stage) as TreeStage }
      }),
    })
  }

  const setAllStates = (state: TreeState) => {
    if (!forestId) {
      return
    }
    setState({
      trees: trees.map((tree) => (tree.forestId === forestId ? { ...tree, state } : tree)),
    })
  }

  const advanceTime = (ms: number) => {
    if (!active) {
      return
    }
    // Saltar hacia adelante: adelanta inicio y fin por igual, así el árbol
    // crece como si hubiera pasado ese tiempo (el restante baja lo mismo).
    setState({
      active: { ...active, startedAt: active.startedAt - ms, endsAt: active.endsAt - ms },
    })
    useStore.getState().reconcile(Date.now())
  }

  const finishNow = () => {
    if (!active) {
      return
    }
    setState({ active: { ...active, pausedAt: null, endsAt: Date.now() } })
    useStore.getState().reconcile(Date.now())
  }

  const handlePermission = async () => {
    const result = await requestNotificationPermission()
    setPermission(result)
  }

  const quickSettings = () => {
    useStore.getState().updateSettings({ focusMin: 1, breakMin: 1, longBreakMin: 1 })
  }

  return (
    <div className="fixed bottom-4 left-4 z-40 hidden w-64 max-w-[calc(100vw-2rem)] md:block">
      <button
        type="button"
        className="btn btn-secondary btn--sm"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        Panel dev
      </button>

      {open && (
        <section
          className="card card--compact mt-2 max-h-[70vh] overflow-y-auto"
          aria-label="Panel de desarrollo"
        >
          <p className="eyebrow">DEV</p>
          <p className="type-body mt-1">Pruebas rápidas del bosque.</p>

          <p className="type-caption type-muted mt-2">
            Bosque actual: {activeForest ? `${activeForest.name} (${workingSize}×${workingSize})` : 'ninguno'} ·{' '}
            {forestTrees.length} árboles
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              className="btn btn-primary btn--sm"
              onClick={() => addTree('abedul')}
              disabled={!forestId}
            >
              Agregar abedul
            </button>
            <button
              type="button"
              className="btn btn-secondary btn--sm"
              onClick={() => addTree('pino')}
              disabled={!forestId}
            >
              Agregar pino
            </button>
            <button
              type="button"
              className="btn btn-secondary btn--sm"
              onClick={() => addTree('roble')}
              disabled={!forestId}
            >
              Agregar roble
            </button>
            <button
              type="button"
              className="btn btn-secondary btn--sm"
              onClick={() => addTree('ceibo')}
              disabled={!forestId}
            >
              Agregar ceibo
            </button>
          </div>

          <div className="mt-2 flex flex-wrap items-end gap-2">
            <div className="min-w-[9rem] flex-1">
              <Select
                className="select--block"
                value={fillSpecies}
                options={FILL_SPECIES_OPTIONS.map((option) => ({
                  value: option.value,
                  label: option.label,
                }))}
                onChange={(value) => setFillSpecies(value as FillSpecies)}
                ariaLabel="Especie para llenar el bosque"
              />
            </div>
            <button
              type="button"
              className="btn btn-secondary btn--sm"
              onClick={fillGarden}
              disabled={!forestId}
            >
              Llenar bosque
            </button>
            <button
              type="button"
              className="btn btn-secondary btn--sm"
              onClick={clearTrees}
              disabled={!forestId || forestTrees.length === 0}
            >
              Limpiar bosque
            </button>
          </div>

          <div className="mt-4 border-t border-ink/10 pt-3">
            <p className="eyebrow">Tamaño (preview)</p>
            <p className="type-caption type-muted mt-1">
              Solo afecta la vista previa cuando no hay bosque activo.
            </p>
            <div className="mt-2 max-w-xs">
              <Select
                className="select--block"
                value={String(gardenSize)}
                options={GARDEN_SIZE_OPTIONS}
                onChange={(value) => useStore.setState({ devGardenSize: Number(value) })}
                ariaLabel="Tamaño del bosque en celdas por lado"
              />
            </div>
          </div>

          <div className="mt-4 border-t border-ink/10 pt-3">
            <p className="eyebrow">Sesión</p>
            <p className="type-micro type-muted mt-0.5">
              Los botones de −10 s / −1 min / −5 min / −10 min adelantan el tiempo: el restante baja
              y el árbol crece.
            </p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              <button
                type="button"
                className="btn btn-secondary btn--sm"
                disabled={active !== null}
                onClick={() => useStore.getState().startFocus(Date.now())}
              >
                Iniciar enfoque
              </button>
              <button
                type="button"
                className="btn btn-secondary btn--sm"
                disabled={active !== null}
                onClick={() => useStore.getState().startBreak(Date.now())}
              >
                Iniciar descanso
              </button>
              <button
                type="button"
                className="btn btn-secondary btn--sm"
                disabled={active === null}
                onClick={() => advanceTime(10_000)}
              >
                −10 s
              </button>
              <button
                type="button"
                className="btn btn-secondary btn--sm"
                disabled={active === null}
                onClick={() => advanceTime(60_000)}
              >
                −1 min
              </button>
              <button
                type="button"
                className="btn btn-secondary btn--sm"
                disabled={active === null}
                onClick={() => advanceTime(5 * 60_000)}
              >
                −5 min
              </button>
              <button
                type="button"
                className="btn btn-secondary btn--sm"
                disabled={active === null}
                onClick={() => advanceTime(10 * 60_000)}
              >
                −10 min
              </button>
              <button
                type="button"
                className="btn btn-primary btn--sm"
                disabled={active === null}
                onClick={finishNow}
              >
                Terminar ahora
              </button>
              <button
                type="button"
                className="btn btn-secondary btn--sm"
                disabled={active === null}
                onClick={() => useStore.getState().abandon(Date.now())}
              >
                Abandonar
              </button>
              <button
                type="button"
                className="btn btn-secondary btn--sm"
                onClick={() => setState({ pendingBreak: true })}
              >
                Forzar descanso
              </button>
            </div>
          </div>

          <div className="mt-4 border-t border-ink/10 pt-3">
            <p className="eyebrow">Alarma</p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {TONE_OPTIONS.map((tone) => (
                <button
                  key={tone.value}
                  type="button"
                  className="btn btn-secondary btn--sm"
                  onClick={() => playTone(tone.value, settings.alarmVolume)}
                >
                  {tone.label}
                </button>
              ))}
              <button
                type="button"
                className="btn btn-primary btn--sm"
                onClick={() => playTone(settings.alarmTone, settings.alarmVolume)}
              >
                Tono actual
              </button>
            </div>
          </div>

          <div className="mt-4 border-t border-ink/10 pt-3">
            <p className="eyebrow">Notificación</p>
            <p className="type-caption type-muted mt-1">Permiso: {permission}</p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              <button
                type="button"
                className="btn btn-secondary btn--sm"
                onClick={handlePermission}
              >
                Pedir permiso
              </button>
              <button
                type="button"
                className="btn btn-secondary btn--sm"
                onClick={() => sendNotification('Focus Forest', 'Notificación de prueba.')}
              >
                Enviar prueba
              </button>
            </div>
          </div>

          <div className="mt-4 border-t border-ink/10 pt-3">
            <p className="eyebrow">Ajustes</p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              <button type="button" className="btn btn-secondary btn--sm" onClick={quickSettings}>
                Pomodoro 1 min
              </button>
              <button
                type="button"
                className="btn btn-secondary btn--sm"
                onClick={() =>
                  useStore.getState().updateSettings({ autoStartBreak: !settings.autoStartBreak })
                }
              >
                Auto descanso: {settings.autoStartBreak ? 'on' : 'off'}
              </button>
              <button
                type="button"
                className="btn btn-secondary btn--sm"
                onClick={() =>
                  useStore.getState().updateSettings({ autoStartFocus: !settings.autoStartFocus })
                }
              >
                Auto pomodoro: {settings.autoStartFocus ? 'on' : 'off'}
              </button>
              <button
                type="button"
                className="btn btn-secondary btn--sm"
                onClick={() =>
                  useStore.getState().updateSettings({ notification: !settings.notification })
                }
              >
                Notificación: {settings.notification ? 'on' : 'off'}
              </button>
            </div>
          </div>

          <div className="mt-4 border-t border-ink/10 pt-3">
            <p className="eyebrow">Cambiar todos (bosque actual)</p>

            <p className="type-caption type-muted mt-2">Etapa</p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {STAGE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className="btn btn-secondary btn--sm"
                  disabled={forestTrees.length === 0}
                  onClick={() => setAllStages(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <p className="type-caption type-muted mt-2">Estado</p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              <button
                type="button"
                className="btn btn-secondary btn--sm"
                disabled={forestTrees.length === 0}
                onClick={() => setAllStates('mature')}
              >
                Vivos
              </button>
              <button
                type="button"
                className="btn btn-secondary btn--sm"
                disabled={forestTrees.length === 0}
                onClick={() => setAllStates('withered')}
              >
                Marchitos
              </button>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            <p className="eyebrow">Árboles del bosque actual</p>
            {forestTrees.length === 0 ? (
              <p className="type-caption type-muted">No hay árboles en este bosque.</p>
            ) : (
              forestTrees.map((tree) => {
                const species = speciesFromKind(tree.kind)
                const stageOptions = speciesConfig(species).stages.map((item) => ({
                  value: String(item.stage),
                  label: item.label,
                }))

                return (
                  <div
                    key={tree.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-ink/10 p-2"
                  >
                    <span className="type-caption type-muted">
                      {speciesConfig(species).name} · celda {tree.cell.col},{tree.cell.row}
                    </span>

                    <Select
                      className="select--block"
                      value={species}
                      options={TREE_SPECIES_SELECT_OPTIONS}
                      onChange={(value) => {
                        const next = value as TreeSpecies
                        const stages = speciesConfig(next).stages
                        const maxStage = stages[stages.length - 1].stage
                        updateTree(tree.id, {
                          kind: next,
                          stage: (tree.stage > maxStage ? maxStage : tree.stage) as TreeStage,
                        })
                      }}
                      ariaLabel={`Cambiar especie del árbol ${tree.id}`}
                    />

                    <Select
                      className="select--block"
                      value={String(tree.stage)}
                      options={stageOptions}
                      onChange={(value) => updateTree(tree.id, { stage: Number(value) as TreeStage })}
                      ariaLabel={`Cambiar etapa del árbol ${tree.id}`}
                    />

                    <Select
                      className="select--block"
                      value={tree.state}
                      options={TREE_STATE_SELECT_OPTIONS}
                      onChange={(value) => updateTree(tree.id, { state: value as TreeState })}
                      ariaLabel={`Cambiar estado del árbol ${tree.id}`}
                    />

                    <button
                      type="button"
                      className="btn btn-danger btn--sm w-full"
                      onClick={() => removeTree(tree.id)}
                    >
                      Eliminar
                    </button>
                  </div>
                )
              })
            )}
          </div>
        </section>
      )}
    </div>
  )
}

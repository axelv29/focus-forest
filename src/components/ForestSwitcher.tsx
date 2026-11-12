import { ForestCountdown } from './ForestCountdown'
import { useState } from 'react'
import { History } from 'lucide-react'
import { ArchiveIcon, PencilIcon, PlusIcon, TrashIcon, UnarchiveIcon } from './icons'
import { ConfirmDialog } from './ConfirmDialog'
import { ForestPreviewCanvas } from './ForestPreviewCanvas'
import { ViewSwitch } from './ViewSwitch'
import type { View } from '@/config/views'
import { describeForestCountdown } from '@/logic/forest'
import { selectStats } from '@/state/selectors'
import { useStore } from '@/state/store'
import type { Forest } from '@/state/types'

interface ForestSwitcherProps {
  now: number
  view: View
  onChangeView: (view: View) => void
  onSelect: (id: string) => void
  onHistoryForest: (id: string) => void
  onCreateForest: () => void
  onEditForest: (forest: Forest) => void
}

interface ForestCardProps {
  forest: Forest
  now: number
  isActive: boolean
  isArchived: boolean
  onSelect: (id: string) => void
  onHistory: (id: string) => void
  onEdit: (forest: Forest) => void
  onArchiveToggle: (forest: Forest) => void
  onDelete: (forest: Forest) => void
}

function ForestCard({
  forest,
  now,
  isActive,
  isArchived,
  onSelect,
  onHistory,
  onEdit,
  onArchiveToggle,
  onDelete,
}: ForestCardProps) {
  const sessions = useStore((state) => state.sessions)
  const trees = useStore((state) => state.trees)
  const stats = selectStats(sessions, trees, now, forest.id)
  const forestTrees = trees.filter((tree) => tree.forestId === forest.id)
  const totalTrees = stats.matureTrees + stats.witheredTrees
  const countdown = describeForestCountdown(forest.endsOn, now)

  return (
    <article className={isActive ? 'forest-card card is-active' : 'forest-card card'}>
      <button
        type="button"
        className="forest-card__select"
        onClick={() => onSelect(forest.id)}
        aria-current={isActive ? 'true' : undefined}
      >
        <div className="forest-card__preview">
          <ForestPreviewCanvas size={forest.size} trees={forestTrees} />
        </div>

        <div className="forest-card__body">
          <div className="forest-card__header">
            <span className="forest-card__name" title={forest.name}>
              {forest.name}
            </span>
            <div className="forest-card__badges">
              {isActive && <span className="forest-chip forest-chip--soft">Activo</span>}
              {isArchived && <span className="forest-chip">Archivado</span>}
              {countdown && <ForestCountdown countdown={countdown} />}
            </div>
          </div>

          {forest.description && <p className="forest-card__description">{forest.description}</p>}

          <p className="forest-card__meta">
            {forest.size}×{forest.size} · {totalTrees} {totalTrees === 1 ? 'árbol' : 'árboles'}
          </p>
        </div>
      </button>

      <div className="forest-card__actions">
        <button
          type="button"
          className="icon-button"
          onClick={() => onHistory(forest.id)}
          aria-label={`Ver historial del bosque ${forest.name}`}
          title="Historial"
        >
          <History />
        </button>
        <button
          type="button"
          className="icon-button"
          onClick={() => onEdit(forest)}
          aria-label={`Editar bosque ${forest.name}`}
          title="Editar"
        >
          <PencilIcon />
        </button>
        <button
          type="button"
          className="icon-button"
          onClick={() => onArchiveToggle(forest)}
          aria-label={
            isArchived ? `Desarchivar bosque ${forest.name}` : `Archivar bosque ${forest.name}`
          }
          title={isArchived ? 'Desarchivar' : 'Archivar'}
        >
          {isArchived ? <UnarchiveIcon /> : <ArchiveIcon />}
        </button>
        <button
          type="button"
          className="icon-button"
          onClick={() => onDelete(forest)}
          aria-label={`Eliminar bosque ${forest.name}`}
          title="Eliminar"
        >
          <TrashIcon />
        </button>
      </div>
    </article>
  )
}

/** Listado de bosques: activos arriba y archivados abajo, con vista previa y acciones. */
export function ForestSwitcher({
  now,
  view,
  onChangeView,
  onSelect,
  onHistoryForest,
  onCreateForest,
  onEditForest,
}: ForestSwitcherProps) {
  const forests = useStore((state) => state.forests)
  const activeForestId = useStore((state) => state.activeForestId)
  const archiveForest = useStore((state) => state.archiveForest)
  const unarchiveForest = useStore((state) => state.unarchiveForest)
  const deleteForest = useStore((state) => state.deleteForest)

  const [deleteTarget, setDeleteTarget] = useState<Forest | null>(null)

  const activeForests = forests.filter((forest) => forest.archivedAt === null)
  const archivedForests = forests.filter((forest) => forest.archivedAt !== null)

  const handleArchiveToggle = (forest: Forest) => {
    if (forest.archivedAt === null) {
      archiveForest(forest.id, Date.now())
    } else {
      unarchiveForest(forest.id)
    }
  }

  const confirmDelete = () => {
    if (deleteTarget) {
      deleteForest(deleteTarget.id)
    }
    setDeleteTarget(null)
  }

  return (
    <section className="mx-auto w-full max-w-5xl px-4 pb-16 forests-view" aria-label="Bosques">
      <div className="mx-auto mb-7 w-full max-w-xs">
        <ViewSwitch view={view} onChange={onChangeView} />
      </div>

      <header className="forests-view__header">
        <div className="forests-view__intro">
          <p className="eyebrow">Tus objetivos</p>
          <h2 className="type-title-lg forests-view__title">Bosques</h2>
          <p className="type-body type-muted forests-view__subtitle">
            Cada bosque es un espacio propio para plantar. Elegí uno para enfocarte o creá uno
            nuevo.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-primary forests-view__create"
          onClick={onCreateForest}
        >
          <PlusIcon />
          Nuevo bosque
        </button>
      </header>

      {forests.length === 0 ? (
        <div className="card card--compact forests-empty">
          <p className="type-body type-muted">
            Todavía no tenés ningún bosque. Creá el primero para empezar a plantar.
          </p>
          <button type="button" className="btn btn-primary" onClick={onCreateForest}>
            <PlusIcon />
            Crear bosque
          </button>
        </div>
      ) : (
        <>
          <div className="forests-section">
            {activeForests.length === 0 ? (
              <p className="type-body type-muted forests-section__empty">
                No tenés bosques activos. Desarchivá uno o creá uno nuevo.
              </p>
            ) : (
              <div className="forests-grid" role="list">
                {activeForests.map((forest) => (
                  <ForestCard
                    key={forest.id}
                    forest={forest}
                    now={now}
                    isActive={forest.id === activeForestId}
                    isArchived={false}
                    onSelect={onSelect}
                    onHistory={onHistoryForest}
                    onEdit={onEditForest}
                    onArchiveToggle={handleArchiveToggle}
                    onDelete={setDeleteTarget}
                  />
                ))}
              </div>
            )}
          </div>

          {archivedForests.length > 0 && (
            <section
              className="forests-section forests-section--archived"
              aria-label="Bosques archivados"
            >
              <div className="forests-section__heading">
                <h3 className="type-title">Archivados</h3>
                <span className="forest-chip">{archivedForests.length}</span>
              </div>
              <div className="forests-grid" role="list">
                {archivedForests.map((forest) => (
                  <ForestCard
                    key={forest.id}
                    forest={forest}
                    now={now}
                    isActive={forest.id === activeForestId}
                    isArchived
                    onSelect={onSelect}
                    onHistory={onHistoryForest}
                    onEdit={onEditForest}
                    onArchiveToggle={handleArchiveToggle}
                    onDelete={setDeleteTarget}
                  />
                ))}
              </div>
            </section>
          )}
        </>
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Eliminar bosque"
        message="Se van a borrar el bosque, sus árboles y los registros de sus sesiones. No se puede deshacer."
        confirmLabel="Eliminar"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </section>
  )
}

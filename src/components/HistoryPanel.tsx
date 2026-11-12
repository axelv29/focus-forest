import { useMemo, useState } from 'react'
import { speciesFromKind } from '@/config/species'
import {
  buildHistory,
  HISTORY_FILTERS,
  type HistoryEntry,
  type HistoryFilter,
} from '@/logic/history'
import { formatSessionStart } from '@/logic/session'
import { useEdgeScrollbar } from '@/hooks/useEdgeScrollbar'
import { selectActiveForest } from '@/state/selectors'
import { useStore } from '@/state/store'
import { CloseIcon } from './icons'
import { TreePreview } from './TreePreview'

interface HistoryPanelProps {
  now: number
  selectedEntry: HistoryEntry | null
  onSelectKey: (key: string | null) => void
  onClose: () => void
}

const STATUS_LABEL = {
  completed: 'Completada',
  abandoned: 'Abandonada',
  mixed: 'Con abandonos',
  running: 'En curso',
} as const

/** Ventana flotante con el historial del bosque activo. */
export function HistoryPanel({ now, selectedEntry, onSelectKey, onClose }: HistoryPanelProps) {
  const sessions = useStore((state) => state.sessions)
  const plans = useStore((state) => state.plans)
  const trees = useStore((state) => state.trees)
  const forests = useStore((state) => state.forests)
  const activeForestId = useStore((state) => state.activeForestId)
  const active = useStore((state) => state.active)
  const activeForest = selectActiveForest(forests, activeForestId)
  const [filter, setFilter] = useState<HistoryFilter>('all')
  const listScrollbar = useEdgeScrollbar<HTMLDivElement>()

  const entries = useMemo(
    () => buildHistory(sessions, plans, trees, activeForest?.id ?? null, filter, now, active),
    [sessions, plans, trees, activeForest?.id, filter, now, active],
  )
  const totalMinutes = entries.reduce((total, entry) => total + entry.totalDurationMin, 0)

  return (
    <aside className="card card--compact history-panel" aria-label="Historial de sesiones">
      <div className="history-panel__head">
        <div className="min-w-0">
          <p className="eyebrow">Historial</p>
          <h2 className="type-title history-panel__title">{activeForest?.name ?? 'Sin bosque'}</h2>
        </div>
        <button
          type="button"
          className="icon-button history-panel__close"
          onClick={onClose}
          aria-label="Cerrar historial"
        >
          <CloseIcon />
        </button>
      </div>

      <div className="history-filters" role="group" aria-label="Filtros del historial">
        {HISTORY_FILTERS.map((item) => (
          <button
            key={item.value}
            type="button"
            className="history-filter"
            aria-pressed={filter === item.value}
            onClick={() => setFilter(item.value)}
          >
            {item.label}
          </button>
        ))}
      </div>

      <p className="history-panel__summary type-micro type-muted">
        {entries.length} {entries.length === 1 ? 'sesión' : 'sesiones'} · {totalMinutes} min
      </p>

      {entries.length === 0 ? (
        <p className="type-caption type-muted history-empty">
          No hay sesiones con este filtro. Probá con “Todas”.
        </p>
      ) : (
        <div
          onPointerMove={listScrollbar.onPointerMove}
          onPointerLeave={listScrollbar.onPointerLeave}
          className={`history-list history-panel__list edge-scrollbar${listScrollbar.nearEdge ? ' is-scrollbar-visible' : ''}`}
        >
          {entries.map((entry) => {
            const tree = entry.primaryTree
            const selected = selectedEntry?.key === entry.key
            const extraTrees = Math.max(0, entry.trees.length - 2)

            return (
              <button
                key={entry.key}
                type="button"
                className={selected ? 'history-row is-selected' : 'history-row'}
                aria-current={selected ? 'true' : undefined}
                onClick={() => onSelectKey(entry.key)}
              >
                <span className="history-row__trees" aria-hidden="true">
                  {tree ? (
                    <span className="history-row__tree">
                      <TreePreview
                        species={speciesFromKind(tree.kind)}
                        stage={tree.stage}
                        state={tree.state}
                      />
                    </span>
                  ) : (
                    <span className="history-row__tree history-row__tree--empty" />
                  )}
                  {entry.trees.slice(1, 2).map((extra) => (
                    <span key={extra.id} className="history-row__tree">
                      <TreePreview
                        species={speciesFromKind(extra.kind)}
                        stage={extra.stage}
                        state={extra.state}
                      />
                    </span>
                  ))}
                  {extraTrees > 0 && (
                    <span className="history-row__more type-micro">+{extraTrees}</span>
                  )}
                </span>

                <span className="history-row__body">
                  <span className="history-row__top">
                    <span className="history-row__title">{entry.title}</span>
                    <span className="history-row__duration">{entry.totalDurationMin} min</span>
                  </span>
                  <span className="history-row__meta">
                    {formatSessionStart(entry.startedAt)} · {STATUS_LABEL[entry.status]}
                  </span>
                  <span className="history-row__tags">
                    {entry.isMulti && (
                      <span className="forest-chip forest-chip--soft">
                        {entry.completedPomodoros}/{entry.targetPomodoros} pomodoros
                      </span>
                    )}
                    {entry.withered && <span className="forest-chip">Marchito</span>}
                  </span>
                </span>
              </button>
            )
          })}
        </div>
      )}
    </aside>
  )
}

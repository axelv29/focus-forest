import { speciesConfig, speciesFromKind } from '@/config/species'
import type { HistoryEntry } from '@/logic/history'
import { stageLabel } from '@/logic/growth'
import { formatSessionStart } from '@/logic/session'
import { BackIcon, CloseIcon } from './icons'
import { TreePreview } from './TreePreview'

interface SessionDetailCardProps {
  entry: HistoryEntry
  forestName: string
  onClose: () => void
  onBackToHistory?: () => void
  className?: string
}

const STATUS_LABEL = {
  completed: 'Completada',
  abandoned: 'Abandonada',
  mixed: 'Con abandonos',
} as const

export function SessionDetailCard({
  entry,
  forestName,
  onClose,
  onBackToHistory,
  className,
}: SessionDetailCardProps) {
  const primary = entry.primaryTree
  const species = primary ? speciesFromKind(primary.kind) : 'pino'
  const config = speciesConfig(species)
  const stage = primary?.stage ?? config.stages[config.stages.length - 1].stage
  const state = primary?.state ?? 'mature'
  const status = STATUS_LABEL[entry.status]
  const eyebrow =
    entry.status === 'completed'
      ? 'Sesión completada'
      : entry.status === 'abandoned'
        ? 'Sesión abandonada'
        : 'Sesión con abandonos'
  const detail =
    entry.targetPomodoros > 1
      ? `Pomodoro ${entry.completedPomodoros} de ${entry.targetPomodoros} · ${entry.totalDurationMin} min`
      : `${entry.totalDurationMin} min de enfoque`

  return (
    <section
      className={className ? `card card--session session-detail ${className}` : 'card card--session session-detail'}
      aria-label="Datos de la sesión"
    >
      <div className="session-detail__head">
        <div className="min-w-0">
          <p className="eyebrow">{eyebrow}</p>
          <h2 className="type-title session-detail__title">{entry.title}</h2>
        </div>
        <button type="button" className="icon-button session-detail__close" onClick={onClose} aria-label="Cerrar datos de la sesión">
          <CloseIcon />
        </button>
      </div>

      <div className="session-detail__tree">
        <span className="session-icon">
          <TreePreview species={species} stage={stage} state={state} />
        </span>
        <div className="min-w-0">
          <p className="type-title">
            {config.name} · {stageLabel(species, stage)}
          </p>
          <p className="type-micro type-muted">{detail}</p>
        </div>
      </div>

      <ol className="stage-track stage-track--detail" aria-label="Etapas de crecimiento">
        {config.stages.map((item) => {
          const itemState =
            item.stage < stage ? 'done' : item.stage === stage ? 'current' : 'upcoming'

          return (
            <li key={item.stage} className={`stage-track__item stage-track__item--${itemState}`}>
              <span className="stage-track__dot" aria-hidden="true" />
              <span className="stage-track__label">{item.stage}</span>
            </li>
          )
        })}
      </ol>

      {entry.description && <p className="session-detail__description type-caption">{entry.description}</p>}

      {entry.tasks.length > 0 && (
        <ul className="session-detail__tasks" aria-label="Objetivos de la sesión">
          {entry.tasks.map((task) => (
            <li key={task} className="session-detail__task type-caption">
              <span className="session-detail__task-dot" aria-hidden="true" />
              {task}
            </li>
          ))}
        </ul>
      )}

      {entry.trees.length > 1 && (
        <div className="session-detail__trees" aria-label="Árboles de la sesión">
          {entry.trees.map((tree, index) => (
            <span
              key={tree.id}
              className={
                tree.state === 'withered'
                  ? 'session-detail__tree-chip is-withered'
                  : 'session-detail__tree-chip'
              }
              title={`Árbol ${index + 1} de la sesión`}
            >
              <TreePreview
                species={speciesFromKind(tree.kind)}
                stage={tree.stage}
                state={tree.state}
              />
            </span>
          ))}
        </div>
      )}

      <dl className="session-data">
        <div className="session-data__row">
          <dt className="session-data__label">Bosque</dt>
          <dd className="session-data__value">{forestName}</dd>
        </div>
        <div className="session-data__row">
          <dt className="session-data__label">Comenzó</dt>
          <dd className="session-data__value">{formatSessionStart(entry.startedAt)}</dd>
        </div>
        <div className="session-data__row">
          <dt className="session-data__label">Terminó</dt>
          <dd className="session-data__value session-data__value--strong">
            {formatSessionStart(entry.endedAt)}
          </dd>
        </div>
        <div className="session-data__row">
          <dt className="session-data__label">Enfoque</dt>
          <dd className="session-data__value">{entry.totalDurationMin} min</dd>
        </div>
        {entry.targetPomodoros > 1 && (
          <div className="session-data__row">
            <dt className="session-data__label">Pomodoros</dt>
            <dd className="session-data__value">
              {entry.completedPomodoros} de {entry.targetPomodoros}
            </dd>
          </div>
        )}
        <div className="session-data__row">
          <dt className="session-data__label">Estado</dt>
          <dd className="session-data__value">{status}</dd>
        </div>
        <div className="session-data__row">
          <dt className="session-data__label">Árbol</dt>
          <dd className="session-data__value">
            {state === 'withered' ? 'Marchito' : 'Plantado'}
          </dd>
        </div>
      </dl>

      {onBackToHistory && (
        <button type="button" className="btn btn-secondary btn--sm session-detail__back" onClick={onBackToHistory}>
          <BackIcon />
          Volver al historial
        </button>
      )}
    </section>
  )
}

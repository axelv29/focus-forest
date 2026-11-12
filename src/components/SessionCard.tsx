import { speciesConfig, speciesForFocusMin, stageMinuteMark } from '@/config/species'
import { stageForElapsedMs, stageLabel } from '@/logic/growth'
import { formatSessionStart, sessionName } from '@/logic/session'
import { elapsedMs } from '@/logic/timer'
import { selectActiveForest, selectStats } from '@/state/selectors'
import { useStore } from '@/state/store'
import { TreePreview } from './TreePreview'

export function SessionCard({ now }: { now: number }) {
  const active = useStore((state) => state.active)
  const sessions = useStore((state) => state.sessions)
  const trees = useStore((state) => state.trees)
  const forests = useStore((state) => state.forests)
  const plans = useStore((state) => state.plans)
  const forestId = active?.kind === 'focus' ? active.forestId : null
  const activeForest = selectActiveForest(forests, forestId)
  const stats = selectStats(sessions, trees, now, activeForest?.id)

  if (active?.kind !== 'focus') {
    return null
  }

  const species = speciesForFocusMin(active.durationMin)
  const config = speciesConfig(species)
  const stage = stageForElapsedMs(species, elapsedMs(active, now), active.durationMin)
  const plan = active.planId
    ? plans.find((item) => item.id === active.planId)
    : undefined
  const name = active.title?.trim() || sessionName('focus', stats.todayPomodoros)
  const started = formatSessionStart(active.startedAt)
  const title = active.title?.trim() || `${config.name} · ${stageLabel(species, stage)}`
  const detail =
    active.pomoIndex && active.pomoTotal && active.pomoTotal > 1
      ? `Pomodoro ${active.pomoIndex} de ${active.pomoTotal} · ${active.durationMin} min`
      : `Etapa ${stage} de ${config.stages.length} · ${active.durationMin} min`
  const speciesDetail = `${config.name} · ${stageLabel(species, stage)}`

  return (
    <section className="card card--session w-full" aria-label="Sesión actual">
      <p className="eyebrow">Sesión en curso</p>

      <div className="mt-2.5 flex items-center gap-2.5">
        <span className="session-icon">
          <TreePreview species={species} stage={stage} />
        </span>
        <div className="min-w-0">
          <h2 className="type-title">{title}</h2>
          <p className="type-micro type-muted mt-0.5">{detail}</p>
          {active.title?.trim() && (
            <p className="type-micro type-muted mt-0.5">{speciesDetail}</p>
          )}
        </div>
      </div>

      {active.description?.trim() && (
        <p className="session-card__description type-caption">{active.description}</p>
      )}

      {plan && plan.tasks.length > 0 && (
        <p className="type-micro type-muted session-card__tasks">
          {plan.tasks.length} {plan.tasks.length === 1 ? 'objetivo' : 'objetivos'} en esta sesión
        </p>
      )}

      <ol className="stage-track" aria-label="Etapas de crecimiento">
        {config.stages.map((item) => {
          const state = item.stage < stage ? 'done' : item.stage === stage ? 'current' : 'upcoming'
          const minutes = stageMinuteMark(species, item.stage, active.durationMin)

          return (
            <li key={item.stage} className={`stage-track__item stage-track__item--${state}`}>
              <span className="stage-track__dot" aria-hidden="true" />
              <span className="stage-track__label">{minutes}</span>
            </li>
          )
        })}
      </ol>

      <dl className="session-data">
        <div className="session-data__row">
          <dt className="session-data__label">Sesión</dt>
          <dd className="session-data__value">{name}</dd>
        </div>
        <div className="session-data__row">
          <dt className="session-data__label">Comenzó</dt>
          <dd className="session-data__value session-data__value--strong">{started}</dd>
        </div>
        <div className="session-data__row">
          <dt className="session-data__label">Bosque</dt>
          <dd className="session-data__value">{activeForest?.name ?? 'Sin bosque'}</dd>
        </div>
      </dl>
    </section>
  )
}

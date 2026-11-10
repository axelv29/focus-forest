import { FOREST_NAME } from '@/config/forest'
import { speciesConfig, speciesForFocusMin, stageMinuteMark } from '@/config/species'
import { stageForElapsedMs, stageLabel } from '@/logic/growth'
import { formatSessionStart, sessionName } from '@/logic/session'
import { elapsedMs } from '@/logic/timer'
import { selectStats } from '@/state/selectors'
import { useStore } from '@/state/store'
import { TreePreview } from './TreePreview'

export function SessionCard({ now }: { now: number }) {
  const active = useStore((state) => state.active)
  const sessions = useStore((state) => state.sessions)
  const trees = useStore((state) => state.trees)
  const stats = selectStats(sessions, trees, now)

  if (active?.kind !== 'focus') {
    return null
  }

  const species = speciesForFocusMin(active.durationMin)
  const config = speciesConfig(species)
  const stage = stageForElapsedMs(species, elapsedMs(active, now), active.durationMin)
  const name = sessionName('focus', stats.todayPomodoros)
  const started = formatSessionStart(active.startedAt)
  const title = `${config.name} · ${stageLabel(species, stage)}`
  const detail = `Etapa ${stage} de ${config.stages.length} · ${active.durationMin} min`

  return (
    <section className="card card--session w-full" aria-label="Sesión actual">
      <p className="eyebrow">Árbol de esta sesión</p>

      <div className="mt-2.5 flex items-center gap-2.5">
        <span className="session-icon">
          <TreePreview species={species} stage={stage} />
        </span>
        <div>
          <h2 className="type-title">{title}</h2>
          <p className="type-micro type-muted mt-0.5">{detail}</p>
        </div>
      </div>

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
          <dd className="session-data__value">{FOREST_NAME}</dd>
        </div>
      </dl>
    </section>
  )
}

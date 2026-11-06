import { FOREST_NAME, TREE_SPECIES_NAME } from '@/config/forest'
import { GROWTH_THRESHOLDS } from '@/config/growth'
import { stageForElapsedMs, stageLabel } from '@/logic/growth'
import { formatSessionStart, sessionName } from '@/logic/session'
import { elapsedMs } from '@/logic/timer'
import { selectStats } from '@/state/selectors'
import { useStore } from '@/state/store'
import { PineIcon } from './icons'

export function SessionCard({ now }: { now: number }) {
  const active = useStore((state) => state.active)
  const sessions = useStore((state) => state.sessions)
  const trees = useStore((state) => state.trees)
  const stats = selectStats(sessions, trees, now)

  if (active?.kind !== 'focus') {
    return null
  }

  const stage = stageForElapsedMs(elapsedMs(active, now))
  const name = sessionName('focus', stats.todayPomodoros)
  const started = formatSessionStart(active.startedAt)
  const title = `${TREE_SPECIES_NAME} · ${stageLabel(stage)}`
  const detail = `Etapa ${stage} de ${GROWTH_THRESHOLDS.length}`

  return (
    <section className="card card--session w-full" aria-label="Sesión actual">
      <p className="eyebrow">Árbol de esta sesión</p>

      <div className="mt-2.5 flex items-center gap-2.5">
        <span className="session-icon">
          <PineIcon />
        </span>
        <div>
          <h2 className="type-title">{title}</h2>
          <p className="type-micro type-muted mt-0.5">{detail}</p>
        </div>
      </div>

      <ol className="stage-track" aria-label="Etapas de crecimiento">
        {GROWTH_THRESHOLDS.map((threshold) => {
          const state =
            threshold.stage < stage ? 'done' : threshold.stage === stage ? 'current' : 'upcoming'

          return (
            <li key={threshold.stage} className={`stage-track__item stage-track__item--${state}`}>
              <span className="stage-track__dot" aria-hidden="true" />
              <span className="stage-track__label">{threshold.minutes}</span>
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

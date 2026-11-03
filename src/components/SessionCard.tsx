import { FOCUS_MINUTES } from '@/config/timer'
import { stageForElapsedMs, stageLabel } from '@/logic/growth'
import { elapsedMs } from '@/logic/timer'
import { useStore } from '@/state/store'

export function SessionCard({ now }: { now: number }) {
  const active = useStore((state) => state.active)
  const stage = active?.kind === 'focus' ? stageForElapsedMs(elapsedMs(active, now)) : null
  const date = new Intl.DateTimeFormat('es', { dateStyle: 'long' }).format(new Date(now))

  const title =
    active?.kind === 'focus'
      ? 'Enfoque'
      : active?.kind === 'break'
        ? 'Descanso'
        : 'Listo para empezar'

  const detail =
    active?.kind === 'focus' && stage !== null
      ? `Crecimiento: ${stageLabel(stage)}`
      : active?.kind === 'break'
        ? 'Sin árbol: el descanso no planta.'
        : `${FOCUS_MINUTES} minutos de enfoque`

  return (
    <section className="card" aria-label="Sesión actual">
      <p className="eyebrow">SESIÓN</p>
      <h2 className="type-title mt-3">{title}</h2>
      <p className="type-body type-muted mt-2">{detail}</p>
      <p className="type-caption type-muted mt-4">{date}</p>
    </section>
  )
}

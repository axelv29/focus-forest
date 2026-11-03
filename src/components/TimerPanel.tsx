import { FOCUS_MINUTES } from '@/config/timer'
import { elapsedMs, formatClock, remainingMs } from '@/logic/timer'
import { selectStats } from '@/state/selectors'
import { useStore } from '@/state/store'

interface TimerPanelProps {
  now: number
  onAbandonRequest: () => void
}

export function TimerPanel({ now, onAbandonRequest }: TimerPanelProps) {
  const active = useStore((state) => state.active)
  const sessions = useStore((state) => state.sessions)
  const trees = useStore((state) => state.trees)
  const startFocus = useStore((state) => state.startFocus)
  const pause = useStore((state) => state.pause)
  const resume = useStore((state) => state.resume)
  const skipBreak = useStore((state) => state.skipBreak)
  const stats = selectStats(sessions, trees, now)

  const isPaused = active?.pausedAt !== null && active?.pausedAt !== undefined
  const remaining = active ? remainingMs(active, now) : FOCUS_MINUTES * 60_000
  const duration = active ? active.durationMin * 60_000 : FOCUS_MINUTES * 60_000
  const progress = active ? Math.min(1, elapsedMs(active, now) / duration) : 0
  const phase = active ? (active.kind === 'focus' ? 'Enfoque' : 'Descanso') : 'Enfoque'

  return (
    <section className="card w-full" aria-label="Temporizador">
      <div className="flex items-center justify-between gap-2">
        <p className="eyebrow">{phase.toUpperCase()}</p>
        <span className="type-caption type-muted whitespace-nowrap">
          Pomodoros hoy: {stats.todayPomodoros}
        </span>
      </div>

      <p className="type-timer mt-3 text-center">{formatClock(remaining)}</p>

      <div
        className="progress-track mt-3"
        role="progressbar"
        aria-label="Progreso de la sesión"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progress * 100)}
      >
        <div className="progress-fill" style={{ width: `${progress * 100}%` }} />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {!active && (
          <button type="button" className="btn btn-primary flex-1" onClick={() => startFocus(now)}>
            Iniciar
          </button>
        )}

        {active && (
          <>
            <button
              type="button"
              className="btn btn-primary flex-1"
              onClick={() => (isPaused ? resume(now) : pause(now))}
            >
              {isPaused ? 'Reanudar' : 'Pausar'}
            </button>
            {active.kind === 'break' ? (
              <button type="button" className="btn btn-secondary" onClick={skipBreak}>
                Saltar
              </button>
            ) : (
              <button type="button" className="btn btn-secondary" onClick={onAbandonRequest}>
                Abandonar
              </button>
            )}
          </>
        )}
      </div>
    </section>
  )
}

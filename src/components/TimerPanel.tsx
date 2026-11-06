import { FOCUS_MINUTES } from '@/config/timer'
import type { View } from '@/config/views'
import { elapsedMs, remainingMs } from '@/logic/timer'
import { selectStats } from '@/state/selectors'
import { useStore } from '@/state/store'
import { CloseIcon, PauseIcon, PlayIcon } from './icons'
import { TimerRing } from './TimerRing'
import { ViewSwitch } from './ViewSwitch'

interface TimerPanelProps {
  now: number
  view: View
  onChangeView: (view: View) => void
  onAbandonRequest: () => void
}

export function TimerPanel({ now, view, onChangeView, onAbandonRequest }: TimerPanelProps) {
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
  const phase = active ? (active.kind === 'focus' ? 'Enfoque' : 'Descanso') : 'Listo'

  return (
    <section className="card w-full" aria-label="Temporizador">
      <ViewSwitch view={view} onChange={onChangeView} disabled={active !== null} />

      <p className="eyebrow timer-phase">{phase}</p>

      <TimerRing
        progress={progress}
        remainingMs={remaining}
        durationMin={active?.durationMin ?? FOCUS_MINUTES}
        paused={isPaused}
      />

      <div className="timer-today">
        <span>Pomodoros hoy</span>
        <strong>{stats.todayPomodoros}</strong>
      </div>

      <div className="timer-actions">
        {!active && (
          <button type="button" className="btn btn-primary" onClick={() => startFocus(now)}>
            <PlayIcon />
            Iniciar
          </button>
        )}

        {active && (
          <>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => (isPaused ? resume(now) : pause(now))}
            >
              {isPaused ? <PlayIcon /> : <PauseIcon />}
              {isPaused ? 'Reanudar' : 'Pausar'}
            </button>

            {active.kind === 'break' ? (
              <button type="button" className="btn btn-secondary" onClick={skipBreak}>
                Saltar
              </button>
            ) : (
              <button type="button" className="btn btn-ghost-danger" onClick={onAbandonRequest}>
                <CloseIcon />
                Abandonar
              </button>
            )}
          </>
        )}
      </div>
    </section>
  )
}

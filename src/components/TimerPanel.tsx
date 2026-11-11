import { useState } from 'react'
import { FOCUS_MINUTES } from '@/config/timer'
import type { View } from '@/config/views'
import { elapsedMs, remainingMs } from '@/logic/timer'
import { selectActiveForest, selectStats } from '@/state/selectors'
import { useStore } from '@/state/store'
import { CloseIcon, GearIcon, PauseIcon, PlayIcon } from './icons'
import { SettingsPanel } from './SettingsPanel'
import { TimerRing } from './TimerRing'
import { ViewSwitch } from './ViewSwitch'

interface TimerPanelProps {
  now: number
  view: View
  onChangeView: (view: View) => void
  onAbandonRequest: () => void
  onStrictPauseRequest: () => void
  onCreateForest: () => void
}

export function TimerPanel({
  now,
  view,
  onChangeView,
  onAbandonRequest,
  onStrictPauseRequest,
  onCreateForest,
}: TimerPanelProps) {
  const active = useStore((state) => state.active)
  const sessions = useStore((state) => state.sessions)
  const trees = useStore((state) => state.trees)
  const forests = useStore((state) => state.forests)
  const activeForestId = useStore((state) => state.activeForestId)
  const settings = useStore((state) => state.settings)
  const startFocus = useStore((state) => state.startFocus)
  const pause = useStore((state) => state.pause)
  const resume = useStore((state) => state.resume)
  const skipBreak = useStore((state) => state.skipBreak)
  const updateSettings = useStore((state) => state.updateSettings)
  const forestId = active?.kind === 'focus' ? active.forestId : activeForestId
  const activeForest = selectActiveForest(forests, forestId)
  const stats = selectStats(sessions, trees, now, activeForest?.id)
  const [showSettings, setShowSettings] = useState(false)

  const isPaused = active?.pausedAt !== null && active?.pausedAt !== undefined
  const focusMin = settings.focusMin ?? FOCUS_MINUTES
  const remaining = active ? remainingMs(active, now) : focusMin * 60_000
  const duration = active ? active.durationMin * 60_000 : focusMin * 60_000
  const progress = active ? Math.min(1, elapsedMs(active, now) / duration) : 0
  const phase = active ? (active.kind === 'focus' ? 'Enfoque' : 'Descanso') : 'Listo'
  const ringVariant =
    !active || active.kind === 'focus' ? 'focus' : active.longBreak ? 'longBreak' : 'shortBreak'
  const toleranceMs = (active?.pauseToleranceMin ?? 0) * 60_000
  const toleranceRemainingMs =
    active && isPaused && toleranceMs > 0
      ? Math.max(0, toleranceMs - (active.pausedMs + (now - (active.pausedAt ?? now))))
      : null

  const handlePause = () => {
    if (isPaused) {
      resume(now)
      return
    }

    if (active?.strictPause) {
      onStrictPauseRequest()
      return
    }

    pause(now)
  }

  return (
    <section className="card w-full" aria-label="Temporizador">
      {showSettings ? (
        <SettingsPanel
          settings={settings}
          onChange={updateSettings}
          onBack={() => setShowSettings(false)}
        />
      ) : (
        <>
          <ViewSwitch view={view} onChange={onChangeView} disabled={active !== null} />

          <div className="timer-phase-row">
            <p className="eyebrow timer-phase">{phase}</p>
            <button
              type="button"
              className="icon-button timer-settings-button"
              onClick={() => setShowSettings(true)}
              aria-label="Abrir ajustes"
              title="Ajustes"
            >
              <GearIcon />
            </button>
          </div>

          <TimerRing
            variant={ringVariant}
            progress={progress}
            remainingMs={remaining}
            durationMin={active?.durationMin ?? focusMin}
            paused={isPaused}
            toleranceRemainingMs={toleranceRemainingMs}
          />

          <div className="timer-today">
            <span>Pomodoros hoy</span>
            <strong>{stats.todayPomodoros}</strong>
          </div>

          <div className="timer-actions">
            {!active && (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  if (!activeForest) {
                    onCreateForest()
                    return
                  }
                  startFocus(now)
                }}
              >
                <PlayIcon />
                Iniciar
              </button>
            )}

            {active && (
              <>
                <button type="button" className="btn btn-primary" onClick={handlePause}>
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
        </>
      )}
    </section>
  )
}

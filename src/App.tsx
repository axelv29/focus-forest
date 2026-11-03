import { useCallback, useMemo, useState } from 'react'
import { BreakPrompt } from '@/components/BreakPrompt'
import { CompletionToast } from '@/components/CompletionToast'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { GardenCanvas } from '@/components/GardenCanvas'
import { SessionCard } from '@/components/SessionCard'
import { StatsPanel } from '@/components/StatsPanel'
import { TimerPanel } from '@/components/TimerPanel'
import { useCountdown } from '@/hooks/useCountdown'
import { stageForElapsedMs } from '@/logic/growth'
import { elapsedMs } from '@/logic/timer'
import { useStore } from '@/state/store'

type View = 'garden' | 'stats'

function App() {
  const now = useCountdown()
  const active = useStore((state) => state.active)
  const trees = useStore((state) => state.trees)
  const abandon = useStore((state) => state.abandon)
  const [view, setView] = useState<View>('garden')
  const [confirmFor, setConfirmFor] = useState<string | null>(null)

  const activeStage = active?.kind === 'focus' ? stageForElapsedMs(elapsedMs(active, now)) : null
  const activePreview = useMemo(() => {
    if (active?.kind !== 'focus' || !active.cell || activeStage === null) {
      return null
    }

    return { cell: active.cell, stage: activeStage }
  }, [active, activeStage])

  const closeConfirm = useCallback(() => setConfirmFor(null), [])
  const confirmAbandon = useCallback(() => {
    abandon(Date.now())
    setConfirmFor(null)
  }, [abandon])

  const withered = trees.filter((tree) => tree.state === 'withered').length
  const label = `Pradera con ${trees.length} árboles y ${withered} marchitos.`
  const inSession = active !== null
  const showConfirm = active !== null && active.kind === 'focus' && confirmFor === active.id

  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-ink">
      <header className="mx-auto flex w-full max-w-[1440px] flex-wrap items-center justify-between gap-4 px-4 py-3">
        <h1 className="app-title">FOCUS FOREST</h1>

        {!inSession && (
          <nav className="flex gap-2" aria-label="Vistas">
            <button
              type="button"
              className={`btn btn--sm ${view === 'garden' ? 'btn-primary' : 'btn-secondary'}`}
              aria-pressed={view === 'garden'}
              onClick={() => setView('garden')}
            >
              Bosque
            </button>
            <button
              type="button"
              className={`btn btn--sm ${view === 'stats' ? 'btn-primary' : 'btn-secondary'}`}
              aria-pressed={view === 'stats'}
              onClick={() => setView('stats')}
            >
              Estadísticas
            </button>
          </nav>
        )}
      </header>

      <main className="pb-8 min-[1400px]:pb-0">
        {view === 'garden' || inSession ? (
          <div className="relative mx-auto w-full max-w-[1440px]">
            <div className="relative mx-auto w-full max-w-[1024px]">
              <GardenCanvas trees={trees} active={activePreview} label={label} />
            </div>

            {!inSession && (
              <div className="mx-auto mt-4 w-full max-w-sm px-4 min-[1400px]:absolute min-[1400px]:left-0 min-[1400px]:top-6 min-[1400px]:mt-0 min-[1400px]:w-56 min-[1400px]:px-0">
                <SessionCard now={now} />
              </div>
            )}

            <div className="mx-auto mt-4 w-full max-w-sm px-4 min-[1400px]:absolute min-[1400px]:right-0 min-[1400px]:top-6 min-[1400px]:mt-0 min-[1400px]:w-56 min-[1400px]:px-0">
              <TimerPanel now={now} onAbandonRequest={() => setConfirmFor(active?.id ?? null)} />
            </div>
          </div>
        ) : (
          <StatsPanel now={now} />
        )}
      </main>

      <CompletionToast />
      <BreakPrompt />
      <ConfirmDialog
        open={showConfirm}
        title="¿Abandonar la sesión?"
        message="El árbol va a quedar marchito y la sesión no va a sumar minutos. Podés empezar otro pomodoro cuando quieras."
        confirmLabel="Abandonar"
        onConfirm={confirmAbandon}
        onCancel={closeConfirm}
      />
    </div>
  )
}

export default App

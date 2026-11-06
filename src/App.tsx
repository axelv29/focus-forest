import { useCallback, useMemo, useState } from 'react'
import { BreakPrompt } from '@/components/BreakPrompt'
import { CompletionToast } from '@/components/CompletionToast'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { DevPanel } from '@/components/DevPanel'
import { GardenCanvas } from '@/components/GardenCanvas'
import { PineIcon } from '@/components/icons'
import { SessionCard } from '@/components/SessionCard'
import { StatsPanel } from '@/components/StatsPanel'
import { StorageNotice } from '@/components/StorageNotice'
import { TimerPanel } from '@/components/TimerPanel'
import type { View } from '@/config/views'
import { useCountdown } from '@/hooks/useCountdown'
import { stageForElapsedMs } from '@/logic/growth'
import { elapsedMs } from '@/logic/timer'
import { useStore } from '@/state/store'

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
    <div className="min-h-screen overflow-hidden bg-background text-ink">
      <header className="relative z-30 flex w-full items-center px-4 py-3">
        <div className="brand">
          <span className="brand-mark">
            <PineIcon />
          </span>
          <h1 className="app-title">Focus Forest</h1>
        </div>
      </header>

      <StorageNotice />

      <main className="max-[1399px]:h-[calc(100vh-3.5rem)] max-[1399px]:overflow-x-hidden max-[1399px]:overflow-y-auto pb-8 min-[1400px]:pb-0">
        {view === 'garden' || inSession ? (
          <div className="relative w-full">
            <div className="relative mx-auto w-full max-w-[1024px]">
              <GardenCanvas trees={trees} active={activePreview} label={label} />
            </div>

            {active?.kind === 'focus' && (
              <div className="relative z-10 mx-auto mt-4 w-full max-w-sm px-4 min-[1400px]:absolute min-[1400px]:left-4 min-[1400px]:top-4 min-[1400px]:mt-0 min-[1400px]:w-[clamp(200px,15vw,300px)] min-[1400px]:px-0">
                <SessionCard now={now} />
              </div>
            )}

            <div className="relative z-10 mx-auto mt-4 w-full max-w-md px-4 min-[1400px]:absolute min-[1400px]:right-4 min-[1400px]:top-4 min-[1400px]:mt-0 min-[1400px]:w-[clamp(260px,20vw,420px)] min-[1400px]:px-0">
              <TimerPanel
                now={now}
                view={view}
                onChangeView={setView}
                onAbandonRequest={() => setConfirmFor(active?.id ?? null)}
              />
            </div>
          </div>
        ) : (
          <StatsPanel now={now} view={view} onChangeView={setView} />
        )}
      </main>

      {import.meta.env.DEV && <DevPanel />}

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

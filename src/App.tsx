import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { BreakPrompt } from '@/components/BreakPrompt'
import { CompletionToast } from '@/components/CompletionToast'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { DevPanel } from '@/components/DevPanel'
import { ForestCountdown } from '@/components/ForestCountdown'
import { ForestCreateDialog } from '@/components/ForestCreateDialog'
import { ForestSwitcher } from '@/components/ForestSwitcher'
import { GardenCanvas } from '@/components/GardenCanvas'
import { SessionCard } from '@/components/SessionCard'
import { StatsPanel } from '@/components/StatsPanel'
import { StorageNotice } from '@/components/StorageNotice'
import { TimerPanel } from '@/components/TimerPanel'
import type { View } from '@/config/views'
import { useCountdown } from '@/hooks/useCountdown'
import { stageForElapsedMs } from '@/logic/growth'
import { elapsedMs } from '@/logic/timer'
import { playTone } from '@/logic/alarm'
import { sendNotification } from '@/logic/notifications'
import { useStore } from '@/state/store'
import { speciesForFocusMin } from '@/config/species'
import { describeForestCountdown } from '@/logic/forest'
import { selectActiveForest } from '@/state/selectors'
import type { Forest, NewForestInput } from '@/state/types'

type ConfirmMode = 'abandon' | 'strictPause'

interface ConfirmRequest {
  id: string
  mode: ConfirmMode
}

function App() {
  const now = useCountdown()
  const active = useStore((state) => state.active)
  const trees = useStore((state) => state.trees)
  const forests = useStore((state) => state.forests)
  const activeForestId = useStore((state) => state.activeForestId)
  const display = useStore((state) => state.display)
  const pendingBreak = useStore((state) => state.pendingBreak)
  const startBreak = useStore((state) => state.startBreak)
  const startFocus = useStore((state) => state.startFocus)
  const abandon = useStore((state) => state.abandon)
  const createForest = useStore((state) => state.createForest)
  const updateForest = useStore((state) => state.updateForest)
  const selectForest = useStore((state) => state.selectForest)
  const [view, setView] = useState<View>('garden')
  const [confirmRequest, setConfirmRequest] = useState<ConfirmRequest | null>(null)
  const [forestDialogOpen, setForestDialogOpen] = useState(false)
  const [editingForest, setEditingForest] = useState<Forest | null>(null)

  const currentForestId = active?.kind === 'focus' ? active.forestId : activeForestId
  const activeForest = selectActiveForest(forests, currentForestId)
  const forestTrees = activeForest ? trees.filter((tree) => tree.forestId === activeForest.id) : []
  const countdown = activeForest ? describeForestCountdown(activeForest.endsOn, now) : null

  const activeSpecies = active?.kind === 'focus' ? speciesForFocusMin(active.durationMin) : null
  const activeStage =
    activeSpecies !== null && active?.kind === 'focus'
      ? stageForElapsedMs(activeSpecies, elapsedMs(active, now), active.durationMin)
      : null
  const activePreview = useMemo(() => {
    if (
      active?.kind !== 'focus' ||
      !active.cell ||
      activeStage === null ||
      activeSpecies === null
    ) {
      return null
    }

    return { cell: active.cell, species: activeSpecies, stage: activeStage }
  }, [active, activeSpecies, activeStage])

  const closeConfirm = useCallback(() => setConfirmRequest(null), [])
  const confirmAbandon = useCallback(() => {
    abandon(Date.now())
    setConfirmRequest(null)
  }, [abandon])
  const requestAbandon = useCallback(() => {
    if (active) {
      setConfirmRequest({ id: active.id, mode: 'abandon' })
    }
  }, [active])
  const requestStrictPause = useCallback(() => {
    if (active) {
      setConfirmRequest({ id: active.id, mode: 'strictPause' })
    }
  }, [active])

  const openForestDialog = useCallback(() => setForestDialogOpen(true), [])
  const closeForestDialog = useCallback(() => {
    setForestDialogOpen(false)
    setEditingForest(null)
  }, [])
  const openEditForest = useCallback((forest: Forest) => {
    setEditingForest(forest)
    setForestDialogOpen(true)
  }, [])
  const handleCreateForest = useCallback(
    (input: NewForestInput, forestId?: string) => {
      if (forestId) {
        updateForest(forestId, input)
        return forestId
      }

      const created = createForest(input, Date.now())
      if (created) {
        setView('garden')
      }
      return created
    },
    [createForest, updateForest],
  )

  const handleSelectForest = useCallback(
    (id: string) => {
      selectForest(id)
      setView('garden')
    },
    [selectForest],
  )

  const settings = useStore((state) => state.settings)
  const devGardenSize = useStore((state) => state.devGardenSize)
  const prevActiveRef = useRef(active)
  const withered = forestTrees.filter((tree) => tree.state === 'withered').length

  // Alarma al completar un enfoque (aparece el aviso de descanso).
  useEffect(() => {
    if (active === null && prevActiveRef.current?.kind === 'focus') {
      playTone(settings.alarmTone, settings.alarmVolume)
      if (settings.notification) {
        sendNotification('Focus Forest', '¡Pomodoro completado! El árbol quedó plantado.')
      }
    }
    if (active === null && prevActiveRef.current?.kind === 'break') {
      playTone(settings.alarmTone, settings.alarmVolume)
      if (settings.notification) {
        sendNotification('Focus Forest', 'Descanso terminado.')
      }
    }
    prevActiveRef.current = active
  }, [active, settings.alarmTone, settings.alarmVolume, settings.notification])

  // Cierre de página con sesión activa ≈ abandono.
  useEffect(() => {
    const handler = (event: BeforeUnloadEvent) => {
      if (active) {
        event.preventDefault()
        event.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [active])

  // Auto-iniciar descanso.
  useEffect(() => {
    if (pendingBreak && settings.autoStartBreak) {
      startBreak(Date.now())
    }
  }, [pendingBreak, settings.autoStartBreak, startBreak])

  // Auto-iniciar pomodoro tras descanso.
  useEffect(() => {
    if (
      active === null &&
      !pendingBreak &&
      activeForest !== null &&
      settings.autoStartFocus &&
      prevActiveRef.current?.kind === 'break'
    ) {
      startFocus(Date.now())
    }
  }, [active, activeForest, pendingBreak, settings.autoStartFocus, startFocus])
  const label = activeForest
    ? `Bosque ${activeForest.name}: ${forestTrees.length} árboles y ${withered} marchitos.`
    : 'Pradera de bienvenida con 8 por 8 celdas.'
  const inSession = active !== null
  const showConfirm = active !== null && active.kind === 'focus' && confirmRequest?.id === active.id
  const confirmMode = confirmRequest?.mode ?? 'abandon'

  const scrollableView = view === 'forests' || (view === 'stats' && !inSession)

  return (
    <div
      className={
        scrollableView
          ? 'min-h-screen overflow-x-hidden bg-background text-ink'
          : 'min-h-screen overflow-hidden bg-background text-ink'
      }
    >
      <header className="relative z-30 flex w-full items-center gap-3 px-4 py-3">
        <div className="brand">
          <h1 className="app-title">Focus Forest</h1>
        </div>
        {activeForest && (display.showForestName || (display.showCountdown && countdown)) && (
          <div className="forest-header">
            {display.showForestName && (
              <span className="forest-header__name" title={activeForest.name}>
                {activeForest.name}
              </span>
            )}
            {display.showCountdown && countdown && (
              <ForestCountdown countdown={countdown} />
            )}
          </div>
        )}
      </header>

      <StorageNotice />

      <main
        className={
          scrollableView
            ? 'pb-12'
            : 'max-[767px]:h-[calc(100vh-3.5rem)] max-[767px]:overflow-x-hidden max-[767px]:overflow-y-auto pb-8 min-[768px]:pb-0'
        }
      >
        {view === 'forests' ? (
          <ForestSwitcher
            now={now}
            view={view}
            onChangeView={setView}
            onSelect={handleSelectForest}
            onCreateForest={openForestDialog}
            onEditForest={openEditForest}
          />
        ) : view === 'garden' || inSession ? (
          <div className="relative w-full">
            <div className="relative mx-auto w-full max-w-[1024px]">
              <GardenCanvas
                trees={forestTrees}
                active={activePreview}
                label={label}
                gardenSize={activeForest?.size ?? devGardenSize}
                hasForest={activeForest !== null}
              />
            </div>

            {active?.kind === 'focus' && (
              <div className="relative z-10 mx-auto mt-4 w-full max-w-sm px-4 min-[768px]:absolute min-[768px]:left-4 min-[768px]:top-4 min-[768px]:mt-0 min-[768px]:w-[clamp(200px,15vw,300px)] min-[768px]:px-0">
                <SessionCard now={now} />
              </div>
            )}

            <div className="relative z-10 mx-auto mt-4 w-full max-w-md px-4 min-[768px]:absolute min-[768px]:right-4 min-[768px]:top-4 min-[768px]:mt-0 min-[768px]:w-[clamp(350px,20vw,420px)] min-[768px]:px-0">
              <TimerPanel
                now={now}
                view={view}
                onChangeView={setView}
                onAbandonRequest={requestAbandon}
                onStrictPauseRequest={requestStrictPause}
                onCreateForest={openForestDialog}
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
        title={
          confirmMode === 'strictPause' ? '¿Pausar con pausa estricta?' : '¿Abandonar la sesión?'
        }
        message={
          confirmMode === 'strictPause'
            ? 'La pausa estricta está activada: pausar equivale a abandonar. El árbol va a quedar marchito y la sesión no va a sumar minutos. Si querés hacer pausas, desactivá la pausa estricta en los ajustes.'
            : 'El árbol va a quedar marchito y la sesión no va a sumar minutos. Podés empezar otro pomodoro cuando quieras.'
        }
        confirmLabel={confirmMode === 'strictPause' ? 'Pausar y abandonar' : 'Abandonar'}
        onConfirm={confirmAbandon}
        onCancel={closeConfirm}
      />
      <ForestCreateDialog
        open={forestDialogOpen}
        onClose={closeForestDialog}
        onCreate={handleCreateForest}
        forest={editingForest}
      />
    </div>
  )
}

export default App

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { BreakPrompt } from '@/components/BreakPrompt'
import { CompletionToast } from '@/components/CompletionToast'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { DevPanel } from '@/components/DevPanel'
import { ForestCountdown } from '@/components/ForestCountdown'
import { ForestCreateDialog } from '@/components/ForestCreateDialog'
import { ForestSwitcher } from '@/components/ForestSwitcher'
import { GardenCanvas } from '@/components/GardenCanvas'
import { HistoryPanel } from '@/components/HistoryPanel'
import { SessionCard } from '@/components/SessionCard'
import { SessionCreateDialog } from '@/components/SessionCreateDialog'
import { SessionDetailCard } from '@/components/SessionDetailCard'
import { StatsPanel } from '@/components/StatsPanel'
import { StorageNotice } from '@/components/StorageNotice'
import { TimerPanel } from '@/components/TimerPanel'
import type { View } from '@/config/views'
import { useCountdown } from '@/hooks/useCountdown'
import { stageForElapsedMs } from '@/logic/growth'
import { elapsedMs } from '@/logic/timer'
import { playTone } from '@/logic/alarm'
import { sendNotification } from '@/logic/notifications'
import { buildHistory, selectedSessionIds } from '@/logic/history'
import { useStore } from '@/state/store'
import { speciesForFocusMin } from '@/config/species'
import { describeForestCountdown } from '@/logic/forest'
import { selectActiveForest } from '@/state/selectors'
import type { Forest, NewForestInput, NewSessionInput, Tree } from '@/state/types'

type ConfirmMode = 'abandon' | 'strictPause'

interface ConfirmRequest {
  id: string
  mode: ConfirmMode
}

function App() {
  const now = useCountdown()
  const active = useStore((state) => state.active)
  const trees = useStore((state) => state.trees)
  const sessions = useStore((state) => state.sessions)
  const plans = useStore((state) => state.plans)
  const forests = useStore((state) => state.forests)
  const activeForestId = useStore((state) => state.activeForestId)
  const display = useStore((state) => state.display)
  const pendingBreak = useStore((state) => state.pendingBreak)
  const startBreak = useStore((state) => state.startBreak)
  const startFocus = useStore((state) => state.startFocus)
  const startSession = useStore((state) => state.startSession)
  const continuePlan = useStore((state) => state.continuePlan)
  const abandon = useStore((state) => state.abandon)
  const createForest = useStore((state) => state.createForest)
  const updateForest = useStore((state) => state.updateForest)
  const selectForest = useStore((state) => state.selectForest)
  const [view, setView] = useState<View>('garden')
  const [confirmRequest, setConfirmRequest] = useState<ConfirmRequest | null>(null)
  const [forestDialogOpen, setForestDialogOpen] = useState(false)
  const [editingForest, setEditingForest] = useState<Forest | null>(null)
  const [sessionDialogOpen, setSessionDialogOpen] = useState(false)
  const [pendingSessionAfterForest, setPendingSessionAfterForest] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [selectedKey, setSelectedKey] = useState<string | null>(null)

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

    return { cell: active.cell, species: activeSpecies, stage: activeStage, sessionId: active.id }
  }, [active, activeSpecies, activeStage])

  const selectedEntry = useMemo(() => {
    if (!selectedKey || !activeForest) {
      return null
    }

    return (
      buildHistory(sessions, plans, trees, activeForest.id, 'all', now, active).find(
        (entry) => entry.key === selectedKey,
      ) ?? null
    )
  }, [selectedKey, activeForest, sessions, plans, trees, now, active])
  const selectedIds = useMemo(() => selectedSessionIds(selectedEntry), [selectedEntry])

  useEffect(() => {
    if (!selectedKey) {
      return
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !sessionDialogOpen && !forestDialogOpen) {
        setSelectedKey(null)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [selectedKey, sessionDialogOpen, forestDialogOpen])

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
    setPendingSessionAfterForest(false)
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
        if (pendingSessionAfterForest) {
          setPendingSessionAfterForest(false)
          setSessionDialogOpen(true)
        }
      }
      return created
    },
    [createForest, updateForest, pendingSessionAfterForest],
  )

  const handleSelectForest = useCallback(
    (id: string) => {
      selectForest(id)
      setView('garden')
      setSelectedKey(null)
    },
    [selectForest],
  )

  const handleOpenHistory = useCallback(
    (id: string) => {
      selectForest(id)
      setView('garden')
      setHistoryOpen(true)
      setSelectedKey(null)
    },
    [selectForest],
  )

  const openSessionDialog = useCallback(() => {
    if (!activeForest) {
      setPendingSessionAfterForest(true)
      setForestDialogOpen(true)
      return
    }

    setSelectedKey(null)
    setSessionDialogOpen(true)
  }, [activeForest])

  const closeSessionDialog = useCallback(() => setSessionDialogOpen(false), [])

  const handleStartSession = useCallback(
    (input: NewSessionInput) => {
      startSession(input, Date.now())
      setSelectedKey(null)
      setView('garden')
    },
    [startSession],
  )

  const handleContinueSession = useCallback(() => {
    continuePlan(Date.now())
    setSelectedKey(null)
    setView('garden')
  }, [continuePlan])

  const handleSelectTree = useCallback(
    (tree: Tree | null) => {
      if (!tree) {
        setSelectedKey(null)
        return
      }

      const record = sessions.find((session) => session.id === tree.sessionId)
      setSelectedKey(record ? (record.planId ?? record.id) : null)
    },
    [sessions],
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

  const scrollableView = !inSession && (view === 'forests' || view === 'stats')

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
            {display.showCountdown && countdown && <ForestCountdown countdown={countdown} />}
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
            onHistoryForest={handleOpenHistory}
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
                selectedSessionIds={selectedIds}
                selectionKey={active ? null : selectedKey}
                onSelectTree={active ? undefined : handleSelectTree}
              />
            </div>

            <div className="garden-left-rail relative z-10 mx-auto mt-4 flex w-full max-w-sm flex-col gap-3 px-4 min-[768px]:absolute min-[768px]:left-4 min-[768px]:top-4 min-[768px]:mt-0 min-[768px]:w-[clamp(200px,16vw,300px)] min-[768px]:px-0">
              {active?.kind === 'focus' && <SessionCard now={now} />}

              {!active && selectedEntry && activeForest && (
                <SessionDetailCard
                  entry={selectedEntry}
                  forestName={activeForest.name}
                  onClose={() => setSelectedKey(null)}
                />
              )}

              {historyOpen && activeForest && (
                <HistoryPanel
                  now={now}
                  selectedEntry={selectedEntry}
                  onSelectKey={setSelectedKey}
                  onClose={() => setHistoryOpen(false)}
                />
              )}
            </div>

            <div className="relative z-10 mx-auto mt-4 flex w-full max-w-md flex-col gap-3 px-4 min-[768px]:absolute min-[768px]:right-4 min-[768px]:top-4 min-[768px]:mt-0 min-[768px]:w-[clamp(350px,20vw,420px)] min-[768px]:px-0">
              <TimerPanel
                now={now}
                view={view}
                onChangeView={setView}
                onAbandonRequest={requestAbandon}
                onStrictPauseRequest={requestStrictPause}
                onStartSession={openSessionDialog}
                onContinueSession={handleContinueSession}
                historyOpen={historyOpen}
                onToggleHistory={() => setHistoryOpen((open) => !open)}
              />

              {active && selectedEntry && activeForest && (
                <SessionDetailCard
                  entry={selectedEntry}
                  forestName={activeForest.name}
                  onClose={() => setSelectedKey(null)}
                />
              )}
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
      <SessionCreateDialog
        open={sessionDialogOpen}
        forestName={activeForest?.name ?? 'Nuevo bosque'}
        onClose={closeSessionDialog}
        onStart={handleStartSession}
      />
    </div>
  )
}

export default App

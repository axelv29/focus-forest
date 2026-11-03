import { BREAK_MINUTES } from '@/config/timer'
import { useStore } from '@/state/store'

export function BreakPrompt() {
  const pending = useStore((state) => state.pendingBreak)
  const startBreak = useStore((state) => state.startBreak)
  const dismiss = useStore((state) => state.dismissBreak)

  if (!pending) {
    return null
  }

  return (
    <div className="fixed bottom-4 left-1/2 z-40 w-[min(92vw,34rem)] -translate-x-1/2">
      <div className="card flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="type-title">¿Un descanso de {BREAK_MINUTES} minutos?</p>
          <p className="type-body type-muted">El árbol ya quedó plantado.</p>
        </div>
        <div className="flex shrink-0 gap-2">
          <button type="button" className="btn btn-primary" onClick={() => startBreak(Date.now())}>
            Descansar
          </button>
          <button type="button" className="btn btn-secondary" onClick={dismiss}>
            Saltar
          </button>
        </div>
      </div>
    </div>
  )
}

import { useStorageStatus, type StorageIssue } from '@/state/storageStatus'

function messageFor(issue: StorageIssue): string {
  switch (issue.kind) {
    case 'corrupt':
      return 'El guardado del navegador estaba dañado. Guardamos una copia y empezamos de nuevo.'
    case 'future-version':
      return `El guardado es de una versión más nueva (v${issue.version}). Esta versión no lo modifica ni guarda cambios nuevos; actualizá la app para recuperarlo.`
    case 'unavailable':
      return 'No se pudo usar el guardado del navegador. La app sigue funcionando, pero el progreso no se va a conservar.'
  }
}

export function StorageNotice() {
  const issue = useStorageStatus((state) => state.issue)
  const dismiss = useStorageStatus((state) => state.dismiss)

  if (!issue) {
    return null
  }

  const dismissible = issue.kind === 'corrupt'
  const tone = issue.kind === 'corrupt' ? 'toast--info' : 'toast--warning'

  return (
    <div className="relative z-30 mx-auto w-full max-w-3xl px-4 pb-2">
      <div
        className={`card card--compact toast type-body flex items-start gap-3 ${tone}`}
        role="status"
        aria-live="polite"
      >
        <p className="flex-1">{messageFor(issue)}</p>
        {dismissible && (
          <button type="button" className="btn btn-secondary btn--sm shrink-0" onClick={dismiss}>
            Cerrar
          </button>
        )}
      </div>
    </div>
  )
}
